# Architecture Decision Records (ADRs)

This directory contains all architectural decisions made during the development of the Masking game.

---

## ADR Index

### Phase 1: Architecture

**[ADR 0001: Technology Stack Selection](./0001-technology-stack-selection.md)** (Inferred)
- **Status**: Accepted
- **Decision**: Use Phaser 3 + TypeScript + Bun with YAML-based narrative scripting
- **Rationale**: Game engine maturity, type safety, fast runtime, data-driven design

**[ADR 0002: Four-Layer Architecture Design](./0002-four-layer-architecture.md)** (Inferred)
- **Status**: Accepted
- **Decision**: Implement Core, Game Logic, Script Interpretation, and Presentation layers
- **Rationale**: Clear separation of concerns, testability, maintainability

### Phase 2: Design

**[ADR 0003: UX and Design Decisions](./0003-ux-design-decisions.md)** (Inferred)
- **Status**: Accepted
- **Decision**: Comic Relief font, skippable tutorial, single balanced difficulty
- **Rationale**: Accessibility (dyslexia-friendly), user autonomy, focused experience

### Phase 3: Scaffolding

**[ADR 0004: Project Scaffolding Structure](./0004-project-scaffolding-structure.md)**
- **Status**: Accepted
- **Decision**: Vite bundler, path aliases, localStorage persistence, directory structure
- **Rationale**: Fast development, clean imports, zero backend, architectural clarity

### Phase 5: Deployment

**[ADR 0005: GitHub Pages Deployment Strategy](./0005-github-pages-deployment.md)**
- **Status**: Accepted
- **Decision**: Deploy to GitHub Pages using automated GitHub Actions workflow
- **Rationale**: Zero cost, automated CI/CD, no external dependencies

---

## ADR Format

Each ADR follows this structure:

1. **Status**: Accepted | Deprecated | Superseded
2. **Date**: Decision date
3. **Decision Makers**: Who approved the decision
4. **Phase**: POF workflow phase
5. **Context**: Problem being solved
6. **Decision**: What was decided
7. **Rationale**: Why this decision was made
8. **Consequences**: Positive, negative, and neutral outcomes
9. **Verification**: How the decision was validated (if applicable)
10. **Notes**: Additional context or future considerations

---

## Notes

- ADRs 0001-0003 are inferred from POF decisions.json but not yet written as full documents
- ADRs are immutable - if a decision changes, create a new ADR and mark the old one as "Superseded"
- All ADRs created during POF workflow tracked in `.claude/context/decisions.json`

---

## Related Documentation

- **Project Context**: `.claude/CLAUDE.md`
- **Implementation Plan**: `.claude/context/implementation-plan.md`
- **Architecture Proposal**: `.claude/context/architecture-proposal.md`
- **Design Proposal**: `.claude/context/design-proposal.md`
- **Security Review**: `.claude/context/security-review.md`
- **Deployment Plan**: `.claude/context/deployment-plan.md`
