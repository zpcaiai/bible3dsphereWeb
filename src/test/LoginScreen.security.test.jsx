import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import LoginScreen from '../LoginScreen'
import { setRuntimeLang } from '../i18n/runtime'
import { mergeAutoEn } from '../i18n/translations'
import autoEn from '../i18n/auto-en'

vi.mock('../auth', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({ user: { email: 'member@example.com' } }),
  registerWithEmail: vi.fn(),
  sendEmailCode: vi.fn(),
  sendResetCode: vi.fn(),
  resetPassword: vi.fn(),
}))

describe('LoginScreen credential safety', () => {
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('zh')
    localStorage.clear()
  })

  afterEach(() => {
    setRuntimeLang('zh')
    cleanup()
    localStorage.clear()
  })

  it('uses the Spirit Emotion Sphere product subtitle', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Spirit Emotion Sphere')).toBeTruthy()
    expect(screen.queryByText('Bible Emotion Sphere')).toBeNull()
  })

  it('removes legacy plaintext credentials and never prefills a password', () => {
    localStorage.setItem('bs_remember_creds', JSON.stringify({
      email: 'legacy@example.com',
      password: 'plaintext-password',
    }))

    render(<LoginScreen />)

    expect(screen.getByLabelText('邮箱').value).toBe('')
    expect(screen.getByLabelText('密码').value).toBe('')
    expect(localStorage.getItem('bs_remember_creds')).toBeNull()
    expect(screen.getByText('记住邮箱')).toBeTruthy()
  })

  it('remembers only the email after a successful login', async () => {
    render(<LoginScreen onLogin={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'member@example.com' } })
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'strong-password' } })
    fireEvent.click(screen.getByLabelText('记住邮箱'))
    fireEvent.click(screen.getByRole('button', { name: '🔑 登录' }))

    await waitFor(() => expect(localStorage.getItem('bs_remember_email')).toBe('member@example.com'))
    expect(localStorage.getItem('bs_remember_creds')).toBeNull()
    expect(JSON.stringify({ ...localStorage })).not.toContain('strong-password')
  })

  it('renders the complete login flow in English without Chinese leakage', () => {
    setRuntimeLang('en')

    const { container } = render(<LoginScreen />)
    const localizedContent = container.cloneNode(true)
    localizedContent.querySelector('[role="group"]')?.remove()

    expect(localizedContent.textContent).not.toMatch(/[\u3400-\u9fff]/)
    expect(screen.getByRole('button', { name: '中文' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Log in' })).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })
})
