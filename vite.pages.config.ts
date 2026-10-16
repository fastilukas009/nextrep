import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A standalone SPA; the existing server build keeps its own Vite configuration.
export default defineConfig({
  root: 'pages', base: './', plugins: [react()],
  define: { __FASTREP_LOCAL__: 'true' },
  css: { postcss: { plugins: [] } },
  build: { outDir: '../docs', emptyOutDir: true, sourcemap: false },
});
