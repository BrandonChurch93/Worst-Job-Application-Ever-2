import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { restLook, SHOULDERS, UNIT, type BodyLook, type EffectsLook } from '../src/cursor/contract'
import type { Emitter } from '../src/real/types'
import { makeBody } from '../src/cursor/model/body'
import { makeEffects } from '../src/cursor/model/effects'
import { SLANT } from '../src/cursor/model/deform'
import { heightAt, inside, solid, volume } from '../src/cursor/model/shape'
import { stripSet } from '../src/cursor/model/strips'
import { detailData } from '../src/cursor/model/texture'

const body = (over: Partial<BodyLook> = {}, time = 0.7): BodyLook => ({ ...restLook(time).body, ...over, time })
const effects = (over: Partial<EffectsLook> = {}, time = 0.7): EffectsLook => ({ ...restLook(time).effects, ...over, time })
const shown = (root: THREE.Object3D): THREE.Mesh[] => {
  const out: THREE.Mesh[] = []
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.visible) out.push(m)
  })
  return out
}
const positions = (root: THREE.Object3D): number[] => shown(root).flatMap((m) => Array.from(m.geometry.getAttribute('position').array as Float32Array))
const matrices = (root: THREE.Object3D): number[] =>
  shown(root).flatMap((m) => {
    const im = m as THREE.InstancedMesh
    return Array.from(im.instanceMatrix.array as Float32Array).slice(0, im.count * 16)
  })
const whole = (root: THREE.Object3D): THREE.Mesh => shown(root)[0]!
const bodyVolume = (look: BodyLook): number => {
  const b = makeBody!()
  b.apply(look)
  const g = whole(b.root).geometry
  return volume(g.getAttribute('position').array as Float32Array, g.getIndex()!.array)
}

const LOOKS: Record<string, Partial<BodyLook>> = {
  rest: {},
  stretched: { stretch: 1.4 },
  bent: { bend: 0.8 },
  puffed: { puff: 1 },
  trembling: { tremble: 1 },
  flat: { flat: 1, crack: 1 },
  melted: { melt: 0.7 },
  peeled: { flat: 1, peel: 0.6 },
  gulping: { gulp: 0.4 },
  holed: { holes: [{ x: 4.2, y: 9.5, r: 2, glow: 0.7 }] },
  shredded: { strips: Array.from({ length: 9 }, (_, i) => ({ x: i * 3, y: -i, z: i % 3, rot: 0.1 * i, tilt: 0.05 * i })) },
  mixed: { stretch: 1.2, bend: -0.5, puff: 0.5, tremble: 0.5, pale: 0.5, heat: 0.5, melt: 0.5, flat: 0.5, char: 0.5 }
}

