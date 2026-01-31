# Implementation Plan: Sprite Sheet Animation System

## Overview

Implement a complete sprite sheet animation system that allows graphics artists to plug in character spritesheets with multiple animation states (idle, walk, talk, interact) via YAML configuration. The system will support accessibility features including reduced motion modes and work seamlessly for player, NPCs, and meeting participants.

## Prerequisites

- [x] Four-layer architecture established (Core, Game Logic, Scripting, Presentation)
- [x] YAML parser infrastructure in place (`YAMLParser.ts`)
- [x] StateManager with settings support
- [x] Dev mode with hot-reload capabilities
- [x] RoomScene and MeetingScene implemented with placeholder sprites

## Task Breakdown

### Phase 1: Core Animation Infrastructure

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T1 | Create `/src/presentation/components/` directory | XS | - | No |
| T2 | Create `Character.ts` class extending Phaser.GameObjects.Sprite | L | T1 | No |
| T3 | Create `CharacterParser.ts` for YAML character config parsing | M | - | Yes (with T2) |
| T4 | Add character parsing methods to `YAMLParser.ts` | S | T3 | No |
| T5 | Create TypeScript interfaces for character config types | S | - | Yes (with T2, T3) |

**Details:**

**T2 - Character Class:**
- Extend Phaser.GameObjects.Sprite
- Store animation config and current state
- Handle left-facing assets with right-facing mirroring (flipX)
- Support reduced motion mode (static frame)
- Expose methods: `playAnimation(name)`, `stop()`, `setDirection(left/right)`
- Auto-integrate with StateManager for accessibility settings
- Support animation speed multiplier from settings

**T3 - CharacterParser:**
- Parse YAML character config structure
- Validate required fields (id, name, spritesheet path/dimensions)
- Parse animations array with frames, frameRate, repeat
- Return typed CharacterConfig object
- Handle parsing errors gracefully

**T4 - YAMLParser Integration:**
- Add `parseCharacter(yamlContent): CharacterConfig` method
- Add validation helper `validateCharacter(data)`
- Integrate with existing cache system

**T5 - Type Definitions:**
```typescript
export interface CharacterConfig {
  id: string;
  name: string;
  species: string;
  spritesheet: {
    path: string;
    frameWidth: number;
    frameHeight: number;
  };
  animations: {
    [key: string]: AnimationConfig;
  };
  defaultAnimation: string;
  accessibility?: {
    reducedMotionStaticFrame: number;
    description: string;
  };
}

export interface AnimationConfig {
  frames: number[];
  frameRate: number;
  repeat: number; // -1 for loop, 0 for once
}
```

### Phase 2: State Management & Accessibility

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T6 | Add accessibility settings to StateManager | M | - | No |
| T7 | Add animation speed multiplier setting (0.5x, 1.0x, 1.5x) | S | T6 | No |
| T8 | Add system preference detection for `prefers-reduced-motion` | S | T6 | Yes (with T7) |
| T9 | Add screen reader announcement support for state changes | M | T6 | Yes (with T7, T8) |

**Details:**

**T6 - StateManager Accessibility:**
- Add to `settings` object:
  - `reducedMotion: boolean` (default: false)
  - `animationSpeed: number` (default: 1.0, options: 0.5, 1.0, 1.5)
  - `screenReaderAnnouncements: boolean` (default: true)
- Persist to localStorage with existing save system
- Expose getter methods

**T8 - System Preference Detection:**
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Initialize StateManager with system preference on first load
- Listen for preference changes at runtime

**T9 - Screen Reader Support:**
- Create `announceToScreenReader(message: string)` utility
- Use ARIA live regions for announcements
- Announce important character state changes (e.g., "Character entered scene", "Character started talking")

### Phase 3: Asset Loading & Integration

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T10 | Update BootScene to load character YAML configs | M | T2, T3, T4 | No |
| T11 | Update BootScene to preload character spritesheets | M | T10 | No |
| T12 | Add Phaser animation creation in BootScene | M | T11 | No |
| T13 | Create placeholder spritesheet assets for testing | S | - | Yes (with T10-T12) |

