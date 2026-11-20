import CharacterPortrait from './CharacterPortrait'
import { NEUTRAL_ANIMATION_FRAME, VISEME_SHAPES } from './LocalPortraitVisemeAdapter'

function isReducedMotionPreferred() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
  } catch {
    return false
  }
}

function renderAnatomicalMouthOverlay(viseme, jawOpen, lipRound, lipPress, speaking) {
  const activeOpacity = speaking ? Math.min(0.68, 0.22 + jawOpen * 0.45 + lipPress * 0.2) : 0.12
  if (viseme === VISEME_SHAPES.BILABIAL) {
    const halfWidth = Number((8.5 - lipPress * 1.8).toFixed(2))
    return (
      <g data-viseme-shape="BILABIAL" opacity={activeOpacity}>
        <line
          x1={128 - halfWidth}
          y1="154"
          x2={128 + halfWidth}
          y2="154"
          stroke="rgba(54, 28, 36, 0.72)"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.ROUNDED) {
    const rx = Number((4.2 + (1 - lipRound) * 2.2).toFixed(2))
    const ry = Number((2.6 + jawOpen * 4.2).toFixed(2))
    return (
      <g data-viseme-shape="ROUNDED" opacity={activeOpacity}>
        <ellipse
          cx="128"
          cy="154"
          rx={rx}
          ry={ry}
          fill="rgba(38, 18, 26, 0.58)"
          stroke="rgba(245, 214, 190, 0.36)"
          strokeWidth="1.2"
        />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.OPEN) {
    const rx = 8.4
    const ry = Number(Math.max(2.8, 2.0 + jawOpen * 5.4).toFixed(2))
    return (
      <g data-viseme-shape="OPEN" opacity={activeOpacity}>
        <ellipse
          cx="128"
          cy="154.5"
          rx={rx}
          ry={ry}
          fill="rgba(36, 16, 24, 0.62)"
          stroke="rgba(245, 214, 190, 0.38)"
          strokeWidth="1.2"
        />
      </g>
    )
  }
  if (viseme === VISEME_SHAPES.DENTAL) {
    const ry = Number(Math.max(1.8, 1.4 + jawOpen * 3.1).toFixed(2))
    return (
      <g data-viseme-shape="DENTAL" opacity={activeOpacity}>
        <rect
          x="119.5"
          y={154 - ry}
          width="17"
          height={ry * 2}
          rx={ry}
          fill="rgba(38, 18, 26, 0.52)"
          stroke="rgba(245, 214, 190, 0.34)"
          strokeWidth="1.1"
        />
      </g>
    )
  }
  return (
    <g data-viseme-shape="REST" opacity={speaking ? 0.24 : 0.1}>
      <path
        d="M 120 154 Q 128 155.4 136 154"
        fill="none"
        stroke="rgba(72, 42, 52, 0.55)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  )
}

function UpperEyelidVeil({ cx, cy, blink, gazeX, gazeY, testId }) {
  const clampedBlink = Math.max(0, Math.min(1, blink))
  const veilRy = Number((1.2 + clampedBlink * 3.8).toFixed(2))
  const glintX = Number((cx + gazeX * 2.1).toFixed(2))
  const glintY = Number((cy + gazeY * 1.2).toFixed(2))

  return (
    <g data-testid={testId}>
      {clampedBlink > 0.08 && (
        <ellipse
          cx={cx}
          cy={cy - 1 + clampedBlink * 1.4}
          rx="7.2"
          ry={veilRy}
          fill={`rgba(48, 34, 30, ${Number((clampedBlink * 0.46).toFixed(3))})`}
        />
      )}
      {clampedBlink < 0.65 && (
        <circle
          cx={glintX}
          cy={glintY}
          r="0.9"
          fill="rgba(255, 248, 236, 0.32)"
        />
      )}
    </g>
  )
}

const WAVE_WEIGHTS = [0.32, 0.54, 0.78, 0.96, 1.0, 0.92, 0.74, 0.5, 0.3]

function VoicePresenceWaveform({ speaking, jawOpen, lipRound, lipPress, reducedMotion }) {
  const energy = speaking
    ? Math.max(0.14, Math.min(1, jawOpen * 0.85 + lipRound * 0.22 + (1 - lipPress * 0.4) * 0.12))
    : 0.06

  return (
    <g data-testid="dh-voice-waveform" opacity={speaking ? 0.92 : 0.32}>
      <rect
        x="84"
        y="228"
        width="88"
        height="18"
        rx="9"
        fill="rgba(12, 10, 24, 0.56)"
        stroke={speaking ? 'rgba(239, 213, 157, 0.42)' : 'rgba(185, 164, 236, 0.2)'}
        strokeWidth="1"
      />
      {WAVE_WEIGHTS.map((weight, idx) => {
        const barHeight = reducedMotion
          ? (speaking ? 5 : 2.5)
          : Number(Math.max(2.4, 2.4 + energy * weight * 11.2).toFixed(2))
        const x = 96 + idx * 8
        const y = Number((237 - barHeight / 2).toFixed(2))
        return (
          <rect
            key={idx}
            x={x - 1.4}
            y={y}
            width="2.8"
            height={barHeight}
            rx="1.4"
            fill={speaking ? '#efd59d' : 'rgba(200, 183, 255, 0.55)'}
          />
        )
      })}
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
  const reducedMotion = isReducedMotionPreferred()

  const swayX = !reducedMotion && speaking ? Number((gazeX * 1.5).toFixed(2)) : 0
  const nodY = !reducedMotion && speaking ? Number((jawOpen * 1.8 + gazeY * 1.1).toFixed(2)) : 0
  const breathScale = !reducedMotion && speaking ? Number((1 + jawOpen * 0.01).toFixed(4)) : 1
  const motionStyle = reducedMotion
    ? { width: '100%' }
    : {
        width: '100%',
        transform: `translate3d(${swayX}px, ${nodY}px, 0) scale(${breathScale})`,
        transition: 'transform 85ms ease-out',
        willChange: speaking ? 'transform' : 'auto',
      }

  return (
    <div
      className="dh-animated-stage"
      data-testid="dh-animated-stage"
      data-speaking={speaking ? 'true' : 'false'}
      data-viseme={viseme}
      data-eye-blinking={blinking ? 'true' : 'false'}
      data-gaze-x={gazeX.toFixed(2)}
      data-gaze-y={gazeY.toFixed(2)}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      onClick={onStageTouch}
      style={{ position: 'relative', width: size, maxWidth: '100%', overflow: 'hidden', borderRadius: 14 }}
    >
      <div className="dh-portrait-motion-frame" style={motionStyle}>
        <CharacterPortrait
          characterId={characterId}
          name={name}
          avatar={avatar}
          size={size}
          compact={false}
          context="workspace"
        />
      </div>
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
        <UpperEyelidVeil cx={104} cy={98} blink={blink} gazeX={gazeX} gazeY={gazeY} testId="dh-rig-eye-left" />
        <UpperEyelidVeil cx={152} cy={98} blink={blink} gazeX={gazeX} gazeY={gazeY} testId="dh-rig-eye-right" />
        <g data-testid="dh-rig-mouth" data-viseme={viseme}>
          {renderAnatomicalMouthOverlay(viseme, jawOpen, lipRound, lipPress, speaking)}
        </g>
        <VoicePresenceWaveform
          speaking={speaking}
          jawOpen={jawOpen}
          lipRound={lipRound}
          lipPress={lipPress}
          reducedMotion={reducedMotion}
        />
      </svg>
    </div>
  )
}
