// The pinball page as a visitor plays it, without a browser: the stage's own steps, the director at work, the flippers worked as the page's hint says,
// a reaction time late, as the pack tool's visitor works them. Prints the clear ball and the bats round the first flipper press.
// node pipeline/phase5/fix-flipper-live.mjs [--phase 0..3] [--react 11] [--before 8] [--after 100] [--hold N] [--json file]
import fs from 'node:fs'
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const phase = Number(arg('phase', 0))
const react = Number(arg('react', 11))
const before = Number(arg('before', 8))
const after = Number(arg('after', 100))
const hold = arg('hold', null)
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
  name: 'mouse',
  x: 960, y: 540, queue: [], left: false, right: false, n: 0, firstPress: -1, heldFor: 0,
  input(v) {
    if ((v.step + phase) % VISITOR === 0) {
      const h = v.turning ? null : v.page.hint()
      this.queue.push(h ? { x: h.x, y: h.y - v.scroll, left: h.flipLeft === true, right: h.flipRight === true } : null)
      const seen = this.queue.length > react ? this.queue.shift() : null
      if (seen) {
        this.goal = seen
        if (hold === null || this.firstPress < 0) {
          this.left = seen.left
          this.right = seen.right
        }
        if ((this.left || this.right) && this.firstPress < 0) this.firstPress = v.step
      }
      if (hold !== null && this.firstPress >= 0) {
        if (this.heldFor >= Number(hold)) this.left = this.right = false
        this.heldFor++
      }
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

const stage = new Stage({ mode: 'live', flow: [{ page: 'step3' }], pages, driver, seed: 1 })
const log = []
let pressStep = -1
for (let i = 0; i < 240 * 120; i++) {
  stage.advance(1)
  if (!mc) continue
  const b = mc.balls[0]
  const hero = stage.cursor.pose()
  const body = mc.world.getRigidBody(mc.ballHandles[0])
  const spin = b.mode === 'plane' ? body.angvel() : 0
  let touch = ''
  if (b.mode === 'plane') {
    mc.flipHandles.forEach((h, n) => {
      const bat = mc.world.getRigidBody(h)
      for (let c = 0; c < bat.numColliders(); c++) mc.world.contactPair(body.collider(0), bat.collider(c), (man) => { if (man.numContacts() > 0) touch = `${L.table.flippers[n].side[0].toUpperCase()}${'ptf'[c]}` })
    })
  }
  log.push({ step: stage.step, mode: b.mode, tier: b.tier, x: b.x, v: b.y - TIER_Y[b.tier], vx: b.vx, vy: b.vy, L: mc.flipperAngle('left'), R: mc.flipperAngle('right'), spin, touch, keyL: driver.left, keyR: driver.right, shot: mc.seenShot, magnet: mc.seenMagnet, aim: mc.seenAim, events: mc.events.map((e) => `${e.name}:${e.id}`), hx: hero.x, hy: hero.y })
  if (pressStep < 0 && (driver.left || driver.right)) pressStep = log.length - 1
  if (pressStep >= 0 && log.length - 1 >= pressStep + after) break
}
const f2 = (n) => (n >= 0 ? ' ' : '') + n.toFixed(2)
const from = Math.max(0, pressStep - before)
console.log(`visitor phase ${phase}, reaction ${react} visitor steps; first flipper key at stage step ${log[pressStep].step} (${(log[pressStep].step / 240).toFixed(3)} s of the page), tier ${log[pressStep].tier}`)
console.log('step  key mode   x      v      vx      vy     speed  dvy    spin*R touch batL   batR   director                           events')
console.log('touch: R or L bat, p its pivot round, t its tip round, f its flank; spin*R is the speed of the ball\'s rim from its own turning, in balls/s')
for (let k = from; k < log.length; k++) {
  const r = log[k]
  const p = log[k - 1] ?? r
  const dir = `${r.shot ? `shot ${r.shot.map((n) => n.toFixed(1)).join(' ')}` : ''}${r.magnet ? ` magnet ${r.magnet.map((n) => n.toFixed(1)).join(' ')}` : ''}${r.aim ? ` aim ${r.aim.map((n) => n.toFixed(1)).join(' ')}` : ''}`
  console.log(`${String(r.step).padStart(5)} ${r.keyL ? 'L' : '.'}${r.keyR ? 'R' : '.'} ${r.mode.padEnd(5)} ${f2(r.x)} ${f2(r.v)} ${f2(r.vx).padStart(7)} ${f2(r.vy).padStart(7)} ${f2(Math.hypot(r.vx, r.vy)).padStart(6)} ${f2(r.vy - p.vy).padStart(6)} ${f2(r.spin * 0.5).padStart(6)} ${(r.touch || '.').padEnd(4)} ${f2(r.L).padStart(6)} ${f2(r.R).padStart(6)}  ${dir.padEnd(34)} ${r.events.join(' ')}`)
}
console.log(`the slope's pull is ${(GRAVITY / 240).toFixed(4)} balls/s a step`)
const out = arg('json', null)
if (out) fs.writeFileSync(out, JSON.stringify({ phase, react, pressStep: log[pressStep].step, rows: log.slice(from) }))
await close()
