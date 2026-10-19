import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { setRuntimeLang } from '../i18n/runtime'

describe('dating priority standalone rendering', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    window.history.replaceState({}, '', '/amor-survey')
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    cleanup()
    window.history.replaceState({}, '', '/')
  })

  it('does not mount the home page behind the public survey route', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: '长期伴侣选择优先级' }, { timeout: 20_000 })
    await waitFor(() => expect(document.querySelectorAll('main')).toHaveLength(1))
    expect(screen.queryByText('今日灵命状态')).toBeNull()
    expect(screen.queryByRole('navigation', { name: '主导航' })).toBeNull()
  })
})
