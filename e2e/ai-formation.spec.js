import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const user = {
  email: 'browser-reviewer@example.test',
  nickname: 'Browser Reviewer',
  role: 'admin',
  is_admin: true,
  permissions: ['sunday_school.ai_formation.manage'],
}

const manifest = {
  ok: true,
  enabled: true,
  manifest: {
    moduleId: 'sunday_school.ai_formation',
    status: 'release_candidate',
    title: { 'zh-CN': 'AI时代心意更新与家庭门训' },
  },
  tracks: [],
  batches: [],
}

async function mockApplicationApis(page) {
  const savedRecords = []
  await page.addInitScript((cachedUser) => {
    localStorage.setItem('bible-sphere-user', JSON.stringify(cachedUser))
    localStorage.setItem('app-lang', 'zh')
  }, user)
  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    let body = { ok: true }
    if (pathname === '/api/auth/me') body = { ok: true, user }
    else if (pathname.endsWith('/ai-formation/manifest')) body = manifest
    else if (pathname.endsWith('/ai-formation/records') && route.request().method() === 'POST') {
      savedRecords.push(route.request().postDataJSON())
      body = { ok: true, record: { id: 'browser-record', revision: 1 } }
    } else if (pathname.endsWith('/layout')) body = { items: [] }
    else if (pathname.endsWith('/history')) body = { items: [] }
    else if (pathname.includes('/content/review-queue')) body = { ok: true, content: [] }
    else if (pathname.includes('/certification/status')) {
      body = { ok: true, certification: { status: 'NOT_CERTIFIED', blockers: ['AUTHORIZED_HUMAN_SIGNOFF_REQUIRED'] }, evidence: [], decisions: [] }
    } else if (pathname.includes('/records')) body = { ok: true, records: [] }
    else if (pathname.includes('/schemas')) body = { ok: true, schemas: [] }
    else if (pathname.includes('/scenarios')) body = { ok: true, scenarios: [] }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  return savedRecords
}

async function openModule(page, path = '/sunday-school/ai-formation') {
  const savedRecords = await mockApplicationApis(page)
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'AI时代心意更新与家庭门训' })).toBeVisible()
  return savedRecords
}

test('desktop Chrome: keyboard path, data-minimizing intake, and WCAG scan', async ({ page }) => {
  const savedRecords = await openModule(page)
  await expect(page.getByText('RELEASE CANDIDATE', { exact: true }).first()).toBeVisible()

  await page.keyboard.press('Tab')
  const firstFocus = await page.evaluate(() => document.activeElement?.tagName)
  expect(['BUTTON', 'A']).toContain(firstFocus)

  await page.getByRole('button', { name: '选择路径' }).click()
  await page.getByLabel('我理解这里只保存角色、年龄带、目标和同意状态，不保存秘密或自由文本').check()
  await page.getByRole('button', { name: '生成课程路径' }).click()
  await expect(page.getByRole('heading', { name: '模块基础、神学护栏、领域模型与牧养安全契约' })).toBeVisible()
  await expect.poll(() => savedRecords.length).toBe(1)
  expect(savedRecords[0]).toMatchObject({
    record_type: 'learner_context',
    retention_days: 90,
    payload: {
      role: 'learner',
      age_band: 'adult',
      goals: ['attention'],
      consent: { data_minimization_accepted: true },
    },
  })
  expect(Object.keys(savedRecords[0].payload).sort()).toEqual([
    'accessibility_needs', 'age_band', 'consent', 'device_context', 'goals', 'locale', 'role', 'version',
  ])

  const accessibility = await new AxeBuilder({ page }).include('.aif-page').analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: 'docs/ai-formation-certification/chrome-desktop.png', fullPage: true })
})

for (const device of [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-320x568', width: 320, height: 568 },
]) {
  test(`${device.name}: reflow, touch targets, reduced motion, and WCAG scan`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openModule(page)
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(horizontalOverflow).toBeLessThanOrEqual(1)
    const undersizedTargets = await page.locator('.aif-page button:visible').evaluateAll((buttons) => buttons
      .map((button) => {
        const rect = button.getBoundingClientRect()
        return { text: button.textContent?.trim(), width: rect.width, height: rect.height }
      })
      .filter(({ width, height }) => width < 44 || height < 44))
    expect(undersizedTargets).toEqual([])
    const accessibility = await new AxeBuilder({ page }).include('.aif-page').analyze()
    expect(accessibility.violations).toEqual([])
    await page.screenshot({ path: `docs/ai-formation-certification/chrome-${device.name}.png`, fullPage: true })
  })
}

test('admin certification deep link remains fail-closed', async ({ page }) => {
  await openModule(page, '/sunday-school/ai-formation/admin/certification')
  await expect(page.getByRole('heading', { name: '生产认证与人工发布决策' })).toBeVisible()
  await expect(page.getByText('NOT_CERTIFIED').first()).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).include('.aif-page').analyze()
  expect(accessibility.violations).toEqual([])
})

test('400 percent zoom preserves a single-axis reflow and semantic landmarks', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openModule(page)
  await page.evaluate(() => { document.body.style.zoom = '400%' })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(page.getByRole('main')).toBeVisible()
  const moduleRegion = page.locator('#aif-main')
  await expect(moduleRegion).toHaveRole('region')
  const snapshot = await moduleRegion.ariaSnapshot()
  expect(snapshot).toContain('选择与你当前责任相符的轨道')
})
