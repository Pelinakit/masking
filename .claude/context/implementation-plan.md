# Implementation Plan: CLI-First Talking Sound Generator Prototype

## Overview

Build a standalone Bun CLI tool that generates character-specific syllabic speech sounds (Animal Crossing/Undertale style) for testing sound generation before game integration. Characters have different "voices" and emotional states affect pitch, tempo, and delivery.

## Prerequisites

- [x] Bun runtime installed and working
- [x] TypeScript configuration in place
- [x] Project structure established
- [ ] Understanding of Web Audio API basics

## Task Breakdown

### Phase 1: Project Structure Setup

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T1 | Create `tools/` directory in project root | XS | - | No |
| T2 | Create `tools/speech-gen/` subdirectory for organization | XS | T1 | No |
| T3 | Create `tools/speech-gen/types.ts` for shared interfaces | S | T2 | No |
| T4 | Add npm script `speech-gen` to package.json | XS | - | Yes (with T1-T3) |

**Details:**

**T1 - Create tools directory:**
- Create `/tools/` at project root
- Add to `.gitignore` if outputs should not be tracked (optional)

**T2 - Create subdirectory:**
- Organize speech generator in `tools/speech-gen/`
- Keeps future tools organized

**T3 - Type Definitions:**
```typescript
export type VoiceType = 'bweh' | 'buh' | 'pip' | 'meh';

export type EmotionalTone =
  | 'neutral'
  | 'bubbly'
  | 'sad'
  | 'stern'
  | 'angry'
  | 'snoring'
  | 'giggling'
  | 'laughing';

export interface SyllableConfig {
  duration: number; // milliseconds
  pitchBase: number; // Hz
  pitchVariation: number; // Hz variance
}

export interface EmotionConfig {
  pitchMultiplier: number; // 1.0 is baseline
  tempoMultiplier: number; // 1.0 is baseline
  volumeMultiplier: number; // 1.0 is baseline
  staccato: boolean; // short, choppy
  rhythmic: boolean; // repeating pattern
}

export interface GenerationOptions {
  text: string;
  voice: VoiceType;
  emotion: EmotionalTone;
  outputFile?: string; // optional WAV output
  playback?: boolean; // play to speakers (default true)
}
```

**T4 - Add npm script:**
```json
"scripts": {
  "speech-gen": "bun run tools/speech-gen/cli.ts"
}
```

### Phase 2: Text-to-Syllable Parser

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T5 | Create `tools/speech-gen/syllable-parser.ts` | M | T3 | No |
| T6 | Implement basic syllable detection algorithm | M | T5 | No |
| T7 | Add sentence boundary detection | S | T5 | Yes (with T6) |
| T8 | Add punctuation-based pause detection | S | T5 | Yes (with T6, T7) |
| T9 | Write unit tests for parser edge cases | M | T6, T7, T8 | No |

**Details:**

**T5-T6 - Syllable Parser:**
- Use simple vowel-counting heuristic (not dictionary-based)
- Count vowel clusters as syllables: "hello" → "hel-lo" (2 syllables)
- Handle common patterns: silent 'e', vowel pairs (ai, ea, oo)
- Algorithm:
  1. Lowercase and clean text
  2. Split into words
  3. Count vowel clusters per word
  4. Return array of syllable counts per word

**T7 - Sentence Boundaries:**
- Detect `.`, `!`, `?` as sentence endings
- Apply rising intonation at sentence start
- Apply falling intonation at sentence end
- Detect mid-sentence pauses for commas

**T8 - Punctuation Pauses:**
- `.` → 500ms pause
- `,` → 200ms pause
- `!` → 400ms pause (slightly shorter than period)
- `?` → 300ms pause with rising intonation

**T9 - Unit Tests:**
- Test: "hello" → 2 syllables
- Test: "beautiful" → 3 syllables
- Test: "I ate cake." → [1, 1, 1] + sentence boundary
- Test: empty string, numbers, punctuation only

