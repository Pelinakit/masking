/**
 * NodeEditorView Component
 * Wrapper for the node editor with toolbar and YAML import/export
 */

import { NodeEditor } from '../node-editor/NodeEditor.js';
import { yamlService } from '../services/YAMLService.js';
import { fileService } from '../services/FileService.js';
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
            <button class="button button-secondary" id="add-dialogue-btn" title="Add Dialogue Node">
              💬 Dialogue
            </button>
            <button class="button button-secondary" id="add-choice-btn" title="Add Choice Node">
              ⑂ Choice
            </button>
            <button class="button button-secondary" id="add-condition-btn" title="Add Condition Node">
              ? Condition
            </button>
            <button class="button button-secondary" id="add-effect-btn" title="Add Effect Node">
              ⚡ Effect
            </button>
          </div>
          <div class="toolbar-section">
            <button class="button button-secondary" id="zoom-fit-btn" title="Zoom to Fit">
              🔍 Fit
            </button>
            <button class="button button-secondary" id="zoom-reset-btn" title="Reset Zoom">
              ↻ Reset
            </button>
            <button class="button button-secondary" id="clear-btn" title="Clear Canvas">
              🗑️ Clear
            </button>
          </div>
          <div class="toolbar-section">
            <button class="button button-secondary" id="import-btn" title="Import YAML">
              📥 Import
            </button>
            <button class="button" id="export-btn" title="Export to YAML">
              📤 Export
            </button>
          </div>
        </div>
        <div class="node-editor-canvas" id="editor-canvas"></div>
        <input type="file" id="file-input" accept=".yaml,.yml" style="display: none;">
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
      this.handleZoomToFit();
    });

    // Reset zoom
    this.container.querySelector('#zoom-reset-btn')?.addEventListener('click', () => {
      this.editor?.['canvas'].centerView();
    });

    // Clear canvas
    this.container.querySelector('#clear-btn')?.addEventListener('click', () => {
      if (confirm('Clear all nodes? This cannot be undone.')) {
        this.editor?.clear();
      }
    });

    // Import YAML
    this.container.querySelector('#import-btn')?.addEventListener('click', () => {
      this.handleImport();
    });

    // Export YAML
    this.container.querySelector('#export-btn')?.addEventListener('click', () => {
      this.handleExport();
    });

    // File input change
    const fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
    fileInput?.addEventListener('change', (e) => {
      this.handleFileSelected(e);
    });
  }

  /**
   * Handle zoom to fit
   */
  private handleZoomToFit(): void {
    if (!this.editor) return;

    const graph = this.editor.exportGraph();
    if (graph.nodes.length === 0) return;

    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    graph.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + 200); // Approximate node width
      maxY = Math.max(maxY, node.position.y + 120); // Approximate node height
    });

    this.editor['canvas'].zoomToFit({ minX, minY, maxX, maxY });
  }

  /**
   * Handle import button click
   */
  private handleImport(): void {
    const fileInput = this.container.querySelector('#file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file selected for import
   */
  private async handleFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const yamlText = await file.text();

      // Validate YAML
      const validation = yamlService.validateYAML(yamlText);
      if (!validation.valid) {
        alert(`Invalid YAML: ${validation.error}`);
        return;
      }

      // Convert to graph
      const graph = yamlService.dayScenarioToGraph(yamlText);

      // Import into editor
      if (this.editor) {
        if (confirm('Import YAML? This will replace the current graph.')) {
          this.editor.importGraph(graph);
          store.setState({ isDirty: true });
          console.log('Imported graph from YAML:', graph);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset file input
      input.value = '';
    }
  }

  /**
   * Handle export to YAML
   */
  private handleExport(): void {
    if (!this.editor) return;

    try {
      const graph = this.editor.exportGraph();

      if (graph.nodes.length === 0) {
        alert('Nothing to export. Add some nodes first!');
        return;
      }

      // Convert to YAML
      const yamlText = yamlService.graphToYAML(graph);

      // Download as file
      this.downloadYAML(yamlText, `${graph.metadata.title || 'scenario'}.yaml`);

      console.log('Exported YAML:', yamlText);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download YAML as file
   */
  private downloadYAML(yamlText: string, filename: string): void {
    const blob = new Blob([yamlText], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  destroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
