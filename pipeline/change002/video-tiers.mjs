// The film's own frame of the join in at the tiers named, as PNG in /tmp, to compare their light.
//   node pipeline/change002/video-tiers.mjs draft review final
import fs from 'node:fs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { scene } from '../../tools/lib/pinball-video-scene.mjs'
const sc = await scene()
const base = Math.round(sc.unitStart * sc.fps)
const session = await openSession({ format: 'hd', assets: 'full', mode: 'capture' })
for (const tier of process.argv.slice(2)) fs.writeFileSync(`/tmp/f0-${tier}.png`, await renderJob(session, { kind: 'film', frame: base + sc.from.frame, tier }))
await session.close()
