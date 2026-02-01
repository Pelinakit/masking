/**
 * AssetWarningTracker
 * Core layer - centralized asset warning deduplication and tracking
 * Provides styled console output and asset status reporting for dev tools
 */

export type WarningSeverity = 'error' | 'warn' | 'info';

export type WarningType =
  | 'missing-sprite'
  | 'frame-mismatch'
  | 'missing-audio'
  | 'config-error'
  | 'load-failed';

export interface AssetWarning {
  type: WarningType;
  assetId: string;
  message: string;
  expectedPath?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  severity: WarningSeverity;
}

/**
 * Centralized asset warning tracker with deduplication
 * Logs warnings to console once per asset and tracks all issues for dev tools
 */
export class AssetWarningTracker {
  private warnings: Map<string, AssetWarning> = new Map();
  private warnedKeys: Set<string> = new Set();

  // Console styling by severity
  private static readonly STYLES: Record<WarningSeverity, { header: string; text: string }> = {
    error: {
      header: 'color: #FF6B6B; font-weight: bold; font-size: 12px',
      text: 'color: #FF9999',
    },
    warn: {
      header: 'color: #FFD700; font-weight: bold; font-size: 12px',
      text: 'color: #FFEB99',
    },
    info: {
      header: 'color: #4ECDC4; font-weight: bold; font-size: 12px',
      text: 'color: #99E5E0',
    },
  };

  /**
   * Log a warning for an asset (only logs to console once per unique key)
   * @param type Warning type category
   * @param assetId Asset identifier
   * @param message Human-readable warning message
   * @param options Additional warning options
   */
  warn(
    type: WarningType,
    assetId: string,
    message: string,
    options: {
      severity?: WarningSeverity;
      expectedPath?: string;
      details?: Record<string, unknown>;
    } = {}
  ): void {
    const key = `${type}:${assetId}`;
    const severity = options.severity ?? 'warn';

    // Create warning record
    const warning: AssetWarning = {
      type,
      assetId,
      message,
      expectedPath: options.expectedPath,
      details: options.details,
      timestamp: Date.now(),
      severity,
    };

    // Store warning (always update to latest)
    this.warnings.set(key, warning);

    // Only log to console once per key
    if (!this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      this.logToConsole(warning);
    }
  }

  /**
   * Check if a warning has already been logged for this asset
   */
  hasWarned(type: WarningType, assetId: string): boolean {
    return this.warnedKeys.has(`${type}:${assetId}`);
  }

  /**
   * Get all tracked warnings
   */
  getAll(): AssetWarning[] {
    return Array.from(this.warnings.values());
  }

  /**
   * Get warnings by type
   */
  getByType(type: WarningType): AssetWarning[] {
    return this.getAll().filter(w => w.type === type);
  }

  /**
   * Get warnings by severity
   */
  getBySeverity(severity: WarningSeverity): AssetWarning[] {
    return this.getAll().filter(w => w.severity === severity);
  }

  /**
   * Get summary counts
   */
  getSummary(): { total: number; byType: Record<WarningType, number>; bySeverity: Record<WarningSeverity, number> } {
    const warnings = this.getAll();

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const warning of warnings) {
      byType[warning.type] = (byType[warning.type] || 0) + 1;
      bySeverity[warning.severity] = (bySeverity[warning.severity] || 0) + 1;
    }

    return {
      total: warnings.length,
      byType: byType as Record<WarningType, number>,
      bySeverity: bySeverity as Record<WarningSeverity, number>,
    };
  }

  /**
   * Clear a specific warning (e.g., when asset is loaded successfully)
   */
  clearWarning(type: WarningType, assetId: string): void {
    const key = `${type}:${assetId}`;
    this.warnings.delete(key);
    this.warnedKeys.delete(key);
  }

  /**
   * Clear all warnings
   */
  clear(): void {
    this.warnings.clear();
    this.warnedKeys.clear();
    console.log('%c[AssetWarningTracker] Cleared all warnings', 'color: #4ECDC4');
  }

  /**
   * Log warning to console with styling
   */
  private logToConsole(warning: AssetWarning): void {
    const styles = AssetWarningTracker.STYLES[warning.severity];
    const typeLabel = warning.type.toUpperCase().replace('-', ' ');

    // Build message parts
    const parts: string[] = [
      `%c[ASSET ${typeLabel}]%c ${warning.assetId}`,
    ];
    const styleArgs: string[] = [styles.header, styles.text];

    // Add main message
    parts.push(`\n  ${warning.message}`);

    // Add expected path if present
    if (warning.expectedPath) {
      parts.push(`\n  Expected: ${warning.expectedPath}`);
    }

    // Add details if present
    if (warning.details) {
      for (const [key, value] of Object.entries(warning.details)) {
        parts.push(`\n  ${key}: ${JSON.stringify(value)}`);
      }
    }

    // Add impact note
    const impactNote = this.getImpactNote(warning.type);
    if (impactNote) {
      parts.push(`\n  Impact: ${impactNote}`);
    }

    console.warn(parts.join(''), ...styleArgs);
  }

  /**
   * Get impact description for warning type
   */
  private getImpactNote(type: WarningType): string {
    switch (type) {
      case 'missing-sprite':
        return 'Using placeholder sprite (visual only, gameplay unaffected)';
      case 'frame-mismatch':
        return 'Frames clamped to available range (animation may differ from design)';
      case 'missing-audio':
        return 'Sound will not play (gameplay unaffected)';
      case 'config-error':
        return 'Using default configuration';
      case 'load-failed':
        return 'Asset not available';
      default:
        return '';
    }
  }
}

/**
 * Singleton instance for global access
 */
export const assetWarningTracker = new AssetWarningTracker();
