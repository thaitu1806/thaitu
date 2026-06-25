import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests in Node environment (no browser needed for file-based tests)
    environment: 'node',
    // Test file patterns
    include: ['tests/**/*.test.js'],
    // Timeout per test
    testTimeout: 10000,
    // Reporters
    reporters: ['verbose'],
  },
});
