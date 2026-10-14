import React from 'react';
import { Phone, MapPin, Clock, Calendar, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { ClinicInfo, DayOperatingHours } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  clinicInfo: ClinicInfo;
  operatingHours: DayOperatingHours[];
  onBookClick: () => void;
  onManageClick: () => void;
  onAdminClick: () => void;
  onOpenPrivacy: () => void;
  onOpenCancellation: () => void;
  onOpenTerms: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  clinicInfo,
  operatingHours,
  onBookClick,
  onManageClick,
  onAdminClick,
  onOpenPrivacy,
  onOpenCancellation,
  onOpenTerms,
  onNavigate,
}) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#123E46] text-[#E8F5F1] pt-16 pb-12 border-t border-[#1b555f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-teal-800/80">
          {/* Brand & Address Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                B-SMART DENTAL CLINIC
              </div>
              <div className="text-xs font-semibold text-teal-300 tracking-wider uppercase mt-0.5">
                & Implant Centre · Shivamogga
              </div>
            </div>

            <p className="text-xs text-teal-200/80 leading-relaxed max-w-sm">
              Comprehensive oral healthcare and advanced dental implantology located on Savalanga Road, Gandhi Nagar, Shivamogga, Karnataka.
            </p>

            <div className="space-y-2 text-xs text-teal-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                <span>Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-300 shrink-0" />
                <a href={`tel:${clinicInfo.phone.replace(/\s+/g, '')}`} className="hover:text-white font-mono font-semibold tabular-nums">
                  {clinicInfo.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs text-teal-200">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  About Our Practice
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer">
                  Dental Treatments & Implants
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dentist')} className="hover:text-white transition-colors cursor-pointer">
                  Practitioner Credentials
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('patient-info')} className="hover:text-white transition-colors cursor-pointer">
                  Patient Preparation & Policies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                  Location Map & Contact
                </button>
              </li>
              <li className="pt-1">
                <button onClick={onManageClick} className="text-teal-300 hover:text-white underline underline-offset-2 cursor-pointer font-medium">
                  Look Up / Reschedule Appointment
                </button>
              </li>
            </ul>
          </div>

          {/* Operating Hours Column (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Operating Hours
            </h3>
            <div className="space-y-1.5 text-xs text-teal-200">
              <div className="font-semibold text-white">Monday – Saturday</div>
              <div className="text-[11px] tabular-nums pl-2 border-l border-teal-700">
                Morning: 10:30 AM – 1:00 PM<br />
                Evening: 5:00 PM – 10:00 PM
              </div>
              <div className="pt-1.5">
                <span className="font-semibold text-white">Sunday:</span>{' '}
                <span className="text-teal-300 text-[11px]">By Administrative Arrangement Only</span>
              </div>
              <div className="text-[10px] text-teal-300/70 pt-1">
                Timezone: Asia/Kolkata (IST)
              </div>
            </div>
          </div>

          {/* Fast Booking CTA (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Online Booking
            </h3>
            <p className="text-xs text-teal-200/80">
              Select your service and available slot in seconds.
            </p>
            <button
              onClick={onBookClick}
              className="w-full py-2.5 px-3 bg-white hover:bg-teal-50 text-[#123E46] text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-[#287A9B]" />
              <span>Book Appointment</span>
            </button>
            <div className="pt-2">
              <button
                onClick={onAdminClick}
                className="text-[11px] text-teal-300 hover:text-white underline cursor-pointer"
              >
                Clinic Staff Console
              </button>
            </div>
          </div>
        </div>

        {/* Footer Legal & Accessibility Strip */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-teal-300/80">
          <div>
            © {new Date().getFullYear()} B-Smart Dental Clinic & Implant Centre. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={onOpenCancellation} className="hover:text-white transition-colors cursor-pointer">
              Cancellation Policy
            </button>
            <span>·</span>
            <button onClick={onOpenTerms} className="hover:text-white transition-colors cursor-pointer">
              Terms & Conditions
            </button>
            <span>·</span>
            <span className="text-teal-300/60">
              Shivamogga, Karnataka 577201
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
