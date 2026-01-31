#!/usr/bin/env bun
/**
 * Speech Sound Generator CLI
 * Generate Animal Crossing/Undertale style speech sounds from text
 *
 * Usage:
 *   bun run tools/speech-gen/cli.ts --text "Hello there!" --voice bweh --emotion bubbly
 */

import { parseArgs } from 'util';
import { parseText, countSyllables, Language } from './syllable-parser';
import { generateAudio, getSampleRate, getChannels } from './audio-engine';
import { writeWavFile } from './wav-writer';
import { VoiceType, EmotionalTone, VOICE_CONFIGS, EMOTION_CONFIGS } from './types';

const HELP_TEXT = `
Speech Sound Generator - CLI Prototype

Usage:
  bun run tools/speech-gen/cli.ts [options]

Options:
  -t, --text <string>       Text to convert to speech (required)
  -v, --voice <type>        Voice type (default: bweh)
                            Options: bweh, buh, pip, meh
  -e, --emotion <tone>      Emotional tone (default: neutral)
                            Options: neutral, bubbly, sad, stern,
                                     angry, snoring, giggling, laughing
  -l, --lang <code>         Language for syllable rules (default: en)
                            Options: en (English), fi (Finnish)
  -o, --output <file>       Save to WAV file (optional)
  --noplay                  Don't play audio (only save file)
  --info                    Show parsing info without generating audio
  -h, --help                Show this help message

Examples:
  # Happy greeting
  bun run tools/speech-gen/cli.ts -t "Hello there!" -v pip -e bubbly

  # Sad statement
  bun run tools/speech-gen/cli.ts -t "I'm feeling down today..." -v buh -e sad

  # Finnish text
  bun run tools/speech-gen/cli.ts -t "Hyvää päivää!" -v bweh -l fi

  # Save to file
  bun run tools/speech-gen/cli.ts -t "Export test" -v bweh -o output.wav

  # Show parsing info
  bun run tools/speech-gen/cli.ts -t "How are you?" --info

Voice Types:
  bweh    Mid-range, friendly (300 Hz base)
  buh     Lower, calm (200 Hz base)
  pip     High, energetic (600 Hz base)
  meh     Monotone, tired (250 Hz base)

Emotional Tones:
  neutral     Standard delivery
  bubbly      Higher pitch, faster tempo
  sad         Lower pitch, slower tempo
  stern       Slightly lower, staccato
  angry       Low, sharp, loud
  snoring     Low hums, rhythmic
  giggling    Quick high staccato
  laughing    Rhythmic bursts

Languages:
  en          English (default) - handles silent 'e', contractions, etc.
  fi          Finnish - supports ä, ö, å vowels
`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      text: { type: 'string', short: 't' },
      voice: { type: 'string', short: 'v', default: 'bweh' },
      emotion: { type: 'string', short: 'e', default: 'neutral' },
      lang: { type: 'string', short: 'l', default: 'en' },
      output: { type: 'string', short: 'o' },
      noplay: { type: 'boolean', default: false },
      info: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  });

  // Show help
  if (values.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Validate text
  if (!values.text) {
    console.error('Error: --text is required\n');
    console.log('Usage: bun run tools/speech-gen/cli.ts --text "Hello!" --voice bweh');
    console.log('Run with --help for more options.');
    process.exit(1);
  }

  // Validate voice
  const voice = values.voice as VoiceType;
  if (!VOICE_CONFIGS[voice]) {
    console.error(`Error: Invalid voice type "${values.voice}"`);
    console.error('Valid options: bweh, buh, pip, meh');
    process.exit(1);
  }

  // Validate emotion
  const emotion = values.emotion as EmotionalTone;
  if (!EMOTION_CONFIGS[emotion]) {
    console.error(`Error: Invalid emotion "${values.emotion}"`);
    console.error('Valid options: neutral, bubbly, sad, stern, angry, snoring, giggling, laughing');
    process.exit(1);
  }

  // Validate language
  const lang = values.lang as Language;
  if (lang !== 'en' && lang !== 'fi') {
    console.error(`Error: Invalid language "${values.lang}"`);
    console.error('Valid options: en (English), fi (Finnish)');
    process.exit(1);
  }

  // Validate noplay requires output
  if (values.noplay && !values.output) {
    console.error('Error: --noplay requires --output (otherwise nothing would happen)');
    process.exit(1);
  }

  // Parse text
  const syllables = parseText(values.text, lang);

  // Show info mode
  if (values.info) {
    console.log('\n📝 Text Analysis\n');
    console.log(`Input: "${values.text}"`);
    console.log(`Language: ${lang === 'fi' ? 'Finnish' : 'English'}`);
    console.log(`Voice: ${voice} (${VOICE_CONFIGS[voice].pitchBase} Hz base)`);
    console.log(`Emotion: ${emotion}`);
    console.log(`\nSyllables: ${syllables.length}`);
    console.log('\nBreakdown:');

    let sentenceNum = 1;
    for (let i = 0; i < syllables.length; i++) {
      const s = syllables[i];
      if (s.isSentenceStart) {
        console.log(`  Sentence ${sentenceNum}:`);
      }

      const markers = [];
      if (s.isWordStart) markers.push('word-start');
      if (s.isWordEnd) markers.push('word-end');
      if (s.isSentenceStart) markers.push('SENT-START');
      if (s.isSentenceEnd) markers.push('SENT-END');

      console.log(`    [${i + 1}] "${s.text}" (pause: ${s.pauseAfter}ms) ${markers.join(', ')}`);

      if (s.isSentenceEnd) {
        sentenceNum++;
      }
    }

    console.log('\n');
    return;
  }

  // Generate audio
  console.log(`\n🔊 Generating speech sounds...`);
  console.log(`   Text: "${values.text}"`);
  console.log(`   Language: ${lang === 'fi' ? 'Finnish' : 'English'}`);
  console.log(`   Voice: ${voice}`);
  console.log(`   Emotion: ${emotion}`);
  console.log(`   Syllables: ${syllables.length}\n`);

  const audioBuffer = generateAudio(syllables, voice, emotion);

  if (audioBuffer.length === 0) {
    console.log('No audio generated (empty or invalid text)');
    return;
  }

  const durationMs = (audioBuffer.length / getSampleRate()) * 1000;
  console.log(`   Duration: ${Math.round(durationMs)}ms`);

  // Save to file if requested
  if (values.output) {
    const outputPath = values.output.endsWith('.wav')
      ? values.output
      : values.output + '.wav';

    await writeWavFile(audioBuffer, getSampleRate(), getChannels(), outputPath);
    console.log(`   Saved to: ${outputPath}`);
  }

  // Play audio (if not disabled)
  if (!values.noplay) {
    await playAudio(audioBuffer);
  }

  console.log('\n✅ Done!\n');
}

