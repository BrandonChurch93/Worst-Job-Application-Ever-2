// The view's ways down to its place under a gate, counted over live visits stepped without a browser, and the film's pinball take as a hash of the page's whole state on every step.
// node pipeline/phase5/polish-save2-ways.mjs [--visitor never,pack,keen,clumsy,random] [--seeds 1,2] [--film]
// A way down begins on the step the room under the gate starts to grow. It ends when the room has its whole depth or is gone again. Counted inside it: the starts (a step that goes down after one that did not), the stands part way (a step with no travel) and the turns back part way (a step that goes back before the whole depth).
import { createHash } from 'node:crypto'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const { load, close } = await logic()
const { Stage, filmFlow, filmOptions, ScriptDriver } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
if (process.argv.includes('--film')) {
  const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
  const hash = createHash('sha256')
  let steps = 0
  let rooms = 0
  while (stage.entryIndex === 0 && steps < 200000) {
    stage.advance(1)
    const state = stage.page.save()
    if (state.s.room !== undefined) rooms++
    hash.update(JSON.stringify([state, stage.page.scroll()]))
    steps++
  }
  console.log(`film, pinball: ${steps} steps, ${rooms} of them with a room under a gate, sha256 of the page's state and scroll on every step ${hash.digest('hex')}`)
} else {
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
        const dx = d.goal.x - d.x
        const dy = d.goal.y - d.y
        const far = Math.hypot(dx, dy)
        if (far <= HAND) { d.x = d.goal.x; d.y = d.goal.y } else { d.x += (dx / far) * HAND; d.y += (dy / far) * HAND }
      }
      return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right }
    }
    return d
  }
  const sum = [0, 0, 0, 0]
  for (const name of arg('visitor', 'never,pack,keen,clumsy,random').split(',')) for (const seed of arg('seeds', '1,2').split(',').map(Number)) {
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
    let was = 0
    let on = false
    let rising = false
    let starts = 0
    let most = 0
    const ways = []
    const stood = []
    const back = []
    const end = () => {
      on = false
      most = Math.max(most, starts)
    }
    while (stage.entryIndex === 0 && stage.time < 110) {
      stage.advance(1)
      if (stage.entryIndex !== 0) break
      const x = stage.page.save().s.room?.[0] ?? 0
      const d = x - was
      if (!on && d > 0) {
        on = true
        rising = true
        starts = 1
        ways.push(stage.pageTime)
        if (x >= 90) end()
      } else if (on) {
        if (d > 0 && !rising) starts++
        if (d === 0 && rising) stood.push(`${stage.pageTime.toFixed(2)} s at ${x.toFixed(1)} px`)
        if (d < 0 && rising) back.push(`${stage.pageTime.toFixed(2)} s at ${was.toFixed(1)} px`)
        rising = d > 0
        if (x >= 90 || x <= 0) end()
      }
      was = x
    }
    sum[0] += ways.length
    sum[1] += stood.length
    sum[2] += back.length
    sum[3] = Math.max(sum[3], most)
    console.log(`${name} seed ${seed}: ${ways.length} ways down, largest count of starts inside one way down ${most}, ${stood.length} stands part way${stood.length ? ` (${stood.join('; ')})` : ''}, ${back.length} turns back part way${back.length ? ` (${back.join('; ')})` : ''}`)
  }
  console.log(`all: ${sum[0]} ways down, ${sum[1]} stands part way, ${sum[2]} turns back part way, largest count of starts inside one way down ${sum[3]}`)
}
await close()
