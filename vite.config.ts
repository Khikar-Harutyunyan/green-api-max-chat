import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@features', replacement: fromRoot('./src/features') },
      { find: '@ui-kit', replacement: fromRoot('./src/ui-kit') },
      { find: '@app', replacement: fromRoot('./src') },
    ],
  },
});
