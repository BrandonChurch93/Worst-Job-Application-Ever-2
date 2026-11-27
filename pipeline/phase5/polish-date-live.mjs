// Polish date: the live site at step 2, a picture of every sixtieth of a second while a row's tray opens, without the pack.
// node pipeline/phase5/polish-date-live.mjs walk LABEL ORDER [LEVEL]   ORDER is the rows to press, as 123, 321 or 2, or self (self2: the first two rows that open themselves)
// node pipeline/phase5/polish-date-live.mjs measure LABEL
// node pipeline/phase5/polish-date-live.mjs sheet LABEL ROW NAME [FIRST COUNT STRIDE ZOOM COLS]
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { openSession } from '../../tools/lib/capture.mjs'

const [, , what, label = 'run', ...rest] = process.argv
const cfg = JSON.parse(fs.readFileSync('config/showcase.json', 'utf8'))
const HZ = 60
const STEPS = cfg.sim.stepHz / HZ
const FIELD = { x: 1000, w: 792, h: cfg.scale.sizes.field, pitch: 149, gap: 12, tray: 250 }
// The pictures kept of one opening: from this many before the row starts to open to this many after.
const KEEP = { before: 2, after: 30 }
// A pixel of the tray's floor is part of a machine's edge when it differs from its left neighbour by more than this many levels.
const EDGE = 9
const dir = path.join('out', 'work', 'polish-date', label)

const send = async (page, act) => {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down()
  else if (act.up) await page.mouse.up()
}

// The tray's height on a step after the row began to open: the page's own spring (src/pages/step2/index.ts), stepped the same way.
const tallAt = (steps) => {
  let v = 0
  let x = 0
  for (let i = 0; i < steps; i++) {
    v += (300 * (1 - x) - 27 * v) / cfg.sim.stepHz
    x += v / cfg.sim.stepHz
  }
  return Math.max(4, Math.round(FIELD.tray * Math.min(1, Math.max(0, x))))
}

