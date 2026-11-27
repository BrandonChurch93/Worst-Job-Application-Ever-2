// node pipeline/change002/careers-proof.mjs [--only film,apply,press,turn,top,card,ticker,cost]
// The proof pictures of the careers page, each at most 1200 px on its long edge, in out/work/careers/:
// the first screen beside the approved one, twelve frames of a card under a real mouse, the ticker in windows 1920 and 2560 wide,
// the press of Apply with the first frames of the turn, and the film's opening on the page as twelve frames.
import fs from 'node:fs'
import sharp from 'sharp'
import { args, at, config } from '../../tools/lib/paths.mjs'
import { drawStill, openSession, readCanvas } from '../../tools/lib/capture.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'

const a = args()
const only = typeof a.only === 'string' ? a.only.split(',') : ['top', 'film', 'apply', 'turn', 'card', 'ticker']
const OUT = at('out', 'work', 'careers')
const GAP = 6
const GROUND = '#d81b60'
fs.mkdirSync(OUT, { recursive: true })
const beats = config().film.beats.filter((b) => b.unit === 'marketing')
const made = []
const PRESS = { box: { left: 560, top: 800, width: 800, height: 200 }, times: [17.8, 17.9, 17.95, 17.98, 18, 18.03, 18.08, 18.2, 18.3, 18.38, 18.44, 18.49] }

async function grid(name, frames, across, width) {
  const tiles = []
  let tall = 0
  for (const f of frames) {
    const img = sharp(f.png).resize({ width })
    const buf = await img.png().toBuffer()
    const m = await sharp(buf).metadata()
    tall = m.height
    tiles.push(buf)
  }
  const rows = Math.ceil(tiles.length / across)
  const file = `${OUT}/${name}.jpg`
  await sharp({ create: { width: across * width + (across - 1) * GAP, height: rows * tall + (rows - 1) * GAP, channels: 3, background: GROUND } })
    .composite(tiles.map((input, i) => ({ input, left: (i % across) * (width + GAP), top: Math.floor(i / across) * (tall + GAP) })))
    .jpeg({ quality: 88 })
    .toFile(file)
  made.push(`${file}: ${frames.map((f) => f.label).join(' | ')}`)
}

const filmSpec = (t) => {
  const b = beats.find((x) => t >= x.from && t < x.to) || beats[beats.length - 1]
  return { page: 'marketing', beat: b.id, at: Number(((t - b.from) / (b.to - b.from)).toFixed(6)), camera: 'home', tier: a.tier || 'draft' }
}

if (only.some((o) => ['top', 'film', 'apply', 'press'].includes(o))) {
  const session = await openSession({ format: 'hd', assets: 'full' })
  try {
    const shot = async (t) => ({ png: (await drawStill(session, filmSpec(t))).png, label: `${t.toFixed(2)} s` })
    if (only.includes('top')) {
      const mine = await shot(2.4)
      fs.writeFileSync(`${OUT}/careers-top.png`, mine.png)
      await grid('careers-top-beside', [mine, { png: fs.readFileSync(at('references', 'approved-002', 'careers-top.png')), label: 'approved careers-top.png' }], 2, 597)
    }
    if (only.includes('film')) {
      const frames = []
      for (const t of [1, 2.5, 4, 5.6, 7.3, 8.6, 10.8, 13, 14.9, 16.8, 18, 18.45]) frames.push(await shot(t))
      await grid('careers-film-twelve', frames, 4, 295)
    }
    if (only.includes('apply')) {
      const frames = []
      for (const t of [16.5, 17.2, 17.5, 17.8, 17.9, 17.95, 18, 18.05, 18.15, 18.3, 18.4, 18.48]) frames.push(await shot(t))
      await grid('careers-apply-turn', frames, 4, 295)
    }
    if (only.includes('press')) {
      const frames = []
      for (const t of PRESS.times) {
        const f = await shot(t)
        frames.push({ png: await sharp(f.png).extract(PRESS.box).png().toBuffer(), label: f.label })
      }
      await grid('careers-press-large', frames, 3, 396)
    }
  } finally {
    await session.close()
  }
}

// The turn into step 1 as the film draws it: a still never shows a page mid turn, so these are frames of the film itself.
if (only.includes('turn')) {
  const session = await openSession({ format: 'hd', assets: 'full' })
  try {
    const frames = []
    for (const t of [18.3, 18.45, 18.5, 18.55, 18.6, 18.65, 18.7, 18.75, 18.8, 18.85, 18.92, 18.98]) {
      await session.page.evaluate(async ([n, tier]) => {
        window.showcase.setDiagnostic('beauty')
        await window.showcase.renderFilmFrame(n, tier)
      }, [Math.round(t * config().film.fps), a.tier || 'draft'])
      frames.push({ png: await readCanvas(session.page), label: `${t.toFixed(2)} s` })
    }
    await grid('careers-turn', frames, 4, 295)
  } finally {
    await session.close()
  }
}

