// node pipeline/change002/camera-frames.mjs --frames 11040,11100 --out /tmp/cam [--tier draft] [--cam '{"eye":[..],"target":[..],"fov":30}'] [--name tag] [--page true]
// Film frames at 1920 by 1080, one file each. `--cam` is read only by a build that has the look hook in the page's view(); the committed page has none.
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'

const a = args()
const out = String(a.out ?? '/tmp/cam')
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'full' })
try {
  if (a.cam) await session.page.evaluate((c) => { globalThis.__cam = c }, JSON.parse(String(a.cam)))
  const from = Number(a.from)
  const list = a.frames ? String(a.frames).split(',').map(Number) : Array.from({ length: Number(a.count ?? 12) }, (_, i) => from + i * Number(a.every ?? 1))
  for (const frame of list) {
    const t0 = Date.now()
    const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
    fs.writeFileSync(path.join(out, `${a.name ? a.name + '-' : ''}f${String(frame).padStart(6, '0')}.png`), png)
    if (a.page) fs.writeFileSync(path.join(out, `${a.name ? a.name + '-' : ''}f${String(frame).padStart(6, '0')}-page.png`), await session.page.screenshot())
    console.log(`frame ${frame} ${Date.now() - t0} ms`)
  }
  if (session.problems.length) console.log(session.problems.slice(0, 5).join('\n'))
} finally {
  await session.close()
}
