import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { careersLayout, CARD, WIDTH, Z } from '../src/pages/marketing/layout'
import { applyButton } from '../src/pages/marketing/real/apply-button'
import { careersPage } from '../src/pages/marketing/real/careers-page'
import { ICONS, perkCards } from '../src/pages/marketing/real/perk-cards'
import { ticker } from '../src/pages/marketing/real/ticker'
import type { PartMaker, RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('marketing'), pages, driver: new ScriptDriver(), film: filmOptions('marketing') })
const steps = (seconds: number): number => Math.round(seconds * stepHz)

function at(seconds: number): Shape[] {
  const s = film()
  s.advance(steps(seconds))
  const list: DrawList = []
  s.page.draw(list)
  return list as Shape[]
}

const context = (list: Shape[], time: number): RealContext => ({ page: 'marketing', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })

const MAKERS: Record<string, PartMaker> = { 'perk-cards': perkCards!, ticker: ticker!, 'apply-button': applyButton!, 'careers-page': careersPage! }

function sound(o: THREE.Object3D, id: string): { triangles: number; meshes: number; box: THREE.Box3 } {
  let triangles = 0
  let meshes = 0
  const box = new THREE.Box3()
  o.traverse((n) => {
    const m = n as THREE.Mesh
    if (!m.isMesh) return
    meshes++
    const p = m.geometry.getAttribute('position')
    for (let i = 0; i < p.count; i++) expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), id).toBe(true)
    const index = m.geometry.getIndex()
    if (index) for (let i = 0; i < index.count; i++) expect(index.getX(i), id).toBeLessThan(p.count)
    triangles += (index ? index.count : p.count) / 3
    m.geometry.computeBoundingBox()
    box.union(m.geometry.boundingBox!)
  })
  return { triangles, meshes, box }
}

