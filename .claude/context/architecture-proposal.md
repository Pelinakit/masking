# Architecture Proposal: Masking

**Project**: Masking - Sims-inspired neurodivergent experience game
**Phase**: 1.3 - Architecture Proposal
**Date**: 2026-01-31

---

## 1. System Overview

Masking is a single-player, browser-based 2D game built with Phaser 3, featuring a data-driven architecture where game content (scenes, NPCs, interactions) is defined in YAML scripts rather than hardcoded.

### Core Design Principles

1. **Modularity**: Core engine remains unchanged when adding new content
2. **Data-Driven**: YAML scripts define all game content and behaviors
3. **Accessibility-First**: CVD-friendly design, WCAG-AA compliance
4. **Static Deployment**: No server-side requirements, fully client-side

---

## 2. Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Game Engine** | Phaser 3 | Mature 2D engine, TypeScript support, excellent documentation |
| **Language** | TypeScript | Type safety for complex game state management |
| **Runtime** | Bun | Fast dev server, native TypeScript support, modern tooling |
| **Data Format** | YAML | Human-readable, maintainable, supports modular design |
| **Build Tool** | Bun + Vite | Fast HMR, optimized bundling, asset pipeline |
| **Deployment** | Static hosting | CDN-compatible, no backend needed |

---

## 3. Architecture Layers

### 3.1 Core Engine Layer

The foundation that never changes when adding content.

**Responsibilities:**
- Game loop management
- Scene rendering
- Input handling (keyboard, mouse, gamepad)
- State persistence (save/load)
- Asset loading and caching
- Audio management

**Key Components:**
```
src/core/
├── GameManager.ts          # Main game coordinator
├── SceneManager.ts         # Phaser scene orchestration
├── InputManager.ts         # Unified input handling
├── StateManager.ts         # Game state and persistence
├── AssetLoader.ts          # Asset preloading and caching
└── AudioManager.ts         # Sound and music control
```

---

### 3.2 Game Logic Layer

Game-specific logic that uses the core engine.

**Responsibilities:**
- Stat management (energy, stress, hunger, happiness, social anxiety)
- Time simulation (24-hour clock, day progression)
- Work task generation and tracking
- Mask system mechanics
- NPC behavior coordination

**Key Components:**
```
src/game/
├── stats/
│   ├── StatSystem.ts       # Stat calculation engine
│   ├── StatModifiers.ts    # Buff/debuff system
│   └── StatDisplay.ts      # UI rendering for stats
├── time/
│   ├── TimeManager.ts      # 24-hour clock simulation
│   └── Schedule.ts         # Daily event scheduling
├── work/
│   ├── TaskSystem.ts       # Work task generation/tracking
│   ├── MeetingSystem.ts    # Zoom call mechanics
│   └── DeadlineTracker.ts  # Deadline management
├── masks/
│   ├── MaskSystem.ts       # Mask selection/switching
│   └── MaskEffects.ts      # Mask stat modifiers
└── dialogue/
    ├── DialogueEngine.ts   # Conversation system
    └── DialogueParser.ts   # YAML dialogue tree parser
```

---

### 3.3 Script Interpretation Layer

Bridges YAML data with game logic.

**Responsibilities:**
- YAML file loading and validation
- Script parsing and schema validation
- Dynamic behavior instantiation
- Event trigger evaluation

**Key Components:**
```
src/scripting/
├── ScriptLoader.ts         # YAML file loader
├── SchemaValidator.ts      # YAML schema validation
├── parsers/
│   ├── SceneParser.ts      # Parse scene YAML files
│   ├── NPCParser.ts        # Parse NPC YAML files
│   └── ManagementParser.ts # Parse game rules YAML
└── interpreters/
    ├── HotspotInterpreter.ts   # Handle scene hotspots
    ├── EventInterpreter.ts     # Trigger scripted events
    └── BehaviorInterpreter.ts  # NPC behavior execution
```

---

### 3.4 Presentation Layer

Visual rendering and UI.

**Responsibilities:**
- Phaser scene rendering
- UI overlays (laptop, stats, menus)
- Animation playback
- Accessibility features (high contrast, patterns)

