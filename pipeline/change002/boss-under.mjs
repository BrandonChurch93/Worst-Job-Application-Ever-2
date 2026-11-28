// node pipeline/change002/boss-under.mjs --k 26 --from 48.83 --to 49.52 --every 4 --out /tmp/under
// Pictures of the live site at step 4 with the mouse led by a fixed course: the box ticked, one press while the boss forms, then a visitor who keeps under the health bar.
// One picture every `every` steps between the two seconds. The course is boss-under-policy.mjs, the same one the logic can be run with.
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'
import { policy } from './boss-under-policy.mjs'

const a = args()
const out = String(a.out ?? '/tmp/under')
const from = Number(a.from)
const to = Number(a.to)
const every = Number(a.every ?? 4)
const hz = 240
const socket = { x: Number(a.sx ?? 960), y: Number(a.sy ?? 540) }
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'preview', assets: 'web', mode: 'live', query: '&clock=steps&step=4' })
try {
  const page = session.page
  const size = page.viewportSize()
  const first = await page.evaluate(() => { const t = window.liveRun.told(); return { time: t.time, hint: t.hint } })
  const p = policy(Number(a.k ?? 26))
  let was = { x: -1, y: -1, down: false }
  const steps = Math.round(to * hz)
  const start = Math.round(from * hz)
  for (let i = 0; i < steps; i++) {
    const now = p(i / hz, first.hint, socket)
    if (now.x !== was.x || now.y !== was.y) await page.mouse.move((now.x / 1920) * size.width, (now.y / 1080) * size.height)
    if (now.down !== was.down) await (now.down ? page.mouse.down() : page.mouse.up())
    was = now
    const shown = i + 1 >= start && (i + 1 - start) % every === 0
    const s = await page.evaluate(([dt, quiet]) => { const r = window.liveRun.advance(dt, quiet); const t = window.liveRun.told(); return { time: r.time, page: r.page, png: r.png, hits: t.hits, gags: t.gags } }, [1 / hz, !shown])
    if (shown) fs.writeFileSync(path.join(out, `s${String(i + 1).padStart(6, '0')}.png`), Buffer.from(s.png.split(',')[1], 'base64'))
    if (i + 1 === steps || s.page !== 'step4') {
      console.log(`${s.time.toFixed(3)} s ${s.page} gags ${s.gags.join(' ')} hits ${s.hits.map((h) => `${h.name} ${h.time.toFixed(3)}`).join(', ')}`)
      break
    }
  }
} finally {
  await session.close()
}
