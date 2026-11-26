import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DIAL, DIAL_BODY, dialPlate, dialTop, ROW_HELPER, ROW_TITLE, TOP, TRAY, TRAY_H, TRAY_Z, VALUE_Z } from '../src/pages/step2/layout'
import { dial, edgesGeometry, faceGeometry, holeShadeGeometry, housingGeometry, hubGeometry, plateGeometry, seatGeometry, stopGeometry } from '../src/pages/step2/real/dial'
import { rows, trayFloor, trayFoot, trayJoint, trayLiner, trayRim, trayWallShade } from '../src/pages/step2/real/rows'
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

  it('lies under the floor of a field, hub and stop drawn down, until the tray has opened over it', () => {
    let seen = 0
    for (const t of [1.9, 1.94, 1.98, 2.02, 2.06]) {
      const list = listAt(t)
      const ctx = context(list, t)
      const wheel = list.find((s) => s.id === 'dial-wheel')
      const tray = list.find((s) => s.id === 'phone-tray')
      if (!wheel || !tray || tray.h >= TRAY_H * 0.9) continue
      seen++
      const o = dial.make(wheel, ctx)
      dial.pose!(o, wheel, ctx)
      const kept = o.userData.dial as { body: THREE.Group }
      o.updateMatrixWorld(true)
      expect(new THREE.Box3().setFromObject(kept.body).max.z + wheel.z0, `at ${t}`).toBeLessThan(VALUE_Z)
      if (wheel.z1 - wheel.z0 <= DIAL_BODY.rest) {
        const hub = (o.userData.dial as { hub: THREE.Mesh }).hub
        const box = new THREE.Box3().setFromObject(hub)
        expect(box.max.z - new THREE.Box3().setFromObject(kept.body.children[0]!).max.z, `hub at ${t}`).toBeLessThan(3)
        expect(hub.scale.z).toBeCloseTo(DIAL_BODY.hubFlat, 6)
      }
      for (const n of list.filter((v) => v.id.startsWith('dial-numeral-'))) expect(n.z1, n.id).toBeGreaterThan(TRAY_Z)
    }
    expect(seen).toBeGreaterThan(0)
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

  it('lays its soft shade on the floor away from the key only when it has risen, and keeps it under the plate', () => {
    const at = (t: number): { cast: THREE.Mesh; wheel: Shape } => {
      const list = listAt(t)
      const wheel = list.find((s) => s.id === 'dial-wheel')!
      const ctx = context(list, t)
      const o = dial.make(wheel, ctx)
      dial.pose!(o, wheel, ctx)
      return { cast: (o.userData.dial as { cast: THREE.Mesh }).cast, wheel }
    }
    const risen = at(3.2).cast
    expect(risen.scale.x).toBeCloseTo(1, 6)
    expect(Math.hypot(risen.position.x, risen.position.y)).toBeCloseTo(DIAL_BODY.castAway, 6)
    expect(risen.position.z).toBeLessThan(DIAL_BODY.plateLeast)
    expect(risen.castShadow).toBe(false)
    const low = at(1.9)
    expect(low.wheel.z1 - low.wheel.z0).toBeLessThanOrEqual(DIAL_BODY.rest)
    expect(low.cast.scale.x * (DIAL.r + DIAL_BODY.bezel + DIAL_BODY.castOut)).toBeLessThan(DIAL.r)
    expect(Math.hypot(low.cast.position.x, low.cast.position.y)).toBeCloseTo(0, 6)
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

  it('builds the tray as a joint, a rim, a liner, a floor and a shade, all finite, with unit normals, the same every time', () => {
    const tray = listAt(3.2).find((n) => n.id === 'phone-tray')!
    for (const [name, make] of Object.entries({ joint: trayJoint, rim: trayRim, liner: trayLiner, floor: trayFloor, shade: trayWallShade })) {
      const g = make(tray)
      const p = g.getAttribute('position')
      const n = g.getAttribute('normal')
      expect(p.count, name).toBeGreaterThan(8)
      for (let i = 0; i < p.count; i++) {
        expect(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)), name).toBe(true)
        expect(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1), name).toBeLessThan(1e-3)
        expect(p.getZ(i), name).toBeLessThanOrEqual(-TRAY_Z + 0.1)
        expect(p.getZ(i), name).toBeGreaterThanOrEqual(-0.5)
      }
      expect(Array.from(make(tray).getAttribute('position').array), name).toEqual(Array.from(p.array))
    }
  })

  it('lays the tray\'s floor in the shade of the wall on the light\'s side, and inside the foot of the wall', () => {
    const tray = listAt(3.2).find((n) => n.id === 'phone-tray')!
    const g = trayFloor(tray)
    const p = g.getAttribute('position')
    const c = g.getAttribute('color')
    const foot = trayFoot(-TRAY_Z)
    expect(foot).toBeGreaterThan(TRAY.joint + TRAY.rim)
    let shaded = 0
    let lit = 0
    let ns = 0
    let nl = 0
    for (let i = 0; i < p.count; i++) {
      expect(Math.abs(p.getX(i))).toBeLessThanOrEqual(tray.w / 2 - foot + 0.6)
      expect(Math.abs(p.getY(i))).toBeLessThanOrEqual(tray.h / 2 - foot + 0.6)
      if (p.getY(i) > tray.h / 2 - foot - 6 && Math.abs(p.getX(i)) < tray.w / 4) { shaded += c.getX(i); ns++ }
      if (p.getY(i) < -(tray.h / 2 - foot - 6) && Math.abs(p.getX(i)) < tray.w / 4) { lit += c.getX(i); nl++ }
    }
    expect(ns).toBeGreaterThan(4)
    expect(nl).toBeGreaterThan(4)
    expect(shaded / ns).toBeLessThan(lit / nl - 0.2)
  })

  it('rolls the rim under the page and lays the deep shade of the floor over the words on it, never over a thing standing on it', () => {
    const list = listAt(3.2)
    const tray = list.find((n) => n.id === 'phone-tray')!
    const rim = trayRim(tray).getAttribute('position')
    let top = -Infinity
    for (let i = 0; i < rim.count; i++) top = Math.max(top, rim.getZ(i))
    expect(top).toBeCloseTo(-TRAY_Z - TRAY.sink, 3)
    const soak = trayFloor(tray, TRAY.soak).getAttribute('color')
    let least = Infinity
    let most = -Infinity
    for (let i = 0; i < soak.count; i++) {
      least = Math.min(least, soak.getX(i))
      most = Math.max(most, soak.getX(i))
    }
    expect(least).toBeGreaterThan(0.05)
    expect(least).toBeLessThan(0.5)
    expect(most).toBeLessThanOrEqual(1)
    expect(TRAY.soakOver).toBeGreaterThan(0)
    expect(TRAY.soakOver).toBeLessThan(DIAL_BODY.rest)
    const o = rows.make(tray, context(list, 3.2))
    const multiplied = o.children.filter((c) => ((c as THREE.Mesh).material as THREE.Material).blending === THREE.CustomBlending)
    expect(multiplied.length).toBe(2)
    expect(multiplied.some((c) => c.position.z === TRAY.soakOver)).toBe(true)
  })

  it('sets the row titles semi-bold over a regular helper line, each a key of the copy', () => {
    const list = listAt(1.0)
    for (const name of ['phone', 'birth', 'volume']) {
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

  it('never leaves a reel\'s legend lying bare on the floor of a tray whose machine has sunk', () => {
    let sunk = 0
    for (let t = 13.2; t < 13.7; t += 0.02) {
      const list = listAt(t)
      const cabinet = list.find((s) => s.id === 'slot-cabinet')
      const legends = list.filter((s) => s.id.startsWith('reel-'))
      if (!cabinet || cabinet.z1 - cabinet.z0 > 2) continue
      sunk++
      expect(legends.length, `at ${t.toFixed(2)}`).toBe(0)
    }
    expect(sunk).toBeGreaterThan(0)
  })

  it('builds a tray on its way open for the height it has', () => {
    const list = listAt(2.15)
    const tray = list.find((n) => n.id === 'phone-tray')
    if (!tray) return
    const o = rows.make(tray, context(list, 2.15))
    const box = new THREE.Box3().setFromObject(o)
    expect(box.max.y - box.min.y).toBeLessThanOrEqual(tray.h + 1)
    expect(box.max.x - box.min.x).toBeLessThanOrEqual(tray.w + 1)
    rows.drop?.(o)
  })
})
