import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  deleteAiFormationRecord,
  deleteAllAiFormationRecords,
  exportAiFormationData,
  fetchAiFormationRecords,
  fetchAiFormationSchemas,
  fetchApprovedAiFormationContent,
  saveAiFormationSchemaRecord,
  transitionAiFormationRecord,
} from './api'
import ScenarioRuntime from './ScenarioRuntime'

const SERVER_FIELDS = new Set([
  'tenantId', 'learnerId', 'ownerUserId', 'subjectRef', 'requestedByRef',
  'createdAt', 'updatedAt', 'startedAt', 'generatedAt', 'requestedAt', 'checkedAt',
])

function defaultValue(spec, required = false, serverManagedFields = SERVER_FIELDS) {
  if (Object.hasOwn(spec, 'const')) return structuredClone(spec.const)
  if (Object.hasOwn(spec, 'default')) return structuredClone(spec.default)
  if (spec.type === 'object') {
    const value = {}
    Object.entries(spec.properties || {}).forEach(([key, child]) => {
      if (serverManagedFields.has(key)) return
      const next = defaultValue(child, (spec.required || []).includes(key), serverManagedFields)
      if (next !== undefined) value[key] = next
    })
    return Object.keys(value).length || required ? value : undefined
  }
  if (spec.type === 'array') return required ? [] : undefined
  if (spec.type === 'boolean') return required ? false : undefined
  return undefined
}

function cleanValue(value) {
  if (Array.isArray(value)) return value.map(cleanValue).filter((item) => item !== undefined)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, child]) => [key, cleanValue(child)])
      .filter(([, child]) => child !== undefined && child !== '')
    return Object.fromEntries(entries)
  }
  return value === '' ? undefined : value
}

function getAtPath(value, path) {
  return path.reduce((current, key) => current?.[key], value)
}

function setAtPath(value, path, next) {
  const copy = structuredClone(value || {})
  let cursor = copy
  path.forEach((key, index) => {
    if (index === path.length - 1) cursor[key] = next
    else {
      cursor[key] = cursor[key] && typeof cursor[key] === 'object' ? cursor[key] : {}
      cursor = cursor[key]
    }
  })
  return copy
}

