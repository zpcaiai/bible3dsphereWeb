function asUnitScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null
}

/**
 * Resolve the latest real MVFE formation metric for the 今日心境 summary.
 * Preview/mock dashboard data must never be presented as the user's own score.
 */
export function resolveFormationMetric(lastResult, dashboard) {
  const lastFormation = lastResult?.formation
  const lastScore = asUnitScore(lastFormation?.formation_score)

  if (lastScore != null) {
    return {
      score: lastScore,
      driftScore: asUnitScore(lastFormation?.drift_score) ?? 0,
      source: 'last-result',
    }
  }

  const curve = Array.isArray(dashboard?.formation_curve) ? dashboard.formation_curve : []
  const latestCurvePoint = curve[curve.length - 1]
  const curveScore = asUnitScore(latestCurvePoint?.formation_score)
  const hasRealDashboardData = dashboard?.is_mock !== true
    && Number(dashboard?.data_points) > 0

  if (hasRealDashboardData && curveScore != null) {
    return {
      score: curveScore,
      driftScore: asUnitScore(latestCurvePoint?.drift_score) ?? 0,
      source: 'dashboard',
    }
  }

  return { score: null, driftScore: null, source: 'none' }
}
