import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { block } from '../../../shell/metrics'
import { setRun, type Style } from '../../../shell/real/type'
import { arc, outlineOf, profile, roundedRect, sweep, type ProfilePoint } from '../../../shell/solids'
import { words } from '../../../shell/words'
import type { Shape } from '../../../stage/types'
import { hash01 } from '../../../core/random'
import { markOf } from '../layout'
import { HIT, LIE } from '../script'
import { studio } from '../../../post/studio'
import { stock } from './letterStock'
import { INK, ink } from './stampInk'

const q = (v: number): number => Math.round(v * 4) / 4
const WHITE: [number, number, number] = [1, 1, 1]
const PRINT: Style = { setting: 'flat', fill: WHITE, lean: 0, rings: [{ d: 1.7, a: 1, c: WHITE }, { d: 2.4, a: 0.5, c: WHITE }] }
const FRAME = { r: 12, inner: 14, thin: 3.4, feather: 0.7 }
const PAD = { in: 2.2, foam: 1, tall: 16, gap: 5 }

const GRAIN = { die: 22, coat: 46 }
const BELLY = 2.4
// Struck, the block is shorter and a little broader for a frame.
const SQUASH = { z: 0.2, seconds: 0.028, spread: 0.1 }
let roughMade: THREE.Texture | null = null

// The tooth of the letter's stock, used again as the grain of the rubber and the faint orange peel of the lacquer.
function rough(): THREE.Texture {
  roughMade ??= stock().tooth
  return roughMade
}

let lacquerMade: THREE.MeshPhysicalMaterial | null = null
function lacquer(): THREE.MeshPhysicalMaterial {
  lacquerMade ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0xb8120a, THREE.SRGBColorSpace), roughness: 0.46, metalness: 0, specularIntensity: 0.3, clearcoat: 1, clearcoatRoughness: 0.07, clearcoatNormalMap: rough(), clearcoatNormalScale: new THREE.Vector2(0.05, 0.05), envMapIntensity: 0.3 }))
  lacquerMade.name = 'stamp-lacquer'
  return lacquerMade
}

let dieMade: THREE.MeshPhysicalMaterial | null = null
function die(): THREE.MeshPhysicalMaterial {
  dieMade ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x4d0f0e, THREE.SRGBColorSpace), roughness: 0.92, metalness: 0, specularIntensity: 0.25, normalMap: rough(), normalScale: new THREE.Vector2(3.5, 3.5) }))
  dieMade.name = 'stamp-die'
  return dieMade
}

// A sweep's own uv is its place on the page, which does not change up a wall. This lays the grain across walls and tops alike.
function grained(g: THREE.BufferGeometry, tile: number): THREE.BufferGeometry {
  const pos = g.getAttribute('position')
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + pos.getZ(i) * 0.83) / tile
    uv[i * 2 + 1] = (pos.getY(i) + pos.getZ(i) * 0.61) / tile
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g
}

function solid(g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

function blockOf(s: Shape): THREE.Object3D {
  const m = materials()
  const h = s.z1 - s.z0
  const root = new THREE.Group()
  const half = Math.min(s.w, s.h) / 2
  const pad: ProfilePoint[] = [[PAD.in + 0.8, 0.2, true], [PAD.in, 1], [PAD.in, PAD.tall - 0.6], [PAD.in + 0.6, PAD.tall], [PAD.in + 5, PAD.tall, true]]
  root.add(solid(grained(sweep(outlineOf(s, 0, 12), profile(pad)), GRAIN.die), die()))
  root.add(solid(sweep(outlineOf(s, 0, 12), profile([[PAD.foam, PAD.tall - 0.4, true], [PAD.foam, PAD.tall + PAD.gap + 0.2, true], [PAD.foam + 4, PAD.tall + PAD.gap + 0.2, true]]), false), m.rubber))
  const round = 20
  const top = h - 0.7
  const foot = PAD.tall + PAD.gap
  const wall = top - round - foot - 3
  const belly = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1].map((u): ProfilePoint => [BELLY * (2 * u - 1) * (2 * u - 1), foot + 3 + wall * u])
  const body: ProfilePoint[] = [[BELLY + 1.6, foot - 0.4, true], [BELLY + 0.3, foot + 1.2], ...belly, ...arc(BELLY, top - round, round, round, 12).slice(1)]
  root.add(solid(grained(sweep(outlineOf(s, 0, 12), profile(body)), GRAIN.coat), lacquer()))
  return root
}

