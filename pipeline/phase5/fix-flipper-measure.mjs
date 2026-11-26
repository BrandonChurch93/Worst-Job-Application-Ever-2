// The ball off the right flipper of the office tier, in the machine's physics alone: no director, no browser, no pictures.
// node pipeline/phase5/fix-flipper-measure.mjs [--case a|b|c|d|all] [--rows]
import { logic } from '../../tools/lib/logic.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1] ?? true
}
const only = arg('case', 'all')
const rows = process.argv.includes('--rows')
const { load, close } = await logic()
const L = await load('/src/table/layout.ts')
const { Machine } = await load('/src/table/physics.ts')
const { FLIP, FLIP_REACH, GRAVITY, TIER_Y, R, table } = L
const HZ = 240
const DT = 1 / HZ
const DEG = Math.PI / 180
const TIER = 1
const VISITOR = 4
const bat = table.flippers.find((f) => f.tier === TIER && f.side === 'right')
const P = bat.pivot
const f2 = (n) => (n >= 0 ? ' ' : '') + n.toFixed(2)
const f3 = (n) => (n >= 0 ? ' ' : '') + n.toFixed(3)

// The bat's middle line at an angle in degrees above (negative) or below (positive) level, for the right bat, and the ball's place in the bat's own frame.
const frame = (deg) => {
  const a = deg * DEG
  const d = [-Math.cos(a), Math.sin(a)]
  const n = [-Math.sin(a), -Math.cos(a)]
  return { d, n }
}
const onBat = (b, deg) => {
  const { d, n } = frame(deg)
  const rx = b.x - P[0]
  const ry = b.y - P[1]
  const along = rx * d[0] + ry * d[1]
  const above = rx * n[0] + ry * n[1]
  const u = Math.max(0, Math.min(FLIP_REACH, along))
  const rad = FLIP.radius + ((FLIP.tip - FLIP.radius) * u) / FLIP_REACH
  const gap = Math.hypot(along - u, above) - rad - R
  return { along, above, gap }
}
const place = (deg, along, lift = 0.002) => {
  const { d, n } = frame(deg)
  const rad = FLIP.radius + ((FLIP.tip - FLIP.radius) * along) / FLIP_REACH
  return [P[0] + d[0] * along + n[0] * (rad + R + lift), P[1] + d[1] * along + n[1] * (rad + R + lift)]
}
const touching = (m) => {
  const w = m.world
  const ball = w.getRigidBody(m.ballHandles[0])
  const body = w.getRigidBody(m.flipHandles[bat.index])
  let hit = false
  for (let i = 0; i < body.numColliders(); i++) w.contactPair(ball.collider(0), body.collider(i), (man) => { if (man.numContacts() > 0) hit = true })
  return hit
}

// One case: where the ball starts, and when the right key is down, as a function of the step and of what the machine shows.
const play = (name, start, key, steps, more = {}) => {
  const m = new Machine()
  for (const h of table.holds) m.on[h.id] = false
  m.gate = [false, false, false]
  if (more.shot) m.shot = more.shot
  if (more.before) for (let i = 0; i < more.before; i++) m.step(false, true)
  m.toPlane(0, start[0], start[1], start[2] ?? 0, start[3] ?? 0)
  m.balls[0].cool = 0
  const log = []
  let pressedAt = -1
  for (let i = 0; i < steps; i++) {
    const b0 = { ...m.balls[0] }
    const o = onBat(b0, FLIP.rest)
    const down = key(i, o, pressedAt, m)
    if (down && pressedAt < 0) pressedAt = i
    const events = m.step(false, down).map((e) => e.name)
    const b = m.balls[0]
    if (b.mode !== 'plane') break
    const angle = m.flipperAngle('right')
    const now = onBat(b, angle)
    log.push({ i, key: down, x: b.x, v: b.y - TIER_Y[TIER], vx: b.vx, vy: b.vy, speed: Math.hypot(b.vx, b.vy), angle, touch: touching(m), gap: now.gap, along: now.along, dvy: b.vy - b0.vy, dvx: b.vx - b0.vx, events })
  }
  return { name, log, pressedAt }
}

