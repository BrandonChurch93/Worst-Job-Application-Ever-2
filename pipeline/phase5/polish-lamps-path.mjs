// The clear ball of the film as the machine holds it, on the film frames named: place, speed and the turn of its roll. No browser.
// node pipeline/phase5/polish-lamps-path.mjs FIRST LAST   film frames, 4020 is the first of the pinball page
import { logic } from '../../tools/lib/logic.mjs'

const [first = '6215', last = '6227'] = process.argv.slice(2)
const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const P = await load('/src/table/physics.ts')
await P.prepare()
const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
const r = (n) => Math.round(n * 1e6) / 1e6
const out = []
for (let f = Number(first); f <= Number(last); f++) {
  s.seek((f - 4020) / 60)
  const { s: page, m } = s.save().page
  const b = m.balls[0]
  out.push([f, r(b.x), r(b.y), r(b.vx), r(b.vy), r(page.roll[0]), r(page.roll[1]), page.over ? Object.entries(page.over).map(([k, v]) => `${k} ${r(v)}`).join(' ') : ''])
}
for (const row of out) console.log(JSON.stringify(row))
await close()
