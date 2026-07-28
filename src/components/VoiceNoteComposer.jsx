import { t as i18nT } from '../i18n/runtime'
/**
 * VoiceNoteComposer —— 语音便条录制面板（聊天语音留言 / 口述见证共用）。
 *
 * 流程：录音 → 本地回放确认 → Deepgram 转写 → 文字可订正 → 提交。
 * 硬性规则：**没有文字就不能提交**。转写失败或没听清时，用户必须自己补上文字，
 * 否则这条内容对聋人用户与全文搜索来说等于不存在。
 *
 * 无麦克风 / 无权限时本组件直接渲染 null（或一行说明），调用方的纯文字通道不受影响。
 */
import { useVoiceNote } from '../hooks/useVoiceNote'

const box = {
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 12,
  padding: 12,
}
const btn = {
  minHeight: 36,
  padding: '7px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const primaryBtn = {
  ...btn,
  border: '1px solid rgba(52,199,89,0.45)',
  background: 'rgba(52,199,89,0.18)',
  color: '#7ee2a0',
  fontWeight: 700,
}
const recBtn = {
  ...btn,
  border: '1px solid rgba(255,59,48,0.5)',
  background: 'rgba(255,59,48,0.18)',
  color: '#ff9d9d',
  fontWeight: 700,
}
const noteText = { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 6 }

function mmss (total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VoiceNoteComposer ({
  minSeconds = 1,
  maxSeconds = 90,
  onSubmit,
  submitLabel,
  startLabel,
  hint,
  storageNote,
  disabled = false,
  busy = false,
  autoFocusTranscript = false,
}) {
  const voice = useVoiceNote({ minSeconds, maxSeconds })
  const { phase, seconds, duration, error, transcript, audioUrl, supported } = voice

  // 不支持录音就彻底不出现：给一个点了报错的按钮只会让人以为功能坏了。
  if (!supported) return null

  const canSubmit = phase === 'ready' && transcript.trim().length > 0 && !busy && !disabled

  async function handleSubmit () {
    if (!canSubmit) return
    const ok = await onSubmit?.({ transcript: transcript.trim(), durationSeconds: duration })
    if (ok !== false) voice.reset()
  }

  return (
    <div style={box}>
      {phase === 'idle' && (
        <div>
          <button type="button" style={btn} disabled={disabled} onClick={voice.start}>
            🎤 {startLabel || i18nT('录一段语音')}
          </button>
          {hint && <div style={noteText}>{hint}</div>}
        </div>
      )}

      {phase === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span aria-hidden="true" style={{ color: '#ff6b6b', fontSize: 16 }}>●</span>
          <span role="timer" aria-live="off" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums' }}>
            {mmss(seconds)} / {mmss(maxSeconds)}
          </span>
          <button type="button" style={recBtn} onClick={voice.stop}>{i18nT('■ 停止')}</button>
          <button type="button" style={btn} onClick={voice.cancel}>{i18nT('取消')}</button>
        </div>
      )}

      {phase === 'transcribing' && (
        <div role="status" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          {i18nT('正在转文字…')}
        </div>
      )}

      {phase === 'error' && (
        <div>
          <div role="alert" style={{ fontSize: 12.5, color: '#ff8787', marginBottom: 8, lineHeight: 1.6 }}>⚠️ {error}</div>
          <button type="button" style={btn} onClick={voice.start}>{i18nT('重新录音')}</button>
        </div>
      )}

      {phase === 'ready' && (
        <div>
          {/* 回放的是本地录音，用来确认「我到底说了什么」，此时还没有发出去 */}
          <audio src={audioUrl} controls style={{ width: '100%', height: 36 }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '6px 0 4px' }}>
            {i18nT('时长')} {mmss(duration)} · {i18nT('转写文字（可修改，必须填写）')}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => voice.setTranscript(e.target.value)}
            rows={3}
            autoFocus={autoFocusTranscript}
            placeholder={i18nT('这里是语音转成的文字，请确认或修改')}
            aria-label={i18nT('语音转写文字')}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
            }}
          />
          {error && <div role="alert" style={{ fontSize: 12, color: '#ffb86b', marginTop: 6 }}>⚠️ {error}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" style={primaryBtn} disabled={!canSubmit} onClick={handleSubmit}>
              {busy ? i18nT('处理中…') : (submitLabel || i18nT('确认'))}
            </button>
            <button type="button" style={btn} onClick={voice.retryTranscribe}>{i18nT('重试转文字')}</button>
            <button type="button" style={btn} onClick={voice.start}>{i18nT('重录')}</button>
            <button type="button" style={btn} onClick={voice.cancel}>{i18nT('放弃')}</button>
          </div>
          {!transcript.trim() && (
            <div style={{ ...noteText, color: 'rgba(255,184,76,0.75)' }}>
              {i18nT('文字不能为空：聋人弟兄姊妹与搜索都只能读到文字。')}
            </div>
          )}
        </div>
      )}

      {storageNote && phase !== 'idle' && <div style={noteText}>{storageNote}</div>}
    </div>
  )
}
