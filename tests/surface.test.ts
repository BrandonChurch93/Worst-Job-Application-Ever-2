import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { carve, cutsOf, groundKey, openingsOf } from '../src/shell/real/ground'
import { brushedHeights, grainHeights, makeMaterials } from '../src/shell/materials'
import { pocketCut } from '../src/shell/solids'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const beats = config.film.beats.filter((b) => b.unit === 'step1')
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const at = (seconds: number): number => Math.round(seconds * stepHz)
const span = { width: 1920, top: 0, tall: 1080 }

function states(): { name: string; list: DrawList }[] {
  const s = film()
  const out: { name: string; list: DrawList }[] = []
  let done = 0
  for (const b of beats) {
    for (const part of [0.05, 0.5, 0.95]) {
      const want = at(b.from + (b.to - b.from) * part)
      s.advance(want - done)
      done = want
      const list: DrawList = []
      s.page.draw(list)
      out.push({ name: `${b.id} at ${part}`, list })
    }
  }
  return out
}

const all = states()

describe('the slab of step 1', () => {
  it('has a state for every beat of step 1', () => {
    expect(beats.length).toBeGreaterThan(4)
    expect(all.length).toBe(beats.length * 3)
  })

  it('cuts one pocket for every pocket shape of the draw list, at the shape\'s own place and height', () => {
    for (const { name, list } of all) {
      const want = list.filter((s) => s.pocket && s.kind !== 'well' && s.kind !== 'text' && s.kind !== 'ball' && !s.rot && s.x >= 0 && s.x + s.w <= span.width && s.y >= span.top && s.y + s.h <= span.top + span.tall)
      const cuts = cutsOf(list, span)
      expect(cuts.map((c) => c.id), name).toEqual(want.map((s) => s.id))
      expect(cuts.length, name).toBeGreaterThan(0)
      for (const c of cuts) {
        const s = list.find((q) => q.id === c.id)!
        expect(Math.abs(c.x - s.x), `${name} ${c.id}`).toBeLessThanOrEqual(0.125)
        expect(Math.abs(c.y - s.y), `${name} ${c.id}`).toBeLessThanOrEqual(0.125)
        expect(Math.abs(c.w - s.w), `${name} ${c.id}`).toBeLessThanOrEqual(0.125)
        expect(Math.abs(c.h - s.h), `${name} ${c.id}`).toBeLessThanOrEqual(0.125)
        expect(Math.abs(c.z0 - s.z0), `${name} ${c.id}`).toBeLessThanOrEqual(0.125)
        expect(c.depth, `${name} ${c.id}`).toBe(pocketCut(s).depth)
        expect(c.depth, `${name} ${c.id}`).toBeGreaterThanOrEqual(-s.z0)
      }
    }
  })

  it('opens the slab for every well of the draw list and for nothing else', () => {
    let seen = 0
    for (const { name, list } of all) {
      const wells = list.filter((s) => s.kind === 'well' && s.z0 < 0)
      const open = openingsOf(list, span)
      expect(open.length, name).toBe(wells.length)
      seen += open.length
      open.forEach((o, i) => {
        const s = wells[i]!
        expect(o.z, name).toBe(s.z0)
        expect(o.tone, name).toBe(s.tone)
        expect(o.x0, name).toBe(Math.max(0, s.x))
        expect(o.x1, name).toBe(Math.min(span.width, s.x + s.w))
        expect(o.y0, name).toBe(Math.max(span.top, s.y))
        expect(o.y1, name).toBe(Math.min(span.top + span.tall, s.y + s.h))
      })
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('carves a floor at each opening\'s height and leaves the page flat everywhere else', () => {
    for (const { name, list } of all) {
      const cuts = cutsOf(list, span)
      const open = openingsOf(list, span)
      const carved = carve(cuts, open, span.width, span.top, span.tall)
      const lowest = open.reduce((m, o) => Math.min(m, o.z), 0)
      expect(carved.deepest, name).toBe(lowest)
      let flat = 0
      const floors = new Map<number, number>()
      for (const g of carved.groups) {
        for (let i = 0; i < g.pos.length; i += 18) {
          if (g.nor[i + 2] !== 1) continue
          const xs = [g.pos[i]!, g.pos[i + 3]!, g.pos[i + 6]!, g.pos[i + 15]!]
          const ys = [g.pos[i + 1]!, g.pos[i + 4]!, g.pos[i + 7]!, g.pos[i + 16]!]
          const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
          const z = g.pos[i + 2]!
          if (z === 0) {
            expect(g.tone, name).toBe('page')
            flat += area
          } else floors.set(z, (floors.get(z) ?? 0) + area)
        }
      }
      const tiles = cuts.reduce((sum, c) => sum + (c.w + 2 * c.margin) * (c.h + 2 * c.margin), 0)
      let holes = 0
      for (const [z, area] of floors) {
        expect(open.some((o) => o.z === z), `${name} floor at ${z}`).toBe(true)
        holes += area
      }
      for (const o of open) expect(floors.has(o.z), `${name} opening at ${o.z}`).toBe(true)
      expect(flat + holes + tiles, name).toBeGreaterThan(span.width * span.tall * 0.995)
      expect(flat + holes + tiles, name).toBeLessThan(span.width * span.tall * 1.02)
    }
  })

  it('is rebuilt only when a pocket changes, never for an opening that moves', () => {
    const keys = new Set(all.map(({ list }) => groundKey({ page: 'step1', ...span, list })))
    const pockets = new Set(all.map(({ list }) => cutsOf(list, span).map((c) => `${c.id}:${c.x},${c.y},${c.w},${c.h},${c.z0}`).join(';')))
    expect(keys.size).toBe(pockets.size)
    const taller = groundKey({ page: 'step1', width: 1920, top: 0, tall: 2400, list: all[0]!.list })
    expect(keys.has(taller)).toBe(false)
  })

  it('holds for any page height', () => {
    for (const tall of [600, 1080, 2400, 9000]) {
      const list = all[0]!.list
      const carved = carve(cutsOf(list, { width: 1920, top: 0, tall }), openingsOf(list, { width: 1920, top: 0, tall }), 1920, 0, tall)
      let low = Infinity
      for (const g of carved.groups) for (let i = 1; i < g.pos.length; i += 3) low = Math.min(low, g.pos[i]!)
      expect(low).toBeCloseTo(540 - tall, 3)
    }
  })
})

describe('the textures of the surface', () => {
  it('makes the same grain for the same seed and another for another', () => {
    const a = grainHeights(128, config.seed)
    const b = grainHeights(128, config.seed)
    const c = grainHeights(128, config.seed + 1)
    expect(Array.from(a)).toEqual(Array.from(b))
    let differ = 0
    for (let i = 0; i < a.length; i++) if (a[i] !== c[i]) differ++
    expect(differ).toBeGreaterThan(a.length / 2)
    for (const v of a) expect(Number.isFinite(v)).toBe(true)
  })

  it('makes the same brushing for the same seed', () => {
    expect(Array.from(brushedHeights(64, 7))).toEqual(Array.from(brushedHeights(64, 7)))
    expect(Array.from(brushedHeights(64, 7))).not.toEqual(Array.from(brushedHeights(64, 8)))
  })

  it('keeps every material name and no surface pure black or pure white', () => {
    const m = makeMaterials(config.seed) as unknown as Record<string, { color?: { r: number; g: number; b: number } }>
    for (const name of ['ceramic', 'pocket', 'glass', 'aluminium', 'aluminiumTurned', 'orange', 'gap', 'ink', 'inkOnOrange', 'enamel', 'edge', 'smoked', 'paper', 'red', 'keycap', 'steel', 'rubber']) {
      const c = m[name]?.color
      expect(c, name).toBeDefined()
      expect(c!.r + c!.g + c!.b, name).toBeGreaterThan(0)
      expect(Math.min(c!.r, c!.g, c!.b), name).toBeLessThan(1)
    }
  })
})
