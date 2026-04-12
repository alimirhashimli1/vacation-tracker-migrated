/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: [
        'src/main.tsx',
        'src/setupTests.ts',
        'src/test-utils.tsx',
        'src/mocks/**',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.test.ts',
      ],
    },
  },
})
