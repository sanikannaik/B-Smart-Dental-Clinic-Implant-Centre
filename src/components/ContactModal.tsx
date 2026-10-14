import React, { useState } from 'react';
import { clinicApi } from '../services/api';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, X, Clock } from 'lucide-react';
import { ClinicInfo } from '../types';

interface ContactModalProps {
  clinicInfo: ClinicInfo;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ clinicInfo, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Enquiry');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Please provide your name, phone number, and enquiry message.');
      return;
    }

    setLoading(true);
    try {
      const res = await clinicApi.submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject,
        message: message.trim(),
      });
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col">
        {/* Header */}
        <div className="bg-[#123E46] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-teal-200 uppercase tracking-wider block">
              Direct Clinic Communication
            </span>
            <h2 className="text-lg font-bold">Contact Clinic Reception</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#123E46]">Message Received!</h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                Thank you, <strong>{name}</strong>. Our front desk reception in Shivamogga will review your message and reach out to you shortly at <strong>+91 {phone}</strong>.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-[#123E46] text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Quick Contact strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F7FAFC] rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#287A9B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#123E46] block">Phone Helpline:</span>
                    <a href={`tel:${clinicInfo.phone.replace(/\s+/g, '')}`} className="text-[#287A9B] hover:underline font-mono">
                      {clinicInfo.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#287A9B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#123E46] block">Location:</span>
                    <span className="text-[#64748B]">Savalanga Rd, Gandhi Nagar</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Hegde"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#24313A] mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="94825 84402"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#24313A] mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Subject / Concern
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                  >
                    <option value="General Enquiry">General Clinic Enquiry</option>
                    <option value="Dental Implants Consultation">Dental Implants Consultation</option>
                    <option value="Treatment Pricing & Estimates">Treatment Pricing & Estimates</option>
                    <option value="Appointment Reschedule Help">Appointment Assistance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24313A] mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can our clinical team assist you?"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#287A9B]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#123E46] hover:bg-[#1a5560] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-teal-300" />
                    <span>{loading ? 'Submitting Message...' : 'Send Message to Clinic'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
