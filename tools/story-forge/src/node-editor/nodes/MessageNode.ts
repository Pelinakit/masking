/**
 * MessageNode
 * Represents a chat message (Slack, Teams, etc.) - can be scheduled or conditional
 */

import { Node } from '../Node.js';
import type { MessageNode as MessageNodeData, TriggerMode } from '../../types/index.js';

export class MessageNode extends Node {
  triggerMode: TriggerMode;
  time: string;
  channel: 'slack' | 'teams' | 'chat';
  from: string;
  text: string;
  requiresResponse: boolean;

  constructor(data: MessageNodeData) {
    super(data);

    this.triggerMode = data.triggerMode || 'scheduled';
    this.time = data.time || '09:00';
    this.channel = data.channel || 'slack';
    this.from = data.from || 'Unknown';
    this.text = data.text || '';
    this.requiresResponse = data.requiresResponse ?? false;

    // Update ports based on trigger mode
    this.updatePorts();

    // Style - purple theme for messages
    this.style.height = 120;
    this.style.borderColor = this.triggerMode === 'scheduled' ? '#a855f7' : '#8b5cf6';
    this.style.headerColor = this.triggerMode === 'scheduled' ? '#7e22ce' : '#6d28d9';
  }

  private updatePorts(): void {
    if (this.triggerMode === 'scheduled') {
      this.inputs = [];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Read' }];
    } else {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Read' }];
    }
  }

  setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode;
    this.updatePorts();
  }

  getHeaderText(): string {
    const channelIcon = this.getChannelIcon();
    const modeIcon = this.triggerMode === 'scheduled' ? '⏰' : '➡️';
    const timeStr = this.triggerMode === 'scheduled' ? ` @ ${this.time}` : '';
    return `${channelIcon} ${modeIcon}${timeStr}`;
  }

  private getChannelIcon(): string {
    switch (this.channel) {
      case 'slack': return '💬';
      case 'teams': return '👥';
      case 'chat': return '🗨️';
    }
  }

  private getChannelColor(): string {
    switch (this.channel) {
      case 'slack': return '#611f69';
      case 'teams': return '#464eb8';
      case 'chat': return '#128c7e';
    }
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Draw trigger mode indicator
    ctx.fillStyle = this.triggerMode === 'scheduled' ? '#a855f7' : '#8b5cf6';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.triggerMode === 'scheduled' ? 'SCHEDULED' : 'CONDITIONAL',
      x + this.style.width - 10,
      y + 25
    );

    // Draw channel indicator
    ctx.fillStyle = this.getChannelColor();
    ctx.fillRect(x + 10, y + 38, 4, 55);

    // Draw from
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`From: ${this.from}`, x + 20, y + 40);

    // Draw message text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    const lines = this.wrapText(ctx, this.text, this.style.width - 40, 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, x + 20, y + 58 + i * 15);
    });

    // Draw reply badge
    if (this.requiresResponse) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillRect(x + 10, y + 95, 45, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('REPLY', x + 14, y + 105);
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    if (lines.length === maxLines && text.length > lines.join(' ').length) {
      lines[lines.length - 1] = lines[lines.length - 1].substring(0, lines[lines.length - 1].length - 3) + '...';
    }

    return lines;
  }

  updateProperties(updates: Record<string, any>): void {
    if ('triggerMode' in updates && updates.triggerMode !== this.triggerMode) {
      this.setTriggerMode(updates.triggerMode);
    }
    super.updateProperties(updates);
  }

  clone(): MessageNode {
    return new MessageNode({
      id: `${this.id}-copy`,
      type: 'message',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      triggerMode: this.triggerMode,
      time: this.time,
      channel: this.channel,
      from: this.from,
      text: this.text,
      requiresResponse: this.requiresResponse,
      inputs: [],
      outputs: [],
    });
  }

  toData(): MessageNodeData {
    return {
      ...super.toData(),
      type: 'message',
      triggerMode: this.triggerMode,
      time: this.time,
      channel: this.channel,
      from: this.from,
      text: this.text,
      requiresResponse: this.requiresResponse,
    };
  }
}
