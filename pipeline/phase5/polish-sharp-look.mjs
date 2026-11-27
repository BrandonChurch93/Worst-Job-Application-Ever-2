// Two looks for the sharpness measures. `texels BEAUTY TEXELS APPROVED OUT`: the numbers M2 counts and a sheet of the beauty, the approved picture and three maps. `detail BEAUTY APPROVED OUT [BEFORE]`: the fine detail M3 sums, in blocks of 32 px, for the build and the approved picture, with the ratio per block.
import fs from 'node:fs'
import sharp from 'sharp'
import { highFrequencyEnergy } from '../../tools/lib/measure-core.mjs'

const config = JSON.parse(fs.readFileSync(new URL('../../config/showcase.json', import.meta.url), 'utf8'))
const TEXEL_RANGE = 4
const COC_RANGE = 8
const BLOCK = 32
const lin = Float32Array.from({ length: 256 }, (_, i) => {
  const v = i / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
})
const raw = async (file, w, h) => {
  let s = sharp(file).removeAlpha()
  if (w) s = s.resize(w, h, { fit: 'cover' })
  const { data, info } = await s.raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}
const png = (rgb, w, h) => sharp(Buffer.from(rgb.buffer), { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
// A value from 0 to 1 as a colour: black, blue, cyan, green, yellow, red, white.
const ramp = (v) => {
  const stops = [[0, 0, 0], [0, 0, 255], [0, 255, 255], [0, 255, 0], [255, 255, 0], [255, 0, 0], [255, 255, 255]]
  const t = Math.max(0, Math.min(1, v)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t))
  const f = t - i
  return stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f))
}
const label = (text, w) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44"><rect width="100%" height="100%" fill="#111"/><text x="12" y="30" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" fill="#fff">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`)).png().toBuffer()
async function stack(panels, w, h, out, cols = 1) {
  const rows = Math.ceil(panels.length / cols)
  const parts = []
  for (let i = 0; i < panels.length; i++) {
    const x = (i % cols) * w
    const y = Math.floor(i / cols) * (h + 44)
    parts.push({ input: await label(panels[i][0], w), left: x, top: y })
    parts.push({ input: panels[i][1], left: x, top: y + 44 })
  }
  await sharp({ create: { width: w * cols, height: rows * (h + 44), channels: 3, background: '#000' } }).composite(parts).png().toFile(out)
}

