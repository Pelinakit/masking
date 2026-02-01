/**
 * CharacterView Component
 * Character database with voice configuration and preview
 * Integrates with speech-gen for voice preview
 */

import { store } from '../state/store.js';
import { speechService, type VoiceType, type EmotionalTone } from '../services/SpeechService.js';
import { entityRegistry } from '../services/EntityRegistry.js';
import { fileService } from '../services/FileService.js';
import type { Character, VoiceConfig, Emotion } from '../types/index.js';

export class CharacterView {
  private container: HTMLElement;
  private characters: Character[] = [];
  private selectedCharacterId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadCharacters();
    this.render();
  }

  /**
   * Load characters from EntityRegistry and files
   */
  private async loadCharacters(): Promise<void> {
    // Get characters from EntityRegistry
    const registryChars = entityRegistry.getCharacters();

    // Convert to full Character objects (with defaults for missing fields)
    this.characters = registryChars.map(char => ({
      id: char.id,
      name: char.name,
      species: char.species || 'Character',
      voice: { type: 'bweh' as const, pitchOffset: 0, speedOffset: 0 },
      defaultEmotion: 'neutral' as Emotion,
      spritePath: `/assets/sprites/${char.id}.png`,
      relationships: { defaultValue: 50, min: 0, max: 100 },
    }));

    // Try to load full character data from files
    await this.loadCharacterDetails();

    this.render();
  }

  /**
   * Load detailed character data from YAML files
   */
  private async loadCharacterDetails(): Promise<void> {
    for (const char of this.characters) {
      try {
        const data = await fileService.readFile(`public/data/characters/${char.id}.yaml`);
        const parsed = this.parseYAML(data.content);

        if (parsed) {
          if (parsed.species) char.species = parsed.species;
          if (parsed.spritePath) char.spritePath = parsed.spritePath;
          if (parsed.defaultEmotion) char.defaultEmotion = parsed.defaultEmotion as Emotion;
          if (parsed.voice) {
            char.voice = {
              type: (parsed.voice.type || 'bweh') as 'bweh' | 'buh' | 'pip' | 'meh',
              pitchOffset: parsed.voice.pitchOffset || 0,
              speedOffset: parsed.voice.speedOffset || 0,
            };
          }
        }
      } catch {
        // File doesn't exist yet, use defaults
      }
    }
  }

  /**
   * Simple YAML parser
   */
  private parseYAML(content: string): any {
    try {
      const result: any = { voice: {} };
      const lines = content.split('\n');
      let inVoice = false;

      for (const line of lines) {
        if (line.trim() === 'voice:') {
          inVoice = true;
          continue;
        }

        if (inVoice && line.startsWith('  ')) {
          const match = line.trim().match(/^(\w+):\s*(.*)$/);
          if (match) {
            const [, key, value] = match;
            result.voice[key] = isNaN(Number(value)) ? value : Number(value);
          }
        } else if (line.match(/^\w/)) {
          inVoice = false;
          const match = line.match(/^(\w+):\s*(.*)$/);
          if (match) {
            const [, key, value] = match;
            result[key] = value.replace(/^["']|["']$/g, '');
          }
        }
      }

      return result;
    } catch {
      return null;
    }
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
              <option value="bubbly" ${character.defaultEmotion === 'bubbly' ? 'selected' : ''}>Bubbly/Happy</option>
              <option value="sad" ${character.defaultEmotion === 'sad' ? 'selected' : ''}>Sad</option>
              <option value="stern" ${character.defaultEmotion === 'stern' ? 'selected' : ''}>Stern</option>
              <option value="angry" ${character.defaultEmotion === 'angry' ? 'selected' : ''}>Angry</option>
              <option value="giggling" ${character.defaultEmotion === 'giggling' ? 'selected' : ''}>Giggling</option>
              <option value="laughing" ${character.defaultEmotion === 'laughing' ? 'selected' : ''}>Laughing</option>
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
  private async addCharacter(): Promise<void> {
    const name = prompt('Enter character name:');
    if (!name) return;

    // Add to EntityRegistry (which also saves to file)
    const entityChar = await entityRegistry.addCharacter({ name, role: '' });

    const newCharacter: Character = {
      id: entityChar.id,
      name: entityChar.name,
      species: 'Character',
      voice: { type: 'bweh', pitchOffset: 0, speedOffset: 0 },
      defaultEmotion: 'neutral',
      spritePath: `/assets/sprites/${entityChar.id}.png`,
      relationships: { defaultValue: 50, min: 0, max: 100 },
    };

    this.characters.push(newCharacter);
    this.selectedCharacterId = newCharacter.id;
    this.render();

    // Save full character data to file
    await this.saveCharacterToFile(newCharacter);

    store.setState({ isDirty: true });
  }

  /**
   * Save character to YAML file
   */
  private async saveCharacterToFile(char: Character): Promise<void> {
    const yaml = `id: ${char.id}
name: ${char.name}
species: ${char.species}
spritePath: ${char.spritePath}
defaultEmotion: ${char.defaultEmotion}
voice:
  type: ${char.voice.type}
  pitchOffset: ${char.voice.pitchOffset}
  speedOffset: ${char.voice.speedOffset}
relationships:
  defaultValue: ${char.relationships.defaultValue}
  min: ${char.relationships.min}
  max: ${char.relationships.max}
`;

    try {
      await fileService.writeFile(`public/data/characters/${char.id}.yaml`, yaml);
      console.log(`[CharacterView] Saved character: ${char.id}`);
    } catch (error) {
      console.error('[CharacterView] Failed to save character:', error);
    }
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

    // Update card display without full re-render (avoids input focus issues)
    const card = this.container.querySelector(`[data-character-id="${character.id}"]`);
    if (card) {
      const nameEl = card.querySelector('h4');
      const speciesEl = card.querySelector('.character-species');
      const voiceBadge = card.querySelector('.character-voice-badge');

      if (nameEl) nameEl.textContent = character.name;
      if (speciesEl) speciesEl.textContent = character.species;
      if (voiceBadge) voiceBadge.textContent = `🔊 ${character.voice.type}`;
    }

    // Save to file (debounced would be better, but this is simple)
    this.saveCharacterToFile(character);

    store.setState({ isDirty: true });
  }

  /**
   * Play voice preview using speech-gen service
   */
  private async playVoicePreview(): Promise<void> {
    const character = this.characters.find(c => c.id === this.selectedCharacterId);
    if (!character) return;

    const textInput = this.container.querySelector('#preview-text') as HTMLInputElement;
    const text = textInput?.value || 'Hello!';

    // Map character emotion to speech-gen emotion
    const emotion = this.mapToSpeechGenEmotion(character.defaultEmotion);

    console.log(`Playing preview: "${text}" with ${character.voice.type} voice, ${emotion} emotion`);

    try {
      await speechService.play(
        text,
        character.voice.type as VoiceType,
        emotion
      );
    } catch (error) {
      console.error('Voice preview failed:', error);
    }
  }

  /**
   * Map character emotion to speech-gen emotion
   */
  private mapToSpeechGenEmotion(emotion: Emotion): EmotionalTone {
    const mapping: Record<string, EmotionalTone> = {
      neutral: 'neutral',
      bubbly: 'bubbly',
      happy: 'bubbly',
      sad: 'sad',
      stern: 'stern',
      angry: 'angry',
      anxious: 'stern',
      tired: 'sad',
      excited: 'bubbly',
      giggling: 'giggling',
      laughing: 'laughing',
    };
    return mapping[emotion] || 'neutral';
  }

  /**
   * Destroy view
   */
  destroy(): void {
    speechService.stop();
  }
}
