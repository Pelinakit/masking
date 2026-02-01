# Current Story

## User Story
As a Story Forge user, I want UX quality of life improvements in the node editor so that I can work more intuitively and efficiently.

## Acceptance Criteria
- [x] Quick-add menu on empty drop: Dragging from a connector to empty space shows a node type selection menu, creates node, auto-connects
- [x] Input connector highlight: When dragging a connection, highlight valid target inputs when hoverable
- [x] Selected node glow: Show selection state with colored glow matching node's color
- [x] Remove "+ add option" from choice node grid view (not interactable in grid)
- [x] Remove "+ add effect" from effect node grid view (not interactable in grid)
- [x] Pan without modifier key: Drag on empty grid space to pan (no shift required)
- [x] Context-sensitive cursor: Hand on empty grid, arrow on nodes, crosshair on ports
- [x] Connector hover highlight: Highlight connectors on hover (same as during drag)
- [x] Dynamic node width: Nodes expand horizontally to accommodate their content

## Status
- Created: 2026-02-01
- Completed: 2026-02-01
- Phase: done

## Files Modified
- `tools/story-forge/src/node-editor/NodeEditor.ts` - Hit testing, port hover, connection targets, quick-add integration
- `tools/story-forge/src/node-editor/Canvas.ts` - Pan behavior, cursor management, hit test callbacks
- `tools/story-forge/src/node-editor/Node.ts` - Selection glow, port hover highlights
- `tools/story-forge/src/node-editor/nodes/ChoiceNode.ts` - Removed "+ add option" button
- `tools/story-forge/src/node-editor/nodes/EffectNode.ts` - Removed "+ add effect" button
- `tools/story-forge/src/node-editor/QuickAddMenu.ts` - NEW: Context-aware popup menu for quick node creation

## Implementation Summary

### Pan Behavior (Canvas.ts)
- Left-click drag on empty space now pans without needing Shift
- 3px movement threshold before panning starts
- 150ms delay distinguishes clicks from drags
- Middle mouse button still works for panning

### Context-Sensitive Cursors (Canvas.ts + NodeEditor.ts)
- `grab` cursor on empty grid space
- `default` cursor on nodes
- `crosshair` cursor on ports
- `pointer` cursor on connections
- `grabbing` cursor while panning
- `move` cursor while dragging nodes

### Selection Glow (Node.ts)
- 12px shadow blur using node's border color
- Thicker border (3px) when selected
- Each node type has its own glow color

### Port Highlights (Node.ts + NodeEditor.ts)
- Hover highlight: 3px ring at 60% opacity when hovering any port
- Connection drag: All valid target ports highlighted
- Hovered valid target gets extra emphasis

### Quick-Add Menu (QuickAddMenu.ts + NodeEditor.ts)
- Appears when dropping connection on empty space
- Shows all 8 node types with icons
- Keyboard navigation (↑↓ Enter Escape)
- Auto-connects new node to dragged connection
- Click outside or Escape to cancel

### Removed Non-Interactive Buttons
- ChoiceNode: Removed "+ Add Option" from grid view
- EffectNode: Removed "+ Add Effect" from grid view
- Height calculations updated accordingly

### Dynamic Node Width (Node.ts + EffectNode.ts + ChoiceNode.ts + ConditionNode.ts)
- Added static text measurement using offscreen canvas
- Base Node class provides `measureText()` and `calculateRequiredWidth()` helpers
- MIN_WIDTH: 160px, MAX_WIDTH: 400px
- EffectNode: Width based on longest effect text
- ChoiceNode: Width based on longest option text
- ConditionNode: Width based on condition text
- Width auto-updates when content changes (add/remove effects, update options)
