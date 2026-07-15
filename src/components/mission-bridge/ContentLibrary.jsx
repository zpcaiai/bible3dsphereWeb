import { useEffect, useState } from 'react'
import {
  createMissionBridgeContent, fetchMissionBridgeContentLibrary, publishMissionBridgeContent,
  reviewMissionBridgeContent, searchMissionBridgeContent, verifyMissionBridgeContentSource,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './contentLibrary.css'
import GuidedInput from './GuidedInput'
import { missionOptionLabel } from './optionLabels'

const reviewTypes = [['theological', '神学审核'], ['cultural', '文化审核'], ['safeguarding', '安全审核'], ['accessibility', '可及性审核']]
const initialDraft = { contentType: 'discussion_guide', title: '', language: 'zh-CN', contentClass: 'application', body: '', readingLevel: 'standard', author: '', sourceTitle: '', sourceUrl: '', copyrightHolder: '', license: '', citation: '' }
const QUERY_OPTIONS = ['跨文化关系建立','家庭与信仰同行','福音核心问题','压力与专业转介','小组带领与安全边界']
const TITLE_OPTIONS = ['讨论引导：倾听与共同目标','经文观察与反思材料','专业支持与转介指南','跨文化同行实践清单']
const BODY_OPTIONS = ['本材料用于自愿讨论，不替代专业意见。','请先倾听参与者的真实处境与选择。','涉及医疗、法律或安全风险时，应由合格人员接手。','使用前请核对来源、版权与适用文化语境。']
const LICENSE_OPTIONS = [
  { value: 'authorized_by_copyright_holder', label: '经版权所有者授权使用（Authorized by copyright holder）' },
  { value: 'CC BY 4.0', label: '知识共享署名 4.0（CC BY 4.0）' },
  { value: 'CC BY-NC 4.0', label: '知识共享署名-非商业性使用 4.0（CC BY-NC 4.0）' },
  { value: 'Public Domain', label: '公共领域（Public Domain）' },
]

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
    <div className="mb-content-search"><h3>{t('可信资料检索')}</h3><form onSubmit={(event) => { event.preventDefault(); run(async () => setResult(await searchMissionBridgeContent(token, query)), '检索已完成') }}><GuidedInput options={QUERY_OPTIONS} aria-label={t('检索已审核资料')} required minLength={2} value={query} onChange={setQuery} placeholder={t('输入主题或问题')} /><button>{t('检索')}</button></form>{result && <div className={`mb-rag-result ${result.grounded ? '' : 'unknown'}`}><p>{result.answer}</p>{result.citations?.map((source) => <a key={`${source.contentId}-${source.citation}`} href={source.sourceUrl || undefined} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.author} · {source.sourceTitle} · {source.citation}</span></a>)}</div>}</div>
    <div className="mb-content-library"><h3>{t('已审核资料库')}</h3>{!items.length ? <div className="mb-state">{t('暂时没有已发布资料')}</div> : items.map((item) => <div key={item.id}><strong>{item.title}</strong><span>{item.contentType} · {item.language} · {item.readingLevel}</span></div>)}</div>
    {canManage && <form className="mb-content-editor" onSubmit={submit}><h3>{t('内容发布工作台')}</h3><div className="mb-content-fields"><GuidedInput options={TITLE_OPTIONS} required minLength={3} placeholder={t('内容标题')} value={draft.title} onChange={(title) => setDraft({ ...draft, title })} aria-label={t('内容标题')}/><select value={draft.contentType} onChange={(e) => setDraft({ ...draft, contentType: e.target.value })}>{['discussion_guide','scripture','professional_resource','referral_guide'].map(value=><option key={value} value={value}>{missionOptionLabel(value)}</option>)}</select><select value={draft.contentClass} onChange={(e) => setDraft({ ...draft, contentClass: e.target.value })}>{['application','scripture_text','interpretation','professional_advice'].map(value=><option key={value} value={value}>{missionOptionLabel(value)}</option>)}</select><select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}><option value="zh-CN">简体中文（Simplified Chinese）</option><option value="zh-TW">繁体中文（Traditional Chinese）</option><option value="en">英语（English）</option></select></div><GuidedInput multiline options={BODY_OPTIONS} required minLength={10} placeholder={t('正文')} value={draft.body} onChange={(body) => setDraft({ ...draft, body })} aria-label={t('正文')}/><div className="mb-content-fields"><input required placeholder={t('作者')} value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} aria-label={t('作者')}/><input required placeholder={t('来源标题')} value={draft.sourceTitle} onChange={(e) => setDraft({ ...draft, sourceTitle: e.target.value })} aria-label={t('来源标题')}/><input placeholder={t('来源链接')} value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} aria-label={t('来源链接')}/><input required placeholder={t('版权所有者')} value={draft.copyrightHolder} onChange={(e) => setDraft({ ...draft, copyrightHolder: e.target.value })} aria-label={t('版权所有者')}/><GuidedInput options={LICENSE_OPTIONS} required placeholder={t('许可证')} value={draft.license} onChange={(license) => setDraft({ ...draft, license })} aria-label={t('许可证')}/><input required placeholder={t('引用格式')} value={draft.citation} onChange={(e) => setDraft({ ...draft, citation: e.target.value })} aria-label={t('引用格式')}/></div><button>{t('建立内容草稿')}</button>
      {created && <div className="mb-review-flow"><button type="button" className={checks.source ? 'done' : ''} onClick={() => run(async () => { await verifyMissionBridgeContentSource(token, created.sourceId); setChecks((old) => ({ ...old, source: true })) }, '来源已由人工验证')}>{checks.source ? '✓ ' : ''}{t('验证来源与版权')}</button>{reviewTypes.map(([key, label]) => <button type="button" className={checks[key] ? 'done' : ''} key={key} onClick={() => approve(key)}>{checks[key] ? '✓ ' : ''}{t(label)}</button>)}<button type="button" disabled={!ready} onClick={() => run(async () => { await publishMissionBridgeContent(token, created.versionId); await load() }, '内容已发布并可用于可信检索')}>{t('发布已审核版本')}</button></div>}
    </form>}
  </section>
}
