import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { SLOT } from '../src/pages/step1/layout'
import { TUG } from '../src/pages/step1/script'
import { BotDriver } from '../src/stage/bots'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList } from '../src/stage/types'

interface Row { step: number; gag: string; x: number; y: number; lean: number; squash: number; sprout: number; grip: number; strain: number; taken: boolean; arms: boolean; shed: number; arm: number; hx: number; hy: number; px: number; py: number; rot: number; far: number; open: number; slotY: number }

function run(): Row[] {
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: new BotDriver('keen', config.seed) })
  const rows: Row[] = []
  let after = -1
  let wasTaken = false
  while (s.time < 200 && after !== 0) {
    s.advance(1)
    if (s.page.id !== 'step1') continue
    const gag = s.page.gag() ?? ''
    if (gag !== 'step1.resume' && gag !== 'step1.tug' && gag !== 'step1.shredded') continue
    const p = s.cursor.pose()
    const list: DrawList = []
    s.page.draw(list)
    const paper = list.find((x) => x.id === 'resume-paper')
    const jaw = list.find((x) => x.id === 'shredder-jaw-1')
    const sx = p.x + TUG.shoulder.x
    const sy = p.y + TUG.shoulder.y
    const hx = p.hands ? (p.hands[0].x + p.hands[1].x) / 2 : 0
    const hy = p.hands ? (p.hands[0].y + p.hands[1].y) / 2 : 0
    rows.push({
      step: s.step, gag, x: p.x, y: p.y, lean: p.lean, squash: p.squash, sprout: p.sprout, grip: p.grip[0], strain: p.strain, taken: s.cursor.taken, arms: p.arms, shed: p.shed,
      arm: p.hands ? Math.hypot(hx - sx, hy - sy) * Math.min(1.12, Math.max(0, p.sprout)) : 0, hx, hy, px: paper ? paper.x : 0, py: paper ? paper.y : 0, rot: paper?.rot ?? 0,
      far: Math.hypot(sx - SLOT.cx, sy - SLOT.cy), open: jaw?.v?.[0] ?? 0, slotY: jaw ? jaw.y : 0
    })
    if (wasTaken && !s.cursor.taken && gag === 'step1.shredded' && after < 0) after = stepHz
    wasTaken = s.cursor.taken
    if (after > 0) after--
  }
  return rows
}

const f = (n: number, d = 1): string => n.toFixed(d)
const line = (r: Row): string => [r.step, r.gag.slice(6), f(r.px), f(r.py), f(r.rot, 3), f(r.arm), f(r.hx), f(r.hy), f(r.x), f(r.y), f(r.far), f(r.lean, 3), f(r.squash, 3), f(r.sprout, 2), f(r.grip, 2), f(r.strain, 2), r.taken ? 1 : 0, r.arms ? 1 : 0, f(r.shed, 2), f(r.open, 2), f(r.slotY)].join('\t')
const HEAD = 'step\tgag\tpaperX\tpaperY\tpaperRot\tarmLen\thandX\thandY\tarrowX\tarrowY\tshoulderToSlot\tlean\tsquash\tsprout\tgrip\tstrain\ttaken\tarms\tshed\tslotOpen\tslotY'

