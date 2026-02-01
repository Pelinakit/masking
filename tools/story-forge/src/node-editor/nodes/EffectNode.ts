/**
 * EffectNode
 * Represents stat/relationship/flag changes
 */

import { Node } from '../Node.js';
import type { EffectNode as EffectNodeData, Effect } from '../../types/index.js';

export class EffectNode extends Node {
  effects: Effect[];

  constructor(data: EffectNodeData) {
    super(data);

    this.effects = data.effects || [];

    // Effect nodes have one input and one output
    if (this.inputs.length === 0) {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
    }
    if (this.outputs.length === 0) {
      this.outputs = [{ id: `${this.id}-out`, type: 'flow' }];
    }

    // Style
    this.style.height = Math.max(100, 60 + this.effects.length * 20);
    this.style.borderColor = '#10b981';
  }

  getHeaderText(): string {
    return `⚡ Effects (${this.effects.length})`;
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    // Draw effects
    this.effects.forEach((effect, index) => {
      const y = this.position.y + 50 + index * 20;

      // Draw effect icon
      const icon = this.getEffectIcon(effect.type);
      ctx.fillStyle = this.getEffectColor(effect.type);
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, this.position.x + 10, y);

      // Draw effect text
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      const effectText = this.formatEffect(effect);
      ctx.fillText(effectText, this.position.x + 30, y);
    });

    // Draw add effect button
    const addY = this.position.y + 50 + this.effects.length * 20;
    ctx.fillStyle = '#404040';
    ctx.fillRect(this.position.x + 10, addY, this.style.width - 20, 20);

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+ Add Effect', this.position.x + this.style.width / 2, addY + 10);
  }

  /**
   * Get icon for effect type
   */
  private getEffectIcon(type: string): string {
    const icons: Record<string, string> = {
      stat: '📊',
      relationship: '💬',
      flag: '🚩',
      item: '📦',
      scene: '🎬',
    };
    return icons[type] || '⚡';
  }

  /**
   * Get color for effect type
   */
  private getEffectColor(type: string): string {
    const colors: Record<string, string> = {
      stat: '#60a5fa',
      relationship: '#f472b6',
      flag: '#fbbf24',
      item: '#a78bfa',
      scene: '#10b981',
    };
    return colors[type] || '#e0e0e0';
  }

  /**
   * Format effect for display
   */
  private formatEffect(effect: Effect): string {
    const { type, target, operation, value } = effect;

    if (type === 'scene') {
      return `Go to: ${value}`;
    }

    if (!operation) {
      return `${target}: ${value}`;
    }

    return `${target} ${operation} ${value}`;
  }

  /**
   * Add a new effect
   */
  addEffect(effect: Effect): void {
    this.effects.push(effect);
    this.style.height = Math.max(100, 60 + this.effects.length * 20);
  }

  /**
   * Remove an effect
   */
  removeEffect(index: number): void {
    if (index >= 0 && index < this.effects.length) {
      this.effects.splice(index, 1);
      this.style.height = Math.max(100, 60 + this.effects.length * 20);
    }
  }

  clone(): EffectNode {
    return new EffectNode({
      id: `${this.id}-copy`,
      type: 'effect',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      effects: this.effects.map(e => ({ ...e })),
      inputs: [...this.inputs],
      outputs: [...this.outputs],
    });
  }

  toData(): EffectNodeData {
    return {
      ...super.toData(),
      type: 'effect',
      effects: this.effects.map(e => ({ ...e })),
    };
  }
}
