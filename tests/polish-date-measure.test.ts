import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { bare, heights, openings, still, visit, visitor } from './polish-date-run'

describe.skipIf(!process.env.POLISH_DATE_TABLE)('polish date: the table of each row as its tray opens, a line for each step of 60', () => {
  it('writes the table', () => {
    const full = heights()
    const lines: string[] = []
    for (const [name, driver] of [['order 1 2 3', visitor([0, 1, 2])], ['order 3 2 1', visitor([2, 1, 0])], ['by itself', still()], ['the film', 'film']] as const) {
      const rows = visit(driver, full)
      lines.push(`# ${name}: ${rows.length} steps on the page`)
      lines.push(`steps with a tray open by more than a tenth and a part of its machine not drawn: ${JSON.stringify(bare(rows, 0.1))}`)
      for (const o of openings(rows, 0.1)) {
        lines.push(`row ${o.row + 1}: opens at step ${o.from}, past a tenth at ${o.sliver}, tray full at ${o.full}, machine first drawn at ${o.first}, whole at ${o.whole}, ready at ${o.ready}; open by more than a tenth with a part not drawn on ${o.empty} steps (${(o.empty / stepHz).toFixed(3)} s), ${o.emptyFrom} to ${o.emptyTo}`)
        for (const r of rows.filter((x) => x.step >= o.from - 1 && x.step <= o.ready + 1)) lines.push(`  ${r.step}\t${r.phase}\tspring ${r.spring.toFixed(4)}\ttall ${r.tall}\tlift ${r.lift.toFixed(3)}\tleast ${r.least.toFixed(3)}\tmost ${r.most.toFixed(3)}\ttop ${r.top.toFixed(2)}\tlegends ${r.legends}`)
      }
    }
    expect(lines.length).toBeGreaterThan(9)
    fs.writeFileSync(process.env.POLISH_DATE_TABLE!, lines.join('\n') + '\n')
  })
})
