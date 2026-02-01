# Story Forge

A comprehensive authoring toolkit for creating dialogue-driven game content without writing code. Built for the game **Masking** - a Sims-inspired experience about neurodivergent remote work.

## Features

### Visual Node Editor
- Drag-and-drop dialogue tree creation
- Node types: Dialogue, Choice, Condition, Effect, Event
- Real-time canvas rendering with pan/zoom
- Connection management with drag-to-connect
- Undo/redo support

### Timeline Organizer
- Week/day grid for organizing game content
- Drag-and-drop day reordering
- Story arc color indicators
- Stats preview (emails, meetings, energy/stress)
- Add/remove weeks and days

### Character Database
- NPC configuration with portraits
- Web Audio API voice preview (4 voice types: bweh, buh, pip, meh)
- Emotion multipliers (happy, sad, angry, etc.)
- Relationship configuration (default values, min/max ranges)
- Sample characters pre-loaded (Cat, Chihuahua, Pug, Corgi)

### Story Arc Tracker
- Color-coded narrative threads
- Multi-day arc assignment
- Continuity checker with gap detection
- Visual indicators on timeline
- Validation panel

### Asset Manager
- Tree-view browser (sprites, backgrounds, sounds)
- Image preview with pixelated rendering
- Audio playback controls
- Missing asset scanner
- Drag-to-insert asset paths
- Real-time search filtering

### Validation Suite
- YAML schema validation
- Dead-end node detection
- Stat balance analyzer
- Error/warning/info categorization
- Export panel (YAML/ZIP)

## Quick Start

### Prerequisites
- **Bun** runtime (v1.0+)
- Modern web browser

### Installation

```bash
cd tools/story-forge
bun install
```

### Running the Server

```bash
bun run server.ts
```

The server will start at `http://localhost:3001`

### File Structure

```
story-forge/
├── src/
│   ├── components/     # UI components (App, Views)
│   ├── services/       # Core services (FileService, KeyboardShortcuts, etc.)
│   ├── state/          # State management
│   └── types/          # TypeScript definitions
├── styles/
│   └── main.css        # Global styles
├── server.ts           # Bun HTTP server
├── index.html          # Entry point
└── README.md           # This file
```

## Usage Guide

### Creating a New Day

1. Go to **Timeline** view
2. Click **+ Add Day** in a week
3. Enter the day name (e.g., "Monday")
4. Click the day card to open in **Editor**

### Building Dialogue Trees

1. Open a day in **Editor** view
2. Click **+ Dialogue** to add a dialogue node
3. Fill in the text, speaker, and sprite fields
4. Drag from output port to create connections
5. Add **Choice** nodes for player decisions
6. Add **Effect** nodes to modify stats (energy, stress, etc.)

### Canvas Controls

- **Pan**: Middle mouse button or Shift + drag
- **Zoom**: Mouse wheel (zooms to cursor position)
- **Select**: Click on nodes or connections
- **Delete**: Delete or Backspace key
- **Duplicate**: Ctrl/Cmd + D

### Organizing Story Arcs

1. Go to **Story Arcs** view
2. Click **+ New Arc**
3. Set name, description, and color
4. Assign days to the arc
5. Check for continuity issues in the validation panel

### Managing Assets

1. Go to **Assets** view
2. Browse folders (sprites, backgrounds, audio)
3. Click an asset to preview
4. Drag asset onto node fields to insert path
5. Use **Scan for Missing Assets** to find broken references

### Validating Content

1. Go to **Validate** view
2. Review **Overview** for error counts
3. Check **Schema** tab for YAML validation errors
4. Check **Dead Ends** tab for dialogue paths with no exit
5. Check **Balance** tab for stat analysis
6. Use **Export** tab to download YAML files

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save project |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` | Redo last undone action |
| `Ctrl+N` | Create new node (in editor) |
| `Ctrl+C` | Copy selected node |
| `Ctrl+V` | Paste copied node |
| `Ctrl+F` | Focus search |
| `Delete` | Delete selected node |
| `Shift+?` | Show keyboard shortcuts |

## Auto-Save

Story Forge automatically saves your work:
- **Interval**: Every 30 seconds
- **Debounce**: 2 seconds after changes
- **Storage**: Browser localStorage
- **Restore**: Prompts on reload if auto-save found

Auto-save status is shown in the sidebar footer (green dot = saved, yellow dot = unsaved).

## Theme

Toggle between dark and light themes:
- Click the **☀️/🌙** button in the header
- Preference is saved to localStorage
- Respects system theme preference by default

## YAML Format

Story Forge exports YAML files compatible with the game engine.

### Day Scenario Structure

```yaml
metadata:
  title: "Monday Morning"
  day: "week1-monday"

