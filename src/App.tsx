import React, { useState, useEffect } from 'react';
import { clinicApi } from './services/api';
import {
  ClinicInfo,
  DayOperatingHours,
  DentistProfile,
  ServiceItem,
  HolidayItem,
  BookingPolicy,
} from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TrustSection } from './components/TrustSection';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { DentistSection } from './components/DentistSection';
import { ClinicGallery } from './components/ClinicGallery';
import { BookingSteps } from './components/BookingSteps';
import { PatientInfoSection } from './components/PatientInfoSection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { BookingWorkflow } from './components/BookingWorkflow';
import { ManageBookingModal } from './components/ManageBookingModal';
import { ContactModal } from './components/ContactModal';
import { AdminDashboard } from './components/AdminDashboard';
import { PolicyModals } from './components/PolicyModals';
import { Calendar, Phone, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { t } = useLanguage();

  // Clinic Remote Data
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [operatingHours, setOperatingHours] = useState<DayOperatingHours[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [dentists, setDentists] = useState<DentistProfile[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Dialog States
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [preselectedService, setPreselectedService] = useState<ServiceItem | null>(null);

  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);
  const [manageInitialRef, setManageInitialRef] = useState<string>('');
  const [manageInitialPhone, setManageInitialPhone] = useState<string>('');

  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'cancellation' | 'terms' | null>(null);

  // Active Scroll / Nav Section
  const [currentSection, setCurrentSection] = useState<string>('hero');

  const fetchClinicData = () => {
    setLoading(true);
    clinicApi
      .getClinicInfo()
      .then((res) => {
        setClinicInfo(res.clinicInfo);
        setOperatingHours(res.operatingHours);
        setServices(res.services);
        setDentists(res.dentists);
        setHolidays(res.holidays);
        setBookingPolicy(res.bookingPolicy);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load clinic information:', err);
        setError(err.message || 'Could not connect to the clinic server.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClinicData();
  }, []);

  const handleNavigate = (sectionId: string) => {
    setCurrentSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartBooking = (service?: ServiceItem) => {
    setPreselectedService(service || null);
    setBookingModalOpen(true);
  };

  const handleOpenManageBooking = (ref: string = '', phone: string = '') => {
    setManageInitialRef(ref);
    setManageInitialPhone(phone);
    setManageModalOpen(true);
  };

  if (loading && !clinicInfo) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-3 border-[#123E46] border-t-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[#123E46]">B-Smart Dental Clinic & Implant Centre</h2>
        <p className="text-xs text-[#64748B] mt-1">Connecting to clinic database...</p>
      </div>
    );
  }

  if (error && !clinicInfo) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 bg-white rounded-2xl border border-red-200 shadow-md space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-red-900">Connection Error</h2>
          <p className="text-xs text-red-700">{error}</p>
          <button
            onClick={fetchClinicData}
            className="px-5 py-2.5 bg-[#123E46] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const primaryDentist = dentists[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFC] text-[#24313A]">
      {/* Primary Navigation */}
      <Navbar
        onBookClick={() => handleStartBooking()}
        onManageClick={() => handleOpenManageBooking()}
        onAdminClick={() => setAdminModalOpen(true)}
        onNavigate={handleNavigate}
        currentSection={currentSection}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onBookClick={() => handleStartBooking()}
          onExploreServices={() => handleNavigate('services')}
        />

        {/* Trust Section */}
        <TrustSection />

        {/* About Section */}
        <AboutSection
          onBookClick={() => handleStartBooking()}
          onContactClick={() => setContactModalOpen(true)}
        />

        {/* Featured Services Section */}
        <ServicesSection
          services={services}
          onBookService={(s) => handleStartBooking(s)}
          onEnquire={() => setContactModalOpen(true)}
        />

        {/* Meet the Dentist Section (Checks Approval) */}
        <DentistSection
          dentist={primaryDentist}
          onBookClick={() => handleStartBooking()}
          onAdminClick={() => setAdminModalOpen(true)}
        />

        {/* Clinic Photographs Gallery */}
        <ClinicGallery />

        {/* How Booking Works */}
        <BookingSteps onStartBooking={() => handleStartBooking()} />

        {/* Patient Guidelines & Help */}
        <PatientInfoSection
          onOpenCancellationPolicy={() => setActivePolicy('cancellation')}
          onOpenPrivacyPolicy={() => setActivePolicy('privacy')}
          onContactClick={() => setContactModalOpen(true)}
        />

        {/* Location & Directions */}
        {clinicInfo && (
          <LocationSection
            clinicInfo={clinicInfo}
            operatingHours={operatingHours}
            onBookClick={() => handleStartBooking()}
          />
        )}

        {/* Final Call to Action */}
        <section className="py-20 bg-gradient-to-r from-[#123E46] via-[#1a5560] to-[#287A9B] text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Ready to Take Care of Your Smile?
            </h2>
            <p className="text-base sm:text-lg text-teal-100 max-w-2xl mx-auto leading-relaxed">
              Experience gentle, attentive dentistry with transparent scheduling. Book your appointment at B-Smart Dental Clinic & Implant Centre in Shivamogga today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleStartBooking()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-[#123E46] hover:bg-teal-50 active:scale-[0.98] text-base font-bold rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-5 h-5 text-[#287A9B]" />
                <span>Book Your Visit</span>
              </button>

              <a
                href={`tel:${clinicInfo?.phone.replace(/\s+/g, '')}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-transparent hover:bg-white/10 border border-teal-300 text-white text-base font-semibold rounded-xl transition-all whitespace-nowrap"
              >
                <Phone className="w-5 h-5 text-teal-300" />
                <span>Call +91 94825 84402</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      {clinicInfo && (
        <Footer
          clinicInfo={clinicInfo}
          operatingHours={operatingHours}
          onBookClick={() => handleStartBooking()}
          onManageClick={() => handleOpenManageBooking()}
          onAdminClick={() => setAdminModalOpen(true)}
          onOpenPrivacy={() => setActivePolicy('privacy')}
          onOpenCancellation={() => setActivePolicy('cancellation')}
          onOpenTerms={() => setActivePolicy('terms')}
          onNavigate={handleNavigate}
        />
      )}

      {/* Interactive Booking Workflow Modal */}
      {bookingModalOpen && (
        <BookingWorkflow
          services={services}
          dentists={dentists}
          operatingHours={operatingHours}
          holidays={holidays}
          initialService={preselectedService}
          onClose={() => setBookingModalOpen(false)}
          onManageBooking={(ref, phone) => {
            setBookingModalOpen(false);
            handleOpenManageBooking(ref, phone);
          }}
        />
      )}

      {/* Patient Self-Service Reschedule / Cancel Modal */}
      {manageModalOpen && (
        <ManageBookingModal
          initialReference={manageInitialRef}
          initialPhone={manageInitialPhone}
          services={services}
          operatingHours={operatingHours}
          holidays={holidays}
          onClose={() => setManageModalOpen(false)}
        />
      )}

      {/* Contact Enquiry Modal */}
      {contactModalOpen && clinicInfo && (
        <ContactModal
          clinicInfo={clinicInfo}
          onClose={() => setContactModalOpen(false)}
        />
      )}

      {/* Clinic Administration Dashboard Modal */}
      {adminModalOpen && (
        <AdminDashboard
          onClose={() => setAdminModalOpen(false)}
          onRefreshPublicData={fetchClinicData}
        />
      )}

      {/* Policy Modals */}
      <PolicyModals
        type={activePolicy}
        onClose={() => setActivePolicy(null)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
}

export default App;
