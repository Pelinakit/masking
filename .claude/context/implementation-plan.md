# Implementation Plan: YAML Scripting System + Story Forge Toolkit

## Overview

Two parallel tracks:
1. **Engine Work**: Enable game to execute YAML-driven content
2. **Story Forge**: Comprehensive authoring toolkit for writers

Both can proceed in parallel - Story Forge generates YAML, Engine consumes it.

---

# Part A: Game Engine (YAML Execution)

## Current State

**Already Implemented:**
- Scene hotspots (home.yaml) - ✅ 100%
- Character configs (player-cat.yaml) - ✅ 100%
- Laptop interface (laptop.yaml) - ✅ 100%
- NPC dialogue structure - ✅ Parser exists
- Scenario file structure (monday-full-day.yaml) - ✅ YAML exists, no loader

**Gaps:**
- Scenario loader, email UI, meeting YAML loading, task system, random events, enhanced conditions

## Engine Tasks

### Phase E1: Core Infrastructure
| ID | Task | Size |
|----|------|------|
| E1 | Define TypeScript interfaces for day schema | M |
| E2 | Create ScenarioLoader class | M |
| E3 | Enhance TimeManager with hybrid time flow | M |
| E4 | Add cumulative relationship persistence | S |

### Phase E2: Systems Integration
| ID | Task | Size |
|----|------|------|
| E5 | Implement event scheduler | M |
| E6 | Email system (manager + UI) | L |
| E7 | Meeting YAML loading in MeetingScene | M |
| E8 | Task system (manager + UI) | L |
| E9 | Random event scheduler | M |

### Phase E3: Day Flow
| ID | Task | Size |
|----|------|------|
| E10 | Enhanced condition evaluator | M |
| E11 | Unified effect executor | M |
| E12 | Day start/end sequences | M |
| E13 | State persistence for next day | S |

**Engine Commits:**
1. `feat(scripting): add scenario types and loader`
2. `feat(time): implement hybrid time flow`
3. `feat(email): add YAML-driven email system`
4. `feat(meeting): integrate YAML meeting definitions`
5. `feat(task): add task management system`
6. `feat(events): implement random event scheduler`
7. `feat(game): implement day flow and persistence`

---

# Part B: Story Forge Toolkit

## Architecture

```
tools/story-forge/
├── server.ts              # Bun HTTP server for file I/O
├── index.html             # Main entry point
├── src/
│   ├── main.ts            # App initialization
│   ├── state/
│   │   ├── store.ts       # Central state management
│   │   └── project.ts     # Project data structures
│   ├── components/
│   │   ├── App.ts         # Root component
│   │   ├── Sidebar.ts     # Navigation
│   │   ├── Timeline.ts    # Week/day view
│   │   ├── NodeEditor.ts  # Dialogue canvas
│   │   ├── CharacterDB.ts # Character management
│   │   ├── ArcTracker.ts  # Story arc view
│   │   ├── AssetManager.ts# Asset browser
│   │   └── Validator.ts   # Validation panel
│   ├── node-editor/
│   │   ├── Canvas.ts      # Canvas rendering
│   │   ├── Node.ts        # Base node class
│   │   ├── nodes/
│   │   │   ├── DialogueNode.ts
│   │   │   ├── ChoiceNode.ts
│   │   │   ├── ConditionNode.ts
│   │   │   └── EffectNode.ts
│   │   ├── Connection.ts  # Node connections
│   │   └── Serializer.ts  # Node graph → YAML
│   ├── services/
│   │   ├── FileService.ts # Server communication
│   │   ├── YAMLService.ts # Parse/generate YAML
│   │   ├── SpeechService.ts # Speech-gen integration
│   │   └── ValidationService.ts
│   └── types/
│       └── index.ts       # Shared types
├── styles/
│   └── main.css           # Styling
├── schema/
│   ├── day.schema.json    # Day file schema
│   ├── character.schema.json
│   └── scene.schema.json
└── README.md
```

## Data Model

```typescript
// Project structure
interface StoryProject {
  name: string;
  characters: Character[];
  arcs: StoryArc[];
  weeks: Week[];
  assets: AssetRegistry;
}

interface Character {
  id: string;
  name: string;
  species: string;
  voice: VoiceConfig;
  defaultEmotion: Emotion;
  spritePath: string;
  relationships: RelationshipConfig;
}

interface VoiceConfig {
  type: 'bweh' | 'buh' | 'pip' | 'meh';
  pitchOffset: number;
  speedOffset: number;
}

interface Week {
  number: number;
  days: DayReference[];
}

interface DayReference {
  id: string;
  name: string;  // "Monday", "Tuesday"
  filePath: string;
  arcs: string[];  // Arc IDs this day touches
  summary: DaySummary;  // Computed stats
}

interface StoryArc {
  id: string;
  name: string;
  description: string;
  color: string;  // For timeline visualization
  dayIds: string[];
}

// Node editor types
interface DialogueNode {
  id: string;
  type: 'dialogue';
  speaker: string;  // Character ID
  text: string;
  emotion: Emotion;
  position: { x: number; y: number };
  outputs: Connection[];
}

interface ChoiceNode {
  id: string;
  type: 'choice';
  options: ChoiceOption[];
  position: { x: number; y: number };
}

interface ChoiceOption {
  text: string;
  mask?: string;
  effects: Effect[];
  outputId: string;  // Connected node
}
```

