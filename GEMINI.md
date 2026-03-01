# our-care Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-28

## Active Technologies

- TypeScript / Node.js 20+ + NestJS 11, Next.js 16 (Turbopack), React Native / Expo 52, Elasticsearch 8.10, TypeORM (milestones 001-007)
- Docker, next-intl (i18n EN/ES/AR), shadcn/ui + Tailwind CSS, Sonner (toast), PostgreSQL + PostGIS
- `@nestjs/throttler@^6` (rate limiting), `@sentry/nestjs@^9` (error tracking), `ical-generator` (iCal export), `twilio` (SMS)
- Expo: `expo-secure-store`, `expo-location`, `expo-notifications`, `@react-native-async-storage/async-storage`
- Availity eligibility API (+ mock adapter), Epic FHIR, Athenahealth partner integrations

## Project Structure

```text
apps/
  api/       NestJS REST API
  web/       Next.js frontend (locale-prefixed routes)
  mobile/    React Native / Expo
packages/
  core/      Shared logic, types, ES client, auth utils
  db/        TypeORM entities + migrations
  cli/       Commander CLI
  ui/        Shared UI components
tests/
  contract/  Contract tests per endpoint group
specs/       Feature specs, data model, API contracts (OpenAPI)
docs/        DevOps runbook, architecture docs
```

## Commands

```bash
npm test; npm run lint; npm run build; docker-compose up --build
npm run dev --workspace=apps/web     # Web dev server (port 3000)
npm run start:dev --workspace=apps/api  # API dev server (port 3001)
cd apps/mobile && npm run start      # Expo dev server
```

## Code Style

TypeScript / Node.js 20+: Follow standard conventions. All shared logic in `packages/core`, never in apps.

## Recent Changes

- **001-physician-locator** (merged 2026-02-27): ZocDoc-inspired UI, ProviderSearchCard, HeroBanner, HorizontalSearchBar, StarRating, booking, availability grid, insurance logo pills, CI pipeline, health check, env var validation, multilingual support (EN/ES/AR), Docker full-stack orchestration.
- **002-provider-growth** (merged 2026-02-28): Provider bio field, cultural competency tags UI (IDENTITY_TAGS pill picker), telehealth badge, profile completeness score, email token claim (ProviderInvitation entity), onboarding wizard (4-step), i18n keys.
- **003-patient-experience** (merged 2026-02-28): Patient registration page, tooltip on insurance pills, ProviderSearchCard insurance row, search URL persistence, radius selector, appointment cancel endpoint, my-reviews endpoint, care-team page (3 sections).
- **004-mobile-parity** (merged 2026-02-28): Full React Native / Expo 52 mobile app — AuthContext (SecureStore JWT), LoginScreen, RegisterScreen, SearchScreen (GPS + ZIP + FilterSheet), ProfileScreen, BookingScreen, ConfirmationScreen, CareTeamScreen, local push notifications, offline TimedCache.
- **005-platform-scale** (merged 2026-02-28): Rate limiting (@nestjs/throttler@^6, 60/5/30 req/min tiers), DTOs + ValidationPipe, global exception filter, HTTP logging interceptor, DB connection pooling, analytics top-filters + zero-results endpoints, Sentry opt-in (API + web), Docker HEALTHCHECK + non-root user.
- **006-carryover** (merged 2026-02-28): SMS confirmations (Twilio), iCal export (ical-generator, GET /booking/appointment/:id/ical), phone field on User entity (migration 1771332000000-AddUserPhone), DevOps runbook (docs/devops-runbook.md, 784 lines).
- **007-community-growth** (merged 2026-02-28): SEO directory pages (generateStaticParams + JSON-LD), review verification badge (verified_patient bool + migration 1771335000000), HIPAA messaging (Message entity + migration 1771334000000, PHI redacted), insurance eligibility API (Availity + mock adapter), referral network (ProviderReferral entity + migration 1771333000000), community health resources (EN/ES/AR), Epic FHIR + Athenahealth integrations.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Obsidian Knowledge Base

The CareEquity project maintains a live Obsidian knowledge base in the `CareEquity` vault.
Notes are organized by domain and should be kept in sync with code changes.

### Updating Obsidian Notes (using MCP_DOCKER obsidian_ tools)

When making significant changes to the codebase, update the corresponding Obsidian note:

| Domain | Obsidian Note | When to Update |
|---|---|---|
| Architecture | `CareEquity/Architecture/System Overview.md` | Major structural changes |
| API | `CareEquity/API/Endpoints.md` | New endpoints, auth changes |
| Database | `CareEquity/Database/Schema.md` | New entities or migrations |
| Mobile | `CareEquity/Mobile/Expo App.md` | New screens or native features |
| Infrastructure | `CareEquity/Infrastructure/DevOps.md` | CI/CD, Docker, deployment changes |
| Milestones | `CareEquity/Milestones/[milestone].md` | After each milestone merge |
| TODOs | `CareEquity/TODOs.md` | After session close |
| Roadmap | `CareEquity/Roadmap.md` | After roadmap updates |

### Workflow
After each Claude Code session that ships features:
1. Run the `script-session-closer` agent — it updates docs and Obsidian notes automatically
2. The agent uses MCP_DOCKER `obsidian_` tools to write/update vault files
3. All changes are committed and pushed to origin
