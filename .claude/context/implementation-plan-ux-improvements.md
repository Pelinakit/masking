# Implementation Plan: Story Forge Node Editor UX Improvements

## Overview
Quality-of-life improvements to the Story Forge node editor to enhance usability and reduce friction. Focus on making common operations faster and more intuitive through better interaction patterns, visual feedback, and context-aware features.

## Prerequisites
- [ ] Story Forge node editor core functionality working (S13-S20 from main plan)
- [ ] Canvas pan/zoom operational
- [ ] Node dragging and selection functional
- [ ] Connection drawing implemented

---

## Task Breakdown

### Phase UX1: Pan Behavior Enhancement

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX1.1 | Add pan state tracking to Canvas | S | - | No |
| UX1.2 | Implement 3px threshold for pan detection | S | UX1.1 | No |
| UX1.3 | Add 150ms delay timer for click-to-deselect | S | UX1.1 | No |
| UX1.4 | Refactor handleMouseDown to detect empty space | M | UX1.3 | No |
| UX1.5 | Update NodeEditor to allow canvas pan on empty clicks | S | UX1.4 | No |

**Implementation Details:**

**UX1.1**: Add to Canvas class:
```typescript
private isPanning = false;
private panStartPos: Point | null = null;
private panStartTime: number = 0;
private readonly PAN_THRESHOLD = 3; // pixels
private readonly CLICK_DELAY = 150; // milliseconds
```

**UX1.2-UX1.3**: Modify `handleMouseDown`:
```typescript
private handleMouseDown(e: MouseEvent): void {
  if (e.button === 0) {
    // Left click - potential pan or click
    this.panStartPos = { x: e.clientX, y: e.clientY };
    this.panStartTime = Date.now();
    this.lastMousePos = { x: e.clientX, y: e.clientY };

    // Check if clicking on node/port first (via callback)
    const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
    const hitTarget = this.hitTestCallback?.(worldPos);

    if (!hitTarget) {
      // Empty space - prepare to pan
      this.isPanning = false; // Will become true after threshold
    } else {
      // Hit something - let NodeEditor handle it
      this.clickCallback?.(worldPos);
      this.panStartPos = null;
    }
  }
  // ... middle mouse handling unchanged
}
```

**UX1.4**: Modify `handleMouseMove`:
```typescript
private handleMouseMove(e: MouseEvent): void {
  if (this.panStartPos && !this.isPanning) {
    const dx = e.clientX - this.panStartPos.x;
    const dy = e.clientY - this.panStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.PAN_THRESHOLD) {
      this.isPanning = true;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  if (this.isPanning) {
    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.transform.x += dx;
    this.transform.y += dy;

    this.lastMousePos = { x: e.clientX, y: e.clientY };
    this.render();
  }
}
```

**UX1.5**: Modify `handleMouseUp`:
```typescript
private handleMouseUp(): void {
  if (this.panStartPos) {
    const elapsed = Date.now() - this.panStartTime;

    if (!this.isPanning && elapsed < this.CLICK_DELAY) {
      // Was a click, not a pan - notify NodeEditor to clear selection
      this.emptyClickCallback?.();
    }

    this.isPanning = false;
    this.panStartPos = null;
    this.canvas.style.cursor = 'grab';
  }
}
```

**Test Scenarios:**
- Click and drag immediately → pans after 3px movement
- Click and hold < 150ms, then release → clears selection
- Click on node → selects node, doesn't pan
- Click and drag node → drags node, doesn't pan canvas

---

### Phase UX2: Context-Sensitive Cursors

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX2.1 | Add cursor state management to Canvas | S | - | Yes (with UX1) |
| UX2.2 | Implement hover detection for nodes/ports | M | UX2.1 | No |
| UX2.3 | Add cursor update on mousemove | S | UX2.2 | No |
| UX2.4 | Handle cursor changes during drag operations | S | UX2.3, UX1.5 | No |

**Implementation Details:**

**UX2.1**: Add to Canvas class:
```typescript
private currentCursor: 'grab' | 'grabbing' | 'default' | 'crosshair' | 'pointer' = 'grab';

private setCursor(cursor: typeof this.currentCursor): void {
  if (this.currentCursor !== cursor) {
    this.currentCursor = cursor;
    this.canvas.style.cursor = cursor;
  }
}
```

