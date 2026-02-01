/**
 * NodeEditor
 * Main node editor component that manages nodes, connections, and interactions
 */

import { Canvas } from './Canvas.js';
import { Node } from './Node.js';
import { Connection } from './Connection.js';
import { DialogueNode } from './nodes/DialogueNode.js';
import { ChoiceNode } from './nodes/ChoiceNode.js';
import { ConditionNode } from './nodes/ConditionNode.js';
import { EffectNode } from './nodes/EffectNode.js';
import { EmailNode } from './nodes/EmailNode.js';
import { MeetingNode } from './nodes/MeetingNode.js';
import { TaskNode } from './nodes/TaskNode.js';
import { MessageNode } from './nodes/MessageNode.js';
import { PropertyPanel } from './PropertyPanel.js';
import { QuickAddMenu } from './QuickAddMenu.js';
import type { NodeGraph, NodePort } from '../types/index.js';

export type ChangeCallback = () => void;

export class NodeEditor {
  private canvas: Canvas;
  private container: HTMLElement;
  private nodes: Map<string, Node> = new Map();
  private connections: Map<string, Connection> = new Map();

  private selectedNodes: Set<string> = new Set();
  private selectedConnections: Set<string> = new Set();

  private draggingNode: Node | null = null;
  private connectingFromPort: { nodeId: string; portId: string; port: NodePort } | null = null;
  private tempConnectionEnd: { x: number; y: number } | null = null;

  private contextMenuVisible = false;
  private contextMenuPos = { x: 0, y: 0 };

  private nextNodeId = 1;
  private nextConnectionId = 1;

  // Property panel for editing nodes
  private propertyPanel: PropertyPanel;
  private editingNode: Node | null = null;

  // Quick add menu for connection drops
  private quickAddMenu: QuickAddMenu;
  private pendingConnectionDrop: { x: number; y: number; fromPort: { nodeId: string; portId: string; port: NodePort } } | null = null;

  // Change tracking
  private changeCallbacks: Set<ChangeCallback> = new Set();

  // Undo/redo history
  private history: NodeGraph[] = [];
  private historyIndex = -1;
  private maxHistory = 50;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = new Canvas(container);

    // Create property panel
    this.propertyPanel = new PropertyPanel(container);
    this.propertyPanel.onUpdate((nodeId, updates) => {
      this.updateNodeProperties(nodeId, updates);
    });
    this.propertyPanel.onClose(() => {
      this.editingNode = null;
    });

    // Create quick add menu
    this.quickAddMenu = new QuickAddMenu(container);
    this.quickAddMenu.onSelect((nodeType) => {
      this.handleQuickAddSelection(nodeType);
    });
    this.quickAddMenu.onCancel(() => {
      this.pendingConnectionDrop = null;
    });

    // Register callbacks
    this.canvas.onRender(() => this.render());
    this.canvas.onClick((pos) => this.handleClick(pos));
    this.canvas.onHitTest((pos) => this.hitTest(pos));
    this.canvas.onEmptyClick(() => this.clearSelection());

    // Setup additional event listeners
    this.setupEventListeners();

    // Initial render
    this.canvas.render();

