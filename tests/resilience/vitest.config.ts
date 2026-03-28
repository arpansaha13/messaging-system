import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
})
