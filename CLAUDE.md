# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareEquity is a minority physician locator platform. It is an npm-workspaces monorepo with two apps (`api`, `web`, `mobile`) and four packages (`core`, `db`, `cli`, `ui`). Package names use the `@careequity/` scope.

## Common Commands

### Root-level
```bash
npm install                        # Install all workspace dependencies
npm run build                      # tsc -b (TypeScript project references)
npm run lint                       # ESLint across the entire monorepo
npm run format                     # Prettier format
npm test                           # Jest (root config)
npm run db:migrate                 # Run TypeORM migrations
```

### API (NestJS)
```bash
npm run start:dev --workspace=apps/api    # Dev server with watch (port 3001)
npm run build --workspace=apps/api        # nest build
# Run a single e2e test file:
cd apps/api && npx jest test/search.e2e-spec.ts
```

### Web (Next.js)
```bash
npm run dev --workspace=apps/web     # Dev server (port 3000)
npm run build --workspace=apps/web   # next build
npm run lint --workspace=apps/web    # next lint
```

### Mobile (React Native / Expo)
```bash
cd apps/mobile && npm run start      # Expo dev server
```

### Database Migrations
```bash
npm run migration:run --workspace=packages/db
npm run migration:generate --workspace=packages/db   # (needs -n <Name> appended)
npm run migration:revert --workspace=packages/db
```

### CLI
```bash
# After building packages/cli:
node packages/cli/dist/index.js ingest --location "New York, NY" --limit 1000
node packages/cli/dist/index.js verify --provider-id <UUID> --tier 2 --status approved
node packages/cli/dist/index.js search --location "New York, NY"
```

### Infrastructure
```bash
docker-compose up -d postgres elasticsearch   # Start only infra
docker-compose up --build                     # Full stack (api + web + infra)
```

## Architecture

### Monorepo Layout
```
apps/
  api/       NestJS REST API (port 3001)
  web/       Next.js frontend (port 3000)
  mobile/    React Native / Expo
packages/
  core/      Shared business logic, types, utilities, ES client
  db/        TypeORM entities, migrations, AppDataSource
  cli/       Commander CLI for ingestion & admin operations
  ui/        Shared React component library (shadcn-style)
specs/       Feature specs, data model, contracts, tasks
tests/
  contract/  Contract tests for all API endpoints
```

### Data Flow
1. **Ingestion**: CLI (`packages/cli`) fetches from NPI registry → stores in PostgreSQL via TypeORM → indexes in Elasticsearch
2. **Search**: Web/Mobile → API `GET /providers?lat&lon&radius&specialty&insurance` → `SearchService` queries Elasticsearch (geo_distance + scoring boosts) → results cached in NodeCache (5 min TTL)
3. **Dual storage**: Provider data lives in PostgreSQL (source of truth) and Elasticsearch (search index). Profile updates via `PATCH /providers/:id` must sync to both.

### Key Architectural Patterns

**Library-first**: All shared logic lives in `packages/core`, not in apps. This includes:
- `esClient` / `INDEX_NAME` / `providerMapping` — Elasticsearch client & index config
- `AuthUtils` — JWT sign/verify + bcrypt hashing (no `@nestjs/jwt`, uses raw `jsonwebtoken`)
- `Redactor` — PHI redaction (SSN, email, phone, dates) applied to user-submitted reviews
- `AIModerator` — content moderation utility
- `VerificationStateMachine` — 3-tier state machine for provider verification
- Shared `Provider`, `User`, `Review`, `AuthPayload` TypeScript interfaces

**Verification tiers** (defined in both `packages/core/src/types/index.ts` and `packages/db/src/entities/Provider.ts`):
- Tier 1 = Professional (NPI license check)
- Tier 2 = Identity
- Tier 3 = Practice

**Auth**: JWT guard (`apps/api/src/guards/jwt-auth.guard.ts`) decodes the token and attaches `AuthPayload` to `req.user`. The payload includes `sub` (user UUID), `email`, `role` (`patient|provider|admin`), and optionally `providerId` when the user has a linked provider profile.

