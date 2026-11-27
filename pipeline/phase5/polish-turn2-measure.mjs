// node pipeline/phase5/polish-turn2-measure.mjs START FILE [FILE ...]: reads pictures of 1920 by 1080 of the careers page leaving, one for each frame of 60 in a row,
// the first of them START frames from the turn's first step (so -4 for four frames before it), and prints for each:
// the angle the code gives (leaveTurn), the angle read from the dark gap under the page's foot or over its head, the mean of a plain patch of the face,
// the key's share on the face as the code has it, the height in px of the slab's lit side over its upper edge, and the shadow the right card throws to its right:
// how deep it is at its darkest as a share of the bare face beside it, and how many px from the card's rim it is still half as deep.
// Run from a tree of the code before the change it gives that code's angles: the lights then go round by the whole angle.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { build } from 'rolldown'
import { at as inRepo, config } from '../../tools/lib/paths.mjs'

// The plain patch of the careers page, near the axis of the turn so the same piece of page stays under it. The strip of columns the gaps are read down. The rows through the right card's middle and where its right rim stands.
const PATCH = { x0: 840, x1: 1240, y0: 450, y1: 536 }
const STRIP = { x0: 900, x1: 1020 }
const CARD = { through: 1700, y0: 740, y1: 760, clear: 6, ground: 12 }
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
const made = await import(`${pathToFileURL(inRepo('out/work/polish-turn2-turn.mjs')).href}?${Date.now()}`)
const leave = made.leaveTurn
const leaveLight = made.leaveLight

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
  // The right card is greener than the page: its rows are found down the column `CARD.through`, its rim along the rows about its middle, so both follow the card as the page tips.
  const green = (x0, x1, y0, y1) => {
    let s = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += data[(y * info.width + x) * 3 + 1] - data[(y * info.width + x) * 3]
    return s / ((x1 - x0) * (y1 - y0))
  }
  let top = CARD.y0
  while (top > 0 && green(CARD.through, CARD.through + 8, top - 1, top) > 0) top--
  let low = CARD.y1
  while (low < 1079 && green(CARD.through, CARD.through + 8, low, low + 1) > 0) low++
  const mid = Math.round((top + low) / 2)
  const y0 = mid - 10
  const y1 = mid + 10
  const colMean = (x) => mean(x, x + 1, y0, y1)
  let rim = CARD.through
  while (rim < 1919 && green(rim, rim + 1, y0, y1) > 0) rim++
  while (rim < 1919 && colMean(rim) < colMean(rim + 1) - 1) rim++
  let edge = 1920
  while (edge > rim && colMean(edge - 1) < BACKING) edge--
  const to = edge - CARD.clear - CARD.ground
  const ground = mean(to, to + CARD.ground, y0, y1)
  // The shadow the card throws to its right: how deep it is at its darkest, as a share of the bare face, and how far from the rim it is still half as deep.
  let deep = 0
  for (let x = rim; x < to; x++) deep = Math.max(deep, 1 - colMean(x) / ground)
  let reach = 0
  if (deep > 0.03) for (let x = rim; x < to; x++) if (1 - colMean(x) / ground >= deep / 2) reach = x - rim + 1
  const dark = deep
  const f = start + n
  const code = f >= 0 ? leave(Math.min(1, f / 30)) / DEG : 0
  const seen = foot > 0 ? angleOf(foot, 1) : head > 0 && side === 0 ? angleOf(head, -1) : 0
  lines.push({ f, code, seen, face, foot, head, side, reach, dark, rim, mid })
}
// The key's share on the face, of what a flat page takes: the lights go round the slab by `leaveLight` of the angle where the code has it (before the change by the whole angle), and by no more than 8 degrees toward the key.
const KEY = [-0.65, 0.6, 0.36]
const TOWARD = 8 * DEG
const round = (angle) => (angle < 0 ? -TOWARD * Math.tanh(-angle / TOWARD) : leaveLight ? leaveLight(angle) : angle)
const share = (deg) => Math.max(0, KEY[2] * Math.cos(round(deg * DEG)) - KEY[1] * Math.sin(round(deg * DEG))) / KEY[2]
console.log("frame | angle by the code | its step | angle read from the gap | key's share on the face | lights round by, degrees | face 0 to 255 | face less rest | its step | gap at the foot px | gap at the head px | slab side px | card rim x | card middle y | shadow reach px | shadow depth")
let last = 0
let lastFace = null
let most = { step: 0, f: 0 }
for (const l of lines) {
  const step = l.code - last
  last = l.code
  const faceStep = lastFace === null ? 0 : l.face - lastFace
  lastFace = l.face
  if (l.code < 76 && Math.abs(faceStep) > Math.abs(most.step)) most = { step: faceStep, f: l.f }
  console.log([l.f, l.code.toFixed(2), step.toFixed(2), l.seen.toFixed(1), share(l.code).toFixed(3), (round(l.code * DEG) / DEG).toFixed(2), l.face.toFixed(1), (l.face - rest).toFixed(1), faceStep.toFixed(1), l.foot, l.head, l.side, l.rim, l.mid, l.reach, l.dark.toFixed(2)].join(' | '))
}
console.log(`largest step of the face between two frames in a row, while the slab is under 76 degrees: ${most.step.toFixed(1)} into frame ${most.f}`)
