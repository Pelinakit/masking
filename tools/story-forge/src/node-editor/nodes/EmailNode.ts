/**
 * EmailNode
 * Represents an email event - can be scheduled (at specific time) or conditional (triggered by flow)
 */

import { Node } from '../Node.js';
import type { EmailNode as EmailNodeData, TriggerMode } from '../../types/index.js';

export class EmailNode extends Node {
  triggerMode: TriggerMode;
  time: string;
  from: string;
  subject: string;
  body: string;
  urgent: boolean;
  requiresResponse: boolean;

  constructor(data: EmailNodeData) {
    super(data);

    this.triggerMode = data.triggerMode || 'scheduled';
    this.time = data.time || '09:00';
    this.from = data.from || 'Unknown';
    this.subject = data.subject || 'No Subject';
    this.body = data.body || '';
    this.urgent = data.urgent ?? false;
    this.requiresResponse = data.requiresResponse ?? false;

    // Update ports based on trigger mode
    this.updatePorts();

    // Style - blue theme for emails
    this.style.height = 140;
    this.style.borderColor = this.triggerMode === 'scheduled' ? '#3b82f6' : '#8b5cf6';
    this.style.headerColor = this.triggerMode === 'scheduled' ? '#1e40af' : '#6d28d9';
  }

  /**
   * Update ports based on trigger mode
   */
  private updatePorts(): void {
    if (this.triggerMode === 'scheduled') {
      // Scheduled: no input port (triggered by time), has output
      this.inputs = [];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Read' }];
    } else {
      // Conditional: has input port (triggered by flow), has output
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Read' }];
    }
  }

  /**
   * Update trigger mode and refresh ports
   */
  setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode;
    this.updatePorts();
    this.style.borderColor = mode === 'scheduled' ? '#3b82f6' : '#8b5cf6';
    this.style.headerColor = mode === 'scheduled' ? '#1e40af' : '#6d28d9';
  }

  getHeaderText(): string {
    const urgentIcon = this.urgent ? '🔴 ' : '';
    const modeIcon = this.triggerMode === 'scheduled' ? '⏰' : '➡️';
    const timeStr = this.triggerMode === 'scheduled' ? ` @ ${this.time}` : '';
    return `📧 ${urgentIcon}${modeIcon}${timeStr}`;
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Draw trigger mode indicator
    ctx.fillStyle = this.triggerMode === 'scheduled' ? '#3b82f6' : '#8b5cf6';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.triggerMode === 'scheduled' ? 'SCHEDULED' : 'CONDITIONAL',
      x + this.style.width - 10,
      y + 25
    );

    // Draw from
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`From: ${this.from}`, x + 10, y + 40);

    // Draw subject
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(this.truncateString(this.subject, 25), x + 10, y + 58);

    // Draw body preview
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(this.truncateString(this.body, 30), x + 10, y + 78);

    // Draw badges
    let badgeX = x + 10;
    if (this.urgent) {
      this.drawBadge(ctx, badgeX, y + 105, 'URGENT', '#ef4444');
      badgeX += 60;
    }
    if (this.requiresResponse) {
      this.drawBadge(ctx, badgeX, y + 105, 'REPLY', '#f59e0b');
    }
  }

  private drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string): void {
    ctx.fillStyle = color;
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif';
    const padding = 4;
    const width = ctx.measureText(text).width + padding * 2;

    ctx.fillRect(x, y, width, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + padding, y + 10);
  }

  private truncateString(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  }

  updateProperties(updates: Record<string, any>): void {
    if ('triggerMode' in updates && updates.triggerMode !== this.triggerMode) {
      this.setTriggerMode(updates.triggerMode);
    }
    super.updateProperties(updates);
  }

  clone(): EmailNode {
    return new EmailNode({
      id: `${this.id}-copy`,
      type: 'email',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      triggerMode: this.triggerMode,
      time: this.time,
      from: this.from,
      subject: this.subject,
      body: this.body,
      urgent: this.urgent,
      requiresResponse: this.requiresResponse,
      inputs: [],
      outputs: [],
    });
  }

  toData(): EmailNodeData {
    return {
      ...super.toData(),
      type: 'email',
      triggerMode: this.triggerMode,
      time: this.time,
      from: this.from,
      subject: this.subject,
      body: this.body,
      urgent: this.urgent,
      requiresResponse: this.requiresResponse,
    };
  }
}
