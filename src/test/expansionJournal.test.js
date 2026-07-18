import { describe, expect, it } from 'vitest'
import { buildExpansionJournalPayload } from '../expansion/expansionJournal'

describe('buildExpansionJournalPayload', () => {
  it('maps a topic result into the existing devotion journal contract', () => {
    const payload = buildExpansionJournalPayload({
      feature: { name: '复活盼望' },
      input: '等待很久，有些灰心',
      result: {
        summary: '盼望不是否认等待。',
        scripture: { ref: '罗马书 8:25', text: '若盼望那所不见的，就必忍耐等候。' },
        practice: '今天写下一件仍可忠心完成的小事。',
        prayer: '主啊，在等待中扶持我。',
      },
      date: '2026-07-18',
    })

    expect(payload).toMatchObject({
      date: '2026-07-18',
      title: '专题灵修 · 复活盼望',
      observation: '我带来的处境：\n等待很久，有些灰心',
      reflection: '盼望不是否认等待。',
      application: '今天写下一件仍可忠心完成的小事。',
      prayer: '主啊，在等待中扶持我。',
      mood: '',
    })
    expect(payload.scripture).toContain('罗马书 8:25')
    expect(payload.scripture).toContain('忍耐等候')
  })

  it('keeps additional result fields without saving debug metadata', () => {
    const payload = buildExpansionJournalPayload({
      feature: { name: '认识神' },
      result: { invitation: '安静三分钟', metadata: { provider: 'test' }, debug: 'hidden' },
      date: '2026-07-18',
    })

    expect(payload.reflection).toContain('invitation：安静三分钟')
    expect(payload.reflection).not.toContain('provider')
    expect(payload.reflection).not.toContain('hidden')
  })
})
