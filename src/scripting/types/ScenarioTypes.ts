/**
 * TypeScript interfaces for day scenario YAML files
 * Defines the structure of a complete in-game day
 */

// ============================================================================
// Scenario Metadata
// ============================================================================

export interface ScenarioMetadata {
  day: string; // e.g., "Monday", "Tuesday"
  week: number;
  difficulty?: 'easy' | 'normal' | 'hard';
}

// ============================================================================
// Email System
// ============================================================================

export interface EmailDefinition {
  id: string;
  from: string;
  subject: string;
  time: string; // HH:MM format
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  body: string;
  requiresResponse?: boolean;
}

// ============================================================================
// Meeting System
// ============================================================================

export interface MeetingParticipant {
  name: string;
  role: string;
  mood: 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious';
}

export interface MeetingChoice {
  text: string;
  mask?: string;
  energyCost: number;
  stressCost?: number;
  consequence: string;
  effects?: ChoiceEffect[];
}

export interface ChoiceEffect {
  type: 'stat' | 'relationship' | 'flag' | 'item';
  target: string;
  operation: '+' | '-' | '=';
  value: number | string | boolean;
}

export interface MeetingEvent {
  time: number; // Minutes into meeting
  type: 'question' | 'discussion' | 'presentation' | 'announcement';
  speaker: string;
  text: string;
  choices?: MeetingChoice[];
}

export interface MeetingDefinition {
  id: string;
  title: string;
  time: string; // HH:MM format
  duration: number; // Minutes
  type: 'team-meeting' | 'one-on-one' | 'client-meeting' | 'presentation' | 'social';
  required_mask?: string;
  optional?: boolean;
  participants: MeetingParticipant[];
  events: MeetingEvent[];
}

// ============================================================================
// Task System
// ============================================================================

export interface TaskDefinition {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  energyCost: number;
  timeRequired: number; // Minutes
  deadline: string | null; // HH:MM format or null for no deadline
  completed: boolean;
  consequence_success?: string;
  consequence_failure?: string;
}

// ============================================================================
// Random Events
// ============================================================================

export interface EventChoice {
  text: string;
  energyCost?: number;
  stressCost?: number;
  timeCost?: number;
  hungerCost?: number;
  happinessCost?: number;
  consequence: string;
  effects?: ChoiceEffect[];
}

export interface EventDefinition {
  id: string;
  time: string; // HH:MM format
  type: 'notification' | 'choice' | 'cutscene' | 'interaction';
  title: string;
  description: string;
  condition?: string; // e.g., "energy < 30"
  choices?: EventChoice[];
  weight?: number; // For random event selection
}

// ============================================================================
// End of Day Evaluation
// ============================================================================

export interface DayEndCondition {
  conditions: string[];
  reward?: {
    happiness?: number;
    energy?: number;
    message: string;
  };
  consequence?: {
    message: string;
    effects?: ChoiceEffect[];
  };
}

export interface EndOfDayConfig {
  success_conditions?: string[];
  perfect_day?: DayEndCondition;
  burnout_warning?: DayEndCondition;
  overtime_threshold?: number; // Minutes past 17:00
}

// ============================================================================
// Complete Day Scenario
// ============================================================================

export interface DayScenario {
  metadata: ScenarioMetadata;
  emails: EmailDefinition[];
  meetings: MeetingDefinition[];
  tasks: TaskDefinition[];
  events: EventDefinition[];
  end_of_day: EndOfDayConfig;
}

// ============================================================================
// Runtime State (for tracking progress through a day)
// ============================================================================

export interface ScenarioState {
  currentDay: string;
  currentWeek: number;
  startTime: string; // When the day started

  // Track what's happened
  emailsReceived: Set<string>;
  emailsRead: Set<string>;
  meetingsAttended: Set<string>;
  meetingsSkipped: Set<string>;
  tasksCompleted: Set<string>;
  eventsTriggered: Set<string>;

  // Track choices made
  choicesMade: Map<string, string>; // event/meeting ID -> choice text

  // Cumulative effects
  totalEnergySpent: number;
  totalStressGained: number;
  totalTimeTaken: number; // Minutes
}
