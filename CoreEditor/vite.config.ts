import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  plugins: command === 'build' ? [viteSingleFile()] : [],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: '../Sources/MarkdownEditor/Resources',
    emptyOutDir: false,
    lib: {
      entry: 'src/editor.ts',
      name: 'MarkdownEditor',
      fileName: () => 'editor.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    minify: 'esbuild',
    sourcemap: false
  }
}));
