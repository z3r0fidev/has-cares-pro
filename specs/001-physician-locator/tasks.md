# Tasks: Minority Physician Locator Platform (CareEquity)

**Input**: Design documents from `/specs/001-physician-locator/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD is MANDATORY per project constitution (Principle IV). Tests must be written and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: 
  - `apps/api/src/`
  - `apps/web/src/`
  - `apps/mobile/src/`
  - `packages/core/src/`
  - `packages/cli/src/`
  - `packages/db/`
  - `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Initialize monorepo structure (apps/api, apps/web, apps/mobile, packages/core, packages/cli, packages/db)
- [x] T002 [P] Configure TypeScript project references and shared tsconfigs
- [x] T003 [P] Configure ESLint and Prettier for the entire monorepo
- [x] T004 [P] Setup Docker Compose for PostgreSQL and Elasticsearch in root directory
- [x] T005 [P] Initialize NestJS in apps/api/ and Next.js in apps/web/
- [x] T006 [P] Initialize React Native project in apps/mobile/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and Library/CLI foundations.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Setup TypeORM and migration framework in packages/db/
- [x] T008 [P] Create shared types for Provider, User, and Review in packages/core/src/types/
- [x] T009 [P] Implement core Validation logic (PHI Redactor) in packages/core/src/utils/redactor.ts
- [x] T010 [P] Implement base CLI framework (Oclif/Commander) in packages/cli/src/index.ts
- [x] T011 [P] Setup Elasticsearch client and index mappings in packages/core/src/search/
- [x] T012 Configure error handling and logging (structured logging) in packages/core/src/logger/
- [x] T047 [P] Implement JWT-based Auth utilities in packages/core/src/utils/auth.ts
- [x] T048 [P] Create User entity and relationship to Provider in packages/db/src/entities/User.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Provider Discovery (Priority: P1) 🎯 MVP

**Goal**: Enable patients to search for minority physicians by location, specialty, and language.

**Independent Test**: Enter ZIP code and filters; verify matching results return from Elasticsearch via API.

### Tests for User Story 1

- [x] T013 [P] [US1] Unit test for PHI redactor in packages/core/src/utils/__tests__/redactor.test.ts
- [x] T014 [P] [US1] Contract test for GET /providers in tests/contract/test_provider_search.ts
- [x] T015 [P] [US1] Integration test for Geo-search in apps/api/test/search.e2e-spec.ts

### Implementation for User Story 1

- [x] T016 [P] [US1] Create Provider entity in packages/db/src/entities/Provider.ts
- [x] T017 [US1] Implement Ingestion CLI command in packages/cli/src/commands/ingest.ts
- [x] T018 [US1] Implement Search service with Elasticsearch in apps/api/src/services/search.service.ts
- [x] T019 [US1] Implement GET /providers endpoint in apps/api/src/controllers/provider.controller.ts
- [x] T020 [US1] Build Search UI (Location/Filter inputs) in apps/web/src/components/Search/
- [x] T021 [US1] Build Search Results List in apps/web/src/components/Search/ResultsList.tsx
- [x] T049 [US1] Convert Specialty text input to standardized dropdown in apps/web/src/components/Search/SearchForm.tsx

**Checkpoint**: User Story 1 (Search) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Provider Profiles & Ratings (Priority: P1)

**Goal**: View detailed provider profiles and patient reviews.

**Independent Test**: Navigate to a profile; verify credentials, insurance, and ratings display correctly.

### Tests for User Story 2

- [x] T022 [P] [US2] Contract test for GET /providers/{id} in tests/contract/test_provider_profile.ts
- [x] T023 [P] [US2] Contract test for POST /providers/{id}/reviews in tests/contract/test_reviews.ts

### Implementation for User Story 2

