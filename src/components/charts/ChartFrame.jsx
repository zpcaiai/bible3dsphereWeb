// ChartFrame.jsx — 所有图表的共享外壳。
//
// 承担三件「每张图都必须有、但很容易漏」的事：
//   1. 图例：≥2 个系列时必须存在，身份不能只靠颜色；
//   2. 表格视图：任何图都能一键切成数据表，屏幕阅读器与色觉障碍用户的兜底；
//   3. 无障碍：role="img" + aria-label 概述，图形本身对 AT 隐藏。
import { useId, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { INK, FONT } from './chartTheme'

export function ChartLegend({ items }) {
  if (!items || items.length < 2) return null
  return (
    <ul
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
        listStyle: 'none', margin: '8px 0 0', padding: 0,
      }}
    >
      {items.map((it) => (
        <li key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: INK.secondary }}>
          <span
            aria-hidden="true"
            style={{
              width: it.shape === 'line' ? 14 : 10,
              height: it.shape === 'line' ? 2 : 10,
              borderRadius: it.shape === 'line' ? 1 : 3,
              background: it.color, flexShrink: 0,
            }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

export function DataTable({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null
  const cell = { padding: '4px 8px', fontSize: 12, textAlign: 'left', borderBottom: `1px solid ${INK.grid}` }
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: FONT }}>
        <thead>
          <tr>{columns.map((c) => <th key={c} scope="col" style={{ ...cell, color: INK.muted, fontWeight: 600 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} style={{ ...cell, color: j === 0 ? INK.secondary : INK.primary, fontVariantNumeric: j === 0 ? 'normal' : 'tabular-nums' }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * ChartFrame
 * @param {string}   title      图表标题（同时作为 aria 概述的一部分）
 * @param {string}   subtitle   可选副标题 / 说明
 * @param {string}   summary    给屏幕阅读器的一句话数据概述（必填，替代看图）
 * @param {Array}    legend     [{label, color, shape}]，≥2 项时渲染
 * @param {Array}    tableColumns / tableRows  表格视图数据
 * @param {ReactNode} children  <svg> 图形本体
 */
export function ChartFrame({
  title, subtitle, summary, legend, tableColumns, tableRows,
  children, actions, dense = false,
}) {
  const [showTable, setShowTable] = useState(false)
  const id = useId()
  const hasTable = !!(tableColumns?.length && tableRows?.length)

  return (
    <figure
      style={{
        margin: 0,
        padding: dense ? '10px 12px' : '14px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${INK.border}`,
        borderRadius: 14,
        fontFamily: FONT,
      }}
    >
      {(title || actions) && (
        <figcaption style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: dense ? 6 : 10 }}>
          <div>
            {title && <div style={{ fontSize: 14, fontWeight: 700, color: INK.primary }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: INK.muted, marginTop: 2, lineHeight: 1.5 }}>{subtitle}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {actions}
            {hasTable && (
              <button
                type="button"
                onClick={() => setShowTable((s) => !s)}
                aria-expanded={showTable}
                aria-controls={`${id}-table`}
                style={{
                  background: 'none', border: `1px solid ${INK.border}`, borderRadius: 8,
                  color: INK.muted, fontSize: 11, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {showTable ? i18nT('看图') : i18nT('看数据')}
              </button>
            )}
          </div>
        </figcaption>
      )}

      {!showTable && (
        <div role="img" aria-label={summary || title || i18nT('图表')}>
          {children}
        </div>
      )}

      {showTable && <div id={`${id}-table`}><DataTable columns={tableColumns} rows={tableRows} /></div>}

      {!showTable && <ChartLegend items={legend} />}
    </figure>
  )
}

/** 轻量 HTML 浮层提示，跟随鼠标/触点。 */
export function ChartTooltip({ x, y, children, visible }) {
  if (!visible) return null
  return (
    <div
      role="status"
      style={{
        position: 'absolute', left: x, top: y, transform: 'translate(-50%, -115%)',
        pointerEvents: 'none', zIndex: 5,
        background: 'rgba(10,11,18,0.95)', border: `1px solid ${INK.border}`,
        borderRadius: 8, padding: '6px 9px', fontSize: 12, color: INK.primary,
        whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,0.45)', fontFamily: FONT,
      }}
    >
      {children}
    </div>
  )
}

export default ChartFrame
