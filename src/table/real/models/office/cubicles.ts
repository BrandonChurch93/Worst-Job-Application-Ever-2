import * as THREE from 'three'
import { config } from '../../../../config'
import { Random } from '../../../../core/random'
import { BALL, table } from '../../../layout'
import { localBalls, type Zone } from '../../zone'
import { coffeeScrews } from './coffee'
import { boxOf, inboxScrews } from './inbox'
import { hex, Kit, matsOf, meshOf, mix, rrect, screwGeometry, shade, SURF, type RGB, type V2, type V3 } from './kit'
import { staplerScrews } from './staplers'

const C = {
  slab: hex(0x8f8774),
  carpet: hex(0x938d7f),
  aisle: hex(0xa39d8d),
  fabric: [hex(0xc9bea5), hex(0xbfb399), hex(0xd1c7b0)] as RGB[],
  frame: hex(0x9a9c9e),
  cap: hex(0xd3c9b2),
  kick: hex(0x55585c),
  wood: hex(0xdcc096),
  woodEdge: hex(0xa5855c),
  steel: hex(0x8f9499),
  grey: hex(0x8b8f93),
  dark: hex(0x2b2c30),
  screen: hex(0x0c0f14),
  key: hex(0x3a3c41),
  paper: hex(0xebe7dc),
  cork: hex(0xa98558),
  notes: [hex(0xe9d95a), hex(0x8fc7e8), hex(0xe58aa8), hex(0x9fd58a)] as RGB[],
  pin: hex(0xb3202a),
  mugs: [hex(0xe9e6dd), hex(0x27406b), hex(0x3f6b4c), hex(0xd9c24a), hex(0x2f7f86), hex(0x7b4a6e)] as RGB[],
  seats: [hex(0xd8c29c), hex(0xb9ae96), hex(0xcdb48e), hex(0x6f8fae), hex(0xdcc8a4), hex(0xc4ab86)] as RGB[],
  lamps: [hex(0x2a2c30), hex(0x3d5a48), hex(0x2a2c30), hex(0x8a8d91), hex(0x27406b), hex(0x2a2c30)] as RGB[],
  cabinet: hex(0xc4c0ac),
  cooler: hex(0xdcdad2),
  bottle: [0.55, 0.78, 0.95] as RGB,
  cap2: hex(0x2c5f9e),
  bin: hex(0x33363a),
  pot: hex(0xd8d4c8),
  soil: hex(0x2b2118),
  leaf: hex(0x7a9a66),
  dust: hex(0xa3ae9c),
  manila: hex(0xd3b073),
  led: [0.95, 0.8, 0.3] as RGB
}

const WALL = { t: 5.4, h: 60, base: 4 }
const AISLE = 26

function wall(k: Kit, a: V2, b: V2, r: Random): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const rz = Math.atan2(b[1] - a[1], b[0] - a[0])
  k.at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WALL.base, rz)
  k.up = 0.75
  k.box(0, 0, 0, len, WALL.t + 1.2, 6, C.kick, SURF.plastic, 0.6)
  const n = Math.max(1, Math.round(len / 36))
  const w = len / n
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + w * (i + 0.5)
    k.box(x, 0, 6, w - 2.2, WALL.t, WALL.h - 9, mix(r.pick(C.fabric), C.fabric[0]!, 0.5), SURF.fabric, 0.9)
  }
  for (let i = 0; i <= n; i++) k.box(-len / 2 + w * i, 0, 0, 2.6, WALL.t + 1, WALL.h - 2, C.frame, SURF.satin, 0.6)
  const cap: V3[] = []
  for (let i = 0; i <= 6; i++) {
    const ang = (i / 6) * Math.PI
    cap.push([0, Math.cos(ang) * (WALL.t / 2 + 1.1), WALL.h - 3.2 + Math.sin(ang) * 3.2])
  }
  k.loft([cap.map((q) => [-len / 2 - 1.3, q[1], q[2]] as V3), cap.map((q) => [len / 2 + 1.3, q[1], q[2]] as V3)], C.cap, SURF.satin, true)
  k.up = 0
  k.back()
}

