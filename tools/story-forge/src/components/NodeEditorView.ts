/**
 * NodeEditorView Component
 * Wrapper for the node editor with toolbar and YAML import/export
 */

import { NodeEditor } from '../node-editor/NodeEditor.js';
import { yamlService } from '../services/YAMLService.js';
import { fileService } from '../services/FileService.js';
import { store } from '../state/store.js';

// Backup snapshot configuration
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_BACKUPS = 10;
const BACKUP_STORAGE_KEY = 'story-forge-backups';

interface BackupSnapshot {
  id: string;
  timestamp: number;
  filePath: string | null;
  graph: any;
  label: string;
}

export class NodeEditorView {
  private container: HTMLElement;
  private editor: NodeEditor | null = null;
  private currentFilePath: string | null = null;
  private currentFileName: string | null = null;
  private backupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.loadFromStore();
    this.setupKeyboardShortcuts();
    this.checkForBackup();
    this.startBackupInterval();
  }

  /**
   * Setup global keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('[Save] Ctrl+S pressed');
        this.performAutosave();
      }
    });
  }

  /**
   * Check for and offer to recover backup
   * Only prompts if backup differs from loaded file
   */
  private checkForBackup(): void {
    try {
      const backupStr = localStorage.getItem('story-forge-backup');
      if (!backupStr) return;

      const backup = JSON.parse(backupStr);
      const age = Date.now() - backup.timestamp;
      const ageMinutes = Math.floor(age / 60000);

      // Only offer recovery if backup is recent (< 1 hour) and has nodes
      if (ageMinutes < 60 && backup.graph?.nodes?.length > 0) {
        console.log(`[Backup] Found backup from ${ageMinutes} minutes ago with ${backup.graph.nodes.length} nodes`);

        // Show recovery option after file loading completes
        setTimeout(() => {
          // Check if backup actually differs from current editor state
          if (this.editor && !this.backupMatchesCurrentState(backup)) {
            if (confirm(`Found unsaved work from ${ageMinutes} minutes ago (${backup.graph.nodes.length} nodes). Recover it?`)) {
              this.recoverFromBackup(backup);
            }
          } else {
            console.log('[Backup] Backup matches current state, skipping recovery prompt');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('[Backup] Error checking backup:', error);
    }
  }

  /**
   * Check if backup matches the current editor state
   */
  private backupMatchesCurrentState(backup: { graph: any; filePath: string | null }): boolean {
    if (!this.editor) return false;

    // Different file paths = don't match
    if (backup.filePath !== this.currentFilePath) {
      console.log(`[Backup] File path mismatch: backup=${backup.filePath}, current=${this.currentFilePath}`);
      return false;
    }

    const currentGraph = this.editor.exportGraph();
    const backupGraph = backup.graph;

    // Compare node counts
    if (currentGraph.nodes.length !== backupGraph.nodes?.length) {
      console.log(`[Backup] Node count mismatch: current=${currentGraph.nodes.length}, backup=${backupGraph.nodes?.length}`);
      return false;
    }

    // Compare connection counts
    if (currentGraph.connections.length !== backupGraph.connections?.length) {
      console.log(`[Backup] Connection count mismatch: current=${currentGraph.connections.length}, backup=${backupGraph.connections?.length}`);
      return false;
    }

    // For empty graphs, they match
    if (currentGraph.nodes.length === 0) {
      return true;
    }

    // Quick content hash comparison using node IDs and basic data
    const currentFingerprint = this.getGraphFingerprint(currentGraph);
    const backupFingerprint = this.getGraphFingerprint(backupGraph);

    const matches = currentFingerprint === backupFingerprint;
    console.log(`[Backup] Fingerprint match: ${matches}`);
    return matches;
  }

  /**
   * Generate a fingerprint for quick graph comparison
   */
  private getGraphFingerprint(graph: any): string {
    if (!graph.nodes || graph.nodes.length === 0) return 'empty';

    // Sort nodes by ID and create a simple fingerprint
    const nodeData = graph.nodes
      .map((n: any) => `${n.id}:${n.type}:${n.position?.x}:${n.position?.y}`)
      .sort()
      .join('|');

    const connData = (graph.connections || [])
      .map((c: any) => `${c.sourceNodeId}->${c.targetNodeId}`)
      .sort()
      .join('|');

    return `${nodeData}::${connData}`;
  }

  /**
   * Recover from localStorage backup
   */
  private recoverFromBackup(backup: { timestamp: number; filePath: string | null; graph: any }): void {
    if (!this.editor) return;

    try {
      this.editor.importGraph(backup.graph);

      if (backup.filePath) {
        this.currentFilePath = backup.filePath;
        this.currentFileName = backup.filePath.split('/').pop() || 'Recovered';
        this.updateToolbarFileName();
      }

      this.showNotification(`Recovered ${backup.graph.nodes.length} nodes from backup`, 'success');
      console.log('[Backup] Recovery successful');
    } catch (error) {
      console.error('[Backup] Recovery failed:', error);
      this.showNotification('Failed to recover backup', 'error');
    }
  }

  /**
   * Check if a file path was passed from Timeline and load it
   */
  private async loadFromStore(): Promise<void> {
    const state = store.getState();
    console.log('[Editor] loadFromStore - currentProject:', state.currentProject);

    // Check if we have a file path from Timeline navigation
    if (state.currentProject && (state.currentProject as any).filePath) {
      const filePath = (state.currentProject as any).filePath;
      const fileName = (state.currentProject as any).name || filePath.split('/').pop();

      console.log(`[Editor] Loading file: ${filePath}`);
      await this.loadYAMLFile(filePath, fileName);
      console.log(`[Editor] After load - currentFilePath: ${this.currentFilePath}`);
    } else {
      console.log('[Editor] No file path in store, starting empty');
    }
  }

  /**
   * Load a YAML file into the editor
   */
  private async loadYAMLFile(filePath: string, fileName: string): Promise<void> {
    // Always set the file path so Save works even if parsing fails
    this.currentFilePath = filePath;
    this.currentFileName = fileName;
    this.updateToolbarFileName();

    try {
      console.log(`Loading YAML file: ${filePath}`);
      const fileData = await fileService.readFile(filePath);

      // Validate YAML syntax
      const validation = yamlService.validateYAML(fileData.content);
      if (!validation.valid) {
        console.error(`Invalid YAML in ${filePath}: ${validation.error}`);
        this.showNotification(`Invalid YAML syntax: ${validation.error}`, 'error');
        this.showNotification(`Starting with empty canvas - Save will overwrite file`, 'info');
        return;
      }

      // Try to convert to graph - might fail for complex/legacy YAML
      try {
        const graph = yamlService.dayScenarioToGraph(fileData.content);

        // Import into editor if graph has nodes
        if (this.editor && graph.nodes.length > 0) {
          this.editor.importGraph(graph);
          console.log(`Loaded graph from ${filePath}:`, graph);
          this.showNotification(`Loaded: ${fileName}`, 'success');
        } else {
          console.log(`File ${filePath} has no graph nodes - starting empty`);
          this.showNotification(`Loaded: ${fileName} (empty)`, 'info');
        }
      } catch (parseError) {
        console.warn('Could not parse YAML to graph:', parseError);
        this.showNotification(`File loaded but content could not be parsed - starting empty`, 'info');
      }
    } catch (error) {
      console.error('Failed to load YAML file:', error);
      this.showNotification(`Could not read file - starting empty`, 'error');
    }
  }

  /**
   * Update the menubar to show the current file name
   */
  private updateToolbarFileName(): void {
    const fileNameEl = this.container.querySelector('#current-file-name');

    if (fileNameEl && this.currentFileName) {
      fileNameEl.textContent = this.currentFileName;
      console.log(`[Editor] File name set: ${this.currentFileName}`);
    }

    // Set initial status
    this.setSaveStatus('none');
  }

  /**
   * Show a notification message
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="node-editor-view">
        <div class="node-editor-menubar">
          <div class="menubar-left">
            <span class="file-name" id="current-file-name">New Scenario</span>
            <span class="save-status-dot" id="save-status-dot" title="No changes"></span>
          </div>
          <div class="menubar-center">
            <button class="menubar-btn" id="undo-btn" title="Undo (Ctrl+Z)">↩</button>
            <button class="menubar-btn" id="redo-btn" title="Redo (Ctrl+Y)">↪</button>
            <span class="menubar-divider"></span>
            <button class="menubar-btn" id="zoom-fit-btn" title="Zoom to Fit">🔍</button>
            <button class="menubar-btn" id="zoom-reset-btn" title="Reset Zoom">↻</button>
            <button class="menubar-btn" id="clear-btn" title="Clear Canvas">🗑️</button>
          </div>
          <div class="menubar-right">
            <button class="menubar-btn" id="import-btn" title="Import YAML">📥</button>
            <button class="menubar-btn menubar-btn-primary" id="save-now-btn" title="Save (Ctrl+S)">💾</button>
            <button class="menubar-btn" id="export-btn" title="Export YAML">📤</button>
            <button class="menubar-btn" id="backup-history-btn" title="Backup History">🕐</button>
          </div>
        </div>
        <div class="node-editor-toolbar">
          <div class="toolbar-section">
            <span class="toolbar-label">Nodes:</span>
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
          <div class="toolbar-section toolbar-events">
            <span class="toolbar-label">Events:</span>
            <button class="button button-secondary" id="add-email-btn" title="Add Email Event">
              📧 Email
            </button>
            <button class="button button-secondary" id="add-meeting-btn" title="Add Meeting Event">
              📅 Meeting
            </button>
            <button class="button button-secondary" id="add-task-btn" title="Add Task Event">
              📋 Task
            </button>
            <button class="button button-secondary" id="add-message-btn" title="Add Message Event">
              💬 Message
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
      console.log('[Editor] Creating NodeEditor...');
      this.editor = new NodeEditor(canvasContainer);

      // Setup autosave on change
      this.editor.onChange(() => {
        console.log('[Editor] onChange callback fired');
        this.scheduleAutosave();
      });

      this.attachEventListeners();
      console.log('[Editor] Initialization complete');
    } else {
      console.error('[Editor] Canvas container not found!');
    }
  }

  // Autosave timer
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSaveTime = 0;

  /**
   * Schedule an autosave (debounced)
   */
  private scheduleAutosave(): void {
    console.log('[Autosave] Change detected, scheduling save...');

    // Clear existing timer
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    // Mark as having unsaved changes
    store.setState({ isDirty: true });
    this.setSaveStatus('unsaved');

    // Always save to localStorage immediately as backup
    this.saveToLocalStorage();

    // Schedule file save after 1 second of inactivity
    this.autosaveTimer = setTimeout(() => {
      this.performAutosave();
    }, 1000);
  }

  /**
   * Save to localStorage as emergency backup
   */
  private saveToLocalStorage(): void {
    if (!this.editor) return;

    try {
      const graph = this.editor.exportGraph();
      const backup = {
        timestamp: Date.now(),
        filePath: this.currentFilePath,
        graph: graph,
      };
      localStorage.setItem('story-forge-backup', JSON.stringify(backup));
      console.log('[Backup] Saved to localStorage');
    } catch (error) {
      console.error('[Backup] localStorage save failed:', error);
    }
  }

  /**
   * Clear localStorage backup (after successful file save)
   */
  private clearBackup(): void {
    localStorage.removeItem('story-forge-backup');
    console.log('[Backup] Cleared localStorage backup');
  }

  /**
   * Start periodic backup interval
   */
  private startBackupInterval(): void {
    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Save a timestamped backup every BACKUP_INTERVAL_MS
    this.backupInterval = setInterval(() => {
      this.createTimestampedBackup();
    }, BACKUP_INTERVAL_MS);

    console.log('[Backup] Started backup interval');
  }

  /**
   * Create a timestamped backup snapshot
   */
  private createTimestampedBackup(): void {
    if (!this.editor) return;

    const graph = this.editor.exportGraph();

    // Don't backup empty graphs
    if (graph.nodes.length === 0) return;

    const backup: BackupSnapshot = {
      id: `backup-${Date.now()}`,
      timestamp: Date.now(),
      filePath: this.currentFilePath,
      graph: graph,
      label: this.formatBackupLabel(new Date()),
    };

    // Get existing backups
    const backups = this.getBackupSnapshots();

    // Add new backup at the beginning
    backups.unshift(backup);

    // Keep only MAX_BACKUPS
    while (backups.length > MAX_BACKUPS) {
      backups.pop();
    }

    // Save to localStorage
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
      console.log(`[Backup] Created timestamped backup: ${backup.label} (${backups.length} total)`);
    } catch (error) {
      console.error('[Backup] Failed to save timestamped backup:', error);
    }
  }

  /**
   * Get all backup snapshots
   */
  private getBackupSnapshots(): BackupSnapshot[] {
    try {
      const data = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Format a backup label from date
   */
  private formatBackupLabel(date: Date): string {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${dateStr} at ${timeStr}`;
  }

  /**
   * Show backup history dialog
   */
  private showBackupHistory(): void {
    const backups = this.getBackupSnapshots();

    if (backups.length === 0) {
      this.showNotification('No backup snapshots available', 'info');
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'backup-history-modal';
    modal.innerHTML = `
      <div class="backup-history-content">
        <div class="backup-history-header">
          <h3>Backup History</h3>
          <button class="backup-history-close">&times;</button>
        </div>
        <div class="backup-history-list">
          ${backups.map(backup => `
            <div class="backup-history-item" data-id="${backup.id}">
              <div class="backup-info">
                <span class="backup-label">${backup.label}</span>
                <span class="backup-details">${backup.graph.nodes.length} nodes • ${backup.filePath || 'Untitled'}</span>
              </div>
              <button class="backup-restore-btn" data-id="${backup.id}">Restore</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.backup-history-close')?.addEventListener('click', () => {
      modal.remove();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Restore buttons
    modal.querySelectorAll('.backup-restore-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) {
          this.restoreBackupSnapshot(id);
          modal.remove();
        }
      });
    });
  }

  /**
   * Restore a backup snapshot by ID
   */
  private restoreBackupSnapshot(id: string): void {
    const backups = this.getBackupSnapshots();
    const backup = backups.find(b => b.id === id);

    if (!backup || !this.editor) {
      this.showNotification('Backup not found', 'error');
      return;
    }

    try {
      this.editor.importGraph(backup.graph);

      if (backup.filePath) {
        this.currentFilePath = backup.filePath;
        this.currentFileName = backup.filePath.split('/').pop() || 'Restored';
        this.updateToolbarFileName();
      }

      this.showNotification(`Restored backup from ${backup.label}`, 'success');
      console.log('[Backup] Restored snapshot:', backup.id);
    } catch (error) {
      console.error('[Backup] Failed to restore:', error);
      this.showNotification('Failed to restore backup', 'error');
    }
  }

  /**
   * Perform autosave to file
   */
  private async performAutosave(): Promise<void> {
    if (!this.editor) {
      console.warn('[Autosave] No editor instance');
      return;
    }

    this.setSaveStatus('saving');

    const graph = this.editor.exportGraph();
    console.log(`[Autosave] Exporting graph with ${graph.nodes.length} nodes, ${graph.connections.length} connections`);

    if (!this.currentFilePath) {
      console.warn('[Autosave] No file path set - data saved to localStorage only');
      this.setSaveStatus('unsaved');
      return;
    }

    try {
      const yamlText = yamlService.graphToYAML(graph);
      console.log(`[Autosave] YAML generated (${yamlText.length} bytes)`);
      console.log(`[Autosave] Writing to: ${this.currentFilePath}`);

      await fileService.writeFile(this.currentFilePath, yamlText);

      this.lastSaveTime = Date.now();
      store.markClean();

      // Clear backup since we've saved successfully
      this.clearBackup();

      this.setSaveStatus('saved');
      console.log(`[Autosave] Successfully saved to ${this.currentFilePath}`);
    } catch (error) {
      console.error('[Autosave] File save failed:', error);
      this.setSaveStatus('error');
      this.showNotification(`Save failed: ${error}. Data is in localStorage backup.`, 'error');
    }
  }

  /**
   * Set save status indicator
   * gray = no changes, red = unsaved, yellow = saving, green = saved
   */
  private setSaveStatus(status: 'none' | 'unsaved' | 'saving' | 'saved' | 'error'): void {
    const dot = this.container.querySelector('#save-status-dot') as HTMLElement;
    if (!dot) return;

    const colors: Record<string, string> = {
      none: '#6b7280',    // gray
      unsaved: '#ef4444', // red
      saving: '#f59e0b',  // yellow
      saved: '#10b981',   // green
      error: '#ef4444',   // red
    };

    const titles: Record<string, string> = {
      none: 'No changes',
      unsaved: 'Unsaved changes',
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Save failed',
    };

    dot.style.backgroundColor = colors[status];
    dot.title = titles[status];
  }

  private attachEventListeners(): void {
    if (!this.editor) return;

    // Undo
    this.container.querySelector('#undo-btn')?.addEventListener('click', () => {
      this.editor?.undo();
    });

    // Redo
    this.container.querySelector('#redo-btn')?.addEventListener('click', () => {
      this.editor?.redo();
    });

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

    // Add email node
    this.container.querySelector('#add-email-btn')?.addEventListener('click', () => {
      this.editor?.createEmailNode(100, 100);
    });

    // Add meeting node
    this.container.querySelector('#add-meeting-btn')?.addEventListener('click', () => {
      this.editor?.createMeetingNode(100, 100);
    });

    // Add task node
    this.container.querySelector('#add-task-btn')?.addEventListener('click', () => {
      this.editor?.createTaskNode(100, 100);
    });

    // Add message node
    this.container.querySelector('#add-message-btn')?.addEventListener('click', () => {
      this.editor?.createMessageNode(100, 100);
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

    // Save now button
    this.container.querySelector('#save-now-btn')?.addEventListener('click', () => {
      console.log('[Save] Manual save clicked');
      this.performAutosave();
    });

    // Export YAML
    this.container.querySelector('#export-btn')?.addEventListener('click', () => {
      this.handleExport();
    });

    // Backup history
    this.container.querySelector('#backup-history-btn')?.addEventListener('click', () => {
      this.showBackupHistory();
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
   * Handle save to the currently loaded file
   */
  private async handleSaveToFile(): Promise<void> {
    if (!this.editor || !this.currentFilePath) {
      this.showNotification('No file loaded to save to', 'error');
      return;
    }

    try {
      const graph = this.editor.exportGraph();

      if (graph.nodes.length === 0) {
        this.showNotification('Nothing to save. Add some nodes first!', 'error');
        return;
      }

      // Convert to YAML
      const yamlText = yamlService.graphToYAML(graph);

      // Save to file via server
      await fileService.writeFile(this.currentFilePath, yamlText);

      store.markClean();
      this.showNotification(`Saved: ${this.currentFileName}`, 'success');
      console.log(`Saved to ${this.currentFilePath}`);
    } catch (error) {
      console.error('Save error:', error);
      this.showNotification(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
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
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    this.editor?.destroy();
    this.editor = null;
  }
}
