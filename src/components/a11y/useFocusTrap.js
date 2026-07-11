import { useEffect, useRef } from 'react'

// useFocusTrap —— 无障碍焦点陷阱 Hook。
// 用于对话框/弹层：激活时把键盘焦点移入容器，Tab / Shift+Tab 在容器内循环，
// Esc 触发关闭回调，卸载/停用时把焦点归还给打开弹层前聚焦的元素。
//
// 用法：
//   const ref = useRef(null)
//   useFocusTrap(ref, { active: true, onEscape: onClose })
//   return <div ref={ref} role="dialog" aria-modal="true">…</div>
//
// 选项：
//   active        是否启用（默认 true）
//   onEscape      按下 Esc 时调用（可选）
//   initialFocus  React ref，指向激活时应首先聚焦的元素（可选；
//                 缺省时聚焦容器内第一个可聚焦元素，若无则聚焦容器本身）
//   returnFocus   是否在停用时归还焦点（默认 true）
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function useFocusTrap(containerRef, options = {}) {
  const { active = true, onEscape, initialFocus, returnFocus = true } = options
  // 用 ref 保存 onEscape，避免它变化导致 effect 反复重挂。
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container || typeof document === 'undefined') return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const getFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el instanceof HTMLElement && el.offsetParent !== null,
      )

    // 初始聚焦：若焦点已在容器内（例如子元素使用了 autoFocus），保持不动，
    // 避免打断已有行为；否则优先 initialFocus，其次 [autofocus] 元素，
    // 再次首个可聚焦元素，最后容器本身。
    const focusInitial = () => {
      const activeNow = document.activeElement
      if (activeNow && activeNow !== container && container.contains(activeNow)) {
        return
      }
      const autoEl = container.querySelector('[autofocus]')
      const target =
        (initialFocus && initialFocus.current) ||
        (autoEl instanceof HTMLElement ? autoEl : null) ||
        getFocusable()[0] ||
        container
      if (target && typeof target.focus === 'function') {
        // 若聚焦到容器本身，确保其可编程聚焦。
        if (target === container && !container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1')
        }
        try { target.focus() } catch { /* ignore */ }
      }
    }
    // 延迟到下一帧，确保弹层内容已渲染完成。
    const raf = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame(focusInitial)
      : (focusInitial(), null)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (escapeRef.current) { e.stopPropagation(); escapeRef.current(e) }
        return
      }
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (activeEl === last || !container.contains(activeEl)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (raf != null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(raf)
      }
      if (returnFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try { previouslyFocused.focus() } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
