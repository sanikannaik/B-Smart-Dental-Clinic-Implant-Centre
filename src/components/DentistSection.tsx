import React from 'react';
import { DentistProfile } from '../types';
import { Award, GraduationCap, ShieldCheck, UserCheck, Calendar, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DentistSectionProps {
  dentist: DentistProfile | null;
  onBookClick: () => void;
  onAdminClick: () => void;
}

export const DentistSection: React.FC<DentistSectionProps> = ({
  dentist,
  onBookClick,
  onAdminClick,
}) => {
  const { t } = useLanguage();
  const isApproved = dentist && dentist.isConfirmedAndApproved;

  return (
    <section id="dentist" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider mb-2">
            Clinical Leadership
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#123E46] tracking-tight">
            Our Dental Practitioner
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Committed to patient-focused clinical dental treatment in Shivamogga, Karnataka.
          </p>
        </div>

        {isApproved ? (
          /* Profile Displayed After Clinic Confirmation & Approval */
          <div className="max-w-4xl mx-auto bg-[#F7FAFC] rounded-2xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex flex-col items-center text-center">
                <div className="w-44 h-44 rounded-2xl bg-[#E8F5F1] border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-4">
                  {dentist.photoUrl ? (
                    <img
                      src={dentist.photoUrl}
                      alt={dentist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[#123E46] text-white flex items-center justify-center font-bold text-xl mb-2">
                        DS
                      </div>
                      <span className="text-xs font-semibold text-[#123E46]">Dental Surgeon</span>
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Clinic Practitioner</span>
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#123E46]">
                    {dentist.name}
                  </h3>
                  <p className="text-sm font-semibold text-[#287A9B] mt-0.5">
                    {dentist.designation}
                  </p>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-[#64748B]">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-[#287A9B] shrink-0 mt-0.5" />
                    <span><strong className="text-[#24313A]">Qualifications:</strong> {dentist.verifiedQualifications}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-[#287A9B] shrink-0 mt-0.5" />
                    <span><strong className="text-[#24313A]">Areas of Practice:</strong> General Dentistry, Restorative Care, Dental Implants Consultation</span>
                  </div>
                </div>

                <div className="pt-2 text-sm text-[#24313A] leading-relaxed">
                  <p>{dentist.biography}</p>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onBookClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-teal-300" />
                    <span>Schedule Consultation</span>
                  </button>
                  <span className="text-xs text-[#64748B]">
                    Clinic: Savalanga Road, Shivamogga
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Notice When Profile Is Under Administrative Verification */
          <div className="max-w-3xl mx-auto bg-[#F7FAFC] rounded-2xl border border-[#CBD5E1] p-8 sm:p-10 shadow-xs text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#E8F5F1] text-[#123E46] flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-[#287A9B]" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#287A9B] uppercase tracking-wider">
                Practitioner Verification Policy
              </div>
              <h3 className="text-xl font-bold text-[#123E46]">
                Associated Practitioner Profile Pending Clinic Confirmation
              </h3>
              <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
                In strict accordance with clinic transparency policies, practitioner credentials (including Dr. Srinidhi Bhat identified in professional directories) are displayed only upon formal confirmation by the clinic management.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-[#24313A] max-w-md mx-auto space-y-1">
              <p className="font-semibold text-[#123E46]">Appointments are actively accepted:</p>
              <p className="text-[#64748B]">
                Dental surgeries, dental implant consultations, and routine care are available during normal working hours at our Savalanga Road clinic.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onBookClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#123E46] hover:bg-[#1a5560] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-teal-300" />
                <span>{t('bookAppointment')}</span>
              </button>

              <button
                onClick={onAdminClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#287A9B]" />
                <span>Clinic Staff: Verify & Approve Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
