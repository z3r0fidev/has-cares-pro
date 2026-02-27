<!--
Sync Impact Report:
- Version change: none → 1.0.0
- List of modified principles:
  - PRINCIPLE_1: Library-First Architecture (Created)
  - PRINCIPLE_2: CLI-First Interface (Created)
  - PRINCIPLE_3: Spec-Driven Development (SDD) (Created)
  - PRINCIPLE_4: Test-First Discipline (Created)
  - PRINCIPLE_5: Independent User Stories (Created)
- Added sections: Core Principles, Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: none
-->

# our-care Constitution

## Core Principles

### I. Library-First Architecture
Every feature starts as a standalone library or package. Libraries must be self-contained, independently testable, and documented. Clear purpose is required for every library—organizational-only libraries are discouraged.

### II. CLI-First Interface
Every library exposes its core functionality via a Command Line Interface (CLI). We follow a text-in/out protocol: stdin and arguments for input, stdout for results, and stderr for errors. This ensures maximum composability and ease of automation.

### III. Spec-Driven Development (SDD)
No feature implementation starts without a finalized `spec.md` and `plan.md`. The specification is the single source of truth for feature requirements and success criteria. Planning must precede execution to ensure architectural alignment.

### IV. Test-First Discipline
Test-Driven Development (TDD) is mandatory when tests are required by the specification. Tests must be written and fail before any implementation begins. The Red-Green-Refactor cycle is strictly enforced to ensure code quality and requirement coverage.

### V. Independent User Stories
Features must be broken down into prioritized (P1, P2, P3), independently testable user stories. This enables incremental delivery, parallel development, and a focus on delivering a Minimum Viable Product (MVP) first.

## Additional Constraints

- **Technology Stack**: We prioritize modern, type-safe languages (e.g., TypeScript/Node.js, Rust, Go) and established frameworks that support our CLI-first and library-first goals.
- **Documentation**: All APIs and CLI tools must be accompanied by clear documentation, including OpenAPI specs where applicable.

## Development Workflow

- **Feature Branching**: All work must occur on feature branches named `[###]-feature-name`.
- **Quality Gates**: Every implementation plan must pass a "Constitution Check" before research or design begins.
- **Review Process**: Code reviews must verify adherence to the principles outlined in this constitution.

## Governance

- **Authority**: This constitution is the ultimate authority for development practices within the our-care project.
- **Amendments**: Changes to this constitution require documentation of the rationale, a version bump, and an update to all dependent templates.
- **Versioning**: We follow Semantic Versioning (SemVer) for this document. MAJOR for principle removals/redefinitions, MINOR for additions, PATCH for clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
