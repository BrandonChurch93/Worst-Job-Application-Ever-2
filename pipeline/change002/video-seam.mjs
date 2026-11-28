// One frame of the span drawn in a fresh session that begins at that frame, as the first frame of a piece rendered apart would be, to compare with the same frame drawn after its neighbours.
//   node pipeline/change002/video-seam.mjs <frame of the span> <tier> <out.png>
import fs from 'node:fs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { scene } from '../../tools/lib/pinball-video-scene.mjs'
import { clock, seconds } from '../../tools/lib/film-encode.mjs'
const [k, tier, out] = process.argv.slice(2)
const sc = await scene()
const base = Math.round(sc.unitStart * sc.fps)
const session = await openSession({ format: 'hd', assets: 'full', mode: 'capture' })
const t0 = clock()
fs.writeFileSync(out, await renderJob(session, { kind: 'film', frame: base + sc.from.frame + Number(k), tier }))
console.log(`frame ${k} of the span at tier ${tier}, first of its session: ${seconds(t0).toFixed(1)} s`)
await session.close()
