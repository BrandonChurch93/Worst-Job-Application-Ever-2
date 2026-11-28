// The sets of pictures of look 1. Each renders hand-written views and writes one sheet, the target beside the render where there is one.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { viewOf, SHEET_ZOOM } from './bosslook-lib.mjs'

const CENTRE = { x: 960, y: 548 }
// The targets have the hull's centre at (967, 546) of 1920 by 1080.
const sheetCam = { cx: CENTRE.x - 7 / SHEET_ZOOM, cy: CENTRE.y - (546 - 540) / SHEET_ZOOM + (548 - 548), zoom: SHEET_ZOOM }

const text = (sharp, words, w, h = 44) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#111"/><text x="14" y="${h - 14}" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#eee">${words}</text></svg>`)).png().toBuffer()

// Lays pictures in a grid with a caption over each, and writes the sheet no wider than 1400 px.
export async function sheet(sharp, file, cells, cols, cellW) {
  const rows = Math.ceil(cells.length / cols)
  const parts = []
  let y = 0
  for (let r = 0; r < rows; r++) {
    let rowH = 0
    for (let c = 0; c < cols; c++) {
      const cell = cells[r * cols + c]
      if (!cell) continue
      const img = await sharp(cell.png).resize({ width: cellW }).png().toBuffer()
      const m = await sharp(img).metadata()
      parts.push({ input: await text(sharp, cell.caption, cellW, 36), left: c * cellW, top: y })
      parts.push({ input: img, left: c * cellW, top: y + 36 })
      rowH = Math.max(rowH, m.height + 36)
    }
    y += rowH
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await sharp({ create: { width: cols * cellW, height: y, channels: 3, background: '#111111' } }).composite(parts).jpeg({ quality: 88 }).toFile(file)
  return file
}

// The targets live on main; a branch made before them reads them from there.
const target = (at, name, folder = 'references/approved-002') => (fs.existsSync(at(folder, name)) ? fs.readFileSync(at(folder, name)) : execFileSync('git', ['show', `origin/main:${folder}/${name}`], { cwd: at(), maxBuffer: 1 << 28 }))

const SOCKET = { x: 960, y: 960 }
const ease = (t) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u) }
// The boss on his way from the socket to the slab, as b_boss_builder's rules move him: there by the time he lands (form 0.34).
const forming = (f) => {
  const u = ease((f - 0.06) / (0.34 - 0.06))
  return viewOf({ time: f * 2.9, phase: 'form' }, { form: f, x: SOCKET.x + (CENTRE.x - SOCKET.x) * u, y: SOCKET.y + (CENTRE.y - SOCKET.y) * u })
}
const turret = (t, late = 0) => viewOf({ time: 3.05 + t * 1.6 + late, phase: t >= 1 ? 'fight' : 'turret' }, { turret: t, locked: t >= 1, lockedAt: t >= 1 ? 4.65 : null })

// A row of moments: each view rendered with one camera, laid in a grid.
async function moments({ look, sharp, outDir, workDir, tier }, name, items, cam, cols, size = [960, 540]) {
  const cells = []
  for (const [caption, view, own] of items) {
    const r = await look.render({ view, ...cam, ...(own || {}), width: size[0], height: size[1], tier })
    fs.writeFileSync(path.join(workDir, `${name}-${cells.length}.png`), r.png)
    cells.push({ png: r.png, caption })
  }
  return sheet(sharp, path.join(outDir, `${name}.jpg`), cells, cols, Math.floor(1400 / cols))
}

