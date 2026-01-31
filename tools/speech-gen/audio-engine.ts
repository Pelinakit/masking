/**
 * Audio Engine
 * Generates synthesized speech with natural English prosody
 *
 * Key patterns:
 * - Stress timing: stressed syllables ~2x longer than unstressed
 * - Content words stressed, function words reduced
 * - Intonation: falling for statements, rising for questions
 */

import {
  VoiceType,
  EmotionalTone,
  ParsedSyllable,
  VOICE_CONFIGS,
  EMOTION_CONFIGS,
} from './types';

const SAMPLE_RATE = 44100;
const CHANNELS = 1;

/**
 * Common English function words (unstressed, reduced)
 */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the',
  'at', 'by', 'for', 'from', 'in', 'of', 'on', 'to', 'with',
  'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'we', 'us', 'our', 'they', 'them', 'their',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'and', 'or', 'but', 'if', 'so', 'as', 'that', 'than',
  'not', "n't", 'just', 'very', 'too',
]);

const VOWEL_PROPERTIES: Record<string, { pitchMod: number; lengthMod: number; brightness: number }> = {
  'a': { pitchMod: 1.0, lengthMod: 1.1, brightness: 0.3 },
  'e': { pitchMod: 1.08, lengthMod: 0.9, brightness: 0.5 },
  'i': { pitchMod: 1.2, lengthMod: 0.85, brightness: 0.7 },
  'o': { pitchMod: 0.92, lengthMod: 1.2, brightness: 0.25 },
  'u': { pitchMod: 0.88, lengthMod: 1.0, brightness: 0.2 },
  'y': { pitchMod: 1.1, lengthMod: 0.9, brightness: 0.55 },
  'ä': { pitchMod: 1.02, lengthMod: 1.0, brightness: 0.4 },
  'ö': { pitchMod: 0.95, lengthMod: 1.0, brightness: 0.35 },
  'å': { pitchMod: 0.9, lengthMod: 1.15, brightness: 0.25 },
};

const SOFT_CONSONANTS = new Set(['l', 'm', 'n', 'r', 'w', 'y']);

function isVowel(char: string): boolean {
  return char.toLowerCase() in VOWEL_PROPERTIES;
}

function isContentWord(word: string): boolean {
  return !FUNCTION_WORDS.has(word.toLowerCase());
}

/**
 * Unstressed prefixes - words starting with these typically stress the second syllable
 */
const UNSTRESSED_PREFIXES = [
  'a', 'be', 'de', 're', 'pre', 'pro', 'dis', 'mis', 'un', 'en', 'em', 'ex',
  'com', 'con', 'per', 'sur', 'trans', 'sub', 'ob', 'ad', 'ab', 'in', 'im',
];

/**
 * Common words with second-syllable stress (exceptions to first-syllable default)
 */
const SECOND_SYLLABLE_STRESS = new Set([
  'hello', 'about', 'again', 'above', 'across', 'against', 'along', 'among',
  'around', 'away', 'because', 'become', 'before', 'begin', 'behind', 'believe',
  'below', 'between', 'beyond', 'today', 'tonight', 'tomorrow', 'together',
  'upon', 'without', 'within', 'perhaps', 'enough', 'indeed', 'itself',
  'myself', 'yourself', 'himself', 'herself', 'themselves', 'ourselves',
  'ago', 'alone', 'asleep', 'awake', 'aware',
]);

/**
 * Determine which syllable in a word should be stressed
 * Returns the 0-based index of the stressed syllable
 */
function getStressedSyllableIndex(word: string, syllableCount: number): number {
  const lower = word.toLowerCase();

  // Single syllable - it's stressed
  if (syllableCount === 1) return 0;

  // Check known exceptions
  if (SECOND_SYLLABLE_STRESS.has(lower)) return 1;

  // Check for unstressed prefixes
  for (const prefix of UNSTRESSED_PREFIXES) {
    if (lower.startsWith(prefix) && lower.length > prefix.length + 2) {
      return 1; // Stress second syllable
    }
  }

  // Default: stress first syllable for 2-syllable words
  // For 3+ syllables, often first or second
  if (syllableCount === 2) return 0;

  // For longer words, often stress is on first or second syllable
  return 0;
}

interface SyllableAnalysis {
  syllable: ParsedSyllable;
  wordText: string;
  syllableIndexInWord: number;
  wordSyllableCount: number;
  sentenceIndex: number;
  indexInSentence: number;
  sentenceLength: number;
  isQuestion: boolean;
}

/**
 * First pass: group syllables into words and sentences
 */
