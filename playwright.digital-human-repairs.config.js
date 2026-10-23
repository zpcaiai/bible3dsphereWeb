import { defineConfig } from '@playwright/test'

if (!process.env.DIGITAL_HUMAN_REPAIR_BASE_URL) throw new Error('Set the real application URL; this suite never fabricates API responses.')

export default defineConfig({
  testDir: './e2e',
  testMatch: 'digital-human-repairs.spec.js',
  outputDir: process.env.DIGITAL_HUMAN_REPAIR_EVIDENCE_DIR || './test-results/digital-human-repairs',
  reporter: 'line',
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.DIGITAL_HUMAN_REPAIR_BASE_URL,
    channel: 'chrome',
    headless: true,
    isMobile: true,
    hasTouch: true,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'off', // Authentication headers/cookies must not enter exported traces.
  },
})