export const SETS = {
  forming: (c) => moments(c, 'forming', [0.04, 0.1, 0.2, 0.36, 0.5, 0.64, 0.8, 1].map((f) => [`form ${f.toFixed(2)} (${(f * 2.9).toFixed(2)} s)`, forming(f)]), { cx: 960, cy: 730, zoom: 1.5, options: { pit: true } }, 4, [720, 720]),
  turret: (c) => moments(c, 'turret', [...[0, 0.1, 0.3, 0.5, 0.7, 0.88, 0.97].map((t) => [`turret ${t.toFixed(2)} (${(t * 1.6).toFixed(2)} s)`, turret(t)]), ['turret 1.00, 0.08 s after the lock', turret(1, 0.08)]], { cx: 940, cy: 548, zoom: 2.3 }, 4),
  walking: (c) => moments(c, 'walking', [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [`walked ${i * 10} px`, viewOf({ time: 10 + i / 6 }, { turret: 1, locked: true, x: 960 - i * 10, vx: -60, walked: i * 10 })]), { cx: 925, cy: 548, zoom: 2.3 }, 4),

  async states({ look, sharp, at, outDir, workDir, tier }) {
    const inside = await look.render({ view: viewOf(), ...sheetCam, width: 1920, height: 1080, tier })
    const out = await look.render({ view: viewOf({}, { turret: 1, locked: true }), ...sheetCam, width: 1920, height: 1080, tier })
    fs.writeFileSync(path.join(workDir, 'inside.png'), inside.png)
    fs.writeFileSync(path.join(workDir, 'out.png'), out.png)
    console.log(`  inside: ${JSON.stringify(inside.stats)}; out: ${JSON.stringify(out.stats)}`)
    return sheet(sharp, path.join(outDir, 'states.jpg'), [
      { png: target(at, 'boss-turret-inside.png'), caption: 'TARGET: turret inside' }, { png: inside.png, caption: `BUILD: turret inside (${tier})` },
      { png: target(at, 'boss-turret-out.png'), caption: 'TARGET: turret out' }, { png: out.png, caption: `BUILD: turret out (${tier})` }
    ], 2, 700)
  }
}

const out = { turret: 1, locked: true }
const g = (aim, tell = 0, firedAt = null) => ({ aim, tell, firedAt })
const bullet = (id, x, y, vx, vy) => ({ id, x, y, vx, vy, r: 9.5, from: 'gun' })
// The big blast as b_boss_builder sends it: from 274 px ahead of the centre along the heading to the page's edge.
const big = (tell, firedAt) => ({ tell, aim: Math.PI, firedAt, x0: CENTRE.x - 274, y0: CENTRE.y, x1: 0, y1: CENTRE.y, width: 46 })
const wide = { cx: 700, cy: 548, zoom: 1.25 }
const near = { cx: 940, cy: 548, zoom: 2.3 }

