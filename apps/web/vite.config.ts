/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// A dedicated subpath export: sites.ts is deliberately dependency-free, so
// the build config and the app share one definition of the brands without
// the config having to load the whole quest registry.
import { resolveSite, sites } from '@bitcoin4plebs/quests/sites';

/**
 * Which front door this build produces. `nx dev web` and every existing
 * command stay on Bitcoin; `VITE_SITE=lightning nx build web` produces
 * lightning4plebs from the same source.
 */
const site = sites[resolveSite(process.env.VITE_SITE)];

/** "don't trust. verify." -> "Don't trust. Verify." */
const titleCase = (text: string) =>
  text.replace(/(^|\. )([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());

const fillTokens = (html: string) =>
  Object.entries(HTML_TOKENS).reduce((out, [token, value]) => out.replaceAll(token, value), html);

const HTML_TOKENS: Record<string, string> = {
  '%SITE_TITLE%': `${site.name} · ${titleCase(site.tagline)}`,
  '%SITE_NAME%': site.name,
  '%SITE_DESCRIPTION%': site.description,
  '%SITE_URL%': site.url,
  '%SITE_OG_IMAGE_ALT%': site.ogImageAlt,
};

export default defineConfig(() => ({
  root: __dirname,
  /**
   * GitHub Pages serves project sites from /<repo-name>/. The deploy
   * workflow sets VITE_BASE accordingly; local dev stays at '/'.
   */
  base: process.env.VITE_BASE ?? '/',
  cacheDir: '../../node_modules/.vite/apps/web',
  // Each front door ships its own brand assets: favicon, PWA icons and the
  // social card that gets unfurled when someone shares a link.
  publicDir: site.id === 'bitcoin' ? 'public' : `public-${site.id}`,
  // Each front door gets its own port, so both can run side by side and
  // be compared without stopping one to look at the other.
  server: {
    port: site.id === 'bitcoin' ? 4200 : 4201,
    host: 'localhost',
  },
  preview: {
    port: site.id === 'bitcoin' ? 4200 : 4201,
    host: 'localhost',
  },
  plugins: [
    react(),
    {
      // The head has to be right at fetch time: crawlers and link
      // unfurlers never run our JavaScript, so the title and og: tags
      // cannot be patched in at runtime.
      name: 'site-html-tokens',
      transformIndexHtml(html: string) {
        return fillTokens(html);
      },
      generateBundle() {
        // The SPA deep-link fallback. It lives outside public/ so it can be
        // branded per site: GitHub Pages serves it (with a 404 status) for
        // every shared quest link, which is exactly when the og: tags in it
        // are the ones a crawler reads.
        this.emitFile({
          type: 'asset',
          fileName: '404.html',
          source: fillTokens(readFileSync(resolve(__dirname, '404.template.html'), 'utf8')),
        });
      },
    },
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
        name: site.name,
        short_name: site.name,
        description: site.description,
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
    // Each front door gets its own output, so both can be built and
    // compared in one checkout without clobbering each other.
    outDir: site.id === 'bitcoin' ? './dist' : `./dist-${site.id}`,
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