**UX2.2**: Add hover callback to Canvas:
```typescript
// In Canvas class
private hoverCallback?: (worldPos: Point) => 'empty' | 'node' | 'port' | 'connection' | null;

onHover(callback: (worldPos: Point) => 'empty' | 'node' | 'port' | 'connection' | null): void {
  this.hoverCallback = callback;
}
```

**UX2.3**: Update `handleMouseMove`:
```typescript
private handleMouseMove(e: MouseEvent): void {
  const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });

  // Update cursor based on what's under mouse
  if (!this.isPanning && !this.draggingNode && !this.connectingFromPort) {
    const target = this.hoverCallback?.(worldPos);

    switch (target) {
      case 'port':
        this.setCursor('crosshair');
        break;
      case 'node':
      case 'connection':
        this.setCursor('default');
        break;
      case 'empty':
      default:
        this.setCursor('grab');
        break;
    }
  }

  // ... rest of existing logic
}
```

**UX2.4**: Implement in NodeEditor:
```typescript
// In setupEventListeners
this.canvas.onHover((worldPos) => {
  // Check ports first (highest priority)
  for (const node of this.nodes.values()) {
    if (node.getPortAtPoint(worldPos.x, worldPos.y)) {
      return 'port';
    }
  }

  // Check nodes
  for (const node of this.nodes.values()) {
    if (node.containsPoint(worldPos.x, worldPos.y)) {
      return 'node';
    }
  }

  // Check connections
  for (const connection of this.connections.values()) {
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    if (sourceNode && targetNode && connection.isNearPoint(worldPos.x, worldPos.y, sourceNode, targetNode)) {
      return 'connection';
    }
  }

  return 'empty';
});
```

**Test Scenarios:**
- Hover over empty space → grab cursor
- Hover over node → default cursor
- Hover over port → crosshair cursor
- Hover over connection → pointer cursor
- While dragging node → cursor doesn't change
- While panning → grabbing cursor

---

### Phase UX3: Selection Glow

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX3.1 | Add glow rendering to Node.draw() | M | - | Yes (with UX1/UX2) |
| UX3.2 | Extract borderColor to instance property | S | UX3.1 | No |
| UX3.3 | Test glow with different node types | S | UX3.2 | No |

**Implementation Details:**

**UX3.1**: Modify Node.draw() method:
```typescript
draw(ctx: CanvasRenderingContext2D): void {
  // Draw glow for selected nodes
  if (this.selected) {
    ctx.save();
    ctx.shadowColor = this.style.borderColor; // Use node's border color
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw invisible rect to create glow
    ctx.fillStyle = 'transparent';
    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.style.width,
      this.style.height,
      this.style.borderRadius
    );
    ctx.fill();

    ctx.restore();
  }

  // Draw shadow (existing code)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // ... rest of existing draw code
}
```

**UX3.2**: Ensure each node type sets borderColor in constructor:
- DialogueNode: `#8b5cf6` (purple)
- ChoiceNode: `#0ea5e9` (blue) - already set
- ConditionNode: `#f59e0b` (amber)
- EffectNode: `#10b981` (green)
- EmailNode: `#ef4444` (red)
- MeetingNode: `#8b5cf6` (purple)
- TaskNode: `#f59e0b` (amber)
- MessageNode: `#06b6d4` (cyan)

**Test Scenarios:**
- Select single node → node glows with matching color
- Select multiple nodes → all glow
- Deselect → glow disappears
- Different node types → different glow colors

---

### Phase UX4: Connector Hover Highlights

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX4.1 | Add hover state to Node for ports | M | - | Yes (with UX3) |
| UX4.2 | Implement port highlight rendering | M | UX4.1 | No |
| UX4.3 | Add hover tracking to NodeEditor | M | UX4.2 | No |
| UX4.4 | Add pulsing animation for hover highlight | M | UX4.3 | No |
| UX4.5 | Highlight valid drop targets during connection drag | M | UX4.4 | No |

