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

interface Slot { start: number; count: number }
interface DeckData { caps: Map<string, Slot>; body: THREE.Mesh; accent: THREE.Mesh | null }

const isCap = (s: Shape): boolean => s.role === 'keycap' && s.kind !== 'text'

// Where a cap is drawn, read from the vertices the renderer is given: the middle of its outline and its highest point.
function placeOf(data: DeckData, id: string): THREE.Vector3 {
  if (id === 'key-enter') return data.accent!.position.clone()
  const slot = data.caps.get(id)!
  const p = data.body.geometry.getAttribute('position')
  const box = new THREE.Box3()
  for (let i = slot.start; i < slot.start + slot.count; i++) box.expandByPoint(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)))
  return new THREE.Vector3((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, box.max.z)
}

function follows(o: THREE.Object3D, list: Shape[]): void {
  const deck = list.find((s) => s.id === 'keyboard-deck')!
  const data = o.userData.deck as DeckData
  for (const s of list.filter(isCap)) {
    expect(data.caps.get(s.id), s.id).toBeDefined()
    const p = placeOf(data, s.id)
    const flying = s.z0 > deck.z1 + 0.01
    const tipped = !!s.v && s.v.length > 5 && (s.v[4] !== 0 || s.v[5] !== 0)
    const near = flying ? 3 + 0.2 * (s.z0 - deck.z1) : tipped ? 8 : 0.002
    expect(Math.abs(p.x - (s.x + s.w / 2 - (deck.x + deck.w / 2))), s.id).toBeLessThan(near)
    expect(Math.abs(p.y + (s.y + s.h / 2 - (deck.y + deck.h / 2))), s.id).toBeLessThan(near)
    expect(Math.abs(p.z - (s.z1 - deck.z0)), s.id).toBeLessThan(near)
  }
}

describe('the real keyboard', () => {
  it('gives every seat of the data a cap, and the caps follow the shapes through the rise, the shots, the shuffle and the sinking', () => {
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

  it('draws every cap in one mesh, the orange Enter over its core as a second that casts no shadow, the shadows of the caps in the air as two more, and writes again only the caps that moved', () => {
    const s = film()
    s.advance(steps(6))
    const list = listOf(s)
    const deck = list.find((c) => c.id === 'keyboard-deck')!
    const o = keyboard.make(deck, context(list, 6))
    keyboard.pose!(o, deck, context(list, 6))
    const data = o.userData.deck as DeckData
    const meshes: THREE.Mesh[] = []
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) })
    expect(meshes.length).toBe(7)
    expect(meshes.filter((m) => m.castShadow).length).toBe(3)
    expect(data.body.castShadow).toBe(false)
    expect(data.body.receiveShadow).toBe(true)
    expect(data.accent!.castShadow).toBe(false)
    expect(data.caps.has('key-enter')).toBe(true)
    const spots = data.body.geometry.getAttribute('position') as THREE.BufferAttribute
    const before = spots.version
    keyboard.pose!(o, deck, context(list, 6))
    expect(spots.version).toBe(before)
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