function gripOf(s: Shape): THREE.Object3D {
  const h = s.z1 - s.z0
  const half = Math.min(s.w, s.h) / 2
  const neck = Math.min(12, half * 0.45)
  const dome = Math.min(13, half - 3)
  const top = h - 3
  const r = half * 0.86
  const end = r - 2
  const points: ProfilePoint[] = [
    [0.4, 3.6, true], [neck * 0.55, 5.5], [neck, 10], [neck, h * 0.42], [neck * 0.5, h * 0.55], [1.5, h * 0.64], [1, top - dome],
    ...arc(1, top - dome, dome, dome, 12).slice(1),
    ...[0.8, 0.6, 0.4, 0.2, 0].map((t): ProfilePoint => [end - (end - dome - 1) * t, top + 3 * (1 - t * t)])
  ]
  const root = new THREE.Group()
  const outline = outlineOf({ ...s, kind: 'box', r }, 0, 20)
  root.add(solid(sweep(outline, profile([[-3, 0, true], [-3, 3], [-2.2, 3.9], [1.2, 3.9, true]]), false), materials().chrome))
  root.add(solid(grained(sweep(outline, profile(points)), GRAIN.coat), lacquer()))
  return root
}

function inked(position: ArrayLike<number>, colour: ArrayLike<number>, index: ArrayLike<number>, w: number, h: number, ox: number, oy: number): THREE.BufferGeometry {
  const n = position.length / 3
  const uv = new Float32Array(n * 2)
  const nor = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    uv[i * 2] = (position[i * 3]! + ox) / (w + INK.pad * 2) + 0.5
    uv[i * 2 + 1] = (position[i * 3 + 1]! + oy) / (h + INK.pad * 2) + 0.5
    nor[i * 3 + 2] = 1
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(position), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(colour), 4))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(Array.from(index))
  return g
}

const TWICE = { dx: 1.9, dy: -1.2, ink: 0.26 }
let faintMade: THREE.Material | null = null

// The block rocked as it left, so the mark is printed twice: once full, and once faint a little to one side.
function print(g: THREE.BufferGeometry): THREE.Object3D {
  const root = new THREE.Group()
  if (!faintMade) {
    const twin = studio(ink().material.clone())
    twin.opacity = TWICE.ink
    twin.name = 'stamp-ink-faint'
    faintMade = twin
  }
  const faint = new THREE.Mesh(g, faintMade)
  faint.position.set(TWICE.dx, TWICE.dy, 0.06)
  const full = new THREE.Mesh(g, ink().material)
  full.position.z = 0.07
  for (const mesh of [faint, full]) {
    mesh.receiveShadow = true
    mesh.castShadow = false
    root.add(mesh)
  }
  return root
}

// The border the rubber leaves: a heavy line and a fine one inside it, both with soft edges.
function frameOf(): THREE.Object3D {
  const m = markOf()
  const per = 8
  const n = (per + 1) * 4
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const f = FRAME.feather
  const bands: [number, number][] = [[0, m.bar], [FRAME.inner, FRAME.inner + FRAME.thin]]
  for (const [from, to] of bands) {
    const base = pos.length / 3
    const rings: [number, number][] = [[from - f, 0], [from + f, 1], [to - f, 1], [to + f, 0]]
    for (const [inset, a] of rings) {
      const o = roundedRect(m.w - inset * 2, m.h - inset * 2, Math.max(1, FRAME.r - inset), per)
      for (let i = 0; i < n; i++) {
        pos.push(o.x[i]!, o.y[i]!, 0)
        col.push(1, 1, 1, a)
      }
    }
    for (let k = 0; k < rings.length - 1; k++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        idx.push(base + k * n + i, base + k * n + j, base + (k + 1) * n + i, base + k * n + j, base + (k + 1) * n + j, base + (k + 1) * n + i)
      }
    }
  }
  const lift = (m.h - m.bar) / 2
  const g = inked(pos, col, idx, m.w, m.h, 0, 0)
  g.translate(0, -lift, 0)
  return print(g)
}

function wordOf(s: Shape): THREE.Object3D {
  const m = markOf()
  const t = s.type!
  const said = words(s.words!, s.text)
  const b = block(t.font, said, t.px, t.wrap, t.lead)
  const data = setRun({ font: t.font, px: t.px, lines: b.lines, align: t.align ?? 'left', x: 0, y: s.h / 2 - b.cap, lead: b.lead, style: PRINT })
  const pos = Float32Array.from(data.position)
  for (let i = 2; i < pos.length; i += 3) pos[i] = 0
  return print(inked(pos, data.colour, data.index, m.w, m.h, 0, 0))
}

const DUST = { seed: INK.seed + 41, motes: 96, fan: 8, colour: 0xb3ab9e, slow: 0.17 }

interface Mote { x: number; y: number; nx: number; ny: number; speed: number; r: number; grow: number; a: number }

function motes(): Mote[] {
  const m = markOf()
  const hw = m.blockW / 2
  const hh = m.blockH / 2
  const out: Mote[] = []
  for (let i = 0; i < DUST.motes; i++) {
    const h = (k: number) => hash01(i, k, DUST.seed)
    const along = h(1) * (hw + hh) * 2
    const flip = h(2) < 0.5 ? -1 : 1
    const onLong = along < hw * 2
    const x = onLong ? along - hw : flip * hw
    const y = onLong ? flip * hh : along - hw * 2 - hh
    const spread = (h(3) - 0.5) * 0.9
    const bx = onLong ? spread : flip
    const by = onLong ? flip : spread
    const l = Math.hypot(bx, by)
    const speck = h(4) < 0.42
    out.push({ x, y, nx: bx / l, ny: by / l, speed: speck ? 500 + h(5) * 800 : 220 + h(5) * 460, r: speck ? 0.8 + h(6) * 1.2 : 8 + h(6) * 14, grow: speck ? 0 : 90, a: speck ? 0.7 : 0.07 + h(7) * 0.09 })
  }
  return out
}

