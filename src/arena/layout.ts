// The arena's plan: every place and size, in page px on the 1920 by 1080 page. Plain numbers, no three.js.
// Read off references/approved-002/boss-arena.png with a 50 px grid laid over it (see pipeline/change002/arena.md for what was corrected).

export interface Pt { x: number; y: number }

export const PAGE = { w: 1920, h: 1080 }

export const ARENA = {
  // The scene change, on view.time from 0 (the frame the Submit button breaks out).
  changeSeconds: 2.4,
  // From this moment the page's own flat must be gone (a well over the whole page) and the form must be off it: the slabs are drawn from here.
  clearAt: 0.7,
  // Cracks race over the page from the socket.
  crackFrom: 0, crackTo: 0.62,
  // The split: the seams open and the light comes up from below.
  splitAt: 0.7, splitTo: 1.15,
  // The standing things rise, one after the other.
  riseAt: 1.0, riseEach: 0.42, riseTo: 1.9,
  // The health bar drops into place and lands.
  barAt: 1.7, barLands: 2.12,
  // Sizes.
  seamHalf: 9, chamfer: 3, seamDepth: 30,
  pillar: { side: 56, foot: 76, footHigh: 7, high: 240 },
  pane: { thick: 20, high: 240 },
  gun: { base: 46, high: 34, barrel: 78 },
  slot: { x: 960, y: 967, w: 267, h: 75 },
  bar: { x0: 590, y0: 66, x1: 1333, y1: 137, trackInset: 22, trackHalf: 19, high: 9 },
  label: { x: 960, y: 40, px: 30, font: 'inter-600' },
  corners: [{ x: 89, y: 82 }, { x: 1831, y: 82 }, { x: 82, y: 987 }, { x: 1824, y: 981 }] as Pt[],
  // Where the boss's centre may be so that his hull stays on the middle slab.
  safe: { x0: 640, y0: 330, x1: 1280, y1: 770 },
  // The well the page's ground is cut with while the arena is on.
  wellDepth: 60
} as const

// The feet of the eight pillars: the middles of their foot plates. The first picture shows the plates; the brief's numbers were the middles of the drawn bodies.
export const PILLARS: { id: string; x: number; y: number }[] = [
  { id: 'pillar.0', x: 185, y: 372 }, { id: 'pillar.1', x: 577, y: 352 }, { id: 'pillar.2', x: 157, y: 712 }, { id: 'pillar.3', x: 563, y: 722 },
  { id: 'pillar.4', x: 1384, y: 352 }, { id: 'pillar.5', x: 1775, y: 373 }, { id: 'pillar.6', x: 1397, y: 722 }, { id: 'pillar.7', x: 1802, y: 712 }
]

// The two panes, by the line they stand on.
export const PANES: { id: string; x: number; y0: number; y1: number }[] = [
  { id: 'pane.0', x: 372, y0: 350, y1: 750 }, { id: 'pane.1', x: 1592, y0: 350, y1: 750 }
]

type Line = [number, number][]

// The seams between the slabs, as the picture draws them. Each runs from one named joint to another; a joint whose name starts with a dot lies on the edge of the page.
const RAW: { id: string; from: string; to: string; line: Line }[] = [
  { id: 'top', from: 'A', to: 'B', line: [[770, 285], [860, 293], [960, 300], [1050, 301], [1140, 300]] },
  { id: 'tr', from: 'B', to: 'C', line: [[1140, 300], [1200, 330], [1290, 372], [1340, 420], [1368, 440]] },
  { id: 'r', from: 'C', to: 'D', line: [[1368, 440], [1378, 480], [1372, 540], [1380, 600], [1368, 655]] },
  { id: 'br', from: 'D', to: 'E', line: [[1368, 655], [1340, 690], [1280, 750], [1235, 808], [1215, 825]] },
  { id: 'bot', from: 'E', to: 'F', line: [[1215, 825], [1100, 822], [960, 812], [850, 808], [745, 805]] },
  { id: 'bl', from: 'F', to: 'G', line: [[745, 805], [700, 742], [640, 692], [605, 668], [590, 650]] },
  { id: 'l', from: 'G', to: 'H', line: [[590, 650], [598, 585], [588, 510], [590, 470], [598, 438]] },
  { id: 'tl', from: 'H', to: 'A', line: [[598, 438], [640, 400], [690, 345], [740, 302], [770, 285]] },
  { id: 'o.t1', from: 'A', to: '.T1', line: [[770, 285], [750, 250], [722, 170], [708, 100], [690, 45], [662, 0]] },
  { id: 'o.t2', from: 'B', to: '.T2', line: [[1140, 300], [1172, 270], [1200, 200], [1240, 130], [1262, 60], [1288, 0]] },
  { id: 'o.r1', from: 'C', to: '.R1', line: [[1368, 440], [1450, 415], [1560, 375], [1640, 345], [1720, 318], [1800, 316], [1870, 330], [1920, 334]] },
  { id: 'o.r2', from: 'D', to: '.R2', line: [[1368, 655], [1445, 680], [1560, 715], [1650, 745], [1790, 775], [1860, 765], [1920, 760]] },
  { id: 'o.b2', from: 'E', to: '.B2', line: [[1215, 825], [1235, 860], [1270, 930], [1310, 1010], [1345, 1080]] },
  { id: 'o.b1', from: 'F', to: '.B1', line: [[745, 805], [720, 832], [680, 890], [620, 970], [570, 1040], [540, 1080]] },
  { id: 'o.l2', from: 'G', to: '.L2', line: [[590, 650], [540, 665], [450, 690], [360, 715], [290, 740], [220, 770], [150, 780], [60, 760], [0, 750]] },
  { id: 'o.l1', from: 'H', to: '.L1', line: [[598, 438], [540, 420], [450, 390], [385, 360], [300, 338], [240, 318], [170, 311], [90, 320], [30, 330], [0, 326]] }
]

