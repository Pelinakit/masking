/**
 * Speech Sound Generator - Type Definitions
 * Standalone CLI tool for generating Animal Crossing/Undertale style speech sounds
 *
 * Emotion parameters based on acoustic research:
 * - Yildirim et al. (2004): Pitch values for emotions
 * - PMC3633948: Melodic and rhythmic contrasts
 * - Banse & Scherer (1996): 29 acoustic features of emotion
 */

/**
 * Voice types - each produces distinct phoneme-like sounds
 */
export type VoiceType = 'bweh' | 'buh' | 'pip' | 'meh';

/**
 * Emotional tones that modify pitch, tempo, and delivery
 */
export type EmotionalTone =
  | 'neutral'
  | 'bubbly'
  | 'sad'
  | 'stern'
  | 'angry'
  | 'snoring'
  | 'giggling'
  | 'laughing';

/**
 * Configuration for a single syllable sound
 */
export interface SyllableConfig {
  duration: number; // milliseconds
  pitchBase: number; // Hz
  pitchVariation: number; // Hz variance for natural sound
  waveform: OscillatorType; // oscillator waveform type
}

/**
 * Emotion-specific modifications to voice parameters
 * Based on acoustic research on emotional prosody
 */
export interface EmotionConfig {
  // Core parameters
  pitchMultiplier: number;      // 1.0 is baseline - affects mean pitch
  tempoMultiplier: number;      // 1.0 is baseline - affects syllable duration
  volumeMultiplier: number;     // 1.0 is baseline - affects loudness

  // Variation parameters (research shows these differ significantly by emotion)
  pitchVariation: number;       // 1.0 is baseline - pitch range/expressiveness
  pauseMultiplier: number;      // 1.0 is baseline - gap between syllables/words

  // Delivery style
  staccato: boolean;            // short, choppy delivery (anger, sternness)
  breathiness: number;          // 0-1, adds softer quality (sadness, tenderness)
  rhythmic: boolean;            // repeating pattern (laughing, snoring)
}

/**
 * Parsed syllable data from text
 */
export interface ParsedSyllable {
  text: string;
  isWordStart: boolean;
  isWordEnd: boolean;
  isSentenceStart: boolean;
  isSentenceEnd: boolean;
  pauseAfter: number; // milliseconds
}

/**
 * A scheduled sound event in the sequence
 */
export interface SoundEvent {
  startTime: number;
  duration: number;
  pitch: number;
  volume: number;
  waveform: OscillatorType;
}

/**
 * CLI generation options
 */
export interface GenerationOptions {
  text: string;
  voice: VoiceType;
  emotion: EmotionalTone;
  outputFile?: string;
  playback: boolean;
}

/**
 * Voice configuration lookup
 */
export const VOICE_CONFIGS: Record<VoiceType, SyllableConfig> = {
  bweh: {
    duration: 120,
    pitchBase: 300,
    pitchVariation: 50,
    waveform: 'sine',
  },
  buh: {
    duration: 140,
    pitchBase: 200,
    pitchVariation: 30,
    waveform: 'triangle',
  },
  pip: {
    duration: 80,
    pitchBase: 600,
    pitchVariation: 100,
    waveform: 'sine',
  },
  meh: {
    duration: 130,
    pitchBase: 180,
    pitchVariation: 8,
    waveform: 'sine',
  },
};

/**
 * Emotion configuration lookup
 *
 * Research-based parameters:
 * - Happy/Angry: ~25% higher pitch, faster, louder, MORE variation
 * - Sad: similar pitch but SLOWER, QUIETER, MORE PAUSES, LESS variation
 * - The perception of sadness comes from tempo/energy, not lower pitch
 */
export const EMOTION_CONFIGS: Record<EmotionalTone, EmotionConfig> = {
  neutral: {
    pitchMultiplier: 1.0,
    tempoMultiplier: 1.0,
    volumeMultiplier: 1.0,
    pitchVariation: 1.0,
    pauseMultiplier: 1.0,
    staccato: false,
    breathiness: 0,
    rhythmic: false,
  },

  // Happy/excited - research shows +25% pitch, faster, louder, high variation
  bubbly: {
    pitchMultiplier: 1.25,
    tempoMultiplier: 1.15,
    volumeMultiplier: 1.15,
    pitchVariation: 1.4,      // More expressive, wider range
    pauseMultiplier: 0.7,     // Shorter pauses - eager to speak
    staccato: false,
    breathiness: 0,
    rhythmic: false,
  },

  // Sad - research shows similar pitch, but slower, quieter, more pauses, flat
  sad: {
    pitchMultiplier: 0.95,    // Slightly lower (not dramatically)
    tempoMultiplier: 0.8,     // Slower but not dragging
    volumeMultiplier: 0.7,    // Quieter
    pitchVariation: 0.2,      // Very flat, monotone - key indicator of sadness
    pauseMultiplier: 1.4,     // Longer pauses - hesitant, low energy
    staccato: false,
    breathiness: 0.4,         // Softer, breathier quality
    rhythmic: false,
  },

  // Stern/serious - controlled, deliberate
  stern: {
    pitchMultiplier: 0.92,
    tempoMultiplier: 0.85,
    volumeMultiplier: 1.05,
    pitchVariation: 0.6,      // Controlled, less variation
    pauseMultiplier: 1.2,     // Deliberate pauses
    staccato: true,
    breathiness: 0,
    rhythmic: false,
  },

  // Angry - research shows +24% pitch, fast, LOUD, high variation
  angry: {
    pitchMultiplier: 1.2,     // Higher pitch (not lower!)
    tempoMultiplier: 1.2,     // Faster
    volumeMultiplier: 1.35,   // Much louder
    pitchVariation: 1.5,      // High variation - explosive
    pauseMultiplier: 0.5,     // Short pauses - urgent
    staccato: true,           // Sharp, clipped delivery
    breathiness: 0,
    rhythmic: false,
  },

  // Snoring - low, slow, rhythmic
  snoring: {
    pitchMultiplier: 0.5,
    tempoMultiplier: 0.5,
    volumeMultiplier: 0.6,
    pitchVariation: 0.3,
    pauseMultiplier: 2.0,
    staccato: false,
    breathiness: 0.6,
    rhythmic: true,
  },

  // Giggling - high, fast, staccato bursts
  giggling: {
    pitchMultiplier: 1.4,
    tempoMultiplier: 1.6,
    volumeMultiplier: 0.85,
    pitchVariation: 1.8,      // Very bouncy
    pauseMultiplier: 0.4,
    staccato: true,
    breathiness: 0.2,
    rhythmic: true,
  },

  // Laughing - rhythmic, expressive
  laughing: {
    pitchMultiplier: 1.15,
    tempoMultiplier: 1.1,
    volumeMultiplier: 1.2,
    pitchVariation: 1.6,
    pauseMultiplier: 0.6,
    staccato: false,
    breathiness: 0.15,
    rhythmic: true,
  },
};

/**
 * Timing constants
 */
export const TIMING = {
  syllableGap: 50,
  wordGap: 100,
  periodPause: 500,
  commaPause: 200,
  exclamationPause: 400,
  questionPause: 300,
};
