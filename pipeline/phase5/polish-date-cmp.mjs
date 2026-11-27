import sharp from 'sharp'
import fs from 'node:fs'
const [, , A, B, x, y, w, h] = process.argv
const box = x ? { left: +x, top: +y, width: +w, height: +h } : null
for (const f of fs.readdirSync(A).filter((f) => f.endsWith('.png')).sort()) {
  if (!fs.existsSync(`${B}/${f}`)) continue
  const load = async (p) => { let s = sharp(p).removeAlpha(); if (box) s = s.extract(box); return s.raw().toBuffer({ resolveWithObject: true }) }
  const a = await load(`${A}/${f}`), b = await load(`${B}/${f}`)
  let n = 0, most = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  const W = a.info.width
  for (let i = 0; i < a.data.length; i += 3) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]))
    if (d > 0) { n++; most = Math.max(most, d); const px = (i / 3) % W, py = Math.floor(i / 3 / W); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py) }
  }
  console.log(f, 'differing px', n, 'most', most, n ? `box ${x0 + (box?.left ?? 0)},${y0 + (box?.top ?? 0)}..${x1 + (box?.left ?? 0)},${y1 + (box?.top ?? 0)}` : '')
}
