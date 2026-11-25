// Draws the pictures of a pack: every file one PNG, no longer than critics.maxImageLongEdgePx on its long edge, with what it is written in a strip above the picture, never over it.
import sharp from 'sharp'
import { openSession, readCanvas, readPage, stillFrom } from './capture.mjs'
import { timeLabel } from './film-plan.mjs'

const GROUND = '#1b1b1d'
const INK = '#ece7dd'
const GAP = 8
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function wrap(words, room, size) {
  const most = Math.max(8, Math.floor(room / (size * 0.6)))
  const lines = []
  let line = ''
  for (const w of String(words).split(' ')) {
    if (line && (line + ' ' + w).length > most) {
      lines.push(line)
      line = w
    } else line = line ? line + ' ' + w : w
  }
  if (line) lines.push(line)
  return lines
}

async function strip(words, width, size = 15) {
  const lines = wrap(words, width - 16, size)
  const pitch = size + 7
  const height = lines.length * pitch + 8
  const text = lines.map((l, i) => `<text x="8" y="${Math.round(size + 3 + i * pitch)}" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="${size}" fill="${INK}">${esc(l)}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${GROUND}"/>${text}</svg>`
  return { png: await sharp(Buffer.from(svg)).png().toBuffer(), height }
}

const out = (parts, width, height) => sharp({ create: { width, height, channels: 3, background: GROUND } }).composite(parts).png({ compressionLevel: 9 }).toBuffer()

// One picture under its heading, made smaller only if it must be to fit.
export async function single(png, heading, edge) {
  const m = await sharp(png).metadata()
  let scale = Math.min(1, edge / m.width)
  let w = Math.round(m.width * scale)
  let head = await strip(heading, w)
  if (Math.round(m.height * scale) + head.height + GAP > edge) {
    scale = (edge - head.height - GAP) / m.height
    w = Math.round(m.width * scale)
    head = await strip(heading, w)
    while (Math.round(m.height * scale) + head.height + GAP > edge) {
      scale -= 0.005
      w = Math.round(m.width * scale)
      head = await strip(heading, w)
    }
  }
  const h = Math.round(m.height * scale)
  const pic = await sharp(png).removeAlpha().resize(w, h, { fit: 'fill' }).png().toBuffer()
  return { png: await out([{ input: head.png, left: 0, top: 0 }, { input: pic, left: 0, top: head.height + GAP }], w, h + head.height + GAP), scale }
}

// Pictures of one size in a grid, each with its label in a strip under it. `exact` keeps a tile at its own size and refuses to resize it.
export async function grid(tiles, heading, { edge, columns, tileW, tileH, labelSize = 13, exact = false }) {
  const rows = Math.ceil(tiles.length / columns)
  const width = columns * tileW + GAP * (columns - 1)
  const head = await strip(heading, width)
  const labels = []
  for (const t of tiles) labels.push(await strip(t.label, tileW, labelSize))
  const labelH = Math.max(...labels.map((l) => l.height))
  const height = head.height + GAP + rows * (tileH + labelH) + GAP * (rows - 1)
  if (width > edge || height > edge) throw new Error(`pack: a grid of ${tiles.length} pictures of ${tileW} by ${tileH} is ${width} by ${height}, over ${edge} px`)
  const parts = [{ input: head.png, left: 0, top: 0 }]
  for (let i = 0; i < tiles.length; i++) {
    const x = (i % columns) * (tileW + GAP)
    const y = head.height + GAP + Math.floor(i / columns) * (tileH + labelH + GAP)
    const m = await sharp(tiles[i].png).metadata()
    if (exact && (m.width !== tileW || m.height !== tileH)) throw new Error(`pack: a crop of ${m.width} by ${m.height} would be resized to ${tileW} by ${tileH}`)
    const pic = exact ? await sharp(tiles[i].png).removeAlpha().png().toBuffer() : await sharp(tiles[i].png).removeAlpha().resize(tileW, tileH, { fit: 'contain', background: GROUND }).png().toBuffer()
    parts.push({ input: pic, left: x, top: y })
    parts.push({ input: labels[i].png, left: x, top: y + tileH })
  }
  return out(parts, width, height)
}

const cut = (png, [x, y, w, h]) => sharp(png).removeAlpha().extract({ left: x, top: y, width: w, height: h }).png().toBuffer()

// A window of a fixed size round a box, kept inside the picture.
export function windowRound(box, w, h, width, height) {
  const cx = box[0] + box[2] / 2
  const cy = box[1] + box[3] / 2
  const x = Math.round(Math.max(0, Math.min(width - w, cx - w / 2)))
  const y = Math.round(Math.max(0, Math.min(height - h, cy - h / 2)))
  return [x, y, w, h]
}

const inside = (box, win) => box[0] + box[2] / 2 >= win[0] && box[0] + box[2] / 2 <= win[0] + win[2] && box[1] + box[3] / 2 >= win[1] && box[1] + box[3] / 2 <= win[1] + win[3]

// The two runs of type most at risk on a page at rest: the smallest, and the one with the least contrast outside the first window.
export function riskyType(runs, w, h, width, height) {
  const seen = runs.filter((r) => r.text && r.text.trim() && r.box[2] > 0 && r.box[3] > 0 && inside(r.box, [0, 0, width, height]))
  if (!seen.length) return []
  const small = [...seen].sort((a, b) => a.px - b.px || a.contrast - b.contrast || a.box[1] - b.box[1] || a.box[0] - b.box[0])[0]
  const first = { run: small, window: windowRound(small.box, w, h, width, height), why: `its smallest type, ${small.px.toFixed(1)} px` }
  const rest = seen.filter((r) => !inside(r.box, first.window)).sort((a, b) => a.contrast - b.contrast || a.px - b.px || a.box[1] - b.box[1] || a.box[0] - b.box[0])
  if (!rest.length) return [first]
  return [first, { run: rest[0], window: windowRound(rest[0].box, w, h, width, height), why: `its type with the least contrast, ${rest[0].px.toFixed(1)} px` }]
}

// The boxes of the controls a visitor can see, read from the page.
const controlBoxes = (page) =>
  page.evaluate(() => {
    const host = document.getElementById('controls')
    if (!host) return []
    const shown = (e) => {
      for (let n = e; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
      }
      return true
    }
    return [...host.querySelectorAll('button, a, input, svg, span, output, time')]
      .filter(shown)
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 6 && r.height > 6)
      .map((r) => [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)])
  })