function Field({ name, spec, required, path, values, onChange, serverManagedFields }) {
  if (serverManagedFields.has(name) || ['version', 'safetyLevel'].includes(name) && Object.hasOwn(spec, 'const')) {
    return null
  }
  const value = getAtPath(values, path)
  const label = `${name}${required ? ' *' : ''}`
  const change = (next) => onChange(setAtPath(values, path, next))
  if (Object.hasOwn(spec, 'const')) {
    return <div className="aif-schema-constant"><span>{name}</span><code>{String(spec.const)}</code></div>
  }
  if (spec.type === 'object' || spec.properties) {
    return (
      <fieldset className="aif-schema-group">
        <legend>{label}</legend>
        {Object.entries(spec.properties || {}).map(([childName, child]) => (
          <Field
            key={childName}
            name={childName}
            spec={child}
            required={(spec.required || []).includes(childName)}
            path={[...path, childName]}
            values={values}
            onChange={onChange}
            serverManagedFields={serverManagedFields}
          />
        ))}
      </fieldset>
    )
  }
  if (spec.type === 'boolean') {
    return <label className="aif-schema-check"><input type="checkbox" checked={value === true} onChange={(event) => change(event.target.checked)} />{label}</label>
  }
  if (spec.type === 'array' && spec.items?.enum) {
    const selected = Array.isArray(value) ? value : []
    return (
      <fieldset className="aif-schema-group">
        <legend>{label}</legend>
        <div className="aif-schema-options">{spec.items.enum.map((option) => <label key={String(option)}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => change(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} />{String(option)}</label>)}</div>
      </fieldset>
    )
  }
  if (spec.type === 'array') {
    return (
      <label className="aif-schema-field">{label}<span>{i18nT('每行一项；不填写秘密、认罪、露骨内容或第三方身份。')}</span><textarea value={Array.isArray(value) ? value.join('\n') : ''} onChange={(event) => change(event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} rows="3" /></label>
    )
  }
  if (spec.enum) {
    return <label className="aif-schema-field">{label}<select value={value ?? ''} onChange={(event) => change(event.target.value)} required={required}><option value="">{i18nT('请选择')}</option>{spec.enum.map((option) => <option value={String(option)} key={String(option)}>{String(option)}</option>)}</select></label>
  }
  const numeric = ['integer', 'number'].includes(spec.type)
  const multiline = !numeric && ((spec.maxLength || 0) > 200 || /note|explanation|reflection|observation/i.test(name))
  const common = {
    value: value ?? '',
    required,
    onChange: (event) => change(numeric && event.target.value !== '' ? Number(event.target.value) : event.target.value),
  }
  return (
    <label className="aif-schema-field">{label}{spec.description && <span>{spec.description}</span>}
      {multiline ? <textarea {...common} rows="3" maxLength={spec.maxLength} /> : <input {...common} type={numeric ? 'number' : spec.format === 'date' ? 'date' : 'text'} min={spec.minimum} max={spec.maximum} maxLength={spec.maxLength} pattern={spec.pattern} />}
    </label>
  )
}

function nextActions(status) {
  return {
    draft: [['activate', '启用'], ['archive', '归档']],
    active: [['pause', '暂停'], ['complete', '完成'], ['archive', '归档']],
    paused: [['resume', '恢复'], ['complete', '完成'], ['archive', '归档']],
    completed: [['archive', '归档']],
  }[status] || []
}

export default function BatchWorkspace({ batchId }) {
  const [schemas, setSchemas] = useState([])
  const [records, setRecords] = useState([])
  const [content, setContent] = useState([])
  const [contextRequired, setContextRequired] = useState(false)
  const [selectedKey, setSelectedKey] = useState('')
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(true)
  const selected = useMemo(() => schemas.find((item) => item.key === selectedKey), [schemas, selectedKey])
  const selectedServerFields = useMemo(() => new Set(selected?.serverManagedFields || SERVER_FIELDS), [selected])
  const load = useCallback(async () => {
    setBusy(true); setMessage('')
    try {
      const [schemaData, recordData, contentData] = await Promise.all([
        fetchAiFormationSchemas(batchId), fetchAiFormationRecords(batchId), fetchApprovedAiFormationContent(batchId),
      ])
      setSchemas(schemaData.schemas || [])
      setRecords(recordData.records || [])
      setContent(contentData.content || [])
      setContextRequired(Boolean(contentData.contextRequired))
      const first = schemaData.schemas?.[0]
      setSelectedKey((current) => schemaData.schemas?.some((item) => item.key === current) ? current : first?.key || '')
      if (first) setValues(defaultValue(first.schema, true, new Set(first.serverManagedFields || SERVER_FIELDS)) || {})
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }, [batchId])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (selected) setValues(defaultValue(selected.schema, true, selectedServerFields) || {})
  }, [selected, selectedServerFields])
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    try {
      await saveAiFormationSchemaRecord(selected.key, cleanValue(values))
      setMessage(i18nT('已保存；服务器已执行身份绑定、Schema、安全与隐私校验。'))
      await load()
    } catch (error) { setMessage(error.detail?.path ? `${error.message} (${error.detail.path})` : error.message) }
  }
  const transition = async (record, action) => {
    try { await transitionAiFormationRecord(record.id, action, record.revision); await load() } catch (error) { setMessage(error.message) }
  }
  const remove = async (record) => {
    try { await deleteAiFormationRecord(record.id); await load() } catch (error) { setMessage(error.message) }
  }
  const exportData = async () => {
    try {
      const data = await exportAiFormationData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = 'ai-formation-export.json'; link.click(); URL.revokeObjectURL(url)
      setMessage(i18nT('已导出本人数据；不包含其他人的资料。'))
    } catch (error) { setMessage(error.message) }
  }
  const deleteAll = async () => {
    if (!window.confirm(i18nT('确认删除本模块全部学习记录？审核审计元数据仍按合规要求保留。'))) return
    try { const result = await deleteAllAiFormationRecords(); setMessage(`${i18nT('已删除记录')}：${result.deletedRecords}`); await load() } catch (error) { setMessage(error.message) }
  }
  if (busy) return <section className="aif-card" role="status">{i18nT('正在读取 Batch 工作流…')}</section>
  return (
    <div className="aif-workspace">
      {batchId === '10' && <ScenarioRuntime />}
      <section className="aif-card">
        <span className="aif-eyebrow">SCHEMA-DRIVEN WORKFLOW · {schemas.length} CONTRACTS</span>
        <h3>{i18nT('创建经过服务器校验的记录')}</h3>
        <label className="aif-schema-field">{i18nT('工作流契约')}<select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>{schemas.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}</select></label>
        {selected && <form className="aif-schema-form" onSubmit={submit} noValidate>{Object.entries(selected.schema.properties || {}).map(([name, spec]) => <Field key={name} name={name} spec={spec} required={(selected.schema.required || []).includes(name)} path={[name]} values={values} onChange={setValues} serverManagedFields={selectedServerFields} />)}<button className="aif-primary" type="submit">{i18nT('校验并保存')}</button></form>}
      </section>
      <section className="aif-card">
        <h3>{i18nT('我的记录')}</h3>
        {!records.length && <p>{i18nT('本 Batch 尚无记录。')}</p>}
        <div className="aif-record-list">{records.map((record) => <article key={record.id}><div><strong>{record.schema_name || record.record_type}</strong><span>{record.status} · rev {record.revision}</span></div><div>{nextActions(record.status).map(([action, label]) => <button type="button" key={action} onClick={() => transition(record, action)}>{i18nT(label)}</button>)}<button type="button" onClick={() => remove(record)}>{i18nT('删除')}</button></div></article>)}</div>
        <div className="aif-data-actions"><button type="button" onClick={exportData}>{i18nT('导出本人数据')}</button><button type="button" onClick={deleteAll}>{i18nT('删除全部记录')}</button></div>
      </section>
      <section className="aif-card">
        <h3>{i18nT('已审核并发布的学习内容')}</h3>
        {contextRequired ? <p>{i18nT('请先在“选择路径”保存最小年龄与同意上下文。')}</p> : content.length ? <ul>{content.map((item) => <li key={`${item.id}-${item.version}`}>{item.content_kind} · v{item.version}</li>)}</ul> : <p>{i18nT('当前没有与年龄带匹配且完成全部人工审核的已发布内容。')}</p>}
      </section>
      {message && <p className="aif-form-message" role="status">{message}</p>}
    </div>
  )
}
