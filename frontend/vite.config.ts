import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

const isSingleFile = process.env.BUILD_MODE === 'singlefile';

// https://vite.dev/config/
export default defineConfig({
  plugins: isSingleFile ? [react(), viteSingleFile()] : [react()],
  base: isSingleFile ? './' : '/s1vaas/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ''),
      },
    },
  },
});