**Implementation Details:**

**UX4.1**: Add to Node class:
```typescript
private hoveredPortId: string | null = null;

setHoveredPort(portId: string | null): void {
  this.hoveredPortId = portId;
}
```

**UX4.2**: Modify Node.drawPorts():
```typescript
private drawPorts(ctx: CanvasRenderingContext2D): void {
  const portRadius = 6;
  const hoverRingRadius = portRadius + 3;

  // Helper to draw port with optional hover
  const drawPort = (port: NodePort, portPos: { x: number; y: number }) => {
    // Draw hover ring if hovered
    if (this.hoveredPortId === port.id) {
      ctx.save();
      ctx.strokeStyle = '#4a9eff';
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(portPos.x, portPos.y, hoverRingRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw port (existing code)
    ctx.fillStyle = port.type === 'flow' ? '#4a9eff' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(portPos.x, portPos.y, portRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Draw inputs
  this.inputs.forEach((port) => {
    const portPos = this.getPortPosition(port.id);
    if (portPos) drawPort(port, portPos);
  });

  // Draw outputs
  this.outputs.forEach((port) => {
    const portPos = this.getPortPosition(port.id);
    if (portPos) drawPort(port, portPos);
  });
}
```

**UX4.3**: Add to NodeEditor.setupEventListeners():
```typescript
canvasElement.addEventListener('mousemove', (e) => {
  const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

  // Clear all hover states
  this.nodes.forEach(node => node.setHoveredPort(null));

  // Check if hovering over a port
  for (const node of this.nodes.values()) {
    const port = node.getPortAtPoint(worldPos.x, worldPos.y);
    if (port) {
      node.setHoveredPort(port.id);
      this.canvas.render();
      break;
    }
  }

  // ... existing drag logic
});
```

**UX4.4**: Add pulsing animation (optional enhancement):
```typescript
// In Canvas class
private animationFrameId: number | null = null;
private lastAnimationTime = 0;

private animate = (timestamp: number): void => {
  const delta = timestamp - this.lastAnimationTime;

  if (delta > 16) { // ~60fps
    this.lastAnimationTime = timestamp;
    this.render();
  }

  this.animationFrameId = requestAnimationFrame(this.animate);
};

startAnimation(): void {
  if (!this.animationFrameId) {
    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}

stopAnimation(): void {
  if (this.animationFrameId) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
}

// Modify drawPorts to use time-based alpha
// In Node.drawPorts, pass timestamp for pulsing
if (this.hoveredPortId === port.id) {
  const pulseAlpha = 0.4 + Math.sin(Date.now() / 200) * 0.2; // Oscillates 0.2-0.6
  ctx.globalAlpha = pulseAlpha;
  // ... rest of hover ring code
}
```

**UX4.5**: Highlight valid targets during connection drag:
```typescript
// In NodeEditor.render()
// After drawing connections, before drawing nodes
if (this.connectingFromPort) {
  // Highlight valid drop targets
  for (const node of this.nodes.values()) {
    for (const port of [...node.inputs, ...node.outputs]) {
      const canConnect = this.canConnect(
        this.connectingFromPort,
        { nodeId: node.id, portId: port.id, port }
      );

      if (canConnect) {
        node.setHoveredPort(port.id);
      }
    }
  }
}
```

**Test Scenarios:**
- Hover over port when idle → port highlights with pulsing ring
- Move mouse away → highlight disappears
- Start dragging connection → valid target ports highlight
- Drag over valid port → highlight intensifies
- Release on valid port → connection created

---

### Phase UX5: Quick-Add Menu

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX5.1 | Create QuickAddMenu component class | L | - | No |
| UX5.2 | Add context filtering logic | M | UX5.1 | No |
| UX5.3 | Implement keyboard navigation | M | UX5.2 | No |
| UX5.4 | Integrate menu into NodeEditor connection drop | M | UX5.3 | No |
| UX5.5 | Add CSS styling for menu | S | UX5.1 | Yes (with UX5.2) |

**Implementation Details:**

