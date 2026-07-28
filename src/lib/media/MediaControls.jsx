// MediaControls.jsx — 多模态输出的共享 UI 控件。
//
// 包含：
//   SoundConsentBar  危机场景的显式「开启声音 / 振动」同意条（默认关闭，护栏要求）
//   MediaToggleRow   通用开关行（声音 / 振动 / 环境音 / 自动播报）
//   GuidedAudioBar   引导式播报的播放条（播放 / 暂停 / 跳过 / 停止 + 留白倒计时）
//   BreathCircle     与呼吸相位同步的可视圆（接 prefers-reduced-motion）
//   CountdownRing    通用倒计时环
import { t as i18nT } from '../../i18n/runtime'
import { useMediaPrefs } from './useMediaPrefs'
import { prefersReducedMotion } from '../../prefersReducedMotion'

const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 11px', borderRadius: 999, fontSize: 12.5,
  cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.72)',
  transition: 'background .18s, color .18s, border-color .18s',
}
const chipOn = {
  background: 'rgba(52,199,89,0.16)', borderColor: 'rgba(52,199,89,0.42)', color: '#8be9c0',
}

function Chip({ on, onClick, children, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={!!on}
      style={{ ...chipBase, ...(on ? chipOn : null), opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </button>
  )
}

/**
 * SoundConsentBar — 危机关怀专用。
 * 声音与振动在这些页面里默认全部关闭，必须由用户主动开启；
 * 并始终提供「全部关掉」的一键静音。
 */
export function SoundConsentBar({ note }) {
  const { prefs, toggle, muteAll } = useMediaPrefs()
  const anyOn = prefs.crisisAudio || prefs.crisisHaptics
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderRadius: 12, marginBottom: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.62)', marginRight: 2 }}>
        {i18nT('需要的话，可以让声音和振动陪你：')}
      </span>
      <Chip on={prefs.crisisAudio} onClick={() => toggle('crisisAudio')} title={i18nT('开启或关闭引导声音')}>
        {prefs.crisisAudio ? '🔊' : '🔇'} {i18nT('声音')}
      </Chip>
      <Chip on={prefs.crisisHaptics} onClick={() => toggle('crisisHaptics')} title={i18nT('开启或关闭振动')}>
        {prefs.crisisHaptics ? '📳' : '📴'} {i18nT('振动')}
      </Chip>
      {anyOn && (
        <button
          type="button"
          onClick={muteAll}
          style={{ ...chipBase, borderColor: 'rgba(255,107,107,0.35)', color: '#ffb4b4' }}
        >
          {i18nT('全部关掉')}
        </button>
      )}
      <div style={{ flexBasis: '100%', fontSize: 11.5, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>
        {note || i18nT('声音是缓慢的引导音，不会有任何突然或尖锐的声响。随时可以关掉。')}
      </div>
    </div>
  )
}

/** 通用媒体开关行（非危机场景）。 */
export function MediaToggleRow({ show = ['sound', 'haptics', 'ambience', 'autoplay'], compact = false }) {
  const { prefs, toggle } = useMediaPrefs()
  const LABEL = {
    sound: [i18nT('声音'), '🔊', '🔇'],
    haptics: [i18nT('振动'), '📳', '📴'],
    ambience: [i18nT('环境音'), '🌊', '🌫'],
    autoplay: [i18nT('自动播报'), '▶️', '⏹'],
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: compact ? 8 : 12 }}>
      {show.map((k) => {
        const [label, onIcon, offIcon] = LABEL[k] || [k, '•', '•']
        return (
          <Chip key={k} on={prefs[k]} onClick={() => toggle(k)}>
            {prefs[k] ? onIcon : offIcon} {label}
          </Chip>
        )
      })}
    </div>
  )
}

/**
 * GuidedAudioBar — 引导式播报控制条。
 * @param {object} guided  useGuidedAudio() 的返回值
 */
export function GuidedAudioBar({ guided, onStart, label = '引导播放', hint }) {
  const { state, index, total, remaining, running } = guided
  const btn = {
    ...chipBase,
    background: 'rgba(52,199,89,0.14)', borderColor: 'rgba(52,199,89,0.34)', color: '#8be9c0',
  }
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
        padding: '9px 12px', borderRadius: 12, marginBottom: 12,
        background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.18)',
      }}
    >
      {!running ? (
        <button type="button" style={btn} onClick={onStart}>🔊 {i18nT(label)}</button>
      ) : (
        <>
          <button type="button" style={btn} onClick={state === 'paused' ? guided.resume : guided.pause}>
            {state === 'paused' ? `▶️ ${i18nT('继续')}` : `⏸ ${i18nT('暂停')}`}
          </button>
          <button type="button" style={chipBase} onClick={guided.skip}>{i18nT('跳过这段 ›')}</button>
          <button type="button" style={{ ...chipBase, color: 'rgba(255,255,255,0.5)' }} onClick={guided.stop}>{i18nT('停止')}</button>
        </>
      )}
      {running && total > 0 && (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          {index + 1} / {total}
          {state === 'waiting' && remaining > 0 ? ` · ${i18nT('安静')} ${remaining}s` : ''}
          {state === 'speaking' ? ` · ${i18nT('播报中')}` : ''}
          {state === 'paused' ? ` · ${i18nT('已暂停')}` : ''}
        </span>
      )}
      {!running && hint && (
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)' }}>{hint}</span>
      )}
    </div>
  )
}

/**
 * BreathCircle — 呼吸可视圆。用受控 scale 而非纯 CSS 动画，
 * 以保证与引导音、振动严格同相位。
 */
export function BreathCircle({ phase = 'inhale', progress = 0, label, size = 190, sub }) {
  const reduced = prefersReducedMotion()
  // inhale: 0.55 → 1 ； hold: 保持 1 ； exhale: 1 → 0.55
  let scale = 0.78
  if (phase === 'inhale') scale = 0.55 + 0.45 * progress
  else if (phase === 'hold') scale = 1
  else if (phase === 'exhale') scale = 1 - 0.45 * progress
  if (reduced) scale = 0.82

  const r = (size / 2) * 0.92
  const color = phase === 'exhale' ? '#5ac8fa' : phase === 'hold' ? '#a6b8ff' : '#8be9c0'

  return (
    <div
      style={{ display: 'grid', placeItems: 'center', width: size, height: size, margin: '0 auto' }}
      role="img"
      aria-label={`${label || phase}${sub ? ' · ' + sub : ''}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <radialGradient id="bc-grad">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="70%" stopColor={color} stopOpacity="0.14" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </radialGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="url(#bc-grad)" stroke={color} strokeOpacity="0.55" strokeWidth="1.5"
          style={{
            transformOrigin: 'center',
            transform: `scale(${scale.toFixed(3)})`,
            transition: reduced ? 'none' : 'transform 180ms linear',
          }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

/** CountdownRing — 通用倒计时/进度环。 */
export function CountdownRing({ progress = 0, size = 92, stroke = 7, color = '#5ac8fa', children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }} role="img" aria-label={label || `${Math.round(clamped * 100)}%`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 240ms linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>{children}</div>
    </div>
  )
}

export default MediaToggleRow