describe('polish tug: the takeover and the release of step 1 on the live site, step by step', () => {
  const rows = run()
  const bite = rows.findIndex((r) => r.gag === 'step1.tug')
  const shredded = rows.findIndex((r) => r.gag === 'step1.shredded')
  const release = rows.findIndex((r, i) => i > shredded && rows[i - 1]!.taken && !r.taken)

  it('writes the table of the bite and of the release', () => {
    expect(bite).toBeGreaterThan(6)
    expect(release).toBeGreaterThan(shredded)
    if (process.env.POLISH_TUG_TABLE) {
      const coarse = (from: number, to: number): string[] => rows.slice(from, to).filter((_, i) => i % 8 === 0).map(line)
      const out = [HEAD, ...rows.slice(bite - 6, bite + 41).map(line), '', HEAD, ...rows.slice(release - 10, release + 31).map(line), '', 'every 8th step from the bite', HEAD, ...coarse(bite, bite + 400), '', 'every 8th step from the lost grip to the release', HEAD, ...coarse(shredded - 300, release + 160)].join('\n')
      fs.writeFileSync(process.env.POLISH_TUG_TABLE, out + '\n')
      fs.writeFileSync(process.env.POLISH_TUG_TABLE + '.all', [HEAD, ...rows.map(line)].join('\n') + '\n')
    }
  })

  const frame = stepHz / 60
  const grab = rows.findIndex((r, i) => i >= bite && r.rot !== rows[bite]!.rot)
  const taken = rows.findIndex((r, i) => i >= bite && r.taken)

  it('reaches before it grabs: the arms are never whole in one frame of 60, the hands are on the paper within five, and the body leans toward the paper as they go', () => {
    expect(rows[bite + 1]!.arms).toBe(true)
    expect(rows[bite + frame]!.sprout).toBeLessThan(0.4)
    expect(rows[bite + 2 * frame]!.sprout).toBeLessThan(0.75)
    expect(rows[bite + 5 * frame]!.sprout).toBeGreaterThan(0.9)
    const toward = Math.sign(SLOT.cx - rows[bite]!.x)
    const leant = (rows[grab]!.lean - rows[bite]!.lean) * toward
    console.log(`reach: the hands close ${((grab - bite) / stepHz).toFixed(3)} s after the bite; the arms are ${rows[bite + frame]!.sprout.toFixed(2)}, ${rows[bite + 2 * frame]!.sprout.toFixed(2)}, ${rows[bite + 3 * frame]!.sprout.toFixed(2)}, ${rows[bite + 4 * frame]!.sprout.toFixed(2)} of their length after 1, 2, 3, 4 frames; the body leans ${leant.toFixed(3)} rad toward the paper by then`)
    expect((grab - bite) / frame).toBeGreaterThanOrEqual(3)
    expect((grab - bite) / frame).toBeLessThanOrEqual(5)
    expect(leant).toBeGreaterThan(0.05)
    for (let i = bite; i < grab; i++) expect(rows[i]!.rot, `step ${rows[i]!.step}`).toBe(rows[bite]!.rot)
  })

  it('grabs and hauls: the paper swings on the step the hands close and never jumps, and from there the arrow only comes nearer the slot until the arms are short', () => {
    expect(Math.abs(rows[grab + frame]!.rot - rows[grab - 1]!.rot)).toBeGreaterThan(0.1)
    let most = 0
    for (let i = bite + 1; i < bite + stepHz; i++) most = Math.max(most, Math.hypot(rows[i]!.px - rows[i - 1]!.px, rows[i]!.py - rows[i - 1]!.py))
    let worst = 0
    let least = rows[grab]!.far
    const until = grab + Math.round(stepHz * 0.3)
    for (let i = grab; i <= until; i++) {
      worst = Math.max(worst, rows[i]!.far - least)
      least = Math.min(least, rows[i]!.far)
    }
    console.log(`grab and haul: the paper moves ${most.toFixed(2)} px a step at most in the second after the bite; in the 0.3 s after the hands close the arrow comes ${(rows[grab]!.far - rows[until]!.far).toFixed(1)} px nearer the slot and never falls back more than ${worst.toFixed(2)} px; the arms are ${rows[grab]!.arm.toFixed(1)} px at the grab and ${rows[until]!.arm.toFixed(1)} px after`)
    expect(most).toBeLessThan(12)
    expect(worst).toBeLessThan(3)
    expect(rows[until]!.far).toBeLessThan(rows[grab]!.far)
    expect(rows[until]!.arm).toBeLessThanOrEqual(rows[grab]!.arm)
    const back = Math.sign(SLOT.cx - rows[bite]!.x)
    const pulled = rows.slice(grab, grab + stepHz).reduce((m, r) => Math.min(m, r.lean * back), Infinity)
    console.log(`haul: the body leans ${(-pulled).toFixed(3)} rad back from the paper at the most in the second after the grab`)
    expect(pulled).toBeLessThan(0)
  })

  it('sheds the arms over frames and gives the arrow back still, eased, and inside the time the page may hold it', () => {
    const shedding = rows.filter((r, i) => i > taken && i < shredded && r.shed > 0 && r.shed < 1).length
    const held = (release - taken) / stepHz
    let still = 0
    for (let i = release - 1; i > shredded && Math.hypot(rows[i]!.x - rows[i - 1]!.x, rows[i]!.y - rows[i - 1]!.y) < 0.05 && Math.abs(rows[i]!.lean - rows[i - 1]!.lean) < 0.002; i--) still++
    let turn = 0
    let first = 0
    for (let i = release; i + frame < rows.length && i < release + stepHz / 2; i++) turn = Math.max(turn, Math.abs(rows[i + frame]!.lean - rows[i]!.lean))
    for (let i = release; i < release + frame && i + 1 < rows.length; i++) first += Math.hypot(rows[i + 1]!.x - rows[i]!.x, rows[i + 1]!.y - rows[i]!.y)
    console.log(`release: the arms are shed over ${(shedding / stepHz).toFixed(3)} s; the page holds the arrow ${held.toFixed(2)} s of the ${config.live.controlTakenMaxSeconds} s it may; the arrow stands still ${(still / stepHz).toFixed(3)} s before the mouse has it; in the first frame of 60 after it moves ${first.toFixed(2)} px; its lean changes ${((turn * 180) / Math.PI).toFixed(1)} degrees in a frame of 60 at the most in the half second after`)
    expect(shedding / stepHz).toBeGreaterThan(0.2)
    expect(held).toBeLessThan(config.live.controlTakenMaxSeconds)
    expect(still / stepHz).toBeGreaterThanOrEqual(0.2)
    expect(first).toBeLessThan(4)
    expect((turn * 180) / Math.PI).toBeLessThan(12)
  })
})

