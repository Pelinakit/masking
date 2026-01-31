# Implementation Plan - Masking Game

**Phase 4.1: Implementation Planning**
**Created**: 2026-01-31
**Status**: Draft for approval

## Strategy: Vertical Slice First

Goal: Get one complete playable day loop working end-to-end before expanding features.

**Vertical Slice Definition**:
- Wake up on Monday morning
- Check laptop (simplified email/calendar)
- Join one Zoom meeting with basic mask selection
- Make one decision that affects stats
- Go to bed, see stat changes
- Day advances to Tuesday

This validates:
- Core game loop
- Stat system integration
- Time progression
- YAML script loading
- UI/scene architecture
- Save/load system

---

## Implementation Phases

### PHASE A: Foundation Systems (3-5 days)
**Goal**: Core systems that everything else depends on

#### A1: Stat System (Priority: CRITICAL)
**Dependencies**: None
**Risk**: Medium - stat decay formulas need balancing

**Tasks**:
1. Create `StatSystem.ts` in `src/game/systems/`
   - Define `Stat` interface (current, max, decayRate, recoveryRate)
   - Implement five stats: Energy, Stress, Hunger, Happiness, SocialAnxiety
   - Implement stat modification with bounds checking (0-100)
   - Implement time-based decay/recovery system
   - Add stat history tracking for debugging

2. Create `StatModifier.ts` utility
   - Define modifier types (instant, duration, decay, recovery)
   - Implement modifier application logic
   - Add modifier queue/stacking system

3. Unit tests for stat system
   - Test bounds enforcement
   - Test decay calculations
   - Test modifier application

**Deliverable**: Working stat system with predictable behavior

---

#### A2: Time Manager (Priority: CRITICAL)
**Dependencies**: None
**Risk**: Low - straightforward implementation

**Tasks**:
1. Create `TimeManager.ts` in `src/game/systems/`
   - Implement 24-hour clock (minutes resolution)
   - Day of week tracking (Sunday-Saturday)
   - Configurable time scale (pause, 1x, 5x, etc.)
   - Event scheduling system (callbacks at specific times)
   - Day progression logic (midnight rolls over)

2. Create `TimeEvent.ts` types
   - OneTime events (fire once at specific time)
   - Recurring events (daily, weekly patterns)
   - Conditional events (fire if conditions met)

3. Integration with Phaser update loop
   - Time advances based on delta time
   - Pause/resume functionality
   - Event dispatch system

**Deliverable**: Clock system that can trigger scheduled events

---

#### A3: Game State Manager Enhancement (Priority: CRITICAL)
**Dependencies**: StatSystem, TimeManager
**Risk**: Medium - save/load serialization complexity

**Tasks**:
1. Extend existing `StateManager.ts`
   - Integrate StatSystem instance
   - Integrate TimeManager instance
   - Player state (name, species, current mask, location)
   - Progression state (current day, completed tasks, decisions made)
   - Relationship tracking (NPC affinity values)

2. Implement save/load to localStorage
   - Serialize entire game state to JSON
   - Deserialize and reconstruct state objects
   - Auto-save on key events (end of day, after decisions)
   - Manual save option

3. State persistence tests
   - Save/load round-trip verification
   - Handle corrupted save data gracefully
   - Migration system for future schema changes

**Deliverable**: Unified state manager with working persistence

---

### PHASE B: YAML Scripting Foundation (2-3 days)
**Goal**: Load and interpret YAML data files

#### B1: YAML Parser Enhancement (Priority: HIGH)
**Dependencies**: None
**Risk**: Low - libraries handle parsing

**Tasks**:
1. Enhance `YAMLParser.ts` in `src/scripting/`
   - Install `js-yaml` library
   - Create schema validators for scene/NPC/event formats
   - Implement async file loading
   - Error handling and validation reporting

2. Create YAML type definitions
   - `SceneScript` interface
   - `NPCScript` interface
   - `EventScript` interface
   - `DialogueNode` interface

3. Sample YAML files for testing
   - `data/stories/scenes/home.yaml` (player home)
   - `data/stories/npcs/boss-chihuahua.yaml` (boss character)
   - `data/stories/events/monday-morning.yaml` (wake up event)

**Deliverable**: YAML loading working with type safety

---

#### B2: Script Interpreter (Priority: HIGH)
**Dependencies**: YAMLParser, StatSystem, TimeManager
**Risk**: Medium - complex effect system

**Tasks**:
1. Create `ScriptInterpreter.ts` in `src/scripting/`
   - Parse dialogue trees with branching
   - Execute stat effects from YAML
   - Trigger time events from YAML
   - Handle conditional logic in scripts

