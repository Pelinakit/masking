# Speech Sound Generator

A CLI tool for generating Animal Crossing/Undertale style speech sounds from text. Characters have different "voices" and emotional states affect pitch, tempo, and delivery.

## Usage

```bash
# Basic usage
bun run speech-gen --text "Hello there!" --voice bweh --emotion bubbly

# Short form
bun run speech-gen -t "How are you?" -v pip -e happy

# Save to file
bun run speech-gen -t "Export test" -v bweh -o output.wav

# Save without playing
bun run speech-gen -t "Test" -v buh -o test.wav --noplay

# Show text parsing info
bun run speech-gen -t "How are you today?" --info

# Help
bun run speech-gen --help
```

## Voice Types

| Voice | Base Pitch | Character | Description |
|-------|------------|-----------|-------------|
| `bweh` | 300 Hz | Friendly | Mid-range, warm tone. Good for main characters. |
| `buh` | 200 Hz | Calm | Lower, steady tone. Good for serious/mature characters. |
| `pip` | 600 Hz | Energetic | High, chipmunk-like. Good for excited/young characters. |
| `meh` | 250 Hz | Tired | Monotone, flat delivery. Good for bored/apathetic characters. |

## Emotional Tones

| Emotion | Pitch | Tempo | Notes |
|---------|-------|-------|-------|
| `neutral` | 1.0x | 1.0x | Standard delivery |
| `bubbly` | 1.3x | 1.2x | Happy, excited |
| `sad` | 0.8x | 0.7x | Low, slow, quiet |
| `stern` | 0.9x | 0.9x | Staccato, clipped |
| `angry` | 0.7x | 1.1x | Low, sharp, loud |
| `snoring` | 0.5x | 0.6x | Rhythmic low hums |
| `giggling` | 1.5x | 1.5x | Quick high staccato bursts |
| `laughing` | 1.2x | 1.0x | Rhythmic bursts |

## Examples

```bash
# Happy greeting from an energetic character
bun run speech-gen -t "Good morning! How are you today?" -v pip -e bubbly

# Sad statement from a calm character
bun run speech-gen -t "I'm feeling down today..." -v buh -e sad

# Angry outburst
bun run speech-gen -t "That's not fair!" -v bweh -e angry

# Character laughing
bun run speech-gen -t "Ha ha ha ha!" -v bweh -e laughing

# Sleepy/tired character
bun run speech-gen -t "Zzz... five more minutes..." -v meh -e snoring
```

## How It Works

1. **Text Parsing**: Input text is split into syllables using a vowel-cluster heuristic
2. **Sentence Detection**: Sentence boundaries (`.`, `!`, `?`) trigger intonation changes
3. **Sound Generation**: Each syllable becomes an oscillator-synthesized sound
4. **Pitch Modulation**: Pitch rises at sentence start, falls at sentence end
5. **Emotion Application**: Emotional tone modifies pitch, tempo, and delivery

## Technical Notes

- Uses oscillator synthesis (sine, triangle, sawtooth waves)
- Output: 44.1kHz, 16-bit, mono WAV
- Syllable counting is approximate (good enough for speech sounds)
- Designed for later integration into Phaser game engine

## File Structure

```
tools/speech-gen/
├── cli.ts              # CLI entry point
├── types.ts            # TypeScript interfaces and configs
├── syllable-parser.ts  # Text → syllables
├── audio-engine.ts     # Generates audio buffers
├── wav-writer.ts       # WAV file encoding
└── README.md           # This file
```

## Future Improvements

- [ ] More sophisticated syllable detection
- [ ] Additional waveform types and audio effects
- [ ] Voice "presets" for specific characters
- [ ] Integration with game's DialogueBox component
- [ ] Real-time streaming for long text