function chair(k: Kit, seat: RGB): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    k.at(0, 0, 0, a)
    k.box(6.4, 0, 2.6, 12, 2.4, 1.8, C.dark, SURF.plastic, 0.6)
    k.cyl(11.6, 0, 0, 1.9, 2.8, C.dark, SURF.rubber, 8, 0.6)
    k.back()
  }
  k.cyl(0, 0, 2.6, 3, 2.6, C.dark, SURF.plastic, 10, 0.6)
  k.cyl(0, 0, 5, 1.4, 9, C.steel, SURF.chrome, 8, 0.2)
  k.poly(rrect(17.5, 17, 5, 3), 13.6, 1.6, C.dark, SURF.plastic, 0.5)
  k.poly(rrect(18.5, 18, 5.5, 3), 15, 4, seat, SURF.fabric, 1.8, shade(seat, 1.12))
  for (const s of [-1, 1]) {
    k.box(s * 10.4, 1, 15, 1.6, 2.4, 9.6, C.dark, SURF.plastic, 0.4)
    k.box(s * 10.4, 1.4, 24.2, 3, 11, 1.8, C.dark, SURF.rubber, 0.8)
  }
  k.box(0, -9.6, 14.4, 3.4, 2, 12, C.dark, SURF.plastic, 0.5)
  k.at(0, -10.2, 22, 0, 0.16)
  const back: V3[][] = []
  for (const [zz, g] of [[0, 0.82], [2, 0.96], [9, 1], [16, 0.97], [19, 0.86], [20.4, 0.6]] as V2[]) {
    const row: V3[] = []
    for (let i = 0; i <= 8; i++) {
      const t = i / 8 - 0.5
      row.push([t * 19 * g, -1.6 + 3.4 * t * t * 4 - 1.5, zz])
    }
    for (let i = 8; i >= 0; i--) {
      const t = i / 8 - 0.5
      row.push([t * 19 * g, 1.2 + 3.4 * t * t * 4 - 1.5, zz])
    }
    row.push(row[0]!)
    back.push(row)
  }
  k.loft(back, seat, SURF.fabric, true)
  k.back()
}

function monitor(k: Kit): V3 {
  k.poly(rrect(13, 8.5, 2.5, 2), 0, 1.1, C.dark, SURF.plastic, 0.5)
  k.box(0, 1.6, 1, 3, 1.6, 9, C.dark, SURF.plastic, 0.5)
  k.at(0, 0.4, 8.6, 0, -0.2)
  k.box(0, 0, 0, 29, 2.2, 18.5, C.dark, SURF.plastic, 0.7)
  k.flat([[-13.3, -1.14, 1.5], [13.3, -1.14, 1.5], [13.3, -1.14, 17.3], [-13.3, -1.14, 17.3]], [0, -1, 0], C.screen, SURF.gloss)
  k.box(0, 1.6, 5, 12, 1.6, 9, shade(C.dark, 1.3), SURF.plastic, 0.6)
  const led = k.where([11, -1.4, 0.8])
  k.back()
  return led
}

function keyboard(k: Kit): void {
  k.box(0, 0, 0, 22, 8, 1.3, C.dark, SURF.plastic, 0.4)
  for (let row = 1; row < 4; row++) for (const [x, w] of [[-5.2, 9.6], [5.2, 9.6]]) k.box(x!, -2.7 + row * 1.8, 1.3, w!, 1.35, 0.5, C.key, SURF.plastic, 0)
  for (const [x, w] of [[-8.4, 3.2], [0, 12.1], [8.4, 3.2]]) k.box(x!, -2.7, 1.3, w!, 1.35, 0.5, C.key, SURF.plastic, 0)
  k.at(16.5, -0.5, 0)
  k.poly(rrect(4, 6.4, 1.9, 2), 0, 1.7, shade(C.dark, 1.2), SURF.plastic, 0.9)
  k.back()
}

