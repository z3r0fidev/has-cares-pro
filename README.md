# CareEquity - Minority Physician Locator

## Project Overview
CareEquity enables users to locate, evaluate, and connect with reputable minority physicians and healthcare practices.

## Tech Stack
- **API**: NestJS (Node.js)
- **Web**: Next.js (React)
- **Mobile**: React Native
- **Database**: PostgreSQL
- **Search**: Elasticsearch
- **Monorepo**: npm workspaces

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Infrastructure (Databases & Search)**
   ```bash
   docker-compose up -d postgres elasticsearch
   ```

3. **Start Full Stack (API & Web)**
   ```bash
   # Build and start all services (API, Web, DB, Search)
   docker-compose up --build
   ```

## Development

- **Run API**: `npm run start:dev --workspace=apps/api`
- **Run Web App**: `npm run dev --workspace=apps/web`
- **Run Mobile**: `cd apps/mobile && npm run start` (Requires Expo)
- **Lint**: `npm run lint`
- **Build**: `npm run build`

## CLI Tools
Use the CLI for ingestion and verification:
```bash
npx careequity ingest --location "New York, NY"
npx careequity verify --provider-id <ID> --tier 2 --status approved
```
