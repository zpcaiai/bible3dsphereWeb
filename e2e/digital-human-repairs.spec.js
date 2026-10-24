import { expect, test } from '@playwright/test'
import fs from 'node:fs/promises'

if (process.env.DIGITAL_HUMAN_BUBBLE_LAYOUT_ONLY === '1') {
  test.use({ screenshot: 'off', trace: 'off', video: 'off' })
}

async function openDavid(page) {
  await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
  await page.addLocatorHandler(page.getByRole('button', { name: '暂时跳过', exact: true }), async button => button.click())
  await page.goto('/')
  await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
  // Existing account explicitly published by this application's login panel.
  // No invented identity, token injection, saved auth state or credential export.
  const account = await page.getByLabel('默认登录账号', { exact: true }).locator('code').allTextContents()
  expect(account).toHaveLength(2)
  await page.getByLabel('邮箱', { exact: true }).fill(account[0])
  await page.getByLabel('密码', { exact: true }).fill(account[1])
  const login = page.waitForResponse(response => response.url().endsWith('/api/auth/email/login'))
  await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
  expect((await login).status()).toBe(200)
  await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '人物图谱', exact: false }).tap()
  await expect(page.getByRole('heading', { name: '关系图谱', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '返回', exact: true }).tap()
  await page.getByRole('textbox', { name: '搜索人物', exact: true }).fill('大卫')
  const catalog = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/catalog'))
  await page.getByRole('button').filter({ has: page.getByText('大卫', { exact: true }) }).tap()
  const workspace = page.getByRole('region', { name: '大卫数字人', exact: true })
  await expect(workspace).toBeVisible()
  expect((await catalog).status()).toBe(200) // The app supplies its own real session/bearer.
  return workspace
}

async function evidence(info, name, value) {
  const path = info.outputPath(`${name}.json`)
  await fs.writeFile(path, JSON.stringify(value, null, 2))
  console.log(name, JSON.stringify(value))
}

