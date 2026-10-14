import React from 'react';
import { Stethoscope, HeartPulse, CalendarCheck, MapPinned } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const trustCards = [
    {
      icon: Stethoscope,
      title: 'Personalised Consultations',
      description: 'Each patient receives an unhurried clinical evaluation, intraoral examination, and a step-by-step discussion of findings before starting any procedure.',
    },
    {
      icon: HeartPulse,
      title: 'Patient-Focused Care',
      description: 'We prioritize patient comfort and gentle dental techniques, creating a calm, supportive environment for routine care and restorative procedures.',
    },
    {
      icon: CalendarCheck,
      title: 'Convenient Appointment Booking',
      description: 'Direct online scheduling allows you to choose your service, date, and morning or evening time slot with instant reference confirmation.',
    },
    {
      icon: MapPinned,
      title: 'Central Shivamogga Location',
      description: 'Conveniently situated on Savalanga Road, 1st Main Road, Gandhi Nagar, providing accessible dental services for families across Shivamogga.',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123E46] tracking-tight">
            Our Healthcare Commitments
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Authentic oral healthcare founded on clinical honesty, clear communication, and modern hygiene standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0] hover:border-[#287A9B]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-lg bg-[#E8F5F1] text-[#123E46] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#287A9B]" />
                  </div>
                  <h3 className="text-base font-bold text-[#123E46] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
