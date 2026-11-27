// node pipeline/phase5/polish-turn2-measure.mjs START FILE [FILE ...]: reads pictures of 1920 by 1080 of the careers page leaving, one for each frame of 60 in a row,
// the first of them START frames from the turn's first step (so -4 for four frames before it), and prints for each:
// the angle the code gives (leaveTurn), the angle read from the dark gap under the page's foot or over its head, the mean of a plain patch of the face,
// the height in px of the slab's lit side over its upper edge, and the shadow the right card throws to its right: how many px right of x 1780 (the card's rim lies at 1794 at rest)
// are darker than 0.95 of the bare face beside the page's right edge, and how dark they are as a share of that face.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { build } from 'rolldown'
import { at as inRepo, config } from '../../tools/lib/paths.mjs'

// The plain patch of the careers page, near the axis of the turn so the same piece of page stays under it. The strip of columns the gaps are read down. The rows through the right card's middle and where its right rim stands.
const PATCH = { x0: 840, x1: 1240, y0: 450, y1: 536 }
const STRIP = { x0: 900, x1: 1020 }
const CARD = { from: 1780, y0: 740, y1: 760, clear: 6, ground: 12 }
// The backing behind the slab reads 29 of 255 and the face never under 80 in these frames.
const BACKING = 50
const DEG = Math.PI / 180

const [startArg, ...files] = process.argv.slice(2)
const start = Number(startArg)
const cfg = config()
const k = Math.tan((cfg.cameras.home.fovDeg * DEG) / 2)
// The angle is the code's own: src/stage/turn.ts imports nothing, so it is made into a module as it stands and asked.
fs.mkdirSync(inRepo('out/work'), { recursive: true })
await build({ input: inRepo('src/stage/turn.ts'), logLevel: 'silent', output: { file: inRepo('out/work/polish-turn2-turn.mjs'), format: 'esm' } })
const leave = (await import(`${pathToFileURL(inRepo('out/work/polish-turn2-turn.mjs')).href}?${Date.now()}`)).leaveTurn

const angleOf = (gap, sign) => {
  if (gap <= 0) return 0
  let lo = 0
  let hi = 80 * DEG
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const edge = (540 * Math.cos(mid)) / (1 + k * Math.sin(mid))
    if (540 - edge < gap) lo = mid
    else hi = mid
  }
  return (sign * lo) / DEG
}

const lines = []
let rest = null
for (let n = 0; n < files.length; n++) {
  const { data, info } = await sharp(files[n]).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.width !== 1920 || info.height !== 1080) throw new Error(`${files[n]} is ${info.width} by ${info.height}, not 1920 by 1080`)
  const at = (x, y) => {
    const i = (y * info.width + x) * 3
    return (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  const mean = (x0, x1, y0, y1) => {
    let s = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += at(x, y)
    return s / ((x1 - x0) * (y1 - y0))
  }
  const rowMean = (y) => mean(STRIP.x0, STRIP.x1, y, y + 1)
  let foot = 0
  while (foot < 1080 && rowMean(1079 - foot) < BACKING) foot++
  let head = 0
  while (head < 1080 && rowMean(head) < BACKING) head++
  const face = mean(PATCH.x0, PATCH.x1, PATCH.y0, PATCH.y1)
  if (rest === null) rest = face
  // The slab's side over its upper edge: the rows from the first row of the slab that stand 20 or more over the face under them.
  let side = 0
  if (head > 0 && head < 1000) {
    const under = rowMean(Math.min(1079, head + 40))
    while (head + side < 1080 && rowMean(head + side) > under + 20) side++
  }
  const colMean = (x) => mean(x, x + 1, CARD.y0, CARD.y1)
  let edge = 1920
  while (edge > CARD.from && colMean(edge - 1) < BACKING) edge--
  const to = edge - CARD.clear - CARD.ground
  const ground = mean(to, to + CARD.ground, CARD.y0, CARD.y1)
  let reach = 0
  let sum = 0
  for (let x = CARD.from; x < to; x++) {
    if (colMean(x) >= 0.95 * ground) continue
    sum += colMean(x)
    reach++
  }
  const dark = reach ? 1 - sum / reach / ground : 0
  const f = start + n
  const code = f >= 0 ? leave(Math.min(1, f / 30)) / DEG : 0
  const seen = foot > 0 ? angleOf(foot, 1) : head > 0 && side === 0 ? angleOf(head, -1) : 0
  lines.push({ f, code, seen, face, foot, head, side, reach, dark })
}
console.log('frame | angle by the code | its step | angle read from the gap | face 0 to 255 | face less rest | gap at the foot px | gap at the head px | slab side px | shadow reach px | shadow darkness')
let last = 0
for (const l of lines) {
  const step = Number.isNaN(l.code) ? NaN : l.code - last
  if (!Number.isNaN(l.code)) last = l.code
  console.log([l.f, l.code.toFixed(2), step.toFixed(2), l.seen.toFixed(1), l.face.toFixed(1), (l.face - rest).toFixed(1), l.foot, l.head, l.side, l.reach, l.dark.toFixed(2)].join(' | '))
}
