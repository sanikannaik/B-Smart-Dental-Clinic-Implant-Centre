import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, Enquiry } from '../src/types/index.ts';

export const SUPABASE_PROJECT_ID = 'huiuqhqzglbrzzlbcheb';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable__PrFR4_Hfci44oRfhUZDvw_dJ8145bz';

export let supabaseClient: SupabaseClient | null = null;

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  console.log(`Supabase Client initialized for project ${SUPABASE_PROJECT_ID} at ${SUPABASE_URL}`);
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
}

// Test connection and schema status
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  projectUrl: string;
  projectId: string;
  tablesFound: {
    appointments: boolean;
    enquiries: boolean;
    services: boolean;
  };
  error?: string;
  instructionsNeeded?: boolean;
}> {
  if (!supabaseClient) {
    return {
      connected: false,
      projectUrl: SUPABASE_URL,
      projectId: SUPABASE_PROJECT_ID,
      tablesFound: { appointments: false, enquiries: false, services: false },
      error: 'Supabase client not initialized.',
      instructionsNeeded: true,
    };
  }

  const tablesFound = {
    appointments: false,
    enquiries: false,
    services: false,
  };

  let generalError: string | undefined = undefined;
  let instructionsNeeded = false;

  try {
    const { error: appErr } = await supabaseClient.from('appointments').select('id').limit(1);
    if (!appErr) {
      tablesFound.appointments = true;
    } else if (appErr.message.includes('schema cache') || appErr.code === 'PGRST205') {
      instructionsNeeded = true;
      generalError = "The table 'appointments' does not exist in your Supabase project yet. Please run the provided SQL script in your Supabase SQL Editor.";
    } else {
      generalError = appErr.message;
    }

    const { error: enqErr } = await supabaseClient.from('enquiries').select('id').limit(1);
    if (!enqErr) {
      tablesFound.enquiries = true;
    }

    const { error: srvErr } = await supabaseClient.from('services').select('id').limit(1);
    if (!srvErr) {
      tablesFound.services = true;
    }

    return {
      connected: true,
      projectUrl: SUPABASE_URL,
      projectId: SUPABASE_PROJECT_ID,
      tablesFound,
      error: generalError,
      instructionsNeeded,
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: SUPABASE_URL,
      projectId: SUPABASE_PROJECT_ID,
      tablesFound,
      error: err.message,
      instructionsNeeded: true,
    };
  }
}

// Automatically sync newly booked appointment to Supabase
export async function syncAppointmentToSupabase(appointment: Appointment): Promise<{ success: boolean; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const row = {
      id: appointment.id,
      public_reference: appointment.publicReference,
      patient_name: appointment.patientName,
      patient_phone: appointment.patientPhone,
      patient_email: appointment.patientEmail || null,
      service_id: appointment.serviceId,
      service_name: appointment.serviceName || 'Dental Consultation',
      dentist_id: appointment.dentistId || 'dr-srinidhi-bhat',
      dentist_name: appointment.dentistName || 'Dr. Srinidhi Bhat',
      date: appointment.date,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      status: appointment.status,
      appointment_note: appointment.appointmentNote || null,
      internal_admin_note: appointment.internalAdminNote || null,
      reschedule_token: appointment.rescheduleToken,
      created_at: appointment.createdAt,
      updated_at: appointment.updatedAt,
    };

    const { error } = await supabaseClient
      .from('appointments')
      .upsert(row, { onConflict: 'public_reference' });

    if (error) {
      console.warn(`Supabase sync warning for appointment ${appointment.publicReference}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`Successfully synced appointment ${appointment.publicReference} to Supabase table 'appointments'`);
    return { success: true };
  } catch (err: any) {
    console.error('Error inserting appointment into Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Sync reschedule
export async function syncRescheduleToSupabase(
  publicReference: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<void> {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient
      .from('appointments')
      .update({
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        updated_at: new Date().toISOString(),
      })
      .eq('public_reference', publicReference);

    if (error) {
      console.warn(`Supabase reschedule update error for ${publicReference}:`, error.message);
    } else {
      console.log(`Updated rescheduled appointment ${publicReference} in Supabase`);
    }
  } catch (err) {
    console.error('Failed to sync reschedule to Supabase:', err);
  }
}

// Sync cancellation
export async function syncCancellationToSupabase(publicReference: string): Promise<void> {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('public_reference', publicReference);

    if (error) {
      console.warn(`Supabase cancel update error for ${publicReference}:`, error.message);
    } else {
      console.log(`Updated cancelled appointment ${publicReference} in Supabase`);
    }
  } catch (err) {
    console.error('Failed to sync cancellation to Supabase:', err);
  }
}

// Sync enquiry
export async function syncEnquiryToSupabase(enquiry: Enquiry): Promise<void> {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('enquiries').insert({
      id: enquiry.id,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email || null,
      subject: enquiry.subject,
      message: enquiry.message,
      status: enquiry.status,
      created_at: enquiry.createdAt,
    });
    if (error) {
      console.warn('Supabase enquiry insert warning:', error.message);
    } else {
      console.log(`Synced enquiry from ${enquiry.name} to Supabase table 'enquiries'`);
    }
  } catch (err) {
    console.error('Failed to sync enquiry to Supabase:', err);
  }
}

// Fetch all appointments directly from Supabase
export async function fetchAppointmentsFromSupabase(): Promise<Appointment[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      publicReference: row.public_reference,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      patientEmail: row.patient_email || undefined,
      serviceId: row.service_id,
      serviceName: row.service_name,
      dentistId: row.dentist_id || 'dr-srinidhi-bhat',
      dentistName: row.dentist_name || 'Dr. Srinidhi Bhat',
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      appointmentNote: row.appointment_note || undefined,
      internalAdminNote: row.internal_admin_note || undefined,
      rescheduleToken: row.reschedule_token || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('Supabase query note:', err);
    return [];
  }
}

// Update appointment in Supabase
export async function updateAppointmentInSupabase(
  id: string,
  updates: Partial<Appointment>
): Promise<void> {
  if (!supabaseClient) return;
  try {
    const rowUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.patientName !== undefined) rowUpdates.patient_name = updates.patientName;
    if (updates.patientPhone !== undefined) rowUpdates.patient_phone = updates.patientPhone;
    if (updates.patientEmail !== undefined) rowUpdates.patient_email = updates.patientEmail;
    if (updates.serviceId !== undefined) rowUpdates.service_id = updates.serviceId;
    if (updates.serviceName !== undefined) rowUpdates.service_name = updates.serviceName;
    if (updates.date !== undefined) rowUpdates.date = updates.date;
    if (updates.startTime !== undefined) rowUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) rowUpdates.end_time = updates.endTime;
    if (updates.status !== undefined) rowUpdates.status = updates.status;
    if (updates.appointmentNote !== undefined) rowUpdates.appointment_note = updates.appointmentNote;
    if (updates.internalAdminNote !== undefined) rowUpdates.internal_admin_note = updates.internalAdminNote;

    await supabaseClient
      .from('appointments')
      .update(rowUpdates)
      .eq('id', id);
  } catch (err) {
    console.warn('Failed to update appointment in Supabase:', err);
  }
}

