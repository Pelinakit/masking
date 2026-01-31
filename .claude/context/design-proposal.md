# Design Proposal: Masking

**Project**: Masking - Sims-inspired neurodivergent experience game
**Phase**: 2.1-2.3 - Design Phase
**Date**: 2026-01-31

---

## 1. UX & Accessibility Patterns

### 1.1 Input Abstraction Layer

**Requirement**: Support keyboard, mouse, and gamepad seamlessly with context-aware UI hints.

**Pattern: Unified Input Manager with Active Device Detection**

```typescript
enum InputDevice {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  GAMEPAD = 'gamepad'
}

class InputManager {
  private activeDevice: InputDevice = InputDevice.KEYBOARD;
  private lastInputTime: Map<InputDevice, number> = new Map();

  // Auto-detect which device was used most recently
  updateActiveDevice(device: InputDevice): void {
    if (device !== this.activeDevice) {
      this.activeDevice = device;
      this.emitDeviceChange(device);
    }
  }

  // Emit event for UI to update hints (WASD vs gamepad icons)
  private emitDeviceChange(device: InputDevice): void {
    eventBus.emit('input_device_changed', { device });
  }
}
```

**UI Implications**:
- Interaction prompts show appropriate icon: "E" (keyboard), click cursor (mouse), "A button" (gamepad)
- Tutorial arrows adapt: "Press A" vs "Move left" vs gamepad stick icon
- ESC button in top-left shows "ESC" (keyboard), "X" (mouse click), "B button" (gamepad)

**Accessibility Win**: Users with limited mobility can choose their preferred input method without friction.

---

### 1.2 Progressive Disclosure Pattern

**Requirement**: Tutorial must introduce mechanics gradually without overwhelming players.

**Pattern: Contextual Hint System with State Persistence**

```typescript
interface TutorialHint {
  id: string;
  condition: () => boolean;  // When to show
  element: string;           // What to highlight
  message: string;           // Instruction text
  dismissOnAction: string;   // Which action completes this hint
}

class TutorialManager {
  private completedHints: Set<string> = new Set();
  private activeHints: TutorialHint[] = [];

  // Only show hints that haven't been dismissed and meet conditions
  updateHints(): void {
    this.activeHints = TUTORIAL_HINTS.filter(hint =>
      !this.completedHints.has(hint.id) &&
      hint.condition()
    );
  }

  // Pulsating arrow appears only when needed
  showHint(hint: TutorialHint): void {
    // Visual: pulsating arrow with key/button icon
    // Audio: optional gentle chime (respects audio settings)
  }
}
```

**Tutorial Flow**:
1. Movement (WASD/arrows) → appears immediately, dismisses after player moves
2. Interaction (E at kitchen) → appears when near interactive object
3. Laptop → appears after player has eaten
4. ESC to close → appears when laptop is first opened
5. Stats explanation → appears when first stat enters warning threshold

**Accessibility Win**: No time pressure, hints persist until completed, can be replayed.

---

### 1.3 CVD-Friendly Stat Visualization

**Requirement**: WCAG-AA compliant, never rely on color alone, support CVD modes.

**Pattern: Multi-Modal Stat Representation**

Each stat bar has **four visual indicators**:
1. **Color** (baseline, but not relied upon)
2. **Pattern/Texture** (unique per stat)
3. **Icon** (semantic meaning)
4. **Numeric Value** (optional toggle)

**Stat Bar Design**:

```typescript
interface StatBarConfig {
  id: string;
  label: string;
  icon: string;          // Path to icon sprite
  color: Color;          // Default color
  cvdColors: Map<CVDMode, Color>;  // Alternative palettes
  pattern: PatternType;  // Texture overlay
  thresholds: {
    critical: number;    // < 20 (red zone)
    warning: number;     // < 40 (yellow zone)
    normal: number;      // >= 40 (green zone)
  };
}

enum PatternType {
  SOLID = 'solid',           // Energy (no pattern, baseline)
  DIAGONAL_STRIPES = 'diagonal',  // Stress
  DOTS = 'dots',             // Hunger
  HORIZONTAL_LINES = 'horizontal',  // Happiness
  CROSSHATCH = 'crosshatch'  // Social Anxiety
}
```

**Visual Layout** (always visible during gameplay):
```
┌─────────────────────────────────────┐
│ [Battery Icon] Energy    [████░░] 67│
│ [Storm Icon] Stress      [██░░░░] 35│
│ [Apple Icon] Hunger      [█████░] 82│
│ [Smile Icon] Happiness   [███░░░] 54│
│ [People Icon] Soc.Anx.   [██░░░░] 28│
└─────────────────────────────────────┘
```

**CVD Color Palettes**:

