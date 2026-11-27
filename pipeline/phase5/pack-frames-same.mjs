// node pipeline/phase5/pack-frames-same.mjs OUT_DIR [STEPS]: draws the first page at rest two ways, the run's 960 by 540 window at 2 device pixels to a pixel
// and a 1920 by 1080 window at 1, both at the level `high`, and says how the two pictures differ.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at, config } from '../../tools/lib/paths.mjs'
import { ensureBuild } from '../../tools/lib/capture.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { RUN } from '../../tools/lib/pack-site.mjs'

const [out, steps = '10'] = process.argv.slice(2)
const cfg = config()
fs.mkdirSync(out, { recursive: true })
ensureBuild()
const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
const { browser } = await launch()
const draw = async (format, px) => {
  const f = cfg.formats[format]
  const context = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: px })
  const page = await context.newPage()
  await page.goto(`${server.url}/index.html?mode=live&format=${f.id}&assets=${RUN.assets}${RUN.query}`)
  await page.evaluate(() => window.showcase.ready)
  await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const got = await page.evaluate((n) => {
    window.liveRun.advance(n / 60, true)
    const c = document.getElementById('stage')
    return { png: window.liveRun.state().png, canvas: [c.width, c.height], ratio: window.devicePixelRatio }
  }, Number(steps))
  await context.close()
  return { ...got, png: Buffer.from(got.png.split(',')[1], 'base64') }
}
try {
  const a = await draw('preview', 2)
  const b = await draw('hd', 1)
  fs.writeFileSync(path.join(out, 'same-960x540-at-2.png'), a.png)
  fs.writeFileSync(path.join(out, 'same-1920x1080-at-1.png'), b.png)
  const ra = await sharp(a.png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const rb = await sharp(b.png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  console.log(`960 by 540 at 2: canvas ${a.canvas.join(' by ')}, ratio ${a.ratio}; 1920 by 1080 at 1: canvas ${b.canvas.join(' by ')}, ratio ${b.ratio}`)
  if (ra.info.width !== rb.info.width || ra.info.height !== rb.info.height) console.log('the two pictures differ in size')
  else {
    let sum = 0
    let most = 0
    let over8 = 0
    let over24 = 0
    const n = ra.data.length / 3
    const diff = Buffer.alloc(n)
    for (let i = 0; i < n; i++) {
      const d = Math.max(Math.abs(ra.data[i * 3] - rb.data[i * 3]), Math.abs(ra.data[i * 3 + 1] - rb.data[i * 3 + 1]), Math.abs(ra.data[i * 3 + 2] - rb.data[i * 3 + 2]))
      sum += d
      if (d > most) most = d
      if (d > 8) over8 += 1
      if (d > 24) over24 += 1
      diff[i] = Math.min(255, d * 8)
    }
    console.log(`mean difference of a pixel ${(sum / n).toFixed(3)} of 255, greatest ${most}, pixels over 8: ${((over8 / n) * 100).toFixed(3)}%, over 24: ${((over24 / n) * 100).toFixed(3)}%`)
    await sharp(diff, { raw: { width: ra.info.width, height: ra.info.height, channels: 1 } }).png().toFile(path.join(out, 'same-difference-times-8.png'))
  }
} finally {
  await browser.close()
  await server.close()
}