**UX5.1**: Create new file `QuickAddMenu.ts`:
```typescript
export interface QuickAddMenuItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'dialogue' | 'flow' | 'event' | 'data';
  isValidTarget?: boolean; // For connection context
}

export class QuickAddMenu {
  private container: HTMLDivElement;
  private items: QuickAddMenuItem[] = [];
  private filteredItems: QuickAddMenuItem[] = [];
  private selectedIndex = 0;
  private visible = false;

  private onSelectCallback?: (itemId: string) => void;
  private onCancelCallback?: () => void;

  constructor(parentElement: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'quick-add-menu';
    this.container.style.display = 'none';
    parentElement.appendChild(this.container);

    this.setupKeyboardHandling();
    this.initializeItems();
  }

  private initializeItems(): void {
    this.items = [
      { id: 'dialogue', label: 'Dialogue', description: 'Character speech', icon: '💬', category: 'dialogue' },
      { id: 'choice', label: 'Choice', description: 'Player decision', icon: '⑂', category: 'flow' },
      { id: 'condition', label: 'Condition', description: 'Branch by stat/flag', icon: '◆', category: 'flow' },
      { id: 'effect', label: 'Effect', description: 'Modify stats/flags', icon: '⚡', category: 'data' },
      { id: 'email', label: 'Email', description: 'Email event', icon: '✉', category: 'event' },
      { id: 'meeting', label: 'Meeting', description: 'Meeting event', icon: '📅', category: 'event' },
      { id: 'task', label: 'Task', description: 'Task assignment', icon: '✓', category: 'event' },
      { id: 'message', label: 'Message', description: 'Slack/IM message', icon: '💬', category: 'event' },
    ];
  }

  show(x: number, y: number, context?: { fromNodeType?: string; connectionType?: 'flow' | 'data' }): void {
    this.visible = true;
    this.applyContextFilter(context);
    this.selectedIndex = 0;

    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.display = 'block';

    this.render();
  }

  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
  }

  private applyContextFilter(context?: { fromNodeType?: string; connectionType?: 'flow' | 'data' }): void {
    if (!context) {
      this.filteredItems = [...this.items];
      return;
    }

    // Filter based on connection type
    if (context.connectionType === 'flow') {
      // Only show nodes that accept flow connections
      this.filteredItems = this.items.filter(item =>
        ['dialogue', 'choice', 'condition', 'effect', 'email', 'meeting', 'task', 'message'].includes(item.id)
      );
    } else {
      this.filteredItems = [...this.items];
    }

    // Mark valid connection targets
    this.filteredItems.forEach(item => {
      item.isValidTarget = true; // Could add more complex logic here
    });
  }

  private render(): void {
    this.container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'quick-add-header';
    header.textContent = 'Add Node';
    this.container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'quick-add-list';

    this.filteredItems.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'quick-add-item';
      if (index === this.selectedIndex) {
        itemEl.classList.add('selected');
      }
      if (item.isValidTarget) {
        itemEl.classList.add('valid-target');
      }

      itemEl.innerHTML = `
        <span class="icon">${item.icon}</span>
        <div class="content">
          <div class="label">${item.label}</div>
          <div class="description">${item.description}</div>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        this.onSelectCallback?.(item.id);
        this.hide();
      });

      itemEl.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.render();
      });

      list.appendChild(itemEl);
    });

    this.container.appendChild(list);
  }

  private setupKeyboardHandling(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.visible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
          this.render();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
          this.render();
          break;
        case 'Enter':
          e.preventDefault();
          const selected = this.filteredItems[this.selectedIndex];
          if (selected) {
            this.onSelectCallback?.(selected.id);
            this.hide();
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.onCancelCallback?.();
          this.hide();
          break;
      }
    });
  }

  onSelect(callback: (itemId: string) => void): void {
    this.onSelectCallback = callback;
  }

  onCancel(callback: () => void): void {
    this.onCancelCallback = callback;
  }
}
```

**UX5.2**: Context filtering already included in UX5.1

**UX5.3**: Keyboard navigation already included in UX5.1

**UX5.4**: Integrate into NodeEditor:
```typescript
// In NodeEditor constructor
private quickAddMenu: QuickAddMenu;