| Stat | Normal | Protanopia | Deuteranopia | Tritanopia |
|------|--------|------------|--------------|------------|
| Energy | Blue | Blue | Blue | Yellow-orange |
| Stress | Red | Orange | Orange | Red-pink |
| Hunger | Orange | Dark blue | Dark blue | Purple |
| Happiness | Green | Teal | Teal | Green |
| Social Anxiety | Purple | Brown | Brown | Teal |

**Threshold Visual States**:
- **Critical (< 20)**: Pulsating animation, warning icon overlay, accessible to screen readers
- **Warning (< 40)**: Lighter pulsation, caution icon
- **Normal (>= 40)**: Steady state

**Accessibility Win**: Players with CVD can distinguish stats through patterns alone, color is supplementary.

---

### 1.4 Overlay Stack Management

**Requirement**: ESC always closes top-most layer, context-aware ESC button label.

**Pattern: Modal Stack with Context Awareness**

```typescript
interface ModalLayer {
  id: string;
  scene: Phaser.Scene;
  escLabel: string;  // "Close email", "Close laptop", "Menu"
  onClose: () => void;
}

class ModalStackManager {
  private stack: ModalLayer[] = [];

  push(layer: ModalLayer): void {
    this.stack.push(layer);
    this.updateESCButton();
    this.pauseUnderlyingLayers();
  }

  pop(): ModalLayer | null {
    const layer = this.stack.pop();
    this.updateESCButton();
    this.resumeTopLayer();
    return layer;
  }

  private updateESCButton(): void {
    const topLayer = this.stack[this.stack.length - 1];
    const label = topLayer ? topLayer.escLabel : "Menu";
    eventBus.emit('update_esc_button', { label });
  }
}
```

**Layer Hierarchy**:
```
Gameplay (room view)
  ↳ Laptop overlay
      ↳ Email detail
          ↳ Reply compose
      ↳ Calendar event
      ↳ Catdora order screen
  ↳ Zoom meeting scene
      ↳ Mask selection overlay
  ↳ Pause menu
      ↳ Settings
```

**ESC Button Visual** (top-left corner):
```
┌──────────────────┐
│ [ESC] Close email│  ← Context changes based on stack top
└──────────────────┘
```

**Accessibility Win**: Always clear what ESC will do, no hidden navigation traps.

---

### 1.5 Responsive Layout System

**Requirement**: Responsive design for mobile and desktop from the start.

**Pattern: Adaptive UI Scaling with Breakpoints**

```typescript
enum ScreenSize {
  MOBILE_PORTRAIT = 'mobile-portrait',   // < 600px width
  MOBILE_LANDSCAPE = 'mobile-landscape', // < 900px width, landscape
  TABLET = 'tablet',                     // 600-1024px
  DESKTOP = 'desktop'                    // > 1024px
}

class ResponsiveManager {
  private currentSize: ScreenSize;
  private baseWidth = 1920;   // Design reference width
  private baseHeight = 1080;  // Design reference height

  calculateScale(): { x: number; y: number } {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Maintain aspect ratio, fit within viewport
    const scaleX = canvasWidth / this.baseWidth;
    const scaleY = canvasHeight / this.baseHeight;
    const scale = Math.min(scaleX, scaleY);

    return { x: scale, y: scale };
  }

  getScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    if (width < 600) {
      return isPortrait ? ScreenSize.MOBILE_PORTRAIT : ScreenSize.MOBILE_LANDSCAPE;
    } else if (width < 1024) {
      return ScreenSize.TABLET;
    } else {
      return ScreenSize.DESKTOP;
    }
  }
}
```

**Layout Adaptations**:

**Desktop (> 1024px)**:
- Stat bars: vertical stack on right side
- Room view: full width, centered
- Laptop overlay: centered modal (60% viewport)
- Clock: top-right corner

**Tablet (600-1024px)**:
- Stat bars: horizontal strip at top
- Room view: scaled to fit
- Laptop overlay: 80% viewport width
- Clock: top-left (below ESC button)

**Mobile Portrait (< 600px)**:
- Stat bars: collapsible drawer (icon-only mode, expand on tap)
- Room view: full viewport width
- Laptop overlay: full-screen
- Touch-optimized interaction zones (larger hit boxes)
- Clock: mini display, top-right

**Mobile Landscape**:
- Stat bars: compact right sidebar
- Room view: optimized for wide aspect ratio
- Laptop overlay: 90% width

**Accessibility Win**: Usable on all devices, touch targets meet minimum size requirements (44×44px).

---

### 1.6 Audio Accessibility

**Requirement**: Include audio from start, but make it accessible and optional.

**Pattern: Layered Audio Control with Visual Fallbacks**

