# Current Story

## User Story
As a game developer/graphics artist, I want a sprite sheet animation system for characters so that I can easily plug in graphics with various animation types.

## Acceptance Criteria
- [x] Characters support sprite sheets with multiple animation states (idle, walk, talk, interact)
- [x] YAML config defines: spritesheet path, frame dimensions, playback speeds per animation type
- [x] YAML config specifies frame ranges for each animation state
- [x] Characters are left-facing in assets, mirrored in-game when facing right
- [x] System works for player, NPCs, and other entities
- [x] Graphics artist can plug in new spritesheets without code changes

## Technical Context

### Current Architecture
- Phaser 3 + TypeScript + Bun
- Data-driven design with YAML scripts
- Player currently uses a placeholder rectangle sprite (`RoomScene.ts:247-257`)
- NPCs defined in YAML with portrait references (`npcs/boss-chihuahua.yaml`)
- No current animation system in place

### Relevant Files
- `src/presentation/scenes/RoomScene.ts` - Player sprite creation
- `src/presentation/scenes/MeetingScene.ts` - Participant display
- `public/data/stories/npcs/*.yaml` - NPC definitions
- `public/data/stories/scenes/*.yaml` - Scene definitions

### YAML Pattern Examples
Current NPC YAML structure:
```yaml
id: boss-chihuahua
name: Bark Thompson
species: dog
role: Manager
portrait: boss-chihuahua-portrait
```

Current Scene YAML structure:
```yaml
id: home
name: Your Apartment
background: home-interior
hotspots:
  - id: bed
    x: 50
    y: 400
```

## Status
- Created: 2026-01-31
- Completed: 2026-01-31
- Phase: done

## Implementation Summary

### New Files Created
- `src/presentation/components/Character.ts` - Character class with animation support
- `src/scripting/parsers/CharacterParser.ts` - YAML parser for character configs
- `public/data/characters/player-cat.yaml` - Player character config
- `public/data/characters/boss-chihuahua.yaml` - NPC character config

### Modified Files
- `src/presentation/scenes/BootScene.ts` - Loads character configs and creates animations
- `src/presentation/scenes/RoomScene.ts` - Uses Character class for player
- `src/presentation/scenes/MeetingScene.ts` - Uses Character class for participants
- `src/scripting/YAMLParser.ts` - Added parseCharacter() and loadCharacter() methods
- `src/game/StateManager.ts` - Added accessibility settings (reducedMotion, animationSpeed)
- `src/config.ts` - Added assetPath() method

### Features Implemented
1. **Character Class** - Extends Phaser.GameObjects.Sprite with animation state management
2. **YAML Configuration** - Artist-friendly config for spritesheets and animations
3. **Accessibility Support** - Reduced motion mode, animation speed multiplier (0.5x/1.0x/1.5x)
4. **Hot Reload** - Characters reload when YAML is refreshed in dev mode
5. **Placeholder Generation** - Auto-generates colored placeholders when sprites not found
6. **Direction Mirroring** - Characters auto-flip when facing right