// A curve through the picture's points, a point every dozen px or so, with the two ends kept where they are.
function curved(line: Line): Pt[] {
  const p = (i: number): [number, number] => line[Math.max(0, Math.min(line.length - 1, i))]!
  const out: Pt[] = []
  for (let i = 0; i < line.length - 1; i++) {
    const a = p(i - 1), b = p(i), c = p(i + 1), d = p(i + 2)
    const n = Math.max(2, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) / 12))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const t2 = t * t, t3 = t2 * t
      const f = (j: 0 | 1): number => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3)
      out.push({ x: Math.round(f(0) * 100) / 100, y: Math.round(f(1) * 100) / 100 })
    }
  }
  const last = line[line.length - 1]!
  out.push({ x: last[0], y: last[1] })
  out[0] = { x: line[0]![0], y: line[0]![1] }
  return out
}

export interface Seam { id: string; from: string; to: string; points: Pt[]; along: number[]; length: number }

export const SEAMS: Seam[] = RAW.map((r) => {
  const points = curved(r.line)
  const along = [0]
  for (let i = 1; i < points.length; i++) along.push(along[i - 1]! + Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y))
  return { id: r.id, from: r.from, to: r.to, points, along, length: along[along.length - 1]! }
})

const seam = (id: string): Seam => {
  const s = SEAMS.find((x) => x.id === id)
  if (!s) throw new Error(`No seam called "${id}"`)
  return s
}

// A slab is a loop: seams walked forward (+) or backward (-), and corners of the page between them.
type Leg = string | [number, number]
const LOOPS: { id: string; legs: Leg[] }[] = [
  { id: 'middle', legs: ['+top', '+tr', '+r', '+br', '+bot', '+bl', '+l', '+tl'] },
  { id: 'top', legs: ['+o.t1', '-o.t2', '-top'] },
  { id: 'top-right', legs: ['+o.t2', [1920, 0], '-o.r1', '-tr'] },
  { id: 'right', legs: ['+o.r1', '-o.r2', '-r'] },
  { id: 'bottom-right', legs: ['+o.r2', [1920, 1080], '-o.b2', '-br'] },
  { id: 'bottom', legs: ['+o.b2', '-o.b1', '-bot'] },
  { id: 'bottom-left', legs: ['+o.b1', [0, 1080], '-o.l2', '-bl'] },
  { id: 'left', legs: ['+o.l2', '-o.l1', '-l'] },
  { id: 'top-left', legs: ['+o.l1', [0, 0], '-o.t1', '-tl'] }
]

export interface Slab {
  id: string
  // The loop along the middles of the seams and the edge of the page, clockwise on the page (y down), closed by its first point.
  outline: Pt[]
  // open[i] says the side from outline[i] to outline[i + 1] is a seam (true) or the edge of the page (false).
  open: boolean[]
  // Which seam and which of its points outline[i] is, so a crack's time can be read; null for a corner of the page.
  at: ({ seam: string; index: number } | null)[]
}

function slabOf(id: string, legs: Leg[]): Slab {
  const outline: Pt[] = []
  // arrives[i]: the side that arrives at outline[i] is a seam.
  const arrives: boolean[] = []
  const at: ({ seam: string; index: number } | null)[] = []
  const same = (a: Pt, b: Pt): boolean => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01
  for (const leg of legs) {
    if (typeof leg !== 'string') {
      outline.push({ x: leg[0], y: leg[1] })
      arrives.push(false)
      at.push(null)
      continue
    }
    const s = seam(leg.slice(1))
    const n = s.points.length
    for (let k = 0; k < n; k++) {
      const i = leg[0] === '+' ? k : n - 1 - k
      const p = s.points[i]!
      const last = outline[outline.length - 1]
      if (k === 0 && last && same(last, p)) continue
      outline.push(p)
      arrives.push(k > 0)
      at.push({ seam: s.id, index: i })
    }
  }
  const n = outline.length
  if (same(outline[n - 1]!, outline[0]!)) {
    arrives[0] = arrives[n - 1]!
    outline.pop()
    arrives.pop()
    at.pop()
  }
  const open = outline.map((_, i) => arrives[(i + 1) % outline.length]!)
  return { id, outline, open, at }
}

