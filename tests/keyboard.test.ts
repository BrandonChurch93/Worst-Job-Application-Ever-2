import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { seats } from '../src/pages/step1/keyboard'
import { keyboard } from '../src/pages/step1/real/keyboard'
import { turrets } from '../src/pages/step1/real/turrets'
import type { Emitter, RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const steps = (seconds: number): number => Math.round(seconds * stepHz)

function listOf(s: Stage): Shape[] {
  const list: DrawList = []
  s.page.draw(list)
  return list as Shape[]
}

function context(list: Shape[], time: number, asked: Emitter[] = []): RealContext {
  return { page: 'step1', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: (e) => asked.push(e) }
}

interface Slot { mesh: THREE.InstancedMesh; index: number }
interface DeckData { caps: Map<string, Slot>; meshes: THREE.InstancedMesh[] }

const isCap = (s: Shape): boolean => s.role === 'keycap' && s.kind !== 'text'

function placeOf(slot: Slot): THREE.Vector3 {
  const m = new THREE.Matrix4()
  slot.mesh.getMatrixAt(slot.index, m)
  return new THREE.Vector3().setFromMatrixPosition(m)
}

function follows(o: THREE.Object3D, list: Shape[]): void {
  const deck = list.find((s) => s.id === 'keyboard-deck')!
  const caps = (o.userData.deck as DeckData).caps
  for (const s of list.filter(isCap)) {
    const slot = caps.get(s.id)
    expect(slot, s.id).toBeDefined()
    expect(slot!.index).toBeLessThan(slot!.mesh.count)
    const p = placeOf(slot!)
    expect(p.x).toBeCloseTo(s.x + s.w / 2 - (deck.x + deck.w / 2), 3)
    expect(p.y).toBeCloseTo(-(s.y + s.h / 2 - (deck.y + deck.h / 2)), 3)
    expect(p.z).toBeCloseTo(s.z1 - deck.z0, 3)
  }
}

describe('the real keyboard', () => {
  it('gives every seat of the data a cap, and the instanced caps follow the shapes through the rise, the shots, the shuffle and the sinking', () => {
    const s = film()
    let o: THREE.Object3D | null = null
    let seen = 0
    let flown = 0
    for (let t = 0.25; t <= 31.75; t += 0.25) {
      s.advance(steps(0.25))
      const list = listOf(s)
      const ctx = context(list, t)
      const deck = list.find((c) => c.id === 'keyboard-deck')
      if (!deck) continue
      expect(keyboard.key(deck, ctx)).toMatch(/^deck:/)
      const shapes = list.filter(isCap)
      expect(shapes.length).toBe(seats.length)
      for (const c of shapes) expect(keyboard.key(c, ctx)).toBe('')
      if (!o) {
        o = keyboard.make(deck, ctx)
        expect((o.userData.deck as DeckData).caps.size).toBe(seats.length)
      }
      keyboard.pose!(o, deck, ctx)
      follows(o, list)
      if (shapes.some((c) => c.z0 > deck.z1 + 4)) flown++
      seen++
    }
    expect(seen).toBeGreaterThan(60)
    expect(flown).toBeGreaterThan(0)
  })

  it('draws equal caps as one instanced mesh for each size', () => {
    const s = film()
    s.advance(steps(6))
    const list = listOf(s)
    const deck = list.find((c) => c.id === 'keyboard-deck')!
    const o = keyboard.make(deck, context(list, 6))
    keyboard.pose!(o, deck, context(list, 6))
    const meshes = (o.userData.deck as DeckData).meshes
    const sizes = new Set(seats.map((c) => `${c.w}x${c.h}`))
    expect(meshes.length).toBeLessThanOrEqual(sizes.size + 1)
    expect(meshes.reduce((n, m) => n + m.count, 0)).toBe(seats.length)
  })
})

describe('the real turrets', () => {
  it('answers for every shape of the part, makes an object for each kind and lights every bolt with a shadow', () => {
    const s = film()
    const made = new Map<string, number>()
    let boltLights = 0
    for (let t = 0.1; t <= 31.9; t += 0.1) {
      s.advance(steps(0.1))
      const list = listOf(s)
      const asked: Emitter[] = []
      const ctx = context(list, t, asked)
      for (const c of list) {
        if (c.part !== 'turrets' || c.kind === 'well' || c.kind === 'text') continue
        const key = turrets.key(c, ctx)
        expect(key, c.id).not.toBeNull()
        if (!key) continue
        const n = made.get(key) ?? 0
        made.set(key, n + 1)
        if (n > 12) continue
        const o = turrets.make(c, ctx)
        const before = asked.length
        turrets.pose!(o, c, ctx)
        if (key === 'bolt') {
          expect(asked.length).toBe(before + 1)
          expect(asked[before]!.shadow).toBe(true)
          boltLights++
        }
        o.traverse((child) => {
          const m = child as THREE.Mesh
          if (!m.isMesh) return
          expect(Number.isFinite(m.position.x + m.position.y + m.position.z + m.scale.x + m.scale.y)).toBe(true)
        })
        turrets.drop?.(o)
      }
      for (const e of asked) expect(Number.isFinite(e.x + e.y + e.z + e.power + e.reach)).toBe(true)
    }
    for (const key of ['hatch', 'turret', 'bolt', 'scorch']) expect(made.get(key) ?? 0, key).toBeGreaterThan(0)
    expect(boltLights).toBeGreaterThan(0)
  })
})