### Phase 3: Sound Generation Engine

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T10 | Research Bun's Web Audio API compatibility | S | - | No |
| T11 | Create `tools/speech-gen/audio-engine.ts` | L | T3, T10 | No |
| T12 | Implement oscillator-based sound synthesis | L | T11 | No |
| T13 | Implement voice-specific phoneme bases | M | T12 | No |
| T14 | Implement pitch modulation for intonation | M | T12 | Yes (with T13) |
| T15 | Add emotion-based parameter modification | M | T13, T14 | No |

**Details:**

**T10 - Bun Compatibility Research:**
- Test if Bun supports Web Audio API natively
- If not, investigate alternatives:
  - `node-web-audio-api` package
  - Generate WAV files directly without playback
  - Use external audio library
- Document findings for decision

**T11-T12 - Audio Engine Core:**
- Create AudioContext (or Bun equivalent)
- Use OscillatorNode for tone generation
- Use GainNode for volume control
- Connect nodes: Oscillator → Gain → Destination
- Implement basic "beep" sound first as proof-of-concept

**T13 - Voice Phoneme Bases:**
Each voice has unique frequency/timbre characteristics:
```typescript
const VOICE_CONFIGS: Record<VoiceType, SyllableConfig> = {
  'bweh': {
    duration: 120,
    pitchBase: 300, // Hz (mid-range)
    pitchVariation: 50,
  },
  'buh': {
    duration: 140,
    pitchBase: 200, // Hz (lower)
    pitchVariation: 30,
  },
  'pip': {
    duration: 80,
    pitchBase: 600, // Hz (high, chipmunk-like)
    pitchVariation: 100,
  },
  'meh': {
    duration: 150,
    pitchBase: 250, // Hz (mid-low, monotone)
    pitchVariation: 20,
  },
};
```

**T14 - Pitch Modulation:**
- Sentence start: +20% pitch for first 2 syllables
- Sentence end: -20% pitch for last syllable
- Mid-sentence: slight randomization (±5%) for natural variation

**T15 - Emotion Parameters:**
```typescript
const EMOTION_CONFIGS: Record<EmotionalTone, EmotionConfig> = {
  'neutral': {
    pitchMultiplier: 1.0,
    tempoMultiplier: 1.0,
    volumeMultiplier: 1.0,
    staccato: false,
    rhythmic: false,
  },
  'bubbly': {
    pitchMultiplier: 1.3,
    tempoMultiplier: 1.2,
    volumeMultiplier: 1.1,
    staccato: false,
    rhythmic: false,
  },
  'sad': {
    pitchMultiplier: 0.8,
    tempoMultiplier: 0.7,
    volumeMultiplier: 0.8,
    staccato: false,
    rhythmic: false,
  },
  'stern': {
    pitchMultiplier: 0.9,
    tempoMultiplier: 0.9,
    volumeMultiplier: 1.0,
    staccato: true,
    rhythmic: false,
  },
  'angry': {
    pitchMultiplier: 0.7,
    tempoMultiplier: 1.1,
    volumeMultiplier: 1.3,
    staccato: true,
    rhythmic: false,
  },
  'snoring': {
    pitchMultiplier: 0.5,
    tempoMultiplier: 0.6,
    volumeMultiplier: 0.7,
    staccato: false,
    rhythmic: true,
  },
  'giggling': {
    pitchMultiplier: 1.5,
    tempoMultiplier: 1.5,
    volumeMultiplier: 0.9,
    staccato: true,
    rhythmic: true,
  },
  'laughing': {
    pitchMultiplier: 1.2,
    tempoMultiplier: 1.0,
    volumeMultiplier: 1.2,
    staccato: false,
    rhythmic: true,
  },
};
```

### Phase 4: Sound Sequencing

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T16 | Create `tools/speech-gen/sequencer.ts` | M | T6, T12 | No |
| T17 | Implement syllable-to-sound mapping | M | T16 | No |
| T18 | Add timing and pause scheduling | M | T8, T17 | No |
| T19 | Implement rhythmic patterns for emotions | S | T15, T18 | No |

**Details:**

