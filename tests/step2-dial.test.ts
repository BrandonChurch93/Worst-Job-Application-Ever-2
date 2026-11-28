import { drawBuilt } from '../src/pages/step2/index'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DIAL, DIAL_BODY, dialPlate, dialTop, HOLE, ROW_HELPER, ROW_TITLE, TOP, TRAY_Z, VALUE_Z } from '../src/pages/step2/layout'
import { plainDial as dial, edgesGeometry, faceGeometry, holeShadeGeometry, housingGeometry, hubGeometry, plateGeometry, seatGeometry, stopGeometry } from '../src/pages/step2/real/dial'
import { pitFoot, rows } from '../src/pages/step2/real/rows'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })

function listAt(seconds: number): Shape[] {
  const s = film()
  s.advance(Math.round(seconds * stepHz))
  const list: DrawList = []
  drawBuilt(s.page, list)
  return list as Shape[]
}

const context = (list: Shape[], time: number): RealContext => ({ page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })

const solids = (): Record<string, THREE.BufferGeometry> => {
  const seat = seatGeometry()
  return { collar: seat.collar, gap: seat.gap, housing: housingGeometry(), plate: plateGeometry(), face: faceGeometry(), edges: edgesGeometry(), hub: hubGeometry(), stop: stopGeometry(), shade: holeShadeGeometry() }
}

describe('the dial as it is built', () => {
  it('has finite vertices and unit normals in every solid', () => {
    for (const [name, g] of Object.entries(solids())) {
      const p = g.getAttribute('position')
      const n = g.getAttribute('normal')
      expect(p.count, name).toBeGreaterThan(8)
      for (let i = 0; i < p.count; i++) {
        expect(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)), name).toBe(true)
        expect(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1), name).toBeLessThan(1e-3)
      }
    }
  })

  it('keeps every solid above the body\'s foot and inside its footprint', () => {
    const all = solids()
    for (const name of ['housing', 'plate', 'face', 'edges', 'hub']) {
      const p = all[name]!.getAttribute('position')
      for (let i = 0; i < p.count; i++) {
        expect(p.getZ(i), name).toBeGreaterThanOrEqual(-DIAL_BODY.below - 1e-6)
        expect(Math.hypot(p.getX(i), p.getY(i)), name).toBeLessThanOrEqual(DIAL.r + 1e-3)
      }
    }
    const seat = all.collar!.getAttribute('position')
    for (let i = 0; i < seat.count; i++) expect(seat.getZ(i)).toBeGreaterThan(0)
  })

  it('builds the same arrays every time', () => {
    const a = solids()
    const b = solids()
    for (const name of Object.keys(a)) expect(Array.from(a[name]!.getAttribute('position').array), name).toEqual(Array.from(b[name]!.getAttribute('position').array))
  })

  it('cuts ten holes through the wheel, each with the plate in sight under it', () => {
    const face = faceGeometry().getAttribute('position')
    for (let k = 1; k <= 10; k++) {
      const a = DIAL.holeAngle(k)
      const cx = DIAL.ring * Math.cos(a)
      const cy = -DIAL.ring * Math.sin(a)
      let nearest = Infinity
      for (let i = 0; i < face.count; i++) nearest = Math.min(nearest, Math.hypot(face.getX(i) - cx, face.getY(i) - cy))
      expect(nearest, `hole ${k}`).toBeGreaterThan(DIAL.hole - 0.01)
      expect(nearest, `hole ${k}`).toBeLessThan(DIAL.hole + 1)
    }
    expect(DIAL_BODY.plate).toBeGreaterThan(DIAL_BODY.thick)
    const web = 2 * DIAL.ring * Math.sin(DIAL.pitch / 2) - 2 * (DIAL.hole + DIAL_BODY.holeRim)
    expect(web).toBeGreaterThan(2)
  })

  it('shades the plate under a hole most on the side of the light', () => {
    const g = holeShadeGeometry()
    const p = g.getAttribute('position')
    const c = g.getAttribute('color')
    let lit = 0
    let dark = 1
    for (let i = 0; i < p.count; i++) {
      if (p.getX(i) < -6 && p.getY(i) > 6) dark = Math.min(dark, c.getX(i))
      if (p.getX(i) > 6 && p.getY(i) < -6) lit = Math.max(lit, c.getX(i))
    }
    expect(dark).toBeLessThan(0.75)
    expect(lit).toBeGreaterThan(0.97)
  })
})

