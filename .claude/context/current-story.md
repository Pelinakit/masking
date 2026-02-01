# Current Story

## User Story
As a game developer/content creator, I want YAML files to specify sprite paths and frame data for characters, items, furniture, and scenes so that assets can be loaded in a data-driven manner with graceful fallbacks for missing or mismatched assets.

## Acceptance Criteria
- [x] YAML files can specify sprite paths and frame data for characters, items, furniture, scenes
- [x] System loads assets based on YAML configuration
- [x] Missing sprite path triggers console warning (once per asset) and uses placeholder
- [x] Frame count mismatch (YAML defines more frames than spritesheet has) triggers console warning (once per asset) and uses available frames
- [x] Game continues running without crashing when assets are missing/mismatched

## Implementation Summary

### New Files Created
- `src/core/AssetWarningTracker.ts` - Centralized warning deduplication with styled console output

### Modified Files
- `src/presentation/scenes/BootScene.ts` - Integrated AssetWarningTracker, enhanced placeholder sprites with CVD-friendly patterns
- `src/presentation/components/Character.ts` - Added runtime frame validation with automatic clamping
- `src/scripting/parsers/CharacterParser.ts` - Changed `validateFrameBounds()` to warn instead of throw
- `src/scripting/YAMLParser.ts` - Extended SceneHotspot type with sprite configuration
- `src/presentation/scenes/RoomScene.ts` - Load hotspot sprites from YAML with dashed-border placeholder fallback
- `src/presentation/scenes/DevOverlayScene.ts` - Added DEV MODE indicator and Asset Status panel

### Features Implemented

1. **AssetWarningTracker** - Centralized warning system
   - Deduplicates warnings (logs once per asset)
   - Styled console output with severity levels
   - Tracks all warnings for dev tools
   - `getAll()`, `getSummary()`, `clear()` methods

2. **Enhanced Placeholder Sprites**
   - Diagonal stripe pattern (CVD-friendly)
   - Warning triangle icon in top-left corner
   - High-contrast text with black stroke
   - Frame numbers at bottom

3. **Frame Validation & Clamping**
   - CharacterParser.validateFrameBounds() now warns instead of throwing
   - Character.createAnimations() validates frames at runtime
   - Out-of-bounds frames automatically clamped to available range

4. **Hotspot Sprite Loading**
   - SceneHotspot type extended with sprite config (path, scale, offset)
   - RoomScene loads sprites from YAML paths
   - Dashed-border placeholder for missing sprites
   - Hot-reload support

5. **Dev Mode Enhancements**
   - "🔧 DEV MODE" indicator (top-left)
   - "Asset Status" button with popup panel
   - Panel shows all missing/mismatched assets
   - Clear All button to reset warnings

## Status
- Created: 2026-02-01
- Completed: 2026-02-01
- Phase: done
