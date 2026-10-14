import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'kn';

interface Translations {
  [key: string]: {
    en: string;
    kn: string;
  };
}

export const dictionary: Translations = {
  brandName: {
    en: 'B-Smart Dental Clinic & Implant Centre',
    kn: 'ಬಿ-ಸ್ಮಾರ್ಟ್ ದಂತ ಚಿಕಿತ್ಸಾಲಯ ಮತ್ತು ಇಂಪ್ಲಾಂಟ್ ಸೆಂಟರ್',
  },
  tagline: {
    en: 'Your Smile Deserves Expert Care',
    kn: 'ನಿಮ್ಮ ಮುಗುಳುನಗೆಗೆ ತಜ್ಞರ ಆರೈಕೆ',
  },
  bookAppointment: {
    en: 'Book Appointment',
    kn: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
  },
  exploreServices: {
    en: 'Explore Services',
    kn: 'ನಮ್ಮ ಸೇವೆಗಳು',
  },
  navHome: { en: 'Home', kn: 'ಮುಖಪುಟ' },
  navAbout: { en: 'About Us', kn: 'ನಮ್ಮ ಬಗ್ಗೆ' },
  navServices: { en: 'Services', kn: 'ಸೇವೆಗಳು' },
  navDentist: { en: 'Our Dentist', kn: 'ದಂತ ವೈದ್ಯರು' },
  navPatientInfo: { en: 'Patient Info', kn: 'ರೋಗಿಗಳ ಮಾಹಿತಿ' },
  navContact: { en: 'Contact & Location', kn: 'ಸಂಪರ್ಕ ಮತ್ತು ವಿಳಾಸ' },
  navManage: { en: 'My Booking', kn: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್' },
  staffLogin: { en: 'Clinic Staff', kn: 'ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್' },
  callClinic: { en: 'Call Clinic', kn: 'ಕರೆ ಮಾಡಿ' },
  getDirections: { en: 'Get Directions', kn: 'ದಾರಿ ನಕ್ಷೆ' },
  operatingHours: { en: 'Operating Hours', kn: 'ಕಾರ್ಯ ನಿರ್ವಹಣೆ ಸಮಯ' },
  morningSession: { en: 'Morning Session', kn: 'ಬೆಳಗಿನ ಅವಧಿ' },
  eveningSession: { en: 'Evening Session', kn: 'ಸಂಜೆಯ ಅವಧಿ' },
  consultationFee: { en: 'Consultation Fee', kn: 'ಸಮಾಲೋಚನೆ ಶುಲ್ಕ' },
  pricingContact: { en: 'Contact the clinic for pricing', kn: 'ಶುಲ್ಕದ ವಿವರಗಳಿಗಾಗಿ ಕ್ಲಿನಿಕ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    if (dictionary[key] && dictionary[key][language]) {
      return dictionary[key][language];
    }
    return dictionary[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
