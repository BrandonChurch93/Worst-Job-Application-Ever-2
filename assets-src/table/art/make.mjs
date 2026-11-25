// Makes every picture of the printed floors: node assets-src/table/art/make.mjs [--tier corporate|office|street] [--set web|full] [--only art|inserts|guide]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createServer } from 'vite'
import { hash2, svg, rect } from './lib.mjs'
import { PAL, corporate, guide, office, street, tierOf } from './tiers.mjs'
import { insertAtlases } from './inserts.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')
const at = (...p) => path.join(root, ...p)
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? null : process.argv[i + 1]
}
const config = JSON.parse(fs.readFileSync(at('config', 'showcase.json'), 'utf8'))
const SETS = { web: { dir: at('public', 'assets', 'table', 'art'), width: config.assetSets.web.tableArtWidth, data: 2048, quality: 88 }, full: { dir: at('assets-full', 'table', 'art'), width: config.assetSets.full.tableArtWidth, data: 4096, quality: 92 } }
const MASK = { width: 2048, sigma: 9, threshold: 7 }
const SEED = config.seed
// Where the corporate print is gold leaf, by rule: red above blue by more than `from`, full metal `over` further on.
const FOIL = { from: 24, over: 50 }
// How a painted base is used. Corporate: the marble is the floor itself. Office and street: only the light and dark of the painted material is laid over the drawn ground, so the tones stay those of the print.
const PAINTED = { corporate: { as: 'base', brightness: 0.82, saturation: 1.05 }, office: { as: 'detail', gain: 1.5 }, street: { as: 'detail', gain: 1.6 } }

async function layout() {
  const server = await createServer({ root, configFile: at('vite.config.ts'), server: { middlewareMode: true, hmr: false, watch: null, ws: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } })
  const L = await server.ssrLoadModule('/src/table/layout.ts')
  const out = { TIER_Y: L.TIER_Y, TH: L.TH, W: L.W, TIERS: L.TIERS, COLS: L.COLS, MID: L.MID, FLIP: L.FLIP, OUTLANE: L.OUTLANE, table: JSON.parse(JSON.stringify(L.table)) }
  await server.close()
  return out
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const smooth = (t) => t * t * (3 - 2 * t)
function value(x, y, s) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const a = hash2(x0, y0, s)
  const b = hash2(x0 + 1, y0, s)
  const c = hash2(x0, y0 + 1, s)
  const d = hash2(x0 + 1, y0 + 1, s)
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}
const fbm = (x, y, s, oct) => {
  let v = 0
  let amp = 0.5
  let fr = 1
  let sum = 0
  for (let i = 0; i < oct; i++) {
    v += value(x * fr, y * fr, s + i * 17) * amp
    sum += amp
    amp *= 0.5
    fr *= 2
  }
  return v / sum
}

// The tone under the print, before any line: marble for the lobby, flat felt for the office, asphalt for the street.
function ground(id, w, h) {
  const pal = PAL[id]
  const a = hex(pal.base)
  const b = hex(pal.base2)
  const data = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * 20
      const v = (y / w) * 20
      let t
      let add = 0
      if (id === 'corporate') {
        const n = fbm(u * 0.45, v * 0.45, SEED + 3, 5)
        t = smooth(Math.min(1, Math.max(0, (n - 0.3) * 2.2)))
        const vein = Math.pow(1 - Math.abs(Math.sin(u * 0.9 + v * 0.55 + n * 9)), 26)
        const vein2 = Math.pow(1 - Math.abs(Math.sin(u * 0.35 - v * 1.2 + fbm(u * 0.8, v * 0.8, SEED + 9, 4) * 11)), 40)
        add = vein * 34 + vein2 * 22
      } else if (id === 'office') {
        t = fbm(u * 0.8, v * 0.8, SEED + 5, 3)
      } else {
        const n = fbm(u * 0.6, v * 0.6, SEED + 7, 5)
        t = n
        add = (fbm(u * 6, v * 6, SEED + 13, 2) - 0.5) * 10
      }
      const i = (y * w + x) * 3
      for (let c = 0; c < 3; c++) data[i + c] = Math.max(2, Math.min(250, Math.round(a[c] + (b[c] - a[c]) * t + add * (c === 2 ? 1.25 : c === 1 ? 0.95 : 0.7))))
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 3 } })
}

