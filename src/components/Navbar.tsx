import React, { useState } from 'react';
import { Calendar, Phone, Menu, X, UserCog, Clock, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onBookClick: () => void;
  onManageClick: () => void;
  onAdminClick: () => void;
  onNavigate: (sectionId: string) => void;
  currentSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBookClick,
  onManageClick,
  onAdminClick,
  onNavigate,
  currentSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  const navItems = [
    { id: 'about', label: t('navAbout') },
    { id: 'services', label: t('navServices') },
    { id: 'dentist', label: t('navDentist') },
    { id: 'patient-info', label: t('navPatientInfo') },
    { id: 'contact', label: t('navContact') },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
      {/* Top Banner Notice for Emergency & Location */}
      <div className="bg-[#123E46] text-[#E8F5F1] text-xs py-1.5 px-4 sm:px-8 border-b border-[#1b555f]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-medium">Savalanga Road, Gandhi Nagar, Shivamogga</span>
            <span className="hidden sm:inline text-teal-300">·</span>
            <span className="hidden sm:inline">Mon–Sat: 10:30 AM–1:00 PM & 5:00 PM–10:00 PM</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+919482584402"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium tabular-nums"
              title="Call B-Smart Dental Clinic"
            >
              <Phone className="w-3.5 h-3.5 text-teal-300" />
              <span>+91 94825 84402</span>
            </a>
            <button
              onClick={onManageClick}
              className="text-xs hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t('navManage')}
            </button>
            <button
              onClick={onAdminClick}
              className="inline-flex items-center gap-1 hover:text-white text-teal-300 transition-colors cursor-pointer"
              title="Clinic Staff Portal"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('staffLogin')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation obeying Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => handleNavClick('hero')}
          className="text-left group cursor-pointer shrink-0"
        >
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#123E46] group-hover:text-[#287A9B] transition-colors whitespace-nowrap">
            B-SMART DENTAL
          </div>
          <div className="text-[11px] font-semibold text-[#287A9B] tracking-wider uppercase">
            & Implant Centre · Shivamogga
          </div>
        </button>

        {/* Zone 2: Clean 4–5 single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#24313A]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`hover:text-[#287A9B] transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                currentSection === item.id
                  ? 'border-[#287A9B] text-[#287A9B] font-semibold'
                  : 'border-transparent text-[#24313A]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary CTA Button + Language Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#123E46] hover:bg-[#E8F5F1] rounded-md transition-colors border border-[#CBD5E1] cursor-pointer whitespace-nowrap"
            title="Toggle English / Kannada (ಕನ್ನಡ)"
          >
            <Globe className="w-3.5 h-3.5 text-[#287A9B]" />
            <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          <button
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#123E46] hover:bg-[#1a5560] active:scale-[0.98] rounded-lg shadow-xs hover:shadow transition-all whitespace-nowrap cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-teal-300" />
            <span>{t('bookAppointment')}</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#24313A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2 text-base font-medium rounded-md transition-colors cursor-pointer ${
                  currentSection === item.id
                    ? 'bg-[#E8F5F1] text-[#123E46] font-semibold'
                    : 'text-[#24313A] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#123E46] hover:bg-[#1a5560] rounded-lg shadow-xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-teal-300" />
              <span>{t('bookAppointment')}</span>
            </button>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onManageClick();
                }}
                className="text-xs text-[#287A9B] font-medium underline underline-offset-2 py-1"
              >
                {t('navManage')}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAdminClick();
                }}
                className="text-xs text-slate-500 hover:text-slate-900 py-1"
              >
                {t('staffLogin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
