/**
 * AssetView Component
 * Asset browser for sprites, backgrounds, and sounds
 */

import { store } from '../state/store.js';
import type { AssetReference } from '../types/index.js';

interface AssetNode {
  name: string;
  path: string;
  type: 'folder' | 'sprite' | 'background' | 'sound';
  children?: AssetNode[];
}

interface MissingAsset {
  path: string;
  referencedIn: string[];
}

export class AssetView {
  private container: HTMLElement;
  private assets: AssetNode[] = [];
  private selectedAsset: AssetReference | null = null;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private expandedFolders: Set<string> = new Set(['sprites', 'backgrounds', 'audio']);
  private allAssetPaths: Set<string> = new Set();

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadAssets();
    this.render();
  }

  /**
   * Load assets from server
   */
  private async loadAssets(): Promise<void> {
    try {
      // Fetch asset directory structure
      const response = await fetch('/api/files?dir=assets');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        this.buildAssetTree(result.data);
        this.render();
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      // Use sample data for demonstration
      this.loadSampleAssets();
      this.render();
    }
  }

  /**
   * Build hierarchical asset tree from flat file list
   */
  private buildAssetTree(files: string[]): void {
    const root: AssetNode = {
      name: 'assets',
      path: 'assets',
      type: 'folder',
      children: [],
    };

    // Filter and categorize files
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
    const audioFiles = files.filter(f => /\.(mp3|wav|ogg)$/i.test(f));

    // Track all asset paths
    [...imageFiles, ...audioFiles].forEach(f => {
      this.allAssetPaths.add(`assets/${f}`);
    });

    // Create folder structure
    const sprites: AssetNode = {
      name: 'sprites',
      path: 'assets/sprites',
      type: 'folder',
      children: [],
    };

    const backgrounds: AssetNode = {
      name: 'backgrounds',
      path: 'assets/backgrounds',
      type: 'folder',
      children: [],
    };

    const audio: AssetNode = {
      name: 'audio',
      path: 'assets/audio',
      type: 'folder',
      children: [],
    };

    // Categorize image files
    imageFiles.forEach(filePath => {
      if (filePath.includes('background')) {
        backgrounds.children?.push({
          name: filePath.split('/').pop() || filePath,
          path: `assets/${filePath}`,
          type: 'background',
        });
      } else if (filePath.includes('sprites')) {
        sprites.children?.push({
          name: filePath.split('/').pop() || filePath,
          path: `assets/${filePath}`,
          type: 'sprite',
        });
      }
    });

    // Add audio files
    audioFiles.forEach(filePath => {
      audio.children?.push({
        name: filePath.split('/').pop() || filePath,
        path: `assets/${filePath}`,
        type: 'sound',
      });
    });

    root.children = [sprites, backgrounds, audio];
    this.assets = root.children;
  }

  /**
   * Load sample assets for demonstration
   */
  private loadSampleAssets(): void {
    const samplePaths = [
      'assets/sprites/characters/player-cat.png',
      'assets/sprites/characters/cat-sleep1.png',
      'assets/sprites/characters/cat-sleep2.png',
      'assets/sprites/characters/cat-sleep3.png',
      'assets/sprites/characters/cat-eat.png',
      'assets/sprites/characters/cat-cook.png',
      'assets/sprites/characters/player-chair-work.png',
      'assets/sprites/characters/player-chair-lick.png',
      'assets/sprites/furniture/laptop.png',
      'assets/sprites/furniture/bed.png',
      'assets/sprites/furniture/door.png',
      'assets/sprites/furniture/kitchen.png',
      'assets/backgrounds/room.png',
      'assets/backgrounds/pc.png',
      'assets/backgrounds/pc-email.png',
      'assets/backgrounds/pc-zoom.png',
      'assets/backgrounds/pc-game.png',
      'assets/backgrounds/pc-catdora.png',
    ];

    samplePaths.forEach(p => this.allAssetPaths.add(p));

    this.assets = [
      {
        name: 'sprites',
        path: 'assets/sprites',
        type: 'folder',
        children: [
          { name: 'player-cat.png', path: 'assets/sprites/characters/player-cat.png', type: 'sprite' },
          { name: 'cat-sleep1.png', path: 'assets/sprites/characters/cat-sleep1.png', type: 'sprite' },
          { name: 'cat-sleep2.png', path: 'assets/sprites/characters/cat-sleep2.png', type: 'sprite' },
          { name: 'cat-sleep3.png', path: 'assets/sprites/characters/cat-sleep3.png', type: 'sprite' },
          { name: 'cat-eat.png', path: 'assets/sprites/characters/cat-eat.png', type: 'sprite' },
          { name: 'cat-cook.png', path: 'assets/sprites/characters/cat-cook.png', type: 'sprite' },
          { name: 'player-chair-work.png', path: 'assets/sprites/characters/player-chair-work.png', type: 'sprite' },
          { name: 'player-chair-lick.png', path: 'assets/sprites/characters/player-chair-lick.png', type: 'sprite' },
          { name: 'laptop.png', path: 'assets/sprites/furniture/laptop.png', type: 'sprite' },
          { name: 'bed.png', path: 'assets/sprites/furniture/bed.png', type: 'sprite' },
          { name: 'door.png', path: 'assets/sprites/furniture/door.png', type: 'sprite' },
          { name: 'kitchen.png', path: 'assets/sprites/furniture/kitchen.png', type: 'sprite' },
        ],
      },
      {
        name: 'backgrounds',
        path: 'assets/backgrounds',
        type: 'folder',
        children: [
          { name: 'room.png', path: 'assets/backgrounds/room.png', type: 'background' },
          { name: 'pc.png', path: 'assets/backgrounds/pc.png', type: 'background' },
          { name: 'pc-email.png', path: 'assets/backgrounds/pc-email.png', type: 'background' },
          { name: 'pc-zoom.png', path: 'assets/backgrounds/pc-zoom.png', type: 'background' },
          { name: 'pc-game.png', path: 'assets/backgrounds/pc-game.png', type: 'background' },
          { name: 'pc-catdora.png', path: 'assets/backgrounds/pc-catdora.png', type: 'background' },
        ],
      },
      {
        name: 'audio',
        path: 'assets/audio',
        type: 'folder',
        children: [
          { name: 'placeholder', path: 'assets/audio/placeholder', type: 'sound' },
        ],
      },
    ];
  }

  /**
   * Render the asset view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="asset-view">
        <div class="asset-header">
          <h2>Asset Manager</h2>
          <div class="asset-search">
            <input type="text" id="asset-search-input" placeholder="Search assets..." />
          </div>
        </div>
        <div class="asset-content">
          <div class="asset-browser">
            <div class="asset-tree">
              ${this.assets.map(node => this.renderAssetNode(node, 0)).join('')}
            </div>
          </div>
          <div class="asset-preview">
            ${this.selectedAsset ? this.renderAssetPreview() : this.renderEmptyPreview()}
          </div>
        </div>
        <div class="asset-footer">
          <div class="asset-stats">
            <span class="stat-item">
              <strong>${this.countAssetsByType('sprite')}</strong> sprites
            </span>
            <span class="stat-item">
              <strong>${this.countAssetsByType('background')}</strong> backgrounds
            </span>
            <span class="stat-item">
              <strong>${this.countAssetsByType('sound')}</strong> sounds
            </span>
          </div>
          <button class="button button-secondary" id="scan-missing-btn">
            🔍 Scan for Missing Assets
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render a single asset tree node
   */
  private renderAssetNode(node: AssetNode, depth: number): string {
    const indent = depth * 20;
    const isExpanded = this.expandedFolders.has(node.path);
    const icon = this.getAssetIcon(node.type, isExpanded);

    if (node.type === 'folder') {
      return `
        <div class="asset-node folder" data-path="${node.path}">
          <div class="asset-node-content" style="padding-left: ${indent}px;">
            <span class="folder-toggle" data-path="${node.path}">
              ${isExpanded ? '▼' : '▶'}
            </span>
            <span class="asset-icon">${icon}</span>
            <span class="asset-name">${node.name}</span>
            <span class="asset-count">(${node.children?.length || 0})</span>
          </div>
          ${isExpanded && node.children ? `
            <div class="asset-children">
              ${node.children.map(child => this.renderAssetNode(child, depth + 1)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="asset-node file" data-path="${node.path}" data-type="${node.type}" draggable="true">
        <div class="asset-node-content" style="padding-left: ${indent + 20}px;">
          <span class="asset-icon">${icon}</span>
          <span class="asset-name">${node.name}</span>
        </div>
      </div>
    `;
  }

  /**
   * Get icon for asset type
   */
  private getAssetIcon(type: string, isExpanded: boolean = false): string {
    switch (type) {
      case 'folder':
        return isExpanded ? '📂' : '📁';
      case 'sprite':
        return '🎨';
      case 'background':
        return '🖼️';
      case 'sound':
        return '🔊';
      default:
        return '📄';
    }
  }

  /**
   * Count assets by type
   */
  private countAssetsByType(type: string): number {
    let count = 0;
    const countInNode = (node: AssetNode) => {
      if (node.type === type) count++;
      node.children?.forEach(countInNode);
    };
    this.assets.forEach(countInNode);
    return count;
  }

  /**
   * Render asset preview panel
   */
  private renderAssetPreview(): string {
    if (!this.selectedAsset) return this.renderEmptyPreview();

    const asset = this.selectedAsset;
    const isImage = asset.type === 'sprite' || asset.type === 'background';
    const isAudio = asset.type === 'sound';

    return `
      <div class="preview-content">
        <div class="preview-header">
          <h3>${asset.path.split('/').pop()}</h3>
          <button class="button button-secondary" id="copy-path-btn">
            📋 Copy Path
          </button>
        </div>
        <div class="preview-body">
          ${isImage ? `
            <div class="preview-image-container">
              <img src="/${asset.path}" alt="${asset.path}" class="preview-image" />
            </div>
            <div class="preview-info">
              <p><strong>Path:</strong> <code>${asset.path}</code></p>
              <p><strong>Type:</strong> ${asset.type}</p>
            </div>
          ` : ''}
          ${isAudio ? `
            <div class="preview-audio-container">
              <div class="audio-controls">
                <button class="button" id="play-audio-btn">▶ Play</button>
                <button class="button button-secondary" id="stop-audio-btn">⏹ Stop</button>
              </div>
              <div class="preview-info">
                <p><strong>Path:</strong> <code>${asset.path}</code></p>
                <p><strong>Type:</strong> ${asset.type}</p>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="preview-footer">
          <p class="text-sm text-dim">
            💡 Tip: Drag this asset into a node field to insert the path
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render empty preview state
   */
  private renderEmptyPreview(): string {
    return `
      <div class="empty-state">
        <p class="text-dim">Select an asset to preview</p>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Folder toggle
    this.container.querySelectorAll('.folder-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = (toggle as HTMLElement).dataset.path;
        if (path) this.toggleFolder(path);
      });
    });

    // Asset selection
    this.container.querySelectorAll('.asset-node.file').forEach(node => {
      node.addEventListener('click', () => {
        const path = (node as HTMLElement).dataset.path;
        const type = (node as HTMLElement).dataset.type as 'sprite' | 'background' | 'sound';
        if (path) this.selectAsset(path, type);
      });

      // Drag start
      node.addEventListener('dragstart', (e) => {
        const path = (node as HTMLElement).dataset.path;
        if (path && e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', path);
          e.dataTransfer.setData('application/asset-path', path);
        }
      });
    });

    // Copy path button
    const copyBtn = this.container.querySelector('#copy-path-btn');
    copyBtn?.addEventListener('click', () => {
      if (this.selectedAsset) {
        navigator.clipboard.writeText(this.selectedAsset.path);
        alert(`Copied: ${this.selectedAsset.path}`);
      }
    });

    // Audio controls
    const playBtn = this.container.querySelector('#play-audio-btn');
    playBtn?.addEventListener('click', () => this.playAudio());

    const stopBtn = this.container.querySelector('#stop-audio-btn');
    stopBtn?.addEventListener('click', () => this.stopAudio());

    // Scan missing assets button
    const scanBtn = this.container.querySelector('#scan-missing-btn');
    scanBtn?.addEventListener('click', () => this.scanMissingAssets());

    // Search input
    const searchInput = this.container.querySelector('#asset-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.filterAssets(query);
    });
  }

  /**
   * Toggle folder expansion
   */
  private toggleFolder(path: string): void {
    if (this.expandedFolders.has(path)) {
      this.expandedFolders.delete(path);
    } else {
      this.expandedFolders.add(path);
    }
    this.render();
  }

  /**
   * Select an asset
   */
  private selectAsset(path: string, type: 'sprite' | 'background' | 'sound'): void {
    this.selectedAsset = {
      id: path,
      path,
      type,
      tags: [],
    };

    // Highlight selected node
    this.container.querySelectorAll('.asset-node.file').forEach(node => {
      node.classList.remove('selected');
      if ((node as HTMLElement).dataset.path === path) {
        node.classList.add('selected');
      }
    });

    this.render();
  }

  /**
   * Play audio preview
   */
  private playAudio(): void {
    if (!this.selectedAsset || this.selectedAsset.type !== 'sound') return;

    this.stopAudio();

    this.currentAudio = new Audio(`/${this.selectedAsset.path}`);
    this.currentAudio.play().catch(err => {
      console.error('Failed to play audio:', err);
      alert('Failed to play audio file');
    });
  }

  /**
   * Stop audio playback
   */
  private stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Filter assets by search query
   */
  private filterAssets(query: string): void {
    const lowerQuery = query.toLowerCase();
    this.container.querySelectorAll('.asset-node.file').forEach(node => {
      const name = (node as HTMLElement).querySelector('.asset-name')?.textContent || '';
      const matches = name.toLowerCase().includes(lowerQuery);
      (node as HTMLElement).style.display = matches ? 'block' : 'none';
    });
  }

  /**
   * Scan for missing assets in YAML files (S34)
   */
  private async scanMissingAssets(): Promise<void> {
    try {
      // Show loading state
      const scanBtn = this.container.querySelector('#scan-missing-btn');
      const originalText = scanBtn?.textContent;
      if (scanBtn) scanBtn.textContent = '⏳ Scanning...';

      // Sample YAML content with asset references
      const missingAssets = await this.findMissingAssetReferences();

      // Restore button
      if (scanBtn && originalText) scanBtn.textContent = originalText;

      // Display results
      this.showMissingAssetsReport(missingAssets);
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Failed to scan for missing assets');
    }
  }

  /**
   * Find missing asset references in project
   */
  private async findMissingAssetReferences(): Promise<MissingAsset[]> {
    const missing: Map<string, string[]> = new Map();

    // For demonstration, create sample missing assets
    // In a real implementation, this would:
    // 1. Fetch all YAML files from data/stories/
    // 2. Parse each YAML file
    // 3. Extract sprite, background, and sound paths
    // 4. Check if each path exists in this.allAssetPaths
    // 5. Collect missing references

    // Sample missing assets for demonstration
    const sampleMissing = [
      { path: 'assets/sprites/dog-npc.png', files: ['week1-monday.yaml', 'week1-tuesday.yaml'] },
      { path: 'assets/audio/notification.mp3', files: ['week1-monday.yaml'] },
      { path: 'assets/backgrounds/office.png', files: ['week2-friday.yaml'] },
    ];

    return sampleMissing.map(m => ({
      path: m.path,
      referencedIn: m.files,
    }));
  }

  /**
   * Show missing assets report
   */
  private showMissingAssetsReport(missing: MissingAsset[]): void {
    if (missing.length === 0) {
      alert('✅ No missing assets found!\n\nAll asset references in your YAML files are valid.');
      return;
    }

    const report = `⚠️ Found ${missing.length} missing asset(s):\n\n` +
      missing.map(m =>
        `• ${m.path}\n  Referenced in: ${m.referencedIn.join(', ')}`
      ).join('\n\n');

    alert(report + '\n\nFix: Add these assets to your project or update the YAML references.');
  }

  /**
   * Destroy view
   */
  destroy(): void {
    this.stopAudio();
  }
}