function analyzeSyllables(syllables: ParsedSyllable[]): SyllableAnalysis[] {
  const result: SyllableAnalysis[] = [];

  let currentWord: ParsedSyllable[] = [];
  let currentSentence: SyllableAnalysis[] = [];
  let sentenceIndex = 0;

  for (const syllable of syllables) {
    currentWord.push(syllable);

    if (syllable.isWordEnd) {
      // Complete the word
      const wordText = currentWord.map(s => s.text).join('');

      for (let i = 0; i < currentWord.length; i++) {
        currentSentence.push({
          syllable: currentWord[i],
          wordText,
          syllableIndexInWord: i,
          wordSyllableCount: currentWord.length,
          sentenceIndex,
          indexInSentence: currentSentence.length,
          sentenceLength: 0, // Will be filled in later
          isQuestion: false, // Will be filled in later
        });
      }

      currentWord = [];
    }

    if (syllable.isSentenceEnd) {
      // Detect if question (pauseAfter of 300ms)
      const isQuestion = syllable.pauseAfter === 300;

      // Fill in sentence info
      for (const item of currentSentence) {
        item.sentenceLength = currentSentence.length;
        item.isQuestion = isQuestion;
      }

      result.push(...currentSentence);
      currentSentence = [];
      sentenceIndex++;
    }
  }

  // Handle any remaining syllables
  if (currentWord.length > 0) {
    const wordText = currentWord.map(s => s.text).join('');
    for (let i = 0; i < currentWord.length; i++) {
      currentSentence.push({
        syllable: currentWord[i],
        wordText,
        syllableIndexInWord: i,
        wordSyllableCount: currentWord.length,
        sentenceIndex,
        indexInSentence: currentSentence.length,
        sentenceLength: 0,
        isQuestion: false,
      });
    }
  }

  if (currentSentence.length > 0) {
    for (const item of currentSentence) {
      item.sentenceLength = currentSentence.length;
    }
    result.push(...currentSentence);
  }

  return result;
}

/**
 * Calculate prosodic properties for a syllable
 */
function calculateProsody(
  analysis: SyllableAnalysis,
  voiceConfig: typeof VOICE_CONFIGS[VoiceType],
  emotionConfig: typeof EMOTION_CONFIGS[EmotionalTone]
): {
  duration: number;
  pitch: number;
  volume: number;
  brightness: number;
  softness: number;
  breathiness: number;
} {
  const text = analysis.syllable.text.toLowerCase();

  // Find primary vowel
  let vowel: string | null = null;
  let vowelCount = 0;
  for (const char of text) {
    if (isVowel(char)) {
      if (!vowel) vowel = char;
      vowelCount++;
    }
  }

  const vowelProps = vowel ? VOWEL_PROPERTIES[vowel] : { pitchMod: 1, lengthMod: 1, brightness: 0.3 };

  // Determine stress
  const isContent = isContentWord(analysis.wordText);
  let isStressed = false;

  if (isContent) {
    const stressedIndex = getStressedSyllableIndex(analysis.wordText, analysis.wordSyllableCount);
    isStressed = analysis.syllableIndexInWord === stressedIndex;
  }

  // Duration - stressed ~1.6x longer, unstressed slightly shorter but not clipped
  let durationMod = vowelProps.lengthMod;
  if (isStressed) {
    durationMod *= 1.5;
  } else {
    durationMod *= 0.85; // Not too short - keep it natural
  }
  if (vowelCount >= 2) durationMod *= 1.25;
  if (analysis.syllable.isWordEnd) durationMod *= 1.1;

  // Softness from consonants
  let softness = 0.35;
  let softCount = 0;
  for (const char of text) {
    if (SOFT_CONSONANTS.has(char)) softCount++;
  }
  if (softCount >= 2) {
    durationMod *= 1.08;
    softness = 0.55;
  } else if (softCount === 1) {
    softness = 0.45;
  }

  // Unstressed syllables should still be smooth, not staccato
  if (!isStressed) {
    softness = Math.max(softness, 0.4);
  }

  if (text.length <= 2 && vowelCount <= 1 && !isStressed) {
    durationMod *= 0.8;
  }

  let duration = voiceConfig.duration * durationMod / emotionConfig.tempoMultiplier;
  if (emotionConfig.staccato) duration *= 0.65;

  // Pitch with intonation
  let pitch = voiceConfig.pitchBase * emotionConfig.pitchMultiplier * vowelProps.pitchMod;

  // Stress raises pitch slightly
  if (isStressed) pitch *= 1.05;

  // Sentence intonation
  const position = analysis.indexInSentence / Math.max(1, analysis.sentenceLength - 1);

  if (analysis.isQuestion) {
    // Rising intonation for questions
    if (position > 0.5) {
      pitch *= 1.0 + (0.18 * ((position - 0.5) / 0.5));
    }
  } else {
    // Falling intonation for statements
    if (position < 0.2) {
      pitch *= 1.0 + (0.06 * (1 - position / 0.2));
    } else if (position > 0.7) {
      pitch *= 1.0 - (0.12 * ((position - 0.7) / 0.3));
    }
  }

  // Micro-variation - scaled by emotion's pitch variation (flat for sad, expressive for happy)
  const variationAmount = voiceConfig.pitchVariation * emotionConfig.pitchVariation;
  pitch += (Math.random() - 0.5) * variationAmount;

  const volume = (isStressed ? 0.65 : 0.45) * emotionConfig.volumeMultiplier;

  // Add breathiness from emotion (makes sound softer, airier)
  const breathiness = emotionConfig.breathiness || 0;

  return {
    duration,
    pitch,
    volume,
    brightness: vowelProps.brightness,
    softness: softness + breathiness * 0.3, // Breathiness adds to softness
    breathiness,
  };
}

