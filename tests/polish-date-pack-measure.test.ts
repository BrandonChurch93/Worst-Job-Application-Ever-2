import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { TRAY_H } from '../src/pages/step2/layout'
import { liveFlow, MouseDriver, Stage, type Shape } from '../src/stage/stage'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'
import { BODY, DRAWN, heights } from './polish-date-run'

// A measure, no change: the pack's own visitor on step 2 with no browser, one line for every sixtieth of a second a tray is open and its machine is not whole.
describe.skipIf(!process.env.POLISH_DATE_PACK)('polish date: the rows of step 2 under the pack visitor', () => {
  it('writes the table', () => {
    const d = new MouseDriver()
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
    const v = makeVisitor(1, VISITOR, keyBlock(config))
    const full = heights()
    const lines: string[] = []
    const bare: Record<string, number> = {}
    let left = false
    for (let i = 0; i < VISITOR.mostSeconds * 60 && !s.finished && !left; i++) {
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
      if (s.page.id !== 'step2') {
        left = lines.length > 0
        continue
      }
      const st = s.page.save() as { open: number; phase: string; spring: number[]; lift: number }
      if (st.open < 0 || (st.phase === 'ready' && st.lift >= 1)) continue
      const list: Shape[] = []
      s.page.draw(list)
      const tall = Math.max(4, Math.round(TRAY_H * Math.min(1, Math.max(0, st.spring[st.open]!))))
      const share = Math.min(...BODY[st.open]!.map((id) => list.find((x) => x.id === id)).map((shape) => (shape ? (shape.z1 - shape.z0) / full.get(shape.id)! : 0)))
      const empty = tall > TRAY_H / 10 && share <= DRAWN
      if (empty) bare[`row ${st.open + 1} ${st.phase}`] = (bare[`row ${st.open + 1} ${st.phase}`] ?? 0) + 1
      lines.push(`  picture ${i + 1} (${((i + 1) / 60).toFixed(2)} s) row ${st.open + 1} ${st.phase} tray ${tall} px, lift ${st.lift.toFixed(3)}, the lowest part of its machine at ${share.toFixed(3)} of its height${empty ? ', OPEN AND EMPTY' : ''}`)
    }
    fs.writeFileSync(process.env.POLISH_DATE_PACK!, [`pictures of a sixtieth of a second with a tray open by more than a tenth and its machine not drawn: ${JSON.stringify(bare)}`, ...lines].join('\n') + '\n')
    expect(lines.length).toBeGreaterThan(0)
  })
})
