# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Masking is a Sims-inspired game about neurodivergent experiences in remote work. The player is a cat navigating a dog's world, managing energy, stress, and social interactions while "masking" to fit in.

## Tech Stack

- **Engine**: Phaser 3 (TypeScript)
- **Runtime/Bundler**: Bun (native bundling, no Vite)
- **Deployment**: GitHub Pages (auto-deploy on push)

## Commands

```bash
bun run dev      # Build + start dev server (port 3000)
bun run build    # Production build to dist/
bun run serve    # Serve dist/ without rebuilding
```

## Dev Mode

Toggle in main menu (bottom right). When enabled:
- **Reload YAML** button appears (top right in game)
- YAML files in `public/data/` are served live without rebuild
- Edit YAML, click reload, changes apply immediately

## Architecture Principles

### Data-Driven Design
Scenes, characters, and interactions are defined in YAML scripts, not hardcoded. The engine reads these scripts at runtime:
- Scene scripts define hotspots, coordinates, and interactions
- NPC scripts define character properties, dialogue trees, and behaviors
- Management script controls gameplay loop and base rules

### Modularity
New rooms, characters, items, and mechanics should be addable without modifying core engine code. All content is loaded from external script files.

## Game Structure

- **Single-screen room view** with real-time gameplay and pause
- **Stat management**: Energy, Stress, Hunger, Happiness, Social Anxiety
- **Masks** function as battle stances for different social situations (Meeting Participant, Presenter, Casual Colleague, etc.)
- **Zoom calls** are "battle scenes" requiring mask selection and stat management

## Accessibility Requirements

The game must support color vision deficiency (CVD) and low-vision players:
- Never use color as the only indicator
- Use textures, patterns, and icons alongside color
- Meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large elements)
- Avoid red/green, yellow/purple, blue/purple, red/black color combinations
