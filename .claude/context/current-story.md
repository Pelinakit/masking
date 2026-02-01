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
- [x] Story arc tracking across multiple days (S27-S30) - COMPLETE
- [ ] Asset manager for sprites, sounds, backgrounds (S31-S34 next)
- [x] Speech-gen integration for dialogue audio preview - Web Audio API
- [ ] YAML validation with helpful error messages (S35-S39)

## Progress

### Completed (2026-02-01)

**Track A: Game Engine** (9/13 tasks - 69%) ✅
- E1-E4: Core infrastructure
- E5-E9: Systems integration

**Track B: Story Forge Toolkit** (27/44 tasks - 61%) ✅

1. **S1-S4: Foundation** ✅
2. **S13-S20: Node Editor Core** ✅
3. **S25-S26: YAML Serialization** ✅
4. **S5-S8: Timeline View** ✅
5. **S9-S12: Character Database** ✅
6. **S27-S30: Story Arc Tracker** ✅
   - Arc list/editor with color-coding
   - Arc indicators on timeline (color bars)
   - Day assignment system
   - Continuity checker with gap detection

### Major Milestone: Over 60% Complete

The toolkit now has:
1. **Timeline** → Organize weeks and days with arc indicators
2. **Editor** → Build dialogue visually
3. **Characters** → Manage NPCs with voice preview
4. **Story Arcs** → Track narrative threads across days
5. **YAML** → Export/import scenarios

### Next Priority

**Asset Manager (S31-S34)**
- S31: Asset browser tree view
- S32: Asset preview (sprites, sounds)
- S33: Drag-to-insert
- S34: Missing asset scanner

**Validation (S35-S39)**
- S35: JSON schemas
- S36: Real-time validator
- S37: Dead-end detector
- S38: Stat balance analyzer
- S39: Export panel

**Polish (S40-S44)**
- S40: Keyboard shortcuts
- S41: Auto-save
- S42: Dark/light theme
- S43: Documentation
- S44: Sample project

### Files Created/Modified

**Story Forge**:
- `src/components/App.ts` - Added ArcView integration
- `src/components/ArcView.ts` - NEW: Arc tracker component
- `src/components/TimelineView.ts` - Added arc color indicators
- `styles/main.css` - Arc view + arc indicator styles

### Commits Created (9 total)

1. `feat(tools): scaffold story-forge with server and state management`
2. `feat(scripting): add scenario types and loader with hybrid time flow`
3. `feat(game): add email, task, and event management systems`
4. `docs(adr): add ADR 0006 for YAML scripting system architecture`
5. `feat(story-forge): implement visual node editor with canvas and node types`
6. `feat(story-forge): implement bidirectional YAML serialization`
7. `feat(story-forge): implement timeline view for organizing game days`
8. `feat(story-forge): implement character database with voice preview`
9. `feat(story-forge): implement story arc tracker with continuity checker` (pending)

### Story Arc Tracker Features

**Arc Management**:
- Add/delete story arcs
- Pre-loaded sample arcs (Client Presentation, Wellness Week, Team Conflict)
- Custom color picker for each arc
- Arc description text

**Timeline Integration**:
- Color bars at top of day cards
- Arc tags on day cards with custom colors
- Visual indication of which arcs span which days

**Day Assignment**:
- Assign arcs to specific days
- Multi-select day assignment
- Remove days from arcs
- Day tags showing assigned days

**Continuity Checker**:
- Detects gaps in arc day sequences
- Warning icons for arcs with continuity issues
- Validation panel showing all issues
- Chronological day sorting (week1-monday < week1-tuesday < week2-monday)

**Sample Arcs**:
- Client Presentation: Blue (#4a9eff), spans Week 1
- Wellness Week: Green (#10b981), mid-week days
- Team Conflict: Red (#f87171), discontinuous days

## Status
- Created: 2026-02-01
- Phase: implementation (4.2)
- Last Update: 2026-02-01
- Progress: 36/57 total tasks (63%)
- **Milestone**: Over 60% complete
- Next: Asset manager (S31-S34) for sprite/sound browsing
