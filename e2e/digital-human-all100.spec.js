import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const oracle = JSON.parse(fs.readFileSync(new URL('./fixtures/digital-human-all100.json', import.meta.url), 'utf8'))
const cases = oracle.characters
const group = process.env.DIGITAL_HUMAN_ALL100_GROUP
let page, context, lastTurnAt = 0, previous

function save(info, name, value) {
  fs.writeFileSync(info.outputPath(`${name}.json`), JSON.stringify(value, null, 2))
}

function coordinates(refs) {
  return [...new Set(refs.flatMap(ref => {
    const value = oracle.referenceCoordinates[ref.locator]
    expect(value, `Unexpected or unvalidated reference: ${ref.locator}`).toBeTruthy()
    return value
  }))].sort()
}

async function admitTurn() {
  const delay = 3300 - (Date.now() - lastTurnAt)
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
  lastTurnAt = Date.now()
}

async function openMirror() {
  await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
  await page.addLocatorHandler(page.getByRole('button', { name: '暂时跳过', exact: true }), button => button.click())
  await page.goto('/')
  await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
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
}

async function choose(person) {
  const search = page.getByRole('textbox', { name: '搜索人物', exact: true })
  if (!await search.isVisible()) await page.getByRole('button', { name: '返回', exact: true }).tap()
  await search.fill(person.mirrorName)
  const card = page.getByRole('button').filter({ has: page.getByTestId(`digital-human-badge-${person.characterId}`) })
  await expect(card).toHaveCount(1)
  await card.tap()
  const workspace = page.getByRole('region', { name: `${person.canonicalName}数字人`, exact: true })
  await expect(workspace).toBeVisible() // Original5s; no pre-wait for API or load.
  await expect(workspace.locator('.dh-message')).toHaveCount(0)
  await expect(workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true })).toHaveValue('')
  await expect(workspace.getByRole('button', { name: '重试上次提问', exact: true })).toHaveCount(0)
  return workspace
}

async function ask(workspace, person, question, step, info, prior, name) {
  await admitTurn()
  const count = await workspace.locator('.dh-message.assistant').count()
  await workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true }).fill(question)
  const pending = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/turns') && response.request().method() === 'POST')
  pending.catch(() => {})
  const startedAt = Date.now()
  await workspace.getByRole('button', { name: '发送并核验', exact: true }).tap()
  const response = await pending
  const request = response.request().postDataJSON()
  const body = await response.json()
  const row = { characterId: person.characterId, step, http: response.status(), request, body, elapsedMs: Date.now() - startedAt,
    expectedReferences: step === 0 && person.preparedSeed ? person.preparedSeed.expectedReferences : person.expectedReferences,
    oracleTopicId: person.topicId, external: { providers: 'NOT_RUN', media: 'NOT_VERIFIED', humanReview: 'NOT_APPROVED' } }
  save(info, name, row) // Preserve the actual failure response before asserting.
  expect(response.status()).toBe(200)
  expect(body.response.characterId).toBe(person.characterId)
  expect(body.response.contentReviewState).toBe('THEOLOGY_REVIEW')
  expect(body.response.speechApproved).toBe(false)
  expect(body.state).toBe('TEXT_ONLY')
  const expected = step === 0 && person.preparedSeed ? person.preparedSeed.expectedCoordinates : person.expectedCoordinates
  expect(coordinates(body.response.references)).toEqual(expected)
  expect(body.response.relatedEvents).toEqual([person.topicId])
  if (step === 0 && person.preparedSeed) expect(body.response.answerType).toBe(person.preparedSeed.answerType)
  if (prior) {
    expect(request.sessionId).toBe(prior.request.sessionId)
    expect(request.context).toEqual({ characterId: person.characterId, topicIds: prior.body.response.relatedEvents })
    expect(body.response.warnings).toContain('session-topic-context')
  } else {
    expect(request.context).toBeUndefined()
    if (previous) {
      expect(request.sessionId).not.toBe(previous.request.sessionId)
      expect(person.characterId).not.toBe(previous.body.response.characterId)
    }
  }
  await expect(workspace.locator('.dh-message.assistant')).toHaveCount(count + 1)
  await expect(workspace.locator('.dh-message.assistant').last()).toContainText(body.response.displayText)
  return { request, body }
}