**T16-T17 - Sequencer Core:**
- Take parsed syllables and generate sound sequence
- Each syllable → one synthesized sound
- Map syllable position to pitch (start/middle/end of sentence)
- Apply voice config and emotion modifiers

**T18 - Timing & Pauses:**
- Schedule sounds with precise timing using AudioContext.currentTime
- Insert silence for punctuation pauses
- Gap between syllables: 50ms baseline (modified by tempo)
- Gap between words: 100ms baseline

**T19 - Rhythmic Patterns:**
- For `rhythmic: true` emotions:
  - Snoring: 3 syllables → 1 pause, repeat
  - Giggling: burst of 2-4 syllables, pause, repeat
  - Laughing: "ha-ha-ha" pattern (3-syllable bursts)

### Phase 5: WAV File Export (Optional Feature)

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T20 | Research WAV file generation in Bun | S | - | Yes (with T10) |
| T21 | Create `tools/speech-gen/wav-writer.ts` | M | T20 | No |
| T22 | Implement audio buffer capture | M | T12, T21 | No |
| T23 | Implement WAV file encoding and save | M | T22 | No |

**Details:**

**T20 - WAV Generation Research:**
- Investigate libraries: `wav`, `node-wav`, or manual encoding
- Determine if we can capture AudioContext output to buffer
- Alternative: Generate PCM data directly, encode as WAV

**T21-T23 - WAV Writer:**
- Capture generated audio as PCM buffer
- Encode as WAV format (44.1kHz, 16-bit, mono)
- Write to file using Bun's file system API
- Output to `tools/speech-gen/output/` directory

### Phase 6: CLI Interface

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T24 | Create `tools/speech-gen/cli.ts` main entry point | M | T3 | No |
| T25 | Implement argument parsing (text, voice, emotion) | M | T24 | No |
| T26 | Add help and usage documentation | S | T25 | No |
| T27 | Add validation and error messages | S | T25 | Yes (with T26) |
| T28 | Integrate all components into CLI flow | L | T6, T17, T18 | No |

**Details:**

**T24-T25 - CLI Entry Point:**
```typescript
// tools/speech-gen/cli.ts
#!/usr/bin/env bun

import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    text: { type: 'string', short: 't' },
    voice: { type: 'string', short: 'v', default: 'bweh' },
    emotion: { type: 'string', short: 'e', default: 'neutral' },
    output: { type: 'string', short: 'o' },
    noplay: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});
```

**T26 - Help Documentation:**
```
Usage: bun run speech-gen --text "Hello there!" [options]

Options:
  -t, --text <string>       Text to convert to speech (required)
  -v, --voice <type>        Voice type: bweh, buh, pip, meh (default: bweh)
  -e, --emotion <tone>      Emotional tone: neutral, bubbly, sad, stern,
                            angry, snoring, giggling, laughing (default: neutral)
  -o, --output <file>       Save to WAV file (optional)
  --noplay                  Don't play audio (only save file)
  -h, --help                Show this help message

Examples:
  bun run speech-gen --text "Hello there!" --voice bweh --emotion bubbly
  bun run speech-gen -t "I'm sleepy..." -v buh -e sad -o output.wav
```

**T27 - Validation:**
- Require --text argument
- Validate voice is one of: bweh, buh, pip, meh
- Validate emotion is valid EmotionalTone
- Error if --noplay with no --output (nothing would happen)

**T28 - Integration Flow:**
```typescript
async function main() {
  // 1. Parse arguments
  // 2. Validate inputs
  // 3. Parse text into syllables
  // 4. Generate audio sequence
  // 5. Play audio (if not --noplay)
  // 6. Save to file (if --output)
  // 7. Report success/errors
}
```

### Phase 7: Testing & Refinement

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T29 | Test each voice type with neutral emotion | M | T28 | No |
| T30 | Test all emotional tones with one voice | M | T28 | Yes (with T29) |
| T31 | Test edge cases (punctuation, long text, empty) | M | T28 | Yes (with T29, T30) |
| T32 | Fine-tune voice parameters for clarity | M | T29, T30 | No |
| T33 | Fine-tune emotion parameters for distinctiveness | M | T30, T32 | No |
| T34 | Test WAV export functionality | S | T23, T28 | Yes (with T29-T31) |

