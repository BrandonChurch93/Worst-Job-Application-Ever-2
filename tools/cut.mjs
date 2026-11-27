// npm run cut: the cut list, the cue sheet and the shot list of the film, from the whole film run in film mode. No browser.
// Writes cut/CUTLIST.json, cut/CUES.md and cut/SHOTS.md. Exits 1 when a beat's event falls outside its beat.
// --check writes nothing and exits 1 as well when a file of cut/ is not what this build gives.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'
import { cutOfBuild, cutState } from './lib/cut-build.mjs'

const a = args()
const { load, close } = await logic()
const { list, problems, files } = await cutOfBuild(load)

const withEvent = list.beats.filter((b) => b.event)
const inside = withEvent.filter((b) => b.event.inside)
const cued = list.events.filter((e) => e.cue !== null)
const takes = list.lines.filter((l) => l.length === 'take')
console.log(`cut: film B is ${list.frameCount} frames (${list.seconds} s) in ${list.units.length} units and ${list.beats.length} beats`)
console.log(`cut: ${inside.length} of ${withEvent.length} beat events fell inside their beat, give or take ${list.beatToleranceFrames} frames`)
console.log(`cut: ${list.events.length} events, ${cued.length} with a cue; ${list.lines.length} narrator lines, ${takes.length} with a kept take`)
console.log(`cut: the opening of film A is ${list.opening.frameCount} frames (${list.opening.seconds} s), the card loop ${list.loop.frameCount} frames of ${list.loop.scene}`)

let behind = 0
if (a.check) {
  for (const { name, state } of cutState(files)) {
    if (state === 'absent') console.log(`cut: ${name} does not exist yet (npm run cut)`)
    else if (state === 'stale') console.log(`cut: ${name} is not what the film gives now (npm run cut)`)
    else console.log(`cut: ${name} is up to date`)
    if (state !== 'equal') behind++
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
if (behind) console.log(`cut: ${behind} of the ${files.length} files of cut/ ${behind === 1 ? 'is' : 'are'} not of this build. No mix is laid by them and no film is joined with such a mix`)
await close()
process.exit(problems.length || behind ? 1 : 0)
