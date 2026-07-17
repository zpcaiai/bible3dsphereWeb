import { useMemo, useState } from 'react'
import BackButton from '../../BackButton'
import { t as i18nT } from '../../i18n/runtime'
import { buildFormationTwinSnapshot, FORMATION_TWIN_INTEGRATIONS } from './formationTwinModel'
import FormationTwinWorkspace from './FormationTwinWorkspace'
import FormationTwinPatterns from './FormationTwinPatterns'
import FormationTwinReflections from './FormationTwinReflections'
import FormationTwinProtection from './FormationTwinProtection'
import FormationTwinScenarios from './FormationTwinScenarios'
import './formationTwin.css'

const TYPE_CLASS = {
  '用户记录': 'user',
  '可观察事实': 'observed',
  '系统摘要': 'inferred',
}

function localizeFact(fact) {
  switch (fact.key) {
    case 'last-emotion':
      return { ...fact, label: i18nT('最近记录的情绪'), value: i18nT(String(fact.value)), source: i18nT('情绪签到摘要') }
    case 'devotion-today':
      return {
        ...fact,
        label: i18nT('今日灵修记录'),
        value: fact.value === '已记录' ? i18nT('已记录') : i18nT('尚未记录'),
        source: i18nT('灵修记录摘要'),
      }
    case 'pending-prayers':
      return { ...fact, label: i18nT('待代祷事项'), source: i18nT('祷告系统计数') }
    case 'trajectory':
      return { ...fact, label: i18nT('当前趋势摘要'), source: i18nT('今日灵命状态') }
    case 'emotion-count':
      return { ...fact, label: i18nT('近 30 天情绪记录'), source: i18nT('情感轨迹计数') }
    case 'dominant-emotion':
      return { ...fact, label: i18nT('近期常见情绪'), value: i18nT(String(fact.value)), source: i18nT('情感轨迹聚合') }
    default:
      return fact
  }
}

