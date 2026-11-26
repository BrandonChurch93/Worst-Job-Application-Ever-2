import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { makePage } from '../src/pages/step3'
import { homePose } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { CameraPose, Shape } from '../src/stage/types'
import { BALL, TIER_Y, floorZ } from '../src/table/layout'

const CLOSE = ['table-wide', 'table-lobby', 'table-replyall', 'table-fired', 'table-save', 'rail', 'ride']
const HITS = ['plunger', 'doors-slam', 'bumper', 'sling', 'scoop-kick', 'flipper-save', 'drain']
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
const far = (a: number[], b: number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!)
const beats = config.film.beats.filter((b) => b.unit === 'pinball')
const keys = (config.keys as { id: string; unit: string; beat: string; at: number; camera: string }[]).filter((k) => k.unit === 'pinball')

interface Row { time: number; film: CameraPose; named: Record<string, CameraPose | null>; shown: string[] }
const run = (): { rows: Row[]; events: { name: string; time: number }[] } => {
  const s = film()
  const rows: Row[] = []
  while (!s.finished && s.time < 39) {
    s.advance(4)
    const list: Shape[] = []
    s.page.draw(list)
    const named: Record<string, CameraPose | null> = {}
    for (const name of CLOSE) named[name] = s.page.camera(name, s.time)
    rows.push({ time: s.time, film: s.page.camera('film', s.time)!, named, shown: list.filter((x) => x.kind === 'text' && x.id.startsWith('display.')).map((x) => x.id) })
  }
  return { rows, events: s.events.map((e) => ({ name: e.name, time: e.step / stepHz })) }
}
const taken = run()
const cuts = taken.rows.filter((r, i) => i > 0 && far(r.film.eye, taken.rows[i - 1]!.film.eye) > 2 * BALL).map((r) => r.time)

describe('the cameras of the pinball machine', () => {
  it('keeps the three tier cameras as the home camera moved down the page', () => {
    const page = makePage()
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    for (const [k, name] of [[0, 'tier-3'], [1, 'tier-2']] as const) expect(page.camera(name, 0)).toEqual(homePose(TIER_Y[k]! * BALL, floorZ(k) * BALL))
    const street = page.camera('tier-1', 0)!
    expect(street.fov).toBe(config.cameras.home.fovDeg)
    expect(street.focus).toBeUndefined()
    expect(street.eye[0]).toBe(0)
    expect(street.target[0]).toBe(0)
  })

  it('gives every close camera a focus distance on the ball and an open lens', () => {
    for (const r of taken.rows) {
      for (const name of CLOSE) {
        const p = r.named[name]!
        expect(p.aperture, name).toBeGreaterThan(0)
        expect(p.focus, name).toBeGreaterThanOrEqual(BALL)
        expect(p.focus!, name).toBeLessThan(60 * BALL)
        expect(Number.isFinite(p.eye[0] + p.eye[1] + p.eye[2] + p.target[0] + p.target[1] + p.target[2]), name).toBe(true)
      }
    }
  })

  it('shows every key of the film through the camera the key names', () => {
    for (const key of keys) {
      const beat = beats.find((b) => b.id === key.beat)!
      const at = beat.from + (beat.to - beat.from) * key.at
      const row = taken.rows.reduce((a, b) => (Math.abs(b.time - at) < Math.abs(a.time - at) ? b : a))
      if (key.camera === 'home' || key.camera.startsWith('tier-')) continue
      expect(far(row.film.eye, row.named[key.camera]!.eye), key.id).toBeLessThan(1)
    }
  })

  it('cuts inside the beats and never beside a hit', () => {
    expect(cuts.length).toBeGreaterThanOrEqual(10)
    expect(cuts.length).toBeLessThanOrEqual(14)
    const hits = taken.events.filter((e) => HITS.includes(e.name))
    expect(hits.length).toBeGreaterThan(8)
    for (const c of cuts) for (const h of hits) expect(Math.abs(c - h.time), `cut at ${c}, ${h.name} at ${h.time}`).toBeGreaterThanOrEqual(0.15)
  })

  it('shakes a little on a hard hit and is still again half a second later', () => {
    const slam = taken.events.find((e) => e.name === 'doors-slam')!.time
    const moved = (r: Row): number => far(r.film.target, r.named['table-lobby']!.target)
    const near = taken.rows.filter((r) => r.time >= slam && r.time < slam + 0.1)
    expect(Math.max(...near.map(moved))).toBeGreaterThan(0.5)
    expect(Math.max(...near.map(moved))).toBeLessThan(0.05 * far(near[0]!.film.eye, near[0]!.film.target))
    const later = taken.rows.filter((r) => r.time >= slam + 0.6 && r.time < slam + 0.9)
    expect(later.length).toBeGreaterThan(0)
    for (const r of later) expect(moved(r)).toBe(0)
  })

  it('is the same film twice', () => {
    const again = run()
    expect(again.rows.length).toBe(taken.rows.length)
    for (let i = 0; i < again.rows.length; i += 7) expect(again.rows[i]!.film).toEqual(taken.rows[i]!.film)
  })
})

describe('the words of the inserts', () => {
  it('puts no word on or beside an insert', () => {
    const page = makePage()
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    const list: Shape[] = []
    page.draw(list)
    expect(list.filter((x) => x.id.startsWith('insert-label.') || x.id.startsWith('insert-plate.'))).toEqual([])
  })

  it('shows a mode by its name first and its line after, on the display of its tier', () => {
    const names = new Set<string>()
    const lines = new Set<string>()
    for (const r of taken.rows) {
      const name = r.shown.filter((id) => id.endsWith('.insert'))
      const line = r.shown.filter((id) => /\.\d+$/.test(id))
      for (const id of name) {
        names.add(id)
        expect(lines.has(id.slice(0, -7)), id).toBe(false)
        expect(line.includes(id.slice(0, -7)), id).toBe(false)
      }
      for (const id of line) lines.add(id)
    }
    expect(names.size).toBeGreaterThanOrEqual(6)
    for (const id of names) expect(lines.has(id.slice(0, -7)), id).toBe(true)
  })
})
