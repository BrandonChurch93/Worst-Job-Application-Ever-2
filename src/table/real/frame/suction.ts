import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, PORT } from '../../layout'
import { local, type Zone } from '../zone'

// The draw of the port, seen: streaks of dust that run over the page into the cup while the port pulls. The page gives a shape `loader.draw` whose `v` is how hard the port pulls, 0 to 1.
// `rings` rings of air close on the port, each from `ring[0]` px to `ring[1]` px in `ring[2]` seconds.
// `count` streaks start `far` px from the port and end `near` px from it, each in `seconds` (the slowest and the fastest); `swirl` is how far round the port one turns on its way, in radians; `long` its length at the start and at the cup, `wide` its width, `high` its height over the page at the start, all in px.
export const DRAW = { count: 120, far: 760, near: 40, seconds: [0.4, 0.8], swirl: 1.5, long: [26, 120], wide: 4.6, high: 26, tint: 0x2b2f38, opacity: 0.55, glow: 2.4, rings: 3, ring: [330, 70, 0.55] }

const chance = (i: number, n: number): number => {
  const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453123
  return v - Math.floor(v)
}

const made = new WeakMap<THREE.Object3D, THREE.InstancedMesh>()
const ringed = new WeakMap<THREE.Object3D, THREE.InstancedMesh>()
const at = new THREE.Matrix4()
const turn = new THREE.Quaternion()
const size = new THREE.Vector3()
const place = new THREE.Vector3()
const up = new THREE.Vector3(0, 0, 1)

export function buildSuction(o: THREE.Object3D, z: Zone): void {
  if (z.id !== 'first') return
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.4), new THREE.MeshBasicMaterial({ color: DRAW.tint, transparent: true, opacity: DRAW.opacity, depthWrite: false }), DRAW.count)
  m.name = 'loader.draw'
  m.count = 0
  m.visible = false
  m.frustumCulled = false
  o.add(m)
  made.set(o, m)
  const r = new THREE.InstancedMesh(new THREE.RingGeometry(0.965, 1, 64), new THREE.MeshBasicMaterial({ color: DRAW.tint, transparent: true, opacity: DRAW.opacity * 0.5, depthWrite: false }), DRAW.rings)
  r.name = 'loader.draw.rings'
  r.count = 0
  r.visible = false
  r.frustumCulled = false
  o.add(r)
  ringed.set(o, r)
}

// How hard the port pulls in this frame.
export const drawOf = (ctx: RealContext): number => Math.max(0, Math.min(1, ctx.byId.get('loader.draw')?.v?.[0] ?? 0))

export function poseSuction(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const m = made.get(o)
  if (!m) return
  const pull = drawOf(ctx)
  m.visible = pull > 0.01
  m.count = m.visible ? DRAW.count : 0
  const rings = ringed.get(o)
  if (rings && !m.visible) rings.visible = false
  if (!m.visible) return
  const c = local(z, PORT.x * BALL, PORT.y * BALL)
  for (let i = 0; i < DRAW.count; i++) {
    const period = DRAW.seconds[0]! + (DRAW.seconds[1]! - DRAW.seconds[0]!) * chance(i, 1)
    const u = ctx.time / period + chance(i, 2)
    const f = u - Math.floor(u)
    const lap = Math.floor(u)
    const from = 6.283185307179586 * chance(i + lap * 7, 3)
    const r = DRAW.near + (DRAW.far * (0.45 + 0.55 * chance(i + lap * 3, 4)) - DRAW.near) * Math.pow(1 - f, 1.7)
    const a = from + DRAW.swirl * f * f
    const long = DRAW.long[0]! + (DRAW.long[1]! - DRAW.long[0]!) * f
    const wide = DRAW.wide * pull * Math.sqrt(Math.max(0, Math.sin(Math.PI * f)))
    place.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2] + 3 + DRAW.high * (1 - f))
    turn.setFromAxisAngle(up, a + 0.35)
    m.setMatrixAt(i, at.compose(place, turn, size.set(long, wide, 1)))
  }
  m.instanceMatrix.needsUpdate = true
  const g = ringed.get(o)
  if (!g) return
  g.visible = true
  g.count = DRAW.rings
  turn.identity()
  for (let i = 0; i < DRAW.rings; i++) {
    const u = ctx.time / DRAW.ring[2]! + i / DRAW.rings
    const f = u - Math.floor(u)
    const r = (DRAW.ring[0]! + (DRAW.ring[1]! - DRAW.ring[0]!) * f * f) * (0.4 + 0.6 * pull)
    g.setMatrixAt(i, at.compose(place.set(c[0], c[1], c[2] + 2 + i * 0.3), turn, size.set(r, r, 1)))
  }
  g.instanceMatrix.needsUpdate = true
}
