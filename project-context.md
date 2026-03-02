# Project Context

**Project:** CareEquity — Minority Physician Locator Platform
**Last Updated:** 2026-03-01
**Current Version:** 0.8.0
**Status:** All milestones complete ✅

---

## Project Overview

CareEquity is a comprehensive platform that connects patients with minority healthcare providers. It addresses healthcare disparities by making it easier for patients to find culturally competent care from physicians who share their background.

### Mission
Improve healthcare equity by connecting underserved communities with minority healthcare providers through an accessible, multi-platform search and verification system.

---

## Technical Architecture

### Monorepo Structure
```
apps/
  api/       NestJS REST API (port 3001)
  web/       Next.js frontend (port 3000)
  mobile/    React Native / Expo mobile app
packages/
  core/      Shared business logic, types, utilities, Elasticsearch client
  db/        TypeORM entities, migrations, AppDataSource
  cli/       Commander CLI for ingestion & admin operations
  ui/        Shared React component library (shadcn-style)
specs/       Feature specs, data model, contracts, tasks
tests/
  contract/  Contract tests for all API endpoints
```

### Tech Stack

**Backend:**
- NestJS (v10.x) — API framework
- TypeORM (v0.3.x) — Database ORM
- PostgreSQL 15 + PostGIS — Relational database with geospatial support
- Elasticsearch 8.x — Full-text and geo search engine
- Node 20.x LTS

**Frontend:**
- Next.js 14+ (App Router) — Web framework
- React Native / Expo — Mobile framework
- next-intl — Internationalization (en, es, ar)
- shadcn/ui + Tailwind CSS — Component library & styling
- MapboxGL — Map visualization

**Infrastructure:**
- Docker + Docker Compose — Local development
- GitHub Actions — CI/CD
- EAS Build — Mobile app builds
- MailHog — Local SMTP testing

### Core Data Flow

1. **Ingestion Pipeline:**
   - CLI fetches from NPI registry API
   - Stores in PostgreSQL via TypeORM
   - Indexes in Elasticsearch for search

2. **Search Pipeline:**
   - Client → API `/providers?lat&lon&radius&specialty&insurance`
   - SearchService queries Elasticsearch (geo_distance + scoring)
   - Results cached in NodeCache (5 min TTL)

3. **Dual Storage Pattern:**
   - PostgreSQL = source of truth
   - Elasticsearch = search index
   - Profile updates must sync to both

---

## Key Features

### Provider Search
- Geolocation-based search with configurable radius
- Specialty filtering (36 medical specialties)
- Insurance provider filtering (6 major carriers)
- Multi-language support (English, Spanish, Arabic)
- Results ranked by relevance, distance, verification tier

### Verification System
Three-tier verification managed by admin users:
- **Tier 1 (Professional):** NPI license verification
- **Tier 2 (Identity):** Government ID verification
- **Tier 3 (Practice):** Practice location verification

Implemented as a state machine in `packages/core/src/utils/VerificationStateMachine.ts`.

### Review System
- Star ratings (1-5) with written reviews
- PHI redaction (SSN, email, phone, dates) via `Redactor` utility
- AI-powered content moderation via `AIModerator`
- Reviews linked to verified patient accounts only

### Authentication & Authorization
- JWT-based authentication via `packages/core/src/utils/AuthUtils.ts`
- Three user roles: `patient`, `provider`, `admin`
- Guards enforce role-based access control
- Providers can claim profiles after identity verification

### Localization (i18n)
- Three locales: English (en), Spanish (es), Arabic (ar)
- All web routes prefixed: `/[locale]/...`
- Message files in `apps/web/messages/`
- RTL support for Arabic via Tailwind CSS

### Mobile Application
- React Native / Expo SDK 52
- EAS Build for iOS and Android
- Shared UI components from `packages/ui`
- Native map integration with MapboxGL
- Push notifications support

---

## Database Schema

### Core Entities (TypeORM)

**Provider:**
- Demographics: name, gender, ethnicity
- Professional: NPI, specialties array, licenses array
- Location: PostGIS Point geometry, address fields
- Verification: status, tier, verifier reference
- Insurance: string array with enum validation
- Soft delete: deleted_at timestamp

**User:**
- Auth: email (unique), password hash
- Profile: firstName, lastName, role
- Relationships: providerId (optional FK)

**Review:**
- Rating: 1-5 stars
- Content: text (PHI-redacted)
- Relationships: userId, providerId
- Metadata: helpful_count, reported flag

**Booking:**
- Appointment details: date, time, reason
- Status: pending, confirmed, cancelled, completed
- Relationships: patientId, providerId

### Migrations
7 migrations covering M002-M008:
- 1731706800000-CreateProvider
- 1732228800000-CreateUser
- 1732315200000-CreateReview
- 1732401600000-CreateBooking
- 1732488000000-AddVerification
- 1732574400000-AddI18n
- 1733400000000-SoftDeleteAndInsurance (M008)

