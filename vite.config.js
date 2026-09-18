import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';

// architecture.md §3: content lives in content/ at repo root (not public/),
// so data.js's fetch and scripts/validate.mjs's fs reads agree on one path.
// Vite's dev server already serves any repo file by path, but `vite build`
// only copies public/ into dist/ automatically — this plugin covers content/.
function copyContentPlugin() {
  return {
    name: 'copy-content',
    closeBundle() {
      cpSync('content', 'dist/content', { recursive: true });
    },
  };
}

export default defineConfig({
  base: '/chinese_history/',
  plugins: [copyContentPlugin()],
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
