import React, { useState, useEffect } from 'react';
import { Appointment, ServiceItem, DayOperatingHours, HolidayItem } from '../types';
import { clinicApi } from '../services/api';
import {
  Search,
  Calendar,
  Clock,
  RotateCcw,
  XCircle,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Download,
  Navigation,
} from 'lucide-react';

interface ManageBookingModalProps {
  initialReference?: string;
  initialPhone?: string;
  services: ServiceItem[];
  operatingHours: DayOperatingHours[];
  holidays: HolidayItem[];
  onClose: () => void;
}

export const ManageBookingModal: React.FC<ManageBookingModalProps> = ({
  initialReference = '',
  initialPhone = '',
  services,
  operatingHours,
  holidays,
  onClose,
}) => {
  const [reference, setReference] = useState<string>(initialReference);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [appointment, setAppointment] = useState<(Appointment & { canReschedule: boolean; canCancel: boolean }) | null>(null);

  // Reschedule Sub-flow
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Cancellation Sub-flow
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Auto lookup if initial values provided
  useEffect(() => {
    if (initialReference && initialPhone) {
      handleLookup();
    }
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!reference.trim() || !phone.trim()) {
      setError('Please provide both your Appointment Reference Number and registered Phone Number.');
      return;
    }

    setLoading(true);
    try {
      const res = await clinicApi.lookupAppointment(reference.trim(), phone.trim());
      setAppointment(res.appointment);
    } catch (err: any) {
      setError(err.message || 'No appointment found with those details. Please check your reference number.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  // Check slots when newDate changes in reschedule flow
  useEffect(() => {
    if (!newDate || !appointment) return;
    setLoadingSlots(true);
    clinicApi
      .getAvailability(newDate, appointment.serviceId)
      .then((res) => {
        const combined = [...(res.morningSlots || []), ...(res.eveningSlots || [])];
        setAvailableSlots(combined);
      })
      .catch((err) => {
        setError(err.message || 'Unable to check availability for this date.');
      })
      .finally(() => setLoadingSlots(false));
  }, [newDate, appointment]);

  const handleConfirmReschedule = async () => {
    if (!appointment || !newDate || !newTime) return;
    setLoading(true);
    setError(null);

    try {
      const res = await clinicApi.rescheduleAppointment({
        publicReference: appointment.publicReference,
        rescheduleToken: appointment.rescheduleToken,
        patientPhone: phone.trim(),
        newDate,
        newStartTime: newTime,
      });

      if (res.success) {
        setSuccessMessage(`Appointment successfully rescheduled to ${newDate} at ${newTime}.`);
        setIsRescheduling(false);
        // Refresh lookup
        handleLookup();
      }
    } catch (err: any) {
      setError(err.message || 'Rescheduling failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!appointment) return;
    setLoading(true);
    setError(null);

    try {
      const res = await clinicApi.cancelAppointment({
        publicReference: appointment.publicReference,
        rescheduleToken: appointment.rescheduleToken,
        patientPhone: phone.trim(),
        reason: cancelReason.trim(),
      });

      if (res.success) {
        setSuccessMessage('Your appointment has been cancelled and the slot released.');
        setIsCancelling(false);
        handleLookup();
      }
    } catch (err: any) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-[#123E46] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider block">
              Patient Self-Service
            </span>
            <h2 className="text-lg font-bold">Manage Your Appointment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Notifications */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Lookup Form */}
          {!appointment && (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#123E46]">Find Your Booking</h3>
                <p className="text-xs text-[#64748B]">
                  For your privacy, verify both your appointment reference code and registered phone number.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Appointment Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    placeholder="e.g. BSMART-26A4"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-[#287A9B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="94825 84402"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-r-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 text-teal-300" />
                  <span>{loading ? 'Searching Records...' : 'Verify & Find Appointment'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Appointment Record Details */}
          {appointment && !isRescheduling && !isCancelling && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Appointment Record</span>
                  <h3 className="text-lg font-bold text-[#123E46] font-mono">
                    {appointment.publicReference}
                  </h3>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    appointment.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : appointment.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : appointment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              <div className="bg-[#F7FAFC] rounded-2xl p-5 border border-slate-200 text-xs sm:text-sm space-y-3">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-xs">Patient</span>
                    <span className="font-bold text-[#123E46]">{appointment.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Phone</span>
                    <span className="font-bold text-[#123E46] tabular-nums">{appointment.patientPhone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-xs">Service</span>
                    <span className="font-bold text-[#123E46]">{appointment.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Date & Time</span>
                    <span className="font-bold text-[#123E46] tabular-nums">
                      {appointment.date} at {appointment.startTime}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#64748B]">
                  <span className="font-semibold text-[#123E46]">Clinic Address:</span>
                  <p>Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201</p>
                </div>
              </div>

              {/* Action Buttons */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {appointment.canReschedule && (
                    <button
                      type="button"
                      onClick={() => setIsRescheduling(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#287A9B] hover:bg-[#20647f] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-teal-200" />
                      <span>Reschedule Appointment</span>
                    </button>
                  )}

                  {appointment.canCancel && (
                    <button
                      type="button"
                      onClick={() => setIsCancelling(true)}
                      className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-red-50 text-red-700 border border-red-300 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Visit</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  This appointment is marked as {appointment.status} and cannot be modified.
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAppointment(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Look up a different appointment
                </button>
              </div>
            </div>
          )}

          {/* RESCHEDULE FLOW */}
          {isRescheduling && appointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[#123E46]">
                  Select New Date & Time
                </h4>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="text-xs text-slate-500 hover:underline cursor-pointer"
                >
                  Cancel Rescheduling
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24313A] mb-1">
                  Choose New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewTime('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                />
              </div>

              {newDate && (
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-2">
                    Available Time Slots for {newDate}
                  </label>
                  {loadingSlots ? (
                    <div className="text-xs text-slate-500 italic">Checking live availability...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setNewTime(slot.time)}
                          className={`py-2 px-2 text-xs font-bold rounded-lg border tabular-nums transition-all ${
                            !slot.available
                              ? 'bg-slate-100 text-slate-300 line-through border-slate-200 cursor-not-allowed'
                              : newTime === slot.time
                              ? 'bg-[#123E46] text-white border-[#123E46]'
                              : 'bg-white text-[#123E46] border-slate-300 hover:border-[#123E46]'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      No open slots on this date. Please choose a different date.
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newDate || !newTime || loading}
                  onClick={handleConfirmReschedule}
                  className="px-6 py-2.5 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm New Slot
                </button>
              </div>
            </div>
          )}

          {/* CANCELLATION CONFIRMATION FLOW */}
          {isCancelling && appointment && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Confirm Appointment Cancellation</span>
                </div>
                <p>
                  Are you sure you want to cancel appointment <strong>{appointment.publicReference}</strong> on <strong>{appointment.date} at {appointment.startTime}</strong>?
                </p>
                <p className="text-xs text-red-700">
                  This slot will be immediately released back to our public booking calendar for other patients in Shivamogga.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24313A] mb-1">
                  Reason for Cancellation <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict or feeling unwell"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCancelling(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmCancellation}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Yes, Cancel Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
