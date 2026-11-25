// Drawing helpers of the floor art: everything is an SVG string in balls, in the frame of one tier (u to the right, v down the tier).
export const f = (n) => Number(n.toFixed(4))
export const rad = (d) => (d * Math.PI) / 180

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hash2 = (x, y, s) => {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1)) | 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${typeof v === 'number' ? f(v) : v}"`)
    .join(' ')

export const el = (tag, o, inner) => (inner === undefined ? `<${tag} ${attrs(o)}/>` : `<${tag} ${attrs(o)}>${inner}</${tag}>`)
export const g = (o, items) => el('g', o, items.flat(9).join(''))
export const stroke = (col, w, extra = {}) => ({ fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra })
export const line = (a, b, col, w, extra) => el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...stroke(col, w, extra) })
export const poly = (pts, col, w, extra) => el('polyline', { points: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' '), ...stroke(col, w, extra) })
export const shape = (pts, fill, extra = {}) => el('polygon', { points: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' '), fill, ...extra })
export const ring = (c, r, col, w, extra) => el('circle', { cx: c[0], cy: c[1], r, ...stroke(col, w, extra) })
export const dot = (c, r, fill, extra = {}) => el('circle', { cx: c[0], cy: c[1], r, fill, ...extra })
export const rect = (x, y, w, h, o = {}) => el('rect', { x, y, width: w, height: h, ...o })
export const path = (d, o) => el('path', { d, ...o })

export const polar = (c, r, deg) => [c[0] + r * Math.cos(rad(deg)), c[1] + r * Math.sin(rad(deg))]

// An arc of a circle from one angle to another, in degrees, clockwise as seen (v runs down).
export function arc(c, r, a0, a1, col, w, extra) {
  const p0 = polar(c, r, a0)
  const p1 = polar(c, r, a1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return path(`M${f(p0[0])} ${f(p0[1])} A${f(r)} ${f(r)} 0 ${large} ${sweep} ${f(p1[0])} ${f(p1[1])}`, stroke(col, w, extra))
}

// Rays of a fan between two radii.
export function rays(c, r0, r1, a0, a1, n, col, w, extra) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? a0 : a0 + ((a1 - a0) * i) / (n - 1)
    out.push(line(polar(c, r0, a), polar(c, r1, a), col, w, extra))
  }
  return out
}

export function star(c, rIn, rOut, n, fill, extra = {}, turn = 0) {
  const pts = []
  for (let i = 0; i < n * 2; i++) pts.push(polar(c, i % 2 ? rIn : rOut, turn + (i * 180) / n))
  return shape(pts, fill, extra)
}

// A chevron that points along a direction given in degrees.
export function chevron(c, deg, s, col, w, extra) {
  const a = polar(c, s * 0.75, deg + 140)
  const b = polar(c, s * 0.75, deg - 140)
  const tip = polar(c, s * 0.45, deg)
  return poly([a, tip, b], col, w, { 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', ...extra })
}

// A solid arrow head with a notch, pointing along a direction.
export function arrow(c, deg, s, fill, extra = {}) {
  return shape([polar(c, s * 0.6, deg), polar(c, s * 0.62, deg + 135), polar(c, s * 0.12, deg + 180), polar(c, s * 0.62, deg - 135)], fill, extra)
}

export const dirDeg = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])

// A polyline moved sideways by a distance: positive is to the right of travel.
export function beside(pts, off) {
  return pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [q[0] - ((b[1] - a[1]) / d) * off, q[1] + ((b[0] - a[0]) / d) * off]
  })
}

// Points along a polyline at equal steps, with the direction of travel at each.
export function along(pts, step, start = 0) {
  const out = []
  let need = start
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const d = dist(a, b)
    while (need <= d) {
      out.push({ p: lerp(a, b, d ? need / d : 0), deg: dirDeg(a, b) })
      need += step
    }
    need -= d
  }
  return out
}

// A box with a keyline round it, a contact tone under it and brackets at its corners: the print that answers a standing part.
export function footprint(b, pal, o = {}) {
  const d = o.off ?? 0.1
  const [x, y, w, h] = [b[0] - d, b[1] - d, b[2] + 2 * d, b[3] + 2 * d]
  const out = [rect(x, y, w, h, { fill: pal.under, rx: o.rx ?? 0.05 }), rect(x, y, w, h, { ...stroke(pal.key, 0.022), rx: o.rx ?? 0.05 })]
  const e = d + 0.07
  out.push(rect(b[0] - e, b[1] - e, b[2] + 2 * e, b[3] + 2 * e, { ...stroke(pal.fine, 0.008), rx: (o.rx ?? 0.05) + 0.05 }))
  const k = 0.16
  const q = d + 0.14
  for (const [cx, cy, sx, sy] of [[b[0] - q, b[1] - q, 1, 1], [b[0] + b[2] + q, b[1] - q, -1, 1], [b[0] - q, b[1] + b[3] + q, 1, -1], [b[0] + b[2] + q, b[1] + b[3] + q, -1, -1]]) {
    out.push(poly([[cx + sx * k, cy], [cx, cy], [cx, cy + sy * k]], pal.key, 0.016, { 'stroke-linecap': 'square', 'stroke-linejoin': 'miter' }))
  }
  return out
}

export const svg = (w, h, defs, body, view = '0 0 20 11.25') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${view}"><defs>${defs.flat(9).join('')}</defs>${body.flat(9).join('')}</svg>`