**Details:**

**T29 - Voice Testing:**
- Test each voice (bweh, buh, pip, meh) with same text
- Verify voices are clearly distinct
- Verify pitch ranges sound appropriate
- Adjust base frequencies if needed

**T30 - Emotion Testing:**
- Test same voice (e.g., bweh) with all emotions
- Verify emotions are perceivable
- Check: bubbly sounds happy, sad sounds slower/lower, etc.

**T31 - Edge Case Testing:**
```bash
# Empty string
bun run speech-gen --text "" --voice bweh

# Only punctuation
bun run speech-gen --text "..." --voice pip

# Long text with multiple sentences
bun run speech-gen --text "Hello! How are you today? I hope you're doing well." --voice meh --emotion bubbly

# Special characters
bun run speech-gen --text "Test @#$% symbols" --voice buh
```

**T32-T33 - Parameter Tuning:**
- Adjust VOICE_CONFIGS if voices sound too similar or unnatural
- Adjust EMOTION_CONFIGS if emotions are too subtle or exaggerated
- Goal: Clear distinctions, pleasant listening experience

**T34 - WAV Export Testing:**
```bash
bun run speech-gen -t "Export test" -v bweh -o test.wav
# Verify file is created
# Verify file plays in audio player
# Verify file size is reasonable
```

### Phase 8: Documentation & Examples

| ID | Task | Size | Depends On | Parallel? |
|----|------|------|------------|-----------|
| T35 | Create `tools/speech-gen/README.md` | M | T28 | No |
| T36 | Document voice characteristics | S | T32 | No |
| T37 | Document emotion characteristics | S | T33 | No |
| T38 | Add example commands and expected outputs | S | T29-T31 | No |
| T39 | Document technical approach and limitations | M | All | No |

**Details:**

**T35 - README Structure:**
- Overview and purpose
- Installation/setup (none needed, uses Bun)
- Usage examples
- Voice types reference
- Emotion types reference
- Technical notes
- Future improvements

**T36 - Voice Documentation:**
```markdown
## Voice Types

- **bweh**: Mid-range, friendly tone. Good for main character.
  - Base pitch: 300 Hz
  - Duration: 120ms per syllable

- **buh**: Lower, calm tone. Good for serious characters.
  - Base pitch: 200 Hz
  - Duration: 140ms per syllable

- **pip**: High, energetic tone. Good for excited/young characters.
  - Base pitch: 600 Hz
  - Duration: 80ms per syllable

- **meh**: Mid-low, monotone. Good for tired/bored characters.
  - Base pitch: 250 Hz
  - Duration: 150ms per syllable
```

**T37 - Emotion Documentation:**
- Describe each emotion's effect on pitch/tempo/delivery
- Suggest use cases for each emotion
- Note which emotions work best with which voices

**T38 - Example Commands:**
```bash
# Happy greeting
bun run speech-gen -t "Good morning!" -v pip -e bubbly

# Sad statement
bun run speech-gen -t "I'm feeling down today..." -v buh -e sad

# Angry outburst
bun run speech-gen -t "That's not fair!" -v bweh -e angry

# Character sleeping
bun run speech-gen -t "Zzz..." -v meh -e snoring
```

**T39 - Technical Documentation:**
- Explain syllable-counting approach and limitations
- Explain synthesis technique (oscillators, not samples)
- Note that this is a prototype, not production-ready
- Discuss portability to browser/Phaser

## Dependency Graph

