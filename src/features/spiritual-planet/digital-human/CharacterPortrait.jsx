import { useState } from 'react'
import catalog from './portraitCatalog.json'

export function getArtisticPortrait(characterId) {
  return typeof characterId === 'string' && Object.hasOwn(catalog.portraits, characterId)
    ? catalog.portraits[characterId] : null
}

function approvedPortrait(avatar) {
  if (avatar?.reviewState !== 'APPROVED' || !avatar.portraitUrl) return null
  try {
    return new URL(avatar.portraitUrl).protocol === 'https:' ? avatar.portraitUrl : null
  } catch {
    return null
  }
}

function PortraitImage({ characterId, name, avatar, size = 80, compact = true, context = 'portrait' }) {
  const [failedSources, setFailedSources] = useState([])
  const artwork = getArtisticPortrait(characterId)
  const approved = approvedPortrait(avatar)
  const sources = [...new Set([approved, artwork?.url].filter(Boolean))]
  const src = sources.find((url) => !failedSources.includes(url))
  const isApproved = Boolean(src && src === approved)
  const label = name || '圣经人物'
  const disclosure = isApproved ? '教育性艺术重建 · 非历史真实肖像' : '艺术重建 · 非历史真实肖像 · 待人工审核'
  const reviewState = src ? (isApproved ? 'APPROVED' : 'PREVIEW_ONLY') : 'UNAVAILABLE'
  const pictureStyle = { width: '100%', height: 'auto', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: compact ? '50%' : 14, display: 'block' }
  return (
    <figure data-portrait-context={context} data-character-id={characterId} data-review-state={reviewState}
      title={`${label}：${src ? disclosure : '头像暂不可用'}`}
      style={{ margin: 0, width: size, maxWidth: '100%', flexShrink: 0, textAlign: 'center', overflowWrap: 'anywhere' }}>
      {src ? <img key={src} src={src} width={384} height={384} loading={compact ? 'lazy' : 'eager'} decoding="async"
        alt={isApproved ? `${label}数字人艺术重建肖像` : `${label}艺术重建肖像`}
        data-portrait-character-id={characterId} data-portrait-context={context} data-review-state={reviewState}
        data-portrait-sha256={!isApproved ? artwork?.sha256 : undefined}
        style={pictureStyle}
        onError={() => setFailedSources((previous) => [...new Set([...previous, src])])} />
        : <div role="img" aria-label={`${label}头像暂不可用`} style={{ ...pictureStyle, height: size, display: 'grid', placeItems: 'center', background: '#343444', color: '#eee', fontSize: size * .36 }}>{Array.from(label)[0]}</div>}
      <figcaption style={{ color: '#c8b7ff', fontSize: compact ? 9 : 11, lineHeight: 1.5, marginTop: 4 }}>
        {src ? (compact ? '艺术重建' : disclosure) : (sources.length ? '头像加载失败' : '暂无独立肖像')}
      </figcaption>
      {!src && sources.length > 0 && !compact && <button type="button" onClick={() => setFailedSources([])}>重试头像</button>}
    </figure>
  )
}

// The keyed subtree discards stale image failures when the canonical identity changes.
export default function CharacterPortrait(props) {
  return <PortraitImage key={props.characterId || 'unknown'} {...props} />
}
