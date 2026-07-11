import { useEffect } from 'react'

const INTERACTIVE = 'a,button,input,select,textarea,summary,[role="button"],[tabindex]'

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
