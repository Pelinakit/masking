/**
 * Theme Manager Service
 * Dark/light theme switching with persistence
 */

const THEME_KEY = 'story-forge-theme';

export type Theme = 'dark' | 'light';

export class ThemeManager {
  private currentTheme: Theme = 'dark';

  constructor() {
    this.init();
  }

  /**
   * Initialize theme manager
   */
  private init(): void {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;

    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    console.log(`Theme initialized: ${this.currentTheme}`);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    if (theme === 'light') {
      document.documentElement.style.setProperty('--color-bg', '#ffffff');
      document.documentElement.style.setProperty('--color-bg-light', '#f5f5f5');
      document.documentElement.style.setProperty('--color-bg-lighter', '#e5e5e5');
      document.documentElement.style.setProperty('--color-text', '#1a1a1a');
      document.documentElement.style.setProperty('--color-text-dim', '#606060');
      document.documentElement.style.setProperty('--color-border', '#d0d0d0');
    } else {
      // Dark theme (default values from CSS)
      document.documentElement.style.setProperty('--color-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--color-bg-light', '#2a2a2a');
      document.documentElement.style.setProperty('--color-bg-lighter', '#3a3a3a');
      document.documentElement.style.setProperty('--color-text', '#e0e0e0');
      document.documentElement.style.setProperty('--color-text-dim', '#a0a0a0');
      document.documentElement.style.setProperty('--color-border', '#404040');
    }

    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    console.log(`Theme changed to: ${theme}`);
  }

  /**
   * Toggle theme
   */
  toggle(): Theme {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get theme icon
   */
  getThemeIcon(): string {
    return this.currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