**Details:**

**T10 - Load Character Configs:**
- Load character YAML files in BootScene preload
- Store parsed configs in cache or scene registry
- Handle missing/invalid configs gracefully

**T11 - Preload Spritesheets:**
- Use `this.load.spritesheet()` with config dimensions
- Support multiple character spritesheets
- Add loading progress indicators

**T12 - Create Phaser Animations:**
- Iterate through character animations config
- Call `this.anims.create()` for each animation
- Use naming convention: `{characterId}-{animationName}`
- Apply frameRate and repeat settings from config

**T13 - Placeholder Assets:**
- Create simple 64x96px test spritesheet (4 frames: idle, walk1, walk2, talk)
- Save as `assets/sprites/characters/player-cat.png`
- Create similar for `boss-chihuahua.png`
- Document expected format for artists

### Phase 4: YAML Configuration Files

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T14 | Create `/public/data/characters/` directory | XS | - | No |
| T15 | Create `player-cat.yaml` character config | S | T14 | No |
| T16 | Create `boss-chihuahua.yaml` character config | S | T14 | Yes (with T15) |
| T17 | Migrate NPC portrait references to character system | M | T15, T16 | No |

**Details:**

**T15 - Player Character Config:**
```yaml
id: player-cat
name: Player Cat
species: cat

spritesheet:
  path: assets/sprites/characters/player-cat.png
  frameWidth: 64
  frameHeight: 96

animations:
  idle:
    frames: [0, 1, 2]
    frameRate: 2
    repeat: -1

  walk:
    frames: [3, 4, 3, 5]
    frameRate: 8
    repeat: -1

  talk:
    frames: [6, 7, 6]
    frameRate: 4
    repeat: -1

  interact:
    frames: [8, 9, 10]
    frameRate: 6
    repeat: 0

defaultAnimation: idle

accessibility:
  reducedMotionStaticFrame: 0
  description: "Orange tabby cat with green eyes"
```

**T16 - Boss Character Config:**
- Similar structure to player but with boss-chihuahua assets
- Different frame ranges and animation timings
- Different accessibility description

**T17 - Migrate NPC Data:**
- Keep existing `npcs/boss-chihuahua.yaml` for dialogue
- Reference character config from `characters/boss-chihuahua.yaml`
- Update NPC parser to load associated character config

### Phase 5: RoomScene Integration

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T18 | Replace player placeholder in RoomScene with Character | L | T2, T12, T15 | No |
| T19 | Implement walk animation during player movement | M | T18 | No |
| T20 | Implement idle animation when player stops | S | T18 | Yes (with T19) |
| T21 | Implement interact animation on hotspot activation | M | T18 | No |
| T22 | Handle character direction (flipX) based on movement | S | T18 | Yes (with T19) |

**Details:**

**T18 - Replace Placeholder:**
- Remove existing player sprite creation (lines 247-257)
- Load player character config
- Instantiate Character class with config
- Position at starting location
- Set initial animation to idle

**T19 - Walk Animation:**
- In `updatePlayerMovement()`, detect when velocity > 0
- Call `player.playAnimation('walk')`
- Only change animation if not already playing

**T20 - Idle Animation:**
- Detect when velocity === 0
- Call `player.playAnimation('idle')`
- Smooth transition from walk to idle

**T21 - Interact Animation:**
- In `handleInteraction()`, play 'interact' animation
- Wait for animation to complete (use events)
- Then trigger actual hotspot action

**T22 - Direction Handling:**
- When moving left, ensure character faces left (default)
- When moving right, call `player.setFlipX(true)` for mirroring
- Character class handles flipX internally

### Phase 6: MeetingScene Integration

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T23 | Replace participant icons with Character instances | L | T2, T12, T16 | No |
| T24 | Implement talk animation when participants speak | M | T23 | No |
| T25 | Implement idle animation for listening participants | S | T23 | Yes (with T24) |
| T26 | Load participant characters from NPC configs | M | T23 | No |

