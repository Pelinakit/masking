/**
 * CharacterView Component
 * Character database with voice configuration and preview
 */

import { store } from '../state/store.js';
import type { Character, VoiceConfig, Emotion } from '../types/index.js';

export class CharacterView {
  private container: HTMLElement;
  private characters: Character[] = [];
  private selectedCharacterId: string | null = null;
  private audioContext: AudioContext | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadCharacters();
    this.render();
  }

  /**
   * Load characters from storage or create defaults
   */
  private loadCharacters(): void {
    // Sample characters for now
    this.characters = [
      {
        id: 'player-cat',
        name: 'Player Cat',
        species: 'Cat',
        voice: { type: 'pip', pitchOffset: 0, speedOffset: 0 },
        defaultEmotion: 'neutral',
        spritePath: '/assets/sprites/player-cat.png',
        relationships: { defaultValue: 50, min: 0, max: 100 },
      },
      {
        id: 'boss-chihuahua',
        name: 'Boss Chihuahua',
        species: 'Chihuahua',
        voice: { type: 'bweh', pitchOffset: 0, speedOffset: 0 },
        defaultEmotion: 'neutral',
        spritePath: '/assets/sprites/boss-chihuahua.png',
        relationships: { defaultValue: 50, min: 0, max: 100 },
      },
      {
        id: 'coworker-pug',
        name: 'Coworker Pug',
        species: 'Pug',
        voice: { type: 'buh', pitchOffset: 0, speedOffset: 0 },
        defaultEmotion: 'happy',
        spritePath: '/assets/sprites/coworker-pug.png',
        relationships: { defaultValue: 60, min: 0, max: 100 },
      },
      {
        id: 'designer-corgi',
        name: 'Designer Corgi',
        species: 'Corgi',
        voice: { type: 'pip', pitchOffset: 10, speedOffset: 5 },
        defaultEmotion: 'happy',
        spritePath: '/assets/sprites/designer-corgi.png',
        relationships: { defaultValue: 55, min: 0, max: 100 },
      },
    ];
  }

  /**
   * Render the character view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="character-view">
        <div class="character-header">
          <h2>Character Database</h2>
          <button class="button" id="add-character-btn">+ Add Character</button>
        </div>
        <div class="character-content">
          <div class="character-list">
            ${this.characters.map(char => this.renderCharacterCard(char)).join('')}
          </div>
          ${this.selectedCharacterId ? this.renderCharacterEditor() : this.renderEmptyState()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render a character card
   */
  private renderCharacterCard(character: Character): string {
    const isSelected = this.selectedCharacterId === character.id;

    return `
      <div class="character-card ${isSelected ? 'selected' : ''}"
           data-character-id="${character.id}">
        <div class="character-card-portrait">
          <div class="portrait-placeholder">
            ${this.getSpeciesEmoji(character.species)}
          </div>
        </div>
        <div class="character-card-info">
          <h4>${character.name}</h4>
          <p class="character-species">${character.species}</p>
          <div class="character-voice-badge">
            🔊 ${character.voice.type}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get emoji for species
   */
  private getSpeciesEmoji(species: string): string {
    const emojis: Record<string, string> = {
      'Cat': '🐱',
      'Chihuahua': '🐕',
      'Dog': '🐶',
      'Pug': '🐾',
      'Corgi': '🦴',
      'Golden Retriever': '🦮',
      'Border Collie': '🐕',
    };
    return emojis[species] || '🐾';
  }

  /**
   * Render empty state when no character selected
   */
  private renderEmptyState(): string {
    return `
      <div class="character-editor">
        <div class="empty-state">
          <p class="text-dim">Select a character to edit or create a new one</p>
        </div>
      </div>
    `;
  }

  /**
   * Render character editor panel
   */
  private renderCharacterEditor(): string {
    const character = this.characters.find(c => c.id === this.selectedCharacterId);
    if (!character) return this.renderEmptyState();

    return `
      <div class="character-editor">
        <div class="editor-header">
          <h3>Edit Character</h3>
          <button class="button button-secondary" id="delete-character-btn">
            🗑️ Delete
          </button>
        </div>
        <div class="editor-form">
          <div class="form-group">
            <label for="char-name">Name</label>
            <input type="text" id="char-name" value="${character.name}" />
          </div>
          <div class="form-group">
            <label for="char-species">Species</label>
            <input type="text" id="char-species" value="${character.species}" />
          </div>
          <div class="form-group">
            <label for="char-voice">Voice Type</label>
            <select id="char-voice">
              <option value="bweh" ${character.voice.type === 'bweh' ? 'selected' : ''}>Bweh (Energetic)</option>
              <option value="buh" ${character.voice.type === 'buh' ? 'selected' : ''}>Buh (Gruff)</option>
              <option value="pip" ${character.voice.type === 'pip' ? 'selected' : ''}>Pip (High-pitched)</option>
              <option value="meh" ${character.voice.type === 'meh' ? 'selected' : ''}>Meh (Monotone)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="char-pitch">Pitch Offset</label>
            <input type="range" id="char-pitch" min="-20" max="20" value="${character.voice.pitchOffset}" />
            <span class="range-value">${character.voice.pitchOffset}</span>
          </div>
          <div class="form-group">
            <label for="char-speed">Speed Offset</label>
            <input type="range" id="char-speed" min="-10" max="10" value="${character.voice.speedOffset}" />
            <span class="range-value">${character.voice.speedOffset}</span>
          </div>
          <div class="form-group">
            <label for="char-emotion">Default Emotion</label>
            <select id="char-emotion">
              <option value="neutral" ${character.defaultEmotion === 'neutral' ? 'selected' : ''}>Neutral</option>
              <option value="happy" ${character.defaultEmotion === 'happy' ? 'selected' : ''}>Happy</option>
              <option value="sad" ${character.defaultEmotion === 'sad' ? 'selected' : ''}>Sad</option>
              <option value="angry" ${character.defaultEmotion === 'angry' ? 'selected' : ''}>Angry</option>
              <option value="anxious" ${character.defaultEmotion === 'anxious' ? 'selected' : ''}>Anxious</option>
              <option value="tired" ${character.defaultEmotion === 'tired' ? 'selected' : ''}>Tired</option>
              <option value="excited" ${character.defaultEmotion === 'excited' ? 'selected' : ''}>Excited</option>
            </select>
          </div>
          <div class="form-group">
            <label for="char-sprite">Sprite Path</label>
            <input type="text" id="char-sprite" value="${character.spritePath}" />
          </div>
          <div class="form-group">
            <label>Relationship Config</label>
            <div class="relationship-config">
              <div class="config-row">
                <label>Default</label>
                <input type="number" id="char-rel-default" value="${character.relationships.defaultValue}" min="0" max="100" />
              </div>
              <div class="config-row">
                <label>Min</label>
                <input type="number" id="char-rel-min" value="${character.relationships.min}" min="0" max="100" />
              </div>
              <div class="config-row">
                <label>Max</label>
                <input type="number" id="char-rel-max" value="${character.relationships.max}" min="0" max="100" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Voice Preview</label>
            <div class="voice-preview">
              <input type="text" id="preview-text" value="Hello! How are you today?" placeholder="Enter text to preview..." />
              <button class="button" id="preview-voice-btn">▶ Play Preview</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Add character button
    this.container.querySelector('#add-character-btn')?.addEventListener('click', () => {
      this.addCharacter();
    });

    // Character card selection
    this.container.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', () => {
        const characterId = (card as HTMLElement).dataset.characterId;
        if (characterId) {
          this.selectedCharacterId = characterId;
          this.render();
        }
      });
    });

    // Delete character
    this.container.querySelector('#delete-character-btn')?.addEventListener('click', () => {
      this.deleteCharacter();
    });

    // Form inputs
    this.container.querySelector('#char-name')?.addEventListener('input', (e) => {
      this.updateCharacter({ name: (e.target as HTMLInputElement).value });
    });

    this.container.querySelector('#char-species')?.addEventListener('input', (e) => {
      this.updateCharacter({ species: (e.target as HTMLInputElement).value });
    });

    this.container.querySelector('#char-voice')?.addEventListener('change', (e) => {
      const voiceType = (e.target as HTMLSelectElement).value as 'bweh' | 'buh' | 'pip' | 'meh';
      this.updateCharacter({ voice: { type: voiceType } });
    });

    this.container.querySelector('#char-pitch')?.addEventListener('input', (e) => {
      const pitchOffset = parseInt((e.target as HTMLInputElement).value);
      this.updateCharacter({ voice: { pitchOffset } });
      // Update display
      const rangeValue = (e.target as HTMLElement).nextElementSibling;
      if (rangeValue) rangeValue.textContent = pitchOffset.toString();
    });

    this.container.querySelector('#char-speed')?.addEventListener('input', (e) => {
      const speedOffset = parseInt((e.target as HTMLInputElement).value);
      this.updateCharacter({ voice: { speedOffset } });
      // Update display
      const rangeValue = (e.target as HTMLElement).nextElementSibling;
      if (rangeValue) rangeValue.textContent = speedOffset.toString();
    });

    this.container.querySelector('#char-emotion')?.addEventListener('change', (e) => {
      const emotion = (e.target as HTMLSelectElement).value as Emotion;
      this.updateCharacter({ defaultEmotion: emotion });
    });

    this.container.querySelector('#char-sprite')?.addEventListener('input', (e) => {
      this.updateCharacter({ spritePath: (e.target as HTMLInputElement).value });
    });

    // Relationship config
    this.container.querySelector('#char-rel-default')?.addEventListener('input', (e) => {
      this.updateCharacter({ relationships: { defaultValue: parseInt((e.target as HTMLInputElement).value) } });
    });

    this.container.querySelector('#char-rel-min')?.addEventListener('input', (e) => {
      this.updateCharacter({ relationships: { min: parseInt((e.target as HTMLInputElement).value) } });
    });

    this.container.querySelector('#char-rel-max')?.addEventListener('input', (e) => {
      this.updateCharacter({ relationships: { max: parseInt((e.target as HTMLInputElement).value) } });
    });

    // Voice preview
    this.container.querySelector('#preview-voice-btn')?.addEventListener('click', () => {
      this.playVoicePreview();
    });
  }

  /**
   * Add a new character
   */
  private addCharacter(): void {
    const name = prompt('Enter character name:');
    if (!name) return;

    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      name,
      species: 'Character',
      voice: { type: 'bweh', pitchOffset: 0, speedOffset: 0 },
      defaultEmotion: 'neutral',
      spritePath: '/assets/sprites/default.png',
      relationships: { defaultValue: 50, min: 0, max: 100 },
    };

    this.characters.push(newCharacter);
    this.selectedCharacterId = newCharacter.id;
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Delete the selected character
   */
  private deleteCharacter(): void {
    if (!this.selectedCharacterId) return;

    if (!confirm('Delete this character? This cannot be undone.')) return;

    this.characters = this.characters.filter(c => c.id !== this.selectedCharacterId);
    this.selectedCharacterId = null;
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Update character properties
   */
  private updateCharacter(updates: Partial<Character>): void {
    const character = this.characters.find(c => c.id === this.selectedCharacterId);
    if (!character) return;

    // Merge updates
    if (updates.voice) {
      character.voice = { ...character.voice, ...updates.voice };
    }
    if (updates.relationships) {
      character.relationships = { ...character.relationships, ...updates.relationships };
    }

    Object.assign(character, updates);

    // Re-render card
    const card = this.container.querySelector(`[data-character-id="${character.id}"]`);
    if (card) {
      card.outerHTML = this.renderCharacterCard(character);
      this.attachEventListeners();
    }

    store.setState({ isDirty: true });
  }

  /**
   * Play voice preview using Web Audio API
   */
  private async playVoicePreview(): Promise<void> {
    const character = this.characters.find(c => c.id === this.selectedCharacterId);
    if (!character) return;

    const textInput = this.container.querySelector('#preview-text') as HTMLInputElement;
    const text = textInput?.value || 'Hello!';

    // Initialize AudioContext if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Simple syllable-based synthesis
    const syllables = text.split(/\s+/).flatMap(word => word.split(''));
    const voiceConfig = this.getVoiceConfig(character.voice.type);
    const emotionMultiplier = this.getEmotionMultiplier(character.defaultEmotion);

    const currentTime = this.audioContext.currentTime;
    let timeOffset = 0;

    syllables.forEach((syllable, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      // Configure voice
      const pitch = voiceConfig.pitchBase * emotionMultiplier.pitch + character.voice.pitchOffset;
      const duration = (voiceConfig.duration / 1000) * emotionMultiplier.tempo + (character.voice.speedOffset / 100);

      oscillator.type = voiceConfig.waveform;
      oscillator.frequency.value = pitch;

      gainNode.gain.value = 0.2;

      oscillator.start(currentTime + timeOffset);
      oscillator.stop(currentTime + timeOffset + duration);

      timeOffset += duration + 0.05; // Gap between syllables
    });

    console.log(`Playing preview: "${text}" with ${character.voice.type} voice`);
  }

  /**
   * Get voice configuration
   */
  private getVoiceConfig(voiceType: 'bweh' | 'buh' | 'pip' | 'meh'): {
    pitchBase: number;
    duration: number;
    waveform: OscillatorType;
  } {
    const configs = {
      bweh: { pitchBase: 300, duration: 120, waveform: 'sine' as OscillatorType },
      buh: { pitchBase: 200, duration: 140, waveform: 'triangle' as OscillatorType },
      pip: { pitchBase: 600, duration: 80, waveform: 'sine' as OscillatorType },
      meh: { pitchBase: 180, duration: 130, waveform: 'sine' as OscillatorType },
    };
    return configs[voiceType];
  }

  /**
   * Get emotion multipliers
   */
  private getEmotionMultiplier(emotion: Emotion): { pitch: number; tempo: number } {
    const multipliers: Record<Emotion, { pitch: number; tempo: number }> = {
      neutral: { pitch: 1.0, tempo: 1.0 },
      happy: { pitch: 1.2, tempo: 1.1 },
      sad: { pitch: 0.9, tempo: 0.8 },
      angry: { pitch: 1.15, tempo: 1.2 },
      anxious: { pitch: 1.1, tempo: 1.15 },
      tired: { pitch: 0.85, tempo: 0.7 },
      excited: { pitch: 1.3, tempo: 1.3 },
    };
    return multipliers[emotion] || multipliers.neutral;
  }

  /**
   * Destroy view
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
