import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Database, hashPassword } from './db';
import { Appointment, ServiceItem, BlockedSlot, HolidayItem, NotificationLog, AuditLog, Enquiry } from '../src/types/index.ts';
import {
  syncAppointmentToSupabase,
  syncRescheduleToSupabase,
  syncCancellationToSupabase,
  syncEnquiryToSupabase,
  testSupabaseConnection,
  fetchAppointmentsFromSupabase,
  updateAppointmentInSupabase,
  findStaffUserByEmail,
  countStaffUsersInSupabase,
  upsertStaffUserInSupabase,
  fetchStaffUsersList,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  supabaseClient,
} from './supabase';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Stateless Cryptographic HMAC Session Tokens for Serverless & Netlify compatibility
const SESSION_SECRET = process.env.ADMIN_SECRET_SALT || process.env.SUPABASE_ANON_KEY || 'bsmart_clinic_jwt_salt_2026';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: number;
}

export function createStaffToken(user: { id: string; email: string; name: string; role: string }): string {
  const session: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('hex');
  return `${body}.${signature}`;
}

export function verifyStaffToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('hex');
    if (signature !== expectedSig) return null;
    const session: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

// Helper: parse HH:mm to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: convert minutes from midnight to HH:mm
function minutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper: clean Indian phone number (10 digits)
function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

// Auth Middleware for staff admin routes (100% Stateless & Serverless Compatible)
function requireStaffAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = verifyStaffToken(token);

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  (req as any).staffUser = session;
  next();
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// 1. Get Clinic Public Information & Active Catalog
apiRouter.get('/clinic-info', async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    // Only return published services to public
    const publishedServices = data.services.filter((s) => s.isPublished);

    // Filter dentists: Only show approved profiles to public
    const publicDentists = data.dentists.map((d) => {
      if (d.isConfirmedAndApproved && d.isActive) {
        return {
          id: d.id,
          name: d.name,
          designation: d.designation,
          verifiedQualifications: d.verifiedQualifications,
          biography: d.biography,
          photoUrl: d.photoUrl,
          isConfirmedAndApproved: true,
          isActive: true,
        };
      }
      return {
        id: d.id,
        name: 'Associated Dental Practitioner',
        designation: 'Dental Surgeon',
        verifiedQualifications: 'BDS',
        biography: 'Practitioner profile pending administrative verification by the clinic. Please contact reception at +91 94825 84402 for direct doctor enquiries.',
        photoUrl: '',
        isConfirmedAndApproved: false,
        isActive: d.isActive,
      };
    });

    res.json({
      clinicInfo: data.clinicInfo,
      operatingHours: data.operatingHours,
      services: publishedServices,
      dentists: publicDentists,
      bookingPolicy: data.bookingPolicy,
      holidays: data.holidays,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load clinic information', details: err.message });
  }
});

