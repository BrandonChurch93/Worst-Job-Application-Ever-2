// npm run cut: the cut list, the cue sheet and the shot list of the film, from the whole film run in film mode. No browser.
// Writes cut/CUTLIST.json, cut/CUES.md and cut/SHOTS.md. Exits 1 when a beat's event falls outside its beat. --check writes nothing.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, readJson, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'

const a = args()
const { load, close } = await logic()
const { makeCut, cuesText, shotsText } = await load('/src/film/cut.ts')
const { pages } = await load('/src/pages/index.ts')

const keptDir = at('audio', 'kept')
const kept = fs.existsSync(keptDir)
  ? fs.readdirSync(keptDir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ file: `audio/kept/${f}`, record: readJson(path.join(keptDir, f)) }))
  : []

const { list, shots, problems } = makeCut(pages, kept)
const files = [
  ['cut/CUTLIST.json', JSON.stringify(list, null, 2) + '\n'],
  ['cut/CUES.md', cuesText(list)],
  ['cut/SHOTS.md', shotsText(list, shots)]
]

const withEvent = list.beats.filter((b) => b.event)
const inside = withEvent.filter((b) => b.event.inside)
const cued = list.events.filter((e) => e.cue !== null)
const takes = list.lines.filter((l) => l.length === 'take')
console.log(`cut: film B is ${list.frameCount} frames (${list.seconds} s) in ${list.units.length} units and ${list.beats.length} beats`)
console.log(`cut: ${inside.length} of ${withEvent.length} beat events fell inside their beat, give or take ${list.beatToleranceFrames} frames`)
console.log(`cut: ${list.events.length} events, ${cued.length} with a cue; ${list.lines.length} narrator lines, ${takes.length} with a kept take`)
console.log(`cut: the opening of film A is ${list.opening.frameCount} frames (${list.opening.seconds} s), the card loop ${list.loop.frameCount} frames of ${list.loop.scene}`)

if (a.check) {
  for (const [name, text] of files) {
    const file = at(...name.split('/'))
    if (!fs.existsSync(file)) console.log(`cut: ${name} does not exist yet (npm run cut)`)
    else if (fs.readFileSync(file, 'utf8') !== text) console.log(`cut: ${name} is not what the film gives now (npm run cut)`)
    else console.log(`cut: ${name} is up to date`)
  }
} else {
  for (const [name, text] of files) {
    const file = at(...name.split('/'))
    if (name.endsWith('.json')) writeJson(file, list)
    else {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, text)
    }
    console.log(`cut: wrote ${name}`)
  }
}
for (const p of problems) console.log(`PROBLEM  ${p}`)
console.log(problems.length ? `cut: ${problems.length} problem${problems.length === 1 ? '' : 's'}` : 'cut: every beat\'s event fell inside its beat')
await close()
process.exit(problems.length ? 1 : 0)
