import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DECK } from '../src/pages/step1/keyboard'
import { SLOT } from '../src/pages/step1/layout'
import { FIRST, makePlan, pointerAt } from '../src/pages/step1/script'
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
    expect(FIRST.flee[0] - FIRST.cocky[1]).toBeGreaterThanOrEqual(1)
    expect(still(FIRST.flee[1], FIRST.shock[0])).toBe(true)
    expect(FIRST.shock[0] - FIRST.flee[1]).toBeGreaterThanOrEqual(1)
    expect(still(FIRST.shock[0] + 0.2, FIRST.shock[1])).toBe(true)
    expect(FIRST.shock[1] - FIRST.shock[0]).toBeGreaterThanOrEqual(0.6)
  })

  it('makes the frame of the approved image at 6.0: two bolts in the air, one a hand from the cursor, a burn just landed, the cursor off the keys', () => {
    const s = film()
    s.advance(at(6))
    const st = s.page.save() as unknown as { values: Record<string, string>; turrets: { bolts: { x0: number; y0: number; tx: number; ty: number; age: number; flight: number }[]; scorches: { left: number }[] } }
    const pose = s.cursor.pose()
    const far = st.turrets.bolts.map((b) => {
      const u = b.age / b.flight
      return Math.hypot(b.x0 + (b.tx - b.x0) * u - pose.x - 14, b.y0 + (b.ty - b.y0) * u - pose.y - 26)
    })
    expect(st.turrets.bolts.length).toBe(2)
    expect(Math.min(...far)).toBeGreaterThan(60)
    expect(Math.min(...far)).toBeLessThan(140)
    for (const b of st.turrets.bolts) expect((b.flight - b.age) * stepHz).toBeGreaterThan(3)
    expect(Math.max(...st.turrets.scorches.map((c) => c.left))).toBeGreaterThan(2.4 - 0.35)
    expect(pose.z).toBeGreaterThan(50)
    expect(pose.damage.length).toBe(0)
    expect(st.values.firstName).toBe(config.applicant.filmFirstName.slice(0, 5))
    console.log(`the frame at 6.0: the near bolt ${Math.min(...far).toFixed(0)} px from the cursor, the last burn ${(2.4 - Math.max(...st.turrets.scorches.map((c) => c.left))).toFixed(2)} s old`)
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
    expect(most).toBeGreaterThan(1)
    expect(most).toBeLessThan(3)
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
})
