import React from 'react';
import { X, Shield, Clock, FileText } from 'lucide-react';

interface PolicyModalProps {
  type: 'privacy' | 'cancellation' | 'terms' | null;
  onClose: () => void;
}

export const PolicyModals: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {type === 'privacy' && <Shield className="w-5 h-5 text-[#287A9B]" />}
            {type === 'cancellation' && <Clock className="w-5 h-5 text-[#287A9B]" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-[#287A9B]" />}
            <h3 className="text-lg font-bold text-[#123E46]">
              {type === 'privacy' && 'Patient Privacy & Data Protection Policy'}
              {type === 'cancellation' && 'Appointment Cancellation & Rescheduling Policy'}
              {type === 'terms' && 'Clinic Terms & Conditions of Service'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer"
            aria-label="Close policy modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-[#64748B] space-y-4 leading-relaxed">
          {type === 'privacy' && (
            <>
              <p>
                <strong>B-Smart Dental Clinic & Implant Centre</strong> respects the privacy of all patients visiting our practice on Savalanga Road, Gandhi Nagar, Shivamogga, Karnataka 577201.
              </p>
              <h4 className="font-bold text-[#123E46]">1. Information We Collect</h4>
              <p>
                When booking an appointment or submitting an inquiry, we collect your full name, 10-digit mobile number, optional email address, and optional appointment note. We do not solicit or store Aadhaar numbers, credit card details, or banking passwords on this website.
              </p>
              <h4 className="font-bold text-[#123E46]">2. Purpose of Data Processing</h4>
              <p>
                Your contact details are utilized solely for scheduling, sending appointment references, sending rescheduling notices, and enabling clinical care communication. We never sell, rent, or lease patient contact lists to third-party commercial marketers.
              </p>
              <h4 className="font-bold text-[#123E46]">3. Data Security & Confidentiality</h4>
              <p>
                Administrative access is restricted to verified clinic staff with role-based credentials. Clinical discussions during your consultation remain confidential between you and the treating dentist.
              </p>
            </>
          )}

          {type === 'cancellation' && (
            <>
              <p>
                To provide timely and attentive care to all patients across Shivamogga, our clinic operates on scheduled appointment slots.
              </p>
              <h4 className="font-bold text-[#123E46]">1. Advance Cancellation Notice</h4>
              <p>
                If you are unable to attend your scheduled visit, we request that you cancel or reschedule at least <strong>4 hours in advance</strong> using your reference number on the website or by calling our clinic desk at <strong>+91 94825 84402</strong>.
              </p>
              <h4 className="font-bold text-[#123E46]">2. Automated Slot Release</h4>
              <p>
                When you cancel an appointment online, your time slot is immediately returned to our public availability calendar so other patients with dental discomfort or needs can schedule care.
              </p>
              <h4 className="font-bold text-[#123E46]">3. Rescheduling Convenience</h4>
              <p>
                Patients may reschedule their appointment to any currently available morning (10:30 AM–1:00 PM) or evening (5:00 PM–10:00 PM) slot up to 30 days in advance without penalty.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <h4 className="font-bold text-[#123E46]">1. Diagnostic Consultations & Clinical Estimates</h4>
              <p>
                Fees indicated on this website (such as initial consultation charges) are indicative starting points. Final treatment roadmaps, material selections (e.g. ceramic vs. zirconia implants), and comprehensive procedure costs are confirmed only after direct intraoral examination and diagnosis by the dentist.
              </p>
              <h4 className="font-bold text-[#123E46]">2. Emergency & Triage</h4>
              <p>
                In cases of severe acute dental trauma or surgical emergencies, triage priority may be assigned to ensure patient safety. Our reception will inform scheduled patients promptly if an emergency causes a slight clinical delay.
              </p>
              <h4 className="font-bold text-[#123E46]">3. Governing Jurisdiction</h4>
              <p>
                All clinic operations and healthcare services are governed in accordance with the professional dental standards of Karnataka, India.
              </p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#123E46] text-white text-xs font-semibold rounded-xl hover:bg-[#1a5560] cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
