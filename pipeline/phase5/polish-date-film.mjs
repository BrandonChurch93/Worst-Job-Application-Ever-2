// Polish date: film frames in a row round a row of step 2 as its tray opens, draft tier, 1920 by 1080, and how much of a machine each shows.
// node pipeline/phase5/polish-date-film.mjs LABEL ROW FIRST COUNT   ROW is 1, 2 or 3; FIRST is a film frame
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession, readCanvas } from '../../tools/lib/capture.mjs'

const [, , label = 'film', row = '2', first = '3250', count = '30'] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const FIELD = { x: 1000, w: 792, h: cfg.scale.sizes.field, pitch: 149, gap: 12, tray: 250 }
const EDGE = 9
// The top of the first row's field on the page (src/pages/step2/layout.ts, ROW_Y), as the live walk reads it from the page's own hint.
const TOP = Number(process.env.POLISH_DATE_TOP || 266)
const dir = path.join('out', 'work', 'polish-date', label)
fs.mkdirSync(dir, { recursive: true })
const session = await openSession({ format: 'hd', assets: 'full' })
const y0 = TOP + (Number(row) - 1) * FIELD.pitch
const tiles = []
try {
  for (let n = Number(first); n < Number(first) + Number(count); n++) {
    await session.page.evaluate(async ([f, t]) => {
      window.showcase.setDiagnostic('beauty')
      await window.showcase.renderFilmFrame(f, t)
    }, [n, 'draft'])
    const png = await readCanvas(session.page)
    const file = path.join(dir, `row${row}-${n}.png`)
    fs.writeFileSync(file, png)
    const g = await sharp(png).extract({ left: FIELD.x, top: y0 + FIELD.h + FIELD.gap, width: FIELD.w, height: FIELD.tray }).greyscale().raw().toBuffer()
    let edges = 0
    for (let y = 16; y < FIELD.tray - 16; y++) for (let x = 20; x < FIELD.w - 20; x++) if (Math.abs(g[y * FIELD.w + x] - g[y * FIELD.w + x - 1]) > EDGE) edges++
    console.log(`frame ${n}: ${edges} edge pixels where the tray stands`)
    tiles.push({ png: await sharp(png).extract({ left: FIELD.x - 20, top: y0 - 14, width: FIELD.w + 40, height: FIELD.h + FIELD.gap + FIELD.tray + 36 }).resize(Math.round((FIELD.w + 40) / 2)).png().toBuffer(), text: `film frame ${n}` })
  }
} finally {
  await session.close()
}
const tw = Math.round((FIELD.w + 40) / 2)
const th = Math.round((FIELD.h + FIELD.gap + FIELD.tray + 36) / 2)
const C = 5
const bar = 18
const marks = tiles.map((tile, n) => `<text x="${(n % C) * (tw + 4) + 4}" y="${bar + Math.floor(n / C) * (th + bar) + th + 13}" font-family="sans-serif" font-size="11" fill="#fff">${tile.text}</text>`).join('')
const W = C * (tw + 4)
const H = bar + Math.ceil(tiles.length / C) * (th + bar)
const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="4" y="13" font-family="sans-serif" font-size="12" fill="#fff">${label}: the film, row ${row}, every frame of ${cfg.film.fps} a second, draft tier, half size</text>${marks}</svg>`
const out = path.join('out', 'work', 'polish-date', `${label}-row${row}.png`)
await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
  .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % C) * (tw + 4), top: bar + Math.floor(n / C) * (th + bar) })), { input: Buffer.from(head), left: 0, top: 0 }])
  .png()
  .toFile(out)
console.log(out)
