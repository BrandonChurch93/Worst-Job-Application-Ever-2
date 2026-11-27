import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { dateMask, ENTER, ownDate, reelPos, reelWindow } from '../src/pages/step2'
import { BAND, CRANK, FIELDS, NOTE_Y, PLATE_Y, ROWS, scaleOf, SLOT } from '../src/pages/step2/layout'
import { SCREEN_H } from '../src/shell/parts'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type Pointer, type Shape } from '../src/stage/stage'

interface Saved {
  field: number
  open: number
  phase: string
  rowT: number
  slide: number
  done: boolean[]
  birth: { focus: boolean; typed: string; fill: string }
  slot: { phase: string; t: number; own: number[]; to: number[]; from: number[]; at: number[]; stopped: number[]; win: boolean }
  crank: { b: number; level: number; phase: string; total: number }
}

// The film of the page at the length it plays (change note 003, update 5: the unit runs to 24.85 s), whatever the config says the unit is.
const LONG = 24.85
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step2').map((f) => (f.closes !== undefined ? { ...f, closes: LONG } : f)), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
const MADE = ['dial', 'slot', 'crank']
const live = (driver: Driver, seed = config.seed): Stage => new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed })
const saved = (s: Stage): Saved => s.page.save() as Saved
const drawn = (s: Stage): Shape[] => {
  const list: Shape[] = []
  s.page.draw(list)
  return list
}
const names = (s: Stage): string[] => s.events.filter((e) => e.page === 'step2').map((e) => e.name)
const times = (s: Stage, name: string): number[] => s.events.filter((e) => e.page === 'step2' && e.name === name).map((e) => e.step / stepHz)
const corners = (part: Shape): { x: number; y: number }[] => {
  const rot = part.rot ?? 0
  const out: { x: number; y: number }[] = []
  for (const u of [-1, 1]) for (const v of [-1, 1]) out.push({ x: part.x + part.w / 2 + (u * part.w * Math.cos(rot)) / 2 - (v * part.h * Math.sin(rot)) / 2, y: part.y + part.h / 2 + (u * part.w * Math.sin(rot)) / 2 + (v * part.h * Math.cos(rot)) / 2 })
  return out
}

// A visitor who does what the page hints, and types the date it is given. `stop` says when it presses a reel's button: 'own' waits for its own legend as the hint does, 'now' presses as soon as the reels turn.
function visitor(date: string, stop: 'own' | 'now' | 'never'): Driver {
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const st = v.page.save() as Saved
      const h = v.page.hint()
      const base: Pointer = h ? { x: h.dodge ? h.dodge.x : h.x, y: h.dodge ? h.dodge.y : h.y, down: h.down } : { x: 300, y: 900, down: false }
      if (st.field === 1 && st.open < 0 && st.birth.focus && st.birth.fill === '' && st.birth.typed.length < date.length) return { ...base, key: date[st.birth.typed.length] }
      if (st.open === 1 && st.slot.phase === 'spin' && stop !== 'own') {
        const r = st.slot.stopped.findIndex((x) => x < 0)
        if (r < 0 || stop === 'never') return { x: 300, y: 900, down: false }
        return { x: SLOT.reelX(r) + SLOT.reelW / 2, y: SLOT.stopY + SLOT.stopH / 2, down: v.pageStep % 8 < 4 }
      }
      return base
    }
  }
}

function run(s: Stage, seconds: number, each?: (i: number) => void): void {
  for (let i = 0; i < seconds * stepHz && s.page.id === 'step2'; i++) {
    s.advance(1)
    if (s.page.id !== 'step2') break
    each?.(i)
  }
}

