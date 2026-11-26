import fs from 'node:fs'
import path from 'node:path'
import { config, readJson } from '../../tools/lib/paths.mjs'
import { replay } from '../../tools/lib/pack-site.mjs'

const [file, first, count, out] = process.argv.slice(2)
const run = readJson(file)
const steps = Array.from({ length: Number(count) }, (_, i) => Number(first) + i)
const got = await replay(config(), run, steps, { log: (line) => console.log(line) })
fs.mkdirSync(out, { recursive: true })
for (const [i, png] of got) fs.writeFileSync(path.join(out, `row-${i}.png`), png)
console.log(`wrote ${got.size} pictures`)
