import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { CRANK_HOME, crankInTray } from '../src/pages/step2'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import { visitor } from './polish-date-run'

interface Saved { open: number; phase: string; spring: number[]; lift: number; crank: { b: number; phase: string; w: number; total: number; hit: boolean } }

// A measure, no change: the crank's row from the end of its run to the shut tray, a line for each step.
describe.skipIf(!process.env.POLISH_DATE_CRANK)('polish date: the crank from the end of its run to the shut tray', () => {
  it('writes the table', () => {
    const lines: string[] = [`the arc in which the crank lies inside its tray: ${CRANK_HOME.from.toFixed(4)} to ${CRANK_HOME.to.toFixed(4)} rad`]
    for (const name of ['order 1 2 3', 'order 3 2 1', 'the film']) {
      const s = name === 'the film' ? new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }) : new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: visitor(name === 'order 1 2 3' ? [0, 1, 2] : [2, 1, 0]), seed: config.seed })
      let was = ''
      let wasCrank = ''
      let closing = 0
      const rows: string[] = []
      for (let i = 0; i < 200 * stepHz && s.page.id === 'step2'; i++) {
        s.advance(1)
        if (s.page.id !== 'step2') break
        const st = s.page.save() as Saved
        const key = st.open === 2 ? st.phase : ''
        if (st.crank.phase !== wasCrank) lines.push(`${name}: step ${i + 1} crank ${wasCrank} to ${st.crank.phase}, b ${st.crank.b.toFixed(4)} (turn ${(((st.crank.b % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(4)}), w ${st.crank.w.toFixed(3)}, hit ${st.crank.hit}`)
        wasCrank = st.crank.phase
        if (key !== was) {
          lines.push(`${name}: step ${i + 1} row 3 ${was || 'not open'} to ${key || 'shut'}, lift ${st.lift.toFixed(3)}, spring ${st.spring[2]!.toFixed(4)}`)
          if (key === 'closing') {
            closing = i + 1
            lines.push(`${name}: on the step the lift begins to lower the crank is ${crankInTray(st.crank.b) ? 'inside' : 'NOT inside'} its tray, b ${st.crank.b.toFixed(4)}`)
          }
          if (key === '' && closing) for (const r of rows) lines.push(r.replace('SHUT', String(i + 1)))
        }
        was = key
        if (key === 'closing') rows.push(`  step ${i + 1} (${i + 1 - closing} after the lowering starts, SHUT is the shut step)\tlift ${st.lift.toFixed(3)}\tspring ${st.spring[2]!.toFixed(4)}\tb ${st.crank.b.toFixed(4)}`)
      }
    }
    expect(lines.length).toBeGreaterThan(3)
    fs.writeFileSync(process.env.POLISH_DATE_CRANK!, lines.join('\n') + '\n')
  })
})
