# CareEquity — TODO

> Living task list. Tracks open work, known gaps, and tech debt across the monorepo.
> Completed feature tasks live in `specs/001-physician-locator/tasks.md`.
> Last updated: 2026-03-01

---

## Ship Readiness

### Blocking launch — must fix before production traffic

- [x] **`docker-compose up --build` browser smoke test** — completed 2026-03-01: full stack build, 25 providers ingested via CLI, visual confirmation of search results (10 doctors near ZIP 19143) with provider cards, verification badges, and availability slots rendering correctly.
- [x] **SMTP tested end-to-end** — completed 2026-03-01: MailHog added to docker-compose (ports 1025/8025); `POST /admin/test-email` endpoint added; confirmed email delivered to MailHog (`Action Required: Please verify your accepted insurance list`). For production, swap `SMTP_HOST/PORT/USER/PASSWORD` to Resend / Mailgun.
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

- [x] **`NotificationService` unit test** — completed 2026-03-01: 16 cases covering `sendInsuranceVerificationEmail` (no-op when SMTP absent, port 465 → secure:true, from-address fallback, name in text+html) and `notifyOverdueProviders` (empty list, where-clause assertions, SMS skip on null phone, `last_insurance_notified_at` update, per-user error isolation, multiple-user processing).
- [x] **`notification.service.ts` TypeScript error** — completed 2026-03-01: `last_insurance_notified_at` typing fixed via proper entity typing.
- [ ] **Twilio SMS tested end-to-end** — SMS confirmations added in milestone 006 but not confirmed against a live Twilio account; set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` env vars and trigger a test booking.

### Web (`apps/web`)

- [x] **`HeroBanner` `+ Add Insurance` button** — completed 2026-03-01: wired to scroll and focus the insurance select field in `HorizontalSearchBar` via `handleAddInsuranceClick()`.
- [x] **InsuranceLogo: Tooltip on filter pills** — completed 2026-03-01: wrapped in shadcn `<Tooltip>` to surface full plan name on hover/focus.

### Database / Migrations

- [x] **`provider.insurance` typed array** — completed 2026-03-01: changed to `simple-array` column type with `string[]`; `UpdateProviderDto` validates against `INSURANCE_PROVIDERS` enum; migration `1771337000000-ChangeProviderInsuranceToArray`.
- [x] **Provider soft-delete** — completed 2026-03-01: `deleted_at TIMESTAMPTZ` column with TypeORM `@DeleteDateColumn`; `DELETE /admin/providers/:id` and `POST /admin/providers/:id/restore` endpoints; migration `1771336000000-AddProviderDeletedAt`.

### Mobile (`apps/mobile`)

- [x] **EAS Build profiles** — `apps/mobile/eas.json` created with development, preview, and production profiles; `eas-build` GitHub Actions job added to `.github/workflows/ci.yml` (triggers on `push/main` and `workflow_dispatch`); `EXPO_TOKEN` secret configured in GitHub repo Settings → Secrets. Remaining: fill store listings (screenshots, descriptions) for iOS App Store and Google Play.

---

## Infrastructure / DevOps

- [x] **CI pipeline** — `.github/workflows/ci.yml`: lint/type-check, unit tests (packages/core), e2e tests (API + Postgres + ES).
- [x] **Elasticsearch index auto-creation** — `SearchService.onApplicationBootstrap` creates the `providers` index with `providerMapping` if absent.
- [x] **Health check endpoint** — `GET /health` returns `{ status, db, es }` via `HealthController`.
- [x] **Rate limiting** — `@nestjs/throttler@^6` global guard (60/min); auth 5/min; search 30/min — shipped in milestone 005.
- [x] **Docker HEALTHCHECK + non-root user** — both Dockerfiles updated; `USER careequity`; `HEALTHCHECK` directives — shipped in milestone 005.
- [x] **Staging environment** — completed 2026-03-01: `docker-compose.staging.yml` was already well-structured; added `CORS_ORIGIN` env var to the api service (was the only gap). Stack requires `JWT_SECRET` to be set in environment (enforced via `:?` syntax). Not yet deployed to a cloud host.
- [x] **EAS Build** — `eas.json` profiles exist; CI job added; see Mobile section above for remaining steps.
- [x] **Self-hosted insurance logos** — completed 2026-03-01: 6 SVGs in `/public/logos/` (Aetna, BCBS, Cigna, Humana, Kaiser Permanente, UHC); `InsuranceLogo` component updated with local fallback.

---

## Documentation

- [x] **`CONTRIBUTING.md`** — completed 2026-03-01: branch naming, commit conventions, PR process, TDD requirement, test-running instructions, dev setup, and code style guide.
- [x] **`CHANGELOG.md`** — completed 2026-03-01: retroactive log from 0.1.0 (MVP) through Unreleased (M008); follows Keep a Changelog format.
- [x] **Swagger UI** — completed 2026-03-01: `@nestjs/swagger@^8` added; `SwaggerModule` wired in `main.ts`; all 11 controllers decorated with `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`; all 6 DTOs decorated with `@ApiProperty`. Accessible at `http://localhost:3001/api/docs`.
- [x] **`.env.example` comments** — completed 2026-03-01: all `SMTP_*`, `TWILIO_*`, `SENTRY_DSN`, and database pool variables documented inline with accepted values.
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
- [x] **Milestone 008**: Operational Excellence — CONTRIBUTING.md, CHANGELOG.md, Swagger UI, provider soft-delete, insurance typed array, self-hosted logos, NotificationService tests, HeroBanner UX fix, tooltip on filter pills, MailHog SMTP capture
