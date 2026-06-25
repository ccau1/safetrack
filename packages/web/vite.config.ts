import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    inspectAttr(),
    react(),
    mode !== 'development' && VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SafeTrack - Emergency Status Tracker',
        short_name: 'SafeTrack',
        description: 'Emergency status tracking for organizations',
        theme_color: '#4A5548',
        background_color: '#F7F6F2',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2}'],
      },
    }),
  ].filter(Boolean as any),
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:8485',
        changeOrigin: true,
      },
      '/oauth2': {
        target: process.env.VITE_API_PROXY || 'http://localhost:8485',
        changeOrigin: true,
      },
      '/login/oauth2/': {
        target: process.env.VITE_API_PROXY || 'http://localhost:8485',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
