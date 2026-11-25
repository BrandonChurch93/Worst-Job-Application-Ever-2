import * as THREE from 'three'
import { config } from '../../../config'
import { Random } from '../../../core/random'
import type { PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'
import { ask } from '../assets'
import { zoneAt } from '../../draw'
import { lit } from '../light'
import { zone } from '../zone'
import { backFragment, decalFragment, decalVertex, dropFragment, dropVertex, frontFragment, shellVertex } from './glsl'
import { LAMPS, lightAt, type Light } from './lamps'

export const PART = 'clear-ball'
export const RIN = 0.875
export const DROPS = 64
export const ORDER = { decal: 900000, back: 900001, sweat: 900002, core: 900003, front: 900004 }
const AROUND = 96
const RINGS = 24
const PLUG = 0.085
const SOFT_DIR = new THREE.Vector3(-0.52, 0.5, 0.69).normalize()
const KEY_AWAY = new THREE.Vector2(0.52, -0.5).normalize()
const TIERS = ['corporate', 'office', 'street']
const floors = TIERS.map((id) => ask(`table/art/${id}.webp`, { colour: true }))

// What the page tells the maker about the ball, on the shape's `v`: the share it is closed, the seconds since it closed, how much it sweats.
export interface State { closed: number; since: number; sweat: number }
export const stateOf = (s: Shape): State => ({ closed: clamp01(s.v?.[0] ?? 1), since: Math.max(0, s.v?.[1] ?? 9), sweat: clamp01(s.v?.[2] ?? 0) })

// The two grades of what is seen through the ball: 'bend' bends a picture of the floor in the shell's own drawing, 'true' adds one drawing that carries the scene behind it through the wall.
export type Grade = 'bend' | 'true'
const debug: { grade: Grade; sweat: number | null; open: number | null } = { grade: 'bend', sweat: null, open: null }
export const setGrade = (g: Grade): void => {
  debug.grade = g
}
export const grade = (): Grade => debug.grade
// For a proof sheet alone: holds the sweat or the opening at a number, whatever the shape says. Null gives it back to the shape.
export const hold = (what: 'sweat' | 'open', v: number | null): void => {
  debug[what] = v
}
if (typeof window !== 'undefined') {
  window.addEventListener('wjb-grade', (e) => setGrade((e as CustomEvent).detail === 'true' ? 'true' : 'bend'))
  window.addEventListener('wjb-sweat', (e) => hold('sweat', typeof (e as CustomEvent).detail === 'number' ? (e as CustomEvent).detail : null))
  window.addEventListener('wjb-open', (e) => hold('open', typeof (e as CustomEvent).detail === 'number' ? (e as CustomEvent).detail : null))
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}
const smooth = (v: number): number => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

// The shell: two halves that meet at the seam (y = 0), the two cut faces of the wall, and the plug at +x on the seam. Radius 1.
export function shellGeometry(): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const half: number[] = []
  const kind: number[] = []
  const index: number[] = []
  const put = (p: [number, number, number], n: [number, number, number], u: [number, number], h: number, k: number): number => {
    pos.push(...p)
    nor.push(...n)
    uv.push(...u)
    half.push(h)
    kind.push(k)
    return pos.length / 3 - 1
  }
  const tri = (a: number, b: number, c: number): void => {
    const A = new THREE.Vector3().fromArray(pos, a * 3)
    const B = new THREE.Vector3().fromArray(pos, b * 3)
    const C = new THREE.Vector3().fromArray(pos, c * 3)
    const face = B.clone().sub(A).cross(C.clone().sub(A))
    const want = new THREE.Vector3().fromArray(nor, a * 3).add(new THREE.Vector3().fromArray(nor, b * 3)).add(new THREE.Vector3().fromArray(nor, c * 3))
    if (face.lengthSq() < 1e-14) return
    if (face.dot(want) >= 0) index.push(a, b, c)
    else index.push(a, c, b)
  }
  for (const h of [1, -1]) {
    const rows: number[][] = []
    for (let i = 0; i <= RINGS; i++) {
      const lat = (i / RINGS) * (Math.PI / 2)
      const y = Math.sin(lat) * h
      const r = Math.cos(lat)
      const row: number[] = []
      for (let j = 0; j <= AROUND; j++) {
        const a = (j / AROUND) * Math.PI * 2
        const p: [number, number, number] = [Math.cos(a) * r, y, Math.sin(a) * r]
        row.push(put(p, p, [0, 0], h, 0))
      }
      rows.push(row)
    }
    for (let i = 0; i < RINGS; i++)
      for (let j = 0; j < AROUND; j++) {
        tri(rows[i]![j]!, rows[i]![j + 1]!, rows[i + 1]![j + 1]!)
        tri(rows[i]![j]!, rows[i + 1]![j + 1]!, rows[i + 1]![j]!)
      }
    const inner: number[] = []
    const outer: number[] = []
    for (let j = 0; j <= AROUND; j++) {
      const a = (j / AROUND) * Math.PI * 2
      inner.push(put([Math.cos(a) * RIN, 0, Math.sin(a) * RIN], [0, -h, 0], [0, 0], h, 1))
      outer.push(put([Math.cos(a), 0, Math.sin(a)], [0, -h, 0], [0, 0], h, 1))
    }
    for (let j = 0; j < AROUND; j++) {
      tri(inner[j]!, outer[j]!, outer[j + 1]!)
      tri(inner[j]!, outer[j + 1]!, inner[j + 1]!)
    }
  }
  const mid = put([1.0015, 0, 0], [1, 0, 0], [0, 0], 1, 2)
  const rim: number[] = []
  for (let j = 0; j <= 28; j++) {
    const a = (j / 28) * Math.PI * 2
    rim.push(put([1.0015, Math.sin(a) * PLUG, Math.cos(a) * PLUG], [1, 0, 0], [Math.cos(a), Math.sin(a)], 1, 2))
  }
  for (let j = 0; j < 28; j++) tri(mid, rim[j]!, rim[j + 1]!)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('aHalf', new THREE.Float32BufferAttribute(half, 1))
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1))
  g.setIndex(index)
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 3.2)
  return g
}

