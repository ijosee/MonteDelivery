import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? 'postgresql://localhost:5432/pueblo_delivery_test',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/generated/**',
      ],
    },
  },
})
