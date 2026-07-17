import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinProtection from '../FormationTwinProtection'
import {
  acceptProtectionAction,
  createProtectionContact,
  createTemptationCycle,
  draftProtectionMessage,
  markProtectionWarning,
  setAllProtectionWarningsPaused,
  startProtectionRecovery,
  updateProtectionSettings,
} from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  acceptProtectionAction: vi.fn(async () => ({ ok: true })),
  acknowledgeProtectionWarning: vi.fn(async () => ({ ok: true })),
  chooseRecoveryAction: vi.fn(async () => ({ ok: true })),
  createProtectionContact: vi.fn(async () => ({ ok: true })),
  createProtectionPlan: vi.fn(async () => ({ ok: true })),
  createTemptationCycle: vi.fn(async () => ({ ok: true })),
  deferRecoveryReview: vi.fn(async () => ({ ok: true })),
  deleteTemptationCycle: vi.fn(async () => ({ ok: true })),
  draftProtectionMessage: vi.fn(async () => ({ ok: true, sent: false })),
  eraseProtectionData: vi.fn(async () => ({ ok: true })),
  getCurrentProtection: vi.fn(async () => current),
  getCurrentProtectionRecovery: vi.fn(async () => ({ recovery: null })),
  getProtectionSettings: vi.fn(async () => ({ settings })),
  listProtectionContacts: vi.fn(async () => ({ contacts })),
  listProtectionPlans: vi.fn(async () => ({ plans: [] })),
  listProtectionWarnings: vi.fn(async () => ({ warnings: [current.warning] })),
  listTemptationCycles: vi.fn(async () => ({ cycles: [] })),
  markProtectionWarning: vi.fn(async () => ({ ok: true })),
  recalculateProtection: vi.fn(async () => ({ ok: true })),
  requestAlternativeProtectionAction: vi.fn(async () => ({ ok: true })),
  requestSmallerProtectionAction: vi.fn(async () => ({ ok: true })),
  resetProtectionLearning: vi.fn(async () => ({ ok: true })),
  setAllProtectionWarningsPaused: vi.fn(async () => ({ ok: true })),
  stabilizeRecovery: vi.fn(async () => ({ ok: true })),
  startProtectionRecovery: vi.fn(async () => ({ ok: true })),
  updateProtectionAction: vi.fn(async () => ({ ok: true })),
  updateProtectionPlanStatus: vi.fn(async () => ({ ok: true })),
  updateProtectionSettings: vi.fn(async () => ({ ok: true })),
  updateRecoveryBehaviorStopped: vi.fn(async () => ({ ok: true })),
  updateRecoverySafety: vi.fn(async () => ({ ok: true })),
  updateTemptationCycleStatus: vi.fn(async () => ({ ok: true })),
}))

const settings = {
  warnings_enabled: true,
  delivery_channel: 'IN_APP_ONLY',
  quiet_hours_json: { start: '22:00', end: '07:00', timezone: 'Asia/Shanghai' },
  cooldown_settings_json: { AWARENESS: 12, PROTECTION_SUGGESTED: 4 },
  model_assistance_enabled: false,
  passive_metadata_enabled: false,
  passive_metadata_consent: false,
  effect_learning_enabled: true,
  accountability_drafts_enabled: false,
  all_warnings_paused: false,
}

const current = {
  snapshot: {
    active_conditions_json: [
      { condition_code: 'SLEEP_DEPRIVATION', user_visible_description: '睡眠不足' },
      { condition_code: 'ALONE_AT_NIGHT', user_visible_description: '深夜独处' },
    ],
    active_protective_factors_json: [{ protection_type: 'BOUNDARY', description: '设备边界已经开启' }],
    unknown_conditions_json: ['DEVICE_ACCESS'],
    counterevidence_json: ['支持伙伴当前可联系'],
  },
  warning: {
    id: 'warning-1', warning_level: 'PROTECTION_SUGGESTED', title: '可以提前增加一个保护条件',
    message: '几个与过去相似的条件正在同时出现。这不代表旧行为一定会发生。',
    uncertainty_notes_json: ['设备环境目前未知。'], sharing_status: 'PRIVATE',
  },
  action: {
    id: 'action-1', title: '把设备移远', description: '把当前设备放到另一个房间，先保留十分钟距离。',
    action_type: 'MOVE_DEVICE', target_module: 'ATTENTION_OS',
  },
}

