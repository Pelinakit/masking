# Implementation Plan: Data-Driven Asset Loading with Graceful Fallbacks

## Overview

Implement a robust asset loading system that reads sprite paths and frame data from YAML files, with graceful fallbacks for missing or mismatched assets. The system will provide clear visual and console feedback when assets are missing, while ensuring the game never crashes.

## Prerequisites

- [x] Existing YAML parser infrastructure (`YAMLParser.ts`, `CharacterParser.ts`)
- [x] Character and Scene YAML configurations (`player-cat.yaml`, `home.yaml`)
- [x] Placeholder generation in `BootScene.ts`
- [x] Dev mode overlay system (`DevOverlayScene.ts`)

## Task Breakdown

### Phase 1: Asset Warning Infrastructure

#### Task T1.1: Create AssetWarningTracker
**Size:** S
**Depends On:** -
**Parallel:** No

Create centralized warning deduplication service:
- Class to track warned assets by type and ID
- Methods: `warn(type, assetId, details)`, `hasWarned(type, assetId)`, `clear()`, `getAll()`
- Console output styling with %c colors
- Severity levels: ERROR (red), WARN (yellow), INFO (cyan)
- Format: `[ASSET WARN] type:id - message (expected: path, impact: description)`

**File:** `/Users/jk/code/masking/src/core/AssetWarningTracker.ts`

#### Task T1.2: Integrate AssetWarningTracker into BootScene
**Size:** S
**Depends On:** T1.1
**Parallel:** No

Replace console.warn calls with AssetWarningTracker:
- Import and instantiate tracker
- Replace direct console.warn with tracker.warn() in asset loading methods
- Store tracker instance in registry for scene access
- Add clear() call on YAML reload

**File:** `/Users/jk/code/masking/src/presentation/scenes/BootScene.ts`

---

### Phase 2: Enhanced Placeholder System

#### Task T2.1: Add CVD-Friendly Placeholder Design
**Size:** M
**Depends On:** T1.2
**Parallel:** Yes (with T1.2)

Enhance placeholder generation in `BootScene.generatePlaceholderCanvas()`:
- Add diagonal stripe pattern (45deg, 8px spacing, contrasting hue)
- Add warning triangle icon (⚠) in top-left corner (16x16px)
- Keep existing high-contrast text with black stroke
- Maintain frame number display at bottom

**File:** `/Users/jk/code/masking/src/presentation/scenes/BootScene.ts`

#### Task T2.2: Add Dev Mode Placeholder Badge
**Size:** S
**Depends On:** T2.1
**Parallel:** No

Add visual indicator on placeholder sprites when dev mode enabled:
- Check dev mode in Character component during render
- Add "⚠ PLACEHOLDER" badge overlay (top-right, 80x24px, orange bg)
- Update badge visibility on dev mode change event
- Remove badge on sprite destroy

**File:** `/Users/jk/code/masking/src/presentation/components/Character.ts`

---

### Phase 3: Frame Validation & Clamping

#### Task T3.1: Convert CharacterParser Validation to Warning
**Size:** M
**Depends On:** T1.1
**Parallel:** Yes (with T2.1)

Modify `CharacterParser.validateFrameBounds()`:
- Change from throwing error to logging warning via AssetWarningTracker
- Return boolean (true = all valid, false = some out of bounds)
- Add optional parameter: `clamp: boolean = false` to auto-fix frames
- When clamping, create new config with clamped frames

**File:** `/Users/jk/code/masking/src/scripting/parsers/CharacterParser.ts`

#### Task T3.2: Add Runtime Frame Validation in Character
**Size:** M
**Depends On:** T3.1
**Parallel:** No

Add frame validation in `Character.createAnimations()`:
- Get actual frame count from texture
- Compare with YAML-defined frames
- Log warning if mismatch (once per animation)
- Clamp frame indices to available range
- Create animations with clamped frames

**File:** `/Users/jk/code/masking/src/presentation/components/Character.ts`

---

### Phase 4: Hotspot/Furniture Sprite Loading

#### Task T4.1: Add Sprite Loading to SceneHotspot Type
**Size:** S
**Depends On:** -
**Parallel:** Yes (with T3.1)

Extend `SceneHotspot` interface in YAMLParser:
- Add optional `sprite` field with `path`, `scale`, `offset_x`, `offset_y`
- Update `validateScene()` to handle sprite configuration
- No breaking changes (sprite field optional)

**File:** `/Users/jk/code/masking/src/scripting/YAMLParser.ts`

#### Task T4.2: Load Hotspot Sprites in RoomScene
**Size:** L
**Depends On:** T4.1, T1.2
**Parallel:** No