/**
 * Generate audio buffer from syllables
 */
export function generateAudio(
  syllables: ParsedSyllable[],
  voice: VoiceType,
  emotion: EmotionalTone
): Float32Array {
  if (syllables.length === 0) {
    return new Float32Array(0);
  }

  const voiceConfig = VOICE_CONFIGS[voice];
  const emotionConfig = EMOTION_CONFIGS[emotion];

  // Analyze all syllables
  const analyzed = analyzeSyllables(syllables);

  // Calculate prosody for each
  const renderData = analyzed.map(a => ({
    ...a,
    prosody: calculateProsody(a, voiceConfig, emotionConfig),
  }));

  // Calculate total duration
  let totalDuration = 0;
  for (let i = 0; i < renderData.length; i++) {
    const data = renderData[i];
    // Apply both tempo and pause multipliers
    let gap = (data.syllable.pauseAfter * emotionConfig.pauseMultiplier) / emotionConfig.tempoMultiplier;
    if (emotionConfig.rhythmic && i > 0 && (i + 1) % 3 === 0) {
      gap += 150;
    }
    totalDuration += data.prosody.duration + gap;
  }

  totalDuration += 100;
  const totalSamples = Math.ceil((totalDuration / 1000) * SAMPLE_RATE);
  const buffer = new Float32Array(totalSamples);

  // Render audio
  let currentTime = 0;
  for (let i = 0; i < renderData.length; i++) {
    const data = renderData[i];
    const p = data.prosody;

    renderSyllable(buffer, currentTime, p.duration, p.pitch, p.volume, p.brightness, p.softness, voiceConfig.waveform);

    let gap = (data.syllable.pauseAfter * emotionConfig.pauseMultiplier) / emotionConfig.tempoMultiplier;
    if (emotionConfig.rhythmic && i > 0 && (i + 1) % 3 === 0) {
      gap += 150;
    }
    currentTime += p.duration + gap;
  }

  normalizeBuffer(buffer);
  return buffer;
}

function renderSyllable(
  buffer: Float32Array,
  startTimeMs: number,
  durationMs: number,
  pitch: number,
  volume: number,
  brightness: number,
  softness: number,
  waveform: OscillatorType
): void {
  const startSample = Math.floor((startTimeMs / 1000) * SAMPLE_RATE);
  const durationSamples = Math.floor((durationMs / 1000) * SAMPLE_RATE);

  const attackMs = 12 + softness * 18;
  const releaseMs = 18 + softness * 22;
  const attackSamples = Math.floor((attackMs / 1000) * SAMPLE_RATE);
  const releaseSamples = Math.floor((releaseMs / 1000) * SAMPLE_RATE);

  for (let i = 0; i < durationSamples; i++) {
    const sampleIndex = startSample + i;
    if (sampleIndex >= buffer.length) break;

    const t = i / SAMPLE_RATE;
    const phase = 2 * Math.PI * pitch * t;

    let sample = generateWaveform(waveform, phase);

    if (brightness > 0) {
      sample = sample * (1 - brightness * 0.2);
      sample += Math.sin(phase * 2) * 0.22 * brightness;
      sample += Math.sin(phase * 3) * 0.1 * brightness;
    }

    let envelope = 1;
    if (i < attackSamples) {
      const progress = i / attackSamples;
      envelope = progress * progress;
    } else if (i > durationSamples - releaseSamples) {
      const progress = (durationSamples - i) / releaseSamples;
      envelope = progress * progress;
    }

    buffer[sampleIndex] += sample * volume * envelope;
  }
}

function generateWaveform(waveform: OscillatorType, phase: number): number {
  switch (waveform) {
    case 'sine':
      return Math.sin(phase);
    case 'triangle':
      const tp = (phase % (2 * Math.PI)) / Math.PI;
      return tp < 1 ? 2 * tp - 1 : 3 - 2 * tp;
    case 'sawtooth':
      return ((phase % (2 * Math.PI)) / Math.PI) - 1;
    case 'square':
      return Math.sin(phase) >= 0 ? 0.5 : -0.5;
    default:
      return Math.sin(phase);
  }
}

function normalizeBuffer(buffer: Float32Array): void {
  let maxAbs = 0;
  for (let i = 0; i < buffer.length; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(buffer[i]));
  }
  if (maxAbs > 0.85) {
    const scale = 0.85 / maxAbs;
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] *= scale;
    }
  }
}

export function getSampleRate(): number {
  return SAMPLE_RATE;
}

export function getChannels(): number {
  return CHANNELS;
}
