# CareEquity — TODO

> Living task list. Tracks open work, known gaps, and tech debt across the monorepo.
> Completed feature tasks live in `specs/001-physician-locator/tasks.md`.
> Last updated: 2026-02-28

---

## Ship Readiness

### Blocking launch — must fix before production traffic

- [ ] **`docker-compose up --build` browser smoke test** — full stack build + NYC provider ingest via CLI + visual confirmation that search and profile pages render. Needs a human in a browser; infra confirmed healthy locally.
- [ ] **SMTP tested end-to-end** — `NotificationService` cron fires in production but has never sent a real email. Point `SMTP_*` env vars at Resend / Mailgun / SMTP4Dev and trigger a test send before launch.
- [x] **Run pending DB migrations** — completed 2026-03-01:
  - `1771330000000-AddProviderBio`
  - `1771331000000-AddProviderInvitation`
  - `1771332000000-AddUserPhone`
  - `1771333000000-AddReviewVerifiedPatient`
  - `1771334000000-CreateProviderReferral`
  - `1771335000000-CreateMessage`
- [x] **npm install for new API deps** — completed 2026-03-01
- [x] **npm install for new web deps** — completed 2026-03-01
- [x] **npm install for mobile deps** — completed 2026-03-01

---

## Open Technical Debt

### API (`apps/api`)

- [ ] **`NotificationService` unit test** — no test for `notifyOverdueProviders()`; mock `AppDataSource` and `nodemailer`, assert query + email dispatch behavior.
- [ ] **`notification.service.ts` TypeScript error** — `last_insurance_notified_at` is not typed on `_QueryDeepPartialEntity<Provider>`; pre-existing, does not block build but should be fixed.
- [ ] **Twilio SMS tested end-to-end** — SMS confirmations added in milestone 006 but not confirmed against a live Twilio account; set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` env vars and trigger a test booking.

### Web (`apps/web`)

- [ ] **`HeroBanner` `+ Add Insurance` button is a no-op** — `onClick={() => {}}` placeholder; should open a modal or scroll to the insurance dropdown in the search bar.
- [ ] **InsuranceLogo: Tooltip on filter pills** — HeroBanner pills have no tooltip; wrap in shadcn `<Tooltip>` to surface full plan name on hover/focus.

### Database / Migrations

- [ ] **`provider.insurance` is a plain `VARCHAR`** — accepts any string with no validation against `INSURANCE_PROVIDERS` from `@careequity/core`; should be a `simple-array` or JSONB column with enum enforcement.
- [ ] **No soft-delete on `Provider`** — hard deletes break referential integrity in `Review`, `Appointment`, and `SavedProvider` tables. Add a `deleted_at` column and TypeORM `@DeleteDateColumn`.

### Mobile (`apps/mobile`)

- [ ] **App store submission** — EAS build profiles (`eas.json`) not yet created; `EXPO_TOKEN` GitHub secret not configured; store listings (screenshots, descriptions) not filled for iOS App Store or Google Play.

---

## Infrastructure / DevOps

- [x] **CI pipeline** — `.github/workflows/ci.yml`: lint/type-check, unit tests (packages/core), e2e tests (API + Postgres + ES).
- [x] **Elasticsearch index auto-creation** — `SearchService.onApplicationBootstrap` creates the `providers` index with `providerMapping` if absent.
- [x] **Health check endpoint** — `GET /health` returns `{ status, db, es }` via `HealthController`.
- [x] **Rate limiting** — `@nestjs/throttler@^6` global guard (60/min); auth 5/min; search 30/min — shipped in milestone 005.
- [x] **Docker HEALTHCHECK + non-root user** — both Dockerfiles updated; `USER careequity`; `HEALTHCHECK` directives — shipped in milestone 005.
- [ ] **Staging environment** — set `JWT_SECRET`, configure `CORS_ORIGIN` in `docker-compose.staging.yml`; staging stack not yet deployed.
- [ ] **EAS Build** — create `eas.json` profiles (development, preview, production); set `EXPO_TOKEN` GitHub secret.
- [ ] **Self-hosted insurance logos** — Clearbit has no SLA guarantee; download logos and serve from `/public/logos/` or a project-controlled CDN.

---

## Documentation

- [ ] **`CONTRIBUTING.md`** — branch naming, PR process, commit conventions, TDD requirement.
- [ ] **`CHANGELOG.md`** — retroactive log from initial commit through current main.
- [ ] **Swagger UI** — OpenAPI spec exists in `specs/001-physician-locator/contracts/` but is not served at runtime; add `@nestjs/swagger` and expose at `/api/docs`.
- [ ] **`.env.example` comments** — document each `SMTP_*`, `TWILIO_*`, and `SENTRY_DSN` variable and its accepted values inline.
- [ ] **Obsidian vault sync** — after each session, update the Obsidian vault at `/mnt/c/Users/isaiah.muhammad/obsidian/CareEquity/` using MCP_DOCKER obsidian_ tools.

---

## Completed (reference)

- [x] All 59 `specs/001-physician-locator` feature tasks
- [x] Push to remote, DB migrations (9 for milestones 001-003), contract tests (1/1)
- [x] CI pipeline with GitHub Actions
- [x] ES index auto-creation on bootstrap
- [x] `GET /health` endpoint (`{ status, db, es }`)
- [x] Insurance filter pills wired to search (active state + auto-re-run)
- [x] Booking confirmation page (`/[locale]/booking/confirmation`)
- [x] Empty search state (SearchX icon + suggestions)
- [x] Legal disclaimer for insurance logos (footer in `layout.tsx`)
- [x] `@nestjs/schedule` bumped ^4 → ^6 for NestJS 11 compatibility
- [x] JWT expiry handling — `apiFetch` wrapper clears token and redirects to `/login` on 401
- [x] Error boundary on provider profile page — 404 / 5xx screens with back-to-search link
- [x] `PATCH /providers/:id` ES dual-write — already implemented in `ProviderController`
- [x] Env var validation at API boot — `validateEnv()` in `main.ts`
- [x] **Milestone 002**: Provider bio, cultural competency tags UI, telehealth badge, profile completeness score, email token claim, onboarding wizard
- [x] **Milestone 003**: Patient registration, tooltip on insurance pills, ProviderSearchCard insurance row, search URL persistence, radius selector, appointment cancel, my-reviews endpoint, care-team page
- [x] **Milestone 004**: Mobile auth flow (SecureStore JWT), provider search screen (GPS + ZIP), provider profile screen, booking flow, push notifications (local), offline TimedCache, care team screen
- [x] **Milestone 005**: Rate limiting (@nestjs/throttler), DTOs + ValidationPipe, global exception filter, HTTP logging interceptor, DB connection pooling, analytics enhancements (top filters + zero-result queries), Sentry opt-in (API + web), Docker HEALTHCHECK + non-root user
- [x] **Milestone 006**: SMS confirmations (Twilio), iCal export (ical-generator), phone field on User entity (migration AddUserPhone), DevOps runbook (docs/devops-runbook.md, 784 lines)
- [x] **Milestone 007**: SEO directory pages (generateStaticParams + JSON-LD), review verification badge, HIPAA messaging (appointment-scoped threads + PHI redaction), insurance eligibility API (Availity + mock adapter), referral network, community health resources (EN/ES/AR), Epic FHIR integration, Athenahealth integration
