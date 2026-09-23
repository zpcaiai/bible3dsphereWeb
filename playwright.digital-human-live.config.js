import { defineConfig } from '@playwright/test'

const required = ['DIGITAL_HUMAN_E2E_BASE_URL', 'DIGITAL_HUMAN_E2E_STORAGE_STATE', 'DIGITAL_HUMAN_E2E_AUDIO_FILE']
const missing = required.filter((name) => !process.env[name])
if (missing.length) throw new Error(`Real digital-human voice E2E is blocked; missing: ${missing.join(', ')}`)

export default defineConfig({
  testDir: './e2e',
  testMatch: 'digital-human-live.spec.js',
  outputDir: './docs/digital-human-certification/browser-artifacts',
  reporter: [['line'], ['json', { outputFile: './docs/digital-human-certification/browser-results-live.json' }]],
  timeout: 120_000,
  use: {
    baseURL: process.env.DIGITAL_HUMAN_E2E_BASE_URL,
    browserName: 'chromium',
    headless: true,
    storageState: process.env.DIGITAL_HUMAN_E2E_STORAGE_STATE,
    permissions: ['microphone'],
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${process.env.DIGITAL_HUMAN_E2E_AUDIO_FILE}`],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
