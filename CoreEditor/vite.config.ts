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
    rollupOptions: {
      input: 'editor.html',
      output: {
        inlineDynamicImports: true
      }
    },
    minify: 'esbuild',
    sourcemap: false
  }
}));
