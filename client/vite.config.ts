import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// Resolve react from the monorepo root (hoisted node_modules)
const rootModules = path.resolve(__dirname, '..', 'node_modules')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      react: path.join(rootModules, 'react'),
      'react-dom': path.join(rootModules, 'react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  optimizeDeps: {
    include: ['zod', '@smarthostel/shared', 'react', 'react-dom', 'motion', 'motion/react', 'framer-motion'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['motion'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['sonner', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers'],
          'vendor-markdown': ['react-markdown'],
        },
      },
    },
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
