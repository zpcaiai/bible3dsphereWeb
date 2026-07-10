const matrix = [
  ['owner', 'covenant', 'can'],
  ['ordinary-user', 'other-user-covenant', 'cannot'],
  ['active-partner', 'partner-share', 'can'],
  ['ended-partner', 'partner-share', 'cannot'],
  ['group-member', 'group-challenge', 'can'],
  ['non-member', 'group-challenge', 'cannot'],
  ['admin', 'admin-overview', 'can'],
  ['ordinary-user', 'admin-overview', 'cannot'],
]

const failures = matrix.filter(([, , verdict]) => !['can', 'cannot'].includes(verdict))
console.log(JSON.stringify({ ok: failures.length === 0, matrix, failures }, null, 2))
if (failures.length) process.exit(1)
