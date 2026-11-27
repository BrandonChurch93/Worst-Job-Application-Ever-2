// The order of things on step 2: each event with its time, and each change of the page's stage, in the film or on the live site with a hand that follows the page's hint.
// node pipeline/change002/step2-trace.mjs film|live
import { logic } from '../../tools/lib/logic.mjs'

const mode = process.argv[2] ?? 'film'
const { load, close } = await logic()
const { stepHz, config } = await load('/src/config.ts')
const { pages } = await load('/src/pages/index.ts')
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const follow = { name: 'bot', input: (v) => { const h = v.page.hint(); return h ? { x: h.dodge ? h.dodge.x : h.x, y: h.dodge ? h.dodge.y : h.y, down: h.down, ...(h.key !== undefined ? { key: h.key } : {}) } : { x: 300, y: 900, down: false } } }
const s = mode === 'film' ? new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') }) : new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver: follow, seed: Number(process.argv[3] ?? config.seed) })
let last = ''
let seen = 0
const t = (i) => ((i + 1) / stepHz).toFixed(3)
for (let i = 0; i < 60 * stepHz && s.page.id === 'step2'; i++) {
  s.advance(1)
  const p = s.page.save()
  const f = s.page.fields()
  const now = `field ${p.field} open ${p.open} ${p.phase} dial ${p.dial.phase} slot ${p.slot.phase} [${p.slot.stopped.map((v) => (v >= 0 ? 1 : 0)).join('')}]${p.slot.win ? ' win' : ''} crank ${p.crank.phase} date "${p.birth.typed}" count ${p.count} slide ${p.slide >= 0 ? 1 : 0}`
  for (const e of s.events.slice(seen)) console.log(t(i), 'EVENT', e.name, Math.round(e.x), Math.round(e.y))
  seen = s.events.length
  if (now !== last) console.log(t(i), now, 'level', p.crank.level.toFixed(2), 'fields', f.done.toFixed(2))
  last = now
}
console.log('left the page at', (s.time ?? 0).toFixed?.(3) ?? '', 'page', s.page.id)
await close()
