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
type Vec3 = [number, number, number]
interface SelFn { (id: string): void }

const mat = (color: string, gold = false, bronze = false, opacity = 1) => (
  <meshStandardMaterial
    color={color}
    transparent={opacity < 1}
    opacity={opacity}
    roughness={gold || bronze ? 0.35 : 0.85}
    metalness={gold || bronze ? 0.8 : 0.08}
    emissive={gold ? color : '#000000'}
    emissiveIntensity={gold ? 0.22 : 0}
  />
)

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
      {mat(color, gold, false, opacity)}
    </mesh>
  )
}

function Cyl({
  c, r, rTop, base, top, color, id, onSel, seg = 24, bronze = false, gold = false, opacity = 1,
}: {
  c: Vec2; r: number; rTop?: number; base: number; top: number; color: string
  id?: string; onSel?: SelFn; seg?: number; bronze?: boolean; gold?: boolean; opacity?: number
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
      {mat(color, gold, bronze, opacity)}
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

// ── 家具组件 ──
function Ark({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const GOLD = '#f0d060'
  const g = mat(GOLD, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('ark') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 柜体 2.5×1.5×1.5 */}
      <mesh position={[0, 0.75 * C, 0]}>{g}<boxGeometry args={[2.5 * C, 1.5 * C, 1.5 * C]} /></mesh>
      {/* 金边/冠 */}
      <mesh position={[0, 1.55 * C, 0]}>{g}<boxGeometry args={[2.7 * C, 0.1 * C, 1.7 * C]} /></mesh>
      <mesh position={[0, 0.05 * C, 0]}>{g}<boxGeometry args={[2.7 * C, 0.1 * C, 1.7 * C]} /></mesh>
      {/* 四个金环 */}
      {[[-1.15, 0.6], [1.15, 0.6], [-1.15, -0.6], [1.15, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x * C, 0.75 * C, z * C]} rotation={[0, 0, Math.PI / 2]}>{g}<torusGeometry args={[0.18 * C, 0.04 * C, 8, 16]} /></mesh>
      ))}
      {/* 两根杠 */}
      <mesh position={[0, 0.75 * C, 1.15 * C]} rotation={[Math.PI / 2, 0, 0]}>{g}<cylinderGeometry args={[0.06 * C, 0.06 * C, 4.2 * C, 12]} /></mesh>
      <mesh position={[0, 0.75 * C, -1.15 * C]} rotation={[Math.PI / 2, 0, 0]}>{g}<cylinderGeometry args={[0.06 * C, 0.06 * C, 4.2 * C, 12]} /></mesh>
      {/* 施恩座 */}
      <mesh position={[0, 1.55 * C, 0]}>{g}<boxGeometry args={[2.5 * C, 0.08 * C, 1.5 * C]} /></mesh>
    </group>
  )
}

