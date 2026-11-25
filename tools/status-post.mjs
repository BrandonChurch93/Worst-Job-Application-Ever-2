// Posts a status written by hand: npm run status:post -- --phase N --number K --spec FILE.json
// The spec holds { lines: [...], pictures: [{ file, caption, name?, by? }], links: [...] }.
// In a line, {phaseTime} and {runTime} are replaced with what the clock prints at this tick.
// `npm run status` (the harness) chooses the pictures itself and then calls the same writer.
import { execFileSync } from 'node:child_process'
import { args, at, readJson } from './lib/paths.mjs'
import { writeStatus } from './lib/status-core.mjs'

const a = args()
if (!a.spec || a.phase === undefined || !a.number) {
  console.error('status:post: --phase N --number K --spec FILE.json')
  process.exit(1)
}
const spec = readJson(a.spec)
const tick = execFileSync('node', [at('tools', 'clock.mjs'), '--phase', String(a.phase), '--status'], { encoding: 'utf8' })
const find = (re) => (tick.match(re) ?? [, 'not printed'])[1]
const phaseTime = find(/^time used in this phase: (.+)$/m)
const runTime = find(/^time used: (.+)$/m)
const time = find(/tick \d+ at (\S+),/)
const lines = spec.lines.map((l) => l.replaceAll('{phaseTime}', phaseTime).replaceAll('{runTime}', runTime))
const { galleryFile, shown } = writeStatus({ number: Number(a.number), phase: a.phase, time, lines, pictures: spec.pictures, links: spec.links ?? [] })
console.log(tick.trim())
console.log('')
for (const l of lines) console.log(l)
for (const s of shown) console.log(`picture: out/stills/status/${s.name} (${s.w}x${s.h}) ${s.caption}`)
for (const l of spec.links ?? []) console.log(l)
console.log(`gallery: ${galleryFile}`)
