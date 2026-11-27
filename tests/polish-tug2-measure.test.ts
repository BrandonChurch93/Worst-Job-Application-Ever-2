import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HEAD, line, visit } from './polish-tug2-run'

describe.skipIf(!process.env.POLISH_TUG2_TABLE)('polish tug 2: the table of step 1 on the live site, a row for each frame of 60', () => {
  for (const who of ['visitor', 'keen'] as const) {
    it(`writes the table of the ${who}`, () => {
      const rows = visit(who)
      expect(rows.length).toBeGreaterThan(600)
      fs.writeFileSync(`${process.env.POLISH_TUG2_TABLE}-${who}.tsv`, [HEAD, ...rows.map((r, n) => line(r, rows[n - 1]))].join('\n') + '\n')
    })
  }
})
