import { expect, test } from '@playwright/test'
import fs from 'node:fs/promises'

let lastTurnAt = 0

async function admitTurn() {
  // Keep the existing server's 20/minute limit. This precedes each request;
  // request/action/assertion timeouts remain those of the existing suite.
  const delay = 3300 - (Date.now() - lastTurnAt)
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
  lastTurnAt = Date.now()
}

async function save(info, name, value) {
  await fs.writeFile(info.outputPath(`${name}.json`), JSON.stringify(value, null, 2))
  console.log(name, JSON.stringify(value))
}

async function openMirror(page) {
  await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
  await page.addLocatorHandler(page.getByRole('button', { name: '暂时跳过', exact: true }), async button => button.click())
  await page.goto('/')
  await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
  const account = await page.getByLabel('默认登录账号', { exact: true }).locator('code').allTextContents()
  expect(account).toHaveLength(2) // Existing account published by the login UI.
  await page.getByLabel('邮箱', { exact: true }).fill(account[0])
  await page.getByLabel('密码', { exact: true }).fill(account[1])
  const login = page.waitForResponse(response => response.url().endsWith('/api/auth/email/login'))
  await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
  expect((await login).status()).toBe(200)
  await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '人物图谱', exact: false }).tap()
  await expect(page.getByRole('heading', { name: '关系图谱', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '返回', exact: true }).tap()
  // Returning can render asynchronously while the catalogue is still loading.
  // Establish the list before choose() decides whether another back is needed.
  await expect(page.getByRole('textbox', { name: '搜索人物', exact: true })).toBeVisible()
}

async function choose(page, name) {
  const search = page.getByRole('textbox', { name: '搜索人物', exact: true })
  if (!await search.isVisible()) await page.getByRole('button', { name: '返回', exact: true }).tap()
  await search.fill(name)
  await page.getByRole('button').filter({ has: page.getByText(name, { exact: true }) }).tap()
  const workspace = page.getByRole('region', { name: `${name}数字人`, exact: true })
  await expect(workspace).toBeVisible()
  await expect(workspace.locator('.dh-message')).toHaveCount(0)
  await expect(workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true })).toHaveValue('')
  await expect(workspace.getByRole('button', { name: '重试上次提问', exact: true })).toHaveCount(0)
  return workspace
}

async function ask(page, workspace, info, id, characterId, question, references, previous) {
  await admitTurn()
  const count = await workspace.locator('.dh-message.assistant').count()
  await workspace.getByRole('textbox', { name: '向当前圣经人物提问', exact: true }).fill(question)
  const pending = page.waitForResponse(response => response.url().endsWith('/api/v1/digital-human/turns') && response.request().method() === 'POST')
  pending.catch(() => {})
  await workspace.getByRole('button', { name: '发送并核验', exact: true }).tap()
  const response = await pending
  const request = response.request().postDataJSON()
  const body = await response.json()
  await save(info, id, { http: response.status(), request, body, expectedReferences: references, external: { providers: 'NOT_RUN', media: 'NOT_VERIFIED', humanReview: 'NOT_APPROVED' } })
  await expect(workspace.locator('.dh-message.assistant')).toHaveCount(count + 1)
  await workspace.locator('.dh-message.assistant').last().scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath(`${id}.png`) })
  expect(response.status()).toBe(200)
  expect(body.response.characterId).toBe(characterId)
  expect(body.response.references.map(ref => ref.locator)).toEqual(references)
  expect(body.response.contentReviewState).toBe('THEOLOGY_REVIEW')
  expect(body.response.speechApproved).toBe(false)
  expect(body.state).toBe(references.length ? 'TEXT_ONLY' : 'BLOCKED')
  if (previous) {
    expect(request.sessionId).toBe(previous.request.sessionId)
    expect(request.context).toEqual({ characterId, topicIds: previous.body.response.relatedEvents })
  } else {
    expect(request.context).toBeUndefined()
  }
  await expect(workspace.locator('.dh-message.assistant').last()).toContainText(body.response.displayText)
  return { request, body }
}

test('mobile 320: Moses and Peter preserve sequential references and change topic safely', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await openMirror(page)
  const moses = await choose(page, '摩西')
  let previous = await ask(page, moses, info, 'moses-red-sea', 'moses', '过红海的记载是什么？', ['Exodus 14'])
  previous = await ask(page, moses, info, 'moses-citation', 'moses', '这些经文的出处呢？', ['Exodus 14'], previous)
  previous = await ask(page, moses, info, 'moses-again', 'moses', '再解释一下', ['Exodus 14'], previous)
  previous = await ask(page, moses, info, 'moses-new-topic', 'moses', '你为什么离开埃及？', ['Exodus 2:11-15'], previous)
  previous = await ask(page, moses, info, 'moses-new-citation', 'moses', '这些经文的出处呢？', ['Exodus 2:11-15'], previous)
  const peter = await choose(page, '彼得')
  const fresh = await ask(page, peter, info, 'peter-no-inherited-topic', 'peter', '这些经文的出处呢？', [])
  expect(fresh.request.sessionId).not.toBe(previous.request.sessionId)
  expect(fresh.body.response.warnings).toContain('context-required')
  previous = await ask(page, peter, info, 'peter-water', 'peter', '你为什么在海面上沉下去？', ['Matthew 14:28-31'])
  await ask(page, peter, info, 'peter-citation', 'peter', '这些经文的出处呢？', ['Matthew 14:28-31'], previous)
})

