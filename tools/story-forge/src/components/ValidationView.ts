/**
 * ValidationView Component
 * YAML validation, dead-end detection, and stat balance analysis
 */

import { store } from '../state/store.js';
import type { DialogueGraph, GraphNode } from '../types/index.js';

interface ValidationError {
  type: 'error' | 'warning' | 'info';
  category: 'schema' | 'structure' | 'balance' | 'assets';
  message: string;
  location?: string;
  suggestion?: string;
}

interface DeadEndNode {
  id: string;
  text: string;
  type: string;
}

interface StatBalance {
  totalEnergy: number;
  totalStress: number;
  totalHunger: number;
  pathCount: number;
  averageEnergy: number;
  averageStress: number;
  isBalanced: boolean;
}

export class ValidationView {
  private container: HTMLElement;
  private errors: ValidationError[] = [];
  private currentTab: 'overview' | 'schema' | 'deadends' | 'balance' | 'export' = 'overview';

  constructor(container: HTMLElement) {
    this.container = container;
    this.runValidation();
    this.render();
  }

  /**
   * Run all validation checks
   */
  private runValidation(): void {
    this.errors = [];

    // Get current graph from store
    const state = store.getState();
    const graph = state.currentGraph;

    if (!graph) {
      this.errors.push({
        type: 'info',
        category: 'structure',
        message: 'No dialogue graph loaded',
        suggestion: 'Open a day in the Editor to validate it',
      });
      return;
    }

    // Run validation checks
    this.validateSchema(graph);
    this.validateStructure(graph);
    this.validateAssetReferences(graph);
  }

  /**
   * Validate YAML schema (S35)
   */
  private validateSchema(graph: DialogueGraph): void {
    // Sample schema validation
    if (!graph.metadata?.title) {
      this.errors.push({
        type: 'warning',
        category: 'schema',
        message: 'Missing metadata.title field',
        location: 'Graph metadata',
        suggestion: 'Add a title to help identify this scenario',
      });
    }

    if (!graph.metadata?.day) {
      this.errors.push({
        type: 'error',
        category: 'schema',
        message: 'Missing required metadata.day field',
        location: 'Graph metadata',
        suggestion: 'Specify which day this scenario occurs (e.g., "week1-monday")',
      });
    }

    // Validate nodes
    graph.nodes.forEach((node, index) => {
      if (!node.id) {
        this.errors.push({
          type: 'error',
          category: 'schema',
          message: `Node ${index} is missing required 'id' field`,
          location: `Node ${index}`,
          suggestion: 'Every node must have a unique ID',
        });
      }

      if (node.type === 'dialogue' && !node.data.text) {
        this.errors.push({
          type: 'error',
          category: 'schema',
          message: `Dialogue node "${node.id}" has no text`,
          location: node.id,
          suggestion: 'Add dialogue text to this node',
        });
      }

      if (node.type === 'choice' && (!node.data.choices || node.data.choices.length === 0)) {
        this.errors.push({
          type: 'error',
          category: 'schema',
          message: `Choice node "${node.id}" has no choices`,
          location: node.id,
          suggestion: 'Add at least one choice option',
        });
      }
    });
  }

  /**
   * Validate graph structure
   */
  private validateStructure(graph: DialogueGraph): void {
    // Check for orphaned nodes
    const referencedNodes = new Set<string>();
    graph.nodes.forEach(node => {
      node.outputs?.forEach(output => {
        if (output.targetNodeId) {
          referencedNodes.add(output.targetNodeId);
        }
      });
    });

    graph.nodes.forEach(node => {
      if (!referencedNodes.has(node.id) && node.id !== graph.startNodeId) {
        this.errors.push({
          type: 'warning',
          category: 'structure',
          message: `Orphaned node "${node.id}" is not connected to the graph`,
          location: node.id,
          suggestion: 'Connect this node or remove it',
        });
      }
    });

    // Check for invalid connections
    graph.nodes.forEach(node => {
      node.outputs?.forEach((output, idx) => {
        if (output.targetNodeId && !graph.nodes.find(n => n.id === output.targetNodeId)) {
          this.errors.push({
            type: 'error',
            category: 'structure',
            message: `Node "${node.id}" connects to non-existent node "${output.targetNodeId}"`,
            location: `${node.id} output ${idx}`,
            suggestion: 'Remove this connection or create the target node',
          });
        }
      });
    });
  }

