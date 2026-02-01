# Story Forge

Comprehensive authoring toolkit for creating game content for Masking without touching code.

## Features

- **Visual Node Editor**: Create dialogue trees using a Twine-like canvas interface
- **YAML Import/Export**: Bidirectional conversion between node graphs and YAML scenarios
- **Timeline View**: Organize days into weeks with a visual overview (coming soon)
- **Character Database**: Manage NPCs with voice configuration and speech preview (coming soon)
- **Story Arc Tracker**: Track narrative threads across multiple days (coming soon)
- **Asset Manager**: Browse and manage sprites, backgrounds, and sounds (coming soon)
- **Validation Tools**: Real-time error checking and warnings (coming soon)

## Quick Start

```bash
# Install dependencies
cd tools/story-forge
bun install

# Start the server
bun run dev
```

Open http://localhost:3001 in your browser.

## Using the Node Editor

### Creating Content

1. Click **Editor** in the sidebar to open the node editor
2. Use toolbar buttons to add nodes:
   - **💬 Dialogue**: Single line of dialogue from a character
   - **⑂ Choice**: Branching player choices
   - **? Condition**: Conditional logic (if/else)
   - **⚡ Effect**: Stat/relationship changes

### Canvas Controls

- **Pan**: Middle mouse button or Shift + drag
- **Zoom**: Mouse wheel (zooms to cursor position)
- **Select**: Click on nodes or connections
- **Multi-select**: Shift + click
- **Delete**: Delete or Backspace key
- **Duplicate**: Ctrl/Cmd + D
- **Select All**: Ctrl/Cmd + A

### Connecting Nodes

1. Click and drag from an **output port** (right side of node)
2. Release on an **input port** (left side of target node)
3. Connections only work from outputs to inputs

### YAML Import/Export

**Export**:
1. Create your dialogue tree with nodes
2. Click **📤 Export** in the toolbar
3. YAML file downloads automatically

**Import**:
1. Click **📥 Import** in the toolbar
2. Select a `.yaml` file from your computer
3. Confirms before replacing current graph

**Sample file**: See `sample-dialogue.yaml` for an example

## YAML Format

The node editor can import/export meeting dialogue events:

```yaml
metadata:
  title: Sample Meeting
  tags:
    - meeting

events:
  - time: 0
    type: dialogue
    speaker: Boss
    text: "Let's get started!"
    emotion: neutral

  - time: 2
    type: question
    speaker: Boss
    text: "Who wants to go first?"
    choices:
      - text: "I'll volunteer"
        mask: presenter
        energyCost: 15
        stressCost: 8
        effects:
          - type: relationship
            target: boss
            operation: "+"
            value: 5
      - text: "I'll wait"
        mask: meeting-participant
        energyCost: 5
        stressCost: 3
```

## Architecture

- **Server**: Bun HTTP server for file I/O operations
- **UI**: Vanilla TypeScript with custom canvas rendering
- **State**: Event-driven store with undo/redo
- **Styling**: CSS custom properties for theming

## Development Status

### Completed ✅
- [x] S1-S4: Foundation (server, app shell, state management)
- [x] S13-S20: Node Editor Core (canvas, 4 node types, connections)
- [x] S25-S26: YAML Serialization (bidirectional conversion)

### Next Steps
- [ ] S5-S8: Timeline view for organizing days
- [ ] S9-S12: Character database with speech-gen integration
- [ ] S27-S39: Story arcs, asset manager, validation
- [ ] S40-S44: Polish and documentation

## File Structure

```
tools/story-forge/
├── server.ts              # Bun HTTP server
├── index.html             # Main entry point
├── sample-dialogue.yaml   # Example YAML file
├── src/
│   ├── main.ts            # App initialization
│   ├── state/
│   │   └── store.ts       # State management
│   ├── components/
│   │   ├── App.ts         # Root component
│   │   └── NodeEditorView.ts  # Editor wrapper
│   ├── node-editor/
│   │   ├── Canvas.ts      # Pan/zoom canvas
│   │   ├── Node.ts        # Base node class
│   │   ├── NodeEditor.ts  # Editor orchestrator
│   │   ├── Connection.ts  # Connection rendering
│   │   └── nodes/         # Node type implementations
│   ├── services/
│   │   ├── FileService.ts # Server communication
│   │   └── YAMLService.ts # YAML conversion
│   └── types/
│       └── index.ts       # TypeScript types
└── styles/
    └── main.css           # Styling
```

## API Endpoints

- `GET /api/files?dir=<path>` - List files in directory
- `GET /api/file?path=<path>` - Read file
- `POST /api/file` - Write file (body: `{path, content}`)
- `DELETE /api/file?path=<path>` - Delete file

## Keyboard Shortcuts

- `Delete` / `Backspace` - Delete selected nodes/connections
- `Ctrl/Cmd + D` - Duplicate selected nodes
- `Ctrl/Cmd + A` - Select all nodes
- `Escape` - Clear selection

## Contributing

See the implementation plan in `.claude/context/implementation-plan.md` for the full roadmap.
