// node pipeline/change002/boss-frames.mjs --from 8950 --count 12 --every 3 --out /tmp/frames [--tier draft], or --frames 8950,9010,9100
// Film frames at the size of the film (1920 by 1080), one file each, to cut close pictures from.
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'

const a = args()
const from = Number(a.from)
const count = Number(a.count ?? 12)
const every = Number(a.every ?? 1)
const out = String(a.out ?? '/tmp/frames')
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'full' })
try {
  const list = a.frames ? String(a.frames).split(',').map(Number) : Array.from({ length: count }, (_, i) => from + i * every)
  for (const frame of list) {
    const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
    fs.writeFileSync(path.join(out, `f${String(frame).padStart(6, '0')}.png`), png)
    console.log(`frame ${frame}`)
  }
} finally {
  await session.close()
}
