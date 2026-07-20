import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import SafetyPlanEditor from '../components/SafetyPlanEditor'
import { buildSafetyPlanTemplate } from '../data/crisisContent'

describe('SafetyPlanEditor readiness', () => {
  it('requires a real contact and records rehearsal and review time', () => {
    const onSave = vi.fn()
    const { container } = render(<SafetyPlanEditor plan={buildSafetyPlanTemplate('TW')} onSave={onSave} />)
    const saveButton = container.querySelector('.cc-btn.full')
    expect(saveButton.disabled).toBe(true)

    const contactField = Array.from(container.querySelectorAll('.cc-field')).find((field) => /安全联系人|safety contact/i.test(field.textContent))
    const draftInput = contactField.querySelector('input[placeholder]')
    fireEvent.change(draftInput, { target: { value: 'Alex · 555-0100' } })
    fireEvent.click(contactField.querySelector('button[aria-label]'))

    const rehearsal = Array.from(container.querySelectorAll('input[type="checkbox"]'))[0]
    fireEvent.click(rehearsal)
    expect(saveButton.disabled).toBe(false)
    fireEvent.click(saveButton)

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0][0].safePeople).toEqual(['Alex · 555-0100'])
    expect(onSave.mock.calls[0][0].rehearsedAt).toBeTruthy()
    expect(onSave.mock.calls[0][0].lastReviewedAt).toBeTruthy()
  })
})
