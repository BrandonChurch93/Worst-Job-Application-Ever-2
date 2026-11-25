import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { stream } from '../src/core/random'
import { pages } from '../src/pages'
import { HANDOFF } from '../src/cursor/body'
import { makePage } from '../src/pages/step1'
import { drawFire, makeTurrets } from '../src/pages/step1/fire'
import { PAPER_REST } from '../src/pages/step1/layout'
import { DECK, homePlaces, keyboardData, legendKey, seats, shuffled } from '../src/pages/step1/keyboard'
import { Turrets, TURRET } from '../src/pages/step1/turrets'
import { layoutProblems, typeRegister } from '../src/shell/layout'
import { block } from '../src/shell/metrics'
import { TYPE } from '../src/shell/parts'
import { hasWords, words } from '../src/shell/words'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type DrawList, type Pointer } from '../src/stage/stage'
import rawCopy from '../content/copy.json'

const beats = config.film.beats.filter((b) => b.unit === 'step1')
const film = (driver: Driver = new ScriptDriver()): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver, film: filmOptions('step1') })
const live = (driver: Driver, seed = config.seed): Stage => new Stage({ mode: 'live', flow: [{ page: 'step1' }, { page: 'step2' }], pages, driver, seed })
const at = (seconds: number): number => Math.round(seconds * stepHz)
const state = (s: Stage) => s.page.save() as { phase: string; values: Record<string, string> }

class Still implements Driver {
  readonly name = 'script' as const
  input(): Pointer {
    return { x: 300, y: 950, down: false }
  }
}

class Wrong implements Driver {
  readonly name = 'script' as const
  input(v: DriverView): Pointer {
    const t = v.pageTime
    return { x: 420 + 260 * Math.sin(t * 1.7), y: 210 + 40 * Math.sin(t * 2.3), down: Math.floor(t * 3) % 2 === 0 }
  }
}

class Switch implements Driver {
  readonly name = 'script' as const
  still = true
  input(v: DriverView): Pointer {
    return this.still ? { x: 300, y: 950, down: false } : v.page.script(v.pageTime)
  }
}

function wholeFilm(): Stage {
  const s = film()
  s.advance(at(32))
  return s
}

describe('step 1: the layout', () => {
  it('has no problem in any state', () => {
    const page = makePage()
    expect(layoutProblems(page.layout, { width: page.width, height: page.height })).toEqual([])
  })

  it('is a full page with every beat of the film as a gag', () => {
    const page = makePage()
    expect(page.gags.map((g) => g.id)).toEqual(beats.map((b) => b.id))
    expect(page.gags.map((g) => g.event)).toEqual(['keyboard-rise', 'bolt-hit-cursor', 'keys-shuffle', 'slab-drop', 'paper-slide', 'arms-out', 'strips-zip'])
  })

  it('uses every word of the copy of step 1', () => {
    const used = new Set(typeRegister(makePage().layout).map((r) => r.key))
    const leaves: string[] = []
    const visit = (v: unknown, path: string): void => {
      if (typeof v === 'string') leaves.push(path)
      else for (const [k, x] of Object.entries(v as Record<string, unknown>)) visit(x, `${path}.${k}`)
    }
    visit(rawCopy.step1, 'copy:step1')
    expect(leaves.filter((k) => !used.has(k))).toEqual([])
  })

  it('shows no word that is not a key, at any moment of the film or of a live run', () => {
    const check = (s: Stage, seconds: number): void => {
      const seen = new Set<string>()
      for (let t = 0; t < seconds; t += 0.25) {
        s.advance(at(0.25))
        if (s.page.id !== 'step1') break
        const list: DrawList = []
        s.page.draw(list)
        for (const shape of list) {
          if (shape.kind !== 'text') {
            expect(shape.text, shape.id).toBeUndefined()
            continue
          }
          expect(shape.words, shape.id).toBeDefined()
          expect(hasWords(shape.words!), shape.words).toBe(true)
          if (!shape.words!.startsWith('runtime:')) expect(shape.text, shape.id).toBeUndefined()
          seen.add(shape.words!)
        }
      }
      for (const key of ['copy:step1.heading', 'copy:step1.emailError', 'copy:step1.emailAccepted', 'copy:step1.keyboardNote', 'copy:step1.resume.paperTitle', 'copy:step1.resume.received', 'copy:step1.continue', 'data:keyboard.keys.enter']) expect(seen.has(key), key).toBe(true)
    }
    check(film(), 31.4)
    check(live(new Still()), 140)
  })
})

