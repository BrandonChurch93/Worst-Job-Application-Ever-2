// npm run take: searches flipper timings for the film's run of the table and keeps the best as cut/TABLE-TAKE.json.
// A search is a set of seeded runs. It can be stopped and started again. npm run take -- --check replays the kept take and writes out/work/take-check.json.
// --allow N lets one more search run when the Builder has granted it. --from S keeps the kept flips before S seconds and searches only after.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'

const a = args()
const c = config()
const hz = c.sim.stepHz
const tolerance = c.film.beatToleranceSeconds
const beats = c.film.beats.filter((b) => b.unit === 'pinball')
const unitSeconds = c.film.units.find((u) => u.id === 'pinball').seconds
const takeFile = at('cut', 'TABLE-TAKE.json')
const stateFile = at('out', 'work', 'take-search.json')
const checkFile = at('out', 'work', 'take-check.json')
const runsPerSearch = Number(a.runs ?? 24)
const kept = readJson(takeFile)
const maxSearches = Math.max(c.quality.takeSearchMaxRuns, Number(a.allow ?? 0), kept.allowed ?? 0)
const keepBefore = Number(a.from ?? 0)
const key = c.keys.find((k) => k.id === 'last-save')
const keyBeat = beats.find((b) => b.id === key.beat)
const keyTime = keyBeat.from + key.at * (keyBeat.to - keyBeat.from)
const r4 = (n) => Number(n.toFixed(4))
// Where the approved key pictures show the ball: tier, place in balls from the tier's top left, and how near counts.
const PLACES = [
  { key: 'tier-office', tier: 1, at: [10.3, 6.3], within: 1.7 },
  { key: 'reply-all', tier: 1, at: [10.5, 6.7], within: 1.7 },
  { key: 'tier-street', tier: 2, at: [6.2, 4.2], within: 2 }
].map((p) => {
  const k = c.keys.find((x) => x.id === p.key)
  const b = beats.find((x) => x.id === k.beat)
  return { ...p, time: b.from + k.at * (b.to - b.from) }
})
const stops = [keyTime, ...PLACES.map((p) => p.time)]

const { load, close } = await logic()
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const { stream } = await load('/src/core/random.ts')
const { TIER_Y, FLIP, MID, BALL } = await load('/src/table/layout.ts')
const HITS = ['plunger', 'doors-slam', 'bumper', 'sling', 'scoop-kick', 'flipper-save', 'drain']

function caught(b) {
  if (!b || b.mode !== 'plane') return false
  const v = b.y - TIER_Y[2]
  const u = Math.abs(b.x - MID)
  return v > FLIP.pivotV - 1.6 && v < FLIP.pivotV + 1.5 && u > 0.6 && u < MID - FLIP.pivotU + 0.2 && Math.hypot(b.vx, b.vy) < 10
}

class Player {
  name = 'script'
  flips = []
  until = [0, 0]
  wait = [0, 0]
  constructor(rnd, p, keep = []) {
    this.rnd = rnd
    this.p = p
    this.flips = keep.map((f) => [...f])
  }
  input(v) {
    const base = v.page.script(v.pageTime)
    if (v.page.id !== 'step3' || !this.p) return base
    const n = Math.round(v.pageTime * hz)
    const hint = v.page.control === 'flippers' ? v.page.hint() : null
    const want = [hint?.flipLeft === true, hint?.flipRight === true]
    for (let s = 0; s < 2; s++) {
      if (v.pageTime < keepBefore || n < this.until[s] || n < this.wait[s] || !want[s]) continue
      if (this.rnd.next() < this.p.skip) {
        this.wait[s] = n + this.p.rest
        continue
      }
      const from = n + this.p.delay
      this.until[s] = from + this.p.hold
      this.wait[s] = this.until[s] + this.p.rest
      this.flips.push([s === 0 ? 'L' : 'R', r4((from - 0.5) / hz), r4((from + this.p.hold - 0.5) / hz)])
    }
    const held = (side) => this.flips.some((f) => f[0] === side && v.pageTime >= f[1] && v.pageTime < f[2])
    return { ...base, flipLeft: held('L'), flipRight: held('R') }
  }
}

