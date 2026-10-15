# B-Smart Dental Clinic & Implant Centre

> A modern, responsive, production-ready dental clinic web application and persistent online appointment scheduling system for B-Smart Dental Clinic & Implant Centre in Shivamogga, Karnataka, India.

---

## 1. Practice & Business Details

- **Business Name**: B-Smart Dental Clinic & Implant Centre
- **Category**: Dental Clinic & Implant Centre
- **Physical Address**: Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201, India
- **Phone**: +91 94825 84402
- **Google Maps**: [https://maps.app.goo.gl/QBv6DBY7oKg2dL7o8](https://maps.app.goo.gl/QBv6DBY7oKg2dL7o8)
- **Timezone**: Asia/Kolkata (IST)
- **Currency**: Indian Rupees (₹ INR)
- **Language**: English with built-in Kannada (ಕನ್ನಡ) localization architecture.

### Verified Operating Hours
- **Monday – Saturday**:
  - Morning Session: `10:30 AM – 1:00 PM`
  - Evening Session: `5:00 PM – 10:00 PM`
- **Sunday**: Unconfirmed / Closed by default. Sunday appointments are disabled until activated by the clinic administrator in the dashboard.

---

## 2. Core Architectural Features

1. **Persistent & Concurrency-Safe Booking Engine**:
   - Built with an atomic, mutex-serialized database transaction engine preventing double-bookings.
   - Evaluates slot start/end times against service duration, operating sessions, holidays, and administrative blocked slots.
   - Assigns unique public booking references (e.g., `BSMART-26A4-9F`) and secure cryptographic reschedule tokens.

2. **Patient Self-Service (Lookup, Reschedule & Cancel)**:
   - Privacy-preserving lookup requiring both Appointment Reference and registered mobile number.
   - Self-service rescheduling within allowable clinic notice policy (minimum 4 hours).
   - Cancellation with instant automated release of the time slot back to the public booking calendar.
   - One-click `.ics` calendar file generation for Google Calendar, Apple Calendar, and Outlook.

3. **Dentist Association Verification**:
   - Practitioner Dr. Srinidhi Bhat's profile is configured in the database with an approval gate (`isConfirmedAndApproved: false`).
   - The public site displays a neutral, compliant "Verification Pending" notice until an authorized clinic administrator reviews and clicks "Verify & Approve for Publication".

4. **Clinic Administration Dashboard (`/admin` / Top Bar Staff Link)**:
   - Role-based staff authentication (Admin / Receptionist).
   - **Initial Staff Logins**:
     - Administrator: `admin@bsmartdental.in` / `admin123`
     - Receptionist: `reception@bsmartdental.in` / `reception123`
   - Real-time KPI summary (Today's, Pending, Confirmed, Completed, Cancelled).
   - Filterable appointments table and search by reference/patient name/mobile.
   - Status transitions (Pending → Confirmed, Completed, No-Show, Cancelled).
   - Private internal staff notes attached to appointments.
   - Operating hours and Sunday open/closed controls.
   - Service catalogue manager (toggle published status, edit fees and slot duration).
   - Blocked time slots manager (for equipment sterilization, personal leave, or deep sanitization).
   - Patient inquiries inbox from the contact form.
   - Audit trail and notification dispatch log.

5. **Local SEO & Schema.org Structured Data**:
   - Configured with `Dentist` / `MedicalBusiness` JSON-LD schema with exact Shivamogga coordinates (`13.9326, 75.5683`), address, operating hours specifications, and OpenGraph social cards.
   - Naturally targeted for local queries: *Dentist in Shivamogga*, *Dental clinic in Shivamogga*, *Dental implants in Shivamogga*.

---

## 3. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons, Motion.
- **Backend**: Node.js with Express and Vite development middleware.
- **Data Persistence**: Concurrency-safe atomic transaction JSON database with async mutex locking and write-ahead temporary file renaming.
- **Development Runtime**: `tsx server.ts` running on port 3000.

---

## 4. Setup & Running Locally

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Opens the application at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

---

## 5. Production Staff Authentication & Supabase Setup

The B-Smart Dental Clinic administrative portal supports three resilient authentication tiers in production:

### Option 1: Netlify Site Environment Variables (Recommended & Instant)
In your Netlify Dashboard (`Site configuration` → `Environment variables`), add:
- `ADMIN_EMAIL`: Your clinic administrator email (e.g. `your-clinic-email@example.com` or `admin@bsmartdental.in`).
- `ADMIN_PASSWORD`: Your private administrator password (min 8 characters).
- *(Optional)* `ADMIN_NAME`: Administrator display name (e.g. `Dr. Srinidhi / Clinic Admin`).
- *(Optional)* `ADMIN_SETUP_KEY`: Master setup authorization key.

Once set in Netlify, redeploy or trigger a build. The administrator credentials become immediately active and automatically lock out default demo passwords.

### Option 2: Persistent Supabase `staff_users` Database Table
To store staff accounts in your Supabase project (`huiuqhqzglbrzzlbcheb`):
1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/huiuqhqzglbrzzlbcheb/sql/new).
2. Run the script provided in `supabase/schema.sql` (or copy it directly from the Admin Dashboard → **Supabase Database** tab).
3. To create or reset an administrator account via SQL, run:
```sql
INSERT INTO public.staff_users (email, name, role, password_hash)
VALUES (
    'your-clinic-email@example.com',
    'Clinic Administrator',
    'admin',
    encode(digest('YOUR_SECRET_PASSWORD' || 'bsmart_salt_2026', 'sha256'), 'hex')
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = encode(digest('YOUR_SECRET_PASSWORD' || 'bsmart_salt_2026', 'sha256'), 'hex'),
    updated_at = NOW();
```

### Option 3: In-App First-Time Setup / Reset Tool
On the website's Staff Authorization screen, switch to the **"Setup / Reset"** tab to register or reset your administrator account directly. The system securely hashes the password using cryptographic SHA-256 with the clinic salt and stores it in Supabase.

---

## 6. Integrating SMS & WhatsApp Gateways

The system logs all outgoing notifications in `data/clinic_data.json` and exposes them in the Admin Dashboard. To connect live delivery:
- **SMS Gateway**: Register on a TRAI-DLT compliant Indian SMS provider (e.g. Fast2SMS, Twilio India, Gupshup). Set `SMS_API_KEY` and `SMS_SENDER_ID` in `.env`.
- **WhatsApp**: Create a Meta WhatsApp Business Cloud API app, get template approval for appointment confirmations, and set webhook credentials.