async function verifyMobileHeader(person, info) {
  const section = page.getByRole('region', { name: `${person.mirrorName}的数字人镜鉴`, exact: true })
  const heading = section.getByRole('heading', { name: `${person.mirrorName}的数字人镜鉴`, exact: true })
  const badge = section.getByText(`characterId · ${person.characterId}`, { exact: true })
  const layout = await section.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const header = node.querySelector('header')
    const title = header.firstElementChild
    return { sectionLeft: box.left, sectionRight: box.right, viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth,
      headerClientWidth: header.clientWidth, headerScrollWidth: header.scrollWidth,
      titleClientWidth: title.clientWidth, titleScrollWidth: title.scrollWidth }
  })
  layout.headingWidth = (await heading.boundingBox()).width
  Object.assign(layout, await badge.evaluate(node => {
    const box = node.getBoundingClientRect()
    return { badgeLeft: box.left, badgeRight: box.right, badgeClientWidth: node.clientWidth, badgeScrollWidth: node.scrollWidth }
  }))
  save(info, 'header-layout', layout)
  expect(layout.headingWidth, 'Mobile title/disclosure must not be squeezed into a narrow ID column').toBeGreaterThanOrEqual(200)
  expect(layout.badgeLeft).toBeGreaterThanOrEqual(layout.sectionLeft)
  expect(layout.badgeRight).toBeLessThanOrEqual(layout.sectionRight)
  expect(layout.badgeRight).toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.badgeScrollWidth).toBeLessThanOrEqual(layout.badgeClientWidth)
  expect(layout.headerScrollWidth).toBeLessThanOrEqual(layout.headerClientWidth)
  expect(layout.titleScrollWidth).toBeLessThanOrEqual(layout.titleClientWidth)
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
}

test.beforeAll(async ({ browser, baseURL }, info) => {
  expect(cases).toHaveLength(100)
  expect(new Set(cases.map(person => person.characterId)).size).toBe(100)
  const selected = cases.filter(person => person.group === group)
  expect(selected).toHaveLength(10)
  context = await browser.newContext({ baseURL, viewport: { width: Number(group) % 2 ? 320 : 390, height: 844 }, isMobile: true, hasTouch: true })
  page = await context.newPage()
  page.setDefaultTimeout(30_000)
  page.setDefaultNavigationTimeout(30_000)
  await openMirror()
  // Even each group's first person must leave a real, populated other-person
  // conversation; this is10 extra real anchor turns, separate from100*3.
  const anchor = cases[(selected[0].index + 98) % 100]
  const workspace = await choose(anchor)
  previous = await ask(workspace, anchor, anchor.question, 0, info, null, `anchor-${anchor.characterId}`)
})

test.afterAll(async () => { await context?.close() })

for (const person of cases) {
  test(`g${person.group} ${String(person.index).padStart(3, '0')} ${person.characterId}: matching, two followups and fresh mobile switch`, async ({ browser }, info) => {
    expect(browser.isConnected()).toBe(true)
    const result = { characterId: person.characterId, mirrorId: person.mirrorId, canonicalName: person.canonicalName, viewport: page.viewportSize(), steps: [], completed: false }
    try {
      const workspace = await choose(person)
      await page.screenshot({ path: info.outputPath('entry.png') })
      await verifyMobileHeader(person, info)
      let last
      for (const [step, question] of [person.question, ...person.followups].entries()) {
        last = await ask(workspace, person, question, step, info, last, `turn-${step}`)
        result.steps.push({ step, question, sessionId: last.request.sessionId, references: last.body.response.references.map(ref => ref.locator), matched: true })
      }
      await expect(workspace.locator('.dh-message.user')).toHaveCount(3)
      await expect(workspace.locator('.dh-message.assistant')).toHaveCount(3)
      await workspace.locator('.dh-message.assistant').last().scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath('followups.png') })
      previous = last
      result.completed = true
    } finally { save(info, 'person-result', result) }
  })
}