for (const width of [320, 390]) {
  test(`mobile ${width}: preview button receives real touch without covering disclosure`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 })
    const workspace = await openDavid(page)
    const preview = workspace.locator('.dh-portrait-fallback .dh-preview-voice')
    await expect(preview).toHaveText('试听默认预览音色')
    await preview.scrollIntoViewIfNeeded()
    const geometry = await workspace.evaluate(element => {
      const button = element.querySelector('.dh-preview-voice').getBoundingClientRect()
      const disclosure = element.querySelector('.dh-disclosure').getBoundingClientRect()
      return {
        button: button.toJSON(), disclosure: disclosure.toJSON(),
        centerHit: document.elementFromPoint(button.x + button.width / 2, button.y + button.height / 2)?.outerHTML,
        verticalOverlap: Math.min(button.bottom, disclosure.bottom) - Math.max(button.top, disclosure.top),
        overflow: document.documentElement.scrollWidth > innerWidth,
        audibleVoice: 'NOT_VERIFIED', providers: 'NOT_RUN', humanReview: 'NOT_APPROVED',
      }
    })
    await evidence(info, 'preview-geometry', geometry)
    await page.screenshot({ path: info.outputPath('preview-before-touch.png') })
    expect(geometry.verticalOverlap).toBeLessThanOrEqual(0)
    expect(geometry.overflow).toBe(false)
    // Passive listener records an actual trusted browser touch/click. It does
    // not replace the speech API, fire events, or pretend sound was audible.
    await preview.evaluate(button => button.addEventListener('click', event => {
      button.dataset.realTrustedClick = String(event.isTrusted)
    }, { once: true }))
    await preview.tap()
    await expect(preview).toHaveAttribute('data-real-trusted-click', 'true')
    await evidence(info, 'preview-touch', { trustedClick: await preview.getAttribute('data-real-trusted-click'), label: await preview.innerText(), audibleVoice: 'NOT_VERIFIED' })
    await expect(workspace.locator('.dh-disclosure')).toBeVisible()
    const stop = workspace.getByRole('button', { name: '停止默认预览音色', exact: true })
    if (await stop.count()) await stop.tap()
    await page.screenshot({ path: info.outputPath('preview-after-touch.png') })
  })

  test(`mobile ${width}: failed turn retries real server once and clears on character switch`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 })
    const workspace = await openDavid(page)
    const input = workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true })
    const question = '你为什么没有杀扫罗？'
    let failedRequest
    const abortOnce = async () => page.route('**/api/v1/digital-human/turns', async route => {
      failedRequest = route.request().postDataJSON()
      await route.abort('failed')
    }, { times: 1 })
    await abortOnce()
    await input.fill(question)
    await workspace.getByRole('button', { name: '发送并核验', exact: true }).tap()
    await expect(workspace.locator('.dh-error')).toBeVisible()
    await evidence(info, 'failed-turn-before-retry', {
      fault: 'ONE_BROWSER_NETWORK_ABORT_NO_FABRICATED_RESPONSE',
      request: failedRequest, composer: await input.inputValue(),
      error: await workspace.locator('.dh-error').innerText(),
      userMessages: await workspace.locator('.dh-message.user').count(),
    })
    await page.screenshot({ path: info.outputPath('failed-turn.png') })
    await expect(input).toHaveValue(question)
    const newerDraft = '尚未发送的新草稿'
    await input.fill(newerDraft)
    const pending = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/turns') && response.request().method() === 'POST')
    pending.catch(() => {})
    await workspace.getByRole('button', { name: '重试上次提问', exact: true }).tap()
    const response = await pending
    const body = await response.json()
    const request = response.request().postDataJSON()
    await evidence(info, 'actual-turn-recovery', { http: response.status(), request, body })
    expect(response.status()).toBe(200)
    expect(request.question).toBe(question)
    expect(request.sessionId).toBe(failedRequest.sessionId)
    expect(request.turnId).not.toBe(failedRequest.turnId)
    expect(body.response.characterId).toBe('david')
    expect(body.response.contentReviewState).toBe('THEOLOGY_REVIEW')
    expect(body.response.speechApproved).toBe(false)
    await expect(workspace.locator('.dh-message.assistant')).toContainText(body.response.displayText)
    await expect(input).toHaveValue(newerDraft)
    await expect(workspace.locator('.dh-message.user')).toHaveCount(1)
    await expect(workspace.locator('.dh-error')).toHaveCount(0)
    await page.screenshot({ path: info.outputPath('retried-turn.png') })
    await workspace.getByRole('button', { name: '清空本次会话', exact: true }).tap()
    await expect(input).toHaveValue('')
    await expect(workspace.locator('.dh-message')).toHaveCount(0)
    await abortOnce()
    await input.fill('你如何面对歌利亚？')
    await workspace.getByRole('button', { name: '发送并核验', exact: true }).tap()
    await expect(workspace.getByRole('button', { name: '重试上次提问', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '返回', exact: true }).tap()
    await page.getByRole('textbox', { name: '搜索人物', exact: true }).fill('保罗')
    await page.getByRole('button').filter({ has: page.getByText('保罗', { exact: true }) }).tap()
    const paul = page.getByRole('region', { name: '保罗数字人', exact: true })
    await expect(paul).toBeVisible()
    await expect(paul.getByRole('textbox', { name: '向当前圣经人物提问', exact: true })).toHaveValue('')
    await expect(paul.getByRole('button', { name: '重试上次提问', exact: true })).toHaveCount(0)
    await expect(paul.locator('.dh-message')).toHaveCount(0)
    await evidence(info, 'character-isolation', { from: 'david', to: 'paul', failedTurnCleared: true, draftCleared: true, messages: 0 })
  })
}