// Fine grain at the scale of the print: felt pile, asphalt grit, the tooth of ink on a board.
function grain(id, size, cell) {
  const amp = { corporate: 9, office: 30, street: 24 }[id]
  const data = Buffer.alloc(size * size * 3)
  const n = size / cell
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell)
      const cy = Math.floor(y / cell)
      let g = hash2(cx % n, cy % n, SEED + 21) - 0.5
      if (id === 'street' && hash2(cx % n, cy % n, SEED + 33) > 0.985) g = 1.4
      if (id === 'office') g = g * 0.6 + (hash2(Math.floor(cx / 2) % (n / 2), cy % n, SEED + 41) - 0.5) * 0.5
      const v = Math.max(0, Math.min(255, Math.round(128 + g * amp * 2)))
      const i = (y * size + x) * 3
      data[i] = data[i + 1] = data[i + 2] = v
    }
  }
  return sharp(data, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer()
}

const DRAW = { corporate: (D) => corporate(D), office: (D) => office(D, SEED + 101), street: (D) => street(D, SEED + 202) }

async function art(L, k, set) {
  const id = L.TIERS[k]
  const D = tierOf(L, k)
  const S = SETS[set]
  const w = S.width
  const h = Math.round((w * 9) / 16)
  const d = DRAW[id](D)
  const layers = []
  const painted = path.join(here, 'painted', `${id}.png`)
  const has = fs.existsSync(painted)
  if (d.ground.length) layers.push({ input: Buffer.from(svg(w, h, d.defs, d.ground)) })
  if (has && PAINTED[id].as === 'detail') {
    const grey = sharp(painted).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).greyscale()
    const mean = (await grey.clone().stats()).channels[0].mean
    const gain = PAINTED[id].gain
    layers.push({ input: await grey.linear(gain, 128 - gain * mean).toColourspace('srgb').png({ compressionLevel: 1 }).toBuffer(), blend: 'overlay' })
  }
  layers.push({ input: await grain(id, 512, w > 4096 ? 2 : 1), tile: true, blend: 'soft-light' })
  layers.push({ input: Buffer.from(svg(w, h, d.defs, d.top)) })
  const base = has && PAINTED[id].as === 'base' ? await sharp(painted).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).modulate({ brightness: PAINTED[id].brightness, saturation: PAINTED[id].saturation }).removeAlpha().png({ compressionLevel: 1 }).toBuffer() : await ground(id, 1280, 720).resize(w, h, { kernel: 'cubic' }).png().toBuffer()
  const out = await sharp(base, { limitInputPixels: false }).composite(layers).removeAlpha().toColourspace('srgb').linear(0.972, 4).png({ compressionLevel: 1 }).toBuffer()
  fs.mkdirSync(S.dir, { recursive: true })
  await sharp(out, { limitInputPixels: false }).webp({ quality: S.quality, effort: 4, smartSubsample: true }).toFile(path.join(S.dir, `${id}.webp`))
  const mh = Math.round((MASK.width * 9) / 16)
  const design = await sharp({ create: { width: MASK.width, height: mh, channels: 3, background: PAL[id].base } })
    .composite([...(d.ground.length ? [{ input: Buffer.from(svg(MASK.width, mh, d.defs, d.ground)) }] : []), { input: Buffer.from(svg(MASK.width, mh, d.defs, d.top)) }])
    .png({ compressionLevel: 1 })
    .toBuffer()
  await mask(design, path.join(S.dir, `${id}-mask.png`))
  await coat(L, k, path.join(S.dir, `${id}-coat.png`), S.data, id === 'corporate' ? out : null)
  return out
}

// The coverage mask, by rule: a place is printed where the drawn design (the tone of the floor with every drawn layer, without the painted material and without the grain, which are not marks) differs from its own neighbourhood (a blur of MASK.sigma texels at MASK.width wide) by more than MASK.threshold of 255 in luminance.
async function mask(artPng, file) {
  const w = MASK.width
  const h = Math.round((w * 9) / 16)
  const grey = sharp(artPng, { limitInputPixels: false }).resize(w, h, { kernel: 'lanczos3' }).greyscale()
  const sharpRaw = await grey.clone().raw().toBuffer()
  const soft = await grey.clone().blur(MASK.sigma).raw().toBuffer()
  const out = Buffer.alloc(w * h)
  let white = 0
  for (let i = 0; i < out.length; i++) {
    const on = Math.abs(sharpRaw[i] - soft[i]) > MASK.threshold
    out[i] = on ? 245 : 10
    if (on) white++
  }
  await sharp(out, { raw: { width: w, height: h, channels: 1 } }).png({ compressionLevel: 9 }).toFile(file)
  return white / out.length
}

