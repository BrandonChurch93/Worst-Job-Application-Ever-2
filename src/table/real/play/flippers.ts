import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, FLIP, table } from '../../layout'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, DEG, lathe, look, mat, prism, type V2 } from './g'
import { MACHINE_ORANGE } from '../frame/mats'
import { drop, matsOf, part } from './mats'

const deep = (h: number, k: number): number => new THREE.Color(h).multiplyScalar(k).getHex()
export const ORANGE = look(MACHINE_ORANGE, 0.56, 0, 0.14)
const ORANGE_TOP = look(MACHINE_ORANGE, 0.54, 0, 0.14)
const ORANGE_LOW = look(deep(MACHINE_ORANGE, 0.68), 0.45, 0, 0.4)
const RUBBER = look(0x161617, 0.86, 0, 0)
const RUBBER_LINE = look(0x2c2c2e, 0.7, 0, 0)
const NYLON = look(0xe4e0d6, 0.5, 0, 0.2)
const CHROME = look(0xe6e9ec, 0.07, 1, 0)
const SOCKET = look(0x2a2b2d, 0.6, 1, 0)
const SHAFT = look(0xc9cdd1, 0.25, 1, 0)

// The bat stands on its shaft: a low orange foot, the rubber round its waist, and the moulded top above it.
const BAT = { floor: 9, waist: 20, band: 15, top: 56, lip: 5.2, crown: 9 }
// The rubber's outer line is the line the ball meets: a round at the pivot, a round at the tip, the two flanks between.
export const BAT_LINE = { pivot: FLIP.radius * BALL, tip: FLIP.tip * BALL, reach: (FLIP.length - FLIP.tip) * BALL }

// The outline of a bat that lies along x from its pivot: two rounds and the two lines that touch both.
export function batOutline(ra: number, rb: number, len: number, steps = 12): V2[] {
  const lean = Math.asin((ra - rb) / len)
  const half = Math.PI / 2 - lean
  const out: V2[] = []
  for (let i = 0; i <= steps; i++) {
    const a = -half + (2 * half * i) / steps
    out.push([len + rb * Math.cos(a), rb * Math.sin(a)])
  }
  const round = 2 * Math.PI - 2 * half
  const n = Math.round(steps * 1.6)
  for (let i = 0; i <= n; i++) {
    const a = half + (round * i) / n
    out.push([ra * Math.cos(a), ra * Math.sin(a)])
  }
  return out
}

let shared: THREE.BufferGeometry | null = null

export function batGeometry(): THREE.BufferGeometry {
  if (shared) return shared
  const { pivot: ra, tip: rb, reach: len } = BAT_LINE
  const line = (inset: number, steps = 10): V2[] => batOutline(ra - inset, rb - inset, len, steps)
  const b = new Bag()
  const hub = Math.min(13, ra * 0.5)
  b.add(lathe([[hub + 3, 0], [hub + 3, 1.4], [hub, 2.8], [hub, BAT.floor + 1]], 20), NYLON)
  b.add(lathe([[hub * 0.45, 0.5], [hub * 0.45, BAT.floor + 2]], 12), SHAFT)
  b.add(lathe([[4.2, 0], [4.2, BAT.floor + 1]], 10), NYLON, mat({ x: len }))
  b.add(prism(line(BAT.lip + 1.2), BAT.floor, BAT.waist + 1, 2.2, 3), ORANGE_LOW)
  b.add(prism(line(0), BAT.waist, BAT.waist + BAT.band, 2.4, 3), RUBBER)
  b.add(prism(batOutline(ra + 0.35, rb + 0.35, len, 12), BAT.waist + BAT.band / 2 - 0.5, BAT.waist + BAT.band / 2 + 0.5, 0), RUBBER_LINE)
  b.add(prism(line(BAT.lip), BAT.waist + BAT.band - 1, BAT.top, BAT.crown, 6), ORANGE)
  b.add(prism(line(BAT.lip + BAT.crown + 2.4), BAT.top - 0.6, BAT.top + 1.1, 0.9, 2), ORANGE_TOP)
  const boss = Math.max(8, ra * 0.33)
  b.add(lathe([[boss + 2.2, BAT.top + 0.6], [boss + 2.2, BAT.top + 1.6], [boss + 1, BAT.top + 2.6], [boss - 0.4, BAT.top + 2.6]], 24), ORANGE_TOP)
  b.add(lathe([[boss, BAT.top + 2.2], [boss, BAT.top + 3.2], [boss - 1.4, BAT.top + 4.5], [boss * 0.5, BAT.top + 5.1], [0, BAT.top + 5.2]], 24), CHROME)
  b.add(prism([[-boss * 0.62, -0.7], [boss * 0.62, -0.7], [boss * 0.62, 0.7], [-boss * 0.62, 0.7]], BAT.top + 4.6, BAT.top + 5.26, 0), SOCKET, mat({ rz: 0.6 }))
  const stud = Math.max(5, rb * 0.3)
  b.add(lathe([[stud + 1.4, BAT.top + 0.6], [stud + 1.4, BAT.top + 1.5], [stud, BAT.top + 2.3], [stud * 0.5, BAT.top + 3.1], [0, BAT.top + 3.2]], 16), CHROME, mat({ x: len }))
  shared = b.done()
  shared.userData.shared = true
  return shared
}

const flippersOf = (z: Zone) => table.flippers.filter((f) => f.tier === z.tier)

export const flippers = whole('flippers', {
  version: 'play-flippers-13',
  build(z) {
    const g = new THREE.Group()
    g.name = `play.flippers.${z.id}`
    const m = matsOf(z)
    const bats: THREE.Mesh[] = []
    for (const f of flippersOf(z)) {
      const bat = part(batGeometry(), m.solid, `play.flipper.${f.id}`, { cast: true })
      const p = localBalls(z, f.pivot[0], f.pivot[1])
      bat.position.set(p[0], p[1], 0)
      bat.rotation.z = f.side === 'left' ? -FLIP.rest * DEG : Math.PI + FLIP.rest * DEG
      g.add(bat)
      bats.push(bat)
    }
    g.userData.bats = bats
    return g
  },
  pose(o, z, ctx: RealContext) {
    const bats = o.userData.bats as THREE.Mesh[]
    flippersOf(z).forEach((f, i) => {
      const a = ctx.byId.get(`flipper.${f.id}`)?.v?.[0] ?? FLIP.rest * DEG
      bats[i]!.rotation.z = f.side === 'left' ? -a : Math.PI + a
    })
  },
  drop
})
