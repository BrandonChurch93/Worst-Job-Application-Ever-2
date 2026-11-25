import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { hitTileHeight } from '../tools/lib/pack-look.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))

describe('the hit sheet of a look pack', () => {
  it('fits the long edge with its heading and a time under every tile', () => {
    const edge = cfg.critics.maxImageLongEdgePx
    const count = cfg.critics.contactSheetFrames
    const rows = Math.ceil(count / 3)
    const tile = hitTileHeight(edge, count)
    const headAndGap = 62
    const label = 22
    expect(headAndGap + rows * (tile + label) + 8 * (rows - 1)).toBeLessThanOrEqual(edge)
    expect(tile).toBeGreaterThanOrEqual(240)
    expect(tile % 2).toBe(0)
  })

  it('keeps the full tile when few frames are shown', () => {
    expect(hitTileHeight(1400, 6)).toBe(320)
  })
})
