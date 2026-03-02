# CareEquity — Product Roadmap

> Strategic development plan for the CareEquity minority physician locator platform.
> Last updated: 2026-02-28

---

## Vision

CareEquity connects patients from underserved communities with minority and culturally competent physicians. The platform reduces barriers to culturally aligned care through trusted search, verified provider profiles, and seamless appointment booking — available in English, Spanish, and Arabic.

---

## Current Status

| Milestone | Branch | Status | Shipped |
|---|---|---|---|
| **001 — Physician Locator MVP** | `001-physician-locator` | Merged to main | 2026-02-27 |
| **002 — Provider Growth & Trust** | `002-provider-growth` | Merged to main ✅ | 2026-02-28 |
| **003 — Patient Experience** | `003-patient-experience` | Merged to main ✅ | 2026-02-28 |
| **004 — Mobile Parity** | `004-mobile-parity` | Merged to main ✅ | 2026-02-28 |
| **005 — Platform & Scale** | `005-platform-scale` | Merged to main ✅ | 2026-02-28 |
| **006 — Carryover (SMS, iCal, Map, HIPAA)** | `006-carryover` | Merged to main ✅ | 2026-02-28 |
| **007 — Community & Growth** | `007-community-growth` | Merged to main ✅ | 2026-02-28 |
| **008 — Operational Excellence** | `main` | Merged to main ✅ | 2026-03-01 |

---

## Milestone 001 — Physician Locator MVP ✅

**Branch:** `001-physician-locator`
**Merged:** 2026-02-27
**Goal:** Deliver a fully functional minority physician discovery platform across web, API, and mobile.

### What's Shipped

| Phase | Scope | Status |
|---|---|---|
| Phase 1–2 | Monorepo setup, TypeORM, Elasticsearch, auth utilities | Done |
| Phase 3 | Provider search — geo, specialty, language, insurance filters | Done |
| Phase 4 | Provider profiles, star ratings, patient reviews | Done |
| Phase 5 | 3-tier verification badge system | Done |
| Phase 6 | Provider portal — claim profile, edit practice info | Done |
| Phase 7 | Admin analytics dashboard | Done |
| Phase 8 | Multilingual support — EN / ES / AR | Done |
| Phase 9 | Docker full-stack orchestration | Done |
| Phase N | ZocDoc-style UI redesign, booking, availability grid | Done |
| Enhancements | Insurance logo pills (Clearbit + initials fallback) | Done |
| FR-009 | 90-day insurance re-verification email notifications | Done |
| Onboarding | `.env.example`, quickstart.md fix | Done |

### Post-Launch Polish (from 001 branch, merged to main)

- CI pipeline (lint, type-check, unit tests, e2e tests with Postgres + ES)
- ES index auto-creation on bootstrap (`onApplicationBootstrap`)
- `GET /health` endpoint (`{ status, db, es }`)
- JWT expiry handling (`apiFetch` wrapper → redirect to `/login` on 401)
- Provider profile error boundary (404 / 5xx screens with back-to-search)
- Env var boot validation (`validateEnv()` in `main.ts`)
- Insurance filter pills wired to search (active state + auto-re-run)
- Booking confirmation page (`/[locale]/booking/confirmation`)
- Empty search state (icon + suggestions)
- Legal disclaimer for insurance logos (footer)

---

## Milestone 002 — Provider Growth & Trust ✅

**Branch:** `002-provider-growth`
**Merged:** 2026-02-28
**Goal:** Grow the provider supply side. Make it easier for minority physicians to find, claim, and maintain their profiles. Build trust signals that differentiate CareEquity from generic directories.

### What's Shipped

