/**
 * TutorialManager
 * Manages skippable tutorial with pulsating arrow indicators
 * Progressive disclosure system
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetX?: number;
  targetY?: number;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  condition?: () => boolean;
  onComplete?: () => void;
}

export interface TutorialState {
  completed: boolean;
  skipped: boolean;
  currentStep: string | null;
  completedSteps: string[];
}

export class TutorialManager {
  private scene: Phaser.Scene;
  private state: TutorialState;
  private steps: TutorialStep[] = [];
  private currentStepIndex: number = 0;

  // UI elements
  private tutorialContainer?: Phaser.GameObjects.Container;
  private arrow?: Phaser.GameObjects.Graphics;
  private textBox?: Phaser.GameObjects.Container;
  private skipButton?: Phaser.GameObjects.Container;

  // Animation
  private arrowTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load or initialize tutorial state
    this.state = this.loadState();
  }

  /**
   * Load tutorial state from localStorage
   */
  private loadState(): TutorialState {
    try {
      const saved = localStorage.getItem('tutorial-state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load tutorial state:', error);
    }

    return {
      completed: false,
      skipped: false,
      currentStep: null,
      completedSteps: [],
    };
  }

  /**
   * Save tutorial state
   */
  private saveState(): void {
    try {
      localStorage.setItem('tutorial-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save tutorial state:', error);
    }
  }

  /**
   * Check if tutorial should run
   */
  shouldRunTutorial(): boolean {
    return !this.state.completed && !this.state.skipped;
  }

  /**
   * Define tutorial steps
   */
  defineSteps(steps: TutorialStep[]): void {
    this.steps = steps;
  }

  /**
   * Start tutorial
   */
  start(): void {
    if (!this.shouldRunTutorial() || this.steps.length === 0) {
      return;
    }

    this.currentStepIndex = 0;
    this.showStep(this.steps[0]);
  }

  /**
   * Show tutorial step
   */
  private showStep(step: TutorialStep): void {
    this.state.currentStep = step.id;
    this.clearUI();

    const { width, height } = this.scene.cameras.main;

    // Create container
    this.tutorialContainer = this.scene.add.container(0, 0);
    this.tutorialContainer.setDepth(1000); // Always on top

    // Show arrow if target specified
    if (step.targetX !== undefined && step.targetY !== undefined) {
      this.showArrow(step.targetX, step.targetY, step.arrowDirection || 'down');
    }

    // Show text box
    this.showTextBox(step.title, step.description);

    // Show skip button
    this.showSkipButton();
  }

  /**
   * Show pulsating arrow
   */
  private showArrow(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right'): void {
    this.arrow = this.scene.add.graphics();
    this.arrow.fillStyle(0xffff00, 1);
    this.arrow.lineStyle(3, 0xffffff, 1);

    // Draw arrow based on direction
    const arrowSize = 40;
    const points: Phaser.Geom.Point[] = [];

    switch (direction) {
      case 'up':
        points.push(new Phaser.Geom.Point(0, 0));
        points.push(new Phaser.Geom.Point(-arrowSize / 2, arrowSize));
        points.push(new Phaser.Geom.Point(arrowSize / 2, arrowSize));
        break;
      case 'down':
        points.push(new Phaser.Geom.Point(0, arrowSize));
        points.push(new Phaser.Geom.Point(-arrowSize / 2, 0));
        points.push(new Phaser.Geom.Point(arrowSize / 2, 0));
        break;
      case 'left':
        points.push(new Phaser.Geom.Point(0, 0));
        points.push(new Phaser.Geom.Point(arrowSize, -arrowSize / 2));
        points.push(new Phaser.Geom.Point(arrowSize, arrowSize / 2));
        break;
      case 'right':
        points.push(new Phaser.Geom.Point(arrowSize, 0));
        points.push(new Phaser.Geom.Point(0, -arrowSize / 2));
        points.push(new Phaser.Geom.Point(0, arrowSize / 2));
        break;
    }

    this.arrow.fillPoints(points, true);
    this.arrow.strokePoints(points, true);
    this.arrow.setPosition(x, y);

    // Pulsating animation
    this.arrowTween = this.scene.tweens.add({
      targets: this.arrow,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tutorialContainer?.add(this.arrow);
  }

  /**
   * Show text box with tutorial content
   */
  private showTextBox(title: string, description: string): void {
    const { width, height } = this.scene.cameras.main;

    this.textBox = this.scene.add.container(width / 2, height - 150);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 500, 120, 0x34495e, 0.95);
    bg.setStrokeStyle(3, 0xecf0f1);

    // Title
    const titleText = this.scene.add.text(0, -40, title, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#ecf0f1',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);

    // Description
    const descText = this.scene.add.text(0, 0, description, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ecf0f1',
      wordWrap: { width: 460 },
      align: 'center',
    });
    descText.setOrigin(0.5);

    // Next button
    const nextBtn = this.scene.add.rectangle(0, 45, 120, 40, 0x2ecc71);
    nextBtn.setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextStep());

    const nextText = this.scene.add.text(0, 45, 'Got it!', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    nextText.setOrigin(0.5);

    this.textBox.add([bg, titleText, descText, nextBtn, nextText]);
    this.tutorialContainer?.add(this.textBox);
  }

  /**
   * Show skip button
   */
  private showSkipButton(): void {
    const { width } = this.scene.cameras.main;

    this.skipButton = this.scene.add.container(width - 100, 30);

    const bg = this.scene.add.rectangle(0, 0, 120, 40, 0xe74c3c);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.skip());

    const text = this.scene.add.text(0, 0, 'Skip Tutorial', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    this.skipButton.add([bg, text]);
    this.tutorialContainer?.add(this.skipButton);
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    const currentStep = this.steps[this.currentStepIndex];

    // Mark step as completed
    if (!this.state.completedSteps.includes(currentStep.id)) {
      this.state.completedSteps.push(currentStep.id);
    }

    // Call step completion callback
    if (currentStep.onComplete) {
      currentStep.onComplete();
    }

    // Move to next step
    this.currentStepIndex++;

    if (this.currentStepIndex < this.steps.length) {
      const nextStep = this.steps[this.currentStepIndex];

      // Check condition if exists
      if (nextStep.condition && !nextStep.condition()) {
        // Skip this step
        this.nextStep();
        return;
      }

      this.showStep(nextStep);
    } else {
      this.complete();
    }

    this.saveState();
  }

  /**
   * Skip tutorial
   */
  skip(): void {
    this.state.skipped = true;
    this.state.currentStep = null;
    this.saveState();
    this.clearUI();

    console.log('Tutorial skipped');
    this.scene.events.emit('tutorialSkipped');
  }

  /**
   * Complete tutorial
   */
  complete(): void {
    this.state.completed = true;
    this.state.currentStep = null;
    this.saveState();
    this.clearUI();

    console.log('Tutorial completed');
    this.scene.events.emit('tutorialCompleted');
  }

  /**
   * Clear tutorial UI
   */
  private clearUI(): void {
    if (this.arrowTween) {
      this.arrowTween.stop();
      this.arrowTween = undefined;
    }

    if (this.tutorialContainer) {
      this.tutorialContainer.destroy();
      this.tutorialContainer = undefined;
    }

    this.arrow = undefined;
    this.textBox = undefined;
    this.skipButton = undefined;
  }

  /**
   * Reset tutorial (for testing)
   */
  reset(): void {
    this.state = {
      completed: false,
      skipped: false,
      currentStep: null,
      completedSteps: [],
    };
    this.saveState();
    this.clearUI();
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(stepId: string): boolean {
    return this.state.completedSteps.includes(stepId);
  }

  /**
   * Get current step
   */
  getCurrentStep(): TutorialStep | null {
    if (this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearUI();
  }
}