function play(driver) {
  const stage = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver, film: filmOptions('pinball') })
  let tows = 0
  let atKey = false
  const placed = []
  const cuts = []
  let eye = null
  let n = 0
  while (!stage.finished && stage.time < unitSeconds + 1) {
    if (stage.page.id === 'step3' && n % 15 === 0) tows = stage.page.save().s.tows
    n++
    let go = 4
    for (const t of stops) {
      const n = Math.round((t - stage.time) * hz)
      if (n > 0 && n < go) go = n
    }
    stage.advance(go)
    if (stage.page.id !== 'step3') continue
    const pose = stage.page.camera('film', stage.time)
    if (pose && eye && Math.hypot(pose.eye[0] - eye[0], pose.eye[1] - eye[1], pose.eye[2] - eye[2]) > 2 * BALL) cuts.push(stage.time)
    eye = pose ? pose.eye : eye
    if (Math.abs(stage.time - keyTime) < 0.5 / hz) atKey = caught(stage.page.save().m.balls[0])
    for (const p of PLACES) {
      if (Math.abs(stage.time - p.time) >= 0.5 / hz) continue
      const b = stage.page.save().m.balls[0]
      if (b && b.mode !== 'none' && b.mode !== 'rail' && b.tier === p.tier && Math.hypot(b.x - p.at[0], b.y - TIER_Y[p.tier] - p.at[1]) < p.within) placed.push(p.key)
    }
  }
  const out = { beats: [], inside: 0, wanted: 0, tows, bumpers: 0, flipSave: false, atKey, placed, finished: stage.finished }
  for (const b of beats) {
    if (!b.event) continue
    const times = stage.events.filter((e) => e.name === b.event).map((e) => r4(e.step / hz))
    const ok = times.length > 0 && times.every((t) => t >= b.from - tolerance && t <= b.to + tolerance)
    out.beats.push({ id: b.id, from: b.from, to: b.to, event: b.event, at: times, inside: ok })
    out.wanted++
    if (ok) out.inside++
  }
  out.bumpers = stage.events.filter((e) => e.name === 'bumper').length
  const save = stage.events.find((e) => e.name === 'flipper-save')
  out.flipSave = !!save && stage.events.some((e) => e.name === 'flipper' && e.step === save.step)
  out.beside = 0
  for (const e of stage.events) if (HITS.includes(e.name)) for (const t of cuts) if (Math.abs(t - e.step / hz) < 0.16) out.beside++
  out.reached = beats.every((b) => stage.gagsReached.includes(b.id))
  out.score = out.inside * 1000 + (out.reached ? 500 : 0) + (out.flipSave ? 300 : 0) + (out.atKey ? 300 : 0) + Math.min(out.bumpers, 8) * 40 + out.placed.length * 150 - out.tows * 60 - out.beside * 400
  return out
}

function check() {
  const r = play(new ScriptDriver())
  console.log(`the kept take: ${kept.flips.length} flips, ${kept.searches} of ${maxSearches} searches used, replayed for ${unitSeconds} s`)
  for (const b of r.beats) {
    const when = b.at.length ? `${b.at[0].toFixed(2)} s${b.at.length > 1 ? ` to ${b.at[b.at.length - 1].toFixed(2)} s (${b.at.length} times)` : ''}` : 'never'
    console.log(`${b.inside ? 'inside ' : 'OUTSIDE'}  ${b.id.padEnd(18)} ${b.event.padEnd(13)} ${when.padEnd(30)} beat ${b.from} to ${b.to} s, give or take ${tolerance} s`)
  }
  const ok = r.inside === r.wanted && r.reached
  console.log(`the director brought the ball in ${r.tows} times; bumper hits in the coffee beat ${r.bumpers}; the save was ${r.flipSave ? 'a flip' : 'the gate'}; at the key last-save (${keyTime} s) the ball is ${r.atKey ? 'on a flipper' : 'not on a flipper'}; where the approved pictures have it at ${r.placed.length} of ${PLACES.length} other keys${r.placed.length ? ` (${r.placed.join(', ')})` : ''}`)
  console.log(`hits within 0.15 s of a cut of the film: ${r.beside}`)
  console.log(ok ? `take: every one of the ${r.wanted} beat events fell inside its beat` : `take: ${r.wanted - r.inside} of ${r.wanted} beat events fell outside their beats`)
  writeJson(checkFile, { made: new Date().toISOString(), searches: kept.searches, flips: kept.flips.length, toleranceSeconds: tolerance, beats: r.beats, tows: r.tows, bumpers: r.bumpers, flipSave: r.flipSave, ballOnFlipperAtLastSave: r.atKey, ballPlacedAtKeys: r.placed, everyGagReached: r.reached, score: r.score, ok })
  return ok
}