```
T1 ──> T2 ──> T3 ──┬──> T5 ──┬──> T6 ──┐
                   │         ├──> T7 ──┤
T4 (independent)   │         └──> T8 ──┴──> T9
                   │
                   ├──> T10 ──> T11 ──> T12 ──┬──> T13 ──┐
                   │                           └──> T14 ──┴──> T15
                   │
                   └──> T24 ──> T25 ──┬──> T26 ──┐
                                       └──> T27 ──┘

T6, T12 ──> T16 ──> T17 ──┬──> T18 ──┐
T8, T17 ────────────────> T18        │
T15, T18 ───────────────────────> T19│
                                      │
T20 ──> T21 ──> T22 ──> T23          │
                         │            │
T6, T17, T18 ────────────┴───> T28 <─┘
T25 ──────────────────────────> T28

T28 ──┬──> T29 ──┐
      ├──> T30 ──┤
      └──> T31 ──┴──> T32 ──┬──> T33
                             │
T23, T28 ──> T34             │
                             │
T28 ──────────────> T35 <────┘
T32 ──> T36
T33 ──> T37
T29-T31 ──> T38
All ──> T39
```

## Parallel Execution Groups

1. **Group 1** (Setup): T1, T4 (can start immediately)
2. **Group 2** (Parser foundation): T6, T7, T8 (after T5, all parallel)
3. **Group 3** (Research): T10, T20 (independent, can run anytime)
4. **Group 4** (Audio components): T13, T14 (after T12, parallel)
5. **Group 5** (CLI setup): T26, T27 (after T25, parallel)
6. **Group 6** (Testing): T29, T30, T31, T34 (after T28, mostly parallel)
7. **Group 7** (Tuning): T32, T33 (sequential after testing)
8. **Group 8** (Documentation): T36, T37, T38 (parallel after tuning)

## Risk Areas

| Task | Risk | Mitigation |
|------|------|------------|
| T10 | Bun may not support Web Audio API | Research early; fallback to WAV-only generation |
| T12 | Synthesized audio may sound robotic/unpleasant | Prototype early; iterate on parameters; accept limitations |
| T6 | Syllable counting may be inaccurate | Use simple heuristics; accept imperfection for prototype |
| T14 | Pitch modulation may sound unnatural | Test extensively; make subtle adjustments |
| T23 | WAV encoding complexity | Use existing library; optional feature can be skipped |
| T28 | Integration may reveal timing issues | Build incrementally; test each component in isolation first |

## Testing Strategy

### Unit Tests
- SyllableParser: Test syllable counting accuracy (T9)
- Voice configs: Validate all voice types have required fields
- Emotion configs: Validate all emotion types have required fields

### Integration Tests
- Parser → Sequencer: Verify syllables map to sounds correctly
- Sequencer → Audio Engine: Verify sounds play in correct order/timing
- Full pipeline: Text input → Audio output end-to-end

### Manual Testing
- Listen to each voice type (T29)
- Listen to each emotion type (T30)
- Test edge cases (T31)
- Fine-tune parameters (T32-T33)
- Validate WAV export (T34)

### Acceptance Tests
Critical paths:
1. **Happy path**: `bun run speech-gen -t "Hello!" -v bweh` plays audio successfully
2. **Emotion path**: Same text with different emotions sounds different
3. **Voice path**: Same text with different voices sounds different
4. **Export path**: `--output test.wav` creates valid playable WAV file
5. **Edge path**: Punctuation creates pauses, sentence boundaries affect intonation

## Commit Points

Logical points for git commits:

1. **After T1-T4**: `feat(tools): add speech-gen CLI tool structure`
   - Directory setup
   - Type definitions
   - Package.json script

2. **After T5-T9**: `feat(speech-gen): add text-to-syllable parser`
   - Syllable detection algorithm
   - Sentence boundary detection
   - Punctuation pause detection
   - Unit tests

3. **After T10-T15**: `feat(speech-gen): add audio synthesis engine`
   - Web Audio API integration
   - Voice configurations
   - Pitch modulation
   - Emotion parameters

4. **After T16-T19**: `feat(speech-gen): add sound sequencing`
   - Syllable-to-sound mapping
   - Timing and pause scheduling
   - Rhythmic patterns

5. **After T20-T23**: `feat(speech-gen): add WAV file export`
   - WAV writer implementation
   - Audio buffer capture
   - File encoding and save

