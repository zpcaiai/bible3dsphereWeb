import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { mergeAutoEn } from '../i18n/translations'
import { setRuntimeLang } from '../i18n/runtime'

vi.mock('../api', () => ({
  translateTexts: vi.fn(async (texts) => texts.map(() => 'Translated fallback')),
}))

import EnglishVisibleTextGuard from '../i18n/EnglishVisibleTextGuard'

describe('EnglishVisibleTextGuard', () => {
  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('removes visible CJK from static, attributed, and dynamically added EN content', async () => {
    setRuntimeLang('en')
    mergeAutoEn({
      健康教会九标志: 'Nine Marks of a Healthy Church',
      输入昵称: 'Enter nickname',
      返回: 'Back',
      提交: 'Submit',
    })

    const { container } = render(
      <>
        <EnglishVisibleTextGuard />
        <main title="返回">
          <h1>健康教会九标志</h1>
          <input placeholder="输入昵称" />
          <input type="submit" value="提交" />
          <p>未收录的新中文</p>
          <textarea defaultValue="用户输入中文" />
        </main>
      </>,
    )

    expect(screen.getByText('Nine Marks of a Healthy Church')).toBeTruthy()
    expect(screen.getByPlaceholderText('Enter nickname')).toBeTruthy()
    expect(screen.getByTitle('Back')).toBeTruthy()
    expect(screen.getByDisplayValue('Submit')).toBeTruthy()
    expect(screen.getByDisplayValue('用户输入中文')).toBeTruthy()

    await waitFor(() => expect(screen.getByText('Translated fallback')).toBeTruthy())

    const dynamic = document.createElement('button')
    dynamic.textContent = '健康教会九标志'
    container.querySelector('main').appendChild(dynamic)
    await waitFor(() => expect(dynamic.textContent).toBe('Nine Marks of a Healthy Church'))

    dynamic.textContent = 'Already English'
    dynamic.setAttribute('title', 'Already English')
    await waitFor(() => expect(dynamic.textContent).toBe('Already English'))
    expect(dynamic.title).toBe('Already English')
  })
})
