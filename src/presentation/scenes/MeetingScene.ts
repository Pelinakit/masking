/**
 * MeetingScene
 * Core mechanic - Zoom meeting with mask selection
 * Loads meeting definitions from YAML scenarios
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';
import { Character, type CharacterConfig } from '@presentation/components/Character';
import { ScenarioLoader } from '@scripting/ScenarioLoader';
import type { Meeting, MeetingEvent as ScenarioMeetingEvent, MeetingChoice as ScenarioMeetingChoice } from '@scripting/types/ScenarioTypes';

export interface MaskType {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  stressCost: number;
  icon: string;
  color: number;
}

export interface Participant {
  name: string;
  role: string;
  mood: 'happy' | 'neutral' | 'annoyed' | 'angry';
}

export class MeetingScene extends Phaser.Scene {
  private stateManager!: StateManager;
  private scenarioLoader!: ScenarioLoader;
  private meeting?: Meeting;

  private currentMask: string | null = null;
  private meetingProgress: number = 0;
  private meetingDuration: number = 30; // minutes
  private currentEventIndex: number = 0;

  // Mask types
  private masks: MaskType[] = [
    {
      id: 'none',
      name: 'No Mask',
      description: 'Be yourself - risky in professional settings',
      energyCost: 0,
      stressCost: 0,
      icon: '😊',
      color: 0x95a5a6,
    },
    {
      id: 'meeting-participant',
      name: 'Meeting Participant',
      description: 'Standard professional demeanor',
      energyCost: 10,
      stressCost: 5,
      icon: '🙂',
      color: 0x3498db,
    },
    {
      id: 'presenter',
      name: 'Presenter',
      description: 'Confident and engaging',
      energyCost: 20,
      stressCost: 10,
      icon: '😄',
      color: 0xe74c3c,
    },
    {
      id: 'casual-colleague',
      name: 'Casual Colleague',
      description: 'Friendly and approachable',
      energyCost: 5,
      stressCost: 3,
      icon: '😎',
      color: 0x2ecc71,
    },
    {
      id: 'careful-subordinate',
      name: 'Careful Subordinate',
      description: 'Respectful and attentive to authority',
      energyCost: 15,
      stressCost: 12,
      icon: '😌',
      color: 0xf39c12,
    },
    {
      id: 'professional-client-facer',
      name: 'Professional Client-Facer',
      description: 'Polished and corporate',
      energyCost: 25,
      stressCost: 15,
      icon: '😇',
      color: 0x9b59b6,
    },
  ];

  // UI containers
  private videoGridContainer!: Phaser.GameObjects.Container;
  private maskSelectorContainer!: Phaser.GameObjects.Container;
  private eventContainer!: Phaser.GameObjects.Container;
  private currentMaskDisplay!: Phaser.GameObjects.Container;

  // Participant character sprites
  private participantCharacters: Map<string, Character> = new Map();
  private characterConfigs: CharacterConfig[] = [];

  constructor() {
    super({ key: 'MeetingScene' });
  }

  init(data: any): void {
    // Expect data.meetingId to load from YAML
    // Or data.meeting if passed directly
    if (data.meeting) {
      this.meeting = data.meeting;
      this.meetingDuration = data.meeting.duration || 30;
    }
  }

  async create(): Promise<void> {
    this.stateManager = new StateManager();
    this.scenarioLoader = new ScenarioLoader();

    // Load meeting from YAML if only ID was provided
    if (!this.meeting) {
      await this.loadMeetingFromScenario();
    }

    // Load character configs from registry
    this.characterConfigs = this.registry.get('characterConfigs') as CharacterConfig[] || [];

    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    // Create UI sections
    this.createVideoGrid();
    this.createMaskSelector();
    this.createEventArea();
    this.createCurrentMaskDisplay();

    // Start meeting
    this.startMeeting();
  }

  /**
   * Load meeting from current scenario
   */
  private async loadMeetingFromScenario(): Promise<void> {
    try {
      const scenario = this.scenarioLoader.getCurrentScenario();
      if (!scenario) {
        console.warn('No current scenario loaded');
        return;
      }

      // Get first meeting from scenario
      if (scenario.meetings && scenario.meetings.length > 0) {
        this.meeting = scenario.meetings[0];
        this.meetingDuration = this.meeting.duration || 30;
      }
    } catch (error) {
      console.error('Failed to load meeting from scenario:', error);
    }
  }

  /**
   * Create video grid showing participants
   */
  private createVideoGrid(): void {
    this.videoGridContainer = this.add.container(0, 0);
    this.participantCharacters.clear();

    const { width } = this.cameras.main;
    const participants = this.meeting?.participants || [];
    const videoWidth = 200;
    const videoHeight = 150;
    const spacing = 20;

    // Get accessibility settings
    const accessibilitySettings = this.stateManager.getAccessibilitySettings();

    participants.forEach((participant, index) => {
      const x = 20 + (index % 3) * (videoWidth + spacing);
      const y = 20 + Math.floor(index / 3) * (videoHeight + spacing);

      // Video background
      const videoBg = this.add.rectangle(x, y, videoWidth, videoHeight, 0x2c3e50);
      videoBg.setOrigin(0);

      // Try to find character config for this participant
      const charConfig = this.findCharacterConfig(participant.name);

      if (charConfig) {
        // Create Character sprite for participant
        const character = new Character(
          this,
          x + videoWidth / 2,
          y + videoHeight / 2 + 20,
          charConfig,
          accessibilitySettings
        );
        character.setOrigin(0.5, 0.5);
        // Scale to fit in video box
        const scale = Math.min(
          (videoWidth * 0.6) / charConfig.spritesheet.frameWidth,
          (videoHeight * 0.6) / charConfig.spritesheet.frameHeight
        );
        character.setScale(scale);

        this.participantCharacters.set(participant.name, character);
        this.videoGridContainer.add(character);
      } else {
        // Fallback to emoji icon
        const icon = this.add.text(
          x + videoWidth / 2,
          y + videoHeight / 2 - 20,
          this.getParticipantIcon(participant),
          { fontSize: '48px' }
        );
        icon.setOrigin(0.5);
        this.videoGridContainer.add(icon);
      }

      // Name tag
      const nameTag = this.add.rectangle(x, y + videoHeight - 30, videoWidth, 30, 0x000000, 0.7);
      nameTag.setOrigin(0);

      const nameText = this.add.text(x + 10, y + videoHeight - 15, participant.name, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      });
      nameText.setOrigin(0, 0.5);

      this.videoGridContainer.add([videoBg, nameTag, nameText]);
    });
  }

  /**
   * Find character config by participant name
   */
  private findCharacterConfig(participantName: string): CharacterConfig | undefined {
    // Look for a character config that matches the participant
    return this.characterConfigs.find((config) => config.name === participantName);
  }

  /**
   * Get participant icon based on mood
   */
  private getParticipantIcon(participant: { name: string; role?: string; mood?: string }): string {
    const mood = participant.mood || 'neutral';
    const icons: Record<string, string> = {
      happy: '😊',
      neutral: '😐',
      annoyed: '😒',
      angry: '😠',
    };
    return icons[mood] || '😐';
  }

  /**
   * Create mask selector interface
   */
  private createMaskSelector(): void {
    this.maskSelectorContainer = this.add.container(0, 0);

    const { width, height } = this.cameras.main;
    const selectorY = height - 200;

    // Background panel
    const panel = this.add.rectangle(width / 2, selectorY, width - 40, 180, 0x34495e, 0.95);

    // Title
    const title = this.add.text(width / 2, selectorY - 70, 'Choose Your Mask:', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#ecf0f1',
    });
    title.setOrigin(0.5);

    this.maskSelectorContainer.add([panel, title]);

    // Mask buttons
    const maskSpacing = 100;
    const startX = width / 2 - (this.masks.length * maskSpacing) / 2 + 50;

    this.masks.forEach((mask, index) => {
      const x = startX + index * maskSpacing;
      const y = selectorY;

      // Mask button
      const btn = this.add.rectangle(x, y, 80, 80, mask.color);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.selectMask(mask.id));
      btn.on('pointerover', () => {
        btn.setScale(1.1);
        this.showMaskTooltip(mask, x, y - 50);
      });
      btn.on('pointerout', () => {
        btn.setScale(1.0);
        this.hideMaskTooltip();
      });

      // Icon
      const icon = this.add.text(x, y, mask.icon, {
        fontSize: '32px',
      });
      icon.setOrigin(0.5);

      this.maskSelectorContainer.add([btn, icon]);
    });
  }

  /**
   * Show mask tooltip
   */
  private showMaskTooltip(mask: MaskType, x: number, y: number): void {
    // TODO: Implement tooltip showing mask details
  }

  /**
   * Hide mask tooltip
   */
  private hideMaskTooltip(): void {
    // TODO: Implement tooltip hiding
  }

  /**
   * Select a mask
   */
  private selectMask(maskId: string): void {
    const previousMask = this.currentMask;
    this.currentMask = maskId;

    const mask = this.masks.find(m => m.id === maskId);
    if (!mask) return;

    // Apply energy and stress costs
    if (previousMask) {
      // Switching masks mid-meeting costs extra
      this.stateManager.stats.modifyStat('energy', -mask.energyCost * 1.5);
      this.stateManager.stats.modifyStat('stress', mask.stressCost * 1.5);
    } else {
      this.stateManager.stats.modifyStat('energy', -mask.energyCost);
      this.stateManager.stats.modifyStat('stress', mask.stressCost);
    }

    // Update display
    this.updateCurrentMaskDisplay();

    // Check if correct mask
    this.checkMaskAlignment();
  }

  /**
   * Create event area for meeting interactions
   */
  private createEventArea(): void {
    this.eventContainer = this.add.container(0, 0);
    this.eventContainer.setVisible(false);

    const { width, height } = this.cameras.main;

    // Event background
    const eventBg = this.add.rectangle(width / 2, height / 2, width - 100, 300, 0x2c3e50, 0.95);
    eventBg.setStrokeStyle(3, 0xecf0f1);

    this.eventContainer.add(eventBg);
  }

  /**
   * Show meeting event with choices
   */
  private showEvent(event: ScenarioMeetingEvent): void {
    this.eventContainer.removeAll(true);
    this.eventContainer.setVisible(true);

    // Update participant animations - speaker talks, others idle
    this.updateParticipantAnimations(event.speaker);

    const { width, height } = this.cameras.main;

    // Event background
    const eventBg = this.add.rectangle(width / 2, height / 2, width - 100, 300, 0x2c3e50, 0.95);
    eventBg.setStrokeStyle(3, 0xecf0f1);

    // Speaker
    const speaker = this.add.text(width / 2, height / 2 - 120, `${event.speaker}:`, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    speaker.setOrigin(0.5);

    // Event text
    const text = this.add.text(width / 2, height / 2 - 80, event.text, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ecf0f1',
      wordWrap: { width: width - 140 },
      align: 'center',
    });
    text.setOrigin(0.5);

    this.eventContainer.add([eventBg, speaker, text]);

    // Choices
    if (event.choices) {
      const choiceStartY = height / 2 + 20;

      event.choices.forEach((choice, index) => {
        const y = choiceStartY + index * 60;

        // Choice button
        const choiceBtn = this.add.rectangle(width / 2, y, width - 140, 50, 0x3498db);
        choiceBtn.setInteractive({ useHandCursor: true });
        choiceBtn.on('pointerdown', () => this.handleChoice(choice));
        choiceBtn.on('pointerover', () => choiceBtn.setFillStyle(0x2980b9));
        choiceBtn.on('pointerout', () => choiceBtn.setFillStyle(0x3498db));

        const choiceText = this.add.text(width / 2, y, choice.text, {
          fontFamily: 'Comic Relief, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
          wordWrap: { width: width - 160 },
          align: 'center',
        });
        choiceText.setOrigin(0.5);

        this.eventContainer.add([choiceBtn, choiceText]);
      });
    }
  }

  /**
   * Handle meeting choice
   */
  private handleChoice(choice: ScenarioMeetingChoice): void {
    // Apply costs from YAML
    this.stateManager.stats.modifyStat('energy', -choice.energyCost);
    this.stateManager.stats.modifyStat('stress', choice.stressCost);

    // Check if using wrong mask
    if (choice.mask && this.currentMask !== choice.mask) {
      // Wrong mask - extra penalties
      this.stateManager.stats.modifyStat('stress', 10);
      console.log('Wrong mask used! Extra stress.');
    }

    // Apply effects from YAML
    if (choice.effects) {
      choice.effects.forEach((effect) => {
        switch (effect.type) {
          case 'relationship':
            if (effect.target && typeof effect.value === 'number') {
              this.stateManager.relationships.modifyRelationship(effect.target, effect.value);
            }
            break;
          case 'stat':
            if (effect.stat && typeof effect.value === 'number') {
              this.stateManager.stats.modifyStat(effect.stat as any, effect.value);
            }
            break;
          case 'unlock':
            // Handle content unlocking
            console.log('Unlocked:', effect.target);
            break;
        }
      });
    }

    // Show consequence
    if (choice.consequence) {
      console.log(choice.consequence);
    }

    // Reset all participants to idle
    this.updateParticipantAnimations(null);

    // Continue meeting
    this.eventContainer.setVisible(false);
    this.progressMeeting();
  }

  /**
   * Update participant animations based on who is speaking
   */
  private updateParticipantAnimations(speakerName: string | null): void {
    this.participantCharacters.forEach((character, name) => {
      if (speakerName && name === speakerName) {
        character.playAnimation('talk');
      } else {
        character.playAnimation('idle');
      }
    });
  }

  /**
   * Create current mask display
   */
  private createCurrentMaskDisplay(): void {
    this.currentMaskDisplay = this.add.container(0, 0);

    const { width } = this.cameras.main;

    const displayBg = this.add.rectangle(width - 120, 20, 100, 60, 0x34495e, 0.9);
    displayBg.setOrigin(0);

    const label = this.add.text(width - 70, 30, 'Mask:', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '12px',
      color: '#ecf0f1',
    });
    label.setOrigin(0.5, 0);

    this.currentMaskDisplay.add([displayBg, label]);
  }

  /**
   * Update current mask display
   */
  private updateCurrentMaskDisplay(): void {
    const { width } = this.cameras.main;

    // Remove old icon
    if (this.currentMaskDisplay.length > 2) {
      this.currentMaskDisplay.getAt(2)?.destroy();
    }

    const mask = this.masks.find(m => m.id === this.currentMask);
    if (mask) {
      const icon = this.add.text(width - 70, 55, mask.icon, {
        fontSize: '24px',
      });
      icon.setOrigin(0.5);
      this.currentMaskDisplay.add(icon);
    }
  }

  /**
   * Check if current mask aligns with meeting requirements
   */
  private checkMaskAlignment(): void {
    if (!this.meeting?.requiredMask) return;

    if (this.currentMask === this.meeting.requiredMask) {
      console.log('Good mask choice!');
    } else if (this.currentMask === 'none') {
      console.log('No mask in professional setting - risky!');
      this.stateManager.stats.modifyStat('stress', 15);
    } else {
      console.log('Mask mismatch - increased energy drain');
      this.stateManager.stats.modifyStat('energy', -5);
    }
  }

  /**
   * Start the meeting
   */
  private startMeeting(): void {
    console.log('Meeting started:', this.meeting?.title);

    // First event after 5 seconds
    this.time.delayedCall(5000, () => {
      if (this.meeting?.events && this.meeting.events.length > 0) {
        this.showEvent(this.meeting.events[0]);
      }
    });

    // Progress meeting over time
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateMeeting(),
      loop: true,
    });
  }

  /**
   * Update meeting progress
   */
  private updateMeeting(): void {
    this.meetingProgress += 1;

    // Ongoing energy drain from mask
    if (this.currentMask) {
      const mask = this.masks.find(m => m.id === this.currentMask);
      if (mask) {
        this.stateManager.stats.modifyStat('energy', -mask.energyCost / 60);
      }
    }

    // Check for time-based events
    const minutesElapsed = Math.floor(this.meetingProgress / 60);
    if (this.meeting?.events) {
      const nextEvent = this.meeting.events[this.currentEventIndex];
      if (nextEvent && nextEvent.time <= minutesElapsed) {
        this.showEvent(nextEvent);
      }
    }

    // End meeting after duration
    if (this.meetingProgress >= this.meetingDuration * 60) {
      this.endMeeting();
    }
  }

  /**
   * Progress to next meeting phase
   */
  private progressMeeting(): void {
    this.currentEventIndex++;
    // Next event will be shown by updateMeeting based on time
  }

  /**
   * End the meeting
   */
  private endMeeting(): void {
    console.log('Meeting ended');

    // Mark meeting as attended in scenario state
    if (this.meeting?.id) {
      this.scenarioLoader.attendMeeting(this.meeting.id);
    }

    // Time passes
    this.stateManager.time.skipMinutes(this.meetingDuration);

    // Return to laptop or room
    this.scene.stop('MeetingScene');
    this.scene.resume('LaptopScene');
  }
}