if (only.includes('card')) {
  const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: '&clock=steps' })
  try {
    const page = session.page
    const advance = async (seconds) => Buffer.from((await page.evaluate((s) => window.liveRun.advance(s), seconds)).png.split(',')[1], 'base64')
    const told = () => page.evaluate(() => window.liveRun.told())
    await page.mouse.move(120, 500)
    await advance(0.5)
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 100)
      await advance(0.15)
    }
    await advance(1)
    const scroll = (await told()).scroll
    const crop = async (png) => sharp(png).extract({ left: 90, top: 120, width: 630, height: 440 }).png().toBuffer()
    const frames = []
    const take = async (dt, label) => frames.push({ png: await crop(await advance(dt)), label })
    await take(0.05, 'mouse beside the card')
    await page.mouse.move(380, 400, { steps: 4 })
    for (const [dt, label] of [[0.1, 'in +0.10 s'], [0.1, 'in +0.20 s'], [0.1, 'in +0.30 s'], [0.1, 'in +0.40 s'], [0.2, 'in +0.60 s'], [0.5, 'in +1.10 s']]) await take(dt, label)
    await page.mouse.move(120, 500, { steps: 4 })
    for (const [dt, label] of [[0.15, 'out +0.15 s'], [0.1, 'out +0.25 s'], [0.1, 'out +0.35 s'], [0.15, 'out +0.50 s'], [0.5, 'out +1.00 s']]) await take(dt, label)
    await grid('careers-card-mouse', frames, 4, 295)
    made.push(`  the page was wheeled down by ${Math.round(scroll)} px with real wheel events; the mouse was moved with real mouse events`)
  } finally {
    await session.close()
  }
}

if (only.includes('ticker')) {
  const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
  const { browser } = await launch()
  try {
    const strips = []
    for (const width of [1280, 1920, 2560]) {
      const height = Math.round((width * 9) / 16)
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      await page.goto(`${server.url}/index.html?mode=live&assets=web&clock=steps`)
      await page.evaluate(() => window.showcase.ready)
      await page.mouse.move(Math.round(width / 2), Math.round(height * 0.3))
      await page.evaluate(() => window.liveRun.advance(1.5))
      const png = await page.screenshot({ type: 'png' })
      const row = Math.round(height * 0.9)
      const strip = await sharp(png).extract({ left: 0, top: row, width, height: height - row }).png().toBuffer()
      fs.writeFileSync(`${OUT}/careers-ticker-${width}.png`, strip)
      const raw = await sharp(png).extract({ left: 0, top: Math.round(height * 0.965), width, height: 1 }).raw().toBuffer({ resolveWithObject: true })
      const px = (x) => [raw.data[x * raw.info.channels], raw.data[x * raw.info.channels + 1], raw.data[x * raw.info.channels + 2]]
      strips.push({ png: strip, label: `window ${width} by ${height}: band colour at x 0 ${px(0)}, at x ${width - 1} ${px(width - 1)}` })
      await context.close()
    }
    await grid('careers-ticker-widths', strips, 1, 1200)
  } finally {
    await browser.close()
    await server.close()
  }
}
if (only.includes('cost')) {
  for (const step of [0, 1]) {
    const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&clock=steps&quality=low${step ? `&step=${step}` : ''}` })
    try {
      const page = session.page
      const time = async (label) => {
        await page.evaluate(() => window.liveRun.advance(0.5))
        const ms = await page.evaluate(async () => {
          const t0 = performance.now()
          for (let i = 0; i < 30; i++) window.liveRun.advance(1 / 60)
          return (performance.now() - t0) / 30
        })
        made.push(`cost at the low level, ${label}: ${ms.toFixed(1)} ms a frame drawn and read back on this machine's software renderer`)
      }
      await page.mouse.move(120, 500)
      if (step) await time('step 1 at rest, for comparison')
      else {
        await time('careers page, first screen')
        const t0 = Date.now()
        for (let i = 0; i < 12; i++) {
          await page.mouse.wheel(0, 100)
          await page.evaluate(() => window.liveRun.advance(0.15))
        }
        made.push(`  wheeling 1200 px down, 12 frames with the type of the next screen built on the way: ${((Date.now() - t0) / 12).toFixed(0)} ms a frame`)
        await time('careers page, wheeled down to the cards')
      }
    } finally {
      await session.close()
    }
  }
}
console.log(made.join('\n'))