const contacts = [{ id: 'contact-1', display_alias: '可信朋友', support_role: 'FRIEND' }]

describe('FormationTwinProtection', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('shows conditions, protections, unknowns and one action without risk scores', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    expect(await screen.findByText('睡眠不足')).toBeTruthy()
    expect(screen.getByText('设备边界已经开启')).toBeTruthy()
    expect(screen.getByText('DEVICE_ACCESS')).toBeTruthy()
    expect(screen.getByText('把设备移远')).toBeTruthy()
    expect(document.body.textContent).not.toContain('复发概率：')
    expect(document.body.textContent).not.toContain('85%')
    expect(document.body.textContent).not.toContain('属灵风险分：')
  })

  it('exposes all ten protection information-architecture routes', () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    const routes = Array.from(document.querySelectorAll('[data-protection-route]')).map((item) => item.dataset.protectionRoute)
    expect(routes).toHaveLength(10)
    expect(routes).toContain('/formation-twin/protection/cycles/[id]')
    expect(routes).toContain('/formation-twin/protection/support-people')
  })

  it('requires an explicit action click before routing and offers feedback controls', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    await screen.findByText('把设备移远')
    expect(acceptProtectionAction).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '选择这个行动' }))
    await waitFor(() => expect(acceptProtectionAction).toHaveBeenCalledWith('action-1', { user_confirmed: true, execution_mode: 'REMINDER_ONLY' }))
    fireEvent.click(screen.getByRole('button', { name: '不准确' }))
    await waitFor(() => expect(markProtectionWarning).toHaveBeenCalledWith('warning-1', 'inaccurate'))
    fireEvent.click(screen.getByRole('button', { name: '暂停提醒' }))
    await waitFor(() => expect(setAllProtectionWarningsPaused).toHaveBeenCalledWith(true))
  })

  it('creates a cycle only with the visible user-confirmation state', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '我的循环' }))
    fireEvent.change(screen.getByLabelText('由你命名'), { target: { value: '我的深夜循环' } })
    fireEvent.click(screen.getByLabelText('我确认这个循环只描述有限情境；试探不等于行为。'))
    fireEvent.click(screen.getByRole('button', { name: '保存循环' }))
    await waitFor(() => expect(createTemptationCycle).toHaveBeenCalledWith(expect.objectContaining({
      title: '我的深夜循环', user_confirmed: true,
      required_conditions: ['SLEEP_DEPRIVATION', 'ALONE_AT_NIGHT'],
    })))
  })

  it('creates support drafts without sending or granting Twin access', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '支持联系人' }))
    expect(await screen.findByText('可信朋友')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '生成求助草稿' }))
    await waitFor(() => expect(draftProtectionMessage).toHaveBeenCalledWith('contact-1', expect.objectContaining({ request_type: 'ONE_TIME_HELP_REQUEST' })))
    expect(document.body.textContent).toContain('默认只能生成草稿')
  })

  it('starts recovery with the safety-first flow', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '恢复支持' }))
    expect(screen.getByText('安全 → 停止继续 → 真人连接 → 一个恢复行动 → 稳定后再复盘')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '开始恢复支持' }))
    await waitFor(() => expect(startProtectionRecovery).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'USER_REQUESTED_RECOVERY' })))
  })

  it('requires separate passive-metadata consent and saves privacy settings', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '隐私与设置' }))
    const enable = screen.getByLabelText('启用已授权的布尔状态或摘要')
    expect(enable.disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('单独授权低敏感度被动元数据'))
    fireEvent.click(enable)
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(updateProtectionSettings).toHaveBeenCalledWith(expect.objectContaining({
      passive_metadata_consent: true, passive_metadata_enabled: true,
    })))
  })

  it('keeps new contacts draft-only by default', async () => {
    render(<FormationTwinProtection user={{ id: 'u-1' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '支持联系人' }))
    fireEvent.change(screen.getByPlaceholderText('只保存显示别名'), { target: { value: '守望伙伴' } })
    fireEvent.click(screen.getByRole('button', { name: '保存联系人' }))
    await waitFor(() => expect(createProtectionContact).toHaveBeenCalledWith(expect.objectContaining({ allowed_actions: ['DRAFT_MESSAGE_ONLY'], allowed_share_fields: [] })))
  })
})
