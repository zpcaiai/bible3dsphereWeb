import { useState } from 'react'
import { getArtisticPortrait } from './portraitCatalog'

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
        {src ? (compact ? <><span style={{ fontSize: 'inherit', fontWeight: 'normal' }}>艺术重建</span><span style={{ display: 'block', fontSize: 'inherit', fontWeight: 'normal' }}>非历史肖像</span>{!isApproved && <span style={{ display: 'block', fontSize: 'inherit', fontWeight: 'normal' }}>待人工审核</span>}</> : disclosure) : (sources.length ? '头像加载失败' : '暂无独立肖像')}
      </figcaption>
      {!src && sources.length > 0 && !compact && <button type="button" onClick={() => setFailedSources([])}>重试头像</button>}
      {src && !isApproved && approved && !compact && <button type="button" onClick={() => setFailedSources((previous) => previous.filter((url) => url !== approved))}>重试已审核肖像</button>}
    </figure>
  )
}

// Scalar identity and asset revisions discard stale failures without resetting on each render.
// Callers must pass characterId and avatar from the same validated catalog profile.
export default function CharacterPortrait(props) {
  const key = JSON.stringify([props.characterId, props.avatar?.portraitUrl, props.avatar?.version, props.avatar?.portraitSha256, props.avatar?.reviewState, getArtisticPortrait(props.characterId)?.sha256])
  return <PortraitImage key={key} {...props} />
}
