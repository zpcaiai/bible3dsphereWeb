import { useMemo, useState } from 'react'
import { t } from '../i18n/runtime'

export const PASTORAL_ROUTE_TARGETS = {
  app: {
    scripture: 'bible-reading',
    prayer: 'prayer',
    examen: 'spiritual-formation',
    waiting: 'spiritual-formation',
    guardian: 'guardian',
    crisis: 'sos',
  },
  planet: {
    scripture: 'lectio',
    prayer: 'psalm',
    examen: 'examen',
    waiting: 'waiting',
    guardian: 'agent',
    crisis: 'checkup',
  },
  formation: {
    scripture: 'scripture-formation',
    prayer: 'prayer-communion',
    examen: 'daily',
    waiting: 'cross-lament-hope',
    guardian: 'community-discipleship',
    crisis: 'suffering-care',
  },
}

export const PASTORAL_PATH_OPTIONS = [
  {
    id: 'steady',
    icon: '🌿',
    title: '平稳同行',
    shortLabel: '今天还平稳',
    subtitle: '心里还算安稳，适合先聆听神的话，再走一个小步。',
    verseRef: '诗篇 119:105',
    verseText: '你的话是我脚前的灯，是我路上的光。',
    actionTitle: '今日小行动',
    action: '读一小段经文，写下一个可以顺服的具体行动。',
    review: '今晚只回看一件事：我在哪里更愿意听主的话？',
    primaryLabel: '开始默想经文',
    route: 'scripture',
    color: '#34c759',
  },
  {
    id: 'weary',
    icon: '🕯️',
    title: '疲惫低潮',
    shortLabel: '我很疲惫',
    subtitle: '不用假装刚强，先把劳苦和重担带到基督面前。',
    verseRef: '马太福音 11:28',
    verseText: '凡劳苦担重担的人，可以到我这里来，我就使你们得安息。',
    actionTitle: '今日小行动',
    action: '写一句真实祷告，只说现在最重的那件事。',
    review: '今晚回看：我有没有允许自己被主安慰，而不是只责备自己？',
    primaryLabel: '写一个祷告',
    route: 'prayer',
    color: '#5ac8fa',
  },
  {
    id: 'guilt',
    icon: '✝️',
    title: '认罪与赦免',
    shortLabel: '我很自责',
    subtitle: '把罪带到光中，也把控告带到福音里分辨。',
    verseRef: '约翰一书 1:9',
    verseText: '我们若认自己的罪，神是信实的，是公义的，必要赦免我们的罪。',
    actionTitle: '今日小行动',
    action: '分清一件需要承认的罪，和一句不属于福音的控告。',
    review: '今晚回看：我是在躲避神，还是带着真实来到神面前？',
    primaryLabel: '进入省察',
    route: 'examen',
    color: '#ffd43b',
  },
  {
    id: 'waiting',
    icon: '🧭',
    title: '等候与分辨',
    shortLabel: '我在等候',
    subtitle: '把不确定交给主，也辨认今天能忠心承担的一步。',
    verseRef: '诗篇 27:14',
    verseText: '要等候耶和华，当壮胆，坚固你的心。',
    actionTitle: '今日小行动',
    action: '写下我正在等候什么，以及今天不需要掌控的一件事。',
    review: '今晚回看：我是在信靠中等候，还是在焦虑中催促？',
    primaryLabel: '走等候之路',
    route: 'waiting',
    color: '#a78bfa',
  },
  {
    id: 'unsafe',
    icon: '🛟',
    title: '需要帮助',
    shortLabel: '我不太安全',
    subtitle: '严重低落、自伤念头、失控冲动或长期重担，不要独自承受。',
    verseRef: '诗篇 34:18',
    verseText: '耶和华靠近伤心的人，拯救灵性痛悔的人。',
    actionTitle: '先做安全一步',
    action: '现在先联系真实的人：当地急救、家人、牧者、导师或可信任的朋友。',
    review: '等安全稳定后，再慢慢整理发生了什么；今天先不独自扛。',
    primaryLabel: '打开安全帮助',
    route: 'crisis',
    color: '#ff6b6b',
    urgent: true,
  },
]