**Key Components:**
```
src/presentation/
├── scenes/
│   ├── BootScene.ts        # Asset preloading
│   ├── MenuScene.ts        # Main menu
│   ├── TutorialScene.ts    # Sunday tutorial
│   ├── RoomScene.ts        # Main gameplay room
│   ├── LaptopScene.ts      # Laptop overlay
│   └── ZoomScene.ts        # Meeting "battle" scene
├── ui/
│   ├── StatBars.ts         # Visual stat displays
│   ├── Clock.ts            # 24-hour clock display
│   ├── InteractionPrompt.ts # "E to interact" prompts
│   └── ESCButton.ts        # Top-left ESC context button
└── accessibility/
    ├── ColorBlindMode.ts   # CVD-friendly palette swaps
    ├── HighContrast.ts     # High contrast mode
    └── TexturePatterns.ts  # Pattern overlays for stats
```

---

## 4. Data Architecture

### 4.1 YAML Script Structure

**Scene Scripts** (`data/scenes/*.yaml`):
```yaml
# home.yaml
name: "Player Home"
background: "assets/backgrounds/home.png"
hotspots:
  - id: bed
    coords: [50, 200, 200, 350]
    interaction:
      type: action
      action: sleep
      prompt: "Sleep"
  - id: laptop
    coords: [300, 150, 450, 250]
    interaction:
      type: scene_transition
      scene: laptop
      prompt: "Use laptop"
  - id: kitchen
    coords: [600, 100, 750, 300]
    interaction:
      type: action
      action: prepare_food
      prompt: "Prepare food"
events:
  - id: morning_alarm
    trigger:
      type: time
      hour: 9
      minute: 0
    action:
      type: dialogue
      text: "Time to start the day..."
```

**NPC Scripts** (`data/npcs/*.yaml`):
```yaml
# boss_chihuahua.yaml
name: "Karen"
species: "dog"
breed: "chihuahua"
role: "boss"
spritesheet: "assets/npcs/chihuahua.png"
dialogue_trees:
  - id: default_greeting
    nodes:
      - id: start
        text: "We need to talk about your performance..."
        stat_effects:
          stress: 20
          social_anxiety: 15
        options:
          - text: "Of course, what's the issue?"
            required_mask: careful_subordinate
            next: positive_response
          - text: "Can this wait? I'm busy."
            next: negative_response
```

**Management Script** (`data/game_rules.yaml`):
```yaml
# game_rules.yaml
game_name: "Masking"
version: "0.1.0"
starting_stats:
  energy: 100
  stress: 0
  hunger: 50
  happiness: 75
  social_anxiety: 30

stat_decay:
  hunger:
    rate: 5  # per hour
  energy:
    rate: 2  # per hour when awake

work_rules:
  daily_tasks: 3-5
  deadline_days: 1-3
  meeting_frequency: 2-4  # per day

masks:
  - id: meeting_participant
    energy_cost: 5  # per hour
    effectiveness:
      meetings: 1.0
      presentations: 0.5
  - id: presenter
    energy_cost: 20  # per hour
    effectiveness:
      meetings: 0.8
      presentations: 1.0
  # ... more masks
```

### 4.2 Data Flow

```
YAML Files
    ↓
ScriptLoader (validation)
    ↓
Parser (type-safe objects)
    ↓
Interpreter (runtime behavior)
    ↓
Game Logic (stat changes, events)
    ↓
Presentation (visual updates)
```

---

## 5. Key Architectural Patterns

### 5.1 Entity-Component System (Lightweight)

Not a full ECS, but component-based organization:

```typescript
// Entities are data containers
interface Entity {
  id: string;
  components: Map<string, Component>;
}

// Components are pure data
interface StatComponent {
  energy: number;
  stress: number;
  hunger: number;
  happiness: number;
  socialAnxiety: number;
}

// Systems operate on entities with specific components
class StatSystem {
  update(entity: Entity, deltaTime: number) {
    const stats = entity.components.get('stats') as StatComponent;
    // Apply stat decay logic
  }
}
```

### 5.2 Event-Driven Communication

Decoupled systems communicate via events:

```typescript
// Event bus for loose coupling
class EventBus {
  private listeners: Map<string, Function[]>;

  emit(event: string, data: any) { ... }
  on(event: string, callback: Function) { ... }
}

// Usage
eventBus.emit('stat_changed', { stat: 'energy', value: 50 });
eventBus.on('stat_changed', (data) => {
  // Update UI, check thresholds, etc.
});
```

### 5.3 State Machine for Game Phases

```typescript
enum GamePhase {
  MENU = 'menu',
  TUTORIAL = 'tutorial',
  WEEKDAY = 'weekday',
  MEETING = 'meeting',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

class GameStateMachine {
  private currentPhase: GamePhase;

  transition(newPhase: GamePhase) {
    // Validate transition, cleanup old phase, setup new phase
  }
}
```

### 5.4 Schema Validation

YAML scripts validated against JSON schemas:

```typescript
import Ajv from 'ajv';

const sceneSchema = {
  type: 'object',
  required: ['name', 'hotspots'],
  properties: {
    name: { type: 'string' },
    background: { type: 'string' },
    hotspots: {
      type: 'array',
      items: { /* hotspot schema */ }
    }
  }
};

class SchemaValidator {
  private ajv = new Ajv();

  validate(data: any, schema: object): boolean {
    return this.ajv.validate(schema, data);
  }
}
```

---

## 6. File Structure

```
masking/
├── src/
│   ├── core/              # Core engine (never changes)
│   ├── game/              # Game-specific logic
│   ├── scripting/         # YAML interpretation
│   ├── presentation/      # Phaser scenes and UI
│   ├── types/             # TypeScript type definitions
│   └── main.ts            # Application entry point
├── data/
│   ├── scenes/            # Scene YAML files
│   ├── npcs/              # NPC YAML files
│   ├── game_rules.yaml    # Global game configuration
│   └── schemas/           # JSON schemas for validation
├── assets/
│   ├── sprites/           # Character sprite sheets
│   ├── backgrounds/       # Room backgrounds
│   ├── ui/                # UI elements
│   ├── audio/             # Sound effects and music
│   └── fonts/             # Custom fonts
├── public/
│   └── index.html         # HTML entry point
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── .claude/
│   └── context/           # POF workflow state
├── package.json
├── tsconfig.json
├── bun.lockb
└── README.md
```

---

## 7. Critical Game Systems

### 7.1 Stat Management System

**Requirements:**
- Five stats: energy, stress, hunger, happiness, social anxiety
- Stats decay over time (hunger/energy)
- Stats affected by actions (work, eating, sleeping, meetings)
- Visual stat bars with accessibility support

**Architecture:**
```typescript
interface StatThresholds {
  critical: number;    // < 20
  warning: number;     // < 40
  normal: number;      // >= 40
}

class StatSystem {
  private stats: Map<string, number>;
  private modifiers: StatModifier[];

  applyStat(stat: string, change: number): void
  applyModifier(modifier: StatModifier): void
  removeModifier(id: string): void
  tick(deltaTime: number): void  // Apply decay
}
```

### 7.2 Time Management System

**Requirements:**
- 24-hour clock
- Real-time with pause capability
- Event scheduling (meetings, deadlines)
- Day transitions

**Architecture:**
```typescript
class TimeManager {
  private currentTime: { hour: number; minute: number };
  private timeScale: number = 1.0;  // Multiplier for game speed
  private scheduledEvents: ScheduledEvent[];

  advanceTime(deltaMs: number): void
  scheduleEvent(event: ScheduledEvent): void
  pause(): void
  resume(): void
}
```

### 7.3 Mask System

**Requirements:**
- Five mask types with different costs/effectiveness
- Contextual effectiveness (right mask for right situation)
- Energy cost per hour wearing mask
- Penalties for wrong mask or no mask

**Architecture:**
```typescript
interface Mask {
  id: string;
  name: string;
  energyCostPerHour: number;
  effectiveness: Map<string, number>;  // context -> multiplier
}

class MaskSystem {
  private currentMask: Mask | null;
  private availableMasks: Mask[];

  equipMask(maskId: string): void
  removeMask(): void
  calculateEffectiveness(context: string): number
  applyEnergyCost(hours: number): void
}
```

### 7.4 Meeting (Battle) System

**Requirements:**
- Zoom call interface with video boxes
- Mask selection
- Turn-based or time-based interactions
- Stat tracking during meeting
- Meeting outcomes affect work progress