if (what === 'walk') {
  const [order = '123', level = 'high'] = rest
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&clock=steps&quality=${level}&step=2` })
  const page = session.page
  await page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  const tell = (ticks, shot) =>
    page.evaluate(([d, s]) => {
      const r = d > 0 ? window.liveRun.advance(d, !s) : null
      const t = window.liveRun.told()
      return { time: t.time, page: t.page, hint: t.hint, png: r && s ? r.png : '' }
    }, [ticks / HZ, shot])
  const self = order.startsWith('self')
  const picks = self ? [] : [...order].map((c) => Number(c) - 1)
  const rows = self ? Number(order.slice(4) || 3) : picks.length
  const done = [false, false, false]
  const opened = []
  let tick = 0
  let closedSince = 0
  let t = await tell(0, false)
  let top = null
  const closedAt = (h) => Boolean(h) && Math.abs(h.x - (FIELD.x + FIELD.w / 2)) < 0.01
  const shoot = async (row, press) => {
    const start = tick
    for (let n = -KEEP.before; n <= KEEP.after; n++) {
      if (press && n === 0) await send(page, { down: true })
      if (press && n === 2) await send(page, { up: true })
      t = await tell(1, true)
      tick++
      fs.writeFileSync(path.join(dir, `row${row + 1}-${String(n + KEEP.before).padStart(3, '0')}.png`), Buffer.from(t.png.split(',')[1], 'base64'))
    }
    opened.push({ row, tick: start, press })
  }
  try {
    await send(page, { move: [300, 900] })
    while (opened.length < rows && t.page === 'step2' && tick < 400 * HZ) {
      if (!closedAt(t.hint)) {
        t = await tell(self ? 1 : 15, false)
        tick += self ? 1 : 15
        if (closedAt(t.hint)) closedSince = tick
        continue
      }
      const first = done.indexOf(false)
      if (first < 0) break
      if (top === null) top = t.hint.y - FIELD.h / 2 - first * FIELD.pitch
      if (self) {
        const wait = closedSince + cfg.live.skipLinkAfterSeconds * HZ - KEEP.before - 3 - tick
        t = await tell(wait, false)
        tick += wait
        await shoot(first, false)
        if (closedAt(t.hint)) throw new Error(`row ${first + 1} did not open by itself`)
        done[first] = true
      } else {
        const pick = picks.find((i) => !done[i])
        await send(page, { move: [FIELD.x + 40, top + pick * FIELD.pitch + 12] })
        t = await tell(40, false)
        tick += 40
        await shoot(pick, true)
        if (closedAt(t.hint)) throw new Error(`row ${pick + 1} did not open`)
        done[pick] = true
        await send(page, { move: [300, 900] })
      }
    }
  } finally {
    await session.close()
  }
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ order, level, top, opened }) + '\n')
  console.log(JSON.stringify({ order, level, top, opened }))
} else if (what === 'measure') {
  const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'))
  for (const o of run.opened) {
    const y0 = run.top + o.row * FIELD.pitch + FIELD.h + FIELD.gap
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(`row${o.row + 1}-`)).sort()
    const grey = async (f) => (await sharp(path.join(dir, f)).extract({ left: FIELD.x, top: y0, width: FIELD.w, height: FIELD.tray }).greyscale().raw().toBuffer())
    const last = await grey(files.at(-1))
    const lines = []
    let prev = null
    let opens = -1
    for (let n = 0; n < files.length; n++) {
      const g = await grey(files[n])
      let moved = 0
      if (prev) for (let i = 0; i < g.length; i++) if (Math.abs(g[i] - prev[i]) > 3) moved++
      if (opens < 0 && prev && moved > 200) opens = n
      prev = g
      const steps = opens < 0 ? 0 : (n - opens + 1) * STEPS
      const tall = opens < 0 ? 0 : tallAt(steps)
      let edges = 0
      for (let y = 16; y < tall - 16; y++) for (let x = 20; x < FIELD.w - 20; x++) if (Math.abs(g[y * FIELD.w + x] - g[y * FIELD.w + x - 1]) > EDGE) edges++
      let far = 0
      for (let i = 0; i < g.length; i++) far += Math.abs(g[i] - last[i])
      lines.push({ n, steps, tall, edges, moved, far: far / g.length })
    }
    console.log(`row ${o.row + 1} (${run.order}, ${run.level}): picture, steps since the row began to open, tray height by the page's spring, edge pixels inside the tray, pixels changed since the picture before, mean distance from the last picture`)
    for (const l of lines) console.log(`  ${String(l.n).padStart(2)}  ${String(l.steps).padStart(3)}  ${String(l.tall).padStart(3)}  ${String(l.edges).padStart(6)}  ${String(l.moved).padStart(6)}  ${l.far.toFixed(2)}`)
  }
} else if (what === 'sheet') {
  const [row, name, first = '0', count = '36', stride = '1', zoom = '1', cols = '3', wide = String(FIELD.w + 40), high = String(FIELD.h + FIELD.gap + FIELD.tray + 36)] = rest
  const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'))
  const y0 = run.top + (Number(row) - 1) * FIELD.pitch - 14
  const w = Number(wide)
  const h = Number(high)
  const z = Number(zoom)
  const tiles = []
  for (let n = Number(first); tiles.length < Number(count); n += Number(stride)) {
    const file = path.join(dir, `row${row}-${String(n).padStart(3, '0')}.png`)
    if (!fs.existsSync(file)) break
    tiles.push({ png: await sharp(file).extract({ left: FIELD.x + FIELD.w + 20 - w, top: y0, width: w, height: h }).resize(Math.round(w * z), Math.round(h * z)).png().toBuffer(), text: `picture ${n}: ${((n - KEEP.before) / HZ).toFixed(3)} s` })
  }
  const C = Number(cols)
  const tw = Math.round(w * z)
  const th = Math.round(h * z)
  const bar = 20
  const W = C * (tw + 4)
  const H = bar + Math.ceil(tiles.length / C) * (th + bar)
  const marks = tiles.map((tile, n) => `<text x="${(n % C) * (tw + 4) + 4}" y="${bar + Math.floor(n / C) * (th + bar) + th + 14}" font-family="sans-serif" font-size="12" fill="#fff">${tile.text}</text>`).join('')
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="4" y="14" font-family="sans-serif" font-size="12" fill="#fff">${label}, row ${row}, order ${run.order}, level ${run.level}: every ${Number(stride) === 1 ? '' : stride + ' '}sixtieth of a second, ${z === 1 ? 'real size' : `at ${z} of real size`}; 0.000 s is the press</text>${marks}</svg>`
  const out = path.join('out', 'work', 'polish-date', `${label}-${name}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#18181b' } })
    .composite([...tiles.map((tile, n) => ({ input: tile.png, left: (n % C) * (tw + 4), top: bar + Math.floor(n / C) * (th + bar) })), { input: Buffer.from(head), left: 0, top: 0 }])
    .png()
    .toFile(out)
  console.log(out, tiles.length)
} else {
  console.log('say walk LABEL ORDER [LEVEL], measure LABEL or sheet LABEL ROW NAME [FIRST COUNT STRIDE ZOOM COLS]')
}
