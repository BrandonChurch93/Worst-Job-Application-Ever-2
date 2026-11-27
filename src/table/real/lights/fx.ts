import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import type { Shape } from '../../../stage/types'
import { zoneAt } from '../../draw'
import { BALL } from '../../layout'
import { lit } from '../light'
import { local, type Zone } from '../zone'

// What a strike throws out, in balls and seconds. A strike is a shape `fx.<serial>` of this part whose `v` is its age, how hard it was (1 to 3), its loot (0 none, 1 coins, 2 paper) and its serial.
// The shape `fx.hero` is the ball with the arrow in it, at its middle, with the camera's eye as page x, page y and height in `v`: no spark and no flash is drawn over it. `berth` is how far from the ball's middle they stay as the camera sees it, and `berthFar` how much further off than the ball a thing may be and still be moved. While the fourth number of its `v` is 1 the ball stands on a dark disc of radius `back` and darkness `backDark` and wears a ring of light of radius `rim`.
export const FX = {
  strikes: 14,
  sparks: [0, 8, 14, 22],
  sparkSeconds: 0.42,
  sparkSpeed: [5, 17],
  sparkRise: [2, 11],
  sparkFall: 34,
  sparkLong: 0.045,
  sparkWide: 0.05,
  ringSeconds: 0.3,
  ringTo: [0, 1.1, 1.6, 2.2],
  coreSeconds: 0.12,
  core: [0, 0.22, 0.32, 0.42],
  lightSeconds: 0.28,
  light: [0, 0.5, 0.9, 1.4],
  lightReach: 4.5,
  coins: [0, 4, 8, 6],
  coinR: 0.17,
  coinThick: 0.045,
  coinOut: [1.5, 6.5],
  coinUp: [7, 13],
  coinFall: 30,
  coinBounce: 0.38,
  coinSeconds: 1.25,
  coinFade: 0.25,
  coinSpin: 26,
  papers: [0, 3, 5, 7],
  paper: [0.52, 0.36],
  paperOut: [1, 4],
  paperUp: [5, 9],
  paperFall: 11,
  paperSeconds: 1.65,
  berth: 0.66,
  berthFar: 2.5,
  back: 0.6,
  backDark: 0.6,
  rim: 0.74
}
const HOT: [number, number, number][] = [[3.2, 2.6, 1.6], [3.4, 1.9, 0.5], [3.6, 3.4, 2.8]]
const GLOW: [number, number, number] = [1, 0.72, 0.36]
const RIM: [number, number, number] = [0.3, 1.5, 2.4]

// One number from 0 to 1 for a strike's serial and a count: the same in every run.
export const chance = (serial: number, n: number): number => {
  const v = Math.sin(serial * 127.1 + n * 311.7) * 43758.5453123
  return v - Math.floor(v)
}
const span = (r: number[], u: number): number => r[0]! + (r[1]! - r[0]!) * u

export interface Fx { sparks: THREE.InstancedMesh; rings: THREE.InstancedMesh; cores: THREE.InstancedMesh; coins: THREE.InstancedMesh; papers: THREE.InstancedMesh; back: THREE.Mesh; rim: THREE.Mesh }
const made = new WeakMap<THREE.Object3D, Fx>()

const glow = (): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })

export function buildFx(group: THREE.Object3D, z: Zone): void {
  if (z.tier < 0) return
  const n = FX.strikes
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, count: number, name: string): THREE.InstancedMesh => {
    const o = new THREE.InstancedMesh(g, m, count)
    o.name = name
    o.count = 0
    o.frustumCulled = false
    o.setColorAt(0, new THREE.Color(1, 1, 1))
    group.add(o)
    return o
  }
  const sparks = mesh(new THREE.OctahedronGeometry(1, 0).scale(1, 0.5, 0.5), glow(), n * FX.sparks[3]!, 'fx-sparks')
  const rings = mesh(new THREE.RingGeometry(0.9, 1, 40), glow(), n, 'fx-rings')
  const cores = mesh(new THREE.SphereGeometry(1, 16, 10), glow(), n, 'fx-cores')
  const gold = lit(studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(1, 0.76, 0.22), metalness: 1, roughness: 0.28, emissive: new THREE.Color(0.5, 0.3, 0.04), envMapIntensity: 1.2 })), z)
  const coins = mesh(new THREE.CylinderGeometry(FX.coinR * BALL, FX.coinR * BALL, FX.coinThick * BALL, 18).rotateX(Math.PI / 2), gold, n * FX.coins[3]!, 'fx-coins')
  const sheet = lit(studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.93, 0.93, 0.9), metalness: 0, roughness: 0.8, emissive: new THREE.Color(0.22, 0.22, 0.21), side: THREE.DoubleSide })), z)
  const papers = mesh(new THREE.PlaneGeometry(FX.paper[0]! * BALL, FX.paper[1]! * BALL), sheet, n * FX.papers[3]!, 'fx-papers')
  for (const o of [sparks, rings, cores]) {
    o.renderOrder = 6
    o.userData.order = 6
  }
  const back = new THREE.Mesh(new THREE.CircleGeometry(FX.back * BALL, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: FX.backDark, depthWrite: false, toneMapped: false }))
  const rim = new THREE.Mesh(new THREE.RingGeometry(FX.rim * BALL * 0.84, FX.rim * BALL, 48), glow())
  ;(rim.material as THREE.MeshBasicMaterial).color.setRGB(RIM[0], RIM[1], RIM[2])
  back.name = 'fx-hero-back'
  rim.name = 'fx-hero-rim'
  for (const [o, order] of [[back, 5], [rim, 7]] as const) {
    o.visible = false
    o.frustumCulled = false
    o.renderOrder = order
    o.userData.order = order
    group.add(o)
  }
  made.set(group, { sparks, rings, cores, coins, papers, back, rim })
}

