import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { copy } from '../src/copy'
import { pages } from '../src/pages'
import { SCREEN_H } from '../src/shell/parts'
import { liveFlow, MouseDriver, Stage, type Shape } from '../src/stage/stage'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'

interface Slab { m: number; x: number; y: number; state: number; t: number }

// A measure, no change: the pack's own visitor through the whole site with no browser, and every error slab of step 4 whose plate is cut by an edge of the screen, one line for each sixtieth of a second.
describe.skipIf(!process.env.POLISH_DATE_BOSS)('polish date: the slabs of step 4 at the screen edge under the pack visitor', () => {
  it('writes the table', () => {
    const d = new MouseDriver()
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
    const v = makeVisitor(1, VISITOR, keyBlock(config))
    const lines: string[] = []
    const cut = new Map<string, { m: number; from: number; fly: number; lie: number; sink: number; restY: number; restX: number; low: number }>()
    let born = 0
    const live = new Map<number, number>()
    for (let i = 0; i < VISITOR.mostSeconds * 60 && !s.finished; i++) {
      const pose = s.cursor.pose()
      const t = { time: s.time, page: s.page.id, gags: s.gagsReached, finished: s.finished, turning: s.turning, scroll: s.page.scroll(), hint: s.page.hint(), hero: { x: pose.x, y: pose.y }, hits: s.events.filter((e) => e.hitsCursor).map((e) => ({ name: e.name, page: e.page, x: e.x, y: e.y })) }
      for (const a of v.act(t) as Record<string, unknown>[]) {
        if (a.move) Object.assign(d.pointer, { x: (a.move as number[])[0]!, y: (a.move as number[])[1]! })
        if (a.down) d.pointer.down = true
        if (a.up) d.pointer.down = false
        if (a.wheel) d.pulse({ wheel: a.wheel as number })
        if (a.press) d.pulse({ key: a.press === 'Space' ? ' ' : (a.press as string) })
      }
      s.advance(stepHz / 60)
      const fight = (s.page.save() as { fight?: { slabs: Slab[] } | null }).fight
      if (!fight) continue
      const list: Shape[] = []
      s.page.draw(list)
      const seen = new Set<number>()
      for (const slab of fight.slabs) {
        seen.add(slab.m)
        if (!live.has(slab.m)) live.set(slab.m, born++)
        const shape = list.find((x) => x.id === `fired-${slab.m}`)
        if (!shape) continue
        const rot = shape.rot ?? 0
        const half = Math.abs((shape.w / 2) * Math.sin(rot)) + Math.abs((shape.h / 2) * Math.cos(rot))
        const wide = Math.abs((shape.w / 2) * Math.cos(rot)) + Math.abs((shape.h / 2) * Math.sin(rot))
        const cy = shape.y + shape.h / 2
        const cx = shape.x + shape.w / 2
        const low = cy + half - SCREEN_H
        const out = low > 0 || cx - wide < 0 || cx + wide > 1920 || cy - half < 0
        if (!out) continue
        const key = `${live.get(slab.m)}`
        const c = cut.get(key) ?? { m: slab.m, from: i + 1, fly: 0, lie: 0, sink: 0, restY: 0, restX: 0, low: 0 }
        if (slab.state === 0) c.fly++
        else if (slab.state === 1) {
          c.lie++
          c.restX = cx
          c.restY = cy
        } else c.sink++
        c.low = Math.max(c.low, low)
        cut.set(key, c)
        lines.push(`  tick ${i + 1} (${((i + 1) / 60).toFixed(2)} s) slab ${slab.m} "${copy.step4.errorSlabs[slab.m]}" state ${slab.state} centre ${cx.toFixed(1)}, ${cy.toFixed(1)} plate ${shape.w.toFixed(0)} by ${shape.h.toFixed(0)} turned ${rot.toFixed(3)} under the lower edge by ${low.toFixed(1)} px, z ${shape.z0.toFixed(1)}`)
      }
      for (const m of [...live.keys()]) if (!seen.has(m)) live.delete(m)
    }
    const head = [...cut.values()].map((c) => `slab "${copy.step4.errorSlabs[c.m]}" from tick ${c.from} (${(c.from / 60).toFixed(2)} s of the visit): cut by an edge on ${c.fly} pictures in flight, ${c.lie} lying, ${c.sink} sinking; it lies at ${c.restX.toFixed(0)}, ${c.restY.toFixed(0)}; at most ${c.low.toFixed(1)} px under the lower edge`)
    fs.writeFileSync(process.env.POLISH_DATE_BOSS!, [`the visit ends at ${s.time.toFixed(2)} s`, ...head, ...lines].join('\n') + '\n')
    expect(s.finished).toBe(true)
  })
})
