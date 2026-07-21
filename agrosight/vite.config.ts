import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { annadataApiPlugin } from './vite-plugin-annadata-api'

const isolationHeaders = {
  // credentialless (not require-corp) so Supabase / fonts / LLM APIs work
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

export default defineConfig(({ mode }) => {
  // Ensure .env.local CEREBRAS/GROQ are available to the API middleware
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v
  }

  return {
  plugins: [
    react(),
    annadataApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        theme_color: '#0a100e',
        background_color: '#0a100e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        name: 'Annadata — AgroSight',
        short_name: 'Annadata',
        description:
          'Leaf health, produce grading, mandi prices, and D2C market for farmers',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wasm,js}'],
        globIgnores: ['**/models/*.tflite'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/models\/.*\.tflite$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'agrosight-tflite-model',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/tfjs-tflite\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'agrosight-tflite-wasm',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  base: '/',
  server: {
    port: 5173,
    open: true,
    headers: isolationHeaders,
    proxy: {
      // Browser → Vite → Ollama (avoids CORS on localhost:11434)
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
  preview: {
    headers: isolationHeaders,
  },
}
})
