// node pipeline/phase5/pack-frames-key.mjs RUN.json DIR: on the whole pictures of the key press kept in DIR at 2 px to a px of the preview (as the pack's cache names them),
// the place of the pressed key's left edge in px of the 1920 wide page, frame by frame, read along one row from the gap left of the key to beside the pointer.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { COL, KEYS, momentsOf } from '../../tools/lib/pack-site.mjs'

// The row read lies this many px under the pointer, on the key's face and under the arrow's smoke.
const UNDER = 21
// The reading ends this many px left of the pointer, clear of the arrow, and begins this many px left of that, on the key before.
const START = 20
const REACH = 60
// The edge is where the light of the key's face (mean of red, green and blue, 0 to 255) falls through this value into the gap between keys.
const EDGE = 175
// Darker than this is the gap between two keys.
const GAP = 130

const [file, dir] = process.argv.slice(2)
const cfg = JSON.parse(fs.readFileSync(new URL('../../config/showcase.json', import.meta.url), 'utf8'))
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(file, 'utf8')))
const t = run.moments.type
const names = fs.readdirSync(dir)
const x0 = Math.round(run.rows[t.press][COL.pointerX]) - START
const y = Math.round(run.rows[t.press][COL.pointerY]) + UNDER
const seen = []
for (let i = t.press - KEYS.before; i <= t.release + KEYS.after; i++) {
  const name = names.find((n) => n.includes(`-x2-${String(i).padStart(6, '0')}-`) && n.endsWith('.png'))
  if (!name) {
    console.log(`step ${i}: no picture`)
    continue
  }
  const m = await sharp(path.join(dir, name)).metadata()
  const k = m.width / 1920
  const { data, info } = await sharp(path.join(dir, name)).extract({ left: Math.round((x0 - REACH) * k), top: Math.round(y * k), width: Math.round(REACH * k), height: 1 }).raw().toBuffer({ resolveWithObject: true })
  const v = (j) => (data[j * info.channels] + data[j * info.channels + 1] + data[j * info.channels + 2]) / 3
  let edge = null
  let gap = false
  for (let j = 1; j < info.width; j++) {
    if (v(j - 1) < GAP) gap = true
    if (gap && v(j) >= EDGE && v(j - 1) < EDGE) {
      edge = (x0 - REACH) + (j - 1 + (EDGE - v(j - 1)) / (v(j) - v(j - 1))) / k
      break
    }
  }
  seen.push({ i, edge })
  console.log(`step ${i} (${(i / 60).toFixed(2)} s)${i > t.press && i <= t.release ? ' down' : ''}: left edge of the pressed key at x ${edge === null ? 'not found' : edge.toFixed(1)}`)
}
const rest = seen[0] && seen[0].edge
const after = seen.filter((s) => s.i > t.release && s.edge !== null)
if (rest !== null && rest !== undefined && after.length) {
  const least = Math.min(...after.map((s) => s.edge))
  console.log(`before the press the edge is at x ${rest.toFixed(1)}; after the release it goes as far as x ${least.toFixed(1)} (${(rest - least).toFixed(1)} px past its place before the press) and is at x ${after[after.length - 1].edge.toFixed(1)} in the last frame`)
}
