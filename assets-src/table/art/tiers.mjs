// The drawn layer of the three floors, exactly on the layout. Everything is read from src/table/layout.ts; nothing here types a place of a part in.
import { along, arc, beside, dirDeg, dist, dot, el, f, footprint, g, lerp, line, lineWeight, path, polar, poly, rays, rect, ring, rng, shape, star, stroke } from './lib.mjs'

const chevron = () => ''
const arrow = () => ''

export const PAL = {
  corporate: { base: '#081229', base2: '#0f2147', key: '#e3bd62', fine: '#c4a252', pale: '#ecd797', under: '#070f27', dark: '#040a1a', lane: '#060e22', accent: '#27468a', soft: '#1b3466' },
  office: { base: '#496268', base2: '#40575d', key: '#a39468', fine: '#77856f', plain: true, pale: '#b4bcb2', under: '#26373c', dark: '#162226', lane: '#26373c', accent: '#4d6268', soft: '#435860' },
  street: { base: '#0a1c30', base2: '#12304a', key: '#c3ccc9', fine: '#5f858e', pale: '#dcdfd6', under: '#07182a', dark: '#040d17', lane: '#081b2c', accent: '#b89a38', soft: '#19425a', fan: '#4f757d', fan2: '#33575f', plain: true }
}

// One tier of the layout in its own frame: u across, v down from the top of the tier, in balls.
export function tierOf(L, k) {
  const y0 = L.TIER_Y[k]
  const p = (q) => [q[0], q[1] - y0]
  const box = (b) => [b[0], b[1] - y0, b[2], b[3]]
  const t = L.table
  const inTier = (pt) => pt[1] >= y0 - 0.01 && pt[1] <= y0 + L.TH + 0.01
  return {
    k,
    id: L.TIERS[k],
    W: L.W,
    H: L.TH,
    COLS: L.COLS,
    MID: L.MID,
    FLIP: L.FLIP,
    OUTLANE: L.OUTLANE,
    segs: t.segs.filter((s) => s.tier === k).map((s) => ({ ...s, a: p(s.a), b: p(s.b) })),
    posts: t.posts.filter((s) => s.tier === k).map((s) => ({ ...s, c: p(s.c) })),
    models: t.models.filter((s) => s.tier === k).map((s) => ({ ...s, box: box(s.box) })),
    bumpers: t.bumpers.filter((s) => s.tier === k).map((s) => ({ ...s, c: p(s.c) })),
    slings: t.slings.filter((s) => s.tier === k).map((s) => ({ ...s, a: p(s.a), b: p(s.b), c: p(s.c) })),
    targets: t.targets.filter((s) => s.tier === k).map((s) => ({ ...s, box: box(s.box) })),
    inserts: t.inserts.filter((s) => s.tier === k).map((s) => ({ ...s, c: p(s.c), lines: L.cardLines ? L.cardLines(s.mode) : 1 })),
    flippers: t.flippers.filter((s) => s.tier === k).map((s) => ({ ...s, pivot: p(s.pivot) })),
    holds: t.holds.filter((s) => s.tier === k).map((s) => ({ ...s, c: p(s.c) })),
    openings: t.openings.filter((s) => s.tier === k).map((s) => ({ ...s, a: p(s.a), b: p(s.b) })),
    displays: t.displays.filter((s) => s.tier === k).map((s) => ({ ...s, box: box(s.box) })),
    lamps: t.lamps.filter((s) => s.tier === k).map((s) => ({ ...s, c: p(s.c) })),
    flats: t.flats.filter((s) => s.tier === k).map((s) => ({ ...s, box: box(s.box) })),
    rails: t.rails.filter((r) => !r.hidden).map((r) => ({ id: r.id, pts: r.points.filter(inTier).map(p) })).filter((r) => r.pts.length > 1)
  }
}

const mir = (D, u) => D.W - u
const sides = (D) => [
  { id: 'left', m: (u) => u, s: 1 },
  { id: 'right', m: (u) => mir(D, u), s: -1 }
]
const md = (side, deg) => (side.s === 1 ? deg : 180 - deg)

export const shoulder = (D, side) => {
  const o = D.OUTLANE.inner
  return [[o, 8.0], [6.5, 8.62], [6.5, 9.1], [8.8, 10.8], [8.8, D.H], [o, D.H]].map((q) => [side.m(q[0]), q[1]])
}

// The clear margin under an insert. No card is printed there.
export const cardOf = (n) => [n.c[0] - 0.3, n.c[1] + n.r, 0.6, 0.2]

function banks(D) {
  const by = new Map()
  for (const t of D.targets) {
    const id = t.kind === 'drop' ? t.id.replace(/\.\d+$/, '') : t.id.startsWith('corporate.note') ? 'corporate.note' : t.id
    const b = by.get(id) ?? { id, kind: t.kind, n: t.n, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }
    b.x0 = Math.min(b.x0, t.box[0])
    b.y0 = Math.min(b.y0, t.box[1])
    b.x1 = Math.max(b.x1, t.box[0] + t.box[2])
    b.y1 = Math.max(b.y1, t.box[1] + t.box[3])
    by.set(id, b)
  }
  return [...by.values()]
}

// What stands on the floor, as black shapes: the mask that keeps a tier's filler pattern clear of them.
export function keepOut(D, more = []) {
  const k = '#000'
  const out = []
  for (const m of D.models) out.push(m.round ? dot([m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2], m.box[2] / 2 + 0.3, k) : rect(m.box[0] - 0.26, m.box[1] - 0.26, m.box[2] + 0.52, m.box[3] + 0.52, { fill: k, rx: 0.1 }))
  for (const n of D.inserts) {
    out.push(dot(n.c, n.r + 0.42, k))
    const c = cardOf(n)
    out.push(rect(c[0] - 0.08, c[1] - 0.08, c[2] + 0.16, c[3] + 0.16, { fill: k, rx: 0.1 }))
  }
  for (const b of D.bumpers) out.push(dot(b.c, b.r + 0.5, k))
  for (const s of D.slings) out.push(shape(grow([s.a, s.b, s.c], 0.34), k))
  for (const b of banks(D)) out.push(rect(b.x0 - 0.2, b.y0 - 0.2, b.x1 - b.x0 + 0.4, b.y1 - b.y0 + 0.4, { fill: k, rx: 0.08 }))
  for (const d of D.displays) out.push(rect(d.box[0] - 0.25, d.box[1] - 0.25, d.box[2] + 0.5, d.box[3] + 0.5, { fill: k, rx: 0.1 }))
  for (const l of D.lamps) out.push(dot(l.c, 0.36, k))
  for (const p of D.posts) out.push(dot(p.c, p.r + 0.3, k))
  for (const fl of D.flippers) out.push(dot(fl.pivot, 0.42, k))
  for (const h of D.holds) if (h.kind === 'scoop' || h.kind === 'hatch') out.push(dot(h.c, h.r + 0.42, k))
  for (const a of D.flats) out.push(rect(a.box[0] - 0.22, a.box[1] - 0.05, a.box[2] + 0.44, a.box[3] + 0.3, { fill: k }))
  out.push(rect(0, 0, D.W, 1.82, { fill: k }))
  for (const side of sides(D)) out.push(shape(shoulder(D, side), k))
  return [...out, ...more]
}

