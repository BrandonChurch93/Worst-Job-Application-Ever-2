import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { pages } from '../src/pages'
import { CRANK_HOME, DIAL_REACH, HOUSED } from '../src/pages/step2'
import { config, stepHz } from '../src/config'
import { DIAL, DIAL_BODY, ROWS, TRAY, TRAY_H, TRAY_Z, trayY, VALUE_Z } from '../src/pages/step2/layout'
import { dial, DIAL_UNDER } from '../src/pages/step2/real/dial'
import type { RealContext } from '../src/real/types'
import { BotDriver, type BotName } from '../src/stage/bots'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'
import { bare, BODY, DRAWN, heights, leaver, LEAVER, openings, still, visit, visitor, type Row } from './polish-date-run'

// A tray counts as open once it is taller than this share of its full height: under it the tray is the 4 px slit it starts as.
const SLIVER = 0.02
// The opening as it was before the machines were housed (MEASURED on b3e4f902): steps of the stage from the row's first step to its tray at full height, to the machine at full height and to the row taking the visitor's hand.
const OPENING = { full: 53, whole: 97, ready: 99 }
// The whole visit of the page by each visitor, in steps (MEASURED on b3e4f902).
const VISIT = { down: 3302, up: 3301, itself: 35869, film: 48000 }
// The most a part of a machine may change its height in one step while its tray opens or shuts, as a share of its full height. The steepest step MEASURED is 0.0302, so the first risen step is a small step on from the housed one and no step is a pop.
const STEP_MOST = 0.04

const full = heights()
const visits: [string, Row[], number][] = [
  ['rows 1, 2, 3', visit(visitor([0, 1, 2]), full), VISIT.down],
  ['rows 3, 2, 1', visit(visitor([2, 1, 0]), full), VISIT.up],
  ['rows that open themselves', visit(still(), full), VISIT.itself],
  ['the film', visit('film', full), VISIT.film]
]

describe('polish date: a row of step 2 is never shown open and empty', () => {
  for (const [name, rows] of visits) {
    it(`${name}: on every step a tray is open, every standing part of its machine is drawn`, () => {
      expect(openings(rows, SLIVER).map((o) => o.row).sort()).toEqual([0, 1, 2])
      expect(bare(rows, SLIVER)).toEqual({})
      const open = rows.filter((r) => r.open >= 0 && r.tall > SLIVER * TRAY_H)
      expect(open.length).toBeGreaterThan(300)
      for (const r of open) expect(r.least, `step ${r.step}, row ${r.open + 1}, ${r.phase}`).toBeGreaterThan(DRAWN)
    })

    it(`${name}: the reels show their legends on every step the tray of the date is seen and the reels do not spin`, () => {
      const slot = rows.filter((r) => r.open === 1 && (r.phase === 'opening' || r.phase === 'closing'))
      expect(slot.length).toBeGreaterThan(150)
      for (const r of slot) expect(r.legends, `step ${r.step}, ${r.phase}`).toBe(3)
    })

    it(`${name}: a machine lies under the floor of the fields, which pass over it, until its rise starts and again once it has sunk`, () => {
      const under = rows.filter((r) => r.open >= 0 && r.lift === 0)
      expect(under.length).toBeGreaterThan(150)
      for (const r of under) expect(r.top, `step ${r.step}, row ${r.open + 1}, ${r.phase}, tray ${r.tall} px`).toBeLessThan(config.scale.heights.field)
    })

    it(`${name}: no machine pops as its tray opens or shuts, its height changes by a small share from one step to the next`, () => {
      let most = 0
      for (let n = 1; n < rows.length; n++) {
        const a = rows[n - 1]!
        const b = rows[n]!
        if (a.open < 0 || b.open !== a.open || (b.phase !== 'opening' && b.phase !== 'closing')) continue
        most = Math.max(most, Math.abs(b.least - a.least), Math.abs(b.most - a.most))
      }
      expect(most).toBeGreaterThan(0.01)
      expect(most).toBeLessThan(STEP_MOST)
    })
  }

  it('houses the slot and the crank at a share of their height that their makers draw', () => {
    expect(HOUSED).toBeGreaterThan(DRAWN)
    for (const [name, rows] of visits) {
      for (const o of openings(rows, SLIVER)) {
        const first = rows.find((r) => r.step === o.from)!
        expect(first.least, `${name}, row ${o.row + 1}`).toBeCloseTo(o.row === 0 ? 0.04 : HOUSED, 6)
      }
    }
  })
})

