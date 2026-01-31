# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Masking is a Sims-inspired game about neurodivergent experiences in remote work. The player is a cat navigating a dog's world, managing energy, stress, and social interactions while "masking" to fit in.

## Tech Stack

- **Engine**: Phaser 3 (TypeScript)
- **Runtime/Package Manager**: Bun
- **Version Control**: Git

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
