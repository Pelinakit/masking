/**
 * Canvas
 * Pan/zoom canvas for node editor with mouse/touch handling
 */

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export type HitTestResult = 'empty' | 'node' | 'port' | 'connection';

export class Canvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private transform: CanvasTransform = { x: 0, y: 0, scale: 1 };

  private isPanning = false;
  private panStartPos: Point | null = null;
  private panStartTime = 0;
  private lastMousePos: Point = { x: 0, y: 0 };

  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 3;
  private readonly ZOOM_SENSITIVITY = 0.001;
  private readonly PAN_THRESHOLD = 3; // pixels before pan starts
  private readonly CLICK_DELAY = 150; // ms to distinguish click from pan

  private renderCallback?: () => void;
  private clickCallback?: (worldPos: Point) => void;
  private hitTestCallback?: (worldPos: Point) => HitTestResult;
  private emptyClickCallback?: () => void;
  private cursorLocked = false; // When true, Canvas won't update cursor

  constructor(container: HTMLElement) {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'grab';

    container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;

    // Set canvas size
    this.resize();

    // Setup event listeners
    this.setupEventListeners();

    // Center canvas
    this.centerView();
  }

  /**
   * Setup mouse/touch event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Window resize
    window.addEventListener('resize', this.resize.bind(this));

    // Context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 1) {
      // Middle button: Always pan
      this.isPanning = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
      const hitTarget = this.hitTestCallback?.(worldPos) ?? 'empty';

      if (hitTarget === 'empty') {
        // Empty space - prepare to pan (will start after threshold)
        this.panStartPos = { x: e.clientX, y: e.clientY };
        this.panStartTime = Date.now();
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.isPanning = false;
      } else {
        // Hit something - let NodeEditor handle it
        this.clickCallback?.(worldPos);
      }
    }
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    // Check if we should start panning (after threshold)
    if (this.panStartPos && !this.isPanning) {
      const dx = e.clientX - this.panStartPos.x;
      const dy = e.clientY - this.panStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.PAN_THRESHOLD) {
        this.isPanning = true;
        this.canvas.style.cursor = 'grabbing';
      }
    }

    // Handle active panning
    if (this.isPanning) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;

      this.transform.x += dx;
      this.transform.y += dy;

      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.render();
    } else if (!this.panStartPos) {
      // Update cursor based on what's under the mouse (only when not starting a pan)
      this.updateCursor(e);
    }
  }

  /**
   * Update cursor based on what's under the mouse
   */
  private updateCursor(e: MouseEvent): void {
    if (this.cursorLocked) return;

    const worldPos = this.screenToWorld({ x: e.clientX, y: e.clientY });
    const hitTarget = this.hitTestCallback?.(worldPos) ?? 'empty';

    switch (hitTarget) {
      case 'port':
        this.canvas.style.cursor = 'crosshair';
        break;
      case 'node':
        this.canvas.style.cursor = 'default';
        break;
      case 'connection':
        this.canvas.style.cursor = 'pointer';
        break;
      case 'empty':
      default:
        this.canvas.style.cursor = 'grab';
        break;
    }
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(): void {
    if (this.panStartPos) {
      const elapsed = Date.now() - this.panStartTime;

      // If we didn't pan and it was a quick click, treat as empty click
      if (!this.isPanning && elapsed < this.CLICK_DELAY) {
        this.emptyClickCallback?.();
      }

      this.panStartPos = null;
    }

    this.isPanning = false;
    this.canvas.style.cursor = 'grab';
  }

  /**
   * Handle mouse wheel (zoom)
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get world position under cursor before zoom
    const worldX = (mouseX - this.transform.x) / this.transform.scale;
    const worldY = (mouseY - this.transform.y) / this.transform.scale;

    // Calculate new scale
    const zoomDelta = -e.deltaY * this.ZOOM_SENSITIVITY;
    const newScale = Math.max(
      this.MIN_SCALE,
      Math.min(this.MAX_SCALE, this.transform.scale * (1 + zoomDelta))
    );

    // Adjust transform so the world point stays under the cursor
    // Formula: mousePos = worldPos * scale + transform
    // Therefore: transform = mousePos - worldPos * newScale
    this.transform.x = mouseX - worldX * newScale;
    this.transform.y = mouseY - worldY * newScale;
    this.transform.scale = newScale;

    this.render();
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenPos: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screenPos.x - rect.left - this.transform.x) / this.transform.scale,
      y: (screenPos.y - rect.top - this.transform.y) / this.transform.scale,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldPos: Point): Point {
    return {
      x: worldPos.x * this.transform.scale + this.transform.x,
      y: worldPos.y * this.transform.scale + this.transform.y,
    };
  }

  /**
   * Resize canvas to match container
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.render();
  }

  /**
   * Center view
   */
  centerView(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.transform.x = rect.width / 2;
    this.transform.y = rect.height / 2;
    this.transform.scale = 1;
    this.render();
  }

  /**
   * Zoom to fit all nodes
   */
  zoomToFit(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    const rect = this.canvas.getBoundingClientRect();
    const padding = 50;

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;

    this.transform.scale = Math.min(scaleX, scaleY, this.MAX_SCALE);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    this.transform.x = rect.width / 2 - centerX * this.transform.scale;
    this.transform.y = rect.height / 2 - centerY * this.transform.scale;

    this.render();
  }

  /**
   * Clear canvas
   */
  clear(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  /**
   * Draw grid
   */
  drawGrid(): void {
    const rect = this.canvas.getBoundingClientRect();
    const gridSize = 50 * this.transform.scale;

    this.ctx.save();

    // Calculate grid offset
    const offsetX = this.transform.x % gridSize;
    const offsetY = this.transform.y % gridSize;

    // Draw vertical lines
    this.ctx.strokeStyle = '#2a2a2a';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    for (let x = offsetX; x < rect.width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, rect.height);
    }

    // Draw horizontal lines
    for (let y = offsetY; y < rect.height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(rect.width, y);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Apply transform for drawing in world coordinates
   */
  applyTransform(): void {
    this.ctx.save();
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.scale, this.transform.scale);
  }

  /**
   * Reset transform
   */
  resetTransform(): void {
    this.ctx.restore();
  }

  /**
   * Get canvas context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Get current transform
   */
  getTransform(): CanvasTransform {
    return { ...this.transform };
  }

  /**
   * Set transform
   */
  setTransform(transform: CanvasTransform): void {
    this.transform = { ...transform };
    this.render();
  }

  /**
   * Register render callback
   */
  onRender(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Register click callback
   */
  onClick(callback: (worldPos: Point) => void): void {
    this.clickCallback = callback;
  }

  /**
   * Register hit test callback - determines what's at a world position
   */
  onHitTest(callback: (worldPos: Point) => HitTestResult): void {
    this.hitTestCallback = callback;
  }

  /**
   * Register empty click callback - called when clicking on empty space
   */
  onEmptyClick(callback: () => void): void {
    this.emptyClickCallback = callback;
  }

  /**
   * Lock cursor - prevents Canvas from updating cursor (for external drag operations)
   */
  lockCursor(cursor: string): void {
    this.cursorLocked = true;
    this.canvas.style.cursor = cursor;
  }

  /**
   * Unlock cursor - allows Canvas to update cursor again
   */
  unlockCursor(): void {
    this.cursorLocked = false;
  }

  /**
   * Trigger render
   */
  render(): void {
    this.clear();
    this.drawGrid();

    if (this.renderCallback) {
      this.applyTransform();
      this.renderCallback();
      this.resetTransform();
    }
  }

  /**
   * Destroy canvas
   */
  destroy(): void {
    this.canvas.remove();
    window.removeEventListener('resize', this.resize.bind(this));
  }
}
