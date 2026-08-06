import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AiFormationPage from '../AiFormationPage'
import { BATCHES, MODULE_MANIFEST, TRACKS } from '../program'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

const loader = vi.fn(async () => ({ enabled: true, manifest: MODULE_MANIFEST, tracks: TRACKS, batches: BATCHES }))

describe('AiFormationPage', () => {
  it('blocks the route when the feature flag is off', () => {
    render(<AiFormationPage enabled={false} onBack={() => {}} />)
    expect(screen.getByText('NOT_CERTIFIED')).toBeTruthy()
    expect(screen.getByText(/Feature Flag 保持关闭/)).toBeTruthy()
  })

  it('renders four tracks and the complete ordered batch matrix', async () => {
    render(<AiFormationPage enabled user={{ email: 'user@example.test' }} onBack={() => {}} manifestLoader={loader} recordSaver={vi.fn()} />)
    expect(await screen.findByText('选择与你当前责任相符的轨道')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /查看课程轨道/ })).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Batch 01–12' }))
    expect(screen.getByRole('navigation', { name: 'Batch 选择' }).querySelectorAll('button')).toHaveLength(12)
    expect(document.body.textContent).toContain('学习内容仍被锁定')
  })

  it('renders localized titles from the backend manifest contract', async () => {
    const backendLoader = vi.fn(async () => ({
      enabled: true,
      manifest: MODULE_MANIFEST,
      tracks: TRACKS.map((track) => ({ ...track, title: { 'zh-CN': track.title, en: `EN ${track.id}` } })),
      batches: BATCHES,
    }))
    render(<AiFormationPage enabled user={{ email: 'user@example.test' }} onBack={() => {}} manifestLoader={backendLoader} recordSaver={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: TRACKS[0].title })).toBeTruthy()
    expect(document.body.textContent).not.toContain('[object Object]')
  })

  it('enforces minor consent before saving a minimal learner context', async () => {
    const saver = vi.fn(async () => ({ ok: true }))
    render(<AiFormationPage enabled user={{ email: 'user@example.test' }} onBack={() => {}} manifestLoader={loader} recordSaver={saver} />)
    await screen.findByText('选择与你当前责任相符的轨道')
    fireEvent.click(screen.getByRole('button', { name: '选择路径' }))
    fireEvent.change(screen.getByLabelText('年龄带'), { target: { value: '13_15' } })
    fireEvent.click(screen.getByText(/我理解这里只保存/))
    fireEvent.click(screen.getByRole('button', { name: '生成课程路径' }))
    expect(await screen.findByText(/guardian confirmation/)).toBeTruthy()
    expect(saver).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText(/已完成适用的监护人/))
    fireEvent.click(screen.getByRole('button', { name: '生成课程路径' }))
    await waitFor(() => expect(saver).toHaveBeenCalledWith('learner_context', expect.objectContaining({ age_band: '13_15' }), expect.any(String)))
  })

  it('shows fail-closed release gates only to the platform-admin path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ content: [] }) })
    render(<AiFormationPage enabled user={{ email: 'admin@example.test', role: 'admin', is_admin: true }} onBack={() => {}} manifestLoader={loader} recordSaver={vi.fn()} />)
    await screen.findByText('选择与你当前责任相符的轨道')
    fireEvent.click(screen.getByText('进入教师与审核工作台'))
    expect(screen.getByText('生产认证与人工发布决策')).toBeTruthy()
    expect(screen.getAllByText('NOT_RUN')).toHaveLength(10)
    expect(screen.getByText('NOT_CERTIFIED')).toBeTruthy()
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
  })

  it('does not expose the governance route to a learner', async () => {
    render(<AiFormationPage enabled initialRoute="/admin" user={{ email: 'learner@example.test', permissions: 'sunday_school.ai_formation.manage' }} onBack={() => {}} manifestLoader={loader} recordSaver={vi.fn()} />)
    expect(await screen.findByText('选择与你当前责任相符的轨道')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '审核与发布' })).toBeNull()
    expect(screen.queryByText('生产认证与人工发布决策')).toBeNull()
  })

  it('does not promise a teacher-only governance path the backend will reject', async () => {
    render(<AiFormationPage enabled initialRoute="/admin" user={{ email: 'teacher@example.test', role: 'teacher', permissions: ['sunday_school.ai_formation.manage'] }} onBack={() => {}} manifestLoader={loader} recordSaver={vi.fn()} />)
    expect(await screen.findByText('选择与你当前责任相符的轨道')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '审核与发布' })).toBeNull()
    expect(screen.queryByText('生产认证与人工发布决策')).toBeNull()
  })
})
