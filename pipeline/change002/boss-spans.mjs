// node pipeline/change002/boss-spans.mjs
// Four visitors from the boss's fall to the page turn on the live site: the longest time the hand is not obeyed as the stage counts it (with the hook PageLogic.led), the longest time the page holds the arrow, and the seconds of the marks counted from the fall.
import { logic } from '../../tools/lib/logic.mjs'
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { pages } = await load('/src/pages/index.ts')
const { stepHz, config } = await load('/src/config.ts')
function run(name, after) {
  const d = new BotDriver('keen', config.seed)
  let fell = false
  let held = null
  const drv = { name: 'bot', input(v) {
    if (!fell) return d.input(v)
    held ??= { x: v.cursor.x, y: v.cursor.y }
    return after(v, held, d)
  } }
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step4' }, { page: 'step5' }], pages, driver: drv, seed: config.seed })
  let taken = 0, most = 0, noPlace = 0, mostNoPlace = 0
  while (stage.page.id === 'step4' && stage.time < 400) {
    stage.advance(1)
    if (!fell && stage.events.some((e) => e.name === 'boss-fall')) fell = true
    if (stage.cursor.taken) { taken++; most = Math.max(most, taken) } else taken = 0
  }
  const at = (n) => { const e = stage.events.find((x) => x.name === n); return e ? e.step / stepHz : NaN }
  const f = at('boss-fall')
  console.log(name.padEnd(28), 'hook', stage.longestIgnored.pointer.toFixed(2), 'no hook (arrow held by the page)', (most / stepHz).toFixed(2), '| from fall: arms', (at('finish-arms') - f).toFixed(2), 'fire', (at('finish-fire') - f).toFixed(2), 'gone', (at('boss-gone') - f).toFixed(2), 'kneel', (at('finish-kneel') - f).toFixed(2), 'press', (at('finish-press') - f).toFixed(2), 'left', (stage.time - f).toFixed(2))
}
run('keen bot all the way', (v, h, d) => d.input(v))
run('nobody after the fall', (v, h) => ({ x: h.x, y: h.y, down: false }))
run('holds the button, stays', (v, h) => ({ x: h.x, y: h.y, down: true }))
run('clicks four times a second', (v, h) => ({ x: h.x, y: h.y, down: Math.floor(v.time * 8) % 2 === 0 }))
await close()
