import { t as i18nT } from './i18n/runtime'
import BackButton from './BackButton'
import { withExpansionChips, handleExpansionTarget } from './expansion/planetEntries'
import PastoralPathCard, { PASTORAL_ROUTE_TARGETS } from './components/PastoralPathCard'
import { a11yClickProps } from './lib/a11yClick';
/**
 * PlanetHome — 属灵星球 · 成长地图（IA v1，增量、不删现有功能）
 * 把愿景的五大陆作为「人格塑造路径」的导航，路由到已有功能。
 * 作为今日心镜 overlay 渲染，故可直接用 go() 跳到其它 overlay。
 */
const CONTINENTS = [
  {
    icon: '⛪', name: '健康教会九标志', en: 'Church Health · 9Marks', color: '#8b5cf6',
    q: '我是否越来越委身、被门训、在肢体中成长？',
    by: '9Marks · 归回本地教会的成长生态',
    chips: [['九标志概览', 'nine-marks'], ['圣礼年历', 'sacrament-calendar'], ['本地教会', 'church-life'], ['门训路径', 'disciple-path'], ['教会福音诊断', 'gospel']],
  },
  {
    icon: '🧭', name: '认识自己', en: 'Self Discovery', color: '#da77f2',
    q: '我为什么软弱、焦虑、重复跌倒？',
    by: '钟马田 · 看见真实的自己',
    chips: [['爱之秩序', 'ordo-amoris'], ['偶像监测', 'idolatry'], ['低潮体检', 'checkup'], ['今日省察', 'examen']],
  },
  {
    icon: '✝️', name: '回到福音', en: 'Gospel Center', color: '#ffd43b',
    q: '我的伤口，福音如何回应？',
    by: '从情绪挖到不信，再挖回基督',
    chips: [['福音诊断室', 'gospel'], ['信经星系', 'creed-catechism'], ['决策辨识', 'discern'], ['属灵牧者对话', 'agent']],
  },
  {
    icon: '🌅', name: '与神同行', en: 'Walk With God', color: '#34c759',
    q: '今天如何亲近基督？',
    by: '司布真 · 看见荣耀的基督',
    chips: [['灵修操练', 'hub'], ['守心立约', 'attention'], ['规则辨识', 'rule-discernment'], ['养料库', 'fuel']],
    note: '清晨甘露 · 读经计划 · 背经，都在底部「灵修」里',
  },
  {
    icon: '🕯️', name: '等候上帝', en: 'Waiting for God', color: '#5ac8fa',
    q: '我在等什么？神在等待中塑造我什么？',
    by: '从等待戈多，到等候上帝',
    chips: [['等候之路', 'waiting'], ['十架哀歌', 'cross-lament-hope']],
  },
  {
    icon: '🗺️', name: '天路客', en: 'Pilgrim Journey', color: '#51cf66',
    q: '此刻，我走在天路历程的哪一处？',
    by: '本仁《天路历程》· 据你的状态定位',
    chips: [['进入天路历程', 'pilgrim'], ['天路历程游戏', 'pilgrim-game']],
  },
  {
    icon: '✦', name: '人格塑造', en: 'Formation', color: '#a78bfa',
    q: '我今天，更像耶稣了吗？',
    by: '信 · 望 · 爱 · 谦卑 · 顺服',
    chips: [['圣洁生活引擎', 'holy-life'], ['罪模式转化引擎', 'spiritual-formation'], ['信望爱星系', 'fhl'], ['本周牧养小结', '_close']],
  },
]

