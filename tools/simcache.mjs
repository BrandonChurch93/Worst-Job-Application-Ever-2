// npm run simcache: the simulation's checkpoints along the film, under out/work/simcache/. --check replays from each to the next.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { logic } from './lib/logic.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { checkpointsOf, fileOf, readCheckpoint, readIndex, replay, sameBuild } from './lib/film-simcache.mjs'

const a = args()
const t0 = clock()
const say = (line) => console.log(`simcache: ${line}`)
const stop = (line, code = 1) => {
  console.error(`simcache: ${line}`)
  process.exit(code)
}
const cfg = config()
const dir = at('out', 'work', 'simcache')
const rel = (p) => path.relative(at(), p)
const info = buildInfo(at())
const firstOf = {}
let first = 0
for (const u of cfg.film.units) {
  firstOf[u.id] = first
  first += Math.round(u.seconds * cfg.film.fps)
}

let site
try {
  site = await logic()
} catch (e) {
  stop(`the site's logic could not be loaded into Node: ${String(e.message).split('\n')[0]}`)
}
const S = await site.load('/src/stage/stage.ts')
const { pages } = await site.load('/src/pages/index.ts')

if (a.check) {
  const index = readIndex(dir)
  if (!index) {
    await site.close()
    stop(`there is no ${rel(path.join(dir, 'index.json'))}: run npm run simcache first`)
  }
  const current = sameBuild(index, info)
  const rows = []
  const bad = []
  for (const u of cfg.film.units) {
    const list = index.checkpoints.filter((c) => c.unit === u.id).sort((x, y) => x.step - y.step)
    for (let i = 0; i < list.length; i++) {
      const from = list[i]
      const to = list[i + 1]
      const fromText = readCheckpoint(dir, from)
      const toText = to ? readCheckpoint(dir, to) : null
      const row = { unit: u.id, file: from.file, frame: from.frame, step: from.step, onDisk: fromText !== null, next: to ? to.file : null, equal: null }
      if (fromText === null) bad.push(`${from.file} is gone or is not the file the index names`)
      else if (to && toText !== null) {
        const r = replay(S, pages, u.id, { step: from.step, text: fromText }, { step: to.step, text: toText })
        row.equal = r.equal && r.startEqual
        if (!r.startEqual) bad.push(`${from.file}: the state loaded from it is not the state it holds`)
        if (!r.equal) bad.push(`${from.file}: the replay to step ${to.step} of ${u.id} does not reach ${to.file} byte for byte`)
      }
      rows.push(row)
    }
  }
  await site.close()
  const equal = rows.filter((r) => r.equal === true).length
  const pairs = rows.filter((r) => r.next).length
  for (const u of cfg.film.units) {
    const mine = rows.filter((r) => r.unit === u.id && r.next)
    say(`${u.id}: ${mine.filter((r) => r.equal === true).length} of ${mine.length} replays reach the next checkpoint byte for byte`)
  }
  for (const line of bad) say(line)
  if (!current) say('the checkpoints are of another build than the source now: run npm run simcache again before a render uses them')
  const out = at('out', 'work', 'simcache-check.json')
  writeJson(out, { ofThisBuild: current, checkpoints: rows.length, replays: pairs, equal, problems: bad, rows })
  say(`${equal} of ${pairs} replays byte equal, ${rows.length} checkpoints read. Wrote ${rel(out)} in ${took(seconds(t0))}`)
  process.exit(bad.length || !current ? 2 : 0)
}

fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const checkpoints = []
let bytes = 0
for (const u of cfg.film.units) {
  const t = clock()
  let made
  try {
    made = checkpointsOf(S, pages, u, cfg, firstOf[u.id])
  } catch (e) {
    await site.close()
    stop(`${u.id} could not be run: ${String(e.message).split('\n')[0]}`)
  }
  for (const c of made) {
    const file = fileOf(c.unit, c.frame, c.step)
    fs.writeFileSync(path.join(dir, file), c.text)
    checkpoints.push({ unit: c.unit, page: c.page, why: c.why, step: c.step, frame: c.frame, seconds: c.frame / cfg.film.fps, file, sha256: c.sha256, bytes: c.bytes })
    bytes += c.bytes
  }
  say(`${u.id}: ${made.length} checkpoints, ${made.filter((c) => c.why === 'page').length} at the start of a page, ${(made.reduce((n, c) => n + c.bytes, 0) / 1024).toFixed(0)} KB, in ${took(seconds(t))}`)
}
await site.close()
const index = { engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes: info.pageHashes, stepHz: cfg.sim.stepHz, fps: cfg.film.fps, checkpointSeconds: cfg.sim.checkpointSeconds, frameCount: first, units: firstOf, checkpoints }
writeJson(path.join(dir, 'index.json'), index)
say(`wrote ${checkpoints.length} checkpoints and index.json under ${rel(dir)}, ${(bytes / 1048576).toFixed(2)} MB, in ${took(seconds(t0))}`)
