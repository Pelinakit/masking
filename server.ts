/**
 * Development server using Bun's built-in serve
 * Serves static files from dist/ in production, or builds and serves in dev
 * In dev mode, watches src/ for changes and rebuilds automatically
 */

import { watch } from 'fs';
import { cpSync, existsSync, mkdirSync } from 'fs';

const isDev = process.argv.includes('--dev');
const port = Number(process.env.PORT) || 3000;

// Track connected clients for live reload
const reloadClients = new Set<ReadableStreamDefaultController>();

async function build() {
  // Ensure dist directory exists
  if (!existsSync('./dist')) {
    mkdirSync('./dist');
  }

  const buildResult = await Bun.build({
    entrypoints: ['./src/main.ts'],
    outdir: './dist',
    minify: false,
    sourcemap: 'external',
    target: 'browser',
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  });

  if (!buildResult.success) {
    console.error('Build failed:', buildResult.logs);
    return false;
  }

  // Copy index.html with updated script path
  const indexHtml = await Bun.file('./index.html').text();
  const updatedHtml = indexHtml
    .replace('/src/main.ts', '/main.js')
    .replace('type="module" src="/src/main.ts"', 'type="module" src="/main.js"');
  await Bun.write('./dist/index.html', updatedHtml);

  // Copy public folder contents to dist
  if (existsSync('./public')) {
    cpSync('./public', './dist', { recursive: true });
  }

  // Copy assets if they exist
  if (existsSync('./assets')) {
    cpSync('./assets', './dist/assets', { recursive: true });
  }

  // Build speech-gen for browser
  mkdirSync('./dist/speech-gen', { recursive: true });
  const speechGenResult = await Bun.build({
    entrypoints: ['./tools/speech-gen/browser.ts'],
    outdir: './dist/speech-gen',
    minify: false,
    sourcemap: 'external',
    target: 'browser',
    naming: 'speech-gen.js',
  });

  if (!speechGenResult.success) {
    console.error('Speech-gen build failed:', speechGenResult.logs);
    return false;
  }

  // Copy speech-gen HTML
  const speechGenHtml = await Bun.file('./tools/speech-gen/index.html').text();
  await Bun.write('./dist/speech-gen/index.html', speechGenHtml);

  return true;
}

if (isDev) {
  console.log('🔨 Building...');
  if (!await build()) {
    process.exit(1);
  }
  console.log('✅ Build complete');

  // Watch src/ for changes
  let debounceTimer: Timer | null = null;
  watch('./src', { recursive: true }, (_event, filename) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\n🔄 Change detected: ${filename}`);
      console.log('🔨 Rebuilding...');
      if (await build()) {
        console.log('✅ Rebuild complete');
        // Notify all connected clients to reload
        for (const controller of reloadClients) {
          controller.enqueue('data: reload\n\n');
        }
      }
    }, 100);
  });
}

// Serve static files
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // SSE endpoint for live reload
    if (isDev && pathname === '/__reload') {
      const stream = new ReadableStream({
        start(controller) {
          reloadClients.add(controller);
          controller.enqueue('data: connected\n\n');
        },
        cancel(controller) {
          reloadClients.delete(controller);
        },
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Default to index.html for root or directories
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    } else if (pathname.endsWith('/')) {
      pathname = pathname + 'index.html';
    }

    // In dev mode, serve data files from public first (for live YAML editing)
    // Otherwise serve from dist first
    const distPath = `./dist${pathname}`;
    const publicPath = `./public${pathname}`;

    let file: ReturnType<typeof Bun.file>;

    if (isDev && pathname.startsWith('/data/')) {
      // Serve YAML/data from public first in dev mode
      file = Bun.file(publicPath);
      if (!(await file.exists())) {
        file = Bun.file(distPath);
      }
    } else {
      // Serve from dist first for other files
      file = Bun.file(distPath);
      if (!(await file.exists())) {
        file = Bun.file(publicPath);
      }
    }
    if (!(await file.exists())) {
      // Try index.html for SPA routing
      file = Bun.file('./dist/index.html');
    }
    if (!(await file.exists())) {
      return new Response('Not Found', { status: 404 });
    }

    // Set content type based on extension
    const ext = pathname.split('.').pop() || '';
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      js: 'application/javascript',
      css: 'text/css',
      json: 'application/json',
      yaml: 'text/yaml',
      yml: 'text/yaml',
      png: 'image/png',
      jpg: 'image/jpeg',
      svg: 'image/svg+xml',
      woff: 'font/woff',
      woff2: 'font/woff2',
    };

    // Inject live reload script into HTML in dev mode
    if (isDev && ext === 'html') {
      let html = await file.text();
      const reloadScript = `<script>
new EventSource('/__reload').onmessage = (e) => {
  if (e.data === 'reload') location.reload();
};
</script>`;
      html = html.replace('</body>', `${reloadScript}</body>`);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response(file, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': isDev ? 'no-cache' : 'max-age=3600',
      },
    });
  },
});

console.log(`🎮 Server running at http://localhost:${server.port}`);
if (isDev) {
  console.log('👀 Watching src/ for changes (hot reload enabled)');
}