2. Create `EffectExecutor.ts`
   - Map YAML effect definitions to StatModifier calls
   - Handle item grants/removals
   - Handle scene transitions
   - Handle relationship changes

3. Test with sample scripts
   - Load home.yaml and verify hotspot data
   - Load boss NPC and verify dialogue trees
   - Execute test event and verify stat changes

**Deliverable**: Scripts can be loaded and executed

---

### PHASE C: Core UI Components (2-3 days)
**Goal**: Reusable UI elements needed across scenes

#### C1: Stat Bars with CVD Support (Priority: HIGH)
**Dependencies**: StatSystem
**Risk**: Low - visual component

**Tasks**:
1. Create `StatBar.ts` in `src/presentation/ui/`
   - Render horizontal bar with fill percentage
   - Color + pattern system for CVD accessibility
   - Label with stat name and numeric value
   - Update method linked to Stat instance
   - Animations for stat changes (smooth transitions)

2. Create `StatBarGroup.ts`
   - Layout manager for all 5 stat bars
   - Responsive positioning
   - Grouped updates

3. Define CVD-friendly patterns
   - Energy: Solid blue
   - Stress: Diagonal stripes red
   - Hunger: Dots orange
   - Happiness: Solid yellow
   - Social Anxiety: Crosshatch purple

**Deliverable**: Stat bars visible and updating in real-time

---

#### C2: Clock UI (Priority: MEDIUM)
**Dependencies**: TimeManager
**Risk**: Low

**Tasks**:
1. Create `ClockDisplay.ts` in `src/presentation/ui/`
   - Display time in HH:MM format
   - Display day of week
   - Optional time scale indicator (paused, 1x, 5x)
   - Position in top-right corner

**Deliverable**: Clock visible and advancing

---

#### C3: ESC Button & Layer Manager (Priority: HIGH)
**Dependencies**: None
**Risk**: Low

**Tasks**:
1. Create `UILayerManager.ts` in `src/presentation/`
   - Stack-based layer system (gameplay → laptop → email, etc.)
   - ESC key handler to pop current layer
   - Update ESC button context text
   - Visual ESC button in top-left

2. Create `ContextButton.ts`
   - Reusable button component with dynamic text
   - Keyboard shortcut display
   - Click and keyboard event handling

**Deliverable**: ESC navigation working across UI layers

---

### PHASE D: Room Scene (3-4 days)
**Goal**: Player's home room with basic interactions

#### D1: Room Scene Setup (Priority: HIGH)
**Dependencies**: YAMLParser, StatSystem, TimeManager, UI Components
**Risk**: Medium - hotspot interaction complexity

**Tasks**:
1. Create `RoomScene.ts` in `src/presentation/scenes/`
   - Load home.yaml script
   - Render background (placeholder rectangle for now)
   - Define hotspot zones from YAML coordinates
   - Player character sprite (placeholder cat sprite)
   - Basic left/right movement with A/D keys

2. Create `Hotspot.ts` component
   - Interactive zone with collision detection
   - Display "E" prompt when player nearby
   - Trigger action callback on E press
   - Visual feedback on hover (mouse) or proximity (keyboard)

3. Implement hotspot actions
   - Bed: Sleep action (ends day, stat recovery)
   - Laptop: Open laptop overlay
   - Kitchen: Prepare food (time cost, stat recovery)
   - Door: Locked during work hours (tutorial shows this)

4. Player movement
   - Simple horizontal movement with A/D
   - Position clamping to room bounds
   - Animation frames (idle, walk - even if 1-2 frames)

**Deliverable**: Room scene with working hotspot interactions

---

#### D2: Room Visual Assets (Priority: LOW)
**Dependencies**: RoomScene
**Risk**: Low - can use placeholders initially

**Tasks**:
1. Create placeholder assets in `assets/backgrounds/`
   - Room background (simple colored rectangles)
   - Bed sprite
   - Desk sprite
   - Kitchen counter sprite
   - Door sprite

2. Create player cat sprite in `assets/sprites/`
   - Idle frame
   - Walk frame (optional: 2 frames)
   - Simple hand-drawn style

**Note**: These can be refined during polish phase

**Deliverable**: Room looks minimally presentable

---

### PHASE E: Laptop Overlay (3-4 days)
**Goal**: Central work hub with email/calendar/Zoom

#### E1: Laptop Shell (Priority: HIGH)
**Dependencies**: UILayerManager
**Risk**: Low

**Tasks**:
1. Create `LaptopScene.ts` (or overlay component)
   - Full-screen laptop UI
   - Grid of app icons (Email, Calendar, Tasks, Zoom, Catdora, Chat, Solitaire)
   - Mouse hover effects on icons
   - Click to launch apps (push new UI layer)
   - ESC to close laptop

