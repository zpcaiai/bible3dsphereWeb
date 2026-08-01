import { defineConfig } from '@playwright/test'

// The desktop shell may inject a proxy for outbound traffic. Local acceptance
// must hit the local preview directly or the proxy can turn a healthy 200 into
// a misleading 502.
process.env.NO_PROXY = '127.0.0.1,localhost'
process.env.no_proxy = '127.0.0.1,localhost'

export default defineConfig({
  testDir: './e2e',
  outputDir: './docs/ai-formation-certification/browser-artifacts',
  reporter: [['line'], ['json', { outputFile: './docs/ai-formation-certification/browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'VITE_AI_FORMATION_ENABLED=true npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    timeout: 180_000,
    reuseExistingServer: false,
  },
})
