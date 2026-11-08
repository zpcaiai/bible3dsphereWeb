const form = document.querySelector('#deletion-form')
const message = document.querySelector('#message')
const submit = form.querySelector('button')

async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('request_not_confirmed')
  }
  return response.json()
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (submit.disabled || !form.reportValidity()) return
  submit.disabled = true
  message.textContent = '正在验证身份并提交申请…'
  const email = form.elements.email.value.trim()
  const password = form.elements.password.value
  // Clear visible credentials immediately; never write them or bearer tokens
  // to URLs, localStorage, sessionStorage, analytics or error messages.
  form.elements.password.value = ''
  try {
    const login = await post('/api/auth/email/login', { email, password })
    if (login.user?.id == null || String(login.user.id).length === 0) throw new Error('identity_not_confirmed')
    const receipt = await post('/api/auth/account-deletion', {
      password, confirmation: 'REQUEST_ACCOUNT_DELETION', expected_user_id: String(login.user.id),
    })
    if (receipt.status !== 'pending_review' || receipt.deletion_completed !== false ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.request_id)) {
      throw new Error('unconfirmed_receipt')
    }
    form.hidden = true
    message.textContent = `删除申请已受理，等待处理。申请编号：${receipt.request_id}。这不代表账号数据已经删除。现有登录会话已撤销。`
  } catch {
    message.textContent = '申请未确认。请检查账号密码后重试；第三方登录账号需要先完成相应身份验证。'
    submit.disabled = false
  }
})