const at = new THREE.Matrix4()
const turn = new THREE.Quaternion()
const size = new THREE.Vector3()
const place = new THREE.Vector3()
const axis = new THREE.Vector3()
const along = new THREE.Vector3(1, 0, 0)
const tint = new THREE.Color()
const spin = new THREE.Euler()
const eye = new THREE.Vector3()
const hero = new THREE.Vector3()
const ray = new THREE.Vector3()
const off = new THREE.Vector3()
const UP = new THREE.Vector3(0, 0, 1)

// Moves a glowing thing of radius `r` sideways, as the camera sees it, until it stands clear of the ball with the arrow.
function clear(p: THREE.Vector3, r: number, on: boolean): void {
  if (!on) return
  ray.copy(p).sub(eye)
  const far = ray.length()
  if (far < 1e-6) return
  ray.multiplyScalar(1 / far)
  const along = off.copy(hero).sub(eye).dot(ray)
  if (along <= 0 || far > along * FX.berthFar) return
  off.copy(eye).addScaledVector(ray, along).sub(hero)
  const gap = off.length()
  const need = FX.berth * BALL + r
  if (gap >= need) return
  if (gap < 1e-3) off.crossVectors(ray, UP)
  off.normalize()
  p.addScaledVector(off, ((need - gap) * far) / along)
}

// Where a thrown thing is after `t` seconds: out along the floor, up, and down again with one bounce, in balls. The last number is 1 once it lies still.
export function thrown(out: number, up: number, fall: number, bounce: number, start: number, t: number): [number, number, number] {
  const land = (up + Math.sqrt(up * up + 2 * fall * start)) / fall
  if (t <= land) return [out * t, Math.max(0, start + up * t - 0.5 * fall * t * t), 0]
  const again = bounce * (fall * land - up)
  const more = (2 * again) / fall
  const u = t - land
  if (u <= more) return [out * land + out * 0.5 * u, Math.max(0, again * u - 0.5 * fall * u * u), 0]
  return [out * land + out * 0.5 * more, 0, 1]
}

export const strikesIn = (ctx: RealContext, z: Zone): Shape[] => ctx.list.filter((s) => s.part === 'table-lights' && s.id.startsWith('fx.') && s.v !== undefined && s.v.length >= 4 && zoneAt(s.y) === z.id).slice(-FX.strikes)

