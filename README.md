# CareEquity - Minority Physician Locator

## Project Overview
CareEquity enables users to locate, evaluate, and connect with reputable minority physicians and healthcare practices. It features a ZocDoc-inspired design system with gold branding, provider search cards, real-time availability, and multi-language support (EN / ES / AR).

## Tech Stack
| Layer | Technology |
|---|---|
| **API** | NestJS (Node.js 20+) — port 3001 |
| **Web** | Next.js 16 + Turbopack + next-intl — port 3000 |
| **Mobile** | React Native / Expo |
| **Database** | PostgreSQL + PostGIS |
| **Search** | Elasticsearch |
| **UI** | shadcn/ui + Tailwind CSS |
| **Monorepo** | npm workspaces |

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Infrastructure
```bash
docker-compose up -d postgres elasticsearch
```

### 3. Run Database Migrations
```bash
npm run migration:run --workspace=packages/db
```

### 4. Start Development Servers
```bash
# API (port 3001)
npm run start:dev --workspace=apps/api

# Web (port 3000)
npm run dev --workspace=apps/web

# Mobile (Expo)
cd apps/mobile && npm run start
```

### 5. Full Stack (Docker)
```bash
docker-compose up --build
```

## Development Commands

| Command | Description |
|---|---|
| `npm run build` | Build all packages (TypeScript project references) |
| `npm run lint` | ESLint across entire monorepo |
| `npm run format` | Prettier format |
| `npm test` | Jest unit + integration tests |
| `npm run db:migrate` | Run TypeORM migrations |

## CLI Tools

```bash
# Ingest providers from NPI registry
node packages/cli/dist/index.js ingest --location "New York, NY" --limit 1000

# Verify a provider
node packages/cli/dist/index.js verify --provider-id <UUID> --tier 2 --status approved

# Search providers
node packages/cli/dist/index.js search --location "New York, NY"
```

## Project Structure

```
apps/
  api/       NestJS REST API (port 3001)
  web/       Next.js frontend (port 3000)
  mobile/    React Native / Expo
packages/
  core/      Shared business logic, types, ES client
  db/        TypeORM entities + migrations
  cli/       Commander CLI for ingestion & admin
  ui/        Shared React components (shadcn-style)
specs/       Feature specs, data model, API contracts
tests/
  contract/  Contract tests for all API endpoints
```

## UI Design System

The web app uses a ZocDoc-inspired design system:

- **Brand gold**: `#F5BE00` (`--primary` CSS token)
- **Components**: shadcn/ui (Button, Card, Badge, Dialog, Select, Skeleton, Toaster)
- **Custom components**: `ProviderSearchCard`, `HeroBanner`, `HorizontalSearchBar`, `StarRating`, `ProviderCardSkeleton`

## Verification Tiers

| Tier | Name | Description |
|---|---|---|
| 1 | Professional | NPI license check |
| 2 | Identity | Identity verification |
| 3 | Practice | Practice verification |

## Internationalization

Routes are locale-prefixed: `/en/`, `/es/`, `/ar/`. Message files live in `apps/web/messages/`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Elasticsearch URL |
| `JWT_SECRET` | `careequity-dev-secret` | JWT signing secret |
| `PORT` | `3001` | API port |
