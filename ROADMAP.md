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
| **002 — Provider Growth & Trust** | — | Not started | — |
| **003 — Patient Experience** | — | Partially complete (see below) | — |
| **004 — Mobile Parity** | — | Not started | — |
| **005 — Platform & Scale** | — | Partially complete (see below) | — |
| **006 — Community & Growth** | — | Not started | — |

---

## Milestone 001 — Physician Locator MVP ✅

**Branch:** `001-physician-locator`
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

## Milestone 002 — Provider Growth & Trust

**Goal:** Grow the provider supply side. Make it easier for minority physicians to find, claim, and maintain their profiles. Build trust signals that differentiate CareEquity from generic directories.

### Features

#### Provider Acquisition & Onboarding
- [ ] **Automated NPI batch ingestion** — scheduled CLI ingest job (weekly) to pull new NPI records by state/specialty and sync to Elasticsearch
- [ ] **Provider invitation emails** — when a new provider is ingested, send a claim-your-profile invitation email
- [ ] **Claim via email token** — replace the current session-based claim flow with a secure tokenized email link
- [ ] **Onboarding wizard** — step-by-step portal flow guiding new providers through profile completion (photo, bio, availability, insurance)
- [ ] **Profile completeness score** — visual indicator showing providers how complete their profile is and what remains

#### Trust & Verification
- [ ] **Tier 3 verification workflow** — Practice verification (office address confirmation, DEA check) is defined in the spec but the admin workflow is partially implemented
- [ ] **Verification document upload** — providers upload identity documents for Tier 2; currently no file storage exists; integrate S3 or equivalent
- [ ] **Verification expiry** — verified credentials expire after 24 months; add renewal reminders via `NotificationService`
- [ ] **NPI real-time validation** — currently ingestion uses batch NPI data; add a real-time NPI Taxonomy API check on provider PATCH

#### Provider Content
- [ ] **Provider bio / narrative** — free-text "about me" field on profiles
- [ ] **Cultural competency tags management** — providers can self-select `identity_tags` from a curated vocabulary; currently set only via CLI
- [ ] **Telehealth badge + video platform links** — currently a URL field; surface as a prominent visual badge on search cards

---

## Milestone 003 — Patient Experience

**Goal:** Make the patient search-to-booking flow seamless and trustworthy.

### Features

#### Search & Discovery
- [x] **Active insurance filter pill state** — selected pills show gold ring + tint + `aria-pressed`; clicking again deselects
- [x] **Search results empty state** — `SearchX` icon + heading + actionable suggestions when zero results returned
- [ ] **Insurance tooltip on pills** — shadcn `<Tooltip>` showing full plan name on hover/focus
- [ ] **`ProviderSearchCard` insurance row** — show 2–3 accepted insurance logos inline on the search result card
- [ ] **Search URL persistence** — current search state (location, specialty, insurance) encoded in URL params for sharing and back-navigation
- [ ] **Map view** — optional map alongside results list showing provider pins (Mapbox or Leaflet)
- [ ] **Radius selector** — slider to adjust search radius (5 / 10 / 25 / 50 miles)

#### Booking & Appointments
- [x] **Booking confirmation page** — `/[locale]/booking/confirmation` with provider name, date, reason, and back-to-profile link (EN/ES/AR)
- [ ] **Appointment status management** — patients can view, reschedule, and cancel upcoming appointments from `/patient/care-team`
- [ ] **SMS appointment reminders** — integrate Twilio to send confirmation + 24h reminder texts
- [ ] **Calendar sync** — Google Calendar / iCal export for confirmed appointments

#### Patient Account
- [ ] **Patient registration** — currently only provider and admin roles exist in the portal; add patient self-registration flow
- [ ] **Care team page** — `/patient/care-team` shows saved providers; currently scaffolded but not fully wired
- [ ] **Review history** — patients can view and manage their own submitted reviews
- [x] **JWT expiry handling** — `apiFetch` wrapper clears token and redirects to `/<locale>/login` on 401 (full refresh token flow still pending)

---

## Milestone 004 — Mobile Parity