describe('the real careers page', () => {
  it('has a maker for every shape of its four parts and of no other part, and every object is sound', () => {
    for (const t of [0, 3.7, 9, 11, 12.7]) {
      const list = at(t)
      const ctx = context(list, t)
      for (const s of list) {
        expect(Object.keys(MAKERS), `${t} ${s.id}`).toContain(s.part)
        const maker = MAKERS[s.part!]!
        const key = maker.key(s, ctx)
        expect(key, `${t} ${s.id}`).not.toBeNull()
        if (key === '' || (s.kind === 'text' && (t > 0 || s.y > 300))) continue
        const o = maker.make(s, ctx)
        const r = sound(o, s.id)
        expect(r.triangles, s.id).toBeGreaterThan(0)
        maker.pose?.(o, s, ctx)
        maker.drop?.(o)
      }
    }
  })

  it('draws each stretch of the website as one white sheet from edge to edge with what is printed on it, in two meshes at most', () => {
    const list = at(0)
    const ctx = context(list, 0)
    const sheets = list.filter((s) => s.role === 'sheet')
    expect(sheets.length).toBe(8)
    let triangles = 0
    for (const s of sheets) {
      const o = careersPage!.make(s, ctx)
      const r = sound(o, s.id)
      triangles += r.triangles
      expect(r.meshes, s.id).toBeLessThanOrEqual(2)
      expect(r.box.min.x, s.id).toBeCloseTo(-WIDTH / 2, 3)
      expect(r.box.max.x, s.id).toBeCloseTo(WIDTH / 2, 3)
      expect(r.box.max.y - r.box.min.y, s.id).toBeGreaterThanOrEqual(s.h - 0.01)
      expect(r.box.max.z, s.id).toBeLessThan(Z.type)
      expect(careersPage!.key(s, ctx)).toBe(careersPage!.key({ ...s }, ctx))
    }
    expect(triangles).toBeLessThan(60000)
  })

  it('sets its type flat in the colour asked for, with nothing built anew while a card turns', () => {
    const list = at(0)
    const ctx = context(list, 0)
    const title = list.find((s) => s.id === 'perk-0-title')!
    const key = careersPage!.key(title, ctx)
    expect(careersPage!.key({ ...title, y: title.y + 9, v: [0.4] }, ctx)).toBe(key)
    const o = careersPage!.make(title, ctx)
    careersPage!.pose!(o, { ...title, v: [0.4] }, ctx)
    expect(o.scale.y).toBeCloseTo(0.4, 6)
    careersPage!.pose!(o, title, ctx)
    expect(o.scale.y).toBe(1)
    const inks = new Set<number>()
    for (const s of list) {
      if (s.kind !== 'text' || s.y > 1080) continue
      const m = careersPage!.make(s, ctx)
      m.traverse((n) => {
        const mesh = n as THREE.Mesh
        if (mesh.isMesh) inks.add((mesh.material as THREE.MeshBasicMaterial).color.getHex())
      })
    }
    expect(inks.size).toBeGreaterThanOrEqual(4)
    expect(inks.size).toBeLessThanOrEqual(7)
  })

  it('makes a card with a face and a back, of which one shows, squeezed to its edge at the middle of the turn', () => {
    const list = at(0)
    const ctx = context(list, 0)
    const cards = list.filter((s) => s.role === 'perkCard')
    expect(cards.length).toBe(8)
    expect(ICONS.length).toBe(8)
    const keys = new Set(cards.map((s) => perkCards!.key(s, ctx)))
    expect(keys.size).toBe(8)
    const card = cards[0]!
    expect([card.w, card.h]).toEqual([CARD.w, CARD.h])
    const o = perkCards!.make(card, ctx)
    const front = o.getObjectByName('front')!
    const back = o.getObjectByName('back')!
    perkCards!.pose!(o, card, ctx)
    expect([front.visible, back.visible, o.scale.y]).toEqual([true, false, 1])
    perkCards!.pose!(o, { ...card, v: [0.3] }, ctx)
    expect([front.visible, back.visible]).toEqual([true, false])
    expect(o.scale.y).toBeCloseTo(0.3, 6)
    perkCards!.pose!(o, { ...card, v: [0] }, ctx)
    expect(o.scale.y).toBeLessThan(0.01)
    expect(o.scale.y).toBeGreaterThan(0)
    perkCards!.pose!(o, { ...card, v: [-1] }, ctx)
    expect([front.visible, back.visible, o.scale.y]).toEqual([false, true, 1])
    expect(perkCards!.key({ ...card, v: [-0.2] }, ctx)).toBe(perkCards!.key(card, ctx))
    expect(sound(front, 'front').triangles).toBeGreaterThan(sound(back, 'back').triangles)
  })

  it('takes the button down toward the sheet at a press, a little smaller and darker, and never under the sheet', () => {
    const rest = at(2.5).find((s) => s.id === 'final-cta-cap')!
    const ctx = context([rest], 2.5)
    const o = applyButton!.make(rest, ctx)
    applyButton!.pose!(o, rest, ctx)
    const up = o.position.z
    expect(o.getObjectByName('down')!.visible).toBe(false)
    expect(o.scale.x).toBe(1)
    let lowest = up
    let dark = 0
    const s = film()
    s.advance(steps(17.75))
    for (let i = 0; i < steps(0.95); i++) {
      s.advance(1)
      const list: DrawList = []
      s.page.draw(list)
      const cap = (list as Shape[]).find((d) => d.id === 'final-cta-cap')!
      const label = (list as Shape[]).find((d) => d.id === 'final-cta-label')!
      expect(label.z0).toBeCloseTo(cap.z1, 6)
      o.position.z = 0
      applyButton!.pose!(o, cap, ctx)
      lowest = Math.min(lowest, o.position.z)
      if (o.getObjectByName('down')!.visible) dark++
      expect(cap.z1).toBeGreaterThan(Z.sheet + 1)
      expect(applyButton!.key(cap, ctx)).toBe(applyButton!.key(rest, ctx))
    }
    expect(up - lowest).toBeCloseTo(Z.button - Z.pressed, 3)
    expect(dark).toBeGreaterThan(steps(0.2))
    expect(careersLayout().layout.children!.length).toBe(8)
  })
})
