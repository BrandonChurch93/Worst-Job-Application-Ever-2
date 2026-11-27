// Reads whole pictures, 1920 by 1080 with one px of the page a px, and says for each how bright the rim of the ball is against the glass of a window right beside it, and how bright the floor just outside the window's brass ring is.
// node pipeline/phase5/polish-lamps-rim.mjs walk RUN.json DIR STEP [STEP ...]    pictures step-NNNNNN-x2.png of the pack's walk
// node pipeline/phase5/polish-lamps-rim.mjs film DIR FRAME [FRAME ...]          pictures film-N.png of the film (the camera of the film must look straight down for the places to hold)
// node pipeline/phase5/polish-lamps-rim.mjs still FILE WX WY BX BY K              one picture from straight above (tools/still.mjs with a tier camera): the window's middle and the ball's middle in px of the picture, K px of the picture to a px of the page; the rim reading holds only at K 1
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { logic } from '../../tools/lib/logic.mjs'

const [what, ...rest] = process.argv.slice(2)
const { load, close } = await logic()
const { BALL, table } = await load('/src/table/layout.ts')
const ins = table.inserts.map((n) => ({ id: n.id, x: n.c[0] * BALL, y: n.c[1] * BALL, r: n.r * BALL }))
const jobs = []
if (what === 'walk') {
  const run = JSON.parse(fs.readFileSync(rest[0], 'utf8'))
  for (const st of rest.slice(2).map(Number)) {
    const row = run.rows[st]
    jobs.push({ name: `step ${st}`, file: path.join(rest[1], `step-${String(st).padStart(6, '0')}-x2.png`), bx: row[3], by: row[4] - row[5], scroll: row[5] })
  }
} else if (what === 'still') {
  const [file, wx, wy, bx, by, k] = [rest[0], ...rest.slice(1).map(Number)]
  jobs.push({ name: path.basename(file), file, bx, by, scroll: 0, k, only: { id: 'the window named', x: wx, y: wy, r: ins[0].r * k } })
} else {
  const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
  const { pages } = await load('/src/pages/index.ts')
  const P = await load('/src/table/physics.ts')
  await P.prepare()
  const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  for (const f of rest.slice(1).map(Number)) {
    const frame = s.frameAt((f - 4020) / 60)
    const b = frame.list.find((x) => x.id === 'ball.clear')
    jobs.push({ name: `film ${f}`, file: path.join(rest[0], `film-${f}.png`), bx: b.x + b.w / 2, by: b.y + b.h / 2 - frame.scroll, scroll: frame.scroll })
  }
}
for (const j of jobs) {
  const { data, info } = await sharp(j.file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const lum = (x, y) => {
    const i = (Math.max(0, Math.min(info.height - 1, Math.round(y))) * info.width + Math.max(0, Math.min(info.width - 1, Math.round(x)))) * 3
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  const ring = (cx, cy, a, r0, r1) => {
    let sum = 0
    for (let k = 0; k < 4; k++) sum += lum(cx + (r0 + ((r1 - r0) * k) / 3) * Math.cos(a), cy + (r0 + ((r1 - r0) * k) / 3) * Math.sin(a))
    return sum / 4
  }
  const k = j.k ?? 1
  for (const w of j.only ? [j.only] : ins) {
    const wx = w.x
    const wy = w.y - j.scroll
    const dist = Math.hypot(j.bx - wx, j.by - wy)
    if (dist > w.r + BALL) continue
    let glassAll = 0
    let n0 = 0
    let halo = 0
    let n1 = 0
    for (let i = 0; i < 120; i++) {
      const a = (i * Math.PI) / 60
      for (const q of [20, 35, 50]) {
        const x = wx + q * k * Math.cos(a)
        const y = wy + q * k * Math.sin(a)
        if (Math.hypot(x - j.bx, y - j.by) > (BALL / 2 + 6) * k) { glassAll += lum(x, y); n0++ }
      }
      const x = wx + (w.r + 12 * k) * Math.cos(a)
      const y = wy + (w.r + 12 * k) * Math.sin(a)
      if (Math.hypot(x - j.bx, y - j.by) > (BALL / 2 + 10) * k) { halo += lum(x, y); n1++ }
    }
    const rims = []
    const glass = []
    let darker = 0
    for (let i = 0; i < 120; i++) {
      const a = (i * Math.PI) / 60
      if (Math.hypot(j.bx + 53 * Math.cos(a) - wx, j.by + 53 * Math.sin(a) - wy) > w.r - 8) continue
      const rim = ring(j.bx, j.by, a, 43.5, 47)
      const out = ring(j.bx, j.by, a, 50.5, 55)
      rims.push(rim)
      glass.push(out)
      if (rim < out) darker++
    }
    const mean = (l) => (l.length ? (l.reduce((p, q) => p + q, 0) / l.length).toFixed(0) : 'none')
    console.log(`${j.name} ${w.id}: middle ${dist.toFixed(1)} px off; glass clear of the ball ${n0 ? (glassAll / n0).toFixed(0) : 'none'}; floor 12 px outside the glass ${n1 ? (halo / n1).toFixed(0) : 'none'}; rim ${mean(rims)}, glass beside it ${mean(glass)}; rim darker on ${darker} of ${rims.length} places round${rims.length ? `; brightest rim ${Math.max(...rims).toFixed(0)}, darkest glass beside ${Math.min(...glass).toFixed(0)}` : ''}`)
  }
}
await close()