```typescript
interface AudioSettings {
  masterVolume: number;      // 0-100
  musicVolume: number;       // 0-100
  sfxVolume: number;         // 0-100
  ambientVolume: number;     // 0-100
  enableSubtitles: boolean;  // For dialogue
  enableVisualCues: boolean; // Replace sound with visual indicators
}

class AudioManager {
  private settings: AudioSettings;

  playSound(soundId: string, category: 'sfx' | 'music' | 'ambient'): void {
    const volume = this.calculateVolume(category);

    // Always provide visual fallback if enabled
    if (this.settings.enableVisualCues) {
      this.showVisualCue(soundId);
    }

    if (volume > 0) {
      // Play audio at calculated volume
    }
  }

  private showVisualCue(soundId: string): void {
    // Examples:
    // - Meeting notification: pulsating laptop icon
    // - Energy critical: red border pulse
    // - Message received: chat icon bounce
  }
}
```

**Audio Categories**:
1. **Music**: Background ambient tracks (low-energy, focus-friendly)
2. **SFX**: UI interactions (clicks, confirmations, errors)
3. **Ambient**: Room sounds (keyboard typing, cat purring)
4. **Dialogue**: Character voice lines (optional, with subtitles)

**Accessibility Win**: Deaf/HoH players get visual equivalents, customizable for sensory sensitivity.

---

## 2. Component Structure

### 2.1 Scene Architecture

**Scene Hierarchy** (Phaser 3 scenes):

```typescript
// Core scenes (always loaded)
class BootScene extends Phaser.Scene {
  // Preloads critical assets, initializes managers
  // Transitions to: MenuScene or TutorialScene (first launch)
}

class MenuScene extends Phaser.Scene {
  // Main menu: New Game, Continue, Settings, Credits
  // Transitions to: TutorialScene or RoomScene
}

// Gameplay scenes
class TutorialScene extends Phaser.Scene {
  // Sunday tutorial, sets up game state
  // Transitions to: RoomScene (Monday morning)
}

class RoomScene extends Phaser.Scene {
  // Main gameplay loop, player movement, interactions
  // Launches overlays: LaptopScene, ZoomScene, PauseMenuScene
}

// Overlay scenes (launched on top of RoomScene)
class LaptopScene extends Phaser.Scene {
  // Hub for all laptop functions
  // Sub-scenes: EmailScene, CalendarScene, TasksScene, etc.
}

class ZoomScene extends Phaser.Scene {
  // Meeting "battle" view
  // Mask selection, participant video boxes
}

class PauseMenuScene extends Phaser.Scene {
  // Pause menu, settings, quit
}
```

**Scene Communication**:
```typescript
// Use Phaser's scene communication + EventBus
this.scene.launch('LaptopScene');  // Open laptop overlay
this.scene.pause('RoomScene');     // Pause underlying scene

eventBus.emit('stat_changed', { stat: 'energy', value: 45 });
// LaptopScene and RoomScene both listen and update UI
```

---

### 2.2 UI Component Library

**Reusable UI components** (Phaser GameObjects):

```typescript
// Base button component
class Button extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      label: string;
      icon?: string;
      width: number;
      height: number;
      onClick: () => void;
    }
  ) {
    // Background, label text, icon sprite
    // Hover states (keyboard focus, mouse hover, gamepad selection)
    // Click/tap handling
    // Accessibility: keyboard navigation, screen reader labels
  }
}

// Stat bar component
class StatBar extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: StatBarConfig
  ) {
    // Icon, label, fill bar, pattern overlay, numeric display
    // Threshold color changes, pulsing animation when critical
  }

  updateValue(value: number): void {
    // Animate bar fill, update numeric display
    // Emit events if crossing thresholds
  }
}

// Interaction prompt component
class InteractionPrompt extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      label: string;       // "Prepare food"
      key: string;         // "E"
      icon?: string;       // Optional icon
    }
  ) {
    // Gray button background, key/button icon, label text
    // Adapts to active input device
  }
}

// ESC button component (top-left corner)
class ESCButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    // Position: (10, 10)
    // Updates label based on modal stack
  }

  setLabel(label: string): void {
    // "Menu", "Close laptop", "Back to game", etc.
  }
}

// Clock display component
class ClockDisplay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Format: "14:32" or "2:32 PM" (user preference)
    // Updates every game-minute
  }

  setTime(hour: number, minute: number): void {
    // Update display
  }
}

// Tutorial hint arrow component
class TutorialArrow extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    targetX: number,
    targetY: number,
    config: {
      direction: 'up' | 'down' | 'left' | 'right';
      label: string;       // Key or instruction
      keyIcon?: string;    // "A", "D", "E", etc.
    }
  ) {
    // Pulsating arrow sprite, key icon overlay
    // Tween animation for pulsing effect
  }

  dismiss(): void {
    // Fade out animation, destroy
  }
}

// Laptop window component
class LaptopWindow extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: {
    title: string;
    width: number;
    height: number;
    content: Phaser.GameObjects.GameObject[];
  }) {
    // Title bar, close button, content area
    // Window dragging (desktop only)
  }
}

// Video feed box (for Zoom meetings)
class VideoFeedBox extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      participantName: string;
      sprite: string;
      isPlayer: boolean;
    }
  ) {
    // Border, name label, sprite display
    // Talking indicator (animated border when speaking)
  }

  setTalking(isTalking: boolean): void {
    // Animate border to indicate speaking
  }
}
```

