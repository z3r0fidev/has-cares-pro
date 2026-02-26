# our-care Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies

- TypeScript / Node.js 20+ + NestJS, Next.js 16 (Turbopack), React Native, Elasticsearch, TypeORM (001-physician-locator)
- Docker, next-intl (i18n), shadcn/ui + Tailwind CSS, Sonner (toast), Postgres Analytics (Phase 7-9)

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
```

## Commands

```bash
npm test; npm run lint; npm run build; docker-compose up --build
npm run dev --workspace=apps/web     # Web dev server (port 3000)
npm run start:dev --workspace=apps/api  # API dev server (port 3001)
```

## Code Style

TypeScript / Node.js 20+: Follow standard conventions. All shared logic in `packages/core`, never in apps.

## Recent Changes

- 001-physician-locator: Implemented ZocDoc-inspired UI design system with gold branding and shadcn/ui.
- 001-physician-locator: Built ProviderSearchCard, HeroBanner, HorizontalSearchBar, StarRating, ProviderCardSkeleton components.
- 001-physician-locator: Refactored home page to full-width ZocDoc-style layout with insurance filter pills.
- 001-physician-locator: Added Toast notification system via Sonner replacing all alert() calls.
- 001-physician-locator: Dockerized the full stack (API, Web, DB, Search) for unified deployment.
- 001-physician-locator: Implemented full multilingual support (EN, ES, AR) with language switching.
- 001-physician-locator: Added advanced analytics for search performance and provider adoption.
- 001-physician-locator: Fixed all deprecation warnings, build errors, and improved monorepo type safety.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
