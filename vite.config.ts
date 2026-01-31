import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/masking/',
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@game': path.resolve(__dirname, './src/game'),
      '@scripting': path.resolve(__dirname, './src/scripting'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@data': path.resolve(__dirname, './data'),
      '@assets': path.resolve(__dirname, './assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['phaser', 'yaml'],
  },
});
