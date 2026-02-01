/**
 * ConditionNode
 * Represents a conditional branch based on stats or flags
 */

import { Node } from '../Node.js';
import type { ConditionNode as ConditionNodeData, Condition } from '../../types/index.js';

export class ConditionNode extends Node {
  condition: Condition;
  trueOutputId: string;
  falseOutputId: string;

  constructor(data: ConditionNodeData) {
    super(data);

    this.condition = data.condition;
    this.trueOutputId = data.trueOutputId || `${this.id}-true`;
    this.falseOutputId = data.falseOutputId || `${this.id}-false`;

    // Condition nodes have one input and two outputs (true/false)
    if (this.inputs.length === 0) {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
    }

    this.outputs = [
      { id: this.trueOutputId, type: 'flow', label: 'True' },
      { id: this.falseOutputId, type: 'flow', label: 'False' },
    ];

    // Style
    this.style.height = 100;
    this.style.borderColor = '#8b5cf6';
    this.updateWidth();
  }

  /**
   * Update node width based on condition text
   */
  protected updateWidth(): void {
    const conditionText = this.formatCondition();
    // Center-aligned text needs extra padding on both sides
    this.style.width = this.calculateRequiredWidth([conditionText]) + 40;
  }

  getHeaderText(): string {
    return '? Condition';
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    // Draw condition text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const conditionText = this.formatCondition();
    ctx.fillText(conditionText, this.position.x + this.style.width / 2, this.position.y + 50);

    // Draw true/false labels
    ctx.fillStyle = '#4ade80';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✓ True', this.position.x + this.style.width - 15, this.position.y + 70);

    ctx.fillStyle = '#f87171';
    ctx.fillText('✗ False', this.position.x + this.style.width - 15, this.position.y + 85);
  }

  /**
   * Format condition for display
   */
  private formatCondition(): string {
    const { type, operator, target, value } = this.condition;

    switch (type) {
      case 'stat':
        return `${target} ${operator} ${value}`;
      case 'relationship':
        return `Rel: ${target} ${operator} ${value}`;
      case 'flag':
        return `Flag: ${target}`;
      case 'item':
        return `Has: ${target}`;
      case 'time':
        return `Time ${operator} ${value}`;
      default:
        return 'Condition';
    }
  }

  clone(): ConditionNode {
    return new ConditionNode({
      id: `${this.id}-copy`,
      type: 'condition',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      condition: { ...this.condition },
      trueOutputId: `${this.id}-copy-true`,
      falseOutputId: `${this.id}-copy-false`,
      inputs: [...this.inputs],
      outputs: [],
    });
  }

  toData(): ConditionNodeData {
    return {
      ...super.toData(),
      type: 'condition',
      condition: { ...this.condition },
      trueOutputId: this.trueOutputId,
      falseOutputId: this.falseOutputId,
    };
  }
}
