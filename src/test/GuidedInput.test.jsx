import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import GuidedInput from '../components/mission-bridge/GuidedInput'
import { missionOptionLabel } from '../components/mission-bridge/optionLabels'

function Harness({ onValue = () => {} }) {
  const [value, setValue] = useState('')
  const update = (next) => { setValue(next); onValue(next) }
  return <GuidedInput options={['倾听需要', '建立关系', '共同设计']} value={value} onChange={update} aria-label="宣教目标" />
}

describe('GuidedInput', () => {
  it('combines and removes multiple recommendations while keeping a writable input', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.click(screen.getByRole('button', { name: /倾听需要/ }))
    fireEvent.click(screen.getByRole('button', { name: /建立关系/ }))
    expect(screen.getByRole('textbox', { name: '宣教目标' }).value).toBe('倾听需要；建立关系')

    fireEvent.click(screen.getByRole('button', { name: /倾听需要/ }))
    expect(screen.getByRole('textbox', { name: '宣教目标' }).value).toBe('建立关系')

    fireEvent.change(screen.getByRole('textbox', { name: '宣教目标' }), { target: { value: '自定义输入' } })
    expect(screen.getByRole('textbox', { name: '宣教目标' }).value).toBe('自定义输入')
    expect(onValue).toHaveBeenLastCalledWith('自定义输入')
  })

  it('does not append an option beyond maxLength', () => {
    const onChange = vi.fn()
    render(<GuidedInput options={['一个很长的推荐选项']} value="已有内容" onChange={onChange} maxLength={8} aria-label="限制长度" />)
    fireEvent.click(screen.getByRole('button', { name: /一个很长的推荐选项/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows a Chinese-English label while preserving the backend value', () => {
    const onChange = vi.fn()
    render(<GuidedInput options={[{ value: 'Public Domain', label: '公共领域（Public Domain）' }]} value="" onChange={onChange} aria-label="许可证" />)
    fireEvent.click(screen.getByRole('button', { name: /公共领域/ }))
    expect(onChange).toHaveBeenCalledWith('Public Domain')
    expect(missionOptionLabel('passport')).toBe('护照（Passport）')
    expect(missionOptionLabel('unmapped_code')).toBe('其他选项（unmapped_code）')
  })
})
