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
- [x] Asset manager for sprites, sounds, backgrounds
- [x] Speech-gen integration for dialogue audio preview - Web Audio API
- [x] YAML validation with helpful error messages (S35-S39) - COMPLETE

## Progress

### Completed (2026-02-01)

**Track A: Game Engine** (9/13 tasks - 69%) ✅
- E1-E4: Core infrastructure
- E5-E9: Systems integration

**Track B: Story Forge Toolkit** (36/44 tasks - 82%) ✅

1. **S1-S4: Foundation** ✅
2. **S13-S20: Node Editor Core** ✅
3. **S25-S26: YAML Serialization** ✅
4. **S5-S8: Timeline View** ✅
5. **S9-S12: Character Database** ✅
6. **S27-S30: Story Arc Tracker** ✅
7. **S31-S34: Asset Manager** ✅
8. **S35-S39: Validation Suite** ✅
   - JSON schema validation
   - Real-time error detection
   - Dead-end node detector
   - Stat balance analyzer
   - Export panel (YAML/ZIP)

### Major Milestone: Over 80% Complete

The toolkit now has:
1. **Timeline** → Organize weeks and days with arc indicators
2. **Editor** → Build dialogue visually
3. **Characters** → Manage NPCs with voice preview
4. **Story Arcs** → Track narrative threads across days
5. **Assets** → Browse and preview game assets
6. **Validation** → Check for errors and balance issues
7. **YAML** → Export/import scenarios

### Next Priority

**Polish (S40-S44)** - Final 8 tasks remaining
- S40: Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y)
- S41: Auto-save with debouncing
- S42: Dark/light theme toggle
- S43: Documentation (README)
- S44: Sample project with real content

**Engine remaining (E7, E10-E13)** - 4 tasks
- E7: MeetingScene YAML loading
- E10-E13: Advanced systems

### Files Created/Modified

**Story Forge**:
- `src/components/App.ts` - Added ValidationView integration
- `src/components/ValidationView.ts` - NEW: Validation suite component
- `styles/main.css` - Validation view styles

### Commits Created (11 total)

1. `feat(tools): scaffold story-forge with server and state management`
2. `feat(scripting): add scenario types and loader with hybrid time flow`
3. `feat(game): add email, task, and event management systems`
4. `docs(adr): add ADR 0006 for YAML scripting system architecture`
5. `feat(story-forge): implement visual node editor with canvas and node types`
6. `feat(story-forge): implement bidirectional YAML serialization`
7. `feat(story-forge): implement timeline view for organizing game days`
8. `feat(story-forge): implement character database with voice preview`
9. `feat(story-forge): implement story arc tracker with continuity checker`
10. `feat(story-forge): implement asset manager with preview and scanner`
11. `feat(story-forge): implement validation suite with error detection` (pending)

### Validation Suite Features

**Schema Validation** (S35):
- Required field checking
- Type validation
- Metadata validation
- Node structure validation
- Real-time error messages

**Error Detection** (S36):
- Error/warning/info categorization
- Location tracking
- Helpful suggestions
- Overview dashboard with stats
- Detailed error panels

**Dead-End Detector** (S37):
- Finds nodes with no outputs
- Identifies dialogue paths that trap players
- Lists all dead-end nodes
- Provides fix suggestions
- Excludes valid ending nodes (events)

**Stat Balance Analyzer** (S38):
- Sums energy/stress/hunger changes
- Calculates per-path averages
- Flags demanding days
- Balance recommendations
- Visual verdict (balanced/warning)

**Export Panel** (S39):
- Export current day as YAML
- Export full project as ZIP
- Export character database
- Multiple format support
- One-click downloads

**Tabbed Interface**:
- Overview: Summary dashboard
- Schema: YAML validation errors
- Dead Ends: Structural issues
- Balance: Stat analysis
- Export: File export options

## Status
- Created: 2026-02-01
- Phase: implementation (4.2)
- Last Update: 2026-02-01
- Progress: 45/57 total tasks (79%)
- **Milestone**: Nearly 80% complete
- Next: Polish (S40-S44) for final refinements
