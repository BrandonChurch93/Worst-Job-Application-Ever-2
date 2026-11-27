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
const turret = (t) => viewOf({ time: 3.05 + t * 1.6, phase: t >= 1 ? 'fight' : 'turret' }, { turret: t, locked: t >= 1 })

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
  turret: (c) => moments(c, 'turret', [0, 0.1, 0.3, 0.5, 0.66, 0.78, 0.84, 1].map((t) => [`turret ${t.toFixed(2)} (${(t * 1.6).toFixed(2)} s)`, turret(t)]), { cx: 940, cy: 548, zoom: 2.3 }, 4),
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
