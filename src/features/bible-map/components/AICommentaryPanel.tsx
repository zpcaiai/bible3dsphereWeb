import { useState } from 'react'
import type { BibleMapSelection } from '../domain/types'
import { generateAi } from '../lib/dataSource'
import { t, getRuntimeLang } from '../../../i18n/runtime'
import { pickVal } from '../../../i18n/pickLang'

interface Props {
  selection: BibleMapSelection | null
}


function subjectName(s: BibleMapSelection): string {
  if (s.kind === 'territory' && s.territory) return pickVal(s.territory.nameZh, s.territory.name)
  if (s.kind === 'prophecy' && s.prophecy) {
    const nation = pickVal(s.prophecy.targetNationZh, s.prophecy.targetNation)
    return getRuntimeLang() === 'en'
      ? `Prophecy concerning ${nation} (${s.prophecy.book})`
      : `${s.prophecy.book}论${s.prophecy.targetNationZh}的预言`
  }
  if (s.kind === 'campaign' && s.campaign) return pickVal(s.campaign.nameZh, s.campaign.name)
  if (s.kind === 'event' && s.event) return pickVal(s.event.titleZh, s.event.title)
  if (s.kind === 'person' && s.person) return pickVal(s.person.personZh, s.person.person)
  return t('所选内容')
}

export function AICommentaryPanel({ selection }: Props) {
  const name = selection ? subjectName(selection) : null
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [llm, setLlm] = useState(false)

  async function generate(): Promise<void> {
    if (!selection || !name) return
    setLoading(true)
    setText(null)
    try {
      const data = await generateAi(selection.kind, name)
      setText(data.commentary)
      setLlm(data.source === 'llm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bm-ai-panel rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-bold text-indigo-200">{t('AI 讲解')}</h3>
        </div>
        {name && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-md border border-indigo-400/40 bg-indigo-400/15 px-2.5 py-1 text-xs font-medium text-indigo-200 disabled:opacity-50"
          >
            {loading ? t('生成中…') : t('✨ 生成讲解')}
          </button>
        )}
      </div>
      {!name ? (
        <p className="text-sm leading-relaxed text-gray-400">
          {t('选择一个支派、国家/帝国、人物、预言、战役或事件，点「生成讲解」从历史背景、地理意义、属灵意义与现代应用四个维度获取讲解。')}
        </p>
      ) : text ? (
        <>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">{text}</p>
          <p className="mt-2 text-[10px] text-gray-500">{llm ? t('由大模型生成') : t('模板文本（未配置 OPENAI_API_KEY）')}</p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-gray-300">
          {getRuntimeLang() === 'en'
            ? `On "${name}", click "✨ Generate" for a commentary across historical background, geography, spiritual meaning and modern application.`
            : `关于「${name}」，点击「✨ 生成讲解」从历史背景、地理意义、属灵意义和现代应用四个维度获取解释。`}
        </p>
      )}
    </div>
  )
}
