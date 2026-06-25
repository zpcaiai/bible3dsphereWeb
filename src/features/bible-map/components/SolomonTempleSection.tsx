'use client'
/**
 * SolomonTempleSection — 所罗门第一圣殿 3D 结构剖面图
 * 可旋转的真三维剖切模型（react-three-fiber）。默认开启「剖视」：
 * 揭去南墙与殿顶，露出至圣所 / 圣所 / 廊子三段内殿及陈设。
 * 经文尺寸与部件资料复用 data/templeStructure.js 的 TEMPLE_PARTS。
 * 1 肘 ≈ 0.45 米；本图为教学示意复原。
 */
import { useRef, useState } from 'react'
import { t } from '../../../i18n/runtime'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { TEMPLE_PARTS } from '../../../data/templeStructure.js'
import { DISCLAIMER } from '../domain/constants'

const C = 0.1 // 1 肘 → 世界单位（缩放，便于取景）

type Vec2 = [number, number]
interface SelFn { (id: string): void }

// ── 通用几何（坐标：x 东(+)/西(−)，z 北(+)/南(−)，y 上；单位：肘）──
function Box({
  c, size, base, top, color, id, onSel, opacity = 1, gold = false,
}: {
  c: Vec2; size: Vec2; base: number; top: number; color: string
  id?: string; onSel?: SelFn; opacity?: number; gold?: boolean
}) {
  const w = size[0] * C, d = size[1] * C, h = Math.max(0.001, (top - base) * C)
  return (
    <mesh
      position={[c[0] * C, ((base + top) / 2) * C, c[1] * C]}
      onClick={id && onSel ? (e: any) => { e.stopPropagation(); onSel(id) } : undefined}
      onPointerOver={id ? (e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' } : undefined}
      onPointerOut={id ? () => { document.body.style.cursor = 'default' } : undefined}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={gold ? 0.35 : 0.85}
        metalness={gold ? 0.7 : 0.08}
        emissive={gold ? color : '#000000'}
        emissiveIntensity={gold ? 0.22 : 0}
      />
    </mesh>
  )
}

function Cyl({
  c, r, rTop, base, top, color, id, onSel, seg = 24, bronze = false, gold = false,
}: {
  c: Vec2; r: number; rTop?: number; base: number; top: number; color: string
  id?: string; onSel?: SelFn; seg?: number; bronze?: boolean; gold?: boolean
}) {
  const h = Math.max(0.001, (top - base) * C)
  return (
    <mesh
      position={[c[0] * C, ((base + top) / 2) * C, c[1] * C]}
      onClick={id && onSel ? (e: any) => { e.stopPropagation(); onSel(id) } : undefined}
      onPointerOver={id ? (e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' } : undefined}
      onPointerOut={id ? () => { document.body.style.cursor = 'default' } : undefined}
    >
      <cylinderGeometry args={[(rTop ?? r) * C, r * C, h, seg]} />
      <meshStandardMaterial
        color={color}
        roughness={(bronze || gold) ? 0.35 : 0.8}
        metalness={(bronze || gold) ? 0.8 : 0.1}
        emissive={gold ? color : '#000000'}
        emissiveIntensity={gold ? 0.2 : 0}
      />
    </mesh>
  )
}

function Label({ c, y, text, tone = 'stone' }: { c: Vec2; y: number; text: string; tone?: 'stone' | 'gold' | 'bronze' | 'east' }) {
  const palette: Record<string, string> = {
    stone: 'rgba(207,197,176,0.95)',
    gold: 'rgba(240,208,96,0.98)',
    bronze: 'rgba(184,115,51,0.98)',
    east: 'rgba(125,211,252,0.95)',
  }
  return (
    <Html position={[c[0] * C, y * C, c[1] * C]} center distanceFactor={9} zIndexRange={[20, 0]} pointerEvents="none">
      <div style={{
        whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: palette[tone],
        textShadow: '0 1px 4px rgba(0,0,0,0.9)', letterSpacing: '0.04em', userSelect: 'none',
      }}>{t(text)}</div>
    </Html>
  )
}

// ── 圣殿场景 ──
function TempleScene({ cut, onSel }: { cut: boolean; onSel: SelFn }) {
  const ghost = cut ? 0.1 : 1 // 被剖去的构件以「幽灵面」淡显
  const STONE = '#cfc5b0', CEDAR = '#7a5c3a', COURT = '#8d7f63'
  const BRONZE = '#b87333', BRONZE_D = '#a8632a', GOLD = '#f0d060', GOLD_D = '#d8b040'

  // 旁屋（3 层）单侧渲染辅助
  const stories = (cx: number, cz: number, w: number, d: number, op = 1) => (
    [0, 1, 2].map((i) => (
      <Box key={i} c={[cx, cz]} size={[w - i * 0, d]} base={i * 5} top={i * 5 + 4.6}
        color={i % 2 ? '#b6a586' : '#bfae90'} id="chambers" onSel={onSel} opacity={op} />
    ))
  )

  return (
    <group>
      {/* 院基台 */}
      <Box c={[-2, 0]} size={[150, 96]} base={-2.5} top={0} color={COURT} id="court" onSel={onSel} />

      {/* ── 殿墙（殿身长60×宽20×高30 肘）── */}
      <Box c={[-51, 0]} size={[2, 24]} base={0} top={30} color={STONE} id="walls" onSel={onSel} />         {/* 西墙 */}
      <Box c={[-20, 11]} size={[64, 2]} base={0} top={30} color={STONE} id="walls" onSel={onSel} />        {/* 北墙 */}
      <Box c={[-20, -11]} size={[64, 2]} base={0} top={30} color={STONE} id="walls" onSel={onSel} opacity={ghost} /> {/* 南墙（剖去） */}
      <Box c={[10, 6.25]} size={[2, 9.5]} base={0} top={30} color={STONE} id="walls" onSel={onSel} />      {/* 东墙·北段 */}
      <Box c={[10, -6.25]} size={[2, 9.5]} base={0} top={30} color={STONE} id="walls" onSel={onSel} opacity={ghost} /> {/* 东墙·南段 */}
      <Box c={[10, 0]} size={[2, 5]} base={20} top={30} color={STONE} id="walls" onSel={onSel} />          {/* 殿门门楣 */}

      {/* 至圣所 / 圣所 隔断 + 幔子 */}
      <Box c={[-30, 0]} size={[1, 22]} base={0} top={30} color="#b8aa8c" id="veil" onSel={onSel} />
      <Box c={[-29.3, 0]} size={[0.3, 20]} base={0} top={30} color="#5a4a8a" id="veil" onSel={onSel} opacity={0.55} />

      {/* 廊子（殿前门廊，朝东）*/}
      <Box c={[15, 11]} size={[10, 2]} base={0} top={30} color={STONE} id="porch" onSel={onSel} />
      <Box c={[15, -11]} size={[10, 2]} base={0} top={30} color={STONE} id="porch" onSel={onSel} opacity={ghost} />

      {/* 殿顶（香柏木）— 剖去 */}
      <Box c={[-20, 0]} size={[68, 28]} base={30} top={32} color={CEDAR} id="roof" onSel={onSel} opacity={ghost} />
      <Box c={[15, 0]} size={[12, 28]} base={30} top={32} color={CEDAR} id="roof" onSel={onSel} opacity={ghost} />

      {/* 三层旁屋（环绕北、西；南侧剖去）*/}
      {stories(-20, 14, 64, 4)}
      {stories(-20, -14, 64, 4, ghost)}
      {stories(-54.5, 0, 5, 32)}

      {/* 铜柱 雅斤（南）/ 波阿斯（北）*/}
      <Cyl c={[24, -7]} r={1.9} base={0} top={18} color={BRONZE} id="jachin" onSel={onSel} bronze />
      <Cyl c={[24, -7]} r={2.5} base={18} top={23} color={BRONZE_D} id="jachin" onSel={onSel} bronze />
      <Cyl c={[24, 7]} r={1.9} base={0} top={18} color={BRONZE} id="boaz" onSel={onSel} bronze />
      <Cyl c={[24, 7]} r={2.5} base={18} top={23} color={BRONZE_D} id="boaz" onSel={onSel} bronze />

      {/* 铜祭坛（20×20×10）*/}
      <Box c={[45, 0]} size={[20, 20]} base={0} top={8} color={BRONZE_D} id="altar" onSel={onSel} />
      <Box c={[45, 0]} size={[14, 14]} base={8} top={10} color={BRONZE} id="altar" onSel={onSel} />

      {/* 铜海（径10·高5，立于十二铜牛）*/}
      <Cyl c={[40, -25]} r={3} base={0} top={2.5} color="#8a5a2a" id="sea-base" onSel={onSel} seg={12} bronze />
      <Cyl c={[40, -25]} r={5} rTop={5.4} base={2.5} top={7.5} color={BRONZE} id="sea" onSel={onSel} bronze />

      {/* ── 内殿陈设（剖视时可见）── */}
      {/* 至圣所：约柜 + 两基路伯（翅膀相接达于两墙）*/}
      <Box c={[-40, 0]} size={[2.5, 1.5]} base={0} top={1.5} color={GOLD} id="ark" onSel={onSel} gold />
      <Box c={[-40, 4]} size={[1.5, 1.5]} base={0} top={10} color={GOLD_D} id="cherubim" onSel={onSel} gold />
      <Box c={[-40, -4]} size={[1.5, 1.5]} base={0} top={10} color={GOLD_D} id="cherubim" onSel={onSel} gold />
      <Box c={[-40, 0]} size={[3, 18]} base={8.5} top={9.3} color={GOLD_D} id="cherubim" onSel={onSel} gold />

      {/* 圣所：金香坛 + 金灯台×10 + 陈设饼桌×10 */}
      <Box c={[-28, 0]} size={[1, 1]} base={0} top={2} color={GOLD} id="incense" onSel={onSel} gold />
      {[-26, -20, -14, -8, -2].map((x) => (
        <group key={x}>
          <Cyl c={[x, 6]} r={0.5} base={0} top={3} color={GOLD} id="lampstand" onSel={onSel} seg={10} gold />
          <Cyl c={[x, -6]} r={0.5} base={0} top={3} color={GOLD} id="lampstand" onSel={onSel} seg={10} gold />
          <Box c={[x + 3, 3]} size={[2, 1.2]} base={0} top={1.5} color="#c8a060" id="table" onSel={onSel} gold />
          <Box c={[x + 3, -3]} size={[2, 1.2]} base={0} top={1.5} color="#c8a060" id="table" onSel={onSel} gold />
        </group>
      ))}

      {/* ── 浮动标注 ── */}
      <Label c={[-40, 0]} y={26} text="至圣所 (20×20×20肘)" tone="gold" />
      <Label c={[-10, 0]} y={34} text="圣所 (40×20×30肘)" tone="stone" />
      <Label c={[15, 0]} y={34} text="廊子" tone="stone" />
      <Label c={[24, -7]} y={26} text="雅斤（南）" tone="bronze" />
      <Label c={[24, 7]} y={26} text="波阿斯（北）" tone="bronze" />
      <Label c={[45, 0]} y={13} text="铜祭坛" tone="bronze" />
      <Label c={[40, -25]} y={10} text="铜海" tone="bronze" />
      {cut && <Label c={[-40, 0]} y={3.2} text="约柜" tone="gold" />}
      <Label c={[62, 0]} y={2} text="← 殿门朝东 (East)" tone="east" />
    </group>
  )
}

interface Props { onBack: () => void }

export function SolomonTempleSection({ onBack }: Props) {
  const [cut, setCut] = useState(true)
  const [sel, setSel] = useState<string | null>('holy')
  const controls = useRef<any>(null)
  const part = sel ? (TEMPLE_PARTS as Record<string, any>)[sel] : null

  const legend: Array<{ c: string; t: string }> = [
    { c: '#cfc5b0', t: '殿墙·廊子（凿石）' },
    { c: '#7a5c3a', t: '殿顶（香柏木）' },
    { c: '#b87333', t: '铜器（柱·坛·海）' },
    { c: '#f0d060', t: '金器（约柜·灯台·香坛）' },
    { c: '#8d7f63', t: '祭司内院' },
  ]

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">{t('📐 所罗门圣殿 · 3D 结构剖面图')}</h1>
          <p className="text-xs text-gray-400">{t('第一圣殿（王上6-7；代下3-4）· 拖动旋转，点击构件查看经文资料')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCut((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              cut ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/15 bg-white/5 text-gray-200 hover:bg-white/10'
            }`}
          >
            {cut ? t('🔪 剖视内部（开）') : t('🏛️ 还原全貌')}
          </button>
          <button
            onClick={() => controls.current?.reset()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10"
          >
            {t('↻ 复位视角')}
          </button>
          <button onClick={onBack} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10">
            {t('‹ 返回')}
          </button>
        </div>
      </header>

      <div className="relative flex-1">
        <Canvas
          style={{ width: '100%', height: '100%', display: 'block' }}
          camera={{ position: [3.6, 3.6, 7.2], fov: 42 }}
          dpr={[1, 2]}
          onPointerMissed={() => setSel(null)}
        >
          <color attach="background" args={['#0b1220']} />
          <hemisphereLight args={['#bcd2ff', '#3a2f22', 0.7]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[6, 9, 5]} intensity={1.15} />
          <directionalLight position={[-5, 4, -4]} intensity={0.35} color="#ffd9a0" />
          <pointLight position={[-2, 1.4, 0]} intensity={9} distance={6} decay={2} color="#ffd9a0" />
          <TempleScene cut={cut} onSel={setSel} />
          <OrbitControls
            ref={controls}
            target={[-2, 1.2, 0]}
            minDistance={3}
            maxDistance={22}
            maxPolarAngle={Math.PI / 2.05}
            enablePan
          />
        </Canvas>

        {/* 图例 */}
        <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur">
          <div className="mb-1.5 text-xs font-bold text-gray-200">{t('图例')}</div>
          <div className="space-y-1">
            {legend.map((l) => (
              <div key={l.t} className="flex items-center gap-2 text-[11px] text-gray-300">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.c }} />
                {t(l.t)}
              </div>
            ))}
          </div>
        </div>

        {/* 部件资料卡 */}
        {part && (
          <div className="absolute right-4 top-4 max-w-xs rounded-xl border border-amber-400/20 bg-black/75 p-4 backdrop-blur">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-amber-300">{t(part.name)}</h2>
              <button onClick={() => setSel(null)} className="text-gray-400 hover:text-white" aria-label="关闭">✕</button>
            </div>
            <div className="mb-2 text-xs text-amber-400/90">{t(part.ref)}</div>
            {part.dims && <div className="mb-2 text-xs text-gray-400">{t('尺寸：')}{t(part.dims)}</div>}
            <p className="text-sm leading-relaxed text-gray-200">{t(part.desc)}</p>
          </div>
        )}

        {/* 提示 */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[11px] text-gray-300 backdrop-blur">
          {t('🖱️ 左键拖动旋转 · 滚轮缩放 · 右键平移 · 点击构件看注解')}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-2">
        <p className="text-center text-[11px] text-gray-500">{t(DISCLAIMER)}　{t('1 肘 ≈ 0.45 米，几何为教学示意复原。')}</p>
      </div>
    </div>
  )
}

export default SolomonTempleSection
