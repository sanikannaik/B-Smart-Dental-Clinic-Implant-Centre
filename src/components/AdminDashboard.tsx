import React, { useState, useEffect } from 'react';
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
import { clinicApi, setStaffToken, removeStaffToken } from '../services/api';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  BriefcaseMedical,
  UserCheck,
  Building,
  BellRing,
  ScrollText,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  X,
  Database,
  Copy,
  Check,
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onRefreshPublicData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onRefreshPublicData }) => {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('bsmart_staff_token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('admin@bsmartdental.in');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'availability' | 'services' | 'dentist' | 'clinic_info' | 'notifications' | 'enquiries' | 'supabase'>('overview');

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseSql, setSupabaseSql] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Data states
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<{
    clinicInfo: ClinicInfo;
    operatingHours: DayOperatingHours[];
    bookingPolicy: BookingPolicy;
    dentists: DentistProfile[];
    services: ServiceItem[];
    blockedSlots: BlockedSlot[];
    holidays: HolidayItem[];
  } | null>(null);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [notificationProviders, setNotificationProviders] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editing State Modals
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [internalNoteText, setInternalNoteText] = useState('');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Add Blocked Slot Form
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('13:00');
  const [newBlockEnd, setNewBlockEnd] = useState('17:00');
  const [newBlockReason, setNewBlockReason] = useState('Sanitization & Rest Break');

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await clinicApi.adminLogin(loginEmail, loginPassword);
      setStaffToken(res.token);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    removeStaffToken();
    setAuthToken(null);
    setCurrentUser(null);
  };

  // Load Dashboard Data
  const loadAdminData = async () => {
    try {
      const [overview, apps, sett, notifs, enqs, audits] = await Promise.all([
        clinicApi.getAdminOverview(),
        clinicApi.getAdminAppointments({}),
        clinicApi.getAdminSettings(),
        clinicApi.getNotifications(),
        clinicApi.getEnquiries(),
        clinicApi.getAuditLogs(),
      ]);

      setOverviewStats(overview);
      setAppointments(apps.appointments);
      setSettings(sett);
      setNotificationLogs(notifs.notificationLogs);
      setNotificationProviders(notifs.providers);
      setEnquiries(enqs.enquiries);
      setAuditLogs(audits.auditLogs);
      loadSupabaseStatus();
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.message.includes('401') || err.message.includes('expired')) {
        handleLogout();
      }
    }
  };

  const loadSupabaseStatus = async () => {
    try {
      const [st, sc] = await Promise.all([
        clinicApi.getSupabaseStatus(),
        clinicApi.getSupabaseSchema(),
      ]);
      setSupabaseStatus(st);
      setSupabaseSql(sc.sql);
    } catch (err: any) {
      console.warn('Could not query Supabase status:', err.message);
    }
  };

  const handleSyncAllToSupabase = async () => {
    setSyncingSupabase(true);
    setSyncResult(null);
    try {
      const res = await clinicApi.syncAllToSupabase();
      setSyncResult(res);
      await loadSupabaseStatus();
      setStatusMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
      setStatusMessage({ type: 'error', text: err.message || 'Supabase sync failed.' });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const copySqlToClipboard = () => {
    if (!supabaseSql) return;
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  useEffect(() => {
    if (authToken) {
      loadAdminData();
    }
  }, [authToken]);

  // Appointment Status Updater
  const handleUpdateStatus = async (appId: string, status: string) => {
    setLoadingAction(true);
    setStatusMessage(null);
    try {
      const res = await clinicApi.updateAppointmentStatus(appId, { status });
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Appointment ${res.appointment.publicReference} marked as ${status}.` });
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Status update failed.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Save Internal Admin Note
  const handleSaveInternalNote = async () => {
    if (!editingAppointment) return;
    setLoadingAction(true);
    try {
      const res = await clinicApi.updateAppointmentStatus(editingAppointment.id, {
        internalAdminNote: internalNoteText,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Internal administrative note saved.' });
        setEditingAppointment(null);
        loadAdminData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save internal note.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle Dentist Profile Approval (Dr. Srinidhi Bhat)
  const handleToggleDentistApproval = async () => {
    if (!settings || !settings.dentists[0]) return;
    const currentDentist = settings.dentists[0];
    const newApprovalState = !currentDentist.isConfirmedAndApproved;

    setLoadingAction(true);
    try {
      const res = await clinicApi.updateDentist(currentDentist.id, {
        isConfirmedAndApproved: newApprovalState,
      });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: newApprovalState
            ? 'Dr. Srinidhi Bhat profile approved & verified. Now visible to the public.'
            : 'Dentist profile set to unconfirmed. Website now displays verification pending notice.',
        });
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update approval.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle Sunday Operating Hours
  const handleToggleSunday = async () => {
    if (!settings) return;
    const updated = settings.operatingHours.map((h) => {
      if (h.weekday === 'Sunday') {
        return { ...h, isOpen: !h.isOpen };
      }
      return h;
    });

    setLoadingAction(true);
    try {
      const res = await clinicApi.updateOperatingHours(updated);
      if (res.success) {
        const sundayState = updated.find((h) => h.weekday === 'Sunday')?.isOpen;
        setStatusMessage({
          type: 'success',
          text: `Sunday appointments are now ${sundayState ? 'OPEN for online booking' : 'CLOSED / UNCONFIRMED'}.`,
        });
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update hours.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Add Blocked Slot
  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate || !newBlockStart || !newBlockEnd) return;

    setLoadingAction(true);
    try {
      const res = await clinicApi.addBlockedSlot({
        date: newBlockDate,
        startTime: newBlockStart,
        endTime: newBlockEnd,
        reason: newBlockReason,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Time slot ${newBlockStart}-${newBlockEnd} on ${newBlockDate} blocked.` });
        setNewBlockDate('');
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to block slot.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove Blocked Slot
  const handleDeleteBlockedSlot = async (id: string) => {
    setLoadingAction(true);
    try {
      await clinicApi.deleteBlockedSlot(id);
      setStatusMessage({ type: 'success', text: 'Blocked slot removed.' });
      loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to unblock slot.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Save Service Changes (Publish/Unpublish, Price, Duration)
  const handleSaveService = async (service: ServiceItem) => {
    setLoadingAction(true);
    try {
      const res = await clinicApi.updateService(service.id, {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        optionalPrice: service.optionalPrice,
        isPublished: service.isPublished,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Service "${res.service.name}" updated successfully.` });
        setEditingService(null);
        loadAdminData();
        onRefreshPublicData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update service.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.publicReference.toLowerCase().includes(q) ||
        app.patientName.toLowerCase().includes(q) ||
        app.patientPhone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full my-4 shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col h-[94vh]">
        {/* Top Staff Bar */}
        <div className="bg-[#123E46] text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-teal-800 text-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">B-Smart Clinic Administration</h2>
                <span className="text-[10px] font-semibold bg-teal-900 text-teal-300 px-2 py-0.5 rounded border border-teal-700">
                  Staff Secure Portal
                </span>
              </div>
              <p className="text-xs text-teal-200/80">Shivamogga Dental & Implant Practice</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-teal-100">
                <span>{currentUser.name}</span>
                <span className="capitalize px-1.5 py-0.5 rounded bg-teal-900 text-[10px] font-mono">
                  {currentUser.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center gap-1 text-teal-300 hover:text-white transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close admin dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800">
              ✕
            </button>
          </div>
        )}

        {/* LOGIN SCREEN IF UNAUTHENTICATED */}
        {!authToken ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#F7FAFC]">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#E8F5F1] text-[#123E46] flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-[#287A9B]" />
                </div>
                <h3 className="text-xl font-bold text-[#123E46]">Staff Authorization</h3>
                <p className="text-xs text-[#64748B]">
                  Access restricted to authorized clinic staff and dentists.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Staff Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748B] space-y-1">
                  <span className="font-semibold text-slate-700 block">Default Initial Credentials:</span>
                  <p>• Administrator: <code>admin@bsmartdental.in</code> / <code>admin123</code></p>
                  <p>• Front Desk Reception: <code>reception@bsmartdental.in</code> / <code>reception123</code></p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-teal-300" />
                  <span>{loginLoading ? 'Authenticating...' : 'Sign In to Clinic Console'}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED STAFF WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <aside className="w-full md:w-60 bg-[#F7FAFC] border-b md:border-b-0 md:border-r border-[#E2E8F0] p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'overview' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview & KPIs</span>
              </button>

              <button
                onClick={() => setActiveTab('appointments')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'appointments' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>Appointments</span>
                </div>
                {overviewStats?.stats?.pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {overviewStats.stats.pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('availability')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'availability' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Hours & Blocked Slots</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'services' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <BriefcaseMedical className="w-4 h-4" />
                <span>Service Catalogue</span>
              </button>

              <button
                onClick={() => setActiveTab('dentist')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'dentist' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Dentist Verification</span>
              </button>

              <button
                onClick={() => setActiveTab('clinic_info')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'clinic_info' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Clinic Business Info</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'notifications' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <BellRing className="w-4 h-4" />
                <span>SMS & Notifications</span>
              </button>

              <button
                onClick={() => setActiveTab('enquiries')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'enquiries' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4" />
                  <span>Patient Enquiries</span>
                </div>
                {enquiries.filter((e) => e.status === 'new').length > 0 && (
                  <span className="bg-[#287A9B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {enquiries.filter((e) => e.status === 'new').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('supabase');
                  loadSupabaseStatus();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === 'supabase' ? 'bg-[#123E46] text-white' : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Supabase Backend</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
              </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-y-auto bg-white">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && overviewStats && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Clinic Operational Summary</h3>
                    <p className="text-xs text-[#64748B]">Real database-backed appointment metrics for B-Smart Dental Clinic</p>
                  </div>

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today</span>
                      <div className="text-2xl font-extrabold text-[#123E46] tabular-nums mt-1">
                        {overviewStats.stats.todayCount}
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
                      <div className="text-2xl font-extrabold text-amber-900 tabular-nums mt-1">
                        {overviewStats.stats.pendingCount}
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Confirmed</span>
                      <div className="text-2xl font-extrabold text-emerald-900 tabular-nums mt-1">
                        {overviewStats.stats.confirmedCount}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Completed</span>
                      <div className="text-2xl font-extrabold text-blue-900 tabular-nums mt-1">
                        {overviewStats.stats.completedCount}
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                      <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Cancelled</span>
                      <div className="text-2xl font-extrabold text-red-900 tabular-nums mt-1">
                        {overviewStats.stats.cancelledCount}
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Total Bookings</span>
                      <div className="text-2xl font-extrabold text-purple-900 tabular-nums mt-1">
                        {overviewStats.stats.totalAppointments}
                      </div>
                    </div>
                  </div>

                  {/* Clinic Control Alert Strip */}
                  <div className="p-4 rounded-2xl bg-[#E8F5F1] border border-[#c6e4da] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#123E46] flex items-center gap-2">
                        <span>Clinic Policy Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] ${overviewStats.clinicStatus.dentistApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                          Dentist Profile: {overviewStats.clinicStatus.dentistApproved ? 'Verified & Published' : 'Pending Verification'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] ${overviewStats.clinicStatus.sundayOpen ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                          Sundays: {overviewStats.clinicStatus.sundayOpen ? 'Open' : 'Unconfirmed / Blocked'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        Operating hours enforce separate morning (10:30 AM–1:00 PM) and evening (5:00 PM–10:00 PM) sessions.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('dentist')}
                      className="px-4 py-2 bg-[#123E46] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                    >
                      Manage Dentist Approval
                    </button>
                  </div>

                  {/* Today's Appointments Table */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#123E46]">Today's Scheduled Appointments</h4>
                    {overviewStats.todayAppointments && overviewStats.todayAppointments.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F7FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase">
                            <tr>
                              <th className="p-3">Reference</th>
                              <th className="p-3">Patient</th>
                              <th className="p-3">Service</th>
                              <th className="p-3">Time</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overviewStats.todayAppointments.map((app: Appointment) => (
                              <tr key={app.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-[#123E46]">{app.publicReference}</td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800">{app.patientName}</div>
                                  <div className="text-[11px] text-slate-500 tabular-nums">+91 {app.patientPhone}</div>
                                </td>
                                <td className="p-3">{app.serviceName}</td>
                                <td className="p-3 font-bold text-[#287A9B] tabular-nums">{app.startTime}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {app.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleUpdateStatus(app.id, 'completed')}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(app.id, 'no-show')}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                                  >
                                    No-Show
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                        No appointments scheduled for today yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS FULL LIST */}
              {activeTab === 'appointments' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#123E46]">All Patient Appointments</h3>
                      <p className="text-xs text-[#64748B]">Search, filter, confirm, reschedule, or cancel bookings</p>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#F7FAFC] p-3 rounded-2xl border border-slate-200">
                    <div className="sm:col-span-8 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search reference, patient name, or mobile number..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#287A9B]"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#287A9B]"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No-Show</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="p-3">Reference</th>
                          <th className="p-3">Patient Details</th>
                          <th className="p-3">Service</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Internal Note</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.length > 0 ? (
                          filteredAppointments.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-[#123E46]">
                                {app.publicReference}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800">{app.patientName}</div>
                                <div className="text-[11px] text-slate-500 tabular-nums">+91 {app.patientPhone}</div>
                                {app.patientEmail && <div className="text-[10px] text-slate-400">{app.patientEmail}</div>}
                              </td>
                              <td className="p-3 font-medium text-slate-700">{app.serviceName}</td>
                              <td className="p-3">
                                <div className="font-semibold text-[#123E46]">{app.date}</div>
                                <div className="text-[#287A9B] tabular-nums font-mono">{app.startTime}–{app.endTime}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  app.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : app.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : app.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : app.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="p-3 max-w-[140px]">
                                <div className="truncate text-slate-500" title={app.internalAdminNote || 'No internal note'}>
                                  {app.internalAdminNote || <span className="text-slate-300 italic">None</span>}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingAppointment(app);
                                    setInternalNoteText(app.internalAdminNote || '');
                                  }}
                                  className="text-[10px] text-[#287A9B] hover:underline cursor-pointer"
                                >
                                  {app.internalAdminNote ? 'Edit Note' : '+ Add Note'}
                                </button>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {app.status === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                                      title="Approve & Confirm"
                                    >
                                      Confirm
                                    </button>
                                  )}
                                  {app.status !== 'completed' && app.status !== 'cancelled' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateStatus(app.id, 'completed')}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                                      >
                                        Complete
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[11px] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              No appointments matching the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: AVAILABILITY & HOURS & BLOCKED SLOTS */}
              {activeTab === 'availability' && settings && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Operating Hours & Slot Blocking</h3>
                    <p className="text-xs text-[#64748B]">Manage clinic session hours, Sunday configuration, and reserved break slots</p>
                  </div>

                  {/* Sunday Configuration Banner */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-amber-900 text-sm block">Sunday Availability Control</span>
                      <p className="text-xs text-amber-800">
                        {settings.operatingHours.find((h) => h.weekday === 'Sunday')?.isOpen
                          ? 'Sundays are currently OPEN for appointments.'
                          : 'Sundays are UNCONFIRMED. Public booking on Sundays is disabled until you activate it.'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleSunday}
                      disabled={loadingAction}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl cursor-pointer shrink-0"
                    >
                      {settings.operatingHours.find((h) => h.weekday === 'Sunday')?.isOpen ? 'Disable Sundays' : 'Enable Sunday Bookings'}
                    </button>
                  </div>

                  {/* Operating Hours Table */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#123E46]">Weekday Schedule</h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-3">Day</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Morning Session</th>
                            <th className="p-3">Evening Session</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {settings.operatingHours.map((oh) => (
                            <tr key={oh.weekday} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-800">{oh.weekday}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${oh.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {oh.isOpen ? 'Open' : 'Closed / Unconfirmed'}
                                </span>
                              </td>
                              <td className="p-3 tabular-nums text-slate-700">
                                {oh.isOpen ? `${oh.morning.open} – ${oh.morning.close}` : '—'}
                              </td>
                              <td className="p-3 tabular-nums text-slate-700">
                                {oh.isOpen ? `${oh.evening.open} – ${oh.evening.close}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Block a Time Slot */}
                  <div className="p-5 rounded-2xl bg-[#F7FAFC] border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-[#123E46]">Block a Time Slot (Maintenance / Leave / Deep Sanitisation)</h4>
                    <form onSubmit={handleAddBlockedSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={newBlockDate}
                          onChange={(e) => setNewBlockDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          required
                          value={newBlockStart}
                          onChange={(e) => setNewBlockStart(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                        <input
                          type="time"
                          required
                          value={newBlockEnd}
                          onChange={(e) => setNewBlockEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="py-2.5 px-4 bg-[#123E46] text-white text-xs font-semibold rounded-xl hover:bg-[#1a5560] cursor-pointer"
                      >
                        Block Slot
                      </button>
                    </form>

                    {/* Blocked Slots List */}
                    {settings.blockedSlots.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Active Blocked Slots:</span>
                        <div className="space-y-1.5">
                          {settings.blockedSlots.map((b) => (
                            <div key={b.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#123E46]">{b.date}</span> ({b.startTime}–{b.endTime}) · <span className="text-slate-500">{b.reason}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteBlockedSlot(b.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SERVICES CATALOGUE */}
              {activeTab === 'services' && settings && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#123E46]">Clinical Services Management</h3>
                      <p className="text-xs text-[#64748B]">Publish, unpublish, update appointment durations and transparent pricing</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.services.map((svc) => (
                      <div key={svc.id} className="p-4 rounded-2xl border border-slate-200 bg-[#F7FAFC] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#287A9B] uppercase">{svc.category}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${svc.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              {svc.isPublished ? 'Published' : 'Draft / Unpublished'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#123E46]">{svc.name}</h4>
                          <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{svc.description}</p>
                          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <span>Duration: <strong className="tabular-nums">{svc.durationMinutes}m</strong></span>
                            <span>Fee: <strong>{svc.optionalPrice}</strong></span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200 flex items-center gap-2">
                          <button
                            onClick={() => handleSaveService({ ...svc, isPublished: !svc.isPublished })}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                              svc.isPublished ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {svc.isPublished ? 'Unpublish' : 'Publish to Website'}
                          </button>
                          <button
                            onClick={() => setEditingService(svc)}
                            className="py-1.5 px-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: DENTIST VERIFICATION & APPROVAL */}
              {activeTab === 'dentist' && settings && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Dentist Profile & Verification Control</h3>
                    <p className="text-xs text-[#64748B]">
                      Per clinic policy, practitioner credentials are displayed only when confirmed and approved by clinic administration.
                    </p>
                  </div>

                  {settings.dentists[0] && (
                    <div className="p-6 rounded-2xl bg-[#F7FAFC] border border-slate-200 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-[#123E46]">{settings.dentists[0].name}</h4>
                          <p className="text-xs text-[#287A9B] font-semibold">{settings.dentists[0].designation}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          settings.dentists[0].isConfirmedAndApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {settings.dentists[0].isConfirmedAndApproved ? 'Approved & Public' : 'Pending Verification'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                        <p><strong>Verified Qualifications:</strong> {settings.dentists[0].verifiedQualifications}</p>
                        <p><strong>Biography:</strong> {settings.dentists[0].biography}</p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                        <div className="text-xs text-slate-500">
                          {settings.dentists[0].isConfirmedAndApproved
                            ? 'Profile is currently visible on the homepage and about page.'
                            : 'Website currently displays a neutral "Verification Pending" notice.'}
                        </div>
                        <button
                          onClick={handleToggleDentistApproval}
                          disabled={loadingAction}
                          className={`w-full sm:w-auto px-6 py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs cursor-pointer ${
                            settings.dentists[0].isConfirmedAndApproved ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {settings.dentists[0].isConfirmedAndApproved
                            ? 'Revoke Website Approval'
                            : 'Verify & Approve for Publication'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: CLINIC INFO */}
              {activeTab === 'clinic_info' && settings && (
                <div className="max-w-2xl space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Clinic Business Information</h3>
                    <p className="text-xs text-[#64748B]">Core address, helpline, emergency notice, and Google Maps location</p>
                  </div>

                  <div className="bg-[#F7FAFC] p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Official Name</span>
                      <span className="text-sm font-bold text-[#123E46]">{settings.clinicInfo.name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Physical Address</span>
                      <span className="text-slate-700">{settings.clinicInfo.address}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 font-bold uppercase block mb-1">Helpline Phone</span>
                        <span className="font-mono font-bold text-[#123E46]">{settings.clinicInfo.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block mb-1">Timezone & Currency</span>
                        <span className="font-mono text-slate-700">{settings.clinicInfo.timezone} (₹ INR)</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Google Maps Link</span>
                      <a href={settings.clinicInfo.googleMapsUrl} target="_blank" rel="noreferrer" className="text-[#287A9B] hover:underline font-mono">
                        {settings.clinicInfo.googleMapsUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: NOTIFICATIONS & WEBHOOKS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Notification Dispatch & Gateways</h3>
                    <p className="text-xs text-[#64748B]">Status of SMS, WhatsApp, and Email integrations</p>
                  </div>

                  {/* Provider Setup Notice (Identifies requirements per prompt) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-[#123E46] uppercase">SMS & WhatsApp Gateway Configuration</span>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      In accordance with production deployment rules, notifications are currently safely queued and logged to the database. To enable live SMS sending in India:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      <li>Configure <code>SMS_API_KEY</code> and DLT-registered Header ID (e.g. Fast2SMS / Twilio India).</li>
                      <li>For WhatsApp, provision Meta Cloud API credentials or Gupshup token.</li>
                    </ul>
                  </div>

                  {/* Logs Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Recent Notification Dispatch Log:</h4>
                    <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Recipient</th>
                            <th className="p-2.5">Reference</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Content Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {notificationLogs.length > 0 ? (
                            notificationLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-2.5 text-slate-400 tabular-nums">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </td>
                                <td className="p-2.5 font-bold text-[#123E46]">{log.type}</td>
                                <td className="p-2.5 font-mono">{log.recipient}</td>
                                <td className="p-2.5 font-mono">{log.publicReference}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                    {log.status}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-600 max-w-xs truncate" title={log.details}>
                                  {log.details}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400">
                                No notifications dispatched yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: PATIENT ENQUIRIES */}
              {activeTab === 'enquiries' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-[#123E46]">Patient Inquiries Inbox</h3>
                    <p className="text-xs text-[#64748B]">Messages submitted via the website contact form</p>
                  </div>

                  <div className="space-y-3">
                    {enquiries.length > 0 ? (
                      enquiries.map((enq) => (
                        <div key={enq.id} className="p-4 rounded-2xl bg-[#F7FAFC] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#123E46] text-sm">{enq.name}</span>
                              <span className="font-mono text-slate-500 tabular-nums">+91 {enq.phone}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${enq.status === 'new' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'}`}>
                                {enq.status}
                              </span>
                            </div>
                            <div className="font-semibold text-[#287A9B]">{enq.subject}</div>
                            <p className="text-slate-600">{enq.message}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={`tel:${enq.phone}`}
                              className="px-3 py-1.5 bg-[#123E46] text-white rounded-lg font-semibold"
                            >
                              Call Patient
                            </a>
                            {enq.status === 'new' && (
                              <button
                                onClick={async () => {
                                  await clinicApi.updateEnquiryStatus(enq.id, 'contacted');
                                  loadAdminData();
                                }}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                              >
                                Mark Contacted
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                        No contact enquiries received yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: SUPABASE BACKEND CLOUD DATABASE */}
              {activeTab === 'supabase' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#123E46]">Supabase PostgreSQL Backend</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300">
                        Live Connected
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Cloud database integration for real-time appointment and patient enquiry persistence
                    </p>
                  </div>

                  {/* Supabase Connection Overview Card */}
                  <div className="p-5 rounded-2xl bg-[#F7FAFC] border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase block mb-1">Project ID</span>
                        <span className="font-mono font-bold text-[#123E46] text-sm">huiuqhqzglbrzzlbcheb</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block mb-1">Project URL</span>
                        <a
                          href="https://huiuqhqzglbrzzlbcheb.supabase.co"
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[#287A9B] hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">https://huiuqhqzglbrzzlbcheb.supabase.co</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase block mb-1">Live Pipeline Status</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Auto-Sync on Booking Active</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 text-xs text-[#24313A] leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                      <strong>How it works:</strong> Whenever a patient submits the booking form on the website, the appointment is atomically verified and saved, and then automatically transmitted and inserted into your Supabase database table <code>public.appointments</code>.
                    </div>
                  </div>

                  {/* Table Detection & Status */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#123E46]">Supabase Tables Status</h4>
                      <button
                        onClick={loadSupabaseStatus}
                        className="inline-flex items-center gap-1 text-xs text-[#287A9B] hover:underline cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Table Status</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-slate-200 bg-[#F7FAFC] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#123E46] block">appointments</span>
                          <span className="text-[11px] text-slate-500">Patient bookings</span>
                        </div>
                        {supabaseStatus?.tablesFound?.appointments ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Ready & Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Needs SQL Run
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-[#F7FAFC] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#123E46] block">enquiries</span>
                          <span className="text-[11px] text-slate-500">Contact submissions</span>
                        </div>
                        {supabaseStatus?.tablesFound?.enquiries ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Ready & Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Needs SQL Run
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-[#F7FAFC] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#123E46] block">services</span>
                          <span className="text-[11px] text-slate-500">Dental catalog</span>
                        </div>
                        {supabaseStatus?.tablesFound?.services ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Ready & Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Needs SQL Run
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick SQL Setup Card if tables not created yet */}
                    {(!supabaseStatus?.tablesFound?.appointments || supabaseStatus?.instructionsNeeded) && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-900 text-xs block">
                              One-Time Setup: Create Tables in Supabase SQL Editor
                            </span>
                            <p className="text-xs text-amber-800 leading-relaxed">
                              Your Supabase database requires the <code>appointments</code> table to display rows in your Supabase Table Editor. Follow these 2 quick steps:
                            </p>
                            <ol className="text-xs text-amber-900 list-decimal list-inside space-y-1 pt-1 font-medium">
                              <li>
                                Click <strong>"Copy SQL Schema Script"</strong> below.
                              </li>
                              <li>
                                Open the <a href="https://supabase.com/dashboard/project/huiuqhqzglbrzzlbcheb/sql/new" target="_blank" rel="noreferrer" className="underline font-bold text-amber-950 inline-flex items-center gap-0.5">Supabase SQL Editor <ExternalLink className="w-3 h-3" /></a>, paste the script, and click <strong>"Run"</strong>.
                              </li>
                            </ol>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            onClick={copySqlToClipboard}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            {copiedSql ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-300" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy SQL Schema Script</span>
                              </>
                            )}
                          </button>

                          <a
                            href="https://supabase.com/dashboard/project/huiuqhqzglbrzzlbcheb/sql/new"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            <span>Open Supabase SQL Editor</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Sync / Test Trigger */}
                  <div className="p-5 rounded-2xl bg-[#F7FAFC] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#123E46]">Push All Local Appointments to Supabase</h4>
                      <p className="text-xs text-[#64748B]">
                        Synchronize existing bookings and inquiries to your Supabase PostgreSQL tables now.
                      </p>
                      {syncResult && (
                        <div className={`mt-2 text-xs font-semibold ${syncResult.success ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {syncResult.message || syncResult.error}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSyncAllToSupabase}
                      disabled={syncingSupabase}
                      className="px-5 py-2.5 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                    >
                      {syncingSupabase ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                          <span>Pushing to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 text-teal-300" />
                          <span>Sync Records to Supabase Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Schema Code Preview */}
                  {supabaseSql && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-teal-400">supabase/schema.sql (PostgreSQL DDL)</span>
                        <button
                          onClick={copySqlToClipboard}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-white"
                        >
                          {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="max-h-56 overflow-y-auto text-[11px] font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800 scrollbar-none">
                        {supabaseSql}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        )}

        {/* Internal Admin Note Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
              <h4 className="text-base font-bold text-[#123E46]">
                Internal Staff Note for {editingAppointment.publicReference}
              </h4>
              <p className="text-xs text-slate-500">
                This note is strictly private and visible only to authorized clinic staff.
              </p>
              <textarea
                rows={3}
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                placeholder="e.g. Patient requested Dr. Srinidhi, verified X-ray is required on arrival."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#287A9B]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInternalNote}
                  disabled={loadingAction}
                  className="px-5 py-2 bg-[#123E46] text-white text-xs font-semibold rounded-xl"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {editingService && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
              <h4 className="text-base font-bold text-[#123E46]">
                Edit Service: {editingService.name}
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Service Title</label>
                  <input
                    type="text"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Pricing Text</label>
                  <input
                    type="text"
                    value={editingService.optionalPrice}
                    onChange={(e) => setEditingService({ ...editingService, optionalPrice: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveService(editingService)}
                  disabled={loadingAction}
                  className="px-5 py-2 bg-[#123E46] text-white text-xs font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
