import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { makeLayout, markOf, turned } from '../src/pages/step5/layout'
import { GIVE, READ } from '../src/pages/step5/script'
import { AT, FILM, SAID, VIEW, pushAt, windowAt } from '../src/pages/step5/timeline'
import { boxOf } from '../src/shell/layout'
import { homeDistance, projectPage } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type Pointer } from '../src/stage/stage'
import type { CameraPose } from '../src/stage/types'

// The film's slow push-in under the narrator's line on the stamp (VIEW in src/pages/step5/timeline.ts).
const hz = stepHz
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('decision'), pages, driver: new ScriptDriver(), film: filmOptions('decision') })
const home = homeDistance()
const zoomOf = (v: CameraPose): number => home / (v.eye[2] - v.target[2])
const straightDown = (v: CameraPose): boolean => v.eye[0] === v.target[0] && v.eye[1] === v.target[1] && v.fov === config.cameras.home.fovDeg
const jolted = (t: number): boolean => t >= FILM.flat - 1 / hz && t < FILM.flat + 0.3 + 1 / hz

// The views of the unit, one a step, while the decision page is on.
const views = (): { t: number; view: CameraPose | null; cursor: { x: number; y: number; z: number } }[] => {
  const s = film()
  const out: { t: number; view: CameraPose | null; cursor: { x: number; y: number; z: number } }[] = []
  while (s.page.id === 'step5' && s.step < 40 * hz) {
    const c = s.cursor.pose()
    out.push({ t: s.pageTime, view: s.page.view(), cursor: { x: c.x, y: c.y, z: c.z } })
    s.advance(1)
  }
  return out
}

