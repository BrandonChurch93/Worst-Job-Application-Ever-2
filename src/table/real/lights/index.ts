import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../real/types'
import { zoneAt } from '../../draw'
import { BALL } from '../../layout'
import { whole, type Zone } from '../zone'
import { FILL } from './colours'
import { groupsOf, LIT, type Group } from './groups'
import { buildLamps, type Lamps } from './lamps'
import { levels, solo, soloed } from './levels'
import { zoneLight } from './state'

export * as colours from './colours'
export { groupsOf, levels, solo, soloed }

// How near the clear ball a lamp must be to turn into a true light, with true shadows, and how much of the picture's light is left under it.
const TRUE = { near: 2.4 * BALL, far: 5.2 * BALL, lampNear: 1.3 * BALL, lampFar: 3.0 * BALL, hole: 1.05 * BALL, cut: 0.8, singles: 4, lamps: 2 }
const FIELD_HEIGHT = 1 / (300 * 300)

const ease = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface Built extends Lamps { tint: THREE.Color }
const built = new WeakMap<THREE.Object3D, Built>()

function pose(o: THREE.Object3D, z: Zone, ctx: RealContext): void {
  const b = built.get(o)
  const s = zoneLight(z)
  const groups = groupsOf(z)
  const L = levels(ctx, z)
  const u = s.uniforms
  const ball = ctx.byId.get('ball.clear')
  const here = ball !== undefined && zoneAt(ball.y + ball.h / 2) === z.id
  const bx = ball ? ball.x + ball.w / 2 - 960 : 0
  const by = ball ? z.top + z.height / 2 - (ball.y + ball.h / 2) : 0
  const share = groups.map(() => 0)
  const wanted: { g: Group; share: number; x: number; y: number; z: number; power: number; reach: number; shadow: boolean }[] = []
  if (here) {
    for (const g of groups) {
      const level = L.groups[g.index]!
      if (!g.single || level <= 0.02) continue
      const src = g.sources[0]!
      let part = ease(TRUE.far, TRUE.near, Math.hypot(src.x - bx, src.y - by))
      if ((g.name === 'red' || g.name === 'blue') && L.general > 0) part = Math.max(part, ease(0.5, 0.95, level / L.general))
      if (part <= 0.001) continue
      wanted.push({ g, share: part, x: src.x, y: src.y, z: src.z, power: src.power * level, reach: src.reach, shadow: g.name.startsWith('insert.') || g.name.startsWith('globe.') })
    }
    wanted.sort((p, q) => q.share - p.share || p.g.index - q.g.index)
    wanted.length = Math.min(wanted.length, TRUE.singles)
  }
  let shadows = 2
  for (const w of wanted) {
    share[w.g.index] = w.share
    const shadow = w.shadow && shadows > 0
    if (shadow) shadows--
    ctx.light({ x: w.x + 960, y: z.top + z.height / 2 - w.y, z: w.z + z.floor, colour: w.g.colour, power: w.power * w.share, reach: w.reach, shadow })
  }
  const holes = u.wjlHole.value
  holes[0]!.set(0, 0, 1, 0)
  holes[1]!.set(0, 0, 1, 0)
  if (here && L.general > 0.02) {
    const near: { g: Group; d: number; i: number }[] = []
    for (const g of groups) {
      if (g.mode !== 2) continue
      g.sources.forEach((src, i) => {
        if (src.z > 100) return
        const d = Math.hypot(src.x - bx, src.y - by)
        if (d < TRUE.lampFar) near.push({ g, d, i })
      })
    }
    near.sort((p, q) => p.d - q.d || p.g.index - q.g.index || p.i - q.i)
    near.slice(0, TRUE.lamps).forEach((n, h) => {
      const src = n.g.sources[n.i]!
      const part = ease(TRUE.lampFar, TRUE.lampNear, n.d)
      holes[h]!.set(src.x, src.y, TRUE.hole, part * TRUE.cut)
      const shadow = shadows > 0
      if (shadow) shadows--
      ctx.light({ x: src.x + 960, y: z.top + z.height / 2 - src.y, z: src.z + z.floor, colour: n.g.colour, power: src.power * L.general * part * TRUE.cut, reach: src.reach, shadow })
    })
  }
  for (let i = 0; i < u.wjlCol.value.length; i++) {
    const g = groups[i]
    if (!g) {
      u.wjlCol.value[i]!.set(0, 0, 0)
      continue
    }
    const level = L.groups[i]! * (1 - share[i]!)
    u.wjlCol.value[i]!.set(g.colour[0] * level, g.colour[1] * level, g.colour[2] * level)
    u.wjlAt.value[i]!.set(g.at[0], g.at[1], g.mode === 0 ? (g.name === 'flash' ? 0 : FIELD_HEIGHT) : g.at[2], g.mode)
  }
  const fill = FILL[z.id]!
  const soft = 0.05 * L.general + 0.05 * L.flash
  u.wjlFill.value.set(fill[0] * soft, fill[1] * soft, fill[2] * soft)
  u.wjlEnv.value = soloed() !== null ? 0.5 : L.general * (1 + 0.5 * L.flash) + 0.2 * L.website
  if (!b) return
  if (b.lens) {
    const lift = 1 + 0.4 * L.flash
    const lane = L.byName.lanes ?? L.byName.windows ?? 0
    b.lens.set(Math.min(1.4, (L.byName.general ?? 0) * lift), Math.min(1.4, lane * lift))
  }
  if (b.cores) {
    b.coreGroups.forEach((id, i) => {
      const g = groups.find((x) => x.id === id)
      const v = g ? L.groups[g.index]! : 0
      b.cores!.setColorAt(i, b.tint.setRGB(0.02 + v, 0.02 + v, 0.02 + v))
    })
    if (b.cores.instanceColor) b.cores.instanceColor.needsUpdate = true
  }
}

const maker = whole('table-lights', {
  version: 'lights-1',
  build(z, ctx) {
    const lamps = buildLamps(z, ctx)
    if (LIT.includes(z.id)) zoneLight(z)
    built.set(lamps.group, { ...lamps, tint: new THREE.Color() })
    return lamps.group
  },
  pose
})

export const parts: Record<string, PartMaker | null> = { 'table-lights': maker }
