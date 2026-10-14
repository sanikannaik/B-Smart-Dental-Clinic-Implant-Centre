import React from 'react';
import { HelpCircle, FileText, PhoneCall, AlertCircle, Shield, RotateCcw } from 'lucide-react';

interface PatientInfoSectionProps {
  onOpenCancellationPolicy: () => void;
  onOpenPrivacyPolicy: () => void;
  onContactClick: () => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  onOpenCancellationPolicy,
  onOpenPrivacyPolicy,
  onContactClick,
}) => {
  const infoCards = [
    {
      icon: FileText,
      title: 'What to Bring to Your Visit',
      items: [
        'A valid photo ID (Aadhaar or Driving License).',
        'Previous dental prescriptions, X-rays, or treatment records (if available).',
        'List of current medical conditions, allergies, or regular medications.',
      ],
    },
    {
      icon: RotateCcw,
      title: 'Rescheduling & Cancellations',
      items: [
        'Reschedule online at least 4 hours in advance using your reference code.',
        'Cancelled slots are automatically returned to our public availability calendar.',
        'No cancellation penalty fee is charged for advance notice.',
      ],
    },
    {
      icon: Shield,
      title: 'Patient Privacy & Confidentiality',
      items: [
        'We only collect the minimum details required to manage your appointment.',
        'Patient contact data is never shared with third-party advertisers.',
        'Medical history discussed in consultation remains strictly confidential.',
      ],
    },
    {
      icon: PhoneCall,
      title: 'Emergency Assistance',
      items: [
        'For sudden acute toothaches or facial trauma, call our helpline: +91 94825 84402.',
        'Walk-in emergencies are evaluated based on clinical triage and doctor availability.',
        'Clinic location: Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga.',
      ],
    },
  ];

  return (
    <section id="patient-info" className="py-16 md:py-24 bg-[#F7FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
            Patient Support & Guidelines
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
            Helpful Information for Your Appointment
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Clear protocols designed to make your clinical visit smooth, comfortable, and well-prepared.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {infoCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5F1] text-[#123E46] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#287A9B]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#123E46]">
                      {card.title}
                    </h3>
                  </div>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#64748B]">
                    {card.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#287A9B] font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Help Footer Strip */}
        <div className="mt-10 p-6 bg-[#123E46] rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold text-teal-100">
              Have Questions or Require Special Assistance?
            </h4>
            <p className="text-xs sm:text-sm text-teal-200/80">
              Our front desk reception team in Gandhi Nagar, Shivamogga is ready to assist you.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onContactClick}
              className="px-5 py-2.5 bg-white text-[#123E46] hover:bg-teal-50 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Contact Clinic Desk
            </button>
            <button
              onClick={onOpenCancellationPolicy}
              className="px-4 py-2.5 text-teal-200 hover:text-white text-xs underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancellation Policy
            </button>
            <button
              onClick={onOpenPrivacyPolicy}
              className="px-4 py-2.5 text-teal-200 hover:text-white text-xs underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
