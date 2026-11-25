import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, FLIP, table } from '../../layout'
import { localBalls, whole, type Zone } from '../zone'
import { Bag, DEG, lathe, look, mat, prism, type V2 } from './g'
import { drop, matsOf, part } from './mats'

// The site's own orange, as the accent button wears it.
export const ORANGE = look(0xc24400, 0.3, 0, 1)
const ORANGE_SOFT = look(0xb84000, 0.42, 0, 0.6)
const RUBBER = look(0x1d1d1f, 0.9, 0, 0)
const RUBBER_LINE = look(0x29292b, 0.8, 0, 0)
const NYLON = look(0xe4e0d6, 0.5, 0, 0.2)
const CHROME = look(0xe6e9ec, 0.12, 0.8, 0)
const SOCKET = look(0x2a2b2d, 0.6, 1, 0)
const SHAFT = look(0xc9cdd1, 0.3, 0.78, 0)

const BAT = { pivot: 22.5, tip: 15.5, floor: 7.5, top: 40, band: 1.3 }

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
  const len = FLIP.length * BALL
  const b = new Bag()
  b.add(lathe([[12.5, 0], [12.5, 1.2], [10, 2.4], [10, BAT.floor + 1]], 20), NYLON)
  b.add(lathe([[5, BAT.floor - 0.5], [5, BAT.floor + 2]], 12), SHAFT)
  b.add(prism(batOutline(BAT.pivot - BAT.band, BAT.tip - BAT.band, len), BAT.floor, BAT.top, 2.6, 3), ORANGE)
  b.add(prism(batOutline(BAT.pivot, BAT.tip, len), 16.5, 31.5, 1.5, 2), RUBBER)
  b.add(prism(batOutline(BAT.pivot + 0.4, BAT.tip + 0.4, len, 10), 23.6, 24.4, 0), RUBBER_LINE)
  const rib: V2[] = [[30, -4.2], [len - 2, -2.6], [len + 3, 0], [len - 2, 2.6], [30, 4.2], [26, 0]]
  b.add(prism(rib, BAT.top - 0.4, BAT.top + 1.1, 0.7, 2), ORANGE_SOFT)
  b.add(lathe([[15.5, BAT.top - 0.5], [15.5, BAT.top + 2.2], [14.2, BAT.top + 3.4], [9, BAT.top + 3.4]], 28), ORANGE)
  b.add(lathe([[9.4, BAT.top + 3], [9.4, BAT.top + 3.9], [8.6, BAT.top + 4.5], [0, BAT.top + 4.5]], 20), SHAFT)
  b.add(lathe([[7.2, BAT.top + 4.4], [7.2, BAT.top + 5.6], [6.4, BAT.top + 7], [4.6, BAT.top + 7.8], [3.6, BAT.top + 7.8]], 20), CHROME)
  b.add(lathe([[3.6, BAT.top + 7.8], [3.4, BAT.top + 5.4], [0, BAT.top + 5.4]], 6, 80), SOCKET)
  b.add(lathe([[3.4, BAT.top - 0.2], [3.4, BAT.top + 1.3], [2.6, BAT.top + 2], [0, BAT.top + 2]], 12), CHROME, mat({ x: len - 3 }))
  shared = b.done()
  shared.userData.shared = true
  return shared
}

const flippersOf = (z: Zone) => table.flippers.filter((f) => f.tier === z.tier)

export const flippers = whole('flippers', {
  version: 'play-flippers-4',
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
