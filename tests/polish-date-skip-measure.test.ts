import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import { crankInTray } from '../src/pages/step2'
import { FX, rowY } from '../src/pages/step2/layout'
import { Stage, type Driver, type DriverView, type Pointer } from '../src/stage/stage'

interface Saved { open: number; phase: string; spring: number[]; lift: number; crank: { b: number; phase: string; w: number } }

// The step on which the measure's visitor presses the third row, and for how many steps.
const PRESS = { at: 400, steps: 8 }

// A visitor who presses the third row once, leaves the pointer far off and presses Skip on one step (0: never).
function leaver(skipAt: number): Driver {
  return {
    name: 'bot',
    input(v: DriverView): Pointer {
      const out: Pointer = v.pageStep >= PRESS.at - 160 && v.pageStep < PRESS.at + PRESS.steps ? { x: FX + 40, y: rowY(2) + 12, down: v.pageStep >= PRESS.at } : { x: 300, y: 900, down: false }
      if (skipAt > 0 && v.pageStep === skipAt) out.skip = true
      return out
    }
  }
}

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
        rows.push({ step: s.pageStep, st: JSON.parse(JSON.stringify(s.page.save())) as Saved })
      }
      return rows
    }
    const plain = run(0)
    let was = ''
    for (const r of plain) {
      const key = `${r.st.open} ${r.st.phase} ${r.st.crank.phase}`
      if (key !== was) lines.push(`no skip: page step ${r.step} (${((r.step - PRESS.at) / 4).toFixed(2)} sixtieths from the press): row ${r.st.open + 1} ${r.st.phase}, crank ${r.st.crank.phase}, b ${r.st.crank.b.toFixed(3)}, w ${r.st.crank.w.toFixed(2)}`)
      was = key
    }
    const out = plain.filter((r) => r.st.open === 2 && r.st.phase === 'ready' && r.st.crank.phase !== 'rest' && !crankInTray(r.st.crank.b))
    lines.push(`no skip: steps of the run on which the crank is not inside its tray: ${out.length}, from page step ${out[0]?.step} to ${out.at(-1)?.step}`)
    for (const r of plain.filter((x) => x.st.open === 2 && x.st.phase === 'ready' && x.st.crank.phase !== 'rest' && x.step % 4 === 0)) lines.push(`  ${((r.step - PRESS.at) / 4).toFixed(0)} sixtieths from the press\t${r.st.crank.phase}\tb ${r.st.crank.b.toFixed(3)}\tturn ${(((r.st.crank.b % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3)}\tw ${r.st.crank.w.toFixed(2)}\t${crankInTray(r.st.crank.b) ? 'inside' : 'OUT'}`)
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
    expect(lines.length).toBeGreaterThan(1)
    fs.writeFileSync(process.env.POLISH_DATE_SKIP!, lines.join('\n') + '\n')
  })
})
