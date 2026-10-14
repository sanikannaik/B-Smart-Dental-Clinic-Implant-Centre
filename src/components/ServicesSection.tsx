import React, { useState } from 'react';
import { ServiceItem } from '../types';
import { Calendar, Clock, ChevronRight, Info, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ServicesSectionProps {
  services: ServiceItem[];
  onBookService: (service: ServiceItem) => void;
  onEnquire: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onBookService,
  onEnquire,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'general', label: 'General & Diagnostics' },
    { id: 'implants', label: 'Dental Implants' },
    { id: 'restorative', label: 'Restorative & Endodontics' },
    { id: 'preventive', label: 'Preventive Care' },
    { id: 'surgical', label: 'Oral Surgery' },
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  return (
    <section id="services" className="py-16 md:py-24 bg-[#F7FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
              Clinical Specialities
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
              Verified Dental Services in Shivamogga
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
              Carefully performed procedures using modern instruments and patient-centered protocols. Published treatments have been confirmed by clinic administration.
            </p>
          </div>

          <div className="text-xs text-[#64748B] bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs max-w-sm">
            <span className="font-semibold text-[#123E46] block mb-0.5">Clinical Pricing Note:</span>
            Treatment complexity varies per patient. Fees are finalized only after intraoral diagnosis by the dentist.
          </div>
        </div>

        {/* Category Filter Tabs (Segmented Button Controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#123E46] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#123E46] border border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#287A9B]/40 hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#64748B] mb-3">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#287A9B]" />
                    <span className="tabular-nums">{service.durationMinutes} minutes slot</span>
                  </span>
                  <span className="capitalize text-[11px] font-semibold text-[#287A9B] bg-[#E8F5F1] px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#123E46] mb-2 leading-snug">
                  {service.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#64748B] line-clamp-3 leading-relaxed mb-4">
                  {service.description}
                </p>

                <div className="pt-3 border-t border-slate-100 mb-5">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Indicative Cost
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#123E46]">
                    {service.optionalPrice || 'Contact the clinic for pricing'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => onBookService(service)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#123E46] hover:bg-[#1b5560] active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-300" />
                  <span>{t('bookAppointment')}</span>
                </button>

                <button
                  onClick={() => setActiveModalService(service)}
                  className="inline-flex items-center justify-center gap-1 py-2.5 px-3 bg-white hover:bg-[#F7FAFC] border border-[#CBD5E1] text-[#123E46] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="View service details"
                >
                  <Info className="w-3.5 h-3.5 text-[#287A9B]" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Clinical Pricing Transparency Statement */}
        <div className="mt-12 p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#287A9B] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#123E46]">Need a customized dental procedure quotation?</span>
              <p className="text-slate-500">Full diagnostic evaluation, radiographic views (if needed), and an itemized treatment schedule are explained prior to any intervention.</p>
            </div>
          </div>
          <button
            onClick={onEnquire}
            className="px-4 py-2 bg-[#E8F5F1] text-[#123E46] hover:bg-[#d8efe8] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Enquire With Reception
          </button>
        </div>
      </div>

      {/* Service Detail Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-[#287A9B] bg-[#E8F5F1] px-2 py-0.5 rounded uppercase">
                  {activeModalService.category}
                </span>
                <h3 className="text-xl font-bold text-[#123E46] mt-2">
                  {activeModalService.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalService(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-[#64748B]">
              <p className="leading-relaxed text-[#24313A]">
                {activeModalService.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7FAFC] rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Standard Slot Duration:</span>
                  <span className="font-bold text-[#123E46] tabular-nums">{activeModalService.durationMinutes} minutes</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Pricing Status:</span>
                  <span className="font-bold text-[#123E46]">{activeModalService.optionalPrice || 'Contact clinic for fee structure'}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Appointment Protocol:</span>
                Please arrive 10 minutes prior to your allocated slot for routine registration and medical history updates.
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  const s = activeModalService;
                  setActiveModalService(null);
                  onBookService(s);
                }}
                className="flex-1 py-3 px-4 bg-[#123E46] hover:bg-[#1a5560] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Book Appointment for {activeModalService.name}
              </button>
              <button
                onClick={() => setActiveModalService(null)}
                className="py-3 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