describe('the push-in of the Decision unit in the film', () => {
  const all = views()

  it('keeps its numbers in one place and in order: in from the landing to the start of the fifth phrase, out with the walk, whole before the press', () => {
    expect(VIEW.zoom).toBeGreaterThan(1)
    expect(VIEW.zoom).toBeLessThanOrEqual(1.5)
    expect(VIEW.in[0]).toBe(FILM.landed)
    expect(VIEW.in[1]).toBe(READ.sag)
    expect(VIEW.in[1]).toBeCloseTo(FILM.flat + SAID[4], 9)
    // Was 4 s or more under the take with pauses. The line is 6 s now and the arrow lands 1.6 s into it.
    expect(VIEW.in[1] - VIEW.in[0]).toBeGreaterThanOrEqual(3)
    expect(VIEW.out[0]).toBe(GIVE.walk[0])
    expect(VIEW.out[0]).toBeGreaterThanOrEqual(VIEW.in[1])
    expect(VIEW.out[1]).toBeCloseTo(FILM.press - VIEW.whole, 9)
    expect(VIEW.whole).toBeGreaterThanOrEqual(0.1)
    expect(VIEW.out[1]).toBeGreaterThan(VIEW.out[0])
    expect(pushAt(VIEW.in[0])).toBe(0)
    expect(pushAt(VIEW.in[1])).toBe(1)
    expect(pushAt(VIEW.out[0])).toBe(1)
    expect(pushAt(VIEW.out[1])).toBe(0)
    expect(windowAt(VIEW.in[1])).toEqual({ x: VIEW.at[0] - 960 / VIEW.zoom, y: VIEW.at[1] - 540 / VIEW.zoom, w: 1920 / VIEW.zoom, h: 1080 / VIEW.zoom })
  })

  it('shows the whole page before the stamp and from 0.1 s before the press on, so the press and the turn are seen whole', () => {
    expect(all.length).toBeGreaterThan(FILM.leave * hz)
    for (const f of all) {
      if (f.t < FILM.flat - 1 / hz) expect(f.view, `at ${f.t}`).toBeNull()
      if (f.t >= VIEW.out[1]) expect(f.view, `at ${f.t}`).toBeNull()
      // The hit's jolt is the only other view, and it is the whole page shaken up and down.
      if (jolted(f.t) && f.view) expect(zoomOf(f.view)).toBeCloseTo(1, 9)
      if (f.t >= FILM.flat + 0.3 + 1 / hz && f.t <= VIEW.in[0]) expect(f.view, `at ${f.t}`).toBeNull()
    }
    expect(all.some((f) => f.t >= FILM.press && f.t <= FILM.leave)).toBe(true)
  })

  it('goes in slowly and never back until the walk, is at its closest as the fifth phrase starts, and never shows past the page', () => {
    let last = 1
    let closest = 1
    for (const f of all) {
      if (!f.view || jolted(f.t)) continue
      expect(straightDown(f.view), `at ${f.t}`).toBe(true)
      const zoom = zoomOf(f.view)
      closest = Math.max(closest, zoom)
      if (f.t <= VIEW.out[0]) {
        expect(zoom, `at ${f.t}`).toBeGreaterThanOrEqual(last - 1e-9)
        // Slow: no more than 0.25 of a zoom in any second on the way in (it was 0.15 under the take with pauses).
        expect(zoom - last, `at ${f.t}`).toBeLessThanOrEqual(0.25 / hz + 1e-9)
      }
      if (f.t >= VIEW.in[1] && f.t <= VIEW.out[0]) expect(zoom, `at ${f.t}`).toBeCloseTo(VIEW.zoom, 9)
      last = zoom
      const w = windowAt(f.t)
      if (!w) continue
      expect(w.x).toBeGreaterThanOrEqual(-1e-6)
      expect(w.y).toBeGreaterThanOrEqual(-1e-6)
      expect(w.x + w.w).toBeLessThanOrEqual(1920 + 1e-6)
      expect(w.y + w.h).toBeLessThanOrEqual(1080 + 1e-6)
    }
    expect(closest).toBeCloseTo(VIEW.zoom, 9)
  })

  it('holds the REJECTED mark, the block at rest and the arrow inside every frame of it, below the caption', () => {
    const tree = makeLayout()
    const m = markOf()
    const mark = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({ ...turned({ cx: m.cx, cy: m.cy }, (a! * m.w) / 2, (b! * m.h) / 2), z: config.scale.heights.paper }))
    // The block lies on its side at its place: its box in the layout, 24 px more each way for the way it lies, from the page up to the height of its grip.
    const b = boxOf(tree, 'stamp')
    const block = [0, config.scale.heights.machineMinTop + 134].flatMap((z) => [[b.x - 24, b.y - 24], [b.x + b.w + 24, b.y - 24], [b.x + b.w + 24, b.y + b.h + 24], [b.x - 24, b.y + b.h + 24]].map(([x, y]) => ({ x: x!, y: y!, z })))
    // The arrow is 70 px long at this size and puffs up; 90 px each way from where it is holds it in every pose.
    const reach = config.cursor.heightPxAt1080 + 20
    // 30 px from the frame's edge: on the way out the arrow walks to the button, low on the page.
    const edge = 30
    let seen = 0
    for (const f of all) {
      if (!f.view || jolted(f.t)) continue
      seen++
      const arrow = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => ({ x: f.cursor.x + a! * reach, y: f.cursor.y + c! * reach, z: f.cursor.z }))
      for (const [name, points] of [['mark', mark], ['block', block], ['arrow', arrow]] as const) {
        for (const p of points) {
          const at = projectPage(f.view, p.x, p.y, p.z)
          expect(at.x, `${name} at ${f.t}`).toBeGreaterThanOrEqual(edge)
          expect(at.x, `${name} at ${f.t}`).toBeLessThanOrEqual(1920 - edge)
          expect(at.y, `${name} at ${f.t}`).toBeGreaterThanOrEqual(VIEW.clear + edge)
          expect(at.y, `${name} at ${f.t}`).toBeLessThanOrEqual(1080 - edge)
        }
      }
    }
    expect(seen).toBeGreaterThan((VIEW.out[1] - VIEW.in[0]) * hz - 3)
  })

  it('leaves the live site whole: a visitor\'s view is never closer than the page', () => {
    const still: Driver = { name: 'bot', input: (): Pointer => ({ x: 831, y: 751, down: false }) }
    const s = new Stage({ mode: 'live', flow: [{ page: 'step5' }, { page: 'marketing', variant: 'rejected' }], pages, driver: still, seed: config.seed })
    let n = 0
    while (s.page.id === 'step5' && s.step < 20 * hz) {
      const v = s.page.view()
      if (v) {
        n++
        expect(zoomOf(v)).toBeCloseTo(1, 9)
      }
      s.advance(1)
    }
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThanOrEqual(Math.ceil(0.3 * hz) + 1)
  })
})
