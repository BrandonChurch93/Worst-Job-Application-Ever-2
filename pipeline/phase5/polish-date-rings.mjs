// Polish date: row 1 pressed on the live site, one picture of the same sixtieth for each thing switched off, to find what draws the dial's rings through the page.
// node pipeline/phase5/polish-date-rings.mjs LABEL LEVEL TICKS OFF...   TICKS sixtieths after the press; OFF is a name the scratch copy's src reads from window.polishDateOff (none: nothing off).
// It runs in a scratch copy: the flags are not in the site.
import fs from 'node:fs'
import path from 'node:path'
import { openSession } from '../../tools/lib/capture.mjs'

const [, , label = 'rings', level = 'high', ticksText = '1', ...offs] = process.argv
const HZ = 60
const FIELD = { x: 1000, w: 792 }
// The top of the first row's field on the page, as the walks found it.
const TOP = 318
const dir = path.join('out', 'work', 'polish-date', label)
fs.mkdirSync(dir, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&clock=steps&quality=${level}&step=2${process.env.POLISH_DATE_QUERY ?? ''}` })
const page = session.page
try {
  await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const tell = (ticks) => page.evaluate((d) => { if (d > 0) window.liveRun.advance(d, true); return window.liveRun.told() }, ticks / HZ)
  const closedAt = (h) => Boolean(h) && Math.abs(h.x - (FIELD.x + FIELD.w / 2)) < 0.01
  if (process.env.POLISH_DATE_FIRST) await page.evaluate((name) => { window.polishDateOff = name }, process.env.POLISH_DATE_FIRST)
  await page.mouse.move(300, 900)
  let t = await tell(0)
  for (let n = 0; n < 40 && !closedAt(t.hint); n++) t = await tell(15)
  await page.mouse.move(FIELD.x + 40, TOP + 12)
  await tell(42)
  await page.mouse.down()
  await tell(1 + Number(ticksText))
  for (const off of offs.length ? offs : ['none']) {
    const png = await page.evaluate((name) => { window.polishDateOff = name; return window.liveRun.state().png }, off)
    fs.writeFileSync(path.join(dir, `${off.replace(/[^a-z0-9.-]/gi, '_')}.png`), Buffer.from(png.split(',')[1], 'base64'))
    console.log(off)
  }
} finally {
  await session.close()
}