nodes:
  - id: start
    type: dialogue
    data:
      text: "Good morning! Time to start the workday."
      speaker: "Cat"
      sprite: "assets/sprites/characters/player-cat.png"
    outputs:
      - targetNodeId: choice1

  - id: choice1
    type: choice
    data:
      choices:
        - text: "Check email first"
          targetNodeId: email_path
        - text: "Make coffee"
          targetNodeId: coffee_path

startNode: start
```

### Character Configuration

```yaml
id: npc-chihuahua
name: Chihuahua
species: dog
voice:
  type: bweh
  pitchOffset: 5
  speedOffset: 0
defaultEmotion: neutral
relationship:
  defaultValue: 50
  minValue: 0
  maxValue: 100
```

## API Endpoints

The Story Forge server provides:

### GET /api/files
List files in a directory
- Query param: `dir` (directory path)
- Returns: Array of file paths

### GET /api/file
Read a single file
- Query param: `path` (file path)
- Returns: File content, size, modified date

### POST /api/file
Write a file
- Body: `{ path, content }`
- Returns: Success status

### DELETE /api/file
Delete a file
- Query param: `path` (file path)
- Returns: Success status

## Development

### Project Structure

```
src/
├── components/
│   ├── App.ts                  # Root application
│   ├── TimelineView.ts         # Week/day organizer
│   ├── NodeEditorView.ts       # Visual dialogue editor
│   ├── CharacterView.ts        # NPC database
│   ├── ArcView.ts              # Story arc tracker
│   ├── AssetView.ts            # Asset browser
│   └── ValidationView.ts       # Validation suite
├── services/
│   ├── FileService.ts          # Server communication
│   ├── KeyboardShortcuts.ts    # Global keyboard handling
│   ├── AutoSave.ts             # Auto-save system
│   └── ThemeManager.ts         # Theme switching
├── state/
│   └── store.ts                # Centralized state management
└── types/
    └── index.ts                # TypeScript type definitions
```

### Adding a New View

1. Create component in `src/components/MyView.ts`
2. Implement constructor, render(), attachEventListeners(), destroy()
3. Import in `App.ts`
4. Add to `renderDynamicView()` switch statement
5. Add navigation item in sidebar

### Adding a New Keyboard Shortcut

```typescript
import { keyboardShortcuts } from './services/KeyboardShortcuts.js';

keyboardShortcuts.register({
  key: 'e',
  ctrl: true,
  description: 'Export project',
  handler: (e) => {
    e.preventDefault();
    // Your handler code
  },
});
```

## Troubleshooting

### Server won't start
- Ensure Bun is installed: `bun --version`
- Check port 3001 is available
- Try: `lsof -i :3001` to find conflicting processes

### Changes not saving
- Check auto-save indicator in sidebar
- Look for errors in browser console
- Clear localStorage if corrupted: `localStorage.clear()`

### Assets not loading
- Ensure assets are in `/assets/` directory
- Check file paths start with `assets/`
- Use **Scan for Missing Assets** in Asset Manager

### Theme not applying
- Clear browser cache
- Check localStorage for `story-forge-theme` key
- Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

## Development Status

### Completed ✅
- [x] S1-S4: Foundation (server, state, file I/O)
- [x] S5-S8: Timeline View (week/day grid, drag-drop)
- [x] S9-S12: Character Database (voice preview, relationships)
- [x] S13-S20: Node Editor Core (visual canvas, 5 node types)
- [x] S25-S26: YAML Serialization (bidirectional)
- [x] S27-S30: Story Arc Tracker (continuity checker)
- [x] S31-S34: Asset Manager (preview, scanner)
- [x] S35-S39: Validation Suite (schema, dead-ends, balance, export)
- [x] S40-S42: Keyboard shortcuts, auto-save, theme toggle
- [x] S43: Documentation (this README)

### In Progress
- [ ] S44: Sample project with real content

## Contributing

Story Forge is part of the Masking game project. Contributions are welcome!

### Code Style
- TypeScript with strict mode
- ESM modules (`.js` extensions in imports)
- Functional components with classes
- BEM-style CSS naming

### Git Workflow
- Feature branches from `main`
- Conventional commits: `feat(scope): description`
- No generated code in commits

## License

Part of the Masking game project. See main repository for license information.

## Credits

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- Web Audio API - Voice synthesis
- Canvas API - Visual node editor

---

**Story Forge** - Empowering writers to create rich, branching narratives without code.
