// useMediaPrefs — 订阅全局媒体偏好的 React hook。
import { useEffect, useState, useCallback } from 'react'
import { getMediaPrefs, setMediaPref, toggleMediaPref, subscribeMediaPrefs, muteAllMedia } from './mediaPrefs'

export function useMediaPrefs() {
  const [prefs, setPrefs] = useState(getMediaPrefs)

  useEffect(() => subscribeMediaPrefs(setPrefs), [])

  const set = useCallback((k, v) => setMediaPref(k, v), [])
  const toggle = useCallback((k) => toggleMediaPref(k), [])
  const muteAll = useCallback(() => muteAllMedia(), [])

  return { prefs, set, toggle, muteAll }
}

export default useMediaPrefs