**Details:**

**T23 - Replace Icons:**
- In `createVideoGrid()`, replace emoji icons
- Instantiate Character for each participant
- Scale appropriately for video grid (smaller than room)
- Position within video frame

**T24 - Speaking Animation:**
- In `showEvent()`, identify active speaker
- Play 'talk' animation on speaker's Character
- Return others to 'idle'

**T25 - Listening Animation:**
- All non-speaking participants play 'idle'
- Handle animation transitions smoothly

**T26 - Load Participant Data:**
- Extend meeting YAML to include participant character IDs
- Load character configs for each participant
- Fallback to placeholder if character not found

### Phase 7: Dev Mode Hot Reload

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T27 | Extend YAML reload to include character configs | M | T10, T18, T23 | No |
| T28 | Reload character spritesheets on YAML reload | M | T27 | No |
| T29 | Recreate Phaser animations on reload | M | T28 | No |
| T30 | Update existing Character instances with new config | L | T27, T28, T29 | No |

**Details:**

**T27 - Character Config Reload:**
- When 'Reload YAML' clicked, clear character config cache
- Re-parse all character YAML files
- Emit 'characterReloaded' event

**T28 - Spritesheet Reload:**
- Unload existing spritesheets from Phaser cache
- Reload with cache-busting timestamp
- Handle texture swap without scene restart

**T29 - Animation Reload:**
- Destroy existing Phaser animations
- Recreate from new config
- Maintain animation state if possible

**T30 - Update Instances:**
- Find all active Character instances in current scene
- Call `updateConfig(newConfig)` method
- Restart current animation with new settings

### Phase 8: Testing & Accessibility Validation

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T31 | Test reduced motion mode with static frames | M | T2, T8, T18, T23 | No |
| T32 | Test animation speed multipliers (0.5x, 1.0x, 1.5x) | M | T7, T18, T23 | Yes (with T31) |
| T33 | Test screen reader announcements | M | T9, T18, T23 | Yes (with T31, T32) |
| T34 | Test with placeholder spritesheets | M | T13, T18, T23 | Yes (with T31-T33) |
| T35 | Validate YAML hot-reload functionality | L | T27-T30 | No |
| T36 | Test multiple characters in MeetingScene | M | T23-T26 | Yes (with T35) |

**Details:**

**T31 - Reduced Motion:**
- Enable reduced motion in settings
- Verify characters show static frame
- Verify no animation playback
- Test system preference detection

**T32 - Speed Multipliers:**
- Test each speed setting (0.5x, 1.0x, 1.5x)
- Verify frameRate adjustments work
- Verify all animations respect speed setting

**T33 - Screen Reader:**
- Enable screen reader announcements
- Test character state change announcements
- Verify ARIA live region implementation

**T34 - Placeholder Assets:**
- Test with simple test spritesheets
- Verify frame dimensions work correctly
- Verify animation playback is smooth

**T35 - Hot Reload:**
- Edit character YAML while game running
- Click 'Reload YAML' button
- Verify changes apply without page refresh
- Test animation changes, frame changes, speed changes

**T36 - Multiple Characters:**
- Test meeting with 3+ participants
- Verify all characters animate correctly
- Verify speaker highlighting works

### Phase 9: Documentation & Examples

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T37 | Document character YAML format for artists | M | T15, T16 | No |
| T38 | Document spritesheet layout requirements | M | T13 | Yes (with T37) |
| T39 | Create example character configs with comments | S | T15, T16 | Yes (with T37, T38) |
| T40 | Add Character class API documentation | M | T2 | Yes (with T37-T39) |

**Details:**

**T37 - YAML Format Documentation:**
- Document all required and optional fields
- Explain frame indexing (0-based, left-to-right, top-to-bottom)
- Explain animation repeat values (-1 = loop, 0 = once, N = N times)
- Explain accessibility fields

