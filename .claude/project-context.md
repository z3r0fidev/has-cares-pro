# Project Context

> High-level project information for CareEquity
> Last updated: 2026-03-02

---

## Project Overview

**Name:** CareEquity
**Description:** Minority physician locator platform connecting patients from underserved communities with culturally competent physicians
**Repository:** z3r0fidev/has-cares-pro
**Tech Stack:** NestJS, Next.js, React Native/Expo, PostgreSQL, Elasticsearch
**Status:** 8 milestones complete, production-ready

---

## Architecture

### Monorepo Structure
```
apps/
  api/       - NestJS REST API (port 3001)
  web/       - Next.js frontend (port 3000)
  mobile/    - React Native/Expo mobile app
packages/
  core/      - Shared business logic, types, utilities
  db/        - TypeORM entities, migrations
  cli/       - Commander CLI for ingestion
  ui/        - Shared React components (shadcn-style)
```

### Key Technologies
- **Backend:** NestJS 11, TypeORM, PostgreSQL 15 + PostGIS, Elasticsearch 8.10
- **Frontend:** Next.js 16, shadcn/ui, Tailwind CSS, next-intl (EN/ES/AR)
- **Mobile:** Expo 52, React Native, expo-secure-store, expo-location
- **Infrastructure:** Docker Compose, GitHub Actions CI, EAS Build
- **Integrations:** Twilio SMS, Availity eligibility, Epic FHIR, Athenahealth

### Data Flow
1. Ingestion: CLI → PostgreSQL → Elasticsearch indexing
2. Search: Web/Mobile → API → Elasticsearch geo-search → NodeCache (5min TTL)
3. Dual storage: PostgreSQL (source of truth) + Elasticsearch (search index)

---

## Development Practices

### Guiding Principles
1. **Library-first** - Shared logic in packages/core
2. **TDD mandatory** - Tests before implementation
3. **i18n by default** - EN/ES/AR for all user-facing strings
4. **Privacy-first** - PHI redaction, no PII in Elasticsearch
5. **Accessibility** - WCAG 2.2 AA minimum

### Branch Strategy
- `main` - production-ready code
- Feature branches: `001-physician-locator`, `002-provider-growth`, etc.
- All milestones merged to main

### Testing Strategy
- Unit tests: `packages/core/src/**/__tests__/`
- E2E tests: `apps/api/test/`
- Contract tests: `tests/contract/`

---

## Milestones

All 8 milestones complete:

1. **001 - Physician Locator MVP** (2026-02-27) - Core platform functionality
2. **002 - Provider Growth & Trust** (2026-02-28) - Provider portal enhancements
3. **003 - Patient Experience** (2026-02-28) - Patient-facing features
4. **004 - Mobile Parity** (2026-02-28) - React Native app
5. **005 - Platform & Scale** (2026-02-28) - Production hardening
6. **006 - Carryover** (2026-02-28) - SMS, iCal, phone collection
7. **007 - Community & Growth** (2026-02-28) - SEO, messaging, referrals
8. **008 - Operational Excellence** (2026-03-01) - DevEx, docs, final polish

---

## Key Entities

### Provider
- Core entity for physician profiles
- Includes: NPI, name, specialty, location (PostGIS), insurance, languages
- 3-tier verification badges (Professional, Identity, Practice)
- Soft-delete support (deleted_at column)

### User
- Authentication and profile management
- Roles: patient, provider, admin
- JWT-based authentication

### Appointment
- Booking records linking patients to providers
- Used for verification badges and messaging

### Review
- Patient reviews with star ratings
- Verified patient badge based on booking history
- PHI redaction applied

---

## Environment

### Required Variables
See `.env.example` for complete list. Key variables:
- Database: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- Elasticsearch: ELASTICSEARCH_NODE, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD
- Auth: JWT_SECRET
- Optional: SMTP_*, TWILIO_*, SENTRY_DSN

### Infrastructure
- Docker Compose for local development
- GitHub Actions CI/CD
- EAS Build for mobile app deployment
- Staging environment via docker-compose.staging.yml

---

## Documentation

### Primary Docs
- `CLAUDE.md` - Claude Code guidance
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history (0.1.0 - 0.8.0)
- `ROADMAP.md` - Milestone tracking
- `TODO.md` - Open items and tech debt
- `docs/devops-runbook.md` - DevOps procedures

### Obsidian Vault
Comprehensive knowledge base at `C:\Users\isaiah.muhammad\obsidian\CareEquity\`:
- Architecture documentation
- API endpoint reference
- Database schema
- Migration history
- Environment variable reference

### API Documentation
- Swagger UI: `http://localhost:3001/api/docs`
- All 11 controllers and 6 DTOs documented