constructor(container: HTMLElement) {
  // ... existing setup

  this.quickAddMenu = new QuickAddMenu(container);
  this.quickAddMenu.onSelect((nodeType) => {
    this.createNodeFromQuickAdd(nodeType);
  });
  this.quickAddMenu.onCancel(() => {
    this.connectingFromPort = null;
    this.tempConnectionEnd = null;
    this.canvas.render();
  });
}

// In mouseup handler
canvasElement.addEventListener('mouseup', (e) => {
  if (this.connectingFromPort) {
    const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

    // Check if released on a port
    let connected = false;
    for (const node of this.nodes.values()) {
      const port = node.getPortAtPoint(worldPos.x, worldPos.y);
      if (port && this.canConnect(this.connectingFromPort, { nodeId: node.id, portId: port.id, port })) {
        this.createConnection(
          this.connectingFromPort.nodeId,
          this.connectingFromPort.portId,
          node.id,
          port.id
        );
        connected = true;
        break;
      }
    }

    // If not connected to port, show quick-add menu
    if (!connected) {
      const screenPos = this.canvas.worldToScreen(worldPos);
      const sourceNode = this.nodes.get(this.connectingFromPort.nodeId);
      const sourcePort = sourceNode?.outputs.find(p => p.id === this.connectingFromPort!.portId);

      this.quickAddMenu.show(e.clientX, e.clientY, {
        fromNodeType: sourceNode?.type,
        connectionType: sourcePort?.type || 'flow',
      });

      // Store position for node creation
      this.pendingNodePosition = worldPos;
      return; // Don't clear connectingFromPort yet
    }

    this.connectingFromPort = null;
    this.tempConnectionEnd = null;
    this.canvas.render();
  }
});

private pendingNodePosition: { x: number; y: number } | null = null;

private createNodeFromQuickAdd(nodeType: string): void {
  if (!this.pendingNodePosition || !this.connectingFromPort) return;

  let newNode: Node;
  const pos = this.pendingNodePosition;

  switch (nodeType) {
    case 'dialogue':
      newNode = this.createDialogueNode(pos.x, pos.y);
      break;
    case 'choice':
      newNode = this.createChoiceNode(pos.x, pos.y);
      break;
    case 'condition':
      newNode = this.createConditionNode(pos.x, pos.y);
      break;
    case 'effect':
      newNode = this.createEffectNode(pos.x, pos.y);
      break;
    case 'email':
      newNode = this.createEmailNode(pos.x, pos.y);
      break;
    case 'meeting':
      newNode = this.createMeetingNode(pos.x, pos.y);
      break;
    case 'task':
      newNode = this.createTaskNode(pos.x, pos.y);
      break;
    case 'message':
      newNode = this.createMessageNode(pos.x, pos.y);
      break;
    default:
      return;
  }

  // Auto-connect to the dragged connection
  if (newNode.inputs.length > 0) {
    this.createConnection(
      this.connectingFromPort.nodeId,
      this.connectingFromPort.portId,
      newNode.id,
      newNode.inputs[0].id
    );
  }

  this.connectingFromPort = null;
  this.tempConnectionEnd = null;
  this.pendingNodePosition = null;
  this.canvas.render();
}
```

**UX5.5**: Add to story-forge CSS:
```css
.quick-add-menu {
  position: fixed;
  background: #2a2a2a;
  border: 2px solid #4a9eff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  min-width: 250px;
  z-index: 1000;
}

.quick-add-header {
  padding: 8px 12px;
  font-weight: bold;
  color: #e0e0e0;
  border-bottom: 1px solid #404040;
}

.quick-add-list {
  max-height: 400px;
  overflow-y: auto;
}

.quick-add-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.quick-add-item:hover,
.quick-add-item.selected {
  background: #3a3a3a;
}

.quick-add-item.valid-target {
  border-left: 3px solid #10b981;
}

.quick-add-item .icon {
  font-size: 24px;
  margin-right: 12px;
}

.quick-add-item .content {
  flex: 1;
}

.quick-add-item .label {
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 2px;
}

