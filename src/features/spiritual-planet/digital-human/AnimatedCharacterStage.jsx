import CharacterPortrait from './CharacterPortrait'
import { NEUTRAL_ANIMATION_FRAME, VISEME_SHAPES } from './LocalPortraitVisemeAdapter'

function renderMouthGeometry(viseme, jawOpen, lipRound, lipPress) {
  if (viseme === VISEME_SHAPES.BILABIAL) {
    const halfWidth = Math.max(8, 12 - lipPress * 2.5)
    return (
      <g data-viseme-shape="BILABIAL">
        <line
          x1={128 - halfWidth}
          y1="230"
          x2={128 + halfWidth}
          y2="230"
          stroke="#f5dec0"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.ROUNDED) {
    const rx = 5.2 + (1 - lipRound) * 3
    const ry = 4.5 + jawOpen * 5.5
    return (
      <g data-viseme-shape="ROUNDED">
        <ellipse cx="128" cy="230" rx={rx} ry={ry} fill="#2c1824" stroke="#f5dec0" strokeWidth="2.2" />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.OPEN) {
    const rx = 11.5
    const ry = Math.max(4.8, 3.2 + jawOpen * 7.2)
    return (
      <g data-viseme-shape="OPEN">
        <ellipse cx="128" cy="230" rx={rx} ry={ry} fill="#2c1824" stroke="#f5dec0" strokeWidth="2.2" />
        <line x1="121" y1={230 - ry + 2.2} x2="135" y2={230 - ry + 2.2} stroke="#fff7ec" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.DENTAL) {
    const ry = Math.max(2.6, 2 + jawOpen * 4.5)
    return (
      <g data-viseme-shape="DENTAL">
        <rect x="116" y={230 - ry} width="24" height={ry * 2} rx={ry} fill="#2c1824" stroke="#f5dec0" strokeWidth="2" />
        <line x1="119" y1="229.5" x2="137" y2="229.5" stroke="#fff7ec" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    )
  }
  return (
    <g data-viseme-shape="REST">
      <path d="M 117 230 Q 128 232.6 139 230" fill="none" stroke="#d9c6ef" strokeWidth="2.1" strokeLinecap="round" />
    </g>
  )
}

function EyeRig({ cx, cy, blink, gazeX, gazeY, testId }) {
  const openRatio = Math.max(0.08, 1 - Math.max(0, Math.min(1, blink)))
  const ry = Number((4.4 * openRatio).toFixed(2))
  const pupilX = Number((cx + gazeX * 2.8).toFixed(2))
  const pupilY = Number((cy + gazeY * 1.6 * openRatio).toFixed(2))

  return (
    <g data-testid={testId}>
      <ellipse cx={cx} cy={cy} rx="7.6" ry={ry} fill="rgba(246,242,255,0.92)" stroke="#b9a4ec" strokeWidth="1.4" />
      {openRatio > 0.25 && (
        <>
          <circle cx={pupilX} cy={pupilY} r="2.5" fill="#2a1f45" />
          <circle cx={pupilX - 0.8} cy={pupilY - 0.8} r="0.8" fill="#ffffff" />
        </>
      )}
    </g>
  )
}

export default function AnimatedCharacterStage({
  characterId,
  name,
  avatar,
  size = 256,
  frame = NEUTRAL_ANIMATION_FRAME,
  onStageTouch,
}) {
  const safeFrame = frame || NEUTRAL_ANIMATION_FRAME
  const viseme = safeFrame.viseme || VISEME_SHAPES.REST
  const speaking = Boolean(safeFrame.speaking)
  const blink = Number(safeFrame.blink || 0)
  const gazeX = Number(safeFrame.gazeX || 0)
  const gazeY = Number(safeFrame.gazeY || 0)
  const jawOpen = Number(safeFrame.jawOpen || 0)
  const lipRound = Number(safeFrame.lipRound || 0)
  const lipPress = Number(safeFrame.lipPress || 0)
  const blinking = blink > 0.5

  return (
    <div
      className="dh-animated-stage"
      data-testid="dh-animated-stage"
      data-speaking={speaking ? 'true' : 'false'}
      data-viseme={viseme}
      data-eye-blinking={blinking ? 'true' : 'false'}
      data-gaze-x={gazeX.toFixed(2)}
      data-gaze-y={gazeY.toFixed(2)}
      onClick={onStageTouch}
      style={{ position: 'relative', width: size, maxWidth: '100%' }}
    >
      <CharacterPortrait
        characterId={characterId}
        name={name}
        avatar={avatar}
        size={size}
        compact={false}
        context="workspace"
      />
      <svg
        className="dh-animated-rig"
        data-testid="dh-animated-rig"
        aria-hidden="true"
        viewBox="0 0 256 256"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          aspectRatio: '1 / 1',
          pointerEvents: 'none',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {speaking && (
          <rect
            x="3"
            y="3"
            width="250"
            height="250"
            rx="12"
            fill="none"
            stroke="rgba(239, 213, 157, 0.58)"
            strokeWidth="2"
          />
        )}
        <g opacity={speaking ? 0.94 : 0.68}>
          <rect
            x="76"
            y="214"
            width="104"
            height="32"
            rx="16"
            fill="rgba(14, 12, 28, 0.72)"
            stroke={speaking ? 'rgba(239, 213, 157, 0.45)' : 'rgba(185, 164, 236, 0.28)'}
            strokeWidth="1.2"
          />
          <EyeRig cx={95} cy={230} blink={blink} gazeX={gazeX} gazeY={gazeY} testId="dh-rig-eye-left" />
          <g data-testid="dh-rig-mouth" data-viseme={viseme}>
            {renderMouthGeometry(viseme, jawOpen, lipRound, lipPress)}
          </g>
          <EyeRig cx={161} cy={230} blink={blink} gazeX={gazeX} gazeY={gazeY} testId="dh-rig-eye-right" />
        </g>
      </svg>
    </div>
  )
}