**T38 - Spritesheet Layout:**
- Document expected layout (horizontal strip or grid)
- Document frame dimensions requirements
- Document file format (PNG with transparency)
- Document naming conventions

**T39 - Example Configs:**
- Add inline comments to player-cat.yaml
- Add inline comments to boss-chihuahua.yaml
- Create additional example for different animation patterns

**T40 - API Documentation:**
- Document Character constructor
- Document public methods
- Document events emitted
- Add usage examples in comments

## Dependency Graph

```
T1 ──> T2 ──┬──> T18 ──┬──> T19 ──┐
            │          ├──> T20 ──┤
            │          ├──> T21 ──┼──> T31 ──┐
            │          └──> T22 ──┘          │
            │                                 │
T5 ──> T3 ──┴──> T4 ──> T10 ──> T11 ──> T12 ─┤
                         │                    │
T14 ──> T15 ─────────────┤                    │
     └> T16 ─────────────┴──> T17             │
                                               │
T6 ──┬──> T7 ──┐                              │
     ├──> T8 ──┼──────────────────────────────┤
     └──> T9 ──┘                              │
                                               │
T13 ───────────────────────────────────> T34 ─┤
                                               │
                         ┌────────────────────┤
T23 ──┬──> T24 ──┐       │                    │
      ├──> T25 ──┼──> T26┴──> T36 ────────────┤
      └──────────┘                             │
                                               │
T27 ──> T28 ──> T29 ──> T30 ──> T35 ──────────┤
                                               │
                                               ├──> T37 ──┐
                                               │          │
                                               ├──> T38 ──┼──> T39
                                               │          │
                                               └──> T40 ──┘
```

## Parallel Execution Groups

1. **Group 1** (Foundation): T1, T3, T5 (can start simultaneously)
2. **Group 2** (State Management): T6, T7, T8, T9 (after T6, T7-T9 are parallel)
3. **Group 3** (Assets): T13, T14 (parallel, independent of other tasks)
4. **Group 4** (YAML Configs): T15, T16 (parallel after T14)
5. **Group 5** (Room Animations): T19, T20, T22 (parallel after T18)
6. **Group 6** (Meeting Animations): T24, T25 (parallel after T23)
7. **Group 7** (Testing): T31, T32, T33, T34, T36 (mostly parallel after dependencies met)
8. **Group 8** (Documentation): T37, T38, T39, T40 (parallel after all implementation complete)

## Risk Areas

| Task | Risk | Mitigation |
|------|------|------------|
| T2 | Complex Phaser animation API integration | Study Phaser docs first, create simple prototype |
| T12 | Animation frame timing issues | Use Phaser's built-in animation manager, test with various frameRates |
| T18 | Breaking existing player movement | Keep original logic, add animations incrementally |
| T23 | Performance with multiple animated sprites | Use object pooling if needed, limit visible animations |
| T28 | Texture reload without scene restart | May require scene reload fallback if Phaser doesn't support |
| T30 | State preservation during hot reload | Store animation state before reload, restore after |
| T35 | Complex hot-reload implementation | Test thoroughly in dev mode, allow graceful fallback |

## Testing Strategy

### Unit Tests
- CharacterParser: Valid/invalid YAML parsing
- Character class: Animation state transitions
- StateManager: Accessibility settings persistence

### Integration Tests
- BootScene: Asset loading and animation creation
- RoomScene: Player animation lifecycle
- MeetingScene: Multiple character synchronization
- Hot reload: Full reload cycle with state preservation

### E2E Tests
Critical paths:
1. **Player Movement Flow**: Start game → Move left → Walk animation plays → Stop → Idle animation plays
2. **Meeting Flow**: Join meeting → Participants load → Speaker talks → Talk animation plays → Others idle
3. **Accessibility Flow**: Enable reduced motion → Characters show static frames → Disable → Animations resume
4. **Hot Reload Flow**: Edit character YAML → Click reload → Changes apply → Animations update

