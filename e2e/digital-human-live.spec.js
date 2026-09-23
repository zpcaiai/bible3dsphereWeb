import { expect, test } from '@playwright/test'

test('real audio reaches LiveKit STT, the reviewed turn gate, and LiveSpeak', async ({ page }, testInfo) => {
  const started = Date.now()
  await page.goto('/')
  await page.getByRole('button', { name: /分享/ }).click()
  await page.getByRole('button', { name: '圣经人物' }).click()
  await expect(page.getByRole('heading', { name: '圣经人物 · 经文约束对话' })).toBeVisible()
  await expect(page.getByText(/内容 APPROVED/)).toBeVisible()
  await expect(page.getByText(/文本安全回退/)).toHaveCount(0)

  await page.getByRole('button', { name: '语音提问' }).click()
  await expect(page.getByText('正在聆听')).toBeVisible()
  await expect(page.locator('.dh-message.user')).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('.dh-message.assistant')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.dh-message.assistant footer')).toContainText('已通过发声门')
  await expect(page.getByText(/Avatar speaking/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/Avatar ready/i)).toBeVisible({ timeout: 60_000 })

  const transcript = (await page.locator('.dh-message.user').last().textContent()) || ''
  const answer = (await page.locator('.dh-message.assistant').last().textContent()) || ''
  expect(transcript.trim().length).toBeGreaterThan(2)
  expect(answer).toMatch(/G[1-5]_/)
  await testInfo.attach('journey-evidence.json', {
    body: JSON.stringify({ durationMs: Date.now() - started, transcriptObserved: true, reviewedSpeechObserved: true, avatarSpeakingObserved: true, rawAudioPersistedByTest: false }),
    contentType: 'application/json',
  })
})
