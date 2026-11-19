import { t as i18nT } from '../i18n/runtime'
import {
  handleAppDownloadClick,
  isSameOriginHttpDownload,
  resolveAppDownloads,
} from '../appDownloads'

function AndroidIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.523 15.341a.857.857 0 1 1 0-1.714.857.857 0 0 1 0 1.714Zm-11.046 0a.857.857 0 1 1 0-1.714.857.857 0 0 1 0 1.714Zm11.352-5.405 1.908-3.304a.396.396 0 0 0-.145-.541.396.396 0 0 0-.541.145l-1.932 3.346A11.49 11.49 0 0 0 12 8.5c-1.842 0-3.577.392-5.119 1.082L4.949 6.236a.396.396 0 0 0-.541-.145.396.396 0 0 0-.145.541L6.171 9.936C2.885 11.725.676 15.052.5 18.929h23c-.176-3.877-2.385-7.204-5.671-8.993Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
    </svg>
  )
}

function DownloadArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

export default function AppDownloadFooterSection({ onNotify, env }) {
  const {
    androidUrl,
    iosUrl,
    sameOriginAndroidUrl,
    sameOriginIosUrl,
    androidFilename,
    iosFilename,
  } = resolveAppDownloads(env)
  const androidSameOrigin = isSameOriginHttpDownload(androidUrl)
  const iosSameOrigin = isSameOriginHttpDownload(iosUrl)

  const notifyUnavailable = (msgKey) => {
    const text = i18nT(msgKey)
    if (typeof onNotify === 'function') {
      onNotify(text, 'info')
    } else if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(text, 'info')
    }
  }

  return (
    <section
      className="mobile-card glass app-download-footer-card"
      data-testid="home-app-download-section"
      aria-label={i18nT('home.appDownload.title')}
    >
      <div className="app-download-header">
        <div className="section-title app-download-title">
          <span aria-hidden="true">📱</span>
          <span>{i18nT('home.appDownload.title')}</span>
        </div>
        <div className="app-download-subtitle">
          {i18nT('home.appDownload.subtitle')}
        </div>
      </div>

      <div className="app-download-grid">
        <a
          href={androidUrl}
          download={androidSameOrigin ? androidFilename : undefined}
          target={androidSameOrigin ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="app-download-btn app-download-btn-android"
          data-testid="home-download-android"
          aria-label={`${i18nT('home.appDownload.androidTitle')} (${i18nT('home.appDownload.androidMeta')})`}
          onClick={(e) =>
            handleAppDownloadClick(e, {
              url: androidUrl,
              sameOriginFallbackUrl: sameOriginAndroidUrl,
              filename: androidFilename,
              onUnavailable: () => notifyUnavailable('home.appDownload.pendingAndroid'),
            })
          }
        >
          <span className="app-download-btn-icon">
            <AndroidIcon />
          </span>
          <span className="app-download-btn-copy">
            <span className="app-download-btn-label">{i18nT('home.appDownload.androidTitle')}</span>
            <span className="app-download-btn-meta">{i18nT('home.appDownload.androidMeta')}</span>
          </span>
          <span className="app-download-btn-arrow">
            <DownloadArrowIcon />
          </span>
        </a>

        <a
          href={iosUrl}
          download={iosSameOrigin ? iosFilename : undefined}
          target={iosSameOrigin ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="app-download-btn app-download-btn-ios"
          data-testid="home-download-ios"
          aria-label={`${i18nT('home.appDownload.iosTitle')} (${i18nT('home.appDownload.iosMeta')})`}
          onClick={(e) =>
            handleAppDownloadClick(e, {
              url: iosUrl,
              sameOriginFallbackUrl: sameOriginIosUrl,
              filename: iosFilename,
              onUnavailable: () => notifyUnavailable('home.appDownload.pendingIos'),
            })
          }
        >
          <span className="app-download-btn-icon">
            <AppleIcon />
          </span>
          <span className="app-download-btn-copy">
            <span className="app-download-btn-label">{i18nT('home.appDownload.iosTitle')}</span>
            <span className="app-download-btn-meta">{i18nT('home.appDownload.iosMeta')}</span>
          </span>
          <span className="app-download-btn-arrow">
            <DownloadArrowIcon />
          </span>
        </a>
      </div>
    </section>
  )
}
