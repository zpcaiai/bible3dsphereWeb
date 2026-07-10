import React, { useMemo } from 'react'
import { enabledAttentionRoutes } from '../lib/integration/route-registry'
import { t as i18nT } from '../../../i18n/runtime'

const GROUP_LABELS = {
  daily: i18nT('每日节奏'),
  insight: i18nT('洞察与成长'),
  community: i18nT('同行关系'),
  settings: i18nT('设置'),
  admin: i18nT('运营'),
}

export default function AttentionShell({ section, openPage, flags, isAdmin, children }) {
  const routes = useMemo(() => enabledAttentionRoutes(flags, isAdmin), [flags, isAdmin])
  const grouped = useMemo(() => routes.reduce((result, route) => {
    result[route.group] = [...(result[route.group] || []), route]
    return result
  }, {}), [routes])

  return (
    <div className="attn-shell">
      <aside className="attn-sidebar" aria-label={i18nT("守心模块导航")}>
        <button className="attn-brand" type="button" onClick={() => openPage('dashboard')}>
          <strong>{i18nT("守心")}</strong>
          <span>Attention Stewardship</span>
        </button>
        {Object.entries(grouped).map(([group, items]) => (
          <section className="attn-nav-group" key={group}>
            <h2>{GROUP_LABELS[group] || group}</h2>
            <div>
              {items.map((route) => (
                <button
                  type="button"
                  key={route.key}
                  className={section === route.key ? 'active' : ''}
                  aria-current={section === route.key ? 'page' : undefined}
                  onClick={() => openPage(route.key)}
                >
                  {route.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </aside>

      <details className="attn-mobile-nav">
        <summary><span>{routes.find((route) => route.key === section)?.label || i18nT('守心首页')}</span></summary>
        <nav aria-label={i18nT("守心移动导航")}>
          {routes.map((route) => (
            <button
              type="button"
              key={route.key}
              className={section === route.key ? 'active' : ''}
              aria-current={section === route.key ? 'page' : undefined}
              onClick={(event) => {
                openPage(route.key)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              {route.label}
            </button>
          ))}
        </nav>
      </details>

      <div className="attn-shell-content">{children}</div>
    </div>
  )
}
