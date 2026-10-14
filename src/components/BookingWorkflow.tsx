import React, { useState, useEffect } from 'react';
import { ServiceItem, DentistProfile, Appointment, DayOperatingHours, HolidayItem } from '../types';
import { clinicApi } from '../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Navigation,
  ShieldCheck,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BookingWorkflowProps {
  services: ServiceItem[];
  dentists: DentistProfile[];
  operatingHours: DayOperatingHours[];
  holidays: HolidayItem[];
  initialService?: ServiceItem | null;
  onClose: () => void;
  onManageBooking: (ref: string, phone: string) => void;
}

export const BookingWorkflow: React.FC<BookingWorkflowProps> = ({
  services,
  dentists,
  operatingHours,
  holidays,
  initialService,
  onClose,
  onManageBooking,
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(initialService || services[0] || null);
  const [selectedDentist, setSelectedDentist] = useState<DentistProfile | null>(dentists[0] || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [appointmentNote, setAppointmentNote] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Availability query state
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [availabilityData, setAvailabilityData] = useState<{
    isClosed: boolean;
    reason?: string;
    morningSlots: { time: string; available: boolean; reason?: string }[];
    eveningSlots: { time: string; available: boolean; reason?: string }[];
  } | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Set initial service if passed
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
  }, [initialService]);

  // Generate date list for the next 21 days
  const today = new Date();
  const availableDatesList: { dateStr: string; dayName: string; dayNum: number; monthName: string; isOpen: boolean; reason?: string }[] = [];

  for (let i = 0; i < 21; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdayNames[d.getDay()];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const oh = operatingHours.find((h) => h.weekday === weekday);
    const isHoliday = holidays.some((h) => h.date === dateStr);
    const holiday = holidays.find((h) => h.date === dateStr);

    let isOpen = Boolean(oh && oh.isOpen);
    let reason: string | undefined = undefined;

    if (isHoliday) {
      isOpen = false;
      reason = holiday?.name || 'Holiday';
    } else if (weekday === 'Sunday' && (!oh || !oh.isOpen)) {
      isOpen = false;
      reason = 'Unconfirmed Sunday';
    } else if (!oh || !oh.isOpen) {
      isOpen = false;
      reason = 'Closed';
    }

    availableDatesList.push({
      dateStr,
      dayName: weekday.slice(0, 3),
      dayNum: d.getDate(),
      monthName: monthNames[d.getMonth()],
      isOpen,
      reason,
    });
  }

  // Fetch slots whenever selectedDate or selectedService changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    let isMounted = true;
    setLoadingAvailability(true);
    setErrorMessage(null);

    clinicApi
      .getAvailability(selectedDate, selectedService.id, selectedDentist?.id)
      .then((res) => {
        if (!isMounted) return;
        setAvailabilityData({
          isClosed: res.isClosed,
          reason: res.reason,
          morningSlots: res.morningSlots || [],
          eveningSlots: res.eveningSlots || [],
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Failed to check appointment slots.');
        setAvailabilityData(null);
      })
      .finally(() => {
        if (isMounted) setLoadingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService, selectedDentist]);

  // Validation before proceeding to Review (Step 6)
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!patientName.trim() || patientName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 letters).');
      return;
    }

    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) {
      setErrorMessage('Please enter a valid email address, or leave it blank.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please acknowledge the clinic appointment policy.');
      return;
    }

    setStep(6);
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await clinicApi.bookAppointment({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || undefined,
        serviceId: selectedService.id,
        dentistId: selectedDentist?.id,
        date: selectedDate,
        startTime: selectedTime,
        appointmentNote: appointmentNote.trim() || undefined,
      });

      if (response.success && response.appointment) {
        setConfirmedAppointment(response.appointment);
        setStep(7); // Confirmation page
      } else {
        throw new Error('Appointment registration could not be verified.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking submission failed. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Download .ics calendar event
  const downloadCalendarEvent = () => {
    if (!confirmedAppointment) return;

    const startDate = confirmedAppointment.date.replace(/-/g, '');
    const startTimeClean = confirmedAppointment.startTime.replace(':', '') + '00';
    const endTimeClean = confirmedAppointment.endTime.replace(':', '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//B-Smart Dental Clinic//Appointment//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${confirmedAppointment.id}@bsmartdental.in`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=Asia/Kolkata:${startDate}T${startTimeClean}`,
      `DTEND;TZID=Asia/Kolkata:${startDate}T${endTimeClean}`,
      `SUMMARY:B-Smart Dental Clinic Appointment (${confirmedAppointment.serviceName || 'Consultation'})`,
      `DESCRIPTION:Appointment Reference: ${confirmedAppointment.publicReference}\\nClinic: B-Smart Dental Clinic & Implant Centre\\nPhone: +91 94825 84402\\nPatient: ${confirmedAppointment.patientName}`,
      'LOCATION:Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `B-Smart-Appointment-${confirmedAppointment.publicReference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-[#123E46] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider block">
              Online Appointment System
            </span>
            <h2 className="text-lg sm:text-xl font-bold">
              B-Smart Dental Clinic & Implant Centre
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar (Steps 1–6) */}
        {step < 7 && (
          <div className="px-6 py-3 bg-[#F7FAFC] border-b border-[#E2E8F0] shrink-0">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
              <span className={step >= 1 ? 'text-[#123E46] font-bold' : ''}>1. Service</span>
              <span className={step >= 3 ? 'text-[#123E46] font-bold' : ''}>2. Date & Time</span>
              <span className={step >= 5 ? 'text-[#123E46] font-bold' : ''}>3. Patient Info</span>
              <span className={step >= 6 ? 'text-[#123E46] font-bold' : ''}>4. Review</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#287A9B] transition-all duration-300"
                style={{ width: `${((step <= 6 ? step : 6) / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Scheduling Notice</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#123E46]">Select Your Dental Service</h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Choose the reason for your visit. Duration and appointment parameters are set automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#287A9B] bg-[#E8F5F1]/50 shadow-xs ring-1 ring-[#287A9B]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-semibold text-[#287A9B] capitalize">{service.category}</span>
                          <span className="tabular-nums font-medium">{service.durationMinutes} mins</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#123E46] mb-1">{service.name}</h4>
                        <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Fee:</span>
                        <span className="font-bold text-[#123E46]">{service.optionalPrice}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedService}
                  onClick={() => setStep(3)} // Move to Date & Time directly (Step 2 auto-selects Dr. Srinidhi)
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continue to Date Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: SELECT DATE & TIME */}
          {(step === 3 || step === 4) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#123E46]">Select Appointment Date</h3>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    For <span className="font-semibold text-[#123E46]">{selectedService?.name}</span> ({selectedService?.durationMinutes} mins slot)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#287A9B] hover:underline cursor-pointer"
                >
                  Change Service
                </button>
              </div>

              {/* Horizontal Date Picker Strip */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Available Clinic Dates
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
                  {availableDatesList.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        disabled={!d.isOpen}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setSelectedTime('');
                          setStep(4);
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[70px] border transition-all cursor-pointer shrink-0 ${
                          !d.isOpen
                            ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400'
                            : isSelected
                            ? 'bg-[#123E46] text-white border-[#123E46] shadow-sm'
                            : 'bg-white border-slate-200 text-[#24313A] hover:border-[#287A9B]'
                        }`}
                        title={!d.isOpen ? d.reason || 'Closed' : undefined}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {d.dayName}
                        </span>
                        <span className="text-xl font-extrabold tabular-nums my-0.5">
                          {d.dayNum}
                        </span>
                        <span className="text-[10px] font-medium opacity-80">
                          {d.monthName}
                        </span>
                        {!d.isOpen && (
                          <span className="text-[9px] mt-1 text-amber-700 font-semibold block truncate max-w-[64px]">
                            {d.reason === 'Unconfirmed Sunday' ? 'Sunday' : d.reason || 'Closed'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Area */}
              {selectedDate && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#123E46]">
                        Available Slots for {new Date(`${selectedDate}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </h4>
                      <p className="text-xs text-[#64748B]">
                        Clinic operating sessions: Morning (10:30 AM–1:00 PM) & Evening (5:00 PM–10:00 PM)
                      </p>
                    </div>
                    {loadingAvailability && (
                      <div className="flex items-center gap-1.5 text-xs text-[#287A9B]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking availability...</span>
                      </div>
                    )}
                  </div>

                  {availabilityData?.isClosed ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong>Closed Date:</strong> {availabilityData.reason || 'Clinic is closed on this date.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Morning Session */}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#123E46] mb-2">
                          <span className="w-2 h-2 rounded-full bg-[#287A9B]" />
                          <span>Morning Session (10:30 AM – 1:00 PM)</span>
                        </div>
                        {availabilityData?.morningSlots && availabilityData.morningSlots.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {availabilityData.morningSlots.map((slot) => {
                              const isChosen = selectedTime === slot.time;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => setSelectedTime(slot.time)}
                                  className={`py-2 px-2.5 rounded-lg text-xs font-bold tabular-nums border text-center transition-all cursor-pointer ${
                                    !slot.available
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                                      : isChosen
                                      ? 'bg-[#287A9B] text-white border-[#287A9B] shadow-xs'
                                      : 'bg-white text-[#123E46] border-slate-200 hover:border-[#287A9B]'
                                  }`}
                                  title={!slot.available ? slot.reason || 'Booked' : 'Available'}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No morning slots available for this service.</div>
                        )}
                      </div>

                      {/* Evening Session */}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#123E46] mb-2">
                          <span className="w-2 h-2 rounded-full bg-[#123E46]" />
                          <span>Evening Session (5:00 PM – 10:00 PM)</span>
                        </div>
                        {availabilityData?.eveningSlots && availabilityData.eveningSlots.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {availabilityData.eveningSlots.map((slot) => {
                              const isChosen = selectedTime === slot.time;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => setSelectedTime(slot.time)}
                                  className={`py-2 px-2.5 rounded-lg text-xs font-bold tabular-nums border text-center transition-all cursor-pointer ${
                                    !slot.available
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                                      : isChosen
                                      ? 'bg-[#123E46] text-white border-[#123E46] shadow-xs'
                                      : 'bg-white text-[#123E46] border-slate-200 hover:border-[#123E46]'
                                  }`}
                                  title={!slot.available ? slot.reason || 'Booked' : 'Available'}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No evening slots available for this service.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Services</span>
                    </button>

                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => setStep(5)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Continue to Patient Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: ENTER PATIENT DETAILS */}
          {step === 5 && (
            <form onSubmit={handleProceedToReview} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#123E46]">Patient Contact Information</h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  We collect only the essential details required to manage your dental appointment securely.
                </p>
              </div>

              {/* Slot Summary Pill */}
              <div className="p-3 bg-[#E8F5F1] rounded-xl border border-[#c6e4da] flex flex-wrap items-center justify-between text-xs text-[#123E46]">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#287A9B]" />
                  <span>
                    <strong>{selectedDate}</strong> at <strong className="tabular-nums">{selectedTime}</strong>
                  </span>
                </div>
                <span className="font-semibold">{selectedService?.name}</span>
              </div>

              <div className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Patient Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-[#24313A] focus:outline-none focus:border-[#287A9B] focus:ring-1 focus:ring-[#287A9B]"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Mobile Number (10 digits) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-semibold tabular-nums">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="94825 84402"
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-r-xl text-xs sm:text-sm text-[#24313A] focus:outline-none focus:border-[#287A9B] focus:ring-1 focus:ring-[#287A9B] tabular-nums"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Used for SMS appointment reference and secure booking verification.
                  </span>
                </div>

                {/* Optional Email */}
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional for calendar confirmation)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="anand@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-[#24313A] focus:outline-none focus:border-[#287A9B] focus:ring-1 focus:ring-[#287A9B]"
                    />
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Appointment Note <span className="text-slate-400 font-normal">(Optional non-sensitive note)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={appointmentNote}
                    onChange={(e) => setAppointmentNote(e.target.value)}
                    placeholder="Brief note (e.g. routine check-up, minor tooth sensitivity, or first visit)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-[#24313A] focus:outline-none focus:border-[#287A9B] focus:ring-1 focus:ring-[#287A9B]"
                  />
                </div>

                {/* Terms agreement */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-[#64748B]">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-[#287A9B] focus:ring-[#287A9B]"
                    />
                    <span>
                      I understand that appointment slots are held on confirmation. I agree to notify the clinic at least 4 hours in advance if I need to cancel or reschedule.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Time Slots</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Review Booking Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 6: REVIEW SUMMARY & CONFIRM */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#123E46]">Review Your Appointment</h3>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Please verify your booking summary before final submission to the clinic backend.
                </p>
              </div>

              <div className="bg-[#F7FAFC] rounded-2xl border border-slate-200 p-5 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-xs">Patient Name</span>
                    <span className="font-bold text-[#123E46] text-base">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Mobile Number</span>
                    <span className="font-bold text-[#123E46] tabular-nums">+91 {patientPhone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-xs">Selected Dental Service</span>
                    <span className="font-bold text-[#123E46]">{selectedService?.name}</span>
                    <span className="text-xs text-slate-500 block">Duration: {selectedService?.durationMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Appointment Schedule</span>
                    <span className="font-bold text-[#123E46] block">{selectedDate}</span>
                    <span className="text-xs text-[#287A9B] font-semibold tabular-nums">
                      {selectedTime} onwards
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#64748B] space-y-1">
                  <div className="font-semibold text-[#123E46]">Clinic Location:</div>
                  <p>B-Smart Dental Clinic & Implant Centre</p>
                  <p>Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201</p>
                  <p className="tabular-nums">Phone: +91 94825 84402</p>
                </div>
              </div>

              {/* Concurrency Notice */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your booking will be verified atomically by the database to prevent duplicate scheduling.</span>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                      <span>Verifying & Confirming Slot...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-300" />
                      <span>Confirm Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: APPOINTMENT CONFIRMATION */}
          {step === 7 && confirmedAppointment && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Booking Confirmed
                </span>
                <h3 className="text-2xl font-extrabold text-[#123E46]">
                  Your Appointment is Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                  We look forward to welcoming you to B-Smart Dental Clinic in Shivamogga.
                </p>
              </div>

              {/* Reference Number Box */}
              <div className="max-w-md mx-auto p-5 bg-[#F7FAFC] rounded-2xl border-2 border-dashed border-[#287A9B]/30 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Appointment Reference Number
                </span>
                <div className="text-2xl font-black text-[#123E46] tracking-widest font-mono">
                  {confirmedAppointment.publicReference}
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Save this reference code to reschedule or cancel your visit online at any time.
                </p>
              </div>

              {/* Quick Details Card */}
              <div className="max-w-md mx-auto text-left bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-bold text-[#123E46]">{confirmedAppointment.patientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Service:</span>
                  <span className="font-bold text-[#123E46]">{confirmedAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-bold text-[#123E46] tabular-nums">
                    {confirmedAppointment.date} at {confirmedAppointment.startTime}–{confirmedAppointment.endTime}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-700 text-right">Savalanga Rd, Gandhi Nagar, Shivamogga</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadCalendarEvent}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-teal-300" />
                  <span>Add to Calendar (.ics)</span>
                </button>

                <a
                  href="https://maps.app.goo.gl/QBv6DBY7oKg2dL7o8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                >
                  <Navigation className="w-4 h-4 text-[#287A9B]" />
                  <span>Google Maps Directions</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onManageBooking(confirmedAppointment.publicReference, patientPhone);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs text-[#287A9B] hover:underline font-semibold cursor-pointer"
                >
                  <span>Manage / Reschedule</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Done & Return to Website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