## Task Breakdown

### Phase S1: Foundation (Server + Shell)
| ID | Task | Size | Description |
|----|------|------|-------------|
| S1 | Create tool scaffold | S | Directory structure, package.json, bun config |
| S2 | Build Bun HTTP server | M | File read/write endpoints, static serving |
| S3 | Create app shell with routing | M | Basic HTML/CSS/JS structure, sidebar nav |
| S4 | Implement central state store | M | Project state, UI state, undo/redo |

### Phase S2: Timeline View
| ID | Task | Size | Description |
|----|------|------|-------------|
| S5 | Build week/day grid component | M | Visual grid, week rows, day columns |
| S6 | Implement day card display | S | Show email/meeting counts, status |
| S7 | Add drag-to-reorder days | M | Drag handling, visual feedback |
| S8 | Add day CRUD operations | M | Create/rename/delete days |

### Phase S3: Character Database
| ID | Task | Size | Description |
|----|------|------|-------------|
| S9 | Build character list view | M | Grid of character cards with portraits |
| S10 | Create character editor panel | M | Name, species, voice, sprite fields |
| S11 | Integrate speech-gen for voice preview | M | Play sample dialogue with settings |
| S12 | Add relationship config | S | Default relationship values |

### Phase S4: Node Editor (Core)
| ID | Task | Size | Description |
|----|------|------|-------------|
| S13 | Build canvas with pan/zoom | L | Mouse handling, transform matrix |
| S14 | Create base Node class | M | Draggable, selectable, ports |
| S15 | Implement DialogueNode | M | Speaker, text, emotion fields |
| S16 | Implement ChoiceNode | M | Multiple options, effects per option |
| S17 | Implement ConditionNode | M | Condition expression, true/false branches |
| S18 | Implement EffectNode | S | Stat/relationship changes |
| S19 | Build connection system | L | Draw connections, validate types |
| S20 | Add node context menu | S | Delete, duplicate, disconnect |

### Phase S5: Node Editor (Advanced)
| ID | Task | Size | Description |
|----|------|------|-------------|
| S21 | Implement mini-map | M | Overview of entire graph |
| S22 | Add node search/filter | S | Find nodes by text content |
| S23 | Build dialogue preview panel | M | Walk through conversation |
| S24 | Integrate speech-gen in preview | M | Play audio while previewing |
| S25 | Implement graph → YAML serializer | L | Convert node graph to valid YAML |
| S26 | Implement YAML → graph parser | L | Load existing YAML into nodes |

### Phase S6: Story Arc Tracker
| ID | Task | Size | Description |
|----|------|------|-------------|
| S27 | Build arc list/editor | M | Create/edit arcs with colors |
| S28 | Show arc indicators on timeline | S | Color bars spanning days |
| S29 | Add arc assignment to days | S | Tag days with arcs |
| S30 | Implement continuity checker | M | Warn if arc has gaps |

### Phase S7: Asset Manager
| ID | Task | Size | Description |
|----|------|------|-------------|
| S31 | Build asset browser | M | Tree view of asset directories |
| S32 | Add asset preview | M | Show sprites, play sounds |
| S33 | Implement drag-to-insert | S | Drag asset into node fields |
| S34 | Add missing asset scanner | M | Find references to nonexistent files |

### Phase S8: Validation & Export
| ID | Task | Size | Description |
|----|------|------|-------------|
| S35 | Create JSON schemas for all file types | M | Day, character, scene schemas |
| S36 | Build real-time validator | M | Show errors as you edit |
| S37 | Implement dead-end detector | M | Find unreachable nodes |
| S38 | Add stat balance analyzer | M | Total energy/stress per day |
| S39 | Build export panel | S | Export single day or full project |

### Phase S9: Polish & Integration
| ID | Task | Size | Description |
|----|------|------|-------------|
| S40 | Add keyboard shortcuts | S | Save, undo, redo, navigate |
| S41 | Implement auto-save | S | Save on change with debounce |
| S42 | Add dark/light theme | S | Match game aesthetic |
| S43 | Write documentation | M | README, in-app help |
| S44 | Create sample project | M | Week 1 as example content |

---

## Dependency Graph

```
Phase S1 (Foundation)
S1 → S2 → S3 → S4

Phase S2-S3 (Views) - Can run in parallel after S4
S4 → S5 → S6 → S7 → S8
S4 → S9 → S10 → S11 → S12

Phase S4-S5 (Node Editor) - Core feature
S4 → S13 → S14 → S15, S16, S17, S18
S14 → S19 → S20
S19 → S21, S22
S15 → S23 → S24
S19 → S25 → S26

Phase S6-S8 (Features) - After core editor
S5 → S27 → S28 → S29 → S30
S4 → S31 → S32 → S33 → S34
S25 → S35 → S36 → S37, S38
S36 → S39

Phase S9 (Polish) - Final
S39 → S40, S41, S42, S43, S44
```