const dirOf = (r) => `${(Math.atan2(-r.vy, r.vx) / DEG).toFixed(0)} deg`
const report = (run, say) => {
  const { name, log, pressedAt } = run
  console.log(`\n== ${name}`)
  console.log(`a real ball: ${say}`)
  if (rows) {
    console.log('step key  x      v      vx      vy      speed  bat    touch gap     along  dvy/step')
    for (const r of log) console.log(`${String(r.i).padStart(4)} ${r.key ? 'R' : '.'}  ${f2(r.x)} ${f2(r.v)} ${f2(r.vx).padStart(7)} ${f2(r.vy).padStart(7)} ${f2(r.speed).padStart(6)} ${f2(r.angle).padStart(6)}  ${r.touch ? 'T' : '.'}   ${f3(r.gap)} ${f2(r.along)} ${f3(r.dvy)} ${r.events.join(',')}`)
  }
  const spans = []
  let from = -1
  log.forEach((r, k) => {
    if (r.touch && from < 0) from = k
    if ((!r.touch || k === log.length - 1) && from >= 0) {
      spans.push([from, r.touch ? k : k - 1])
      from = -1
    }
  })
  const line = (label, a, b) => {
    const before = log[Math.max(0, a - 1)]
    const after = log[Math.min(log.length - 1, b + 1)]
    console.log(`  ${label}: steps ${log[a].i} to ${log[b].i} in touch (${b - a + 1} steps, ${((b - a + 1) * DT).toFixed(3)} s), ${f2(log[a].along)} to ${f2(log[b].along)} balls along the bat; speed ${before.speed.toFixed(2)} before, ${after.speed.toFixed(2)} after, leaving toward ${dirOf(after)}`)
  }
  let n = 0
  for (const [a, b] of spans) {
    if (n >= 4) break
    const k = log.findIndex((r) => r.i === pressedAt)
    if (pressedAt > 0 && k > a && k <= b) {
      const at = log[k - 1]
      const acc = (at.speed - log[a].speed) / ((k - 1 - a) * DT)
      console.log(`  rolling down the bat at rest: steps ${log[a].i} to ${at.i}, speed ${log[a].speed.toFixed(2)} to ${at.speed.toFixed(2)} balls/s, ${acc.toFixed(2)} balls/s2 along the bat`)
      line('the stroke', k, b)
    } else line(`touch ${n + 1}`, a, b)
    n++
  }
  const air = log.filter((r, k) => k > 0 && !r.touch && !log[k - 1].touch && r.gap > 0.05)
  const clean = air.filter((r) => Math.abs(r.dvx) < 1e-6)
  const other = air.filter((r) => Math.abs(r.dvx) >= 1e-6)
  if (clean.length) console.log(`  clear of the bat for ${air.length} steps: in ${clean.length} of them the speed down the slope grows by ${Math.min(...clean.map((r) => r.dvy)).toFixed(4)} to ${Math.max(...clean.map((r) => r.dvy)).toFixed(4)} balls/s (the slope's pull is ${(GRAVITY * DT).toFixed(4)} a step) and the sideways speed does not change; in ${other.length} the ball meets something else of the table${other.length ? ` (${[...new Set(other.flatMap((r) => r.events))].join(', ') || 'a wall, a post or a guide'})` : ''}`)
  console.log(`  deepest the ball's edge is inside the bat's line: ${(-Math.min(0, ...log.map((r) => r.gap))).toFixed(3)} balls; highest v ${Math.min(...log.map((r) => r.v)).toFixed(2)}; fastest ${Math.max(...log.map((r) => r.speed)).toFixed(2)} balls/s; ends at step ${log[log.length - 1].i}, x ${f2(log[log.length - 1].x)} v ${f2(log[log.length - 1].v)}`)
}

const top = place(FLIP.rest, 0.7)
const roll = [top[0], top[1], 0, 0]
const tipUp = [P[0] - FLIP_REACH * Math.cos(25 * DEG), P[1] - FLIP_REACH * Math.sin(25 * DEG)]
const want = (c) => only === 'all' || only === c
console.log(`right bat of the ${L.TIERS[TIER]} tier: pivot x ${P[0]} v ${(P[1] - TIER_Y[TIER]).toFixed(2)}, ${FLIP.length} balls long, rest ${FLIP.rest} deg, up ${FLIP.up} deg, stroke ${FLIP.seconds} s = ${(FLIP.seconds * HZ).toFixed(1)} steps; ${HZ} steps a second; the slope's pull ${GRAVITY} balls/s2; raised tip centre x ${tipUp[0].toFixed(2)} v ${(tipUp[1] - TIER_Y[TIER]).toFixed(2)}`)
console.log(`a step here is one step of the physics (1/${HZ} s); a visitor's step in the pack tool is ${VISITOR} of them (1/60 s)`)

if (want('a')) report(play('a: the bat pressed as the ball rolls to 1.8 balls along it, and held up', roll, (i, o, at) => at >= 0 || o.along >= 1.8, 400), 'takes the speed of the bat under it (the bat turns 50 deg in 0.07 s: 22 balls/s at 1.8 balls from the pivot) and a little more from the rubber, and leaves up the table')
if (want('b')) {
  report(play('b: the same press, let go after 6 visitor steps (24 steps)', roll, (i, o, at) => (at < 0 ? o.along >= 1.8 : i - at < 6 * VISITOR), 400), 'the same strike as (a): the stroke is over in 17 steps, so letting go at 24 changes only what the ball meets when it comes back')
  report(play('b2: the same press, let go after 6 physics steps', roll, (i, o, at) => (at < 0 ? o.along >= 1.8 : i - at < 6), 400), 'a short tap: the bat rises a third of its stroke and falls back, the ball is thrown as hard as the bat moved while it pushed')
}
if (want('c')) {
  for (const dx of [-0.35, -0.15, 0, 0.15, 0.35]) report(play(`c: the bat held up, the ball let fall from 0.7 balls above the raised tip, ${dx} balls ${dx < 0 ? 'to the gap side of' : dx > 0 ? 'to the pivot side of' : 'right over'} the tip centre`, [tipUp[0] + dx, tipUp[1] - 0.7 - FLIP.tip - R, 0, 0], () => true, 300, { before: 30 }), 'a low bounce off the rubber (a third to a half of its speed back, along the line from the tip to the ball), then it rolls off the round tip into the gap or down the raised flank to the pivot')
  report(play('c2: the bat held up, the ball set down at rest on the raised tip, 0.1 balls to the gap side', [tipUp[0] - 0.1, tipUp[1] - FLIP.tip - R - 0.002, 0, 0], () => true, 300, { before: 30 }), 'rolls round the tip and falls into the gap, gaining speed all the way')
}
if (want('d')) report(play('d: the bat at rest, the ball let go 0.7 balls along it', roll, () => false, 400), 'rolls down the bat gaining speed (a rolling ball on a 25 deg bat gains 8.3 balls/s2, a sliding one up to 12.4) and drops off the tip into the gap')
await close()
