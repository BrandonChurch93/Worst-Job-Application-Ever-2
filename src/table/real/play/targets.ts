import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, table, type Target } from '../../layout'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, ball, box, lathe, look, mat, prism, rod, wire, type Look, type V2, type V3 } from './g'
import { drop, matsOf, part } from './mats'

const STEEL = look(0xd3d6d9, 0.3, 1, 0)
const STEEL_BRIGHT = look(0xe9ecee, 0.16, 1, 0)
const SPRING = look(0xc6cbd0, 0.22, 1, 0)
const SLOT = look(0x161718, 0.9, 0, 0)
const SCREW = look(0xd2d5d8, 0.26, 1, 0)
const SCREW_SLOT = look(0x242526, 0.7, 1, 0)
const RUBBER = look(0x1d1d1f, 0.9, 0, 0)
const GOLD = look(0xd9b35f, 0.26, 1, 0)
const IVORY = look(0xe9e2cf, 0.4, 0, 0.6)
const IVORY_EDGE = look(0xd8cfb8, 0.5, 0, 0.3)
const MANILA = look(0xd9bf86, 0.62, 0, 0.15)
const MANILA_EDGE = look(0xc4a86e, 0.7, 0, 0)
const GREEN = look(0xb7ccb2, 0.45, 0, 0.5)
const GREEN_EDGE = look(0x9ab596, 0.55, 0, 0.2)
const STONE = look(0xeef0e6, 0.5, 0, 0.3)
const CREAM = look(0xe8dfca, 0.4, 0, 0.6)
const BEAN = look(0x5b3520, 0.42, 0, 0.6)
const BEAN_DARK = look(0x2d1a10, 0.6, 0, 0.2)
const ENAMEL_BLUE = look(0x1c4aa6, 0.22, 0, 1)
const ENAMEL_PALE = look(0xe6e8ea, 0.3, 0, 1)

export const PLATE = { tall: 44, thick: 6, below: 3, gap: 1.1, down: 41.5, seconds: 0.05 }

// A plate stands in the frame (across, up, out of the face). This turns it to stand on the floor with its face toward +x.
const STAND = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0))
const onFace = (m: THREE.Matrix4): THREE.Matrix4 => STAND.clone().multiply(m)

const rounded = (w: number, h0: number, h1: number, r: number): V2[] => {
  const out: V2[] = [[-w / 2, h0], [w / 2, h0]]
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2)
    out.push([w / 2 - r + r * Math.cos(a), h1 - r + r * Math.sin(a)])
  }
  for (let i = 0; i <= 4; i++) {
    const a = Math.PI / 2 + (i / 4) * (Math.PI / 2)
    out.push([-w / 2 + r + r * Math.cos(a), h1 - r + r * Math.sin(a)])
  }
  return out
}

// One drop target of a tier: a flat plate with a small moulded picture on its face and no letter.
function plateGeometry(tier: string, wide: number): THREE.BufferGeometry {
  const b = new Bag()
  const face = PLATE.thick / 2
  const body = tier === 'corporate' ? IVORY : tier === 'office' ? MANILA : GREEN
  const edge = tier === 'corporate' ? IVORY_EDGE : tier === 'office' ? MANILA_EDGE : GREEN_EDGE
  b.add(prism(rounded(wide, -PLATE.below, PLATE.tall, 2.2), -face, face, 0.7, 2), body, STAND)
  b.add(prism(rounded(wide - 4, 3, PLATE.tall - 2, 1.6), face - 0.2, face + 0.35, 0), edge, STAND)
  b.add(prism(rounded(wide - 5.4, 3.7, PLATE.tall - 2.7, 1.2), face - 0.2, face + 0.5, 0), body, STAND)
  const z = face + 0.45
  const flat = (w: number, h: number, x: number, y: number, l: Look, d = 0.8, turn = 0): void => {
    b.add(box(w, h, d), l, onFace(mat({ x, y, z: z + d / 2 - 0.1, rz: turn })))
  }
  if (tier === 'corporate') {
    for (const x of [-8, 8]) flat(2, 22, x, 21, GOLD)
    for (const x of [-3.6, 0, 3.6]) flat(1.3, 14, x, 23.5, GOLD)
    flat(18, 2.6, 0, 32.5, GOLD, 1)
    flat(16, 1.6, 0, 16.2, GOLD)
    flat(21, 2.4, 0, 12.4, GOLD, 1)
    for (const x of [-9, 9]) flat(1.6, 6, x, 8.6, GOLD)
  } else if (tier === 'office') {
    const clip: V3[] = [[3.2, 13, z + 0.9], [3.2, 30, z + 0.9], [0.2, 33, z + 0.9], [-2.8, 30, z + 0.9], [-2.8, 11, z + 0.9], [1.4, 7, z + 0.9], [6, 11, z + 0.9], [6, 34, z + 0.9], [0.4, 39, z + 0.9], [-5.6, 34, z + 0.9], [-5.6, 16, z + 0.9]]
    b.add(wire(clip, 0.95, 6, 4), STEEL_BRIGHT, onFace(mat({ rz: 0.32, x: 5, y: -1 })))
  } else {
    flat(11, 2.2, 0, 7.4, STONE, 1)
    flat(8.6, 1.6, 0, 9.3, STONE, 1.2)
    for (const x of [-2.2, 0, 2.2]) b.add(rod([x, 10, z + 0.2], [x, 31.6, z + 0.2], 1.25, 6, 1.05), STONE, STAND)
    flat(8.6, 1.6, 0, 32.4, STONE, 1.2)
    flat(11.4, 2.4, 0, 34.4, STONE, 1)
    flat(13, 1.2, 0, 36.6, STONE, 1.3)
  }
  const g = b.done()
  return g
}

