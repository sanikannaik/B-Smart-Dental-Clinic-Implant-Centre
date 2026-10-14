import React from 'react';
import { Calendar, UserCheck2, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BookingStepsProps {
  onStartBooking: () => void;
}

export const BookingSteps: React.FC<BookingStepsProps> = ({ onStartBooking }) => {
  const { t } = useLanguage();

  const steps = [
    {
      number: '01',
      title: 'Choose Dental Service',
      description: 'Select your clinical care reason from general dental consultations, dental implants, teeth scaling, root canal therapy, or restorative care.',
      icon: ClipboardCheck,
    },
    {
      number: '02',
      title: 'Select Date & Live Slot',
      description: 'Pick an open clinic date and available morning (10:30 AM–1:00 PM) or evening (5:00 PM–10:00 PM) slot calculated in real time.',
      icon: Calendar,
    },
    {
      number: '03',
      title: 'Confirm & Receive Reference',
      description: 'Enter your name and mobile number. Receive a unique booking reference code, clinic directions, and instant calendar export.',
      icon: UserCheck2,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
            Seamless Patient Experience
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
            How Online Booking Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Three straightforward steps to secure your visit without phone queues or scheduling uncertainty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative p-8 rounded-2xl bg-[#F7FAFC] border border-[#E2E8F0] hover:border-[#287A9B]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-[#287A9B]/30 font-mono tracking-tighter">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] text-[#123E46] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#287A9B]" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#123E46] mb-3">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-[#123E46]">
                  <span>Step {idx + 1} of 3</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Trigger */}
        <div className="mt-12 text-center">
          <button
            onClick={onStartBooking}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-[#123E46] hover:bg-[#1a5560] active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-teal-300" />
            <span>{t('bookAppointment')} Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
