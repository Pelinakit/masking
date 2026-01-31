/**
 * Runtime configuration
 */

// Detect base path from script location or default to '/'
function detectBasePath(): string {
  if (typeof document !== 'undefined') {
    const scripts = document.getElementsByTagName('script');
    for (const script of scripts) {
      if (script.src.includes('main.js')) {
        const url = new URL(script.src);
        const path = url.pathname.replace('/main.js', '/');
        return path;
      }
    }
  }
  return '/';
}

export const config = {
  basePath: detectBasePath(),

  /**
   * Get full path for a data file
   */
  dataPath(relativePath: string): string {
    const base = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
    const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return base + path;
  },

  /**
   * Get full path for an asset file
   */
  assetPath(relativePath: string): string {
    const base = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
    const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return base + path;
  },
};
