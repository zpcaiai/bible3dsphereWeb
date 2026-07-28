import { calculateFruitProgress } from '../lib/fruitProgressEngine'
import { T, fruitName } from '../lib/localize'
import { GrowthTree } from '../../../components/charts'

const labelCopy = {
  newly_practiced: 'newly practiced',
  growing: 'growing',
  needs_attention: 'needs attention',
  ask_for_grace: 'ask for grace',
}

// 为什么把横条进度换成一棵树：
// 横条天然读作「完成度 / 排名」，而果子的语言是「生长」——不是做完了百分之几，
// 而是有没有长出来、长到哪一步。树把「空枝」诚实地画成还没发芽而不是失败的低分，
// 也让九种果子彼此不再被排成一张成绩榜。
export default function FruitTree({ dailyExamens, thoughtEntries, graceRecoveryEntries }) {
  const progress = calculateFruitProgress({ dailyExamens, thoughtEntries, graceRecoveryEntries })
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>Holy Spirit Fruit Tree</h2><p>These are not achievements to boast in. Fruit is the Spirit's work, not a scorecard for proving yourself.</p></div>
      <GrowthTree
        title={T('圣灵果子树', 'Holy Spirit Fruit Tree')}
        subtitle={T('叶＝正在操练，果＝已经结出；空着的枝不是失败，只是还没到时候。', 'Leaves mean practice underway, fruit means it has formed; a bare branch is not failure, only not yet.')}
        fruits={progress.map((item) => ({ fruit: item.fruit, label: fruitName(item.fruit), count: item.count }))}
      />
      <div className="sf-fruit-grid">
        {progress.map((item) => (
          <article className="sf-card sf-fruit-card" key={item.fruit}>
            <div className="sf-fruit-title"><h3>{item.fruit.replaceAll('_', ' ')}</h3><span>{labelCopy[item.label] ?? item.label}</span></div>
            <p className="sf-muted">{item.count} {T('次操练被记录下来', 'practices recorded')}</p>
            <p>{item.encouragement}</p>
            {item.relatedObedienceActions.length > 0 && <ul>{item.relatedObedienceActions.map((action) => <li key={action}>{action}</li>)}</ul>}
          </article>
        ))}
      </div>
    </section>
  )
}