2. Create `AppIcon.ts` component
   - Reusable icon with label
   - Interactive states (normal, hover, disabled)

**Deliverable**: Laptop opens and shows app grid

---

#### E2: Email App (Priority: HIGH)
**Dependencies**: LaptopScene, YAMLParser
**Risk**: Medium - needs YAML email format

**Tasks**:
1. Create `EmailApp.ts`
   - Display inbox list (from, subject, time)
   - Load email content from YAML
   - Mark as read functionality
   - Display email body on click
   - Support for linked actions (e.g., "Reply" triggers event)

2. Create email YAML format
   - `data/stories/emails/monday-morning-standup.yaml`
   - From, subject, body, timestamp
   - Optional actions (buttons that trigger effects)

3. Integration with game state
   - Emails arrive at scheduled times (TimeManager)
   - Email state saved (read/unread)

**Deliverable**: Email system functional with sample emails

---

#### E3: Calendar App (Priority: HIGH)
**Dependencies**: LaptopScene, TimeManager
**Risk**: Low

**Tasks**:
1. Create `CalendarApp.ts`
   - Display current week view
   - Show scheduled meetings from YAML
   - Highlight current day/time
   - Click meeting to see details
   - Join button for active meetings (triggers Zoom scene)

2. Create meeting YAML format
   - `data/stories/meetings/monday-standup.yaml`
   - Title, participants, start time, duration
   - Meeting type (determines appropriate masks)

**Deliverable**: Calendar shows meetings, can launch Zoom

---

#### E4: Other Apps (Priority: MEDIUM)
**Dependencies**: LaptopScene
**Risk**: Low - can be simplified for vertical slice

**Tasks**:
1. Tasks app - minimal implementation
   - List of 3-5 tasks from YAML
   - Click to mark complete (stat effects)
   - Simple progress tracking

2. Catdora app - food delivery
   - Menu with 3 food options
   - Order button (costs money, increases hunger, adds stress)
   - Delivery time (scheduled event)

3. Solitaire - placeholder
   - Simple "Play Solitaire" button
   - Time passes, small happiness increase

**Deliverable**: Basic versions of supporting apps

---

### PHASE F: Zoom/Meeting System (4-5 days)
**Goal**: Core masking gameplay mechanic

#### F1: Zoom Scene Setup (Priority: CRITICAL)
**Dependencies**: YAMLParser, StatSystem, TimeManager
**Risk**: High - core gameplay mechanic, needs balancing

**Tasks**:
1. Create `ZoomScene.ts` in `src/presentation/scenes/`
   - Load meeting data from YAML
   - Display video grid (player + NPCs)
   - Show current mask selection
   - Display active stat bars during meeting
   - Time progression during meeting

2. Create `VideoFeed.ts` component
   - Rectangle representing video feed
   - Character sprite/portrait
   - Name label
   - Speaking indicator (when NPC talks)

3. Create `MaskSelector.ts` UI
   - Display 5 mask options
   - Highlight current mask
   - Show energy cost preview
   - Change mask mid-meeting

**Deliverable**: Zoom scene displays meeting participants

---

#### F2: Mask System (Priority: CRITICAL)
**Dependencies**: ZoomScene, StatSystem
**Risk**: High - complex energy cost calculations

**Tasks**:
1. Create `MaskSystem.ts` in `src/game/systems/`
   - Define 5 mask types with base energy costs
   - Context-based cost modifiers (right mask = lower cost)
   - Duration-based energy drain (cumulative time in meeting)
   - Stress accumulation from wrong mask
   - "No mask" option (consequences but zero energy cost)

2. Create `MaskType.ts` enum and data
   - Meeting Participant (Low cost, general meetings)
   - Presenter (High cost, presenting/leading)
   - Casual Colleague (Medium cost, informal chats)
   - Careful Subordinate (Medium-high cost, boss interactions)
   - Professional Client-Facer (Very high cost, client meetings)

3. Mask effectiveness calculation
   - Match mask to meeting type for optimal cost
   - Wrong mask = 1.5-2x energy cost
   - No mask = relationship penalties, potential job consequences

**Deliverable**: Mask system affecting energy during meetings

---

#### F3: Meeting Events (Priority: HIGH)
**Dependencies**: ZoomScene, MaskSystem, ScriptInterpreter
**Risk**: Medium - event timing and choices

**Tasks**:
1. Create `MeetingEvent.ts` system
   - Load event sequence from YAML
   - Trigger events at specific meeting timestamps
   - Present choices to player (dialogue options)
   - Apply consequences based on current mask + choice

