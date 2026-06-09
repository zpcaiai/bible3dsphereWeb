import { t } from './i18n/runtime'
import BackButton from './BackButton'

/**
 * PlanetHome — 属灵星球 · 成长地图（IA v1，增量、不删现有功能）
 * 把愿景的五大陆作为「人格塑造路径」的导航，路由到已有功能。
 * 作为今日心镜 overlay 渲染，故可直接用 go() 跳到其它 overlay。
 */
const CONTINENTS = [
  {
    icon: '🧭',
    name: t('认识自己'),
    en: 'Self Discovery',
    color: '#da77f2',
    q: t('我为什么软弱、焦虑、重复跌倒？'),
    by: t('钟马田 · 看见真实的自己'),
    chips: [[t('偶像监测'), 'idolatry'], [t('低潮体检'), 'checkup'], [t('今日省察'), 'examen']],
  },
  {
    icon: '✝️',
    name: t('回到福音'),
    en: 'Gospel Center',
    color: '#ffd43b',
    q: t('我的伤口，福音如何回应？'),
    by: t('从情绪挖到不信，再挖回基督'),
    chips: [[t('福音诊断室'), 'gospel'], [t('决策辨识'), 'discern'], [t('属灵牧者对话'), 'agent']],
  },
  {
    icon: '🌅',
    name: t('与神同行'),
    en: 'Walk With God',
    color: '#34c759',
    q: t('今天如何亲近基督？'),
    by: t('司布真 · 看见荣耀的基督'),
    chips: [[t('灵修操练'), 'hub'], [t('养料库'), 'fuel']],
    note: t('清晨甘露 · 读经计划 · 背经，都在底部「灵修」里'),
  },
  {
    icon: '🕯️',
    name: t('等候上帝'),
    en: 'Waiting for God',
    color: '#5ac8fa',
    q: t('我在等什么？神在等待中塑造我什么？'),
    by: t('从等待戈多，到等候上帝'),
    chips: [[t('等候之路'), 'waiting']],
  },
  {
    icon: '🗺️',
    name: t('天路客'),
    en: 'Pilgrim Journey',
    color: '#51cf66',
    q: t('此刻，我走在天路历程的哪一处？'),
    by: t('本仁《天路历程》· 据你的状态定位'),
    chips: [[t('进入天路历程'), 'pilgrim']],
  },
  {
    icon: '✦',
    name: t('人格塑造'),
    en: 'Formation',
    color: '#a78bfa',
    q: t('我今天，更像耶稣了吗？'),
    by: t('信 · 望 · 爱 · 谦卑 · 顺服'),
    chips: [[t('信望爱星系'), 'fhl'], [t('本周牧养小结'), '_close'], [t('八维概览'), '_close']],
  },
]

export default function PlanetHome({ onClose, go }) {
  const act = (target) => {
    if (target === '_close') onClose()
    else go(target)
  }

  return (
    <main className="planet-home" aria-labelledby="planet-home-title">
      <header className="planet-home-topbar">
        <BackButton onClick={onClose} />
        <div className="planet-title-group">
          <h1 id="planet-home-title">{t('属灵星球')}</h1>
          <p>{t('你不是在课程里学习，而是在一颗星球上成长')}</p>
        </div>
      </header>

      <section className="planet-hero" aria-label={t('属灵成长路径')}>
        <div className="planet-mark" aria-hidden="true">🪐</div>
        <p>
          {t('状态 → 识别 → 引导 → 行动 → 复盘 → 人格形成。')}
          <br />
          {t('一条把你塑造得越来越像基督的成长路径。')}
        </p>
      </section>

      <section className="planet-card-list" aria-label={t('成长入口')}>
        {CONTINENTS.map((continent) => (
          <article
            key={continent.en}
            className="planet-card"
            style={{ '--planet-color': continent.color }}
          >
            <button
              type="button"
              className="planet-card-main"
              onClick={() => act(continent.chips[0][1])}
              aria-label={`${continent.name} - ${continent.q}`}
            >
              <span className="planet-card-icon" aria-hidden="true">{continent.icon}</span>
              <span className="planet-card-copy">
                <span className="planet-card-title">{continent.name}</span>
                <span className="planet-card-meta">{continent.en} · {continent.by}</span>
                <span className="planet-card-question">「{continent.q}」</span>
              </span>
            </button>

            <div className="planet-chip-row" aria-label={`${continent.name} ${t('功能入口')}`}>
              {continent.chips.map(([label, target]) => (
                <button
                  key={`${continent.en}-${target}-${label}`}
                  type="button"
                  className="planet-chip"
                  onClick={() => act(target)}
                >
                  {label} ›
                </button>
              ))}
            </div>

            {continent.note && <p className="planet-card-note">{continent.note}</p>}
          </article>
        ))}
      </section>

      <footer className="planet-footer">
        {t('内容只是燃料，养料库随你的状态被自动调用。')}
        <br />
        {t('愿你在这颗星球上，越来越有信、有望、有爱，越来越像祂。')}
      </footer>
    </main>
  )
}
