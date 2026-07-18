import { useLayoutEffect } from 'react'
import { requestTranslation, subscribeTranslationUpdates } from '../autoTranslate'
import { getRuntimeLang } from './runtime'

const CJK = /[一-鿿]/
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt']
const SKIPPED_TEXT_PARENTS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'])
const PENDING_LABEL = 'Translating…'

function visibleEnglish(source) {
  if (!source || !CJK.test(source)) return source
  const translated = requestTranslation(source)
  return translated && !CJK.test(translated) ? translated : PENDING_LABEL
}

function translateEnglishTextNode(node, originals) {
  if (!node?.parentElement || SKIPPED_TEXT_PARENTS.has(node.parentElement.tagName)) return
  if (node.parentElement.closest('[contenteditable="true"]')) return
  const current = node.nodeValue || ''
  let state = originals.get(node)
  if (CJK.test(current)) {
    state = { source: current, rendered: null }
    originals.set(node, state)
  } else if (!state || current !== state.rendered) {
    // React supplied a genuinely new English value; do not restore stale copy.
    originals.delete(node)
    return
  }
  const raw = state.source
  if (!raw || !CJK.test(raw)) return

  const leading = raw.match(/^\s*/)?.[0] || ''
  const trailing = raw.match(/\s*$/)?.[0] || ''
  const source = raw.trim()
  if (!source) return
  const next = `${leading}${visibleEnglish(source)}${trailing}`
  state.rendered = next
  if (current !== next) node.nodeValue = next
}

function translateEnglishAttributes(element, originals) {
  if (!(element instanceof Element)) return
  let stored = originals.get(element)

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute) || ''
    let state = stored?.get(attribute)
    if (CJK.test(current)) {
      if (!stored) {
        stored = new Map()
        originals.set(element, stored)
      }
      state = { source: current, rendered: null }
      stored.set(attribute, state)
    } else if (!state || current !== state.rendered) {
      stored?.delete(attribute)
      continue
    }
    const next = visibleEnglish(state.source)
    state.rendered = next
    if (current !== next) element.setAttribute(attribute, next)
  }

  if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type)) {
    const current = element.value || ''
    let state = stored?.get('value')
    if (CJK.test(current)) {
      if (!stored) {
        stored = new Map()
        originals.set(element, stored)
      }
      state = { source: current, rendered: null }
      stored.set('value', state)
    } else if (!state || current !== state.rendered) {
      stored?.delete('value')
      return
    }
    const next = visibleEnglish(state.source)
    state.rendered = next
    if (current !== next) element.value = next
  }
}

function scan(root, textOriginals, attributeOriginals) {
  if (!root) return
  if (root.nodeType === Node.TEXT_NODE) {
    translateEnglishTextNode(root, textOriginals)
    return
  }
  if (!(root instanceof Element || root instanceof DocumentFragment || root instanceof Document)) return

  if (root instanceof Element) translateEnglishAttributes(root, attributeOriginals)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateEnglishTextNode(node, textOriginals)
    else translateEnglishAttributes(node, attributeOriginals)
    node = walker.nextNode()
  }
}

export default function EnglishVisibleTextGuard() {
  useLayoutEffect(() => {
    if (getRuntimeLang() !== 'en') return undefined
    // Observe body so React portals (modals, call overlays, toasts) are covered too.
    const root = document.body
    if (!root) return undefined

    const textOriginals = new WeakMap()
    const attributeOriginals = new WeakMap()
    const rescan = () => scan(root, textOriginals, attributeOriginals)
    rescan()

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateEnglishTextNode(mutation.target, textOriginals)
        } else if (mutation.type === 'attributes') {
          translateEnglishAttributes(mutation.target, attributeOriginals)
        } else {
          mutation.addedNodes.forEach((node) => scan(node, textOriginals, attributeOriginals))
        }
      }
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    })
    const unsubscribe = subscribeTranslationUpdates(rescan)
    return () => {
      observer.disconnect()
      unsubscribe()
    }
  }, [])

  return null
}
