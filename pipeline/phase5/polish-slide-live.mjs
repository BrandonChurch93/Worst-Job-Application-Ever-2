// Simulated visits of the pinball page, one at a time, without a browser: the stage's own steps with the page's director.
// node pipeline/phase5/polish-slide-live.mjs [--visitor never,pack,keen,clumsy,random,skipper,wander,held,flap,stroke] [--seeds 1,2] [--facts] [--rows --at 19 --after 150]
// Prints for each visit: every tow the director starts (page time, scene time, from where to where, what it passed through), every stretch a deadline waited, every catch of the last resort, the longest stretch the ball was off the floor, and the scene's end.
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)
const visitors = arg('visitor', 'never,pack,keen,clumsy,random,skipper,wander,held,flap,stroke').split(',')
const seeds = arg('seeds', '1,2').split(',').map(Number)
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const P = await load('/src/table/physics.ts')
const { Stage } = await load('/src/stage/stage.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { pages } = await load('/src/pages/index.ts')
const S3 = await load('/src/pages/step3/index.ts')
const { config } = await load('/src/config.ts')
const { TIER_Y, R, table, solids } = L
const T = S3.T
const DEADLINES = [['lobby gate', T.lobbyEnd], ['inbox', T.inboxBy], ['office gate', T.officeBy], ['firehouse', T.firedBy], ['ramp', T.flapBy], ['street gate', T.streetBy]]

let mc = null
let inStep = false
let tows = []
const step = P.Machine.prototype.step
const tow = P.Machine.prototype.tow
P.Machine.prototype.step = function (l, r) {
  mc = this
  inStep = true
  const out = step.call(this, l, r)
  inStep = false
  return out
}
P.Machine.prototype.tow = function (i, x, y, speed, then) {
  const b = this.balls[i]
  if (!inStep) tows.push({ steps: this.steps, from: [b.x, b.y], to: [x, y], tier: b.tier, speed, then, v: Math.hypot(b.vx, b.vy) })
  return tow.call(this, i, x, y, speed, then)
}

const distSeg = (px, py, a, b) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = dx * dx + dy * dy
  const u = l > 0 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0
  return Math.hypot(px - (a[0] + dx * u), py - (a[1] + dy * u))
}
const inTri = (px, py, a, b, c) => {
  const s = (p, q) => (px - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (py - q[1])
  const d1 = s(a, b)
  const d2 = s(b, c)
  const d3 = s(c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}
// The bodies on the floor a ball centre at (x, y) lies in or cuts: the names of what a straight slide passes through.
const bodiesAt = (x, y, tier, m) => {
  const out = []
  for (const b of table.bumpers) if (b.tier === tier && Math.hypot(x - b.c[0], y - b.c[1]) < b.r + R - 0.1) out.push(b.id)
  for (const p of table.posts) if (p.tier === tier && Math.hypot(x - p.c[0], y - p.c[1]) < p.r + R - 0.1) out.push(p.id)
  for (const s of table.slings) if (s.tier === tier && (inTri(x, y, s.a, s.b, s.c) || Math.min(distSeg(x, y, s.a, s.b), distSeg(x, y, s.b, s.c), distSeg(x, y, s.a, s.c)) < R - 0.1)) out.push(s.id)
  for (const g of table.segs) if (g.tier === tier && distSeg(x, y, g.a, g.b) < R - 0.1) out.push(g.id)
  for (const o of table.models) if (o.tier === tier && o.solid) for (const [bx, by, w, h] of solids(o)) if (x > bx - R + 0.1 && x < bx + w + R - 0.1 && y > by - R + 0.1 && y < by + h + R - 0.1) out.push(o.id)
  for (const t of table.targets) if (t.tier === tier && !(t.kind === 'drop' && m.down[t.index]) && t.kind !== 'spinner' && x > t.box[0] - R + 0.1 && x < t.box[0] + t.box[2] + R - 0.1 && y > t.box[1] - R + 0.1 && y < t.box[1] + t.box[3] + R - 0.1) out.push(t.id)
  for (const f of table.flippers) if (f.tier === tier) {
    const a = (m.flipperAngle(f.side) * Math.PI) / 180
    const dir = f.side === 'left' ? 1 : -1
    const tip = [f.pivot[0] + Math.cos(a) * L.FLIP_REACH * dir, f.pivot[1] + Math.sin(a) * L.FLIP_REACH]
    if (distSeg(x, y, f.pivot, tip) < R + 0.15) out.push(`flipper.${f.side}`)
  }
  return out
}
const through = (t, m) => {
  const seen = new Set()
  const d = Math.hypot(t.to[0] - t.from[0], t.to[1] - t.from[1])
  const n = Math.max(1, Math.ceil(d / 0.05))
  for (let k = 0; k <= n; k++) for (const id of bodiesAt(t.from[0] + ((t.to[0] - t.from[0]) * k) / n, t.from[1] + ((t.to[1] - t.from[1]) * k) / n, t.tier, m)) seen.add(id)
  return [...seen]
}

const HAND = 1500 / 240
const timed = (keys) => ({ name: 'bot', input: (v) => ({ x: 300, y: 900, down: false, ...keys(v.step) }) })
const makeDriver = (name, seed) => {
  const off = (seed - 1) * 37
  if (name === 'never') return timed(() => ({}))
  if (name === 'held') return timed(() => ({ flipLeft: true, flipRight: true }))
  if (name === 'flap') return timed((n) => ({ flipLeft: Math.floor((n + off) / 30) % 2 === 0, flipRight: Math.floor((n + off) / 30) % 2 === 0 }))
  if (name === 'stroke') return timed((n) => ({ flipLeft: (n + off) % 480 < 36, flipRight: (n + off) % 480 < 36 }))
  if (name === 'keen' || name === 'clumsy' || name === 'random' || name === 'skipper') return new BotDriver(name, seed)
  if (name === 'wander') {
    const bot = new BotDriver('random', seed)
    return { name: 'bot', input: (v) => { const p = bot.input(v); delete p.skip; return p } }
  }
  if (name === 'pack') {
    // The pack's visitor (tools/lib/pack-site.mjs): looks every 4 steps, sees the page's hint 11 looks late, and holds what it saw.
    const d = { name: 'mouse', x: 960, y: 540, queue: [], left: false, right: false, goal: null }
    d.input = (v) => {
      if ((v.step + seed - 1) % 4 === 0) {
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
  throw new Error(`no visitor called ${name}`)
}

const f1 = (n) => n.toFixed(1)
const f2 = (n) => n.toFixed(2)
const lines = []
for (const name of visitors) for (const seed of seeds) {
  mc = null
  tows = []
  const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }, { page: 'step4' }], pages, driver: makeDriver(name, seed), seed })
  let last = -1
  let seenTow = 0
  let base = null
  let was = null
  let wasSlid = 0
  let slideFrom = -1
  let off = 0
  let offMost = 0
  let onTable = false
  let end = -1
  let skipped = false
  const facts = []
  const slides = []
  const catches = []
  const rows = []
  const towRows = []
  while (stage.entryIndex === 0 && stage.time < 110) {
    stage.advance(1)
    if (!skipped && stage.events.some((e) => e.name === 'skip')) skipped = true
    if (!mc || mc.steps === last) continue
    last = mc.steps
    const b = mc.balls[0]
    const page = stage.time
    for (const e of mc.events) {
      if (e.name === 'plunger' && base === null) base = T.plunger - mc.steps / 240 + (mc.slid ?? 0)
      if (e.name === 'rail-out' && e.id === 'launch') onTable = true
      if (e.name === 'at-outlet' && end < 0) end = page
      if (e.name === 'catch' || e.name === 'throw' || e.name === 'magnet-catch' || e.name === 'magnet-throw') catches.push(`${f2(page)} ${e.name} ${e.id} at (${f1(b.x)}, ${f1(b.y - TIER_Y[b.tier])})`)
      if (has('facts') && e.name !== 'flipper') facts.push(`${f2(page)} s  ${e.name}:${e.id}`)
    }
    const slid = mc.slid ?? 0
    const scene = (base ?? 0) + mc.steps / 240 - slid
    while (seenTow < tows.length) {
      const t = tows[seenTow++]
      const hit = through(t, mc)
      const mouth = t.then.startsWith('gate') && t.from[1] - TIER_Y[t.tier] > L.MOUTH.v - 1.2 && Math.abs(t.from[0] - L.MID) < L.MOUTH.half + 0.6
      const near = Math.hypot(t.to[0] - t.from[0], t.to[1] - t.from[1])
      towRows.push({ ...t, page, scene, hit, mouth, near, old: !t.then.includes('revolving') || near > 1.5 || hit.length > 0 ? !mouth : false })
    }
    if (slid > wasSlid + 1e-9 && slideFrom < 0) slideFrom = page
    if (slid <= wasSlid + 1e-9 && slideFrom >= 0) {
      const d = DEADLINES.reduce((m, x) => (Math.abs(x[1] - scene) < Math.abs(m[1] - scene) ? x : m))
      slides.push({ from: slideFrom, seconds: page - slideFrom, which: d[0] })
      slideFrom = -1
    }
    wasSlid = slid
    if (onTable && end < 0) {
      off = b.mode === 'plane' ? 0 : off + 1
      offMost = Math.max(offMost, off)
    }
    if (has('rows')) rows.push({ page, scene, mode: b.mode, tier: b.tier, x: b.x, v: b.y - TIER_Y[b.tier], vx: b.vx, vy: b.vy, what: b.mode === 'tow' ? `tow>${b.then}` : b.mode === 'hold' ? `hold ${b.hold}` : b.mode === 'rail' ? `rail ${b.rail}` : '', ev: mc.events.filter((e) => e.name !== 'flipper').map((e) => `${e.name}:${e.id}`).join(' '), mag: mc.magnet ? mc.magnet.map((n) => n.toFixed(1)).join(',') : '', L: stage.page && mc.held[0], R: mc.held[1], slid })
    if (was && was !== b.mode && has('facts')) facts.push(`${f2(page)} s  ${was} > ${b.mode} ${b.mode === 'tow' ? b.then : b.mode === 'hold' ? b.hold : b.mode === 'rail' ? b.rail : ''}`)
    was = b.mode
  }
  const old = towRows.filter((t) => t.old)
  const slidSum = slides.reduce((m, x) => m + x.seconds, 0)
  const gags = config.film.beats.filter((x) => x.unit === 'pinball').every((x) => stage.gagsReached.includes(x.id))
  lines.push(`${name.padEnd(8)} seed ${seed}  old tows ${old.length}  slides ${slides.length} (sum ${f2(slidSum)} s, longest ${f2(slides.reduce((m, x) => Math.max(m, x.seconds), 0))} s)  catches ${catches.filter((c) => c.includes('catch')).length}  ball off the floor at most ${f2(offMost / 240)} s  scene end ${end < 0 ? 'NEVER' : f2(end)} s  page end ${stage.entryIndex === 0 ? 'NEVER' : f2(stage.time)} s  beats ${gags ? 'all' : 'MISSED'}${skipped ? '  skipped' : ''}`)
  for (const t of towRows) lines.push(`    ${t.old ? 'TOW' : 'tow'} page ${f2(t.page)} s scene ${f2(t.scene)} s  tier ${t.tier} (${f1(t.from[0])}, ${f1(t.from[1] - TIER_Y[t.tier])}) > (${f1(t.to[0])}, ${f1(t.to[1] - TIER_Y[t.tier])}) ${f1(t.near)} balls at ${t.speed}/s to ${t.then}, ball had ${f1(t.v)}/s, through: ${t.hit.length ? t.hit.join(', ') : 'nothing'}${t.mouth ? ' (from the gate\'s mouth)' : ''}`)
  for (const x of slides) lines.push(`    slide page ${f2(x.from)} s  ${x.which} deadline waited ${f2(x.seconds)} s`)
  for (const c of catches) lines.push(`    ${c}`)
  for (const f of facts) lines.push(`      ${f}`)
  if (has('rows')) {
    const at = Number(arg('at', 0))
    const k0 = rows.findIndex((r) => r.page >= at)
    for (let k = Math.max(0, k0); k < Math.min(rows.length, k0 + Number(arg('after', 150))); k++) {
      const r = rows[k]
      lines.push(`      ${f2(r.page)} ${r.scene.toFixed(3)} ${r.L ? 'L' : '.'}${r.R ? 'R' : '.'} ${r.mode.padEnd(5)} t${r.tier} ${f2(r.x).padStart(6)} ${f2(r.v).padStart(6)} ${f2(r.vx).padStart(7)} ${f2(r.vy).padStart(7)} ${f1(Math.hypot(r.vx, r.vy)).padStart(5)} ${r.mag} ${r.what} ${r.ev}`)
    }
  }
}
console.log(lines.join('\n'))
await close()
