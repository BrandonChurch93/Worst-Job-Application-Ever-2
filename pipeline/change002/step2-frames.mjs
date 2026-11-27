// Film frames of step 2 in a row, each cut to the stage, with what the page holds on that frame written under it.
// node pipeline/change002/step2-frames.mjs --live [--bot keen] --at 7.4 --count 18 [--every 1]   the same of the live site with a bot as the visitor
// node pipeline/change002/step2-frames.mjs --at 16.2 --count 24 [--every 1] [--show crank|reels|fling|fields] [--cut x,y,w,h as shares of the picture] [--columns 6] [--name crank]
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config } from '../../tools/lib/paths.mjs'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'
import { composeSheet } from '../../tools/lib/film-sheet.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const cfg = config()
const plan = filmPlan(cfg)
const unit = plan.units.find((u) => u.id === 'step2')
const fps = plan.fps
const count = Number(a.count ?? 24)
const every = Number(a.every ?? 1)
const show = String(a.show ?? 'crank')
const cut = String(a.cut ?? '0.29,0.37,0.42,0.43').split(',').map(Number)
const first = unit.first + Math.round(Number(a.at ?? 16.2) * fps)
const frames = Array.from({ length: count }, (_, i) => first + i * every)

if (a.live) {
  const bot = String(a.bot ?? 'keen')
  const seed = Number(a.seed ?? cfg.seed)
  const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'web', mode: 'live', query: `&bot=${bot}&seed=${seed}&clock=steps&step=2` })
  const tiles = []
  try {
    let shot = await session.page.evaluate((dt) => window.liveRun.advance(dt, true), Number(a.at ?? 7.4))
    for (let i = 0; i < count; i++) {
      shot = await session.page.evaluate((dt) => window.liveRun.advance(dt), i === 0 ? 0 : every / fps)
      const png = Buffer.from(shot.png.split(',')[1], 'base64')
      const m = await sharp(png).metadata()
      const box = { left: Math.round(cut[0] * m.width), top: Math.round(cut[1] * m.height), width: Math.round(cut[2] * m.width), height: Math.round(cut[3] * m.height) }
      tiles.push({ png: await sharp(png).extract(box).png().toBuffer(), label: `${shot.time.toFixed(3)} s  ${shot.gag ?? shot.page}` })
    }
  } finally {
    await session.close()
  }
  const file = at('out', 'work', 'sheets', `step2-${String(a.name ?? 'live')}.jpg`)
  const g = await composeSheet(tiles, file, { edge: Number(a.edge ?? 1200), heading: `Step 2 on the live site, the bot ${bot} as the visitor, seed ${seed}: ${count} pictures ${every} sixtieth${every > 1 ? 's' : ''} of a second apart. Under each: the site's time and the gag`, columns: Number(a.columns ?? 6) })
  console.log(`wrote ${path.relative(at(), file)} ${g.width} by ${g.height}, ${tiles.length} pictures`)
  process.exit(0)
}

const { load, close } = await logic()
const { stepHz } = await load('/src/config.ts')
const { pages } = await load('/src/pages/index.ts')
const { DIAL } = await load('/src/pages/step2/layout.ts')
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const stage = new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
let done = 0
const deg = (r) => Math.round((((r * 180) / Math.PI) % 360 + 360) % 360)
const labels = []
for (const frame of frames) {
  const to = Math.round(((frame - unit.first) / fps) * stepHz)
  if (to > done) {
    stage.advance(to - done)
    done = to
  }
  const st = stage.page.save()
  const t = ((frame - unit.first) / fps).toFixed(3)
  if (show === 'crank') labels.push(`${t}s ${deg(st.crank.b)}deg ${(st.crank.level * 100).toFixed(1)}%`)
  else if (show === 'reels') labels.push(`${t}s ${st.slot.phase} ${st.slot.stopped.map((x) => (x >= 0 ? 1 : 0)).join('')}`)
  else if (show === 'fling') {
    const p = stage.cursor.pose()
    labels.push(`${t} s  ${st.dial.phase}  ${Math.round(p.x - DIAL.cx)}, ${Math.round(p.y - DIAL.cy)}, z ${Math.round(p.z)}`)
  } else labels.push(`${t} s  field ${st.field + 1}  done ${stage.page.fields().done.toFixed(2)} of 3`)
}
await close()

const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
const tiles = []
try {
  for (let i = 0; i < frames.length; i++) {
    await session.page.evaluate(async ([n, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(n, t)
    }, [frames[i], String(a.tier ?? 'draft')])
    const png = await readCanvas(session.page)
    const m = await sharp(png).metadata()
    const box = { left: Math.round(cut[0] * m.width), top: Math.round(cut[1] * m.height), width: Math.round(cut[2] * m.width), height: Math.round(cut[3] * m.height) }
    tiles.push({ png: await sharp(png).extract(box).png().toBuffer(), label: labels[i] })
  }
} finally {
  await session.close()
}
const file = at('out', 'work', 'sheets', `step2-${String(a.name ?? show)}.jpg`)
const g = await composeSheet(tiles, file, { edge: Number(a.edge ?? 1200), heading: `Step 2 in the film, frames ${frames[0]} to ${frames[frames.length - 1]}${every > 1 ? `, every ${every}` : ', every frame'} at ${fps} a second. Under each: page time, ${show === 'crank' ? "the crank's angle in degrees, the level in percent" : show}`, columns: Number(a.columns ?? 6) })
console.log(`wrote ${path.relative(at(), file)} ${g.width} by ${g.height}, ${tiles.length} frames`)
process.exit(0)
