// node pipeline/change002/boss-bots.mjs [--seeds 200] [--bots keen,keen~,clumsy,clumsy~,random,still,absent] [--max 240] [--json out/work/boss-bots.json]
// Step 4 alone, played by each kind of visitor on many seeds, without rendering. Prints for each kind: the share that wins, the fight's length (shortest, middle, longest),
// the flattenings, the health the boss won back, and the darts that met the shield against the darts that got round it.
// keen and clumsy are the stage's own bots. random is the stage's random bot without the skip link. still walks to the fight as keen does, then stands where it is and clicks four times a second.
// absent never moves and never clicks.
// keen~ and clumsy~ follow the same hint with a hand that differs by seed: its speed, how late it is, how often it clicks (the stage's keen and clumsy play the same fight on every seed).
import { args, at, writeJson } from '../../tools/lib/paths.mjs'
import { logic } from '../../tools/lib/logic.mjs'

const a = args()
const seeds = Number(a.seeds ?? 200)
const kinds = String(a.bots ?? 'keen,keen~,clumsy,clumsy~,random,still,absent').split(',')
const maxSeconds = Number(a.max ?? 240)
const { load, close } = await logic()
const { Stage } = await load('/src/stage/stage.ts')
const { BotDriver } = await load('/src/stage/bots.ts')
const { pages } = await load('/src/pages/index.ts')
const { stepHz } = await load('/src/config.ts')

const FIGHT = ['boss.slabs', 'boss.popups', 'boss.lastStand']
function driver(kind, seed) {
  if (kind === 'keen' || kind === 'clumsy') return new BotDriver(kind, seed)
  if (kind === 'random') {
    const d = new BotDriver('random', seed)
    return { name: 'bot', input: (v) => ({ ...d.input(v), skip: false }) }
  }
  if (kind === 'still') {
    const d = new BotDriver('keen', seed)
    let held = null
    return {
      name: 'bot',
      input(v) {
        if (!FIGHT.includes(v.page.gag())) return d.input(v)
        if (!held) held = { x: v.cursor.x, y: v.cursor.y }
        return { x: held.x, y: held.y, down: Math.floor(v.time * 8) % 2 === 0 }
      }
    }
  }
  if (kind === 'keen~' || kind === 'clumsy~') {
    const r = rng(seed * 7919 + (kind === 'keen~' ? 1 : 2))
    const span = kind === 'keen~' ? { speed: [1300, 2600], lag: [0.02, 0.16], rate: [2.2, 5] } : { speed: [380, 700], lag: [0.16, 0.42], rate: [1.2, 2.6] }
    const pick = (q) => q[0] + (q[1] - q[0]) * r()
    const speed = pick(span.speed)
    const lag = Math.round(pick(span.lag) * stepHz)
    const rate = pick(span.rate)
    const d = new BotDriver('keen', seed)
    const seen = []
    let x = 960
    let y = 540
    let want = -1
    return {
      name: 'bot',
      input(v) {
        if (!FIGHT.includes(v.page.gag())) {
          const o = d.input(v)
          x = o.x
          y = o.y
          return o
        }
        const h = v.page.hint()
        seen.push(h ? { x: (kind === 'keen~' && h.dodge ? h.dodge : h).x, y: (kind === 'keen~' && h.dodge ? h.dodge : h).y, hx: h.x, hy: h.y, down: h.down } : null)
        const late = seen.length > lag ? seen.shift() : null
        if (!late) return { x, y, down: false }
        const dx = late.x - x
        const dy = late.y - y
        const far = Math.hypot(dx, dy)
        const max = speed / stepHz
        if (far <= max) {
          x = late.x
          y = late.y
        } else {
          x += (dx / far) * max
          y += (dy / far) * max
        }
        if (late.down) want = v.time + 0.34
        const near = Math.hypot(late.hx - x, late.hy - y) <= 60
        return { x, y, down: near && v.time < want && Math.floor(v.time * rate * 2) % 2 === 0 }
      }
    }
  }
  return { name: 'bot', input: () => ({ x: 700, y: 820, down: false }) }
}
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const mid = (list) => [...list].sort((x, y) => x - y)[Math.floor(list.length / 2)]
const out = {}
for (const kind of kinds) {
  const rows = []
  for (let seed = 1; seed <= seeds; seed++) {
    const stage = new Stage({ mode: 'live', flow: [{ page: 'step4' }, { page: 'step5' }], pages, driver: driver(kind, seed), seed })
    let from = -1
    let to = -1
    const limit = Math.round((maxSeconds + 40) * stepHz)
    while (stage.page.id === 'step4' && stage.step < limit && to < 0) {
      stage.advance(12)
      if (from < 0 && FIGHT.includes(stage.page.gag())) from = stage.step
      const down = stage.events.find((e) => e.name === 'power-down')
      if (down) to = down.step
      if (from >= 0 && (stage.step - from) / stepHz > maxSeconds) break
    }
    const count = (name) => stage.events.filter((e) => e.name === name).length
    const fight = stage.page.save().fight
    rows.push({ seed, won: to >= 0, seconds: to >= 0 ? (to - from) / stepHz : null, health: fight ? fight.health : null, flat: count('flatten'), heals: count('boss-heal'), healed: fight ? fight.healed : 0, glance: count('shield-glance'), round: count('shot-round'), tells: count('cannon-tell'), moves: count('boss-move'), weak: count('weak-tell'), by: fight ? fight.by : [0, 0, 0, 0], big: count('big-fire') })
  }
  const won = rows.filter((r) => r.won)
  const secs = won.map((r) => r.seconds)
  const line = {
    kind, seeds, wins: won.length, share: won.length / seeds,
    seconds: secs.length ? { least: Math.min(...secs), middle: mid(secs), most: Math.max(...secs) } : null,
    flat: { least: Math.min(...rows.map((r) => r.flat)), middle: mid(rows.map((r) => r.flat)), most: Math.max(...rows.map((r) => r.flat)) },
    healed: { middle: mid(rows.map((r) => r.healed)), most: Math.max(...rows.map((r) => r.healed)) },
    glance: mid(rows.map((r) => r.glance)), round: mid(rows.map((r) => r.round)), weak: mid(rows.map((r) => r.weak)),
    by: [0, 1, 2, 3].map((i) => rows.reduce((n, r) => n + r.by[i], 0) / seeds),
    left: won.length < seeds ? { least: Math.min(...rows.filter((r) => !r.won).map((r) => r.health)), most: Math.max(...rows.filter((r) => !r.won).map((r) => r.health)) } : null
  }
  out[kind] = { line, rows }
  const s = line.seconds
  console.log(`${kind.padEnd(7)} wins ${won.length} of ${seeds}  fight ${s ? `${s.least.toFixed(1)} / ${s.middle.toFixed(1)} / ${s.most.toFixed(1)} s` : 'never won'}  flattened ${line.flat.least} / ${line.flat.middle} / ${line.flat.most}  healed ${line.healed.middle.toFixed(1)} middle, ${line.healed.most.toFixed(1)} most  on the shield ${line.glance}, round it ${line.round} (middle)  weak tells ${line.weak}  hit by the boss's guns ${line.by[0].toFixed(1)}, a corner cannon ${line.by[1].toFixed(1)}, the body ${line.by[2].toFixed(1)}, the big blast ${line.by[3].toFixed(1)} (mean)${line.left ? `  boss health left when not won ${line.left.least.toFixed(1)} to ${line.left.most.toFixed(1)} after ${maxSeconds} s` : ''}`)
}
if (a.json) writeJson(at(String(a.json)), out)
await close()
