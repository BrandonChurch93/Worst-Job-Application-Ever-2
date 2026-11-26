// The pinball page as a visitor plays it, without a browser: the stage's own steps with the page's director.
// node pipeline/phase5/polish-ball-live.mjs [--press hint|never|always] [--phase 0..3] [--react 11] [--nth 1] [--before 20] [--after 150] [--rows] [--seed 1]
// Prints the run's facts (events, tows, pulls, when the ball left each tier, when the scene ended) and, with --rows, every step round the nth key press.
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)
const press = arg('press', 'hint')
const phase = Number(arg('phase', 0))
const react = Number(arg('react', 11))
const nth = Number(arg('nth', 1))
const before = Number(arg('before', 20))
const after = Number(arg('after', 150))
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const P = await load('/src/table/physics.ts')
const { Stage } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { TIER_Y, GRAVITY } = L
const VISITOR = 4
const HAND = 1500 / 240

let mc = null
const step = P.Machine.prototype.step
P.Machine.prototype.step = function (l, r) {
  mc = this
  this.seenShot = this.shot ? [...this.shot] : null
  this.seenMagnet = this.magnet ? [...this.magnet] : null
  this.seenAim = this.aim ? [...this.aim] : null
  return step.call(this, l, r)
}

const driver = {
  name: 'mouse', x: 960, y: 540, queue: [], left: false, right: false, goal: null,
  input(v) {
    if ((v.step + phase) % VISITOR === 0) {
      const h = v.turning ? null : v.page.hint()
      this.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
      const seen = this.queue.length > react ? this.queue.shift() : null
      if (seen) {
        this.goal = seen
        this.left = press === 'hint' ? seen.left : press === 'always'
        this.right = press === 'hint' ? seen.right : press === 'always'
      }
      if (press === 'always' && v.page.id !== undefined) this.left = this.right = Math.floor(v.step / 60) % 2 === 0
    }
    if (this.goal) {
      const dx = this.goal.x - this.x
      const dy = this.goal.y - this.y
      const d = Math.hypot(dx, dy)
      if (d <= HAND) { this.x = this.goal.x; this.y = this.goal.y } else { this.x += (dx / d) * HAND; this.y += (dy / d) * HAND }
    }
    return { x: this.x, y: this.y, down: false, flipLeft: this.left, flipRight: this.right }
  }
}

const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }], pages, driver, seed: Number(arg('seed', 1)) })
const log = []
const facts = []
const presses = []
let wasKey = false
let was = null
let pulls = 0
let last = -1
for (let i = 0; i < 240 * 70; i++) {
  stage.advance(1)
  if (!mc || mc.steps === last) continue
  last = mc.steps
  const b = mc.balls[0]
  const body = mc.world.getRigidBody(mc.ballHandles[0])
  let touch = ''
  if (b.mode === 'plane') {
    mc.flipHandles.forEach((h, n) => {
      const bat = mc.world.getRigidBody(h)
      for (let c = 0; c < bat.numColliders(); c++) mc.world.contactPair(body.collider(0), bat.collider(c), (man) => { if (man.numContacts() > 0) touch = `${L.table.flippers[n].side[0].toUpperCase()}${'ptf'[c]}` })
    })
  }
  const pulled = b.mode === 'plane' && mc.seenMagnet && (mc.seenMagnet[3] === undefined || Math.hypot(mc.seenMagnet[0] - b.x, mc.seenMagnet[1] - b.y) < mc.seenMagnet[3])
  if (pulled) pulls++
  const row = { step: stage.step, t: stage.step / 240, mode: b.mode, tier: b.tier, x: b.x, v: b.y - TIER_Y[b.tier], vx: b.vx, vy: b.vy, L: mc.flipperAngle('left'), R: mc.flipperAngle('right'), touch, keyL: driver.left, keyR: driver.right, shot: mc.seenShot, magnet: pulled ? mc.seenMagnet : null, aim: mc.seenAim, events: mc.events.map((e) => `${e.name}:${e.id}`), what: b.mode === 'tow' ? `tow>${b.then}` : b.mode === 'hold' ? `hold ${b.hold}` : b.mode === 'rail' ? `rail ${b.rail}` : '' }
  log.push(row)
  const key = driver.left || driver.right
  if (key && !wasKey) presses.push(log.length - 1)
  wasKey = key
  if (was && was.mode !== row.mode) facts.push(`${row.t.toFixed(2)} s  ${was.mode} > ${row.mode} ${row.what}  at tier ${row.tier} (${row.x.toFixed(1)}, ${row.v.toFixed(1)}) speed in ${Math.hypot(was.vx, was.vy).toFixed(1)}`)
  for (const e of row.events) if (!e.startsWith('flipper')) facts.push(`${row.t.toFixed(2)} s  ${e}  speed ${was ? Math.hypot(was.vx, was.vy).toFixed(1) : '0.0'} > ${Math.hypot(row.vx, row.vy).toFixed(1)}`)
  was = row
  if (b.mode === 'hold' && b.hold === 'outlet') break
}
const f2 = (n) => (n >= 0 ? ' ' : '') + n.toFixed(2)
console.log(`press ${press}, visitor phase ${phase}, reaction ${react} visitor steps, ${presses.length} key presses, ${log.filter((r) => r.events.includes('shot:left') || r.events.includes('shot:right')).length} set shots, ${log.filter((r, k) => r.mode === 'tow' && log[k - 1].mode !== 'tow' && !r.what.startsWith('tow>gate')).length + 0} tows to a device, ${log.filter((r, k) => r.mode === 'tow' && log[k - 1].mode !== 'tow' && r.what.startsWith('tow>gate')).length} tows to a gate, ${pulls} steps under a pull`)
console.log(`the ball reached the outlet at ${log[log.length - 1].t.toFixed(2)} s of the page`)
let slow = 0
let run = 0
let worst = 0
for (const r of log) {
  const creep = r.mode === 'plane' && !r.touch && Math.hypot(r.vx, r.vy) < 6 && r.v < 8
  run = creep ? run + 1 : 0
  if (creep) slow++
  worst = Math.max(worst, run)
}
console.log(`steps on open floor above the bats under 6 balls/s and off a bat: ${slow}, longest run ${worst} steps`)
if (has('facts')) for (const f of facts) console.log(f)
if (has('rows') && presses.length >= nth) {
  const at = presses[nth - 1]
  console.log(`key press ${nth} at stage step ${log[at].step} (${log[at].t.toFixed(3)} s of the page), tier ${log[at].tier}`)
  console.log('step  key mode   x      v      vx      vy     speed  touch batL   batR   director and events')
  for (let k = Math.max(0, at - before); k < Math.min(log.length, at + after + 1); k++) {
    const r = log[k]
    const dir = `${r.shot ? `shot ${r.shot.map((n) => n.toFixed(1)).join(' ')}` : ''}${r.magnet ? ` PULL ${r.magnet.map((n) => n.toFixed(1)).join(' ')}` : ''}`
    console.log(`${String(r.step).padStart(5)} ${r.keyL ? 'L' : '.'}${r.keyR ? 'R' : '.'} ${r.mode.padEnd(5)} ${f2(r.x)} ${f2(r.v)} ${f2(r.vx).padStart(7)} ${f2(r.vy).padStart(7)} ${f2(Math.hypot(r.vx, r.vy)).padStart(6)} ${(r.touch || '.').padEnd(4)} ${f2(r.L).padStart(6)} ${f2(r.R).padStart(6)}  ${dir} ${r.events.join(' ')} ${r.what}`)
  }
}
console.log(`the slope's pull is ${(GRAVITY / 240).toFixed(4)} balls/s a step`)
await close()