// Where the drops of sweat sit on the inner wall, from the seed alone.
export function dropPlaces(seed: number): { at: THREE.Vector3; size: number; order: number }[] {
  const rnd = new Random(seed, 'ball.sweat')
  const out: { at: THREE.Vector3; size: number; order: number }[] = []
  for (let i = 0; i < DROPS; i++) {
    const z = rnd.range(-1, 1)
    const a = rnd.range(0, Math.PI * 2)
    const r = Math.sqrt(1 - z * z)
    out.push({ at: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z), size: rnd.range(0.022, 0.05), order: rnd.next() })
  }
  return out
}

let shared: { shell: THREE.BufferGeometry; drop: THREE.BufferGeometry; plane: THREE.BufferGeometry; core: THREE.BufferGeometry; grey: THREE.DataTexture } | null = null
const kit = (): NonNullable<typeof shared> => {
  if (shared) return shared
  const grey = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1)
  grey.needsUpdate = true
  shared = { shell: shellGeometry(), drop: new THREE.IcosahedronGeometry(1, 1), plane: new THREE.PlaneGeometry(2, 2), core: new THREE.SphereGeometry(1, 48, 32), grey }
  return shared
}

interface Own {
  roll: THREE.Group
  decal: THREE.Mesh
  back: THREE.Mesh
  sweat: THREE.InstancedMesh
  core: THREE.Mesh
  front: THREE.Mesh
  u: Record<string, THREE.IUniform>
  d: Record<string, THREE.IUniform>
}

const lightUniforms = (): Record<string, THREE.IUniform> => ({
  uEye: { value: new THREE.Vector3(0, 0, 1000) },
  uToPage: { value: new THREE.Matrix4() },
  uSoft: { value: new THREE.Vector3(1, 1, 1) },
  uSoftDir: { value: SOFT_DIR.clone() },
  uHaze: { value: new THREE.Vector3(0.02, 0.02, 0.02) },
  uFloor: { value: new THREE.Vector3(1, 1, 1) },
  uGround: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
  uLampPos: { value: Array.from({ length: LAMPS }, () => new THREE.Vector3(0, 0, 1000)) },
  uLampCol: { value: Array.from({ length: LAMPS }, () => new THREE.Vector3(0, 0, 0)) },
  uR: { value: 48 },
  uArt: { value: null },
  uArtOn: { value: 0 },
  uBallUv: { value: new THREE.Vector2(0.5, 0.5) },
  uDrop: { value: 0 },
  uTrue: { value: 0 },
  uPlugTurn: { value: 0 },
  uOpen: { value: 0 },
  uSweat: { value: 0 }
})