describe('step 1: the keyboard', () => {
  const names = seats.map((s) => s.name)
  const rows = [0, 1, 2, 3, 4].map((r) => seats.filter((s) => s.row === r))

  it('has five rows with every key a visitor needs, each once', () => {
    expect(keyboardData.rows.length).toBe(5)
    expect(new Set(names).size).toBe(names.length)
    for (const ch of 'abcdefghijklmnopqrstuvwxyz0123456789') expect(names.filter((n) => n === ch).length, ch).toBe(1)
    for (const name of ['backspace', 'tab', 'caps', 'enter', 'shiftLeft', 'shiftRight', 'space', 'at', 'dot']) expect(names.filter((n) => n === name).length, name).toBe(1)
    expect(rows[3]![0]!.name).toBe('shiftLeft')
    expect(rows[3]!.at(-1)!.name).toBe('shiftRight')
    expect(words('data:keyboard.keys.backspace')).toBe('Backspace')
    expect(words('data:keyboard.keys.tab')).toBe('Tab')
    expect(words('data:keyboard.keys.caps')).toBe('Caps Lock')
    expect(words('data:keyboard.keys.enter')).toBe('Enter')
    expect(words('data:keyboard.keys.shiftLeft')).toBe('Shift')
    expect(words('data:keyboard.keys.shiftRight')).toBe('Shift')
    expect(words('data:keyboard.keys.at')).toBe('@')
    expect(words('data:keyboard.keys.dot')).toBe('.')
    expect(legendKey('space')).toBeNull()
    expect(rows[4]!.find((k) => k.name === 'space')!.w).toBeGreaterThan(DECK.w / 2)
  })

  it('stands in straight rows of one width at the planned gap, inside its deck', () => {
    const left = rows.map((r) => r[0]!.x)
    const right = rows.map((r) => r.at(-1)!.x + r.at(-1)!.w)
    for (const x of left) expect(x).toBeCloseTo(left[0]!, 6)
    for (const x of right) expect(x).toBeCloseTo(right[0]!, 6)
    for (const row of rows) {
      for (let i = 1; i < row.length; i++) expect(row[i]!.x - (row[i - 1]!.x + row[i - 1]!.w)).toBeCloseTo(config.scale.grid.keyGap, 6)
      for (const k of row) {
        expect(k.w).toBeGreaterThanOrEqual(config.scale.sizes.keycapMin)
        expect(k.h).toBeGreaterThanOrEqual(config.scale.sizes.keycapMin)
        expect(k.x).toBeGreaterThanOrEqual(DECK.x)
        expect(k.x + k.w).toBeLessThanOrEqual(DECK.x + DECK.w)
        expect(k.y).toBeGreaterThanOrEqual(DECK.y)
        expect(k.y + k.h).toBeLessThanOrEqual(DECK.y + DECK.h)
      }
    }
  })

  it('shuffles the letters only, every key keeping one seat, the same way for the same seed', () => {
    const a = shuffled(homePlaces(), stream('step1:shuffle', 7))
    const b = shuffled(homePlaces(), stream('step1:shuffle', 7))
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(seats.length)
    seats.forEach((seat, i) => {
      if (!seat.letter) expect(a[i]).toBe(i)
      else expect(seats[a[i]!]!.letter).toBe(true)
    })
    expect(a.filter((p, i) => p !== i).length).toBeGreaterThanOrEqual(13)
  })
})

