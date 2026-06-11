// NotesButton — 通话中「记录」开关（共用：1对1 与群通话）。
// 开启后连续转写自己的发言；挂断后可生成 AI 纪要/代祷清单。
// 双引擎：本机识别（默认）｜☁ 云转写（Deepgram，准确率更高）——点小徽章切换，自动记住偏好。
import { useEffect, useRef, useState } from 'react'
import {
  startNotes, stopNotes, getState, subscribe,
  preferredEngine, setPreferredEngine, deepgramAvailable,
} from './callNotes'
import { getRuntimeLang, t } from '../i18n/runtime'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

export default function NotesButton({ className, style = {}, labelStyle = {}, disabled, selfName = '' }) {
  const [st, setSt] = useState(getState())
  const prevEngineRef = useRef(st.engine)
  useEffect(() => subscribe((s) => {
    // 自动降级提示：会话中引擎从 web 切到 deepgram
    if (s.active && prevEngineRef.current === 'web' && s.engine === 'deepgram') {
      toast(t('本机识别不稳定，已自动切换 ☁ 云转写'), 'info')
    }
    prevEngineRef.current = s.engine
    setSt(s)
  }), [])

  function toggle() {
    if (st.active) { stopNotes(); toast(t('记录已暂停，挂断后可生成纪要'), 'info'); return }
    if (!st.supported) { toast(t('此设备不支持语音转写'), 'info'); return }
    const ok = startNotes(getRuntimeLang() === 'en' ? 'en-US' : 'zh-CN', selfName)
    if (ok) toast(t('开始记录你的发言（带你的名字同步给全房间），挂断后可生成代祷清单'), 'success')
    else toast(t('语音识别启动失败'), 'error')
  }

  function toggleEngine(e) {
    e.stopPropagation()
    const next = preferredEngine() === 'deepgram' ? 'auto' : 'deepgram'
    if (next === 'deepgram' && !deepgramAvailable()) { toast(t('云转写不可用（缺 Deepgram 配置）'), 'info'); return }
    setPreferredEngine(next)
    toast(next === 'deepgram'
      ? t('已切换 ☁ 云转写（准确率更高，下次开始记录生效）')
      : t('已切回自动模式（优先本机识别）'), 'success')
  }

  const cloudPref = st.preferred === 'deepgram'
  const engineTag = st.active ? (st.engine === 'deepgram' ? ' ☁' : '') : (cloudPref ? ' ☁' : '')

  return (
    <button
      className={className}
      onClick={toggle}
      disabled={disabled}
      style={{ position: 'relative', background: st.active ? 'rgba(232,176,75,0.3)' : 'rgba(255,255,255,0.1)', ...style }}
    >
      <div style={{ fontSize: 22 }}>{st.active ? '🔴' : '📝'}</div>
      <div style={labelStyle}>{st.active ? `${t('记录中')}${engineTag} ${st.lines}` : `${t('记录')}${engineTag}`}</div>
      {/* 引擎切换小徽章（记录中不可切） */}
      {!st.active && !disabled && (
        <span
          onClick={toggleEngine}
          title={cloudPref ? t('当前：云转写（点击切回自动）') : t('当前：自动（点击强制云转写）')}
          style={{
            position: 'absolute', top: -6, right: -6,
            fontSize: 11, lineHeight: 1, padding: '4px 6px', borderRadius: 999,
            background: cloudPref ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.14)',
            border: `1px solid ${cloudPref ? '#38bdf8' : 'rgba(255,255,255,0.3)'}`,
            cursor: 'pointer',
          }}
        >
          ☁
        </span>
      )}
    </button>
  )
}
