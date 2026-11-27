// node pipeline/phase5/polish-turn2-same.mjs BEFORE_DIR AFTER_DIR: for every picture that both folders hold, whether the two files are equal byte for byte, printed as runs of picture numbers.
import fs from 'node:fs'
import path from 'node:path'

const [before, after] = process.argv.slice(2)
const names = fs.readdirSync(before).filter((f) => f.endsWith('.png') && fs.existsSync(path.join(after, f))).sort()
const runs = []
for (const f of names) {
  const n = Number(/(\d{6})/.exec(f)[1])
  const same = fs.readFileSync(path.join(before, f)).equals(fs.readFileSync(path.join(after, f)))
  const last = runs[runs.length - 1]
  if (last && last.same === same && last.to === n - 1) last.to = n
  else runs.push({ same, from: n, to: n })
}
for (const r of runs) console.log(`${r.from} to ${r.to}: ${r.to - r.from + 1} pictures, ${r.same ? 'equal byte for byte' : 'not equal'}`)
