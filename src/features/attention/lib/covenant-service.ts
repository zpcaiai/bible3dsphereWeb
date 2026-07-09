export function mapCovenantDbToDto(row: Record<string, any> | null) {
  if (!row) return null
  return {
    id: String(row.id),
    covenantDate: row.covenant_date || row.covenantDate,
    primaryOffering: row.primary_offering || row.primaryOffering,
    missionFocus: row.mission_focus ?? row.missionFocus ?? null,
    worshipFocus: row.worship_focus ?? row.worshipFocus ?? null,
    relationshipFocus: row.relationship_focus ?? row.relationshipFocus ?? null,
    restorationFocus: row.restoration_focus ?? row.restorationFocus ?? null,
    mainRisk: row.main_risk ?? row.mainRisk ?? null,
    riskPulls: Array.isArray(row.risk_pulls) ? row.risk_pulls : (row.riskPulls || []),
    digitalBoundary: row.digital_boundary ?? row.digitalBoundary ?? null,
    timeBoundary: row.time_boundary ?? row.timeBoundary ?? null,
    spiritualBoundary: row.spiritual_boundary ?? row.spiritualBoundary ?? null,
    scriptureReference: row.scripture_reference ?? row.scriptureReference ?? null,
    scriptureText: row.scripture_text ?? row.scriptureText ?? null,
    prayer: row.prayer ?? null,
    status: row.status || 'active',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  }
}

export function mapCovenantInputToDb(input: Record<string, any>) {
  return {
    primary_offering: input.primaryOffering,
    mission_focus: input.missionFocus || null,
    worship_focus: input.worshipFocus || null,
    relationship_focus: input.relationshipFocus || null,
    restoration_focus: input.restorationFocus || null,
    main_risk: input.mainRisk || null,
    risk_pulls: input.riskPulls || [],
    digital_boundary: input.digitalBoundary || null,
    time_boundary: input.timeBoundary || null,
    spiritual_boundary: input.spiritualBoundary || null,
    scripture_reference: input.scriptureReference || null,
    scripture_text: input.scriptureText || null,
    prayer: input.prayer || null,
  }
}