Enhance `RoomScene.createHotspots()`:
- Load sprite images from YAML paths if specified
- Use AssetWarningTracker for missing sprites
- Create placeholder if sprite missing: dashed border rectangle (2px dash, 4px gap)
- Add semi-transparent fill (0.2 alpha) with centered hotspot ID label
- Apply scale and offset from YAML
- Render actual sprites when available
- Update hotspot depth to layer sprites behind characters but above background

**File:** `/Users/jk/code/masking/src/presentation/scenes/RoomScene.ts`

#### Task T4.3: Add Hotspot Sprite Hot-Reload
**Size:** M
**Depends On:** T4.2
**Parallel:** No

Enhance `RoomScene.refreshHotspots()`:
- Destroy existing hotspot sprites
- Reload sprite images from YAML
- Show loading status during reload (subtle indicator)
- Report results in console (loaded/still missing)
- Update sprites without full scene restart

**File:** `/Users/jk/code/masking/src/presentation/scenes/RoomScene.ts`

---

### Phase 5: Dev Mode Enhancements

#### Task T5.1: Add Dev Mode Indicator
**Size:** XS
**Depends On:** -
**Parallel:** Yes (with T4.2)

Add "🔧 DEV MODE" indicator in DevOverlayScene:
- Small badge in top-left corner (100x28px)
- Green border, dark background
- Always visible when dev mode active

**File:** `/Users/jk/code/masking/src/presentation/scenes/DevOverlayScene.ts`

#### Task T5.2: Create Asset Status Panel
**Size:** L
**Depends On:** T1.1, T5.1
**Parallel:** No

Add "Asset Status" button and panel in DevOverlayScene:
- Button next to existing dev controls (120x32px)
- Click to toggle asset status panel
- Panel shows:
  - Missing assets (red badge, count)
  - Mismatched frame counts (yellow badge, count)
  - List view with asset ID, type, expected path, status
  - "Clear All" button to reset warnings
- Panel draggable, closable
- Panel state persists in localStorage

**File:** `/Users/jk/code/masking/src/presentation/scenes/DevOverlayScene.ts`

---

### Phase 6: Hot-Reload Enhancement

#### Task T6.1: Add Reload Status Notifications
**Size:** S
**Depends On:** T4.3
**Parallel:** Yes (with T5.2)

Enhance reload notifications:
- Show "Reloading assets..." during reload
- Show results summary: "Reloaded: 3 configs, 2 sprites loaded, 1 still missing"
- Use color coding: green for success, yellow for partial, red for failures
- Auto-dismiss after 3 seconds

**File:** `/Users/jk/code/masking/src/presentation/scenes/DevOverlayScene.ts`

#### Task T6.2: Update Sprites Without Scene Restart
**Size:** M
**Depends On:** T6.1, T4.3
**Parallel:** No

Improve hot-reload to update sprites in-place:
- Detect if new sprite became available
- Replace placeholder with actual sprite without destroying/recreating Character
- Update texture reference
- Recreate animations with new texture
- Maintain current animation state and position
- Log successful sprite swap

**Files:**
- `/Users/jk/code/masking/src/presentation/scenes/RoomScene.ts`
- `/Users/jk/code/masking/src/presentation/components/Character.ts`

---

### Phase 7: Testing & Polish

#### Task T7.1: Test Missing Character Sprite
**Size:** M
**Depends On:** All Phase 1-6 tasks
**Parallel:** No

Manual testing scenarios:
- Remove player-cat.png sprite file
- Verify placeholder with stripes and warning icon appears
- Verify console warning logged once with correct format
- Verify dev mode badge shows "⚠ PLACEHOLDER"
- Verify Asset Status panel shows missing asset
- Add sprite back and hot-reload
- Verify placeholder replaced with actual sprite
- Verify Asset Status panel updates

#### Task T7.2: Test Frame Count Mismatch
**Size:** M
**Depends On:** All Phase 1-6 tasks
**Parallel:** Yes (with T7.1)

Manual testing scenarios:
- Edit player-cat.yaml to reference frame 15 (when only 11 exist)
- Verify console warning shows YAML vs actual frame count
- Verify animation plays with clamped frames (no crash)
- Verify Asset Status panel shows frame mismatch warning
- Fix YAML and hot-reload
- Verify warning cleared

#### Task T7.3: Test Missing Hotspot Sprite
**Size:** M
**Depends On:** All Phase 1-6 tasks
**Parallel:** Yes (with T7.2)

Manual testing scenarios:
- Verify bed/laptop/kitchen/door sprites show placeholders (dashed border)
- Verify hotspot ID labels centered in placeholder
- Verify console warnings for missing furniture sprites
- Add furniture sprite files
- Hot-reload and verify placeholders replaced
- Verify Asset Status panel tracks furniture sprites

---

## Dependency Graph

```
T1.1 ──┬── T1.2 ── T4.2 ──┬── T4.3 ── T6.1 ── T6.2 ── T7.1
       │                  │                            │
       ├── T3.1 ── T3.2 ──┤                            ├── T7.2
       │                  │                            │
       └─────────────────┴────────────────────────────┴── T7.3

T2.1 ── T2.2
T4.1 ── T4.2
T5.1 ──┬── T5.2
       └── T6.1
```

