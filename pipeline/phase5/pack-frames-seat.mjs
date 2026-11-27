// node pipeline/phase5/pack-frames-seat.mjs RUN.json OUT_DIR FROM TO: draws every step FROM to TO of a recorded visit once more, at one pixel of the picture to one of the 1920 by 1080 page, into OUT_DIR.
// The pack's own cache is not touched.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { replay } from '../../tools/lib/pack-site.mjs'

const [file, out, from, to] = process.argv.slice(2)
const run = JSON.parse(fs.readFileSync(file, 'utf8'))
const steps = []
for (let i = Number(from); i <= Number(to); i++) steps.push(i)
const got = await replay(config(), run, steps, { cache: out, px: 2, log: (l) => console.log(l) })
console.log(`pictures: ${got.size} of steps ${from} to ${to} in ${out}`)
