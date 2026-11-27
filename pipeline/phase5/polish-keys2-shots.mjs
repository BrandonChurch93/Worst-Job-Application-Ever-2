// The live site under the pack's own visitor, drawn at the real size of the 1920 by 1080 page (2 device pixels to a point of the 960 by 540 window, as the packs' close sheets are).
// node pipeline/phase5/polish-keys2-shots.mjs walk LABEL FIRST-LAST [FIRST-LAST ...]   walks once and keeps the whole picture of every step in the spans
// node pipeline/phase5/polish-keys2-shots.mjs sheet LABEL NAME FIRST COUNT X Y W H [ZOOM] [COLS]   lays COUNT consecutive pictures from step FIRST, the window X, Y, W, H of the page, on one sheet
// node pipeline/phase5/polish-keys2-shots.mjs pair NAME UPPER.png LOWER.png   lays one sheet above another
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { ensureBuild } from '../../tools/lib/capture.mjs'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { at } from '../../tools/lib/paths.mjs'
import { keyBlock, makeVisitor, RUN, VISITOR } from '../../tools/lib/pack-site.mjs'

const [, , what, label = 'run', ...rest] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const root = path.join('out', 'work', 'polish-keys2')
const dir = path.join(root, label)
const GAP = 6
const BAR = 22

const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}

if (what === 'walk') {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const want = new Set()
  for (const span of rest) {
    const [a, b] = span.split('-').map(Number)
    for (let i = a; i <= b; i++) want.add(i)
  }
  const last = Math.max(...want)
  const f = cfg.formats[RUN.format]
  const k = f.width / cfg.formats.hd.width
  ensureBuild()
  const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
  const { browser } = await launch()
  const rows = []
  try {
    const context = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await page.goto(`${server.url}/index.html?mode=live&format=${f.id}&assets=${RUN.assets}${RUN.query}`)
    await page.evaluate(() => window.showcase.ready)
    await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
    const tell = (dt) =>
      page.evaluate((d) => {
        if (d > 0) window.liveRun.advance(d, true)
        const t = window.liveRun.told()
        return { time: t.time, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control, pageTime: t.pageTime }
      }, dt)
    const v = makeVisitor(k, VISITOR, keyBlock(cfg))
    let t = await tell(0)
    for (let i = 0; i <= last; i++) {
      rows.push([i, Math.round(t.time * 1000) / 1000, t.hero.x, t.hero.y, t.scroll])
      if (want.has(i)) {
        const shot = await page.evaluate(() => window.liveRun.state().png)
        fs.writeFileSync(path.join(dir, `${String(i).padStart(6, '0')}.png`), Buffer.from(shot.split(',')[1], 'base64'))
      }
      if (t.finished || i === last) break
      for (const a of v.act(t)) await send(page, a)
      t = await tell(1 / VISITOR.hz)
    }
  } finally {
    await browser.close()
    await server.close()
  }
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ rows }) + '\n')
  console.log(`${rows.length} steps walked, ${want.size} kept in ${dir}`)
} else if (what === 'sheet') {
  const [name, first, count, x, y, w, h, zoom = 1, cols = 6] = rest.map((r, n) => (n === 0 ? r : Number(r)))
  const tiles = []
  for (let n = 0; n < count; n++) {
    const i = first + n
    const file = path.join(dir, `${String(i).padStart(6, '0')}.png`)
    if (!fs.existsSync(file)) break
    const meta = await sharp(file).metadata()
    const k = meta.width / 1920
    let cutOut = sharp(file).extract({ left: Math.round(x * k), top: Math.round(y * k), width: Math.round(w * k), height: Math.round(h * k) })
    if (k !== 1 || zoom !== 1) cutOut = cutOut.resize({ width: Math.round(w * zoom), height: Math.round(h * zoom), kernel: zoom > 1 ? 'nearest' : 'lanczos3' })
    const total = Math.round((i / 60) * 100)
    tiles.push({ png: await cutOut.png().toBuffer(), text: `${Math.floor(total / 6000)}:${String(Math.floor((total % 6000) / 100)).padStart(2, '0')}.${String(total % 100).padStart(2, '0')} step ${i}` })
  }
  const W0 = Math.round(w * zoom)
  const H0 = Math.round(h * zoom)
  const rowsN = Math.ceil(tiles.length / cols)
  const W = cols * W0 + (cols - 1) * GAP
  const H = BAR + rowsN * (H0 + BAR)
  const marks = tiles.map((tile, n) => `<text x="${(n % cols) * (W0 + GAP) + 4}" y="${BAR + Math.floor(n / cols) * (H0 + BAR) + H0 + 15}" font-family="sans-serif" font-size="12" fill="#fff">${tile.text}</text>`).join('')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="4" y="15" font-family="sans-serif" font-size="13" fill="#fff">${label}: ${name}, every frame of 60, ${zoom === 1 ? 'real size' : `${zoom} times`}</text>${marks}</svg>`
  const out = path.join(root, `${label}-${name}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
    .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % cols) * (W0 + GAP), top: BAR + Math.floor(n / cols) * (H0 + BAR) })), { input: Buffer.from(head), left: 0, top: 0 }])
    .png()
    .toFile(out)
  console.log(out)
} else if (what === 'pair') {
  const [upper, lower] = rest
  const a = await sharp(upper).metadata()
  const b = await sharp(lower).metadata()
  const out = path.join(root, `${label}.png`)
  await sharp({ create: { width: Math.max(a.width, b.width), height: a.height + b.height + GAP, channels: 3, background: '#18181b' } })
    .composite([{ input: upper, left: 0, top: 0 }, { input: lower, left: 0, top: a.height + GAP }])
    .png()
    .toFile(out)
  console.log(out)
} else {
  console.log('say walk, sheet or pair')
}
