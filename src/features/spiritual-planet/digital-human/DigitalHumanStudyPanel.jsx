import { useEffect, useState } from 'react'
import { getDigitalHumanStudy } from './api'

export default function DigitalHumanStudyPanel({ characterId, onAsk, onSelectCharacter }) {
  const [open, setOpen] = useState(false)
  const [material, setMaterial] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    let active = true
    setMaterial(null)
    setError('')
    getDigitalHumanStudy(characterId, { signal: controller.signal })
      .then((data) => {
        if (data.characterId !== characterId || !Array.isArray(data.topics) || !Array.isArray(data.relationships)) {
          throw new Error('研读资料与当前人物不一致')
        }
        if (active) setMaterial(data)
      })
      .catch((caught) => { if (active && caught.name !== 'AbortError') setError(caught.message) })
    return () => { active = false; controller.abort() }
  }, [open, characterId, attempt])

  return <details className="dh-study" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>经文研读与人物关系</summary>
    {open && <div>
      {!material && !error && <p role="status">正在读取人物研读资料…</p>}
      {error && <p role="alert">研读资料暂不可用：{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>重新加载研读资料</button></p>}
      {material && <>
        <p>{material.disclosure}</p>
        <p>研读主题 {material.topics.length} · 完整预设回答 {material.preparedAnswerCount} · 内容待人工审核</p>
        <ul>{material.topics.map((topic) => <li key={topic.id}>
          <button type="button" onClick={() => onAsk(topic.question)}>{topic.question}</button>
          <small>{topic.unsupported ? '保持不确定／不作断言' : '经文定位：' + topic.canonicalReferences.join('；')}</small>
          {!!topic.limitations?.length && <p>不可作出的断言：{topic.limitations.join('；')}</p>}
        </li>)}</ul>
        <p>以下关系为待审核的目录记录，不代表全部关系均可作确定断言。</p>
        <ul>{material.relationships.map((edge, index) => <li key={`${edge.targetId}-${edge.relationshipType}-${index}`}>
          {edge.selectable && onSelectCharacter ? <button type="button" onClick={() => onSelectCharacter(edge.targetId)}>{edge.targetName}</button> : <span>{edge.targetName}</span>}
          <small>{edge.relationshipType} · {edge.canonicalReferences.join('；')}</small>
        </li>)}</ul>
      </>}
    </div>}
  </details>
}