2. Meeting event YAML format
   - `data/stories/meetings/events/boss-question.yaml`
   - Timestamp in meeting (e.g., 5 minutes in)
   - NPC speaker
   - Dialogue text
   - Choice options (with mask-dependent outcomes)
   - Stat effects for each outcome

3. Example events for vertical slice
   - Boss asks direct question (requires response)
   - Coworker makes small talk (optional engagement)
   - Presentation moment (high stress spike)

**Deliverable**: Meeting events trigger and affect stats

---

### PHASE G: Tutorial System (2-3 days)
**Goal**: Skippable onboarding flow

#### G1: Tutorial Manager (Priority: MEDIUM)
**Dependencies**: RoomScene, UI Components
**Risk**: Low

**Tasks**:
1. Create `TutorialManager.ts` in `src/game/systems/`
   - Track tutorial progress in game state
   - Skip option (save flag, jump to Monday)
   - Progressive disclosure system
   - Pulsating arrow indicator component

2. Create `TutorialArrow.ts` component
   - Pulsating animation
   - Key label (A, D, E, ESC)
   - Position relative to target object
   - Auto-hide after action completed

3. Tutorial sequence for Sunday
   - Movement (A/D arrows)
   - Kitchen interaction (E at counter)
   - Laptop interaction (E at desk)
   - Email check (guided flow)
   - Sleep to end tutorial

**Deliverable**: Tutorial guides new players through basics

---

### PHASE H: Input Manager (2 days)
**Goal**: Unified keyboard/mouse/gamepad input

#### H1: Input System (Priority: MEDIUM)
**Dependencies**: None
**Risk**: Low

**Tasks**:
1. Create `InputManager.ts` in `src/game/systems/`
   - Abstract input layer over Phaser input
   - Keyboard mapping (WASD, Arrow keys, E, ESC)
   - Mouse input handling
   - Gamepad detection and mapping (future)
   - Last-used input type tracking

2. Input context system
   - Different contexts (room, laptop, zoom, menu)
   - Context-specific action mappings
   - Visual prompt updates based on active input method

3. Accessibility features
   - Key rebinding support (future)
   - On-screen button prompts

**Deliverable**: Input works consistently across scenes

---

### PHASE I: Audio System (2 days)
**Goal**: Background music and SFX

#### I1: Audio Manager (Priority: LOW)
**Dependencies**: None
**Risk**: Low - can use placeholders

**Tasks**:
1. Create `AudioManager.ts` in `src/game/systems/`
   - Background music player (looping)
   - SFX playback
   - Volume controls
   - Mute option
   - Save audio preferences

2. Implement audio for key moments
   - Room ambience (subtle background)
   - UI click sounds
   - Zoom meeting join/leave sounds
   - Stat change feedback (optional)

3. Audio assets
   - Use placeholder/royalty-free sounds initially
   - Can refine during polish

**Deliverable**: Audio enhances game feel

---

### PHASE J: Vertical Slice Integration (3-4 days)
**Goal**: Connect all systems into one playable day loop

#### J1: Monday Morning Scenario (Priority: CRITICAL)
**Dependencies**: All previous phases
**Risk**: High - integration challenges

**Tasks**:
1. Create complete Monday YAML scripts
   - `data/stories/scenes/home-monday.yaml`
   - `data/stories/emails/monday-emails.yaml`
   - `data/stories/meetings/standup-monday.yaml`
   - `data/stories/events/monday-sequence.yaml`

2. Implement day flow
   - Wake up at 09:00 (Sunday tutorial or Monday start)
   - Check email (boss reminder about standup)
   - Check calendar (standup at 10:00)
   - Join standup meeting
   - Navigate meeting with mask selection
   - Respond to one event/question
   - End meeting, return to room
   - Lunch break (kitchen or Catdora)
   - Option to work on task or rest
   - End day (sleep at bed)

3. Stat tracking and feedback
   - Stats decay throughout day
   - Display stat changes clearly
   - End-of-day summary screen

4. Save system integration
   - Auto-save at end of day
   - Manual save option from menu
   - Load game returns to last save point

**Deliverable**: Complete playable Monday loop

---

#### J2: Testing and Balancing (Priority: HIGH)
**Dependencies**: Vertical slice complete
**Risk**: Medium - balance is subjective

**Tasks**:
1. Playtesting sessions
   - Can player complete one day without running out of energy?
   - Are stat costs clear and predictable?
   - Is mask selection meaningful?
   - Are consequences of decisions understandable?

2. Balance adjustments
   - Tune stat decay rates
   - Adjust mask energy costs
   - Calibrate recovery rates (food, sleep, rest)
   - Ensure player has meaningful choices

