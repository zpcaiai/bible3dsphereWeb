export const DATING_PRIORITY_PATH = '/dating-priority'

export function isDatingPriorityPath(pathname = '') {
  const normalizedPath = String(pathname).replace(/\/+$/, '') || '/'
  return normalizedPath === DATING_PRIORITY_PATH
}