const MORE = {
  firing: (c) => moments(c, 'firing', [
    ['guns aim, tell 0.5', viewOf({ time: 10 }, { ...out, guns: [g(2.5, 0.5), g(-2.6, 0.5)] })],
    ['tell 1.0', viewOf({ time: 10.2 }, { ...out, guns: [g(2.5, 1), g(-2.6, 1)] })],
    ['fired, 0.02 s', viewOf({ time: 10.32, bullets: [bullet(1, 960 - 79 * 0 + Math.cos(2.5) * 100, 548 - 79 + Math.sin(2.5) * 100 + 60, Math.cos(2.5) * 420, Math.sin(2.5) * 420)] }, { ...out, guns: [g(2.5, 0, 10.3), g(-2.6, 1)] })],
    ['fired, 0.12 s', viewOf({ time: 10.42, bullets: [bullet(1, 820, 640, Math.cos(2.5) * 420, Math.sin(2.5) * 420), bullet(2, 850, 440, Math.cos(-2.6) * 420, Math.sin(-2.6) * 420)] }, { ...out, guns: [g(2.5, 0, 10.3), g(-2.6, 0, 10.4)] })],
    ['bullets and hits (round, glance, arrow)', viewOf({ time: 11, bullets: [bullet(1, 700, 700, -300, 300), bullet(2, 760, 380, -380, -180), bullet(3, 640, 560, -420, 20), bullet(4, 1150, 720, 300, 300)], hits: [{ id: 1, at: 10.95, x: 620, y: 420, kind: 'round' }, { id: 2, at: 10.93, x: 812, y: 548, kind: 'glance' }, { id: 3, at: 10.9, x: 1090, y: 560, kind: 'arrow' }] }, { ...out, shield: { glancedAt: 10.93, half: 0.5 }, guns: [g(2.5, 0, 10.2), g(-2.6, 0, 10.3)] })],
    ['the same, heading turned 0.6 rad', viewOf({ time: 11, bullets: [bullet(1, 700, 700, -300, 300), bullet(2, 760, 380, -380, -180)] }, { ...out, heading: Math.PI + 0.6, guns: [g(2.2, 0.6), g(-2.9, 0)] })]
  ], near, 3),

  blast: (c) => moments(c, 'blast', [
    ['big.tell 0.4', viewOf({ time: 20 }, { ...out, big: big(0.4, null) })],
    ['big.tell 1.0', viewOf({ time: 20.9 }, { ...out, big: big(1, null) })],
    ['fired, 0.03 s', viewOf({ time: 21.03 }, { ...out, big: big(1, 21) })],
    ['fired, 0.20 s', viewOf({ time: 21.2 }, { ...out, big: big(1, 21) })],
    ['after, 0.45 s', viewOf({ time: 21.45 }, { ...out, big: big(0, 21) })],
    ['after, 1.0 s', viewOf({ time: 22 }, { ...out, big: big(0, 21) })]
  ], wide, 3),

  damage: (c) => moments(c, 'damage', [
    ['stage 0', viewOf({ time: 30 }, { ...out })],
    ['stage 1', viewOf({ time: 30 }, { ...out, stage: 1, health: 0.6 })],
    ['stage 2', viewOf({ time: 30 }, { ...out, stage: 2, health: 0.25 })],
    ['open flank (boss.weak)', viewOf({ time: 30.3 }, { ...out, stage: 1, weak: { x: CENTRE.x + 196, y: CENTRE.y, shownAt: 30 } })],
    ['hit, 0.05 s after hitAt', viewOf({ time: 30.05 }, { ...out, stage: 1, hitAt: 30, health: 0.5 })],
    ['heal, 0.2 s after healedAt', viewOf({ time: 30.2 }, { ...out, stage: 1, healedAt: 30 })]
  ], near, 3),

  gone: (c) => moments(c, 'gone', [0.03, 0.2, 0.4, 0.6, 0.8, 0.95].map((g) => [`gone ${g.toFixed(2)} (${(g * 2.13).toFixed(2)} s)`, viewOf({ time: 46 + g * 2.13, phase: 'beaten' }, { ...out, stage: 2, health: 0, beaten: 1, gone: g })]), { cx: 960, cy: 548, zoom: 1.7 }, 3),

  async beaten({ look, sharp, at, outDir, workDir, tier }) {
    const cells = [{ png: target(at, 'LOOK-1-STATE-3-beaten.png', 'references/drafts/round-9'), caption: 'GUIDE, not picked: beaten' }]
    for (const [caption, b] of [['beaten 0.08', 0.08], ['beaten 0.3', 0.3], ['beaten 0.55', 0.55], ['beaten 0.75', 0.75], ['beaten 1.0, lying', 1]]) {
      const r = await look.render({ view: viewOf({ time: 40 + b + (b >= 1 ? 2 : 0), phase: 'beaten' }, { ...out, stage: 2, health: 0, beaten: b }), ...sheetCam, width: 1920, height: 1080, tier })
      fs.writeFileSync(path.join(workDir, `beaten-${cells.length}.png`), r.png)
      cells.push({ png: r.png, caption: `BUILD: ${caption}` })
    }
    return sheet(sharp, path.join(outDir, 'beaten.jpg'), cells, 3, 466)
  },

  async page({ look, sharp, at, outDir, workDir, tier }) {
    const full = { cx: 960, cy: 540, zoom: 1, width: 1920, height: 1080, tier }
    const a = await look.render({ view: viewOf(), ...full })
    const b = await look.render({ view: viewOf({ time: 11, bullets: [bullet(1, 700, 700, -300, 300), bullet(2, 760, 380, -380, -180), bullet(3, 560, 560, -420, 20), bullet(4, 1250, 780, 300, 300), bullet(5, 420, 300, -300, -200)] }, { ...out, guns: [g(2.5, 0.7), g(-2.6, 0, 10.97)] }), ...full })
    const d = await look.render({ view: viewOf({ time: 21.1 }, { ...out, big: big(1, 21) }), ...full })
    fs.writeFileSync(path.join(workDir, 'page-inside.png'), a.png)
    fs.writeFileSync(path.join(workDir, 'page-fight.png'), b.png)
    fs.writeFileSync(path.join(workDir, 'page-blast.png'), d.png)
    return sheet(sharp, path.join(outDir, 'page.jpg'), [
      { png: target(at, 'boss-arena.png'), caption: 'TARGET: the arena (the boss at his size on the page)' }, { png: a.png, caption: `BUILD: the whole page, turret inside (${tier})` },
      { png: b.png, caption: 'BUILD: the whole page, a fight frame' }, { png: d.png, caption: 'BUILD: the whole page, the big blast at 0.1 s' }
    ], 2, 700)
  }
}