function mug(k: Kit, col: RGB): void {
  k.lathe(0, 0, 0, [[2.9, 0], [3.2, 0.5], [3.2, 6.6], [2.7, 6.6], [2.6, 5.4], [0, 5.4]], [col, col, shade(col, 1.1), shade(col, 0.8), hex(0x2a1a10)], [SURF.gloss, SURF.gloss, SURF.gloss, SURF.gloss, SURF.gloss], 12)
  const h: V3[] = []
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI
    h.push([3 + Math.cos(a) * 2.3, 0, 3.4 + Math.sin(a) * 2.1])
  }
  k.tube(h, 0.55, col, SURF.gloss, 5, false, [0, 1, 0])
}

function lamp(k: Kit, col: RGB): void {
  k.cyl(0, 0, 0, 4.4, 1.4, col, SURF.plastic, 14, 0.6)
  k.tube([[0, 0, 1.2], [-1.5, 3.5, 13], [1, -5.5, 20]], 0.7, C.steel, SURF.chrome, 5)
  k.cyl(-1.5, 3.5, 12.2, 1.3, 1.6, col, SURF.plastic, 8, 0.4)
  k.at(1.6, -7.6, 19.2, 0, -0.5)
  k.lathe(0, 0, -3.2, [[5.6, 0], [5.4, 0.6], [2.4, 5.4], [1.6, 7.2], [0, 7.4]], [col, col, col, col], SURF.plastic, 14)
  k.back()
}

function papers(k: Kit, r: Random): void {
  const n = 2 + r.int(2)
  for (let i = 0; i < n; i++) k.box(r.range(-1.5, 1.5), r.range(-1, 1), i * 0.22, 9.5, 12.6, 0.25, shade(C.paper, r.range(0.93, 1)), SURF.paper, 0, r.range(-0.5, 0.5))
  k.box(r.range(-2, 2), r.range(-3, 3), n * 0.22, 4, 4, 0.2, r.pick(C.notes), SURF.paper, 0, r.range(-0.6, 0.6))
}

