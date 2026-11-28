// node pipeline/change002/boss-leave.mjs --out /tmp/leave [--from 65.7375] [--max 200]
// The live build at step 4 under a real mouse that follows the page's own hint, step by step, to the blow on Submit and on to the next page.
// From the second `from` one picture every 8 steps (a 30th of a second), named by the steps since then, until the page is no longer step 4. Prints the second of the page's change and the first step the slab turns.
// Without `from` it takes no picture and only prints: the blow is `LAST.held` and half a turn before the change.
import fs from 'node:fs'
import path from 'node:path'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const out = String(a.out ?? '/tmp/leave')
const max = Number(a.max ?? 200)
const hz = 240
fs.mkdirSync(out, { recursive: true })
const session = await openSession({ format: 'preview', assets: 'web', mode: 'live', query: '&clock=steps&step=4' })
console.log('open')
try {
  const page = session.page
  const size = page.viewportSize()
  let told = await page.evaluate(() => { const t = window.liveRun.told(); return { hint: t.hint, hits: t.hits, page: t.page, time: t.time } })
  let was = { x: -1, y: -1, down: false }
  let pressed = a.from === undefined ? -1 : Math.round(Number(a.from) * hz)
  let turned = -1
  for (let i = 0; i < max * hz; i++) {
    const h = told.hint ?? was
    const to = h.dodge ?? h
    if (to.x !== was.x || to.y !== was.y) await page.mouse.move((to.x / 1920) * size.width, (to.y / 1080) * size.height)
    if (Boolean(h.down) !== was.down) await (h.down ? page.mouse.down() : page.mouse.up())
    was = { x: to.x, y: to.y, down: Boolean(h.down) }
    const shown = pressed >= 0 && i + 1 >= pressed && (i + 1 - pressed) % 8 === 0
    const s = await page.evaluate(([dt, quiet]) => { const r = window.liveRun.advance(dt, quiet); const t = window.liveRun.told(); return { time: r.time, page: r.page, png: r.png, hits: t.hits, hint: t.hint, turning: t.turning } }, [1 / hz, !shown])
    told = s
    if (turned < 0 && s.turning && s.time > 20) turned = i + 1
    if (shown && s.page === 'step4') fs.writeFileSync(path.join(out, `p${String(i + 1 - pressed).padStart(3, '0')}.png`), Buffer.from(s.png.split(',')[1], 'base64'))
    if (s.page !== 'step4') {
      console.log(`page ${s.page} at ${s.time.toFixed(4)} s (step ${i + 1}); the slab turns from step ${turned} (${(turned / hz).toFixed(4)} s)`)
      break
    }
  }
} finally {
  await session.close()
}
