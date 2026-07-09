import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './AppErrorBoundary'
import { LanguageProvider } from './i18n/LanguageContext'
import { getRuntimeLang } from './i18n/runtime'
import { mergeAutoEn } from './i18n/translations'
import { registerServiceWorker } from './pwa'
import './styles.css'

registerServiceWorker()

async function prepareI18n() {
  if (getRuntimeLang() !== 'en') return
  try {
    const mod = await import('./i18n/auto-en.js')
    mergeAutoEn(mod.default)
  } catch (error) {
    console.warn('[i18n] auto-en preload failed', error)
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'))

prepareI18n().finally(() => {
  root.render(
    <React.StrictMode>
      <AppErrorBoundary>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AppErrorBoundary>
    </React.StrictMode>,
  )
})
