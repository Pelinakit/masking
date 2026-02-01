/**
 * Story Forge Type Definitions
 */

// ============================================================================
// Project Structure
// ============================================================================

export interface StoryProject {
  name: string;
  characters: Character[];
  arcs: StoryArc[];
  weeks: Week[];
  assets: AssetRegistry;
}

export interface Character {
  id: string;
  name: string;
  species: string;
  voice: VoiceConfig;
  defaultEmotion: Emotion;
  spritePath: string;
  relationships: RelationshipConfig;
}

export interface VoiceConfig {
  type: 'bweh' | 'buh' | 'pip' | 'meh';
  pitchOffset: number;
  speedOffset: number;
}

// Matches speech-gen EmotionalTone for voice preview compatibility
export type Emotion = 'neutral' | 'bubbly' | 'sad' | 'stern' | 'angry' | 'giggling' | 'laughing';

export interface RelationshipConfig {
  defaultValue: number;
  min: number;
  max: number;
}

export interface Week {
  number: number;
  days: DayReference[];
}

export interface DayReference {
  id: string;
  name: string; // "Monday", "Tuesday", etc.
  filePath: string;
  arcs: string[]; // Arc IDs this day touches
  summary: DaySummary;
}

export interface DaySummary {
  emailCount: number;
  meetingCount: number;
  taskCount: number;
  eventCount: number;
  totalEnergyDrain: number;
  totalStressGain: number;
}

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  color: string; // For timeline visualization
  dayIds: string[];
}

export interface AssetRegistry {
  sprites: AssetReference[];
  backgrounds: AssetReference[];
  sounds: AssetReference[];
}

export interface AssetReference {
  id: string;
  path: string;
  type: 'sprite' | 'background' | 'sound';
  tags: string[];
}

// ============================================================================
// Node Editor
// ============================================================================

export type NodeType = 'dialogue' | 'choice' | 'condition' | 'effect' | 'event' | 'email' | 'meeting' | 'task' | 'message';

export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  inputs: NodePort[];
  outputs: NodePort[];
}

export interface NodePort {
  id: string;
  type: 'flow' | 'data';
  label?: string;
}

export interface DialogueNode extends BaseNode {
  type: 'dialogue';
  speaker: string; // Character ID
  text: string;
  emotion: Emotion;
  voiceOverride?: Partial<VoiceConfig>;
}

export interface ChoiceNode extends BaseNode {
  type: 'choice';
  options: ChoiceOption[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  mask?: string;
  conditions?: Condition[];
  effects: Effect[];
  outputPortId: string;
}

export interface ConditionNode extends BaseNode {
  type: 'condition';
  condition: Condition;
  trueOutputId: string;
  falseOutputId: string;
}

export interface EffectNode extends BaseNode {
  type: 'effect';
  effects: Effect[];
}

// ============================================================================
// Game-Specific Timed Event Nodes
// ============================================================================

// Trigger mode for timed events
export type TriggerMode = 'scheduled' | 'conditional';

export interface EmailNode extends BaseNode {
  type: 'email';
  triggerMode: TriggerMode;  // 'scheduled' = happens at time, 'conditional' = triggered by flow
  time: string;              // HH:MM format - when email arrives (only for scheduled)
  from: string;              // Character ID
  subject: string;
  body: string;
  urgent: boolean;
  requiresResponse: boolean;
}

export interface MeetingNode extends BaseNode {
  type: 'meeting';
  triggerMode: TriggerMode;
  time: string;              // HH:MM format - meeting start time
  duration: number;          // minutes
  title: string;
  participants: string[];    // Character IDs
  energyCost: number;
  stressCost: number;
  dialogueEntryId?: string;  // ID of dialogue node to start on enter
}

export interface TaskNode extends BaseNode {
  type: 'task';
  triggerMode: TriggerMode;
  time: string;              // HH:MM format - when task becomes available
  deadline?: string;         // HH:MM format - deadline (if any)
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  energyCost: number;
  duration: number;          // minutes to complete
}

export interface MessageNode extends BaseNode {
  type: 'message';
  triggerMode: TriggerMode;
  time: string;              // HH:MM format - when message arrives
  channel: 'slack' | 'teams' | 'chat';
  from: string;              // Character ID
  text: string;
  requiresResponse: boolean;
}

export interface EventNode extends BaseNode {
  type: 'event';
  eventType: 'email' | 'meeting' | 'task' | 'random';
  eventData: EmailEvent | MeetingEvent | TaskEvent | RandomEvent;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface NodeGraph {
  nodes: BaseNode[];
  connections: Connection[];
  metadata: {
    entryNodeId: string;
    title: string;
    tags: string[];
  };
}

// ============================================================================
// Game Content (mirrors YAML structure)
// ============================================================================

export interface Condition {
  type: 'stat' | 'relationship' | 'flag' | 'item' | 'time';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  target?: string;
  value: number | string | boolean;
}

export interface Effect {
  type: 'stat' | 'relationship' | 'flag' | 'item' | 'scene';
  target: string;
  operation?: '+' | '-' | '=';
  value: number | string | boolean;
}

export interface EmailEvent {
  from: string;
  subject: string;
  body: string;
  time: string; // HH:MM format
  urgent: boolean;
  requiresResponse?: boolean;
}

export interface MeetingEvent {
  title: string;
  time: string;
  duration: number; // minutes
  participants: string[]; // Character IDs
  dialogueGraphId: string;
}

export interface TaskEvent {
  title: string;
  description: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  energyCost: number;
  duration: number; // minutes
}

export interface RandomEvent {
  id: string;
  weight: number;
  conditions?: Condition[];
  dialogueGraphId: string;
}

// ============================================================================
// UI State
// ============================================================================

export interface AppState {
  currentView: ViewType;
  currentProject: StoryProject | null;
  currentDayId: string | null;
  currentGraph: NodeGraph | null;
  selectedNodeId: string | null;
  clipboard: BaseNode | null;
  history: HistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
}

export type ViewType = 'timeline' | 'editor' | 'characters' | 'arcs' | 'assets' | 'validate';

export interface HistoryEntry {
  timestamp: number;
  action: string;
  state: Partial<AppState>;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'syntax' | 'schema' | 'reference' | 'logic';
  message: string;
  location?: {
    file?: string;
    line?: number;
    nodeId?: string;
  };
}

export interface ValidationWarning {
  type: 'missing-asset' | 'dead-end' | 'stat-balance' | 'continuity';
  message: string;
  location?: {
    file?: string;
    line?: number;
    nodeId?: string;
  };
}
