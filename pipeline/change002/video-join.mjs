// The joins of the pinball video on the built site, measured in the browser at each window size.
//   node pipeline/change002/video-join.mjs [--only 1280x720@1] [--out out/work/video-join]
// For each size: the last live picture against the first picture of the video and the last picture of the video against the live
// picture that follows it (screenshots of the page as composited, difference per channel out of 255 and a picture of it),
// then a run at the real clock for the times: play asked, first video frame shown, frames presented and dropped, the hand-back.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, writeJson } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'

const a = args()
const out = at(...(a.out ? [a.out] : ['out', 'work', 'video-join']))
fs.mkdirSync(out, { recursive: true })
const SIZES = [[1920, 1080, 1], [1920, 1080, 2], [1280, 720, 1], [1280, 720, 2], [390, 844, 1], [844, 390, 1]].map(([w, h, d]) => ({ w, h, d, id: `${w}x${h}@${d}` })).filter((s) => !a.only || String(a.only).split(',').includes(s.id))
const QUERY = `mode=live&step=3&bot=keen&seed=1&video=trace${a.quality ? `&quality=${a.quality}` : ''}`

ensureBuild()
const server = await serve(at('dist'))
const { browser, version } = await launch(['--autoplay-policy=no-user-gesture-required'])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(size, stepped) {
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: size.d })
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (e) => problems.push(String(e.message || e)))
  await page.goto(`${server.url}/index.html?${QUERY}${stepped ? `&clock=steps&quality=${a.level || 'high'}` : ''}`)
  await page.evaluate(() => window.showcase.ready)
  await page.waitForFunction(() => window.videoBridge && window.videoBridge.player && window.videoBridge.player.ready(), null, { timeout: 120000 })
  if (stepped) await page.evaluate(() => { window.videoBridge.hold = { in: true, out: true } })
  return { context, page, problems }
}

const rect = (page) => page.evaluate(() => {
  const r = document.getElementById('stage').getBoundingClientRect()
  const c = document.getElementById('stage')
  const v = document.querySelector('video')
  const q = v.getBoundingClientRect()
  return { x: r.left, y: r.top, width: r.width, height: r.height, buffer: [c.width, c.height], video: [q.left, q.top, q.width, q.height], dpr: window.devicePixelRatio }
})
const shot = async (page, r) => page.screenshot({ clip: { x: r.x, y: r.y, width: r.width, height: r.height }, type: 'png' })
const showVideo = (page, on) => page.evaluate((v) => { document.querySelector('video').style.opacity = v ? '1' : '0' }, on)

async function differ(one, two, file) {
  const A = await sharp(one).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const B = await sharp(two).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const n = A.info.width * A.info.height
  const sum = [0, 0, 0]
  const most = [0, 0, 0]
  let over8 = 0
  const pic = Buffer.alloc(n * 3)
  for (let i = 0; i < n; i++) {
    let big = 0
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(A.data[i * 3 + c] - B.data[i * 3 + c])
      sum[c] += d
      if (d > most[c]) most[c] = d
      if (d > big) big = d
      pic[i * 3 + c] = Math.min(255, d * 8)
    }
    if (big > 8) over8++
  }
  await sharp(pic, { raw: { width: A.info.width, height: A.info.height, channels: 3 } }).png().toFile(file)
  return { width: A.info.width, height: A.info.height, mean: sum.map((v) => Number((v / n).toFixed(3))), largest: most, shareOver8: Number((over8 / n).toFixed(5)) }
}

