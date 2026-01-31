/**
 * AudioManager
 * Handles background music and sound effects
 * Supports volume controls with visual-only fallback
 */

export type MusicTrack = 'ambient-home' | 'meeting-tension' | 'menu';
export type SoundEffect = 'ui-click' | 'stat-increase' | 'stat-decrease' | 'notification' | 'achievement';

export interface AudioSettings {
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export class AudioManager {
  private scene: Phaser.Scene;
  private settings: AudioSettings;

  // Music tracks
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private musicTracks: Map<MusicTrack, string> = new Map();

  // Sound effects
  private soundEffects: Map<SoundEffect, string> = new Map();

  // Fade tweens
  private fadeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load settings
    this.settings = this.loadSettings();

    // Define audio asset keys
    this.defineAssets();
  }

  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): AudioSettings {
    try {
      const saved = localStorage.getItem('audio-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }

    return {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      musicEnabled: true,
      sfxEnabled: true,
    };
  }

  /**
   * Save audio settings
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  /**
   * Define asset keys for audio files
   */
  private defineAssets(): void {
    // Music tracks
    this.musicTracks.set('ambient-home', 'music-ambient-home');
    this.musicTracks.set('meeting-tension', 'music-meeting-tension');
    this.musicTracks.set('menu', 'music-menu');

    // Sound effects
    this.soundEffects.set('ui-click', 'sfx-ui-click');
    this.soundEffects.set('stat-increase', 'sfx-stat-increase');
    this.soundEffects.set('stat-decrease', 'sfx-stat-decrease');
    this.soundEffects.set('notification', 'sfx-notification');
    this.soundEffects.set('achievement', 'sfx-achievement');
  }

  /**
   * Play music track
   */
  playMusic(track: MusicTrack, fadeInDuration: number = 1000): void {
    if (!this.settings.musicEnabled) return;

    const key = this.musicTracks.get(track);
    if (!key) {
      console.warn(`Music track not found: ${track}`);
      return;
    }

    // Check if already playing this track
    if (this.currentMusic && (this.currentMusic as any).key === key) {
      return;
    }

    // Fade out current music if playing
    if (this.currentMusic) {
      this.fadeOutMusic(500, () => {
        this.startMusic(key, fadeInDuration);
      });
    } else {
      this.startMusic(key, fadeInDuration);
    }
  }

  /**
   * Start playing music
   */
  private startMusic(key: string, fadeInDuration: number): void {
    try {
      this.currentMusic = this.scene.sound.add(key, {
        loop: true,
        volume: 0,
      });

      this.currentMusic.play();

      // Fade in
      if (fadeInDuration > 0) {
        this.fadeTween = this.scene.tweens.add({
          targets: this.currentMusic,
          volume: this.settings.musicVolume,
          duration: fadeInDuration,
          ease: 'Linear',
        });
      } else {
        (this.currentMusic as any).volume = this.settings.musicVolume;
      }
    } catch (error) {
      console.error('Failed to play music:', error);
    }
  }

  /**
   * Fade out current music
   */
  private fadeOutMusic(duration: number, onComplete?: () => void): void {
    if (!this.currentMusic) {
      if (onComplete) onComplete();
      return;
    }

    const music = this.currentMusic;

    if (this.fadeTween) {
      this.fadeTween.stop();
    }

    this.fadeTween = this.scene.tweens.add({
      targets: music,
      volume: 0,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        music.stop();
        if (music !== this.currentMusic) {
          music.destroy();
        }
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Stop music
   */
  stopMusic(fadeOutDuration: number = 500): void {
    if (this.currentMusic) {
      this.fadeOutMusic(fadeOutDuration, () => {
        this.currentMusic = null;
      });
    }
  }

  /**
   * Play sound effect
   */
  playSfx(effect: SoundEffect): void {
    if (!this.settings.sfxEnabled) return;

    const key = this.soundEffects.get(effect);
    if (!key) {
      console.warn(`Sound effect not found: ${effect}`);
      return;
    }

    try {
      this.scene.sound.play(key, {
        volume: this.settings.sfxVolume,
      });
    } catch (error) {
      console.error('Failed to play sound effect:', error);
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Phaser.Math.Clamp(volume, 0, 1);

    if (this.currentMusic) {
      (this.currentMusic as any).volume = this.settings.musicVolume;
    }

    this.saveSettings();
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveSettings();
  }

  /**
   * Toggle music on/off
   */
  toggleMusic(enabled?: boolean): void {
    this.settings.musicEnabled = enabled !== undefined ? enabled : !this.settings.musicEnabled;

    if (!this.settings.musicEnabled && this.currentMusic) {
      this.stopMusic();
    }

    this.saveSettings();
  }

  /**
   * Toggle SFX on/off
   */
  toggleSfx(enabled?: boolean): void {
    this.settings.sfxEnabled = enabled !== undefined ? enabled : !this.settings.sfxEnabled;
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Preload audio assets (call in BootScene)
   */
  static preloadAssets(scene: Phaser.Scene): void {
    // Music tracks (placeholder paths - replace with actual asset paths)
    scene.load.audio('music-ambient-home', '/assets/audio/music/ambient-home.mp3');
    scene.load.audio('music-meeting-tension', '/assets/audio/music/meeting-tension.mp3');
    scene.load.audio('music-menu', '/assets/audio/music/menu.mp3');

    // Sound effects
    scene.load.audio('sfx-ui-click', '/assets/audio/sfx/ui-click.mp3');
    scene.load.audio('sfx-stat-increase', '/assets/audio/sfx/stat-increase.mp3');
    scene.load.audio('sfx-stat-decrease', '/assets/audio/sfx/stat-decrease.mp3');
    scene.load.audio('sfx-notification', '/assets/audio/sfx/notification.mp3');
    scene.load.audio('sfx-achievement', '/assets/audio/sfx/achievement.mp3');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMusic(0);

    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
  }
}
