import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config, stepHz } from '../src/config'
import { newFight, stepFight, type Arena } from '../src/boss/fight'
import { DART, HOME, POPUP, SHIELD } from '../src/boss/plan'
import { pages } from '../src/pages'
import { makeLayout } from '../src/pages/step4/layout'
import { ACT, makeScript } from '../src/pages/step4/script'
import { bossWeapons } from '../src/pages/step4/real/boss-weapons'
import { healthBar } from '../src/pages/step4/real/health-bar'
import { dipAt, verifyCard } from '../src/pages/step4/real/verify-card'
import type { Emitter, PartMaker, RealContext } from '../src/real/types'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { Shape, StepIo } from '../src/stage/types'

const beats = config.film.beats.filter((b) => b.unit === 'boss') as { id: string; from: number; to: number }[]
const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const makers: Record<string, PartMaker | null> = { 'boss-weapons': bossWeapons, 'health-bar': healthBar, 'verify-card': verifyCard }

const context = (list: Shape[], time = 0, lights: Emitter[] = []): RealContext => ({ page: 'step4', list, byId: new Map(list.map((s) => [s.id, s])), time, scroll: 0, turning: false, width: 1920, top: 0, tall: 1080, light: (e) => void lights.push(e) })

const io = (pressed: boolean, cursor: { x: number; y: number }, events: string[]): StepIo =>
  ({ dt: 1 / stepHz, time: 0, pressed, pointer: { ...cursor, down: pressed }, cursor: { ...cursor, damaged: false, act: () => undefined, react: () => undefined, hurt: () => undefined, knock: () => undefined }, emit: (name: string) => void events.push(name) }) as unknown as StepIo

const arena: Arena = { slabs: [], popups: [] }

function frames(): { time: number; list: Shape[] }[] {
  const stage = film()
  const out: { time: number; list: Shape[] }[] = []
  while (stage.page.id === 'step4' && stage.time < 33) {
    stage.advance(2)
    if (stage.page.id !== 'step4') break
    const list: Shape[] = []
    stage.page.draw(list)
    out.push({ time: stage.time, list })
  }
  return out
}

