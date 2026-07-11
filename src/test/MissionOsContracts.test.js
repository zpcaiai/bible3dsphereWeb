import { describe, expect, it } from 'vitest'
import { incidentId, MISSION_SUBDOMAINS, tenantId } from '../features/mission-os/contracts'

describe('Mission OS public contracts', () => {
  it('accepts public opaque identifiers and rejects unsafe values', () => {
    expect(tenantId('church:shanghai-01')).toBe('church:shanghai-01')
    expect(incidentId('019f502b-14af')).toBe('019f502b-14af')
    expect(() => tenantId('')).toThrow(TypeError)
    expect(() => tenantId('../private')).toThrow(TypeError)
  })

  it('publishes the twelve canonical subdomains', () => {
    expect(MISSION_SUBDOMAINS).toHaveLength(12)
    expect(new Set(MISSION_SUBDOMAINS).size).toBe(12)
  })
})
