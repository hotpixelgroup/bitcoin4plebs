/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  root: __dirname,
  /**
   * GitHub Pages serves project sites from /<repo-name>/. The deploy
   * workflow sets VITE_BASE accordingly; local dev stays at '/'.
   */
  base: process.env.VITE_BASE ?? '/',
  cacheDir: '../../node_modules/.vite/apps/web',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [
    react(),
    /**
     * Offline support: install once, verify forever. The service worker
     * precaches the app shell (all quest content ships in the bundle, so
     * the entire curriculum works offline); live-data panels (mempool.space)
     * stay network-only and already degrade gracefully.
     */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'social-card.png'],
      manifest: {
        name: 'bitcoin4plebs',
        short_name: 'bitcoin4plebs',
        description:
          "Don't trust. Verify. Understand Bitcoin's code, no engineering degree required.",
        theme_color: '#0b0b0a',
        background_color: '#0b0b0a',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@bitcoin4plebs/web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