describe('the cursor body model', () => {
  it('is made', () => {
    expect(makeBody).not.toBeNull()
    expect(makeEffects).not.toBeNull()
  })

  it('is one closed solid at rest, with every face pointing out', () => {
    const s = solid()
    const edges = new Map<string, number>()
    for (let i = 0; i < s.index.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = s.index[i + k]!
        const b = s.index[i + ((k + 1) % 3)]!
        edges.set(`${a}>${b}`, (edges.get(`${a}>${b}`) ?? 0) + 1)
      }
    }
    for (const [key, n] of edges) {
      const [a, b] = key.split('>')
      expect(n).toBe(1)
      expect(edges.get(`${b}>${a}`)).toBe(1)
    }
    expect(Math.abs(volume(s.rest, s.index))).toBeGreaterThan(120)
  })

  for (const [name, over] of Object.entries(LOOKS)) {
    it(`gives the same geometry for the same look: ${name}`, () => {
      const a = makeBody!()
      const b = makeBody!()
      a.apply(body(over))
      b.apply(body({ heat: 1 }, 2.2))
      b.apply(body(over))
      const pa = positions(a.root)
      const pb = positions(b.root)
      expect(pa.length).toBeGreaterThan(1000)
      expect(pb).toEqual(pa)
      expect(pa.every((v) => Number.isFinite(v))).toBe(true)
    })
  }

  it('keeps its volume inside 15% across stretch 0.6 to 1.4', () => {
    const rest = bodyVolume(body())
    expect(rest).toBeGreaterThan(0)
    for (const stretch of [0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4]) {
      const ratio = bodyVolume(body({ stretch })) / rest
      expect(ratio).toBeGreaterThan(0.85)
      expect(ratio).toBeLessThan(1.15)
    }
  })

  it('grows longer and narrower with stretch', () => {
    const size = (stretch: number): THREE.Vector3 => {
      const b = makeBody!()
      b.apply(body({ stretch }))
      const g = whole(b.root).geometry
      g.computeBoundingBox()
      return g.boundingBox!.getSize(new THREE.Vector3())
    }
    const short = size(0.6)
    const rest = size(1)
    const long = size(1.4)
    expect(rest.y / UNIT).toBeGreaterThan(18.6)
    expect(rest.y / UNIT).toBeLessThanOrEqual(19.01)
    expect(long.y).toBeGreaterThan(rest.y * 1.3)
    expect(long.x).toBeLessThan(rest.x)
    expect(short.y).toBeLessThan(rest.y * 0.7)
    expect(short.x).toBeGreaterThan(rest.x)
  })

  it('moves an anchor with a bend, and leaves the tip where it is', () => {
    const b = makeBody!()
    const at = (x: number, y: number): THREE.Vector3 => b.anchor(x, y, new THREE.Vector3())
    b.apply(body())
    const tail0 = at(8.2, 18.3)
    const tip0 = at(0.6, 1.2)
    const shoulder0 = at(SHOULDERS[1][0], SHOULDERS[1][1])
    const lean = (SLANT * tail0.z) / UNIT
    expect(tail0.x / UNIT + lean).toBeCloseTo(8.2, 1)
    expect(-tail0.y / UNIT + lean).toBeCloseTo(18.3, 1)
    b.apply(body({ bend: 1 }))
    const tail1 = at(8.2, 18.3)
    const tip1 = at(0.6, 1.2)
    const shoulder1 = at(SHOULDERS[1][0], SHOULDERS[1][1])
    b.apply(body({ bend: -1 }))
    const tail2 = at(8.2, 18.3)
    expect(tip1.distanceTo(tip0)).toBeLessThan(0.01)
    expect(tail1.distanceTo(tail0)).toBeGreaterThan(3 * UNIT)
    expect(tail2.distanceTo(tail0)).toBeGreaterThan(3 * UNIT)
    expect(tail1.distanceTo(tail2)).toBeGreaterThan(6 * UNIT)
    expect(shoulder1.distanceTo(shoulder0)).toBeGreaterThan(0.3 * UNIT)
    expect(shoulder1.distanceTo(shoulder0)).toBeLessThan(tail1.distanceTo(tail0))
  })

  it('puts an anchor on the body as it is drawn: stretched, puffed, flat', () => {
    const b = makeBody!()
    const v = new THREE.Vector3()
    b.apply(body({ stretch: 1.4 }))
    b.anchor(4.2, 9.5, v)
    expect((-v.y + SLANT * v.z) / UNIT).toBeCloseTo(9.5 * 1.4, 1)
    b.apply(body())
    const z = b.anchor(4.2, 9.5, v).z
    b.apply(body({ puff: 1 }))
    expect(b.anchor(4.2, 9.5, v).z).toBeGreaterThan(z)
    b.apply(body({ flat: 1 }))
    expect(b.anchor(4.2, 9.5, v).z).toBeLessThan(z * 0.9)
  })

  it('stays the same height off the page whatever it is asked: its size never changes on its own', () => {
    const b = makeBody!()
    b.apply(body())
    const g = whole(b.root).geometry
    g.computeBoundingBox()
    expect(g.boundingBox!.min.z).toBeCloseTo(0, 3)
    expect(g.boundingBox!.max.z / UNIT).toBeGreaterThan(1.8)
    expect(g.boundingBox!.max.z / UNIT).toBeLessThan(2.8)
    expect(b.root.scale.x).toBe(1)
  })

  it('trembles from time alone', () => {
    const a = makeBody!()
    a.apply(body({ tremble: 1 }, 1))
    const one = positions(a.root)
    a.apply(body({ tremble: 1 }, 1.03))
    const two = positions(a.root)
    a.apply(body({ tremble: 1 }, 1))
    expect(two).not.toEqual(one)
    expect(positions(a.root)).toEqual(one)
  })

  it('cuts the body into strips that are each one piece and together the whole body', () => {
    const set = stripSet(9)
    expect(set.count).toBe(9)
    const seen = new Set<number>()
    for (let i = 0; i < set.strip.length; i++) seen.add(set.strip[i]!)
    expect(seen.size).toBe(9)
    const b = makeBody!()
    b.apply(body({ strips: Array.from({ length: 9 }, () => ({ x: 0, y: 0, z: 0, rot: 0, tilt: 0 })) }))
    const cut = whole(b.root).geometry
    cut.computeBoundingBox()
    const c = makeBody!()
    c.apply(body())
    const g = whole(c.root).geometry
    g.computeBoundingBox()
    expect(cut.boundingBox!.min.distanceTo(g.boundingBox!.min)).toBeLessThan(0.05)
    expect(cut.boundingBox!.max.distanceTo(g.boundingBox!.max)).toBeLessThan(0.05)
    const strips = Array.from({ length: 9 }, (_, i) => ({ x: i === 0 ? -40 : 0, y: 0, z: 0, rot: 0, tilt: 0 }))
    b.apply(body({ strips }))
    cut.computeBoundingBox()
    expect(cut.boundingBox!.min.x).toBeLessThan(g.boundingBox!.min.x - 30)
  })

  it('reports the light it gives off: none at rest, the hot tip, a glowing hole, and the daylight down each bore', () => {
    const b = makeBody!()
    const out: Emitter[] = []
    b.apply(body())
    b.emit!(out)
    expect(out.length).toBe(0)
    b.apply(body({ heat: 1, holes: [{ x: 4.2, y: 9.5, r: 2, glow: 1 }, { x: 6, y: 15, r: 1, glow: 0 }] }))
    b.emit!(out)
    expect(out.length).toBe(4)
    expect(out.every((e) => e.power > 0 && e.z > 0)).toBe(true)
  })

  it('knows the shape it is built on', () => {
    expect(inside(4.2, 9.5)).toBeGreaterThan(1)
    expect(inside(-1, -1)).toBeLessThan(0)
    expect(heightAt(4.2, 9.5)).toBeGreaterThan(heightAt(0.2, 9.5))
  })
})