- **Provider bio / narrative** — `bio TEXT` nullable column, migration `1771330000000`, shown on profile page About section
- **Cultural competency tags UI** — `IDENTITY_TAGS` constant in `@careequity/core`; pill-toggle picker in `PracticeForm`
- **Telehealth badge** — blue Video chip in Zone 3 of `ProviderSearchCard`; `telehealth_url` added to `ProviderCardData`
- **Profile completeness score** — `computeCompleteness()` helper + progress bar + missing fields list in portal dashboard sidebar
- **Email token claim** — `ProviderInvitation` entity + migration `1771331000000`; `InvitationService`, `InvitationController`; claim page `/claim/[token]`; admin unclaimed providers endpoint
- **Onboarding wizard** — 4-step wizard at `/portal/onboarding` (photo → story → availability → insurance/specialties)
- **i18n** — `Portal`, `Onboarding`, `Claim` keys in en/es/ar message files

---

## Milestone 003 — Patient Experience ✅

**Branch:** `003-patient-experience`
**Merged:** 2026-02-28
**Goal:** Make the patient search-to-booking flow seamless and trustworthy.

### What's Shipped

- **Patient registration** — `/register` page (email/pw/confirm); calls `POST /auth/register`; redirects to `/patient/care-team`; login page has "Create account" link
- **Tooltip on insurance pills** — HeroBanner pills wrapped in `<TooltipProvider>` + shadcn `<Tooltip>/<TooltipContent>`
- **ProviderSearchCard insurance row** — comma-split accepted insurance → first 3 `InsuranceLogo` chips + "+N more" overflow
- **Search URL persistence** — `useSearchParams`/`router.replace` after every search; auto-triggers on mount if params present; `<Suspense>` wrapper
- **Radius selector** — 5/10/25/50 mi dropdown added to `HorizontalSearchBar`; wired through API call + URL params
- **Appointment cancel** — `PATCH /booking/appointment/:id/cancel` verifies patient ownership; `ForbiddenException` on mismatch
- **My reviews endpoint** — `GET /providers/my-reviews` JWT-guarded; `patient_id` filter; ordered by `created_at DESC`; includes provider relation
- **Care-team page** — 3 sections (saved providers / appointments / reviews); date formatting; status badge colors; empty states; cancel button; review history with `StarRating`

---

## Milestone 004 — Mobile Parity ✅

**Branch:** `004-mobile-parity`
**Merged:** 2026-02-28
**Goal:** Achieve feature parity between the React Native mobile app and the web app.

### What's Shipped

- **Authentication flow** — `AuthContext` (SecureStore JWT), `LoginScreen`, `RegisterScreen`, dual-stack navigator (AuthStack vs AppStack)
- **Provider search screen** — GPS (`expo-location`) + ZIP fallback; `FilterSheet` modal (Specialty / Insurance / Radius tabs); `TimedCache` offline mode; chip display
- **Provider profile screen** — bio, identity tags, `AvailabilityGrid`, wired Save/Book buttons, `ReviewCard` + `ReviewForm`
- **Booking flow** — `BookingScreen` slot selection + reason input + `POST /booking/appointment`; navigates to `ConfirmationScreen`
- **Push notifications** — `ConfirmationScreen` fires local Expo push notification on booking; `expo-notifications` local-only
- **Offline mode** — `TimedCache` (5 min TTL) for search results; `CacheStorage` via AsyncStorage for saved providers
- **Care team screen** — saved providers + appointments `SectionList`; cancel flow; pull-to-refresh; logout button
- **App config** — `app.json` bundle IDs `org.careequity.app`; location + notification permission strings; Expo plugins

---

## Milestone 005 — Platform & Scale ✅

**Branch:** `005-platform-scale`
**Merged:** 2026-02-28
**Goal:** Prepare for production load and multi-city expansion.

### What's Shipped