describe('change 002, step 2: one field at a time', () => {
  it('reports three fields, none done with the phone in hand, all three when Continue is offered, and never fewer than before', () => {
    const s = film()
    let was = 0
    let offered = -1
    const at: Record<string, number> = {}
    run(s, LONG, (i) => {
      const f = s.page.fields!()!
      expect(f.total).toBe(FIELDS)
      expect(f.done).toBeGreaterThanOrEqual(was - 1e-9)
      expect(f.done).toBeLessThanOrEqual(FIELDS)
      was = f.done
      const st = saved(s)
      if (st.field === 0 && !st.done[0]) expect(f.done).toBe(0)
      if (st.field >= FIELDS && offered < 0) offered = i
      if (offered >= 0) at[i - offered] = f.done
    })
    expect(FIELDS).toBe(3)
    expect(offered).toBeGreaterThan(0)
    expect(was).toBe(3)
    expect(at[0]).toBeGreaterThanOrEqual(2)
    expect(at[Math.round(0.8 * stepHz)]).toBeCloseTo(3, 2)
  })

  it('shows the field alone and then the machine alone on the bare page: no field, box or tray behind a machine, and one machine at a time', () => {
    const s = film()
    const order: number[] = []
    const fields: number[] = []
    let both = 0
    let bare = 0
    run(s, LONG - 0.6, (i) => {
      if (i % 3 !== 0) return
      const list = drawn(s)
      const st = saved(s)
      const here = ROWS.map((name, k) => (list.some((x) => x.id === `${name}-label`) ? k : -1)).filter((k) => k >= 0)
      const made = MADE.map((part, k) => (list.some((x) => x.part === part && !x.id.startsWith('coin-')) ? k : -1)).filter((k) => k >= 0)
      const boxes = list.filter((x) => x.role === 'field' || x.id.endsWith('-tray') || x.role === 'card')
      const holes = list.filter((x) => x.role === 'machineTray')
      expect(made.length).toBeLessThanOrEqual(1)
      expect(holes.length).toBeLessThanOrEqual(1)
      expect(list.some((x) => x.id.endsWith('-tray'))).toBe(false)
      if (made.length) {
        expect(made[0]).toBe(st.open)
        if (order[order.length - 1] !== made[0]) order.push(made[0]!)
        if (here.length) both++
        else {
          bare++
          expect(boxes.map((x) => x.id), `at ${(i / stepHz).toFixed(2)}`).toEqual([])
        }
        if (here.length) expect(st.rowT).toBeLessThan(ENTER.field + 1e-9)
      }
      if (st.open >= 0 && st.rowT >= ENTER.field) expect(here, `at ${(i / stepHz).toFixed(2)}`).toEqual([])
      if (st.open < 0 && st.field < FIELDS) expect(here).toEqual([st.field])
      if (st.open < 0 && here.length && fields[fields.length - 1] !== here[0]) fields.push(here[0]!)
      for (const h of holes) expect(h.id).toBe(`${ROWS[st.open]}-hole`)
    })
    expect(order).toEqual([0, 1, 2])
    expect(fields).toEqual([0, 1, 2])
    expect(bare).toBeGreaterThan(900)
    expect(both).toBeLessThan(3 * ENTER.field * stepHz / 3 + 3)
  })

  it('says when a field is done and when the next comes up, twice and three times, in order', () => {
    const s = film()
    run(s, LONG)
    const flow = names(s).filter((n) => n === 'field-done' || n === 'field-next' || n === 'row-open')
    expect(flow).toEqual(['row-open', 'field-done', 'field-next', 'row-open', 'field-done', 'field-next', 'row-open', 'field-done'])
  })

  it('says when each machine comes out of the page and goes back into it, once each, around its gag', () => {
    const s = film()
    run(s, LONG)
    ROWS.forEach((name, k) => {
      const key = name === 'birth' ? 'birth' : name
      const into = times(s, `stage-in-${key}`)
      const out = times(s, `stage-out-${key}`)
      expect(into.length).toBe(1)
      expect(out.length).toBe(1)
      expect(into[0]).toBe(times(s, 'row-open')[k]!)
      expect(times(s, 'field-done')[k]! - out[0]!).toBeCloseTo(ENTER.out[k]!, 2)
      expect(ENTER.long[k]!).toBeGreaterThanOrEqual(0.6)
      expect(ENTER.long[k]!).toBeLessThanOrEqual(0.9)
      expect(ENTER.out[k]!).toBeGreaterThanOrEqual(0.4)
      expect(ENTER.out[k]!).toBeLessThanOrEqual(0.6)
    })
  })
})