function cubicle(k: Kit, f: Kit, r: Random, n: number, w: number, d: number): V3 {
  const x0 = -w / 2 + WALL.t / 2 + 1
  const y1 = d / 2 - WALL.t / 2 - 1
  const top = 26
  const desk: V2[] = [[x0, y1], [w / 2 - 8, y1], [w / 2 - 8, y1 - 20], [x0 + 21, y1 - 20], [x0 + 21, -d / 2 + 9], [x0, -d / 2 + 9]]
  k.poly(desk, top, 2.4, C.woodEdge, SURF.laminate, 0.5, mix(C.wood, shade(C.wood, 0.9), r.next()))
  k.box(w / 2 - 9.4, y1 - 10, 0, 1.6, 19, top, C.grey, SURF.satin, 0.4)
  k.box(x0 + 10.5, -d / 2 + 10, 0, 20, 1.6, top, C.grey, SURF.satin, 0.4)
  k.box((x0 + w / 2 - 8) / 2, y1 - 2.4, 9, w - 14, 1.2, 16, C.grey, SURF.satin, 0.3)
  k.at(x0 + 10.6, -d / 2 + 21, 0)
  k.box(0, 0, 0, 17, 19, top - 0.4, C.steel, SURF.satin, 0.6)
  for (let i = 0; i < 3; i++) {
    k.box(8.7, 0, 1.5 + i * 8.2, 0.5, 17, 7.2, shade(C.steel, 0.92), SURF.satin, 0.2)
    k.box(9.2, 0, 6.6 + i * 8.2, 0.8, 7, 0.9, C.dark, SURF.plastic, 0.2)
  }
  k.back()

  const dz = top + 2.4
  k.at(x0 + 40 + r.range(-4, 4), y1 - 7.5, dz, r.range(-0.22, 0.22))
  const led = monitor(k)
  k.back()
  f.at(x0 + 40 + r.range(-3, 3), y1 - 15.6, dz, r.range(-0.12, 0.12))
  keyboard(f)
  f.back()
  f.at(x0 + 15 + r.range(-3, 3), y1 - 9 + r.range(-2, 2), dz, r.range(0, 6.2))
  mug(f, C.mugs[n % C.mugs.length]!)
  f.back()
  f.at(x0 + 6.5, y1 - 6, dz, r.range(-0.6, 0.6))
  lamp(f, C.lamps[n % C.lamps.length]!)
  f.back()
  f.at(x0 + 10.5, -d / 2 + 38 + r.range(-4, 6), dz, r.range(-0.3, 0.3))
  papers(f, r)
  f.back()
  if (n % 2 === 0) {
    f.at(x0 + 10, -d / 2 + 20, dz, r.range(-0.2, 0.2))
    for (let i = 0; i < 3; i++) f.box(r.range(-0.6, 0.6), r.range(-0.6, 0.6), i * 1.5, 11, 14.5, 1.4, i === 1 ? shade(C.manila, 0.9) : C.manila, SURF.paper, 0.3, r.range(-0.1, 0.1))
    f.back()
  } else {
    f.at(x0 + 10, -d / 2 + 19, dz)
    f.box(0, 0, 0, 14, 9, 0.8, C.dark, SURF.plastic, 0.3)
    f.box(-2, 0.6, 0.8, 7, 5.4, 4.2, C.dark, SURF.plastic, 1)
    f.tube([[-6.4, 3.6, 5.4], [-6.4, -3.6, 5.4]], 1.3, shade(C.dark, 1.3), SURF.plastic, 6)
    f.back()
  }

  const by = y1 - WALL.t / 2 + 0.3
  f.box(x0 + 30, by - 1.4, 36, 34, 1.2, 17, C.frame, SURF.satin, 0.4)
  f.box(x0 + 30, by - 2.2, 37, 32, 0.8, 15, C.cork, SURF.matte, 0)
  for (let i = 0; i < 4; i++) {
    const nx = x0 + 18.5 + i * 7.6 + r.range(-0.8, 0.8)
    const nz = 39 + (i % 2) * 5.6 + r.range(-1, 1)
    f.at(nx, by - 2.75, nz, 0, 0, r.range(-0.2, 0.2))
    f.box(0, 0, 0, 5.4, 0.3, 5.4, C.notes[(i + n) % C.notes.length]!, SURF.paper, 0)
    f.back()
  }
  f.at(x0 + 18.5, by - 2.9, 50.4, 0, Math.PI / 2)
  f.lathe(0, 0, 0, [[1.2, 0], [1.2, 0.6], [0.6, 0.9], [0.6, 2], [1.1, 2.4], [0, 2.6]], C.pin, SURF.gloss, 8)
  f.back()

  k.at(x0 + 41 + r.range(-4, 5), y1 - 39 + r.range(-4, 4), 0, r.range(0, Math.PI * 2))
  chair(k, C.seats[n % C.seats.length]!)
  k.back()
  return led
}

export interface Thing { id: string; at: [number, number]; r: number }

// The small standing things, in balls. Each is placed from a thing of the layout: the cooler from the corner of the cubicles, the others from the lower post of the left stapler's plate.
export function things(tier = 1): Thing[] {
  const cub = table.models.find((m) => m.id === 'office.cubicles')!
  const sling = table.slings.find((s) => s.tier === tier && s.side === 'left')!
  const [sx, sy] = sling.b
  return [
    { id: 'cooler', at: [cub.box[0] + 0.24, cub.box[1] - 0.17], r: 0.14 },
    { id: 'bottle', at: [cub.box[0] + 0.56, cub.box[1] - 0.135], r: 0.11 },
    { id: 'cabinet', at: [sx - 0.72, sy + 2.5], r: 0.3 },
    { id: 'bin', at: [sx + 0.12, sy + 3.02], r: 0.16 },
    { id: 'plant', at: [sx - 0.8, sy + 3.66], r: 0.2 }
  ]
}

