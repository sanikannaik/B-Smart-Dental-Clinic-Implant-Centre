-- ====================================================================
-- B-SMART DENTAL CLINIC & IMPLANT CENTRE - SUPABASE DATABASE SCHEMA
-- Project ID: huiuqhqzglbrzzlbcheb
-- Location: Shivamogga, Karnataka, India
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_reference VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    patient_email VARCHAR(255),
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    dentist_id VARCHAR(100) DEFAULT 'dr-srinidhi-bhat',
    dentist_name VARCHAR(255) DEFAULT 'Dr. Srinidhi Bhat',
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    appointment_note TEXT,
    internal_admin_note TEXT,
    reschedule_token VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy queries by date and phone
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON public.appointments(public_reference);

-- 3. Contact Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    subject VARCHAR(255) DEFAULT 'General Enquiry',
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    optional_price VARCHAR(100),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial services
INSERT INTO public.services (id, name, slug, category, description, duration_minutes, optional_price, is_published)
VALUES
    ('service-general-consult', 'General Dental Consultation', 'general-dental-consultation', 'general', 'Comprehensive clinical oral examination, digital intraoral assessment, treatment roadmap, and preventative oral health recommendations.', 30, '₹300 (Initial Examination & Consultation)', true),
    ('service-implants', 'Dental Implants', 'dental-implants', 'implants', 'Permanent, titanium-root dental replacements engineered to restore masticatory function, natural aesthetics, and preserve underlying jaw bone structure.', 45, 'Contact the clinic for pricing', true),
    ('service-teeth-cleaning', 'Teeth Cleaning & Scaling', 'teeth-cleaning', 'preventive', 'Ultrasonic scaling to safely remove calculus (tartar), stubborn plaque, and extrinsic stains, maintaining gingival health and fresh breath.', 30, 'Contact the clinic for pricing', true),
    ('service-root-canal', 'Root Canal Treatment (RCT)', 'root-canal-treatment', 'restorative', 'Precision endodontic therapy to eliminate root canal infection, alleviate toothache, and save severely decayed or traumatized natural teeth.', 45, 'Contact the clinic for pricing', true),
    ('service-crowns-bridges', 'Dental Crowns & Bridges', 'dental-crowns-bridges', 'restorative', 'Custom ceramic and zirconia restorations fabricated to rebuild fractured teeth, reinforce root canal-treated teeth, and bridge edentulous gaps.', 45, 'Contact the clinic for pricing', true),
    ('service-tooth-extraction', 'Tooth Extraction', 'tooth-extraction', 'surgical', 'Gentle, minimally invasive dental extraction for non-restorable, fractured, or problematic wisdom teeth with proper local anaesthesia and postoperative guidance.', 30, 'Contact the clinic for pricing', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Row Level Security (RLS) Configuration
-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts for bookings and enquiries (from the website form)
DROP POLICY IF EXISTS "Allow anonymous bookings" ON public.appointments;
CREATE POLICY "Allow anonymous bookings" ON public.appointments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read appointments" ON public.appointments;
CREATE POLICY "Allow anonymous read appointments" ON public.appointments
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous updates" ON public.appointments;
CREATE POLICY "Allow anonymous updates" ON public.appointments
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous enquiry submissions" ON public.enquiries;
CREATE POLICY "Allow anonymous enquiry submissions" ON public.enquiries
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read enquiries" ON public.enquiries;
CREATE POLICY "Allow anonymous read enquiries" ON public.enquiries
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public read services" ON public.services;
CREATE POLICY "Allow public read services" ON public.services
    FOR SELECT TO anon, authenticated
    USING (true);