describe('polish date: the opening and the visit are as long as they were', () => {
  for (const [name, rows, steps] of visits) {
    it(`${name}: each row opens, stands whole and takes the hand on the same steps as before`, () => {
      const seen = openings(rows, SLIVER)
      expect(seen.length).toBe(3)
      for (const o of seen) {
        expect(o.full - o.from, `row ${o.row + 1} full`).toBe(OPENING.full)
        expect(o.whole - o.from, `row ${o.row + 1} whole`).toBe(OPENING.whole)
        expect(o.ready - o.from, `row ${o.row + 1} ready`).toBe(OPENING.ready)
      }
      expect(rows.length).toBe(steps)
    })
  }
})

const TURN = Math.PI * 2

// How often each bot shuts the crank's row on the page (MEASURED: two of them skip the page before they open it).
const SHUTS: Record<string, number> = { keen: 1, clumsy: 1, random: 0, skipper: 0 }

interface CrankSaved { open: number; phase: string; crank: { b: number; total: number; phase: string } }

// A visitor who opens the crank's row first, turns the crank by so much, lets go and waits for it to run away.
function stopper(turn: number): Driver {
  const inner = visitor([2, 1, 0])
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const st = v.page.save() as CrankSaved
      if (st.open === 2 && st.crank.phase === 'rest' && st.crank.total >= turn) return { x: 300, y: 900, down: false }
      return inner.input(v)
    }
  }
}

// How far outside the tray's floor the worst corner of the named parts (the crank's arm and grip unless told) lies on the step the lift begins to lower, for every shutting of that row in one visit: 0 or less is inside.
function overhang(stage: Stage, seconds: number, row = 2, ids = ['crank-arm', 'crank-grip']): number[] {
  const out: number[] = []
  let was = ''
  for (let i = 0; i < seconds * stepHz && stage.page.id === 'step2'; i++) {
    stage.advance(1)
    if (stage.page.id !== 'step2') break
    const st = stage.page.save() as CrankSaved
    const now = st.open === row ? st.phase : ''
    if (now === 'closing' && was !== 'closing') {
      const list: Shape[] = []
      stage.page.draw(list)
      const tray = list.find((x) => x.id === `${ROWS[row]}-tray`)!
      let worst = -Infinity
      for (const id of ids) {
        const part = list.find((x) => x.id === id)!
        const rot = part.rot ?? 0
        for (const u of [-1, 1])
          for (const v of [-1, 1]) {
            const x = part.x + part.w / 2 + (u * part.w * Math.cos(rot)) / 2 - (v * part.h * Math.sin(rot)) / 2
            const y = part.y + part.h / 2 + (u * part.w * Math.sin(rot)) / 2 + (v * part.h * Math.cos(rot)) / 2
            worst = Math.max(worst, tray.x + TRAY.rim - x, x - (tray.x + tray.w - TRAY.rim), tray.y + TRAY.rim - y, y - (tray.y + TRAY_H - TRAY.rim))
          }
      }
      out.push(worst)
    }
    was = now
  }
  return out
}

describe('polish date: the crank lies inside its tray before it goes down into it', () => {
  it('keeps the arc of the crank round its resting angle, the last angle of the film in it', () => {
    expect(CRANK_HOME.from).toBeLessThan(-0.9025)
    expect(CRANK_HOME.to).toBeGreaterThan(-0.75)
    expect(CRANK_HOME.to).toBeLessThanOrEqual(-0.5)
  })
  for (const bot of config.live.bots) {
    it(`bot ${bot}: on the step the lift begins to lower, every corner of the arm and the grip is inside the tray's floor`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: new BotDriver(bot as BotName, config.seed), seed: config.seed }), 200)
      expect(hang.length).toBe(SHUTS[bot])
      for (const h of hang) expect(h).toBeLessThanOrEqual(0)
    })
  }
  for (let k = 0; k < 8; k++) {
    it(`a visitor who stops turning ${k} eighths of a turn past one turn: the same`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: stopper(TURN + (k * TURN) / 8), seed: config.seed }), 200)
      expect(hang.length).toBe(1)
      expect(hang[0]).toBeLessThanOrEqual(0)
    })
  }
  for (const [name, make] of [['rows 1, 2, 3', () => visitor([0, 1, 2])], ['rows 3, 2, 1', () => visitor([2, 1, 0])], ['bot keen', () => new BotDriver('keen', config.seed)], ['bot clumsy', () => new BotDriver('clumsy', config.seed)]] as const) {
    it(`${name}: the slot's cabinet, lever, mount and payout are inside their tray's floor on the step the lift begins to lower`, () => {
      const hang = overhang(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: make(), seed: config.seed }), 200, 1, BODY[1]!)
      expect(hang.length).toBe(1)
      expect(hang[0]).toBeLessThanOrEqual(0)
    })
  }
  it('the film: the same, its run untouched', () => {
    const hang = overhang(new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), 200)
    expect(hang.length).toBe(1)
    expect(hang[0]).toBeLessThanOrEqual(0)
  })
})

