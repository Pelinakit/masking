/**
 * MeetingNode
 * Represents a meeting event - can be scheduled (at specific time) or conditional (triggered by flow)
 */

import { Node } from '../Node.js';
import type { MeetingNode as MeetingNodeData, TriggerMode } from '../../types/index.js';

export class MeetingNode extends Node {
  triggerMode: TriggerMode;
  time: string;
  duration: number;
  title: string;
  participants: string[];
  energyCost: number;
  stressCost: number;
  dialogueEntryId?: string;

  constructor(data: MeetingNodeData) {
    super(data);

    this.triggerMode = data.triggerMode || 'scheduled';
    this.time = data.time || '10:00';
    this.duration = data.duration ?? 30;
    this.title = data.title || 'Meeting';
    this.participants = data.participants || [];
    this.energyCost = data.energyCost ?? 15;
    this.stressCost = data.stressCost ?? 10;
    this.dialogueEntryId = data.dialogueEntryId;

    // Update ports based on trigger mode
    this.updatePorts();

    // Style - green theme for meetings
    this.style.height = 150;
    this.style.borderColor = this.triggerMode === 'scheduled' ? '#22c55e' : '#8b5cf6';
    this.style.headerColor = this.triggerMode === 'scheduled' ? '#15803d' : '#6d28d9';
  }

  private updatePorts(): void {
    if (this.triggerMode === 'scheduled') {
      this.inputs = [];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'After Meeting' }];
    } else {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'After Meeting' }];
    }
  }

  setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode;
    this.updatePorts();
    this.style.borderColor = mode === 'scheduled' ? '#22c55e' : '#8b5cf6';
    this.style.headerColor = mode === 'scheduled' ? '#15803d' : '#6d28d9';
  }

  getHeaderText(): string {
    const modeIcon = this.triggerMode === 'scheduled' ? '⏰' : '➡️';
    const timeStr = this.triggerMode === 'scheduled' ? ` @ ${this.time}` : '';
    return `📅 ${modeIcon}${timeStr}`;
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Draw trigger mode indicator
    ctx.fillStyle = this.triggerMode === 'scheduled' ? '#22c55e' : '#8b5cf6';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.triggerMode === 'scheduled' ? 'SCHEDULED' : 'CONDITIONAL',
      x + this.style.width - 10,
      y + 25
    );

    // Draw title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.truncateString(this.title, 25), x + 10, y + 40);

    // Draw duration
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`Duration: ${this.duration} min`, x + 10, y + 58);

    // Draw participants
    const participantsText = this.participants.length > 0
      ? this.participants.slice(0, 2).join(', ') + (this.participants.length > 2 ? '...' : '')
      : 'No participants';
    ctx.fillText(`👥 ${participantsText}`, x + 10, y + 75);

    // Draw costs
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`⚡ -${this.energyCost}`, x + 10, y + 98);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`😰 +${this.stressCost}`, x + 80, y + 98);

    // Draw time block indicator
    ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
    const blockWidth = Math.min(this.duration * 2, this.style.width - 20);
    ctx.fillRect(x + 10, y + 120, blockWidth, 10);
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(x + 10, y + 120, blockWidth, 10);
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

  clone(): MeetingNode {
    return new MeetingNode({
      id: `${this.id}-copy`,
      type: 'meeting',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      triggerMode: this.triggerMode,
      time: this.time,
      duration: this.duration,
      title: this.title,
      participants: [...this.participants],
      energyCost: this.energyCost,
      stressCost: this.stressCost,
      dialogueEntryId: this.dialogueEntryId,
      inputs: [],
      outputs: [],
    });
  }

  toData(): MeetingNodeData {
    return {
      ...super.toData(),
      type: 'meeting',
      triggerMode: this.triggerMode,
      time: this.time,
      duration: this.duration,
      title: this.title,
      participants: this.participants,
      energyCost: this.energyCost,
      stressCost: this.stressCost,
      dialogueEntryId: this.dialogueEntryId,
    };
  }
}
