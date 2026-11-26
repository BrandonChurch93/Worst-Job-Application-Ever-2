import { OUTLINE } from './contract'

// The middle of the outline as it is drawn: the centre of the smallest circle that holds every corner, with its radius, in outline units.
// The body is drawn `stretch` long and 1 / sqrt(stretch) wide.
export interface Middle { x: number; y: number; r: number }

const made = new Map<number, Middle>()

function smallest(p: [number, number][]): Middle {
  let best: Middle = { x: 0, y: 0, r: Infinity }
  const take = (c: Middle): void => {
    if (c.r < best.r && p.every(([x, y]) => Math.hypot(x - c.x, y - c.y) <= c.r + 1e-9)) best = c
  }
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const a = p[i]!
      const b = p[j]!
      take({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, r: Math.hypot(a[0] - b[0], a[1] - b[1]) / 2 })
      for (let k = j + 1; k < p.length; k++) {
        const c = p[k]!
        const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
        if (Math.abs(d) < 1e-9) continue
        const a2 = a[0] * a[0] + a[1] * a[1]
        const b2 = b[0] * b[0] + b[1] * b[1]
        const c2 = c[0] * c[0] + c[1] * c[1]
        const x = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d
        const y = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d
        take({ x, y, r: Math.hypot(a[0] - x, a[1] - y) })
      }
    }
  }
  return best
}

export function middleOf(stretch: number): Middle {
  const key = Math.round(Math.min(2.2, Math.max(0.3, stretch)) * 1000)
  const had = made.get(key)
  if (had) return had
  const long = key / 1000
  const wide = 1 / Math.sqrt(long)
  const got = smallest(OUTLINE.map(([x, y]) => [x * wide, y * long] as [number, number]))
  made.set(key, got)
  return got
}
