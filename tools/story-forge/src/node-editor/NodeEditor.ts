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
import type { NodeGraph, NodePort } from '../types/index.js';

export class NodeEditor {
  private canvas: Canvas;
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

  constructor(container: HTMLElement) {
    this.canvas = new Canvas(container);

    // Register callbacks
    this.canvas.onRender(() => this.render());
    this.canvas.onClick((pos) => this.handleClick(pos));

    // Setup additional event listeners
    this.setupEventListeners();

    // Initial render
    this.canvas.render();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const canvasElement = this.canvas['canvas'];

    // Mouse down for dragging/connecting
    canvasElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

      // Check if clicking on a port
      for (const node of this.nodes.values()) {
        const port = node.getPortAtPoint(worldPos.x, worldPos.y);
        if (port) {
          this.startConnection(node.id, port.id, port);
          return;
        }
      }

      // Check if clicking on a node
      for (const node of this.nodes.values()) {
        if (node.containsPoint(worldPos.x, worldPos.y)) {
          this.draggingNode = node;
          node.startDrag(worldPos.x, worldPos.y);

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

    // Mouse move for dragging
    canvasElement.addEventListener('mousemove', (e) => {
      const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

      if (this.draggingNode) {
        this.draggingNode.updateDrag(worldPos.x, worldPos.y);
        this.canvas.render();
      }

      if (this.connectingFromPort) {
        this.tempConnectionEnd = worldPos;
        this.canvas.render();
      }
    });

    // Mouse up to stop dragging/connecting
    canvasElement.addEventListener('mouseup', (e) => {
      if (this.draggingNode) {
        this.draggingNode.stopDrag();
        this.draggingNode = null;
      }

      if (this.connectingFromPort) {
        const worldPos = this.canvas.screenToWorld({ x: e.clientX, y: e.clientY });

        // Check if released on a port
        for (const node of this.nodes.values()) {
          const port = node.getPortAtPoint(worldPos.x, worldPos.y);
          if (port && this.canConnect(this.connectingFromPort, { nodeId: node.id, portId: port.id, port })) {
            this.createConnection(
              this.connectingFromPort.nodeId,
              this.connectingFromPort.portId,
              node.id,
              port.id
            );
            break;
          }
        }

        this.connectingFromPort = null;
        this.tempConnectionEnd = null;
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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelected();
      } else if (e.key === 'Escape') {
        this.clearSelection();
        this.hideContextMenu();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          this.selectAll();
        } else if (e.key === 'd') {
          e.preventDefault();
          this.duplicateSelected();
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
   * Start creating a connection from a port
   */
  private startConnection(nodeId: string, portId: string, port: NodePort): void {
    this.connectingFromPort = { nodeId, portId, port };
  }

  /**
   * Check if two ports can be connected
   */
  private canConnect(
    from: { nodeId: string; portId: string; port: NodePort },
    to: { nodeId: string; portId: string; port: NodePort }
  ): boolean {
    // Can't connect to self
    if (from.nodeId === to.nodeId) return false;

    // Can't connect input to input or output to output
    const fromNode = this.nodes.get(from.nodeId);
    const toNode = this.nodes.get(to.nodeId);

    if (!fromNode || !toNode) return false;

    const fromIsOutput = fromNode.outputs.some(p => p.id === from.portId);
    const toIsInput = toNode.inputs.some(p => p.id === to.portId);

    return fromIsOutput && toIsInput;
  }

  /**
   * Create a connection between two ports
   */
  private createConnection(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): Connection {
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

    return connection;
  }

  /**
   * Add a node to the editor
   */
  addNode(node: Node): void {
    this.nodes.set(node.id, node);
    this.canvas.render();
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
   * Delete selected nodes and connections
   */
  private deleteSelected(): void {
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
    const nodes = Array.from(this.nodes.values()).map(n => n.toData());
    const connections = Array.from(this.connections.values()).map(c => c.toData());

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
    this.nodes.clear();
    this.connections.clear();

    // Import nodes
    graph.nodes.forEach(nodeData => {
      let node: Node;

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
        default:
          return;
      }

      this.nodes.set(node.id, node);
    });

    // Import connections
    graph.connections.forEach(connData => {
      const connection = new Connection(connData);
      this.connections.set(connection.id, connection);
    });

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
