import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { factsOf, hitTileHeight, hitWindow } from '../tools/lib/pack-look.mjs'
import { packPlan } from '../tools/lib/pack-plan.mjs'
import { cursorBox, cursorMiddle } from '../tools/lib/image.mjs'

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

  it('shows a thing that lands in a wider window and a small hit at its real size', () => {
    expect(hitWindow(1, 0, 461, 300, 1920, 1080)).toEqual([461, 300])
    expect(hitWindow(2, 0, 461, 300, 1920, 1080)).toEqual([922, 600])
    expect(hitWindow(8, 0, 461, 300, 1920, 1080)).toEqual([1660, 1080])
  })

  it('takes a ball whole with room round it, however near the camera stands', () => {
    expect(hitWindow(1, 96, 461, 300, 1920, 1080)).toEqual([461, 300])
    const [w, h] = hitWindow(1, 200, 461, 300, 1920, 1080)
    expect(h).toBeGreaterThanOrEqual(200 * 2.4)
    expect(w / h).toBeCloseTo(461 / 300, 2)
    expect(hitWindow(1, 900, 461, 300, 1920, 1080)[1]).toBe(1080)
  })

  it('puts the box of the character round the ball once the arrow is sealed in one', () => {
    const free = { onPage: true, inBall: false, x: 1000, y: 500, screenHeightPx: 70, ballScreenPx: 0, ballX: 0, ballY: 0 }
    const sealed = { ...free, inBall: true, ballScreenPx: 300, ballX: 900, ballY: 420 }
    expect(cursorMiddle(free)[2]).toBe(70)
    expect(cursorMiddle(sealed)).toEqual([900, 420, 300])
    const box = cursorBox(sealed) as number[]
    expect(box[0] + box[2] / 2).toBe(900)
    expect(box[1] + box[3] / 2).toBe(420)
    expect(box[2]).toBeGreaterThanOrEqual(300)
  })

  it('makes one hit of two that fall within a few frames, and keeps the first frame of every event', () => {
    const row = (frame: number, events: { name: string; hitsCursor: boolean }[]) => ({ frame, acting: 'plain', onPage: true, events })
    const rows = [
      row(100, [{ name: 'bumper', hitsCursor: true }]),
      row(102, [{ name: 'bumper', hitsCursor: true }]),
      row(140, [{ name: 'bumper', hitsCursor: true }]),
      row(150, [{ name: 'ball-drop', hitsCursor: false }]),
      row(152, [{ name: 'flipper-save', hitsCursor: false }]),
      row(200, [{ name: 'page-turn', hitsCursor: false }])
    ]
    const facts = factsOf(cfg, { id: 'pinball' }, rows)
    expect(facts.hits).toEqual([{ frame: 100, name: 'hit on the arrow' }, { frame: 140, name: 'hit on the arrow' }, { frame: 150, name: 'ball-drop' }])
    expect(facts.named).toEqual({ bumper: 100, 'ball-drop': 150, 'flipper-save': 152, 'page-turn': 200 })
    expect(facts.turn).toBe(200)
  })

  it('gives the machine its own sheets: the save and the rail in consecutive frames, the way in and the way out', () => {
    const first = 4020
    const facts = { unit: 'pinball', hits: [{ frame: first + 138, name: 'hit on the arrow' }], named: { 'ball-seal': first + 138, 'flipper-save': first + 2131, drain: first + 2253 }, turn: first + 2490, states: [] }
    const plan = packPlan(cfg, { role: 'R4', round: 11, unit: 'pinball', facts })
    const files = plan.sets.flatMap((s: { files: { kind: string; hit?: string; way?: string; at?: number; frames: number[]; heading: string }[] }) => s.files)
    const moments = files.filter((f) => f.kind === 'hit-sheet' && f.hit === 'moment')
    expect(moments.length).toBe(2)
    expect(moments[0].at).toBe(first + 2131)
    for (const m of moments) expect(m.frames.length).toBe(cfg.critics.contactSheetFrames)
    const ways = files.filter((f) => f.way)
    expect(ways.map((w) => w.way)).toEqual(['in', 'out'])
    expect(ways[0].frames[0]).toBe(first + 138)
    expect(ways[1].frames.at(-1)).toBeLessThanOrEqual(first + 2490)
    for (const f of files) expect(f.heading).not.toMatch(/bumper|flipper|rail|doors/i)
  })
})
