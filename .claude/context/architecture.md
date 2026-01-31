# Masking - Architecture Context

## Tech Stack
- **Engine**: Phaser 3 (TypeScript)
- **Runtime/Bundler**: Bun (native bundling)
- **Deployment**: GitHub Pages

## Four-Layer Architecture
1. **Core** (`src/core/`) - Phaser lifecycle management
2. **Game Logic** (`src/game/`) - State, stats, progression
3. **Script Interpretation** (`src/scripting/`) - YAML parser and effects
4. **Presentation** (`src/presentation/`) - Scenes and UI components

## Data-Driven Design
- Narrative content in `data/stories/*.yaml` (served from `public/data/stories/`)
- Game assets in `assets/` (sprites, backgrounds, audio)
- YAML hot-reload supported in dev mode

## Accessibility Requirements
- Never use color as the only indicator
- Use textures, patterns, and icons alongside color
- Meet WCAG AA contrast ratios
- Avoid problematic color combinations (red/green, etc.)

## Key Patterns
- Scenes extend `Phaser.Scene`
- StateManager handles game state with localStorage persistence
- YAMLParser loads and parses script files
- InputManager abstracts keyboard/touch input
