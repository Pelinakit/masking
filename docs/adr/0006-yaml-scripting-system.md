# ADR 0006: YAML Scripting System and Story Forge Toolkit

**Date**: 2026-02-01
**Status**: Accepted
**Decision**: Implement comprehensive YAML-driven content authoring with visual toolkit

## Context

The game requires narrative content (emails, meetings, tasks, events) that can be authored by writers without code changes. We need:

1. A flexible scripting format for day-by-day content
2. A visual authoring tool for non-technical writers
3. Systems to execute YAML-defined content at runtime
4. Cumulative state tracking across multiple days

## Decision

We will implement a two-part solution:

### Part A: Game Engine (YAML Execution)

**Scenario System**:
- Single YAML file defines complete in-game day
- Type-safe interfaces (`ScenarioTypes.ts`)
- `ScenarioLoader` with caching and validation
- State tracking for emails, meetings, tasks, events

**Time Management**:
- Hybrid time flow: realtime during free periods, action-based during tasks
- Three modes: `realtime`, `action-based`, `paused`
- `TimeManagerEnhanced` replaces original `TimeManager`

**Game Systems**:
- `EmailManager`: Priority filtering, read/unread tracking, response management
- `TaskManager`: Progress tracking, deadline monitoring, energy costs
- `EventScheduler`: Weighted random events with conditional filtering
- `RelationshipManager`: Cumulative NPC relationship tracking with history

### Part B: Story Forge Toolkit

**Architecture**:
- Bun HTTP server (port 3001) for file I/O
- Vanilla TypeScript UI with Web Components
- Custom canvas-based node editor
- Integration with existing speech-gen tool

**Features** (Planned):
- Visual node editor for dialogue trees (Twine-style)
- Week/day timeline view
- Character database with voice configuration
- Story arc tracker across multiple days
- Asset manager with preview
- Real-time YAML validation
- Bidirectional YAML ↔ node graph serialization

## Consequences

### Positive

- **Writer-friendly**: Non-programmers can author content using visual tools
- **Type-safe**: TypeScript interfaces prevent structural errors
- **Flexible**: Supports linear-with-flavor branching, conditions, effects
- **Modular**: New days/characters/events added without code changes
- **Cumulative state**: Relationships persist across days realistically
- **Dev-friendly**: YAML is human-readable and version-control friendly
- **Extensible**: Node editor can be expanded with new node types

### Negative

- **Dual maintenance**: Both YAML schema and UI must stay in sync
- **Learning curve**: Writers need to learn node editor concepts
- **Validation complexity**: Errors must be caught and reported clearly
- **Performance risk**: Large dialogue graphs may lag (mitigated by virtual rendering)
- **Testing burden**: Both engine execution and toolkit require testing

### Neutral

- **File format**: YAML chosen over JSON for readability
- **Server dependency**: Writers must run local Bun server
- **No cloud sync**: Files stored locally only (can add later)

## Technical Details

### YAML Structure Example

```yaml
metadata:
  day: Monday
  week: 1

emails:
  - id: email-001
    from: "Boss"
    subject: "Meeting at 10am"
    time: "08:30"
    priority: high
    body: "..."

meetings:
  - id: meeting-001
    title: "Team Standup"
    time: "10:00"
    duration: 30
    participants: [...]
    events:
      - time: 2
        type: question
        speaker: "Boss"
        choices: [...]

tasks:
  - id: task-001
    text: "Finish report"
    priority: high
    energyCost: 30
    timeRequired: 120
    deadline: "17:00"

events:
  - id: event-001
    time: "13:00"
    type: choice
    title: "Lunch Break"
    choices: [...]
```

### System Integration

```
ScenarioLoader (loads YAML)
    ↓
EmailManager (receives emails at scheduled times)
TaskManager (tracks task progress)
EventScheduler (triggers events)
RelationshipManager (tracks NPC relationships)
    ↓
TimeManagerEnhanced (coordinates timing)
    ↓
Game Scenes (present content to player)
```

### State Persistence

All managers implement `exportState()` and `importState()` for save/load:

```typescript
{
  scenario: scenarioLoader.exportState(),
  emails: emailManager.exportState(),
  tasks: taskManager.exportState(),
  events: eventScheduler.exportState(),
  relationships: relationshipManager.exportState(),
  time: timeManager.exportState()
}
```

## Alternatives Considered

### 1. Hardcoded Content
- ❌ Requires programmer for all content changes
- ❌ Difficult to iterate on narrative
- ✅ Simpler architecture

### 2. JSON Instead of YAML
- ❌ Less human-readable
- ❌ Requires quotes everywhere
- ✅ Native JavaScript support
- ✅ Smaller file size

### 3. Twine Export Integration
- ❌ Twine format not suitable for day structure
- ❌ Would need complex converter
- ✅ Writers already know Twine
- ✅ Existing tools

### 4. Database-Driven Content
- ❌ Requires backend server
- ❌ Not version-controllable
- ❌ Overkill for single-player game
- ✅ Multi-user editing
- ✅ Better search/filtering

## Implementation Status

### Completed (2026-02-01)

**Track A - Engine**:
- ✅ E1: Scenario type definitions
- ✅ E2: ScenarioLoader with caching
- ✅ E3: TimeManagerEnhanced with hybrid flow
- ✅ E4: RelationshipManager
- ✅ E5: EventScheduler
- ✅ E6: EmailManager
- ✅ E8: TaskManager

**Track B - Story Forge**:
- ✅ S1-S2: Project scaffold + Bun server
- ✅ S3: App shell with routing
- ✅ S4: State store with undo/redo

### Remaining

**Track A - Engine**:
- E7: Meeting YAML integration
- E10-E13: Day flow and persistence

**Track B - Story Forge**:
- S5-S8: Timeline view
- S9-S12: Character database
- S13-S26: Node editor (core feature)
- S27-S39: Arcs, assets, validation
- S40-S44: Polish

## References

- Implementation plan: `.claude/context/implementation-plan.md`
- Current story: `.claude/context/current-story.md`
- Example scenario: `public/data/stories/scenarios/monday-full-day.yaml`
- Speech-gen tool: `tools/speech-gen/`
- Story Forge: `tools/story-forge/`

## Notes

This ADR documents the foundational architecture. Additional ADRs may be written for:
- Node editor implementation details
- YAML serialization rules
- Validation strategy
- Speech-gen integration approach
