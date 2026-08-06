import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const user = {
  email: 'new-features-browser@example.test',
  nickname: 'New Features Browser',
  role: 'admin',
  is_admin: true,
}

const displayContract = {
  contract_version: 'emd-display-contract-1.0',
  required_labels: ['exploratory', '非临床', '个人反思用途', '试点版本'],
  disclaimers: [
    '阶段不是分数，不能相加，也不能与其他用户比较。',
    '阶段描述的是当前一段时间的表现，不是你这个人。',
    '情感成熟不等于属灵成熟，本系统不评估救恩、圣灵同在或神的评价。',
  ],
  confidence_vocabulary: { PROVISIONAL: '初步印象，可能会变' },
}

async function mockApplicationApis(page) {
  let itemRequests = 0
  let profileReady = false
  let routeReady = false
  await page.addInitScript((cachedUser) => {
    localStorage.setItem('bible-sphere-user', JSON.stringify(cachedUser))
    localStorage.setItem('app-lang', 'zh')
  }, user)
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    const method = request.method()
    let body = { ok: true }

    if (pathname === '/api/auth/me') body = { ok: true, user }
    else if (pathname.endsWith('/church/me')) body = { ok: true, church: { id: 'browser-church', name: 'Browser Church', role: 'member', member_count: 1 } }
    else if (pathname.endsWith('/layout')) body = { items: [] }
    else if (pathname.endsWith('/history')) body = { items: [] }
    else if (pathname.endsWith('/daily-snapshot')) body = { ok: true }
    else if (pathname.endsWith('/user/emotion-trajectory')) body = { ok: true, items: [] }
    else if (pathname.endsWith('/shared/notes')) body = { ok: true, items: [], total: 0, pages: 1 }
    else if (pathname.endsWith('/sunday-school/videos')) body = { ok: true, videos: [] }
    else if (pathname.endsWith('/ai-formation/manifest')) {
      body = {
        ok: true,
        enabled: true,
        manifest: { moduleId: 'sunday_school.ai_formation', status: 'release_candidate', title: { 'zh-CN': 'AI时代心意更新与家庭门训' } },
        tracks: [],
        batches: [],
      }
    } else if (pathname.endsWith('/emotional-maturity/display-contract')) body = { ok: true, ...displayContract }
    else if (pathname.endsWith('/emotional-maturity/pilot-capabilities')) {
      body = { ok: true, profile: 'PILOT', sharing_allowed: false, group_features_allowed: false, max_certifiable_level: 'RESTRICTED_PILOT' }
    } else if (pathname.endsWith('/emotional-maturity/consent-scopes')) {
      body = {
        ok: true,
        scopes: {
          EMD_SELF_ASSESSMENT: '进行一次性的私人情感成熟度自评',
          EMD_BEHAVIOR_EVIDENCE: '记录并使用最近真实行为作为证据',
        },
        granted_scopes: [],
        withheld_scopes: { EMD_PASTORAL_SHARE: '试点档未认证第三方分享，因此不提供该同意项' },
      }
    } else if (pathname.endsWith('/emotional-maturity/consent') && method === 'POST') {
      body = { ok: true, decision: 'GRANTED', session_id: 'browser-session', granted_scopes: ['EMD_SELF_ASSESSMENT'] }
    } else if (pathname.endsWith('/emotional-maturity/triage')) {
      body = { ok: true, assessment_allowed: true, safety_level: 'NONE' }
    } else if (pathname.endsWith('/emotional-maturity/intake')) body = { ok: true, status: 'READY' }
    else if (pathname.endsWith('/emotional-maturity/items/next')) {
      itemRequests += 1
      body = itemRequests === 1
        ? {
            ok: true,
            decision: 'ask_item',
            rendered_item: {
              item_id: 'D2-SR-001',
              dimension_code: 'D2',
              item_type: 'SR',
              item_type_label: '自我描述',
              rendered_text: '情绪上来时，我通常能注意到。',
              response_mode: 'likert',
              skip_note: '跳过不会被解读为回避。',
            },
          }
        : { ok: true, decision: 'stop', stop_reasons: ['ITEM_BUDGET_REACHED'] }
    } else if (pathname.endsWith('/emotional-maturity/responses')) body = { ok: true, raw_text_stored: false }
    else if (pathname.endsWith('/emotional-maturity/score')) {
      profileReady = true
      body = { ok: true, emd_profile_id: 'browser-profile' }
    } else if (pathname.endsWith('/emotional-maturity/route') && method === 'POST') {
      routeReady = true
      body = { ok: true, route_record_id: 'browser-route', assignments: [] }
    } else if (pathname.endsWith('/emotional-maturity/profile')) {
      body = profileReady
        ? {
            ok: true,
            profile: {
              emd_profile_id: 'browser-profile',
              dimensions: [{
                dimension_code: 'D2',
                dimension_name: '情绪觉察与命名',
                stage: 'E0',
                stage_label: '证据不足，只作参考',
                context: '现有已授权证据',
                timeframe: '本次评估 · 2026-08-05',
                confidence: 'INSUFFICIENT',
                confidence_label: '证据不足，只作参考',
                evidence_count: 1,
                score: null,
              }],
            },
          }
        : { ok: true, profile: null }
    } else if (pathname.endsWith('/emotional-maturity/route') && method === 'GET') {
      body = { ok: true, route: routeReady ? { emd_profile_id: 'browser-profile', assignments: [] } : null }
    } else if (pathname.includes('/certification/status')) {
      body = { ok: true, certification: { status: 'NOT_CERTIFIED', blockers: ['AUTHORIZED_HUMAN_SIGNOFF_REQUIRED'] }, evidence: [], decisions: [] }
    } else {
      body = {
        ok: true,
        items: [], records: [], events: [], sources: [], timeline: [], observations: [],
        candidates: [], episodes: [], nodes: [], chains: [], patterns: [], scenarios: [],
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

test('mobile Chrome: Sunday School placement and EMD assessment are end-to-end closed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApplicationApis(page)
  await page.goto('/')

  await page.getByRole('button', { name: /分享/ }).click()
  await page.getByRole('button', { name: /主日学/ }).click()
  const formationCard = page.getByRole('heading', { name: 'AI时代心意更新与家庭门训' })
  const videosHeading = page.getByRole('heading', { name: '主日学视频' })
  await expect(formationCard).toBeVisible()
  await expect(videosHeading).toBeVisible()
  expect((await formationCard.boundingBox()).y).toBeLessThan((await videosHeading.boundingBox()).y)
  const sundayAccessibility = await new AxeBuilder({ page })
    .include('section[aria-labelledby="sunday-ai-formation-title"]')
    .analyze()
  expect(sundayAccessibility.violations).toEqual([])
  await page.screenshot({ path: 'docs/ai-formation-certification/chrome-mobile-sunday-school-placement.png', fullPage: true })

  await page.getByRole('button', { name: /打开课程模块/ }).click()
  await expect(page.getByRole('heading', { name: 'AI时代心意更新与家庭门训' })).toBeVisible()
  await page.getByRole('button', { name: /返回/ }).first().click()
  await expect(page.getByText('🌟 分享墙')).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: /情感—属灵形成孪生/ }).first().click()
  await expect(page.getByRole('heading', { name: '情感成熟度：阶段描述与下一步' })).toBeVisible()
  await page.getByRole('button', { name: '授权私人自评' }).click()
  await page.getByRole('button', { name: '完成安全分流并开始自评' }).click()
  await expect(page.getByText('情绪上来时，我通常能注意到。')).toBeVisible()
  await page.getByLabel(/^3/).check()
  await page.getByRole('button', { name: '保存并继续' }).click()
  await expect(page.getByText(/本次自评已完成/)).toBeVisible()
  await expect(page.getByRole('button', { name: '开始一次新的私人自评' })).toBeVisible()
  await expect(page.getByRole('button', { name: '完成安全分流并开始自评' })).toHaveCount(0)
  await expect(page.getByText('现有已授权证据')).toBeVisible()

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(horizontalOverflow).toBeLessThanOrEqual(1)
  const accessibility = await new AxeBuilder({ page }).include('.ft-maturity').analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: 'docs/ai-formation-certification/chrome-mobile-new-features-closure.png', fullPage: true })
})
