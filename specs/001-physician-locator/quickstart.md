# Quickstart: Minority Physician Locator Platform (CareEquity)

## Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL and Elasticsearch)
- Git

## Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/our-care/our-care.git
   cd our-care
   ```

2. **Initialize Infrastructure**:
   ```bash
   docker-compose up -d
   # Launches PostgreSQL on port 5432 and Elasticsearch on port 9200
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and update the database and search credentials.
   ```bash
   cp .env.example .env
   ```

## Development Workflow

### 1. Database Migrations
```bash
npm run db:migrate
```

### 2. Initial Ingestion (CLI-First)
Use the CLI tool to ingest initial provider data from the NPI registry.
```bash
# Ingest first 1000 providers in NYC
npx our-care-cli ingest --location "New York, NY" --limit 1000
```

### 3. Ingest Provider Data
Use the CLI to ingest providers and automatically populate the Elasticsearch index.
```bash
node packages/cli/dist/index.js ingest --location "New York, NY" --limit 100
```

### 4. Start API (NestJS)
```bash
cd apps/api
npm run start:dev
```

## Core Principles in Action

### Library-First (Shared Logic)
Core business logic, like the 3-tier verification state machine, resides in `packages/core`.
```typescript
import { ProviderVerification } from '@careequity/core';
const status = ProviderVerification.calculateTier(npiRecord, identityDocs);
```

### CLI-First (Automation & Ingestion)
Every core capability is exposed via the CLI located in `packages/cli`.
```bash
# Verify a provider identity manually via CLI
npx our-care-cli verify --provider-id <UUID> --tier 2 --status approved
```

### Test-First (Verification)
Run contract and integration tests to ensure compliance with the specification.
```bash
npm test
```