## Parallel Execution Groups

1. **Group 1** (independent setup):
   - T1.1 (AssetWarningTracker creation)

2. **Group 2** (after T1.1):
   - T1.2 (integrate tracker)
   - T2.1 (placeholder design)
   - T3.1 (parser validation)
   - T4.1 (YAML types)

3. **Group 3** (after Group 2):
   - T2.2 (dev badges)
   - T3.2 (runtime validation)
   - T4.2 (hotspot sprites)
   - T5.1 (dev indicator)

4. **Group 4** (polish phase):
   - T6.1 (reload notifications)
   - T5.2 (asset status panel)

5. **Group 5** (testing in parallel):
   - T7.1, T7.2, T7.3 (all testing tasks)

## Risk Areas

| Task | Risk | Mitigation |
|------|------|------------|
| T3.2 | Phaser animation API edge cases | Test with various frame configurations; add try-catch |
| T4.2 | Sprite loading timing issues | Use async/await properly; add loading state checks |
| T5.2 | Panel UI complexity | Start with simple list; iterate |
| T6.2 | Hot-reload sprite swap | Test extensively; fallback to full reload if swap fails |

## Testing Strategy

### Unit Tests
- AssetWarningTracker deduplication logic
- CharacterParser frame validation and clamping
- SceneHotspot sprite configuration parsing

### Integration Tests
- BootScene placeholder generation with various configs
- Character creation with missing/present sprites
- RoomScene hotspot sprite loading
- Hot-reload cycle (clear cache → reload → update sprites)

### E2E Tests
- Full game launch with all assets missing
- Progressive asset loading (add assets one by one)
- Dev mode asset status panel functionality
- Hot-reload from dev overlay

### Accessibility Tests
- Placeholder patterns visible to CVD users
- Warning triangle icon clear and high contrast
- Dev mode badges readable
- Console warnings screen-reader friendly (structured format)

## Commit Points

Logical points for git commits:

1. **After T1.1-T1.2:** `feat(assets): add centralized asset warning tracker`
2. **After T2.1-T2.2:** `feat(assets): enhance placeholder sprites with CVD patterns and dev badges`
3. **After T3.1-T3.2:** `feat(assets): add frame validation with clamping for mismatched spritesheets`
4. **After T4.1-T4.3:** `feat(assets): load furniture sprites from YAML with placeholder fallbacks`
5. **After T5.1-T5.2:** `feat(dev): add asset status panel and dev mode indicator`
6. **After T6.1-T6.2:** `feat(assets): improve hot-reload with in-place sprite updates`
7. **After T7.1-T7.3:** `test(assets): verify asset loading and fallback behavior`

## Size Summary

- XS: 1 task (5 min)
- S: 4 tasks (15-30 min each)
- M: 7 tasks (1-2 hours each)
- L: 2 tasks (2-4 hours each)
- **Total estimated effort:** ~15-20 hours

## Implementation Notes

### Asset Path Resolution
- Character sprites: `assets/sprites/characters/[name].png`
- Furniture sprites: `assets/sprites/furniture/[name].png`
- All paths relative to `public/` directory
- Use `config.assetPath()` helper for resolution

### Warning Message Format
```
[ASSET ERROR] sprite:player-cat
  Expected: assets/sprites/characters/player-cat.png
  Impact: Using placeholder (striped pattern)
  Fix: Add sprite file or update YAML path
```

### Placeholder Sprite Specifications
**Characters:**
- Diagonal stripes (45deg, 8px spacing)
- Warning triangle ⚠ (top-left, 16x16px)
- Character letter (center, 48px bold)
- Frame number (bottom, 20px bold)
- High contrast colors (white text, black stroke)

**Furniture/Hotspots:**
- Dashed border (2px line, 4px dash, 4px gap)
- Semi-transparent fill (0.2 alpha, neutral gray)
- Centered hotspot ID label (14px)
- No diagonal stripes (distinguishes from character placeholders)

### Dev Mode Storage
```javascript
// Dev mode flag
localStorage.getItem('masking-dev-mode') === 'true'

// Asset status panel state
localStorage.setItem('asset-panel-open', 'true')
localStorage.setItem('asset-panel-position', JSON.stringify({ x: 100, y: 100 }))
```

### Hot-Reload Event Flow
1. User clicks "Reload YAML" button
2. DevOverlayScene emits `reloadYAML` event
3. Active scenes listen and call their reload methods
4. YAMLParser clears cache
5. Scenes reload configs and compare with existing assets
6. AssetWarningTracker updated with new warnings
7. Sprites updated in-place where possible
8. Notification shows reload results
9. Asset Status panel refreshes
