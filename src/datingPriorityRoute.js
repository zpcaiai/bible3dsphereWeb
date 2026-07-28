export const DATING_PRIORITY_PATH = '/desire-survey'

export function isDatingPriorityPath(pathname = '') {
  const normalizedPath = String(pathname).replace(/\/+$/, '') || '/'
  return normalizedPath === DATING_PRIORITY_PATH
}
