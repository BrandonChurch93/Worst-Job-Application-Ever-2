// The view's moves on the street, counted from the rows that polish-sight-measure.mjs writes with --json.
// node pipeline/phase5/polish-sight-moves.mjs <dir of rows> [--quiet]
// A move begins on the frame the view's lift over the street's place (s.sight[0]) leaves 0 or its whole height, and ends on the frame it is back at one of the two with no speed. Counted: moves a visit, moves up and down for each trip of the ball up the tier (from the frame it is above the bats' line to the frame it is at it again), the time from one move's end to the next one's start, the frames of easing in (to the first frame of full pace), the largest step back inside a move, and the view's place on every frame the ball lies at the bats' line or lower.
import fs from 'node:fs'

const dir = process.argv[2]
const quiet = process.argv.includes('--quiet')
const TIER = 37.75
const BATS = 7
const HIGH = 91.2
const REST = 3715.2
const all = { highest: Infinity, visits: 0, moves: 0, most: 0, mostIn: '', gap: Infinity, gapIn: '', trips: 0, ups: 0, downs: 0, over: 0, ease: [], back: 0, turned: 0, low: 0, lowLift: 0, lowOff: 0, lowFar: 0, lowFarSettled: 0, settled: 0, reach: [] }
for (const file of fs.readdirSync(dir).filter((f) => /^[a-z]+-\d\.json$/.test(f)).sort()) {
  const rows = JSON.parse(fs.readFileSync(`${dir}/${file}`))
  const visit = file.replace('.json', '').replace('-', ' seed ')
  const moves = []
  let m = null
  let trip = null
  const trips = []
  let stay = 0
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const b = r.balls[0]
    const on = r.sight && b && !b.steel && b.does === 'floor' && b.tier === 2
    const lift = r.sight ? r.sight[0] : null
    const before = i > 0 && rows[i - 1].sight ? rows[i - 1].sight[0] : null
    stay = r.sight ? stay + 1 : 0
    if (lift !== null && before !== null) {
      const rest = (v) => v === 0 || Math.abs(v - HIGH) < 1e-6
      if (!m && lift !== before) { m = { from: r.f, t0: r.t, a: before, steps: [], dir: Math.sign(lift - before) }; moves.push(m) }
      if (m) {
        m.steps.push(lift - before)
        if (rest(lift) && r.sight[1] === 0) { m.to = r.f; m.t1 = r.t; m.b = lift; m = null }
      }
    } else if (m) { m.to = rows[i - 1].f; m.t1 = rows[i - 1].t; m.b = before; m.cut = true; m = null }
    if (on) {
      const y = b.y - TIER
      if (lift > 0) all.highest = Math.min(all.highest, r.scroll)
      if (y >= BATS) {
        all.low++
        if (lift !== 0) { all.lowLift++; all.lowOff = Math.max(all.lowOff, lift) }
        all.lowFar = Math.max(all.lowFar, Math.abs(r.scroll - REST))
        if (stay > 60) { all.settled++; all.lowFarSettled = Math.max(all.lowFarSettled, Math.abs(r.scroll - REST)) }
        if (trip) { trip.to = r.f; trip.place = r.scroll; trip.lift = lift; trips.push(trip); trip = null }
      } else if (!trip) trip = { from: r.f, top: y }
      else trip.top = Math.min(trip.top, y)
    } else if (trip) { trip.to = r.f; trip.left = true; trips.push(trip); trip = null }
  }
  for (const t of trips) {
    const inside = moves.filter((x) => x.from >= t.from && x.from <= t.to)
    t.ups = inside.filter((x) => x.dir > 0).length
    t.downs = inside.filter((x) => x.dir < 0).length
    all.trips++
    all.ups += t.ups
    all.downs += t.downs
    if (t.ups > 1 || t.downs > 1) all.over++
    if (!t.left) all.reach.push({ visit, frame: t.to, place: t.place, lift: t.lift, top: t.top })
  }
  for (let i = 0; i < moves.length; i++) {
    const x = moves[i]
    const s = x.steps.map((v) => v * x.dir)
    const top = Math.max(...s)
    x.ease = s.findIndex((v) => v >= top - 1e-6) + 1
    x.back = Math.max(0, ...s.map((v) => -v))
    x.turn = Math.sign(x.b - x.a) !== x.dir
    all.ease.push(x.ease)
    all.back = Math.max(all.back, x.back)
    if (x.turn) all.turned++
    if (i > 0 && moves[i - 1].t1 !== undefined) {
      const gap = x.t0 - moves[i - 1].t1 - 1 / 60
      if (gap < all.gap) { all.gap = gap; all.gapIn = `${visit}, frames ${moves[i - 1].to} to ${x.from}` }
    }
  }
  all.visits++
  all.moves += moves.length
  if (moves.length > all.most) { all.most = moves.length; all.mostIn = visit }
  if (!quiet) {
    console.log(`${visit}: ${moves.length} moves of the view on the street, ${trips.length} trips of the ball above the bats' line`)
    for (const x of moves) console.log(`  move ${x.dir > 0 ? 'up' : 'back'}: frames ${x.from} to ${x.to} (${x.to - x.from + 1}), ${x.t0.toFixed(3)} to ${x.t1.toFixed(3)} s, lift ${x.a.toFixed(1)} to ${x.b.toFixed(1)} px, eased in over ${x.ease} frames, largest step ${Math.max(...x.steps.map((v) => v * x.dir)).toFixed(1)} px, largest step back ${x.back.toFixed(1)} px${x.cut ? ', ended by the ball leaving the tier' : ''}`)
    for (const t of trips) console.log(`  trip: frames ${t.from} to ${t.to}, highest ${t.top.toFixed(2)} balls down the tier, ${t.ups} up, ${t.downs} back${t.left ? ', left the tier' : `, view at ${t.place.toFixed(1)} (lift ${t.lift.toFixed(1)}) on the frame the ball is at the bats' line again`}`)
  }
}
const n = (a) => a.reduce((x, y) => x + y, 0)
console.log(`all ${all.visits} visits: ${all.moves} moves of the view on the street, the most in one visit ${all.most} (${all.mostIn}); shortest time from a move's end to the next one's start ${all.gap === Infinity ? 'none' : all.gap.toFixed(3) + ' s'} (${all.gapIn})`)
console.log(`trips of the ball above the bats' line: ${all.trips}, moves up ${all.ups}, moves back ${all.downs}, trips with more than one move up or more than one back ${all.over}`)
console.log(`easing in, frames to the first frame of full pace: least ${Math.min(...all.ease)}, most ${Math.max(...all.ease)}, mean ${(n(all.ease) / all.ease.length).toFixed(1)}; largest step back inside a move ${all.back.toFixed(2)} px; moves that turned before their end ${all.turned}`)
console.log(`frames with the ball on the street's floor at ${BATS.toFixed(1)} balls down or lower: ${all.low}; with the lift not 0: ${all.lowLift} (largest ${all.lowOff.toFixed(1)} px); largest distance of the view from ${REST}: ${all.lowFar.toFixed(1)} px on all of them, ${all.lowFarSettled.toFixed(1)} px on the ${all.settled} that lie more than 60 frames after the ball came to the tier`)
const lifts = all.reach.filter((x) => x.lift !== 0)
console.log(`the frame the ball is at the bats' line again, ${all.reach.length} times: lift 0 on ${all.reach.length - lifts.length}, not 0 on ${lifts.length}${lifts.length ? ` (largest ${Math.max(...lifts.map((x) => x.lift)).toFixed(1)} px)` : ''}; view's place least ${Math.min(...all.reach.map((x) => x.place)).toFixed(1)}, most ${Math.max(...all.reach.map((x) => x.place)).toFixed(1)}`)
console.log(`the view's highest place with the lift on and the ball on the street: ${all.highest.toFixed(1)} (the wire's and the bats' place on the screen at a given place of the view: polish-sight-wire.mjs)`)
