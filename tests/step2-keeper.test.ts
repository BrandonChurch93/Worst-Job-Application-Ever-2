import { drawBuilt } from '../src/pages/step2/index'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { stepHz } from '../src/config'
import { HANDOFF } from '../src/cursor/body'
import { pages } from '../src/pages'
import { STAGE, CRANK, DIAL_BODY, ROWS, SLOT } from '../src/pages/step2/layout'
import { plainCrank as crank, CRANK_LOOK } from '../src/pages/step2/real/crank'
import { faceGeometry, fanFace, glintGeometry, holesGeometry } from '../src/pages/step2/real/dial'
import { actingAt, filmAt, pointerAt } from '../src/pages/step2/script'
import type { RealContext } from '../src/real/types'
import type { Shape } from '../src/stage/types'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const LONG = 24.9
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2').map((f) => (f.closes !== undefined ? { ...f, closes: LONG } : f)), pages, driver: new ScriptDriver(), film: filmOptions('step2') })

function listAt(seconds: number): Shape[] {
  const s = film()
  s.advance(Math.round(seconds * stepHz))
  const list: DrawList = []
  drawBuilt(s.page, list)
  return list as Shape[]
}

const context = (list: Shape[]): RealContext => ({ page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })

describe('the film of step 2 as its keeper left it', () => {
  it('keeps the pointer under the cursor at the hand-off place until the page has set it down', () => {
    for (const t of [0, 0.25, 0.5]) expect(pointerAt(t)).toMatchObject({ x: HANDOFF.x, y: HANDOFF.y, down: false })
    const rest = pointerAt(1)
    expect(Math.hypot(rest.x - 1575, rest.y - 392)).toBeLessThan(1e-6)
  })

  it('is angry for the stamp and has a cool head at the crank', () => {
    expect(actingAt(filmAt(13.9))).toBe('angry')
    for (const t of [14.3, 14.8, 15.2]) expect(actingAt(filmAt(t))).toBe('plain')
    expect(actingAt(filmAt(15.3))).toBe('shocked')
  })

  it('shuts the page over the dial and over the slot machine only once each is under it', () => {
    const s = film()
    for (const [row, body, from, to] of [[0, 'dial', 7.2, 7.9], [1, 'slot', 13.9, 14.5]] as const) {
      s.advance(Math.round(from * stepHz) - s.step)
      let widest = 0
      let shuts = -1
      let under = -1
      for (let t = from; t < to; t += 1 / stepHz) {
        s.advance(1)
        const list: DrawList = []
        s.page.draw(list)
        const hole = (list as Shape[]).find((x) => x.id === `${ROWS[row]}-hole`)
        const parts = (list as Shape[]).filter((x) => x.part === body && x.kind !== 'text' && !x.id.startsWith('coin-'))
        if (hole) widest = Math.max(widest, hole.h)
        if (shuts < 0 && widest > 0 && (!hole || hole.h < widest - 1)) shuts = t
        if (under < 0 && widest > 0 && parts.every((x) => x.z1 < 0)) under = t
      }
      expect(widest, body).toBeGreaterThan(200)
      expect(under, body).toBeGreaterThan(0)
      expect(shuts, body).toBeGreaterThan(under)
    }
  })

  it('hangs the pulled lever from a bracket at the cabinet side', () => {
    expect(SLOT.pivotY).toBeGreaterThan(SLOT.knobY)
    expect(SLOT.pivotY).toBeLessThan(SLOT.knobY + SLOT.pull)
    expect(SLOT.pivotY).toBeLessThan(SLOT.y + SLOT.h)
  })
})

describe('the parts of step 2 as their keeper left them', () => {
  it('gives the meter a picture of at least four texels to the page pixel and keeps it off the upright wall', () => {
    expect(CRANK_LOOK.picture[0] / (CRANK.segW * STAGE.times[2]!)).toBeGreaterThanOrEqual(3)
    expect(CRANK_LOOK.picture[1] / CRANK.segH).toBeGreaterThanOrEqual(4)
    const s: Shape = { id: 'meter-1', part: 'crank', kind: 'capsule', x: 0, y: 0, w: CRANK.segW, h: CRANK.segH, z0: -8, z1: 4, tone: 'glass' }
    const ctx = context([s])
    const o = crank!.make(s, ctx)
    crank!.pose!(o, s, ctx)
    const meshes: THREE.Mesh[] = []
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) })
    expect(meshes.length).toBe(4)
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
    for (let i = 1; i <= Math.round((LONG - 0.6) * stepHz); i++) {
      s.advance(1)
      const now = s.cursor.pose()
      across = Math.max(across, Math.hypot(now.x - was.x, now.y - was.y))
      up = Math.max(up, Math.abs(now.z - was.z))
      was = now
    }
    expect(across).toBeLessThan(24 * STAGE.times[0]!)
    expect(up).toBeLessThan(12 * STAGE.times[0]!)
  })
})