function bottleOn(c: Kit, k: Kit, x: number, y: number, z: number, down: boolean): void {
  const prof: V2[] = [[0, 0], [9.4, 0], [10.6, 1.4], [10.6, 9], [10, 10], [10.6, 11], [10.6, 20], [10, 21], [10.6, 22], [10.6, 30], [8, 34], [3.4, 37], [3.4, 41]]
  const p: V2[] = down ? prof.map((q) => [q[0], 41 - q[1]] as V2).reverse() : prof
  c.lathe(x, y, z, p, C.bottle, SURF.glass, 16, true)
  if (!down) k.cyl(x, y, z + 40, 3.9, 2.8, C.cap2, SURF.plastic, 10, 0.6)
}

function small(k: Kit, f: Kit, c: Kit, z: Zone, r: Random): void {
  const place = new Map(things(z.tier).map((t) => [t.id, localBalls(z, t.at[0], t.at[1])]))
  const at = (id: string): [number, number] => {
    const q = place.get(id)!
    return [q[0], q[1]]
  }

  {
    const [x, y] = at('cooler')
    k.at(x, y, 0)
    k.poly(rrect(26, 26, 4, 3), 0, 2, C.kick, SURF.plastic, 0.6)
    k.poly(rrect(24, 24, 3.6, 3), 2, 56, C.cooler, SURF.plastic, 1.4)
    k.box(0, -11.6, 30, 17, 1.6, 20, shade(C.cooler, 0.72), SURF.plastic, 0.5)
    k.box(0, -13.6, 30, 15, 5, 1.4, C.steel, SURF.steel, 0.4)
    for (const [s, col] of [[-1, C.cap2], [1, C.pin]] as [number, RGB][]) {
      k.box(s * 4, -13, 44, 3, 3.6, 2.4, col, SURF.plastic, 0.7)
      k.cyl(s * 4, -13.6, 41, 0.9, 3, C.cooler, SURF.plastic, 6, 0.2)
    }
    k.lathe(0, 0, 58, [[11.6, 0], [11.6, 2], [6, 4.6], [5.4, 3], [0, 3]], [C.cooler, shade(C.cooler, 0.94), shade(C.cooler, 0.8), C.dark], SURF.plastic, 16)
    bottleOn(c, k, 0, 0, 60.6, true)
    k.back()
    const [bx, by] = at('bottle')
    k.cyl(bx, by, 0, 11.6, 1.6, C.kick, SURF.rubber, 14, 0.5)
    bottleOn(c, k, bx, by, 1.6, false)
  }

  {
    const [x, y] = at('cabinet')
    k.at(x, y, 0, 0.06)
    k.box(0, 0, 0, 38, 52, 2, C.kick, SURF.plastic, 0.5)
    k.box(0, 0, 2, 36, 50, 80, C.cabinet, SURF.plastic, 1.2)
    for (let i = 0; i < 3; i++) {
      const out = i === 1 ? 10 : 0
      const zz = 4 + i * 26
      k.box(0, -25.4 - out / 2, zz, 33.4, 1.2 + out, 24, shade(C.cabinet, 1.04), SURF.plastic, 0.6)
      k.box(0, -26.6 - out, zz + 15, 13, 1.6, 2.2, C.steel, SURF.chrome, 0.6)
      k.box(0, -26.2 - out, zz + 7, 9, 0.5, 4, C.paper, SURF.paper, 0)
    }
    f.at(x, y, 0, 0.06)
    for (let i = 0; i < 7; i++) {
      f.box(0, -26.4 - i * 1.25, 4 + 26 + 19, 30, 0.7, 4 + (i % 2), i % 3 === 0 ? C.manila : hex(0x6f8a5e), SURF.paper, 0)
      f.box(-10 + ((i * 7) % 20), -26.4 - i * 1.25, 4 + 26 + 23 + (i % 2), 6, 0.8, 1.6, C.notes[i % 4]!, SURF.plastic, 0)
    }
    f.back()
    k.at(-5, 6, 82, 0.3)
    for (let i = 0; i < 4; i++) k.box(r.range(-1, 1), r.range(-1, 1), i * 1.5, 20, 27, 1.4, i % 2 ? C.manila : shade(C.manila, 0.88), SURF.paper, 0.3, r.range(-0.14, 0.14))
    k.box(1, -2, 6, 13, 18, 0.25, C.paper, SURF.paper, 0, 0.2)
    k.back()
    k.at(10, -13, 82, -0.2)
    k.box(0, 0, 0, 9, 22, 26, hex(0x2c3340), SURF.satin, 0.8)
    k.box(0, -11.2, 5, 4.6, 0.4, 9, C.paper, SURF.paper, 0)
    k.cyl(0, -11.6, 19, 1.6, 0.8, C.steel, SURF.chrome, 8, 0.2)
    k.back()
    k.back()
  }

  {
    const [x, y] = at('bin')
    const col = C.bin
    k.lathe(x, y, 0, [[10.5, 0], [11, 1], [13.4, 27], [14.2, 27.8], [14.2, 29], [12.8, 29], [10.4, 3], [0, 3]], [col, col, shade(col, 1.3), shade(col, 1.3), shade(col, 1.2), shade(col, 0.7), shade(col, 0.5)], SURF.plastic, 18)
    for (let i = 0; i < 6; i++) {
      const a = r.range(0, Math.PI * 2)
      const d = r.range(0, 6.5)
      crumple(f, r, x + Math.cos(a) * d, y + Math.sin(a) * d, 17 + i * 1.6, r.range(3.6, 4.8))
    }
    crumple(f, r, x + 19, y - 9, 0, 4.2)
    crumple(f, r, x - 6, y - 19, 0, 3.6)
  }

  {
    const [x, y] = at('plant')
    k.lathe(x, y, 0, [[9.5, 0], [10.2, 1.2], [13.6, 20], [14.6, 20.6], [14.6, 23.4], [12.6, 23.4], [12.2, 20.6], [0, 20.6]], [C.pot, C.pot, C.pot, shade(C.pot, 1.06), shade(C.pot, 0.9), shade(C.pot, 0.7), C.soil], [SURF.gloss, SURF.gloss, SURF.gloss, SURF.gloss, SURF.gloss, SURF.matte, SURF.matte], 18)
    k.lathe(x, y, 0, [[16, 0], [16.6, 1.6], [12, 2.2]], [shade(C.pot, 0.9), shade(C.pot, 0.96)], SURF.gloss, 18)
    const n = 11
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + r.range(-0.25, 0.25)
      const lift = 0.3 + (i / n) * 0.95
      leaf(f, x, y, 21, a, r.range(24, 33) * (1.12 - lift * 0.42), r.range(15, 20) * (1.05 - lift * 0.3), lift, mix(C.leaf, C.dust, r.range(0.2, 0.55)))
    }
    f.cyl(x, y, 20.6, 1.6, 9, shade(C.leaf, 0.7), SURF.matte, 6, 0.3)
  }
}

