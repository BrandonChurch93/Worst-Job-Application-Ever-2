// One number for the whole film of the pinball page as the stage saves it, every film frame, with the windows' count left out: equal on two trees when the machine and the page stepped the same. No browser.
// node pipeline/phase5/polish-lamps-state.mjs
import crypto from 'node:crypto'
import { logic } from '../../tools/lib/logic.mjs'

const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const P = await load('/src/table/physics.ts')
await P.prepare()
const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
const h = crypto.createHash('sha256')
let counted = 0
for (let f = 0; f < 2520; f++) {
  s.seek(f / 60)
  const saved = s.save()
  const { over, ...rest } = saved.page.s
  if (over) counted++
  h.update(JSON.stringify({ ...saved, page: { ...saved.page, s: rest } }))
}
console.log(`film frames 4020 to 6539, saved state without the count: sha256 ${h.digest('hex').slice(0, 16)}; frames whose state holds a count: ${counted}`)
await close()
