// The way out of the pinball video on the built site: a real press on the skip link at three moments of the video.
// The visit is driven by the mouse, not by a bot: with a bot as the driver a press on the link is not the stage's input and proves nothing.
//   node pipeline/change002/video-skip.mjs [--at 18,26,34] [--out out/work/video-skip]
// For each moment: when the link came on the screen (seconds of the video), the press, the time from the press to the video
// leaving the screen, and a picture just before the press and one after it.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, writeJson } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'

const a = args()
const out = at(...(a.out ? [a.out] : ['out', 'work', 'video-skip']))
fs.mkdirSync(out, { recursive: true })
const moments = String(a.at ?? '18,26,34').split(',').map(Number)

ensureBuild()
const server = await serve(at('dist'))
const { browser, version } = await launch(['--autoplay-policy=no-user-gesture-required'])
const results = []
for (const moment of moments) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto(`${server.url}/index.html?mode=live&step=3&video=trace&quality=low`)
  await page.evaluate(() => window.showcase.ready)
  await page.mouse.move(640, 400)
  await page.waitForFunction(() => window.videoTrace && window.videoTrace.shown >= 0, null, { timeout: 120000 })
  const link = page.getByRole('button', { name: /skip/i })
  await link.waitFor({ state: 'visible', timeout: 120000 })
  const offered = await page.evaluate(() => document.querySelector('video').currentTime)
  await page.waitForFunction((t) => document.querySelector('video').currentTime >= t, moment, { timeout: 120000, polling: 50 })
  await page.screenshot({ path: path.join(out, `before-${moment}.png`) })
  const box = await link.boundingBox()
  const top = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName : null }, [box.x + box.width / 2, box.y + box.height / 2])
  const pressed = await page.evaluate(() => ({ now: performance.now(), clock: document.querySelector('video').currentTime }))
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForFunction(() => window.videoTrace.fell >= 0, null, { timeout: 30000, polling: 'raf' })
  await page.waitForFunction(() => window.videoTrace.left >= 0, null, { timeout: 60000, polling: 'raf' })
  const left = await page.evaluate(() => ({ left: window.videoTrace.left, fell: window.videoTrace.fell, faded: window.videoTrace.faded, opacity: document.querySelector('video').style.opacity, cues: window.videoBridge.cues.length, backing: document.querySelector('[data-backing]')?.dataset.backing ?? null }))
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, `after-${moment}.png`) })
  const row = { pressAtVideoSecond: Number(pressed.clock.toFixed(2)), videoSeconds: Number((await page.evaluate(() => document.querySelector('video').duration)).toFixed(2)), linkOnScreenFromVideoSecond: Number(offered.toFixed(2)), elementUnderThePress: top, pressToVideoStoppedMs: Number((left.fell - pressed.now).toFixed(1)), pressToFadedMs: Number((left.faded - pressed.now).toFixed(1)), pressToVideoGoneMs: Number((left.left - pressed.now).toFixed(1)), videoOpacityAfter: left.opacity, backingOfTheRow: left.backing }
  results.push(row)
  console.log(JSON.stringify(row))
  writeJson(path.join(out, 'skip.json'), { made: new Date().toISOString(), browser: version, results })
  await context.close()
}
await browser.close()
await server.close()
