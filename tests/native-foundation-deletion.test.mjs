import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer, request } from 'node:http'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Dedicated public-page browser tests; no existing/frozen acceptance config.
test('public deletion page uses cookie reauthentication and genuine pending SQL receipt', async () => {
  const backend = process.env.NATIVE_AUTH_BASE_URL
  assert.ok(backend)
  const email = `public-deletion-${Date.now()}@example.test`
  const password = 'task-only-public-deletion-password'
  const post = async (path, body) => {
    const r = await fetch(new URL(`/api${path}`, backend), { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal(r.ok, true)
    return r.json()
  }
  const code = await post('/auth/email/send-code', { email })
  await post('/auth/email/register', { email, password, code: code.dev_code, session_transport: 'bearer' })
  const server = createServer(async (req, res) => {
    if (req.url.startsWith('/api/')) {
      const upstream = request(new URL(req.url, backend), { method: req.method, headers: req.headers }, (r) => {
        res.writeHead(r.statusCode, r.headers); r.pipe(res)
      })
      upstream.on('error', () => { res.statusCode = 502; res.end() })
      req.pipe(upstream)
    } else {
      const name = req.url === '/account-deletion.js' ? 'account-deletion.js' : 'account-deletion.html'
      res.setHeader('content-type', name.endsWith('.js') ? 'text/javascript' : 'text/html')
      res.end(await readFile(new URL(`../public/${name}`, import.meta.url)))
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${server.address().port}/account-deletion.html`)
    await page.getByLabel('账号邮箱').fill(email)
    await page.getByLabel('当前账号密码').fill('incorrect')
    await page.getByRole('checkbox').check()
    await page.getByRole('button').click()
    await page.getByRole('status').filter({ hasText: '申请未确认' }).waitFor()
    assert.equal(await page.getByLabel('当前账号密码').inputValue(), '')
    await page.getByLabel('当前账号密码').fill(password)
    await page.getByRole('button').click()
    await page.getByRole('status').filter({ hasText: '删除申请已受理，等待处理' }).waitFor()
    assert.match(await page.getByRole('status').textContent(), /这不代表账号数据已经删除/)
    assert.equal(await page.locator('form').isVisible(), false)
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0)
    assert.equal((await page.request.get(`http://127.0.0.1:${server.address().port}/api/auth/me`)).status(), 401)
    assert.equal(new URL(page.url()).search, '')
  } finally {
    await browser.close(); server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
