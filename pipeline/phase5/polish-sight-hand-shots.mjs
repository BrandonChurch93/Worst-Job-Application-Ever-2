// Whole pictures of a visit of the hand that follows the page's hint a little late (the measure's "pack"), out of the built site in the browser. The site plays only its own hands, so this one is played to it: the visit is stepped without a browser first and the hand's pointer kept on every step; the browser then gets that pointer before each step as the events a visitor's mouse and shift keys send (pointermove and keydown or keyup on the window), and the page's scroll is held against the stepped visit's on every picture.
// node pipeline/phase5/polish-sight-hand-shots.mjs --seed 4 --frame 1358 --count 14 --every 2 --quality high --keep /home/user/shots/dir
// --frame is the first frame of 60 pictured (the measure's frame number), --every the frames from one picture to the next. Writes NNN.png and times.json into --keep and says the largest difference of scroll, in px, between the browser and the stepped visit.
import fs from 'node:fs'
import { openSession } from '../../tools/lib/capture.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const seed = Number(arg('seed', 4))
const frame = Number(arg('frame', 1358))
const count = Number(arg('count', 14))
const every = Number(arg('every', 2))
const quality = arg('quality', 'high')
const keep = arg('keep', '/tmp/polish-sight-hand-shots')
fs.mkdirSync(keep, { recursive: true })
const last = frame + (count - 1) * every
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const HAND = 1500 / 240
const d = { x: 960, y: 540, queue: [], left: false, right: false, goal: null }
const hand = []
const driver = {
  name: 'mouse',
  input: (v) => {
    if ((v.step + seed - 1) % 4 === 0) {
      const h = v.turning ? null : v.page.hint()
      d.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
      const seen = d.queue.length > 11 ? d.queue.shift() : null
      if (seen) { d.goal = seen; d.left = seen.left; d.right = seen.right }
    }
    if (d.goal) {
      const dx = d.goal.x - d.x, dy = d.goal.y - d.y, far = Math.hypot(dx, dy)
      if (far <= HAND) { d.x = d.goal.x; d.y = d.goal.y } else { d.x += (dx / far) * HAND; d.y += (dy / far) * HAND }
    }
    hand.push([d.x, d.y, d.left ? 1 : 0, d.right ? 1 : 0])
    return { x: d.x, y: d.y, down: false, flipLeft: d.left, flipRight: d.right }
  }
}
const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver, seed })
const stepped = []
for (let f = 0; f <= last; f++) {
  stage.advance(4)
  stepped.push(stage.page.scroll())
}
await close()
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&seed=${seed}&quality=${quality}&clock=steps&step=3` })
const times = []
let worst = 0
try {
  await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const play = (from, to, shot) => session.page.evaluate(({ rows, shot }) => {
    const canvas = document.querySelector('canvas')
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: 'Shift', bubbles: true }))
    window.hand = window.hand ?? { left: 0, right: 0 }
    let s = null
    for (let i = 0; i < rows.length; i++) {
      const [x, y, left, right] = rows[i]
      const r = canvas.getBoundingClientRect()
      canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + (x / 1920) * r.width, clientY: r.top + (y / 1080) * r.height, buttons: 0, bubbles: true }))
      if (left !== window.hand.left) key(left ? 'keydown' : 'keyup', 'ShiftLeft')
      if (right !== window.hand.right) key(right ? 'keydown' : 'keyup', 'ShiftRight')
      window.hand = { left, right }
      s = window.liveRun.advance(1 / 240, !(shot && i === rows.length - 1))
    }
    const t = window.liveRun.told()
    return { png: s ? s.png : '', pageTime: t.pageTime, scroll: t.scroll }
  }, { rows: hand.slice(from, to), shot })
  let at = 0
  for (let f = 0; f < frame; f += 60) {
    const to = Math.min(frame, f + 60) * 4
    const got = await play(at, to, false)
    at = to
    worst = Math.max(worst, Math.abs(got.scroll - stepped[to / 4 - 1]))
  }
  for (let i = 0; i < count; i++) {
    const f = frame + i * every
    const got = await play(at, (f + 1) * 4, true)
    at = (f + 1) * 4
    worst = Math.max(worst, Math.abs(got.scroll - stepped[f]))
    times.push(got.pageTime)
    fs.writeFileSync(`${keep}/${String(i).padStart(3, '0')}.png`, Buffer.from(got.png.split(',')[1], 'base64'))
  }
  fs.writeFileSync(`${keep}/times.json`, JSON.stringify(times))
} finally {
  await session.close()
}
console.log(`kept ${count} pictures in ${keep}, frames ${frame} to ${last}, page ${times[0].toFixed(3)} to ${times[count - 1].toFixed(3)} s, level ${quality}; largest difference of the page's scroll between the browser and the stepped visit, held every second on the way and on every picture: ${worst.toFixed(4)} px`)
