import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      minify: false,
    })
  ],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        popup: 'src/main.jsx'
      },
      output: {
        entryFileNames: 'assets/popup.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