function crumple(k: Kit, r: Random, x: number, y: number, z: number, s: number): void {
  const around = 8
  const rings = 4
  const tone = shade(C.paper, r.range(0.9, 1))
  const top: V3 = [r.range(-0.2, 0.2) * s, r.range(-0.2, 0.2) * s, s * r.range(1.75, 1.95)]
  const foot: V3 = [0, 0, 0.05 * s]
  const rows: V3[][] = []
  for (let j = 1; j <= rings; j++) {
    const lat = (j / (rings + 1)) * Math.PI
    const row: V3[] = []
    for (let i = 0; i < around; i++) {
      const a = ((i + (j % 2) * 0.5) / around) * Math.PI * 2 + r.range(-0.18, 0.18)
      const rad = s * r.range(0.66, 1.14)
      row.push([Math.cos(a) * Math.sin(lat) * rad, Math.sin(a) * Math.sin(lat) * rad, s * 0.95 - Math.cos(lat) * rad * 0.92])
    }
    rows.push(row)
  }
  const face = (a: V3, b: V3, c: V3): void => {
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const mid: V3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3 - s * 0.95]
    if (n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2] < 0) n = [-n[0], -n[1], -n[2]]
    const l = Math.hypot(n[0], n[1], n[2]) || 1
    n = [n[0] / l, n[1] / l, n[2] / l]
    k.tri(a, b, c, n, n, n, shade(tone, r.range(0.8, 1.04)), SURF.paper)
  }
  k.at(x, y, z, r.range(0, 6))
  for (let i = 0; i < around; i++) {
    const n = (i + 1) % around
    face(top, rows[rings - 1]![i]!, rows[rings - 1]![n]!)
    face(foot, rows[0]![i]!, rows[0]![n]!)
    for (let j = 0; j < rings - 1; j++) {
      const lo = rows[j]!
      const hi = rows[j + 1]!
      const skew = j % 2 === 0
      face(lo[i]!, lo[n]!, skew ? hi[i]! : hi[n]!)
      face(hi[i]!, hi[n]!, skew ? lo[n]! : lo[i]!)
    }
  }
  k.back()
}

