import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import AccessibilityGuard from '../components/a11y/AccessibilityGuard'

describe('AccessibilityGuard', () => {
  const created = []

  afterEach(() => {
    created.splice(0).forEach((element) => element.remove())
  })

  it('never turns application roots into page-sized buttons', async () => {
    const appRoot = document.createElement('div')
    appRoot.className = 'mobile-app-shell'
    appRoot.onclick = () => {}
    appRoot.setAttribute('role', 'button')
    appRoot.setAttribute('tabindex', '0')
    document.body.appendChild(appRoot)
    created.push(appRoot)

    const card = document.createElement('div')
    card.onclick = () => {}
    document.body.appendChild(card)
    created.push(card)

    render(<AccessibilityGuard />)

    await waitFor(() => expect(card.getAttribute('role')).toBe('button'))
    expect(appRoot.getAttribute('role')).toBeNull()
    expect(appRoot.getAttribute('tabindex')).toBeNull()
  })
})
