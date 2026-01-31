/**
 * LaptopScene
 * Overlay scene for laptop interface
 * Shows app grid, email, calendar, tasks, and mini-games
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';
import { yamlParser } from '@scripting/YAMLParser';

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  color: number;
  requiresOnline?: boolean;
}

export class LaptopScene extends Phaser.Scene {
  private stateManager!: StateManager;
  private currentApp: string | null = null;

  // UI containers
  private appGridContainer!: Phaser.GameObjects.Container;
  private appViewContainer!: Phaser.GameObjects.Container;
  private topBar!: Phaser.GameObjects.Container;

  // Apps configuration
  private apps: AppConfig[] = [
    { id: 'email', name: 'Email', icon: '✉', color: 0x3498db },
    { id: 'calendar', name: 'Calendar', icon: '📅', color: 0xe74c3c },
    { id: 'tasks', name: 'Tasks', icon: '✓', color: 0x2ecc71 },
    { id: 'zoom', name: 'Zoom', icon: '📹', color: 0x2d8cff, requiresOnline: true },
    { id: 'catdora', name: 'Catdora', icon: '🍕', color: 0xf39c12 },
    { id: 'chat', name: 'Chat', icon: '💬', color: 0x9b59b6 },
    { id: 'solitaire', name: 'Solitaire', icon: '🃏', color: 0x16a085 },
  ];

  constructor() {
    super({ key: 'LaptopScene' });
  }

  create(): void {
    this.stateManager = new StateManager();

    const { width, height } = this.cameras.main;

    // Semi-transparent background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Main laptop window (centered, mobile-friendly)
    const windowWidth = Math.min(width - 40, 600);
    const windowHeight = Math.min(height - 80, 700);
    const windowX = width / 2;
    const windowY = height / 2;

    // Laptop window background
    const window = this.add.rectangle(windowX, windowY, windowWidth, windowHeight, 0xecf0f1);
    window.setStrokeStyle(4, 0x34495e);

    // Create top bar
    this.createTopBar(windowX, windowY - windowHeight / 2, windowWidth);

    // Create containers
    this.appGridContainer = this.add.container(0, 0);
    this.appViewContainer = this.add.container(0, 0);

    // Show app grid by default
    this.showAppGrid(windowX, windowY, windowWidth, windowHeight);

    // Setup input
    this.setupInput();
  }

  /**
   * Create top bar with close button and title
   */
  private createTopBar(x: number, y: number, width: number): void {
    this.topBar = this.add.container(x, y);

    // Bar background
    const barHeight = 50;
    const bar = this.add.rectangle(0, 0, width, barHeight, 0x34495e);
    this.topBar.add(bar);

    // Title
    const title = this.add.text(-width / 2 + 20, 0, 'Laptop', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ecf0f1',
    });
    title.setOrigin(0, 0.5);
    this.topBar.add(title);

    // Close button (44px minimum touch target)
    const closeBtn = this.add.rectangle(width / 2 - 30, 0, 44, 44, 0xe74c3c);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeLaptop());
    this.topBar.add(closeBtn);

    const closeX = this.add.text(width / 2 - 30, 0, '×', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    });
    closeX.setOrigin(0.5);
    this.topBar.add(closeX);
  }

  /**
   * Show app grid
   */
  private showAppGrid(x: number, y: number, width: number, height: number): void {
    this.appGridContainer.removeAll(true);
    this.appViewContainer.setVisible(false);
    this.appGridContainer.setVisible(true);

    const gridStartY = y - height / 2 + 100;
    const appSize = 100;
    const spacing = 20;
    const columns = 3;

    this.apps.forEach((app, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      const appX = x - width / 2 + 80 + col * (appSize + spacing);
      const appY = gridStartY + row * (appSize + spacing + 40);

      // App icon button
      const iconBtn = this.add.rectangle(appX, appY, appSize, appSize, app.color);
      iconBtn.setInteractive({ useHandCursor: true });
      iconBtn.on('pointerdown', () => this.openApp(app.id));
      iconBtn.on('pointerover', () => iconBtn.setScale(1.05));
      iconBtn.on('pointerout', () => iconBtn.setScale(1.0));

      // Icon text
      const iconText = this.add.text(appX, appY, app.icon, {
        fontSize: '48px',
      });
      iconText.setOrigin(0.5);

      // App name
      const nameText = this.add.text(appX, appY + appSize / 2 + 20, app.name, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#2c3e50',
      });
      nameText.setOrigin(0.5);

      this.appGridContainer.add([iconBtn, iconText, nameText]);
    });
  }

  /**
   * Open specific app
   */
  private openApp(appId: string): void {
    this.currentApp = appId;
    this.appGridContainer.setVisible(false);
    this.appViewContainer.setVisible(true);

    // Update top bar title
    const app = this.apps.find(a => a.id === appId);
    if (app) {
      const title = this.topBar.getAt(1) as Phaser.GameObjects.Text;
      title.setText(app.name);
    }

    // Load app content
    switch (appId) {
      case 'email':
        this.showEmailApp();
        break;
      case 'calendar':
        this.showCalendarApp();
        break;
      case 'tasks':
        this.showTasksApp();
        break;
      case 'zoom':
        this.showZoomApp();
        break;
      case 'catdora':
        this.showCatdoraApp();
        break;
      case 'chat':
        this.showChatApp();
        break;
      case 'solitaire':
        this.showSolitaireApp();
        break;
    }
  }

  /**
   * Email app
   */
  private async showEmailApp(): Promise<void> {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const windowWidth = Math.min(width - 40, 600);
    const windowHeight = Math.min(height - 80, 700);
    const contentY = height / 2 - windowHeight / 2 + 100;

    // Back button
    this.addBackButton();

    // Email list header
    const header = this.add.text(width / 2, contentY, 'Inbox', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#2c3e50',
    });
    header.setOrigin(0.5, 0);
    this.appViewContainer.add(header);

    // Load emails from YAML
    const emails = await this.loadEmails();

    // Email list
    const emailStartY = contentY + 50;
    const emailHeight = 60;

    emails.forEach((email, index) => {
      const y = emailStartY + index * (emailHeight + 10);

      // Email container
      const emailBg = this.add.rectangle(width / 2, y, windowWidth - 60, emailHeight, 0xffffff);
      emailBg.setStrokeStyle(2, 0xbdc3c7);
      emailBg.setInteractive({ useHandCursor: true });
      emailBg.on('pointerdown', () => this.openEmail(email));

      // Unread indicator
      if (!email.read) {
        const unreadDot = this.add.circle(width / 2 - windowWidth / 2 + 50, y, 6, 0x3498db);
        this.appViewContainer.add(unreadDot);
      }

      // From
      const from = this.add.text(width / 2 - windowWidth / 2 + 70, y - 15, email.from, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#2c3e50',
        fontStyle: email.read ? 'normal' : 'bold',
      });
      from.setOrigin(0, 0.5);

      // Subject
      const subject = this.add.text(width / 2 - windowWidth / 2 + 70, y + 10, email.subject, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#7f8c8d',
      });
      subject.setOrigin(0, 0.5);

      this.appViewContainer.add([emailBg, from, subject]);
    });
  }

  /**
   * Load emails from YAML
   */
  private async loadEmails(): Promise<any[]> {
    try {
      // Get current day
      const currentDay = this.stateManager.time.getCurrentDay();
      const dayName = this.stateManager.time.getDayName(currentDay);

      // Load emails for current day
      const yamlContent = await yamlParser.loadFile(`/data/stories/emails/${dayName.toLowerCase()}-standup.yaml`);
      const parsed = yamlParser.parse(yamlContent);

      return parsed.emails || [];
    } catch (error) {
      console.error('Failed to load emails:', error);
      return [];
    }
  }

  /**
   * Open email detail view
   */
  private openEmail(email: any): void {
    // TODO: Show email detail modal
    console.log('Opening email:', email);
  }

  /**
   * Calendar app
   */
  private async showCalendarApp(): Promise<void> {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const contentY = height / 2 - (Math.min(height - 80, 700)) / 2 + 100;

    this.addBackButton();

    const header = this.add.text(width / 2, contentY, 'Today\'s Schedule', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#2c3e50',
    });
    header.setOrigin(0.5, 0);
    this.appViewContainer.add(header);

    // Load meetings
    const meetings = await this.loadMeetings();

    const meetingStartY = contentY + 50;
    meetings.forEach((meeting, index) => {
      const y = meetingStartY + index * 70;

      // Time
      const timeText = this.add.text(width / 2 - 200, y, meeting.time, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#7f8c8d',
      });

      // Title
      const titleText = this.add.text(width / 2 - 130, y, meeting.title, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#2c3e50',
        fontStyle: 'bold',
      });

      this.appViewContainer.add([timeText, titleText]);
    });
  }

  /**
   * Load meetings from YAML
   */
  private async loadMeetings(): Promise<any[]> {
    try {
      const currentDay = this.stateManager.time.getCurrentDay();
      const dayName = this.stateManager.time.getDayName(currentDay);

      const yamlContent = await yamlParser.loadFile(`/data/stories/meetings/${dayName.toLowerCase()}-standup.yaml`);
      const parsed = yamlParser.parse(yamlContent);

      return parsed.meetings || [];
    } catch (error) {
      console.error('Failed to load meetings:', error);
      return [];
    }
  }

  /**
   * Tasks app
   */
  private showTasksApp(): void {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const contentY = height / 2 - (Math.min(height - 80, 700)) / 2 + 100;

    this.addBackButton();

    const header = this.add.text(width / 2, contentY, 'Tasks', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#2c3e50',
    });
    header.setOrigin(0.5, 0);
    this.appViewContainer.add(header);

    // Get tasks from state
    const tasks = this.stateManager.getState().tasks || [];

    const taskStartY = contentY + 50;
    tasks.forEach((task: any, index: number) => {
      const y = taskStartY + index * 50;

      // Checkbox
      const checkbox = this.add.rectangle(width / 2 - 200, y, 30, 30, task.completed ? 0x2ecc71 : 0xffffff);
      checkbox.setStrokeStyle(2, 0x2c3e50);
      checkbox.setInteractive({ useHandCursor: true });
      checkbox.on('pointerdown', () => this.toggleTask(task.id));

      // Checkmark
      if (task.completed) {
        const check = this.add.text(width / 2 - 200, y, '✓', {
          fontSize: '24px',
          color: '#ffffff',
        });
        check.setOrigin(0.5);
        this.appViewContainer.add(check);
      }

      // Task text
      const taskText = this.add.text(width / 2 - 170, y, task.text, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: task.completed ? '#95a5a6' : '#2c3e50',
      });
      taskText.setOrigin(0, 0.5);

      this.appViewContainer.add([checkbox, taskText]);
    });
  }

  /**
   * Toggle task completion
   */
  private toggleTask(taskId: string): void {
    const state = this.stateManager.getState();
    const task = state.tasks?.find((t: any) => t.id === taskId);

    if (task) {
      task.completed = !task.completed;
      this.stateManager.setState(state);
      this.showTasksApp(); // Refresh view
    }
  }

  /**
   * Zoom app (placeholder - will be expanded in Phase F)
   */
  private showZoomApp(): void {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;

    this.addBackButton();

    const message = this.add.text(width / 2, height / 2, 'No active meetings', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#7f8c8d',
    });
    message.setOrigin(0.5);
    this.appViewContainer.add(message);
  }

  /**
   * Catdora food delivery app
   */
  private showCatdoraApp(): void {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;
    const contentY = height / 2 - (Math.min(height - 80, 700)) / 2 + 100;

    this.addBackButton();

    const header = this.add.text(width / 2, contentY, 'Order Food', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#2c3e50',
    });
    header.setOrigin(0.5, 0);
    this.appViewContainer.add(header);

    // Food options
    const foods = [
      { name: 'Pizza', cost: 15, energy: 30, happiness: 20 },
      { name: 'Sushi', cost: 20, energy: 25, happiness: 25 },
      { name: 'Burger', cost: 12, energy: 35, happiness: 15 },
    ];

    const foodStartY = contentY + 50;
    foods.forEach((food, index) => {
      const y = foodStartY + index * 80;

      // Food button
      const btn = this.add.rectangle(width / 2, y, 300, 60, 0xf39c12);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.orderFood(food));

      // Food name and cost
      const text = this.add.text(width / 2, y, `${food.name} - $${food.cost}`, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);

      this.appViewContainer.add([btn, text]);
    });
  }

  /**
   * Order food from Catdora
   */
  private orderFood(food: any): void {
    // Deduct money (adds stress from spending)
    this.stateManager.stats.modifyStat('stress', 5);

    // Add energy and happiness
    this.stateManager.stats.modifyStat('energy', food.energy);
    this.stateManager.stats.modifyStat('happiness', food.happiness);
    this.stateManager.stats.modifyStat('hunger', -50);

    // Time passes
    this.stateManager.time.skipMinutes(30);

    console.log(`Ordered ${food.name}`);
    this.closeLaptop();
  }

  /**
   * Chat app (placeholder)
   */
  private showChatApp(): void {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;

    this.addBackButton();

    const message = this.add.text(width / 2, height / 2, 'No new messages', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#7f8c8d',
    });
    message.setOrigin(0.5);
    this.appViewContainer.add(message);
  }

  /**
   * Solitaire mini-game (placeholder)
   */
  private showSolitaireApp(): void {
    this.appViewContainer.removeAll(true);

    const { width, height } = this.cameras.main;

    this.addBackButton();

    const message = this.add.text(width / 2, height / 2, 'Solitaire\n(Mini-game coming soon)', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#7f8c8d',
      align: 'center',
    });
    message.setOrigin(0.5);
    this.appViewContainer.add(message);
  }

  /**
   * Add back button to return to app grid
   */
  private addBackButton(): void {
    const { width, height } = this.cameras.main;
    const windowHeight = Math.min(height - 80, 700);
    const backY = height / 2 + windowHeight / 2 - 40;

    const backBtn = this.add.rectangle(width / 2 - 200, backY, 100, 44, 0x95a5a6);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.returnToGrid());

    const backText = this.add.text(width / 2 - 200, backY, 'Back', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    backText.setOrigin(0.5);

    this.appViewContainer.add([backBtn, backText]);
  }

  /**
   * Return to app grid
   */
  private returnToGrid(): void {
    this.currentApp = null;
    this.appViewContainer.setVisible(false);
    this.appGridContainer.setVisible(true);

    // Reset title
    const title = this.topBar.getAt(1) as Phaser.GameObjects.Text;
    title.setText('Laptop');
  }

  /**
   * Setup input handling
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;

    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      if (this.currentApp) {
        this.returnToGrid();
      } else {
        this.closeLaptop();
      }
    });
  }

  /**
   * Close laptop and return to room
   */
  private closeLaptop(): void {
    this.scene.stop('LaptopScene');
    this.scene.resume('RoomScene');
  }
}