export const SLABS: Slab[] = LOOPS.map((l) => slabOf(l.id, l.legs))

// The outline of a slab moved in by `d` on its seam sides and by nothing on the edge of the page.
export function inset(slab: Slab, d: number): Pt[] {
  const o = slab.outline
  const n = o.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const a = o[i]!, b = o[(i + 1) % n]!
    area += a.x * b.y - b.x * a.y
  }
  const sign = area >= 0 ? 1 : -1
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const p = o[i]!
    const a = o[(i + n - 1) % n]!
    const b = o[(i + 1) % n]!
    const d0 = slab.open[(i + n - 1) % n] ? d : 0
    const d1 = slab.open[i] ? d : 0
    // Inward normals of the side that arrives and of the side that leaves.
    const l0 = Math.hypot(p.x - a.x, p.y - a.y) || 1
    const l1 = Math.hypot(b.x - p.x, b.y - p.y) || 1
    const n0 = { x: (-(p.y - a.y) / l0) * sign, y: ((p.x - a.x) / l0) * sign }
    const n1 = { x: (-(b.y - p.y) / l1) * sign, y: ((b.x - p.x) / l1) * sign }
    const t0 = { x: (p.x - a.x) / l0, y: (p.y - a.y) / l0 }
    const t1 = { x: (b.x - p.x) / l1, y: (b.y - p.y) / l1 }
    const cross = t0.x * t1.y - t0.y * t1.x
    if (Math.abs(cross) < 0.05) {
      const m = { x: n0.x + n1.x, y: n0.y + n1.y }
      const ml = Math.hypot(m.x, m.y) || 1
      const dd = (d0 + d1) / 2
      out.push({ x: p.x + (m.x / ml) * dd, y: p.y + (m.y / ml) * dd })
      continue
    }
    // Where the two moved sides meet.
    const ax = p.x + n0.x * d0, ay = p.y + n0.y * d0
    const bx = p.x + n1.x * d1, by = p.y + n1.y * d1
    const u = ((bx - ax) * t1.y - (by - ay) * t1.x) / cross
    const reach = Math.max(-4 * d - 1, Math.min(4 * d + 1, u))
    out.push({ x: ax + t0.x * reach, y: ay + t0.y * reach })
  }
  return out
}

// The outline of the middle slab as the fight needs it: the eight joints, clockwise from the upper left.
export const MIDDLE: Pt[] = ['top', 'tr', 'r', 'br', 'bot', 'bl', 'l', 'tl'].map((id) => ({ ...seam(id).points[0]! }))

// How far each point of each seam is from the socket along the seams: a crack takes that long to get there.
const SOURCE: Pt = { x: ARENA.slot.x, y: ARENA.slot.y - ARENA.slot.h / 2 }
function distances(): Map<string, number[]> {
  const joint = new Map<string, number>()
  const place = new Map<string, Pt>()
  for (const s of SEAMS) {
    place.set(s.from, s.points[0]!)
    place.set(s.to, s.points[s.points.length - 1]!)
  }
  for (const [name, p] of place) joint.set(name, name === 'E' || name === 'F' ? Math.hypot(p.x - SOURCE.x, p.y - SOURCE.y) : Infinity)
  for (let pass = 0; pass < SEAMS.length; pass++) {
    for (const s of SEAMS) {
      const a = joint.get(s.from)!, b = joint.get(s.to)!
      if (a + s.length < b) joint.set(s.to, a + s.length)
      if (b + s.length < a) joint.set(s.from, b + s.length)
    }
  }
  const out = new Map<string, number[]>()
  for (const s of SEAMS) out.set(s.id, s.along.map((d) => Math.min(joint.get(s.from)! + d, joint.get(s.to)! + s.length - d)))
  return out
}

export const CRACK_DISTANCE = distances()
export const CRACK_FARTHEST = Math.max(...[...CRACK_DISTANCE.values()].flat())

// The four boxes round a thing, in page px.
export const pillarBox = (p: { x: number; y: number }): { x0: number; y0: number; x1: number; y1: number } => ({ x0: p.x - ARENA.pillar.side / 2, y0: p.y - ARENA.pillar.side / 2, x1: p.x + ARENA.pillar.side / 2, y1: p.y + ARENA.pillar.side / 2 })
export const paneBox = (p: { x: number; y0: number; y1: number }): { x0: number; y0: number; x1: number; y1: number } => ({ x0: p.x - ARENA.pane.thick / 2, y0: p.y0, x1: p.x + ARENA.pane.thick / 2, y1: p.y1 })
