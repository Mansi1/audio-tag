import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  { test: { name: 'node', environment: 'node', include: ['test/**/*.test.ts'] } },
  {
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: ['test/**/*.test.ts'],
      exclude: ['test/**/*.node.test.ts'],
    },
  },
])