describe('the cursor effects model', () => {
  const make = (look: EffectsLook, turn = 0): number[] => {
    const b = makeBody!()
    b.apply(body({}, look.time))
    const e = makeEffects!()
    e.apply(look, b, turn)
    return matrices(e.root)
  }

  it('draws nothing at rest', () => {
    expect(make(effects()).length).toBe(0)
  })

  it('is the same for the same look and time, and moves with time', () => {
    const all = effects({ sweat: 1, steam: 1, smoke: [{ x: 4.2, y: 9.5, amount: 1 }], dust: 0.4 })
    const a = make(all)
    expect(a.length).toBeGreaterThan(16 * 20)
    expect(make(all)).toEqual(a)
    expect(a.every((v) => Number.isFinite(v))).toBe(true)
    expect(make({ ...all, time: 0.9 })).not.toEqual(a)
  })

  it('draws more with more sweat, steam and smoke, and a puff of dust only while it lasts', () => {
    expect(make(effects({ sweat: 1 })).length).toBeGreaterThan(make(effects({ sweat: 0.3 })).length)
    expect(make(effects({ steam: 1 })).length).toBeGreaterThan(0)
    expect(make(effects({ smoke: [{ x: 1, y: 2, amount: 1 }, { x: 5, y: 9, amount: 1 }] })).length).toBeGreaterThan(make(effects({ smoke: [{ x: 1, y: 2, amount: 1 }] })).length)
    expect(make(effects({ dust: 0.3 })).length).toBeGreaterThan(0)
    expect(make(effects({ dust: -1 })).length).toBe(0)
    expect(make(effects({ dust: 1 })).length).toBe(0)
  })

  it('names its meshes as the effects part', () => {
    const e = makeEffects!()
    const parts: unknown[] = []
    e.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) parts.push(o.userData.part)
    })
    expect(parts.length).toBeGreaterThan(0)
    expect(parts.every((p) => p === 'cursor-effects')).toBe(true)
  })
})

describe('the cursor detail texture', () => {
  it('is made from the seed alone', () => {
    const a = detailData(64, 7)
    const b = detailData(64, 7)
    const c = detailData(64, 8)
    expect(Array.from(a)).toEqual(Array.from(b))
    expect(Array.from(a)).not.toEqual(Array.from(c))
    expect(a.length).toBe(64 * 64 * 4)
  })
})