**Database**: PostgreSQL with the PostGIS extension (uses `postgis/postgis:15-3.3` Docker image). Provider `location` is stored as a PostGIS `geometry(Point, 4326)` column. Elasticsearch stores location as `geo_point` with `{ lat, lon }` — these formats differ and must be converted on write.

**i18n**: `next-intl` with locales `en`, `es`, `ar`. All web routes are prefixed with locale: `/[locale]/...`. Message files live in `apps/web/messages/`. The middleware is in `apps/web/src/proxy.ts`.

### Environment Variables
| Variable | Default | Used by |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | packages/db |
| `POSTGRES_PORT` | `5432` | packages/db |
| `POSTGRES_USER` | `admin` | packages/db |
| `POSTGRES_PASSWORD` | `password` | packages/db |
| `POSTGRES_DB` | `careequity` | packages/db |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | packages/core |
| `ELASTICSEARCH_USERNAME` | `elastic` | packages/core |
| `ELASTICSEARCH_PASSWORD` | `changeme` | packages/core |
| `JWT_SECRET` | `careequity-dev-secret` | packages/core |
| `PORT` | `3001` | apps/api |

### API Controllers (all in `apps/api/src/controllers/`)
- `ProviderController` — CRUD for providers, reviews, claim, verify-request
- `AdminController` — `PATCH /admin/verify/:id` (admin role required)
- `AuthController` — `POST /auth/register`, `POST /auth/login`
- `AnalyticsController` — admin analytics dashboard data
- `BookingController` — appointment booking

### Testing Strategy
- **Unit tests**: `packages/core/src/**/__tests__/` (PHI redactor, verification state machine)
- **E2E tests**: `apps/api/test/` (supertest against live NestJS app)
- **Contract tests**: `tests/contract/` (one file per endpoint group)
- TDD is mandatory per project spec — tests are written before implementation

### TypeScript Project References
The root `tsconfig.json` uses project references. Each package/app has its own `tsconfig.json`. Run `npm run build` (which invokes `tsc -b`) to compile in dependency order. The `@careequity/*` path aliases are configured in `tsconfig.base.json`.

## Session Close Workflow

When using the `script-session-closer` agent to end a development session, perform these cleanup tasks:

### Cleanup Steps
1. **Purge agent worktrees**: Remove temporary agent working directories
   ```bash
   rm -rf .claude/worktrees/
   ```
2. **Sync Obsidian vault**: Update the CareEquity vault using MCP_DOCKER `obsidian_` tools
3. **Update documentation**: Sync ROADMAP.md, TODO.md, and MEMORY.md with session changes
4. **Commit changes**: Stage and commit all documentation updates

### Obsidian Vault Structure
The CareEquity knowledge base is maintained in the Obsidian vault with this structure:
```
CareEquity/
  README.md                    # Project overview and navigation
  Roadmap.md                   # Milestone status and deliverables
  TODOs.md                     # Open items and tech debt
  Environment Variables.md    # Complete env var reference
  API/Endpoints.md            # REST endpoint documentation
  Architecture/
    System Overview.md        # Monorepo layout, data flow, patterns
    Tech Stack.md             # Dependency inventory
  Database/
    Schema.md                 # TypeORM entities and relationships
    Migrations.md             # Migration history
  Infrastructure/DevOps.md    # CI/CD, Docker, EAS Build
  Mobile/Expo App.md          # React Native app documentation
  Milestones/001-008.md       # Individual milestone details
```

### Obsidian Tool Error Handling

When using `obsidian_patch_content` and it fails with:
```
Error: Caught Exception. Error: Error 40080: The patch you provided could not be applied to the target content. invalid-target
```

**Workaround:** Delete the note and recreate it with the full updated content:
1. Use `obsidian_delete_file` to remove the problematic note
2. Use `obsidian_append_content` to create a new note with all content (creates file if it doesn't exist)
