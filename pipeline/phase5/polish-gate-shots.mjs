// Whole pictures in a row of the live pinball page out of the built site, in the browser, at the site's own pixels, for polish-save-sheet.mjs to cut sheets from.
// node pipeline/phase5/polish-gate-shots.mjs --bot never --seed 1 --quality high --at 19.95 --count 53 --keep /home/user/shots/dir
// --bot never is a visitor whose mouse lies at 300, 900 and never moves, as in polish-gate-measure.mjs; --at is the pinball page's own seconds (not the visit's) of the first picture; the pictures are 1/60 s apart. Writes NNN.png and times.json into --keep.
import fs from 'node:fs'
import { openSession } from '../../tools/lib/capture.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? fallback : process.argv[i + 1]
}
const bot = arg('bot', 'never')
const seed = Number(arg('seed', 1))
const at = Number(arg('at', 19))
const count = Number(arg('count', 24))
const quality = arg('quality', 'high')
const keep = arg('keep', '/tmp/polish-gate-shots')
fs.mkdirSync(keep, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `${bot === 'never' ? '' : `&bot=${bot}`}&seed=${seed}&quality=${quality}&clock=steps&step=3` })
const times = []
try {
  await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  if (bot === 'never') await session.page.mouse.move(300, 900)
  let on = await session.page.evaluate(() => window.liveRun.told().pageTime)
  for (let i = 0; i < 8 && at - on > 1 / 480; i++) on = await session.page.evaluate((dt) => { window.liveRun.advance(dt, true); return window.liveRun.told().pageTime }, at - on)
  let s = await session.page.evaluate(() => window.liveRun.state())
  for (let i = 0; i < count; i++) {
    if (i > 0) s = await session.page.evaluate((dt) => window.liveRun.advance(dt), 1 / 60)
    times.push(await session.page.evaluate(() => window.liveRun.told().pageTime))
    fs.writeFileSync(`${keep}/${String(i).padStart(3, '0')}.png`, Buffer.from(s.png.split(',')[1], 'base64'))
  }
  fs.writeFileSync(`${keep}/times.json`, JSON.stringify(times))
} finally {
  await session.close()
}
console.log(`kept ${count} pictures in ${keep}, page ${times[0].toFixed(3)} to ${times[count - 1].toFixed(3)} s, level ${quality}`)
