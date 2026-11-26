import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  build: { rollupOptions: { output: { manualChunks: { notation: ['katex'] } } } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'domain',
          environment: 'node',
          include: ['tests/logic.test.ts', 'tests/expression*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'workspace',
          environment: 'jsdom',
          testTimeout: 15000,
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/preferences.test.ts', 'tests/interface.test.tsx'],
        },
      },
    ],
  },
})
