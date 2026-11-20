import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'Gita Companion',
        short_name: 'Gita',
        description: 'Read, study and reflect on the Bhagavad Gita.',
        theme_color: '#b4561c',
        background_color: '#faf6ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // app shell + verse/translation data precached (~2 MB); commentaries cached as they're opened
        globPatterns: ['**/*.{js,css,html,svg,png}', 'data/index.json', 'data/chapters/*.json'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          { urlPattern: /\/data\/commentary\/.*\.json$/, handler: 'CacheFirst', options: { cacheName: 'commentary', expiration: { maxEntries: 30 } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 31536000 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
    }),
  ],
});
