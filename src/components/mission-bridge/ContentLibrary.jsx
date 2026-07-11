import { useEffect, useState } from 'react'
import {
  createMissionBridgeContent, fetchMissionBridgeContentLibrary, publishMissionBridgeContent,
  reviewMissionBridgeContent, searchMissionBridgeContent, verifyMissionBridgeContentSource,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './contentLibrary.css'

const reviewTypes = [['theological', '神学审核'], ['cultural', '文化审核'], ['safeguarding', '安全审核'], ['accessibility', '可及性审核']]
const initialDraft = { contentType: 'discussion_guide', title: '', language: 'zh-CN', contentClass: 'application', body: '', readingLevel: 'standard', author: '', sourceTitle: '', sourceUrl: '', copyrightHolder: '', license: '', citation: '' }

export default function ContentLibrary({ token, canManage = false }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [draft, setDraft] = useState(initialDraft)
  const [created, setCreated] = useState(null)
  const [checks, setChecks] = useState({ source: false })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = () => fetchMissionBridgeContentLibrary(token).then((data) => setItems(data.items || [])).catch((err) => setError(err.message))
  useEffect(() => { load() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (action, message) => { setError(''); setNotice(''); try { await action(); setNotice(message) } catch (err) { setError(err.message) } }
  const submit = async (event) => { event.preventDefault(); await run(async () => { const value = await createMissionBridgeContent(token, draft); setCreated(value); setChecks({ source: false }) }, '内容草稿已建立，请验证来源并完成四重审核') }
  const approve = (type) => run(async () => { await reviewMissionBridgeContent(token, created.versionId, { reviewType: type, decision: 'approved', notes: `${type} 人工审核通过` }); setChecks((old) => ({ ...old, [type]: true })) }, `${reviewTypes.find(([key]) => key === type)[1]}已记录`)
  const ready = created && checks.source && reviewTypes.every(([key]) => checks[key])
  return <section className="mb-content">
    {error && <div className="mb-alert error" role="alert">{error}</div>}{notice && <div className="mb-alert success" role="status">{notice}</div>}
    <div className="mb-content-search"><h3>{t('可信资料检索')}</h3><form onSubmit={(event) => { event.preventDefault(); run(async () => setResult(await searchMissionBridgeContent(token, query)), '检索已完成') }}><input aria-label={t('检索已审核资料')} required minLength={2} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('输入主题或问题')} /><button>{t('检索')}</button></form>{result && <div className={`mb-rag-result ${result.grounded ? '' : 'unknown'}`}><p>{result.answer}</p>{result.citations?.map((source) => <a key={`${source.contentId}-${source.citation}`} href={source.sourceUrl || undefined} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.author} · {source.sourceTitle} · {source.citation}</span></a>)}</div>}</div>
    <div className="mb-content-library"><h3>{t('已审核资料库')}</h3>{!items.length ? <div className="mb-state">{t('暂时没有已发布资料')}</div> : items.map((item) => <div key={item.id}><strong>{item.title}</strong><span>{item.contentType} · {item.language} · {item.readingLevel}</span></div>)}</div>
    {canManage && <form className="mb-content-editor" onSubmit={submit}><h3>{t('内容发布工作台')}</h3><div className="mb-content-fields"><input required minLength={3} placeholder={t('内容标题')} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}  aria-label={t('内容标题')}/><select value={draft.contentType} onChange={(e) => setDraft({ ...draft, contentType: e.target.value })}><option value="discussion_guide">discussion_guide</option><option value="scripture">scripture</option><option value="professional_resource">professional_resource</option><option value="referral_guide">referral_guide</option></select><select value={draft.contentClass} onChange={(e) => setDraft({ ...draft, contentClass: e.target.value })}><option value="application">application</option><option value="scripture_text">scripture_text</option><option value="interpretation">interpretation</option><option value="professional_advice">professional_advice</option></select><select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}><option value="zh-CN">简体中文</option><option value="zh-TW">繁体中文</option><option value="en">English</option></select></div><textarea required minLength={10} placeholder={t('正文')} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}  aria-label={t('正文')}/><div className="mb-content-fields"><input required placeholder={t('作者')} value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })}  aria-label={t('作者')}/><input required placeholder={t('来源标题')} value={draft.sourceTitle} onChange={(e) => setDraft({ ...draft, sourceTitle: e.target.value })}  aria-label={t('来源标题')}/><input placeholder={t('来源链接')} value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}  aria-label={t('来源链接')}/><input required placeholder={t('版权所有者')} value={draft.copyrightHolder} onChange={(e) => setDraft({ ...draft, copyrightHolder: e.target.value })}  aria-label={t('版权所有者')}/><input required placeholder={t('许可证')} value={draft.license} onChange={(e) => setDraft({ ...draft, license: e.target.value })}  aria-label={t('许可证')}/><input required placeholder={t('引用格式')} value={draft.citation} onChange={(e) => setDraft({ ...draft, citation: e.target.value })}  aria-label={t('引用格式')}/></div><button>{t('建立内容草稿')}</button>
      {created && <div className="mb-review-flow"><button type="button" className={checks.source ? 'done' : ''} onClick={() => run(async () => { await verifyMissionBridgeContentSource(token, created.sourceId); setChecks((old) => ({ ...old, source: true })) }, '来源已由人工验证')}>{checks.source ? '✓ ' : ''}{t('验证来源与版权')}</button>{reviewTypes.map(([key, label]) => <button type="button" className={checks[key] ? 'done' : ''} key={key} onClick={() => approve(key)}>{checks[key] ? '✓ ' : ''}{t(label)}</button>)}<button type="button" disabled={!ready} onClick={() => run(async () => { await publishMissionBridgeContent(token, created.versionId); await load() }, '内容已发布并可用于可信检索')}>{t('发布已审核版本')}</button></div>}
    </form>}
  </section>
}
