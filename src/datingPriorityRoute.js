export const DATING_PRIORITY_PATH = '/amor-survey'
export const DATING_PRIORITY_STATS_PATH = '/amor-survey-sum'

function normalizePath(pathname = '') {
  return String(pathname).replace(/\/+$/, '') || '/'
}

export function isDatingPriorityPath(pathname = '') {
  return normalizePath(pathname) === DATING_PRIORITY_PATH
}

export function isDatingPriorityStatsPath(pathname = '') {
  return normalizePath(pathname) === DATING_PRIORITY_STATS_PATH
}

/**
 * 独立问卷页是否应隐藏全局外壳（底部导航 + 守护精灵）。
 *
 * 必须同时满足「路径是问卷页」和「当前确实停在问卷面板上」——
 * 面板切换只 replaceState 清 query、不改 pathname，所以从这个链接进来的人
 * 切到别的页面后 pathname 仍是 /amor-survey。若只看路径，导航栏会就此永久消失。
 */
export function shouldHideGlobalChrome({ pathname = '', activePanel = '' } = {}) {
  return (isDatingPriorityPath(pathname) && activePanel === 'dating-priority')
    || (isDatingPriorityStatsPath(pathname) && activePanel === 'dating-priority-stats')
}
