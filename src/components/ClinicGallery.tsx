import React, { useState } from 'react';
import { CLINIC_IMAGES } from '../assets/media';
import { ZoomIn, Sparkles, Building2, Stethoscope, Armchair } from 'lucide-react';

export const ClinicGallery: React.FC = () => {
  const [activePhoto, setActivePhoto] = useState<{ src: string; title: string; desc: string } | null>(null);

  const galleryItems = [
    {
      src: CLINIC_IMAGES.operatory,
      title: 'Dental Operatory & Treatment Suite',
      category: 'Treatment Facility',
      icon: Stethoscope,
      desc: 'Ergonomic dental operatory equipped with high-intensity surgical lighting, digital intraoral imaging, and multi-stage autoclave sterilization protocols.',
    },
    {
      src: CLINIC_IMAGES.implants,
      title: 'Implant Consultation & Precision Tools',
      category: 'Implantology Suite',
      icon: Sparkles,
      desc: 'Specialized clinical workspace for dental implant planning, bone density analysis, prosthetic restoration fittings, and precision surgical trays.',
    },
    {
      src: CLINIC_IMAGES.reception,
      title: 'Patient Waiting Lounge & Reception',
      category: 'Patient Comfort',
      icon: Armchair,
      desc: 'Serene, clean patient reception environment designed to reduce dental apprehension and ensure comfortable appointment registration.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F7FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
              Facility & Hygiene
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
              Our Clinic Environment
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#64748B]">
              Purpose-built spaces adhering to strict clinical hygiene, patient privacy, and comfort in Shivamogga.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#287A9B] bg-[#E8F5F1] px-3 py-1.5 rounded-lg border border-[#c6e4da] self-start md:self-auto font-medium">
            <Building2 className="w-4 h-4" />
            <span>Savalanga Road Clinic Premises</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button
                      onClick={() => setActivePhoto(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-[#123E46] text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#287A9B] font-semibold mb-1">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#123E46] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="relative max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={activePhoto.src}
                alt={activePhoto.title}
                className="max-h-[70vh] w-auto object-contain"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer"
                aria-label="Close photo view"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-bold text-[#123E46]">{activePhoto.title}</h4>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">{activePhoto.desc}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