---

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` — Create user account
- `POST /auth/login` — Authenticate and receive JWT

### Providers (`/providers`)
- `GET /providers` — Search with filters (lat, lon, radius, specialty, insurance)
- `GET /providers/:id` — Get provider profile
- `PATCH /providers/:id` — Update profile (provider role required)
- `POST /providers/:id/claim` — Claim profile (authenticated)
- `POST /providers/:id/verify-request` — Request verification upgrade

### Reviews (`/reviews`)
- `GET /reviews?providerId=:id` — List provider reviews
- `POST /reviews` — Submit review (patient role required)
- `PATCH /reviews/:id` — Update review (author only)
- `DELETE /reviews/:id` — Delete review (author or admin)

### Bookings (`/bookings`)
- `GET /bookings` — List user's bookings
- `POST /bookings` — Create appointment
- `PATCH /bookings/:id` — Update appointment status

### Admin (`/admin`)
- `PATCH /admin/verify/:id` — Update provider verification (admin only)
- `DELETE /admin/providers/:id` — Soft-delete provider
- `POST /admin/providers/:id/restore` — Restore soft-deleted provider
- `POST /admin/test-email` — Test SMTP configuration (dev only)
- `GET /admin/analytics` — Analytics dashboard data

### Documentation
- Swagger UI available at `/api/docs` (all controllers + DTOs documented)

---

## Environment Configuration

### Required Variables
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=careequity

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme

# Auth
JWT_SECRET=careequity-dev-secret

# API
PORT=3001

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001

# Email (MailHog in dev)
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=noreply@careequity.com

# Optional: Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

See `.env.example` for complete reference.

---

## Development Workflow

### Common Commands
```bash
# Install dependencies
npm install

# Build all packages (TypeScript project references)
npm run build

# Run API in dev mode
npm run start:dev --workspace=apps/api

# Run web in dev mode
npm run dev --workspace=apps/web

# Run mobile
cd apps/mobile && npm run start

# Database migrations
npm run migration:run --workspace=packages/db
npm run migration:generate --workspace=packages/db -- -n MigrationName

# CLI operations
node packages/cli/dist/index.js ingest --location "New York, NY" --limit 1000
node packages/cli/dist/index.js search --location "New York, NY"

# Testing
npm test                              # All tests
cd apps/api && npx jest test/search.e2e-spec.ts  # Single e2e test

# Infrastructure
docker-compose up -d postgres elasticsearch  # Infra only
docker-compose up --build                    # Full stack
```

### Branch Strategy
- `main` — Production-ready code
- Feature branches: `feat/description`, `fix/description`
- See `CONTRIBUTING.md` for detailed conventions

### Commit Conventions
```
feat(scope): description       # New feature
fix(scope): description        # Bug fix
docs(scope): description       # Documentation only
chore(scope): description      # Maintenance tasks
test(scope): description       # Test additions
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement with TDD (tests first)
3. Run full test suite
4. Update documentation
5. Create PR with description
6. Squash merge to `main`

---

## Testing Strategy

### Test Types
- **Unit tests:** `packages/core/src/**/__tests__/` (PHI redactor, state machine, auth utils)
- **E2E tests:** `apps/api/test/` (supertest against live NestJS app)
- **Contract tests:** `tests/contract/` (one file per endpoint group)

### Coverage Requirements
- Critical paths: 90%+ coverage
- Utilities: 100% coverage
- TDD mandatory: tests before implementation

### Example Test Files
- `packages/core/src/utils/__tests__/Redactor.test.ts` — PHI redaction unit tests
- `apps/api/test/search.e2e-spec.ts` — Provider search e2e tests
- `apps/api/test/notification.service.spec.ts` — NotificationService unit tests (31 cases)

---

## Deployment

### Local Development
```bash
docker-compose up --build
# API: http://localhost:3001
# Web: http://localhost:3000
# Postgres: localhost:5432
# Elasticsearch: localhost:9200
# MailHog: http://localhost:8025
```

### Staging Environment
```bash
docker-compose -f docker-compose.staging.yml up --build
# Uses staging-specific environment variables
# CORS_ORIGIN configured for staging domain
```

