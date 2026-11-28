// npm run bots: every bot in live.bots, live.botSeeds times each, through the whole live site without rendering.
// Prints for each run whether it finished, how long each step took, the gags it reached and the longest time its control was ignored.
import { args, at, config, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'
import { buildInfo } from './lib/hashes.mjs'

const a = args()
const c = config()
const { load, close } = await logic()
const { runBot } = await load('/src/stage/stage.ts')
const { pages } = await load('/src/pages/index.ts')
const bots = a.bot ? [a.bot] : c.live.bots
const seeds = a.seed !== undefined ? [Number(a.seed)] : Array.from({ length: c.live.botSeeds }, (_, i) => c.seed + i)
const gags = c.film.beats.map((b) => b.id)
const runs = []
const problems = []
for (const bot of bots) {
  for (const seed of seeds) {
    const t0 = process.hrtime.bigint()
    const r = runBot(pages, bot, seed)
    r.wallSeconds = Number((Number(process.hrtime.bigint() - t0) / 1e9).toFixed(2))
    runs.push(r)
    const steps = Object.entries(r.pageSeconds).map(([p, s]) => `${p} ${s.toFixed(1)}`).join(', ')
    console.log(`${r.finished ? 'finished' : 'STUCK'}  ${bot.padEnd(8)} seed ${seed}  ${r.seconds.toFixed(1)} s  pointer ignored ${r.ignoredPointer.toFixed(2)} s  flippers ignored ${r.ignoredFlippers.toFixed(2)} s  skips ${r.skips}  gags ${r.gags.length} of ${gags.length}`)
    console.log(`          steps: ${steps}`)
    if (!r.finished) problems.push(`${bot} seed ${seed}: did not reach the careers page after the rejection within ${c.live.botMaxSeconds} s (stopped on ${r.stuckOn})`)
    if (r.ignoredPointer > c.live.controlTakenMaxSeconds) problems.push(`${bot} seed ${seed}: the pointer was ignored for ${r.ignoredPointer.toFixed(2)} s`)
    if (r.ignoredFlippers > c.live.controlTakenMaxSeconds) problems.push(`${bot} seed ${seed}: the flippers were ignored for ${r.ignoredFlippers.toFixed(2)} s`)
  }
}
const keen = runs.filter((r) => r.bot === 'keen')
const missed = keen.length ? gags.filter((g) => !keen.every((r) => r.gags.includes(g))) : []
if (keen.length) console.log(missed.length ? `keen missed: ${missed.join(', ')}` : `keen reached every one of the ${gags.length} gags on every seed`)
for (const g of missed) problems.push(`keen never reached the gag of ${g} on some seed`)
const built = buildInfo(at())
writeJson(at('out', 'work', 'bots.json'), { made: new Date().toISOString(), engineHash: built.engineHash, pageHashes: built.pageHashes, runs, missed, problems })
for (const p of problems) console.log(`PROBLEM  ${p}`)
console.log(problems.length ? `${problems.length} problem${problems.length === 1 ? '' : 's'}` : 'bots: all clear')
await close()
process.exit(problems.length ? 1 : 0)