function screw(b: Bag, x: number, y: number, z: number, turn: number, size = 1): void {
  const m = mat({ x, y, z, s: size })
  b.add(lathe([[4.4, 0], [4.4, 0.9], [3.5, 1.6], [0, 1.6]], 10), SCREW, m)
  b.add(box(6.4, 1, 0.4), SCREW_SLOT, m.clone().multiply(mat({ z: 1.62, rz: turn })))
}

// A turned post with a waist for its rubber ring and a screw head on top.
function post(b: Bag, x: number, y: number, tall: number): void {
  const m = mat({ x, y })
  b.add(lathe([[5.6, 0], [5.6, 2], [4.4, 3], [4.4, tall * 0.42], [3.2, tall * 0.46], [3.2, tall * 0.66], [4.4, tall * 0.7], [4.4, tall - 1], [3.6, tall], [0, tall]], 12), STEEL, m)
  b.add(lathe([[3.2, tall * 0.47], [5.4, tall * 0.5], [6.2, tall * 0.56], [5.4, tall * 0.62], [3.2, tall * 0.65]], 12, 80), RUBBER, m)
  screw(b, x, y, tall, 0.6 + x * 0.01, 0.75)
}

interface Bank { tier: string; list: Target[]; x: number; y0: number; y1: number; wide: number }

function banksOf(z: Zone): Bank[] {
  const drops = table.targets.filter((t) => t.tier === z.tier && t.kind === 'drop')
  const names = [...new Set(drops.map((t) => t.id.slice(0, t.id.lastIndexOf('.'))))]
  return names.map((name) => {
    const list = drops.filter((t) => t.id.startsWith(`${name}.`))
    const first = list[0]!
    const last = list[list.length - 1]!
    const a = localBalls(z, first.box[0] + first.box[2] / 2, first.box[1])
    const c = localBalls(z, last.box[0] + last.box[2] / 2, last.box[1] + last.box[3])
    return { tier: z.id, list, x: a[0], y0: c[1], y1: a[1], wide: first.box[3] * BALL - PLATE.gap }
  })
}

const centreOf = (z: Zone, t: Target): [number, number] => {
  const p = localBalls(z, t.box[0] + t.box[2] / 2, t.box[1] + t.box[3] / 2)
  return [p[0], p[1]]
}

function frame(b: Bag, k: Bank): void {
  const y0 = k.y0 - 15
  const y1 = k.y1 + 15
  const mid = (y0 + y1) / 2
  const outline: V2[] = [[k.x - 9.5, y0 + 3], [k.x - 6.5, y0], [k.x + 6.5, y0], [k.x + 9.5, y0 + 3], [k.x + 9.5, y1 - 3], [k.x + 6.5, y1], [k.x - 6.5, y1], [k.x - 9.5, y1 - 3]]
  b.add(prism(outline, 0, 2.6, 0.6, 1), STEEL)
  b.add(box(PLATE.thick + 3, k.y1 - k.y0 + 2.4, 0.5), SLOT, mat({ x: k.x, y: mid, z: 2.7 }))
  for (const side of [-1, 1]) b.add(box(1.6, k.y1 - k.y0 + 4, 2.2), STEEL_BRIGHT, mat({ x: k.x + side * (PLATE.thick / 2 + 2.2), y: mid, z: 3.4 }))
  post(b, k.x, k.y0 - 7.5, 34)
  post(b, k.x, k.y1 + 7.5, 34)
  screw(b, k.x - 5.2, mid - (k.y1 - k.y0) * 0.25, 2.6, 0.4, 0.62)
  screw(b, k.x - 5.2, mid + (k.y1 - k.y0) * 0.25, 2.6, 1.9, 0.62)
}

