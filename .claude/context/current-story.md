# Current Story

## User Story
As a game developer, I want a talking sound generator service that produces character-specific syllabic speech sounds (like Animal Crossing/Undertale) so that characters have voice-like personality during dialogue.

## Acceptance Criteria
- [x] Generates syllable-based speech sounds from input text
- [x] Supports different emotional tones: bubbly/joyous, sad/slow, stern/agitated, angry, snoring, giggling, laughing
- [x] Matches sentence rhythm with rising/falling intonation
- [x] Works as standalone CLI tool for prototyping
- [ ] Integrable as a service that runs parallel to game events (Phase 2)
- [x] Different phoneme bases per character (bweh, buh, pip, meh sounds)

## Technical Context

### Existing Infrastructure
- AudioManager handles music and SFX with Phaser.Sound
- Character component has animation states including 'talk'
- Bun runtime available for CLI tooling
- Four-layer architecture (Core, Game Logic, Scripting, Presentation)

### Design Requirements
- Service must be scene-independent (can be used from any context)
- Must not block the main thread during sound generation
- Should integrate with existing audio settings (volume, enabled/disabled)

## Implementation Summary

### Phase 1: CLI Prototype (COMPLETE)

**New Files Created:**
- `tools/speech-gen/cli.ts` - CLI entry point with argument parsing
- `tools/speech-gen/types.ts` - TypeScript interfaces, voice/emotion configs
- `tools/speech-gen/syllable-parser.ts` - Text-to-syllable parsing
- `tools/speech-gen/audio-engine.ts` - Oscillator synthesis audio generation
- `tools/speech-gen/wav-writer.ts` - WAV file encoding
- `tools/speech-gen/README.md` - Documentation

**Modified Files:**
- `package.json` - Added `speech-gen` npm script

**Features Implemented:**
1. **Syllable Parser** - Vowel-cluster heuristic for syllable detection
2. **Sentence Detection** - Detects `.!?` boundaries for intonation
3. **4 Voice Types** - bweh (300Hz), buh (200Hz), pip (600Hz), meh (250Hz)
4. **8 Emotional Tones** - neutral, bubbly, sad, stern, angry, snoring, giggling, laughing
5. **Intonation** - Pitch rises at sentence start, falls at end
6. **WAV Export** - Save generated audio to file
7. **Audio Playback** - Uses system audio player (afplay on macOS)

**Usage:**
```bash
bun run speech-gen --text "Hello there!" --voice pip --emotion bubbly
bun run speech-gen -t "I'm sad..." -v buh -e sad -o output.wav
bun run speech-gen -t "Test" --info  # Show parsing info
```

### Phase 2: Game Integration (PENDING)
- [ ] Create `src/game/systems/TalkingSoundManager.ts`
- [ ] Port audio engine to work with Phaser's AudioContext
- [ ] Add voice configuration to character YAML
- [ ] Integrate with DialogueBox component
- [ ] Add voiceVolume/voiceEnabled to AudioManager settings
- [ ] Per-character voice muting (accessibility)

## Status
- Created: 2026-01-31
- Phase 1 Completed: 2026-01-31
- Phase: Phase 1 complete, Phase 2 pending
