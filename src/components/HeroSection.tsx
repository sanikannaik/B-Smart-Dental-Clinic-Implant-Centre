import React from 'react';
import { Calendar, ArrowRight, ShieldCheck, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { CLINIC_IMAGES } from '../assets/media';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onBookClick: () => void;
  onExploreServices: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookClick,
  onExploreServices,
}) => {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden bg-gradient-to-b from-[#E8F5F1]/30 via-[#F7FAFC] to-[#F7FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Regional Trust Marker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#123E46] bg-[#E8F5F1] px-3 py-1.5 rounded-md border border-[#cbe8df]">
              <MapPin className="w-3.5 h-3.5 text-[#287A9B]" />
              <span>Savalanga Road, Gandhi Nagar · Shivamogga, Karnataka</span>
            </div>

            {/* Display Headline with text-wrap: balance */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-[#123E46] tracking-tight leading-[1.15] text-balance">
              Your Smile Deserves <span className="text-[#287A9B]">Expert Care</span>.
            </h1>

            {/* Value Proposition Description */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl">
              Discover personalised dental care in a welcoming, hygienic environment. Book your visit with B-Smart Dental Clinic & Implant Centre in Shivamogga for routine check-ups, restorative dentistry, and advanced dental implants.
            </p>

            {/* Operating Hours & Session Highlight */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#123E46] uppercase tracking-wider">
                <Clock className="w-4 h-4 text-[#287A9B]" />
                <span>Operating Sessions (Monday – Saturday)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#24313A]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#287A9B]" />
                  <span className="font-semibold">Morning:</span>
                  <span className="tabular-nums text-[#64748B]">10:30 AM – 1:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#123E46]" />
                  <span className="font-semibold">Evening:</span>
                  <span className="tabular-nums text-[#64748B]">5:00 PM – 10:00 PM</span>
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] pt-1 border-t border-slate-100">
                *Sunday visits are scheduled by administrative arrangement only.
              </div>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onBookClick}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-[#123E46] hover:bg-[#1a5560] active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-5 h-5 text-teal-300" />
                <span>{t('bookAppointment')}</span>
              </button>

              <button
                onClick={onExploreServices}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-[#123E46] hover:text-[#287A9B] bg-white hover:bg-[#E8F5F1]/50 border border-[#CBD5E1] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{t('exploreServices')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clean unboxed clinical trust cues */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transparent Appointment Scheduling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sterile Operatory Standards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Patient-Focused Consultations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-white">
              <img
                src={CLINIC_IMAGES.hero}
                alt="B-Smart Dental Clinic modern reception and consultation lounge"
                className="w-full h-80 sm:h-96 lg:h-[460px] object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback container if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-[460px] bg-gradient-to-br from-[#123E46] to-[#287A9B] flex flex-col items-center justify-center text-white p-8 text-center';
                    fallback.innerHTML = '<h3 class="text-xl font-bold mb-2">B-Smart Dental Clinic</h3><p class="text-sm text-teal-100">Modern Oral Healthcare in Shivamogga</p>';
                    parent.appendChild(fallback);
                  }
                }}
              />

              {/* Verified Practice Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#123E46]">B-Smart Dental Clinic & Implant Centre</h4>
                    <p className="text-xs text-[#64748B]">Comprehensive dentistry & dental implants</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-[#287A9B] bg-[#E8F5F1] px-2 py-0.5 rounded">
                      Shivamogga
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
