#!/usr/bin/env bun
/**
 * Speech Sound Generator - Test Server
 * Serves the test UI and provides an API endpoint for audio generation
 *
 * Usage: bun run tools/speech-gen/server.ts
 * Then open http://localhost:3001 in your browser
 */

import { parseText, Language } from './syllable-parser';
import { generateAudio, getSampleRate, getChannels } from './audio-engine';
import { VoiceType, EmotionalTone, VOICE_CONFIGS, EMOTION_CONFIGS } from './types';

const PORT = 3001;

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

/**
 * Handle API request
 */
function handleApiRequest(url: URL): Response {
  const text = url.searchParams.get('text');
  const voice = url.searchParams.get('voice') as VoiceType || 'bweh';
  const emotion = url.searchParams.get('emotion') as EmotionalTone || 'neutral';
  const lang = url.searchParams.get('lang') as Language || 'en';

  if (!text) {
    return new Response('Missing text parameter', { status: 400 });
  }

  if (!VOICE_CONFIGS[voice]) {
    return new Response(`Invalid voice: ${voice}`, { status: 400 });
  }

  if (!EMOTION_CONFIGS[emotion]) {
    return new Response(`Invalid emotion: ${emotion}`, { status: 400 });
  }

  if (lang !== 'en' && lang !== 'fi') {
    return new Response(`Invalid language: ${lang}`, { status: 400 });
  }

  try {
    const syllables = parseText(text, lang);
    const audioBuffer = generateAudio(syllables, voice, emotion);
    const wavData = encodeWav(audioBuffer, getSampleRate(), getChannels());

    return new Response(wavData, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': wavData.length.toString(),
      },
    });
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(`Generation error: ${error}`, { status: 500 });
  }
}

/**
 * Serve static files
 */
async function serveStatic(path: string): Promise<Response> {
  const file = Bun.file(`${import.meta.dir}${path}`);

  if (await file.exists()) {
    return new Response(file);
  }

  return new Response('Not found', { status: 404 });
}

/**
 * Main server
 */
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API endpoint
    if (url.pathname === '/api/speech-gen') {
      return handleApiRequest(url);
    }

    // Serve test UI
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveStatic('/test-ui.html');
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log(`
🔊 Speech Sound Generator - Test Server

   Open in browser: http://localhost:${PORT}

   Press Ctrl+C to stop
`);