3. Bug fixing
   - Identify and fix integration issues
   - Save/load edge cases
   - UI/UX problems

**Deliverable**: Stable, balanced vertical slice

---

## Phase J Completion Checklist

**Vertical Slice Acceptance Criteria**:
- [ ] Player can wake up on Monday morning
- [ ] Stats are visible and updating
- [ ] Clock advances in real-time (with pause option)
- [ ] Can open laptop and check email
- [ ] Can view calendar and see scheduled meeting
- [ ] Can join Zoom meeting from calendar
- [ ] Can select different masks in meeting
- [ ] Energy drains based on mask choice
- [ ] At least one meeting event triggers
- [ ] Player choice affects stats
- [ ] Can leave meeting and return to room
- [ ] Can prepare food or order Catdora
- [ ] Can go to bed to end day
- [ ] Stats recover overnight
- [ ] Game advances to Tuesday
- [ ] Can save and load game state
- [ ] Tutorial is playable and skippable

---

## Post-Vertical Slice: Expansion Phases (Future)

### PHASE K: Content Expansion
- Additional days (Tuesday-Friday)
- More meetings with different types/NPCs
- Expanded dialogue trees
- More decision points
- Romance subplot with coworker
- Boss relationship progression

### PHASE L: Feature Expansion
- Task completion system (work deliverables)
- Sick day mechanic
- Chat app (DM with coworkers)
- Solitaire mini-game implementation
- Hidden mini-game easter egg
- Consequences for missing deadlines

### PHASE M: Polish
- Final art assets (replace placeholders)
- Sound design and music
- Animations (smooth transitions)
- Particle effects (stress indicators, etc.)
- CVD mode toggle
- Accessibility audit

### PHASE N: Testing & Optimization
- Performance optimization
- Cross-browser testing
- Mobile responsiveness testing
- Accessibility testing with real users
- Balance final tuning

---

## Risk Assessment

### High Risk Items:
1. **Mask system balancing** - Core mechanic, needs extensive playtesting
2. **YAML script complexity** - Could become unwieldy, need good tooling
3. **Vertical slice integration** - Many dependencies, potential for bugs

### Medium Risk Items:
1. **Save/load system** - Serialization edge cases
2. **Stat decay formulas** - Need to feel fair and predictable
3. **Meeting event timing** - Complex state machine

### Low Risk Items:
1. **UI components** - Well-understood patterns
2. **Time manager** - Straightforward implementation
3. **Audio system** - Can use placeholders, non-critical

### Mitigation Strategies:
- Start with simplest implementations, add complexity incrementally
- Build comprehensive test suite for core systems
- Frequent playtesting throughout development
- Maintain clear separation of layers (easy to swap implementations)
- Use feature flags to disable incomplete features

---

## Success Metrics for Phase 4

**Code Quality**:
- TypeScript strict mode, zero errors
- All core systems have unit tests
- Consistent architecture across layers
- Well-documented public APIs

**Gameplay Quality**:
- Vertical slice completable in 10-15 minutes
- Player understands mask mechanic after first meeting
- Stats feel meaningful and impactful
- Decisions have clear consequences

**Technical Quality**:
- 60 FPS on mid-range hardware
- < 3 second load time
- Responsive on mobile (iPhone 12+, Pixel 5+)
- Save/load works reliably

---

## Development Timeline Estimate

**Total: 25-35 days** (assuming 1 developer)

- Phase A: 3-5 days (Foundation)
- Phase B: 2-3 days (YAML)
- Phase C: 2-3 days (UI Components)
- Phase D: 3-4 days (Room Scene)
- Phase E: 3-4 days (Laptop)
- Phase F: 4-5 days (Zoom/Masks)
- Phase G: 2-3 days (Tutorial)
- Phase H: 2 days (Input)
- Phase I: 2 days (Audio)
- Phase J: 3-4 days (Integration + Testing)

**Buffer**: Add 25-30% for unexpected challenges = ~32-45 days total

---

## Next Steps

1. **Review this plan** with stakeholder (user)
2. **Approve architecture** decisions
3. **Begin Phase A** (Foundation Systems)
4. **Set up CI/CD** (optional but recommended)
5. **Create asset pipeline** (tools for YAML validation, sprite processing)

---

## Questions for Stakeholder

1. Is the vertical slice scope appropriate? Too ambitious or too limited?
2. Any specific mask mechanics you envision that aren't captured here?
3. Priority on mobile vs. desktop experience?
4. Target completion date for vertical slice?
5. Will there be a game designer to help with balance, or should we plan for extensive playtesting iterations?
