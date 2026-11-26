import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { Emitter, RealContext } from '../src/real/types'
import { coinGeometry, coinHeight, coinPose, sheenGeometry, slot, SLOT_LOOK } from '../src/pages/step2/real/slot'
import { lathe, loft, normalsFrom } from '../src/pages/step2/real/slot-kit'
import { SLOT, TOP, TRAY_Z } from '../src/pages/step2/layout'
import { roundedRect } from '../src/shell/solids'
import type { Shape } from '../src/stage/types'

const shape = (id: string, kind: Shape['kind'], x: number, y: number, w: number, h: number, z0: number, z1: number, tone: Shape['tone'], over: Partial<Shape> = {}): Shape => ({ id, part: 'slot', kind, x, y, w, h, z0, z1, tone, ...over })

const pivot = SLOT.knobY + SLOT.pull + 34

const shapes = (tag = '', p = 0): Shape[] => [
  shape(`${tag}slot-cabinet`, 'box', SLOT.x, SLOT.y, SLOT.w, SLOT.h, TRAY_Z, TOP + 8, 'metal', { r: 12 }),
  shape(`${tag}slot-window`, 'box', SLOT.x + 10, SLOT.y + 14, SLOT.w - 20, SLOT.h - 28, TOP + 8, TOP + 10, 'dark', { r: 8 }),
  ...[0, 1, 2].map((r) => shape(`${tag}slot-reel-${r}`, 'box', SLOT.reelX(r), SLOT.reelY, SLOT.reelW, SLOT.reelH, TOP + 10, TOP + 14, 'paper', { r: 6 })),
  shape(`${tag}slot-knob`, 'disc', SLOT.leverX - 22, SLOT.knobY + SLOT.pull * p - 22, 44, 44, TOP + 12, TOP + 40, 'accent'),
  shape(`${tag}slot-payout`, 'box', SLOT.payX, SLOT.payY, SLOT.payW, SLOT.payH, TRAY_Z, 6, 'dark', { r: 6 }),
  shape(`${tag}slot-mount`, 'box', SLOT.x + SLOT.w - 2, pivot - 10, 50, 20, 0, TOP, 'metal', { r: 4 }),
  shape(`${tag}slot-arm`, 'capsule', SLOT.leverX - 6, SLOT.knobY + SLOT.pull * p, 12, pivot - (SLOT.knobY + SLOT.pull * p), TOP, TOP + 12, 'raised')
]

const coins = (tag: string, n: number): Shape[] => Array.from({ length: n }, (_, k) => shape(`${tag}coin-${k}`, 'disc', 1100 + k * 30, 700 + k * 7, 26, 26, k * 9, k * 9 + 4, 'light', { rot: k * 0.8 }))

function context(list: Shape[]): { ctx: RealContext; lights: Emitter[] } {
  const lights: Emitter[] = []
  const ctx: RealContext = { page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: (e) => lights.push(e) }
  return { ctx, lights }
}

function meshes(o: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = []
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) out.push(c as THREE.Mesh)
  })
  return out
}

function sound(g: THREE.BufferGeometry, name: string): void {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  expect(p.count, name).toBeGreaterThan(0)
  for (let i = 0; i < p.count; i++) {
    if (!Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))) throw new Error(`${name}: point ${i} is not a number`)
    const l = Math.hypot(n.getX(i), n.getY(i), n.getZ(i))
    if (Math.abs(l - 1) > 1e-3) throw new Error(`${name}: normal ${i} has length ${l}`)
  }
  const index = g.getIndex()!
  for (let i = 0; i < index.count; i++) if (index.getX(i) >= p.count) throw new Error(`${name}: index past the last point`)
}

