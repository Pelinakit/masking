/**
 * UILayerManager
 * Presentation layer - stack-based UI navigation with ESC support
 */

import Phaser from 'phaser';
import { ContextButton } from './ContextButton';

export interface UILayer {
  id: string;
  container: Phaser.GameObjects.Container;
  escAction?: () => void;
  escLabel?: string;
}

export class UILayerManager {
  private scene: Phaser.Scene;
  private layerStack: UILayer[] = [];
  private escButton?: ContextButton;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEscButton();
    this.setupEscKey();
  }

  /**
   * Setup ESC button in top-left corner
   */
  private setupEscButton(): void {
    this.escButton = new ContextButton({
      scene: this.scene,
      x: 80,
      y: 30,
      text: 'Back',
      key: 'ESC',
      callback: () => this.handleEsc(),
      width: 140,
      height: 44,
    });

    this.escButton.setVisible(false);
  }

  /**
   * Setup ESC key handler
   */
  private setupEscKey(): void {
    if (this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => this.handleEsc());
    }
  }

  /**
   * Push a new UI layer onto the stack
   */
  pushLayer(layer: UILayer): void {
    // Hide current top layer
    if (this.layerStack.length > 0) {
      const currentTop = this.layerStack[this.layerStack.length - 1];
      currentTop.container.setVisible(false);
    }

    // Add new layer
    this.layerStack.push(layer);
    layer.container.setVisible(true);

    // Update ESC button
    this.updateEscButton();
  }

  /**
   * Pop the top layer from the stack
   */
  popLayer(): UILayer | undefined {
    if (this.layerStack.length === 0) return undefined;

    const poppedLayer = this.layerStack.pop();
    if (poppedLayer) {
      poppedLayer.container.setVisible(false);

      // Execute custom ESC action if defined
      if (poppedLayer.escAction) {
        poppedLayer.escAction();
      }
    }

    // Show previous layer
    if (this.layerStack.length > 0) {
      const newTop = this.layerStack[this.layerStack.length - 1];
      newTop.container.setVisible(true);
    }

    // Update ESC button
    this.updateEscButton();

    return poppedLayer;
  }

  /**
   * Get current top layer
   */
  getCurrentLayer(): UILayer | undefined {
    if (this.layerStack.length === 0) return undefined;
    return this.layerStack[this.layerStack.length - 1];
  }

  /**
   * Check if layer exists in stack
   */
  hasLayer(id: string): boolean {
    return this.layerStack.some(layer => layer.id === id);
  }

  /**
   * Pop until reaching a specific layer (or base if not found)
   */
  popToLayer(id: string): void {
    while (this.layerStack.length > 0) {
      const current = this.getCurrentLayer();
      if (current?.id === id) break;
      this.popLayer();
    }
  }

  /**
   * Clear all layers
   */
  clearAll(): void {
    while (this.layerStack.length > 0) {
      this.popLayer();
    }
  }

  /**
   * Get stack depth
   */
  getDepth(): number {
    return this.layerStack.length;
  }

  /**
   * Handle ESC button/key press
   */
  private handleEsc(): void {
    if (this.layerStack.length > 0) {
      this.popLayer();
    }
  }

  /**
   * Update ESC button text and visibility
   */
  private updateEscButton(): void {
    if (!this.escButton) return;

    if (this.layerStack.length === 0) {
      this.escButton.setVisible(false);
      return;
    }

    const currentLayer = this.getCurrentLayer();
    if (currentLayer?.escLabel) {
      this.escButton.setText(currentLayer.escLabel);
    } else {
      this.escButton.setText('Back');
    }

    this.escButton.setVisible(true);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearAll();
    this.escButton?.destroy();
    this.escKey?.destroy();
  }
}
