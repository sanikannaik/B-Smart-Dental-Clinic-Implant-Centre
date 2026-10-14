import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ClinicInfo,
  DayOperatingHours,
  DentistProfile,
  ServiceItem,
  Appointment,
  BlockedSlot,
  HolidayItem,
  BookingPolicy,
  NotificationLog,
  AuditLog,
  Enquiry,
  StaffUser,
} from '../src/types/index.ts';

interface DatabaseSchema {
  clinicInfo: ClinicInfo;
  operatingHours: DayOperatingHours[];
  dentists: DentistProfile[];
  services: ServiceItem[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  holidays: HolidayItem[];
  bookingPolicy: BookingPolicy;
  notificationLogs: NotificationLog[];
  auditLogs: AuditLog[];
  enquiries: Enquiry[];
  staffUsers: (StaffUser & { passwordHash: string })[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data/clinic_data.json');

// Simple SHA-256 password hasher for staff accounts
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'bsmart_salt_2026').digest('hex');
}

const INITIAL_DATA: DatabaseSchema = {
  clinicInfo: {
    name: 'B-Smart Dental Clinic & Implant Centre',
    tagline: 'Your Smile Deserves Expert Care',
    category: 'Dental clinic and implant centre',
    address: 'Savalanga Road, 1st Main Road, Gandhi Nagar, Shivamogga, Karnataka 577201, India',
    locality: 'Gandhi Nagar, Savalanga Road',
    city: 'Shivamogga',
    state: 'Karnataka',
    postalCode: '577201',
    phone: '+91 94825 84402',
    whatsappPhone: '+91 94825 84402',
    email: 'contact@bsmartdental.in',
    googleMapsUrl: 'https://maps.app.goo.gl/QBv6DBY7oKg2dL7o8',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    emergencyNotice: 'For urgent dental pain or emergencies during clinic hours, contact our clinic hotline directly at +91 94825 84402.',
  },
  operatingHours: [
    {
      weekday: 'Monday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Tuesday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Wednesday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Thursday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Friday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Saturday',
      isOpen: true,
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '22:00' },
    },
    {
      weekday: 'Sunday',
      isOpen: false, // Explicitly closed/unconfirmed per clinic business specifications
      morning: { open: '10:30', close: '13:00' },
      evening: { open: '17:00', close: '20:00' },
    },
  ],
  dentists: [
    {
      id: 'dr-srinidhi-bhat',
      name: 'Dr. Srinidhi Bhat',
      designation: 'Dental Surgeon & Implant Specialist',
      verifiedQualifications: 'BDS, Implantology Training (Pending Verification)',
      biography: 'Experienced practitioner focusing on comprehensive oral health, gentle surgical techniques, and durable implant-supported prosthetics in Shivamogga.',
      photoUrl: '',
      isConfirmedAndApproved: false, // Per specification: "Display the dentist's name only after the clinic confirms the association and approves the profile."
      isActive: true,
    },
  ],
  services: [
    {
      id: 'service-general-consult',
      name: 'General Dental Consultation',
      slug: 'general-dental-consultation',
      description: 'Comprehensive clinical oral examination, digital intraoral assessment, treatment roadmap, and preventative oral health recommendations.',
      durationMinutes: 30,
      optionalPrice: '₹300 (Initial Examination & Consultation)',
      isPublished: true,
      category: 'general',
    },
    {
      id: 'service-implants',
      name: 'Dental Implants',
      slug: 'dental-implants',
      description: 'Permanent, titanium-root dental replacements engineered to restore masticatory function, natural aesthetics, and preserve underlying jaw bone structure.',
      durationMinutes: 45,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: true,
      category: 'implants',
    },
    {
      id: 'service-teeth-cleaning',
      name: 'Teeth Cleaning & Scaling',
      slug: 'teeth-cleaning',
      description: 'Ultrasonic scaling to safely remove calculus (tartar), stubborn plaque, and extrinsic stains, maintaining gingival health and fresh breath.',
      durationMinutes: 30,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: true,
      category: 'preventive',
    },
    {
      id: 'service-root-canal',
      name: 'Root Canal Treatment (RCT)',
      slug: 'root-canal-treatment',
      description: 'Precision endodontic therapy to eliminate root canal infection, alleviate toothache, and save severely decayed or traumatized natural teeth.',
      durationMinutes: 45,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: true,
      category: 'restorative',
    },
    {
      id: 'service-crowns-bridges',
      name: 'Dental Crowns & Bridges',
      slug: 'dental-crowns-bridges',
      description: 'Custom ceramic and zirconia restorations fabricated to rebuild fractured teeth, reinforce root canal-treated teeth, and bridge edentulous gaps.',
      durationMinutes: 45,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: true,
      category: 'restorative',
    },
    {
      id: 'service-tooth-extraction',
      name: 'Tooth Extraction',
      slug: 'tooth-extraction',
      description: 'Gentle, minimally invasive dental extraction for non-restorable, fractured, or problematic wisdom teeth with proper local anaesthesia and postoperative guidance.',
      durationMinutes: 30,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: true,
      category: 'surgical',
    },
    {
      id: 'service-cosmetic-dentistry',
      name: 'Cosmetic Dentistry & Smile Enhancement',
      slug: 'cosmetic-dentistry',
      description: 'Aesthetic tooth bonding, diastema closures, and composite veneers to harmonize your smile aesthetics.',
      durationMinutes: 45,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: false,
      category: 'cosmetic',
    },
    {
      id: 'service-gum-care',
      name: 'Gum Care & Periodontics',
      slug: 'gum-care',
      description: 'Specialized periodontal therapeutic care for bleeding gums, gingivitis, and periodontal pocket management.',
      durationMinutes: 30,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: false,
      category: 'preventive',
    },
    {
      id: 'service-dentures',
      name: 'Dentures (Complete & Partial)',
      slug: 'dentures',
      description: 'Custom-crafted removable complete and partial dentures designed for chewing comfort and facial contour restoration.',
      durationMinutes: 45,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: false,
      category: 'restorative',
    },
    {
      id: 'service-preventive-care',
      name: 'Preventive Dental Care & Sealants',
      slug: 'preventive-dental-care',
      description: 'Protective dental sealants, professional fluoride varnishes, and habitual maintenance for long-term oral protection.',
      durationMinutes: 30,
      optionalPrice: 'Contact the clinic for pricing',
      isPublished: false,
      category: 'preventive',
    },
  ],
  appointments: [],
  blockedSlots: [],
  holidays: [
    { id: 'hol-1', date: '2026-11-01', name: 'Kannada Rajyotsava' },
    { id: 'hol-2', date: '2026-10-24', name: 'Deepavali Holiday' },
  ],
  bookingPolicy: {
    minNoticeHours: 1,
    maxHorizonDays: 30,
    slotIntervalMinutes: 30,
    cancellationNoticeHours: 4,
    autoConfirm: true,
  },
  notificationLogs: [],
  auditLogs: [
    {
      id: 'audit-init',
      action: 'SYSTEM_INITIALIZATION',
      details: 'B-Smart Dental Clinic appointment management system initialized with persistent database.',
      actor: 'System',
      timestamp: new Date().toISOString(),
    },
  ],
  enquiries: [],
  staffUsers: [
    {
      id: 'staff-admin',
      email: 'admin@bsmartdental.in',
      name: 'Dr. Srinidhi / Clinic Admin',
      role: 'admin',
      passwordHash: hashPassword('admin123'),
    },
    {
      id: 'staff-reception',
      email: 'reception@bsmartdental.in',
      name: 'Front Desk Reception',
      role: 'receptionist',
      passwordHash: hashPassword('reception123'),
    },
  ],
};

