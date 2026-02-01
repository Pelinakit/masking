/**
 * Connection
 * Represents a connection between two nodes
 */

import type { Connection as ConnectionData } from '../types/index.js';
import type { Node } from './Node.js';

export class Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;

  private selected = false;

  constructor(data: ConnectionData) {
    this.id = data.id;
    this.sourceNodeId = data.sourceNodeId;
    this.sourcePortId = data.sourcePortId;
    this.targetNodeId = data.targetNodeId;
    this.targetPortId = data.targetPortId;
  }

  /**
   * Draw the connection
   */
  draw(ctx: CanvasRenderingContext2D, sourceNode: Node, targetNode: Node): void {
    const sourcePort = sourceNode.getPortPosition(this.sourcePortId);
    const targetPort = targetNode.getPortPosition(this.targetPortId);

    if (!sourcePort || !targetPort) {
      return;
    }

    // Draw bezier curve
    ctx.strokeStyle = this.selected ? '#4a9eff' : '#606060';
    ctx.lineWidth = this.selected ? 3 : 2;

    ctx.beginPath();
    ctx.moveTo(sourcePort.x, sourcePort.y);

    // Calculate control points for smooth curve
    const dx = Math.abs(targetPort.x - sourcePort.x);
    const offset = Math.min(dx * 0.5, 100);

    const cp1x = sourcePort.x + offset;
    const cp1y = sourcePort.y;
    const cp2x = targetPort.x - offset;
    const cp2y = targetPort.y;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetPort.x, targetPort.y);
    ctx.stroke();

    // Draw arrow at end
    this.drawArrow(ctx, cp2x, cp2y, targetPort.x, targetPort.y);
  }

  /**
   * Draw arrow at the end of connection
   */
  private drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;
    const arrowWidth = 6;

    ctx.fillStyle = this.selected ? '#4a9eff' : '#606060';

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Check if point is near connection (for selection)
   */
  isNearPoint(x: number, y: number, sourceNode: Node, targetNode: Node): boolean {
    const sourcePort = sourceNode.getPortPosition(this.sourcePortId);
    const targetPort = targetNode.getPortPosition(this.targetPortId);

    if (!sourcePort || !targetPort) {
      return false;
    }

    // Sample points along the bezier curve
    const samples = 20;
    const threshold = 10;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const point = this.getBezierPoint(t, sourcePort, targetPort);

      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get point on bezier curve at t (0-1)
   */
  private getBezierPoint(
    t: number,
    sourcePort: { x: number; y: number },
    targetPort: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = Math.abs(targetPort.x - sourcePort.x);
    const offset = Math.min(dx * 0.5, 100);

    const cp1x = sourcePort.x + offset;
    const cp1y = sourcePort.y;
    const cp2x = targetPort.x - offset;
    const cp2y = targetPort.y;

    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x:
        mt3 * sourcePort.x +
        3 * mt2 * t * cp1x +
        3 * mt * t2 * cp2x +
        t3 * targetPort.x,
      y:
        mt3 * sourcePort.y +
        3 * mt2 * t * cp1y +
        3 * mt * t2 * cp2y +
        t3 * targetPort.y,
    };
  }

  /**
   * Select connection
   */
  select(): void {
    this.selected = true;
  }

  /**
   * Deselect connection
   */
  deselect(): void {
    this.selected = false;
  }

  /**
   * Check if selected
   */
  isSelected(): boolean {
    return this.selected;
  }

  /**
   * Export to data format
   */
  toData(): ConnectionData {
    return {
      id: this.id,
      sourceNodeId: this.sourceNodeId,
      sourcePortId: this.sourcePortId,
      targetNodeId: this.targetNodeId,
      targetPortId: this.targetPortId,
    };
  }
}
