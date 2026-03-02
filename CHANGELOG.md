# Changelog

All notable changes to CareEquity are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased] — Milestone 008 (Tech Debt & Data Integrity)

### Added
- Provider soft-delete: `deleted_at TIMESTAMPTZ` column with TypeORM `@DeleteDateColumn`; `DELETE /admin/providers/:id` and `POST /admin/providers/:id/restore` endpoints
- `provider.insurance` typed as `string[]` validated against `INSURANCE_PROVIDERS` enum via `UpdateProviderDto`
- `UpdateProviderDto` with `class-validator` decorators for safe provider PATCH
- MailHog SMTP capture service for local development email testing
- `POST /admin/test-email` endpoint for dispatching test insurance-verification emails
- CHANGELOG.md (this file)

### Changed
- Insurance ES query changed from `match` to `term` for correct keyword array filtering
- CLI ingest wraps single insurance strings in arrays to match new `string[]` column type

### Fixed
- Staging CORS configuration now correctly allows the staging frontend origin
- EAS CI job now uses the correct `eas-cli` version for Expo Application Services builds

### Security
- Added `CONTRIBUTING.md` security-reporting policy and contribution guidelines

---

## [0.7.0] — 2026-02-28 (Milestone 007: EHR, FHIR, Community)

### Added
- SEO directory pages: `/[locale]/directory/[state]/[specialty]` with `generateStaticParams` (10 states × 15 specialties × 3 locales), JSON-LD `MedicalBusiness` schema, ISR 24 h
- `sitemap.ts` and `robots.ts` for Next.js App Router
- Review verified-patient badge: `verified_patient BOOLEAN` column on `Review` entity; green "Verified Patient" chip in `ReviewCard`
- HIPAA-compliant messaging: `Message` entity (appointment-scoped, PHI-redacted via `Redactor`); `MessagingService`; `MessageThread`, `MessageBubble`, `ThreadList` components
- Messaging endpoints: `GET /messages`, `GET /messages/:appointmentId`, `POST /messages/:appointmentId`, `PATCH /messages/:appointmentId/read`
- Insurance eligibility: `POST /eligibility/check`, `EligibilityService` factory (Availity OAuth2 adapter + Mock adapter), `CoverageCheckWidget`
- Provider referral network: `ProviderReferral` entity; `ReferralController` (5 endpoints); `ReferralModal` component
- Community health resources: 3 trilingual seed articles (hypertension, diabetes, mental health); `/[locale]/resources` and `/[locale]/resources/[slug]` pages
- Epic FHIR integration: `EpicFhirAdapter`, `GET /fhir/availability/:npi`, `FhirAvailabilityGrid`; graceful no-op when `EPIC_*` env vars absent
- Athenahealth integration: `AthenahealthAdapter` for appointment sync; graceful no-op when `ATHENA_*` env vars absent
- New env vars: `AVAILITY_CLIENT_ID`, `AVAILITY_CLIENT_SECRET`, `AVAILITY_API_URL`, `EPIC_CLIENT_ID`, `EPIC_CLIENT_SECRET`, `EPIC_FHIR_BASE_URL`, `ATHENA_CLIENT_ID`, `ATHENA_CLIENT_SECRET`, `ATHENA_API_URL`

### Changed
- Provider profile page upgraded with FHIR live availability (falls back to manual grid when FHIR is unconfigured)

---

## [0.6.0] — 2026-02-28 (Milestone 006: Notifications & DevOps)

### Added
- Twilio SMS confirmations: sent on appointment booking + 24 h reminder via `NotificationService` cron
- iCal export: `GET /booking/appointment/:id/ical` returns `.ics` file via `ical-generator`; linked from booking confirmation page
- `User.phone` (`VARCHAR` nullable) with migration `1771332000000-AddUserPhone`
- DevOps runbook: `docs/devops-runbook.md` (EAS build, staging env, iOS/Android submission)
- New env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

### Security
- Upgraded `nodemailer` 6 → 8 to resolve a HIGH-severity CVE in the 6.x transport layer

---

## [0.5.0] — 2026-02-28 (Milestone 005: Hardening & Observability)

### Added
- Global rate limiting: `@nestjs/throttler` — 60 req/min default; auth endpoints 5/min; search endpoints 30/min
- Request/response DTOs: `apps/api/src/dto/{auth,booking,review}.dto.ts` with `class-validator` decorators
- `ValidationPipe` (`whitelist: true, transform: true`) in `main.ts`
- Global exception filter: structured JSON error responses; 5xx stack traces logged server-side
- HTTP logging interceptor: `[HTTP] METHOD /path STATUS +Nms` format
- Database connection pooling: `extra: { max, min, idleTimeoutMillis, connectionTimeoutMillis }` in `AppDataSource`
- Sentry error tracking for API (`@sentry/nestjs`); graceful no-op when `SENTRY_DSN` absent
- Sentry instrumentation for Next.js web app (`apps/web/src/instrumentation.ts`)
- Docker `HEALTHCHECK` directives and non-root `careequity` user in both API and web Dockerfiles
- Analytics enhancements: `result_count` in search events; `getTopSearchFilters()` and `getZeroResultQueries()` admin endpoints
- New env vars: `DB_POOL_MAX`, `DB_POOL_MIN`, `SENTRY_DSN`

---

## [0.4.0] — 2026-02-28 (Milestone 004: Mobile App)