export default function PlanetHome({ user, onClose, go, openExpansion }) {
  const act = (target) => {
    if (target === '_close') return onClose()
    if (handleExpansionTarget(target, openExpansion)) return
    go(target)
  }
  const openPastoralRoute = (route) => {
    const target = PASTORAL_ROUTE_TARGETS.planet[route]
    if (target) act(target)
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 12%, rgba(139,92,246,0.18), #05060c 60%)', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,6,12,0.7)', backdropFilter: 'blur(10px)' }}>
        <BackButton onClick={onClose} />
        <div><div style={{ fontSize: 17, fontWeight: 600 }}>{i18nT('属灵星球')}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{i18nT('你不是在课程里学习，而是在一颗星球上成长')}</div></div>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 16px 16px' }}>
        <div style={{ fontSize: 46 }}>🪐</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 420, margin: '6px auto 0' }}>
          {i18nT('状态 → 识别 → 引导 → 行动 → 复盘 → 人格形成。')}<br />{i18nT('一条把你塑造得越来越像基督的成长路径。')}
        </div>
      </div>

      <div style={{ padding: '0 16px 110px', maxWidth: 640, margin: '0 auto' }}>
        <button type="button" onClick={() => act('spiritual-planet')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer',
          margin: '0 0 12px', padding: '17px', borderRadius: 18, color: '#fff',
          background: 'radial-gradient(circle at 14% 20%, rgba(232,184,107,0.2), transparent 35%), linear-gradient(135deg, rgba(93,76,166,0.32), rgba(31,70,103,0.22))',
          border: '1px solid rgba(232,184,107,0.35)',
        }}>
          <span style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 25, background: 'radial-gradient(circle at 35% 30%, #a58cf2, #29254f 70%)', boxShadow: '0 0 24px rgba(232,184,107,0.22)' }} aria-hidden="true">🪐</span>
          <span style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: 15 }}>{i18nT('属灵星球 · 统一门户')}</strong>
            <small style={{ display: 'block', marginTop: 4, color: 'rgba(255,255,255,0.56)', fontSize: 10.5, lineHeight: 1.5 }}>{i18nT('一个镜像 · 一个问题 · 一个可选行动 · 跨模块来源透明')}</small>
          </span>
          <span style={{ color: '#efd59d', fontSize: 20 }} aria-hidden="true">›</span>
        </button>
        <button type="button" onClick={() => act('formation-twin')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer',
          margin: '0 0 14px', padding: '16px', borderRadius: 18, color: '#fff',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.23), rgba(90,200,250,0.13))',
          border: '1px solid rgba(167,139,250,0.34)',
        }}>
          <span style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 25, background: 'radial-gradient(circle at 35% 30%, #786eea, #252a58 70%)', boxShadow: '0 0 24px rgba(139,92,246,0.35)' }} aria-hidden="true">✦</span>
          <span style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: 15 }}>{i18nT('情感—属灵形成孪生')}</strong>
            <small style={{ display: 'block', marginTop: 4, color: 'rgba(255,255,255,0.52)', fontSize: 10.5, lineHeight: 1.5 }}>{i18nT('生命状态中枢 · 连接现有记录、操练、回顾与安全关系')}</small>
          </span>
          <span style={{ color: '#c6c9ff', fontSize: 20 }} aria-hidden="true">›</span>
        </button>
        <PastoralPathCard user={user} compact onOpen={openPastoralRoute} />
        {withExpansionChips(CONTINENTS).map((c, i) => (
          <div key={i} onClick={() => act(c.chips[0][1])} style={{ cursor: 'pointer', marginBottom: 14, borderRadius: 18, padding: 18, background: `linear-gradient(135deg, ${c.color}22, rgba(255,255,255,0.02))`, border: `1px solid ${c.color}44` }} {...a11yClickProps(() => act(c.chips[0][1]))}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 30 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{i18nT(c.name)}</div>
                <div style={{ fontSize: 10.5, color: c.color, letterSpacing: 1 }}>{c.en} · {i18nT(c.by)}</div>
              </div>
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12 }}>「{i18nT(c.q)}」</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {c.chips.map(([label, target], j) => (
                <button key={j} onClick={(e) => { e.stopPropagation(); act(target) }} style={{ padding: '7px 14px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: `${c.color}28`, color: c.color }}>{i18nT(label)} ›</button>
              ))}
            </div>
            {c.note && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>{i18nT(c.note)}</div>}
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.7, marginTop: 4 }}>
          {i18nT('内容只是燃料，养料库随你的状态被自动调用。')}<br />{i18nT('愿你在这颗星球上，越来越有信、有望、有爱，越来越像祂。')}
        </div>
      </div>
    </div>
  )
}