function Cherub({ position, onSel, facing = 'center' }: { position: Vec3; onSel: SelFn; facing?: 'center' | 'outward' }) {
  const GOLD = '#f0d060', GOLD_D = '#d8b040'
  const g = mat(GOLD, true), gd = mat(GOLD_D, true)
  const x = position[0] * C, y = position[1] * C, z = position[2] * C
  const s = facing === 'center' ? -1 : 1
  return (
    <group position={[x, y, z]} onClick={(e: any) => { e.stopPropagation(); onSel('cherubim') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 身体 */}
      <mesh position={[0, 4.5 * C, 0]}>{g}<boxGeometry args={[1.2 * C, 9 * C, 1.0 * C]} /></mesh>
      {/* 头 */}
      <mesh position={[0, 9.4 * C, 0]}>{gd}<sphereGeometry args={[0.7 * C, 16, 16]} /></mesh>
      {/* 外翼（达墙） */}
      <mesh position={[s * 4.5 * C, 7 * C, 0]} rotation={[0, 0, s * 0.55]}>{g}<boxGeometry args={[7 * C, 0.3 * C, 3.2 * C]} /></mesh>
      {/* 内翼（相接） */}
      <mesh position={[s * 1.2 * C, 7 * C, 0]} rotation={[0, 0, s * -0.35]}>{g}<boxGeometry args={[5 * C, 0.3 * C, 3.2 * C]} /></mesh>
    </group>
  )
}

function Menorah({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const GOLD = '#f0d060', FLAME = '#ffcc40'
  const g = mat(GOLD, true)
  const f = mat(FLAME, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('lampstand') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 主干 */}
      <mesh position={[0, 2.5 * C, 0]}>{g}<cylinderGeometry args={[0.12 * C, 0.15 * C, 5 * C, 12]} /></mesh>
      {/* 底座 */}
      <mesh position={[0, 0.15 * C, 0]}>{g}<cylinderGeometry args={[0.55 * C, 0.6 * C, 0.3 * C, 12]} /></mesh>
      {/* 中焰 */}
      <mesh position={[0, 5.1 * C, 0]}>{f}<sphereGeometry args={[0.22 * C, 12, 12]} /></mesh>
      {/* 三对枝 */}
      {[-1, 1].map((side) => (
        [1.4, 2.6, 3.8].map((h, i) => {
          const angle = side * (0.55 + i * 0.18)
          const dx = Math.sin(angle) * 1.6 * C
          const dy = Math.cos(angle) * 1.6 * C
          return (
            <group key={`${side}-${i}`}>
              <mesh position={[dx * 0.5, (h * C) + dy * 0.5, 0]} rotation={[0, 0, -angle]}>{g}<cylinderGeometry args={[0.07 * C, 0.09 * C, 2.0 * C, 10]} /></mesh>
              <mesh position={[dx, h * C + dy, 0]}>{f}<sphereGeometry args={[0.16 * C, 10, 10]} /></mesh>
            </group>
          )
        })
      ))}
    </group>
  )
}

function IncenseAltar({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const GOLD = '#f0d060'
  const g = mat(GOLD, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('incense') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 坛身 1×1×2 */}
      <mesh position={[0, 1 * C, 0]}>{g}<boxGeometry args={[1 * C, 2 * C, 1 * C]} /></mesh>
      {/* 四角 */}
      {[[0.55, 0.55], [0.55, -0.55], [-0.55, 0.55], [-0.55, -0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x * C, 2.05 * C, z * C]}>{g}<coneGeometry args={[0.14 * C, 0.35 * C, 8]} /></mesh>
      ))}
      {/* 顶沿 */}
      <mesh position={[0, 2.02 * C, 0]}>{g}<boxGeometry args={[1.2 * C, 0.06 * C, 1.2 * C]} /></mesh>
      {/* 香烟 */}
      <mesh position={[0, 2.45 * C, 0]}>{mat('#d0c0ff', true, false, 0.55)}<sphereGeometry args={[0.25 * C, 10, 10]} /></mesh>
    </group>
  )
}

function ShowbreadTable({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const GOLD = '#c8a060', BREAD = '#e8b86d'
  const g = mat(GOLD, true), b = mat(BREAD, false)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('table') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 桌面 */}
      <mesh position={[0, 1.4 * C, 0]}>{g}<boxGeometry args={[2 * C, 0.12 * C, 1 * C]} /></mesh>
      {/* 四腿 */}
      {[[0.85, 0.35], [0.85, -0.35], [-0.85, 0.35], [-0.85, -0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x * C, 0.7 * C, z * C]}>{g}<cylinderGeometry args={[0.06 * C, 0.06 * C, 1.4 * C, 8]} /></mesh>
      ))}
      {/* 12 个饼 */}
      {Array.from({ length: 12 }, (_, i) => {
        const ix = (i % 6) - 2.5, iz = i < 6 ? 0.22 : -0.22
        return <mesh key={i} position={[ix * 0.28 * C, 1.55 * C, iz * C]}>{b}<boxGeometry args={[0.24 * C, 0.08 * C, 0.18 * C]} /></mesh>
      })}
    </group>
  )
}

function BronzePillar({ c, id, onSel }: { c: Vec2; id: string; onSel: SelFn }) {
  const BRONZE = '#b87333', BRONZE_D = '#a8632a'
  const b = mat(BRONZE, false, true), bd = mat(BRONZE_D, false, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel(id) }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 柱身 18 肘 */}
      <mesh position={[0, 9 * C, 0]}>{b}<cylinderGeometry args={[1.9 * C, 2.0 * C, 18 * C, 18]} /></mesh>
      {/* 柱顶 5 肘 */}
      <mesh position={[0, 20.5 * C, 0]}>{bd}<cylinderGeometry args={[2.5 * C, 2.0 * C, 5 * C, 18]} /></mesh>
      {/* 百合花装饰 */}
      <mesh position={[0, 22.8 * C, 0]}>{b}<coneGeometry args={[2.6 * C, 0.6 * C, 12]} /></mesh>
      {/* 石榴网子（用环示意） */}
      {[20.2, 20.8, 21.4].map((y, i) => (
        <mesh key={i} position={[0, y * C, 0]} rotation={[Math.PI / 2, 0, 0]}>{bd}<torusGeometry args={[2.15 * C, 0.08 * C, 6, 24]} /></mesh>
      ))}
    </group>
  )
}

