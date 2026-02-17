# Research: Minority Physician Locator Platform (CareEquity)

## Research Decisions

### Decision: Backend Architecture
- **Choice**: Node.js with NestJS
- **Rationale**: NestJS provides a structured, scalable architecture suitable for complex enterprise-grade APIs. Its built-in support for decorators and dependency injection aligns with our **Library-First** principle.
- **Alternatives considered**: Express (too minimal, lacks built-in structure), .NET Core (team expertise leans toward TypeScript).

### Decision: Search & Discovery
- **Choice**: Elasticsearch (Geo-Spatial queries)
- **Rationale**: PostgreSQL's PostGIS is capable but lacks the full-text and weighted ranking capabilities of Elasticsearch. Since search is our core value proposition, dedicated search infrastructure is required to meet the < 1.5s performance goal with 1M providers.
- **Alternatives considered**: Algolia (expensive at scale), PostgreSQL GIN indexes (limited geo features).

### Decision: Mobile Strategy
- **Choice**: React Native
- **Rationale**: Faster development for Phase 1 (U.S.) by sharing a codebase with the Web (Next.js) for core logic and types while delivering a native feel.
- **Alternatives considered**: Native Swift/Kotlin (higher maintenance cost for Phase 1), Flutter (different ecosystem than the rest of the TS/JS stack).

### Decision: HIPAA Compliance & PHI Redaction
- **Choice**: Custom PHI Redactor in the audit pipeline
- **Rationale**: Using a hybrid approach of rule-based (regex) and AI-assisted entity matching to ensure no PHI enters the review or logging system. This is non-negotiable for compliance.
- **Alternatives considered**: Manual redaction (unreliable), Third-party PHI APIs (potential data residency issues).

## Technical Unknowns Resolved
- **Geo-indexing**: Confirmed Elasticsearch `geo_point` mapping supports radius search (meters/miles) and sorting by distance.
- **Verification Logic**: Tiered model can be implemented as a state machine within the `packages/core` library to ensure consistent logic across API and CLI.
- **Accessibility**: WCAG 2.2 AA will be enforced via automated CI checks and linting rules.