const STANDUP = { hinge: 2.4, face: 24, r: 18.5 }
const SPINNER = { axle: 31, half: 43, flagW: 54, flagH: 34, off: 4, turns: 7, seconds: 1.5 }

// The standup before the coffee machine, with its face toward +x and its hinge on the y axis.
function standupGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const out = mat({ ry: Math.PI / 2 })
  b.add(box(1.3, 15, 30), SPRING, mat({ x: -1.4, z: 15 }))
  b.add(box(2, 9, 2), STEEL, mat({ x: -2.8, z: STANDUP.face }))
  b.add(lathe([[STANDUP.r, -1], [STANDUP.r, 2.6], [STANDUP.r - 1.4, 4], [STANDUP.r - 3, 4], [STANDUP.r - 3.6, 3.2], [0, 3.2]], 32), CREAM, mat({ z: STANDUP.face }).multiply(out))
  b.add(lathe([[STANDUP.r + 0.1, -1.4], [STANDUP.r + 0.1, -0.6], [0, -0.6]], 32), STEEL, mat({ z: STANDUP.face }).multiply(out))
  const bean = mat({ x: 3.4, z: STANDUP.face, rx: 0.42 })
  b.add(ball(1, 14, 8), BEAN, bean.clone().multiply(mat({ s: [2.6, 8.2, 11.6] })))
  const groove: V3[] = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8 - 0.5
    const up = t * 21
    groove.push([2.62 * Math.sqrt(Math.max(0, 1 - (up / 11.6) ** 2)) + 0.1, Math.sin(t * Math.PI * 2) * 1.5, up])
  }
  b.add(wire(groove, 0.75, 5, 2), BEAN_DARK, bean)
  for (const y of [-5, 5]) b.add(lathe([[1.6, 0], [1.6, 0.7], [0, 0.9]], 8), SCREW, mat({ x: -0.75, y, z: 8 }).multiply(out))
  return b.done()
}

// The spinner's flag on its wire axle, lying flat with the axle along x and its enamel face up.
function spinnerGeometry(): THREE.BufferGeometry {
  const b = new Bag()
  const w = SPINNER.flagW
  const h = SPINNER.flagH
  b.add(wire([[-SPINNER.half - 2, 0, 0], [SPINNER.half + 2, 0, 0], [SPINNER.half + 4, 2, 0], [SPINNER.half + 4, 9, 0]], 1.5, 8, 1, false, true), STEEL_BRIGHT)
  const cut: V2[] = [[-w / 2 + 3, -h / 2], [w / 2 - 3, -h / 2], [w / 2, -h / 2 + 3], [w / 2, h / 2 - 3], [w / 2 - 3, h / 2], [-w / 2 + 3, h / 2], [-w / 2, h / 2 - 3], [-w / 2, -h / 2 + 3]]
  const inset = (d: number): V2[] => cut.map((p) => [p[0] - Math.sign(p[0]) * d, p[1] - Math.sign(p[1]) * d] as V2)
  const m = mat({ y: -SPINNER.off })
  b.add(prism(cut, -1, 0.2, 0.3, 1), STEEL, m)
  b.add(prism(inset(1), 0.1, 1, 0.3, 1), ENAMEL_BLUE, m)
  b.add(prism(inset(3.4), 0.9, 1.25, 0), ENAMEL_PALE, m)
  b.add(prism(inset(4.6), 0.9, 1.4, 0), ENAMEL_BLUE, m)
  const star: V2[] = []
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.PI / 2
    const r = i % 2 === 0 ? 9 : 5.4
    star.push([r * Math.cos(a), r * Math.sin(a)])
  }
  b.add(prism(star, 1.3, 1.9, 0.25, 1), ENAMEL_PALE, m)
  b.add(lathe([[3.2, 1.8], [3.2, 2.5], [0, 2.7]], 14), ENAMEL_BLUE, m)
  for (const x of [-w / 2 + 8, w / 2 - 8]) b.add(box(7, 4.4, 2.4), STEEL, mat({ x, z: 0.2 }))
  b.add(box(16, 5, 1.6), STEEL, mat({ y: -SPINNER.off - h / 2 + 3.4, z: -1.6 }))
  return b.done()
}

interface Built {
  plates: { mesh: THREE.InstancedMesh; bank: Bank; at: [number, number][] }[]
  standup: THREE.Mesh | null
  spinner: THREE.Mesh | null
  m: THREE.Matrix4
}

