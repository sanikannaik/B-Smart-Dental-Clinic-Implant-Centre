import React from 'react';
import { ShieldCheck, HeartHandshake, Sparkles, MapPin, Phone } from 'lucide-react';
import { CLINIC_IMAGES } from '../assets/media';

interface AboutSectionProps {
  onBookClick: () => void;
  onContactClick: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onBookClick,
  onContactClick,
}) => {
  return (
    <section id="about" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image with overlay */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
              <img
                src={CLINIC_IMAGES.operatory}
                alt="B-Smart Dental Clinic treatment facility"
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-4 p-4 rounded-xl bg-[#F7FAFC] border border-slate-200 text-xs text-[#64748B] flex items-center justify-between">
              <span className="font-semibold text-[#123E46]">Shivamogga Practice</span>
              <span>Gandhi Nagar · Savalanga Road</span>
            </div>
          </div>

          {/* Right Column: Authentic Clinic Introduction */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
                About B-Smart Dental
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
                Dedicated Oral Healthcare in Shivamogga
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#24313A] leading-relaxed">
              B-Smart Dental Clinic & Implant Centre is a private dental practice situated on Savalanga Road, 1st Main Road, Gandhi Nagar in Shivamogga, Karnataka. We are focused on providing transparent, gentle, and comprehensive dental treatments ranging from preventative cleanings to advanced dental implants.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5F1] text-[#123E46] flex items-center justify-center shrink-0 mt-0.5">
                  <HeartHandshake className="w-5 h-5 text-[#287A9B]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123E46]">Patient-First Philosophy</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    We listen carefully to your oral health concerns, diagnose thoroughly using intraoral examinations, and present clear, honest treatment choices without high-pressure recommendations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5F1] text-[#123E46] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-[#287A9B]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123E46]">Hygiene & Autoclave Sterilisation</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    Patient safety is fundamental. Every dental instrument undergoes rigorous cleaning and autoclave sterilization between visits, ensuring pristine clinical operatory standards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#E8F5F1] text-[#123E46] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#287A9B]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123E46]">Dental Implantology Focus</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    Our implant centre offers personalized assessment for single and multi-tooth replacements, aiming to restore stable mastication, bone support, and natural aesthetics.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onBookClick}
                className="px-6 py-3 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Book a Consultation
              </button>

              <button
                onClick={onContactClick}
                className="px-6 py-3 bg-white hover:bg-[#F7FAFC] border border-[#CBD5E1] text-[#123E46] text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Contact Our Front Desk
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
