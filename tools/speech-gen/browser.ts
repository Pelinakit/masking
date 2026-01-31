/**
 * Speech Sound Generator - Browser Bundle
 * Exposes speech-gen functionality for use in static HTML pages
 */

import { parseText, Language } from './syllable-parser';
import { generateAudio, getSampleRate, getChannels } from './audio-engine';
import { VoiceType, EmotionalTone, VOICE_CONFIGS, EMOTION_CONFIGS } from './types';

/**
 * Encode audio buffer as WAV (browser-compatible)
 */
function encodeWav(samples: Float32Array, sampleRate: number, channels: number): Uint8Array {
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.floor(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Generate speech audio and return as WAV blob
 */
export function generateSpeech(
  text: string,
  voice: VoiceType = 'bweh',
  emotion: EmotionalTone = 'neutral',
  lang: Language = 'en'
): Blob {
  const syllables = parseText(text, lang);
  const audioBuffer = generateAudio(syllables, voice, emotion);
  const wavData = encodeWav(audioBuffer, getSampleRate(), getChannels());
  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Get available voices
 */
export function getVoices(): VoiceType[] {
  return Object.keys(VOICE_CONFIGS) as VoiceType[];
}

/**
 * Get available emotions
 */
export function getEmotions(): EmotionalTone[] {
  return Object.keys(EMOTION_CONFIGS) as EmotionalTone[];
}

/**
 * Get available languages
 */
export function getLanguages(): Language[] {
  return ['en', 'fi'];
}

// Expose to window for use in HTML
declare global {
  interface Window {
    SpeechGen: {
      generateSpeech: typeof generateSpeech;
      getVoices: typeof getVoices;
      getEmotions: typeof getEmotions;
      getLanguages: typeof getLanguages;
    };
  }
}

window.SpeechGen = {
  generateSpeech,
  getVoices,
  getEmotions,
  getLanguages,
};
