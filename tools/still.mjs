// npm run still: one still in out/work/stills/, with its record beside it.
import path from 'node:path'
import { args, at } from './lib/paths.mjs'
import { openSession, still } from './lib/capture.mjs'
import { addLook } from './lib/looks.mjs'

const a = args()
const session = await openSession({ format: a.format || 'hd', assets: a.assets || 'full', target: a.target || null })
try {
  const out = await still(session, a, { force: Boolean(a.force) })
  const r = out.record
  if (!out.reused) addLook(out.file, `Still ${path.basename(out.file, '.png')}: ${r.tier} tier, ${r.format}, view ${r.diagnostic}`)
  console.log(`${out.reused ? 'reused' : 'rendered'}: ${path.relative(at(), out.file)}`)
  console.log(`format ${r.format}, tier ${r.tier}, assets ${r.assets}, view ${r.diagnostic}, ${r.seconds} s, invalid values ${r.invalidValues}, triangles ${r.counts ? r.counts.triangles : '?'}, draw calls ${r.counts ? r.counts.drawCalls : '?'}`)
  if (r.standIns && r.standIns.length) console.log(`stand-ins: ${r.standIns.map((s) => `${s.name} (${s.unit})`).join(', ')}`)
  if (r.problems && r.problems.length) console.log(`the page reported:\n- ${[...new Set(r.problems)].join('\n- ')}`)
} finally {
  await session.close()
}
