/**
 * useDraft — 草稿自动保存（localStorage）
 *
 * 挂载时恢复已保存的草稿；输入时防抖（约 800ms）自动保存；
 * 提交成功后调用 clearDraft() 清除。savedHint 为 true 时可显示
 * 「草稿已自动保存」的小提示。
 *
 * value 支持字符串（单个 textarea）或纯对象（多字段表单，JSON 序列化）。
 *
 * 用法：
 *   const { savedHint, clearDraft } = useDraft('pw-compose-draft-v1', draft, setDraft)
 *   {savedHint && <span>✓ 草稿已自动保存</span>}
 */
import { useCallback, useEffect, useRef, useState } from 'react'

function hasContent(value) {
  if (typeof value === 'string') return value.trim().length > 0
  if (value && typeof value === 'object') {
    return Object.values(value).some(v => typeof v === 'string' && v.trim().length > 0)
  }
  return false
}

export default function useDraft(key, value, setValue, delay = 800) {
  const [savedHint, setSavedHint] = useState(false)
  const restoredRef = useRef(false)
  const skipFirstSaveRef = useRef(true)
  const saveTimerRef = useRef(null)
  const hintTimerRef = useRef(null)

  // 挂载时恢复草稿（仅当当前值为空时，避免覆盖已有内容）
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    try {
      const raw = localStorage.getItem(key)
      if (raw == null || raw === '') return
      if (typeof value === 'string') {
        if (!value.trim()) setValue(raw)
      } else if (value && typeof value === 'object') {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !hasContent(value)) setValue(parsed)
      }
    } catch { /* 草稿损坏则忽略 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // 防抖保存
  useEffect(() => {
    if (skipFirstSaveRef.current) { skipFirstSaveRef.current = false; return }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        if (hasContent(value)) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
          setSavedHint(true)
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
          hintTimerRef.current = setTimeout(() => setSavedHint(false), 2000)
        } else {
          localStorage.removeItem(key)
        }
      } catch { /* 存储不可用则忽略 */ }
    }, delay)
    return () => clearTimeout(saveTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, delay])

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
  }, [])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    setSavedHint(false)
  }, [key])

  return { savedHint, clearDraft }
}