if (a.check) {
  const ok = check()
  await close()
  process.exit(ok ? 0 : 1)
}

let state = fs.existsSync(stateFile) ? readJson(stateFile) : null
if (!state || state.next >= state.runs) {
  if (kept.searches >= maxSearches) {
    console.log(`take: all ${maxSearches} searches are used. The kept take stays as it is.`)
    const ok = check()
    await close()
    process.exit(ok ? 0 : 1)
  }
  state = { search: kept.searches + 1, runs: runsPerSearch, next: 0, best: null, tried: [] }
} else console.log(`take: search ${state.search} goes on from run ${state.next + 1} of ${state.runs}`)

const base = play(new ScriptDriver())
console.log(`kept take: score ${base.score}, ${base.inside} of ${base.wanted} events inside, brought in ${base.tows} times, ${kept.flips.length} flips`)
while (state.next < state.runs) {
  const rnd = stream(`take.${state.search}.${state.next}`, c.seed)
  const p = { hold: 20 + rnd.int(60), delay: rnd.int(10), rest: 12 + rnd.int(60), skip: rnd.range(0, 0.5) }
  const player = new Player(rnd, p, keepBefore > 0 ? kept.flips.filter((f) => f[1] < keepBefore) : [])
  const r = play(player)
  console.log(`search ${state.search} run ${String(state.next + 1).padStart(2)}: score ${r.score}, ${r.inside} of ${r.wanted} inside, brought in ${r.tows} times, bumpers ${r.bumpers}, ${player.flips.length} flips, save by ${r.flipSave ? 'flip' : 'gate'}, at the key ${r.atKey ? 'on a flipper' : 'elsewhere'}, placed ${r.placed.length}`)
  state.tried.push({ run: state.next, policy: p, score: r.score, inside: r.inside, tows: r.tows, flips: player.flips.length })
  if (r.inside === r.wanted && r.reached && (!state.best || r.score > state.best.score)) state.best = { run: state.next, policy: p, score: r.score, tows: r.tows, flips: player.flips }
  state.next++
  writeJson(stateFile, state)
}
const better = state.best && (state.best.score > base.score || base.inside < base.wanted)
const flips = better ? state.best.flips : kept.flips
const lines = flips.map((f) => `    ${JSON.stringify(f)}`).join(',\n')
const head = { about: kept.about, searches: state.search, allowed: maxSearches, kept: better ? { search: state.search, run: state.best.run + 1, seed: c.seed, policy: state.best.policy, score: state.best.score, keptFlipsBefore: keepBefore } : kept.kept ?? null }
fs.writeFileSync(takeFile, `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "flips": [${flips.length ? `\n${lines}\n  ` : ''}]\n}\n`)
console.log(better ? `take: search ${state.search} kept run ${state.best.run + 1} with ${flips.length} flips (score ${state.best.score} over ${base.score})` : `take: search ${state.search} found nothing better; the kept take stays`)
await close()
try {
  process.stdout.write(execFileSync(process.execPath, [at('tools', 'take.mjs'), '--check'], { encoding: 'utf8' }))
} catch (e) {
  process.stdout.write(String(e.stdout ?? ''))
  process.exit(1)
}
process.exit(0)
