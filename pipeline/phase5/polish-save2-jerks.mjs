// One-frame jerks of the live pinball view, counted on every frame of 60 of whole visits stepped without a browser.
// node pipeline/phase5/polish-save2-jerks.mjs [--visitor never,pack,keen,clumsy,random] [--seeds 1,2]
// A jerk is a frame on which the view steps more than 2 px one way while it steps the other way on the frame before and on the frame after. Each is printed with the page's seconds, the three steps, the ball's mode, rail and place down the table, and whether a room under a gate was on.
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
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
let all = 0
let frames = 0
for (const name of arg('visitor', 'never,pack,keen,clumsy,random').split(',')) for (const seed of arg('seeds', '1,2').split(',').map(Number)) {
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  const rows = []
  const rides = []
  let rail = ''
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(4)
    if (stage.entryIndex !== 0) break
    const st = stage.page.save()
    const b = st.m.balls[0] ?? {}
    const on = b.mode === 'rail' && b.rail.startsWith('outlane.') ? b.rail : ''
    if (on && on !== rail) rides.push(on)
    rail = on
    rows.push({ t: stage.pageTime, y: stage.page.scroll(), ball: `${b.mode}${b.mode === 'rail' ? ` ${b.rail}` : ''}, ball y ${b.y?.toFixed(2)}`, room: st.s.room !== undefined })
  }
  const found = []
  for (let i = 2; i < rows.length - 1; i++) {
    const a = rows[i - 1].y - rows[i - 2].y
    const d = rows[i].y - rows[i - 1].y
    const c = rows[i + 1].y - rows[i].y
    if (Math.abs(d) > 2 && a * d < 0 && c * d < 0) found.push(`${rows[i].t.toFixed(3)} s: steps ${a.toFixed(1)}, ${d.toFixed(1)}, ${c.toFixed(1)}; ${rows[i].ball}; room ${rows[i].room ? 'on' : 'off'}`)
  }
  all += found.length
  frames += rows.length
  console.log(`${name} seed ${seed}: ${rows.length} frames, ${rides.length} rides on an outlane rail${rides.length ? ` (${rides.join(', ')})` : ''}, ${found.length} one-frame jerks${found.length ? `\n  ${found.join('\n  ')}` : ''}`)
}
console.log(`all: ${frames} frames, ${all} one-frame jerks`)
await close()