// The clear coat's roughness in green (as three.js reads it): smooth everywhere, a little duller along the lines the ball runs most, where it has worn the lacquer. Blue is how much of a place is metal leaf: the gold of the corporate floor, nothing on the others.
async function coat(L, k, file, w, gilded) {
  const D = tierOf(L, k)
  const h = Math.round((w * 9) / 16)
  const lo = 14
  const run = (d, sw, o) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`
  const m = D.MID
  const left = D.flippers.find((f) => f.side === 'left').pivot
  const fl = { left }
  const paths = []
  const lane = (D.COLS.launchA + D.COLS.launchB) / 2
  for (const s of [-1, 1]) {
    const px = m + s * (m - fl.left[0])
    const tip = m + s * 1.0
    paths.push(run(`M${px} ${fl.left[1]} Q${m + s * 2.2} ${fl.left[1] - 2.2} ${m + s * 0.6} 4.2`, 0.34, 0.5))
    paths.push(run(`M${px - s * 0.2} ${fl.left[1]} Q${m - s * 2.5} 6 ${m - s * 4.6} 3.2`, 0.3, 0.42))
    paths.push(run(`M${m + s * 5.9} 7.2 L${m + s * 5.9} 8.4 L${px} ${fl.left[1] + 0.25} L${tip} ${fl.left[1] + 1.5}`, 0.36, 0.55))
    paths.push(run(`M${m + s * 4.4} 5 Q${m + s * 2} 7 ${m + s * 0.5} 10.9`, 0.3, 0.3))
  }
  paths.push(run(`M${lane} 11.2 L${lane} 1.4 Q${lane} 1.05 ${D.COLS.right - 0.4} 1.05 L${D.COLS.left + 0.6} 1.05`, 0.4, 0.6))
  paths.push(run(`M${m} 7.9 L${m} 11.25`, 0.5, 0.45))
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 20 11.25"><rect width="20" height="11.25" fill="#000"/><g filter="url(#b)">${paths.join('')}</g><defs><filter id="b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.07"/></filter></defs></svg>`
  const trail = await sharp(Buffer.from(body)).greyscale().raw().toBuffer()
  const gold = gilded ? await sharp(gilded, { limitInputPixels: false }).resize(w, h, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer() : null
  const out = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    const x = i % w
    const y = (i / w) | 0
    const scuff = hash2(x >> 1, y >> 1, SEED + 77 + k)
    const fine = trail[i] / 255
    const g = lo + fine * (34 + scuff * 26) + (hash2(x >> 3, y >> 3, SEED + 91) - 0.5) * 5
    out[i * 3] = 128
    out[i * 3 + 1] = Math.max(4, Math.min(250, Math.round(g)))
    out[i * 3 + 2] = gold ? Math.round(Math.max(0, Math.min(1, (gold[i * 3] - gold[i * 3 + 2] - FOIL.from) / FOIL.over)) * 250) : 0
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } }).png({ compressionLevel: 9 }).toFile(file)
}

async function main() {
  const L = await layout()
  const only = arg('only')
  const tiers = arg('tier') ? [L.TIERS.indexOf(arg('tier'))] : [0, 1, 2]
  const sets = arg('set') ? [arg('set')] : ['web', 'full']
  if (!only || only === 'guide') {
    fs.mkdirSync(path.join(here, 'guide'), { recursive: true })
    for (const k of tiers) await sharp(Buffer.from(svg(1920, 1080, [], guide(tierOf(L, k))))).png().toFile(path.join(here, 'guide', `${L.TIERS[k]}.png`))
  }
  if (!only || only === 'art') {
    for (const set of sets) {
      for (const k of tiers) {
        const t0 = process.hrtime.bigint()
        const png = await art(L, k, set)
        if (set === 'web') {
          fs.mkdirSync(at('out', 'work', 'art'), { recursive: true })
          await sharp(png).resize(1920, 1080).png().toFile(at('out', 'work', 'art', `${L.TIERS[k]}-1920.png`))
        }
        console.log(`${set} ${L.TIERS[k]} ${(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1)} s`)
      }
    }
  }
  if (!only || only === 'inserts') {
    for (const set of sets) await insertAtlases(config.table.inserts, SETS[set].dir, set === 'full' ? 768 : 384)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
