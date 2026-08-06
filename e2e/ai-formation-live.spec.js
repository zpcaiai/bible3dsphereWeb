import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.skip(!process.env.AI_FORMATION_LIVE_E2E, 'Set AI_FORMATION_LIVE_E2E=1 with the disposable backend and database running')

test('real Chrome login persists a minimized learner context through FastAPI and PostgreSQL', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
  await page.goto('/sunday-school/ai-formation')

  await expect(page.getByLabel('邮箱', { exact: true })).toHaveValue('john@biblesphere.com')
  await expect(page.getByLabel('密码', { exact: true })).toHaveValue('John')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: '🔑 登录' }).click()

  await expect(page.getByRole('heading', { name: 'AI时代心意更新与家庭门训' })).toBeVisible()
  await expect(page.getByText('RELEASE CANDIDATE', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: '选择路径' }).click()
  await page.getByLabel('我理解这里只保存角色、年龄带、目标和同意状态，不保存秘密或自由文本').check()

  const persisted = page.waitForResponse((response) => (
    response.url().endsWith('/api/v1/sunday-school/ai-formation/records')
      && response.request().method() === 'POST'
  ))
  await page.getByRole('button', { name: '生成课程路径' }).click()
  const response = await persisted

  expect(response.status()).toBe(201)
  const body = await response.json()
  expect(body.record).toMatchObject({
    record_type: 'learner_context',
    status: 'active',
    revision: 1,
  })
  await expect(page.getByRole('heading', { name: '模块基础、神学护栏、领域模型与牧养安全契约' })).toBeVisible()
  await page.screenshot({
    path: 'docs/ai-formation-certification/chrome-live-postgis.png',
    fullPage: true,
  })
})
