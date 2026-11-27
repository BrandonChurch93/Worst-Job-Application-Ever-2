// node pipeline/phase5/pack-whole-walk.mjs OUT.json: walks the pack's visitor once through the built live site, without drawing, and keeps the run.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { walk } from '../../tools/lib/pack-site.mjs'

const out = process.argv[2]
if (!out) throw new Error('give the file to write the run into')
const run = await walk(config(), (line) => console.log(line))
fs.writeFileSync(out, JSON.stringify(run) + '\n')
console.log(`run: finished ${run.finished}, ${run.steps} steps, ${run.seconds} s, ${run.gags.length} gags, ${run.hits.length} hits, problems ${run.problems.length}`)