describe('step 1: the turrets by themselves', () => {
  const make = () => new Turrets([{ x: 200, y: 500 }, { x: 1700, y: 500 }], 24, 3, () => 0)
  const run = (t: Turrets, seconds: number, target: (time: number) => { x: number; y: number }) => {
    const events: string[] = []
    let hits = 0
    for (let i = 0; i < at(seconds); i++) hits += t.step(1 / stepHz, target(i / stepHz), true, (name) => events.push(name)).length
    return { events, hits }
  }

  it('rise, fire, hit a target that stands still, and overheat after the hits of the config', () => {
    const t = make()
    const events: string[] = []
    t.raise((name) => events.push(name))
    expect(events).toEqual(['turret-rise', 'turret-rise'])
    const r = run(t, 12, () => ({ x: 900, y: 520 }))
    expect(r.hits).toBe(config.live.step1.hitsBeforeTurretsOverheat)
    expect(t.s.overheated).toBe(true)
    const fired = r.events.filter((e) => e === 'bolt-fire').length
    expect(fired).toBeGreaterThanOrEqual(3)
    expect(run(t, 5, () => ({ x: 900, y: 520 })).events.filter((e) => e === 'bolt-fire').length).toBe(0)
  })

  it('miss a target that keeps moving', () => {
    const t = make()
    t.raise(() => {})
    const r = run(t, 10, (time) => ({ x: 950 + 420 * Math.sin(time * 5), y: 520 + 100 * Math.cos(time * 3.1) }))
    expect(r.events.filter((e) => e === 'bolt-fire').length).toBeGreaterThan(8)
    expect(r.hits).toBe(0)
  })

  it('continue exactly from a saved state', () => {
    const a = make()
    a.raise(() => {})
    const path = (time: number) => ({ x: 900 + 200 * Math.sin(time), y: 520 })
    run(a, 3.3, path)
    const b = make()
    b.load(a.save())
    const later = (time: number) => path(time + 3.3)
    const ra = run(a, 4, later)
    const rb = run(b, 4, later)
    expect(rb).toEqual(ra)
    expect(b.save()).toEqual(a.save())
    expect(TURRET.windup).toBeLessThan(TURRET.period)
  })
})