function leaf(k: Kit, x: number, y: number, z: number, a: number, len: number, wid: number, lift: number, col: RGB): void {
  k.at(x, y, z, a)
  const rows = 6
  const pts: { p: V3; l: V3; r: V3; n: V3 }[] = []
  for (let i = 0; i <= rows; i++) {
    const t = i / rows
    const out = 2 + len * t * Math.cos(lift * (1 - t * 0.9))
    const up = len * (Math.sin(lift) * t - 0.55 * t * t * t) * 1.1
    const w = wid * Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.5 + 0.3
    const slope = Math.atan2(len * (Math.sin(lift) - 1.65 * t * t) * 1.1, len * Math.cos(lift * (1 - t * 0.9)))
    const n: V3 = [-Math.sin(slope), 0, Math.cos(slope)]
    pts.push({ p: [out, 0, up], l: [out, w, up + w * 0.28], r: [out, -w, up + w * 0.28], n })
  }
  for (let i = 0; i < rows; i++) {
    const A = pts[i]!
    const B = pts[i + 1]!
    const c0 = shade(col, 0.85 + 0.3 * (i / rows))
    for (const side of ['l', 'r'] as const) {
      const s = side === 'l' ? 1 : -1
      const na: V3 = [A.n[0], -s * 0.28, A.n[2]]
      const nb: V3 = [B.n[0], -s * 0.28, B.n[2]]
      k.quad(A.p, B.p, B[side], A[side], na, nb, nb, na, c0, SURF.matte)
      const ua: V3 = [-na[0], -na[1], -na[2]]
      const ub: V3 = [-nb[0], -nb[1], -nb[2]]
      k.quad(A.p, B.p, B[side], A[side], ua, ub, ub, ua, shade(c0, 0.6), SURF.matte)
    }
  }
  k.back()
}

export function cubicleScrews(z: Zone): [number, number, number][] {
  const b = boxOf(z, 'office.cubicles')
  const out: [number, number, number][] = []
  for (const sx of [-1, 1]) for (const sy of [-1, 0, 1]) out.push([b.x + sx * (b.w / 2 - 12), b.y + sy * (b.d / 2 - 40), WALL.base])
  for (const sy of [-1, 1]) out.push([b.x, b.y + sy * 60, WALL.base])
  return out
}

