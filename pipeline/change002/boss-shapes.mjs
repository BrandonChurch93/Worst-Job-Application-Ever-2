// node pipeline/change002/boss-shapes.mjs --at 14.5 [--stage]
// The shapes the film's step 4 draws at one second of the unit, with their part and their box on the page; with --stage, the shapes of the whole screen as the stage gives them.
import { args } from '../../tools/lib/paths.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const at = Number(a.at ?? 14.5)
const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { stepHz } = await load('/src/config.ts')
const stage = new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
stage.advance(Math.round(at * stepHz))
let list = []
if (a.stage && typeof stage.shapes === 'function') list = stage.shapes()
else stage.page.draw(list)
for (const s of list) console.log(`${s.id.padEnd(28)} ${String(s.part).padEnd(14)} ${String(s.kind).padEnd(8)} x ${s.x.toFixed(0).padStart(5)} y ${s.y.toFixed(0).padStart(5)} w ${s.w.toFixed(0).padStart(5)} h ${s.h.toFixed(0).padStart(4)} z ${(s.z0 ?? 0).toFixed(0)}..${(s.z1 ?? 0).toFixed(0)}${s.words ? ` ${s.words}` : ''}`)
await close()
