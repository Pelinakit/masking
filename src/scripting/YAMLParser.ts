/**
 * YAMLParser
 * Script Interpretation layer - parses YAML narrative scripts
 */

import { parse } from 'yaml';

export interface DialogueNode {
  id: string;
  speaker?: string;
  text: string;
  choices?: Choice[];
  effects?: StatEffect[];
  next?: string;
}

export interface Choice {
  text: string;
  next: string;
  effects?: StatEffect[];
  condition?: string;
}

export interface StatEffect {
  stat: 'energy' | 'stress' | 'masking';
  delta: number;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

export class YAMLParser {
  parseStory(yamlContent: string): Story {
    try {
      const parsed = parse(yamlContent);
      return this.validateStory(parsed);
    } catch (error) {
      throw new Error(`Failed to parse YAML story: ${error}`);
    }
  }

  private validateStory(data: any): Story {
    if (!data.id || !data.title || !data.startNode || !data.nodes) {
      throw new Error('Invalid story format: missing required fields');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      startNode: data.startNode,
      nodes: data.nodes,
    };
  }
}
