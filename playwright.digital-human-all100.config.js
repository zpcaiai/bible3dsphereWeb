import repairs from './playwright.digital-human-repairs.config.js'

// Playwright's automatic error-context page snapshot can contain login values.
// Keep explicit authenticated screenshots and sanitized failure metadata instead.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1'

const group = process.env.DIGITAL_HUMAN_ALL100_GROUP
if (!/^(0[1-9]|10)$/.test(group || '')) throw new Error('Select one of the10 recorded groups with DIGITAL_HUMAN_ALL100_GROUP=01..10.')
const outputDir = process.env.DIGITAL_HUMAN_ALL100_EVIDENCE_DIR || `./test-results/digital-human-all100/${group}`

export default {
  ...repairs,
  use: { ...repairs.use, screenshot: 'off', trace: 'off', video: 'off' },
  testMatch: 'digital-human-all100.spec.js',
  grep: new RegExp(`g${group} [0-9]{3} `),
  outputDir,
  reporter: [['line'], ['json', { outputFile: `${outputDir}/playwright-report.json` }]],
}
