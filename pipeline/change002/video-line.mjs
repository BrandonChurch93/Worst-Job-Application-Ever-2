// The preload of the pinball video on the built site, on lines of named speeds.
//   node pipeline/change002/video-line.mjs [--rates 0,20,8,4] [--out out/work/video-line]
// A whole visit by the keen bot from step 1 at the real clock. For each speed (megabits a second down, 0 is the line as it is):
// when the fetch of the file began and ended, when the page reached the join in, how many steps it held for a video not ready,
// and whether the video played or the page played the table itself.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, writeJson } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'

const a = args()
const out = at(...(a.out ? [a.out] : ['out', 'work', 'video-line']))
fs.mkdirSync(out, { recursive: true })
const rates = String(a.rates ?? '0,20,8,4').split(',').map(Number)
const query = `mode=live&bot=keen&seed=1&video=trace&quality=low${a.step ? `&step=${a.step}` : ''}`

ensureBuild()
const server = await serve(at('dist'))
const { browser, version } = await launch(['--autoplay-policy=no-user-gesture-required'])
const results = []
for (const rate of rates) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  if (rate > 0) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: rate >= 8 ? 40 : 150, downloadThroughput: (rate * 1e6) / 8, uploadThroughput: (rate * 1e6) / 16 })
  await page.goto(`${server.url}/index.html?${query}`)
  await page.evaluate(() => window.showcase.ready)
  await page.waitForFunction(() => window.videoTrace && (window.videoTrace.asked >= 0 || window.videoBridge.gaveUp), null, { timeout: 400000, polling: 250 })
  const r = await page.evaluate(() => {
    const list = performance.getEntriesByType('resource').filter((x) => /pinball[^/]*\.part/.test(x.name))
    const e = list.length ? { startTime: Math.min(...list.map((x) => x.startTime)), responseEnd: Math.max(...list.map((x) => x.responseEnd)), size: list.reduce((n, x) => n + (x.encodedBodySize || x.transferSize), 0) } : null
    const t = window.videoTrace
    return { now: performance.now(), pieces: list.length, fetchStart: e ? e.startTime : null, fetchEnd: e ? e.responseEnd : null, bytes: e ? e.size : null, loaded: t.loaded, asked: t.asked, waits: t.waits, gaveUp: Boolean(window.videoBridge.gaveUp) }
  })
  const s = (v) => (v === null || v < 0 ? null : Number((v / 1000).toFixed(2)))
  const row = {
    megabits: rate || 'unlimited', pieces: r.pieces, fetchBeganS: s(r.fetchStart), fetchEndedS: s(r.loaded), megabytes: r.bytes ? Number((r.bytes / 1048576).toFixed(2)) : null,
    joinS: r.gaveUp ? s(r.now) : s(r.asked), readyBeforeJoinS: r.loaded >= 0 && r.asked >= 0 ? Number(((r.asked - r.loaded) / 1000).toFixed(2)) : null,
    heldSteps: r.waits, heldStageSeconds: Number((r.waits / 240).toFixed(2)), sees: r.gaveUp ? 'the page held the shut ball, then played the table itself, as before there was a video' : r.waits ? 'the page held the shut ball, then the video' : 'the video, at once'
  }
  if (r.gaveUp) {
    await page.screenshot({ path: path.join(out, `gave-up-${rate}.png`) })
    await new Promise((done) => setTimeout(done, 20000))
    await page.screenshot({ path: path.join(out, `gave-up-${rate}-later.png`) })
    row.control = await page.evaluate(() => window.liveRun?.told?.().control ?? null).catch(() => null)
  }
  results.push(row)
  console.log(JSON.stringify(row))
  writeJson(path.join(out, 'line.json'), { made: new Date().toISOString(), browser: version, query, results })
  await context.close()
}
await browser.close()
await server.close()