---

### 2.3 Game System Components

**Core Systems** (non-visual, manage game logic):

```typescript
// Stat management
class StatSystem {
  private stats: Map<string, number> = new Map();
  private thresholds: Map<string, StatThresholds> = new Map();
  private modifiers: StatModifier[] = [];

  constructor(config: GameRulesConfig) {
    // Initialize from game_rules.yaml
  }

  getStat(statId: string): number
  setStat(statId: string, value: number): void
  modifyStat(statId: string, delta: number): void
  addModifier(modifier: StatModifier): void
  removeModifier(modifierId: string): void
  tick(deltaTime: number): void  // Apply decay
}

// Time management
class TimeManager {
  private currentTime: { day: number; hour: number; minute: number } = { day: 0, hour: 9, minute: 0 };
  private timeScale: number = 1.0;  // Game speed multiplier
  private isPaused: boolean = false;
  private scheduledEvents: ScheduledEvent[] = [];

  tick(deltaMs: number): void {
    if (this.isPaused) return;

    // Advance time based on timeScale
    // Check scheduled events
    // Emit time events (new_hour, new_day, etc.)
  }

  scheduleEvent(event: ScheduledEvent): void
  pause(): void
  resume(): void
  setTimeScale(scale: number): void  // For fast-forward
}

// Mask system
class MaskSystem {
  private currentMask: Mask | null = null;
  private availableMasks: Map<string, Mask> = new Map();

  constructor(config: GameRulesConfig) {
    // Load masks from game_rules.yaml
  }

  equipMask(maskId: string): void {
    // Change current mask, emit event
  }

  removeMask(): void

  calculateEffectiveness(context: string): number {
    // Returns multiplier based on mask-context match
  }

  applyEnergyCost(duration: number): void {
    // Called periodically while mask is equipped
  }
}

// Work task system
class TaskSystem {
  private activeTasks: Task[] = [];
  private completedTasks: Task[] = [];

  generateDailyTasks(): void {
    // Create 3-5 tasks based on game_rules.yaml
  }

  startTask(taskId: string): void
  completeTask(taskId: string): void
  getTaskProgress(taskId: string): number

  tick(deltaTime: number): void {
    // Progress active tasks, check deadlines
  }
}

// Meeting system
class MeetingSystem {
  private upcomingMeetings: Meeting[] = [];
  private activeMeeting: Meeting | null = null;

  scheduleMeeting(meeting: Meeting): void
  startMeeting(meetingId: string): void {
    // Transition to ZoomScene
  }

  endMeeting(result: MeetingResult): void {
    // Apply stat changes, update work progress
  }
}

// Dialogue system
class DialogueEngine {
  private dialogueTrees: Map<string, DialogueTree> = new Map();
  private currentDialogue: DialogueNode | null = null;

  loadDialogueTree(npcId: string): void

  startDialogue(treeId: string, nodeId: string = 'start'): void

  chooseOption(optionIndex: number): void {
    // Navigate dialogue tree, apply stat effects
  }

  getCurrentNode(): DialogueNode | null
}

// Save/load system
class SaveManager {
  saveGame(slotId: string): void {
    const saveData = {
      version: '0.1.0',
      timestamp: Date.now(),
      gameState: {
        time: timeManager.getCurrentTime(),
        stats: statSystem.getAll(),
        tasks: taskSystem.getActiveTasks(),
        completedTutorial: true,
        // ... all persistent state
      }
    };

    localStorage.setItem(`masking_save_${slotId}`, JSON.stringify(saveData));
  }

  loadGame(slotId: string): GameState | null {
    const json = localStorage.getItem(`masking_save_${slotId}`);
    if (!json) return null;

    const saveData = JSON.parse(json);
    // Validate version, restore state
    return saveData.gameState;
  }

  deleteSave(slotId: string): void
  listSaves(): SaveSlot[]
}
```

---

### 2.4 Script Interpretation Components

**YAML Loading and Parsing**:

