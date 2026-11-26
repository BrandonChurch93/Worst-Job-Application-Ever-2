// Fix agent tug: the live site under the pack's own visitor, drawn in consecutive steps round the bite, the lost tug and the give-back.
// node pipeline/phase5/fix-tug-steps.mjs walk LABEL            walks to the end of step 1's tug, then walks again and keeps a picture of every second step round the bite, the lost tug and the give-back
// node pipeline/phase5/fix-tug-steps.mjs sheet LABEL NAME FIRST STRIDE COUNT CX CY   lays COUNT pictures from step FIRST on one sheet, cropped at real size round CX, CY (hd pixels)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'
import { makeVisitor, RUN, VISITOR } from '../../tools/lib/pack-site.mjs'

const [, , what, label = 'run', ...rest] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const dir = path.join('out', 'work', 'fix-tug', label)
const TILE = { w: 360, h: 230, cols: 4, gap: 6, bar: 26 }
const AFTER = 330

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
  const f = cfg.formats[RUN.format]
  const k = f.width / cfg.formats.hd.width
  const open = async () => {
    const session = await openSession({ format: f.id, assets: RUN.assets, mode: 'live', query: `&clock=steps&quality=${process.env.FIX_TUG_QUALITY || 'high'}` })
    await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
    return session
  }
  const tell = (session, dt) =>
    session.page.evaluate((d) => {
      if (d > 0) window.liveRun.advance(d, true)
      const t = window.liveRun.told()
      return { time: t.time, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control, pageTime: t.pageTime }
    }, dt)
  const rows = []
  const acts = {}
  const marks = {}
  let stop = Infinity
  let session = await open()
  try {
    const v = makeVisitor(k)
    let t = await tell(session, 0)
    for (let i = 0; i < VISITOR.mostSeconds * VISITOR.hz && i <= stop; i++) {
      for (const g of ['step1.resume', 'step1.tug', 'step1.shredded']) if (marks[g] === undefined && t.gags.includes(g)) marks[g] = i
      const lost = t.hits.find((h) => h.name === 'tug-lost')
      if (lost && marks.lost === undefined) marks.lost = i
      if (marks['step1.shredded'] !== undefined && stop === Infinity) stop = i + AFTER
      const p = v.pointer()
      rows.push([i, Math.round(t.time * 1000) / 1000, t.hero.x, t.hero.y, p.x, p.y, t.scroll])
      if (t.finished) break
      const list = v.act(t)
      if (list.length) acts[i] = list
      for (const a of list) await send(session.page, a)
      t = await tell(session, 1 / VISITOR.hz)
    }
  } finally {
    await session.close()
  }
  const from = marks['step1.resume'] ?? 0
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ marks, rows: rows.slice(from) }) + '\n')
  console.log(JSON.stringify(marks))
  const want = new Set()
  const span = (first, count) => { for (let n = 0; n < count; n++) want.add(first + (first % 2) + n * 2) }
  span(marks['step1.tug'] - 30, 40)
  span(marks.lost - 24, 44)
  span(marks['step1.shredded'] + 130, 56)
  const last = Math.max(...want)
  session = await open()
  try {
    let t = await tell(session, 0)
    for (let i = 0; i <= last; i++) {
      const row = rows[i]
      if (Math.abs(t.hero.x - row[2]) > 0.05 || Math.abs(t.hero.y - row[3]) > 0.05) throw new Error(`the second visit differs from the first at step ${i}`)
      if (want.has(i)) {
        const shot = await session.page.evaluate(() => window.liveRun.state().png)
        fs.writeFileSync(path.join(dir, `${String(i).padStart(6, '0')}.png`), Buffer.from(shot.split(',')[1], 'base64'))
      }
      if (i === last) break
      for (const a of acts[i] || []) await send(session.page, a)
      t = await tell(session, 1 / VISITOR.hz)
    }
  } finally {
    await session.close()
  }
} else if (what === 'sheet') {
  const [name, first, stride, count, cx, cy] = rest
  const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'))
  const f = cfg.formats[RUN.format]
  const k = f.width / cfg.formats.hd.width
  const scroll = (i) => (run.rows.find((r) => r[0] === i) || [0, 0, 0, 0, 0, 0, 0])[6]
  const tiles = []
  let at = Number(first) + (Number(first) % 2)
  for (let n = 0; n < Number(count); n++, at += Number(stride)) {
    const file = path.join(dir, `${String(at).padStart(6, '0')}.png`)
    if (!fs.existsSync(file)) break
    const left = Math.round(Math.min(f.width - TILE.w, Math.max(0, Number(cx) * k - TILE.w / 2)))
    const top = Math.round(Math.min(f.height - TILE.h, Math.max(0, (Number(cy) - scroll(at)) * k - TILE.h / 2)))
    const total = Math.round((at / VISITOR.hz) * 100)
    tiles.push({ png: await sharp(file).extract({ left, top, width: TILE.w, height: TILE.h }).png().toBuffer(), text: `${Math.floor(total / 6000)}:${String(Math.floor((total % 6000) / 100)).padStart(2, '0')}.${String(total % 100).padStart(2, '0')}  step ${at}` })
  }
  const rowsN = Math.ceil(tiles.length / TILE.cols)
  const W = TILE.cols * TILE.w + (TILE.cols - 1) * TILE.gap
  const H = TILE.bar + rowsN * (TILE.h + TILE.bar)
  const marks = tiles.map((tile, n) => `<text x="${(n % TILE.cols) * (TILE.w + TILE.gap) + 6}" y="${TILE.bar + Math.floor(n / TILE.cols) * (TILE.h + TILE.bar) + TILE.h + 17}" font-family="sans-serif" font-size="12" fill="#fff">${tile.text}</text>`).join('')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="6" y="17" font-family="sans-serif" font-size="13" fill="#fff">${label}: ${name}, consecutive pictures ${Number(stride) / VISITOR.hz < 0.02 ? 'every step' : `every ${stride} steps of ${VISITOR.hz} a second`}, real size</text>${marks}</svg>`
  const out = path.join('out', 'work', 'fix-tug', `${label}-${name}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
    .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % TILE.cols) * (TILE.w + TILE.gap), top: TILE.bar + Math.floor(n / TILE.cols) * (TILE.h + TILE.bar) })), { input: Buffer.from(head), left: 0, top: 0 }])
    .png()
    .toFile(out)
  console.log(out)
} else {
  console.log('say walk LABEL or sheet LABEL NAME FIRST STRIDE COUNT CX CY')
}