- [x] T024 [P] [US2] Create Review entity in packages/db/src/entities/Review.ts
- [x] T025 [US2] Implement Provider Profile service in apps/api/src/services/provider.service.ts
- [x] T026 [US2] Implement Review service (with Redaction) in apps/api/src/services/review.service.ts
- [x] T027 [US2] Implement GET /providers/{id} and reviews endpoints in apps/api/src/controllers/provider.controller.ts
- [x] T028 [US2] Build Provider Profile view in apps/web/src/pages/providers/[id].tsx
- [x] T029 [US2] Build Review submission form in apps/web/src/components/Reviews/ReviewForm.tsx

**Checkpoint**: User Stories 1 AND 2 are functional.

---

## Phase 5: User Story 3 - Provider Verification Badge (Priority: P2)

**Goal**: Display validation badges (Tiers 1-3) on provider profiles.

**Independent Test**: Admin approves a verification record via CLI/Portal; verify badge appears on provider profile.

### Tests for User Story 3

- [x] T030 [P] [US3] Unit test for Verification state machine in packages/core/src/logic/__tests__/verification.test.ts
- [x] T031 [P] [US3] Contract test for PATCH /admin/verify/{id} in tests/contract/test_admin_verify.ts

### Implementation for User Story 3

- [x] T032 [P] [US3] Create VerificationRecord entity in packages/db/src/entities/VerificationRecord.ts
- [x] T033 [US3] Implement Verification logic (State Machine) in packages/core/src/logic/verification.ts
- [x] T034 [US3] Implement Admin Verify CLI command in packages/cli/src/commands/verify.ts
- [x] T035 [US3] Implement PATCH /admin/verify/{id} endpoint in apps/api/src/controllers/admin.controller.ts
- [x] T036 [US3] Update Profile UI to display Verification Badges in apps/web/src/components/Provider/Badge.tsx

---

## Phase 6: User Story 4 - Provider Portal (Priority: P2)

**Goal**: Allow physicians to claim profiles and update practice info.

**Independent Test**: Claim a profile with a token; verify update to practice hours persists.

### Tests for User Story 4

- [x] T037 [P] [US4] Contract test for POST /providers/{id}/claim in tests/contract/test_provider_claim.ts

### Implementation for User Story 4

- [x] T038 [US4] Implement Claiming logic in apps/api/src/services/claim.service.ts
- [x] T039 [US4] Implement POST /providers/{id}/claim endpoint in apps/api/src/controllers/provider.controller.ts
- [x] T040 [US4] Build Provider Dashboard in apps/web/src/app/portal/dashboard/page.tsx
- [x] T041 [US4] Build Practice Edit form in apps/web/src/components/Portal/PracticeForm.tsx
- [x] T050 [US4] Implement JWT Auth flow and login page in apps/web/src/app/login/page.tsx

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T042 [P] Finalize WCAG 2.2 AA accessibility audit and fixes
- [x] T043 [P] Implement mobile-specific search and profiles in apps/mobile/src/
- [x] T044 Run full integration test suite against local Docker environment
- [x] T045 Update root README.md with final deployment and usage instructions
- [x] T046 Run quickstart.md validation from scratch

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)** -> **Foundational (Phase 2)**
2. **Foundational (Phase 2)** -> **ALL User Stories (Phases 3-6)**
3. **User Story 1 (P1)** is the MVP and should be prioritized first.

### Parallel Opportunities

- Phase 1 and 2 tasks marked [P] can be assigned to different developers.
- Once Phase 2 completes, Phase 3 (US1) and Phase 4 (US2) can proceed in parallel as they have minimal overlapping implementation beyond shared models.
- Verification (US3) and Portal (US4) depend on the core Provider model but can be developed independently of the Search UI.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete Phase 3: Provider Discovery.
3. **VALIDATE**: Run `npx our-care-cli ingest` then search via web UI.

### Incremental Delivery

- **Increment 1**: Search + Basic Profiles (US1 + US2 partial)
- **Increment 2**: Reviews + Full Profiles (US2)
- **Increment 3**: Verification & Badges (US3)
- **Increment 4**: Provider Self-Management (US4)
