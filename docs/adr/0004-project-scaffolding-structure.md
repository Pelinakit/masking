# ADR 0004: Project Scaffolding Structure

**Status:** Accepted
**Date:** 2026-01-31
**Decision Makers:** POF Orchestrator
**Phase:** 3.4 Scaffolding

## Context

The project requires a foundational structure that supports the four-layer architecture (Core, Game Logic, Script Interpretation, Presentation) and facilitates rapid development with TypeScript, Phaser 3, and Bun.

## Decision

Implement the following scaffolding structure:

### Directory Structure
```
masking/
├── src/
│   ├── core/           # Engine foundation - Phaser lifecycle
│   ├── game/           # Game logic - state, stats, progression
│   ├── scripting/      # YAML interpretation - parser, effects
│   └── presentation/   # Phaser scenes and UI
├── data/               # YAML narrative content
│   └── stories/
├── assets/             # Game assets
│   ├── sprites/
│   ├── backgrounds/
│   └── audio/
└── index.html
```

### Build Configuration

1. **Vite as bundler** for fast dev server and optimized production builds
2. **Path aliases** configured in both `tsconfig.json` and `vite.config.ts`:
   - `@core/*` → `src/core/*`
   - `@game/*` → `src/game/*`
   - `@scripting/*` → `src/scripting/*`
   - `@presentation/*` → `src/presentation/*`
   - `@data/*` → `data/*`
   - `@assets/*` → `assets/*`

3. **TypeScript configuration**:
   - Strict mode enabled
   - DOM libraries included for Phaser
   - Module resolution: bundler mode
   - No emit (Vite handles transpilation)

### Initial Foundation Files

1. **src/core/GameEngine.ts** - Phaser instance lifecycle management
2. **src/game/StateManager.ts** - Game state with localStorage persistence
3. **src/scripting/YAMLParser.ts** - YAML story format parser
4. **src/presentation/scenes/BootScene.ts** - Initial loading scene
5. **src/presentation/scenes/MainMenuScene.ts** - Main menu placeholder
6. **src/main.ts** - Entry point
7. **data/stories/example-story.yaml** - Example narrative structure

### Dependencies

**Runtime:**
- `phaser` ^3.87.0 - Game engine
- `yaml` ^2.6.1 - YAML parsing

**Development:**
- `vite` ^6.0.7 - Build tool and dev server
- `@types/node` - Node type definitions for path resolution
- `@types/bun` - Bun runtime types
- `typescript` ^5 - Language

## Rationale

### Vite Over Other Bundlers
- Fast HMR for rapid development
- Native TypeScript support
- Excellent Phaser 3 integration
- Static build output suitable for hosting
- Bun compatibility

### Path Aliases
- Enforces architectural boundaries
- Improves code readability
- Easier refactoring
- Prevents deep relative imports like `../../../../core/GameEngine`

### localStorage for Save System
- Zero backend infrastructure required
- Sufficient for single-player game
- Immediate persistence
- User data stays local (privacy-friendly)
- Meets deployment target of static hosting

### Placeholder Scenes
- Verifies build pipeline works
- Demonstrates Phaser setup
- Provides visual confirmation of successful scaffold
- Establishes scene transition pattern

## Consequences

### Positive
- Clean separation of concerns via directory structure
- Fast development iteration with Vite HMR
- Type-safe imports with path aliases
- Working build and development server immediately available
- Example YAML demonstrates data-driven design

### Negative
- Vite adds ~6MB to node_modules
- Phaser bundle is large (~1.4MB minified) - expected for game engine
- Path aliases require maintenance in two config files

### Neutral
- Future developers must learn path alias conventions
- YAML format is opinionated but documented in example

## Verification

Build verification successful:
```
$ bun run build
✓ 11 modules transformed
✓ built in 3.00s
```

Type check successful:
```
$ bun run type-check
$ tsc --noEmit
(no errors)
```

## Notes

- The scaffold includes a working main menu scene that demonstrates Phaser initialization
- Example story YAML shows narrative structure with stat effects and branching choices
- Comic Relief font decision (from Phase 2) will be implemented in asset integration phase
- Audio directory created but assets to be added during implementation
