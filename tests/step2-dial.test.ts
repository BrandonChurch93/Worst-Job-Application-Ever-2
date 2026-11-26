import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DIAL, DIAL_BODY, dialTop, TOP, TRAY_H, TRAY_Z } from '../src/pages/step2/layout'
import { dial, edgesGeometry, faceGeometry, holeShadeGeometry, housingGeometry, hubGeometry, plateGeometry, seatGeometry, stopGeometry } from '../src/pages/step2/real/dial'
import { rows } from '../src/pages/step2/real/rows'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })

function listAt(seconds: number): Shape[] {
  const s = film()
  s.advance(Math.round(seconds * stepHz))
  const list: DrawList = []
  s.page.draw(list)
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
    for (const t of [2.3, 2.6, 3.2]) {
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
      for (const s of list.filter((n) => n.id.startsWith('dial-numeral-'))) expect(s.z1, s.id).toBeCloseTo(top - DIAL_BODY.plate, 6)
    }
    expect(dialTop(1)).toBe(TOP + 2 - TRAY_Z)
    expect(dialTop(0)).toBe(DIAL_BODY.rest)
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
    for (const t of [1, 2.2, 3.2, 8.4, 9.5, 14.3, 15.2, 20.5]) {
      const list = listAt(t)
      const ctx = context(list, t)
      for (const s of list.filter((n) => n.part === 'rows')) expect(rows.key(s, ctx), `${s.id} at ${t}`).not.toBeNull()
    }
  })

  it('cuts the open tray into the page as a pocket with round corners, never taller than its plan', () => {
    for (const t of [2.1, 2.2, 2.3, 2.5, 3.2]) {
      const tray = listAt(t).find((s) => s.id === 'phone-tray')
      if (!tray) continue
      expect(tray.pocket).toBe(true)
      expect(tray.kind).toBe('box')
      expect(tray.z0).toBe(TRAY_Z)
      expect(tray.h).toBeLessThanOrEqual(TRAY_H)
      expect(tray.r!).toBeLessThanOrEqual(tray.h / 2)
    }
    const open = listAt(3.2).find((s) => s.id === 'phone-tray')!
    expect(open.h).toBe(TRAY_H)
  })

  it('lights the open field with one ring and one caret, both lying in its pocket', () => {
    const list = listAt(3.2)
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
})