test('mobile 390: Paul, Ruth, Abraham and Samuel keep distinct conversations', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openMirror(page)
  let lastSession
  for (const [name, id, question, refs, followupRefs] of [
    ['保罗', 'paul', '你为什么与巴拿巴分开？', ['Acts 15:36-41'], ['Acts 15:36-41']],
    ['路得', 'ruth', '你为什么到波阿斯田里拾穗？', ['Ruth 2'], ['Ruth 2']],
    ['亚伯拉罕', 'abraham', '神与你立约包括哪些内容？', ['Genesis 15', 'Genesis 17'], ['Genesis 15', 'Genesis 17']],
    ['撒母耳', 'samuel', '你为什么膏立大卫？', ['1 Samuel 16:13'], ['1 Samuel 16:1-13']],
  ]) {
    const workspace = await choose(page, name)
    const first = await ask(page, workspace, info, `${id}-first`, id, question, refs)
    if (lastSession) expect(first.request.sessionId).not.toBe(lastSession)
    const followup = await ask(page, workspace, info, `${id}-citation`, id, '这些经文的出处呢？', followupRefs, first)
    expect(followup.body.response.warnings).toContain('session-topic-context')
    lastSession = first.request.sessionId
  }
})

test('mobile 390: a delayed actual old-person response cannot enter the new conversation', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openMirror(page)
  const moses = await choose(page, '摩西')
  let release, readyResolve, readyReject, doneResolve
  const released = new Promise(resolve => { release = resolve })
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject })
  const done = new Promise(resolve => { doneResolve = resolve })
  ready.catch(() => {})
  let actual, delivery
  await page.route('**/api/v1/digital-human/turns', async route => {
    try {
      const response = await route.fetch()
      actual = { http: response.status(), request: route.request().postDataJSON(), body: await response.json() }
      readyResolve()
      await released
      try { await route.fulfill({ response }); delivery = 'ACTUAL_RESPONSE_DELIVERED' }
      catch { delivery = 'OLD_REQUEST_CANCELLED_AFTER_SWITCH' }
    } catch (error) { readyReject(error) }
    finally { doneResolve() }
  }, { times: 1 })
  try {
    await admitTurn()
    await moses.getByRole('textbox', { name: '向当前圣经人物提问', exact: true }).fill('你为什么离开埃及？')
    await moses.getByRole('button', { name: '发送并核验', exact: true }).tap()
    await ready // route.fetch uses its unchanged 30s request timeout.
    const paul = await choose(page, '保罗')
    release()
    await done
    expect(actual.http).toBe(200)
    expect(actual.body.response.characterId).toBe('moses')
    await expect(paul.locator('.dh-message')).toHaveCount(0)
    await save(info, 'delayed-real-response', { ...actual, delivery, fault: 'ACTUAL_SERVER_RESPONSE_HELD_UNTIL_CHARACTER_SWITCH_NO_FABRICATED_SUCCESS' })
    const current = await ask(page, paul, info, 'paul-after-pending-moses', 'paul', '你为什么与巴拿巴分开？', ['Acts 15:36-41'])
    expect(current.request.sessionId).not.toBe(actual.request.sessionId)
    await choose(page, '摩西')
    const returned = page.getByRole('region', { name: '摩西数字人', exact: true })
    const fresh = await ask(page, returned, info, 'moses-returned-no-history', 'moses', '这些经文的出处呢？', [])
    expect(fresh.request.sessionId).not.toBe(actual.request.sessionId)
    expect(fresh.body.response.warnings).toContain('context-required')
  } finally { release() }
})

test('mobile 390: pending runtime diagnostics keep providers closed while real text works', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openMirror(page)
  let release, readyResolve, readyReject, doneResolve
  const held = new Promise(resolve => { release = resolve })
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject })
  const done = new Promise(resolve => { doneResolve = resolve })
  ready.catch(() => {})
  let actualRuntime, catalog, turn
  page.on('response', response => {
    if (response.url().endsWith('/api/v1/digital-human/catalog')) catalog = { http: response.status(), at: Date.now() }
  })
  await page.route('**/api/v1/digital-human/runtime', async route => {
    try {
      const response = await route.fetch()
      actualRuntime = { http: response.status(), body: await response.json(), receivedAt: Date.now() }
      readyResolve()
      await held
      await route.fulfill({ response })
    } catch (error) { readyReject(error) }
    finally { doneResolve() }
  }, { times: 1 })
  try {
    const workspace = await choose(page, '摩西') // Unchanged real readiness assertion: 5s.
    await ready
    expect(catalog.http).toBe(200)
    expect(actualRuntime.http).toBe(200)
    await expect(workspace.getByLabel('数字人运行状态核对', { exact: true })).toBeVisible()
    await expect(workspace.getByRole('button', { name: '语音提问', exact: true })).toBeDisabled()
    await expect(workspace.locator('iframe')).toHaveCount(0)
    turn = await ask(page, workspace, info, 'actual-text-before-runtime', 'moses', '你们如何过红海？', ['Exodus 14'])
    await expect(workspace.getByLabel('数字人运行状态核对', { exact: true })).toBeVisible()
    release()
    await done
    await expect(workspace.getByLabel('数字人运行状态核对', { exact: true })).toHaveCount(0)
    expect(turn.body.response.speechApproved).toBe(false)
  } finally {
    release()
    await save(info, 'runtime-held-evidence', {
      fault: 'ACTUAL_RUNTIME_RESPONSE_HELD_NO_FABRICATED_DATA', catalog, actualRuntime,
      textCompletedBeforeRelease: Boolean(turn),
    })
  }
})