function grow(pts, d) {
  const c = [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length]
  return pts.map((q) => {
    const l = dist(c, q) || 1
    return [q[0] + ((q[0] - c[0]) / l) * d, q[1] + ((q[1] - c[1]) / l) * d]
  })
}

// The print every tier shares: the lanes with their arrows, and the answer under every standing part.
export function common(D, pal) {
  const lanes = []
  const answers = []
  const C = D.COLS
  const field = { x: C.left, y: 0.3, w: C.right - C.left, h: D.H - 0.3 }

  // The top lane: a band across the head of the tier, with arrows the way the ball travels.
  lanes.push(rect(field.x, 0.3, field.w, 1.5, { fill: pal.lane, opacity: 0.55 }))
  lanes.push(line([field.x + 0.12, 0.44], [C.right - 0.12, 0.44], pal.key, 0.02), line([field.x + 0.12, 0.5], [C.right - 0.12, 0.5], pal.fine, 0.008))
  lanes.push(line([field.x + 0.12, 1.72], [C.right - 0.12, 1.72], pal.key, 0.014), line([field.x + 0.12, 1.78], [C.right - 0.12, 1.78], pal.fine, 0.008))
  const top = D.lamps.filter((l) => l.id.includes('.top.lamp.')).sort((a, b) => a.c[0] - b.c[0])
  for (let i = 0; i < top.length; i++) {
    const l = top[i]
    const deg = dirDeg([0, 0], l.arrow)
    if (i > 0) {
      const mid = lerp(top[i - 1].c, l.c, 0.5)
      lanes.push(chevron([mid[0] + 0.14, mid[1]], deg, 0.34, pal.key, 0.05), chevron([mid[0] - 0.14, mid[1]], deg, 0.34, pal.pale, 0.03), chevron([mid[0] - 0.4, mid[1]], deg, 0.26, pal.fine, 0.02))
    }
  }

  // The launch lane and the lift lane: the same print, plainer, with the arrows up the page.
  for (const [a, b, mid, name] of [[C.launchA, C.launchB, C.launch, '.launch.lamp.'], [C.liftA, C.liftB, C.lift, '.lift.lamp.']]) {
    lanes.push(rect(a, 0, b - a, D.H, { fill: pal.lane, opacity: 0.5 }))
    for (const u of [a + 0.1, b - 0.1]) lanes.push(line([u, 0], [u, D.H], pal.key, 0.018), line([u + (u < mid ? 0.06 : -0.06), 0], [u + (u < mid ? 0.06 : -0.06), D.H], pal.fine, 0.008))
    const ls = D.lamps.filter((l) => l.id.includes(name)).sort((p, q) => p.c[1] - q.c[1])
    const vs = ls.map((l) => l.c[1])
    const gaps = []
    for (let i = 1; i < vs.length; i++) gaps.push((vs[i - 1] + vs[i]) / 2)
    if (vs.length) {
      const step = vs.length > 1 ? vs[1] - vs[0] : 2.4
      if (vs[0] - step / 2 > 0.5 && name === '.launch.lamp.') gaps.push(vs[0] - step / 2)
      if (vs[vs.length - 1] + step / 2 < D.H - 0.3) gaps.push(vs[vs.length - 1] + step / 2)
    }
    for (const v of gaps) {
      lanes.push(chevron([mid, v - 0.16], -90, 0.4, pal.key, 0.055), chevron([mid, v + 0.12], -90, 0.4, pal.pale, 0.03), chevron([mid, v + 0.4], -90, 0.3, pal.fine, 0.02))
    }
  }

  // A lamp in the floor has no printed surround: its seat is metal, and the print runs up to it.

  // Inlanes, outlanes, slings and flippers, the same on both sides.
  for (const side of sides(D)) {
    const m = side.m
    const o = D.OUTLANE.inner
    const outMid = (C.left + o) / 2
    const inMid = (o + 6.05) / 2
    const hatch = D.holds.find((h) => h.kind === 'hatch' && Math.abs(h.c[0] - m(outMid)) < 0.3)
    for (const v of [6.72, 8.15, 8.8, 9.45]) {
      if (hatch && Math.abs(v - hatch.c[1]) < 1.0) continue
      lanes.push(chevron([m(outMid), v - 0.1], 90, 0.36, pal.key, 0.05), chevron([m(outMid), v + 0.14], 90, 0.3, pal.fine, 0.022))
    }
    lanes.push(chevron([m(inMid), 6.62], 90, 0.36, pal.key, 0.05), chevron([m(inMid), 6.86], 90, 0.3, pal.fine, 0.022))
    const ga = [m(o), 8.0]
    const gb = [m(6.5), 8.62]
    const up = beside([ga, gb], side.s === 1 ? -0.42 : 0.42)
    for (const t of [0.22, 0.6]) lanes.push(chevron(lerp(up[0], up[1], t), dirDeg(ga, gb), 0.3, pal.key, 0.045))
    for (const d of [0.12, 0.18]) {
      const q = beside([ga, gb], side.s === 1 ? -d : d)
      lanes.push(line(q[0], q[1], d < 0.15 ? pal.key : pal.fine, d < 0.15 ? 0.018 : 0.008))
    }
    for (const d of [-0.11, 0.11]) lanes.push(line([m(o + d), 6.42], [m(o + d), 7.95], pal.fine, 0.01))
    lanes.push(line([m(C.left + 0.1), 5.2], [m(C.left + 0.1), 10.25], pal.key, 0.018), line([m(C.left + 0.16), 5.2], [m(C.left + 0.16), 10.25], pal.fine, 0.008))
    const pocket = [m(C.left + 0.1) - (side.s === 1 ? 0 : 1.2), 10.35, 1.2, 0.8]
    answers.push(rect(pocket[0] - 0.07, pocket[1] - 0.09, pocket[2] + 0.14, pocket[3] + 0.3, { ...stroke(pal.key, 0.02), rx: 0.08 }))

    const fl = D.flippers.find((x) => x.side === side.id)
    const rest = D.FLIP.rest
    const a0 = md(side, rest)
    const a1 = md(side, D.FLIP.up)
    const L = D.FLIP.length
    const fan = pal.fan ?? pal.key
    const fan2 = pal.fan2 ?? pal.fine
    answers.push(arc(fl.pivot, L + 0.1, a0, a1, fan, 0.022), arc(fl.pivot, L + 0.17, a0, a1, fan2, 0.008))
    if (!pal.plain) answers.push(rays(fl.pivot, L - 1.25, L + 0.1, a0, a1, 9, fan2, 0.01), arc(fl.pivot, L - 1.25, a0, a1, fan2, 0.008))
    answers.push(dot(fl.pivot, 0.4, pal.under), ring(fl.pivot, 0.36, pal.key, 0.025), ring(fl.pivot, 0.44, pal.fine, 0.008))

    const sl = D.slings.find((x) => x.side === side.id)
    const tri = [sl.a, sl.b, sl.c]
    answers.push(shape(grow(tri, 0.24), pal.under, { opacity: 0.9 }), shape(grow(tri, 0.24), 'none', stroke(pal.key, 0.022)), shape(grow(tri, 0.33), 'none', stroke(pal.fine, 0.008)))

    const sh = shoulder(D, side)
    const id = `sh-${D.id}-${side.id}`
    const stripes = []
    for (const [d, w, col] of [[0.14, 0.022, pal.key], [0.24, 0.009, pal.fine], [0.5, 0.008, pal.fine]]) {
      const e = beside([[m(o - 0.5), 8.0 - 0.1676], [m(6.5), 8.62], [m(6.5), 9.1], [m(8.8), 10.8], [m(8.8), D.H + 0.5]], side.s === 1 ? d : -d)
      stripes.push(poly(e, col, w, { 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' }))
    }
    answers.push(el('clipPath', { id }, shape(sh, '#000')), g({ 'clip-path': `url(#${id})` }, [shape(sh, pal.under, { opacity: 0.55 }), stripes]))
  }

  // The centre: the way down between the flippers.
  for (const v of [9.25, 9.8, 10.35]) lanes.push(chevron([D.MID, v - 0.1], 90, 0.42, pal.key, 0.05), chevron([D.MID, v + 0.16], 90, 0.34, pal.fine, 0.022))

  for (const p of D.posts) {
    if (p.c[1] < 0.3) continue
    const big = !!p.lamp
    answers.push(dot(p.c, p.r + (big ? 0.1 : 0.06), pal.under, { opacity: 0.7 }))
  }
  for (const b of D.bumpers) {
    answers.push(dot(b.c, b.r + 0.12, pal.under, { opacity: 0.7 }))
  }
  for (const m of D.models) {
    if (m.round) {
      const c = [m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2]
      const r = m.box[2] / 2
      answers.push(dot(c, r + 0.12, pal.under, { opacity: 0.8 }), ring(c, r + 0.12, pal.key, 0.024), ring(c, r + 0.2, pal.fine, 0.008))
    } else answers.push(footprint(m.box, pal, { off: m.box[2] < 0.6 ? 0.06 : 0.1 }))
  }
  for (const b of banks(D)) {
    const box = [b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0]
    answers.push(rect(box[0] - 0.09, box[1] - 0.09, box[2] + 0.18, box[3] + 0.18, { fill: pal.under, rx: 0.05 }), rect(box[0] - 0.09, box[1] - 0.09, box[2] + 0.18, box[3] + 0.18, { ...stroke(pal.key, 0.02), rx: 0.05 }))
    const n = b.n
    const cx = box[0] + box[2] / 2
    const cy = box[1] + box[3] / 2
    const count = b.kind === 'drop' ? 5 : b.kind === 'spinner' ? 2 : 3
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count - 0.5
      const along = n[0] !== 0 ? [0, box[3] * t] : [box[2] * t, 0]
      const reach = (n[0] !== 0 ? box[2] : box[3]) / 2 + 0.36
      const signs = b.kind === 'spinner' ? [1, -1] : [1]
      for (const sg of signs) {
        const c = [cx + along[0] + n[0] * reach * sg, cy + along[1] + n[1] * reach * sg]
        const deg = b.kind === 'spinner' ? 90 : dirDeg([0, 0], [-n[0], -n[1]])
        answers.push(arrow(c, deg, 0.24, pal.key))
      }
    }
  }
  for (const d of D.displays) {
    const b = d.box
    answers.push(rect(b[0] - 0.14, b[1] - 0.14, b[2] + 0.28, b[3] + 0.28, { fill: pal.dark, rx: 0.1, opacity: 0.85 }), rect(b[0] - 0.14, b[1] - 0.14, b[2] + 0.28, b[3] + 0.28, { ...stroke(pal.key, 0.024), rx: 0.1 }), rect(b[0] - 0.21, b[1] - 0.21, b[2] + 0.42, b[3] + 0.42, { ...stroke(pal.fine, 0.008), rx: 0.15 }))
  }
  for (const h of D.holds) {
    if (h.kind !== 'scoop' && h.kind !== 'hatch') continue
    answers.push(dot(h.c, h.r + 0.34, pal.under, { opacity: 0.85 }), ring(h.c, h.r + 0.17, pal.key, 0.03), ring(h.c, h.r + 0.34, pal.fine, 0.01))
  }
  return { lanes, answers }
}

// The windows: the print runs up to the metal seat of each lens, and only the hole under the lens is dark. No card: the kit puts no word at an insert.
export function insertsPrint(D, pal) {
  const out = []
  for (const n of D.inserts) out.push(dot(n.c, n.r + 0.012, pal.dark))
  return out
}

const railOf = (D, id) => D.rails.find((r) => r.id === id)

// The shadow track a wire ramp throws in print: a dotted line under it and a marked way onto it.
function underRamp(D, pal, id, col) {
  const r = railOf(D, id)
  if (!r) return []
  const out = []
  for (const off of [-0.36, 0.36]) out.push(poly(beside(r.pts, off), col ?? pal.fine, 0.01, { opacity: 0.5 }))
  const a = r.pts[0]
  const b = r.pts[1]
  const deg = dirDeg(a, b)
  for (const t of [-0.34, -0.08, 0.2]) out.push(chevron(lerp(a, b, t), deg, 0.34, pal.key, 0.045))
  return out
}

export function corporate(D) {
  const pal = PAL.corporate
  lineWeight(1.55)
  const defs = []
  const filler = []
  const local = []
  const hq = D.models.find((m) => m.part === 'model-hq').box
  const carpet = D.flats.find((a) => a.id.endsWith('carpet')).box
  const door = [hq[0] + hq[2] / 2, hq[1] + hq[3]]

  // The sunburst of the lobby: arcs and rays from the doors of the tower, over the whole floor.
  const radii = [2.5, 4.9, 8.1]
  for (const r of radii) filler.push(ring(door, r, pal.key, 0.016))
  for (let i = 0; i < radii.length - 1; i++) {
    const r0 = radii[i] + 0.07
    const r1 = radii[i + 1] - 0.05
    const n = [12, 24][i]
    for (let j = 0; j < n; j++) filler.push(line(polar(door, r0, (360 * (j + i * 0.5)) / n), polar(door, r1, (360 * (j + i * 0.5)) / n), pal.fine, 0.011))
  }
  // The lobby is laid in slabs: a dark joint with a pale arris beside it, square to the tower, and the scratches of play in the polish.
  const slab = 1.62
  for (let u = D.MID - slab / 2; u > D.COLS.left; u -= slab) filler.push(line([u, 0.3], [u, D.H], pal.dark, 0.02, { opacity: 0.9 }), line([u + 0.022, 0.3], [u + 0.022, D.H], pal.pale, 0.006, { opacity: 0.5 }))
  for (let u = D.MID + slab / 2; u < D.COLS.right; u += slab) filler.push(line([u, 0.3], [u, D.H], pal.dark, 0.02, { opacity: 0.9 }), line([u + 0.022, 0.3], [u + 0.022, D.H], pal.pale, 0.006, { opacity: 0.5 }))
  for (let v = door[1] + slab / 2; v < D.H; v += slab) filler.push(line([D.COLS.left, v], [D.COLS.right, v], pal.dark, 0.02, { opacity: 0.9 }), line([D.COLS.left, v + 0.022], [D.COLS.right, v + 0.022], pal.pale, 0.006, { opacity: 0.5 }))
  for (let v = door[1] - slab / 2; v > 0.3; v -= slab) filler.push(line([D.COLS.left, v], [D.COLS.right, v], pal.dark, 0.02, { opacity: 0.9 }), line([D.COLS.left, v + 0.022], [D.COLS.right, v + 0.022], pal.pale, 0.006, { opacity: 0.5 }))
  // The stone itself: the flecks of a dark polished granite, each smaller than a screw head.
  const fleckRand = rng(57)
  const fleck = [pal.accent, pal.soft, pal.pale, pal.dark, pal.fine].map((col, i) => ({ col, d: '', w: [0.013, 0.017, 0.008, 0.015, 0.009][i], o: [0.7, 0.6, 0.6, 0.7, 0.5][i] }))
  for (let i = 0; i < 60000; i++) {
    const q = [D.COLS.left + fleckRand() * (D.COLS.right - D.COLS.left), 0.3 + fleckRand() * (D.H - 0.3)]
    const k = [0, 0, 0, 1, 1, 1, 2, 3, 3, 4][Math.floor(fleckRand() * 10)]
    fleck[k].d += `M${f(q[0])} ${f(q[1])}h0.002`
  }
  const stone = fleck.map((q) => path(q.d, stroke(q.col, q.w, { opacity: q.o, 'stroke-linecap': 'round' })))
  stone.push(veins(D, 83, pal.pale, 90))
  const keep = keepOut(D)
  defs.push(el('mask', { id: 'keep-corporate', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: D.W, height: D.H }, rect(D.COLS.left, 0.3, D.COLS.right - D.COLS.left, D.H - 0.3, { fill: '#fff' }) + keep.join('')))

  // The keyline the red carpet lies in, and the gold lines from it down to the flippers.
  const cb = carpet
  local.push(rect(cb[0] - 0.08, cb[1], cb[2] + 0.16, cb[3] + 0.08, { fill: pal.under }), rect(cb[0] - 0.08, cb[1] - 0.02, cb[2] + 0.16, cb[3] + 0.1, stroke(pal.key, 0.03)), rect(cb[0] - 0.15, cb[1] - 0.02, cb[2] + 0.3, cb[3] + 0.17, stroke(pal.fine, 0.01)))
  for (const s of [-1, 1]) {
    const u = D.MID + s * (cb[2] / 2 + 0.08)
    const u2 = D.MID + s * (cb[2] / 2 + 0.15)
    local.push(line([u, cb[1] + cb[3] + 0.08], [u, 8.9], pal.key, 0.024), line([u2, cb[1] + cb[3] + 0.15], [u2, 8.9], pal.fine, 0.009))
  }
  // Stepped deco shoulders either side of the tower.
  for (const s of [-1, 1]) {
    const x = s === -1 ? hq[0] : hq[0] + hq[2]
    for (let i = 0; i < 4; i++) {
      const d = 0.28 + i * 0.1
      local.push(poly([[x + s * d, hq[1] + 0.1 + i * 0.18], [x + s * d, hq[1] + hq[3] + d - 0.1], [x + s * (d - 0.5 + i * 0.1), hq[1] + hq[3] + d - 0.1]], i % 2 ? pal.fine : pal.key, i % 2 ? 0.009 : 0.018, { 'stroke-linejoin': 'miter' }))
    }
  }
  // The way down from the top lane on the left, where the launch lets the ball go.
  const launch = railOf(D, 'launch')
  if (launch) {
    const end = launch.pts[launch.pts.length - 1]
    for (const d of [-0.35, 0.05, 0.45]) local.push(chevron([end[0], end[1] + d], 90, 0.36, pal.key, 0.05), chevron([end[0], end[1] + d + 0.2], 90, 0.28, pal.fine, 0.02))
    const turn = launch.pts.slice(2, 6)
    for (const off of [-0.62, 0.62]) local.push(poly(beside(turn, off), pal.key, 0.018), poly(beside(turn, off * 1.1), pal.fine, 0.008))
  }
  local.push(underRamp(D, pal, 'ladder'))
  // Fans beside the carpet, as the lobby floor of a tower has them.
  for (const s of [-1, 1]) {
    const c = [D.MID + s * 2.45, 5.25]
    const a0 = s === -1 ? 200 : -20
    const a1 = s === -1 ? 290 : -110
    local.push(rays(c, 0.25, 1.15, a0, a1, 13, pal.key, 0.02), arc(c, 1.15, Math.min(a0, a1), Math.max(a0, a1), pal.key, 0.03), arc(c, 1.22, Math.min(a0, a1), Math.max(a0, a1), pal.fine, 0.008), arc(c, 0.25, Math.min(a0, a1), Math.max(a0, a1), pal.fine, 0.012), dot(c, 0.05, pal.pale))
  }
  const { lanes, answers } = common(D, pal)
  const prints = insertsPrint(D, pal)
  lineWeight(1)
  return { pal, defs, ground: [], top: [lanes, g({ mask: 'url(#keep-corporate)' }, stone), g({ mask: 'url(#keep-corporate)', opacity: 0.72 }, [filler, wear(D, 31, pal.pale, 170)]), local, answers, prints] }
}

export function office(D, seed) {
  const pal = PAL.office
  const defs = []
  const C = D.COLS
  const y0 = 0.3
  const tiles = []
  const walk = []
  const seams = []
  const half = 0.85
  const low = D.bumpers.reduce((m, q) => (q.c[1] > m.c[1] ? q : m), D.bumpers[0])
  const band = [low.c[1] - 0.8, low.c[1] + 0.9]
  const tile = (C.right - D.MID - half) / 2
  const cream = '#8e9488'
  const cream2 = '#868c80'
  const tan = '#7d7a62'
  // Broad tiles in two slate tones, chequered, and a pale walkway down the middle and across under the cups.
  const us = [D.MID - half - 2 * tile, D.MID - half - tile, D.MID + half, D.MID + half + tile]
  const vs = []
  for (let v = band[0] - tile; v > y0 - tile; v -= tile) vs.unshift(v)
  for (let v = band[1]; v < D.H; v += tile) vs.push(v)
  vs.forEach((v, r) => {
    us.forEach((u, c) => {
      const odd = (r + c) % 2 === 1
      tiles.push(rect(u, v, tile, tile, { fill: odd ? pal.base : pal.base2 }))
      seams.push(rect(u, v, tile, tile, stroke(pal.dark, 0.014, { opacity: 0.5 })))
    })
  })
  walk.push(rect(D.MID - half, y0, 2 * half, D.H - y0, { fill: cream }), rect(C.left, band[0], C.right - C.left, band[1] - band[0], { fill: cream }))
  const onWalk = (q) => Math.abs(q[0] - D.MID) < half || (q[1] > band[0] && q[1] < band[1])
  const pileRand = rng(seed + 77)
  const pile = [pal.soft, pal.accent, pal.under, pal.dark].map((col, i) => ({ col, d: '', w: [0.009, 0.006, 0.011, 0.007][i], o: [0.5, 0.5, 0.36, 0.3][i] }))
  const speck = ['#9a9a86', '#c2c2b0', '#7c8074'].map((col, i) => ({ col, d: '', w: [0.011, 0.008, 0.013][i], o: 0.5 }))
  for (let i = 0; i < 52000; i++) {
    const q = [C.left + pileRand() * (C.right - C.left), y0 + pileRand() * (D.H - y0)]
    const a = pileRand() * 180
    const k = Math.floor(pileRand() * 4)
    if (onWalk(q)) speck[k % 3].d += `M${f(q[0])} ${f(q[1])}h0.002`
    else pile[k].d += `M${f(q[0])} ${f(q[1])}h0.002`
  }
  for (const q of pile) tiles.push(path(q.d, stroke(q.col, q.w, { opacity: q.o, 'stroke-linecap': 'round' })))
  for (const q of speck) walk.push(path(q.d, stroke(q.col, q.w, { opacity: q.o, 'stroke-linecap': 'round' })))
  // The edge of the walkway, and its arrows down to the flippers.
  const edge = []
  for (const s of [-1, 1]) {
    const u = D.MID + s * (half - 0.09)
    edge.push(line([u, y0], [u, band[0] + 0.09], tan, 0.016, { opacity: 0.8 }), line([u, band[1] - 0.09], [u, D.H], tan, 0.016, { opacity: 0.8 }))
    edge.push(line([D.MID + s * (half - 0.09), band[0] + 0.09], [s === 1 ? C.right : C.left, band[0] + 0.09], tan, 0.016, { opacity: 0.8 }), line([D.MID + s * (half - 0.09), band[1] - 0.09], [s === 1 ? C.right : C.left, band[1] - 0.09], tan, 0.016, { opacity: 0.8 }))
    edge.push(line([D.MID + s * half, y0], [D.MID + s * half, band[0]], pal.dark, 0.012, { opacity: 0.45 }), line([D.MID + s * half, band[1]], [D.MID + s * half, D.H], pal.dark, 0.012, { opacity: 0.45 }))
  }
  for (const v of band) edge.push(line([C.left, v], [D.MID - half, v], pal.dark, 0.012, { opacity: 0.45 }), line([D.MID + half, v], [C.right, v], pal.dark, 0.012, { opacity: 0.45 }))
  for (const v of [0.75, 2.2, 7.6]) edge.push(chevron([D.MID, v], 90, 0.36, tan, 0.03, { opacity: 0.8 }))
  for (const s of [-1, 1]) for (const d of [2.6, 4.4]) edge.push(chevron([D.MID + s * d, (band[0] + band[1]) / 2], s === 1 ? 0 : 180, 0.32, tan, 0.028, { opacity: 0.8 }))

  // What lies about, printed: paper clips, loose sheets, rubber bands and sticky tabs, each with the shadow it would throw.
  const rand = rng(seed)
  const scatter = []
  const blocked = (p, r) => {
    for (const n of D.inserts) if (dist(p, n.c) < n.r + 0.5 + r) return true
    for (const n of D.inserts) {
      const c = cardOf(n)
      if (p[0] > c[0] - r && p[0] < c[0] + c[2] + r && p[1] > c[1] - r && p[1] < c[1] + c[3] + r) return true
    }
    for (const l of D.lamps) if (dist(p, l.c) < 0.42 + r) return true
    for (const b of D.bumpers) if (dist(p, b.c) < b.r + 0.5 + r) return true
    for (const q of D.posts) if (dist(p, q.c) < q.r + 0.3 + r) return true
    for (const fl of D.flippers) if (dist(p, fl.pivot) < 0.6 + r) return true
    for (const h of D.holds) if ((h.kind === 'scoop' || h.kind === 'hatch') && dist(p, h.c) < h.r + 0.4 + r) return true
    for (const m of D.models) if (p[0] > m.box[0] - 0.2 - r && p[0] < m.box[0] + m.box[2] + 0.2 + r && p[1] > m.box[1] - 0.2 - r && p[1] < m.box[1] + m.box[3] + 0.2 + r) return true
    for (const d of D.displays) if (p[0] > d.box[0] - 0.3 - r && p[0] < d.box[0] + d.box[2] + 0.3 + r && p[1] > d.box[1] - 0.3 - r && p[1] < d.box[1] + d.box[3] + 0.3 + r) return true
    return p[1] < 1.9 + r || p[0] < C.left + 0.2 + r || p[0] > C.right - 0.2 - r || p[1] > D.H - 0.3 - r
  }
  const placed = []
  const place = (r) => {
    for (let i = 0; i < 80; i++) {
      const p = [C.left + rand() * (C.right - C.left), 1.9 + rand() * (D.H - 2.2)]
      if (blocked(p, r) || placed.some((q) => dist(p, q.p) < r + q.r + 0.08)) continue
      placed.push({ p, r })
      return p
    }
    return null
  }
  const turn = (p, deg, inner) => g({ transform: `translate(${f(p[0])} ${f(p[1])}) rotate(${f(deg)})` }, inner)
  const sheetCols = ['#c9c5b6', '#c3c1b3', '#cbc8bc', '#c0c3b9']
  for (let i = 0; i < 1; i++) {
    const p = place(0.42)
    if (!p) continue
    const w = 0.5 + rand() * 0.14
    const h = w * 1.36
    const fold = 0.12
    const col = sheetCols[i % 4]
    const pts = [[-w / 2, -h / 2], [w / 2 - fold, -h / 2], [w / 2, -h / 2 + fold], [w / 2, h / 2], [-w / 2, h / 2]]
    scatter.push(turn(p, rand() * 360, [shape(pts.map((q) => [q[0] + 0.035, q[1] + 0.045]), pal.dark, { opacity: 0.32 }), shape(pts, col), shape(pts, 'none', stroke('#b9b39a', 0.008)), shape([[w / 2 - fold, -h / 2], [w / 2 - fold, -h / 2 + fold], [w / 2, -h / 2 + fold]], '#cfc9b4'), rect(-w / 2 + 0.07, -h / 2 + 0.09, w * 0.5, 0.012, { fill: '#c9c4ae' }), rect(-w / 2 + 0.07, -h / 2 + 0.15, w - 0.2, 0.006, { fill: '#d3ceb9' }), rect(-w / 2 + 0.07, -h / 2 + 0.2, w - 0.2, 0.006, { fill: '#d3ceb9' }), rect(-w / 2 + 0.07, -h / 2 + 0.25, w - 0.3, 0.006, { fill: '#d3ceb9' })]))
  }
  const tabCols = ['#e5d36a', '#e7c0a8', '#b9d7c0']
  for (let i = 0; i < 1; i++) {
    const p = place(0.16)
    if (!p) continue
    scatter.push(turn(p, rand() * 360, [rect(-0.1, -0.09, 0.24, 0.24, { fill: pal.dark, opacity: 0.3 }), rect(-0.12, -0.12, 0.24, 0.24, { fill: tabCols[i % 3] }), rect(-0.12, -0.12, 0.24, 0.05, { fill: '#000', opacity: 0.07 })]))
  }
  const clip = (s) => `M${-0.19 * s} ${-0.05 * s} L${0.14 * s} ${-0.05 * s} A${0.05 * s} ${0.05 * s} 0 0 1 ${0.14 * s} ${0.05 * s} L${-0.16 * s} ${0.05 * s} A${0.075 * s} ${0.075 * s} 0 0 1 ${-0.16 * s} ${-0.1 * s} L${0.17 * s} ${-0.1 * s} A${0.1 * s} ${0.1 * s} 0 0 1 ${0.17 * s} ${0.1 * s} L${-0.08 * s} ${0.1 * s}`
  for (let i = 0; i < 4; i++) {
    const p = place(0.24)
    if (!p) continue
    const s = 0.9 + rand() * 0.35
    const d = clip(s)
    scatter.push(turn(p, rand() * 360, [g({ transform: 'translate(0.02 0.03)' }, [path(d, stroke(pal.dark, 0.03, { opacity: 0.35 }))]), path(d, stroke(i % 5 === 0 ? '#b88d57' : '#aeb5b3', 0.026)), path(d, stroke('#eef0ec', 0.008, { opacity: 0.85 }))]))
  }
  const bandCols = ['#b9895a', '#a9584a', '#c8a56a', '#6f89a8']
  for (let i = 0; i < 1; i++) {
    const p = place(0.3)
    if (!p) continue
    const rx = 0.17 + rand() * 0.1
    const ry = rx * (0.55 + rand() * 0.4)
    const k = 0.3 + rand() * 0.5
    const d = `M${-rx} 0 C${-rx} ${-ry * 1.3} ${rx * k} ${-ry * 1.5} ${rx} ${-ry * 0.2} C${rx * 1.25} ${ry} ${rx * 0.1} ${ry * 1.4} ${-rx * 0.5} ${ry * 0.9} C${-rx * 0.9} ${ry * 0.6} ${-rx} ${ry * 0.3} ${-rx} 0 Z`
    scatter.push(turn(p, rand() * 360, [g({ transform: 'translate(0.02 0.03)' }, [path(d, stroke(pal.dark, 0.034, { opacity: 0.32 }))]), path(d, stroke(bandCols[i % 4], 0.03)), path(d, stroke('#fff', 0.007, { opacity: 0.35 }))]))
  }
  for (let i = 0; i < 5; i++) {
    const p = place(0.06)
    if (!p) continue
    scatter.push(dot([p[0] + 0.012, p[1] + 0.016], 0.03, pal.dark, { opacity: 0.3 }), dot(p, 0.03, i % 3 ? '#e9e4d2' : '#c9ced0'), dot([p[0] - 0.008, p[1] - 0.008], 0.01, '#fff', { opacity: 0.6 }))
  }
  const { lanes, answers } = common(D, pal)
  const clipId = 'field-office'
  defs.push(el('clipPath', { id: clipId }, rect(C.left, 0.3, C.right - C.left, D.H - 0.3, { fill: '#000' })))
  return { pal, defs, ground: [g({ 'clip-path': `url(#${clipId})` }, [tiles, walk])], top: [g({ 'clip-path': `url(#${clipId})` }, [seams, edge, wear(D, seed + 9, '#c2ccc6', 70)]), lanes, scatter, answers, insertsPrint(D, pal)] }
}

// The veins of the stone: thin pale threads that wander and fork, as a dark marble has them.
function veins(D, seed, col, count) {
  const rand = rng(seed)
  const out = []
  const C = D.COLS
  for (let i = 0; i < count; i++) {
    let q = [C.left + rand() * (C.right - C.left), 0.3 + rand() * (D.H - 0.3)]
    let a = rand() * 360
    let d = `M${f(q[0])} ${f(q[1])}`
    const steps = 6 + Math.floor(rand() * 14)
    for (let j = 0; j < steps; j++) {
      a += (rand() - 0.5) * 70
      q = polar(q, 0.08 + rand() * 0.2, a)
      d += `L${f(q[0])} ${f(q[1])}`
    }
    out.push(path(d, stroke(col, 0.004 + rand() * 0.006, { opacity: f(0.18 + rand() * 0.32), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })))
  }
  return out
}

// The wear of play in the lacquer: fine pale scratches, each a short arc of a wide circle, thickest where the ball runs most between the slings and the flippers.
function wear(D, seed, col, count) {
  const rand = rng(seed)
  const out = []
  const C = D.COLS
  for (let i = 0; i < count; i++) {
    const low = rand() < 0.6
    const at = [C.left + 0.4 + rand() * (C.right - C.left - 0.8), low ? D.H * 0.5 + rand() * (D.H * 0.5 - 0.6) : 0.8 + rand() * (D.H - 1.4)]
    const r = 2.5 + rand() * 7
    const a = rand() * 360
    const span = (0.5 + rand() * 1.9) / r * (180 / Math.PI)
    const c = polar(at, r, a + 180)
    out.push(arc(c, r, a - span / 2, a + span / 2, col, 0.005 + rand() * 0.007, { opacity: f(0.07 + rand() * 0.16), 'stroke-linecap': 'round' }))
  }
  return out
}

export function street(D, seed) {
  const pal = PAL.street
  const defs = []
  const C = D.COLS
  const road = D.flats.find((a) => a.id.endsWith('road')).box
  const paint = pal.key
  const kerb = '#1d4450'
  const kerb2 = '#2c5a66'
  const roads = []
  const rx0 = road[0]
  const rx1 = road[0] + road[2]
  const kw = 0.35
  // The avenue: the road of the layout with a dashed centre line, kerbs either side, and on down to the drain.
  for (const [a, b] of [[rx0 - kw, rx0], [rx1, rx1 + kw]]) {
    roads.push(rect(a, 0.3, b - a, D.H - 0.3, { fill: kerb }))
  }
  roads.push(rect(rx0, 0.3, road[2], D.H - 0.3, { fill: pal.base2 }))
  const cross = { v0: 4.45, v1: 5.15, uL: 5.75, uR: 14.3 }
  const xk = 0.18
  roads.push(rect(cross.uL, cross.v0 - xk, rx0 - kw - cross.uL, cross.v1 - cross.v0 + 2 * xk, { fill: kerb }), rect(rx1 + kw, cross.v0 - xk, cross.uR - rx1 - kw, cross.v1 - cross.v0 + 2 * xk, { fill: kerb }))
  roads.push(rect(cross.uL, cross.v0, cross.uR - cross.uL, cross.v1 - cross.v0, { fill: pal.base2 }))
  roads.push(rect(rx0, cross.v0 - xk, road[2], cross.v1 - cross.v0 + 2 * xk, { fill: pal.base2 }))
  const ins = D.inserts.find((n) => Math.abs(n.c[0] - D.MID) < 0.1)
  const card = ins ? cardOf(ins) : null
  const free = (v) => !(v > cross.v0 - 0.5 && v < cross.v1 + 0.5) && !(ins && v > ins.c[1] - ins.r - 0.5 && v < card[1] + card[3] + 0.1)
  for (let v = 0.45; v < D.H - 0.2; v += 0.6) if (free(v) && free(v + 0.32)) roads.push(rect(D.MID - 0.028, v, 0.056, 0.32, { fill: paint }))
  for (const u of [rx0 + 0.035, rx1 - 0.035]) {
    roads.push(line([u, 0.3], [u, cross.v0 - xk - 0.02], paint, 0.04, { 'stroke-linecap': 'butt' }), line([u, cross.v1 + xk + 0.02], [u, D.H], paint, 0.04, { 'stroke-linecap': 'butt' }))
  }
  for (const v of [cross.v0 + 0.03, cross.v1 - 0.03]) roads.push(line([cross.uL, v], [rx0 - kw - 0.02, v], paint, 0.034, { 'stroke-linecap': 'butt' }), line([rx1 + kw + 0.02, v], [cross.uR, v], paint, 0.034, { 'stroke-linecap': 'butt' }))
  const cm = (cross.v0 + cross.v1) / 2
  for (let u = cross.uL + 0.2; u < cross.uR - 0.3; u += 0.5) if (u + 0.26 < rx0 - kw - 0.5 || u > rx1 + kw + 0.5) roads.push(rect(u, cm - 0.015, 0.26, 0.03, { fill: pal.accent, opacity: 0.9 }))

  // Paving between the roads, slab by slab, faint under the asphalt's own grain.
  const rand = rng(seed)
  const plots = []
  const pw = 1.86
  const ph = 1.5
  for (let v = 1.95; v < D.H - 0.3; v += ph) {
    for (let u = C.left + 0.22; u < C.right - 0.5; u += pw) {
      const r = rand()
      const w = pw - 0.1
      const h = ph - 0.1
      const fill = r < 0.12 ? '#1a3d49' : r < 0.5 ? '#153441' : '#122c39'
      plots.push(rect(u, v, w, h, { fill, rx: 0.04 }))
    }
  }
  // The car parks beside the avenue, bay by bay.
  const lots = []
  const lot = (x, y, w, h, flip) => {
    lots.push(rect(x, y, w, h, { fill: pal.base2, rx: 0.14, opacity: 0.5 }), rect(x, y, w, h, { ...stroke(pal.fine, 0.014), rx: 0.14, opacity: 0.4 }))
    const bay = 0.6
    const n = Math.floor((w - 0.3) / bay)
    const x0 = x + (w - n * bay) / 2
    for (const [vy, dir] of [[y + 0.06, 1], [y + h - 0.06, -1]]) {
      for (let i = 0; i <= n; i++) lots.push(line([x0 + i * bay, vy], [x0 + i * bay, vy + dir * 0.52], pal.fine, 0.014, { 'stroke-linecap': 'butt', opacity: 0.45 }))
      const hatch = Math.floor(rand() * n)
    }
    const cy = y + h / 2
  }
  const fire = D.models.find((m) => m.part === 'model-firehouse').box
  const pol = D.models.find((m) => m.part === 'model-police').box
  const spin = D.targets.find((t) => t.kind === 'spinner').box
  lot(fire[0] + fire[2] + 0.35, 2.0, rx0 - kw - 0.3 - (fire[0] + fire[2] + 0.35), cross.v0 - xk - 0.45 - 2.0, false)
  lot(rx1 + kw + 0.3, 2.0, spin[0] - 0.3 - (rx1 + kw + 0.3), cross.v0 - xk - 0.45 - 2.0, true)
  // The lane through the spinner beside the police station.
  for (const u of [spin[0] - 0.08, spin[0] + spin[2] + 0.08]) lots.push(line([u, 1.9], [u, cross.v0 - xk - 0.1], paint, 0.02, { 'stroke-dasharray': '0.2 0.1', 'stroke-linecap': 'butt' }))
  // The keep clear box in front of the firehouse door.
  const scoop = D.holds.find((h) => h.kind === 'scoop')
  if (scoop) {
    const b = [scoop.c[0] - 0.8, fire[1] + fire[3] + 0.12, 1.6, 1.05]
    const id = 'keep-clear'
    const hat = []
    for (let d = -1.2; d < 1.8; d += 0.16) hat.push(line([b[0] + d, b[1]], [b[0] + d + b[3], b[1] + b[3]], pal.accent, 0.022), line([b[0] + d + b[3], b[1]], [b[0] + d, b[1] + b[3]], pal.accent, 0.022))
    lots.push(el('clipPath', { id }, rect(b[0], b[1], b[2], b[3], { fill: '#000' })), rect(b[0], b[1], b[2], b[3], { fill: pal.base2 }), g({ 'clip-path': `url(#${id})`, opacity: 0.45 }, hat), rect(b[0], b[1], b[2], b[3], stroke(pal.accent, 0.02, { opacity: 0.7 })))
  }
  // Bays in front of the police station.
  for (let i = 0; i <= 6; i++) lots.push(line([pol[0] + 0.25 + i * 0.33, pol[1] + pol[3] + 0.2], [pol[0] + 0.05 + i * 0.33, pol[1] + pol[3] + 0.62], paint, 0.016, { 'stroke-linecap': 'butt', opacity: 0.85 }))
  // Manholes and drains in the carriageways.
  const holes = []
  for (const c of [[D.MID + 0.2, 1.75], [D.MID - 0.2, 6.3], [7.2, cm - 0.15], [12.9, cm + 0.15], [D.MID - 0.18, 10.75]]) {
    holes.push(dot(c, 0.11, '#0a1a24'), ring(c, 0.11, '#3a6f7e', 0.012), ring(c, 0.07, '#2b5866', 0.008))
    for (let a = 0; a < 180; a += 45) holes.push(line(polar(c, 0.07, a), polar(c, 0.07, a + 180), '#2b5866', 0.006))
  }
  const keep = keepOut(D, [rect(rx0 - kw - 0.08, 0, road[2] + 2 * kw + 0.16, D.H, { fill: '#000' }), rect(cross.uL - 0.08, cross.v0 - xk - 0.08, cross.uR - cross.uL + 0.16, cross.v1 - cross.v0 + 2 * xk + 0.16, { fill: '#000' }), rect(fire[0] + fire[2] + 0.25, 1.9, rx0 - kw - 0.2 - (fire[0] + fire[2] + 0.25), cross.v0 - xk - 0.25 - 1.9, { fill: '#000' }), rect(rx1 + kw + 0.2, 1.9, pol[0] - 0.1 - (rx1 + kw + 0.2), cross.v0 - xk - 0.25 - 1.9, { fill: '#000' }), ...(scoop ? [rect(scoop.c[0] - 0.9, fire[1] + fire[3], 1.8, 1.3, { fill: '#000' })] : []), rect(pol[0], pol[1] + pol[3], pol[2], 0.75, { fill: '#000' })])
  defs.push(el('mask', { id: 'keep-street', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: D.W, height: D.H }, rect(C.left, 0.3, C.right - C.left, D.H - 0.3, { fill: '#fff' }) + keep.join('')))
  const { lanes, answers } = common(D, pal)
  const local = [underRamp(D, pal, 'highway', '#7fb3bd')]
  const garage = D.models.find((m) => m.round)
  if (garage) {
    const c = [garage.box[0] + garage.box[2] / 2, garage.box[1] + garage.box[3] / 2]
    for (const r of [0.45, 0.75]) local.push(ring(c, r, paint, 0.014, { 'stroke-dasharray': '0.12 0.1', opacity: 0.8 }))
    for (let a = 20; a < 360; a += 90) local.push(arrow(polar(c, 0.6, a), a + 90, 0.18, paint, { opacity: 0.8 }))
  }
  const sp = railOf(D, 'spiral')
  if (sp) {
    const e = sp.pts[sp.pts.length - 1]
    local.push(chevron([e[0], e[1] - 0.5], 90, 0.3, pal.key, 0.045))
  }
  const clipId = 'field-street'
  defs.push(el('clipPath', { id: clipId }, rect(C.left, 0.3, C.right - C.left, D.H - 0.3, { fill: '#000' })))
  return { pal, defs, ground: [g({ mask: 'url(#keep-street)', opacity: 0.1 }, plots)], top: [lanes, g({ 'clip-path': `url(#${clipId})` }, [roads, lots, holes, wear(D, seed + 9, '#a9c6cc', 150)]), local, answers, insertsPrint(D, pal)] }
}

// The guide: the tier from straight above with every lane, wall, post, footprint, insert and flipper as plain lines.
export function guide(D) {
  const k = '#111'
  const out = [rect(0, 0, D.W, D.H, { fill: '#f4f4f0' })]
  const C = D.COLS
  out.push(rect(C.left, 0.3, C.right - C.left, D.H - 0.3, stroke(k, 0.05)), rect(C.launchA, 0, C.launchB - C.launchA, D.H, stroke('#888', 0.03)), rect(C.liftA, 0, C.liftB - C.liftA, D.H, stroke('#888', 0.03)))
  for (const s of D.segs) out.push(line(s.a, s.b, k, s.kind === 'guide' ? 0.04 : 0.06))
  for (const p of D.posts) out.push(ring(p.c, p.r, k, 0.03))
  for (const m of D.models) out.push(m.round ? ring([m.box[0] + m.box[2] / 2, m.box[1] + m.box[3] / 2], m.box[2] / 2, '#555', 0.04) : rect(m.box[0], m.box[1], m.box[2], m.box[3], stroke('#555', 0.04)))
  for (const b of D.bumpers) out.push(ring(b.c, b.r, k, 0.04))
  for (const s of D.slings) out.push(shape([s.a, s.b, s.c], 'none', stroke(k, 0.04)))
  for (const t of D.targets) out.push(rect(t.box[0], t.box[1], t.box[2], t.box[3], stroke(k, 0.02)))
  for (const n of D.inserts) out.push(ring(n.c, n.r, k, 0.04), ring(n.c, n.r * 0.5, '#999', 0.02))
  for (const d of D.displays) out.push(rect(d.box[0], d.box[1], d.box[2], d.box[3], stroke(k, 0.03)))
  for (const a of D.flats) out.push(rect(a.box[0], a.box[1], a.box[2], a.box[3], stroke('#888', 0.03, { 'stroke-dasharray': '0.1 0.1' })))
  for (const h of D.holds) if (h.kind === 'scoop' || h.kind === 'hatch') out.push(ring(h.c, h.r, '#555', 0.03))
  for (const l of D.lamps) out.push(ring(l.c, 0.14, '#999', 0.02))
  for (const r of D.rails) if (['ladder', 'highway', 'spiral'].includes(r.id)) out.push(poly(r.pts, '#999', 0.03, { 'stroke-dasharray': '0.15 0.1' }))
  for (const fl of D.flippers) {
    const s = fl.side === 'left' ? 1 : -1
    const a = (D.FLIP.rest * Math.PI) / 180
    const tip = [fl.pivot[0] + s * D.FLIP.length * Math.cos(a), fl.pivot[1] + D.FLIP.length * Math.sin(a)]
    out.push(line(fl.pivot, tip, k, D.FLIP.radius * 2, { opacity: 0.6 }))
  }
  return out
}