// What he costs, MEASURED on this machine: his own triangles and draws by state, and the frame time at each live level with and without him.
MORE.counts = async ({ look, at, outDir }) => {
  const full = { cx: 960, cy: 540, zoom: 1, width: 1920, height: 1080 }
  const states = {
    'turret inside': viewOf(),
    'turret out': viewOf({}, out),
    'forming, form 0.36': forming(0.36),
    'fight frame: 12 bullets, a gun firing, stage 2': viewOf({ time: 11, bullets: Array.from({ length: 12 }, (_, i) => bullet(i, 300 + i * 110, 300 + (i % 4) * 150, 300, 200)) }, { ...out, stage: 2, guns: [g(2.5, 0.7), g(-2.6, 0, 10.97)] }),
    'big blast at 0.1 s': viewOf({ time: 21.1 }, { ...out, big: big(1, 21) }),
    'beaten 0.2': viewOf({ time: 40.2, phase: 'beaten' }, { ...out, stage: 2, beaten: 0.2 })
  }
  const rows = []
  const file = path.join(outDir, 'counts.json')
  const levels = (process.env.BOSSLOOK_LEVELS ?? 'low,medium,high').split(',')
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).rows.filter((r) => !levels.includes(r.level)) : []
  for (const level of levels) {
    for (const [name, view] of Object.entries(states)) {
      const r = await look.timing({ view, ...full, level }, 5)
      rows.push({ level, state: name, ownTriangles: Math.round(r.own.triangles), ownDraws: r.own.draws, frameTriangles: r.frame.triangles, frameDrawCalls: r.frame.drawCalls, bareTriangles: r.bare.triangles, bareDrawCalls: r.bare.drawCalls, msWith: +r.withMs.toFixed(2), msWithout: +r.withoutMs.toFixed(2) })
      console.log('  ' + JSON.stringify(rows[rows.length - 1]))
    }
  }
  fs.writeFileSync(file, JSON.stringify({ note: 'MEASURED by tools/bosslook.mjs counts in the headless browser of the helper machine, 1920 by 1080; own = the meshes of the boss alone in one pass, frame = the whole frame with him over all passes, bare = the same frame without him; ms is the median of 5 frames drawn by the software renderer of that machine, so only the two columns against each other mean anything', rows: [...old, ...rows] }, null, 2) + '\n')
  return file
}
Object.assign(SETS, MORE)