export function poseFx(group: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const f = made.get(group)
  if (!f) return
  let sparks = 0
  let rings = 0
  let cores = 0
  let coins = 0
  let papers = 0
  const h = ctx.byId.get('fx.hero')
  const guarded = h !== undefined && h.v !== undefined && h.v.length >= 3
  if (guarded) {
    const c = local(z, h.x, h.y, h.z0)
    const e = local(z, h.v![0]!, h.v![1]!, h.v![2]!)
    hero.set(c[0], c[1], c[2])
    eye.set(e[0], e[1], e[2])
  }
  const worn = guarded && h.v![3] === 1 && zoneAt(h.y) === z.id
  f.back.visible = worn
  f.rim.visible = worn
  if (worn) {
    turn.setFromUnitVectors(UP, off.copy(eye).sub(hero).normalize())
    f.back.position.copy(hero)
    f.back.quaternion.copy(turn)
    f.rim.position.copy(hero)
    f.rim.quaternion.copy(turn)
  }
  for (const s of strikesIn(ctx, z)) {
    const age = s.v![0]!
    const hard = Math.max(1, Math.min(3, Math.round(s.v![1]!)))
    const loot = Math.round(s.v![2]!)
    const serial = s.v![3]!
    const p = local(z, s.x, s.y, s.z0)
    const hot = HOT[serial % HOT.length]!
    if (age < FX.lightSeconds) {
      const k = 1 - age / FX.lightSeconds
      ctx.light({ x: s.x, y: s.y, z: s.z0 + BALL * 0.7, colour: GLOW, power: FX.light[hard]! * k * k, reach: FX.lightReach * BALL })
    }
    if (age < FX.sparkSeconds) {
      const k = 1 - age / FX.sparkSeconds
      for (let i = 0; i < FX.sparks[hard]!; i++) {
        const way = 6.283185307179586 * chance(serial, i)
        const speed = span(FX.sparkSpeed, chance(serial, i + 40)) * (0.7 + 0.15 * hard)
        const rise = span(FX.sparkRise, chance(serial, i + 80))
        const vz = rise - FX.sparkFall * age
        const zz = Math.max(0.05, 0.5 + rise * age - 0.5 * FX.sparkFall * age * age)
        place.set(p[0] + Math.cos(way) * speed * age * BALL, p[1] + Math.sin(way) * speed * age * BALL, p[2] + zz * BALL)
        clear(place, 0, guarded)
        axis.set(Math.cos(way) * speed, Math.sin(way) * speed, vz).normalize()
        turn.setFromUnitVectors(along, axis)
        const long = Math.hypot(speed, vz) * FX.sparkLong * BALL * (0.4 + 0.6 * k)
        size.set(long, FX.sparkWide * BALL * (0.5 + hard * 0.25), FX.sparkWide * BALL * (0.5 + hard * 0.25))
        f.sparks.setMatrixAt(sparks, at.compose(place, turn, size))
        f.sparks.setColorAt(sparks++, tint.setRGB(hot[0] * k, hot[1] * k, hot[2] * k))
      }
    }
    if (age < FX.ringSeconds) {
      const u = age / FX.ringSeconds
      const r = (0.4 + (FX.ringTo[hard]! - 0.4) * (1 - (1 - u) * (1 - u))) * BALL
      turn.identity()
      f.rings.setMatrixAt(rings, at.compose(place.set(p[0], p[1], p[2] + 3), turn, size.set(r, r, 1)))
      f.rings.setColorAt(rings++, tint.setRGB(hot[0] * (1 - u) * 0.3, hot[1] * (1 - u) * 0.3, hot[2] * (1 - u) * 0.3))
    }
    if (age < FX.coreSeconds) {
      const u = age / FX.coreSeconds
      const r = FX.core[hard]! * (0.5 + 0.5 * u) * BALL
      turn.identity()
      place.set(p[0], p[1], p[2] + BALL * 0.5)
      clear(place, r, guarded)
      f.cores.setMatrixAt(cores, at.compose(place, turn, size.set(r, r, r)))
      f.cores.setColorAt(cores++, tint.setRGB(hot[0] * (1 - u) * 0.3, hot[1] * (1 - u) * 0.3, hot[2] * (1 - u) * 0.3))
    }
    if (loot === 1 && age < FX.coinSeconds) {
      const fade = Math.min(1, (FX.coinSeconds - age) / FX.coinFade)
      for (let i = 0; i < FX.coins[hard]!; i++) {
        const way = 6.283185307179586 * chance(serial, i + 120)
        const q = thrown(span(FX.coinOut, chance(serial, i + 160)), span(FX.coinUp, chance(serial, i + 200)), FX.coinFall, FX.coinBounce, 0.6, age)
        const rest = q[2] === 1
        spin.set(rest ? 0 : FX.coinSpin * age * (0.6 + chance(serial, i + 240)), rest ? 0 : FX.coinSpin * 0.7 * age * chance(serial, i + 280), way)
        turn.setFromEuler(spin)
        place.set(p[0] + Math.cos(way) * q[0] * BALL, p[1] + Math.sin(way) * q[0] * BALL, p[2] + (q[1] + FX.coinThick * 0.5 + (rest ? 0 : FX.coinR * 0.6)) * BALL)
        f.coins.setMatrixAt(coins++, at.compose(place, turn, size.set(fade, fade, fade)))
      }
    }
    if (loot === 2 && age < FX.paperSeconds) {
      const fade = Math.min(1, (FX.paperSeconds - age) / FX.coinFade)
      for (let i = 0; i < FX.papers[hard]!; i++) {
        const way = 6.283185307179586 * chance(serial, i + 320)
        const q = thrown(span(FX.paperOut, chance(serial, i + 360)), span(FX.paperUp, chance(serial, i + 400)), FX.paperFall, 0, 0.7, age)
        const rest = q[2] === 1
        const sway = rest ? 0 : Math.sin(age * 9 + 6.283185307179586 * chance(serial, i + 440))
        spin.set(rest ? 0 : 0.9 * sway + age * 3 * (chance(serial, i + 480) - 0.5), rest ? 0 : 0.7 * Math.cos(age * 7 + i), way)
        turn.setFromEuler(spin)
        place.set(p[0] + Math.cos(way) * q[0] * BALL + sway * 6, p[1] + Math.sin(way) * q[0] * BALL, p[2] + (q[1] + 0.02 + i * 0.004) * BALL)
        f.papers.setMatrixAt(papers++, at.compose(place, turn, size.set(fade, fade, fade)))
      }
    }
  }
  const set = (o: THREE.InstancedMesh, count: number, coloured: boolean): void => {
    o.count = count
    o.visible = count > 0
    if (count === 0) return
    o.instanceMatrix.needsUpdate = true
    if (coloured && o.instanceColor) o.instanceColor.needsUpdate = true
  }
  set(f.sparks, sparks, true)
  set(f.rings, rings, true)
  set(f.cores, cores, true)
  set(f.coins, coins, false)
  set(f.papers, papers, false)
}
