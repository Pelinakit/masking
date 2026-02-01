/**
 * Base Node Class
 * Abstract class for all node types in the editor
 */

import type { NodeType, BaseNode as NodeData, NodePort } from '../types/index.js';

export interface NodeStyle {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  headerColor: string;
  textColor: string;
  selectedBorderColor: string;
}

export abstract class Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  inputs: NodePort[];
  outputs: NodePort[];

  selected = false;
  dragging = false;
  dragOffset = { x: 0, y: 0 };

  protected style: NodeStyle = {
    width: 200,
    height: 100,
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
    borderWidth: 2,
    borderRadius: 8,
    headerColor: '#3a3a3a',
    textColor: '#e0e0e0',
    selectedBorderColor: '#4a9eff',
  };

  constructor(data: NodeData) {
    this.id = data.id;
    this.type = data.type;
    this.position = { ...data.position };
    this.inputs = data.inputs || [];
    this.outputs = data.outputs || [];
  }

  /**
   * Draw the node
   */
  draw(ctx: CanvasRenderingContext2D): void {
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Draw border
    ctx.strokeStyle = this.selected ? this.style.selectedBorderColor : this.style.borderColor;
    ctx.lineWidth = this.style.borderWidth;
    ctx.fillStyle = this.style.backgroundColor;

    this.drawRoundedRect(
      ctx,
      this.position.x,
      this.position.y,
      this.style.width,
      this.style.height,
      this.style.borderRadius
    );

    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw header
    ctx.fillStyle = this.style.headerColor;
    ctx.beginPath();
    ctx.moveTo(this.position.x + this.style.borderRadius, this.position.y);
    ctx.lineTo(this.position.x + this.style.width - this.style.borderRadius, this.position.y);
    ctx.arcTo(
      this.position.x + this.style.width,
      this.position.y,
      this.position.x + this.style.width,
      this.position.y + this.style.borderRadius,
      this.style.borderRadius
    );
    ctx.lineTo(this.position.x + this.style.width, this.position.y + 30);
    ctx.lineTo(this.position.x, this.position.y + 30);
    ctx.lineTo(this.position.x, this.position.y + this.style.borderRadius);
    ctx.arcTo(
      this.position.x,
      this.position.y,
      this.position.x + this.style.borderRadius,
      this.position.y,
      this.style.borderRadius
    );
    ctx.closePath();
    ctx.fill();

    // Draw header text
    ctx.fillStyle = this.style.textColor;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getHeaderText(), this.position.x + 10, this.position.y + 15);

    // Draw ports
    this.drawPorts(ctx);

    // Draw content (implemented by subclasses)
    this.drawContent(ctx);
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  /**
   * Draw input/output ports
   */
  private drawPorts(ctx: CanvasRenderingContext2D): void {
    const portRadius = 6;

    // Draw inputs on left side
    this.inputs.forEach((port, index) => {
      const portPos = this.getPortPosition(port.id);
      if (!portPos) return;

      ctx.fillStyle = port.type === 'flow' ? '#4a9eff' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(portPos.x, portPos.y, portRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw outputs on right side
    this.outputs.forEach((port, index) => {
      const portPos = this.getPortPosition(port.id);
      if (!portPos) return;

      ctx.fillStyle = port.type === 'flow' ? '#4a9eff' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(portPos.x, portPos.y, portRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  /**
   * Get port position in world coordinates
   */
  getPortPosition(portId: string): { x: number; y: number } | null {
    const inputIndex = this.inputs.findIndex(p => p.id === portId);
    if (inputIndex !== -1) {
      const y = this.position.y + 50 + inputIndex * 25;
      return { x: this.position.x, y };
    }

    const outputIndex = this.outputs.findIndex(p => p.id === portId);
    if (outputIndex !== -1) {
      const y = this.position.y + 50 + outputIndex * 25;
      return { x: this.position.x + this.style.width, y };
    }

    return null;
  }

  /**
   * Check if point is inside node
   */
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.position.x &&
      x <= this.position.x + this.style.width &&
      y >= this.position.y &&
      y <= this.position.y + this.style.height
    );
  }

  /**
   * Check if point is on a port
   */
  getPortAtPoint(x: number, y: number): NodePort | null {
    const portRadius = 6;

    for (const port of [...this.inputs, ...this.outputs]) {
      const portPos = this.getPortPosition(port.id);
      if (!portPos) continue;

      const dx = x - portPos.x;
      const dy = y - portPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= portRadius * 2) {
        return port;
      }
    }

    return null;
  }

  /**
   * Start dragging
   */
  startDrag(mouseX: number, mouseY: number): void {
    this.dragging = true;
    this.dragOffset = {
      x: mouseX - this.position.x,
      y: mouseY - this.position.y,
    };
  }

  /**
   * Update drag position
   */
  updateDrag(mouseX: number, mouseY: number): void {
    if (this.dragging) {
      this.position.x = mouseX - this.dragOffset.x;
      this.position.y = mouseY - this.dragOffset.y;
    }
  }

  /**
   * Stop dragging
   */
  stopDrag(): void {
    this.dragging = false;
  }

  /**
   * Select node
   */
  select(): void {
    this.selected = true;
  }

  /**
   * Deselect node
   */
  deselect(): void {
    this.selected = false;
  }

  /**
   * Get bounds
   */
  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    return {
      minX: this.position.x,
      minY: this.position.y,
      maxX: this.position.x + this.style.width,
      maxY: this.position.y + this.style.height,
    };
  }

  /**
   * Export to data format
   */
  toData(): NodeData {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      inputs: [...this.inputs],
      outputs: [...this.outputs],
    };
  }

  /**
   * Update node properties
   */
  updateProperties(updates: Record<string, any>): void {
    // Base implementation - subclasses override for specific properties
    Object.assign(this, updates);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  abstract getHeaderText(): string;
  abstract drawContent(ctx: CanvasRenderingContext2D): void;
  abstract clone(): Node;
}
