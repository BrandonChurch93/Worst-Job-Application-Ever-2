// npm run retime: sets the start of each narrator line in the film from the film's own events.
// The start is `at`, a share of the line's beat, in content/narration.json and, for a draft, in content/narration-drafts.json. No words are touched.
// --check writes nothing and exits 1 when a start is not what the film gives. Either way it exits 1 when the film's times leave no honest place for a line.
import fs from 'node:fs'
import { args, at, readJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'
import { cutOfBuild } from './lib/cut-build.mjs'

const a = args()
const { load, close } = await logic()
const { list } = await cutOfBuild(load)
const { lineStarts } = await load('/src/film/retime.ts')
const { lines, problems, notes } = lineStarts(list.events)

let behind = 0
for (const [draft, name] of [[false, 'content/narration.json'], [true, 'content/narration-drafts.json']]) {
  const file = at(...name.split('/'))
  const json = readJson(file)
  let changed = 0
  let kept = 0
  for (const l of lines.filter((x) => x.draft === draft)) {
    const line = json.film?.[l.beat]?.[Number(l.key.slice(l.key.lastIndexOf('.') + 1))]
    if (!line) {
      problems.push(`the line ${l.key} is not in ${name}`)
      continue
    }
    const waits = l.waited > 1e-6 ? `, ${l.waited.toFixed(3)} s after ${l.event ?? 'the line before it'}` : ''
    console.log(`retime: ${l.key}${draft ? ' (draft)' : ''} on ${l.event ?? 'no event'}: ${l.start.toFixed(3)} to ${l.end.toFixed(3)} s${waits}, at ${line.at}${line.at === l.at ? '' : ` -> ${l.at}`}`)
    // A start that falls outside its beat is a fault of the film's times, named below: the line keeps the start it had.
    if (!l.inside) {
      kept++
      continue
    }
    if (line.at !== l.at) changed++
    line.at = l.at
  }
  behind += changed
  if (changed && !a.check) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n')
    console.log(`retime: wrote ${name}, ${changed} starts changed`)
  } else console.log(`retime: ${name}: ${changed ? `${changed} starts are not what the film gives (npm run retime)` : 'every start that has a place is what the film gives'}`)
  if (kept) console.log(`retime: ${name}: ${kept} ${kept === 1 ? 'line keeps' : 'lines keep'} the start it had, for the faults below`)
}
for (const n of notes) console.log(`retime: note: ${n}`)
for (const p of problems) console.log(`retime: FAULT: ${p}`)
await close()
process.exit(problems.length || (a.check && behind) ? 1 : 0)