  /**
   * Validate asset references
   */
  private validateAssetReferences(graph: DialogueGraph): void {
    graph.nodes.forEach(node => {
      if (node.data.sprite && !node.data.sprite.startsWith('assets/')) {
        this.errors.push({
          type: 'warning',
          category: 'assets',
          message: `Node "${node.id}" has sprite path that doesn't start with "assets/"`,
          location: node.id,
          suggestion: `Use asset paths like "assets/sprites/..."`,
        });
      }

      if (node.data.background && !node.data.background.startsWith('assets/')) {
        this.errors.push({
          type: 'warning',
          category: 'assets',
          message: `Node "${node.id}" has background path that doesn't start with "assets/"`,
          location: node.id,
          suggestion: `Use asset paths like "assets/backgrounds/..."`,
        });
      }
    });
  }

  /**
   * Find dead-end nodes (S37)
   */
  private findDeadEnds(graph: DialogueGraph): DeadEndNode[] {
    const deadEnds: DeadEndNode[] = [];

    graph.nodes.forEach(node => {
      // A node is a dead-end if it has no outputs or all outputs are null
      const hasValidOutputs = node.outputs?.some(o => o.targetNodeId !== null);

      if (!hasValidOutputs && node.type !== 'event') {
        deadEnds.push({
          id: node.id,
          text: node.data.text || node.id,
          type: node.type,
        });
      }
    });

    return deadEnds;
  }

  /**
   * Analyze stat balance (S38)
   */
  private analyzeStatBalance(graph: DialogueGraph): StatBalance {
    let totalEnergy = 0;
    let totalStress = 0;
    let totalHunger = 0;
    let pathCount = 0;

    // Simple analysis: sum all effect nodes
    graph.nodes.forEach(node => {
      if (node.type === 'effect' && node.data.effects) {
        node.data.effects.forEach((effect: any) => {
          if (effect.stat === 'energy') totalEnergy += effect.value || 0;
          if (effect.stat === 'stress') totalStress += effect.value || 0;
          if (effect.stat === 'hunger') totalHunger += effect.value || 0;
        });
        pathCount++;
      }
    });

    const averageEnergy = pathCount > 0 ? totalEnergy / pathCount : 0;
    const averageStress = pathCount > 0 ? totalStress / pathCount : 0;

    // Balanced if energy loss is reasonable and stress gain is moderate
    const isBalanced = averageEnergy >= -50 && averageStress <= 30;

    return {
      totalEnergy,
      totalStress,
      totalHunger,
      pathCount,
      averageEnergy,
      averageStress,
      isBalanced,
    };
  }

  /**
   * Render the validation view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="validation-view">
        <div class="validation-header">
          <h2>Validation Suite</h2>
          <button class="button" id="revalidate-btn">🔄 Re-validate</button>
        </div>
        <div class="validation-tabs">
          ${this.renderTab('overview', '📊 Overview')}
          ${this.renderTab('schema', '📋 Schema')}
          ${this.renderTab('deadends', '🚫 Dead Ends')}
          ${this.renderTab('balance', '⚖️ Balance')}
          ${this.renderTab('export', '📦 Export')}
        </div>
        <div class="validation-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render a tab button
   */
  private renderTab(id: string, label: string): string {
    const isActive = this.currentTab === id;
    return `
      <button class="tab-button ${isActive ? 'active' : ''}" data-tab="${id}">
        ${label}
      </button>
    `;
  }

  /**
   * Render current tab content
   */
  private renderTabContent(): string {
    switch (this.currentTab) {
      case 'overview':
        return this.renderOverviewTab();
      case 'schema':
        return this.renderSchemaTab();
      case 'deadends':
        return this.renderDeadEndsTab();
      case 'balance':
        return this.renderBalanceTab();
      case 'export':
        return this.renderExportTab();
      default:
        return '<p>Unknown tab</p>';
    }
  }