function BronzeAltar({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const BRONZE = '#b87333', BRONZE_D = '#a8632a'
  const b = mat(BRONZE, false, true), bd = mat(BRONZE_D, false, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('altar') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 坛基 20×20×10 */}
      <mesh position={[0, 4 * C, 0]}>{bd}<boxGeometry args={[20 * C, 8 * C, 20 * C]} /></mesh>
      <mesh position={[0, 9 * C, 0]}>{b}<boxGeometry args={[14 * C, 2 * C, 14 * C]} /></mesh>
      {/* 四角 */}
      {[[9.7, 9.7], [9.7, -9.7], [-9.7, 9.7], [-9.7, -9.7]].map(([x, z], i) => (
        <mesh key={i} position={[x * C, 10.4 * C, z * C]}>{b}<coneGeometry args={[0.5 * C, 1.2 * C, 6]} /></mesh>
      ))}
      {/* 坛坡（由南向北） */}
      <mesh position={[0, 1.5 * C, 12 * C]} rotation={[0.2, 0, 0]}>{bd}<boxGeometry args={[6 * C, 0.5 * C, 8 * C]} /></mesh>
    </group>
  )
}

function BronzeSea({ c, onSel }: { c: Vec2; onSel: SelFn }) {
  const BRONZE = '#b87333', OX = '#9a6a3a'
  const b = mat(BRONZE, false, true), ox = mat(OX, false, true)
  return (
    <group position={[c[0] * C, 0, c[1] * C]} onClick={(e: any) => { e.stopPropagation(); onSel('sea') }} onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      {/* 十二牛底座（简化为3组方向） */}
      {[0, 1, 2, 3].map((dir) => {
        const angle = (dir * Math.PI) / 2
        const rad = 3.8 * C
        return (
          <group key={dir} rotation={[0, angle, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0, 1 * C, (i - 1) * 2.2 * C + rad]}>{ox}<boxGeometry args={[1.2 * C, 2 * C, 2.2 * C]} /></mesh>
            ))}
          </group>
        )
      })}
      {/* 海盆 */}
      <mesh position={[0, 5 * C, 0]}>{b}<cylinderGeometry args={[5.4 * C, 5.0 * C, 5 * C, 24]} /></mesh>
      {/* 盆沿 */}
      <mesh position={[0, 7.55 * C, 0]}>{b}<torusGeometry args={[5.4 * C, 0.12 * C, 8, 24]} /></mesh>
    </group>
  )
}

// ── 圣殿场景 ──
function TempleScene({ cut, onSel }: { cut: boolean; onSel: SelFn }) {
  const ghost = cut ? 0.1 : 1 // 被剖去的构件以「幽灵面」淡显
  const STONE = '#cfc5b0', CEDAR = '#7a5c3a', COURT = '#8d7f63'

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

      {/* 殿内地板（三个区域） */}
      <Box c={[-40, 0]} size={[20, 20]} base={0} top={0.15} color="#c6b8a0" opacity={0.8} />
      <Box c={[-20, 0]} size={[40, 20]} base={0} top={0.15} color="#c6b8a0" opacity={0.8} />
      <Box c={[15, 0]} size={[10, 20]} base={0} top={0.15} color="#c6b8a0" opacity={0.8} />

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
      <BronzePillar c={[24, -7]} id="jachin" onSel={onSel} />
      <BronzePillar c={[24, 7]} id="boaz" onSel={onSel} />

      {/* 铜祭坛（20×20×10）*/}
      <BronzeAltar c={[45, 0]} onSel={onSel} />

      {/* 铜海（径10·高5，立于十二铜牛）*/}
      <BronzeSea c={[40, -25]} onSel={onSel} />

      {/* ── 内殿陈设（剖视时可见）── */}
      {/* 至圣所：约柜 + 两基路伯 */}
      <Ark c={[-40, 0]} onSel={onSel} />
      <Cherub position={[-40, 0, 6.5]} onSel={onSel} facing="center" />
      <Cherub position={[-40, 0, -6.5]} onSel={onSel} facing="center" />

      {/* 圣所：金香坛 + 金灯台×10 + 陈设饼桌×10 */}
      <IncenseAltar c={[-28, 0]} onSel={onSel} />
      {/* 右五（北） */}
      {[-22, -16, -10, -4, 2].map((x, i) => (
        <group key={`n-${i}`}>
          <Menorah c={[x, 6]} onSel={onSel} />
          <ShowbreadTable c={[x + 2, 3]} onSel={onSel} />
        </group>
      ))}
      {/* 左五（南） */}
      {[-22, -16, -10, -4, 2].map((x, i) => (
        <group key={`s-${i}`}>
          <Menorah c={[x, -6]} onSel={onSel} />
          <ShowbreadTable c={[x + 2, -3]} onSel={onSel} />
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
      {cut && <Label c={[-28, 0]} y={4.5} text="金香坛" tone="gold" />}
      {cut && <Label c={[-16, 6]} y={6} text="金灯台" tone="gold" />}
      {cut && <Label c={[-14, 3]} y={3.5} text="陈设饼桌" tone="gold" />}
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
