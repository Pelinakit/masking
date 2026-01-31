/**
 * YAMLParser
 * Script Interpretation layer - parses YAML narrative scripts
 */

import { load } from 'js-yaml';
import { StatName } from '@game/systems/StatSystem';
import { MaskType } from '@game/StateManager';

// Scene Script Types
export interface SceneHotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: string;
  label?: string;
  condition?: string;
}

export interface SceneScript {
  id: string;
  name: string;
  background: string;
  hotspots: SceneHotspot[];
  ambientSound?: string;
}

// NPC Script Types
export interface NPCScript {
  id: string;
  name: string;
  species: string;
  role: string;
  portrait?: string;
  affinity: number;
  dialogues: Record<string, DialogueNode>;
}

// Dialogue Types
export interface DialogueNode {
  id: string;
  speaker?: string;
  text: string;
  choices?: Choice[];
  effects?: Effect[];
  next?: string;
  condition?: string;
}

export interface Choice {
  text: string;
  next: string;
  effects?: Effect[];
  condition?: string;
  maskRequirement?: MaskType;
}

export interface Effect {
  type: 'stat' | 'relationship' | 'item' | 'unlock' | 'scene' | 'time';
  target?: string;
  value?: number | string;
  stat?: StatName;
  delta?: number;
}

// Event Script Types
export interface EventScript {
  id: string;
  title: string;
  description: string;
  triggerTime?: {
    hour: number;
    minute: number;
    dayOfWeek?: string;
  };
  condition?: string;
  sequence: EventSequenceNode[];
}

export interface EventSequenceNode {
  type: 'dialogue' | 'choice' | 'effect' | 'scene' | 'wait';
  data: any;
  delay?: number;
}

// Email Types
export interface EmailScript {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: {
    hour: number;
    minute: number;
  };
  actions?: EmailAction[];
  important?: boolean;
}

export interface EmailAction {
  label: string;
  effects: Effect[];
}

// Meeting Types
export interface MeetingScript {
  id: string;
  title: string;
  participants: string[];
  startTime: {
    hour: number;
    minute: number;
  };
  duration: number; // Game hours
  meetingType: string;
  recommendedMask: MaskType;
  events: MeetingEvent[];
}

export interface MeetingEvent {
  timestamp: number; // Minutes into meeting
  speaker: string;
  dialogue: string;
  choices?: Choice[];
  effects?: Effect[];
}

export class YAMLParser {
  /**
   * Parse a scene script
   */
  parseScene(yamlContent: string): SceneScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateScene(data);
    } catch (error) {
      throw new Error(`Failed to parse scene YAML: ${error}`);
    }
  }

  /**
   * Parse an NPC script
   */
  parseNPC(yamlContent: string): NPCScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateNPC(data);
    } catch (error) {
      throw new Error(`Failed to parse NPC YAML: ${error}`);
    }
  }

  /**
   * Parse an event script
   */
  parseEvent(yamlContent: string): EventScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateEvent(data);
    } catch (error) {
      throw new Error(`Failed to parse event YAML: ${error}`);
    }
  }

  /**
   * Parse an email script
   */
  parseEmail(yamlContent: string): EmailScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateEmail(data);
    } catch (error) {
      throw new Error(`Failed to parse email YAML: ${error}`);
    }
  }

  /**
   * Parse a meeting script
   */
  parseMeeting(yamlContent: string): MeetingScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateMeeting(data);
    } catch (error) {
      throw new Error(`Failed to parse meeting YAML: ${error}`);
    }
  }

  /**
   * Load YAML file from path (async)
   */
  async loadFile(path: string): Promise<string> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load YAML file: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load YAML file from ${path}: ${error}`);
    }
  }

  /**
   * Validate scene data
   */
  private validateScene(data: any): SceneScript {
    if (!data.id || !data.name) {
      throw new Error('Scene requires id and name');
    }

    return {
      id: data.id,
      name: data.name,
      background: data.background || '',
      hotspots: data.hotspots || [],
      ambientSound: data.ambientSound,
    };
  }

  /**
   * Validate NPC data
   */
  private validateNPC(data: any): NPCScript {
    if (!data.id || !data.name) {
      throw new Error('NPC requires id and name');
    }

    return {
      id: data.id,
      name: data.name,
      species: data.species || 'cat',
      role: data.role || 'unknown',
      portrait: data.portrait,
      affinity: data.affinity ?? 50,
      dialogues: data.dialogues || {},
    };
  }

  /**
   * Validate event data
   */
  private validateEvent(data: any): EventScript {
    if (!data.id || !data.title) {
      throw new Error('Event requires id and title');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      triggerTime: data.triggerTime,
      condition: data.condition,
      sequence: data.sequence || [],
    };
  }

  /**
   * Validate email data
   */
  private validateEmail(data: any): EmailScript {
    if (!data.id || !data.from || !data.subject) {
      throw new Error('Email requires id, from, and subject');
    }

    return {
      id: data.id,
      from: data.from,
      subject: data.subject,
      body: data.body || '',
      timestamp: data.timestamp || { hour: 9, minute: 0 },
      actions: data.actions || [],
      important: data.important || false,
    };
  }

  /**
   * Validate meeting data
   */
  private validateMeeting(data: any): MeetingScript {
    if (!data.id || !data.title) {
      throw new Error('Meeting requires id and title');
    }

    return {
      id: data.id,
      title: data.title,
      participants: data.participants || [],
      startTime: data.startTime || { hour: 10, minute: 0 },
      duration: data.duration || 1,
      meetingType: data.meetingType || 'general',
      recommendedMask: data.recommendedMask || 'meetingParticipant',
      events: data.events || [],
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const yamlParser = new YAMLParser();
