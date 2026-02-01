/**
 * DialogueNode
 * Represents a single line of dialogue from a character
 */

import { Node } from '../Node.js';
import type { DialogueNode as DialogueNodeData, Emotion } from '../../types/index.js';

export class DialogueNode extends Node {
  speaker: string;
  text: string;
  emotion: Emotion;

  constructor(data: DialogueNodeData) {
    super(data);

    this.speaker = data.speaker;
    this.text = data.text;
    this.emotion = data.emotion;

    // Dialogue nodes have one input and one output
    if (this.inputs.length === 0) {
      this.inputs = [{ id: `${this.id}-in`, type: 'flow' }];
    }
    if (this.outputs.length === 0) {
      this.outputs = [{ id: `${this.id}-out`, type: 'flow' }];
    }

    // Style
    this.style.height = 120;
    this.style.borderColor = '#9333ea';
  }

  getHeaderText(): string {
    return `💬 ${this.speaker || 'Dialogue'}`;
  }

  drawContent(ctx: CanvasRenderingContext2D): void {
    // Draw emotion indicator
    const emotionColor = this.getEmotionColor(this.emotion);
    ctx.fillStyle = emotionColor;
    ctx.fillRect(this.position.x + 10, this.position.y + 40, 4, 60);

    // Draw speaker text
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.emotion, this.position.x + 20, this.position.y + 40);

    // Draw dialogue text (truncated)
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    const maxWidth = this.style.width - 30;
    const truncated = this.truncateText(ctx, this.text, maxWidth, 2);

    truncated.forEach((line, index) => {
      ctx.fillText(line, this.position.x + 20, this.position.y + 60 + index * 20);
    });
  }

  /**
   * Get color for emotion
   */
  private getEmotionColor(emotion: Emotion): string {
    const colors: Record<string, string> = {
      neutral: '#a0a0a0',
      bubbly: '#4ade80',
      sad: '#60a5fa',
      stern: '#fbbf24',
      angry: '#f87171',
      giggling: '#fb923c',
      laughing: '#f472b6',
    };
    return colors[emotion] || colors.neutral;
  }

  /**
   * Truncate text to fit in node
   */
  private truncateText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;

        if (lines.length >= maxLines) {
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    // Add ellipsis to last line if truncated
    if (lines.length === maxLines && words.length > lines.join(' ').split(' ').length) {
      lines[lines.length - 1] = lines[lines.length - 1] + '...';
    }

    return lines;
  }

  clone(): DialogueNode {
    return new DialogueNode({
      id: `${this.id}-copy`,
      type: 'dialogue',
      position: { x: this.position.x + 20, y: this.position.y + 20 },
      speaker: this.speaker,
      text: this.text,
      emotion: this.emotion,
      inputs: [...this.inputs],
      outputs: [...this.outputs],
    });
  }

  toData(): DialogueNodeData {
    return {
      ...super.toData(),
      type: 'dialogue',
      speaker: this.speaker,
      text: this.text,
      emotion: this.emotion,
    };
  }
}