```typescript
// Script loader (loads YAML files)
class ScriptLoader {
  private cache: Map<string, any> = new Map();

  async loadScene(sceneId: string): Promise<SceneScript> {
    const yaml = await this.loadYAML(`data/scenes/${sceneId}.yaml`);
    return SchemaValidator.validateScene(yaml);
  }

  async loadNPC(npcId: string): Promise<NPCScript> {
    const yaml = await this.loadYAML(`data/npcs/${npcId}.yaml`);
    return SchemaValidator.validateNPC(yaml);
  }

  async loadGameRules(): Promise<GameRulesConfig> {
    const yaml = await this.loadYAML('data/game_rules.yaml');
    return SchemaValidator.validateGameRules(yaml);
  }

  private async loadYAML(path: string): Promise<any> {
    // Use js-yaml or similar
  }
}

// Scene parser (converts YAML to runtime objects)
class SceneParser {
  parse(sceneScript: SceneScript): ParsedScene {
    return {
      name: sceneScript.name,
      background: sceneScript.background,
      hotspots: sceneScript.hotspots.map(h => this.parseHotspot(h)),
      events: sceneScript.events.map(e => this.parseEvent(e))
    };
  }

  private parseHotspot(hotspot: any): Hotspot {
    // Convert YAML coords to Phaser-compatible format
  }

  private parseEvent(event: any): SceneEvent {
    // Parse event triggers and actions
  }
}

// NPC parser
class NPCParser {
  parse(npcScript: NPCScript): ParsedNPC {
    return {
      id: npcScript.id,
      name: npcScript.name,
      breed: npcScript.breed,
      sprite: npcScript.spritesheet,
      dialogueTrees: npcScript.dialogue_trees.map(t => this.parseDialogueTree(t)),
      interactions: npcScript.interactions
    };
  }

  private parseDialogueTree(tree: any): DialogueTree {
    // Convert YAML dialogue structure to runtime tree
  }
}

// Hotspot interpreter (runtime interaction handling)
class HotspotInterpreter {
  execute(hotspot: Hotspot, player: Player): void {
    switch (hotspot.interaction.type) {
      case 'action':
        this.executeAction(hotspot.interaction.action);
        break;
      case 'scene_transition':
        this.transitionToScene(hotspot.interaction.scene);
        break;
      case 'dialogue':
        this.startDialogue(hotspot.interaction.npc);
        break;
    }
  }

  private executeAction(action: string): void {
    // Map action strings to game functions
    // Examples: 'sleep', 'prepare_food', 'nap'
  }
}

// Event interpreter (trigger-based events)
class EventInterpreter {
  checkTriggers(events: SceneEvent[]): void {
    events.forEach(event => {
      if (this.evaluateTrigger(event.trigger)) {
        this.executeAction(event.action);
      }
    });
  }

  private evaluateTrigger(trigger: EventTrigger): boolean {
    switch (trigger.type) {
      case 'time':
        return this.checkTimeTrigger(trigger);
      case 'stat':
        return this.checkStatTrigger(trigger);
      case 'task':
        return this.checkTaskTrigger(trigger);
      default:
        return false;
    }
  }
}
```

---

## 3. Data Flow Design

### 3.1 Game State Flow

**Central State Container**:

```typescript
interface GameState {
  // Time
  time: {
    day: number;
    hour: number;
    minute: number;
  };

  // Stats
  stats: {
    energy: number;
    stress: number;
    hunger: number;
    happiness: number;
    socialAnxiety: number;
  };

  // Player
  player: {
    position: { x: number; y: number };
    currentScene: string;
    equippedMask: string | null;
  };

  // Work
  work: {
    activeTasks: Task[];
    completedTasks: Task[];
    upcomingMeetings: Meeting[];
  };

  // Progression
  progression: {
    currentDay: number;
    completedTutorial: boolean;
    unlockedMasks: string[];
  };

  // Settings
  settings: {
    audio: AudioSettings;
    accessibility: AccessibilitySettings;
    inputDevice: InputDevice;
  };
}

class StateManager {
  private state: GameState;
  private listeners: Map<string, Function[]> = new Map();

  // Getters
  getState(): GameState
  getStats(): Stats
  getTime(): Time

  // Setters (emit change events)
  setState(newState: Partial<GameState>): void {
    Object.assign(this.state, newState);
    this.emit('state_changed', this.state);
  }

  modifyStat(stat: string, delta: number): void {
    this.state.stats[stat] = Math.max(0, Math.min(100, this.state.stats[stat] + delta));
    this.emit('stat_changed', { stat, value: this.state.stats[stat] });
  }

  // Event emitter pattern
  on(event: string, callback: Function): void
  emit(event: string, data: any): void
}
```

---

### 3.2 Data Flow Diagram

**User Input → Game Logic → State Update → UI Rendering**

```
┌──────────────────────────────────────────────────────────────┐
│                         USER INPUT                           │
│  (Keyboard/Mouse/Gamepad) → InputManager                     │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                    ACTION INTERPRETATION                      │
│  InputManager → Scene Handlers → HotspotInterpreter          │
│  - Movement: Update player position                          │
│  - Interaction: Trigger hotspot action                       │
│  - Menu navigation: Navigate UI                              │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                     GAME LOGIC EXECUTION                      │
│  Systems process actions:                                    │
│  - StatSystem: Calculate stat changes                        │
│  - MaskSystem: Apply mask effects                            │
│  - TaskSystem: Update task progress                          │
│  - TimeManager: Advance time, trigger events                 │
│  - DialogueEngine: Progress conversations                    │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                     STATE MUTATION                           │
│  StateManager receives updates:                              │
│  - stats changed (energy -10, stress +5)                     │
│  - time advanced (14:30 → 14:45)                             │
│  - task completed                                            │
│  → Emit change events                                        │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                      EVENT PROPAGATION                        │
│  EventBus distributes events to subscribers:                 │
│  - 'stat_changed' → StatBar components update visuals        │
│  - 'time_changed' → Clock component updates                  │
│  - 'task_completed' → TaskList UI updates                    │
│  - 'threshold_crossed' → Warning UI appears                  │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│                      UI RENDERING                             │
│  Phaser scenes re-render affected components:                │
│  - StatBar: Animate fill, change color/pattern if threshold  │
│  - Clock: Update time display                                │
│  - Player sprite: Update position                            │
│  - Interaction prompts: Show/hide based on proximity         │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.3 Scene Transition Flow

**Example: Player opens laptop**

```
1. Player presses "E" near laptop hotspot
   ↓