describe('the boss fight, made real', () => {
  const all = frames()

  it('has a real thing for every shape of its three parts, in every frame of the film', () => {
    const none = new Set<string>()
    for (const f of all) {
      const ctx = context(f.list, f.time)
      for (const s of f.list) {
        const maker = makers[s.part]
        if (maker === undefined || s.kind === 'text') continue
        expect(maker, s.part).not.toBeNull()
        if (maker!.key(s, ctx) === null) none.add(s.id.replace(/\d+/g, 'N'))
      }
    }
    expect([...none]).toEqual([])
  })

  it('keeps every number that changes each frame out of the keys', () => {
    const keys = new Map<string, Set<string>>()
    for (const f of all) {
      const ctx = context(f.list, f.time)
      for (const s of f.list) {
        const maker = makers[s.part]
        if (!maker || s.kind === 'text') continue
        const k = maker.key(s, ctx)!
        if (!keys.has(s.id)) keys.set(s.id, new Set())
        keys.get(s.id)!.add(k)
      }
    }
    for (const [id, set] of keys) {
      const most = id === 'verify-card' ? 24 : id === 'verify-box' ? 2 : 1
      expect(set.size, id).toBeLessThanOrEqual(most)
    }
    expect(keys.get('health-fill')!.size).toBe(1)
    expect(keys.get('health-track')!.size).toBe(1)
  })

  it('fires a volley with each click, and a click still does the damage of three', () => {
    const f = newFight(HOME.x, HOME.y)
    const events: string[] = []
    stepFight(f, io(true, { x: 450, y: 900 }, events), arena)
    for (let i = 0; i < stepHz * 1.2; i++) stepFight(f, io(false, { x: 450, y: 900 }, events), arena)
    expect(events.filter((e) => e === 'dart-fire').length).toBe(DART.volley)
    expect(events.filter((e) => e === 'dart-hit').length).toBe(DART.volley)
    expect(POPUP.hp).toBe(3 * DART.volley)
    expect(100 - f.health).toBeCloseTo(DART.damage[0] * DART.volley, 5)
  })

  it('stops a dart from the left on the glass shield, and sets its spark on the glass', () => {
    const f = newFight(HOME.x, HOME.y)
    const events: string[] = []
    stepFight(f, io(true, { x: 450, y: 900 }, events), arena)
    let seen: { x: number; z: number } | null = null
    for (let i = 0; i < stepHz && !seen; i++) {
      stepFight(f, io(false, { x: 450, y: 900 }, events), arena)
      if (f.sparks.length) seen = { x: f.sparks[0]!.x - f.x, z: f.sparks[0]!.z ?? 0 }
    }
    expect(seen).not.toBeNull()
    expect(seen!.x).toBeCloseTo(SHIELD.x, 3)
    expect(seen!.z).toBe(SHIELD.z)
  })

  it('shows, in the key picture of the fight, a slab in flight, a stream of darts, a spark and the health bar', () => {
    const at = beats.find((b) => b.id === 'boss.slabs')!
    const t = at.from + (at.to - at.from) * 0.5
    const f = all.reduce((a, b) => (Math.abs(b.time - t) < Math.abs(a.time - t) ? b : a))
    const ids = f.list.map((s) => s.id)
    expect(ids.filter((id) => /^dart-\d+$/.test(id)).length).toBeGreaterThanOrEqual(4)
    expect(ids.filter((id) => /^spark-\d+$/.test(id)).length).toBeGreaterThanOrEqual(1)
    expect(f.list.filter((s) => /^fired-\d+$/.test(s.id) && s.z0 > 10).length).toBeGreaterThanOrEqual(1)
    expect(ids).toContain('health-fill')
    expect(ids).toContain('health-track')
  })

  it('cues nothing in the half second before a key picture, and keeps every cue inside the unit', () => {
    const keys = [beats.find((b) => b.id === 'boss.slabs')!, beats.find((b) => b.id === 'boss.collapse')!]
    const times = [keys[0]!.from + (keys[0]!.to - keys[0]!.from) * 0.5, keys[1]!.to]
    const script = makeScript(makeLayout())
    for (const r of script.reactions) {
      expect(r.at).toBeGreaterThan(0)
      expect(r.at).toBeLessThan(beats[beats.length - 1]!.to)
      for (const k of times) expect(r.at < k - 0.5 || r.at > k, `${r.name} at ${r.at}`).toBe(true)
    }
    expect(ACT.tap).toBeLessThan(script.tickAt)
    expect(script.tickAt - ACT.tap).toBeLessThan(0.2)
  })

  it('holds the doubt, the look at the answer and the wait before the press for 0.4 s or more', () => {
    const script = makeScript(makeLayout())
    const still = (from: number, to: number): boolean => {
      const a = script.pointer(from)
      for (let t = from; t <= to; t += 0.02) {
        const p = script.pointer(t)
        if (Math.hypot(p.x - a.x, p.y - a.y) > 0.5) return false
      }
      return true
    }
    expect(still(3.05, 3.45)).toBe(true)
    expect(still(4.4, 5.3)).toBe(true)
    expect(still(28.6, 29.5)).toBe(true)
  })

  it('shortens the fill from both ends and never moves its caps apart', () => {
    const full = 1400
    const s: Shape = { id: 'health-fill', part: 'health-bar', kind: 'capsule', x: 0, y: 0, w: full, h: 16, z0: -3, z1: 1.6, tone: 'accent', v: [full] }
    const o = healthBar!.make(s, context([s])) as THREE.Mesh
    const width = (): number => {
      o.geometry.computeBoundingBox()
      return o.geometry.boundingBox!.max.x - o.geometry.boundingBox!.min.x
    }
    expect(width()).toBeCloseTo(full, 1)
    healthBar!.pose!(o, { ...s, w: 700 }, context([s]))
    expect(width()).toBeCloseTo(700, 1)
    healthBar!.pose!(o, { ...s, w: full }, context([s]))
    expect(width()).toBeCloseTo(full, 1)
  })

  it('gives off light from the first dart of a stream and from the newest spark', () => {
    const lights: Emitter[] = []
    const dart: Shape = { id: 'dart-1', part: 'boss-weapons', kind: 'capsule', x: 100, y: 100, w: 34, h: 12, z0: 30, z1: 34, tone: 'light', rot: 0.3, v: [1] }
    const spark: Shape = { id: 'spark-1', part: 'boss-weapons', kind: 'disc', x: 100, y: 100, w: 80, h: 80, z0: 72, z1: 76, tone: 'light', v: [0.1, 1] }
    for (const s of [dart, spark]) {
      const ctx = context([s], 1, lights)
      bossWeapons!.pose!(bossWeapons!.make(s, ctx), s, ctx)
    }
    expect(lights.length).toBe(2)
    for (const e of lights) expect(e.power).toBeGreaterThan(0)
  })

  it('shows the fight of the key: three slabs in the air, darts in a stream, a spark, the health near half', () => {
    const beat = beats.find((b) => b.id === 'boss.slabs')!
    const at = (beat.from + beat.to) / 2
    const frame = frames().find((f) => f.time >= at - 1e-6)!
    const flying = frame.list.filter((s) => /^fired-\d+$/.test(s.id) && (s.v?.[2] ?? 9) < 9)
    expect(flying.length).toBe(3)
    expect(new Set(flying.map((s) => Math.round(s.y / 60))).size).toBe(3)
    expect(frame.list.filter((s) => s.id.startsWith('dart-')).length).toBeGreaterThanOrEqual(4)
    expect(frame.list.some((s) => s.id.startsWith('spark-'))).toBe(true)
    const fill = frame.list.find((s) => s.id === 'health-fill')!
    const part = fill.w / fill.v![0]!
    expect(part).toBeGreaterThan(0.5)
    expect(part).toBeLessThan(0.62)
  })

  it('presses the checkbox cap down under the click and lets it come back to rest', () => {
    expect(dipAt(-1)).toBe(0)
    expect(dipAt(0.05)).toBeCloseTo(1, 5)
    expect(Math.abs(dipAt(0.49))).toBeLessThan(0.01)
    expect(dipAt(0.6)).toBe(0)
  })

  it('shows the four stages of the sheet whole, with air between them and to the edges', () => {
    const sheet = pages.step4!().sheet!('boss-stages')!
    const centre = [0, 1, 2, 3].map((n) => {
      const cap = sheet.list.find((s) => s.id === `stage-${n}-cap`)!
      return cap.x + cap.w / 2
    })
    const reach = [[150, 150], [200, 160], [215, 215], [330, 275]] as const
    expect(centre[0]! - reach[0]![0]).toBeGreaterThan(60)
    for (let n = 0; n < 3; n++) expect(centre[n + 1]! - reach[n + 1]![0] - (centre[n]! + reach[n]![1])).toBeGreaterThan(20)
    expect(sheet.width! - (centre[3]! + reach[3]![1])).toBeGreaterThan(60)
    const cap = sheet.list.find((s) => s.id === 'stage-3-cap')!
    expect(cap.y + cap.h / 2 - 240).toBeGreaterThan(60)
    expect(sheet.height! - (cap.y + cap.h / 2 + 240)).toBeGreaterThan(60)
  })

  it('keeps the tail of a fired slab at the mouth until the whole block is out', () => {
    const all = frames()
    const first = all.findIndex((f) => f.list.some((s) => /^fired-\d+$/.test(s.id) && (s.v?.[2] ?? 9) < 9))
    const id = all[first]!.list.find((s) => /^fired-\d+$/.test(s.id))!.id
    const seen: { x: number; y: number; half: number }[] = []
    for (let n = first; n < first + 30; n++) {
      const slab = all[n]!.list.find((s) => s.id === id)
      if (!slab || (slab.v?.[0] ?? 1) >= 1) break
      seen.push({ x: slab.x + slab.w / 2, y: slab.y + slab.h / 2, half: (slab.w / 2) * slab.v![0]! })
    }
    expect(seen.length).toBeGreaterThan(2)
    const a = seen[0]!
    const b = seen[seen.length - 1]!
    const l = Math.hypot(b.x - a.x, b.y - a.y)
    const tails = seen.map((p) => ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l - p.half)
    expect(Math.max(...tails) - Math.min(...tails)).toBeLessThan(2)
  })
})