describe('step 1: the film', () => {
  const s = wholeFilm()
  const events = s.events.filter((e) => e.page === 'step1')
  const times = (name: string): number[] => events.filter((e) => e.name === name).map((e) => e.step / stepHz)

  it('gives the event of every beat inside its beat', () => {
    for (const b of beats) {
      const t = times((b as { event: string }).event)
      expect(t.length, b.id).toBeGreaterThan(0)
      for (const x of t) {
        expect(x, b.id).toBeGreaterThanOrEqual(b.from - 0.25)
        expect(x, b.id).toBeLessThanOrEqual(b.to + 0.25)
      }
    }
  })

  it('hits the cursor once, on the first field, with a bolt', () => {
    const hit = events.filter((e) => e.name === 'bolt-hit-cursor')
    expect(hit.length).toBe(1)
    expect(hit[0]!.hitsCursor).toBe(true)
    expect(times('bolt-fire').length).toBeGreaterThan(4)
    expect(times('sizzle').length).toBe(1)
    expect(events.filter((e) => e.name === 'slab-drop').map((e) => e.hitsCursor)).toEqual([false, false, false])
  })

  it('types the name and the email of the config in full', () => {
    const a = film()
    a.advance(at(9.7))
    expect(state(a).values.firstName).toBe(config.applicant.filmFirstName)
    a.advance(at(14.7 - 9.7))
    expect(state(a).values.lastName).toBe(config.applicant.filmLastName)
    a.advance(at(19 - 14.7))
    expect(state(a).values.email).toBe(config.applicant.filmEmail)
    expect(times('keys-shuffle').length).toBe(config.applicant.filmLastName.length)
  })

  it('never gives the live events', () => {
    for (const name of ['slow-typing', 'real-keyboard', 'tug-lost']) expect(times(name)).toEqual([])
  })

  it('shows arms only in the tug, never takes the pointer for long, and hands a whole cursor over', () => {
    const a = film()
    const tug = beats.find((b) => b.id === 'step1.tug')!
    let armed = 0
    for (let i = 0; i < at(31.45); i++) {
      a.advance(1)
      const pose = a.cursor.pose()
      expect(pose.scale).toBe(1)
      if (pose.arms) {
        armed++
        expect(a.pageTime).toBeGreaterThanOrEqual(tug.from)
        expect(a.pageTime).toBeLessThan(tug.to)
      }
    }
    expect(armed / stepHz).toBeGreaterThan(5)
    expect(a.cursor.damaged).toBe(false)
    expect(a.cursor.taken).toBe(false)
    expect(a.cursor.onPage).toBe(true)
    expect(state(a).phase).toBe('received')
    expect(a.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
  })

  it('pushes the camera in for the tug and is home for the turrets', () => {
    const page = makePage()
    const home = page.camera('film', 6)!
    const close = page.camera('film', 25.5)!
    expect(close.eye[2]).toBeLessThan(home.eye[2] * 0.7)
    expect(page.camera('film', 31.4)!.eye).toEqual(home.eye)
    expect(page.camera('nothing', 3)).toBeNull()
  })
})

describe('step 1: saved and loaded', () => {
  it('continues exactly from a saved state, at every stage of the page', () => {
    const page = makePage()
    for (const wanted of [0.8, 1.6, 4.1, 6.45, 6.7, 9.1, 12.2, 16.3, 18.3, 18.9, 20.5, 22.6, 25.4, 29.3, 30.5, 31.1]) {
      let seconds = wanted
      while (page.script(seconds).down || page.script(seconds - 1 / stepHz).down) seconds += 1 / stepHz
      const n = at(seconds)
      const a = film()
      a.advance(n)
      const saved = { page: JSON.stringify(a.page.save()), cursor: JSON.stringify(a.cursor.save()) }
      const from = a.events.length
      a.advance(at(2.5))
      const driver = new Switch()
      const b = film(driver)
      b.advance(n)
      const other = b.events.length
      b.page.load(JSON.parse(saved.page))
      b.cursor.load(JSON.parse(saved.cursor))
      driver.still = false
      b.advance(at(2.5))
      expect(JSON.stringify(b.page.save()), `${seconds}`).toBe(JSON.stringify(a.page.save()))
      expect(JSON.stringify(b.cursor.save()), `${seconds}`).toBe(JSON.stringify(a.cursor.save()))
      expect(b.events.slice(other).map((e) => [e.name, e.step, e.x, e.y]), `${seconds}`).toEqual(a.events.slice(from).map((e) => [e.name, e.step, e.x, e.y]))
      const la: DrawList = []
      const lb: DrawList = []
      a.page.draw(la)
      b.page.draw(lb)
      expect(lb).toEqual(la)
    }
  })
})

describe('step 1: live', () => {
  const limit = config.live.skipLinkAfterSeconds
  const run = (driver: Driver) => {
    const s = live(driver)
    const spans: Record<string, number> = {}
    let longest: Record<string, number> = {}
    let last = ''
    let since = 0
    while (s.page.id === 'step1' && s.time < 400) {
      s.advance(1)
      if (s.page.id !== 'step1') break
      const gag = s.page.gag() ?? ''
      if (gag !== last) {
        last = gag
        since = s.step
      }
      spans[gag] = (s.step - since) / stepHz
      longest = { ...longest, [gag]: Math.max(longest[gag] ?? 0, spans[gag]!) }
    }
    return { s, longest }
  }

  for (const [name, driver] of [['still', () => new Still()], ['wrong', () => new Wrong()]] as const) {
    it(`ends every gag by itself with a ${name} pointer`, () => {
      const { s, longest } = run(driver())
      expect(s.page.id).toBe('step2')
      expect(Object.keys(longest).sort()).toEqual(beats.map((b) => b.id).sort())
      for (const [gag, seconds] of Object.entries(longest)) expect(seconds, gag).toBeLessThanOrEqual(limit + 3)
      expect(s.longestIgnored.pointer).toBeLessThanOrEqual(config.live.controlTakenMaxSeconds)
      const names = s.events.filter((e) => e.page === 'step1').map((e) => e.name)
      for (const event of ['keyboard-rise', 'turret-rise', 'bolt-fire', 'keys-shuffle', 'slab-drop', 'paper-slide', 'shredder', 'arms-out', 'strips-zip']) expect(names.includes(event), event).toBe(true)
      expect(names.filter((n) => n === 'tug-lost').length).toBe(1)
      expect(names.filter((n) => n === 'slow-typing').length).toBe(1)
      if (name === 'still') expect(names.filter((n) => n === 'bolt-hit-cursor').length).toBe(config.live.step1.hitsBeforeTurretsOverheat)
      expect(names.includes('button-press')).toBe(true)
    })
  }

  it('answers a real keyboard once and types nothing from it', () => {
    class Keys implements Driver {
      readonly name = 'script' as const
      input(v: DriverView): Pointer {
        const p: Pointer = { x: 300, y: 950, down: false }
        if (v.pageTime > 0.5 && v.pageTime < 6 && v.pageStep % 60 === 0) p.key = 'a'
        return p
      }
    }
    const s = live(new Keys())
    s.advance(at(8))
    const names = s.events.map((e) => e.name)
    expect(names.filter((n) => n === 'real-keyboard').length).toBe(1)
    expect(names.includes('keyboard-rise')).toBe(true)
    expect(Object.values(state(s).values).join('')).toBe('')
    expect(s.page.states()).toContain('note')
  })

  it('ends soon after a skip, from any stage, with the cursor whole and free', () => {
    for (const seconds of [0.5, 5, 30, 48, 70, 88, 95, 104]) {
      const s = live(new Still())
      s.advance(at(seconds))
      if (s.page.id !== 'step1') continue
      s.page.skip()
      s.advance(at(3))
      expect(s.page.id, `${seconds}`).toBe('step2')
    }
  })

  it('gives a hint at every stage', () => {
    const s = live(new Still())
    while (s.page.id === 'step1' && s.time < 200) {
      s.advance(24)
      if (s.page.id !== 'step1') break
      const h = s.page.hint()
      expect(h).not.toBeNull()
      expect(h!.x).toBeGreaterThanOrEqual(0)
      expect(h!.x).toBeLessThanOrEqual(1920)
      expect(h!.y).toBeGreaterThanOrEqual(0)
      expect(h!.y).toBeLessThanOrEqual(1080)
    }
  })
})

describe('the scene of the card loop', () => {
  it('draws the keyboard up, the typed name, a pressed key lower than the rest and the given turrets', () => {
    const turrets = makeTurrets()
    turrets.raise(() => {})
    for (let i = 0; i < stepHz * 2; i++) turrets.step(1 / stepHz, { x: 900, y: 880 }, true, () => {})
    const out: DrawList = []
    drawFire(out, { typed: 'Perplex', pressed: ['e'], turrets })
    const by = (id: string) => out.find((s) => s.id === id)!
    expect(by('keyboard-deck')).toBeDefined()
    expect(by('key-e').z1).toBeLessThan(by('key-r').z1)
    expect(out.some((s) => s.part === 'turrets')).toBe(true)
    const again: DrawList = []
    drawFire(again, { typed: 'Perplex', pressed: ['e'], turrets })
    expect(again).toEqual(out)
  })
})

describe('the slabs and the typed address', () => {
  it('drops each slab straight down onto the keys, leaves it where it landed and never covers the address or its field', () => {
    const a = film()
    const hits = (p: { x: number; y: number; w: number; h: number }, q: { x: number; y: number; w: number; h: number }): boolean => p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h
    const places = new Map<string, string>()
    const lows = new Map<string, number>()
    let frames = 0
    let most = 0
    for (let i = 0; i < at(20); i++) {
      a.advance(1)
      const st = a.page.save() as { slabs: { landed: boolean }[]; slabClear: number; values: Record<string, string> }
      if (!st.slabs.length) continue
      const list: DrawList = []
      a.page.draw(list)
      const bodies = list.filter((q) => /^email-slab(-\d)?$/.test(q.id))
      expect(bodies.length).toBe(st.slabs.length)
      most = Math.max(most, bodies.length)
      const drawn = list.find((q) => q.id === 'email-value')!
      const pocket = list.find((q) => q.id === 'email-pocket')!
      const value = { x: drawn.x, y: drawn.y, w: block(TYPE.value.font, st.values.email!, TYPE.value.px).width, h: drawn.h }
      expect(value.w).toBeGreaterThan(250)
      bodies.forEach((slab, n) => {
        const label = list.find((q) => q.id === `${slab.id}-label`)!
        expect(label.words).toBe('copy:step1.emailError')
        expect(hits(slab, value)).toBe(false)
        expect(hits(slab, pocket)).toBe(false)
        expect(slab.y).toBeGreaterThanOrEqual(DECK.y)
        expect(label.x).toBeGreaterThan(slab.x)
        expect(label.x).toBeLessThan(slab.x + slab.w)
        expect(label.y).toBeGreaterThan(slab.y)
        expect(label.y).toBeLessThan(slab.y + slab.h)
        expect(label.z0).toBe(slab.z1)
        const place = `${slab.x},${slab.y}`
        expect(places.get(slab.id) ?? place, slab.id).toBe(place)
        places.set(slab.id, place)
        if (st.slabClear < 0) {
          expect(slab.z0, slab.id).toBeLessThanOrEqual((lows.get(slab.id) ?? Infinity) + 6)
          lows.set(slab.id, Math.min(lows.get(slab.id) ?? Infinity, slab.z0))
          if (st.slabs[n]!.landed) expect(slab.z0 - lows.get(slab.id)!).toBeLessThanOrEqual(6)
        }
      })
      frames++
    }
    expect(frames).toBeGreaterThan(300)
    expect(most).toBe(3)
    expect(new Set(places.values()).size).toBe(3)
    expect(a.events.filter((e) => e.name === 'slab-drop').length).toBe(3)
    expect(a.events.filter((e) => e.name === 'slab-drop').every((e) => !e.hitsCursor)).toBe(true)
  })
})

describe('the fixes after round 2 of the blockout', () => {
  it('fights the tug in every second: paper left, the place of the cursor and the stretch of the arms all change', () => {
    const a = film()
    const rows: { amount: number; x: number; y: number; arm: number }[] = []
    for (let i = 0; i < at(28.2); i++) {
      a.advance(1)
      const st = a.page.save() as { phase: string; tug: { amount: number; reach: number } }
      if (st.phase === 'tug') rows.push({ amount: st.tug.amount, x: a.cursor.x, y: a.cursor.y, arm: st.tug.reach })
    }
    const second = stepHz
    expect(rows.length).toBeGreaterThan(5 * second)
    for (let i = 0; i + second < rows.length; i += 6) {
      const p = rows[i]!
      const q = rows[i + second]!
      expect(q.amount - p.amount, `paper ${i}`).toBeGreaterThan(0.08)
      expect(Math.hypot(q.x - p.x, q.y - p.y), `cursor ${i}`).toBeGreaterThan(5)
    }
    for (let i = 0; i + second < rows.length; i += 6) {
      const span = rows.slice(i, i + second).map((r) => r.arm)
      expect(Math.max(...span) - Math.min(...span), `arms ${i}`).toBeGreaterThan(12)
    }
    let backs = 0
    for (let i = 1; i < rows.length; i++) if (rows[i]!.amount < rows[i - 1]!.amount && rows[i - 1]!.amount >= (rows[i - 2]?.amount ?? 0)) backs++
    expect(backs).toBeGreaterThanOrEqual(4)
  })

  it('takes the hit after a cocky pause, holds the shock and rests on the finished name', () => {
    const a = film()
    let hit = -1
    let full = -1
    let pressed = 0
    for (let i = 0; i < at(10); i++) {
      a.advance(1)
      const now = (i + 1) / stepHz
      const st = a.page.save() as { values: Record<string, string>; keyDown: Record<string, number> }
      if (hit < 0 && a.events.some((e) => e.name === 'bolt-hit-cursor')) hit = now
      if (st.values.firstName === config.applicant.filmFirstName) full = full < 0 ? now : full
      else full = -1
      const list: DrawList = []
      if (i % 4 === 0) {
        a.page.draw(list)
        for (const [name] of Object.entries(st.keyDown)) {
          const key = list.find((q) => q.id === `key-${name}`)!
          expect(key.tone).toBe('pocket')
          expect(key.z1).toBe(config.scale.heights.keycap - config.scale.heights.keyTravel)
          pressed++
        }
      }
    }
    expect(hit).toBeGreaterThan(6.8)
    expect(hit).toBeLessThan(7.3)
    expect(a.pageTime).toBeGreaterThan(0)
    expect(full).toBeGreaterThan(hit + 1.5)
    expect(full).toBeLessThanOrEqual(9.5)
    expect(pressed).toBeGreaterThan(40)
  })

  it('draws a bolt as a short light capsule with a dark edge and a scorch as a small round mark', () => {
    const t = makeTurrets()
    t.raise(() => {})
    let bolts = 0
    let marks = 0
    for (let i = 0; i < stepHz * 4; i++) {
      t.step(1 / stepHz, { x: 900 + 300 * Math.sin(i / 20), y: 880 }, true, () => {})
      const out: DrawList = []
      t.draw(out)
      for (const b of t.s.bolts) {
        const core = out.find((q) => q.id === `bolt-${b.id}`)!
        const edge = out.find((q) => q.id === `bolt-${b.id}-edge`)!
        expect(core.tone).toBe('light')
        expect(edge.tone).toBe('dark')
        expect(core.w).toBeLessThanOrEqual(64)
        expect(edge.w).toBeGreaterThan(core.w)
        expect(edge.h).toBeGreaterThan(core.h)
        expect(out.indexOf(edge)).toBeLessThan(out.indexOf(core))
        bolts++
      }
      for (const c of out.filter((q) => q.id.startsWith('scorch-'))) {
        expect(c.kind).toBe('disc')
        expect(c.w).toBeLessThanOrEqual(TURRET.scorch)
        expect(c.w).toBe(c.h)
        marks++
      }
    }
    expect(bolts).toBeGreaterThan(10)
    expect(marks).toBeGreaterThan(10)
  })

  it('sinks the deck, the keys and their legends as one body: no legend without its key', () => {
    const a = film()
    let sinking = 0
    for (let i = 0; i < at(21); i++) {
      a.advance(1)
      const st = a.page.save() as { board: number; boardUp: boolean }
      if (st.boardUp || st.board <= 0) continue
      const list: DrawList = []
      a.page.draw(list)
      const well = list.find((q) => q.id === 'keyboard-well')
      if (well) {
        expect(well.x).toBe(DECK.x)
        expect(well.w).toBe(DECK.w)
      }
      for (const seat of seats) {
        const key = list.find((q) => q.id === `key-${seat.name}`)
        const legend = list.find((q) => q.id === `key-${seat.name}-legend`)
        if (legend) {
          expect(key, seat.name).toBeDefined()
          expect(legend.z0).toBe(key!.z1)
        }
        if (legend && key!.z1 <= 0) expect(well && key!.y >= well.y, seat.name).toBe(true)
      }
      sinking++
    }
    expect(sinking).toBeGreaterThan(100)
  })

  it('does not move the cursor of the film before the page has set it down', () => {
    const page = makePage()
    const first = page.script(0)
    expect([first.x, first.y]).toEqual([HANDOFF.x, HANDOFF.y])
    for (let t = 0; t <= 0.5; t += 1 / stepHz) expect(page.script(t)).toEqual(first)
    const a = film()
    let far = 0
    for (let i = 0; i < at(1.2); i++) {
      a.advance(1)
      const pose = a.cursor.pose()
      if (pose.z > 60) far = Math.max(far, Math.hypot(pose.x - HANDOFF.x, pose.y - HANDOFF.y))
    }
    expect(far).toBeLessThan(240)
  })
})

describe('the hold after the shredder', () => {
  it('lands the reset at least 2 s before the page turns, seen front-on from home all the while', () => {
    const a = film()
    const page = makePage()
    const home = page.camera('film', 0)!
    let reset = -1
    let turn = -1
    for (let i = 0; i < at(32) && turn < 0; i++) {
      a.advance(1)
      const now = (i + 1) / stepHz
      const st = a.page.save() as { received: boolean; values: Record<string, string> }
      if (reset < 0 && st.received) {
        reset = now
        expect(Object.values(st.values).join('')).toBe('')
        expect(a.page.states!()).toContain('received')
      }
      if (reset >= 0) expect(page.camera('film', now)!.eye).toEqual(home.eye)
      if (a.events.some((e) => e.name === 'page-turn')) turn = now
    }
    expect(reset).toBeGreaterThan(28.25)
    expect(turn - reset).toBeGreaterThanOrEqual(2)
  })
})

describe('the Continue button', () => {
  it('is drawn light while the form is empty at rest and dark once the form can be sent', () => {
    const a = film()
    const tones = (): [string, string] => {
      const list: DrawList = []
      a.page.draw(list)
      return [list.find((q) => q.id === 'continue-cap')!.tone, list.find((q) => q.id === 'continue-label')!.tone]
    }
    a.advance(at(0.3))
    expect(tones()).toEqual(['metal', 'ink'])
    a.advance(at(30.2) - at(0.3))
    expect(tones()).toEqual(['accent', 'inkLight'])
  })
})

describe('what the measures read', () => {
  it('marks a part as moved only while a gag has taken it from its place in the layout tree', () => {
    const a = film()
    const seen = { paperAtRest: 0, paperAway: 0, keysAway: 0, slab: 0 }
    for (let i = 0; i < at(31.9); i++) {
      a.advance(1)
      if (i % 6 !== 0) continue
      const list: DrawList = []
      a.page.draw(list)
      for (const s of list) {
        if (s.id === 'resume-paper' || s.id.startsWith('resume-paper-line-')) {
          const paper = list.find((q) => q.id === 'resume-paper')!
          const away = paper.x !== PAPER_REST.x || paper.y !== PAPER_REST.y
          expect(Boolean(s.moved)).toBe(away)
          if (away) seen.paperAway++
          else seen.paperAtRest++
        }
        if (s.id === 'email-slab') {
          expect(s.moved).toBe(true)
          seen.slab++
        }
        if (/^key-[a-z0-9]+$/.test(s.id)) {
          const seat = seats.find((q) => `key-${q.name}` === s.id)!
          const away = Math.abs(s.x - seat.x) > 0.01 || Math.abs(s.y - seat.y) > 0.01
          if (away) {
            expect(s.moved).toBe(true)
            seen.keysAway++
          } else if (a.pageTime < 10) expect(Boolean(s.moved)).toBe(false)
        }
      }
    }
    expect(seen.paperAtRest).toBeGreaterThan(0)
    expect(seen.paperAway).toBeGreaterThan(0)
    expect(seen.keysAway).toBeGreaterThan(0)
    expect(seen.slab).toBeGreaterThan(0)
  })

  it('calls the keycaps, the turrets and the shredder housing mechanisms, never the deck, each at least machineMinTop high', () => {
    const a = film()
    const least = config.scale.heights.machineMinTop
    let keys = 0
    for (let i = 0; i < at(31.9); i++) {
      a.advance(1)
      if (i % 6 !== 0) continue
      const list: DrawList = []
      a.page.draw(list)
      for (const s of list) {
        if (s.id === 'keyboard-deck') expect(Boolean(s.mechanism)).toBe(false)
        if (!s.mechanism) continue
        expect(s.z1).toBeGreaterThanOrEqual(s.id.endsWith('-barrel') ? least - 4 : least)
        if (s.id.startsWith('key-')) keys++
      }
    }
    expect(keys).toBeGreaterThan(1000)
  })

  it('stands a keycap on the deck and gives its top as a height above the page', () => {
    const { keyboardDeck, keycap, keyTravel } = config.scale.heights
    const out: DrawList = []
    drawFire(out, { typed: 'Perplex', pressed: ['e'], turrets: makeTurrets() })
    const names = new Set(seats.map((q) => `key-${q.name}`))
    const keys = out.filter((s) => names.has(s.id))
    expect(keys.length).toBe(seats.length)
    for (const s of keys) {
      expect(s.z0).toBe(keyboardDeck)
      expect(s.z1).toBe(s.id === 'key-e' ? keycap - keyTravel : keycap)
    }
    const floors: string[] = []
    const walk = (n: { id: string; kind: string; floor?: number; children?: unknown[] }): void => {
      if (n.kind === 'keycap' && n.floor !== undefined) floors.push(n.id)
      for (const c of n.children ?? []) walk(c as Parameters<typeof walk>[0])
    }
    walk(makePage().layout as Parameters<typeof walk>[0])
    expect(floors).toEqual([])
  })

  it('says that the strips do not strike the cursor', () => {
    const a = film()
    a.advance(at(31.9))
    const zip = a.events.filter((e) => e.name === 'strips-zip')
    expect(zip.length).toBe(1)
    expect(zip[0]!.hitsCursor).toBe(false)
  })
})