export function buildCubicles(z: Zone): THREE.Object3D {
  const b = boxOf(z, 'office.cubicles')
  const mats = matsOf(z)
  const root = new THREE.Group()
  root.name = 'office.cubicles'
  const r = new Random(config.seed, 'office.cubicles')
  const k = new Kit()
  const f = new Kit()
  const c = new Kit()
  const g = new Kit()

  k.at(b.x, b.y, 0)
  f.at(b.x, b.y, 0)
  g.at(b.x, b.y, 0)
  k.poly(rrect(b.w - 1, b.d - 1, 5, 3), 0, WALL.base, C.slab, SURF.plastic, 1, C.carpet)
  k.box(0, -4, WALL.base, AISLE - 2, b.d - 12, 0.3, C.aisle, SURF.fabric, 0)
  const hw = b.w / 2 - WALL.t / 2 - 1
  const hd = b.d / 2 - WALL.t / 2 - 1
  const cw = hw - AISLE / 2
  const cd = (2 * hd) / 3
  wall(k, [-hw, hd], [hw, hd], r)
  wall(k, [-hw, -hd], [-hw, hd], r)
  wall(k, [hw, -hd], [hw, hd], r)
  for (const s of [-1, 1]) {
    wall(k, [s * hw, -hd], [s * (AISLE / 2), -hd], r)
    for (const row of [1, 2]) wall(k, [s * hw, -hd + cd * row], [s * (AISLE / 2), -hd + cd * row], r)
    for (const row of [0, 1, 2]) wall(k, [s * (AISLE / 2), -hd + cd * (row + 1)], [s * (AISLE / 2), -hd + cd * (row + 1) - 24], r)
  }
  let n = 0
  let led: V3 | null = null
  for (const s of [-1, 1]) for (const row of [0, 1, 2]) {
    const cx = s * (AISLE / 2 + cw / 2)
    const cy = -hd + cd * (row + 0.5)
    k.at(cx, cy, WALL.base)
    f.at(cx, cy, WALL.base)
    if (s > 0) {
      k.mirror()
      f.mirror()
    }
    const at = cubicle(k, f, r, n, cw + WALL.t / 2, cd)
    if (s > 0) {
      k.back()
      f.back()
    }
    k.back()
    f.back()
    if (n === 4) led = at
    n++
  }
  k.back()
  f.back()
  g.back()
  if (led) g.box(led[0], led[1], led[2] - 0.6, 1.8, 1, 1.2, C.led, SURF.gloss, 0)

  small(k, f, c, z, r)

  root.add(meshOf(k.done(), mats.solid, 'office.cubicles.body', { cast: false }))
  root.add(meshOf(f.done(), mats.solid, 'office.cubicles.trim', { fine: true }))
  const clear = meshOf(c.done(), mats.clear, 'office.cubicles.bottles')
  clear.renderOrder = 2
  root.add(clear)
  const glow = meshOf(g.done(), mats.glow, 'office.cubicles.led')
  glow.userData.lightGroup = 'office.windows'
  root.add(glow)

  const places = [...cubicleScrews(z), ...inboxScrews(z), ...staplerScrews(z), ...coffeeScrews(z)]
  const screws = new THREE.InstancedMesh(screwGeometry(), mats.solid, places.length)
  screws.name = 'office.screws'
  screws.userData.fine = true
  screws.receiveShadow = true
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 0, 1)
  places.forEach((p, i) => {
    q.setFromAxisAngle(up, r.range(0, Math.PI))
    m.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(1, 1, 1))
    screws.setMatrixAt(i, m)
  })
  screws.instanceMatrix.needsUpdate = true
  root.add(screws)
  return root
}

export const thingsClear = (): number => config.table.minClearanceBalls * BALL
