// The live pinball view against the ball in play, on every frame of 60 of whole visits stepped without a browser.
// node pipeline/phase5/polish-sight-measure.mjs [--visitor never,pack,keen,clumsy,random] [--seeds 1,2,3,4] [--margin 0] [--json dir] [--quiet]
// Per frame the ball's shell (a sphere of table.ballPx across, its middle half a ball over the ball's own height) is projected by the page's own view (stage.page.view(): the home camera at the view's scroll and floor) and its box is held against the screen, 0 to 1920 by 0 to 1080, less --margin px.
// A stretch is a run of frames in a row on which one ball is not whole inside that box. Play is from the frame the launch rail takes the clear ball to the frame before the drain rail has it.
// Printed per stretch: the visit, the ball (clear, or steel N), first and last frame and page seconds, the tier, the view's scroll at the deepest frame, what the ball was doing, which edge, how far past it at the deepest, and whether the view was on its way (its step over 0.5 px on that frame).
import fs from 'node:fs'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { Machine } = await load('/src/table/physics.ts')
const { BALL, TIER_Y } = await load('/src/table/layout.ts')
const { homeDistance } = await load('/src/stage/camera.ts')
const D = homeDistance()
const R = BALL / 2
const margin = Number(arg('margin', 0))
let mc = null
const step = Machine.prototype.step
Machine.prototype.step = function (l, r) { mc = this; const e = step.call(this, l, r); for (const x of e) if (x.name === 'flipper') flips.push(this.steps); return e }
let flips = []
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
// The shell's box on the screen: the two tangent lines of the sphere from the eye, along the screen's x and along its y.
const span = (c, d) => {
  const a = Math.atan2(c, d)
  const w = Math.asin(Math.min(1, R / Math.hypot(c, d)))
  return [D * Math.tan(a - w), D * Math.tan(a + w)]
}
const box = (b, scroll, floor) => {
  const d = floor + D - (b.z * BALL + R)
  const xs = span(b.x * BALL - 960, d)
  const ys = span(b.y * BALL - 540 - scroll, d)
  return { l: 960 + xs[0], r: 960 + xs[1], t: 540 + ys[0], b: 540 + ys[1] }
}
const doing = (b) => (b.mode === 'plane' ? 'floor' : b.mode === 'rail' ? `rail ${b.rail}` : b.mode === 'hold' ? `held ${b.hold}` : b.mode === 'tow' ? `tow to ${b.then}` : b.mode)
const all = []
const sum = { frames: 0, play: 0 }
for (const name of arg('visitor', 'never,pack,keen,clumsy,random').split(',')) for (const seed of arg('seeds', '1,2,3,4').split(',').map(Number)) {
  mc = null
  flips = []
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  const rows = []
  let play = 0
  let was = 0
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(4)
    if (stage.entryIndex !== 0) break
    const st = stage.page.save()
    const scroll = stage.page.scroll()
    const floor = st.s.floor
    const b0 = mc ? mc.balls[0] : null
    if (b0 && play === 0 && b0.mode === 'rail' && b0.rail === 'launch') play = 1
    if (b0 && play === 1 && ((b0.mode === 'rail' && b0.rail === 'drain') || b0.mode === 'none' || st.s.phase !== 'sealed')) play = 2
    const balls = mc ? mc.balls.map((b, i) => (b.mode === 'none' ? null : { i, steel: b.steel, mode: b.mode, rail: b.rail, hold: b.hold, then: b.then, tier: b.tier, x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, does: doing(b), box: box(b, scroll, floor) })) : []
    rows.push({ f: rows.length, t: stage.pageTime, steps: mc ? mc.steps : 0, scroll, d: scroll - was, floor, play: play === 1, room: st.s.room ? st.s.room[0] : 0, sight: st.s.sight ?? null, balls, flips })
    flips = []
    was = scroll
  }
  if (arg('json', '')) fs.writeFileSync(`${arg('json')}/${name}-${seed}.json`, JSON.stringify(rows))
  const runs = []
  const open = {}
  for (const r of rows) {
    if (!r.play) continue
    sum.play++
    for (const b of r.balls) {
      if (!b) continue
      const over = { top: margin - b.box.t, bottom: b.box.b - (1080 - margin), left: margin - b.box.l, right: b.box.r - (1920 - margin) }
      const edge = Object.keys(over).sort((p, q) => over[q] - over[p])[0]
      const out = over[edge] > 0
      const o = open[b.i]
      if (out) {
        if (o && o.to === r.f - 1) { o.to = r.f; o.t1 = r.t; if (over[edge] > o.deep) { o.deep = over[edge]; o.edge = edge; o.scroll = r.scroll; o.tier = b.tier; o.at = r.f; o.y = b.y } o.does.add(b.does); if (Math.abs(r.d) > 0.5) o.moving++ }
        else { open[b.i] = { ball: b.steel ? `steel ${b.i}` : 'clear', from: r.f, to: r.f, t0: r.t, t1: r.t, deep: over[edge], edge, scroll: r.scroll, tier: b.tier, at: r.f, y: b.y, does: new Set([b.does]), moving: Math.abs(r.d) > 0.5 ? 1 : 0 }; runs.push(open[b.i]) }
      }
    }
  }
  sum.frames += rows.length
  for (const o of runs) all.push({ visit: `${name} ${seed}`, ...o, does: [...o.does].join(' > ') })
  if (!has('quiet')) {
    console.log(`${name} seed ${seed}: ${rows.length} frames, ${rows.filter((r) => r.play).length} of play, ${runs.length} stretches`)
    for (const o of runs) console.log(`  ${o.ball}: frames ${o.from} to ${o.to} (${o.to - o.from + 1}), ${o.t0.toFixed(3)} to ${o.t1.toFixed(3)} s, tier ${o.tier}, ${(o.y - TIER_Y[o.tier]).toFixed(2)} balls down it, scroll ${o.scroll.toFixed(1)}, ${[...o.does].join(' > ')}, ${o.edge} edge, ${o.deep.toFixed(1)} px past it at frame ${o.at}, the view on its way on ${o.moving} of them`)
  }
}
if (arg('json', '')) fs.writeFileSync(`${arg('json')}/stretches.json`, JSON.stringify(all))
const clear = all.filter((o) => o.ball === 'clear')
console.log(`all: ${sum.frames} frames, ${sum.play} of play; clear ball ${clear.length} stretches, ${clear.reduce((n, o) => n + o.to - o.from + 1, 0)} frames; steel balls ${all.length - clear.length} stretches, ${all.filter((o) => o.ball !== 'clear').reduce((n, o) => n + o.to - o.from + 1, 0)} frames; margin ${margin} px`)
Machine.prototype.step = step
await close()
