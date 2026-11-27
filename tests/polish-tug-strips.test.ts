import { describe, expect, it } from 'vitest'
import type * as THREE from 'three'
import { config, stepHz } from '../src/config'
import { lookOf } from '../src/cursor/look'
import { makeBody } from '../src/cursor/model/body'
import { pages } from '../src/pages'
import { BotDriver, type BotName } from '../src/stage/bots'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage } from '../src/stage/stage'

function firstStrips(s: Stage, most: number): { high: number[]; early: boolean; gag: string; at: number } | null {
  let early = false
  while (s.time < most) {
    s.advance(1)
    const p = s.cursor.pose()
    if (!p.strips) continue
    if (!p.damage.includes('shredded') || !p.onPage) early = true
    const high: number[] = []
    const gag = s.page.gag() ?? ''
    const at = s.time
    for (let i = 0; i < stepHz / 4; i++) {
      const q = s.cursor.pose()
      high.push(q.strips ? Math.max(...q.strips.map((x) => x.z)) : -1)
      s.advance(1)
    }
    return { high, early, gag, at }
  }
  return null
}

interface Cut { root: THREE.Object3D; apply(look: unknown): void; cut: THREE.Mesh; set: { strip: ArrayLike<number> } }

// For every step from the strips' first: the share of each strip's own length that is drawn, how far the highest drawn point stands over the lip, and whether the pose still names a lip.
function growth(s: Stage, most: number): { share: number[]; over: number; lip: boolean; keys: string }[] | null {
  const body = makeBody!() as unknown as Cut
  const span = (strips: unknown, turn: number): [number, number][] => {
    const c = s.cursor.pose()
    body.root.rotation.set(0, 0, turn)
    body.apply({ ...lookOf(c, s.time).body, strips })
    const a = body.cut.geometry.getAttribute('position').array as Float32Array
    const out: [number, number][] = []
    for (let i = 0; i < a.length / 3; i++) {
      const k = body.set.strip[i]!
      const h = a[i * 3]! * Math.sin(turn) + a[i * 3 + 1]! * Math.cos(turn)
      const at = out[k] ?? (out[k] = [Infinity, -Infinity])
      at[0] = Math.min(at[0], h)
      at[1] = Math.max(at[1], h)
    }
    return out
  }
  while (s.time < most) {
    s.advance(1)
    if (!s.cursor.pose().strips) continue
    const rows: { share: number[]; over: number; lip: boolean; keys: string }[] = []
    for (let n = 0; n < stepHz / 4; n++) {
      const c = s.cursor.pose()
      const turn = -c.lean - c.spin
      const strips = c.strips!
      const whole = span(strips.map((p) => ({ x: p.x, y: p.y, z: p.z, rot: p.rot, tilt: p.tilt })), turn)
      const drawn = span(strips.map((p) => ({ ...p })), turn)
      rows.push({
        share: drawn.map((d, k) => (d[1] - d[0]) / (whole[k]![1] - whole[k]![0])),
        over: Math.max(...drawn.map((d, k) => (strips[k]!.below === undefined ? -Infinity : d[1] - strips[k]!.below!))),
        lip: strips.some((p) => p.below !== undefined),
        keys: [...new Set(strips.flatMap((p) => Object.keys(p)))].sort().join(' ')
      })
      s.advance(1)
    }
    return rows
  }
  return null
}

describe('polish tug: the strips of the shredded arrow come out of the mouth', () => {
  const cases: [string, () => Stage][] = [
    ['the film of step 1', () => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })],
    ...config.live.bots.slice(0, 2).map((b): [string, () => Stage] => [`the live site, bot ${b}`, () => new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver(b as BotName, config.seed) })])
  ]
  for (const [name, make] of cases) {
    it(`${name}: they show only once the arrow is shredded, and lie low under the hood on their first frame`, () => {
      const got = firstStrips(make(), 200)
      expect(got).not.toBeNull()
      const g = got!
      console.log(`${name}: strips first at ${g.at.toFixed(3)} s in ${g.gag}; highest strip ${g.high[0]!.toFixed(2)} on the first step, ${g.high[4]!.toFixed(2)} a frame on, ${g.high[Math.round(stepHz * 0.12)]!.toFixed(2)} at 0.12 s`)
      expect(g.early).toBe(false)
      expect(g.gag).toBe('step1.shredded')
      expect(g.high[0]!).toBeLessThan(1)
      expect(g.high[Math.round(stepHz * 0.12)]!).toBeGreaterThan(g.high[0]!)
    })
  }
  for (const [name, make] of cases) {
    it(`${name}: each grows down from the mouth's lower lip, a fifth of it or less at first and whole in 5 to 7 frames`, () => {
      const rows = growth(make(), 200)
      expect(rows).not.toBeNull()
      const r = rows!
      const per = stepHz / 60
      const count = r[0]!.share.length
      const whole = Array.from({ length: count }, (_, k) => r.findIndex((row) => row.share[k]! > 0.999) / per)
      const free = r.findIndex((row) => !row.lip) / per
      console.log(`${name}: shares of the strips drawn on the first step ${r[0]!.share.map((v) => v.toFixed(2)).join(' ')}; a frame on ${r[per]!.share.map((v) => v.toFixed(2)).join(' ')}; three frames on ${r[per * 3]!.share.map((v) => v.toFixed(2)).join(' ')}; whole after ${whole.map((v) => v.toFixed(2)).join(' ')} frames; no lip named after ${free.toFixed(2)} frames; highest point over the lip ${Math.max(...r.map((row) => row.over)).toFixed(4)}`)
      expect(Math.max(...r[0]!.share)).toBeLessThanOrEqual(0.2)
      expect(Math.max(...r.map((row) => row.over))).toBeLessThan(0.001)
      for (const w of whole) {
        expect(w).toBeGreaterThanOrEqual(5)
        expect(w).toBeLessThanOrEqual(7)
      }
      for (let n = 1; n < r.length; n++) for (let k = 0; k < count; k++) expect(r[n]!.share[k]!).toBeGreaterThan(r[n - 1]!.share[k]! - 0.02)
      expect(free).toBeGreaterThan(7)
      expect(free).toBeLessThanOrEqual(12)
      expect(r[r.length - 1]!.keys).toBe('rot tilt x y z')
    })
  }
})
