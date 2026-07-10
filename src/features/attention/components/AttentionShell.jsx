import React, { useMemo } from 'react'
import { enabledAttentionRoutes } from '../lib/integration/route-registry'

const GROUP_LABELS = {
  daily: '每日节奏',
  insight: '洞察与成长',
  community: '同行关系',
  settings: '设置',
  admin: '运营',
}

export default function AttentionShell({ section, openPage, flags, isAdmin, children }) {
  const routes = useMemo(() => enabledAttentionRoutes(flags, isAdmin), [flags, isAdmin])
  const grouped = useMemo(() => routes.reduce((result, route) => {
    result[route.group] = [...(result[route.group] || []), route]
    return result
  }, {}), [routes])

  return (
    <div className="attn-shell">
      <aside className="attn-sidebar" aria-label="守心模块导航">
        <button className="attn-brand" type="button" onClick={() => openPage('dashboard')}>
          <strong>守心</strong>
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
        <summary>守心导航 · {routes.find((route) => route.key === section)?.label || '守心首页'}</summary>
        <nav aria-label="守心移动导航">
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