describe('change 002, step 2: the date of birth', () => {
  it('holds a typed date to what the reels can show', () => {
    expect(ownDate('07231991').typed).toBe('07231991')
    expect(ownDate('13452030').typed).toBe('12312015')
    expect(ownDate('00001900').typed).toBe('01011925')
    expect(ownDate('07231991').own).toEqual([6, 22, 1991 - 1925])
    expect(dateMask('')).toBe('')
    expect(dateMask('0723').startsWith('07')).toBe(true)
    expect(dateMask('07231991').replace(/\D/g, '')).toBe('07231991')
  })

  it('turns each reel so that a legend is the nearest for 400, 320 and 260 ms, the first reel the slowest', () => {
    expect([0, 1, 2].map((r) => Math.round(reelWindow(r)))).toEqual([400, 320, 260])
    expect(SLOT.speed[0]).toBeLessThan(SLOT.speed[1]!)
    expect(SLOT.speed[1]).toBeLessThan(SLOT.speed[2]!)
  })

  it('the visitor types a date, stops each reel on it and is paid in coins', () => {
    const s = live(visitor('03141988', 'own'))
    let shown = false
    run(s, 40, () => {
      const st = saved(s)
      if (st.open === 1 && st.slot.phase === 'pay' && !shown) {
        shown = true
        expect(st.slot.win).toBe(true)
        expect([0, 1, 2].map((r) => SLOT.strips[r]![((st.slot.to[r]! % SLOT.strips[r]!.length) + SLOT.strips[r]!.length) % SLOT.strips[r]!.length])).toEqual(['03', '14', '1988'])
      }
    })
    const seen = names(s)
    expect(seen.filter((n) => n === 'date-key').length).toBe(8)
    expect(seen.filter((n) => n === 'reel-stop').length).toBe(3)
    expect(seen).toContain('date-hit')
    expect(seen).toContain('coins')
    expect(seen).not.toContain('date-miss')
    expect(shown).toBe(true)
    expect(s.page.id).toBe('step3')
  })

  it('a visitor who stops the reels anywhere is let through with the missed line, in one short beat', () => {
    const s = live(visitor('03141988', 'now'))
    let words = false
    run(s, 40, () => {
      const st = saved(s)
      if (st.done[1] && st.field === 1 && !words) words = drawn(s).some((x) => x.words === 'copy:drafts.step2.birth.missed')
    })
    const seen = names(s)
    expect(seen.filter((n) => n === 'reel-stop').length).toBe(3)
    expect(seen).toContain('date-miss')
    expect(seen).not.toContain('date-hit')
    expect(seen).not.toContain('coins')
    expect(words).toBe(true)
    expect(times(s, 'date-miss')[0]! - times(s, 'reel-stop')[2]!).toBeLessThan(0.7)
    expect(times(s, 'field-done')[1]! - times(s, 'reel-stop')[2]!).toBeLessThan(3)
    expect(s.page.id).toBe('step3')
  })

  it('a visitor who never presses a stop is not kept: the reels stop themselves', () => {
    const s = live(visitor('03141988', 'never'))
    run(s, 80)
    expect(names(s).filter((n) => n === 'reel-stop').length).toBe(3)
    expect(s.page.id).toBe('step3')
  })

  it('a reel in the film stops on the applicant\'s own legend on the step the arrow presses its button', () => {
    const s = film()
    let before: Saved | null = null
    const off: number[] = []
    run(s, 13, () => {
      const st = saved(s)
      if (before) for (let r = 0; r < 3; r++) if (before.slot.stopped[r]! < 0 && st.slot.stopped[r]! >= 0) off.push(Math.abs(st.slot.at[r]! - st.slot.own[r]!))
      before = st
    })
    expect(off.length).toBe(3)
    for (const o of off) expect(o).toBeLessThan(0.05)
    expect(reelPos(saved(s).slot as never, 0)).toBeCloseTo(saved(s).slot.own[0]!, 2)
  })
})

