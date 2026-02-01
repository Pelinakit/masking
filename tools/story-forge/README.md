# Story Forge

Comprehensive authoring toolkit for creating game content for Masking without touching code.

## Features

- **Visual Node Editor**: Create dialogue trees using a Twine-like canvas interface
- **Timeline View**: Organize days into weeks with a visual overview
- **Character Database**: Manage NPCs with voice configuration and speech preview
- **Story Arc Tracker**: Track narrative threads across multiple days
- **Asset Manager**: Browse and manage sprites, backgrounds, and sounds
- **Validation Tools**: Real-time error checking and warnings
- **YAML Export**: Generate valid YAML files for the game engine

## Quick Start

```bash
# Install dependencies
cd tools/story-forge
bun install

# Start the server
bun run dev
```

Open http://localhost:3001 in your browser.

## Architecture

- **Server**: Bun HTTP server for file I/O operations
- **UI**: Vanilla TypeScript with Web Components
- **State**: Custom event-driven store with undo/redo
- **Styling**: CSS custom properties for theming

## Development Status

### Phase 1: Foundation ✅ (Completed)
- [x] S1: Project scaffold
- [x] S2: Bun HTTP server with file I/O endpoints
- [x] S3: App shell with routing
- [x] S4: Central state store

### Phase 2: Timeline View (Coming Next)
- [ ] S5: Week/day grid component
- [ ] S6: Day card display
- [ ] S7: Drag-to-reorder days
- [ ] S8: Day CRUD operations

### Phase 3: Character Database
- [ ] S9-S12: Character management and speech integration

### Phase 4-5: Node Editor (Core Feature)
- [ ] S13-S26: Visual canvas, node types, YAML serialization

### Phase 6-8: Advanced Features
- [ ] S27-S39: Story arcs, asset manager, validation

### Phase 9: Polish
- [ ] S40-S44: Keyboard shortcuts, auto-save, documentation

## File Structure

```
tools/story-forge/
├── server.ts              # Bun HTTP server
├── index.html             # Main entry point
├── src/
│   ├── main.ts            # App initialization
│   ├── state/
│   │   └── store.ts       # State management
│   ├── components/
│   │   └── App.ts         # Root component
│   ├── services/
│   │   └── FileService.ts # Server communication
│   └── types/
│       └── index.ts       # TypeScript types
├── styles/
│   └── main.css           # Styling
└── schema/                # JSON schemas (coming soon)
```

## API Endpoints

- `GET /api/files?dir=<path>` - List files in directory
- `GET /api/file?path=<path>` - Read file
- `POST /api/file` - Write file (body: `{path, content}`)
- `DELETE /api/file?path=<path>` - Delete file

## Contributing

See the implementation plan in `.claude/context/implementation-plan.md` for the full roadmap.