    // Save initial state
    this.saveToHistory();
  }

  /**
   * Register a callback for when the graph changes
   */
  onChange(callback: ChangeCallback): void {
    this.changeCallbacks.add(callback);
  }

  /**
   * Notify listeners of a change
   */
  private notifyChange(): void {
    this.changeCallbacks.forEach(cb => cb());
  }

  /**
   * Save current state to history
   */
  private saveToHistory(): void {
    // Remove any redo states
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add current state
    const state = this.exportGraph();
    this.history.push(JSON.parse(JSON.stringify(state)));

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (this.historyIndex <= 0) return false;

    this.historyIndex--;
    const state = this.history[this.historyIndex];
    this.importGraphWithoutHistory(state);
    this.notifyChange();
    return true;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    const state = this.history[this.historyIndex];
    this.importGraphWithoutHistory(state);
    this.notifyChange();
    return true;
  }

  /**
   * Update node properties from property panel
   */
  private updateNodeProperties(nodeId: string, updates: Record<string, any>): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.updateProperties(updates);
    this.canvas.render();
    this.saveToHistory();
    this.notifyChange();
  }

  /**
   * Open property panel for a node
   */
  private openPropertyPanel(node: Node, screenPos?: { x: number; y: number }): void {
    this.editingNode = node;
    this.propertyPanel.show(node, screenPos);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const canvasElement = this.canvas['canvas'];

    // Double-click to edit node
    canvasElement.addEventListener('dblclick', (e) => {
      const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

      for (const node of this.nodes.values()) {
        if (node.containsPoint(worldPos.x, worldPos.y)) {
          // Get node center in screen coordinates
          const bounds = node.getBounds();
          const nodeCenterWorld = {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2,
          };
          const screenPos = this.canvas.worldToScreen(nodeCenterWorld);
          this.openPropertyPanel(node, screenPos);
          return;
        }
      }
    });

    // Mouse down for dragging/connecting
    canvasElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

      // Check if clicking on a port
      for (const node of this.nodes.values()) {
        const port = node.getPortAtPoint(worldPos.x, worldPos.y);
        if (port) {
          this.startConnection(node.id, port.id, port);
          this.canvas.lockCursor('crosshair');
          return;
        }
      }

      // Check if clicking on a node
      for (const node of this.nodes.values()) {
        if (node.containsPoint(worldPos.x, worldPos.y)) {
          this.draggingNode = node;
          node.startDrag(worldPos.x, worldPos.y);
          this.canvas.lockCursor('move');

          if (!e.shiftKey) {
            this.clearSelection();
          }
          this.selectNode(node.id);
          return;
        }
      }

      // Check if clicking on a connection
      for (const connection of this.connections.values()) {
        const sourceNode = this.nodes.get(connection.sourceNodeId);
        const targetNode = this.nodes.get(connection.targetNodeId);

        if (sourceNode && targetNode && connection.isNearPoint(worldPos.x, worldPos.y, sourceNode, targetNode)) {
          if (!e.shiftKey) {
            this.clearSelection();
          }
          this.selectConnection(connection.id);
          return;
        }
      }

      // Clicked on empty space
      this.clearSelection();
    });

    // Mouse move for dragging and hover tracking
    canvasElement.addEventListener('mousemove', (e) => {
      const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

      if (this.draggingNode) {
        this.draggingNode.updateDrag(worldPos.x, worldPos.y);
        this.canvas.render();
        return;
      }

      if (this.connectingFromPort) {
        this.tempConnectionEnd = worldPos;
        // Update valid target highlighting
        this.updateConnectionTargets(worldPos);
        this.canvas.render();
        return;
      }

      // Track port hover when not dragging
      this.updatePortHover(worldPos);
    });

    // Mouse up to stop dragging/connecting
    canvasElement.addEventListener('mouseup', (e) => {
      if (this.draggingNode) {
        this.draggingNode.stopDrag();
        this.draggingNode = null;
        this.canvas.unlockCursor();
        this.saveToHistory();
        this.notifyChange();
      }

      if (this.connectingFromPort) {
        const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

        // Check if we're dragging from an output (for quick-add menu)
        const fromNode = this.nodes.get(this.connectingFromPort.nodeId);
        const isDraggingFromOutput = fromNode?.outputs.some(p => p.id === this.connectingFromPort!.portId) ?? false;

        // Check if released on a port
        let connectedToPort = false;
        for (const node of this.nodes.values()) {
          const port = node.getPortAtPoint(worldPos.x, worldPos.y);
          if (port && this.canConnect(this.connectingFromPort, { nodeId: node.id, portId: port.id, port })) {
            // Get normalized connection (always output -> input)
            const normalized = this.getNormalizedConnection(
              { nodeId: this.connectingFromPort.nodeId, portId: this.connectingFromPort.portId },
              { nodeId: node.id, portId: port.id }
            );
            if (normalized) {
              this.createConnection(
                normalized.sourceNodeId,
                normalized.sourcePortId,
                normalized.targetNodeId,
                normalized.targetPortId
              );
              connectedToPort = true;
            }
            break;
          }
        }

        // If not connected to port and dragging from output, show quick-add menu
        if (!connectedToPort && isDraggingFromOutput) {
          this.pendingConnectionDrop = {
            x: worldPos.x,
            y: worldPos.y,
            fromPort: { ...this.connectingFromPort },
          };

          // Get source port type for context filtering
          const sourcePort = fromNode?.outputs.find(p => p.id === this.connectingFromPort!.portId);

          this.quickAddMenu.show(e.clientX, e.clientY, {
            portType: sourcePort?.type as 'flow' | 'data' | undefined,
          });
        }

        this.connectingFromPort = null;
        this.tempConnectionEnd = null;
        this.canvas.unlockCursor();

        // Clear all highlighted ports
        for (const node of this.nodes.values()) {
          node.highlightedPortIds.clear();
          node.hoveredPortId = null;
        }

        this.canvas.render();
      }
    });

    // Right click for context menu
    canvasElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't handle shortcuts if we're in an input field
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA' ||
          (e.target as HTMLElement).tagName === 'SELECT') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelected();
      } else if (e.key === 'Escape') {
        this.clearSelection();
        this.hideContextMenu();
        this.propertyPanel.hide();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          this.selectAll();
        } else if (e.key === 'd') {
          e.preventDefault();
          this.duplicateSelected();
        } else if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          this.redo();
        }
      }
    });
  }

  /**
   * Render the editor
   */
  private render(): void {
    const ctx = this.canvas.getContext();

    // Draw connections first (behind nodes)
    this.connections.forEach(connection => {
      const sourceNode = this.nodes.get(connection.sourceNodeId);
      const targetNode = this.nodes.get(connection.targetNodeId);

      if (sourceNode && targetNode) {
        connection.draw(ctx, sourceNode, targetNode);
      }
    });

    // Draw temporary connection being created
    if (this.connectingFromPort && this.tempConnectionEnd) {
      const sourceNode = this.nodes.get(this.connectingFromPort.nodeId);
      if (sourceNode) {
        const sourcePort = sourceNode.getPortPosition(this.connectingFromPort.portId);
        if (sourcePort) {
          ctx.strokeStyle = '#4a9eff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.moveTo(sourcePort.x, sourcePort.y);
          ctx.lineTo(this.tempConnectionEnd.x, this.tempConnectionEnd.y);
          ctx.stroke();

          ctx.setLineDash([]);
        }
      }
    }

    // Draw nodes
    this.nodes.forEach(node => {
      node.draw(ctx);
    });
  }

  /**
   * Handle canvas click
   */
  private handleClick(worldPos: { x: number; y: number }): void {
    // Clicks are handled in mousedown for better control
  }

  /**
   * Hit test - determine what's at a world position
   */
  private hitTest(worldPos: { x: number; y: number }): 'empty' | 'node' | 'port' | 'connection' {
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
  }

  /**
   * Update port hover state
   */
  private updatePortHover(worldPos: { x: number; y: number }): void {
    let needsRender = false;

    // Clear all hover states first
    for (const node of this.nodes.values()) {
      if (node.hoveredPortId !== null) {
        node.hoveredPortId = null;
        needsRender = true;
      }
    }

    // Find hovered port
    for (const node of this.nodes.values()) {
      const port = node.getPortAtPoint(worldPos.x, worldPos.y);
      if (port) {
        node.hoveredPortId = port.id;
        needsRender = true;
        break;
      }
    }

    if (needsRender) {
      this.canvas.render();
    }
  }

  /**
   * Update valid connection target highlighting during drag
   */
  private updateConnectionTargets(worldPos: { x: number; y: number }): void {
    if (!this.connectingFromPort) return;

    // Clear all highlighted ports
    for (const node of this.nodes.values()) {
      node.highlightedPortIds.clear();
      node.hoveredPortId = null;
    }

    // Determine if we're dragging from an output or input
    const fromNode = this.nodes.get(this.connectingFromPort.nodeId);
    if (!fromNode) return;

    const isDraggingFromOutput = fromNode.outputs.some(p => p.id === this.connectingFromPort!.portId);

    // Only highlight the port we're close to (if it's a valid target)
    for (const node of this.nodes.values()) {
      // If dragging from output, look at inputs; if dragging from input, look at outputs
      const targetPorts = isDraggingFromOutput ? node.inputs : node.outputs;

      for (const port of targetPorts) {
        const portPos = node.getPortPosition(port.id);
        if (!portPos) continue;

        const dx = worldPos.x - portPos.x;
        const dy = worldPos.y - portPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= Node.PORT_SNAP_DISTANCE && this.canConnect(this.connectingFromPort, { nodeId: node.id, portId: port.id, port })) {
          node.highlightedPortIds.add(port.id);
          node.hoveredPortId = port.id;
          return; // Only highlight one port
        }
      }
    }
  }

  /**
   * Handle quick-add menu selection
   */
  private handleQuickAddSelection(nodeType: string): void {
    if (!this.pendingConnectionDrop) return;

    const { x, y, fromPort } = this.pendingConnectionDrop;
    let newNode: Node | null = null;

    // Create the selected node type
    switch (nodeType) {
      case 'dialogue':
        newNode = this.createDialogueNode(x, y);
        break;
      case 'choice':
        newNode = this.createChoiceNode(x, y);
        break;
      case 'condition':
        newNode = this.createConditionNode(x, y);
        break;
      case 'effect':
        newNode = this.createEffectNode(x, y);
        break;
      case 'email':
        newNode = this.createEmailNode(x, y);
        break;
      case 'meeting':
        newNode = this.createMeetingNode(x, y);
        break;
      case 'task':
        newNode = this.createTaskNode(x, y);
        break;
      case 'message':
        newNode = this.createMessageNode(x, y);
        break;
    }

    // Connect the new node to the dragged connection
    if (newNode && newNode.inputs.length > 0) {
      this.createConnection(
        fromPort.nodeId,
        fromPort.portId,
        newNode.id,
        newNode.inputs[0].id
      );
    }

    this.pendingConnectionDrop = null;
  }

  /**
   * Start creating a connection from a port
   */
  private startConnection(nodeId: string, portId: string, port: NodePort): void {
    this.connectingFromPort = { nodeId, portId, port };
  }

  /**
   * Check if two ports can be connected
   * Rules:
   * - Can't connect to self
   * - Must connect output to input (either direction of drag)
   * - An output can only connect to one input (existing connection will be replaced)
   * - An input can accept multiple outputs
   */
  private canConnect(
    from: { nodeId: string; portId: string; port: NodePort },
    to: { nodeId: string; portId: string; port: NodePort }
  ): boolean {
    // Can't connect to self
    if (from.nodeId === to.nodeId) return false;

    const fromNode = this.nodes.get(from.nodeId);
    const toNode = this.nodes.get(to.nodeId);

    if (!fromNode || !toNode) return false;

    const fromIsOutput = fromNode.outputs.some(p => p.id === from.portId);
    const fromIsInput = fromNode.inputs.some(p => p.id === from.portId);
    const toIsOutput = toNode.outputs.some(p => p.id === to.portId);
    const toIsInput = toNode.inputs.some(p => p.id === to.portId);

    // Must connect output to input (in either direction)
    if (fromIsOutput && toIsInput) {
      return true;
    } else if (fromIsInput && toIsOutput) {
      return true;
    }

    // Can't connect input to input or output to output
    return false;
  }

  /**
   * Get the normalized connection (output -> input) regardless of drag direction
   */
  private getNormalizedConnection(
    from: { nodeId: string; portId: string },
    to: { nodeId: string; portId: string }
  ): { sourceNodeId: string; sourcePortId: string; targetNodeId: string; targetPortId: string } | null {
    const fromNode = this.nodes.get(from.nodeId);
    const toNode = this.nodes.get(to.nodeId);

    if (!fromNode || !toNode) return null;

    const fromIsOutput = fromNode.outputs.some(p => p.id === from.portId);
    const toIsInput = toNode.inputs.some(p => p.id === to.portId);

    if (fromIsOutput && toIsInput) {
      return {
        sourceNodeId: from.nodeId,
        sourcePortId: from.portId,
        targetNodeId: to.nodeId,
        targetPortId: to.portId,
      };
    }

    const fromIsInput = fromNode.inputs.some(p => p.id === from.portId);
    const toIsOutput = toNode.outputs.some(p => p.id === to.portId);

    if (fromIsInput && toIsOutput) {
      return {
        sourceNodeId: to.nodeId,
        sourcePortId: to.portId,
        targetNodeId: from.nodeId,
        targetPortId: from.portId,
      };
    }

    return null;
  }

  /**
   * Create a connection between two ports
   * An output can only connect to one input - existing connections from the same output are removed
   */
  private createConnection(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): Connection {
    // Remove any existing connection from this output (output can only connect to one input)
    const existingConnections: string[] = [];
    for (const [id, conn] of this.connections) {
      if (conn.sourceNodeId === sourceNodeId && conn.sourcePortId === sourcePortId) {
        existingConnections.push(id);
      }
    }
    existingConnections.forEach(id => this.connections.delete(id));

    const id = `conn-${this.nextConnectionId++}`;

    const connection = new Connection({
      id,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
    });

    this.connections.set(id, connection);
    this.canvas.render();
    this.saveToHistory();
    this.notifyChange();

    return connection;
  }

  /**
   * Add a node to the editor
   */
  addNode(node: Node): void {
    console.log(`[NodeEditor] addNode: ${node.id} (${node.type}), Map size before: ${this.nodes.size}`);
    this.nodes.set(node.id, node);
    console.log(`[NodeEditor] addNode: Map size after: ${this.nodes.size}`);
    this.canvas.render();
    this.saveToHistory();
    this.notifyChange();
  }

  /**
   * Create a new dialogue node
   */
  createDialogueNode(x: number, y: number, speaker: string = 'Character'): DialogueNode {
    const node = new DialogueNode({
      id: `node-${this.nextNodeId++}`,
      type: 'dialogue',
      position: { x, y },
      speaker,
      text: 'Enter dialogue here...',
      emotion: 'neutral',
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new choice node
   */
  createChoiceNode(x: number, y: number): ChoiceNode {
    const node = new ChoiceNode({
      id: `node-${this.nextNodeId++}`,
      type: 'choice',
      position: { x, y },
      options: [
        { id: '1', text: 'Option 1', effects: [], outputPortId: '' },
        { id: '2', text: 'Option 2', effects: [], outputPortId: '' },
      ],
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new condition node
   */
  createConditionNode(x: number, y: number): ConditionNode {
    const node = new ConditionNode({
      id: `node-${this.nextNodeId++}`,
      type: 'condition',
      position: { x, y },
      condition: {
        type: 'stat',
        operator: '>',
        target: 'energy',
        value: 50,
      },
      trueOutputId: '',
      falseOutputId: '',
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new effect node
   */
  createEffectNode(x: number, y: number): EffectNode {
    const node = new EffectNode({
      id: `node-${this.nextNodeId++}`,
      type: 'effect',
      position: { x, y },
      effects: [
        { type: 'stat', target: 'energy', operation: '-', value: 10 },
      ],
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new email node
   */
  createEmailNode(x: number, y: number): EmailNode {
    const node = new EmailNode({
      id: `node-${this.nextNodeId++}`,
      type: 'email',
      position: { x, y },
      triggerMode: 'scheduled',
      time: '09:00',
      from: '',
      subject: 'New Email',
      body: 'Email content here...',
      urgent: false,
      requiresResponse: false,
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new meeting node
   */
  createMeetingNode(x: number, y: number): MeetingNode {
    const node = new MeetingNode({
      id: `node-${this.nextNodeId++}`,
      type: 'meeting',
      position: { x, y },
      triggerMode: 'scheduled',
      time: '10:00',
      duration: 30,
      title: 'Team Meeting',
      participants: [],
      energyCost: 15,
      stressCost: 10,
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new task node
   */
  createTaskNode(x: number, y: number): TaskNode {
    const node = new TaskNode({
      id: `node-${this.nextNodeId++}`,
      type: 'task',
      position: { x, y },
      triggerMode: 'scheduled',
      time: '09:00',
      title: 'New Task',
      description: 'Task description...',
      priority: 'medium',
      energyCost: 10,
      duration: 30,
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Create a new message node
   */
  createMessageNode(x: number, y: number): MessageNode {
    const node = new MessageNode({
      id: `node-${this.nextNodeId++}`,
      type: 'message',
      position: { x, y },
      triggerMode: 'scheduled',
      time: '09:00',
      channel: 'slack',
      from: '',
      text: 'Hey! Got a minute?',
      requiresResponse: false,
      inputs: [],
      outputs: [],
    });

    this.addNode(node);
    return node;
  }

  /**
   * Delete selected nodes and connections
   */
  private deleteSelected(): void {
    if (this.selectedNodes.size === 0 && this.selectedConnections.size === 0) return;

    // Delete selected nodes
    this.selectedNodes.forEach(nodeId => {
      this.nodes.delete(nodeId);

      // Delete connections to/from this node
      const connectionsToDelete: string[] = [];
      this.connections.forEach((conn, id) => {
        if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
          connectionsToDelete.push(id);
        }
      });

      connectionsToDelete.forEach(id => this.connections.delete(id));
    });

    // Delete selected connections
    this.selectedConnections.forEach(connId => {
      this.connections.delete(connId);
    });

    this.clearSelection();
    this.canvas.render();
    this.saveToHistory();
    this.notifyChange();
  }

  /**
   * Duplicate selected nodes
   */
  private duplicateSelected(): void {
    const newNodes: Node[] = [];

    this.selectedNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) {
        const cloned = node.clone();
        cloned.id = `node-${this.nextNodeId++}`;
        newNodes.push(cloned);
      }
    });

    this.clearSelection();

    newNodes.forEach(node => {
      this.addNode(node);
      this.selectNode(node.id);
    });
  }

  /**
   * Select a node
   */
  private selectNode(nodeId: string): void {
    this.selectedNodes.add(nodeId);
    const node = this.nodes.get(nodeId);
    if (node) {
      node.select();
      this.canvas.render();
    }
  }

  /**
   * Select a connection
   */
  private selectConnection(connId: string): void {
    this.selectedConnections.add(connId);
    const conn = this.connections.get(connId);
    if (conn) {
      conn.select();
      this.canvas.render();
    }
  }

  /**
   * Select all nodes
   */
  private selectAll(): void {
    this.nodes.forEach((node, id) => {
      this.selectNode(id);
    });
  }

  /**
   * Clear selection
   */
  private clearSelection(): void {
    this.selectedNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) node.deselect();
    });

    this.selectedConnections.forEach(connId => {
      const conn = this.connections.get(connId);
      if (conn) conn.deselect();
    });

    this.selectedNodes.clear();
    this.selectedConnections.clear();
    this.canvas.render();
  }

  /**
   * Show context menu
   */
  private showContextMenu(x: number, y: number): void {
    this.contextMenuPos = this.canvas.screenToWorld({ x, y });
    this.contextMenuVisible = true;
    // TODO: Render context menu UI
  }

  /**
   * Hide context menu
   */
  private hideContextMenu(): void {
    this.contextMenuVisible = false;
  }

  /**
   * Export graph to data format
   */
  exportGraph(): NodeGraph {
    console.log(`[NodeEditor] exportGraph - nodes Map size: ${this.nodes.size}`);
    console.log(`[NodeEditor] exportGraph - connections Map size: ${this.connections.size}`);

    const nodes = Array.from(this.nodes.values()).map(n => {
      const data = n.toData();
      console.log(`[NodeEditor] Exporting node: ${data.id} (${data.type})`);
      return data;
    });
    const connections = Array.from(this.connections.values()).map(c => c.toData());

    console.log(`[NodeEditor] Exported ${nodes.length} nodes, ${connections.length} connections`);

    return {
      nodes,
      connections,
      metadata: {
        entryNodeId: nodes[0]?.id || '',
        title: 'Untitled',
        tags: [],
      },
    };
  }

  /**
   * Import graph from data format
   */
  importGraph(graph: NodeGraph): void {
    this.importGraphWithoutHistory(graph);
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory();

    // Zoom to fit all nodes after loading
    this.zoomToFit();
  }

  /**
   * Zoom to fit all nodes in view
   */
  zoomToFit(): void {
    if (this.nodes.size === 0) {
      this.canvas.centerView();
      return;
    }

    // Calculate combined bounds of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach(node => {
      const bounds = node.getBounds();
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    });

    this.canvas.zoomToFit({ minX, minY, maxX, maxY });
  }

  /**
   * Import graph without affecting history (for undo/redo)
   */
  private importGraphWithoutHistory(graph: NodeGraph): void {
    this.nodes.clear();
    this.connections.clear();

    // Update nextNodeId to be higher than any imported node
    let maxNodeId = 0;
    let maxConnId = 0;

    // Import nodes
    graph.nodes.forEach(nodeData => {
      let node: Node;

      // Extract numeric ID
      const nodeIdMatch = nodeData.id.match(/\d+/);
      if (nodeIdMatch) {
        maxNodeId = Math.max(maxNodeId, parseInt(nodeIdMatch[0]));
      }

      switch (nodeData.type) {
        case 'dialogue':
          node = new DialogueNode(nodeData as any);
          break;
        case 'choice':
          node = new ChoiceNode(nodeData as any);
          break;
        case 'condition':
          node = new ConditionNode(nodeData as any);
          break;
        case 'effect':
          node = new EffectNode(nodeData as any);
          break;
        case 'email':
          node = new EmailNode(nodeData as any);
          break;
        case 'meeting':
          node = new MeetingNode(nodeData as any);
          break;
        case 'task':
          node = new TaskNode(nodeData as any);
          break;
        case 'message':
          node = new MessageNode(nodeData as any);
          break;
        default:
          return;
      }

      this.nodes.set(node.id, node);
    });

    // Import connections
    graph.connections.forEach(connData => {
      const connIdMatch = connData.id.match(/\d+/);
      if (connIdMatch) {
        maxConnId = Math.max(maxConnId, parseInt(connIdMatch[0]));
      }

      const connection = new Connection(connData);
      this.connections.set(connection.id, connection);
    });

    // Update ID counters
    this.nextNodeId = maxNodeId + 1;
    this.nextConnectionId = maxConnId + 1;

    this.canvas.render();
  }

  /**
   * Clear the editor
   */
  clear(): void {
    this.nodes.clear();
    this.connections.clear();
    this.clearSelection();
    this.canvas.render();
  }

  /**
   * Destroy the editor
   */
  destroy(): void {
    this.canvas.destroy();
  }
}
