# CareEquity — TODO

> Living task list. Tracks open work, known gaps, and tech debt across the monorepo.
> Completed feature tasks live in `specs/001-physician-locator/tasks.md`.
> Last updated: 2026-02-27

---

## Branch: `001-physician-locator` — Pre-Merge Checklist

All 59 spec tasks are complete. The following items remain before merging to `main`.

### High Priority (must-do before merge)

- [ ] **Push branch to remote** — SSH key unavailable in WSL; must push manually or switch remote to HTTPS
  ```bash
  git remote set-url origin https://github.com/<org>/our-care.git
  git push origin 001-physician-locator
  ```
- [ ] **Run database migrations on staging** — `npm run migration:run --workspace=packages/db` against a real Postgres + PostGIS instance
- [ ] **End-to-end smoke test** — `docker-compose up --build`, ingest NYC providers via CLI, confirm search + profile pages render in browser
- [ ] **Contract tests green** — `cd apps/api && npx jest test/` against live Docker environment

### Medium Priority (should-do before merge)

- [ ] **InsuranceLogo: Tooltip on filter pills** — wrap HeroBanner pill buttons in shadcn `<Tooltip>` to surface full insurer name on hover/focus
  - Install: `cd apps/web && npx shadcn@latest add tooltip`
  - Target: `apps/web/src/components/Search/HeroBanner.tsx`
- [ ] **InsuranceLogo: Active/selected pill state** — HeroBanner pills have no visual toggled state after click; add `ring-2 ring-primary bg-primary/10 font-semibold` when a pill is selected
  - Target: `apps/web/src/components/Search/HeroBanner.tsx`
- [ ] **SMTP configuration tested** — verify `NotificationService` sends emails end-to-end with a real SMTP provider (e.g. Resend, Mailgun, or SMTP4Dev locally)
- [ ] **Legal disclaimer** — add "All insurance logos are registered trademarks of their respective owners" to footer or `terms-of-service.md` before production launch

### Low Priority (nice-to-have before merge)

- [ ] **Self-hosted insurance logos** — Clearbit has no production SLA; download logos to `apps/web/public/logos/insurance/` and update `INSURER_DOMAIN_MAP` to use local paths
- [ ] **WCAG audit on InsuranceLogo** — run axe-core against HeroBanner and provider profile insurance section to confirm no new a11y regressions
- [ ] **`npm run search:sync` alias** — add a root-level `package.json` convenience script that wraps the CLI ingest command for discoverability

---

## Open Technical Debt

### API (`apps/api`)

- [ ] **`NotificationService` unit test** — no test exists for `notifyOverdueProviders()`; mock `AppDataSource` and `nodemailer` and assert query behavior + email dispatch
- [ ] **Error boundary on provider profile API fetch** — `page.tsx` has no error state if `fetch /providers/:id` returns 4xx/5xx; add loading skeleton or redirect
- [ ] **`PATCH /providers/:id` dual-write to Elasticsearch** — profile updates persist to PostgreSQL but the Elasticsearch index is not re-indexed on update; stale search results will appear after a provider edits their profile
- [ ] **JWT expiry not enforced on frontend** — expired tokens are stored in `localStorage` and sent to the API which rejects them, but the web app has no token refresh or re-login redirect

### Web (`apps/web`)

- [ ] **`HeroBanner` `+ Add Insurance` button is a no-op** — `onClick={() => {}}` placeholder; should open a modal or route to the insurance filter dropdown
- [ ] **`ProviderSearchCard` missing `insurance` prop** — the card does not display accepted insurance; adding a compact `InsuranceLogo` row to Zone 2 would improve patient matching at a glance
- [ ] **Booking confirmation page missing** — `AppointmentForm` submits to the API but routes nowhere; patients have no confirmation screen
- [ ] **`ResultsList` has no empty-state UI** — when search returns zero results there is no visual feedback beyond an empty list
- [ ] **`HeroBanner` insurance pills not wired to search** — `onInsuranceSelect` fires but the ResultsList is not filtered; the wiring between HeroBanner and ResultsList needs a shared filter state

### Database / Migrations

- [ ] **`provider.insurance` is a plain `VARCHAR`** — accepts any string; should be validated against `INSURANCE_PROVIDERS` from `@careequity/core` or migrated to a `simple-array` / JSONB column with enum validation
- [ ] **No soft-delete on `Provider`** — deactivated providers are hard-deleted, which breaks referential integrity in `Review`, `Appointment`, and `SavedProvider` tables

### Mobile (`apps/mobile`)

- [ ] **Authentication not implemented** — mobile app has no login or JWT flow; cannot access protected API endpoints
- [ ] **Push notifications for booking** — `Appointment` entity exists but no mobile push notification is sent on booking confirmation or cancellation

---

## Infrastructure / DevOps

- [ ] **CI pipeline missing** — no GitHub Actions workflow for lint, type-check, unit tests, or build validation on pull requests
- [ ] **`.env.example` has no validation** — consider adding a startup check (e.g. `envalid` or `zod`) to `apps/api/src/main.ts` that throws if required env vars are absent
- [ ] **No health check endpoint** — add `GET /health` returning `{ status: 'ok', db: bool, es: bool }` to `apps/api` for uptime monitoring
- [ ] **Elasticsearch index auto-creation** — `SearchService` assumes the index exists; add an `onApplicationBootstrap` hook that creates the index with mappings if absent
- [ ] **Docker image sizes** — no multi-stage builds; API and web Dockerfiles produce large images; add multi-stage builds and `.dockerignore` files

---

## Documentation

- [ ] **`CONTRIBUTING.md`** — document branch naming, PR process, commit conventions, and TDD requirement for new contributors
- [ ] **`CHANGELOG.md`** — retroactively document all changes from initial commit through `001-physician-locator`
- [ ] **API docs** — OpenAPI spec exists in `specs/001-physician-locator/contracts/` but is not served at runtime; add Swagger UI at `/api/docs` via `@nestjs/swagger`
- [ ] **Environment variable validation docs** — document each `SMTP_*` variable purpose and accepted values in README and `.env.example` comments