.quick-add-item .description {
  font-size: 12px;
  color: #a0a0a0;
}
```

**Test Scenarios:**
- Drag connection to empty space → quick-add menu appears
- Arrow keys → navigate menu items
- Enter → creates node and connects
- Escape → cancels, returns to normal
- Click menu item → creates node
- Context filtering → only shows compatible node types

---

### Phase UX6: Remove Non-Interactive Add Buttons from Grid View

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| UX6.1 | Remove "+ Add Option" button from ChoiceNode.drawContent() | XS | - | Yes (with any) |
| UX6.2 | Remove "+ Add Effect" button from EffectNode.drawContent() | XS | - | Yes (with UX6.1) |
| UX6.3 | Update ChoiceNode height calculation | XS | UX6.1 | No |
| UX6.4 | Update EffectNode height calculation | XS | UX6.2 | No |

**Implementation Details:**

**UX6.1**: Modify ChoiceNode.drawContent() - remove lines 73-80:
```typescript
drawContent(ctx: CanvasRenderingContext2D): void {
  // Draw options
  this.options.forEach((option, index) => {
    // ... existing option drawing code
  });

  // REMOVED: "+ Add Option" button drawing code
}
```

**UX6.2**: Modify EffectNode.drawContent() - remove lines 54-62:
```typescript
drawContent(ctx: CanvasRenderingContext2D): void {
  // Draw effects
  this.effects.forEach((effect, index) => {
    // ... existing effect drawing code
  });

  // REMOVED: "+ Add Effect" button drawing code
}
```

**UX6.3**: Update ChoiceNode height calculation:
- In constructor: `this.style.height = Math.max(80, 50 + this.options.length * 30);`
- In updateProperties: same formula

**UX6.4**: Update EffectNode height calculation:
- In constructor: `this.style.height = Math.max(80, 50 + this.effects.length * 20);`
- In updateProperties: same formula

**Test Scenarios:**
- View choice node in grid → no add button visible
- View effect node in grid → no add button visible
- Double-click to open property panel → add functionality available there
- Node heights → adjust correctly without button padding

---

## Dependency Graph

```
Foundation (can parallelize):
├── UX1: Pan Behavior (5 tasks, sequential)
├── UX2: Cursors (4 tasks, depends on UX1 for coordination)
├── UX3: Selection Glow (3 tasks, independent)
└── UX4: Port Highlights (5 tasks, independent)

Features (can parallelize after foundation):
├── UX5: Quick-Add Menu (5 tasks, sequential)
└── UX6: Remove Grid Button (3 tasks, sequential)

