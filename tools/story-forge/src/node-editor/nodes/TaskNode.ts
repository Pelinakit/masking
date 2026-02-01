/**
 * TaskNode
 * Represents a work task - can be scheduled (at specific time) or conditional (triggered by flow)
 */

import { Node } from '../Node.js';
import type { TaskNode as TaskNodeData, TriggerMode } from '../../types/index.js';

export class TaskNode extends Node {
  triggerMode: TriggerMode;
  time: string;
  deadline?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  energyCost: number;
  duration: number;

  constructor(data: TaskNodeData) {
    super(data);

    this.triggerMode = data.triggerMode || 'scheduled';
    this.time = data.time || '09:00';
    this.deadline = data.deadline;
    this.title = data.title || 'New Task';
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.energyCost = data.energyCost ?? 10;
    this.duration = data.duration ?? 30;

    // Update ports based on trigger mode
    this.updatePorts();

    // Style - orange theme for tasks
    this.style.height = 140;
    this.style.borderColor = this.triggerMode === 'scheduled' ? '#f97316' : '#8b5cf6';
    this.style.headerColor = this.triggerMode === 'scheduled' ? '#c2410c' : '#6d28d9';
  }

  private updatePorts(): void {
    if (this.triggerMode === 'scheduled') {
      this.inputs = [];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Complete' }];
    } else {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
      this.outputs = [{ id: `${this.id}-out`, type: 'flow', label: 'On Complete' }];
    }
  }

  setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode;
    this.updatePorts();
    this.style.borderColor = mode === 'scheduled' ? '#f97316' : '#8b5cf6';
    this.style.headerColor = mode === 'scheduled' ? '#c2410c' : '#6d28d9';
  }

  getHeaderText(): string {
    const priorityIcon = this.getPriorityIcon();
    const modeIcon = this.triggerMode === 'scheduled' ? '⏰' : '➡️';
    const timeStr = this.triggerMode === 'scheduled' ? ` @ ${this.time}` : '';
    return `📋 ${priorityIcon} ${modeIcon}${timeStr}`;
  }

  private getPriorityIcon(): string {
    switch (this.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  }

  private getPriorityColor(): string {
    switch (this.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
    }
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Draw trigger mode indicator
    ctx.fillStyle = this.triggerMode === 'scheduled' ? '#f97316' : '#8b5cf6';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.triggerMode === 'scheduled' ? 'SCHEDULED' : 'CONDITIONAL',
      x + this.style.width - 10,
      y + 25
    );

    // Draw priority indicator bar
    ctx.fillStyle = this.getPriorityColor();
    ctx.fillRect(x + 10, y + 38, 4, 80);

    // Draw title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.truncateString(this.title, 22), x + 20, y + 40);

    // Draw description
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(this.truncateString(this.description, 28), x + 20, y + 58);

    // Draw duration and deadline
    ctx.fillText(`⏱ ${this.duration} min`, x + 20, y + 78);
    if (this.deadline) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`⏰ Due: ${this.deadline}`, x + 100, y + 78);
    }

    // Draw energy cost
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`⚡ -${this.energyCost}`, x + 20, y + 100);
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

  clone(): TaskNode {
    return new TaskNode({
      id: `${this.id}-copy`,
      type: 'task',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      triggerMode: this.triggerMode,
      time: this.time,
      deadline: this.deadline,
      title: this.title,
      description: this.description,
      priority: this.priority,
      energyCost: this.energyCost,
      duration: this.duration,
      inputs: [],
      outputs: [],
    });
  }

  toData(): TaskNodeData {
    return {
      ...super.toData(),
      type: 'task',
      triggerMode: this.triggerMode,
      time: this.time,
      deadline: this.deadline,
      title: this.title,
      description: this.description,
      priority: this.priority,
      energyCost: this.energyCost,
      duration: this.duration,
    };
  }
}
