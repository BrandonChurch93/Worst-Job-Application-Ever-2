// The play of whole live visits, step for step, as one hash per visit: proof that the view feeds no physics.
// node pipeline/phase5/polish-sight-play.mjs [--visitor never,pack,keen,clumsy,random] [--seeds 1,2,3,4] [--film]
// On every step of the machine (sim.stepHz a second) every ball's mode, rail, hold, place and speed and every event the step reports go into a sha256. Run on two trees, the lines are equal when the ball's path and the machine's events are equal on every step. The view (the page's scroll) is not in the hash. With --film: the film's pinball take instead, the view's place, its floor and the page's scroll on every step as one hash.
import crypto from 'node:crypto'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { Machine } = await load('/src/table/physics.ts')
if (process.argv.includes('--film')) {
  const { filmFlow, filmOptions, ScriptDriver } = await load('/src/stage/stage.ts')
  const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const film = crypto.createHash('sha256')
  const seconds = filmFlow('pinball')[0].closes
  let n = 0
  let lifted = 0
  while (stage.time < seconds) {
    stage.advance(1)
    const s = stage.page.save().s
    if (s.sight !== undefined) lifted++
    film.update(JSON.stringify([s.scroll, s.floor, stage.page.scroll()]))
    n++
  }
  console.log(`film, pinball: ${seconds} s, ${n} steps, ${lifted} of them with the street's lift, sha256 of the view's place, its floor and the page's scroll on every step ${film.digest('hex')}`)
  await close()
  process.exit(0)
}
let hash = null
let steps = 0
let events = 0
const step = Machine.prototype.step
Machine.prototype.step = function (l, r) {
  const e = step.call(this, l, r)
  steps++
  events += e.length
  hash.update(JSON.stringify([this.balls.map((b) => [b.mode, b.rail, b.hold, b.x, b.y, b.z, b.vx, b.vy, b.tier]), e.map((x) => [x.name, x.ball, x.id, x.x, x.y])]))
  return e
}
const HAND = 1500 / 240
const makeDriver = (name, s) => {
  if (name !== 'never' && name !== 'pack') return new BotDriver(name, s)
  if (name === 'never') return { name: 'bot', input: () => ({ x: 300, y: 900, down: false }) }
  const d = { name: 'mouse', x: 960, y: 540, queue: [], left: false, right: false, goal: null }
  d.input = (v) => {
    if ((v.step + s - 1) % 4 === 0) {
      const h = v.turning ? null : v.page.hint()
      d.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
      const seen = d.queue.length > 11 ? d.queue.shift() : null
      if (seen) { d.goal = seen; d.left = seen.left; d.right = seen.right }
    }
    if (d.goal) {
      const dx = d.goal.x - d.x, dy = d.goal.y - d.y, far = Math.hypot(dx, dy)
      if (far <= HAND) { d.x = d.goal.x; d.y = d.goal.y } else { d.x += (dx / far) * HAND; d.y += (dy / far) * HAND }
    }
    return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right }
  }
  return d
}
for (const name of arg('visitor', 'never,pack,keen,clumsy,random').split(',')) for (const seed of arg('seeds', '1,2,3,4').split(',').map(Number)) {
  hash = crypto.createHash('sha256')
  steps = 0
  events = 0
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  let frames = 0
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(4)
    if (stage.entryIndex !== 0) break
    frames++
  }
  console.log(`${name} seed ${seed}: ${frames} frames, ${steps} steps of the machine, ${events} events, ${hash.digest('hex')}`)
}
Machine.prototype.step = step
await close()
