# Masking - Project Context

**Game**: Sims-inspired game about neurodivergent experiences in remote work
**Stack**: Phaser 3 + TypeScript + Bun + Vite
**Status**: Deployed to production

---

## Quick Commands

### Development
```bash
bun install           # Install dependencies
bun run dev          # Start dev server (http://localhost:5173)
bun run type-check   # Run TypeScript type checker
```

### Build & Deploy
```bash
bun run build        # Build for production (output: dist/)
bun run preview      # Preview production build locally
git push origin main # Auto-deploys to GitHub Pages
```

### Production URL
`https://pelinakit.github.io/masking/`

---

## Architecture Overview

**Four-layer architecture:**
1. **Core** (`src/core/`) - Phaser lifecycle management
2. **Game Logic** (`src/game/`) - State, stats, progression
3. **Script Interpretation** (`src/scripting/`) - YAML parser and effects
4. **Presentation** (`src/presentation/`) - Scenes and UI components

**Data-driven design:**
- Narrative content in `data/stories/*.yaml`
- Game assets in `assets/` (sprites, backgrounds, audio)

---

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

```typescript
@core/*         → src/core/*
@game/*         → src/game/*
@scripting/*    → src/scripting/*
@presentation/* → src/presentation/*
@data/*         → data/*
@assets/*       → assets/*
```

---

## Key User Decisions

- **Font**: Comic Relief (dyslexia-friendly, warm feel)
- **Tutorial**: Always skippable
- **Difficulty**: Single balanced mode (no difficulty selection)
- **Save system**: localStorage (client-side only)
- **Platform**: Mobile-first responsive design
- **Audio**: Included from start
- **Debug tools**: Included in build

---

## Deployment

**Platform**: GitHub Pages
**Workflow**: `.github/workflows/deploy-gh-pages.yml`
**Trigger**: Push to main branch
**Build time**: ~2-3 minutes

### Rollback Procedures

See ADR 0005 for full rollback documentation.

**Quick rollback:**
```bash
git revert <commit-hash>
git push origin main
```

---

## Architecture Decision Records

All architectural decisions documented in `docs/adr/`:

- **0001**: Technology stack selection
- **0002**: Four-layer architecture design
- **0003**: UX and design decisions
- **0004**: Project scaffolding structure
- **0005**: GitHub Pages deployment strategy

---

## Implementation Phases Completed

- A: Core Systems (GameEngine, StateManager, EventBus)
- B: UI Foundation (Text styles, buttons, panels, layouts)
- C: Basic Scenes (Boot, MainMenu, Room, Laptop, Meeting)
- D: Room Interactions (Avatar, clickable objects, stat effects)
- E: Laptop Overlay (Email, Slack, Calendar views)
- F: Zoom/Meeting System (Participant grid, stat-based outcomes)
- G: Tutorial System (Step manager, highlight overlays)
- H: Input Manager (Mobile + desktop controls)
- I: Audio System (Music, SFX, user preferences)
- J: Debug Tools & Integration (Scene controls, stat inspector)

---

## Next Steps (Future Development)

1. Add actual narrative content to `data/stories/`
2. Create sprite assets for avatar customization
3. Add more room interactions and objects
4. Expand meeting scenarios and outcomes
5. Implement achievement system
6. Add more audio tracks and sound effects

---

## Notes

- Production build uses `/masking/` base path (GitHub Pages requirement)
- Local dev uses `/` root path - use `bun run preview` to test production config
- All game state stored in browser localStorage
- No backend server required
