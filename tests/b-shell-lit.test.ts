import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { CursorView } from '../src/cursor/view'
import { pages } from '../src/pages'
import type { RealContext } from '../src/real/types'
import { ScriptDriver, Stage, wholeFilmFlow } from '../src/stage/stage'

const PER = Math.round(stepHz / 60)
const WHOLE = Math.round(config.film.units.reduce((n, u) => n + u.seconds, 0) * 60)
// How far the turn given to the room's lights may stand off the turn of the stand, as the largest difference of one number of the two: the sums are exact but for rounding.
const OFF = 1e-12
interface Row { i: number; turn: number; rides: boolean; over: boolean; turning: boolean; off: number; plain: boolean; held: number; shown: number }

// The film is run whole. On every frame the cursor's view is put where the shell puts it (a stand that turns against the page) and given the frame's cursor; what is read back is the turn the room's two lights get before they light the body.
// This holds the sums only: the tone of the face on the picture is measured on rendered frames and written in pipeline/change002/shell.md, section 11z.
const run = (): Row[] => {
  const s = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver() })
  const stand = new THREE.Group()
  stand.matrixAutoUpdate = false
  const view = new CursorView()
  stand.add(view.root)
  const ctx = { page: '', list: [], byId: new Map(), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined } as RealContext
  const room = new THREE.Matrix3()
  const rows: Row[] = []
  for (let i = 0; i < WHOLE; i++) {
    const f = s.frameAt(((i + 1) * PER) / stepHz)
    if (s.turning) stand.matrix.makeRotationX(-f.turn).setPosition(0, -f.scroll * (1 - Math.cos(f.turn)), -f.scroll * Math.sin(f.turn))
    else stand.matrix.identity()
    ctx.time = f.time ?? 0
    ctx.scroll = f.scroll
    ctx.turning = s.turning
    view.apply(f.cursor, ctx)
    const body = (view as unknown as { body: { lit: THREE.Matrix3; deform: { gulp: number } } }).body
    const lit = body.lit
    room.setFromMatrix4(stand.matrix)
    rows.push({ i, turn: f.turn, rides: f.cursor.rides === true, over: f.cursor.over === true, turning: s.turning, off: Math.max(...lit.elements.map((e, k) => Math.abs(e - room.elements[k]!))), plain: lit.equals(new THREE.Matrix3()), held: f.cursor.gulp, shown: body.deform.gulp })
  }
  view.dispose()
  return rows
}

describe("the light on the film's lifted arrow while a page comes in", () => {
  const rows = run()
  const coming = rows.filter((r) => r.over && r.turn < 0)
  const first = (list: Row[]): Row[] => list.filter((r, k) => k === 0 || list[k - 1]!.i !== r.i - 1)

  it('has an arrow standing over a page that comes in from edge on in five turns, and never one that rides', () => {
    expect(first(coming).filter((r) => r.turn < -Math.PI / 4).length).toBe(5)
    expect(rows.filter((r) => r.over && (r.rides || !r.turning))).toEqual([])
  })

  it("brings the room's two lights round to the arrow by the turn of its stand on every such frame", () => {
    const worst = coming.reduce((a, r) => (r.off > a.off ? r : a))
    expect(worst.off, `frame ${worst.i + 1}`).toBeLessThan(OFF)
    expect(coming.filter((r) => r.plain).map((r) => r.i + 1)).toEqual([])
  })

  it('leaves the lights where they are when the arrow rides its page, when the page leaves, and when no page turns', () => {
    const rest = rows.filter((r) => !(r.over && r.turn < 0))
    expect(rest.filter((r) => !r.plain).map((r) => r.i + 1)).toEqual([])
  })

  it('leaves them on the frames where a leaving page pulls back toward the viewer under a lifted arrow', () => {
    const back = rows.filter((r) => r.turning && !r.rides && !r.over && r.turn < 0)
    expect(first(back).length).toBe(5)
    expect(back.every((r) => r.plain)).toBe(true)
  })

  it('shows no swallow on an arrow held over a page that comes in, and the swallow the stage holds on every other frame', () => {
    const over = rows.filter((r) => r.over)
    expect(over.filter((r) => r.held >= 0).length).toBeGreaterThan(0)
    expect(over.filter((r) => r.shown !== -1).map((r) => r.i + 1)).toEqual([])
    const rest = rows.filter((r) => !r.over)
    expect(rest.filter((r) => r.held >= 0).length).toBeGreaterThan(0)
    expect(rest.filter((r) => r.shown !== (r.held < 0 ? -1 : Math.min(1, Math.max(0, r.held)))).map((r) => r.i + 1)).toEqual([])
  })
})