const [mode, ...a] = process.argv.slice(2)
if (mode === 'texels') {
  const [beautyFile, texelFile, approvedFile, out] = a
  const t = await raw(texelFile)
  const { width: w, height: h } = t
  const n = w * h
  const mark = new Uint8Array(n * 3)
  const coc = new Uint8Array(n * 3)
  const den = new Uint8Array(n * 3)
  let textured = 0
  let counted = 0
  let soft = 0
  let sharpAll = 0
  const box = [w, h, 0, 0]
  const hist = new Array(9).fill(0)
  for (let i = 0; i < n; i++) {
    const o = i * t.channels
    const tex = lin[t.data[o + 1]] >= 0.5
    const c = lin[t.data[o + 2]] * COC_RANGE
    const d = lin[t.data[o]] * TEXEL_RANGE
    const inFocus = c < config.detail.focusCocPx
    if (inFocus) sharpAll++
    hist[Math.min(8, Math.floor(c))]++
    if (tex) {
      textured++
      if (inFocus) {
        counted++
        if (d < config.detail.minTexelsPerPixel) soft++
        box[0] = Math.min(box[0], i % w)
        box[1] = Math.min(box[1], Math.floor(i / w))
        box[2] = Math.max(box[2], i % w)
        box[3] = Math.max(box[3], Math.floor(i / w))
      }
    }
    mark.set(tex ? (inFocus ? [0, 255, 0] : [0, 90, 0]) : inFocus ? [90, 90, 90] : [0, 0, 0], i * 3)
    coc.set(ramp(c / COC_RANGE), i * 3)
    den.set(tex ? ramp(d / TEXEL_RANGE) : [40, 40, 40], i * 3)
  }
  console.log(JSON.stringify({ pixels: n, textured, texturedInFocus: counted, softInFocus: soft, share: counted ? soft / counted : null, inFocusAnySurface: sharpAll, boxOfCounted: counted ? box : null, cocHistogramPx: hist }))
  await stack(
    [
      ['build, beauty', await sharp(beautyFile).removeAlpha().resize(w, h).png().toBuffer()],
      ['approved picture at the same size', await sharp(approvedFile).removeAlpha().resize(w, h, { fit: 'cover' }).png().toBuffer()],
      ['where a texture is: green textured (bright: blur circle under 1.5 px), grey untextured and in focus, black untextured and out of focus', await png(mark, w, h)],
      ['blur circle, 0 to 8 px: black, blue 1.3, cyan 2.7, green 4, yellow 5.3, red 6.7, white 8', await png(coc, w, h)],
      ['texels per screen pixel on textured pixels, 0 to 4: black, blue 0.7, cyan 1.3, green 2, yellow 2.7, red 3.3, white 4; dark grey untextured', await png(den, w, h)],
    ],
    w,
    h,
    out,
  )
} else if (mode === 'detail') {
  const [beautyFile, approvedFile, out, beforeFile] = a
  const b = await raw(beautyFile)
  const { width: w, height: h } = b
  const ap = await raw(approvedFile, w, h)
  const before = beforeFile ? await raw(beforeFile) : null
  const energy = (p) => {
    const lum = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) lum[i] = (0.2126 * p.data[i * p.channels] + 0.7152 * p.data[i * p.channels + 1] + 0.0722 * p.data[i * p.channels + 2]) / 255
    const bw = Math.ceil(w / BLOCK)
    const bh = Math.ceil(h / BLOCK)
    const sum = new Float64Array(bw * bh)
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        const v = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w]
        sum[Math.floor(y / BLOCK) * bw + Math.floor(x / BLOCK)] += v * v
      }
    return { sum, bw, bh, total: highFrequencyEnergy(p.data, w, h, p.channels) }
  }
  const eb = energy(b)
  const ea = energy(ap)
  const eo = before ? energy(before) : null
  const all = (w - 2) * (h - 2)
  const map = (f) => {
    const rgb = new Uint8Array(w * h * 3)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rgb.set(f(Math.floor(y / BLOCK) * eb.bw + Math.floor(x / BLOCK)), (y * w + x) * 3)
    return png(rgb, w, h)
  }
  const top = Math.max(...ea.sum, ...eb.sum)
  const tone = (s) => ramp(Math.log10(1 + (s / top) * 999) / 3)
  // A block is named when the approved picture holds a real share of its detail there and the build holds less than the least ratio of it.
  const least = config.detail.minSharpnessRatio
  const ratioColour = (k) => {
    const r = eb.sum[k] / Math.max(ea.sum[k], 1e-9)
    if (ea.sum[k] / all < ea.total / (eb.bw * eb.bh) / 4 && eb.sum[k] / all < ea.total / (eb.bw * eb.bh) / 4) return [20, 20, 20]
    return r < 0.4 ? [200, 0, 0] : r < least ? [255, 140, 0] : r < 1.25 ? [0, 150, 0] : [0, 110, 255]
  }
  const bands = []
  const cols = 6
  const rows = 4
  for (let ry = 0; ry < rows; ry++)
    for (let rx = 0; rx < cols; rx++) {
      let sa = 0
      let sb = 0
      let so = 0
      for (let by = 0; by < eb.bh; by++)
        for (let bx = 0; bx < eb.bw; bx++) {
          if (Math.floor((bx * BLOCK * cols) / w) !== rx || Math.floor((by * BLOCK * rows) / h) !== ry) continue
          sa += ea.sum[by * eb.bw + bx]
          sb += eb.sum[by * eb.bw + bx]
          if (eo) so += eo.sum[by * eb.bw + bx]
        }
      bands.push({ cell: `col ${rx + 1} row ${ry + 1}`, x: [Math.round((rx * w) / cols), Math.round(((rx + 1) * w) / cols)], y: [Math.round((ry * h) / rows), Math.round(((ry + 1) * h) / rows)], approvedShare: Number((sa / all / ea.total).toFixed(4)), buildShareOfApprovedTotal: Number((sb / all / ea.total).toFixed(4)), ...(eo ? { beforeShareOfApprovedTotal: Number((so / all / ea.total).toFixed(4)) } : {}), ratio: Number((sb / Math.max(sa, 1e-9)).toFixed(3)) })
    }
  console.log(JSON.stringify({ build: eb.total, approved: ea.total, ratio: eb.total / ea.total, ...(eo ? { before: eo.total, ratioBefore: eo.total / ea.total } : {}), cells: bands }, null, 1))
  const panels = [
    [`build, beauty: fine detail ${eb.total.toExponential(4)}, ratio ${(eb.total / ea.total).toFixed(4)}`, await sharp(beautyFile).removeAlpha().png().toBuffer()],
    [`approved picture at the same size: fine detail ${ea.total.toExponential(4)}`, await png(Uint8Array.from(ap.data), w, h)],
    ['build: fine detail per block of 32 px (log scale, the same for both)', await map((k) => tone(eb.sum[k]))],
    ['approved: fine detail per block of 32 px', await map((k) => tone(ea.sum[k]))],
    [`build over approved per block: red under 0.4, orange under ${least}, green to 1.25, blue over; dark where neither holds detail`, await map(ratioColour)],
  ]
  if (before) panels.push([`build before: fine detail ${eo.total.toExponential(4)}, ratio ${(eo.total / ea.total).toFixed(4)}`, await sharp(beforeFile).removeAlpha().png().toBuffer()])
  await stack(panels, w, h, out, 2)
} else {
  console.log('texels BEAUTY TEXELS APPROVED OUT | detail BEAUTY APPROVED OUT [BEFORE]')
  process.exit(1)
}