describe('the slot machine', () => {
  it('makes or hands on every shape of the part', () => {
    const list = [...shapes(), ...coins('', 3)]
    const { ctx } = context(list)
    const own = ['slot-cabinet', 'slot-knob', 'slot-payout', 'slot-mount', 'slot-arm']
    for (const s of list) {
      const key = slot!.key(s, ctx)
      expect(key, s.id).not.toBeNull()
      expect(key === '', s.id).toBe(!own.includes(s.id))
    }
  })

  it('answers the shapes of the sheet as it answers the page', () => {
    const { ctx } = context([])
    const page = [...shapes(), ...coins('', 2)]
    const sheet = [...shapes('sheet-'), ...coins('sheet-', 2)]
    page.forEach((s, i) => expect(slot!.key(sheet[i]!, ctx), s.id).toBe(slot!.key(s, ctx)))
  })

  it('keeps nothing of a frame in its key', () => {
    const { ctx } = context([])
    const rest = shapes('', 0)
    const pulled = shapes('', 1)
    rest.forEach((s, i) => expect(slot!.key({ ...pulled[i]!, z1: s.z1 - 3, moved: true }, ctx), s.id).toBe(slot!.key(s, ctx)))
  })

  it('builds solids whose points are numbers and whose normals have length one', () => {
    const list = shapes()
    const { ctx } = context(list)
    for (const s of list) {
      if (slot!.key(s, ctx) === '') continue
      const o = slot!.make(s, ctx)
      slot!.pose!(o, s, ctx)
      const all = meshes(o)
      expect(all.length, s.id).toBeGreaterThan(0)
      for (const m of all) {
        sound(m.geometry, s.id)
        expect(m.userData.standIn, s.id).toBeUndefined()
      }
    }
    sound(coinGeometry(), 'coin')
    sound(sheenGeometry(300, 100, 1), 'sheen')
  })

  it('builds the same coin, the same face and the same glass twice', () => {
    const a = coinGeometry()
    const b = coinGeometry()
    expect(Array.from(b.getAttribute('position').array)).toEqual(Array.from(a.getAttribute('position').array))
    expect(Array.from(b.getAttribute('normal').array)).toEqual(Array.from(a.getAttribute('normal').array))
    const f = normalsFrom(64, 1.7, (u, v) => coinHeight(u, v, 5))
    const g = normalsFrom(64, 1.7, (u, v) => coinHeight(u, v, 5))
    expect(Array.from(g.image.data as Uint8Array)).toEqual(Array.from(f.image.data as Uint8Array))
    const other = normalsFrom(64, 1.7, (u, v) => coinHeight(u, v, 6))
    expect(Array.from(other.image.data as Uint8Array)).not.toEqual(Array.from(f.image.data as Uint8Array))
  })

  it('keeps the drums under the legends, the line as a wire over them, and the glass over all', () => {
    const legend = TOP + 14 - TRAY_Z
    expect(SLOT_LOOK.drum.crest).toBeLessThan(legend)
    expect(SLOT_LOOK.line.z - SLOT_LOOK.line.r).toBeGreaterThan(legend + 0.3)
    expect(SLOT_LOOK.line.z + SLOT_LOOK.line.r).toBeLessThan(SLOT_LOOK.glass)
    expect(SLOT_LOOK.glass).toBeGreaterThan(legend)
    expect(SLOT_LOOK.top).toBeGreaterThan(SLOT_LOOK.glass)
  })

  it('lets the glass be seen through, and lets it throw no shadow', () => {
    const list = shapes()
    const { ctx } = context(list)
    const o = slot!.make(list[0]!, ctx)
    const glass = meshes(o).filter((m) => (m.material as THREE.Material).transparent)
    expect(glass.length).toBe(2)
    for (const m of glass) {
      expect(m.castShadow).toBe(false)
      expect((m.material as THREE.Material).depthWrite).toBe(false)
      expect(m.userData.order).toBeGreaterThanOrEqual(SLOT_LOOK.glassOrder)
      expect(m.userData.order).toBeLessThan(900000)
    }
  })

  it('draws every coin of the list with one mesh, and none when there is none', () => {
    for (const tag of ['', 'sheet-']) {
      const base = shapes(tag)
      const payout = base.find((s) => s.id.endsWith('slot-payout'))!
      const { ctx } = context([...base, ...coins(tag, 14), ...coins(tag === '' ? 'sheet-' : '', 5)])
      const o = slot!.make(payout, ctx)
      slot!.pose!(o, payout, ctx)
      const inst = meshes(o).filter((m) => (m as THREE.InstancedMesh).isInstancedMesh) as THREE.InstancedMesh[]
      expect(inst.length).toBe(1)
      expect(inst[0]!.count).toBe(14)
      const m = new THREE.Matrix4()
      for (let i = 0; i < 14; i++) {
        inst[0]!.getMatrixAt(i, m)
        for (const v of m.elements) expect(Number.isFinite(v)).toBe(true)
      }
      const none = context(base)
      slot!.pose!(o, payout, none.ctx)
      expect(inst[0]!.count).toBe(0)
      expect(inst[0]!.visible).toBe(false)
    }
  })

  it('lays a coin flat on the page when it is down and tumbles it in the air', () => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const normal = new THREE.Vector3()
    for (let n = 0; n < 14; n++) {
      coinPose(10, 20, 0, n * 1.7, 1, n, m).decompose(p, q, s)
      normal.set(0, 0, 1).applyQuaternion(q)
      expect(normal.z).toBeCloseTo(1, 6)
      expect(p.z).toBeCloseTo(SLOT_LOOK.coin.t / 2, 6)
    }
    let tipped = 0
    for (let n = 0; n < 14; n++) {
      coinPose(10, 20, 30, n * 1.7, 1, n, m).decompose(p, q, s)
      normal.set(0, 0, 1).applyQuaternion(q)
      if (normal.z < 0.95) tipped++
      expect(p.z - SLOT_LOOK.coin.r * Math.sqrt(1 - normal.z * normal.z)).toBeGreaterThanOrEqual(30 - 1e-6)
    }
    expect(tipped).toBeGreaterThan(6)
    const a = coinPose(1, 2, 12, 0.4, 0.5, 3, new THREE.Matrix4()).elements.slice()
    coinPose(9, 9, 40, 2, 1, 7, m)
    expect(coinPose(1, 2, 12, 0.4, 0.5, 3, m).elements).toEqual(a)
  })

  it('shortens the lever as the knob comes down, and keeps the rod round', () => {
    const { ctx } = context([])
    const rest = shapes('', 0).find((s) => s.id === 'slot-arm')!
    const pulled = shapes('', 1).find((s) => s.id === 'slot-arm')!
    const o = slot!.make(rest, ctx)
    slot!.pose!(o, rest, ctx)
    const rod = meshes(o)[0]!
    const long = rod.scale.y
    expect(rod.scale.x).toBe(1)
    expect(rod.scale.z).toBe(1)
    slot!.pose!(o, pulled, ctx)
    expect(rod.scale.y).toBeLessThan(long)
    expect(rod.scale.y).toBeGreaterThan(pulled.h)
  })

  it('hides the machine while it is down in its tray', () => {
    const { ctx } = context([])
    const down = { ...shapes()[0]!, z1: TRAY_Z }
    const o = slot!.make(down, ctx)
    slot!.pose!(o, down, ctx)
    expect(o.visible).toBe(false)
  })
})

describe('the tools of the slot machine', () => {
  it('turns a line into a solid without a zero normal where two points meet', () => {
    sound(lathe([[10, 0], [10, 4, true], [10, 4], [8, 6], [0, 6]], 12), 'lathe')
  })

  it('joins outlines ring to ring and closes the last', () => {
    const g = loft([{ o: roundedRect(40, 20, 4, 4), z: 0, out: 1, up: 0 }, { o: roundedRect(40, 20, 4, 4), z: 5, out: 1, up: 0 }, { o: roundedRect(36, 16, 2, 4), z: 5, out: 0, up: 1 }], 1)
    sound(g, 'loft')
  })
})
