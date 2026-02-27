# Data Model: Minority Physician Locator Platform (CareEquity)

## Core Entities

### Provider
Represents the healthcare professional or practice.
- **Fields**:
  - `id`: UUID (Primary Key)
  - `name`: String (Full name or Practice name)
  - `credentials`: String[] (e.g., MD, DO, Board Certifications)
  - `specialties`: Specialty[] (Many-to-Many)
  - `languages`: String[] (ISO 639-1)
  - `location`: Point (Geo-spatial coordinates)
  - `address`: JSONB (Street, City, State, ZIP)
  - `verification_tier`: Integer (1: Professional, 2: Identity, 3: Practice)
  - `is_claimed`: Boolean (default: false)
  - `identity_tags`: String[] (Self-identified minority categories)
  - `telehealth_url`: String (optional)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

### Patient / User
Individual searching for care or providing feedback.
- **Fields**:
  - `id`: UUID (Primary Key)
  - `email`: String (Unique)
  - `password_hash`: String
  - `location_preference`: Point (optional)
  - `saved_providers`: Provider[] (Many-to-Many)
  - `role`: Enum (patient, admin)

### Review
Patient feedback and ratings.
- **Fields**:
  - `id`: UUID
  - `provider_id`: UUID (Foreign Key)
  - `patient_id`: UUID (Foreign Key)
  - `rating_total`: Float (1-5)
  - `rating_wait_time`: Integer (1-5)
  - `rating_bedside_manner`: Integer (1-5)
  - `rating_cultural_sensitivity`: Integer (1-5)
  - `content`: Text (PHIs redacted)
  - `status`: Enum (pending, published, flagged, rejected)
  - `created_at`: Timestamp

### VerificationRecord
History and status of provider verification actions.
- **Fields**:
  - `id`: UUID
  - `provider_id`: UUID (Foreign Key)
  - `tier`: Integer (1, 2, 3)
  - `document_links`: String[] (Reference to secure blob storage)
  - `status`: Enum (submitted, in_review, approved, rejected)
  - `reviewer_id`: UUID (Admin Foreign Key)
  - `notes`: Text

## Relationships
- **Provider <-> Specialty**: Many-to-Many
- **Provider <-> Review**: One-to-Many
- **Patient <-> Review**: One-to-Many
- **Provider <-> VerificationRecord**: One-to-Many (history of verification)
- **Patient <-> Provider**: Many-to-Many (saved providers)

## Validation Rules
- **Reviews**: Must not contain PHI patterns (names, dates, contact info).
- **Credentials**: NPI lookup required for Tier 1 verification.
- **Search**: Minimum radius 1 mile, maximum 50 miles.
