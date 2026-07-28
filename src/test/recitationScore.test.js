import { describe, it, expect } from 'vitest'
import { tokenizeRecitation, normalizeRecitation, scoreRecitation, alignTokens } from '../lib/media/recitationScore'

describe('recitationScore', () => {
  it('中文逐字切分，忽略标点', () => {
    expect(tokenizeRecitation('神爱世人，甚至……')).toEqual(['神', '爱', '世', '人', '甚', '至'])
  })

  it('英文按词切分并小写', () => {
    expect(tokenizeRecitation('For God so LOVED the world.')).toEqual(['for', 'god', 'so', 'loved', 'the', 'world'])
  })

  it('中英混排：中文逐字、拉丁段整体', () => {
    expect(tokenizeRecitation('约翰福音 John 3:16')).toEqual(['约', '翰', '福', '音', 'john', '3', '16'])
  })

  it('归一化剥离标点与空白', () => {
    expect(normalizeRecitation('神 爱，世人。')).toBe('神爱世人')
  })

  it('完全一致得 100 分', () => {
    const r = scoreRecitation('神爱世人', '神爱世人')
    expect(r.accuracy).toBe(100)
    expect(r.verdict).toBe('mastered')
  })

  it('漏字被标为 missing 并扣分', () => {
    const r = scoreRecitation('神爱世人', '神爱人')
    expect(r.accuracy).toBe(75)
    expect(r.ops.some((o) => o.type === 'missing' && o.target === '世')).toBe(true)
  })

  it('多字被标为 extra', () => {
    const r = scoreRecitation('神爱世人', '神很爱世人')
    expect(r.ops.some((o) => o.type === 'extra')).toBe(true)
  })

  it('错字被标为 wrong', () => {
    const r = scoreRecitation('神爱世人', '神爱事人')
    expect(r.ops.some((o) => o.type === 'wrong')).toBe(true)
  })

  it('完全不匹配不会得负分', () => {
    expect(scoreRecitation('神爱世人', '今天天气真好啊真的很好').accuracy).toBe(0)
  })

  it('空目标返回 empty', () => {
    expect(scoreRecitation('', '随便说点').verdict).toBe('empty')
  })

  it('alignTokens 距离与标准编辑距离一致', () => {
    expect(alignTokens(['a', 'b', 'c'], ['a', 'c']).distance).toBe(1)
    expect(alignTokens(['a'], ['b']).distance).toBe(1)
  })
})
