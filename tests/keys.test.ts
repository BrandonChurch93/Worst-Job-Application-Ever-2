import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { DECK, seats } from '../src/pages/step1/keyboard'
import { SLAB } from '../src/pages/step1/layout'
import { filmFlow, filmOptions, ScriptDriver, Stage, type Driver, type DriverView, type DrawList, type Pointer } from '../src/stage/stage'

const heights = config.scale.heights
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const at = (seconds: number): number => Math.round(seconds * stepHz)
const drawn = (s: Stage): DrawList => {
  const list: DrawList = []
  s.page.draw(list)
  return list
}
const frame = stepHz / config.film.fps

class Hover implements Driver {
  readonly name = 'script' as const
  constructor(private x: number, private y: number) {}
  input(v: DriverView): Pointer {
    const st = v.page.save() as { phase: string }
    if (st.phase === 'slabs') return { x: this.x, y: this.y, down: false }
    const h = v.page.hint()
    return h ? { x: h.dodge?.x ?? h.x, y: h.dodge?.y ?? h.y, down: h.down } : { x: this.x, y: this.y, down: false }
  }
}

describe('the keys answer what strikes them', () => {
  it('puts a struck cap half way down or lower in the frame of the strike and at the bottom of its travel in the next, springs it past its rest and seats it again', () => {
    const s = film()
    const rows = new Map<string, number[]>()
    let known: Record<string, number> = {}
    for (let i = 0; i < at(10.05); i++) {
      s.advance(1)
      if (i % frame !== frame - 1) continue
      const st = s.page.save() as { keyDown: Record<string, number>; phase: string }
      const list = drawn(s)
      for (const name of new Set([...Object.keys(st.keyDown), ...Object.keys(known)])) {
        const key = list.find((q) => q.id === `key-${name}`)
        if (!key) continue
        if (!(name in known) || (st.keyDown[name] ?? 0) > known[name]!) rows.set(`${name}@${i}`, [])
        const last = [...rows.keys()].filter((k) => k.startsWith(`${name}@`)).pop()!
        rows.get(last)!.push(key.z1)
      }
      known = { ...st.keyDown }
    }
    expect(rows.size).toBeGreaterThanOrEqual(config.applicant.filmFirstName.length)
    for (const [name, z] of rows) {
      expect(z[0], name).toBeLessThanOrEqual(heights.keycap - heights.keyTravel / 2)
      expect(Math.min(...z.slice(0, 3)), name).toBe(heights.keycap - heights.keyTravel)
      expect(Math.max(...z), name).toBeGreaterThan(heights.keycap + 0.5)
      expect(Math.max(...z), name).toBeLessThan(heights.keycap + 2)
      expect(z[z.length - 1], name).toBeGreaterThanOrEqual(heights.keycap)
      expect(z[z.length - 1], name).toBeLessThan(heights.keycap + 2)
    }
  })

  it('dips the cap under the cursor in the frame the bolt hits it, pulses the field at once and shakes the tray a little', () => {
    const s = film()
    let hit = -1
    let low = Infinity
    let glow = -1
    let shook = 0
    for (let i = 0; i < at(7.6); i++) {
      s.advance(1)
      if (hit < 0 && s.events.some((e) => e.name === 'bolt-hit-cursor')) {
        hit = i
        const st = s.page.save() as { thudKey: number; glow: number }
        expect(st.thudKey).toBeGreaterThanOrEqual(0)
        const list = drawn(s)
        low = list.find((q) => q.id === `key-${seats[st.thudKey]!.name}`)!.z1
        glow = list.find((q) => q.id === 'field-focus')!.v![0]!
      }
      if (hit >= 0 && i - hit < at(0.2)) shook = Math.max(shook, Math.abs(drawn(s).find((q) => q.id === 'keyboard-deck')!.y - DECK.y))
    }
    expect(hit).toBeGreaterThan(0)
    expect(low).toBe(heights.keycap - heights.keyTravel)
    expect(glow).toBe(1)
    expect(shook).toBeGreaterThan(1)
    expect(shook).toBeLessThan(4.5)
  })
})