const baseButton = {
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

export default function PastoralPathCard({ onOpen, compact = false, className = '', style }) {
  const [selectedId, setSelectedId] = useState(PASTORAL_PATH_OPTIONS[0].id)
  const selected = useMemo(
    () => PASTORAL_PATH_OPTIONS.find((item) => item.id === selectedId) || PASTORAL_PATH_OPTIONS[0],
    [selectedId],
  )
  const accent = selected.color

  const openRoute = (route) => {
    if (typeof onOpen === 'function') onOpen(route)
  }

  return (
    <section
      className={className}
      aria-label={t('今日牧养路径')}
      style={{
        margin: compact ? '0 0 14px' : '0 0 18px',
        borderRadius: 18,
        padding: compact ? 14 : 18,
        color: '#fff',
        background: `linear-gradient(145deg, ${accent}20, rgba(255,255,255,0.045))`,
        border: `1px solid ${accent}55`,
        boxShadow: selected.urgent ? `0 14px 38px ${accent}16` : '0 14px 38px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: accent, textTransform: 'uppercase' }}>
            {t('牧者式下一步')}
          </div>
          <h2 style={{ margin: '4px 0 4px', fontSize: compact ? 17 : 20, lineHeight: 1.25, letterSpacing: 0 }}>
            {t('今日牧养路径')}
          </h2>
          <p style={{ margin: 0, fontSize: compact ? 12.5 : 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.68)' }}>
            {t('先被福音安放，再走一个真实、可完成的小步。')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openRoute('crisis')}
          style={{
            ...baseButton,
            flex: '0 0 auto',
            borderRadius: 999,
            padding: '8px 11px',
            background: 'rgba(255,107,107,0.16)',
            border: '1px solid rgba(255,107,107,0.34)',
            color: '#ffb3b3',
            fontSize: 11.5,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {t('我需要帮助')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))', gap: 8, marginBottom: 12 }}>
        {PASTORAL_PATH_OPTIONS.map((item) => {
          const active = item.id === selected.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedId(item.id)}
              style={{
                ...baseButton,
                minHeight: 42,
                borderRadius: 14,
                padding: '8px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 7,
                textAlign: 'left',
                background: active ? `${item.color}2e` : 'rgba(255,255,255,0.055)',
                border: active ? `1px solid ${item.color}99` : '1px solid rgba(255,255,255,0.1)',
                color: active ? '#fff' : 'rgba(255,255,255,0.76)',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{t(item.shortLabel)}</span>
            </button>
          )
        })}
      </div>

      <article style={{
        borderRadius: 16,
        padding: compact ? 13 : 15,
        background: 'rgba(0,0,0,0.18)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
          <span aria-hidden="true" style={{ fontSize: 24 }}>{selected.icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: compact ? 15 : 16.5, lineHeight: 1.25 }}>{t(selected.title)}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.64)', lineHeight: 1.5 }}>{t(selected.subtitle)}</p>
          </div>
        </div>

        <div style={{ margin: '10px 0', padding: '10px 11px', borderRadius: 14, background: `${accent}18`, border: `1px solid ${accent}35` }}>
          <div style={{ fontSize: 11, color: accent, fontWeight: 800, marginBottom: 3 }}>{t(selected.verseRef)}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.86)' }}>“{t(selected.verseText)}”</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 9, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.76)' }}>
            <strong style={{ color: '#fff' }}>{t(selected.actionTitle)}：</strong>{t(selected.action)}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.68)' }}>
            <strong style={{ color: '#fff' }}>{t('晚间复盘')}：</strong>{t(selected.review)}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => openRoute(selected.route)}
            style={{
              ...baseButton,
              flex: '1 1 150px',
              minHeight: 42,
              borderRadius: 14,
              padding: '0 14px',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#071016',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {t(selected.primaryLabel)}
          </button>
          <button
            type="button"
            onClick={() => openRoute('guardian')}
            style={{
              ...baseButton,
              flex: '1 1 150px',
              minHeight: 42,
              borderRadius: 14,
              padding: '0 14px',
              background: 'rgba(255,255,255,0.075)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.82)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {t('和守护者聊聊')}
          </button>
        </div>
      </article>

      <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: 'rgba(255,255,255,0.48)', lineHeight: 1.6 }}>
        {t('长期沉重或反复跌倒时，请把这条路带给牧者、导师或可信任的属灵伙伴。')}
      </p>
    </section>
  )
}