  /**
   * Render overview tab
   */
  private renderOverviewTab(): string {
    const errorCount = this.errors.filter(e => e.type === 'error').length;
    const warningCount = this.errors.filter(e => e.type === 'warning').length;
    const infoCount = this.errors.filter(e => e.type === 'info').length;

    const state = store.getState();
    const graph = state.currentGraph;
    const deadEnds = graph ? this.findDeadEnds(graph) : [];
    const balance = graph ? this.analyzeStatBalance(graph) : null;

    return `
      <div class="overview-panel">
        <div class="stats-grid">
          <div class="stat-card ${errorCount > 0 ? 'error' : 'success'}">
            <h3>${errorCount}</h3>
            <p>Errors</p>
          </div>
          <div class="stat-card ${warningCount > 0 ? 'warning' : 'success'}">
            <h3>${warningCount}</h3>
            <p>Warnings</p>
          </div>
          <div class="stat-card info">
            <h3>${infoCount}</h3>
            <p>Info</p>
          </div>
          <div class="stat-card ${deadEnds.length > 0 ? 'warning' : 'success'}">
            <h3>${deadEnds.length}</h3>
            <p>Dead Ends</p>
          </div>
        </div>

        ${errorCount === 0 && warningCount === 0 ? `
          <div class="success-message">
            <h3>✅ All Checks Passed</h3>
            <p>Your dialogue graph looks good! No errors or warnings found.</p>
          </div>
        ` : `
          <div class="error-summary">
            <h3>Issues Found</h3>
            <ul>
              ${this.errors.slice(0, 5).map(e => `
                <li class="${e.type}">
                  <strong>${e.category}:</strong> ${e.message}
                  ${e.location ? `<br><span class="location">in ${e.location}</span>` : ''}
                </li>
              `).join('')}
            </ul>
            ${this.errors.length > 5 ? `<p class="text-dim">+${this.errors.length - 5} more issues</p>` : ''}
          </div>
        `}

        ${balance && !balance.isBalanced ? `
          <div class="balance-warning">
            <h3>⚠️ Stat Balance Warning</h3>
            <p>This day may be too demanding (avg energy: ${balance.averageEnergy.toFixed(1)}, avg stress: ${balance.averageStress.toFixed(1)})</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render schema validation tab
   */
  private renderSchemaTab(): string {
    const schemaErrors = this.errors.filter(e => e.category === 'schema');

    return `
      <div class="schema-panel">
        <div class="panel-header">
          <h3>YAML Schema Validation</h3>
          <p class="text-dim">Checks if your YAML structure matches the required schema</p>
        </div>
        <div class="error-list">
          ${schemaErrors.length === 0 ? `
            <div class="empty-state">
              <p class="text-success">✅ Schema validation passed</p>
              <p class="text-dim">All required fields are present and valid</p>
            </div>
          ` : schemaErrors.map(e => `
            <div class="error-item ${e.type}">
              <div class="error-header">
                <span class="error-icon">${e.type === 'error' ? '❌' : '⚠️'}</span>
                <span class="error-message">${e.message}</span>
              </div>
              ${e.location ? `<div class="error-location">Location: ${e.location}</div>` : ''}
              ${e.suggestion ? `<div class="error-suggestion">💡 ${e.suggestion}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render dead ends tab
   */
  private renderDeadEndsTab(): string {
    const state = store.getState();
    const graph = state.currentGraph;
    const deadEnds = graph ? this.findDeadEnds(graph) : [];

    return `
      <div class="deadends-panel">
        <div class="panel-header">
          <h3>Dead End Detection</h3>
          <p class="text-dim">Nodes that have no outgoing connections (players get stuck)</p>
        </div>
        <div class="deadend-list">
          ${deadEnds.length === 0 ? `
            <div class="empty-state">
              <p class="text-success">✅ No dead ends found</p>
              <p class="text-dim">All dialogue paths have proper exits</p>
            </div>
          ` : `
            <p class="warning-header">⚠️ Found ${deadEnds.length} dead end(s):</p>
            ${deadEnds.map(node => `
              <div class="deadend-item">
                <div class="deadend-header">
                  <span class="deadend-type">${node.type}</span>
                  <span class="deadend-id">${node.id}</span>
                </div>
                <div class="deadend-text">"${node.text.substring(0, 100)}${node.text.length > 100 ? '...' : ''}"</div>
                <div class="deadend-suggestion">
                  💡 Add a connection from this node or mark it as an ending
                </div>
              </div>
            `).join('')}
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render balance analysis tab
   */
  private renderBalanceTab(): string {
    const state = store.getState();
    const graph = state.currentGraph;
    const balance = graph ? this.analyzeStatBalance(graph) : null;

    if (!balance) {
      return `
        <div class="empty-state">
          <p class="text-dim">No graph loaded for balance analysis</p>
        </div>
      `;
    }

    return `
      <div class="balance-panel">
        <div class="panel-header">
          <h3>Stat Balance Analysis</h3>
          <p class="text-dim">Analyzes energy, stress, and hunger changes across all paths</p>
        </div>
        <div class="balance-stats">
          <div class="balance-card ${balance.totalEnergy < -100 ? 'warning' : 'success'}">
            <h4>Energy</h4>
            <p class="balance-value ${balance.totalEnergy >= 0 ? 'positive' : 'negative'}">
              ${balance.totalEnergy >= 0 ? '+' : ''}${balance.totalEnergy}
            </p>
            <p class="balance-avg text-dim">Avg: ${balance.averageEnergy.toFixed(1)} per path</p>
          </div>
          <div class="balance-card ${balance.totalStress > 50 ? 'warning' : 'success'}">
            <h4>Stress</h4>
            <p class="balance-value ${balance.totalStress >= 0 ? 'negative' : 'positive'}">
              ${balance.totalStress >= 0 ? '+' : ''}${balance.totalStress}
            </p>
            <p class="balance-avg text-dim">Avg: ${balance.averageStress.toFixed(1)} per path</p>
          </div>
          <div class="balance-card info">
            <h4>Paths</h4>
            <p class="balance-value">${balance.pathCount}</p>
            <p class="balance-avg text-dim">Effect nodes</p>
          </div>
        </div>
        <div class="balance-verdict ${balance.isBalanced ? 'success' : 'warning'}">
          ${balance.isBalanced ? `
            <h3>✅ Balance Looks Good</h3>
            <p>The stat changes are within reasonable ranges for a single day</p>
          ` : `
            <h3>⚠️ Balance Concerns</h3>
            <p>This day may be too demanding. Consider:</p>
            <ul>
              ${balance.averageEnergy < -50 ? '<li>Reducing energy drain (add rest moments)</li>' : ''}
              ${balance.averageStress > 30 ? '<li>Lowering stress gains (add calming activities)</li>' : ''}
              <li>Adding optional recovery choices</li>
              <li>Balancing challenge with player resources</li>
            </ul>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render export tab (S39)
   */
  private renderExportTab(): string {
    return `
      <div class="export-panel">
        <div class="panel-header">
          <h3>Export Project</h3>
          <p class="text-dim">Export your scenarios as YAML files or packaged projects</p>
        </div>
        <div class="export-options">
          <div class="export-card">
            <h4>📄 Export Current Day</h4>
            <p class="text-dim">Export the currently open dialogue graph as a YAML file</p>
            <button class="button" id="export-day-btn">Export Day YAML</button>
          </div>
          <div class="export-card">
            <h4>📦 Export Full Project</h4>
            <p class="text-dim">Export all days, characters, and assets as a ZIP archive</p>
            <button class="button" id="export-project-btn">Export Project ZIP</button>
          </div>
          <div class="export-card">
            <h4>🎨 Export Character Database</h4>
            <p class="text-dim">Export all characters and their configurations</p>
            <button class="button" id="export-chars-btn">Export Characters</button>
          </div>
        </div>
        <div class="export-info">
          <h4>Export Formats</h4>
          <ul>
            <li><strong>YAML:</strong> Single file, human-readable, git-friendly</li>
            <li><strong>ZIP:</strong> Complete project bundle with all assets</li>
            <li><strong>JSON:</strong> Alternative format for programmatic use</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Tab switching
    this.container.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as any;
        this.currentTab = tab;
        this.render();
      });
    });

    // Re-validate button
    const revalidateBtn = this.container.querySelector('#revalidate-btn');
    revalidateBtn?.addEventListener('click', () => {
      this.runValidation();
      this.render();
    });

    // Export buttons
    const exportDayBtn = this.container.querySelector('#export-day-btn');
    exportDayBtn?.addEventListener('click', () => this.exportDay());

    const exportProjectBtn = this.container.querySelector('#export-project-btn');
    exportProjectBtn?.addEventListener('click', () => this.exportProject());

    const exportCharsBtn = this.container.querySelector('#export-chars-btn');
    exportCharsBtn?.addEventListener('click', () => this.exportCharacters());
  }