---

## UI Wireframes

### Main Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Story Forge                                    [Save] [⚙]  │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                   │
│ Timeline│   [Currently Active View]                         │
│         │                                                   │
│ ─────── │   - Timeline: Week/day grid                       │
│         │   - Editor: Node canvas for selected day          │
│Characters│   - Characters: Character database               │
│         │   - Arcs: Story arc tracker                       │
│ ─────── │   - Assets: Asset browser                         │
│         │   - Validate: Validation results                  │
│  Arcs   │                                                   │
│         │                                                   │
│ ─────── │                                                   │
│         │                                                   │
│ Assets  │                                                   │
│         │                                                   │
│ ─────── │                                                   │
│         │                                                   │
│Validate │                                                   │
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

### Node Editor
```
┌─────────────────────────────────────────────────────────────┐
│ Monday - Weekly Standup Meeting                    [▶ Play] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                           │
│   │ 📢 Dialogue │──────┐                                    │
│   │ Boss:       │      │                                    │
│   │ "Who wants  │      ▼                                    │
│   │  to go      │   ┌─────────────┐                         │
│   │  first?"    │   │ ⑂ Choice    │                         │
│   └─────────────┘   │             │                         │
│                     │ ○ Volunteer ├──→ [Dialogue Node]      │
│                     │ ○ Stay quiet├──→ [Dialogue Node]      │
│                     └─────────────┘                         │
│                                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Mini-map                                                 ││
│ └──────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Properties: [Selected node properties panel]                │
└─────────────────────────────────────────────────────────────┘
```

### Timeline View
```
┌─────────────────────────────────────────────────────────────┐
│ Week 1                                          [+ Add Day] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ Monday  │ │ Tuesday │ │Wednesday│ │Thursday │ │ Friday│ │
│  │         │ │         │ │         │ │         │ │       │ │
│  │ ✉ 5     │ │ ✉ 3     │ │ ✉ 4     │ │ ✉ 6     │ │ ✉ 4   │ │
│  │ 📅 3    │ │ 📅 2    │ │ 📅 1    │ │ 📅 4    │ │ 📅 2  │ │
│  │ ✓ 4     │ │ ✓ 3     │ │ ✓ 2     │ │ ✓ 5    │ │ ✓ 3   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
│                                                             │
│  ████████ Client Presentation Arc ██████████████████████    │
│       ░░░░░░░░ Wellness Week Arc ░░░░░░░                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Week 2                                          [+ Add Day] │
├─────────────────────────────────────────────────────────────┤
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Server | Bun native HTTP | Matches project stack, fast, simple |
| UI Framework | Vanilla JS + Web Components | Lightweight, no build step for UI |
| Node Editor | Custom Canvas API | Full control, no library dependencies |
| State | Custom store with events | Simple, matches existing patterns |
| Styling | CSS custom properties | Themeable, consistent |
| Speech Integration | Import from speech-gen | Reuse existing code |

---

## Commit Points

### Story Forge
1. `feat(tools): scaffold story-forge with server` (S1-S2)
2. `feat(story-forge): add app shell and state management` (S3-S4)
3. `feat(story-forge): implement timeline view` (S5-S8)
4. `feat(story-forge): add character database` (S9-S12)
5. `feat(story-forge): build node editor canvas` (S13-S14, S19-S20)
6. `feat(story-forge): add dialogue and choice nodes` (S15-S18)
7. `feat(story-forge): implement dialogue preview with speech` (S21-S24)
8. `feat(story-forge): add YAML serialization` (S25-S26)
9. `feat(story-forge): add story arc tracker` (S27-S30)
10. `feat(story-forge): implement asset manager` (S31-S34)
11. `feat(story-forge): add validation tools` (S35-S39)
12. `feat(story-forge): polish and documentation` (S40-S44)

---

## Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Node editor complexity | Custom canvas is significant work | Start simple, iterate |
| YAML ↔ Node graph sync | Bidirectional conversion is tricky | Define clear mapping rules, test extensively |
| Performance | Large dialogue trees may lag | Virtual rendering, lazy loading |
| Speech-gen integration | May need refactoring for reuse | Extract core module, share types |

---

## Suggested Implementation Order

**Parallel Track A (Engine):** E1-E13 (can start immediately)

**Parallel Track B (Story Forge):**
1. S1-S4: Foundation (get something running)
2. S13-S20: Node editor core (main feature)
3. S5-S8: Timeline (organization)
4. S25-S26: YAML conversion (critical for usefulness)
5. S9-S12: Characters (speech integration)
6. S35-S39: Validation (quality of life)
7. S27-S34: Arcs + Assets (nice to have)
8. S40-S44: Polish

**Milestones:**
- **M1**: Can create dialogue nodes and export YAML
- **M2**: Can organize days in timeline
- **M3**: Can preview dialogue with speech
- **M4**: Full validation and export
