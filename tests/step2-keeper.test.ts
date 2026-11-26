import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { HANDOFF } from '../src/cursor/body'
import { pages } from '../src/pages'
import { CRANK, DIAL_BODY, ROWS, SLOT, TRAY } from '../src/pages/step2/layout'
import { crank, CRANK_LOOK } from '../src/pages/step2/real/crank'
import { faceGeometry, fanFace, glintGeometry, holesGeometry } from '../src/pages/step2/real/dial'
import { actingAt, pointerAt } from '../src/pages/step2/script'
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

const context = (list: Shape[]): RealContext => ({ page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })

describe('the film of step 2 as its keeper left it', () => {
  it('keeps the pointer under the cursor at the hand-off place until the page has set it down', () => {
    for (const t of [0, 0.25, 0.5]) expect(pointerAt(t)).toMatchObject({ x: HANDOFF.x, y: HANDOFF.y, down: false })
    const rest = pointerAt(1)
    expect(Math.hypot(rest.x - 1575, rest.y - 395)).toBeLessThan(1e-6)
  })

  it('is angry for the stamp and has a cool head at the crank', () => {
    expect(actingAt(13.9)).toBe('angry')
    for (const t of [14.3, 14.8, 15.2]) expect(actingAt(t)).toBe('plain')
    expect(actingAt(15.3)).toBe('shocked')
  })

  it('shuts the tray over the sinking slot machine and not after it has gone', () => {
    let shut = -1
    let gone = -1
    for (let t = 13.0; t < 13.9; t += 1 / stepHz) {
      const list = listAt(t)
      const tray = list.find((s) => s.id === `${ROWS[1]}-tray`)
      const cabinet = list.find((s) => s.id === 'slot-cabinet')
      if (shut < 0 && tray && tray.h < 240) shut = t
      if (gone < 0 && (!cabinet || cabinet.z1 - cabinet.z0 < 1)) gone = t
      if (shut >= 0 && gone >= 0) break
    }
    expect(shut).toBeGreaterThan(0)
    expect(gone).toBeGreaterThan(0)
    expect(gone - shut).toBeGreaterThan(-0.04)
  })

  it('hangs the pulled lever from a bracket at the cabinet side', () => {
    expect(SLOT.pivotY).toBeGreaterThan(SLOT.knobY)
    expect(SLOT.pivotY).toBeLessThan(SLOT.knobY + SLOT.pull)
    expect(SLOT.pivotY).toBeLessThan(SLOT.y + SLOT.h)
  })
})

describe('the parts of step 2 as their keeper left them', () => {
  it('gives the meter a picture of at least four texels to the page pixel and keeps it off the upright wall', () => {
    expect(CRANK_LOOK.picture[0] / CRANK.segW).toBeGreaterThanOrEqual(4)
    expect(CRANK_LOOK.picture[1] / CRANK.segH).toBeGreaterThanOrEqual(4)
    const s: Shape = { id: 'meter-1', part: 'crank', kind: 'capsule', x: 0, y: 0, w: CRANK.segW, h: CRANK.segH, z0: -8, z1: 4, tone: 'glass' }
    const ctx = context([s])
    const o = crank!.make(s, ctx)
    crank!.pose!(o, s, ctx)
    const meshes: THREE.Mesh[] = []
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) })
    expect(meshes.length).toBe(2)
    const maps = meshes.map((m) => (m.material as THREE.MeshPhysicalMaterial).map)
    expect(maps.filter((m) => m !== null).length).toBe(1)
    const top = meshes.find((m) => (m.material as THREE.MeshPhysicalMaterial).map)!
    const wall = meshes.find((m) => !(m.material as THREE.MeshPhysicalMaterial).map)!
    const zOf = (m: THREE.Mesh): number[] => Array.from({ length: m.geometry.getAttribute('position').count }, (_, i) => m.geometry.getAttribute('position').getZ(i))
    expect(Math.max(...zOf(wall))).toBeLessThanOrEqual(Math.min(...zOf(top)) + 1e-6)
  })

  it('cuts a countersink round every finger hole and lays one sheen on the hub', () => {
    const holes = holesGeometry()
    const p = holes.getAttribute('position')
    expect(p.count).toBeGreaterThan(10 * 24)
    for (let i = 0; i < p.count; i++) expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i))).toBe(true)
    const glint = glintGeometry()
    const c = glint.getAttribute('color')
    expect(c.getX(0)).toBeCloseTo(DIAL_BODY.glint, 6)
    expect(c.getX(c.count - 1)).toBe(0)
  })

  it('keeps the shaded wall of a tray lighter than black and its lit side unshaded', () => {
    expect(TRAY.wallShade).toBeLessThan(0.7)
    expect(TRAY.wallShadeTop).toBeLessThan(TRAY.wallShade)
    expect(TRAY.rimShade).toBeGreaterThan(0.5)
  })

  it('keeps the bright fans of the dial with the light while the wheel turns', () => {
    const face = faceGeometry()
    const p = face.getAttribute('position')
    const c = face.getAttribute('color')
    const brightest = (turn: number): number => {
      fanFace(face, turn)
      let best = 0
      for (let i = 1; i < p.count; i++) if (c.getX(i) > c.getX(best)) best = i
      return Math.atan2(p.getY(best), p.getX(best)) - turn
    }
    const fold = (a: number): number => ((a % Math.PI) + Math.PI) % Math.PI
    const apart = (a: number, b: number): number => Math.min(fold(a - b), Math.PI - fold(a - b))
    expect(apart(brightest(0), brightest(1.1))).toBeLessThan(0.12)
    fanFace(face, 0)
    let low = Infinity
    let high = 0
    for (let i = 0; i < c.count; i++) {
      low = Math.min(low, c.getX(i))
      high = Math.max(high, c.getX(i))
    }
    expect(low).toBeGreaterThanOrEqual(DIAL_BODY.fanLow - 1e-6)
    expect(high).toBeLessThanOrEqual(DIAL_BODY.fanLow + DIAL_BODY.fanGain + 1e-6)
    expect(high - low).toBeGreaterThan(DIAL_BODY.fanGain * 0.9)
  })

  it('never moves the cursor to a grip or onto a machine in one step', () => {
    const s = film()
    let was = s.cursor.pose()
    let across = 0
    let up = 0
    for (let i = 1; i <= Math.round(20.4 * stepHz); i++) {
      s.advance(1)
      const now = s.cursor.pose()
      across = Math.max(across, Math.hypot(now.x - was.x, now.y - was.y))
      up = Math.max(up, Math.abs(now.z - was.z))
      was = now
    }
    expect(across).toBeLessThan(24)
    expect(up).toBeLessThan(12)
  })
})
