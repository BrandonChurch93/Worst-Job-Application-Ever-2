import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DECK, keyAt, seats } from '../src/pages/step1/keyboard'
import { FIELD_X, GLYPH, SLOT, ZONE } from '../src/pages/step1/layout'
import { CAMERA, FIRST, makePlan, pointerAt } from '../src/pages/step1/script'
import { projectPage } from '../src/stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'step1') as { id: string; from: number; to: number; event?: string }[]
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const at = (seconds: number): number => Math.round(seconds * stepHz)
const drawn = (s: Stage): DrawList => {
  const list: DrawList = []
  s.page.draw(list)
  return list
}

describe('step 1: the script of the film', () => {
  it('never has two moves of the pointer at once, and holds the pointer still before the hit and in the shock', () => {
    const a = config.applicant
    const plan = makePlan(config.seed, a.filmFirstName, a.filmLastName, a.filmEmail)
    for (let i = 1; i < plan.moves.length; i++) expect(plan.moves[i]!.t0).toBeGreaterThanOrEqual(plan.moves[i - 1]!.t1 - 1e-6)
    const still = (from: number, to: number): boolean => {
      const p = pointerAt(plan, from)
      for (let t = from; t <= to; t += 0.05) {
        const q = pointerAt(plan, t)
        if (q.x !== p.x || q.y !== p.y) return false
      }
      return true
    }
    expect(still(FIRST.cocky[1], FIRST.flee[0])).toBe(true)
    expect(FIRST.flee[0] - FIRST.cocky[1]).toBeGreaterThanOrEqual(1.5)
    expect(still(FIRST.flee[1], FIRST.slide[0])).toBe(true)
    expect(FIRST.slide[0] - FIRST.flee[1]).toBeGreaterThanOrEqual(0.6)
    expect(still(FIRST.slide[1], FIRST.after[0]![0])).toBe(true)
    expect(FIRST.after[0]![0] - FIRST.slide[1]).toBeGreaterThanOrEqual(0.4)
  })

  it('makes the frame of the approved image at 6.0: the cursor still on a key of the middle letter rows, scorched, the key under it hot, a bolt in the air', () => {
    const s = film()
    s.advance(at(6))
    const st = s.page.save() as unknown as { values: Record<string, string>; thudKey: number; places: number[]; turrets: { bolts: unknown[]; scorches: { x: number; y: number; left: number }[] } }
    const pose = s.cursor.pose()
    const body = { x: pose.x + 14, y: pose.y + 26 }
    expect(s.cursor.speed).toBeLessThan(60)
    expect(Math.abs(pose.spin)).toBeLessThan(0.2)
    expect(pose.damage).toContain('burn')
    expect(pose.acting).toBe('shocked')
    const under = keyAt(st.places, body.x, body.y)
    expect(under).toBeGreaterThanOrEqual(0)
    expect(under).toBe(st.thudKey)
    expect(seats[under]!.letter).toBe(true)
    expect(Math.abs(body.x - (DECK.x + DECK.w / 2))).toBeLessThan(DECK.w * 0.2)
    expect(st.turrets.bolts.length).toBeGreaterThanOrEqual(1)
    const near = st.turrets.scorches.filter((c) => Math.hypot(c.x - body.x, c.y - body.y) < 200)
    expect(near.length).toBeGreaterThanOrEqual(1)
    expect(st.values.firstName).toBe(config.applicant.filmFirstName.slice(0, 5))
    console.log(`the frame at 6.0: the cursor on the key ${seats[under]!.name}, body at ${body.x.toFixed(0)}, ${body.y.toFixed(0)}, ${near.length} burn near it, ${st.turrets.bolts.length} bolt in the air`)
  })

  it('clicks the field only once the cursor stands on the page', () => {
    const s = film()
    let click = -1
    for (let i = 0; i < at(2) && click < 0; i++) {
      s.advance(1)
      if (s.events.some((e) => e.name === 'keyboard-rise')) click = (i + 1) / stepHz
    }
    expect(click).toBeGreaterThan(1.2)
    expect(click).toBeLessThan(2)
    expect(s.cursor.inAir).toBe(false)
    expect(s.cursor.pose().z).toBeLessThan(40)
  })

  it('gives each beat its event inside the beat, a quarter of a second either way', () => {
    const s = film()
    const first: Record<string, number> = {}
    let seen = 0
    for (let i = 0; i < at(32); i++) {
      s.advance(1)
      while (seen < s.events.length) {
        const e = s.events[seen++]!
        if (first[e.name] === undefined) first[e.name] = (i + 1) / stepHz
      }
    }
    for (const b of beats) {
      if (!b.event) continue
      expect(first[b.event], b.event).toBeGreaterThanOrEqual(b.from - 0.25)
      expect(first[b.event], b.event).toBeLessThanOrEqual(b.to + 0.25)
    }
  })

  it('keeps the cursor, the hands and the slot well inside the frame all through the tug', () => {
    const s = film()
    const page = s.page
    s.advance(at(21.9))
    let frames = 0
    let least = Infinity
    for (let i = at(21.9); i < at(27.2); i++) {
      s.advance(1)
      const now = (i + 1) / stepHz
      const st = page.save() as { phase: string; lost: number }
      if (st.phase !== 'tug' || st.lost >= 0) continue
      const cam = page.camera('film', now)!
      const p = s.cursor.pose()
      const points = [{ x: p.x, y: p.y }, { x: p.x + 28, y: p.y + 52 }, { x: SLOT.cx - SLOT.w / 2, y: SLOT.cy }, { x: SLOT.cx + SLOT.w / 2, y: SLOT.cy + 44 }]
      if (p.hands) for (const h of p.hands) points.push({ x: h.x, y: h.y })
      points.forEach((q, n) => {
        const on = projectPage(cam, q.x, q.y, 0)
        const margin = Math.min(on.x, 1920 - on.x, on.y, 1080 - on.y)
        if (n < 2) least = Math.min(least, margin)
        expect(margin, `${now.toFixed(2)} point ${n}`).toBeGreaterThan(n < 2 ? 70 : 20)
      })
      frames++
    }
    expect(frames).toBeGreaterThan(at(4.5))
    expect(least).toBeGreaterThan(70)
    console.log(`least margin of the cursor in the tug: ${least.toFixed(0)} px`)
  })

  it('hands every maker its numbers', () => {
    const s = film()
    const lengths: Record<string, Set<number>> = {}
    const note = (id: string, v: number[] | undefined): void => {
      if (!v) return
      for (const n of v) expect(Number.isFinite(n), id).toBe(true)
      ;(lengths[id] ??= new Set()).add(v.length)
    }
    for (let i = 0; i < at(31); i++) {
      s.advance(1)
      if (i % 4 !== 0) continue
      for (const q of drawn(s)) {
        const id = /^key-[a-z0-9]+$/.test(q.id) ? 'key' : /^email-slab(-\d)?$/.test(q.id) ? 'slab' : /^strip-\d+$/.test(q.id) ? 'strip' : /^shredder-jaw-\d$/.test(q.id) ? 'jaw' : q.id
        if (['key', 'slab', 'strip', 'jaw', 'keyboard-deck', 'resume-paper', 'field-focus', 'field-caret'].includes(id)) {
          expect(q.v, `${q.id} at ${(i / stepHz).toFixed(2)}`).toBeDefined()
          note(id, q.v)
        }
      }
    }
    expect([...lengths.key!]).toEqual([4])
    expect([...lengths['keyboard-deck']!]).toEqual([3])
    expect([...lengths.slab!]).toEqual([2])
    expect([...lengths.strip!]).toEqual([2])
    expect([...lengths.jaw!]).toEqual([3])
    expect([...lengths['resume-paper']!]).toEqual([11])
    expect([...lengths['field-focus']!]).toEqual([1])
    expect([...lengths['field-caret']!]).toEqual([1])
  })

  it('shakes the deck by a few pixels when a slab lands and puts it back within a third of a second', () => {
    const s = film()
    let landed = -1
    let most = 0
    let after = 0
    for (let i = 0; i < at(20); i++) {
      s.advance(1)
      const now = (i + 1) / stepHz
      if (landed < 0 && s.events.some((e) => e.name === 'slab-drop')) landed = now
      if (landed < 0) continue
      const deck = drawn(s).find((q) => q.id === 'keyboard-deck')
      if (!deck) continue
      const off = Math.abs(deck.y - DECK.y)
      if (now - landed <= 0.25) most = Math.max(most, off)
      else if (now - landed > 0.3 && now - landed < 0.5) after = Math.max(after, off)
      expect(Boolean(deck.moved)).toBe(off > 0.01)
    }
    expect(most).toBeGreaterThan(2)
    expect(most).toBeLessThan(6)
    expect(after).toBe(0)
  })

  it('empties the form a field at a time before it says the resume was received', () => {
    const s = film()
    const seen = new Set<string>()
    for (let i = 0; i < at(31); i++) {
      s.advance(1)
      const st = s.page.save() as { received: boolean; kept: unknown; values: Record<string, string> }
      if (st.kept) seen.add(`${st.values.firstName!.length > 0 ? 1 : 0}${st.values.lastName!.length > 0 ? 1 : 0}${st.values.email!.length > 0 ? 1 : 0}`)
      if (st.received) expect(Object.values(st.values).join('')).toBe('')
    }
    expect(seen.has('111')).toBe(true)
    expect(seen.has('110')).toBe(true)
    expect(seen.has('100')).toBe(true)
  })

  it('hangs strips of paper under the hood from the first bite, never draws one back in, and frames them at the key picture', () => {
    const s = film()
    s.advance(at(22.1))
    const last = new Map<string, number>()
    for (let i = at(22.1); i < at(27); i++) {
      s.advance(1)
      for (const x of drawn(s)) {
        if (!x.id.startsWith('strip-')) continue
        expect(x.v![0]!, x.id).toBeGreaterThanOrEqual((last.get(x.id) ?? 0) - 1e-9)
        last.set(x.id, x.v![0]!)
      }
      if (i + 1 !== at(25.125)) continue
      const hung = drawn(s).filter((x) => x.id.startsWith('strip-'))
      expect(hung.length).toBeGreaterThanOrEqual(5)
      const cam = s.page.camera('film', 25.125)!
      for (const x of hung) {
        expect(x.v![0]!).toBeGreaterThan(0.15)
        expect(x.v![0]!).toBeLessThan(0.45)
        expect(x.v![1]).toBe(0)
        expect(projectPage(cam, x.x, x.y + x.h, 0).y).toBeLessThan(1080 - 20)
      }
      for (const q of [{ x: SLOT.cx - SLOT.w / 2, y: SLOT.cy - SLOT.h / 2 }, { x: SLOT.cx + SLOT.w / 2, y: SLOT.cy + 44 }]) {
        const on = projectPage(cam, q.x, q.y, 0)
        expect(Math.min(on.x, 1920 - on.x, on.y, 1080 - on.y)).toBeGreaterThan(40)
      }
    }
  })

  it('holds the tug frame left of the field column on the intake and the outlet, is close by 2.4 s into the tug, 560 to 680 px of page at the key picture, and about 520 px after it', () => {
    const page = film().page
    let gutter = Infinity
    let widest = 0
    let closest = Infinity
    for (let now = CAMERA.in[1]; now <= CAMERA.out[0]; now += 0.05) {
      const cam = page.camera('film', now)!
      const wide = (1920 * 200) / (projectPage(cam, SLOT.cx + 100, SLOT.cy, 0).x - projectPage(cam, SLOT.cx - 100, SLOT.cy, 0).x)
      if (now >= CAMERA.creep[1]) {
        widest = Math.max(widest, wide)
        closest = Math.min(closest, wide)
      } else expect(wide, now.toFixed(2)).toBeLessThan(980)
      if (now >= CAMERA.closer[1] && now <= CAMERA.key) {
        expect(wide, now.toFixed(2)).toBeGreaterThan(560)
        expect(wide, now.toFixed(2)).toBeLessThan(680)
      }
      for (const y of [ZONE.y, ZONE.y + ZONE.h, SLOT.cy]) {
        gutter = Math.min(gutter, projectPage(cam, FIELD_X - 16, y, 0).x - 1920)
        expect(projectPage(cam, FIELD_X - 16, y, 0).x, now.toFixed(2)).toBeGreaterThan(1920 - 0.01)
        expect(projectPage(cam, FIELD_X - 6, y, config.scale.heights.card).x, now.toFixed(2)).toBeGreaterThan(1920)
      }
      for (const q of [{ x: SLOT.cx - SLOT.w / 2, y: SLOT.cy - SLOT.h / 2 }, { x: SLOT.cx + SLOT.w / 2, y: SLOT.cy + 30 }]) {
        const on = projectPage(cam, q.x, q.y, 0)
        expect(Math.min(on.x, 1920 - on.x, on.y, 1080 - on.y), now.toFixed(2)).toBeGreaterThan(100)
      }
    }
    expect(CAMERA.closer[1]).toBeLessThanOrEqual(22.03 + 2.4)
    expect(widest).toBeLessThan(540)
    expect(closest).toBeGreaterThan(500)
    expect((config.cursor.heightPxAt1080 * 1920) / widest / 1080).toBeGreaterThan(0.22)
    console.log(`tug frame: ${closest.toFixed(0)} to ${widest.toFixed(0)} px of page wide once it has closed, the line before the field column ${gutter.toFixed(0)} px outside the right edge`)
  })

  it('draws the upload glyph above the prompt of the drop zone until the resume is received', () => {
    const s = film()
    s.advance(at(6))
    const list = drawn(s)
    const glyph = list.filter((x) => x.id.startsWith('resume-glyph-'))
    const prompt = list.find((x) => x.id === 'resume-prompt')!
    expect(glyph.length).toBe(6)
    for (const g of glyph) {
      expect(g.y + g.h).toBeLessThan(prompt.y - 8)
      expect(g.y).toBeGreaterThan(ZONE.y + 30)
      expect(Math.abs(g.x + g.w / 2 - (ZONE.x + ZONE.w / 2))).toBeLessThanOrEqual(GLYPH.w / 2 + 1)
    }
    s.advance(at(31) - at(6))
    expect((s.page.save() as { received: boolean }).received).toBe(true)
    expect(drawn(s).some((x) => x.id.startsWith('resume-glyph-'))).toBe(false)
  })
})
