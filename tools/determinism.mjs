// npm run determinism: the same pictures on two fresh page loads, the second in the opposite order, compared pixel for pixel.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, writeJson } from './lib/paths.mjs'
import { openSession, recordFor, renderJob } from './lib/capture.mjs'
import { difference, rawOf } from './lib/image.mjs'

const a = args()
const c = config()
const format = a.format || 'hd'
const tier = a.tier || 'draft'
const jobs = []
let start = 0
for (const u of c.film.units) {
  jobs.push({ id: `still-${u.id}`, kind: 'still', spec: { page: u.id, camera: 'home', tier } })
  jobs.push({ id: `film-${u.id}`, kind: 'film', frame: Math.round((start + u.seconds * 0.85) * c.film.fps), tier })
  start += u.seconds
}
const only = a.only ? String(a.only).split(',') : null
const list = only ? jobs.filter((j) => only.includes(j.id)) : jobs

async function run(name, order) {
  const session = await openSession({ format, assets: a.assets || 'full' })
  const dir = at('out', 'work', 'determinism', name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  try {
    for (const job of order) fs.writeFileSync(path.join(dir, `${job.id}.png`), await renderJob(session, job))
    return { dir, record: recordFor(session, { units: c.film.units.map((u) => u.id), tier, diagnostic: 'beauty', what: { determinism: list.map((j) => j.id) } }), problems: [...new Set(session.problems)] }
  } finally {
    await session.close()
  }
}

const first = await run('a', list)
const second = await run('b', [...list].reverse())
let failed = 0
const results = []
for (const job of list) {
  const d = difference(await rawOf(path.join(first.dir, `${job.id}.png`)), await rawOf(path.join(second.dir, `${job.id}.png`)))
  const same = d.sameSize && d.pixels === 0
  if (!same) failed++
  results.push({ id: job.id, same, pixels: d.pixels, largest: d.largest })
  console.log(`${same ? 'same' : 'DIFFERS'}  ${job.id}${same ? '' : `: ${d.pixels} pixels differ, the largest difference is ${d.largest} of 255`}`)
}
for (const p of first.problems) console.log(`the page reported: ${p}`)
writeJson(at('out', 'work', 'determinism', 'report.json'), { ...first.record, results, pass: failed === 0 })
console.log(failed === 0 ? `determinism: pass, ${list.length} pictures at ${format}, tier ${tier}, identical across two fresh loads and two orders` : `determinism: FAIL, ${failed} of ${list.length} pictures differ`)
process.exit(failed === 0 ? 0 : 1)
