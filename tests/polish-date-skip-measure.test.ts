import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import { crankInTray } from '../src/pages/step2'
import { Stage, type Shape } from '../src/stage/stage'
import { leaver, LEAVER } from './polish-date-run'

interface Saved { open: number; phase: string; spring: number[]; lift: number; crank: { b: number; phase: string; w: number } }

// A measure, no change: where the crank's arm stands on each step of its own run, and what a Skip pressed in the run leaves standing.
describe.skipIf(!process.env.POLISH_DATE_SKIP)('polish date: Skip pressed while the crank runs', () => {
  it('writes the table', () => {
    const lines: string[] = []
    const run = (skipAt: number) => {
      const s = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: leaver(skipAt), seed: config.seed })
      const rows: { step: number; st: Saved }[] = []
      for (let i = 0; i < 40 * 240 && s.page.id === 'step2'; i++) {
        s.advance(1)
        if (s.page.id !== 'step2') break
        rows.push({ step: i + 1, st: JSON.parse(JSON.stringify(s.page.save())) as Saved })
      }
      return rows
    }
    const plain = run(0)
    let was = ''
    for (const r of plain) {
      const key = `${r.st.open} ${r.st.phase} ${r.st.crank.phase}`
      if (key !== was) lines.push(`no skip: page step ${r.step} (${((r.step - LEAVER.at) / 4).toFixed(2)} sixtieths from the press): row ${r.st.open + 1} ${r.st.phase}, crank ${r.st.crank.phase}, b ${r.st.crank.b.toFixed(3)}, w ${r.st.crank.w.toFixed(2)}`)
      was = key
    }
    const out = plain.filter((r) => r.st.open === 2 && r.st.phase === 'ready' && r.st.crank.phase !== 'rest' && !crankInTray(r.st.crank.b))
    lines.push(`no skip: steps of the run on which the crank is not inside its tray: ${out.length}, from page step ${out[0]?.step} to ${out.at(-1)?.step}`)
    for (const r of plain.filter((x) => x.st.open === 2 && x.st.phase === 'ready' && x.st.crank.phase !== 'rest' && x.step % 4 === 0)) lines.push(`  ${((r.step - LEAVER.at) / 4).toFixed(0)} sixtieths from the press\t${r.st.crank.phase}\tb ${r.st.crank.b.toFixed(3)}\tturn ${(((r.st.crank.b % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3)}\tw ${r.st.crank.w.toFixed(2)}\t${crankInTray(r.st.crank.b) ? 'inside' : 'OUT'}`)
    {
      const s2 = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: leaver(0), seed: config.seed })
      let said = false
      let from = 0
      for (let i = 0; i < 40 * 240 && s2.page.id === 'step2'; i++) {
        s2.advance(1)
        if (s2.page.id !== 'step2') break
        const st = s2.page.save() as Saved
        if (st.open !== 2 || st.phase !== 'closing') continue
        if (!from) from = i + 1
        const list: Shape[] = []
        s2.page.draw(list)
        const tray = list.find((x) => x.id === 'volume-tray')
        const parts = list.filter((x) => ['crank-base', 'crank-hub', 'crank-arm', 'crank-grip'].includes(x.id))
        if (!tray || parts.length === 0) continue
        const edge = tray.y + tray.h
        const low = Math.max(...parts.map((x) => x.y + x.h))
        const top = Math.max(...parts.map((x) => x.z1))
        if ((i + 1 - from) % 4 === 0 || (!said && edge <= low)) lines.push(`no skip: lowering step ${i + 1 - from}: lift ${st.lift.toFixed(3)}, the tray's lower edge at y ${edge.toFixed(1)}, the crank's lowest edge at y ${low.toFixed(1)}, its highest point at z ${top.toFixed(2)} (the page is 0)${!said && edge <= low ? ' FIRST STEP THE EDGE IS OVER THE CRANK' : ''}`)
        if (edge <= low) said = true
      }
    }
    const at = Number(process.env.POLISH_DATE_SKIP_AT ?? 0)
    if (at > 0) {
      const skipped = run(at)
      was = ''
      for (const r of skipped.filter((x) => x.step >= at - 1)) {
        const key = `${r.st.open} ${r.st.phase}`
        if (key !== was || (r.st.open === 2 && r.step % 4 === 0)) lines.push(`skip at ${at}: page step ${r.step} (+${r.step - at}): row ${r.st.open + 1} ${r.st.phase}, lift ${r.st.lift.toFixed(3)}, spring ${r.st.spring[2]!.toFixed(4)}, b ${r.st.crank.b.toFixed(3)}, ${crankInTray(r.st.crank.b) ? 'inside' : 'OUT of'} the tray`)
        was = key
      }
      lines.push(`skip at ${at}: the page is left on page step ${skipped.at(-1)!.step + 1}`)
    }
    const every = Number(process.env.POLISH_DATE_SKIP_EVERY ?? 0)
    if (every > 0) {
      const first = plain.find((r) => r.st.open === 2 && r.st.crank.phase === 'runaway')!.step
      const last = plain.find((r) => r.st.open === 2 && r.st.phase === 'ending')!.step
      let worst = 0
      for (let k = first; k < last; k += every) {
        const st2 = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: leaver(k), seed: config.seed })
        let closing = 0
        let left = 0
        let inside = true
        for (let i = 0; i < 40 * 240 && st2.page.id === 'step2'; i++) {
          st2.advance(1)
          if (st2.page.id !== 'step2') { left = i + 1; break }
          const st = st2.page.save() as Saved
          if (!closing && st.open === 2 && st.phase === 'closing') {
            closing = i + 1
            inside = crankInTray(st.crank.b)
          }
        }
        worst = Math.max(worst, closing - k)
        lines.push(`skip on page step ${k}: closing on ${closing} (+${closing - k}), the arm ${inside ? 'inside' : 'OUT of'} the tray, the page left on ${left} (+${left - k})`)
      }
      lines.push(`skip on every ${every}th step of the run from ${first} to ${last}: the lowering begins at most ${worst} steps after the Skip`)
    }
    expect(lines.length).toBeGreaterThan(1)
    fs.writeFileSync(process.env.POLISH_DATE_SKIP!, lines.join('\n') + '\n')
  })
})
