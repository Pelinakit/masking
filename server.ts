/**
 * Development server using Bun's built-in serve
 * Serves static files from dist/ in production, or builds and serves in dev
 */

const isDev = process.argv.includes('--dev');
const port = Number(process.env.PORT) || 3000;

if (isDev) {
  console.log('🔨 Building...');
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
    process.exit(1);
  }
  console.log('✅ Build complete');
}

// Serve static files
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    // Try to serve from dist first, then public
    const distPath = `./dist${pathname}`;
    const publicPath = `./public${pathname}`;

    let file = Bun.file(distPath);
    if (!(await file.exists())) {
      file = Bun.file(publicPath);
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
  console.log('📝 Watching for changes... (restart server to rebuild)');
}
