import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  fetchVapidKey: vi.fn(),
  fetchPushPrefs: vi.fn(),
  subscribePush: vi.fn(),
  savePushPrefs: vi.fn(),
  testPush: vi.fn(),
  fetchCareConsent: vi.fn(),
  saveCareConsent: vi.fn(),
}))

vi.mock('../api', () => api)
vi.mock('../auth', () => ({ getToken: () => 'token-1' }))

import ReminderSettings from '../ReminderSettings'


describe('ReminderSettings McCheyne preference', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, 'PushManager', { configurable: true, value: function PushManager() {} })
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: { ready: Promise.resolve({}) } })
    api.fetchVapidKey.mockReset().mockResolvedValue({ configured: true, public_key: 'key' })
    api.fetchPushPrefs.mockReset().mockResolvedValue({
      subscribed: true,
      morning_on: true,
      evening_on: true,
      morning_time: '07:00',
      evening_time: '21:30',
      growth_on: true,
      mccheyne_on: false,
    })
    api.fetchCareConsent.mockReset().mockResolvedValue({ share_formation_flags: true })
    api.savePushPrefs.mockReset().mockResolvedValue({ ok: true })
  })

  it('saves the fixed 08:00 McCheyne push opt-in', async () => {
    render(<ReminderSettings onBack={() => {}} />)

    const toggle = await screen.findByRole('button', { name: /麦琴每日读经推送|Daily M'Cheyne reading push/ })
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: /保存提醒时间|Save reminder times/ }))

    await waitFor(() => expect(api.savePushPrefs).toHaveBeenCalledWith(
      expect.objectContaining({ mccheyne_on: true }),
      'token-1',
    ))
  })
})