  /**
   * Export current day
   */
  private exportDay(): void {
    const state = store.getState();
    if (!state.currentGraph) {
      alert('No graph loaded to export');
      return;
    }

    const yaml = this.graphToYAML(state.currentGraph);
    this.downloadFile('day-export.yaml', yaml);
    alert('Day exported successfully!');
  }

  /**
   * Export full project
   */
  private exportProject(): void {
    alert('Exporting full project as ZIP...\n\nThis will bundle:\n- All day YAML files\n- Character database\n- Story arcs\n- Asset references\n\n(Full implementation coming soon)');
  }

  /**
   * Export characters
   */
  private exportCharacters(): void {
    alert('Exporting character database...\n\n(Implementation coming soon)');
  }

  /**
   * Convert graph to YAML string
   */
  private graphToYAML(graph: DialogueGraph): string {
    // Simplified YAML export
    return `# Exported from Story Forge
metadata:
  title: "${graph.metadata?.title || 'Untitled'}"
  day: "${graph.metadata?.day || 'unknown'}"

nodes:
${graph.nodes.map(node => `  - id: ${node.id}
    type: ${node.type}
    ${node.data.text ? `text: "${node.data.text}"` : ''}
`).join('\n')}

startNode: ${graph.startNodeId}
`;
  }

  /**
   * Download a file
   */
  private downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Destroy view
   */
  destroy(): void {
    // Cleanup
  }
}
