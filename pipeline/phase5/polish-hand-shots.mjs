// The live site under the pack's own visitor at 1920 by 1080 and level high, drawn in consecutive frames of 60 a second, and sheets cut from those pictures at real size.
// node pipeline/phase5/polish-hand-shots.mjs walk LABEL [rest=FRAME] FIRST-LAST[/STRIDE] [...]   walks once, keeps a picture of every frame in the spans; from rest=FRAME on the hand lies still
// node pipeline/phase5/polish-hand-shots.mjs sheet LABEL NAME FIRST STRIDE COUNT LEFT TOP W H COLS [cross] [mark=FRAME:WORDS ...]   lays COUNT windows on one sheet, cut unscaled at LEFT, TOP
// node pipeline/phase5/polish-hand-shots.mjs film DIR NAME FIRST STRIDE COUNT LEFT TOP W H COLS [mark=FRAME:WORDS ...]   the same from the numbered frames of the film in DIR
// node pipeline/phase5/polish-hand-shots.mjs stack OUT A.png B.png [C.png ...]   lays finished sheets one above the other
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'
import { keyBlock, makeVisitor, RUN, VISITOR } from '../../tools/lib/pack-site.mjs'

const [, , what, label = 'run', ...rest] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const root = path.join('out', 'work', 'polish-hand')
const dir = path.join(root, label)
const TILE = { gap: 4, bar: 20 }

const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}