### Manual Testing
- Visual validation of animations
- Timing and smoothness checks
- Accessibility tool validation (screen reader)
- System preference detection
- Artist workflow validation

## Commit Points

Logical points for git commits:

1. **After T1-T5**: `feat(animation): add Character class and CharacterParser infrastructure`
   - Character class with animation support
   - CharacterParser for YAML parsing
   - Type definitions
   - YAMLParser integration

2. **After T6-T9**: `feat(accessibility): add animation accessibility settings`
   - Reduced motion support
   - Animation speed multiplier
   - System preference detection
   - Screen reader announcements

3. **After T10-T13**: `feat(assets): add character asset loading in BootScene`
   - Character config loading
   - Spritesheet preloading
   - Animation creation
   - Placeholder test assets

4. **After T14-T17**: `feat(config): add character YAML configurations`
   - Character YAML structure
   - Player and NPC configs
   - Directory organization

5. **After T18-T22**: `feat(room): integrate Character system into RoomScene`
   - Replace player placeholder
   - Movement animations
   - Interaction animations
   - Direction handling

6. **After T23-T26**: `feat(meeting): integrate Character system into MeetingScene`
   - Replace participant placeholders
   - Speaking animations
   - Participant character loading

7. **After T27-T30**: `feat(dev): add character hot-reload support`
   - YAML reload for characters
   - Spritesheet reload
   - Animation recreation
   - Instance updates

8. **After T31-T36**: `test(animation): validate animation system functionality`
   - Accessibility validation
   - Hot reload testing
   - Multi-character testing

9. **After T37-T40**: `docs(animation): document character animation system for artists`
   - YAML format documentation
   - Spritesheet guidelines
   - Example configurations
   - API documentation

## Performance Considerations

- **Animation Pooling**: Reuse animation definitions across multiple character instances
- **Texture Atlas**: Consider consolidating multiple character spritesheets into atlases for better performance
- **Visibility Culling**: Pause animations for off-screen characters
- **Frame Rate Optimization**: Limit animation updates to visible characters only
- **Memory Management**: Unload unused character assets when scenes change

## Extensibility

This system is designed to support future extensions:

- **Emotional States**: Add emotion-based animation variants (happy-idle, sad-walk, etc.)
- **Costume System**: Support multiple spritesheets per character for outfit changes
- **Equipment**: Support overlay animations for held items
- **Particle Effects**: Integrate particle emitters with animations
- **Sound Effects**: Trigger SFX on animation frames
- **Skeletal Animation**: Upgrade to spine/dragonbones if needed for complex animations

## Success Criteria

The implementation is complete when:

- [ ] Graphics artist can add new character by creating YAML file and spritesheet
- [ ] No code changes required to add new characters
- [ ] All animation states (idle, walk, talk, interact) work correctly
- [ ] Characters auto-mirror when facing right (left-facing assets)
- [ ] Reduced motion mode shows static frames
- [ ] Animation speed multiplier works (0.5x, 1.0x, 1.5x)
- [ ] System preference `prefers-reduced-motion` is honored
- [ ] Hot-reload works in dev mode for character configs
- [ ] Player animations work in RoomScene
- [ ] NPC animations work in MeetingScene
- [ ] Multiple characters animate simultaneously without issues
- [ ] Documentation exists for artists to create new characters
- [ ] All tests pass

## Estimated Effort Distribution

- Phase 1 (Core Infrastructure): 25% of effort
- Phase 2 (State Management): 10% of effort
- Phase 3 (Asset Loading): 15% of effort
- Phase 4 (YAML Configs): 5% of effort
- Phase 5 (RoomScene): 15% of effort
- Phase 6 (MeetingScene): 10% of effort
- Phase 7 (Hot Reload): 10% of effort
- Phase 8 (Testing): 5% of effort
- Phase 9 (Documentation): 5% of effort

**Total Tasks**: 40 tasks
**Estimated Complexity**: XL (major feature with architectural impact)
