import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true
        },
        includeAssets: ['icons/*.png', 'logo.png', 'offline.html'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
          // Runtime cache: media do S3 carrega instantâneo após 1ª visita (crítico para 4G Angola)
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|webp|avif|gif|svg)$/i,
              handler: 'CacheFirst' as const,
              options: {
                cacheName: 'conversio-images-v1',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
              }
            },
            {
              urlPattern: /\.(?:mp4|webm|mov)$/i,
              handler: 'CacheFirst' as const,
              options: {
                cacheName: 'conversio-videos-v1',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 3 }
              }
            },
            {
              urlPattern: /fonts\.(?:googleapis|gstatic)\.com/i,
              handler: 'StaleWhileRevalidate' as const,
              options: { cacheName: 'conversio-fonts-v1' }
            }
          ]
        },
        manifest: {
          name: 'Conversio AI',
          short_name: 'Conversio',
          description: 'Cria anúncios profissionais com IA em segundos',
          // start_url com ?source=pwa para detetar modo PWA no App.tsx
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'portrait-primary',
          background_color: '#050508',
          theme_color: '#050508',
          lang: 'pt',
          dir: 'ltr',
          categories: ['productivity', 'business'],
          prefer_related_applications: false,
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      // Vendor chunks imutáveis — browser não re-descarrega entre deploys
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — máxima prioridade de cache
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Framer-motion é pesado, separar para não bloquear o primeiro render
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-framer';
            }
            // Icons e UI utilities
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/virtua')) {
              return 'vendor-ui';
            }
            // Google OAuth — só carrega quando necessário
            if (id.includes('node_modules/@react-oauth')) {
              return 'vendor-auth';
            }
            // AWS S3 e afins — lazy
            if (id.includes('node_modules/@aws-sdk')) {
              return 'vendor-aws';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1200,
      // Minificação agressiva para reduzir payload em 4G
      minify: 'esbuild',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3003',
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: 'http://localhost:3003',
          changeOrigin: true,
          secure: false
        }
      }
    },
  };
});
