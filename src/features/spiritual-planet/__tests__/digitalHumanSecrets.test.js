import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('digital-human browser secret boundary', () => {
  it('does not reference server credential names from browser modules', () => {
    const modules = [
      '../digital-human/api.js', '../digital-human/MetaPersonLiveSpeakAdapter.js',
      '../digital-human/LiveKitRealtimeSession.js', '../digital-human/DigitalHumanWorkspace.jsx',
    ]
    const source = modules.map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n')
    expect(source).not.toMatch(/LIVEKIT_API_SECRET|AZURE_SPEECH_KEY|METAPERSON_CLIENT_SECRET|OPENAI_API_KEY/)
    expect(source).not.toMatch(/import\.meta\.env\.VITE_.*(?:SECRET|KEY)/)
  })
})
