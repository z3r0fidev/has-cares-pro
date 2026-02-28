# CareEquity — TODO

> Living task list. Tracks open work, known gaps, and tech debt across the monorepo.
> Completed feature tasks live in `specs/001-physician-locator/tasks.md`.
> Last updated: 2026-02-27

---

## Ship Readiness

### Blocking launch — must fix before production traffic

- [ ] **`docker-compose up --build` browser smoke test** — full stack build + NYC provider ingest via CLI + visual confirmation that search and profile pages render. Needs a human in a browser; infra confirmed healthy locally.
- [ ] **SMTP tested end-to-end** — `NotificationService` cron fires in production but has never sent a real email. Point `SMTP_*` env vars at Resend / Mailgun / SMTP4Dev and trigger a test send before launch.

### Should-fix before launch — won't crash the app but will hurt users

- [ ] **JWT expiry not enforced on frontend** — expired tokens live in `localStorage` indefinitely; the API returns 401 with no UX recovery (no re-login redirect, no toast). Add a `fetch` wrapper that catches 401 and redirects to `/login`.
- [ ] **`PATCH /providers/:id` dual-write to Elasticsearch** — profile edits persist to PostgreSQL but the ES index is never updated. Providers who edit their name, specialty, or insurance appear stale in search results until a full re-index.
- [ ] **Error boundary on provider profile page** — `apps/web/src/app/[locale]/providers/[id]/page.tsx` has no error handling; a 404/500 from the API renders a blank page with no message or redirect.
- [ ] **Env var validation on API startup** — missing `POSTGRES_HOST`, `JWT_SECRET`, etc. cause runtime failures deep inside requests rather than a clear boot-time error. Add a `zod` or `envalid` check in `apps/api/src/main.ts`.

---

## Open Technical Debt

### API (`apps/api`)

- [ ] **`NotificationService` unit test** — no test for `notifyOverdueProviders()`; mock `AppDataSource` and `nodemailer`, assert query + email dispatch behavior.
- [ ] **`notification.service.ts` TypeScript error** — `last_insurance_notified_at` is not typed on `_QueryDeepPartialEntity<Provider>`; pre-existing, does not block build but should be fixed.

### Web (`apps/web`)

- [ ] **`HeroBanner` `+ Add Insurance` button is a no-op** — `onClick={() => {}}` placeholder at line 58 of `HeroBanner.tsx`; should open a modal or scroll to the insurance dropdown in the search bar.
- [ ] **`ProviderSearchCard` missing insurance display** — card shows name, specialty, distance, and rating but no accepted insurance; adding a compact 2–3 logo row in Zone 2 would improve patient matching at a glance.
- [ ] **InsuranceLogo: Tooltip on filter pills** — HeroBanner pills have no tooltip; wrap in shadcn `<Tooltip>` to surface full plan name on hover/focus (`cd apps/web && npx shadcn@latest add tooltip`).

### Database / Migrations

- [ ] **`provider.insurance` is a plain `VARCHAR`** — accepts any string with no validation against `INSURANCE_PROVIDERS` from `@careequity/core`; should be a `simple-array` or JSONB column with enum enforcement.
- [ ] **No soft-delete on `Provider`** — hard deletes break referential integrity in `Review`, `Appointment`, and `SavedProvider` tables. Add a `deleted_at` column and TypeORM `@DeleteDateColumn`.

### Mobile (`apps/mobile`)

- [ ] **Authentication not implemented** — `SearchScreen.tsx` and `ProfileScreen.tsx` exist but there is no login flow, JWT storage, or token attachment to API requests; all protected endpoints are unreachable from mobile.
- [ ] **Push notifications for booking** — `Appointment` entity exists but no Expo push notification is sent on booking confirmation or cancellation.

---

## Infrastructure / DevOps

- [x] **CI pipeline** — `.github/workflows/ci.yml`: lint/type-check, unit tests (packages/core), e2e tests (API + Postgres + ES).
- [x] **Elasticsearch index auto-creation** — `SearchService.onApplicationBootstrap` creates the `providers` index with `providerMapping` if absent.
- [x] **Health check endpoint** — `GET /health` returns `{ status, db, es }` via `HealthController`.
- [ ] **Docker image sizes** — Dockerfiles have no `.dockerignore` and copy full `node_modules` into the final image; add multi-stage builds and `.dockerignore` to reduce image size.
- [ ] **Rate limiting on search** — no per-IP throttling on `GET /providers`; add `@nestjs/throttler` before exposing to the public internet.

---

## Documentation

- [ ] **`CONTRIBUTING.md`** — branch naming, PR process, commit conventions, TDD requirement.
- [ ] **`CHANGELOG.md`** — retroactive log from initial commit through current main.
- [ ] **Swagger UI** — OpenAPI spec exists in `specs/001-physician-locator/contracts/` but is not served at runtime; add `@nestjs/swagger` and expose at `/api/docs`.
- [ ] **`.env.example` comments** — document each `SMTP_*` variable and its accepted values inline.

---

## Completed (reference)

- [x] All 59 `specs/001-physician-locator` feature tasks
- [x] Push to remote, DB migrations (9), contract tests (1/1)
- [x] CI pipeline with GitHub Actions
- [x] ES index auto-creation on bootstrap
- [x] `GET /health` endpoint (`{ status, db, es }`)
- [x] Insurance filter pills wired to search (active state + auto-re-run)
- [x] Booking confirmation page (`/[locale]/booking/confirmation`)
- [x] Empty search state (SearchX icon + suggestions)
- [x] Legal disclaimer for insurance logos (footer in `layout.tsx`)
- [x] `@nestjs/schedule` bumped ^4 → ^6 for NestJS 11 compatibility