**Goal:** Achieve feature parity between the React Native mobile app and the web app.

### Features

- [ ] **Authentication flow** — login, registration, JWT storage with secure key store
- [ ] **Provider search screen** — location-based search with specialty and insurance filters
- [ ] **Provider profile screen** — full profile view with verification badge, availability, and reviews
- [ ] **Booking flow** — inline availability grid + appointment form on mobile
- [ ] **Push notifications** — booking confirmations and reminders via Expo Notifications
- [ ] **Offline mode** — cache recent search results and saved providers for offline viewing
- [ ] **App store submission** — iOS and Android production builds, metadata, screenshots

---

## Milestone 005 — Platform & Scale

**Goal:** Prepare for production load and multi-city expansion.

### Infrastructure

- [x] **CI/CD pipeline** — `.github/workflows/ci.yml`: lint/type-check, unit tests (packages/core), e2e tests (API + Postgres + ES) on every PR
- [x] **Health check endpoint** — `GET /health` returns `{ status, db, es }` via `HealthController`
- [x] **Elasticsearch index auto-creation** — `SearchService.onApplicationBootstrap` creates `providers` index if absent
- [x] **Env var boot validation** — `validateEnv()` in `main.ts` exits with clear error if required vars are missing
- [ ] **Staging environment** — isolated staging stack mirroring production; automated deployments on merge to `main`
- [ ] **Rate limiting** — per-IP rate limiting on search endpoints via `@nestjs/throttler`
- [ ] **Elasticsearch index versioning** — blue-green index aliases for zero-downtime re-indexing
- [ ] **Database connection pooling** — configure TypeORM pooling for production concurrent load
- [ ] **Multi-stage Docker builds** — reduce image sizes; add `.dockerignore` files

### Observability

- [ ] **Structured logging** — ship API logs to a log aggregator (Datadog, Loki, or CloudWatch)
- [ ] **Error tracking** — integrate Sentry in both API and web app
- [ ] **Search analytics dashboard** — track top searches, zero-result queries, filter usage, and click-through rate
- [ ] **Provider adoption metrics** — claim rate by specialty and geography; admin dashboard enhancements

### Security

- [ ] **Input validation hardening** — ensure all API endpoints validate input with `class-validator` DTOs
- [ ] **HIPAA readiness review** — PHI redactor unit tests pass, but a formal compliance review of data flows, audit logging, and BAA requirements is needed before handling real patient data
- [ ] **Dependency audit** — `npm audit` and `snyk` scan; resolve any high/critical CVEs
- [ ] **Secrets management** — migrate from `.env` files to a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production

---

## Milestone 006 — Community & Growth

**Goal:** Build network effects and community trust that make CareEquity the authoritative source for minority physician discovery.

### Features

- [ ] **Provider directory pages** — SEO-optimized static city/specialty pages (`/en/new-york/cardiology`) for organic discovery
- [ ] **Review verification** — confirmed-patient badge on reviews (cross-reference booking records)
- [ ] **Provider-to-patient messaging** — HIPAA-compliant in-app messaging for appointment follow-up
- [ ] **Insurance network verification API** — real-time insurance eligibility check (integrate with Availity or Change Healthcare)
- [ ] **Referral network** — providers can refer patients to other CareEquity providers, creating a trusted referral graph
- [ ] **Community health resources** — curated articles and guides in EN/ES/AR tied to provider specialties
- [ ] **Partner integrations** — EHR integrations (Epic FHIR, Athenahealth) for real-time availability sync

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

---

## Guiding Principles

1. **Library-first** — all shared logic lives in `packages/core`, never duplicated in apps
2. **TDD mandatory** — tests are written before implementation per project constitution
3. **Accessibility** — WCAG 2.2 AA minimum; healthcare users include elderly and disabled populations
4. **i18n by default** — every new user-facing string goes into all three message files (EN / ES / AR)
5. **Privacy-first** — PHI redaction on all user-submitted content; no PII stored in Elasticsearch
6. **Culturally competent** — product decisions are evaluated through the lens of the communities served