const lay = async (out, title, tiles, W0, H0, cols) => {
  const rowsN = Math.ceil(tiles.length / cols)
  const W = cols * W0 + (cols - 1) * TILE.gap
  const H = TILE.bar + rowsN * (H0 + TILE.bar)
  const left = (n) => (n % cols) * (W0 + TILE.gap)
  const top = (n) => TILE.bar + Math.floor(n / cols) * (H0 + TILE.bar)
  const marks = tiles.map((tile, n) => `<text x="${left(n) + 4}" y="${top(n) + H0 + 14}" font-family="sans-serif" font-size="12" fill="${tile.marked ? '#ffd24a' : '#fff'}">${tile.text}</text>${tile.marked ? `<rect x="${left(n) + 1}" y="${top(n) + 1}" width="${W0 - 2}" height="${H0 - 2}" fill="none" stroke="#ffd24a" stroke-width="2"/>` : ''}${tile.cross ? `<path d="M${left(n) + tile.cross.x - 7} ${top(n) + tile.cross.y}h14M${left(n) + tile.cross.x} ${top(n) + tile.cross.y - 7}v14" stroke="#00e5ff" stroke-width="1"/>` : ''}`).join('')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="4" y="14" font-family="sans-serif" font-size="12" fill="#fff">${title}</text>${marks}</svg>`
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
    .composite([...tiles.map((tile, n) => ({ input: tile.png, left: left(n), top: top(n) })), { input: Buffer.from(head), left: 0, top: 0 }])
    .png()
    .toFile(out)
  console.log(out, W, H)
}

const marksOf = (words) => Object.fromEntries(words.filter((w) => w.startsWith('mark=')).map((w) => { const [a, ...b] = w.slice(5).split(':'); return [Number(a), b.join(':')] }))

if (what === 'walk') {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const want = new Set()
  let still = Infinity
  for (const span of rest) {
    if (span.startsWith('rest=')) { still = Number(span.slice(5)); continue }
    const [a, b, by = 1] = span.split(/[-/]/).map(Number)
    for (let i = a; i <= b; i += by) want.add(i)
  }
  const last = Math.max(...want)
  const session = await openSession({ format: 'hd', assets: RUN.assets, mode: 'live', query: '&clock=steps&quality=high' })
  await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const tell = (dt) =>
    session.page.evaluate((d) => {
      if (d > 0) window.liveRun.advance(d, true)
      const t = window.liveRun.told()
      return { time: t.time, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control, pageTime: t.pageTime }
    }, dt)
  const rows = []
  try {
    const v = makeVisitor(1, VISITOR, keyBlock(cfg))
    const hand = { x: 0, y: 0, down: false }
    let t = await tell(0)
    for (let i = 0; i <= last && !t.finished; i++) {
      if (i < still) {
        for (const a of v.act(t)) {
          if (a.move) Object.assign(hand, { x: a.move[0], y: a.move[1] })
          if (a.down) hand.down = true
          if (a.up) hand.down = false
          await send(session.page, a)
        }
      } else if (hand.down) {
        hand.down = false
        await session.page.mouse.up()
      }
      t = await tell(1 / VISITOR.hz)
      rows.push([i, Math.round(t.time * 1000) / 1000, t.hero.x, t.hero.y, hand.x, hand.y, t.scroll, t.page, t.turning ? 1 : 0])
      if (want.has(i)) {
        const shot = await session.page.evaluate(() => window.liveRun.state().png)
        fs.writeFileSync(path.join(dir, `${String(i).padStart(6, '0')}.png`), Buffer.from(shot.split(',')[1], 'base64'))
      }
    }
  } finally {
    await session.close()
  }
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ rows }) + '\n')
  console.log(`${rows.length} frames walked, ${want.size} kept in ${dir}`)
} else if (what === 'sheet' || what === 'film') {
  const [name, first, stride, count, left, top, w, h, cols, ...more] = rest
  const marks = marksOf(more)
  const run = what === 'sheet' ? JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')) : null
  const files = what === 'film' ? fs.readdirSync(label).filter((n) => n.endsWith('.png')) : []
  const fileOf = (i) => (what === 'sheet' ? path.join(dir, `${String(i).padStart(6, '0')}.png`) : path.join(label, files.find((n) => Number((n.match(/(\d+)\.png$/) || [])[1]) === i) || 'none'))
  const tiles = []
  let at = Number(first)
  for (let n = 0; n < Number(count); n++, at += Number(stride)) {
    const file = fileOf(at)
    if (!fs.existsSync(file)) continue
    const meta = await sharp(file).metadata()
    if (meta.width !== 1920 || meta.height !== 1080) throw new Error(`${file} is ${meta.width} by ${meta.height}, not 1920 by 1080`)
    const row = run ? run.rows.find((r) => r[0] === at) : null
    const cross = row && more.includes('cross') ? { x: Math.round(row[4]) - Number(left), y: Math.round(row[5]) - Number(top) } : null
    tiles.push({ png: await sharp(file).extract({ left: Number(left), top: Number(top), width: Number(w), height: Number(h) }).png().toBuffer(), text: `${what === 'film' ? 'film frame' : 'frame'} ${at}${marks[at] ? `  ${marks[at]}` : ''}`, marked: Boolean(marks[at]), cross: cross && cross.x > 7 && cross.y > 7 && cross.x < Number(w) - 7 && cross.y < Number(h) - 7 ? cross : null })
  }
  const about = what === 'film' ? `the film, ${name}` : `the live site at level high, ${label}, ${name}`
  await lay(path.join(root, `${what === 'film' ? 'film' : label}-${name}.png`), `${about}: every ${Number(stride) === 1 ? 'frame' : `${stride} frames`} of 60 a second, window ${w} by ${h} at ${left}, ${top} of 1920 by 1080, not scaled${more.includes('cross') ? '; the cross is the pointer' : ''}`, tiles, Number(w), Number(h), Number(cols))
} else if (what === 'stack') {
  const metas = await Promise.all(rest.map((f) => sharp(f).metadata()))
  const W = Math.max(...metas.map((m) => m.width))
  let y = 0
  const parts = rest.map((f, n) => { const p = { input: f, left: 0, top: y }; y += metas[n].height + 6; return p })
  await sharp({ create: { width: W, height: y - 6, channels: 3, background: '#18181b' } }).composite(parts).png().toFile(label)
  console.log(label, W, y - 6)
} else {
  console.log('say walk, sheet, film or stack')
}
