// npm run counts: what the renderer draws for one picture, by part.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config } from './lib/paths.mjs'
import { openSession, stillFrom } from './lib/capture.mjs'
import { countsAgree, countsTable } from './lib/gate-counts.mjs'

const a = args()
const c = config()
const { spec, name } = stillFrom({ ...a, tier: a.tier || 'draft' })
const session = await openSession({ format: a.format || 'hd', assets: a.assets || 'web' })
try {
  const counts = await session.page.evaluate(async (s) => {
    window.showcase.setDiagnostic('beauty')
    return window.showcase.countParts(s)
  }, spec)
  const level = spec.live ?? null
  const limit = level && c.perf.maxDrawCalls[level] !== undefined ? c.perf.maxDrawCalls[level] : null
  const what = `${name}, format ${session.format.id}, assets ${session.assets}, ${level ? `level ${level}` : `tier ${spec.tier}`}: one drawing of the scene`
  console.log(countsTable(counts, { limit, what }))
  if (!countsAgree(counts)) console.log(`The rows do not make up what the renderer counted: ${counts.other.calls} calls and ${counts.other.triangles} triangles are in no row`)
  const file = at('out', 'work', 'counts', `${name}-${session.format.id}${level ? `-live-${level}` : ''}.json`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ spec, format: session.format.id, assets: session.assets, ...counts }, null, 2) + '\n')
  console.log(`record: ${path.relative(at(), file)}`)
  process.exitCode = countsAgree(counts) ? 0 : 1
} finally {
  await session.close()
}
