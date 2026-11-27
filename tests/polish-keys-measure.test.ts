import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HEAD, line, visit } from './polish-keys-run'

describe.skipIf(!process.env.POLISH_KEYS_TABLE)('polish keys: the table of the visitor on step 1, a row for each frame of 60', () => {
  it('writes the table', () => {
    const rows = visit()
    expect(rows.length).toBeGreaterThan(600)
    fs.writeFileSync(process.env.POLISH_KEYS_TABLE!, [HEAD, ...rows.map(line)].join('\n') + '\n')
  })
})