### Mobile Builds (EAS)
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# CI/CD via GitHub Actions (requires EXPO_TOKEN secret)
```

---

## Documentation

### Repository Docs
- `README.md` — Project overview and quickstart
- `CONTRIBUTING.md` — Contribution guidelines
- `CHANGELOG.md` — Version history (Keep a Changelog format)
- `ROADMAP.md` — Milestone status and upcoming features
- `TODO.md` — Task tracking and completion status
- `CLAUDE.md` — AI assistant guidance
- `.env.example` — Environment variable reference

### Obsidian Knowledge Vault
Comprehensive documentation maintained at `C:\Users\isaiah.muhammad\obsidian\CareEquity\`:
- `README.md` — Navigation hub
- `Roadmap.md` — Synced with repo ROADMAP.md
- `TODOs.md` — Synced with repo TODO.md
- `Environment Variables.md` — Complete env var reference
- `API/Endpoints.md` — REST endpoint documentation
- `Architecture/` — System design, tech stack
- `Database/` — Schema, migrations
- `Infrastructure/` — DevOps, CI/CD
- `Mobile/` — React Native app docs
- `Milestones/` — Detailed milestone breakdowns

---

## Architectural Decisions

### Library-First Pattern
All shared logic lives in `packages/core`, not in apps:
- `esClient` — Elasticsearch client singleton
- `AuthUtils` — JWT + bcrypt utilities
- `Redactor` — PHI redaction engine
- `AIModerator` — Content moderation
- `VerificationStateMachine` — State transitions

**Rationale:** Ensures consistency across API, CLI, and mobile apps.

### Dual Storage (PostgreSQL + Elasticsearch)
- PostgreSQL: source of truth, relational integrity
- Elasticsearch: optimized search, geo-queries, full-text

**Sync pattern:** Write to PostgreSQL first, then index in Elasticsearch.

### JWT Without NestJS Dependencies
Uses raw `jsonwebtoken` library in `packages/core` instead of `@nestjs/jwt`.

**Rationale:** Allows CLI and mobile apps to use same auth logic without NestJS dependency.

### Soft Delete Pattern
Providers are soft-deleted with `deleted_at` timestamp instead of hard deletes.

**Rationale:** Preserves historical data, enables recovery, maintains referential integrity.

### Insurance Array with Enum Validation
`provider.insurance` is `string[]` with enum validation against `INSURANCE_PROVIDERS`.

**Rationale:** Supports multiple insurance providers per provider, maintains data quality.

### Self-Hosted Insurance Logos
6 major carrier logos stored in `apps/web/public/logos/` as SVGs.

**Rationale:** Avoids external dependencies, ensures consistent branding, faster load times.

---

## Security Considerations

### PHI Protection
- All user-submitted content passes through `Redactor`
- SSN, email, phone, dates automatically redacted from reviews
- Sensitive fields excluded from public API responses

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWTs expire after 7 days
- Role-based access control on all protected routes
- Admin actions require explicit role verification

### API Security
- CORS configured per environment
- Rate limiting implemented (100 req/min per IP)
- Input validation on all endpoints via class-validator
- SQL injection prevention via TypeORM parameterized queries

### Data Privacy
- User emails stored but never displayed publicly
- Provider NPI data sourced from public registry only
- Booking details visible only to patient, provider, and admin

---

## Performance Optimizations

### Caching Strategy
- Search results cached in NodeCache (5 min TTL)
- Reduces load on Elasticsearch
- Cache invalidated on provider updates

### Database Indexing
- PostGIS spatial index on `provider.location`
- Composite indexes on frequently queried fields
- Foreign key indexes for joins

### Elasticsearch Optimization
- Geo-distance query with configurable radius
- Scoring boosts for verification tier, review count
- Field-level boosting for specialty relevance

---

## Milestone History

| Version | Milestone | Ship Date | Key Deliverables |
|---------|-----------|-----------|------------------|
| 0.1.0 | M001 | 2025-11-15 | Monorepo scaffold, project setup |
| 0.2.0 | M002 | 2025-11-20 | Provider ingestion pipeline, CLI |
| 0.3.0 | M003 | 2025-11-25 | Geo-search API, Next.js frontend |
| 0.4.0 | M004 | 2025-12-01 | Authentication, review system |
| 0.5.0 | M005 | 2025-12-10 | React Native mobile app |
| 0.6.0 | M006 | 2025-12-15 | Admin verification, analytics |
| 0.7.0 | M007 | 2025-12-20 | i18n (en/es/ar), RTL support |
| 0.8.0 | M008 | 2026-03-01 | Operational excellence, production hardening |

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Single region focus** — Initial deployment targets US only
2. **Limited insurance coverage** — 6 major carriers (expandable)
3. **Manual verification** — Tier 2/3 require admin approval
4. **Basic booking** — No calendar integration or availability tracking

### Planned Enhancements (Post-M008)
1. **Performance at scale:**
   - Redis caching layer
   - Elasticsearch CDC via Debezium
   - Read replicas for PostgreSQL

2. **Multi-region expansion:**
   - International provider support
   - Country-specific specialty taxonomies
   - Multi-currency booking

3. **Real-time features:**
   - WebSocket notifications
   - Live availability updates
   - Instant booking confirmations

4. **Enterprise integrations:**
   - EHR systems (HL7/FHIR)
   - SSO for health systems
   - Advanced analytics dashboard

---

## Support & Resources

### Documentation
- API docs: `http://localhost:3001/api/docs` (Swagger UI)
- Obsidian vault: `C:\Users\isaiah.muhammad\obsidian\CareEquity\`
- Repository: See README.md and CONTRIBUTING.md

### Development Tools
- **MailHog:** `http://localhost:8025` — Email testing
- **Elasticsearch:** `http://localhost:9200` — Search index
- **PostgreSQL:** `localhost:5432` — Database

### Key Package Versions
- Node: 20.x LTS
- NestJS: 10.x
- Next.js: 14.x
- React Native: 0.76.x
- Expo SDK: 52
- TypeORM: 0.3.x
- Elasticsearch: 8.x

---

*Project context maintained for Claude Code continuity. Last updated: 2026-03-01*
