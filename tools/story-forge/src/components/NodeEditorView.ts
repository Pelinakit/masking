/**
 * NodeEditorView Component
 * Wrapper for the node editor with toolbar
 */

import { NodeEditor } from '../node-editor/NodeEditor.js';
import { store } from '../state/store.js';

export class NodeEditorView {
  private container: HTMLElement;
  private editor: NodeEditor | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="node-editor-view">
        <div class="node-editor-toolbar">
          <div class="toolbar-section">
            <button class="button button-secondary" id="add-dialogue-btn">
              💬 Dialogue
            </button>
            <button class="button button-secondary" id="add-choice-btn">
              ⑂ Choice
            </button>
            <button class="button button-secondary" id="add-condition-btn">
              ? Condition
            </button>
            <button class="button button-secondary" id="add-effect-btn">
              ⚡ Effect
            </button>
          </div>
          <div class="toolbar-section">
            <button class="button button-secondary" id="zoom-fit-btn">
              🔍 Fit
            </button>
            <button class="button button-secondary" id="zoom-reset-btn">
              ↻ Reset
            </button>
          </div>
          <div class="toolbar-section">
            <button class="button" id="export-btn">
              📤 Export YAML
            </button>
          </div>
        </div>
        <div class="node-editor-canvas" id="editor-canvas"></div>
      </div>
    `;

    // Initialize editor
    const canvasContainer = this.container.querySelector('#editor-canvas') as HTMLElement;
    if (canvasContainer) {
      this.editor = new NodeEditor(canvasContainer);
      this.attachEventListeners();
    }
  }

  private attachEventListeners(): void {
    if (!this.editor) return;

    // Add dialogue node
    this.container.querySelector('#add-dialogue-btn')?.addEventListener('click', () => {
      this.editor?.createDialogueNode(100, 100);
    });

    // Add choice node
    this.container.querySelector('#add-choice-btn')?.addEventListener('click', () => {
      this.editor?.createChoiceNode(100, 100);
    });

    // Add condition node
    this.container.querySelector('#add-condition-btn')?.addEventListener('click', () => {
      this.editor?.createConditionNode(100, 100);
    });

    // Add effect node
    this.container.querySelector('#add-effect-btn')?.addEventListener('click', () => {
      this.editor?.createEffectNode(100, 100);
    });

    // Zoom to fit
    this.container.querySelector('#zoom-fit-btn')?.addEventListener('click', () => {
      // TODO: Calculate bounds and zoom to fit
    });

    // Reset zoom
    this.container.querySelector('#zoom-reset-btn')?.addEventListener('click', () => {
      this.editor?.['canvas'].centerView();
    });

    // Export YAML
    this.container.querySelector('#export-btn')?.addEventListener('click', () => {
      const graph = this.editor?.exportGraph();
      console.log('Exported graph:', graph);
      // TODO: Convert to YAML and save
      alert('YAML export coming in next phase!');
    });
  }

  destroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