#### Infrastructure
- **Rate limiting** — `@nestjs/throttler@^6` global guard (60 req/min); auth endpoints 5/min; search 30/min
- **DTOs + ValidationPipe** — `apps/api/src/dto/{auth,booking,review}.dto.ts` with `class-validator`; `whitelist: true, transform: true` in `main.ts`
- **Global exception filter** — `apps/api/src/filters/all-exceptions.filter.ts` — structured JSON error responses; logs 5xx stack traces
- **HTTP logging interceptor** — `apps/api/src/interceptors/logging.interceptor.ts` — `[HTTP] METHOD /path STATUS +Nms`
- **DB connection pooling** — `packages/db/src/data-source.ts` — `extra: { max, min, idleTimeoutMillis, connectionTimeoutMillis }`
- **Docker HEALTHCHECK + non-root user** — both Dockerfiles: `addgroup/adduser careequity`, `USER careequity`, `HEALTHCHECK` on `/health` (api) and `/` (web)

#### Observability
- **Error tracking (Sentry)** — `@sentry/nestjs@^9` in API (`Sentry.init()` in `main.ts`; no-op when `SENTRY_DSN` absent); `apps/web/src/instrumentation.ts` optional try-catch
- **Search analytics enhancements** — `result_count` now passed in search events; `getTopSearchFilters()` + `getZeroResultQueries()` in analytics service; 2 new admin controller endpoints

#### New env vars
- `DB_POOL_MAX`, `DB_POOL_MIN`, `SENTRY_DSN` added to `.env.example`

---

## Milestone 006 — Carryover (SMS, iCal, Map, HIPAA) ✅

**Branch:** `006-carryover`
**Merged:** 2026-02-28
**Goal:** Ship features carried over from earlier milestones — SMS confirmations, calendar export, phone collection, and HIPAA-compliant messaging groundwork.

### What's Shipped

- **SMS confirmations** — Twilio integration; confirmation SMS sent on booking; 24h reminder via `NotificationService` cron
- **iCal export** — `GET /booking/appointment/:id/ical` returns `.ics` file via `ical-generator`; linked from booking confirmation page
- **Phone field** — `phone VARCHAR nullable` added to `User` entity; migration `AddUserPhone` (`1771332000000`)
- **DevOps runbook** — `docs/devops-runbook.md` (784 lines): EAS build, staging environment setup, iOS/Android submission guide, Docker Compose staging config

---

## Milestone 007 — Community & Growth ✅

**Branch:** `007-community-growth`
**Merged:** 2026-02-28
**Goal:** Build network effects and community trust that make CareEquity the authoritative source for minority physician discovery.

### What's Shipped

- **SEO directory pages** — `generateStaticParams` for city/specialty combos (`/en/new-york/cardiology`); JSON-LD structured data for provider profiles
- **Review verification badge** — confirmed-patient badge on reviews; cross-references booking records; `verified_patient BOOLEAN` on `Review` entity; migration `1771335000000-AddReviewVerifiedPatient`
- **HIPAA messaging** — appointment-scoped message threads; `Message` entity + migration `1771334000000`; PHI redaction applied to all message bodies via `Redactor`; endpoints: `GET /messages/:appointmentId`, `POST /messages/:appointmentId`, `PATCH /messages/:appointmentId/read`
- **Insurance eligibility API** — `POST /eligibility/check` integrates with Availity; mock adapter for development; returns eligibility status, copay, deductible
- **Referral network** — `ProviderReferral` entity + migration `1771333000000`; providers can refer patients to other CareEquity providers; endpoints: `POST /referrals`, `GET /referrals`, `GET /referrals/:id`, `PATCH /referrals/:id/status`, `DELETE /referrals/:id`
- **Community health resources** — curated articles and guides in EN/ES/AR tied to provider specialties
- **Epic FHIR integration** — `GET /fhir/availability/:npi` queries Epic FHIR server for real-time availability
- **Athenahealth integration** — partner integration for appointment sync and medical record access

---

## Milestone 008 — Operational Excellence ✅

**Branch:** `main`
**Merged:** 2026-03-01
**Goal:** Harden production operations, improve developer experience, and close remaining tech debt before the platform scales to additional cities.

### What's Shipped