export default function FormationTwinPage({
  user,
  dailySnapshot = null,
  emotionTrajectory = null,
  onBack,
  onOpen,
}) {
  const [workspaceTab, setWorkspaceTab] = useState('checkin')
  const snapshot = useMemo(
    () => buildFormationTwinSnapshot({ dailySnapshot, emotionTrajectory }),
    [dailySnapshot, emotionTrajectory],
  )

  const open = (target) => {
    if (typeof onOpen === 'function') onOpen(target)
  }

  const openWorkspace = (target) => {
    setWorkspaceTab(target)
    requestAnimationFrame(() => document.getElementById('formation-twin-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <main className="ft-page">
      <header className="ft-header">
        <BackButton onClick={onBack} />
        <div className="ft-header-copy">
          <div className="ft-eyebrow">FORMATION TWIN · formation_twin</div>
          <h1>{i18nT('情感—属灵形成孪生')}</h1>
          <p>{i18nT('Emotion & Spiritual Formation Twin')}</p>
        </div>
        <div className={`ft-status ${snapshot.status === 'available' ? 'active' : ''}`}>
          <span aria-hidden="true" />
          {snapshot.status === 'available' ? i18nT('已有摘要') : i18nT('等待数据')}
        </div>
      </header>

      <section className="ft-hero" aria-labelledby="ft-hero-title">
        <div className="ft-orbit" aria-hidden="true">
          <span className="ft-orbit-core">✦</span>
          <span className="ft-orbit-dot dot-one" />
          <span className="ft-orbit-dot dot-two" />
          <span className="ft-orbit-dot dot-three" />
        </div>
        <div className="ft-hero-copy">
          <span className="ft-kicker">{i18nT('你的生命状态中枢')}</span>
          <h2 id="ft-hero-title">{i18nT('看见发生了什么，也保留“不确定”的空间。')}</h2>
          <p>{i18nT('把现有的情绪、灵修、祷告、习惯、注意力、成长与关系入口连接起来，帮助你带着证据回顾，再选择一个真实可行的下一步。')}</p>
          <div className="ft-hero-actions">
            <button type="button" className="ft-primary" onClick={() => openWorkspace('checkin')}>{i18nT('补充一次状态')}</button>
            <button type="button" className="ft-secondary" onClick={() => open('innerlife')}>{i18nT('打开今日心镜')}</button>
          </div>
        </div>
      </section>

      <section className="ft-safety" aria-label={i18nT('安全边界')}>
        <span className="ft-safety-icon" aria-hidden="true">🛟</span>
        <div>
          <strong>{i18nT('安全优先：安全 → 稳定 → 连接 → 理解 → 形成')}</strong>
          <p>{i18nT('如果你此刻不安全，请先使用危机安全入口并联系可信任的真人；形成建议永远排在安全之后。')}</p>
        </div>
        <button type="button" onClick={() => open('sos')}>{i18nT('打开安全帮助')}</button>
      </section>

      <section className="ft-section" aria-labelledby="ft-snapshot-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('CURRENT TWIN')}</span>
            <h2 id="ft-snapshot-title">{i18nT('当前生命镜像')}</h2>
          </div>
          <div className="ft-evidence-count">{snapshot.sourceCount} {i18nT('个摘要来源')}</div>
        </div>

        <div className={`ft-snapshot ${snapshot.status}`}>
          <div className="ft-snapshot-message">
            <span aria-hidden="true">{snapshot.status === 'available' ? '◉' : '○'}</span>
            <p>{snapshot.status === 'available'
              ? i18nT('以下内容来自已加载的现有系统摘要；它们是反思线索，不是属灵裁决。')
              : i18nT('目前还没有足够且经过授权的数据形成生命状态镜像。')}</p>
          </div>
          {snapshot.facts.length > 0 ? (
            <div className="ft-fact-grid">
              {snapshot.facts.map(localizeFact).map((fact) => (
                <article className="ft-fact" key={fact.key}>
                  <span className={`ft-fact-type ${TYPE_CLASS[fact.statementType] || ''}`}>{i18nT(fact.statementType)}</span>
                  <div className="ft-fact-label">{fact.label}</div>
                  <strong>{fact.value}</strong>
                  <small>{i18nT('来源：')}{fact.source}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="ft-empty">
              <div aria-hidden="true">⋯</div>
              <p>{i18nT('孪生系统不会为展示效果虚构情绪、模式或属灵状态。完成一次主动签到后，这里才会出现可核对的摘要。')}</p>
              <button type="button" onClick={() => openWorkspace('checkin')}>{i18nT('从主动签到开始')}</button>
            </div>
          )}
        </div>
      </section>

      <FormationTwinWorkspace
        user={user}
        initialTab={workspaceTab}
        onSafety={() => open('sos')}
      />

      <section className="ft-section" aria-labelledby="ft-patterns-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('LONG-TERM FORMATION')}</span>
            <h2 id="ft-patterns-title">{i18nT('时间演化、长期模式与生命阶段')}</h2>
          </div>
          <p>{i18nT('可确认、可否定、可过期')}</p>
        </div>
        <FormationTwinPatterns user={user} onSafety={() => open('sos')} />
      </section>

      <section className="ft-section" aria-labelledby="ft-reflections-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('REFLECTION & NEXT STEP')}</span>
            <h2 id="ft-reflections-title">{i18nT('每日镜像、周度回顾与最小行动')}</h2>
          </div>
          <p>{i18nT('先看见，再选择；默认一次只做一件小事')}</p>
        </div>
        <FormationTwinReflections user={user} onSafety={() => open('sos')} />
      </section>

      <section className="ft-section" aria-labelledby="ft-protection-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('EARLY PROTECTION & RECOVERY')}</span>
            <h2 id="ft-protection-title">{i18nT('风险条件、最小保护与非羞耻恢复')}</h2>
          </div>
          <p>{i18nT('风险不是命运；保护不是监控')}</p>
        </div>
        <FormationTwinProtection user={user} onSafety={() => open('sos')} />
      </section>

      <section className="ft-section" aria-labelledby="ft-scenarios-section-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('FINITE SCENARIOS')}</span>
            <h2 id="ft-scenarios-section-title">{i18nT('有限情景、证据与不确定性')}</h2>
          </div>
          <p>{i18nT('不是预测 · 不替你决定 · 不自动行动')}</p>
        </div>
        <FormationTwinScenarios user={user} onSafety={() => open('sos')} />
      </section>

      <section className="ft-section" aria-labelledby="ft-integrations-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('CONNECTED SYSTEMS')}</span>
            <h2 id="ft-integrations-title">{i18nT('连接现有能力')}</h2>
          </div>
          <p>{i18nT('不复制数据，不替代原模块')}</p>
        </div>
        <div className="ft-integration-grid">
          {FORMATION_TWIN_INTEGRATIONS.map((group) => (
            <article className="ft-integration-group" key={group.key} style={{ '--ft-accent': group.color }}>
              <header>
                <h3>{i18nT(group.title)}</h3>
                <p>{i18nT(group.description)}</p>
              </header>
              <div>
                {group.items.map((item) => (
                  <button type="button" key={item.target} onClick={() => open(item.target)}>
                    <span className="ft-item-icon" aria-hidden="true">{item.icon}</span>
                    <span>
                      <strong>{i18nT(item.label)}</strong>
                      <small>{i18nT(item.description)}</small>
                    </span>
                    <span className="ft-item-arrow" aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ft-governance" aria-labelledby="ft-governance-title">
        <div className="ft-section-heading">
          <div>
            <span>{i18nT('EVIDENCE & BOUNDARIES')}</span>
            <h2 id="ft-governance-title">{i18nT('证据、纠正与边界')}</h2>
          </div>
        </div>
        <div className="ft-governance-grid">
          <details open>
            <summary>{i18nT('本页现在读取什么')}</summary>
            <p>{i18nT('镜像摘要只读取当前页面已经加载的今日状态与近 30 天情感轨迹；工作台另以加密方式保存你主动提交的正文，完整日记、祷告正文与危机文本不会进入生命事件流。')}</p>
          </details>
          <details>
            <summary>{i18nT('我如何核对或纠正')}</summary>
            <p>{i18nT('每条镜像都标出陈述类型和摘要来源。你可以回到签到或个人记录检索补充与核对，并可导出自己的数据。')}</p>
            <div className="ft-details-actions">
              <button type="button" onClick={() => open('personal-search')}>{i18nT('核对个人记录')}</button>
              <button type="button" onClick={() => open('export-data')}>{i18nT('导出我的数据')}</button>
            </div>
          </details>
          <details>
            <summary>{i18nT('Formation Twin 不做什么')}</summary>
            <ul>
              <li>{i18nT('不判断你是否得救，不判断圣灵是否同在。')}</li>
              <li>{i18nT('不宣称神对你说了什么，不生成单一“属灵分数”。')}</li>
              <li>{i18nT('不替代本地教会、牧者、可信关系、心理咨询或医疗服务。')}</li>
              <li>{i18nT('不模拟一个能代表你行动的人格代理。')}</li>
            </ul>
          </details>
        </div>
        <p className="ft-footer-note">
          {user ? i18nT('这是一面可核对、可修正的镜子，不是关于你灵魂的最终结论。') : i18nT('登录后才会读取你的个人摘要；访客只能查看模块边界与入口。')}
        </p>
      </section>
    </main>
  )
}