2. InputManager detects input → RoomScene.handleInteraction()
   ↓
3. HotspotInterpreter.execute(laptop_hotspot)
   ↓
4. ModalStackManager.push(LaptopScene)
   ↓
5. RoomScene.pause() (game time pauses)
   ↓
6. LaptopScene.launch() (overlay appears)
   ↓
7. ESCButton.setLabel("Close laptop")
   ↓
8. Player navigates laptop (email, calendar, etc.)
   ↓
9. Player presses ESC
   ↓
10. ModalStackManager.pop()
    ↓
11. LaptopScene.close()
    ↓
12. RoomScene.resume() (game time resumes)
    ↓
13. ESCButton.setLabel("Menu")
```

---

### 3.4 Stat Decay and Event Flow

**Time-based stat changes**

```
Every game loop tick (Phaser update):
  ↓
TimeManager.tick(deltaMs)
  ↓
If 1 game-minute has passed:
  ↓
EventBus.emit('minute_passed', { hour, minute })
  ↓
StatSystem listens to 'minute_passed':
  - Apply hunger decay (-0.083 per minute = -5 per hour)
  - Apply energy decay (-0.033 per minute = -2 per hour when awake)
  - Check if mask is equipped:
    - If yes, apply mask energy cost based on duration
  ↓
StatSystem.modifyStat('hunger', -0.083)
  ↓
StateManager.modifyStat('hunger', -0.083)
  ↓
EventBus.emit('stat_changed', { stat: 'hunger', value: 67.5 })
  ↓
StatBar component (subscribed to 'stat_changed'):
  - Update visual fill bar
  - Check thresholds:
    - If value crossed warning threshold (< 40), start pulsing animation
    - If value crossed critical threshold (< 20), add warning icon
  ↓
UI updates visible to player
```

---

### 3.5 Meeting (Battle) Flow

**Zoom call sequence**

```
1. Calendar shows scheduled meeting at 14:00
   ↓
2. TimeManager reaches 14:00
   ↓
3. EventBus.emit('scheduled_event', { type: 'meeting', id: 'standup_monday' })
   ↓
4. MeetingSystem.startMeeting('standup_monday')
   ↓
5. Load meeting data from YAML or generated
   ↓
6. Transition: RoomScene → ZoomScene
   ↓
7. ZoomScene setup:
   - Create VideoFeedBox for each participant
   - Display player's VideoFeedBox (cat sprite)
   - Show mask selection UI if not already equipped
   ↓
8. Player selects mask (if needed)
   ↓
9. MaskSystem.equipMask('meeting_participant')
   ↓
10. Meeting proceeds (turn-based or time-based):
    - Boss asks question → DialogueEngine.startDialogue()
    - Player chooses response option
    - Stat effects applied based on mask effectiveness
    - Energy drain applied (mask cost + meeting duration)
   ↓
11. Meeting ends (time elapsed or scripted end condition)
   ↓
12. MeetingSystem.endMeeting(result)
    - Apply final stat changes
    - Update work progress if applicable
   ↓
13. Transition: ZoomScene → RoomScene
   ↓
14. Player resumes in room, stats updated
```

---

### 3.6 Save/Load Flow

**Saving the game**

```
Player clicks "Save Game" in pause menu
  ↓
SaveManager.saveGame('slot_1')
  ↓
Collect state from all systems:
  - StateManager.getState()
  - TimeManager.getCurrentTime()
  - StatSystem.getStats()
  - TaskSystem.getActiveTasks()
  - MaskSystem.getEquippedMask()
  - etc.
  ↓
Serialize to JSON:
  {
    version: '0.1.0',
    timestamp: 1706734800000,
    gameState: { ... }
  }
  ↓
localStorage.setItem('masking_save_slot_1', json)
  ↓
UI shows "Game saved" confirmation
```

**Loading the game**

```
Player clicks "Continue" in main menu
  ↓
SaveManager.loadGame('slot_1')
  ↓
Retrieve JSON from localStorage
  ↓
Validate save version (handle migrations if needed)
  ↓
Deserialize state
  ↓
