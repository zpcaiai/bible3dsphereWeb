import repairs from './playwright.digital-human-repairs.config.js'

const outputDir = process.env.DIGITAL_HUMAN_CHARACTER_EVIDENCE_DIR || './test-results/digital-human-characters'

export default {
  ...repairs,
  testMatch: 'digital-human-characters.spec.js',
  outputDir,
  reporter: [['line'], ['json', { outputFile: `${outputDir}/playwright-report.json` }]],
}
