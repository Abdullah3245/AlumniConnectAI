import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle: async () => {
        // Copy manifest.json
        fs.copyFileSync('public/manifest.json', 'dist/manifest.json')
        
        // Copy background script
        fs.copyFileSync('public/background.js', 'dist/background.js')
        
        // Copy content scripts
        fs.copyFileSync('public/webscraper.js', 'dist/webscraper.js')
        fs.copyFileSync('public/parseResume.js', 'dist/parseResume.js')
        
        // Copy PDF.js files
        if (!fs.existsSync('dist/pdf.min.js')) {
          fs.copyFileSync('public/pdf.min.js', 'dist/pdf.min.js')
        }
        if (!fs.existsSync('dist/pdf.worker.min.js')) {
          fs.copyFileSync('public/pdf.worker.min.js', 'dist/pdf.worker.min.js')
        }
        
        // Remove vite.svg if it exists
        if (fs.existsSync('dist/vite.svg')) {
          fs.unlinkSync('dist/vite.svg')
        }

        // Ensure popup.html is properly formatted
        const popupHtml = fs.readFileSync('dist/popup.html', 'utf8')
          .replace('type="module"', '')
          .replace('<link rel="stylesheet" href="assets/popup.css" />', '');
        fs.writeFileSync('dist/popup.html', popupHtml);
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        entryFileNames: 'popup.js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.css') {
            return 'popup.css';
          }
          return 'assets/[name].[ext]';
        },
        format: 'iife', // Use IIFE format for Chrome extension
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    // Ensure we don't inline assets as data URLs
    assetsInlineLimit: 0,
    // Don't minify for better debugging
    minify: false
  },
  // Explicitly copy files from public to dist
  publicDir: 'public'
});
