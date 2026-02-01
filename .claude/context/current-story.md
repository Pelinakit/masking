# Current Story

## User Story
As a script/story writer, I want a comprehensive authoring toolkit so that I can create, organize, preview, and validate all game content (dialogue, events, NPCs, days) without touching code.

## Acceptance Criteria

### Core Scripting (Engine)
- [x] Single YAML file can script an entire in-game day
- [x] Dialogue, events, NPC states controllable via YAML
- [x] Player stats modifiable through script
- [x] Email/task content definable in YAML
- [x] Random events pool with weighted + conditional filtering
- [x] Interoperability with NPC, player, and home YAML files
- [x] Cumulative NPC relationship state across days
- [x] Linear-with-flavor branching

### Writer Toolkit (Story Forge)
- [x] Browser-based UI with local Bun server for file I/O
- [x] Visual node editor for dialogue trees
- [x] Import/export YAML files - Bidirectional
- [x] Week/day timeline view for organizing content
- [x] Character database with voice/sprite configuration
- [x] Story arc tracking across multiple days
- [x] Asset manager for sprites, sounds, backgrounds (S31-S34) - COMPLETE
- [x] Speech-gen integration for dialogue audio preview - Web Audio API
- [ ] YAML validation with helpful error messages (S35-S39 next)

## Progress

### Completed (2026-02-01)

**Track A: Game Engine** (9/13 tasks - 69%) ✅
- E1-E4: Core infrastructure
- E5-E9: Systems integration

**Track B: Story Forge Toolkit** (31/44 tasks - 70%) ✅

1. **S1-S4: Foundation** ✅
2. **S13-S20: Node Editor Core** ✅
3. **S25-S26: YAML Serialization** ✅
4. **S5-S8: Timeline View** ✅
5. **S9-S12: Character Database** ✅
6. **S27-S30: Story Arc Tracker** ✅
7. **S31-S34: Asset Manager** ✅
   - Tree-view asset browser
   - Sprite/background image preview
   - Audio playback controls
   - Drag-to-insert asset paths
   - Missing asset scanner

### Major Milestone: 70% Complete

The toolkit now has:
1. **Timeline** → Organize weeks and days with arc indicators
2. **Editor** → Build dialogue visually
3. **Characters** → Manage NPCs with voice preview
4. **Story Arcs** → Track narrative threads across days
5. **Assets** → Browse and preview game assets
6. **YAML** → Export/import scenarios

### Next Priority

**Validation Suite (S35-S39)**
- S35: JSON schemas for YAML validation
- S36: Real-time validator with error panel
- S37: Dead-end detector for dialogue trees
- S38: Stat balance analyzer
- S39: Export panel

**Polish (S40-S44)**
- S40: Keyboard shortcuts
- S41: Auto-save
- S42: Dark/light theme
- S43: Documentation
- S44: Sample project

**Engine remaining (E7, E10-E13)**
- E7: MeetingScene YAML loading
- E10-E13: Advanced systems

### Files Created/Modified

**Story Forge**:
- `src/components/App.ts` - Added AssetView integration
- `src/components/AssetView.ts` - NEW: Asset browser component
- `styles/main.css` - Asset view styles

### Commits Created (10 total)

1. `feat(tools): scaffold story-forge with server and state management`
2. `feat(scripting): add scenario types and loader with hybrid time flow`
3. `feat(game): add email, task, and event management systems`
4. `docs(adr): add ADR 0006 for YAML scripting system architecture`
5. `feat(story-forge): implement visual node editor with canvas and node types`
6. `feat(story-forge): implement bidirectional YAML serialization`
7. `feat(story-forge): implement timeline view for organizing game days`
8. `feat(story-forge): implement character database with voice preview`
9. `feat(story-forge): implement story arc tracker with continuity checker`
10. `feat(story-forge): implement asset manager with preview and scanner` (pending)

### Asset Manager Features

**Asset Browser**:
- Tree view with folders (sprites, backgrounds, audio)
- Expandable/collapsible folders
- File type icons (🎨 sprites, 🖼️ backgrounds, 🔊 sounds)
- Asset count indicators
- Real-time search filtering

**Preview Panel**:
- Image preview with checkered background
- Pixelated rendering for retro sprites
- Audio playback controls (play/stop)
- Asset path display
- Copy path to clipboard
- Drag-to-insert support

**Missing Asset Scanner** (S34):
- Scans project YAML files for asset references
- Identifies broken asset paths
- Lists files with missing references
- Sample detection for demonstration

**Asset Statistics**:
- Total sprite count
- Total background count
- Total sound count
- Footer summary display

**Sample Assets Loaded**:
- 12 sprite assets (cat animations, furniture)
- 6 background assets (room, PC screens)
- Placeholder audio files

## Status
- Created: 2026-02-01
- Phase: implementation (4.2)
- Last Update: 2026-02-01
- Progress: 40/57 total tasks (70%)
- **Milestone**: 70% complete
- Next: Validation suite (S35-S39) for error detection
