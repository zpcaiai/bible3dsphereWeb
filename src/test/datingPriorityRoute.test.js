import { describe, expect, it } from 'vitest'
import {
  DATING_PRIORITY_PATH,
  isDatingPriorityPath,
  shouldHideGlobalChrome,
} from '../datingPriorityRoute'

describe('dating priority standalone route', () => {
  it('recognizes the canonical path with or without a trailing slash', () => {
    expect(DATING_PRIORITY_PATH).toBe('/amor-survey')
    expect(isDatingPriorityPath('/amor-survey')).toBe(true)
    expect(isDatingPriorityPath('/amor-survey/')).toBe(true)
  })

  it('does not treat the home page or similar paths as the survey', () => {
    expect(isDatingPriorityPath('/')).toBe(false)
    expect(isDatingPriorityPath('/amor-survey-results')).toBe(false)
    expect(isDatingPriorityPath('/desire-survey')).toBe(false)
    expect(isDatingPriorityPath('/dating-priority')).toBe(false)
  })
})

describe('standalone survey hides the global chrome', () => {
  it('隐藏底部导航与守护精灵：路径是问卷页且正停在问卷面板上', () => {
    expect(shouldHideGlobalChrome({ pathname: '/amor-survey', activePanel: 'dating-priority' })).toBe(true)
    expect(shouldHideGlobalChrome({ pathname: '/amor-survey/', activePanel: 'dating-priority' })).toBe(true)
  })

  it('从问卷链接进来后切到别的页面，导航必须回来——不能把人困住', () => {
    // 面板切换不会改 pathname，所以这里仍是 /amor-survey；
    // 若实现退化成只看路径，这条会失败。
    expect(shouldHideGlobalChrome({ pathname: '/amor-survey', activePanel: 'sphere' })).toBe(false)
    expect(shouldHideGlobalChrome({ pathname: '/amor-survey', activePanel: 'devotion' })).toBe(false)
  })

  it('站内打开问卷面板（非问卷链接进入）时，导航照常显示', () => {
    expect(shouldHideGlobalChrome({ pathname: '/', activePanel: 'dating-priority' })).toBe(false)
  })

  it('入参缺失时不隐藏', () => {
    expect(shouldHideGlobalChrome()).toBe(false)
    expect(shouldHideGlobalChrome({})).toBe(false)
  })
})
