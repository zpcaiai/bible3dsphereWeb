import { t as i18nT } from '../i18n/runtime'
import { Suspense } from 'react'
import lazyWithRetry from '../lazyWithRetry'

const SeekersClassView = lazyWithRetry(() => import('../EvangelismPage').then(m => ({ default: m.SeekersClassView })))

export default function SeekersStandalonePage() {
  return (
    <main style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0b1020 0%, #101a33 100%)', color: '#fff',
    }}>
      <div style={{ padding: '20px 16px 10px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{i18nT('📚 慕道班')}</h1>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{i18nT('慕道班课程 · 文字 / PPT / 视频')}</div>
      </div>
      <Suspense fallback={
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>{i18nT('加载中…')}</div>
      }>
        <SeekersClassView />
      </Suspense>
      <div style={{ padding: '10px 0 18px', textAlign: 'center' }}>
        <a href="/" style={{ color: 'rgba(90,200,250,0.85)', fontSize: 13, textDecoration: 'none' }}>{i18nT('✨ 进入情感星球 →')}</a>
      </div>
    </main>
  )
}
