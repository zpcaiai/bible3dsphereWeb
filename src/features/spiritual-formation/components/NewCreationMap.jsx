import { sinPatternMap } from '../data/sinPatterns'
import { calculateFruitProgress } from '../lib/fruitProgressEngine'
import { T } from '../lib/localize'
import { TrendLine } from '../../../components/charts'

function afterDays(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function countPatterns(entries) {
  const counts = new Map()
  entries.forEach((entry) => (entry.detectedSinPatterns || []).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1)))
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
}

const onOrAfter = (entries, since) => entries.filter((entry) => String(entry.date || '').slice(0, 10) >= since)

export default function NewCreationMap({ dailyExamens, thoughtEntries, graceRecoveryEntries }) {
  const windows = [
    ['Last 7 days', 7],
    ['Last 30 days', 30],
    ['Last 90 days', 90],
    ['Year view', 365],
  ]

  // 为什么是双轨折线而不是四张各说各话的卡片：
  // 「新造」不是某一个数字变大，而是两条线换位——旧模式被带到光中之后逐渐稀疏，
  // 果子的操练同时变密。两条线同框才看得见这个换位；分成四张卡片时，
  // 读者只能记住最近一个数字，看不见方向。两个系列量纲相同（都是「次」），可以共用一根 Y 轴。
  const tracks = windows.map(([label, days]) => {
    const since = afterDays(days)
    const daily = onOrAfter(dailyExamens, since)
    const thoughts = onOrAfter(thoughtEntries || [], since)
    const recoveries = onOrAfter(graceRecoveryEntries || [], since)
    const fruitCount = calculateFruitProgress({ dailyExamens: daily, thoughtEntries: thoughts, graceRecoveryEntries: recoveries })
      .reduce((sum, item) => sum + item.count, 0)
    const patternCount = daily.reduce((sum, entry) => sum + (entry.detectedSinPatterns || []).length, 0)
    return { label, fruitCount, patternCount }
  })

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>New Creation Progress Map</h2><p>This map is not a record of your worth. Your worth is in Christ. This is a tool for seeing where God may be inviting further transformation.</p></div>
      <TrendLine
        title={T('双轨对照：旧模式与果子', 'Two tracks: old patterns and fruit')}
        subtitle={T('窗口越宽，两边的计数都会更多；要读的是两条线的相对高低——果子的操练有没有比旧模式更密。', 'Wider windows hold more of both. Read the gap between the lines, not the slope: is fruit being practiced more often than old patterns surface?')}
        labels={windows.map(([label]) => label)}
        series={[
          { name: T('果子的操练', 'Fruit practiced'), values: tracks.map((item) => item.fruitCount) },
          { name: T('被带到光中的旧模式', 'Old patterns brought into light'), values: tracks.map((item) => item.patternCount) },
        ]}
        yUnit={T(' 次', ' entries')}
        height={190}
      />
      <div className="sf-map-grid">
        {windows.map(([label, days]) => {
          const since = afterDays(days)
          const daily = dailyExamens.filter((entry) => entry.date.slice(0, 10) >= since)
          const fruits = calculateFruitProgress({ dailyExamens: daily, thoughtEntries, graceRecoveryEntries }).filter((item) => item.count > 0).slice(0, 3)
          const patterns = countPatterns(daily)
          return (
            <article className="sf-card" key={label}>
              <h3>{label}</h3>
              <p className="sf-muted">{daily.length} daily scans · {graceRecoveryEntries.filter((entry) => entry.date.slice(0, 10) >= since).length} recovery entries</p>
              <h4>Old patterns brought into light</h4>
              {patterns.length ? <ul>{patterns.map(([id, count]) => <li key={id}>{sinPatternMap[id].name} · {count}</li>)}</ul> : <p className="sf-empty">No entries yet.</p>}
              <h4>Most practiced fruits</h4>
              {fruits.length ? <div className="sf-chip-row">{fruits.map((fruit) => <span className="sf-chip" key={fruit.fruit}>{fruit.fruit.replace('_', ' ')}</span>)}</div> : <p className="sf-empty">Begin with one daily scan.</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