/**
 * Play audio buffer using system audio
 * This uses a WAV file + system player as Bun doesn't have native audio playback
 */
async function playAudio(buffer: Float32Array): Promise<void> {
  const tempFile = `/tmp/speech-gen-${Date.now()}.wav`;

  try {
    // Write to temp file
    await writeWavFile(buffer, getSampleRate(), getChannels(), tempFile);

    // Detect platform and use appropriate player
    const platform = process.platform;
    let playCommand: string[];

    if (platform === 'darwin') {
      // macOS
      playCommand = ['afplay', tempFile];
    } else if (platform === 'linux') {
      // Linux - try aplay (ALSA) or paplay (PulseAudio)
      playCommand = ['aplay', '-q', tempFile];
    } else if (platform === 'win32') {
      // Windows - use PowerShell
      playCommand = [
        'powershell',
        '-c',
        `(New-Object Media.SoundPlayer "${tempFile}").PlaySync()`,
      ];
    } else {
      console.log('   Audio playback not supported on this platform');
      console.log(`   Audio saved to: ${tempFile}`);
      return;
    }

    console.log('   Playing audio...');

    const proc = Bun.spawn(playCommand, {
      stdout: 'ignore',
      stderr: 'ignore',
    });

    await proc.exited;

    // Cleanup temp file
    await Bun.file(tempFile).exists() && (await Bun.$`rm ${tempFile}`.quiet());
  } catch (error) {
    console.log(`   Could not play audio: ${error}`);
    console.log(`   Audio saved to: ${tempFile}`);
  }
}

// Run main
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
