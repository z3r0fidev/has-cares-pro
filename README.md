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

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Run API**
   ```bash
   npm run start:dev --workspace=apps/api
   ```

4. **Run Web App**
   ```bash
   npm run dev --workspace=apps/web
   ```

## CLI Tools
Use the CLI for ingestion and verification:
```bash
npx careequity ingest --location "New York, NY"
npx careequity verify --provider-id <ID> --tier 2 --status approved
```