// The angles of the arc a run or a Skip leaves the crank in, and whether an angle lies in it.
const inArc = (b: number): boolean => Math.abs(b - (CRANK_HOME.from + CRANK_HOME.to) / 2 - TURN * Math.round((b - (CRANK_HOME.from + CRANK_HOME.to) / 2) / TURN)) <= (CRANK_HOME.to - CRANK_HOME.from) / 2 + 1e-6
// The most steps a Skip may wait for the arm: the way round from one end of the arc to the other at the least speed of the way home (14 rad a second in src/pages/step2/index.ts).
const SKIP_WAIT = Math.ceil(((TURN - (CRANK_HOME.to - CRANK_HOME.from)) / 14) * stepHz)

// What a Skip leaves: the angle it caught the arm at, how many steps later the lift begins to lower, and how far outside the floor the arm and the grip then lie.
function skipped(driver: Driver): { caught: number; wait: number; hang: number[] } {
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed: config.seed })
  let caught = NaN
  let at = 0
  let wait = -1
  const probe: Driver = {
    name: 'bot',
    input(v: DriverView): Pointer {
      const out = driver.input(v)
      if (out.skip && !at) {
        at = v.pageStep
        caught = (v.page.save() as CrankSaved).crank.b
      }
      return out
    }
  }
  const run = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: probe, seed: config.seed })
  for (let i = 0; i < 60 * stepHz && run.page.id === 'step2'; i++) {
    run.advance(1)
    if (run.page.id !== 'step2') break
    const st = run.page.save() as CrankSaved
    if (at && wait < 0 && st.open === 2 && st.phase === 'closing') wait = i + 1 - at - 1
  }
  return { caught, wait, hang: overhang(stage, 60) }
}

describe('polish date: a Skip lets the crank\'s arm come inside its tray before the lift lowers', () => {
  const plain = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: leaver(0), seed: config.seed })
  const steps: number[] = []
  for (let i = 0; i < 40 * stepHz && plain.page.id === 'step2' && steps.length < 8; i++) {
    plain.advance(1)
    if (plain.page.id !== 'step2') break
    const st = plain.page.save() as CrankSaved
    if (st.open !== 2 || (st.crank.phase !== 'runaway' && st.crank.phase !== 'full')) continue
    const eighth = Math.floor((((st.crank.b % TURN) + TURN) % TURN) / (TURN / 8))
    if (eighth === steps.length) steps.push(i + 1)
  }
  it('finds a step of the run for each of eight angles of the arm', () => {
    expect(steps.length).toBe(8)
  })
  for (let k = 0; k < 8; k++) {
    it(`Skip pressed with the running arm in eighth ${k} of its turn: every corner of the arm and the grip is inside the tray's floor on the step the lift begins to lower`, () => {
      const r = skipped(leaver(steps[k]!))
      expect(r.hang.length).toBe(1)
      expect(r.hang[0]).toBeLessThanOrEqual(0)
      expect(r.wait).toBeGreaterThanOrEqual(0)
      expect(r.wait).toBeLessThanOrEqual(SKIP_WAIT)
      if (inArc(r.caught)) expect(r.wait).toBe(0)
    })
  }
  it('Skip pressed with the arm left at rest outside the arc by the visitor\'s own hand: it starts from rest and the same holds', () => {
    const inner = stopper(TURN + (3 * TURN) / 8)
    const r = skipped({
      name: 'bot',
      input(v: DriverView): Pointer {
        const out = inner.input(v)
        const st = v.page.save() as CrankSaved
        if (v.skipOffered && st.open === 2 && st.crank.phase === 'rest' && !out.down) out.skip = true
        return out
      }
    })
    expect(inArc(r.caught)).toBe(false)
    expect(r.hang.length).toBe(1)
    expect(r.hang[0]).toBeLessThanOrEqual(0)
    expect(r.wait).toBeGreaterThan(0)
    expect(r.wait).toBeLessThanOrEqual(SKIP_WAIT)
  })
  it('Skip pressed before the crank is touched: the lift lowers on the next step, as before', () => {
    const r = skipped(leaver(LEAVER.at + 4801))
    expect(inArc(r.caught)).toBe(true)
    expect(r.wait).toBe(0)
  })
})