### Added
- Full React Native / Expo 52 mobile app (`apps/mobile`): auth flow, provider search, profile, booking, care team
- `AuthContext` with `expo-secure-store` JWT storage; `LoginScreen` and `RegisterScreen`
- `SearchScreen`: GPS (`expo-location`) + ZIP fallback; specialty/insurance/radius `FilterSheet`; `TimedCache` (5 min) for offline use
- `ProfileScreen`: bio, identity tags, `AvailabilityGrid`, `StarRating`, `ReviewCard`, `ReviewForm`
- `BookingScreen` + `ConfirmationScreen`: slot selection, reason input, local push notification on confirmation
- `CareTeamScreen`: saved providers + appointments (`SectionList`), cancel flow, pull-to-refresh, logout
- `app.json`: bundle IDs `org.careequity.app`, location + notification permission strings, Expo plugins
- `apiClient.ts`: unified fetch wrapper with Android emulator (`10.0.2.2`) and `EXPO_PUBLIC_API_URL` override
- `CacheStorage` / `TimedCache` via `@react-native-async-storage/async-storage`
- Static ZIP→coords lookup for 25 major US ZIP codes with NYC fallback
- New mobile dependencies: `expo-secure-store ~14`, `expo-location ~18`, `expo-notifications ~0.29`, `@react-native-async-storage/async-storage ^2.1`

---

## [0.3.0] — 2026-02-28 (Milestone 003: Patient Portal)

### Added
- Patient registration page (`/register`): email/password/confirm, calls `POST /auth/register`, redirects to care team
- `PATCH /booking/appointment/:id/cancel` with patient ownership check (`ForbiddenException` on mismatch)
- `GET /providers/my-reviews` (JWT-guarded): patient's own reviews ordered by `created_at DESC`
- Care-team page: saved providers, appointments, reviews; date formatting, status badge colors, cancel button, empty states
- Search URL persistence: `useSearchParams` / `router.replace` sync after every search; auto-triggers on mount if params present
- Radius selector in `HorizontalSearchBar` (5/10/25/50 mi with `defaultRadius` prop)
- `Tooltip` component: `apps/web/src/components/ui/tooltip.tsx` using Radix UI

### Changed
- `ProviderSearchCard` interface: `insurance` field accepts comma-separated plans, renders first 3 `InsuranceLogo` chips + "+N more" overflow
- Login page now includes "Create account →" link to registration page

---

## [0.2.0] — 2026-02-28 (Milestone 002: Provider Portal)

### Added
- Provider `bio` field: `TEXT nullable` column with migration `1771330000000`
- Cultural competency tags: `IDENTITY_TAGS` constant in `@careequity/core`; pill-toggle picker in `PracticeForm`
- Telehealth badge: blue "Video" chip in `ProviderSearchCard` Zone 3 (`telehealth_url` field)
- Profile completeness score: `computeCompleteness()` helper + progress bar + missing fields list in portal dashboard
- Email-token provider claim: `ProviderInvitation` entity + migration `1771331000000`; `InvitationService`; `InvitationController`; `/claim/[token]` page; admin unclaimed-providers endpoint
- 4-step onboarding wizard at `/portal/onboarding` (photo → story → availability → insurance/specialties)
- i18n keys for `Portal`, `Onboarding`, and `Claim` namespaces in `en`, `es`, `ar` message files
- Insurance re-verification cron (`NotificationService`): daily job queries providers overdue for 90-day re-check, sends nodemailer email, updates `last_insurance_notified_at`
- `@nestjs/schedule ^6` and `nodemailer ^6.9.0` added to API dependencies
- New env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## [0.1.0] — 2026-02-27 (Milestone 001: MVP Launch)

### Added
- npm-workspaces monorepo with `@careequity/` scope: `core`, `db`, `cli`, `ui`
- Apps: NestJS REST API (`apps/api`, port 3001), Next.js web (`apps/web`, port 3000), React Native / Expo mobile (`apps/mobile`)
- PostgreSQL with PostGIS extension for geographic provider storage (`geometry(Point, 4326)`)
- Elasticsearch geo-distance search with specialty, insurance, and verification-tier scoring boosts; 5-minute NodeCache TTL
- JWT authentication (`jsonwebtoken` + bcrypt, no `@nestjs/jwt`): `POST /auth/register`, `POST /auth/login`
- 3-tier provider verification state machine (`VerificationStateMachine` in `@careequity/core`)
- CLI (`packages/cli`): `ingest`, `verify`, `search` commands for NPI ingestion and admin operations
- ZocDoc-style provider search card UI: avatar, star rating, verification badge, insurance chips, availability slots
- Booking system: appointment creation, saved providers, iCal-ready confirmation
- Admin dashboard: pending verifications, flagged reviews, analytics (profile views, bookings, search events)
- PHI redactor (`Redactor` in `@careequity/core`): strips SSN, email, phone, dates from user-submitted reviews
- AI content moderation (`AIModerator`) for review submissions
- Trilingual i18n (`next-intl`): `en`, `es`, `ar` with locale-prefixed routes `/[locale]/...`
- Docker Compose stack: `postgis/postgis:15-3.3`, Elasticsearch 8, NestJS API, Next.js web
- GitHub Actions CI: lint/type-check, unit tests, e2e tests (3 jobs)
- `/health` endpoint returning `{ status: "ok" }`
- TypeScript project references (`tsc -b`) across all packages and apps
- Swagger / OpenAPI documentation at `/api`
