import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
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
});