Restore state to all systems:
  - StateManager.setState(gameState)
  - TimeManager.setTime(gameState.time)
  - StatSystem.setStats(gameState.stats)
  - TaskSystem.setActiveTasks(gameState.work.activeTasks)
  - etc.
  ↓
Transition to RoomScene
  ↓
Player resumes exactly where they left off
```

---

### 3.7 YAML to Runtime Flow

**Loading a scene**

```
Game initialization:
  ↓
ScriptLoader.loadScene('home')
  ↓
Fetch 'data/scenes/home.yaml'
  ↓
Parse YAML to JavaScript object
  ↓
SchemaValidator.validateScene(yamlData)
  - Check required fields
  - Validate data types
  - Ensure hotspot coords are valid
  ↓
SceneParser.parse(yamlData)
  - Convert YAML structure to ParsedScene
  - Transform coords to Phaser format
  - Parse interaction types
  ↓
RoomScene receives ParsedScene
  ↓
RoomScene.create():
  - Load background image
  - Create hotspots as interactive zones
  - Attach interaction handlers
  - Subscribe to scene events (time-based, etc.)
  ↓
Scene is ready for gameplay
```

---

## 4. Responsive Breakpoint Specifications

### 4.1 Desktop (> 1024px)

**Layout**:
- Canvas: 1920×1080 (scales to fit viewport)
- Stat bars: Vertical stack, right side (x: 1700, y: 100)
- Clock: Top-right (x: 1700, y: 50)
- ESC button: Top-left (x: 10, y: 10)
- Room view: Centered, full width
- Player sprite: Center-bottom (x: 960, y: 900)

**Interaction**:
- Mouse hover shows cursor changes
- Keyboard navigation fully supported
- Gamepad navigation fully supported

---

### 4.2 Tablet (600-1024px)

**Layout**:
- Canvas: 1280×720 (scales to fit)
- Stat bars: Horizontal strip at top (y: 10)
- Clock: Below stat bars (x: 10, y: 80)
- ESC button: Top-left (x: 10, y: 10)
- Room view: Scaled proportionally
- Player sprite: Center-bottom

**Interaction**:
- Touch and mouse supported
- Tap to interact (replaces "E" prompt with tap icon)
- Pinch-to-zoom disabled (prevents accidental zooming)

---

### 4.3 Mobile Portrait (< 600px)

**Layout**:
- Canvas: 375×667 (iPhone SE reference)
- Stat bars: Collapsible drawer (icon-only mode by default)
  - Tap drawer to expand full stats
  - Icons only: 5 small icons across top (y: 10)
  - Expanded: Full stat bars slide down from top
- Clock: Mini display, top-right (x: 330, y: 10)
- ESC button: Top-left (x: 10, y: 10)
- Room view: Full width, optimized aspect ratio
- Player sprite: Center-bottom
- Interaction prompts: Larger hit boxes (60×60px minimum)

**Interaction**:
- Touch-only (keyboard/gamepad hidden if virtual keyboard not detected)
- Tap to move to location (alternative to WASD)
- Tap objects to interact (no "E" needed)
- Swipe to close overlays (alternative to ESC)

---

### 4.4 Mobile Landscape (< 900px, landscape)

**Layout**:
- Canvas: 667×375 (iPhone SE landscape)
- Stat bars: Compact right sidebar (x: 610, y: 10)
- Clock: Top-right, below stat bars
- ESC button: Top-left (x: 10, y: 10)
- Room view: Wide aspect ratio, more room visible
- Player sprite: Center-bottom

**Interaction**:
- Touch-optimized
- D-pad overlay (optional, toggleable in settings)

---

## 5. Animation Specifications

### 5.1 Low-Frame Animation Philosophy

**Requirement**: 1-3 frames per animation (hand-drawn, Sims parody aesthetic)

**Animation Types**:

1. **Player movement** (2 frames):
   - Frame 1: Standing (neutral pose)
   - Frame 2: Walking (one leg forward)
   - Loop: Alternate frames while moving

2. **Player idle** (3 frames):
   - Frame 1: Standing (neutral)
   - Frame 2: Slight shift (breathing)
   - Frame 3: Return to neutral
   - Loop: Slow cycle (2 seconds per loop)

3. **NPC idle** (1-2 frames):
   - Frame 1: Neutral
   - Frame 2: Blink or slight movement (optional)

4. **Stat bar critical pulse** (2 frames):
   - Frame 1: Normal state
   - Frame 2: Slightly larger, brighter border
   - Loop: Ping-pong, 1 second per cycle

5. **Tutorial arrow pulse** (2 frames):
   - Frame 1: Normal size
   - Frame 2: 10% larger
   - Loop: Ping-pong, 0.8 seconds per cycle

6. **Interaction prompt appear**:
   - Tween: Scale from 0 to 1, 200ms ease-out

7. **Laptop overlay open**:
   - Tween: Fade in from alpha 0 to 1, 300ms
   - Scale: Start at 0.9, scale to 1.0, 300ms ease-out-back

8. **Scene transition**:
   - Fade to black, 500ms
   - Load new scene
   - Fade from black, 500ms

**Animation Budget**:
- Player sprite sheet: 5 frames total (walk, idle cycle)
- Each NPC sprite sheet: 2-3 frames
- UI animations: Tweens (no additional frames needed)

---

### 5.2 Audio Design

**Music Tracks**:
1. **Menu theme**: Calm, welcoming (looping)
2. **Gameplay ambient**: Low-energy, focus-friendly, minimal melody (looping)
3. **Meeting tension**: Subtle tension build, low intensity (looping during Zoom calls)
4. **Day end**: Relaxing, resolution feeling (plays when going to bed)

**Sound Effects**:
1. **UI interactions**:
   - Button click: Soft click
   - Laptop open: Laptop chime
   - Laptop close: Soft close sound
   - Menu navigation: Subtle beep
2. **Gameplay**:
   - Eating: Crunch or chew sound
   - Sleeping: Soft snore or bed creak
   - Stat warning: Gentle alert tone (not alarming)
   - Stat critical: More urgent tone (still not harsh)
3. **Notifications**:
   - Email received: Message ding
   - Meeting starting: Calendar ping
   - Task deadline approaching: Subtle reminder chime

**Ambient Sounds** (very low volume):
- Keyboard typing (during work)
- Cat purring (when happiness high)
- Room ambience (subtle background)

**Audio Accessibility**:
- All sounds have visual equivalents
- Volume controls per category
- Option to disable all audio
- Subtitles for any dialogue

---

## 6. Accessibility Compliance Checklist

### 6.1 WCAG-AA Requirements

**Perceivable**:
- ✓ Color not sole indicator (patterns, icons, text)
- ✓ Contrast ratio 4.5:1 minimum for text
- ✓ Contrast ratio 3:1 minimum for UI components
- ✓ Audio has visual equivalents
- ✓ Text is resizable (UI scales with viewport)

**Operable**:
- ✓ Keyboard accessible (all functions)
- ✓ No time limits (pause supported, no quick-time events)
- ✓ No seizure-inducing flashes
- ✓ Navigable (clear focus indicators, skip links in UI)
- ✓ Multiple input methods (keyboard, mouse, gamepad, touch)

**Understandable**:
- ✓ Readable text (Comic Sans-adjacent, high contrast)
- ✓ Predictable UI (consistent navigation)
- ✓ Input assistance (error messages, hints)

**Robust**:
- ✓ Compatible with assistive technologies (semantic HTML, ARIA labels where applicable)

---

### 6.2 CVD-Specific Compliance

**Protanopia (red-blind)**:
- Stat bars use patterns to distinguish (not red vs green)
- Critical states use icons, not just color

**Deuteranopia (green-blind)**:
- Same as protanopia (most common CVD)

**Tritanopia (blue-blind)**:
- Alternative color palette option
- Patterns ensure differentiation

**Testing**:
- Use Color Oracle to simulate CVD modes
- Grayscale test: All UI elements distinguishable in black-and-white

---

## 7. Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Multi-modal stat representation** | CVD compliance, WCAG-AA adherence |
| **Unified input manager with device detection** | Seamless switching between keyboard/mouse/gamepad |
| **Progressive disclosure tutorial** | Reduces cognitive load, respects player pace |
| **Modal stack management** | Clear navigation, predictable ESC behavior |
| **Responsive design from start** | Future-proof for mobile release, accessibility win |
| **Layered audio control** | Accommodates sensory sensitivities, hearing impairments |
| **Component-based UI library** | Reusability, maintainability, consistency |
| **Event-driven architecture** | Decoupling, testability, scalability |
| **LocalStorage save system** | No backend needed, static hosting compatible |
| **1-3 frame animations** | Aesthetic consistency, reduced asset overhead |

---

## 8. Open Questions for User Review

1. **Color palette**: Should we provide a "Comic Sans" font option, or use a similar but more readable alternative?
2. **Tutorial skippability**: Should tutorial be completely skippable, or require first-time completion?
3. **Save slots**: How many save slots should we support? (Currently proposing 3)
4. **Difficulty settings**: Should we include easy/normal/hard modes affecting stat decay rates?
5. **Gamepad layout**: Prefer Xbox-style (A/B/X/Y) or generic labels in UI?

---

## 9. Next Steps

After approval of this design proposal:

1. **Phase 2.4 Checkpoint**: User reviews and approves design
2. **ADR Writing**: Document key design decisions (CVD compliance, input abstraction, responsive design)
3. **Phase 3: Scaffolding**: Initialize project structure, install dependencies
4. **Phase 4: Implementation Planning**: Create detailed implementation plan for iterative development

---

**Status**: Awaiting user review and approval at Phase 2.4 checkpoint.