describe('polish tug: a key struck by a bolt', () => {
  it('springs back to its full height with a small overshoot within 0.15 s of the hit', () => {
    const tops: Map<string, number>[] = []
    const hits: number[] = []
    const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    let seen = 0
    while (s.time < 12) {
      s.advance(1)
      const list: DrawList = []
      s.page.draw(list)
      const now = new Map<string, number>()
      for (const x of list) if (x.id.startsWith('key-') && !x.id.endsWith('-legend') && x.tone !== 'pocket') now.set(x.id, x.z1)
      if (s.events.slice(seen).some((e) => e.name === 'sizzle')) hits.push(tops.length)
      seen = s.events.length
      tops.push(now)
    }
    const within = Math.round(stepHz * 0.15)
    let checked = 0
    for (const h of hits) {
      if (h < 2 || h + stepHz / 2 >= tops.length) continue
      const rest = tops[h + stepHz / 2 - 1]!
      let key = ''
      let deep = 0
      for (const [id, z] of tops[h + 4]!) {
        const full = rest.get(id)
        if (full !== undefined && full - z > deep) {
          deep = full - z
          key = id
        }
      }
      if (!key || deep < 1) continue
      const full = rest.get(key)!
      const at = (i: number): number => tops[h + i]!.get(key) ?? full - deep
      let back = -1
      let high = -Infinity
      for (let i = 0; i < stepHz / 2; i++) {
        if (back < 0 && at(i) >= full && i > 4) back = i
        high = Math.max(high, at(i))
      }
      console.log(`struck key ${key}: ${deep.toFixed(2)} down on the hit, back at its full height ${(back / stepHz).toFixed(3)} s after it, ${(high - full).toFixed(2)} above it at the most, ${(at(Math.round(stepHz * 0.25)) - full).toFixed(2)} from it at 0.25 s`)
      expect(back).toBeGreaterThan(0)
      expect(back).toBeLessThanOrEqual(within)
      expect(high - full).toBeGreaterThan(0.5)
      expect(high - full).toBeLessThan(8)
      expect(Math.abs(at(Math.round(stepHz * 0.25)) - full)).toBeLessThan(0.05)
      checked++
    }
    console.log(`struck keys read: ${checked} of ${hits.length} hits on the arrow`)
    expect(checked).toBeGreaterThan(0)
  })
})
