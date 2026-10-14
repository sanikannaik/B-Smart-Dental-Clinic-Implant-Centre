export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  optionalPrice: string; // e.g. "₹300 (Consultation)" or "Contact clinic for pricing"
  isPublished: boolean;
  category: 'general' | 'implants' | 'restorative' | 'preventive' | 'cosmetic' | 'surgical';
}

export interface DentistProfile {
  id: string;
  name: string;
  designation: string;
  verifiedQualifications: string;
  biography: string;
  photoUrl?: string;
  isConfirmedAndApproved: boolean; // Must be approved by clinic before public display
  isActive: boolean;
}

export interface DayOperatingHours {
  weekday: string; // Monday, Tuesday, ... Sunday
  isOpen: boolean;
  morning: {
    open: string;  // e.g. "10:30"
    close: string; // e.g. "13:00"
  };
  evening: {
    open: string;  // e.g. "17:00"
    close: string; // e.g. "22:00"
  };
}

export interface BlockedSlot {
  id: string;
  dentistId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
  createdAt: string;
}

export interface HolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
}

export interface Appointment {
  id: string;
  publicReference: string; // e.g. BSMART-26A8-8F
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  serviceId: string;
  serviceName?: string;
  dentistId: string;
  dentistName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  appointmentNote?: string;
  internalAdminNote?: string;
  rescheduleToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicInfo {
  name: string;
  tagline: string;
  category: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  googleMapsUrl: string;
  timezone: string;
  currency: string;
  emergencyNotice: string;
}

export interface BookingPolicy {
  minNoticeHours: number;
  maxHorizonDays: number;
  slotIntervalMinutes: number;
  cancellationNoticeHours: number;
  autoConfirm: boolean;
}

export interface NotificationLog {
  id: string;
  appointmentId: string;
  publicReference: string;
  type: 'SMS' | 'Email' | 'WhatsApp';
  recipient: string;
  status: 'Sent' | 'Provider Not Configured' | 'Logged';
  details: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  actor: string;
  timestamp: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'contacted';
  createdAt: string;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'receptionist' | 'dentist';
}
