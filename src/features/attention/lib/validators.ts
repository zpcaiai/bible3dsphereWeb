import { AttentionPull } from './types'
import { t as i18nT } from '../../../i18n/runtime'

const PULLS = new Set(Object.values(AttentionPull))

export function isValidAttentionPull(value: unknown): value is AttentionPull {
  return typeof value === 'string' && PULLS.has(value as AttentionPull)
}

export function validateRiskPulls(values: unknown): string[] {
  if (!Array.isArray(values)) {
    throw new Error(i18nT('riskPulls 必须是数组。'))
  }
  const cleaned: string[] = []
  for (const value of values) {
    if (!isValidAttentionPull(value)) {
      throw new Error(i18nT('riskPulls 包含无效选项。'))
    }
    if (!cleaned.includes(value)) cleaned.push(value)
  }
  return cleaned
}

export function validateAttentionCovenantInput(input: Record<string, unknown>) {
  const primaryOffering = String(input.primaryOffering || '').trim()
  if (!primaryOffering) {
    throw new Error(i18nT('请写下今天最想把注意力献给什么。'))
  }
  if (primaryOffering.length > 500) {
    throw new Error(i18nT('今日献上内容不能超过 500 字。'))
  }
  return {
    ...input,
    primaryOffering,
    riskPulls: validateRiskPulls(input.riskPulls || []),
  }
}