// The dial's wheel on each step of a visit it is drawn at rest in a tray that is not yet whole, or is no longer: its height, where its tray's opening ends below its centre, and what its maker is told of that.
interface Housed { step: number; tall: number; edge: number; opening: boolean; told: number | null; wheel: Shape }
function housedDial(stage: Stage, seconds: number): Housed[] {
  const out: Housed[] = []
  let was = 0
  for (let i = 0; i < seconds * stepHz && stage.page.id === 'step2'; i++) {
    stage.advance(1)
    if (stage.page.id !== 'step2') break
    const list: Shape[] = []
    stage.page.draw(list)
    const wheel = list.find((s) => s.id === 'dial-wheel')
    const tray = list.find((s) => s.id === `${ROWS[0]}-tray`)
    const opening = Boolean(tray) && tray!.h >= was
    was = tray ? tray.h : 0
    if (!wheel || !tray || tray.h >= TRAY_H) continue
    out.push({ step: i, tall: wheel.z1 - wheel.z0, edge: trayY(0) + tray.h - DIAL.cy, opening, told: wheel.v && wheel.v.length > 1 ? wheel.v[1]! : null, wheel })
  }
  return out
}

// The steps of a visit on which part of the dial lies under the page: how many, how many of them while its tray opens, the dial's greatest height on them and its height on the last.
const UNDER = { live: { steps: 96, opening: 48, most: 4.16, last: 1.6 }, film: { steps: 96, opening: 48, most: 4.16, last: 1.6 } }