test('scripture: Samuel anointing David uses the actual relationship reference', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const workspace = await openDavid(page)
  const pending = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/turns') && response.request().method() === 'POST')
  pending.catch(() => {})
  await workspace.getByRole('button', { name: '撒母耳为什么膏立你？', exact: true }).tap()
  const response = await pending
  const body = await response.json()
  await evidence(info, 'actual-anointing-response', { http: response.status(), body })
  expect(response.status()).toBe(200)
  expect(body.response.references.map(ref => ref.locator)).toEqual(['1 Samuel 16:13'])
  expect(body.response.relatedCharacters).toContain('samuel')
  expect(body.response.relatedCharacters).not.toContain('david')
  expect(body.response.speechApproved).toBe(false)
  expect(body.response.contentReviewState).toBe('THEOLOGY_REVIEW')
  await expect(workspace.locator('.dh-message.assistant')).toContainText(body.response.displayText)
  await page.screenshot({ path: info.outputPath('anointing-correct-reference.png') })
})

test.describe('conversation header layout', () => {
  let lastTurnAt = 0

  for (const width of [320, 390]) for (const characterId of ['james_zebedee', 'philip_evangelist']) {
    test(`${width} ${characterId}: full name and evidence label remain readable`, async ({ page }, info) => {
      const oracle = JSON.parse(await fs.readFile(new URL('./fixtures/digital-human-all100.json', import.meta.url), 'utf8'))
      const person = oracle.characters.find(item => item.characterId === characterId)
      expect(person).toBeTruthy()
      await page.setViewportSize({ width, height: 844 })
      await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
      await page.addLocatorHandler(page.getByRole('button', { name: '暂时跳过', exact: true }), button => button.click())
      let loginHTTP = null
      try {
        await page.goto('/')
        await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
        const account = await page.getByLabel('默认登录账号', { exact: true }).locator('code').allTextContents()
        expect(account).toHaveLength(2)
        await page.getByLabel('邮箱', { exact: true }).fill(account[0])
        await page.getByLabel('密码', { exact: true }).fill(account[1])
        const pending = page.waitForResponse(response => response.url().endsWith('/api/auth/email/login'))
        pending.catch(() => {})
        await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
        loginHTTP = (await pending).status()
        expect(loginHTTP).toBe(200)
        await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
        await expect(page.getByLabel('默认登录账号', { exact: true })).toHaveCount(0)
      } catch (error) {
        await evidence(info, 'authentication-failure', { phase: 'login', http: loginHTTP, errorType: error.name, status: 'FAILED_INCOMPLETE' })
        await page.close().catch(() => {})
        throw new Error('Authentication failed; account values and raw locator errors intentionally omitted')
      }
      await page.getByRole('button', { name: '人物图谱', exact: false }).tap()
      await expect(page.getByRole('heading', { name: '关系图谱', exact: true })).toBeVisible()
      await page.getByRole('button', { name: '返回', exact: true }).tap()
      await expect(page.getByRole('textbox', { name: '搜索人物', exact: true })).toBeVisible()
      await page.getByRole('textbox', { name: '搜索人物', exact: true }).fill(person.mirrorName)
      await page.getByRole('button').filter({ has: page.getByTestId(`digital-human-badge-${characterId}`) }).tap()
      const workspace = page.getByRole('region', { name: `${person.canonicalName}数字人`, exact: true })
      await expect(workspace).toBeVisible() // Original5s, no API/image pre-wait.
      await expect(workspace.locator('.dh-message')).toHaveCount(0)
      const replies = []
      for (const [step, question] of [person.question, ...person.followups].entries()) {
        const delay = 3300 - (Date.now() - lastTurnAt)
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
        lastTurnAt = Date.now()
        await workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true }).fill(question)
        const pending = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/turns') && response.request().method() === 'POST')
        pending.catch(() => {})
        await workspace.getByRole('button', { name: '发送并核验', exact: true }).tap()
        const response = await pending
        const request = response.request().postDataJSON()
        const body = await response.json()
        await evidence(info, `turn-${step}`, { characterId, step, http: response.status(), request, body })
        expect(response.status()).toBe(200)
        expect(request.characterId).toBe(characterId)
        expect(body.response.characterId).toBe(characterId)
        expect(body.state).toBe('TEXT_ONLY')
        expect(body.response.contentReviewState).toBe('THEOLOGY_REVIEW')
        expect(body.response.speechApproved).toBe(false)
        const coordinates = [...new Set(body.response.references.flatMap(ref => {
          const value = oracle.referenceCoordinates[ref.locator]
          expect(value).toBeTruthy()
          return value
        }))].sort()
        expect(coordinates).toEqual(step === 0 && person.preparedSeed ? person.preparedSeed.expectedCoordinates : person.expectedCoordinates)
        if (step) {
          expect(request.sessionId).toBe(replies[step - 1].request.sessionId)
          expect(request.context).toEqual({ characterId, topicIds: replies[step - 1].body.response.relatedEvents })
        } else expect(request.context).toBeUndefined()
        await expect(workspace.locator('.dh-message.assistant')).toHaveCount(step + 1)
        await expect(workspace.locator('.dh-message.assistant').last()).toContainText(body.response.displayText)
        replies.push({ request, body })
      }
      await workspace.locator('.dh-message.assistant').last().scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath('conversation.png') })
      const rows = await workspace.locator('.dh-message.assistant').evaluateAll(nodes => nodes.map(node => {
        const header = node.querySelector('header')
        const title = header.querySelector('strong')
        const label = header.querySelector('.dh-grounding')
        const box = element => {
          const r = element.getBoundingClientRect()
          const range = document.createRange()
          range.selectNodeContents(element)
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width,
            clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
            lineHeight: getComputedStyle(element).lineHeight,
            textRects: [...range.getClientRects()].filter(rect => rect.width > 0).map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })) }
        }
        return { name: title.textContent, badge: label.textContent, header: box(header), title: box(title), label: box(label) }
      }))
      await evidence(info, 'bubble-layout', { characterId, viewport: page.viewportSize(), browserVersion: page.context().browser().version(), messages: rows,
        external: { providers: 'NOT_RUN', media: 'NOT_VERIFIED', humanReview: 'NOT_APPROVED' }, historicalUnique5sRoot: 'UNKNOWN' })
      expect(rows).toHaveLength(3)
      for (const [step, row] of rows.entries()) {
        expect(row.name).toBe(person.canonicalName)
        expect(row.badge).toBe(replies[step].body.response.groundingLevel)
        expect(row.header.width).toBeGreaterThan(0)
        expect(Math.abs(row.title.width - row.header.width)).toBeLessThanOrEqual(1)
        expect(row.title.textRects).toHaveLength(1)
        expect(row.label.top).toBeGreaterThanOrEqual(row.title.bottom)
        for (const item of [row.title, row.label]) {
          expect(item.left).toBeGreaterThanOrEqual(row.header.left - 1)
          expect(item.right).toBeLessThanOrEqual(row.header.right + 1)
          expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth)
          expect(item.scrollHeight).toBeLessThanOrEqual(item.clientHeight)
          expect(item.textRects.length).toBeGreaterThan(0)
          for (const rect of item.textRects) {
            expect(rect.left).toBeGreaterThanOrEqual(item.left - 1)
            expect(rect.right).toBeLessThanOrEqual(item.right + 1)
            expect(rect.top).toBeGreaterThanOrEqual(item.top - 1)
            expect(rect.bottom).toBeLessThanOrEqual(item.bottom + 1)
          }
        }
        expect(row.header.scrollWidth).toBeLessThanOrEqual(row.header.clientWidth)
        expect(row.header.scrollHeight).toBeLessThanOrEqual(row.header.clientHeight)
      }
      await expect(page.locator('.guardian-widget-root')).toHaveCount(0)
      await expect(page.getByRole('navigation', { name: '主要导航', exact: true })).toBeVisible()
    })
  }
})
