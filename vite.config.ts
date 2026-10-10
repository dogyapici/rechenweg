/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Installierbar aufs Handy („Zum Startbildschirm“) und offline nutzbar (außer KI).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rechenweg Mathe-Coach',
        short_name: 'Rechenweg',
        description: 'Mathe verstehen, Schritt für Schritt. Ab Klasse 5.',
        lang: 'de',
        theme_color: '#1d47c9',
        background_color: '#f7f9fc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//] },
    }),
  ],
  test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
});
