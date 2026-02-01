/**
 * QuickAddMenu
 * Context-aware popup menu for quickly adding nodes when dropping a connection
 */

export interface QuickAddMenuItem {
  id: string;
  label: string;
  icon: string;
  category: 'story' | 'flow' | 'event';
}

export class QuickAddMenu {
  private container: HTMLDivElement;
  private items: QuickAddMenuItem[] = [];
  private filteredItems: QuickAddMenuItem[] = [];
  private selectedIndex = 0;
  private visible = false;

  private onSelectCallback?: (nodeType: string) => void;
  private onCancelCallback?: () => void;

  private boundKeyHandler: (e: KeyboardEvent) => void;
  private boundClickOutside: (e: MouseEvent) => void;

  constructor(parentElement: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'quick-add-menu';
    this.container.style.cssText = `
      position: fixed;
      background: #2a2a2a;
      border: 2px solid #4a9eff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      min-width: 200px;
      max-width: 280px;
      z-index: 1000;
      display: none;
      overflow: hidden;
    `;
    parentElement.appendChild(this.container);

    this.initializeItems();

    // Bind event handlers
    this.boundKeyHandler = this.handleKeyDown.bind(this);
    this.boundClickOutside = this.handleClickOutside.bind(this);
  }

  private initializeItems(): void {
    this.items = [
      { id: 'dialogue', label: 'Dialogue', icon: '💬', category: 'story' },
      { id: 'choice', label: 'Choice', icon: '⑂', category: 'flow' },
      { id: 'condition', label: 'Condition', icon: '◆', category: 'flow' },
      { id: 'effect', label: 'Effect', icon: '⚡', category: 'flow' },
      { id: 'email', label: 'Email', icon: '✉', category: 'event' },
      { id: 'meeting', label: 'Meeting', icon: '📅', category: 'event' },
      { id: 'task', label: 'Task', icon: '✓', category: 'event' },
      { id: 'message', label: 'Message', icon: '💭', category: 'event' },
    ];
  }

  /**
   * Show the menu at a position
   */
  show(x: number, y: number, context?: { portType?: 'flow' | 'data' }): void {
    this.visible = true;
    this.applyContextFilter(context);
    this.selectedIndex = 0;

    // Position the menu, adjusting if it would go off screen
    const menuWidth = 240;
    const menuHeight = this.filteredItems.length * 40 + 40; // Approximate height

    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

    this.container.style.left = `${Math.max(10, adjustedX)}px`;
    this.container.style.top = `${Math.max(10, adjustedY)}px`;
    this.container.style.display = 'block';

    this.render();

    // Add event listeners
    document.addEventListener('keydown', this.boundKeyHandler);
    // Use setTimeout to avoid the click that opened the menu from closing it
    setTimeout(() => {
      document.addEventListener('mousedown', this.boundClickOutside);
    }, 0);
  }

  /**
   * Hide the menu
   */
  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';

    // Remove event listeners
    document.removeEventListener('keydown', this.boundKeyHandler);
    document.removeEventListener('mousedown', this.boundClickOutside);
  }

  /**
   * Check if menu is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Filter items based on connection context
   */
  private applyContextFilter(context?: { portType?: 'flow' | 'data' }): void {
    // For now, show all items - all node types accept flow connections
    // In the future, could filter based on port type compatibility
    this.filteredItems = [...this.items];
  }

  /**
   * Render the menu
   */
  private render(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 8px 12px;
      font-weight: 600;
      color: #e0e0e0;
      border-bottom: 1px solid #404040;
      font-size: 13px;
    `;
    header.textContent = 'Add Node';
    this.container.appendChild(header);

    // Items
    const list = document.createElement('div');
    list.style.cssText = `
      max-height: 320px;
      overflow-y: auto;
    `;

    this.filteredItems.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.setAttribute('data-index', String(index));
      itemEl.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.1s;
        background: ${index === this.selectedIndex ? '#3a3a3a' : 'transparent'};
      `;

      const icon = document.createElement('span');
      icon.style.cssText = `
        font-size: 18px;
        margin-right: 10px;
        width: 24px;
        text-align: center;
      `;
      icon.textContent = item.icon;

      const label = document.createElement('span');
      label.style.cssText = `
        color: #e0e0e0;
        font-size: 14px;
      `;
      label.textContent = item.label;

      itemEl.appendChild(icon);
      itemEl.appendChild(label);

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectItem(index);
      });

      itemEl.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      list.appendChild(itemEl);
    });

    this.container.appendChild(list);
  }

  /**
   * Update visual selection without rebuilding DOM
   */
  private updateSelection(): void {
    const items = this.container.querySelectorAll('[data-index]');
    items.forEach((item, index) => {
      (item as HTMLElement).style.background = index === this.selectedIndex ? '#3a3a3a' : 'transparent';
    });
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.visible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
        this.updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
        this.updateSelection();
        break;
      case 'Enter':
        e.preventDefault();
        this.selectItem(this.selectedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        this.cancel();
        break;
    }
  }

  /**
   * Handle clicks outside the menu
   */
  private handleClickOutside(e: MouseEvent): void {
    if (!this.container.contains(e.target as Node)) {
      this.cancel();
    }
  }

  /**
   * Select an item
   */
  private selectItem(index: number): void {
    const item = this.filteredItems[index];
    if (item) {
      this.hide();
      this.onSelectCallback?.(item.id);
    }
  }

  /**
   * Cancel the menu
   */
  private cancel(): void {
    this.hide();
    this.onCancelCallback?.();
  }

  /**
   * Register selection callback
   */
  onSelect(callback: (nodeType: string) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Register cancel callback
   */
  onCancel(callback: () => void): void {
    this.onCancelCallback = callback;
  }

  /**
   * Destroy the menu
   */
  destroy(): void {
    this.hide();
    this.container.remove();
  }
}