// Joins boxes that touch once each is grown by `pad`, then gives windows of w by h over each cluster: one if it fits, its two ends if it is wider.
export function controlWindows(boxes, w, h, width, height, pad = 40) {
  const grown = boxes.map((b) => [b[0] - pad, b[1] - pad, b[2] + pad * 2, b[3] + pad * 2])
  const clusters = []
  for (const b of grown) {
    let box = b
    for (;;) {
      const i = clusters.findIndex((c) => c[0] < box[0] + box[2] && box[0] < c[0] + c[2] && c[1] < box[1] + box[3] && box[1] < c[1] + c[3])
      if (i < 0) break
      const c = clusters.splice(i, 1)[0]
      const x0 = Math.min(c[0], box[0])
      const y0 = Math.min(c[1], box[1])
      box = [x0, y0, Math.max(c[0] + c[2], box[0] + box[2]) - x0, Math.max(c[1] + c[3], box[1] + box[3]) - y0]
    }
    clusters.push(box)
  }
  clusters.sort((a, b) => a[1] - b[1] || a[0] - b[0])
  const windows = []
  for (const c of clusters) {
    if (c[2] <= w) windows.push({ window: windowRound(c, w, h, width, height), part: '' })
    else {
      windows.push({ window: windowRound([c[0], c[1], w, c[3]], w, h, width, height), part: ', its left end' })
      windows.push({ window: windowRound([c[0] + c[2] - w, c[1], w, c[3]], w, h, width, height), part: ', its right end' })
    }
  }
  return windows
}

