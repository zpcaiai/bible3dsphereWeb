import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import DigitalHumanStudyPanel from '../digital-human/DigitalHumanStudyPanel'
import { getDigitalHumanStudy } from '../digital-human/api'

vi.mock('../digital-human/api', () => ({ getDigitalHumanStudy: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const material = {
  characterId: 'david', disclosure: '待审核资料，不是完整人物回答', preparedAnswerCount: 2,
  topics: [{ id: 'david-goliath', question: '你如何面对歌利亚？', canonicalReferences: ['1 Samuel 17'], unsupported: false }],
  relationships: [{ targetId: 'saul', targetName: '扫罗', selectable: true, relationshipType: 'SERVED_UNDER', canonicalReferences: ['1 Samuel 16'] }],
}
async function openPanel() {
  const details = screen.getByText('经文研读与人物关系').closest('details')
  details.open = true
  fireEvent(details, new Event('toggle'))
}

describe('real-study UI contract', () => {
  it('loads on demand and separates study topics from complete answers', async () => {
    getDigitalHumanStudy.mockResolvedValue(material)
    const ask = vi.fn(), select = vi.fn()
    render(<DigitalHumanStudyPanel characterId="david" onAsk={ask} onSelectCharacter={select} />)
    expect(getDigitalHumanStudy).not.toHaveBeenCalled()
    await openPanel()
    await screen.findByText('研读主题 1 · 完整预设回答 2 · 内容待人工审核')
    fireEvent.click(screen.getByRole('button', { name: '你如何面对歌利亚？' }))
    expect(ask).toHaveBeenCalledWith('你如何面对歌利亚？')
    fireEvent.click(screen.getByRole('button', { name: '扫罗' }))
    expect(select).toHaveBeenCalledWith('saul')
  })

  it('rejects wrong-character material and allows explicit retry', async () => {
    getDigitalHumanStudy.mockResolvedValueOnce({ ...material, characterId: 'paul' }).mockResolvedValueOnce(material)
    render(<DigitalHumanStudyPanel characterId="david" onAsk={() => {}} />)
    await openPanel()
    await screen.findByRole('alert')
    expect(screen.queryByText('研读主题 1 · 完整预设回答 2 · 内容待人工审核')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '重新加载研读资料' }))
    await waitFor(() => expect(screen.getByText('研读主题 1 · 完整预设回答 2 · 内容待人工审核')).toBeTruthy())
  })
})
