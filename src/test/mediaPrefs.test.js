import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMediaPrefs, getMediaPref, setMediaPref, toggleMediaPref,
  subscribeMediaPrefs, resetMediaPrefs, muteAllMedia, MEDIA_PREF_DEFAULTS,
} from '../lib/media/mediaPrefs'

describe('mediaPrefs 护栏', () => {
  beforeEach(() => { resetMediaPrefs() })

  it('危机声音与危机振动默认关闭（必须显式开启）', () => {
    expect(MEDIA_PREF_DEFAULTS.crisisAudio).toBe(false)
    expect(MEDIA_PREF_DEFAULTS.crisisHaptics).toBe(false)
  })

  it('自动播报默认关闭', () => {
    expect(getMediaPref('autoplay')).toBe(false)
  })

  it('环境音默认关闭', () => {
    expect(getMediaPref('ambience')).toBe(false)
  })

  it('设置与切换生效', () => {
    setMediaPref('crisisAudio', true)
    expect(getMediaPref('crisisAudio')).toBe(true)
    toggleMediaPref('crisisAudio')
    expect(getMediaPref('crisisAudio')).toBe(false)
  })

  it('未知键被忽略，不污染偏好', () => {
    setMediaPref('notAKey', true)
    expect(getMediaPrefs().notAKey).toBeUndefined()
  })

  it('订阅者收到变更', () => {
    let seen = null
    const off = subscribeMediaPrefs((p) => { seen = p })
    setMediaPref('sound', false)
    expect(seen?.sound).toBe(false)
    off()
  })

  it('一键静音关闭所有发声与振动开关', () => {
    setMediaPref('sound', true); setMediaPref('crisisAudio', true)
    setMediaPref('haptics', true); setMediaPref('crisisHaptics', true)
    setMediaPref('ambience', true); setMediaPref('autoplay', true)
    muteAllMedia()
    const p = getMediaPrefs()
    expect([p.sound, p.autoplay, p.ambience, p.crisisAudio, p.haptics, p.crisisHaptics]).toEqual([false, false, false, false, false, false])
  })
})
