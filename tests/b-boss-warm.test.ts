import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { WARM } from '../src/boss/tune'
import { pages } from '../src/pages'
import { real } from '../src/pages/step4/real'
import { weaponsOnce } from '../src/pages/step4/real/boss-weapons'
import type { RealContext } from '../src/real/types'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { Shape } from '../src/stage/types'

// The warm-up (the Builder's rulings of 17:01Z and 18:52Z): every material of the arena, the boss and the finish figure has a stand-in that draws nothing, for a few frames, and nothing of it stays.
const WRAPPED: [string, string][] = [['boss-arena', 'arena'], ['boss-look1', 'boss-look'], ['boss-finish', 'finish-figure']]
const context = (list: Shape[]): RealContext => ({ page: 'step4', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => {} })
const stage = new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
stage.frameAt(12)
const crack = stage.events.find((e) => e.name === 'button-crack')!.step / stepHz
const listAt = (t: number): Shape[] => stage.frameAt(t).list
const anchor = (list: Shape[], id: string): Shape => list.find((s) => s.id === id)!
const hallOf = (o: THREE.Object3D): THREE.Object3D | undefined => o.getObjectByName('warm-up')
const drawn = (o: THREE.Object3D): boolean => {
  const m = o as THREE.Mesh
  return Boolean(m.geometry && m.material) && !(o as THREE.SkinnedMesh).isSkinnedMesh && !(o as unknown as THREE.Sprite).isSprite && Object.keys(m.geometry.morphAttributes).length === 0
}
const materialsOf = (o: THREE.Object3D, skip?: THREE.Object3D): Set<string> => {
  const all = new Set<string>()
  const walk = (c: THREE.Object3D): void => {
    if (c === skip) return
    if (drawn(c)) for (const m of [(c as THREE.Mesh).material].flat()) all.add(m.uuid)
    for (const k of c.children) walk(k)
  }
  walk(o)
  return all
}
const show = (o: THREE.Object3D): void => {
  const hall = hallOf(o)
  if (!hall || !hall.visible) return
  for (const c of hall.children) (c.onBeforeRender as () => void)()
}

describe('the warm-up of the boss page', () => {
  it('gives every material under each wrapped part, shown or hidden, a stand-in of the same kind that draws nothing', () => {
    const list = listAt(crack + 0.05)
    for (const [name, id] of WRAPPED) {
      const part = real.parts[name]!
      const o = part.make(anchor(list, id), context(list))
      const hall = hallOf(o)!
      expect(hall, name).toBeDefined()
      const stood = new Set(hall.children.map((c) => ((c as THREE.Mesh).material as THREE.Material).uuid))
      const wanted = materialsOf(o, hall)
      expect(wanted.size, name).toBeGreaterThan(0)
      for (const m of wanted) expect(stood.has(m), `${name} ${m}`).toBe(true)
      let hidden = 0
      o.traverse((c) => { if (c !== hall && c.parent !== hall && drawn(c) && !c.visible) hidden++ })
      if (name === 'boss-arena') {
        expect(hidden, name).toBeGreaterThan(0)
        const once = o.userData.once as THREE.Object3D[]
        expect(once.length).toBe(weaponsOnce.make().length)
        for (const w of once) for (const m of materialsOf(w)) expect(stood.has(m), `weapons ${m}`).toBe(true)
      }
      for (const c of hall.children) {
        const t = c as THREE.Mesh
        expect(t.geometry.drawRange.count, name).toBe(0)
        expect(t.frustumCulled, name).toBe(false)
        expect(t.geometry.index, name).toBeNull()
      }
      part.drop?.(o)
    }
  })

  it('keeps a stand-in true to the thing it stands for: the same attributes, the same kind, the same shadow flags', () => {
    const list = listAt(crack + 0.05)
    for (const [name, id] of WRAPPED) {
      const part = real.parts[name]!
      const o = part.make(anchor(list, id), context(list))
      const hall = hallOf(o)!
      const sign = (c: THREE.Object3D): string => {
        const m = c as THREE.Mesh
        const kind = (c as THREE.InstancedMesh).isInstancedMesh ? 'many' : (c as unknown as THREE.Points).isPoints ? 'points' : (c as unknown as THREE.Line).isLine ? 'line' : 'mesh'
        return [m.material].flat().map((x) => [x.uuid, kind, Object.keys(m.geometry.attributes).sort().join(','), m.castShadow, m.receiveShadow, (c as THREE.InstancedMesh).isInstancedMesh ? (c as THREE.InstancedMesh).instanceColor !== null : false].join('|')).join(' ')
      }
      const stood = new Set(hall.children.map(sign))
      o.traverse((c) => {
        if (c === hall || c.parent === hall || !drawn(c)) return
        for (const one of sign(c).split(' ')) expect(stood.has(one), `${name} ${c.name} ${one}`).toBe(true)
      })
      part.drop?.(o)
    }
  })

  it('is hidden before the button cracks, in the scene for WARM.frames drawn frames from then, and gone after', () => {
    expect(WARM.frames).toBeGreaterThanOrEqual(1)
    for (const [name, id] of WRAPPED) {
      const part = real.parts[name]!
      let t = crack - 0.2
      let list = listAt(t)
      const o = part.make(anchor(list, id), context(list))
      part.pose!(o, anchor(list, id), context(list))
      expect(hallOf(o)!.visible, name).toBe(false)
      show(o)
      part.pose!(o, anchor(list, id), context(list))
      expect(hallOf(o), name).toBeDefined()
      for (let n = 0; n < WARM.frames; n++) {
        t = crack + WARM.after + (n + 1) / 60
        list = listAt(t)
        part.pose!(o, anchor(list, id), context(list))
        expect(hallOf(o), `${name} frame ${n}`).toBeDefined()
        expect(hallOf(o)!.visible, `${name} frame ${n}`).toBe(true)
        show(o)
      }
      list = listAt(t + 1 / 60)
      part.pose!(o, anchor(list, id), context(list))
      expect(hallOf(o), name).toBeUndefined()
      expect(o.userData.hall, name).toBeNull()
      part.drop?.(o)
    }
  })

  it('leaves nothing when the page is let go while the stand-ins are still there: every geometry of theirs is let go, and the weapons made for it too', () => {
    const list = listAt(crack + 0.05)
    for (const [name, id] of WRAPPED) {
      const part = real.parts[name]!
      const o = part.make(anchor(list, id), context(list))
      part.pose!(o, anchor(list, id), context(list))
      const hall = hallOf(o)!
      let made = 0, gone = 0
      for (const c of hall.children) {
        made++
        ;(c as THREE.Mesh).geometry.addEventListener('dispose', () => { gone++ })
      }
      const once = o.userData.once as THREE.Object3D[]
      let rings = 0, ringsGone = 0
      for (const w of once) {
        const ring = w.getObjectByName('ring') as THREE.Mesh | undefined
        if (!ring) continue
        rings++
        ;(ring.material as THREE.Material).addEventListener('dispose', () => { ringsGone++ })
      }
      expect(name === 'boss-arena' ? rings : 1, name).toBe(1)
      part.drop?.(o)
      expect(made, name).toBeGreaterThan(0)
      expect(gone, name).toBe(made)
      expect(ringsGone, name).toBe(rings)
      expect(hallOf(o), name).toBeUndefined()
      expect((o.userData.once as THREE.Object3D[]).length, name).toBe(0)
    }
  })
})
