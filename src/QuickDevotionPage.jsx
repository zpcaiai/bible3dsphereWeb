import { t as i18nT } from './i18n/runtime'
import { useEffect, useRef, useState } from 'react'
import { SuggestMenu } from './components/SuggestField'
const QD_QUESTION_OPTS = ['这句话提醒我神是信实的', '我需要在这件事上更信靠神', '我想为此向神祷告', '我要把它化作今天一个小行动', '我被神的爱触动了']
const QD_GRAT_OPTS = ['感谢今天的平安', '感谢一位家人 / 朋友', '感谢神的供应', '感谢一次及时的帮助', '感谢主的话语与同在']
import BackButton from './BackButton'
import { saveJournal } from './api'

const QUICK_DEVOTIONS = [
  { verse: '你们要将一切的忧虑卸给神，因为他顾念你们。', ref: '彼得前书 5:7', question: '今天，你最难以放下的忧虑是什么？' },
  { verse: '我靠着那加给我力量的，凡事都能做。', ref: '腓立比书 4:13', question: '此刻，有哪件事你觉得靠自己做不到？' },
  { verse: '你们要休息，要知道我是神。', ref: '诗篇 46:10', question: '今天，你在哪件事上还没有真正停下来交托？' },
  { verse: '因为我所受的苦楚，是神凭他的义使我受的，还是我自己犯了罪呢？', ref: '约伯记 10:7', question: '当下，神在你生命中的哪处工作让你感到困惑？' },
  { verse: '当将你的事交托耶和华，并倚靠他，他就必成全。', ref: '诗篇 37:5', question: '今天，有什么计划是你握得最紧、最难放手的？' },
  { verse: '你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。', ref: '马太福音 7:7', question: '你最近在祷告中真正渴望的是什么？' },
  { verse: '神爱世人，甚至将他的独生子赐给他们。', ref: '约翰福音 3:16', question: '今天，神对你的爱让你感到坚定还是遥远？为什么？' },
]

function getTodayDevotion() {
  const day = new Date().getDay()
  return QUICK_DEVOTIONS[day % QUICK_DEVOTIONS.length]
}

export default function QuickDevotionPage({ user, token, onBack, onDone }) {
  const [step, setStep] = useState(0) // 0=verse, 1=question, 2=gratitude, 3=done
  const [gratitude, setGratitude] = useState('')
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const devotion = getTodayDevotion()
  const today = new Date().toISOString().slice(0, 10)
  const startRef = useRef(Date.now())
  const elapsed = Math.floor((Date.now() - startRef.current) / 1000)

  async function handleFinish() {
    if (saving) return
    setSaving(true)
    try {
      if (user) {
        await saveJournal({
          date: today,
          title: `${today} 两分钟灵修`,
          scripture: devotion.ref,
          observation: devotion.verse,
          reflection: devotion.question + (questionAnswer ? `\n\n${questionAnswer}` : ''),
          application: gratitude ? `感恩：${gratitude}` : '',
          prayer: '',
          mood: '',
        }, token)
      }
      setSaved(true)
      setTimeout(() => { onDone?.() || onBack?.() }, 1500)
    } catch (e) {
      setSaving(false)
    }
  }

  const steps = [
    {
      title: '📖 今日经文',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: '#fff', lineHeight: 1.8, fontStyle: 'italic', margin: '24px 0', padding: '0 8px' }}>
            「{devotion.verse}」
          </div>
          <div style={{ fontSize: 13, color: '#c4b5fd' }}>{devotion.ref}</div>
          <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {i18nT('慢慢读一遍，让这句话进入你心里')}
          </div>
        </div>
      ),
    },
    {
      title: '💭 默想一问',
      content: (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e0d4ff', lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
            {devotion.question}
          </div>
          <span style={{ position: 'relative', display: 'block' }}>
          <textarea
            value={questionAnswer}
            onChange={e => setQuestionAnswer(e.target.value)}
            placeholder={i18nT('简短地写下你真实的回应（也可以跳过）')}
            style={{ width: '100%', minHeight: 90, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, padding: '12px 96px 12px 12px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
           aria-label={i18nT('简短地写下你真实的回应（也可以跳过）')}/>
          <SuggestMenu accent="#c4b5fd" top={8} right={8} options={QD_QUESTION_OPTS} value={questionAnswer} onChange={setQuestionAnswer} />
          </span>
        </div>
      ),
    },
    {
      title: '🙏 感恩一句',
      content: (
        <div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
            {i18nT('今天，你感谢神的一件事是什么？')}
          </div>
          <span style={{ position: 'relative', display: 'block' }}>
          <textarea
            value={gratitude}
            onChange={e => setGratitude(e.target.value)}
            placeholder={i18nT('写下一件，哪怕很小的事...')}
            style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, padding: '12px 96px 12px 12px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
           aria-label={i18nT('写下一件，哪怕很小的事...')}/>
          <SuggestMenu accent="#c4b5fd" top={8} right={8} options={QD_GRAT_OPTS} value={gratitude} onChange={setGratitude} />
          </span>
        </div>
      ),
    },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.97)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {saved ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>{i18nT('灵修完成！')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{i18nT('已存入今日灵修日记')}</div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <BackButton onClick={onBack} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{i18nT('⏱ 约2分钟')}</div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
            {steps.map((_, i) => (
              <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? 'linear-gradient(90deg,#5856d6,#007aff)' : 'rgba(255,255,255,0.12)', transition: 'background .3s', maxWidth: 60 }} />
            ))}
          </div>

          {/* Step title */}
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, textAlign: 'center' }}>
            {steps[step]?.title}
          </div>

          {/* Step content */}
          <div style={{ minHeight: 180 }}>
            {steps[step]?.content}
          </div>

          {/* Navigation */}
          <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>{i18nT('← 上一步')}</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg,#5856d6,#007aff)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{i18nT('继续 →')}</button>
            ) : (
              <button onClick={handleFinish} disabled={saving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg,#34c759,#00b300)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? '保存中...' : '✅ 完成今日灵修'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
