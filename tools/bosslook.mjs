// node tools/bosslook.mjs <set> [--tier draft]: renders look 1 alone from hand-written views and lays each render beside its target.
// Sets: states (turret inside and out beside the two targets), more follow in tools/bosslook-sets.mjs.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at, args } from './lib/paths.mjs'
import { openLook } from './bosslook-lib.mjs'
import { SETS } from './bosslook-sets.mjs'

const a = args()
const names = (a._ && a._.length ? a._ : [a.set || 'states'])
const outDir = at('pipeline', 'change002', 'proof', 'bosslook')
const workDir = at('out', 'work', 'bosslook')
fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(workDir, { recursive: true })
const look = await openLook()
try {
  for (const name of names) {
    const set = SETS[name]
    if (!set) throw new Error(`No set called "${name}". Sets: ${Object.keys(SETS).join(', ')}`)
    const t0 = Date.now()
    const file = await set({ look, sharp, at, outDir, workDir, tier: a.tier || 'draft' })
    console.log(`${name}: ${path.relative(at(), file)} in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
  }
  if (look.problems.length) console.log(`the page reported:\n- ${[...new Set(look.problems)].join('\n- ')}`)
} finally {
  await look.close()
}
