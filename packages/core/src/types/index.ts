export const SPECIALTIES = [
  "Primary Care",
  "Pediatrics",
  "OB/GYN",
  "Cardiology",
  "Mental Health",
  "Dentistry",
  "Dermatology",
  "Psychiatry",
  "Orthopedics",
  "Urology",
  "Neurology",
  "Endocrinology",
  "Internal Medicine",
  "Family Medicine",
  "Pediatric Surgery",
];

export const IDENTITY_TAGS = [
  'Black/African American',
  'Hispanic/Latino',
  'Asian American',
  'Middle Eastern/Arab American',
  'Native American',
  'LGBTQ+ Affirming',
  "Women's Health Focus",
  'Bilingual (Spanish)',
  'Bilingual (Arabic)',
  'Muslim-Friendly',
  'Faith-Based Practice',
  'Culturally Sensitive Care',
];

export const INSURANCE_PROVIDERS = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "Humana",
  "Medicare",
  "Medicaid",
  "UnitedHealthcare",
  "Kaiser Permanente",
];

export enum VerificationTier {
  PROFESSIONAL = 1,
  IDENTITY = 2,
  PRACTICE = 3,
}

export interface Provider {
  id: string;
  /** 10-digit National Provider Identifier — used for FHIR EHR integration */
  npi?: string;
  name: string;
  credentials: string[];
  specialties: string[];
  languages: string[];
  insurance?: string;
  location: { lat: number; lon: number };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  verification_tier: VerificationTier;
  is_claimed: boolean;
  bio?: string;
  identity_tags: string[];
  telehealth_url?: string;
  website_url?: string;
  profile_image_url?: string;
  availability?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'admin' | 'provider';
  phone?: string | null;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: 'patient' | 'admin' | 'provider';
  providerId?: string;
}

export interface Review {
  id: string;
  provider_id: string;
  patient_id: string;
  rating_total: number;
  content: string;
  status: 'pending' | 'published' | 'flagged' | 'rejected';
  created_at: Date;
}