#### Developer Experience
- [x] **`CONTRIBUTING.md`** — branch naming, PR process, commit conventions, TDD requirement, security reporting policy
- [x] **`CHANGELOG.md`** — retroactive log from 0.1.0 (MVP) through 0.8.0 (Operational Excellence)
- [x] **Swagger UI** — `@nestjs/swagger@^8` serving OpenAPI spec at `/api/docs`; all 11 controllers decorated

#### Database
- [x] **Soft-delete on `Provider`** — `deleted_at TIMESTAMPTZ` column + TypeORM `@DeleteDateColumn`; `DELETE /admin/providers/:id` and `POST /admin/providers/:id/restore` endpoints
- [x] **`provider.insurance` typed array** — `simple-array` column type with `string[]`; `UpdateProviderDto` validates against `INSURANCE_PROVIDERS` enum
- [x] **Run pending migrations** — all 7 M007/M008 migrations applied: `AddReviewVerifiedPatient`, `CreateProviderReferral`, `CreateMessage`, `AddProviderDeletedAt`, `ChangeProviderInsuranceToArray`

#### Testing
- [x] **`NotificationService` unit test** — 31 test cases covering `sendInsuranceVerificationEmail` and `notifyOverdueProviders` with mocked `AppDataSource` and `nodemailer`
- [x] **`docker-compose up --build` browser smoke test** — full stack build verified; 25 providers ingested via CLI; visual confirmation of search results with provider cards, verification badges, and availability slots

#### Infrastructure
- [x] **Self-hosted insurance logos** — 6 SVGs in `/public/logos/` (Aetna, BCBS, Cigna, Humana, Kaiser Permanente, UHC); `InsuranceLogo` component updated with local fallback
- [x] **EAS Build** — `eas.json` with development/preview/production profiles; GitHub Actions `eas-build` job on `push/main` and `workflow_dispatch`
- [x] **Staging environment** — `docker-compose.staging.yml` with `CORS_ORIGIN` env var; `JWT_SECRET` enforced via `:?` syntax
- [x] **npm install for new deps** — all API, web, and mobile dependencies installed and verified
- [x] **MailHog SMTP capture** — added to `docker-compose.yml` (ports 1025/8025) for local email testing; `POST /admin/test-email` endpoint

#### UX
- [x] **HeroBanner `+ Add Insurance` button** — wired to scroll and focus the insurance select field in `HorizontalSearchBar`

#### Remaining (Non-Blocking)
- [ ] **App store listings** — screenshots, descriptions for iOS App Store and Google Play (requires manual submission)
- [ ] **Twilio SMS end-to-end test** — needs live Twilio credentials to verify against production API
- [ ] **`EXPO_TOKEN` GitHub secret** — must be set manually in repo Settings → Secrets

---

## Architecture Evolution

| Now | Next | Future |
|---|---|---|
| Monolith NestJS API | Extract `NotificationService` → queue worker (BullMQ) | Microservices: Search, Booking, Notifications |
| Clearbit logos (runtime CDN) | Self-hosted logos in `/public/` | Logo pipeline with automated trademark monitoring |
| PostgreSQL + Elasticsearch dual write | Elasticsearch CDC via Debezium | Event-sourced provider profiles |
| Node cache (in-memory, 5min TTL) | Redis distributed cache | Edge caching (Cloudflare Workers) |
| Manual NPI ingestion | Scheduled weekly ingestion job | Real-time NPI webhook sync |
| Single region | Multi-AZ deployment | Multi-region with geo-routing |
| Local Expo push notifications | Expo Push Notification Service (EAS) | APNs + FCM direct for enterprise |

---

## Guiding Principles

1. **Library-first** — all shared logic lives in `packages/core`, never duplicated in apps
2. **TDD mandatory** — tests are written before implementation per project constitution
3. **Accessibility** — WCAG 2.2 AA minimum; healthcare users include elderly and disabled populations
4. **i18n by default** — every new user-facing string goes into all three message files (EN / ES / AR)
5. **Privacy-first** — PHI redaction on all user-submitted content; no PII stored in Elasticsearch
6. **Culturally competent** — product decisions are evaluated through the lens of the communities served
