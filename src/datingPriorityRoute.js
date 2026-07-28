export const DATING_PRIORITY_PATH = '/amor-survey'

export function isDatingPriorityPath(pathname = '') {
  const normalizedPath = String(pathname).replace(/\/+$/, '') || '/'
  return normalizedPath === DATING_PRIORITY_PATH
}