function dustOf(): THREE.Mesh {
  const list = motes()
  const per = DUST.fan + 1
  const pos = new Float32Array(list.length * per * 3)
  const col = new Float32Array(list.length * per * 4)
  const idx: number[] = []
  list.forEach((mote, i) => {
    const base = i * per
    col.set([1, 1, 1, mote.a], base * 4)
    for (let k = 0; k < DUST.fan; k++) {
      col.set([1, 1, 1, 0], (base + 1 + k) * 4)
      idx.push(base, base + 1 + k, base + 1 + ((k + 1) % DUST.fan))
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 4))
  g.setIndex(idx)
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHex(DUST.colour, THREE.SRGBColorSpace), vertexColors: true, transparent: true, depthWrite: false }))
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.userData.motes = list
  return mesh
}

function blow(mesh: THREE.Mesh, age: number): void {
  const list = mesh.userData.motes as Mote[]
  const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  const per = DUST.fan + 1
  const gone = DUST.slow * (1 - Math.exp(-age / DUST.slow))
  list.forEach((mote, i) => {
    const cx = mote.x + mote.nx * mote.speed * gone
    const cy = mote.y + mote.ny * mote.speed * gone
    const r = mote.r + mote.grow * gone
    const z = 0.4 + (mote.grow > 0 ? 14 : 30) * gone
    pos.setXYZ(i * per, cx, cy, z)
    for (let k = 0; k < DUST.fan; k++) {
      const a = (k / DUST.fan) * Math.PI * 2
      pos.setXYZ(i * per + 1 + k, cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)
    }
  })
  pos.needsUpdate = true
  const left = Math.max(0, 1 - age / HIT.dustSeconds)
  ;(mesh.material as THREE.MeshBasicMaterial).opacity = left * left * Math.min(1, age / 0.02)
}

export const stamp: PartMaker | null = {
  key(s) {
    if (s.id === 'letter-stamp') return `word:${s.type!.font}:${s.type!.px}:${q(s.w)}:${q(s.h)}:${words(s.words!, s.text)}`
    if (s.kind === 'text') return null
    if (s.id === 'letter-mark-top') return `frame:${q(s.w)}:${q(s.h)}`
    if (s.id.startsWith('letter-mark-')) return ''
    if (s.role === 'dust') return 'dust'
    if (s.role === 'stampBlock') return `block:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    if (s.role === 'stampGrip') return `grip:${q(s.w)}:${q(s.h)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s) {
    if (s.id === 'letter-stamp') return wordOf(s)
    if (s.id === 'letter-mark-top') return frameOf()
    if (s.role === 'dust') return dustOf()
    if (s.role === 'stampGrip') return gripOf(s)
    return blockOf(s)
  },
  pose(o, s, ctx) {
    if (s.role === 'dust') {
      blow(o as THREE.Mesh, s.v?.[0] ?? 0)
      return
    }
    if (s.role !== 'stampBlock' && s.role !== 'stampGrip') return
    const age = s.v?.[0] ?? HIT.over
    const down = s.v?.[1] ?? HIT.over
    const lean = s.v?.[2] ?? 0
    const rock = HIT.rock * Math.exp(-age / HIT.rockSeconds) * Math.cos(age * HIT.rockRate) + HIT.landRock * Math.exp(-down / 0.09) * Math.cos(down * 44)
    const give = HIT.give * Math.exp(-age / HIT.giveSeconds)
    const base = ctx.byId.get('stamp-block')
    const up = base ? s.z0 - base.z0 : 0
    const tall = base ? base.h / 2 : s.h / 2
    const grip = ctx.byId.get('stamp-grip')
    const whole = base && grip ? grip.z1 - base.z0 : s.z1 - s.z0
    const roll = -LIE.turn * (s.v?.[3] ?? 1)
    const a = lean + rock + roll
    const flat = Math.abs(Math.sin(roll))
    const along = -up * Math.sin(a) - (whole / 2) * flat
    const turn = o.rotation.z
    o.rotation.order = 'ZYX'
    o.rotation.x += a
    o.position.x -= along * Math.sin(turn)
    o.position.y += along * Math.cos(turn)
    const k = s.v?.[4] ?? 1
    const press = SQUASH.z * Math.exp(-age / SQUASH.seconds)
    o.position.z += up * (Math.cos(a) - 1) * k - give + (Math.abs(Math.sin(rock)) + flat) * tall - up * press
    o.scale.set(k * (1 + press * SQUASH.spread), k * (1 + press * SQUASH.spread), 1 - press)
  },
  drop(o) {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (!m.isMesh) return
      m.geometry.dispose()
      if (m.userData.motes) (m.material as THREE.Material).dispose()
    })
  }
}