describe('the slabs come in, strike, lie and leave', () => {
  const run = (s: Stage, until: number): { most: number; boxes: Map<string, { x: number; y: number }>; high: Map<string, number>; flown: Map<string, number>; resume: number; gone: number; pulse: number } => {
    const boxes = new Map<string, { x: number; y: number }>()
    const high = new Map<string, number>()
    const flown = new Map<string, number>()
    let most = 0
    let resume = -1
    let gone = -1
    let pulse = 0
    let drops = 0
    for (let i = 0; i < until; i++) {
      s.advance(1)
      const st = s.page.save() as { phase: string; slabs: unknown[]; slabClear: number }
      if (st.phase === 'resume' && resume < 0) resume = i
      if (resume >= 0 && !st.slabs.length && gone < 0) gone = i
      if (!st.slabs.length) continue
      const list = drawn(s)
      const n = s.events.filter((e) => e.name === 'slab-drop').length
      if (n > drops) {
        drops = n
        pulse += list.find((q) => q.id === 'field-focus')?.v?.[0] === 1 ? 1 : 0
      }
      const bodies = list.filter((q) => /^email-slab(-\d)?$/.test(q.id))
      most = Math.max(most, bodies.length)
      for (const b of bodies) {
        if (!high.has(b.id)) high.set(b.id, b.z0)
        if (st.slabClear < 0) boxes.set(b.id, { x: b.x, y: b.y })
        else flown.set(b.id, Math.abs(b.x - boxes.get(b.id)!.x))
      }
    }
    return { most, boxes, high, flown, resume, gone, pulse }
  }
  const apart = (boxes: Map<string, { x: number; y: number }>): void => {
    const list = [...boxes.values()]
    for (const b of list) {
      expect(b.x).toBeGreaterThanOrEqual(DECK.x)
      expect(b.x + SLAB.w).toBeLessThanOrEqual(DECK.x + DECK.w)
      expect(b.y).toBeGreaterThanOrEqual(DECK.y)
      expect(b.y + SLAB.h).toBeLessThanOrEqual(DECK.y + DECK.h)
    }
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const p = list[i]!
      const q = list[j]!
      expect(p.x + SLAB.w <= q.x || q.x + SLAB.w <= p.x || p.y + SLAB.h <= q.y || q.y + SLAB.h <= p.y, `${i} and ${j}`).toBe(true)
    }
  }

  it('in the film: three slabs, none on another, each whole on the deck, each from high up, each pulsing the field, each flying off after the keyboard starts to sink', () => {
    const s = film()
    const r = run(s, at(20.6))
    expect(r.most).toBe(3)
    expect(r.boxes.size).toBe(3)
    apart(r.boxes)
    for (const z of r.high.values()) expect(z).toBeGreaterThan(heights.keycap + 400)
    expect(r.pulse).toBe(3)
    for (const f of r.flown.values()) expect(f).toBeGreaterThan(900)
    expect(r.resume).toBeGreaterThan(0)
    expect(r.gone).toBeGreaterThan(r.resume)
    expect(r.gone - r.resume).toBeLessThan(at(0.4))
  })

  it('live, with the pointer held in one place: the three slabs still lie apart, and the page goes on', () => {
    for (const [x, y] of [[960, 890], [140, 740], [1780, 1040]] as const) {
      const s = new Stage({ mode: 'live', flow: [{ page: 'step1' }, { page: 'step2' }], pages, driver: new Hover(x, y) })
      let i = 0
      while ((s.page.save() as { phase: string }).phase !== 'slabs' && i++ < at(120)) s.advance(1)
      expect((s.page.save() as { phase: string }).phase).toBe('slabs')
      const r = run(s, at(4))
      expect(r.most).toBe(3)
      apart(r.boxes)
      expect(r.gone).toBeGreaterThan(0)
    }
  })
})