describe('polish date: the dial under the page is drawn low on the live site, and whole in the film', () => {
  const ctx = (list: Shape[]): RealContext => ({ page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })
  const solids = (o: THREE.Object3D): THREE.Mesh[] => {
    const out: THREE.Mesh[] = []
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.isMesh && !(c as THREE.InstancedMesh).isInstancedMesh && !(m.material as THREE.Material).transparent) out.push(m)
    })
    return out
  }
  const corner = new THREE.Vector3()
  const span = (o: THREE.Object3D): { least: number; most: number } => {
    o.updateMatrixWorld(true)
    let least = Infinity
    let most = -Infinity
    for (const m of solids(o)) {
      const at = m.geometry.getAttribute('position')
      for (let i = 0; i < at.count; i++) {
        const z = corner.fromBufferAttribute(at, i).applyMatrix4(m.matrixWorld).z
        least = Math.min(least, z)
        most = Math.max(most, z)
      }
    }
    return { least, most }
  }
  // Each solid of a dial told where the opening ends, beside the same solid of a whole one: how many corners were moved, the tallest wall the moved corners make, their highest point, and how many corners of a triangle that is not wholly past the line were moved.
  const lowered = (o: THREE.Object3D, whole: THREE.Object3D, line: number): { moved: number; wall: number; most: number; touched: number }[] => {
    o.updateMatrixWorld(true)
    whole.updateMatrixWorld(true)
    const a = solids(o)
    const b = solids(whole)
    return a.map((m, n) => {
      const low = m.geometry.getAttribute('position')
      const full = b[n]!.geometry.getAttribute('position')
      const index = b[n]!.geometry.getIndex()
      const past: boolean[] = []
      const z: number[] = []
      for (let i = 0; i < full.count; i++) {
        past.push(corner.fromBufferAttribute(full, i).applyMatrix4(b[n]!.matrixWorld).y < line)
        z.push(corner.fromBufferAttribute(low, i).applyMatrix4(m.matrixWorld).z)
      }
      const held = past.map((p) => !p)
      const corners = index ? index.count : full.count
      for (let t = 0; t + 2 < corners; t += 3) {
        const tri = [0, 1, 2].map((k) => (index ? index.getX(t + k) : t + k))
        if (!tri.every((i) => past[i])) for (const i of tri) held[i] = true
      }
      const free = z.filter((_, i) => !held[i])
      let touched = 0
      for (let i = 0; i < full.count; i++) if (held[i] && low.getZ(i) !== full.getZ(i)) touched++
      return { moved: free.length, wall: free.length ? Math.max(...free) - Math.min(...free) : 0, most: free.length ? Math.max(...free) : -Infinity, touched }
    })
  }

  // The dial is at rest on every step its tray opens over it. Its tray starts to shut while it is still going down, so the first steps of the shutting find it a little taller: never taller than `most`, never rising, and at rest at the end.
  const heldLow = (rows: Housed[]): { steps: number; opening: number; most: number; last: number } => {
    for (let n = 0; n < rows.length; n++) {
      const r = rows[n]!
      if (r.opening) expect(r.tall, `step ${r.step}`).toBeCloseTo(DIAL_BODY.rest, 9)
      else if (n > 0 && rows[n - 1]!.step === r.step - 1) expect(r.tall, `step ${r.step}`).toBeLessThanOrEqual(rows[n - 1]!.tall + 1e-9)
    }
    return { steps: rows.length, opening: rows.filter((r) => r.opening).length, most: Math.round(Math.max(...rows.map((r) => r.tall)) * 1e6) / 1e6, last: Math.round(rows[rows.length - 1]!.tall * 1e6) / 1e6 }
  }

  it('the live site: the housed dial is as tall as it was, and its maker is told where the opening ends on every step part of it lies under the page, and on no other', () => {
    const rows = housedDial(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: visitor([0, 1, 2]), seed: config.seed }), 60)
    for (const r of rows) expect(r.told, `step ${r.step}`).toBe(r.edge < DIAL_REACH ? r.edge : null)
    const held = heldLow(rows.filter((r) => r.told !== null))
    expect(held).toEqual(UNDER.live)
  })

  it('the film: its maker is never told, and the housed dial is as tall as it was', () => {
    const rows = housedDial(new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), 200)
    for (const r of rows) expect(r.told, `step ${r.step}`).toBeNull()
    const held = heldLow(rows.filter((r) => r.edge < DIAL_REACH))
    expect(held).toEqual(UNDER.film)
  })

  it('the dial\'s maker: told, no solid under the page stands taller than the wall it is allowed or higher than the dial\'s top, and what is in the opening is as it was; not told, the housed dial is whole, 42 px deep under its top', () => {
    const rows = housedDial(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: visitor([0, 1, 2]), seed: config.seed }), 60)
    const wheel = rows.find((r) => r.told !== null)!.wheel
    const whole = dial.make({ ...wheel, v: [0] }, ctx([wheel]))
    dial.pose!(whole, { ...wheel, v: [0] }, ctx([wheel]))
    const was = span(whole)
    expect(was.least).toBeCloseTo(DIAL_BODY.rest - DIAL_BODY.tall - DIAL_BODY.below, 6)
    expect(was.most).toBeGreaterThan(DIAL_BODY.rest)
    for (const edge of [-90, -40, 0, 37.5, 80]) {
      const o = dial.make({ ...wheel, v: [0, edge] }, ctx([wheel]))
      dial.pose!(o, { ...wheel, v: [0, edge] }, ctx([wheel]))
      const rows = lowered(o, whole, -(edge + DIAL_UNDER.margin))
      expect(rows.reduce((n, r) => n + r.moved, 0), `edge ${edge}`).toBeGreaterThan(edge < 0 ? 4000 : 400)
      for (const r of rows) {
        expect(r.touched, `edge ${edge}`).toBe(0)
        expect(r.wall, `edge ${edge}`).toBeLessThanOrEqual(DIAL_UNDER.wall + 1e-6)
        expect(r.most, `edge ${edge}`).toBeLessThanOrEqual(DIAL_BODY.rest + 1e-6)
      }
      dial.pose!(o, { ...wheel, v: [0] }, ctx([wheel]))
      expect(span(o)).toEqual(was)
      expect(lowered(o, whole, -(edge + DIAL_UNDER.margin)).every((r) => r.touched === 0)).toBe(true)
    }
  })
})

// The hub of the dial at every squash: its rim stands at least `rim` over the top of the pale inner disc, so the whole orange disc is in sight, and its top moves against the disc's by at most `step` in one step of the stage, so it swells and is never switched.
const HUB = { rim: 0.04, step: 0.4 }