const BASE = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -1.05, 0.35, 'ZYX'))
const OPEN = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -1.2, 0, 'ZYX'))
const qx = new THREE.Quaternion()
const qy = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const inv = new THREE.Matrix4()
const shift = new THREE.Matrix4()
const eye = new THREE.Vector3()

// How the ball is turned at a place on the page: it rolls without slipping, so the turn is a law of the place alone.
export function rollAt(x: number, y: number, r: number, into = new THREE.Quaternion()): THREE.Quaternion {
  qy.setFromAxisAngle(Y, x / r)
  qx.setFromAxisAngle(X, y / r)
  return into.copy(qy).multiply(qx).multiply(BASE)
}

function build(s: Shape): THREE.Group {
  const k = kit()
  const r = s.w / 2
  const root = new THREE.Group()
  root.name = 'ball'
  const u = lightUniforms()
  u.uR!.value = r
  u.uArt!.value = k.grey
  const z = zone(zoneAt(s.y + s.h / 2))
  const mat = (fragmentShader: string, vertexShader: string, side: THREE.Side, depthTest = true): THREE.ShaderMaterial => {
    const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader, fragmentShader, side, transparent: true, depthWrite: false, depthTest, premultipliedAlpha: true })
    m.userData.unlit = true
    return lit(m, z)
  }
  const roll = new THREE.Group()
  roll.name = 'ball.roll'
  roll.position.set(0, 0, r)
  roll.scale.setScalar(r)
  root.add(roll)

  const d: Record<string, THREE.IUniform> = {
    uShade: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
    uSpot: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uR: { value: r },
    uNear: { value: 0 },
    uLift: { value: 0 },
    uSize: { value: r * 3 }
  }
  const dm = new THREE.ShaderMaterial({ uniforms: d, vertexShader: decalVertex, fragmentShader: decalFragment, transparent: true, depthWrite: false, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  dm.userData.unlit = true
  const decal = new THREE.Mesh(k.plane, lit(dm, z))
  decal.name = 'ball.shadow'
  decal.scale.setScalar(r * 3)
  root.add(decal)

  const back = new THREE.Mesh(k.shell, mat(backFragment, shellVertex, THREE.BackSide))
  back.name = 'ball.back'
  const front = new THREE.Mesh(k.shell, mat(frontFragment, shellVertex, THREE.FrontSide))
  front.name = 'ball.front'
  const sweat = new THREE.InstancedMesh(k.drop.clone(), mat(dropFragment, dropVertex, THREE.DoubleSide), DROPS)
  sweat.name = 'ball.sweat'
  sweat.userData.fine = true
  const seeds = new Float32Array(DROPS)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const Z = new THREE.Vector3(0, 0, 1)
  dropPlaces(config.seed).forEach((p, i) => {
    q.setFromUnitVectors(Z, p.at)
    m4.compose(p.at.clone().multiplyScalar(RIN - p.size * 0.35), q, new THREE.Vector3(p.size, p.size * (0.8 + 0.4 * p.order), p.size * 0.55))
    sweat.setMatrixAt(i, m4)
    seeds[i] = p.order
  })
  sweat.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  sweat.instanceMatrix.needsUpdate = true
  sweat.frustumCulled = false

  const cm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 0.6, ior: 1.45, roughness: 0, metalness: 0, specularIntensity: 0, depthWrite: false })
  cm.userData.unlit = true
  const core = new THREE.Mesh(k.core, lit(cm, z))
  core.name = 'ball.core'
  core.visible = false

  const order: [THREE.Mesh, number][] = [[decal, ORDER.decal], [back, ORDER.back], [sweat, ORDER.sweat], [core, ORDER.core], [front, ORDER.front]]
  for (const [m, o] of order) {
    m.userData.order = o
    m.renderOrder = o
    m.castShadow = false
    m.receiveShadow = false
    if (m !== decal) roll.add(m)
  }
  front.onBeforeRender = (_r, _s, camera) => {
    const parent = root.parent
    if (parent) inv.copy(parent.matrixWorld).invert()
    else inv.identity()
    shift.makeTranslation(-root.position.x, -root.position.y, -root.position.z)
    ;(u.uToPage!.value as THREE.Matrix4).multiplyMatrices(shift, inv)
    eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(u.uToPage!.value as THREE.Matrix4)
    ;(u.uEye!.value as THREE.Vector3).copy(eye)
  }
  back.onBeforeRender = front.onBeforeRender
  const own: Own = { roll, decal, back, sweat, core, front, u, d }
  root.userData.ball = own
  return root
}