**Architecture:**
```typescript
interface MeetingParticipant {
  id: string;
  name: string;
  breed: string;
  sprite: string;
  dialogueTree: string;
}

class MeetingSystem {
  private participants: MeetingParticipant[];
  private duration: number;
  private requiredMask: string;

  startMeeting(meetingData: any): void
  updateMeeting(deltaTime: number): void
  endMeeting(): MeetingResult
}
```

---

## 8. Accessibility Architecture

### 8.1 Color Vision Deficiency Support

**Implementation:**
- Texture/pattern overlays for stat bars (not just color)
- High contrast mode toggle
- Color palette swaps (protanopia, deuteranopia, tritanopia modes)
- Never use color as sole indicator

**Architecture:**
```typescript
enum CVDMode {
  NORMAL = 'normal',
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia',
  TRITANOPIA = 'tritanopia'
}

class AccessibilityManager {
  private cvdMode: CVDMode = CVDMode.NORMAL;
  private highContrast: boolean = false;

  setCVDMode(mode: CVDMode): void
  toggleHighContrast(): void
  applyAccessibilityFilters(): void
}
```

### 8.2 UI Patterns

- All stat bars have both color and pattern
- Icons supplement text
- WCAG-AA contrast ratios (4.5:1 minimum)
- Keyboard navigation for all interactions

---

## 9. Performance Considerations

### 9.1 Asset Loading Strategy

- Preload all critical assets in BootScene
- Lazy load non-critical assets (audio, backgrounds for unseen scenes)
- Use sprite atlases to reduce draw calls
- Compress images without quality loss

### 9.2 Game Loop Optimization

- Fixed time step for game logic (60 FPS target)
- Variable time step for rendering
- Object pooling for frequently created/destroyed objects
- Minimize garbage collection pressure

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Stat calculation logic
- Time management
- Mask effectiveness calculations
- YAML parser validation

### 10.2 Integration Tests

- Scene transitions
- NPC dialogue flows
- Meeting system
- Save/load functionality

### 10.3 Accessibility Tests

- CVD simulation validation
- Contrast ratio verification
- Keyboard navigation coverage

---

## 11. Deployment Pipeline

```
Development (local)
    ↓
Build (bun build)
    ↓
Bundle optimization (Vite)
    ↓
Asset processing (compression, atlases)
    ↓
Static files (dist/)
    ↓
Deploy to static host (Netlify/Vercel/GitHub Pages)
```

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── sprites.atlas.png
│   ├── backgrounds/
│   └── ui/
├── data/
│   └── *.yaml (included in bundle)
└── bundle.js (minified)
```

---

## 12. Extensibility Points

The architecture allows adding new content without modifying core:

| Addition | How to Extend |
|----------|---------------|
| New scene | Add YAML file to `data/scenes/` |
| New NPC | Add YAML file to `data/npcs/` |
| New mask | Add entry to `game_rules.yaml` |
| New stat | Add to `game_rules.yaml`, update UI components |
| New interaction | Add to scene YAML, implement action handler |
| New mini-game | Add new Phaser scene, reference in YAML |

---

## 13. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| YAML parsing errors | Schema validation, comprehensive error messages |
| Complex game state | TypeScript strict mode, state management patterns |
| Performance issues | Profiling tools, object pooling, lazy loading |
| Accessibility compliance | Automated testing, CVD simulation, manual testing |
| Browser compatibility | Phaser 3 handles cross-browser issues, target modern browsers |

---

## 14. Open Questions

1. **Audio system**: Should we include background music and sound effects from the start, or add later?
2. **Save system**: LocalStorage sufficient, or implement cloud saves?
3. **Telemetry**: Should we track player behavior for balancing (privacy-respecting, opt-in)?
4. **Mobile support**: Target desktop only initially, or responsive design from start?

---

## 15. Next Steps (Post-Approval)

1. Phase 2: Design - UX/accessibility patterns, component structure
2. Phase 3: Scaffolding - Initialize project, install dependencies
3. Phase 4: Implementation - Iterative development
4. ADR writing for key architectural decisions

---

**Status**: Awaiting approval to proceed to Phase 1.5 checkpoint.