describe('polish date: the hub of the dial is in sight at every squash, in the film and on the live site', () => {
  const ctx = (list: Shape[]): RealContext => ({ page: 'step2', list, byId: new Map(list.map((s) => [s.id, s])), time: 0, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: () => undefined })
  const corner = new THREE.Vector3()
  // The whole dial of each step on which it is drawn lower than its full height, and of the first step it stands whole: how far the hub's rim and its top stand over the inner disc's top, and the dial's highest point over the tray's floor.
  const squashes = (stage: Stage, seconds: number): { step: number; top: number; rim: number; crown: number; most: number; swell: number; hubAt: number; innerAt: number; glint: number }[] => {
    const out: { step: number; top: number; rim: number; crown: number; most: number; swell: number; hubAt: number; innerAt: number; glint: number }[] = []
    let o: THREE.Object3D | null = null
    let whole = false
    for (let i = 0; i < seconds * stepHz && stage.page.id === 'step2'; i++) {
      stage.advance(1)
      if (stage.page.id !== 'step2') break
      const list: Shape[] = []
      stage.page.draw(list)
      const drawn = list.find((s) => s.id === 'dial-wheel')
      if (!drawn) continue
      const top = drawn.z1 - drawn.z0
      if (top > DIAL_BODY.tall - 1e-9) {
        if (whole) continue
        whole = true
      }
      const wheel: Shape = { ...drawn, v: [drawn.v?.[0] ?? 0] }
      o ??= dial.make(wheel, ctx(list))
      dial.pose!(o, wheel, ctx(list))
      o.updateMatrixWorld(true)
      const kept = o.userData.dial as { hub: THREE.Mesh; inner: THREE.Mesh; glint: THREE.Mesh; body: THREE.Group }
      let disc = -Infinity
      const a = kept.inner.geometry.getAttribute('position')
      for (let k = 0; k < a.count; k++) disc = Math.max(disc, corner.fromBufferAttribute(a, k).applyMatrix4(kept.inner.matrixWorld).z)
      let rim = -Infinity
      let crown = -Infinity
      const h = kept.hub.geometry.getAttribute('position')
      for (let k = 0; k < h.count; k++) {
        const far = Math.hypot(h.getX(k), h.getY(k)) > DIAL_BODY.hub - 0.01
        const z = corner.fromBufferAttribute(h, k).applyMatrix4(kept.hub.matrixWorld).z
        crown = Math.max(crown, z)
        if (far) rim = Math.max(rim, z)
      }
      out.push({ step: i, top, rim: rim - disc, crown: crown - disc, most: new THREE.Box3().setFromObject(kept.body).max.z, swell: kept.hub.scale.z, hubAt: kept.hub.position.z, innerAt: kept.inner.position.z, glint: kept.glint.scale.x })
    }
    return out
  }
  const holds = (rows: ReturnType<typeof squashes>): void => {
    expect(rows.filter((r) => r.top <= DIAL_BODY.rest + 1e-9).length).toBeGreaterThan(40)
    expect(rows.filter((r) => r.top > DIAL_BODY.rest + 1e-9 && r.top < DIAL_BODY.tall - 1e-9).length).toBeGreaterThan(60)
    for (let n = 0; n < rows.length; n++) {
      const r = rows[n]!
      expect(r.rim, `rim at step ${r.step}`).toBeGreaterThanOrEqual(HUB.rim)
      expect(r.crown, `top at step ${r.step}`).toBeGreaterThan(r.rim)
      if (n > 0 && rows[n - 1]!.step === r.step - 1) expect(Math.abs(r.crown - rows[n - 1]!.crown), `step ${r.step}`).toBeLessThanOrEqual(HUB.step)
      if (r.top <= DIAL_BODY.rest + 1e-9) expect(r.most + TRAY_Z, `housed at step ${r.step}`).toBeLessThan(VALUE_Z)
    }
    const last = rows.find((r) => r.top > DIAL_BODY.tall - 1e-9)!
    expect(last).toBeDefined()
    expect(last.swell).toBeCloseTo(1, 9)
    expect(last.hubAt).toBeCloseTo(0, 9)
    expect(Math.abs(last.innerAt)).toBe(0)
    expect(last.glint).toBe(1)
    expect(last.crown).toBeCloseTo(DIAL_BODY.hubTall - DIAL_BODY.innerTall, 4)
  }

  it('the live site: pressed flat the hub lies on the inner disc, it swells from there, and the risen dial is as it was', () => {
    holds(squashes(new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: visitor([0, 1, 2]), seed: config.seed }), 12))
  })

  it('the film: the same', () => {
    holds(squashes(new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }), 12))
  })
})