// Builds every file of a plan. Gives back, for each file, its PNG bytes and what the key file says of it.
export async function buildPack(cfg, plan, { tier = 'draft', log = () => {} } = {}) {
  const edge = cfg.critics.maxImageLongEdgePx
  const fps = cfg.film.fps
  const hd = cfg.formats.hd
  const files = plan.sets.flatMap((s) => s.files.map((f) => ({ ...f, set: s.set })))
  const session = await openSession({ format: hd.id, assets: 'full' })
  const built = new Map()
  const about = new Map()
  const problems = session.problems
  try {
    const stillOf = async (spec, wholePage = false) => {
      await session.page.evaluate(async (s) => {
        window.showcase.setDiagnostic('beauty')
        await window.showcase.renderStill(s)
      }, spec)
      return wholePage ? readPage(session) : readCanvas(session.page)
    }
    const rest = new Map()
    const restOf = async (unit) => {
      if (!rest.has(unit)) rest.set(unit, await stillOf({ page: unit, camera: 'home', tier }))
      return rest.get(unit)
    }
    const units = cfg.film.units.map((u) => u.id)
    const pageNo = (unit) => units.indexOf(unit) + 1
    const shown = Math.round(Math.min(1, edge / hd.width) * 100)

    for (const f of files.filter((x) => x.kind === 'page')) {
      const got = await single(await restOf(f.unit), `${f.heading}, shown at ${shown}% of its size`, edge)
      built.set(f.name, got.png)
      about.set(f.name, { still: { page: f.unit, camera: 'home', tier }, format: hd.id, scale: Number(got.scale.toFixed(4)) })
      log(`${f.name}: the page ${f.unit} at rest`)
    }

    for (const f of files.filter((x) => x.kind === 'type-crops')) {
      const perPage = 2
      const columns = perPage
      const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
      const rowsWanted = f.units.length
      const tileH = Math.min(360, Math.floor((edge - 46 - GAP * rowsWanted) / rowsWanted) - 30)
      const tiles = []
      const crops = []
      for (const unit of f.units) {
        const png = await restOf(unit)
        const state = await session.page.evaluate((s) => window.showcase.stillState(s), { page: unit, camera: 'home', tier })
        const picks = riskyType(state.type, tileW, tileH, hd.width, hd.height)
        for (const p of picks) {
          tiles.push({ png: await cut(png, p.window), label: `Page ${pageNo(unit)}: ${p.why}` })
          crops.push({ unit, key: p.run.key, text: p.run.text, px: p.run.px, contrast: Number(p.run.contrast.toFixed(2)), window: p.window })
        }
        for (let i = picks.length; i < perPage; i++) {
          const w = [Math.round((hd.width - tileW) / 2), Math.round((hd.height - tileH) / 2), tileW, tileH]
          tiles.push({ png: await cut(png, w), label: `Page ${pageNo(unit)}: its middle` })
          crops.push({ unit, window: w })
        }
      }
      built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH, exact: true }))
      about.set(f.name, { crops, format: hd.id, tier })
      log(`${f.name}: ${tiles.length} crops of type`)
    }

    const screens = new Map()
    const wantScreen = files.some((x) => x.kind === 'screen' || x.kind === 'control-crops')
    if (wantScreen) {
      const entry = cfg.stills.find((s) => s.id === 'screen-live')
      const { spec } = stillFrom({ id: entry.id, tier })
      const png = await stillOf(spec, true)
      screens.set('live', { png, boxes: await controlBoxes(session.page), spec })
      const context = await session.browser.newContext({ viewport: { width: hd.width, height: hd.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
      const page = await context.newPage()
      page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
      await page.goto(`${session.server.url}/index.html?mode=film`)
      await page.waitForFunction(() => document.querySelector('#controls')?.children.length > 0, null, { timeout: 120000 })
      await page.waitForTimeout(2500)
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
      const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: hd.width, height: hd.height } })
      screens.set('film', { png: shot, boxes: await controlBoxes(page), spec: { url: 'index.html?mode=film', reducedMotion: 'reduce', at: 0 } })
      await context.close()
    }
    for (const f of files.filter((x) => x.kind === 'screen')) {
      const s = screens.get(f.screen)
      const got = await single(s.png, `${f.heading}, shown at ${shown}% of its size`, edge)
      built.set(f.name, got.png)
      about.set(f.name, { screen: f.screen, spec: s.spec, format: hd.id, scale: Number(got.scale.toFixed(4)) })
      log(`${f.name}: the screen with ${f.screen === 'live' ? 'the application' : 'the film'}`)
    }
    for (const f of files.filter((x) => x.kind === 'control-crops')) {
      const columns = 2
      const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
      const tileH = 200
      const tiles = []
      const crops = []
      for (const [name, words] of [['live', 'With the application'], ['film', 'With the film']]) {
        const s = screens.get(name)
        for (const w of controlWindows(s.boxes, tileW, tileH, hd.width, hd.height)) {
          tiles.push({ png: await cut(s.png, w.window), label: `${words}: its controls${w.part}` })
          crops.push({ screen: name, window: w.window })
        }
      }
      if (!tiles.length) throw new Error('pack: the screen shows no control to crop')
      built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH, exact: true }))
      about.set(f.name, { crops, format: hd.id })
      log(`${f.name}: ${tiles.length} crops of the controls`)
    }

    const cams = files.filter((x) => x.kind === 'cameras')
    const total = cams.reduce((n, f) => n + f.cameras.length, 0)
    let seen = 0
    for (const f of cams) {
      const tiles = []
      const specs = []
      for (const c of f.cameras) {
        const { spec } = stillFrom({ ...c.from, tier })
        const png = await stillOf(spec)
        seen += 1
        tiles.push({ png, label: `Camera ${seen} of ${total}. It is for: ${c.purpose}.` })
        specs.push({ camera: c.camera, from: c.from, still: spec })
      }
      if (tiles.length === 1) built.set(f.name, (await single(tiles[0].png, `${f.heading}. ${tiles[0].label}`, edge)).png)
      else {
        const columns = 2
        const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
        built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH: Math.round((tileW * hd.height) / hd.width) }))
      }
      about.set(f.name, { cameras: specs, format: hd.id, tier })
      log(`${f.name}: ${tiles.length} camera${tiles.length > 1 ? 's' : ''}`)
    }

    const sheets = files.filter((x) => x.kind === 'film-sheet' || x.kind === 'beat-sheet')
    if (sheets.length) {
      const preview = cfg.formats.preview
      await session.page.evaluate((id) => window.showcase.setFormat(id), preview.id)
      const frames = [...new Set(sheets.flatMap((f) => f.frames))].sort((a, b) => a - b)
      const got = new Map()
      let n = 0
      for (const frame of frames) {
        await session.page.evaluate(async ([i, t]) => {
          window.showcase.setDiagnostic('beauty')
          await window.showcase.renderFilmFrame(i, t)
        }, [frame, tier])
        got.set(frame, await readCanvas(session.page))
        n += 1
        if (n % 24 === 0) log(`film frames: ${n} of ${frames.length}`)
      }
      for (const f of sheets) {
        const columns = 3
        const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
        const tiles = f.frames.map((frame) => ({ png: got.get(frame), label: timeLabel(frame, fps) }))
        built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH: Math.round((tileW * preview.height) / preview.width) }))
        about.set(f.name, { unit: f.unit, beat: f.beat || null, frames: f.frames, format: preview.id, tier })
        log(`${f.name}: ${f.kind === 'beat-sheet' ? `the beat ${f.beat}` : `the film, ${f.unit}`}`)
      }
    }
  } finally {
    await session.close()
  }
  return { files: files.map((f) => ({ name: f.name, set: f.set, kind: f.kind, heading: f.heading, png: built.get(f.name), about: about.get(f.name) })), browser: session.version, problems: [...new Set(problems)] }
}