describe('the dial on the page', () => {
  it('is drawn by one object: the wheel carries it and every other shape of the dial rides on it', () => {
    const list = listAt(3.2)
    const ctx = context(list, 3.2)
    const mine = list.filter((s) => s.part === 'dial')
    expect(mine.length).toBeGreaterThan(11)
    for (const s of mine) expect(dial.key(s, ctx), s.id).toBe(s.id === 'dial-wheel' ? 'dial' : '')
  })

  it('turns by the number the wheel is given, and the holes of the list are where the holes of the wheel are', () => {
    const list = listAt(3.2)
    const ctx = context(list, 3.2)
    const wheel = list.find((s) => s.id === 'dial-wheel')!
    expect(wheel.v).toBeDefined()
    const o = dial.make(wheel, ctx)
    dial.pose!(o, wheel, ctx)
    const kept = o.userData.dial as { body: THREE.Group; wheel: THREE.Group; shades: THREE.InstancedMesh }
    expect(kept.wheel.rotation.z).toBeCloseTo(-wheel.v![0]!, 6)
    const m = new THREE.Matrix4()
    for (let k = 1; k <= 10; k++) {
      const hole = list.find((s) => s.id === `dial-hole-${k}`)!
      const a = DIAL.holeAngle(k)
      const at = new THREE.Vector3(DIAL.ring * Math.cos(a), -DIAL.ring * Math.sin(a), 0).applyEuler(kept.wheel.rotation)
      expect(at.x, `hole ${k}`).toBeCloseTo(hole.x + hole.w / 2 - DIAL.cx, 3)
      expect(-at.y, `hole ${k}`).toBeCloseTo(hole.y + hole.h / 2 - DIAL.cy, 3)
      kept.shades.getMatrixAt(k - 1, m)
      expect(m.elements[12], `shade ${k}`).toBeCloseTo(at.x, 3)
      expect(m.elements[13], `shade ${k}`).toBeCloseTo(at.y, 3)
    }
  })

  it('rises as one body: its top is the wheel\'s top and its numerals stay on the plate', () => {
    for (const t of [2.05, 2.2, 2.3, 2.6, 3.2]) {
      const list = listAt(t)
      const ctx = context(list, t)
      const wheel = list.find((s) => s.id === 'dial-wheel')
      if (!wheel) continue
      const o = dial.make(wheel, ctx)
      dial.pose!(o, wheel, ctx)
      const kept = o.userData.dial as { body: THREE.Group }
      const top = wheel.z0 + kept.body.position.z + DIAL_BODY.tall
      expect(top).toBeCloseTo(wheel.z1, 6)
      expect(top).toBeGreaterThanOrEqual(TRAY_Z + DIAL_BODY.rest - 1e-6)
      for (const s of list.filter((n) => n.id.startsWith('dial-numeral-'))) expect(s.z1, s.id).toBeCloseTo(TRAY_Z + dialPlate(top - TRAY_Z), 6)
    }
    expect(dialTop(1)).toBe(TOP + 2 - TRAY_Z)
    expect(dialTop(0)).toBe(DIAL_BODY.rest)
  })

  it('comes up out of the page whole: on every step it is in the list it is as tall as it stands, and it is not in the list before its field is pressed', () => {
    let seen = 0
    for (const t of [2.1, 2.3, 2.5, 2.75, 3.63, 7.3, 7.5]) {
      const list = listAt(t)
      const wheel = list.find((s) => s.id === 'dial-wheel')
      if (!wheel) continue
      seen++
      expect(wheel.z1 - wheel.z0, `at ${t}`).toBeCloseTo(DIAL_BODY.tall, 6)
      for (const n of list.filter((v) => v.id.startsWith('dial-numeral-'))) expect(n.z1, n.id).toBeGreaterThan(TRAY_Z)
    }
    expect(seen).toBeGreaterThan(4)
    expect(listAt(1).find((s) => s.id === 'dial-wheel')).toBeUndefined()
  })


  it('lacquers the hub and cuts the face finer under the shared studio rules, never with a material of another law', () => {
    const list = listAt(3.2)
    const wheel = list.find((s) => s.id === 'dial-wheel')!
    const o = dial.make(wheel, context(list, 3.2))
    const found = new Map<string, THREE.MeshPhysicalMaterial>()
    o.traverse((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined
      if (m && (m.name === 'dial-hub' || m.name === 'dial-face')) found.set(m.name, m)
    })
    expect([...found.keys()].sort()).toEqual(['dial-face', 'dial-hub'])
    for (const m of found.values()) expect(m.customProgramCacheKey().startsWith('wja-studio'), m.name).toBe(true)
    const hub = found.get('dial-hub')!
    expect(hub.clearcoatRoughness).toBe(DIAL_BODY.hubCoat)
    expect(hub.roughness).toBe(DIAL_BODY.hubRough)
    expect(hub.ior).toBe(DIAL_BODY.hubIor)
  })

  it('lays its soft shade on the page away from the key once it stands, and keeps it under the plate', () => {
    const list = listAt(3.63)
    const wheel = list.find((s) => s.id === 'dial-wheel')!
    const ctx = context(list, 3.63)
    const o = dial.make(wheel, ctx)
    dial.pose!(o, wheel, ctx)
    const risen = (o.userData.dial as { cast: THREE.Mesh }).cast
    expect(risen.scale.x).toBeCloseTo(1, 6)
    expect(Math.hypot(risen.position.x, risen.position.y)).toBeCloseTo(DIAL_BODY.castAway, 6)
    expect(risen.position.z).toBeLessThan(DIAL_BODY.plateLeast)
    expect(risen.castShadow).toBe(false)
  })

  it('shows its numerals as words of the legends, never as shapes of its own', () => {
    const list = listAt(3.2)
    const numerals = list.filter((s) => s.id.startsWith('dial-numeral-'))
    expect(numerals.length).toBe(10)
    for (const s of numerals) {
      expect(s.kind).toBe('text')
      expect(s.words).toBe(`data:step2.dial.${s.id.slice(-1)}`)
    }
  })
})

