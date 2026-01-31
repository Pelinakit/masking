/**
 * Build script using Bun's bundler
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'fs';

const isProduction = process.argv.includes('--production');
const basePath = process.env.BASE_PATH || '/';

console.log(`🔨 Building for ${isProduction ? 'production' : 'development'}...`);

// Clean dist
if (existsSync('./dist')) {
  rmSync('./dist', { recursive: true });
}
mkdirSync('./dist');

// Bundle TypeScript
const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  minify: isProduction,
  sourcemap: isProduction ? 'none' : 'external',
  target: 'browser',
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
  // Bun resolves paths from tsconfig.json automatically
});

if (!result.success) {
  console.error('❌ Build failed:');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Copy static files
console.log('📦 Copying static files...');

// Copy index.html (update script path and base path)
const indexHtml = await Bun.file('./index.html').text();
const scriptPath = basePath === '/' ? '/main.js' : `${basePath}main.js`;
const updatedHtml = indexHtml
  .replace('/src/main.ts', scriptPath)
  .replace('type="module" src="/src/main.ts"', `type="module" src="${scriptPath}"`);
await Bun.write('./dist/index.html', updatedHtml);
console.log(`   Base path: ${basePath}`);

// Copy public folder contents to dist
if (existsSync('./public')) {
  cpSync('./public', './dist', { recursive: true });
}

// Copy assets if they exist
if (existsSync('./assets')) {
  cpSync('./assets', './dist/assets', { recursive: true });
}

// Bundle speech-gen for browser
console.log('🔊 Building speech-gen...');
mkdirSync('./dist/speech-gen', { recursive: true });

const speechGenResult = await Bun.build({
  entrypoints: ['./tools/speech-gen/browser.ts'],
  outdir: './dist/speech-gen',
  minify: isProduction,
  sourcemap: isProduction ? 'none' : 'external',
  target: 'browser',
  naming: 'speech-gen.js',
});

if (!speechGenResult.success) {
  console.error('❌ Speech-gen build failed:');
  for (const log of speechGenResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Copy speech-gen HTML (update paths for production)
const speechGenHtml = await Bun.file('./tools/speech-gen/index.html').text();
const updatedSpeechGenHtml = speechGenHtml
  .replace('href="./"', `href="${basePath}"`)
  .replace('src="./speech-gen.js"', 'src="./speech-gen.js"');
await Bun.write('./dist/speech-gen/index.html', updatedSpeechGenHtml);

console.log('✅ Build complete!');
console.log(`   Output: ./dist/`);

// List output files
const allOutputs = [...result.outputs, ...speechGenResult.outputs];
for (const output of allOutputs) {
  const file = Bun.file(output.path);
  const size = (await file.size) / 1024;
  console.log(`   ${output.path.replace(process.cwd(), '.')} (${size.toFixed(1)} KB)`);
}
