import {
  ClinicInfo,
  DayOperatingHours,
  DentistProfile,
  ServiceItem,
  Appointment,
  BlockedSlot,
  HolidayItem,
  BookingPolicy,
  NotificationLog,
  AuditLog,
  Enquiry,
} from '../types';

const BASE_URL = '/api';

function getStaffToken(): string | null {
  return localStorage.getItem('bsmart_staff_token');
}

export function setStaffToken(token: string): void {
  localStorage.setItem('bsmart_staff_token', token);
}

export function removeStaffToken(): void {
  localStorage.removeItem('bsmart_staff_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStaffToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const clinicApi = {
  // Public
  getClinicInfo: () =>
    request<{
      clinicInfo: ClinicInfo;
      operatingHours: DayOperatingHours[];
      services: ServiceItem[];
      dentists: DentistProfile[];
      bookingPolicy: BookingPolicy;
      holidays: HolidayItem[];
    }>('/clinic-info'),

  getAvailability: (date: string, serviceId: string, dentistId?: string) => {
    const params = new URLSearchParams({ date, serviceId });
    if (dentistId) params.append('dentistId', dentistId);
    return request<{
      date: string;
      weekday: string;
      isClosed: boolean;
      reason?: string;
      morningSession?: { open: string; close: string };
      eveningSession?: { open: string; close: string };
      serviceDurationMinutes: number;
      morningSlots: { time: string; available: boolean; reason?: string }[];
      eveningSlots: { time: string; available: boolean; reason?: string }[];
    }>(`/availability?${params.toString()}`);
  },

  bookAppointment: (payload: {
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    serviceId: string;
    dentistId?: string;
    date: string;
    startTime: string;
    appointmentNote?: string;
  }) =>
    request<{ success: boolean; appointment: Appointment }>('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  lookupAppointment: (publicReference: string, patientPhone: string) =>
    request<{ appointment: Appointment & { canReschedule: boolean; canCancel: boolean; clinicAddress: string; clinicPhone: string } }>(
      '/appointments/lookup',
      {
        method: 'POST',
        body: JSON.stringify({ publicReference, patientPhone }),
      }
    ),

  rescheduleAppointment: (payload: {
    publicReference: string;
    rescheduleToken?: string;
    patientPhone?: string;
    newDate: string;
    newStartTime: string;
  }) =>
    request<{ success: boolean; appointment: Appointment }>('/appointments/reschedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelAppointment: (payload: {
    publicReference: string;
    rescheduleToken?: string;
    patientPhone?: string;
    reason?: string;
  }) =>
    request<{ success: boolean; message: string }>('/appointments/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitEnquiry: (payload: { name: string; phone: string; email?: string; subject?: string; message: string }) =>
    request<{ success: boolean; message: string; enquiry: Enquiry }>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Staff / Admin
  adminLogin: (email: string, password: string) =>
    request<{
      token: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getAdminOverview: () =>
    request<{
      stats: {
        totalAppointments: number;
        todayCount: number;
        pendingCount: number;
        confirmedCount: number;
        cancelledCount: number;
        completedCount: number;
        unreadEnquiriesCount: number;
      };
      todayAppointments: Appointment[];
      recentPending: Appointment[];
      clinicStatus: { dentistApproved: boolean; sundayOpen: boolean };
    }>('/admin/overview'),

  getAdminAppointments: (params: { search?: string; status?: string; date?: string; serviceId?: string }) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.serviceId) query.append('serviceId', params.serviceId);
    return request<{ appointments: Appointment[] }>(`/admin/appointments?${query.toString()}`);
  },

  updateAppointment: (id: string, updates: Partial<Appointment>) =>
    request<{ success: boolean; appointment: Appointment }>(`/admin/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  updateAppointmentStatus: (id: string, updates: { status?: string; internalAdminNote?: string; date?: string; startTime?: string }) =>
    request<{ success: boolean; appointment: Appointment }>(`/admin/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getAdminSettings: () =>
    request<{
      clinicInfo: ClinicInfo;
      operatingHours: DayOperatingHours[];
      bookingPolicy: BookingPolicy;
      dentists: DentistProfile[];
      services: ServiceItem[];
      blockedSlots: BlockedSlot[];
      holidays: HolidayItem[];
    }>('/admin/settings'),

  updateClinicInfo: (clinicInfo: Partial<ClinicInfo>) =>
    request<{ success: boolean; clinicInfo: ClinicInfo }>('/admin/settings/clinic-info', {
      method: 'PUT',
      body: JSON.stringify(clinicInfo),
    }),

  updateOperatingHours: (operatingHours: DayOperatingHours[]) =>
    request<{ success: boolean; operatingHours: DayOperatingHours[] }>('/admin/settings/operating-hours', {
      method: 'PUT',
      body: JSON.stringify({ operatingHours }),
    }),

  updateService: (id: string, updates: Partial<ServiceItem>) =>
    request<{ success: boolean; service: ServiceItem }>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  updateDentist: (id: string, updates: Partial<DentistProfile>) =>
    request<{ success: boolean; dentist: DentistProfile }>(`/admin/dentists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  addBlockedSlot: (slot: { date: string; startTime: string; endTime: string; reason?: string }) =>
    request<{ success: boolean; blockedSlot: BlockedSlot }>('/admin/blocked-slots', {
      method: 'POST',
      body: JSON.stringify(slot),
    }),

  deleteBlockedSlot: (id: string) =>
    request<{ success: boolean }>(`/admin/blocked-slots/${id}`, {
      method: 'DELETE',
    }),

  getNotifications: () =>
    request<{
      notificationLogs: NotificationLog[];
      providers: Record<string, { configured: boolean; provider: string; note: string }>;
    }>('/admin/notifications'),

  getAuditLogs: () =>
    request<{ auditLogs: AuditLog[] }>('/admin/audit-logs'),

  getEnquiries: () =>
    request<{ enquiries: Enquiry[] }>('/admin/enquiries'),

  updateEnquiryStatus: (id: string, status: 'read' | 'contacted') =>
    request<{ success: boolean; enquiry: Enquiry }>(`/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getSupabaseStatus: () =>
    request<{
      connected: boolean;
      projectUrl: string;
      projectId: string;
      tablesFound: { appointments: boolean; enquiries: boolean; services: boolean };
      error?: string;
      instructionsNeeded?: boolean;
    }>('/admin/supabase-status'),

  getSupabaseSchema: () =>
    request<{ sql: string; projectId: string; url: string }>('/admin/supabase-schema'),

  syncAllToSupabase: () =>
    request<{
      success: boolean;
      message: string;
      stats: {
        totalLocalAppointments: number;
        syncedAppointments: number;
        failedAppointments: number;
        syncedEnquiries: number;
        lastError?: string;
      };
    }>('/admin/supabase-sync', {
      method: 'POST',
    }),
};
