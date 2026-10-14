import React from 'react';
import { MapPin, Phone, Clock, ExternalLink, Navigation, Check } from 'lucide-react';
import { ClinicInfo, DayOperatingHours } from '../types';

interface LocationSectionProps {
  clinicInfo: ClinicInfo;
  operatingHours: DayOperatingHours[];
  onBookClick: () => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  clinicInfo,
  operatingHours,
  onBookClick,
}) => {
  return (
    <section id="contact" className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
            Visit & Contact
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
            Find Our Clinic in Shivamogga
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Easily accessible location on Savalanga Road with ample street parking and convenient reception access.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Clinic Address & Hours Details (5 cols) */}
          <div className="lg:col-span-5 bg-[#F7FAFC] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Address Block */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>Physical Address</span>
                </div>
                <h3 className="text-lg font-bold text-[#123E46] mb-1">
                  {clinicInfo.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#24313A] leading-relaxed">
                  Savalanga Road, 1st Main Road,<br />
                  Gandhi Nagar, Shivamogga,<br />
                  Karnataka 577201, India.
                </p>
              </div>

              {/* Phone & Contact Block */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
                  <Phone className="w-4 h-4" />
                  <span>Telephone & Helpline</span>
                </div>
                <a
                  href={`tel:${clinicInfo.phone.replace(/\s+/g, '')}`}
                  className="text-lg font-extrabold text-[#123E46] hover:text-[#287A9B] transition-colors tabular-nums inline-block"
                >
                  {clinicInfo.phone}
                </a>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Available for appointment enquiries and clinical emergencies.
                </p>
              </div>

              {/* Operating Hours Table */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Clinic Working Hours</span>
                </div>

                <div className="space-y-2 text-xs">
                  {operatingHours.map((oh) => (
                    <div
                      key={oh.weekday}
                      className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold text-[#24313A]">{oh.weekday}</span>
                      {oh.isOpen ? (
                        <span className="text-[#64748B] tabular-nums text-right">
                          {oh.morning.open}–{oh.morning.close} & {oh.evening.open}–{oh.evening.close}
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          Unconfirmed / Closed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              <a
                href={clinicInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Navigation className="w-4 h-4 text-teal-300" />
                <span>Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <a
                href={`tel:${clinicInfo.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-[#E8F5F1] text-[#123E46] border border-[#CBD5E1] text-xs font-semibold rounded-xl shadow-2xs transition-colors"
              >
                <Phone className="w-4 h-4 text-[#287A9B]" />
                <span>Call Clinic</span>
              </a>
            </div>
          </div>

          {/* Interactive Map Visual & Guidance (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs flex flex-col bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#123E46]">
                <MapPin className="w-4 h-4 text-[#287A9B]" />
                <span>Google Maps Location: Gandhi Nagar, Shivamogga</span>
              </div>
              <a
                href={clinicInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#287A9B] hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Open in Maps App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Map Frame Embed */}
            <div className="relative flex-1 min-h-[340px] bg-slate-100">
              <iframe
                title="B-Smart Dental Clinic Location Map"
                src="https://maps.google.com/maps?q=13.9326,75.5683+(B-Smart%20Dental%20Clinic%20%26%20Implant%20Centre)&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                width="100%"
                height="100%"
                className="w-full h-full min-h-[340px] border-0"
                loading="lazy"
              />
            </div>

            {/* Landmarks & Navigation Guidance */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#64748B]">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Located on Savalanga Road, 1st Main Road junction in Gandhi Nagar.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Close to major public transport stops and local amenities in Shivamogga.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
