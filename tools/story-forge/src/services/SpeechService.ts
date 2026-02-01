/**
 * Speech Service
 * Integrates with speech-gen tool for voice preview
 */

import { parseText } from '../../../speech-gen/syllable-parser.js';
import { generateAudio, getSampleRate, getChannels } from '../../../speech-gen/audio-engine.js';
import type { VoiceType, EmotionalTone } from '../../../speech-gen/types.js';

// Re-export types for convenience
export type { VoiceType, EmotionalTone };

/**
 * Encode audio buffer as WAV
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

export class SpeechService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  /**
   * Generate speech audio blob
   */
  generateSpeech(
    text: string,
    voice: VoiceType = 'bweh',
    emotion: EmotionalTone = 'neutral',
    lang: 'en' | 'fi' = 'en'
  ): Blob {
    const syllables = parseText(text, lang);
    const audioBuffer = generateAudio(syllables, voice, emotion);
    const wavData = encodeWav(audioBuffer, getSampleRate(), getChannels());
    return new Blob([wavData], { type: 'audio/wav' });
  }

  /**
   * Play speech audio
   */
  async play(
    text: string,
    voice: VoiceType = 'bweh',
    emotion: EmotionalTone = 'neutral',
    lang: 'en' | 'fi' = 'en'
  ): Promise<void> {
    // Stop any currently playing audio
    this.stop();

    // Initialize AudioContext if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Generate audio
    const blob = this.generateSpeech(text, voice, emotion, lang);
    const arrayBuffer = await blob.arrayBuffer();

    // Decode and play
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);
    this.currentSource.start();

    // Clean up when done
    this.currentSource.onended = () => {
      this.currentSource = null;
    };
  }

  /**
   * Stop currently playing audio
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }

  /**
   * Get available voice types
   */
  getVoices(): VoiceType[] {
    return ['bweh', 'buh', 'pip', 'meh'];
  }

  /**
   * Get available emotions
   */
  getEmotions(): EmotionalTone[] {
    return ['neutral', 'bubbly', 'sad', 'stern', 'angry', 'snoring', 'giggling', 'laughing'];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton
export const speechService = new SpeechService();