const results = []
for (const size of SIZES) {
  const dir = path.join(out, size.id)
  fs.mkdirSync(dir, { recursive: true })
  const r = { size: size.id }
  {
    const first = await open(size, true)
    const steps = await first.page.evaluate(() => {
      let n = 0
      while (window.liveRun.told().control !== 'film' && n < 240 * 60) { window.liveRun.advance(1 / 240, true); n++ }
      return n
    })
    await first.context.close()
    const { context, page, problems } = await open(size, true)
    const draw = () => page.evaluate(() => { window.liveRun.state() })
    const step = (n) => page.evaluate((k) => { for (let i = 0; i < k; i++) window.liveRun.advance(1 / 240, true) }, n)
    await step(steps - 1)
    await draw()
    const box = await rect(page)
    r.box = box
    r.stepsToJoin = steps
    const before = await shot(page, box)
    await step(1)
    await draw()
    const liveIn = await shot(page, box)
    await showVideo(page, true)
    await sleep(300)
    const videoIn = await shot(page, box)
    fs.writeFileSync(path.join(dir, 'in-before.png'), before)
    fs.writeFileSync(path.join(dir, 'in-live.png'), liveIn)
    fs.writeFileSync(path.join(dir, 'in-video.png'), videoIn)
    r.load = await differ(before, liveIn, path.join(dir, 'in-load-diff-x8.png'))
    r.in = await differ(liveIn, videoIn, path.join(dir, 'in-diff-x8.png'))
    await page.evaluate(() => { window.videoBridge.hold.in = false })
    await page.waitForFunction(() => window.videoTrace.shown >= 0 && document.querySelector('video').currentTime > 0, null, { timeout: 60000 })
    await page.evaluate(() => { const v = document.querySelector('video'); v.currentTime = v.duration - 0.5 })
    await page.waitForFunction(() => document.querySelector('video').ended, null, { timeout: 180000 })
    await step(2)
    await draw()
    await sleep(300)
    const videoOut = await shot(page, box)
    await showVideo(page, false)
    await sleep(100)
    const liveOut = await shot(page, box)
    await showVideo(page, true)
    fs.writeFileSync(path.join(dir, 'out-video.png'), videoOut)
    fs.writeFileSync(path.join(dir, 'out-live.png'), liveOut)
    r.out = await differ(videoOut, liveOut, path.join(dir, 'out-diff-x8.png'))
    await page.evaluate(() => { window.videoBridge.hold.out = false })
    await step(1)
    await page.waitForFunction(() => window.videoTrace.faded >= 0, null, { timeout: 60000 })
    const hero = []
    for (let i = 0; i < 6; i++) {
      await step(i === 0 ? 1 : 4)
      await draw()
      const t = await page.evaluate(() => ({ ...window.liveRun.told().hero, control: window.liveRun.told().control, opacity: document.querySelector('video').style.opacity }))
      hero.push(t)
      fs.writeFileSync(path.join(dir, `back-${i}.png`), await shot(page, box))
    }
    r.back = { arrow: hero, first: await differ(liveOut, fs.readFileSync(path.join(dir, 'back-0.png')), path.join(dir, 'back-diff-x8.png')) }
    r.problems = problems
    await context.close()
  }
  if (!a.pictures) {
    const { context, page, problems } = await open(size, false)
    const cdp = await context.newCDPSession(page)
    const cast = []
    cdp.on('Page.screencastFrame', (f) => {
      cast.push({ at: f.metadata.timestamp * 1000, data: Buffer.from(f.data, 'base64') })
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined)
    })
    const film = (on) => cdp.send(on ? 'Page.startScreencast' : 'Page.stopScreencast', on ? { format: 'jpeg', quality: 80, maxWidth: 480, maxHeight: 480, everyNthFrame: 1 } : {}).catch(() => undefined)
    await film(true)
    await page.waitForFunction(() => window.videoTrace.shown >= 0 && document.querySelector('video').currentTime > 1, null, { timeout: 900000, polling: 100 })
    await film(false)
    let hidden = null
    if (a.hide) {
      await page.waitForFunction((at) => document.querySelector('video').currentTime >= at, Number(a.hide), { timeout: 600000, polling: 100 })
      const see = (state) => page.evaluate((v) => {
        Object.defineProperty(document, 'visibilityState', { value: v, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
        return { clock: document.querySelector('video').currentTime, cues: window.videoBridge.cues.length, paused: document.querySelector('video').paused }
      }, state)
      const went = await see('hidden')
      await sleep(2000)
      const back = await see('visible')
      hidden = { hiddenAtVideoSecond: went.clock, shownAtVideoSecond: back.clock, pausedWhileHidden: back.paused, cuesBefore: back.cues }
    }
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.duration - v.currentTime < 1.2 || window.videoTrace.left >= 0 }, null, { timeout: 900000, polling: 100 })
    await film(true)
    await page.waitForFunction(() => window.videoTrace.left >= 0, null, { timeout: 900000 })
    await sleep(1200)
    await film(false)
    const origin = await page.evaluate(() => performance.timeOrigin)
    const seen = []
    for (const c of cast) {
      const raw = await sharp(c.data).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let sum = 0
      for (let i = 0; i < raw.data.length; i++) sum += raw.data[i]
      const prev = seen[seen.length - 1]
      let step = 0
      if (prev && prev.raw.length === raw.data.length) {
        for (let i = 0; i < raw.data.length; i++) step += Math.abs(raw.data[i] - prev.raw[i])
        step /= raw.data.length
      }
      seen.push({ at: c.at - origin, light: sum / raw.data.length, step, raw: raw.data, data: c.data })
    }
    const t = await page.evaluate(() => {
      const v = document.querySelector('video')
      const q = v.getVideoPlaybackQuality()
      return { trace: window.videoTrace, cues: window.videoBridge.cues, quality: { total: q.totalVideoFrames, dropped: q.droppedVideoFrames }, duration: v.duration }
    })
    const f = t.trace.frames
    const gaps = f.slice(1).map((x, i) => x.shown - f[i].shown)
    const sorted = [...gaps].sort((p, q) => p - q)
    const late = t.cues.map((c) => (c.clock - c.at) * 1000)
    const third = (k) => late.slice(Math.floor((late.length * k) / 3), Math.floor((late.length * (k + 1)) / 3))
    const stat = (list) => (list.length ? { n: list.length, mean: Number((list.reduce((s, v) => s + v, 0) / list.length).toFixed(2)), meanAbs: Number((list.reduce((s, v) => s + Math.abs(v), 0) / list.length).toFixed(2)), worst: Number(Math.max(...list.map(Math.abs)).toFixed(2)) } : null)
    const last = f[f.length - 1]
    const ms = (v) => Number(v.toFixed(1))
    const moving = f.find((x) => x.media > 0 && x.shown >= t.trace.played)
    r.timing = {
      asked: t.trace.asked, fadeInFrom: t.trace.shown, playAsked: t.trace.played, firstFrameShown: f[0].shown, firstFrameMedia: f[0].media,
      askedToFadeMs: ms(t.trace.shown - t.trace.asked), fadeInMs: ms(t.trace.played - t.trace.shown), liveFramesWhileWaiting: t.trace.live.length,
      playToMovingMs: moving ? ms(moving.shown - t.trace.played) : null, playToMovingDisplayFrames: moving ? Number(((moving.shown - t.trace.played) / (1000 / 60)).toFixed(2)) : null, firstMovingMedia: moving ? moving.media : null,
      videoFramesSeen: f.length, presented: last.count - f[0].count + 1, total: t.quality.total, dropped: t.quality.dropped,
      frameGapMs: { median: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)), p99: Number(sorted[Math.floor(sorted.length * 0.99)].toFixed(2)), largest: Number(sorted[sorted.length - 1].toFixed(2)) },
      lastFrameMedia: last.media, lastFrameShown: last.shown, faded: t.trace.faded, left: t.trace.left, lastFrameToFadeMs: ms(t.trace.fell - last.shown), fadeOutMs: ms(t.trace.faded - t.trace.fell), fadedToLeftMs: ms(t.trace.left - t.trace.faded), fadedToLeftDisplayFrames: Number(((t.trace.left - t.trace.faded) / (1000 / 60)).toFixed(2)),
      cuesLateMs: { start: stat(third(0)), middle: stat(third(1)), end: stat(third(2)), all: stat(late), afterHidden: hidden ? stat(late.slice(hidden.cuesBefore)) : null },
      hidden, cues: t.cues.length, screencastPictures: seen.length, screencastLight: seen.length ? [Number(Math.min(...seen.map((c) => c.light)).toFixed(2)), Number(Math.max(...seen.map((c) => c.light)).toFixed(2))] : null
    }
    const near = (at, name) => {
      const list = seen.filter((c) => Math.abs(c.at - at) < 4000)
      const k = list.findIndex((c) => c.at >= at)
      const row = list.slice(Math.max(0, k - 3), k + 3)
      row.forEach((c, i) => fs.writeFileSync(path.join(dir, `${name}-row-${i}.jpg`), c.data))
      const light = list.map((c) => c.light)
      return { pictures: list.length, light: light.length ? [Number(Math.min(...light).toFixed(2)), Number(Math.max(...light).toFixed(2))] : null, largestStep: list.length ? Number(Math.max(...list.slice(1).map((c) => c.step), 0).toFixed(2)) : null, row: row.map((c) => ({ ms: Number((c.at - at).toFixed(1)), light: Number(c.light.toFixed(2)), step: Number(c.step.toFixed(2)) })) }
    }
    r.screen = { in: near(t.trace.shown, 'in'), out: near(t.trace.left, 'out') }
    r.problems = [...r.problems, ...problems]
    await context.close()
  }
  results.push(r)
  console.log(JSON.stringify(r))
  writeJson(path.join(out, 'joins.json'), { made: new Date().toISOString(), browser: version, query: QUERY, results })
}
await browser.close()
await server.close()
