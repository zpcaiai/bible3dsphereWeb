import { generateWeeklyReview } from '../lib/weeklyReviewEngine'
import { sinPatternMap } from '../data/sinPatterns'
import { ColumnSeries } from '../../../components/charts'
import { T, patternNameById } from '../lib/localize'

function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

function endOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  return d.toISOString().slice(0, 10)
}

export default function WeeklyReviewPanel({ userId, weekStartDate = startOfWeek(), weekEndDate = endOfWeek(), dailyExamens = [], thoughtEntries = [], graceRecoveryEntries = [] }) {
  const review = generateWeeklyReview({ userId, weekStartDate, weekEndDate, dailyExamens, thoughtEntries, graceRecoveryEntries })
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>Weekly Spiritual Review</h2><p>{weekStartDate} to {weekEndDate}</p></div>
      <p className="sf-success">This review is not an identity verdict. It is a gentle mirror for returning to Christ and taking one faithful next step.</p>
      <PatternWeekChart patterns={review.mostFrequentSinPatterns} />
      <div className="sf-review-grid">
        <ReviewList title="This week's main patterns" items={review.mostFrequentSinPatterns.map((item) => `${sinPatternMap[item.sinPatternId].name} · ${item.count}`)} />
        <ReviewList title="Common triggers" items={review.topTriggers.map((item) => `${item.trigger.replaceAll('_', ' ')} · ${item.count}`)} />
        <ReviewList title="Recurring lies" items={review.recurringCoreLies} />
        <ReviewList title="Fruits practiced" items={review.fruitsPracticed.map((item) => `${item.fruit.replace('_', ' ')} · ${item.count}`)} />
        <ReviewList title="Obedience actions" items={review.obedienceActionsCompleted} />
        <ReviewList title="Suggested next practices" items={review.recommendedNextPractices.map((practice) => practice.name)} />
      </div>
      <p className="sf-success">{review.pastoralEncouragement}</p>
    </section>
  )
}

// 周回顾里唯一有量的东西是 generateWeeklyReview 数出来的次数（mostFrequentSinPatterns[].count）。
// 用柱状而不是排序条，是因为这是「这一周」这一个离散时段的计数，柱子的高度差就是复发的轻重；
// 也刻意不画折线：一周只有一个点，折线会假装出并不存在的趋势。
function PatternWeekChart({ patterns = [] }) {
  const top = patterns.slice(0, 6)
  if (!top.length) {
    return (
      <article className="sf-card">
        <p className="sf-empty">{T('这一周还没有记录到任何模式，所以没有可画的柱子。这不是好成绩，也不是坏成绩，只是还没有记录。', 'No pattern was recorded this week, so there is nothing to chart. That is neither a good nor a bad score, only an absence of entries.')}</p>
      </article>
    )
  }
  const total = top.reduce((sum, item) => sum + item.count, 0)
  return (
    <article className="sf-card">
      <ColumnSeries
        title={T('本周模式出现次数', 'Pattern counts this week')}
        subtitle={T(
          `本周共记录 ${total} 次，其中「${patternNameById(top[0].sinPatternId)}」最多（${top[0].count} 次）。看见次数是为了带到光中，不是给自己打分。`,
          `${total} entries this week; "${patternNameById(top[0].sinPatternId)}" leads with ${top[0].count}. Counting is for bringing things into the light, not for scoring yourself.`,
        )}
        labels={top.map((item) => patternNameById(item.sinPatternId))}
        values={top.map((item) => item.count)}
        unit={T(' 次', 'x')}
      />
    </article>
  )
}

function ReviewList({ title, items }) {
  return (
    <article className="sf-card">
      <h3>{title}</h3>
      {items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="sf-empty">No entries yet.</p>}
    </article>
  )
}