6. **After T24-T28**: `feat(speech-gen): add CLI interface and integration`
   - Argument parsing
   - Help documentation
   - Validation
   - Full pipeline integration

7. **After T29-T34**: `test(speech-gen): validate all voices and emotions`
   - Voice testing
   - Emotion testing
   - Edge case testing
   - Parameter tuning

8. **After T35-T39**: `docs(speech-gen): document CLI tool usage and design`
   - README with examples
   - Voice reference
   - Emotion reference
   - Technical notes

## Performance Considerations

- **Syllable parsing**: Simple string operations, should be fast
- **Audio synthesis**: May have latency on first sound generation
- **Memory**: Keep audio buffers small (mono, short duration)
- **File I/O**: WAV writing should be async to avoid blocking
- **Timing accuracy**: Use AudioContext.currentTime for precise scheduling

## Extensibility

This prototype is designed to support future extensions:

- **More voice types**: Easy to add new entries to VOICE_CONFIGS
- **More emotions**: Easy to add new entries to EMOTION_CONFIGS
- **Waveform variety**: Currently uses simple oscillators; could add noise, filters
- **Dynamic effects**: Could add reverb, echo, filtering per character
- **Lip-sync data**: Could export timing data for animation sync
- **Game integration**: Move audio engine to Phaser AudioManager
- **Character mapping**: Map NPC IDs to voice/emotion combinations
- **YAML configuration**: Move voice/emotion configs to YAML files

## Browser/Phaser Integration Strategy

This CLI tool is designed to be portable to the browser:

1. **Audio Engine**: Uses Web Audio API (standard in browsers)
2. **No Bun-specific APIs**: Only uses Node-compatible APIs
3. **Modular design**: AudioEngine can be imported into Phaser
4. **Integration points**:
   - Create `src/game/systems/TalkingSoundManager.ts`
   - Import AudioEngine from CLI tool
   - Hook into text display (dialogue boxes, chat messages)
   - Trigger sound generation as text appears character-by-character
   - Map NPCs to voice/emotion combinations via character configs

## Success Criteria

The implementation is complete when:

- [ ] CLI tool runs: `bun run speech-gen --text "Test" --voice bweh`
- [ ] Audio plays through speakers successfully
- [ ] All 4 voice types sound distinct from each other
- [ ] All 8 emotional tones produce perceivable differences
- [ ] Punctuation creates appropriate pauses
- [ ] Sentence intonation rises/falls naturally
- [ ] WAV export creates valid audio files (optional)
- [ ] Help documentation is clear and accurate
- [ ] Edge cases handled gracefully (empty text, invalid args, etc.)
- [ ] Code is commented and maintainable
- [ ] README documents usage and technical approach

## Estimated Effort Distribution

- Phase 1 (Structure): 5% of effort
- Phase 2 (Parser): 15% of effort
- Phase 3 (Audio Engine): 30% of effort (largest technical challenge)
- Phase 4 (Sequencing): 15% of effort
- Phase 5 (WAV Export): 10% of effort (optional)
- Phase 6 (CLI): 10% of effort
- Phase 7 (Testing): 10% of effort
- Phase 8 (Documentation): 5% of effort

**Total Tasks**: 39 tasks
**Estimated Complexity**: L (complex feature, but standalone tool)
**Critical Path**: T1→T2→T3→T5→T6→T16→T17→T18→T28
**Estimated Duration**: 2-3 focused work sessions

## Out of Scope (Future Enhancements)

These features are explicitly NOT included in this prototype:

- Real phoneme recognition (using simple syllable counting instead)
- Natural language processing for better prosody
- Sample-based synthesis (using oscillators only)
- Multiple speakers in conversation (single voice at a time)
- Streaming audio for very long text (processes all at once)
- Advanced audio effects (reverb, compression, etc.)
- Visual waveform display
- Interactive parameter tuning UI
- Batch processing of multiple text files
- Voice training/learning from samples

These can be added in future iterations based on prototype feedback.