function pose(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const own = o.userData.ball as Own
  const { u, d } = own
  const r = s.w / 2
  const L: Light = lightAt(s, ctx)
  const st = stateOf(s)
  const open = debug.open ?? 1 - st.closed
  const wet = debug.sweat ?? st.sweat
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2

  rollAt(cx, -cy, r, own.roll.quaternion)
  if (open > 0) own.roll.quaternion.slerp(OPEN, smooth(open * 4))

  ;(u.uSoft!.value as THREE.Vector3).fromArray(L.soft)
  ;(u.uHaze!.value as THREE.Vector3).fromArray(L.haze)
  ;(u.uFloor!.value as THREE.Vector3).fromArray(L.floor)
  const pos = u.uLampPos!.value as THREE.Vector3[]
  const col = u.uLampCol!.value as THREE.Vector3[]
  for (let i = 0; i < LAMPS; i++) {
    const l = L.lamps[i]
    if (l) {
      pos[i]!.set(l.x, l.y, l.z)
      col[i]!.set(l.colour[0] * l.amount, l.colour[1] * l.amount, l.colour[2] * l.amount)
    } else {
      pos[i]!.set(0, 0, 1000)
      col[i]!.set(0, 0, 0)
    }
  }
  const art = L.zone.tier >= 0 ? floors[L.zone.tier] : undefined
  const ready = !!art && art.ready()
  u.uArt!.value = ready ? art!.texture() : kit().grey
  u.uArtOn!.value = ready ? 1 : 0
  ;(u.uBallUv!.value as THREE.Vector2).set(cx / 1920, 1 - (cy - L.zone.top) / 1080)
  u.uDrop!.value = L.drop
  u.uTrue!.value = debug.grade === 'true' ? 1 : 0
  u.uOpen!.value = open
  u.uPlugTurn!.value = (1 - smooth(st.since / 0.6)) * 2.4 + open * 1.2
  u.uSweat!.value = wet
  own.sweat.visible = wet > 0.01
  own.core.visible = debug.grade === 'true' && open < 0.01

  const lift = -L.drop
  own.decal.visible = L.tier && lift < r * 6
  own.decal.position.set(0, 0, L.drop + 0.6)
  const shade = d.uShade!.value as THREE.Vector4[]
  const spot = d.uSpot!.value as THREE.Vector3[]
  const lum = (c: number[]): number => 0.25 * c[0]! + 0.6 * c[1]! + 0.15 * c[2]!
  const high = 1 / (1 + lift / (r * 2.5))
  const dim = 1 - 0.7 * open
  const key = Math.min(1, lum(L.soft) * 2.2)
  shade[0]!.set(KEY_AWAY.x, KEY_AWAY.y, 0.8, 0.42 * key * high)
  spot[0]!.set(L.soft[0] * 0.5 * high * dim, L.soft[1] * 0.5 * high * dim, L.soft[2] * 0.5 * high * dim)
  const low = L.lamps.filter((l) => l.z - L.drop > 16 && l.amount > 0.03 && Math.hypot(l.x, l.y) > r * 0.8)
  for (let i = 1; i < 3; i++) {
    const l = low[i - 1]
    if (!l) {
      shade[i]!.set(1, 0, 0, 0)
      spot[i]!.set(0, 0, 0)
      continue
    }
    const flat = Math.hypot(l.x, l.y)
    const slant = Math.min(1.6, flat / Math.max(20, l.z - L.drop))
    shade[i]!.set(-l.x / flat, -l.y / flat, slant, Math.min(0.5, 0.45 * lum(l.colour) * l.amount) * high)
    const gain = 0.45 * Math.min(1.5, l.amount) * high * dim
    spot[i]!.set(l.colour[0] * gain, l.colour[1] * gain, l.colour[2] * gain)
  }
  d.uNear!.value = Math.max(0, 1 - lift / (r * 0.6))
  d.uLift!.value = lift
}

const maker: PartMaker = {
  key: (s) => (s.kind === 'ball' ? `ball|${s.w}` : null),
  make: (s) => build(s),
  pose,
  drop(o) {
    const own = o.userData.ball as Own | undefined
    if (!own) return
    for (const m of [own.decal, own.back, own.sweat, own.core, own.front]) (m.material as THREE.Material).dispose()
    own.sweat.geometry.dispose()
    own.sweat.dispose()
  }
}

export const parts: Record<string, PartMaker | null> = { [PART]: maker }
