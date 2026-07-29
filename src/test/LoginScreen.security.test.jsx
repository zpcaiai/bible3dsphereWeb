import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import LoginScreen from '../LoginScreen'
import { setRuntimeLang } from '../i18n/runtime'
import { mergeAutoEn } from '../i18n/translations'
import autoEn from '../i18n/auto-en'

const mockEmailAuthStatus = vi.fn().mockResolvedValue({ selfRegisterEnabled: true, message: '' })

vi.mock('../auth', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({ user: { email: 'member@example.com' } }),
  registerWithEmail: vi.fn(),
  sendEmailCode: vi.fn(),
  sendResetCode: vi.fn(),
  resetPassword: vi.fn(),
  // 登录页渲染时会查询邮箱服务可用性；漏掉这个 mock 会让整个组件在挂载时抛错
  fetchEmailAuthStatus: (...args) => mockEmailAuthStatus(...args),
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
    expect(screen.getByRole('button', { name: 'Chinese' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Log in' })).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })
})

describe('LoginScreen 在邮箱服务不可用时提前说明', () => {
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('zh')
    localStorage.clear()
  })
  afterEach(() => { cleanup(); localStorage.clear(); mockEmailAuthStatus.mockReset() })

  it('服务不可用时，切到注册页立刻看到原因，而不是填完表才撞 503', async () => {
    mockEmailAuthStatus.mockResolvedValue({
      selfRegisterEnabled: false,
      message: '邮箱验证服务当前不可用，请联系管理员。',
    })
    render(<LoginScreen onLogin={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /注册/ }))
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/不可用/)
    })
  })

  it('服务正常时不显示任何告警横幅', async () => {
    mockEmailAuthStatus.mockResolvedValue({ selfRegisterEnabled: true, message: '' })
    render(<LoginScreen onLogin={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /注册/ }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /注册/ })).toBeTruthy())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('探测失败时按可用处理——不能因为一次网络抖动就把注册入口自己堵死', async () => {
    mockEmailAuthStatus.mockRejectedValue(new Error('network'))
    render(<LoginScreen onLogin={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /注册/ }))
    await waitFor(() => expect(screen.getByRole('tab', { name: /注册/ })).toBeTruthy())
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