Suggested order:
Phase 1: UX1.1-1.5, UX3.1-3.3 (parallel)
Phase 2: UX2.1-2.4, UX4.1-4.5 (parallel)
Phase 3: UX5.1-5.5, UX6.1-6.3 (parallel)
```

## Parallel Execution Groups

1. **Group 1** (Foundation - no dependencies):
   - UX1.1-1.3 (pan state tracking)
   - UX2.1 (cursor state)
   - UX3.1-3.2 (selection glow)
   - UX4.1 (hover state)

2. **Group 2** (After Group 1):
   - UX1.4-1.5 (pan detection)
   - UX2.2-2.4 (cursor updates)
   - UX3.3 (glow testing)
   - UX4.2-4.3 (port highlighting)

3. **Group 3** (Features):
   - UX4.4-4.5 (animations)
   - UX5.1-5.5 (quick-add menu)
   - UX6.1-6.3 (choice node cleanup)

---

## Risk Areas

| Task | Risk | Mitigation |
|------|------|------------|
| UX1.4 | Pan threshold may feel sluggish | Make threshold/delay configurable, test with users |
| UX2.2 | Hover detection may be slow on large graphs | Cache hit results, use spatial indexing if needed |
| UX4.4 | Animation may cause performance issues | Make animation optional, use requestAnimationFrame efficiently |
| UX5.1 | Menu positioning at screen edges | Add edge detection, flip menu if near edge |
| UX5.2 | Context filtering logic may be complex | Start simple, iterate based on actual usage |

---

## Testing Strategy

### Unit Tests
- Canvas pan threshold calculation (UX1.2)
- Cursor state transitions (UX2.3)
- Port hit detection accuracy (UX4.2)
- Quick-add context filtering (UX5.2)

### Integration Tests
- Pan behavior doesn't interfere with node dragging (UX1.4 + existing drag)
- Cursor updates correctly during all interaction modes (UX2.4)
- Port highlights work during connection drag (UX4.5)
- Quick-add menu creates and connects nodes (UX5.4)

### E2E Tests
- Complete workflow: drag connection → see highlights → drop → menu appears → select node → node connected
- Pan canvas → select node → see glow → hover port → see highlight
- Create choice node → edit in panel → add options → verify grid display

### Manual Testing Checklist
- [ ] Pan feels natural (not too sensitive, not too sluggish)
- [ ] Cursors change smoothly without flicker
- [ ] Glow colors match node type colors
- [ ] Port highlights are visible but not distracting
- [ ] Quick-add menu appears at cursor position
- [ ] Keyboard navigation in menu works smoothly
- [ ] Choice nodes look cleaner without grid button
- [ ] All interactions work on both desktop and tablet

---

## Commit Points

Logical points for git commits:

1. After UX1.1-1.5: `feat(story-forge): add modifier-free canvas panning`
2. After UX2.1-2.4: `feat(story-forge): add context-sensitive cursors to node editor`
3. After UX3.1-3.3: `feat(story-forge): add selection glow with node-specific colors`
4. After UX4.1-4.3: `feat(story-forge): add port hover highlights`
5. After UX4.4-4.5: `feat(story-forge): add pulsing animation to port highlights`
6. After UX5.1-5.5: `feat(story-forge): add quick-add menu for connection drops`
7. After UX6.1-6.3: `refactor(story-forge): move choice option add to property panel`

---

## Performance Considerations

### Canvas Rendering
- Avoid re-rendering entire canvas on every mousemove
- Throttle hover detection to max 60fps
- Use requestAnimationFrame for smooth animations
- Cache computed values (port positions, hit areas)

### Memory Management
- Remove event listeners on destroy
- Cancel animation frames when menu closes
- Clear hover states when appropriate

### Optimization Opportunities
- Spatial indexing for hover detection (if > 100 nodes)
- Dirty region rendering (only redraw changed areas)
- Off-screen canvas for static elements

---

## Accessibility Considerations

While this is a desktop canvas-based tool, consider:
- Keyboard shortcuts for all menu operations
- Clear visual feedback for all interactive states
- Sufficient contrast for glow/highlight colors
- Focus indicators that work with canvas cursors

---

## Future Enhancements

Not in scope for this plan, but worth noting:

1. **Customizable pan threshold** - User preference for sensitivity
2. **Multiple selection box** - Drag rectangle to select multiple nodes
3. **Connection snap guides** - Magnetic snapping for alignment
4. **Port label tooltips** - Show port names on hover
5. **Quick-add search** - Type to filter menu items
6. **Recent nodes** - Show recently created node types first
7. **Connection preview** - Show ghost connection before dropping

---

## Estimated Timeline

Based on task sizes:
- **XS tasks**: 15-30 min each
- **S tasks**: 1-2 hours each
- **M tasks**: 3-4 hours each
- **L tasks**: 6-8 hours each

**Total estimate**: ~25-35 hours of implementation time

**Suggested sprint breakdown**:
- Sprint 1 (8-10h): UX1 + UX2 (pan and cursors)
- Sprint 2 (8-10h): UX3 + UX4 (glows and highlights)
- Sprint 3 (8-10h): UX5 + UX6 (menu and cleanup)
- Sprint 4 (4-6h): Testing, polish, documentation

---

## Definition of Done

Each task is complete when:
- [ ] Code implemented and tested locally
- [ ] No TypeScript errors
- [ ] Visual feedback works as specified
- [ ] No performance regressions
- [ ] Works with existing node editor features
- [ ] Committed with conventional commit message

The entire plan is complete when:
- [ ] All 6 features implemented
- [ ] All test scenarios pass
- [ ] No known bugs
- [ ] Code reviewed (if working with team)
- [ ] Documentation updated (if applicable)
- [ ] User can perform all workflows smoothly