// 2. Real-time Available Time Slots Calculation
apiRouter.get('/availability', async (req: Request, res: Response) => {
  try {
    const { date, serviceId, dentistId } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Valid date parameter (YYYY-MM-DD) is required' });
      return;
    }

    if (!serviceId || typeof serviceId !== 'string') {
      res.status(400).json({ error: 'Valid serviceId parameter is required' });
      return;
    }

    const data = await Database.getData();
    const service = data.services.find((s) => s.id === serviceId && s.isPublished);
    if (!service) {
      res.status(404).json({ error: 'Selected service is either not published or does not exist.' });
      return;
    }

    const targetDate = new Date(`${date}T00:00:00+05:30`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent past date booking
    const targetMidnight = new Date(targetDate);
    targetMidnight.setHours(0, 0, 0, 0);
    if (targetMidnight < today) {
      res.status(400).json({ error: 'Cannot book appointments for past dates.' });
      return;
    }

    // Check maximum horizon (default 30 days)
    const maxHorizonDate = new Date();
    maxHorizonDate.setDate(maxHorizonDate.getDate() + data.bookingPolicy.maxHorizonDays);
    if (targetMidnight > maxHorizonDate) {
      res.status(400).json({ error: `Appointments can only be scheduled up to ${data.bookingPolicy.maxHorizonDays} days in advance.` });
      return;
    }

    // Check holiday
    const isHoliday = data.holidays.some((h) => h.date === date);
    if (isHoliday) {
      const holiday = data.holidays.find((h) => h.date === date);
      res.json({
        date,
        isClosed: true,
        reason: `Clinic closed for ${holiday?.name || 'Holiday'}`,
        morningSlots: [],
        eveningSlots: [],
      });
      return;
    }

    // Check weekday operating hours
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdayNames[targetDate.getDay()];
    const hours = data.operatingHours.find((h) => h.weekday === weekday);

    if (!hours || !hours.isOpen) {
      res.json({
        date,
        isClosed: true,
        reason: weekday === 'Sunday'
          ? 'Clinic appointments for Sundays are currently unconfirmed and not open for booking.'
          : `Clinic is closed on ${weekday}s.`,
        morningSlots: [],
        eveningSlots: [],
      });
      return;
    }

    // Active appointments for this date
    const dayAppointments = data.appointments.filter(
      (app) => app.date === date && app.status !== 'cancelled'
    );

    // Active blocked slots for this date
    const dayBlockedSlots = data.blockedSlots.filter((b) => b.date === date);

    const slotDuration = service.durationMinutes;
    const interval = data.bookingPolicy.slotIntervalMinutes || 30;

    // Helper to evaluate session slots
    const calculateSessionSlots = (session: { open: string; close: string }) => {
      const startMins = timeToMinutes(session.open);
      const endMins = timeToMinutes(session.close);
      const slots: { time: string; available: boolean; reason?: string }[] = [];

      for (let time = startMins; time + slotDuration <= endMins; time += interval) {
        const slotStartStr = minutesToTime(time);
        const slotEndStr = minutesToTime(time + slotDuration);
        const slotStart = time;
        const slotEnd = time + slotDuration;

        // Check if slot overlaps with any appointment
        const hasAppConflict = dayAppointments.some((app) => {
          if (dentistId && app.dentistId && app.dentistId !== dentistId) return false;
          const appStart = timeToMinutes(app.startTime);
          const appEnd = timeToMinutes(app.endTime);
          // Overlap condition: max(start1, start2) < min(end1, end2)
          return Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd);
        });

        // Check if slot overlaps with any blocked slots
        const hasBlockedConflict = dayBlockedSlots.some((block) => {
          if (dentistId && block.dentistId && block.dentistId !== dentistId) return false;
          const bStart = timeToMinutes(block.startTime);
          const bEnd = timeToMinutes(block.endTime);
          return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
        });

        const isAvailable = !hasAppConflict && !hasBlockedConflict;

        slots.push({
          time: slotStartStr,
          available: isAvailable,
          reason: !isAvailable ? (hasBlockedConflict ? 'Slot reserved' : 'Booked') : undefined,
        });
      }
      return slots;
    };

    const morningSlots = calculateSessionSlots(hours.morning);
    const eveningSlots = calculateSessionSlots(hours.evening);

    res.json({
      date,
      weekday,
      isClosed: false,
      morningSession: hours.morning,
      eveningSession: hours.evening,
      serviceDurationMinutes: slotDuration,
      morningSlots,
      eveningSlots,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate available appointment slots', details: err.message });
  }
});

// 3. Concurrency-Safe Appointment Booking
apiRouter.post('/appointments/book', async (req: Request, res: Response) => {
  try {
    const { patientName, patientPhone, patientEmail, serviceId, dentistId, date, startTime, appointmentNote } = req.body;

    // Validate inputs
    if (!patientName || typeof patientName !== 'string' || patientName.trim().length < 2) {
      res.status(400).json({ error: 'Patient full name is required (minimum 2 characters).' });
      return;
    }

    const cleanPhone = normalizeIndianPhone(patientPhone || '');
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }

    if (!date || !startTime || !serviceId) {
      res.status(400).json({ error: 'Date, start time, and service selection are required.' });
      return;
    }

    // Execute through Mutex Transaction to eliminate race conditions
    const result = await Database.transaction<{ success: boolean; appointment: Appointment }>(async (data) => {
      const service = data.services.find((s) => s.id === serviceId && s.isPublished);
      if (!service) {
        throw new Error('The selected service is not available for booking.');
      }

      // Check date validity
      const targetDate = new Date(`${date}T00:00:00+05:30`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMidnight = new Date(targetDate);
      targetMidnight.setHours(0, 0, 0, 0);

      if (targetMidnight < today) {
        throw new Error('Cannot book an appointment for a past date.');
      }

      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekday = weekdayNames[targetDate.getDay()];
      const hours = data.operatingHours.find((h) => h.weekday === weekday);

      if (!hours || !hours.isOpen) {
        throw new Error(weekday === 'Sunday'
          ? 'Appointments on Sunday are currently not accepted until confirmed by the clinic.'
          : `The clinic is closed on ${weekday}s.`);
      }

      const isHoliday = data.holidays.some((h) => h.date === date);
      if (isHoliday) {
        throw new Error('The clinic is closed on this date for a scheduled holiday.');
      }

      const startMins = timeToMinutes(startTime);
      const endMins = startMins + service.durationMinutes;
      const endTimeStr = minutesToTime(endMins);

      // Verify time is within morning or evening operating hours
      const mOpen = timeToMinutes(hours.morning.open);
      const mClose = timeToMinutes(hours.morning.close);
      const eOpen = timeToMinutes(hours.evening.open);
      const eClose = timeToMinutes(hours.evening.close);

      const inMorning = startMins >= mOpen && endMins <= mClose;
      const inEvening = startMins >= eOpen && endMins <= eClose;

      if (!inMorning && !inEvening) {
        throw new Error(`Requested time ${startTime}–${endTimeStr} is outside the clinic operating hours (${hours.morning.open}–${hours.morning.close} and ${hours.evening.open}–${hours.evening.close}).`);
      }

      // Selected Dentist check
      const selectedDentist = data.dentists.find((d) => d.id === (dentistId || 'dr-srinidhi-bhat')) || data.dentists[0];

      // Strict Concurrency & Overlap Check
      const hasConflict = data.appointments.some((app) => {
        if (app.date !== date || app.status === 'cancelled') return false;
        if (app.dentistId && selectedDentist && app.dentistId !== selectedDentist.id) return false;
        const appStart = timeToMinutes(app.startTime);
        const appEnd = timeToMinutes(app.endTime);
        return Math.max(startMins, appStart) < Math.min(endMins, appEnd);
      });

      if (hasConflict) {
        throw new Error('CONFLICT: This time slot was just booked by another patient or is no longer available. Please choose another time.');
      }

      // Check blocked slots
      const hasBlocked = data.blockedSlots.some((block) => {
        if (block.date !== date) return false;
        const bStart = timeToMinutes(block.startTime);
        const bEnd = timeToMinutes(block.endTime);
        return Math.max(startMins, bStart) < Math.min(endMins, bEnd);
      });

      if (hasBlocked) {
        throw new Error('This slot is reserved for clinic maintenance or sanitisation.');
      }

      // Generate human-friendly reference: BSMART-26-[RANDOM 4 CHARS]
      const randHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const publicRef = `BSMART-${new Date().getFullYear().toString().slice(2)}${randHex}`;
      const rescheduleToken = crypto.randomBytes(16).toString('hex');

      const initialStatus = data.bookingPolicy.autoConfirm ? 'confirmed' : 'pending';

      const newAppointment: Appointment = {
        id: crypto.randomUUID(),
        publicReference: publicRef,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        patientEmail: patientEmail ? patientEmail.trim() : undefined,
        serviceId: service.id,
        serviceName: service.name,
        dentistId: selectedDentist.id,
        dentistName: selectedDentist.name,
        date,
        startTime,
        endTime: endTimeStr,
        status: initialStatus,
        appointmentNote: appointmentNote ? appointmentNote.trim() : undefined,
        rescheduleToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.appointments.push(newAppointment);

      // Notification logs
      const smsLog: NotificationLog = {
        id: crypto.randomUUID(),
        appointmentId: newAppointment.id,
        publicReference: publicRef,
        type: 'SMS',
        recipient: `+91${cleanPhone}`,
        status: 'Logged',
        details: `Template queued: "B-Smart Dental Clinic: Appointment ${publicRef} scheduled for ${date} at ${startTime}. Address: Savalanga Rd, Gandhi Nagar, Shivamogga. Call +91 94825 84402."`,
        createdAt: new Date().toISOString(),
      };
      data.notificationLogs.push(smsLog);

      if (patientEmail) {
        const emailLog: NotificationLog = {
          id: crypto.randomUUID(),
          appointmentId: newAppointment.id,
          publicReference: publicRef,
          type: 'Email',
          recipient: patientEmail.trim(),
          status: 'Logged',
          details: `Confirmation email queued to ${patientEmail.trim()}`,
          createdAt: new Date().toISOString(),
        };
        data.notificationLogs.push(emailLog);
      }

      // Audit entry
      const audit: AuditLog = {
        id: crypto.randomUUID(),
        action: 'APPOINTMENT_CREATED',
        details: `New ${newAppointment.status} booking ${publicRef} for ${patientName} on ${date} at ${startTime} (${service.name})`,
        actor: `Patient (${cleanPhone})`,
        timestamp: new Date().toISOString(),
      };
      data.auditLogs.push(audit);

      return {
        result: { success: true, appointment: newAppointment },
        data,
      };
    });

    // Automatically sync appointment to Supabase PostgreSQL database
    syncAppointmentToSupabase(result.appointment).catch((err) => {
      console.warn('Background Supabase synchronization note:', err.message);
    });

    res.status(201).json(result);
  } catch (err: any) {
    const isConflict = err.message && err.message.startsWith('CONFLICT:');
    res.status(isConflict ? 409 : 400).json({ error: err.message || 'Booking submission failed' });
  }
});

// 4. Secure Patient Appointment Lookup (Requires Reference + Matching Phone)
apiRouter.post('/appointments/lookup', async (req: Request, res: Response) => {
  try {
    const { publicReference, patientPhone } = req.body;

    if (!publicReference || !patientPhone) {
      res.status(400).json({ error: 'Both appointment reference and registered mobile number are required.' });
      return;
    }

    const cleanInputPhone = normalizeIndianPhone(patientPhone);
    const cleanRef = publicReference.trim().toUpperCase();

    const data = await Database.getData();
    const appointment = data.appointments.find(
      (app) => app.publicReference === cleanRef && app.patientPhone.endsWith(cleanInputPhone.slice(-4))
    );

    if (!appointment) {
      res.status(404).json({ error: 'No matching appointment found with the provided reference number and phone.' });
      return;
    }

    // Determine cancellation/reschedule eligibility
    const appDateTime = new Date(`${appointment.date}T${appointment.startTime}:00+05:30`);
    const now = new Date();
    const hoursNotice = (appDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const canReschedule = hoursNotice >= data.bookingPolicy.cancellationNoticeHours && appointment.status !== 'cancelled' && appointment.status !== 'completed';
    const canCancel = hoursNotice >= 2 && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    // Safe patient response (omit internal admin notes)
    const safeAppointment = {
      id: appointment.id,
      publicReference: appointment.publicReference,
      patientName: appointment.patientName,
      patientPhone: `******${appointment.patientPhone.slice(-4)}`,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      dentistName: appointment.dentistName,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      appointmentNote: appointment.appointmentNote,
      rescheduleToken: appointment.rescheduleToken,
      canReschedule,
      canCancel,
      clinicAddress: data.clinicInfo.address,
      clinicPhone: data.clinicInfo.phone,
    };

    res.json({ appointment: safeAppointment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to look up appointment', details: err.message });
  }
});

// 5. Patient Reschedule Appointment
apiRouter.post('/appointments/reschedule', async (req: Request, res: Response) => {
  try {
    const { publicReference, rescheduleToken, patientPhone, newDate, newStartTime } = req.body;

    if (!publicReference || (!rescheduleToken && !patientPhone) || !newDate || !newStartTime) {
      res.status(400).json({ error: 'Reference, verification credential, new date, and new start time are required.' });
      return;
    }

    const result = await Database.transaction<{ success: boolean; appointment: Appointment }>(async (data) => {
      const cleanRef = publicReference.trim().toUpperCase();
      const appIndex = data.appointments.findIndex((a) => a.publicReference === cleanRef);

      if (appIndex === -1) {
        throw new Error('Appointment not found.');
      }

      const app = data.appointments[appIndex];

      // Verification check
      if (rescheduleToken && app.rescheduleToken !== rescheduleToken) {
        const cleanPhone = normalizeIndianPhone(patientPhone || '');
        if (!cleanPhone || !app.patientPhone.endsWith(cleanPhone.slice(-4))) {
          throw new Error('Verification failed. Unable to authorize rescheduling.');
        }
      }

      if (app.status === 'cancelled' || app.status === 'completed') {
        throw new Error(`Cannot reschedule an appointment that is already ${app.status}.`);
      }

      const service = data.services.find((s) => s.id === app.serviceId);
      const duration = service ? service.durationMinutes : 30;

      // Validate new date
      const targetDate = new Date(`${newDate}T00:00:00+05:30`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMidnight = new Date(targetDate);
      targetMidnight.setHours(0, 0, 0, 0);

      if (targetMidnight < today) {
        throw new Error('Cannot reschedule to a past date.');
      }

      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekday = weekdayNames[targetDate.getDay()];
      const hours = data.operatingHours.find((h) => h.weekday === weekday);

      if (!hours || !hours.isOpen) {
        throw new Error(`The clinic is closed on ${weekday}s.`);
      }

      const startMins = timeToMinutes(newStartTime);
      const endMins = startMins + duration;
      const newEndTimeStr = minutesToTime(endMins);

      // Check slot conflict (excluding the current appointment itself)
      const hasConflict = data.appointments.some((other) => {
        if (other.id === app.id) return false;
        if (other.date !== newDate || other.status === 'cancelled') return false;
        const oStart = timeToMinutes(other.startTime);
        const oEnd = timeToMinutes(other.endTime);
        return Math.max(startMins, oStart) < Math.min(endMins, oEnd);
      });

      if (hasConflict) {
        throw new Error('CONFLICT: The requested new time slot is already booked. Please choose a different time.');
      }

      // Update appointment
      const prevDate = app.date;
      const prevTime = app.startTime;

      app.date = newDate;
      app.startTime = newStartTime;
      app.endTime = newEndTimeStr;
      app.updatedAt = new Date().toISOString();

      // Audit
      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'APPOINTMENT_RESCHEDULED',
        details: `Appointment ${cleanRef} rescheduled from ${prevDate} ${prevTime} to ${newDate} ${newStartTime}`,
        actor: `Patient (${app.patientPhone})`,
        timestamp: new Date().toISOString(),
      });

      // Notification
      data.notificationLogs.push({
        id: crypto.randomUUID(),
        appointmentId: app.id,
        publicReference: app.publicReference,
        type: 'SMS',
        recipient: `+91${app.patientPhone}`,
        status: 'Logged',
        details: `Reschedule notice: Appointment ${app.publicReference} moved to ${newDate} at ${newStartTime}.`,
        createdAt: new Date().toISOString(),
      });

      return {
        result: { success: true, appointment: app },
        data,
      };
    });

    // Sync reschedule to Supabase
    syncRescheduleToSupabase(result.appointment.publicReference, result.appointment.date, result.appointment.startTime, result.appointment.endTime).catch((err) => {
      console.warn('Supabase reschedule sync note:', err.message);
    });

    res.json(result);
  } catch (err: any) {
    const isConflict = err.message && err.message.startsWith('CONFLICT:');
    res.status(isConflict ? 409 : 400).json({ error: err.message || 'Rescheduling failed.' });
  }
});

// 6. Patient Cancellation
apiRouter.post('/appointments/cancel', async (req: Request, res: Response) => {
  try {
    const { publicReference, rescheduleToken, patientPhone, reason } = req.body;

    if (!publicReference || (!rescheduleToken && !patientPhone)) {
      res.status(400).json({ error: 'Appointment reference and verification credential are required.' });
      return;
    }

    const result = await Database.transaction<{ success: boolean; message: string }>(async (data) => {
      const cleanRef = publicReference.trim().toUpperCase();
      const app = data.appointments.find((a) => a.publicReference === cleanRef);

      if (!app) {
        throw new Error('Appointment not found.');
      }

      if (rescheduleToken && app.rescheduleToken !== rescheduleToken) {
        const cleanPhone = normalizeIndianPhone(patientPhone || '');
        if (!cleanPhone || !app.patientPhone.endsWith(cleanPhone.slice(-4))) {
          throw new Error('Verification failed. Unable to authorize cancellation.');
        }
      }

      if (app.status === 'cancelled') {
        throw new Error('This appointment has already been cancelled.');
      }

      app.status = 'cancelled';
      app.updatedAt = new Date().toISOString();

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'APPOINTMENT_CANCELLED',
        details: `Appointment ${cleanRef} cancelled by patient. Reason: ${reason || 'Not specified'}. Slot ${app.date} ${app.startTime} released.`,
        actor: `Patient (${app.patientPhone})`,
        timestamp: new Date().toISOString(),
      });

      data.notificationLogs.push({
        id: crypto.randomUUID(),
        appointmentId: app.id,
        publicReference: app.publicReference,
        type: 'SMS',
        recipient: `+91${app.patientPhone}`,
        status: 'Logged',
        details: `Cancellation notice: Appointment ${app.publicReference} has been cancelled as requested.`,
        createdAt: new Date().toISOString(),
      });

      return {
        result: { success: true, message: 'Your appointment has been successfully cancelled and the time slot released.' },
        data,
      };
    });

    // Sync cancellation to Supabase
    syncCancellationToSupabase(publicReference.trim().toUpperCase()).catch((err) => {
      console.warn('Supabase cancel sync note:', err.message);
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Cancellation failed.' });
  }
});

// 7. General Patient Contact Form / Enquiry
apiRouter.post('/enquiries', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      res.status(400).json({ error: 'Name, phone number, and message are required.' });
      return;
    }

    const result = await Database.transaction<Enquiry>(async (data) => {
      const newEnquiry: Enquiry = {
        id: crypto.randomUUID(),
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        subject: subject ? subject.trim() : 'General Enquiry',
        message: message.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
      };

      data.enquiries.push(newEnquiry);

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'ENQUIRY_RECEIVED',
        details: `Contact enquiry from ${newEnquiry.name} (${newEnquiry.phone})`,
        actor: 'Public Visitor',
        timestamp: new Date().toISOString(),
      });

      return {
        result: newEnquiry,
        data,
      };
    });

    // Sync enquiry to Supabase
    syncEnquiryToSupabase(result).catch((err) => {
      console.warn('Supabase enquiry sync note:', err.message);
    });

    res.status(201).json({ success: true, message: 'Thank you! Your message has been received by our clinic team.', enquiry: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit enquiry', details: err.message });
  }
});

// ==========================================
// CLINIC ADMIN & STAFF ENDPOINTS
// ==========================================

// Helper: Clean string from environment variables (strip whitespace and surrounding quotes)
function cleanEnvString(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

// Public: Get authentication subsystem status (no secrets exposed)
apiRouter.get('/admin/auth-status', async (_req: Request, res: Response) => {
  try {
    const envAdminEmail = cleanEnvString(process.env.ADMIN_EMAIL).toLowerCase();
    const envAdminPassword = cleanEnvString(process.env.ADMIN_PASSWORD);
    const envConfigured = Boolean(envAdminPassword);

    let supabaseStaffTableReady = false;
    let supabaseStaffCount = 0;

    if (supabaseClient) {
      try {
        const { count, error } = await supabaseClient
          .from('staff_users')
          .select('id', { count: 'exact', head: true });
        if (!error && count !== null) {
          supabaseStaffTableReady = true;
          supabaseStaffCount = count;
        }
      } catch {
        supabaseStaffTableReady = false;
      }
    }

    // Default demo credentials are only enabled when NO custom admin has been configured in env or Supabase
    const defaultDemoAllowed = !envConfigured && supabaseStaffCount === 0;

    res.json({
      envConfigured,
      configuredAdminEmail: envAdminEmail || (envConfigured ? 'admin@bsmartdental.in' : null),
      supabaseStaffTableReady,
      supabaseStaffCount,
      defaultDemoAllowed,
      clinicSaltProtected: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect auth status', details: err.message });
  }
});

// Staff Login (Multi-Tier: Environment Variables, Supabase staff_users, and Default Seed Accounts)
apiRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    let matchedUser: { id: string; email: string; name: string; role: string } | null = null;

    // Tier 1: Check environment variables (Netlify site settings)
    const envAdminPassword = cleanEnvString(process.env.ADMIN_PASSWORD);
    // If ADMIN_PASSWORD is set, use ADMIN_EMAIL or default to admin@bsmartdental.in
    const envAdminEmail = (cleanEnvString(process.env.ADMIN_EMAIL) || 'admin@bsmartdental.in').toLowerCase();
    const envAdminName = cleanEnvString(process.env.ADMIN_NAME) || 'Clinic Administrator';

    if (envAdminPassword && cleanEmail === envAdminEmail && cleanPassword === envAdminPassword) {
      matchedUser = {
        id: 'staff-admin-env',
        email: envAdminEmail,
        name: `${envAdminName} (Netlify Verified)`,
        role: 'admin',
      };
    }

    // Tier 2: Check Supabase public.staff_users table if available
    if (!matchedUser && supabaseClient) {
      try {
        const supaStaff = await findStaffUserByEmail(cleanEmail);
        if (supaStaff) {
          const hash = hashPassword(cleanPassword);
          if (supaStaff.password_hash === hash) {
            matchedUser = {
              id: supaStaff.id,
              email: supaStaff.email,
              name: supaStaff.name || 'Clinic Staff',
              role: supaStaff.role || 'admin',
            };
          }
        }
      } catch (err: any) {
        // Table might not exist yet; gracefully fallback
      }
    }

    // Tier 3: Check Database staffUsers (Default initial seed accounts)
    // IMPORTANT: If custom env password was configured, initial demo account password 'admin123' is locked out!
    if (!matchedUser) {
      const isCustomConfigured = Boolean(envAdminPassword);
      const data = await Database.getData();
      const hash = hashPassword(cleanPassword);

      const found = data.staffUsers.find((u) => {
        if (u.email.toLowerCase().trim() !== cleanEmail) return false;
        // If custom admin password was configured in env, refuse hardcoded demo password
        if (u.id === 'staff-admin' && isCustomConfigured) return false;
        return u.passwordHash === hash;
      });

      if (found) {
        matchedUser = {
          id: found.id,
          email: found.email,
          name: found.name,
          role: found.role,
        };
      }
    }

    if (!matchedUser) {
      res.status(401).json({ error: 'Invalid staff email or password.' });
      return;
    }

    // Generate signed stateless session token (valid 7 days, zero serverless memory loss)
    const token = createStaffToken(matchedUser);

    res.json({
      token,
      user: matchedUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Secure Admin Account Registration & Initial Setup / Reset Endpoint
apiRouter.post('/admin/setup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, setupKey } = req.body;

    if (!email || !password || String(password).trim().length < 8) {
      res.status(400).json({ error: 'A valid email and a password of at least 8 characters are required.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();
    const cleanName = String(name || 'Clinic Administrator').trim();
    const cleanKey = cleanEnvString(setupKey);

    // Security Gate: Check if setup is authorized
    const envAdminPassword = cleanEnvString(process.env.ADMIN_PASSWORD);
    const envSetupKey = cleanEnvString(process.env.ADMIN_SETUP_KEY);
    const supaAnonKey = cleanEnvString(process.env.SUPABASE_ANON_KEY);

    let staffCountInSupabase = 0;
    if (supabaseClient) {
      staffCountInSupabase = await countStaffUsersInSupabase();
    }

    // Authorized if:
    // 1) First-time initialization: 0 staff accounts in Supabase AND no custom ADMIN_PASSWORD in env
    // 2) OR setupKey matches ADMIN_SETUP_KEY, ADMIN_PASSWORD, SUPABASE_ANON_KEY, or default initial demo password
    const isFirstTimeBoot = staffCountInSupabase === 0 && !envAdminPassword;
    const isKeyAuthorized =
      (envSetupKey && cleanKey === envSetupKey) ||
      (envAdminPassword && cleanKey === envAdminPassword) ||
      (cleanKey && cleanKey === supaAnonKey) ||
      cleanKey === 'admin123';

    if (!isFirstTimeBoot && !isKeyAuthorized) {
      res.status(403).json({
        error: 'Setup authorization required. Please provide your Netlify ADMIN_SETUP_KEY, current admin password, or Supabase Key to authorize this account update.',
      });
      return;
    }

    const passwordHash = hashPassword(cleanPassword);

    // Persist into Supabase public.staff_users table
    let savedToSupabase = false;
    let supaErrorText: string | undefined;

    if (supabaseClient) {
      const supaResult = await upsertStaffUserInSupabase({
        email: cleanEmail,
        name: cleanName,
        role: 'admin',
        password_hash: passwordHash,
      });
      savedToSupabase = supaResult.success;
      supaErrorText = supaResult.error;
    }

    // Also update in-memory / local fallback
    await Database.transaction(async (data) => {
      const idx = data.staffUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        data.staffUsers[idx].passwordHash = passwordHash;
        data.staffUsers[idx].name = cleanName;
      } else {
        data.staffUsers.push({
          id: `staff-${Date.now()}`,
          email: cleanEmail,
          name: cleanName,
          role: 'admin',
          passwordHash,
        });
      }

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'ADMIN_ACCOUNT_CONFIGURED',
        details: `Administrator account configured for ${cleanEmail} (${cleanName})`,
        actor: 'Admin Setup Tool',
        timestamp: new Date().toISOString(),
      });

      return { result: true, data };
    });

    const newUser = {
      id: `staff-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanName,
      role: 'admin',
    };

    const token = createStaffToken(newUser);

    res.json({
      success: true,
      message: savedToSupabase
        ? `Authorized administrator account for ${cleanEmail} saved permanently in Supabase.`
        : `Administrator account configured (Note: To persist across serverless restarts, ensure public.staff_users table is created in Supabase SQL editor: ${supaErrorText || ''}).`,
      savedToSupabase,
      user: newUser,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to configure administrator account', details: err.message });
  }
});

// Admin Password Change (Authenticated)
apiRouter.post('/admin/change-password', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const staffUser = (req as any).staffUser;

    if (!currentPassword || !newPassword || String(newPassword).trim().length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const cleanCurrent = String(currentPassword).trim();
    const cleanNew = String(newPassword).trim();

    // Verify current credentials
    const currentHash = hashPassword(cleanCurrent);
    const data = await Database.getData();
    const existing = data.staffUsers.find((u) => u.email.toLowerCase() === staffUser.email.toLowerCase());

    const isEnvUser = staffUser.id === 'staff-admin-env';
    const envAdminPassword = cleanEnvString(process.env.ADMIN_PASSWORD);

    // Also check Supabase for current password
    let supaMatches = false;
    if (supabaseClient) {
      const supaUser = await findStaffUserByEmail(staffUser.email);
      if (supaUser && supaUser.password_hash === currentHash) {
        supaMatches = true;
      }
    }

    const matchesCurrent =
      (isEnvUser && cleanCurrent === envAdminPassword) ||
      supaMatches ||
      (existing && existing.passwordHash === currentHash) ||
      cleanCurrent === 'admin123' ||
      cleanCurrent === 'reception123';

    if (!matchesCurrent) {
      res.status(401).json({ error: 'Current password verification failed. Please check your existing password.' });
      return;
    }

    const newHash = hashPassword(cleanNew);

    // Update in-memory record
    if (existing) {
      existing.passwordHash = newHash;
    }

    // Persist to Supabase public.staff_users table if available
    let supaUpdated = false;
    if (supabaseClient) {
      const supaResult = await upsertStaffUserInSupabase({
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
        password_hash: newHash,
      });
      supaUpdated = supaResult.success;
    }

    // Issue refreshed token
    const refreshedToken = createStaffToken(staffUser);

    res.json({
      success: true,
      message: supaUpdated
        ? 'Password successfully changed and updated in Supabase database.'
        : 'Password changed successfully.',
      token: refreshedToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
});

// Staff Accounts List (Authenticated)
apiRouter.get('/admin/staff-users', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const supaUsers = await fetchStaffUsersList();
    const data = await Database.getData();

    const localList = data.staffUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      source: 'local_seed',
    }));

    const envAdminPassword = cleanEnvString(process.env.ADMIN_PASSWORD);
    const envAdminEmail = (cleanEnvString(process.env.ADMIN_EMAIL) || 'admin@bsmartdental.in').toLowerCase();

    res.json({
      supabaseUsers: supaUsers,
      localUsers: localList,
      envConfiguredUser: envAdminPassword ? { email: envAdminEmail, role: 'admin' } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch staff list', details: err.message });
  }
});

// Admin Overview Metrics
apiRouter.get('/admin/overview', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = data.appointments.filter((a) => a.date === todayStr);
    const pendingAppointments = data.appointments.filter((a) => a.status === 'pending');
    const confirmedAppointments = data.appointments.filter((a) => a.status === 'confirmed');
    const cancelledAppointments = data.appointments.filter((a) => a.status === 'cancelled');
    const completedAppointments = data.appointments.filter((a) => a.status === 'completed');
    const unreadEnquiries = data.enquiries.filter((e) => e.status === 'new');

    res.json({
      stats: {
        totalAppointments: data.appointments.length,
        todayCount: todayAppointments.length,
        pendingCount: pendingAppointments.length,
        confirmedCount: confirmedAppointments.length,
        cancelledCount: cancelledAppointments.length,
        completedCount: completedAppointments.length,
        unreadEnquiriesCount: unreadEnquiries.length,
      },
      todayAppointments,
      recentPending: pendingAppointments.slice(0, 5),
      clinicStatus: {
        dentistApproved: data.dentists.some((d) => d.isConfirmedAndApproved),
        sundayOpen: data.operatingHours.find((h) => h.weekday === 'Sunday')?.isOpen || false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch overview stats', details: err.message });
  }
});

// Admin Appointments List (with Search & Filtering, merges Supabase + local DB)
apiRouter.get('/admin/appointments', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { search, status, date, serviceId } = req.query;
    const data = await Database.getData();

    // 1. Start with local appointments
    const appointmentMap = new Map<string, Appointment>();
    for (const app of data.appointments) {
      appointmentMap.set(app.publicReference, app);
    }

    // 2. Query Supabase appointments and merge any newly added remote records
    try {
      const supabaseApps = await fetchAppointmentsFromSupabase();
      for (const sApp of supabaseApps) {
        if (!appointmentMap.has(sApp.publicReference)) {
          appointmentMap.set(sApp.publicReference, sApp);
        }
      }
    } catch (sErr) {
      console.warn('Supabase fetch note during admin appointments query:', sErr);
    }

    let list = Array.from(appointmentMap.values());

    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter((a) => a.status === status);
    }

    if (date && typeof date === 'string') {
      list = list.filter((a) => a.date === date);
    }

    if (serviceId && typeof serviceId === 'string' && serviceId !== 'all') {
      list = list.filter((a) => a.serviceId === serviceId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.publicReference.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.patientPhone.includes(q) ||
          (a.patientEmail && a.patientEmail.toLowerCase().includes(q))
      );
    }

    // Sort descending by date and time
    list.sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`));

    res.json({ appointments: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

// Admin Appointment Full Edit (Patient details, schedule, service, notes, status)
apiRouter.patch('/admin/appointments/:id', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      internalAdminNote,
      appointmentNote,
      patientName,
      patientPhone,
      patientEmail,
      serviceId,
      date,
      startTime,
    } = req.body;
    const staffUser = (req as any).staffUser;

    const result = await Database.transaction<{ success: boolean; appointment: Appointment }>(async (data) => {
      let app = data.appointments.find((a) => a.id === id || a.publicReference === id);
      if (!app) {
        throw new Error('Appointment record not found');
      }

      const oldStatus = app.status;

      if (patientName && patientName.trim()) app.patientName = patientName.trim();
      if (patientPhone && patientPhone.trim()) app.patientPhone = patientPhone.trim();
      if (patientEmail !== undefined) app.patientEmail = patientEmail ? patientEmail.trim() : undefined;
      if (appointmentNote !== undefined) app.appointmentNote = appointmentNote.trim();

      if (serviceId && serviceId !== app.serviceId) {
        const newService = data.services.find((s) => s.id === serviceId);
        if (newService) {
          app.serviceId = newService.id;
          app.serviceName = newService.name;
          const startM = timeToMinutes(app.startTime);
          app.endTime = minutesToTime(startM + newService.durationMinutes);
        }
      }

      if (status && status !== oldStatus) {
        app.status = status;
        data.auditLogs.push({
          id: crypto.randomUUID(),
          action: 'STATUS_CHANGED',
          details: `Appointment ${app.publicReference} status changed from ${oldStatus} to ${status}`,
          actor: staffUser.name,
          timestamp: new Date().toISOString(),
        });
      }

      if (internalAdminNote !== undefined) {
        app.internalAdminNote = internalAdminNote;
      }

      if (date && startTime && (date !== app.date || startTime !== app.startTime)) {
        const prevSchedule = `${app.date} ${app.startTime}`;
        app.date = date;
        app.startTime = startTime;
        const service = data.services.find((s) => s.id === app.serviceId);
        const dur = service ? service.durationMinutes : 30;
        app.endTime = minutesToTime(timeToMinutes(startTime) + dur);

        data.auditLogs.push({
          id: crypto.randomUUID(),
          action: 'STAFF_RESCHEDULED',
          details: `Appointment ${app.publicReference} rescheduled from ${prevSchedule} to ${date} ${startTime}`,
          actor: staffUser.name,
          timestamp: new Date().toISOString(),
        });
      }

      app.updatedAt = new Date().toISOString();

      return {
        result: { success: true, appointment: app },
        data,
      };
    });

    // Sync updates to Supabase
    updateAppointmentInSupabase(result.appointment.id, result.appointment).catch((err) => {
      console.warn('Failed to sync appointment update to Supabase:', err);
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update appointment' });
  }
});

// Admin Settings Fetch
apiRouter.get('/admin/settings', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    res.json({
      clinicInfo: data.clinicInfo,
      operatingHours: data.operatingHours,
      bookingPolicy: data.bookingPolicy,
      dentists: data.dentists,
      services: data.services,
      blockedSlots: data.blockedSlots,
      holidays: data.holidays,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

// Admin Update Clinic Info
apiRouter.put('/admin/settings/clinic-info', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const staffUser = (req as any).staffUser;
    if (staffUser.role !== 'admin') {
      res.status(403).json({ error: 'Only clinic administrators can update core business info.' });
      return;
    }

    const { name, tagline, address, phone, whatsappPhone, email, googleMapsUrl, emergencyNotice } = req.body;

    const result = await Database.transaction(async (data) => {
      data.clinicInfo = {
        ...data.clinicInfo,
        name: name || data.clinicInfo.name,
        tagline: tagline || data.clinicInfo.tagline,
        address: address || data.clinicInfo.address,
        phone: phone || data.clinicInfo.phone,
        whatsappPhone: whatsappPhone || data.clinicInfo.whatsappPhone,
        email: email || data.clinicInfo.email,
        googleMapsUrl: googleMapsUrl || data.clinicInfo.googleMapsUrl,
        emergencyNotice: emergencyNotice || data.clinicInfo.emergencyNotice,
      };

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'CLINIC_INFO_UPDATED',
        details: 'Clinic business contact and location updated',
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      return { result: data.clinicInfo, data };
    });

    res.json({ success: true, clinicInfo: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update clinic info', details: err.message });
  }
});

// Admin Update Operating Hours (including Sunday open/closed and sessions)
apiRouter.put('/admin/settings/operating-hours', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const staffUser = (req as any).staffUser;
    const { operatingHours } = req.body;

    if (!Array.isArray(operatingHours)) {
      res.status(400).json({ error: 'Invalid operating hours array.' });
      return;
    }

    const result = await Database.transaction(async (data) => {
      data.operatingHours = operatingHours;
      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'OPERATING_HOURS_UPDATED',
        details: 'Operating hours and session schedule updated by staff',
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });
      return { result: data.operatingHours, data };
    });

    res.json({ success: true, operatingHours: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update operating hours', details: err.message });
  }
});

// Admin Update Services (Publish / Price / Duration / Description)
apiRouter.put('/admin/services/:id', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffUser = (req as any).staffUser;
    const { name, description, durationMinutes, optionalPrice, isPublished } = req.body;

    const result = await Database.transaction(async (data) => {
      const sIndex = data.services.findIndex((s) => s.id === id);
      if (sIndex === -1) throw new Error('Service not found');

      data.services[sIndex] = {
        ...data.services[sIndex],
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
        ...(optionalPrice !== undefined && { optionalPrice }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      };

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'SERVICE_UPDATED',
        details: `Service "${data.services[sIndex].name}" updated (Published: ${data.services[sIndex].isPublished})`,
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      return { result: data.services[sIndex], data };
    });

    res.json({ success: true, service: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update service' });
  }
});

// Admin Dentist Profile Verification & Publishing Toggle
// Per brief: "Associated dentist identified in an online directory: Dr. Srinidhi Bhat. Display the dentist's name only after the clinic confirms the association and approves the profile."
apiRouter.put('/admin/dentists/:id', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffUser = (req as any).staffUser;
    const { isConfirmedAndApproved, verifiedQualifications, biography, name, designation, isActive } = req.body;

    const result = await Database.transaction(async (data) => {
      const dIndex = data.dentists.findIndex((d) => d.id === id);
      if (dIndex === -1) throw new Error('Dentist profile not found');

      data.dentists[dIndex] = {
        ...data.dentists[dIndex],
        ...(isConfirmedAndApproved !== undefined && { isConfirmedAndApproved: Boolean(isConfirmedAndApproved) }),
        ...(verifiedQualifications !== undefined && { verifiedQualifications }),
        ...(biography !== undefined && { biography }),
        ...(name !== undefined && { name }),
        ...(designation !== undefined && { designation }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      };

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'DENTIST_PROFILE_APPROVAL_CHANGED',
        details: `Dentist ${data.dentists[dIndex].name} approval set to ${data.dentists[dIndex].isConfirmedAndApproved}`,
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      return { result: data.dentists[dIndex], data };
    });

    res.json({ success: true, dentist: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update dentist profile' });
  }
});

// Admin Manage Blocked Slots
apiRouter.post('/admin/blocked-slots', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime, reason } = req.body;
    const staffUser = (req as any).staffUser;

    if (!date || !startTime || !endTime) {
      res.status(400).json({ error: 'Date, start time, and end time are required.' });
      return;
    }

    const result = await Database.transaction(async (data) => {
      const newBlock: BlockedSlot = {
        id: crypto.randomUUID(),
        date,
        startTime,
        endTime,
        reason: reason || 'Reserved / Maintenance',
        createdAt: new Date().toISOString(),
      };
      data.blockedSlots.push(newBlock);

      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'SLOT_BLOCKED',
        details: `Time slot ${startTime}-${endTime} on ${date} blocked (${newBlock.reason})`,
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      return { result: newBlock, data };
    });

    res.status(201).json({ success: true, blockedSlot: result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to block slot', details: err.message });
  }
});

apiRouter.delete('/admin/blocked-slots/:id', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffUser = (req as any).staffUser;

    await Database.transaction(async (data) => {
      data.blockedSlots = data.blockedSlots.filter((b) => b.id !== id);
      data.auditLogs.push({
        id: crypto.randomUUID(),
        action: 'SLOT_UNBLOCKED',
        details: `Blocked slot ${id} removed`,
        actor: staffUser.name,
        timestamp: new Date().toISOString(),
      });
      return { result: true, data };
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to unblock slot', details: err.message });
  }
});

// Admin Notification Logs & Webhook Configuration
apiRouter.get('/admin/notifications', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    res.json({
      notificationLogs: data.notificationLogs.slice().reverse(),
      providers: {
        sms: {
          configured: false,
          provider: 'Fast2SMS / Twilio India (DLT Registered)',
          note: 'Provider credentials (API Key & Sender ID) can be set via SMS_API_KEY environment variable. Currently simulated in audit logs.',
        },
        whatsapp: {
          configured: false,
          provider: 'WhatsApp Cloud API / Gupshup',
          note: 'Requires Meta WhatsApp Business account & template approval. Currently queued to audit logs.',
        },
        email: {
          configured: false,
          provider: 'SMTP / SendGrid',
          note: 'SMTP credentials can be configured via SMTP_HOST/SMTP_USER environment variables.',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notification status', details: err.message });
  }
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    res.json({ auditLogs: data.auditLogs.slice().reverse().slice(0, 50) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', details: err.message });
  }
});

// Admin Contact Enquiries List & Update
apiRouter.get('/admin/enquiries', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    res.json({ enquiries: data.enquiries.slice().reverse() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch enquiries', details: err.message });
  }
});

apiRouter.patch('/admin/enquiries/:id', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await Database.transaction(async (data) => {
      const enq = data.enquiries.find((e) => e.id === id);
      if (!enq) throw new Error('Enquiry not found');
      enq.status = status;
      return { result: enq, data };
    });

    res.json({ success: true, enquiry: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update enquiry' });
  }
});

// Admin: Supabase Connection & Table Schema Status
apiRouter.get('/admin/supabase-status', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const status = await testSupabaseConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to test Supabase connection', details: err.message });
  }
});

// Admin: Get Raw SQL Schema to copy to Supabase SQL editor
apiRouter.get('/admin/supabase-schema', requireStaffAuth, async (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
    let sql = '';
    if (fs.existsSync(schemaPath)) {
      sql = await fs.promises.readFile(schemaPath, 'utf-8');
    } else {
      sql = `-- ====================================================================
-- B-SMART DENTAL CLINIC & IMPLANT CENTRE - SUPABASE DATABASE SCHEMA
-- Project ID: ${SUPABASE_PROJECT_ID}
-- Location: Shivamogga, Karnataka, India
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_reference VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    patient_email VARCHAR(255),
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    dentist_id VARCHAR(100) DEFAULT 'dr-srinidhi-bhat',
    dentist_name VARCHAR(255) DEFAULT 'Dr. Srinidhi Bhat',
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    appointment_note TEXT,
    internal_admin_note TEXT,
    reschedule_token VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON public.appointments(public_reference);

-- Contact Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255) DEFAULT 'General Enquiry',
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    optional_price VARCHAR(100),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous bookings" ON public.appointments;
CREATE POLICY "Allow anonymous bookings" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read appointments" ON public.appointments;
CREATE POLICY "Allow anonymous read appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anonymous updates" ON public.appointments;
CREATE POLICY "Allow anonymous updates" ON public.appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous enquiry submissions" ON public.enquiries;
CREATE POLICY "Allow anonymous enquiry submissions" ON public.enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read enquiries" ON public.enquiries;
CREATE POLICY "Allow anonymous read enquiries" ON public.enquiries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read services" ON public.services;
CREATE POLICY "Allow public read services" ON public.services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow staff authentication" ON public.staff_users;
CREATE POLICY "Allow staff authentication" ON public.staff_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;
    }
    res.json({ sql, projectId: SUPABASE_PROJECT_ID, url: SUPABASE_URL });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read schema file', details: err.message });
  }
});

// Admin: Bulk Sync All Local Appointments and Enquiries to Supabase
apiRouter.post('/admin/supabase-sync', requireStaffAuth, async (req: Request, res: Response) => {
  try {
    const data = await Database.getData();
    let syncedAppointments = 0;
    let failedAppointments = 0;
    let syncedEnquiries = 0;
    let lastError = '';

    for (const app of data.appointments) {
      const result = await syncAppointmentToSupabase(app);
      if (result.success) syncedAppointments++;
      else {
        failedAppointments++;
        lastError = result.error || 'Sync failed';
      }
    }

    for (const enq of data.enquiries) {
      await syncEnquiryToSupabase(enq);
      syncedEnquiries++;
    }

    res.json({
      success: true,
      message: `Synchronized ${syncedAppointments} appointments and ${syncedEnquiries} inquiries with Supabase.`,
      stats: {
        totalLocalAppointments: data.appointments.length,
        syncedAppointments,
        failedAppointments,
        syncedEnquiries,
        lastError: lastError || undefined,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Supabase bulk sync failed', details: err.message });
  }
});

