import { useEffect } from 'react'

const INTERACTIVE = 'a,button,input,select,textarea,summary,[role="button"],[tabindex]'
const APP_ROOTS = '#root,.mobile-app-shell,.standalone-subpage-shell,[data-app-shell]'

function accessibleName(el) {
  return el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || ''
}

function normalize(root) {
  const elements = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...document.querySelectorAll('*')]
  for (const el of elements) {
    if (el.tagName === 'IMG' && !el.hasAttribute('alt')) el.setAttribute('alt', '')
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !accessibleName(el) && !el.labels?.length) {
      el.setAttribute('aria-label', el.getAttribute('name') || el.getAttribute('type') || '输入字段')
    }
    // React installs a delegated noop `onclick` on its root container. It is
    // event infrastructure, not a user-facing control; treating it as a button
    // makes the global :active animation scale the entire page on every touch.
    if (el.matches(APP_ROOTS)) {
      if (el.getAttribute('role') === 'button') el.removeAttribute('role')
      if (el.getAttribute('tabindex') === '0') el.removeAttribute('tabindex')
      continue
    }
    // React delegates click events, but installs a noop onclick on non-native
    // interactive elements. Give those elements a keyboard-reachable contract.
    if (typeof el.onclick === 'function' && !el.matches(INTERACTIVE)) {
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
    }
  }
}

export default function AccessibilityGuard() {
  useEffect(() => {
    normalize(document)
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) normalize(node)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const onKeyDown = event => {
      const target = event.target
      if (!(target instanceof Element) || target.getAttribute('role') !== 'button') return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        target.click()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { observer.disconnect(); document.removeEventListener('keydown', onKeyDown) }
  }, [])
  return null
}
