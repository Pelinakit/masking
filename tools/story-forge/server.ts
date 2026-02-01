/**
 * Story Forge Server
 *
 * Bun HTTP server providing:
 * - Static file serving for the web UI
 * - File I/O endpoints for reading/writing YAML files
 * - Project management endpoints
 * - On-the-fly TypeScript bundling
 */

import { stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';

const PORT = 3001;
const PROJECT_ROOT = resolve(import.meta.dir, '../..');
const DATA_DIR = join(PROJECT_ROOT, 'public/data');
const ASSETS_DIR = join(PROJECT_ROOT, 'assets');

interface APIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Cache for bundled app
let bundledApp: string | null = null;
let bundleError: string | null = null;

/**
 * Bundle the app on startup
 */
async function bundleApp(): Promise<void> {
  console.log('📦 Bundling Story Forge...');

  try {
    const result = await Bun.build({
      entrypoints: [join(import.meta.dir, 'src/main.ts')],
      target: 'browser',
      format: 'esm',
      minify: false,
      sourcemap: 'inline',
    });

    if (!result.success) {
      bundleError = result.logs.map((log) => log.message).join('\n');
      console.error('❌ Bundle failed:', bundleError);
      return;
    }

    bundledApp = await result.outputs[0].text();
    console.log('✅ Bundle complete');
  } catch (error) {
    bundleError = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Bundle failed:', bundleError);
  }
}

/**
 * Check if a path is within allowed directories
 */
function isPathAllowed(filePath: string): boolean {
  const normalized = resolve(filePath);
  return normalized.startsWith(DATA_DIR) || normalized.startsWith(ASSETS_DIR);
}

/**
 * Handle API requests
 */
async function handleAPI(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');

  try {
    // GET /api/files - List files in a directory
    if (path === '/files' && req.method === 'GET') {
      const dir = url.searchParams.get('dir') || DATA_DIR;
      // Resolve relative to PROJECT_ROOT for relative paths
      const targetDir = dir.startsWith('/') ? resolve(dir) : join(PROJECT_ROOT, dir);
      console.log(`[Server] Listing files: ${dir} -> ${targetDir}`);

      if (!isPathAllowed(targetDir)) {
        return Response.json({ success: false, error: 'Access denied' } as APIResponse, { status: 403 });
      }

      const files = await Bun.file(targetDir).text().catch(() => null);
      if (files === null) {
        const entries = await Array.fromAsync(
          new Bun.Glob('*').scan({ cwd: targetDir })
        );
        console.log(`[Server] Found ${entries.length} files in ${targetDir}`);
        return Response.json({ success: true, data: entries } as APIResponse);
      }

      return Response.json({ success: false, error: 'Not a directory' } as APIResponse, { status: 400 });
    }

    // GET /api/file - Read a single file
    if (path === '/file' && req.method === 'GET') {
      const filePath = url.searchParams.get('path');
      if (!filePath) {
        return Response.json({ success: false, error: 'Missing path parameter' } as APIResponse, { status: 400 });
      }

      // Resolve relative to PROJECT_ROOT for relative paths
      const targetPath = filePath.startsWith('/') ? resolve(filePath) : join(PROJECT_ROOT, filePath);
      console.log(`[Server] Reading file: ${filePath} -> ${targetPath}`);

      if (!isPathAllowed(targetPath)) {
        return Response.json({ success: false, error: 'Access denied' } as APIResponse, { status: 403 });
      }

      const file = Bun.file(targetPath);
      const exists = await file.exists();
      if (!exists) {
        return Response.json({ success: false, error: 'File not found' } as APIResponse, { status: 404 });
      }

      const content = await file.text();
      const stats = await stat(targetPath);

      return Response.json({
        success: true,
        data: {
          path: relative(PROJECT_ROOT, targetPath),
          content,
          size: stats.size,
          modified: stats.mtime,
        },
      } as APIResponse);
    }

    // POST /api/file - Write a file
    if (path === '/file' && req.method === 'POST') {
      const body = await req.json();
      const { path: filePath, content } = body as { path: string; content: string };

      if (!filePath || content === undefined) {
        return Response.json({ success: false, error: 'Missing path or content' } as APIResponse, { status: 400 });
      }

      // Resolve relative to PROJECT_ROOT for relative paths
      const targetPath = filePath.startsWith('/') ? resolve(filePath) : join(PROJECT_ROOT, filePath);
      console.log(`[Server] Writing file: ${filePath} -> ${targetPath}`);

      if (!isPathAllowed(targetPath)) {
        console.log(`[Server] Access denied for: ${targetPath}`);
        return Response.json({ success: false, error: 'Access denied' } as APIResponse, { status: 403 });
      }

      await Bun.write(targetPath, content);
      console.log(`[Server] Successfully wrote ${content.length} bytes to ${targetPath}`);

      return Response.json({
        success: true,
        data: { path: relative(PROJECT_ROOT, targetPath) },
      } as APIResponse);
    }

    // DELETE /api/file - Delete a file
    if (path === '/file' && req.method === 'DELETE') {
      const filePath = url.searchParams.get('path');
      if (!filePath) {
        return Response.json({ success: false, error: 'Missing path parameter' } as APIResponse, { status: 400 });
      }

      // Resolve relative to PROJECT_ROOT for relative paths
      const targetPath = filePath.startsWith('/') ? resolve(filePath) : join(PROJECT_ROOT, filePath);
      if (!isPathAllowed(targetPath)) {
        return Response.json({ success: false, error: 'Access denied' } as APIResponse, { status: 403 });
      }

      const file = Bun.file(targetPath);
      const exists = await file.exists();
      if (!exists) {
        return Response.json({ success: false, error: 'File not found' } as APIResponse, { status: 404 });
      }

      await Bun.$`rm ${targetPath}`;

      return Response.json({
        success: true,
        data: { path: relative(PROJECT_ROOT, targetPath) },
      } as APIResponse);
    }

    // POST /api/rebuild - Trigger rebuild
    if (path === '/rebuild' && req.method === 'POST') {
      await bundleApp();
      if (bundleError) {
        return Response.json({ success: false, error: bundleError } as APIResponse, { status: 500 });
      }
      return Response.json({ success: true } as APIResponse);
    }

    return Response.json({ success: false, error: 'Not found' } as APIResponse, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as APIResponse, { status: 500 });
  }
}

// Bundle on startup
await bundleApp();

/**
 * Main server
 */
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(req);
    }

    // Serve bundled app
    if (url.pathname === '/bundle.js') {
      if (bundleError) {
        return new Response(`console.error("Bundle error: ${bundleError.replace(/"/g, '\\"')}")`, {
          headers: { 'Content-Type': 'application/javascript' },
        });
      }
      return new Response(bundledApp, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    // Static files
    const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file(join(import.meta.dir, filePath));

    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback to index.html for SPA routing
    return new Response(Bun.file(join(import.meta.dir, 'index.html')));
  },
});

console.log(`🎨 Story Forge running at http://localhost:${PORT}`);
console.log(`📁 Data directory: ${DATA_DIR}`);
console.log(`🖼️  Assets directory: ${ASSETS_DIR}`);