// How far a plate is down in its slot, 0 to 1, from the state on its shape.
export const plateDown = (up: number, since: number): number => (1 - Math.max(0, Math.min(1, up))) * Math.min(1, Math.max(0, since) / PLATE.seconds)
// How far the standup leans back, in radians: a kick, then two small swings that die.
export const standupLean = (since: number): number => (since > 0.8 ? 0 : 0.3 * Math.exp(-7 * since) * Math.cos(since * 2 * Math.PI * 4.2))
// How far the spinner has turned, in radians: fast at first, slowing to a stop, flat again at the end.
export const spinnerTurn = (since: number): number => {
  const s = Math.max(0, Math.min(1, since / SPINNER.seconds))
  return 2 * Math.PI * SPINNER.turns * (1 - (1 - s) * (1 - s))
}

export const targets = whole('targets', {
  version: 'play-targets-4',
  build(z) {
    const g = new THREE.Group()
    g.name = `play.targets.${z.id}`
    const m = matsOf(z)
    const fixed = new Bag()
    const built: Built = { plates: [], standup: null, spinner: null, m: new THREE.Matrix4() }
    for (const bank of banksOf(z)) {
      frame(fixed, bank)
      const mesh = new THREE.InstancedMesh(plateGeometry(z.id, bank.wide), m.solid, bank.list.length)
      mesh.name = `play.targets.plates.${z.id}`
      mesh.castShadow = true
      mesh.receiveShadow = true
      const at = bank.list.map((t) => centreOf(z, t))
      at.forEach((p, i) => mesh.setMatrixAt(i, built.m.makeTranslation(p[0], p[1], 0)))
      mesh.computeBoundingSphere()
      g.add(mesh)
      built.plates.push({ mesh, bank, at })
    }
    for (const t of table.targets.filter((x) => x.tier === z.tier && x.kind === 'standup' && !x.id.startsWith('corporate.note'))) {
      const p = centreOf(z, t)
      const foot = mat({ x: p[0], y: p[1] })
      fixed.add(prism([[-13, -19], [13, -19], [13, 19], [-13, 19]], 0, 2.2, 0.6, 1), STEEL, foot)
      fixed.add(box(7, 18, 3.4), STEEL, foot.clone().multiply(mat({ x: -t.n[0] * 1.5, z: 3.6 })))
      screw(fixed, p[0] - t.n[0] * 7, p[1] - 13, 2.2, 0.3, 0.7)
      screw(fixed, p[0] - t.n[0] * 7, p[1] + 13, 2.2, 1.4, 0.7)
      const mesh = part(standupGeometry(), m.solid, `play.targets.standup.${t.id}`)
      mesh.rotation.order = 'ZYX'
      mesh.rotation.z = Math.atan2(-t.n[1], t.n[0])
      mesh.position.set(p[0], p[1], STANDUP.hinge)
      mesh.userData.id = t.id
      g.add(mesh)
      built.standup = mesh
    }
    for (const t of table.targets.filter((x) => x.tier === z.tier && x.kind === 'spinner')) {
      const p = centreOf(z, t)
      for (const side of [-1, 1]) {
        const x = p[0] + side * (SPINNER.half + 3)
        fixed.add(lathe([[7.5, 0], [7.5, 1.6], [6.4, 2.4], [3.6, 2.4], [3.2, 3.4], [3.2, SPINNER.axle + 3], [2.4, SPINNER.axle + 4.4], [0, SPINNER.axle + 4.4]], 12), STEEL, mat({ x, y: p[1] }))
        fixed.add(lathe([[4.4, SPINNER.axle - 2.4], [4.4, SPINNER.axle + 2.4], [3.2, SPINNER.axle + 2.4]], 12), STEEL_BRIGHT, mat({ x, y: p[1] }))
      }
      const mesh = part(spinnerGeometry(), m.solid, `play.targets.spinner.${t.id}`, { cast: true })
      mesh.position.set(p[0], p[1], SPINNER.axle)
      mesh.userData.id = t.id
      g.add(mesh)
      built.spinner = mesh
    }
    if (!fixed.empty) g.add(part(fixed.done(), m.solid, `play.targets.fixed.${z.id}`, { cast: true }))
    g.userData.built = built
    return g
  },
  pose(o, _z, ctx: RealContext) {
    const b = o.userData.built as Built
    for (const p of b.plates) {
      p.bank.list.forEach((t, i) => {
        const v = ctx.byId.get(`target.${t.id}`)?.v
        const down = plateDown(v?.[0] ?? 1, v?.[1] ?? 9)
        p.mesh.setMatrixAt(i, b.m.makeTranslation(p.at[i]![0], p.at[i]![1], -PLATE.down * down))
      })
      p.mesh.instanceMatrix.needsUpdate = true
    }
    if (b.standup) b.standup.rotation.y = -standupLean(ctx.byId.get(`target.${b.standup.userData.id as string}`)?.v?.[1] ?? 9)
    if (b.spinner) b.spinner.rotation.x = spinnerTurn(ctx.byId.get(`target.${b.spinner.userData.id as string}`)?.v?.[1] ?? 9)
  },
  drop
})