// Async Mutex Queue to guarantee ACID-like serialized operations on booking
class AsyncMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        } else {
          this.locked = false;
        }
      };

      if (!this.locked) {
        this.locked = true;
        resolve(release);
      } else {
        this.queue.push(() => resolve(release));
      }
    });
  }
}

const mutex = new AsyncMutex();

export class Database {
  private static cachedData: DatabaseSchema | null = null;

  public static async init(): Promise<void> {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      await this.save(INITIAL_DATA);
    } else {
      try {
        const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
        this.cachedData = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, resetting to initial:', err);
        await this.save(INITIAL_DATA);
      }
    }
  }

  private static async load(): Promise<DatabaseSchema> {
    if (this.cachedData) return this.cachedData;
    await this.init();
    return this.cachedData!;
  }

  private static async save(data: DatabaseSchema): Promise<void> {
    this.cachedData = data;
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.promises.rename(tempFile, DATA_FILE);
  }

  // Mutex-protected transaction executor
  public static async transaction<T>(callback: (data: DatabaseSchema) => Promise<{ result: T; data: DatabaseSchema }>): Promise<T> {
    const release = await mutex.acquire();
    try {
      const currentData = await this.load();
      // Deep clone to ensure rollback capability on error
      const cloned = JSON.parse(JSON.stringify(currentData)) as DatabaseSchema;
      const { result, data: updatedData } = await callback(cloned);
      await this.save(updatedData);
      return result;
    } finally {
      release();
    }
  }

  public static async getData(): Promise<DatabaseSchema> {
    return await this.load();
  }
}
