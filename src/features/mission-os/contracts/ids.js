const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

export function missionId(value, label = 'id') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a non-empty public Mission OS identifier`)
  }
  return value
}

export const tenantId = (value) => missionId(value, 'tenantId')
export const userId = (value) => missionId(value, 'userId')
export const organizationId = (value) => missionId(value, 'organizationId')
export const fieldId = (value) => missionId(value, 'fieldId')
export const peopleGroupId = (value) => missionId(value, 'peopleGroupId')
export const assessmentId = (value) => missionId(value, 'assessmentId')
export const sendingJourneyId = (value) => missionId(value, 'sendingJourneyId')
export const deploymentId = (value) => missionId(value, 'deploymentId')
export const incidentId = (value) => missionId(value, 'incidentId')
