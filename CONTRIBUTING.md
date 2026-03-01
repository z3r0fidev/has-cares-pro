# Contributing to CareEquity

Thank you for your interest in contributing to CareEquity — the minority physician locator platform.
By participating in this project you agree to abide by our Code of Conduct (see `CODE_OF_CONDUCT.md` when added).

---

## Branch Naming

Use a prefix that reflects the type of change, followed by a short kebab-case descriptor.
When the change is tied to a milestone, include the milestone number.

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `chore/` | Maintenance, dependency updates, tooling |
| `docs/` | Documentation only |

**Examples**

```
feat/007-fhir-availability
fix/search-geo-point-conversion
chore/bump-nestjs-11
docs/update-contributing
```

---

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).
The CI lint job enforces the format — PRs with non-conforming commits will fail.

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: Co-Authored-By, Fixes #issue, etc.]
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`

**Scope** (optional): `api`, `web`, `mobile`, `db`, `core`, `cli`, `ui`, `infra`

**Examples**

```
feat(api): add FHIR availability endpoint
fix(web): correct geo_point conversion on provider update
chore: bump @nestjs/schedule to ^6
docs(api): add Swagger decorators to all controllers
```

---

## Pull Request Process

1. **Target branch**: `main` (all PRs target `main` directly — no long-lived feature branches)
2. **PR title**: Must follow Conventional Commits format (same as commit messages)
3. **Fill the PR template**: Include a description, test plan, and link to the relevant milestone issue
4. **Approvals**: At least one approval from a maintainer is required before merging
5. **Merge strategy**: Squash merge — the squash commit message becomes the canonical history entry
6. **No force-pushes to `main`**: Use `--force-with-lease` on feature branches only if absolutely necessary

---

## TDD Requirement

CareEquity follows Test-Driven Development. Tests must be written **before or alongside** the implementation — not after.

- **Unit tests**: `packages/core/src/**/__tests__/` and `apps/api/src/**/__tests__/`
  - File naming: `*.spec.ts` or `*.test.ts`
  - Framework: Jest + `@nestjs/testing`
- **E2E tests**: `apps/api/test/`
  - Framework: Supertest against a live NestJS app
  - One spec file per controller group (e.g. `search.e2e-spec.ts`)
- **No PR will be merged with failing tests.** CI blocks the merge automatically.

---

## Running Tests Locally

```bash
# Unit tests (packages/core + apps/api)
npm test

# Run a single unit test file
npm test -- --testPathPattern=notification.service.spec

# API e2e tests (requires postgres + elasticsearch running)
npm run test:e2e --workspace=apps/api

# Run a single e2e spec
cd apps/api && npx jest test/search.e2e-spec.ts
```

---

## Development Setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Elasticsearch + MailHog)
docker-compose up -d postgres elasticsearch mailhog

# 3. Run database migrations
npm run db:migrate

# 4. Start the API in watch mode
npm run start:dev --workspace=apps/api

# 5. Start the web frontend
npm run dev --workspace=apps/web
```

MailHog UI is available at `http://localhost:8025` for inspecting outbound emails in development.

---

## Code Style

- **Linter**: ESLint — run `npm run lint` before committing
- **Formatter**: Prettier — run `npm run format` before committing
- **No `any` types** without an explicit comment explaining why it cannot be avoided
- **Library-first**: All shared logic belongs in `packages/core`, not in individual apps
- **i18n**: Any user-visible string in `apps/web` must use `next-intl` with keys in `en.json`, `es.json`, and `ar.json`
- **Environment variables**: New env vars must be added to `.env.example` and documented in `CLAUDE.md`

Run both checks together before pushing:

```bash
npm run lint && npm run format
```