describe('change 002, step 2: the volume crank', () => {
  for (const [name, make] of [['the film', film], ['a visitor on the live site', () => live(visitor('03141988', 'own'))]] as const) {
    it(`${name}: the level rises only on a step the crank turns, and the crank turns until the level is full`, () => {
      const s = make()
      let b = NaN
      let level = 0
      let rose = 0
      let stalled = 0
      let turnedOn = 0
      let full = -1
      run(s, 60, (i) => {
        const c = saved(s).crank
        if (!Number.isNaN(b)) {
          const turned = Math.abs(c.b - b) > 1e-9
          if (c.level > level + 1e-12) {
            rose++
            if (!turned) stalled++
          }
          if (c.level >= 1 && full < 0) full = i
          if (full >= 0 && turned) turnedOn++
          expect(c.level).toBeGreaterThanOrEqual(level - 1e-12)
        }
        b = c.b
        level = c.level
      })
      expect(rose).toBeGreaterThan(200)
      expect(stalled).toBe(0)
      expect(level).toBe(1)
      expect(turnedOn).toBeLessThan(1.5 * stepHz)
      expect(names(s).filter((n) => n === 'crank-full').length).toBe(1)
    })
  }

  it('puts up the sign as the crank comes out of the page, before the crank is touched', () => {
    const s = film()
    run(s, LONG)
    const sign = times(s, 'volume-sign')
    expect(sign.length).toBe(1)
    expect(sign[0]).toBe(times(s, 'stage-in-volume')[0]!)
    expect(sign[0]).toBeLessThan(times(s, 'crank-turn')[0]!)
    expect(sign[0]).toBeLessThan(times(s, 'crank-runaway')[0]!)
  })

  it('never lays the crank\'s grip over the bars, the sign, the line above the machine or the lowest band, at any angle, and draws no machine with the footnote', () => {
    const m = scaleOf(2)
    for (let k = 0; k < 720; k++) {
      const b = (k / 720) * Math.PI * 2
      const cx = CRANK.hx + CRANK.arm * Math.cos(b)
      const cy = CRANK.hy + CRANK.arm * Math.sin(b)
      for (const p of corners({ x: cx - CRANK.gripW / 2, y: cy - CRANK.gripH / 2, w: CRANK.gripW, h: CRANK.gripH, rot: b } as Shape)) {
        expect(m.x(p.x)).toBeGreaterThan(0)
        expect(m.x(p.x)).toBeLessThan(m.x(CRANK.segX))
        expect(m.y(p.y)).toBeGreaterThan(PLATE_Y)
        expect(m.y(p.y)).toBeLessThan(SCREEN_H - BAND)
      }
    }
    const s = film()
    let rest = 0
    run(s, LONG - 0.6, (i) => {
      if (i % 2 !== 0) return
      const list = drawn(s)
      const note = list.find((x) => x.id === 'note')
      if (!note) return
      rest++
      expect(list.some((x) => MADE.includes(x.part) && !x.id.startsWith('coin-')), `step ${i}`).toBe(false)
      expect(note.y).toBe(NOTE_Y)
    })
    expect(rest).toBeGreaterThan(300)
  })
})

describe('change 002, step 2: the lowest band of the page is left to the spoken words', () => {
  it('draws no field, stage, sign, crank, button of a stage or footnote in the lowest 150 px, on any step of the film', () => {
    const s = film()
    const line = SCREEN_H - BAND
    const low = new Set<string>()
    run(s, LONG - 0.6, (i) => {
      if (i % 4 !== 0) return
      for (const x of drawn(s)) {
        if (x.id.startsWith('continue') || x.id.startsWith('coin-') || x.id === 'page' || x.id === 'paper') continue
        if (x.h >= SCREEN_H - 1) continue
        const bottom = x.rot ? Math.max(...corners(x).map((p) => p.y)) : x.y + x.h
        if (bottom > line) low.add(x.id)
      }
    })
    expect(BAND).toBe(150)
    expect([...low]).toEqual([])
  })
})