describe('the rows as they are built', () => {
  it('makes every shape of the rows real on every beat', () => {
    for (const t of [1, 2.2, 3.63, 8.4, 9.6, 14.3, 15.9, 21.5]) {
      const list = listAt(t)
      const ctx = context(list, t)
      for (const s of list.filter((n) => n.part === 'rows')) expect(rows.key(s, ctx), `${s.id} at ${t}`).not.toBeNull()
    }
  })

  it('cuts the hole into the page as a round pocket, as deep as its plan and never wider', () => {
    let seen = 0
    for (const t of [2, 2.1, 2.3, 2.5, 7.3, 7.5]) {
      const hole = listAt(t).find((s) => s.id === 'phone-hole')
      if (!hole) continue
      seen++
      expect(hole.pocket).toBe(true)
      expect(hole.kind).toBe('box')
      expect(hole.z0).toBe(-HOLE.pit)
      expect(hole.w).toBeLessThanOrEqual(2 * HOLE.iris + 1e-6)
      expect(hole.h).toBeCloseTo(hole.w, 6)
      expect(hole.r!).toBeCloseTo(hole.w / 2, 6)
    }
    expect(seen).toBeGreaterThan(3)
    expect(listAt(3.63).find((s) => s.id === 'phone-hole')).toBeUndefined()
  })

  it('lights the pressed field with one ring lying in its pocket, and none before the press', () => {
    const list = listAt(1.9)
    const pocket = list.find((s) => s.id === 'phone-pocket')!
    const focus = list.filter((s) => s.id === 'field-focus')
    expect(focus.length).toBe(1)
    const f = focus[0]!
    expect(f.x).toBeGreaterThan(pocket.x)
    expect(f.x + f.w).toBeLessThan(pocket.x + pocket.w)
    expect(f.y).toBeGreaterThan(pocket.y)
    expect(f.y + f.h).toBeLessThan(pocket.y + pocket.h)
    expect(listAt(1).filter((s) => s.id === 'field-focus').length).toBe(0)
  })

  it('builds the hole as a lit lip, a wall that darkens to its foot and a dark floor, all finite, inside the hole and no deeper than its plan', () => {
    const list = listAt(2.3)
    const hole = list.find((n) => n.id === 'phone-hole')!
    expect(pitFoot(HOLE.pit)).toBeLessThan(hole.w / 2)
    const o = rows.make(hole, context(list, 2.3))
    const meshes = o.children as THREE.Mesh[]
    expect(meshes.length).toBe(3)
    for (const [k, m] of meshes.entries()) {
      const p = m.geometry.getAttribute('position')
      expect(p.count, `solid ${k}`).toBeGreaterThan(8)
      for (let i = 0; i < p.count; i++) {
        expect(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)), `solid ${k}`).toBe(true)
        expect(Math.hypot(p.getX(i), p.getY(i)), `solid ${k}`).toBeLessThanOrEqual(hole.w / 2 + 1)
        expect(p.getZ(i), `solid ${k}`).toBeLessThanOrEqual(HOLE.pit + 0.1)
        expect(p.getZ(i), `solid ${k}`).toBeGreaterThanOrEqual(-0.5)
      }
    }
    const wall = meshes[1]!.geometry
    const p = wall.getAttribute('position')
    const c = wall.getAttribute('color')
    let lit = 0
    let nl = 0
    let dark = 0
    let nd = 0
    for (let i = 0; i < p.count; i++) {
      if (p.getZ(i) > HOLE.pit * 0.8) { lit += c.getY(i); nl++ }
      if (p.getZ(i) < HOLE.pit * 0.1) { dark += c.getY(i); nd++ }
    }
    expect(nl).toBeGreaterThan(8)
    expect(nd).toBeGreaterThan(8)
    expect(lit / nl).toBeGreaterThan(0.5)
    expect(dark / nd).toBeLessThan(0.25)
    rows.drop?.(o)
  })


  it('sets the row titles semi-bold over a regular helper line, each a key of the copy', () => {
    for (const [name, at] of [['phone', 1.0], ['birth', 8.5], ['volume', 14.9]] as const) {
      const list = listAt(at)
      const title = list.find((n) => n.id === `${name}-label`)!
      const helper = list.find((n) => n.id === `${name}-helper`)!
      expect(title.type?.font).toBe(ROW_TITLE.font)
      expect(title.type?.px).toBe(ROW_TITLE.px)
      expect(helper.type?.font).toBe(ROW_HELPER.font)
      expect(ROW_TITLE.px).toBeGreaterThan(ROW_HELPER.px)
      expect(title.words).toBe(`copy:step2.rows.${name}.label`)
      expect(helper.words).toBe(`copy:step2.rows.${name}.helper`)
      expect(title.x).toBe(helper.x)
    }
  })

  it('never leaves a reel\'s legend lying bare on the page: a legend is in the list only while its own reel is, it lies on its reel\'s face, and the machine is in the list without its legends on some steps of its coming and of its going', () => {
    const sides: [string, number, number][] = [['coming', 9.4, 10.3], ['going', 13.95, 14.4]]
    for (const [side, from, to] of sides) {
      let under = 0
      let lying = 0
      for (let t = from; t < to; t += 0.02) {
        const at = `${side} at ${t.toFixed(2)}`
        const list = listAt(t)
        const cabinet = list.find((s) => s.id === 'slot-cabinet')
        const legends = list.filter((s) => s.id.startsWith('reel-'))
        if (!cabinet) expect(legends.length, at).toBe(0)
        else if (legends.length === 0) under++
        for (const legend of legends) {
          const reel = list.find((s) => s.id === `slot-reel-${legend.id.split('-')[1]}`)
          expect(reel, `${at} ${legend.id}`).toBeDefined()
          expect(legend.x, `${at} ${legend.id}`).toBeGreaterThanOrEqual(reel!.x)
          expect(legend.x + legend.w, `${at} ${legend.id}`).toBeLessThanOrEqual(reel!.x + reel!.w)
          expect(legend.y, `${at} ${legend.id}`).toBeGreaterThanOrEqual(reel!.y)
          expect(legend.y + legend.h, `${at} ${legend.id}`).toBeLessThanOrEqual(reel!.y + reel!.h)
          expect(Math.abs(legend.z0 - reel!.z1), `${at} ${legend.id}`).toBeLessThan(1e-6)
          lying++
        }
      }
      expect(under, side).toBeGreaterThan(0)
      expect(lying, side).toBeGreaterThan(0)
    }
  })

  it('builds a hole on its way open for the width it has', () => {
    const list = listAt(2)
    const hole = list.find((n) => n.id === 'phone-hole')!
    const o = rows.make(hole, context(list, 2))
    const box = new THREE.Box3().setFromObject(o)
    expect(box.max.y - box.min.y).toBeLessThanOrEqual(hole.h + 1)
    expect(box.max.x - box.min.x).toBeLessThanOrEqual(hole.w + 1)
    rows.drop?.(o)
  })
})
