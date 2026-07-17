import { describe, expect, it } from 'vitest'
import {
  NON_PREDICTION_NOTICE, PROHIBITED_SCENARIO_FIELDS, SCENARIO_HORIZONS,
  SCENARIO_TYPES, scenarioContractIsSafe,
} from '../scenarioContract'

describe('scenario contract', () => {
  it('fixes scenario types, horizons and the non-prediction notice', () => {
    expect(SCENARIO_TYPES).toContain('ADD_PROTECTIVE_FACTOR')
    expect(SCENARIO_HORIZONS).toContain('NEXT_7_DAYS')
    expect(NON_PREDICTION_NOTICE).toContain('不是预测')
  })

  it.each(PROHIBITED_SCENARIO_FIELDS)('rejects prohibited field %s', (field) => {
    expect(scenarioContractIsSafe({ nested: [{ [field]: 0.7 }] })).toBe(false)
  })

  it('accepts a bounded branch and rejects numeric spiritual destiny', () => {
    expect(scenarioContractIsSafe({ notice: NON_PREDICTION_NOTICE, description: '可能值得观察。' })).toBe(true)
    expect(scenarioContractIsSafe({ message: '你有78%的概率失去信仰。' })).toBe(false)
  })
})
