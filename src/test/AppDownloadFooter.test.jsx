import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppDownloadFooterSection from '../components/AppDownloadFooterSection'
import {
  ANDROID_PACKAGE_FILENAME,
  DEFAULT_ANDROID_APP_URL,
  DEFAULT_IOS_APP_URL,
  SAME_ORIGIN_ANDROID_APP_URL,
  handleAppDownloadClick,
  resolveAppDownloads,
} from '../appDownloads'
import { setRuntimeLang } from '../i18n/runtime'

describe('Homepage bottom Android & iOS download section', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    setRuntimeLang('zh')
  })

  afterEach(() => {
    global.fetch = originalFetch
    setRuntimeLang('zh')
  })

  it('resolves pre-configured CDN download links and preserves same-origin paths', () => {
    const resolved = resolveAppDownloads({})
    expect(resolved.androidUrl).toBe(DEFAULT_ANDROID_APP_URL)
    expect(resolved.iosUrl).toBe(DEFAULT_IOS_APP_URL)
    expect(resolved.sameOriginAndroidUrl).toBe(SAME_ORIGIN_ANDROID_APP_URL)

    render(<AppDownloadFooterSection env={{}} />)
    expect(screen.getByTestId('home-download-android').getAttribute('href')).toBe(DEFAULT_ANDROID_APP_URL)
    expect(screen.getByTestId('home-download-ios').getAttribute('href')).toBe(DEFAULT_IOS_APP_URL)
  })

  it('supports VITE_ANDROID_APP_URL and VITE_IOS_APP_URL overrides', () => {
    const customEnv = {
      VITE_ANDROID_APP_URL: `/downloads/${ANDROID_PACKAGE_FILENAME}`,
      VITE_IOS_APP_URL: 'https://testflight.apple.com/join/example',
    }
    const resolved = resolveAppDownloads(customEnv)
    expect(resolved.androidUrl).toBe(`/downloads/${ANDROID_PACKAGE_FILENAME}`)
    expect(resolved.iosUrl).toBe('https://testflight.apple.com/join/example')
  })

  it('shows friendly pending notice when neither same-origin nor CDN package is uploaded yet', async () => {
    const onNotify = vi.fn()
    global.fetch = vi.fn(async (url) => {
      if (String(url).startsWith('/downloads/')) {
        return {
          ok: true,
          status: 200,
          headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'text/html' : null) },
        }
      }
      return {
        ok: false,
        status: 404,
        headers: { get: () => null },
      }
    })

    render(<AppDownloadFooterSection onNotify={onNotify} env={{}} />)
    fireEvent.click(screen.getByTestId('home-download-android'))

    await waitFor(() => {
      expect(onNotify).toHaveBeenCalledWith('Android 安装包正在准备中，稍后开放下载', 'info')
    })
  })

  it('downloads from same-origin /downloads/ immediately when present', async () => {
    const onUnavailable = vi.fn()
    const downloadTrigger = vi.fn()
    const fetchImpl = vi.fn(async (url) => ({
      ok: String(url) === SAME_ORIGIN_ANDROID_APP_URL,
      status: String(url) === SAME_ORIGIN_ANDROID_APP_URL ? 200 : 404,
      headers: {
        get: (name) => {
          if (name.toLowerCase() === 'content-type') return 'application/octet-stream'
          if (name.toLowerCase() === 'content-length') return '52428800'
          return null
        },
      },
    }))

    const ok = await handleAppDownloadClick(
      { preventDefault: vi.fn() },
      {
        url: DEFAULT_ANDROID_APP_URL,
        sameOriginFallbackUrl: SAME_ORIGIN_ANDROID_APP_URL,
        filename: ANDROID_PACKAGE_FILENAME,
        onUnavailable,
        fetchImpl,
        downloadTrigger,
      },
    )

    expect(ok).toBe(true)
    expect(downloadTrigger).toHaveBeenCalledWith(SAME_ORIGIN_ANDROID_APP_URL, ANDROID_PACKAGE_FILENAME)
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('downloads from CDN app directory when same-origin falls back to index.html', async () => {
    const onUnavailable = vi.fn()
    const downloadTrigger = vi.fn()
    const fetchImpl = vi.fn(async (url) => {
      if (String(url) === SAME_ORIGIN_ANDROID_APP_URL) {
        return {
          ok: true,
          status: 200,
          headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'text/html' : null) },
        }
      }
      return {
        ok: true,
        status: 200,
        headers: {
          get: (k) => (k.toLowerCase() === 'content-type' ? 'application/octet-stream' : '52428800'),
        },
      }
    })

    const ok = await handleAppDownloadClick(
      { preventDefault: vi.fn() },
      {
        url: DEFAULT_ANDROID_APP_URL,
        sameOriginFallbackUrl: SAME_ORIGIN_ANDROID_APP_URL,
        filename: ANDROID_PACKAGE_FILENAME,
        onUnavailable,
        fetchImpl,
        downloadTrigger,
      },
    )

    expect(ok).toBe(true)
    expect(downloadTrigger).toHaveBeenCalledWith(DEFAULT_ANDROID_APP_URL, ANDROID_PACKAGE_FILENAME)
    expect(onUnavailable).not.toHaveBeenCalled()
  })

  it('renders English copy cleanly when switched to en locale', () => {
    setRuntimeLang('en')
    render(<AppDownloadFooterSection env={{}} />)
    expect(screen.getByTestId('home-app-download-section').textContent).toContain('Mobile App Download')
    expect(screen.getByTestId('home-download-android').textContent).toContain('Download for Android')
    expect(screen.getByTestId('home-download-ios').textContent).toContain('Download for iOS')
  })
})
