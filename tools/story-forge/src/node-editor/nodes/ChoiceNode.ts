/**
 * ChoiceNode
 * Represents a branching choice for the player
 */

import { Node } from '../Node.js';
import type { ChoiceNode as ChoiceNodeData, ChoiceOption } from '../../types/index.js';

export class ChoiceNode extends Node {
  options: ChoiceOption[];

  constructor(data: ChoiceNodeData) {
    super(data);

    this.options = data.options || [];

    // Choice nodes have one input and multiple outputs (one per option)
    if (this.inputs.length === 0) {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
    }

    // Create outputs for each choice
    this.outputs = this.options.map((option, index) => ({
      id: option.outputPortId || `${this.id}-out-${index}`,
      type: 'flow',
      label: option.text.substring(0, 20),
    }));

    // Update option port IDs
    this.options.forEach((option, index) => {
      option.outputPortId = this.outputs[index].id;
    });

    // Style - height based on options only (no add button)
    this.style.height = Math.max(80, 50 + this.options.length * 30);
    this.style.borderColor = '#0ea5e9';
    this.updateWidth();
  }

  /**
   * Update node width based on option text content
   */
  protected updateWidth(): void {
    const optionTexts = this.options.map(opt => opt.text);
    // Add extra padding for bullet point (25px)
    this.style.width = this.calculateRequiredWidth(optionTexts) + 25;
  }

  getHeaderText(): string {
    return `⑂ Choice (${this.options.length})`;
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    // Draw options
    this.options.forEach((option, index) => {
      const y = this.position.y + 50 + index * 30;

      // Draw bullet point
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(this.position.x + 15, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw option text (truncated)
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const maxWidth = this.style.width - 40;
      const truncated = this.truncateText(ctx, option.text, maxWidth);
      ctx.fillText(truncated, this.position.x + 25, y);

      // Draw mask indicator if present
      if (option.mask) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`[${option.mask}]`, this.position.x + 25, y + 12);
      }
    });

  }

  /**
   * Truncate text to fit in node
   */
  private truncateText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
  }

  /**
   * Update properties from property panel
   */
  updateProperties(updates: Record<string, any>): void {
    if (updates.options) {
      this.options = updates.options;

      // Recreate outputs for each choice
      this.outputs = this.options.map((option, index) => ({
        id: option.outputPortId || `${this.id}-out-${index}`,
        type: 'flow' as const,
        label: option.text.substring(0, 20),
      }));

      // Update option port IDs
      this.options.forEach((option, index) => {
        option.outputPortId = this.outputs[index].id;
      });

      // Update size
      this.style.height = Math.max(80, 50 + this.options.length * 30);
      this.updateWidth();
    }
  }

  /**
   * Add a new option
   */
  addOption(text: string = 'New option'): void {
    const newOption: ChoiceOption = {
      id: `${this.id}-opt-${this.options.length}`,
      text,
      effects: [],
      outputPortId: `${this.id}-out-${this.options.length}`,
    };

    this.options.push(newOption);

    // Add output port
    this.outputs.push({
      id: newOption.outputPortId,
      type: 'flow',
      label: text.substring(0, 20),
    });

    // Update size
    this.style.height = Math.max(80, 50 + this.options.length * 30);
    this.updateWidth();
  }

  /**
   * Remove an option
   */
  removeOption(index: number): void {
    if (index >= 0 && index < this.options.length) {
      const option = this.options[index];

      // Remove option
      this.options.splice(index, 1);

      // Remove output port
      this.outputs = this.outputs.filter(p => p.id !== option.outputPortId);

      // Update size
      this.style.height = Math.max(80, 50 + this.options.length * 30);
      this.updateWidth();
    }
  }

  clone(): ChoiceNode {
    return new ChoiceNode({
      id: `${this.id}-copy`,
      type: 'choice',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      options: this.options.map(opt => ({ ...opt, id: `${opt.id}-copy` })),
      inputs: [...this.inputs],
      outputs: [],
    });
  }

  toData(): ChoiceNodeData {
    return {
      ...super.toData(),
      type: 'choice',
      options: this.options.map(opt => ({ ...opt })),
    };
  }
}
