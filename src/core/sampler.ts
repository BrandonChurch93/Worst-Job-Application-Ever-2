import { Random, stream } from './random'

export interface Sample {
  index: number
  count: number
  // Inside the pixel, each from -0.5 to 0.5.
  pixel: [number, number]
  // On the key light's area: a disk of radius 1.
  light: [number, number]
  // On the lens opening: a disk of radius 1.
  lens: [number, number]
  // Inside the shutter, from 0 to 1.
  shutter: number
  // A direction on the dome above the page, z up, spread evenly over the half sphere.
  dome: [number, number, number]
  // Which share of the shadow filter's taps this sample takes, from 0 to 1: every sample of a picture a different one.
  phase: number
  // Moves the shadow map inside one of its texels, each from -0.5 to 0.5.
  texel: [number, number]
}

const G2 = 1.32471795724474602596
const A1 = 1 / G2
const A2 = 1 / (G2 * G2)
const frac = (v: number) => v - Math.floor(v)
// A dome light lower than this throws shadows too long to hold in one shadow map.
const MIN_DOME_HEIGHT = 0.12

function r2(i: number, ox: number, oy: number): [number, number] {
  return [frac(ox + A1 * (i + 1)), frac(oy + A2 * (i + 1))]
}

// Maps the unit square to the unit disk without bunching points at the centre.
export function squareToDisk(u: number, v: number): [number, number] {
  const a = 2 * u - 1
  const b = 2 * v - 1
  if (a === 0 && b === 0) return [0, 0]
  let r: number
  let phi: number
  if (Math.abs(a) > Math.abs(b)) {
    r = a
    phi = (Math.PI / 4) * (b / a)
  } else {
    r = b
    phi = Math.PI / 2 - (Math.PI / 4) * (a / b)
  }
  return [r * Math.cos(phi), r * Math.sin(phi)]
}

function order(count: number, rnd: Random): number[] {
  const list = Array.from({ length: count }, (_, i) => i)
  return rnd.shuffle(list)
}

// How a light's area is shared between the samples of one picture. Each sample stands at its own point of the area
// and blurs its shadow by the piece of the area it stands for. `move` and `blur` are shares of the area's radius:
// one sample blurs by the whole area and does not move, many samples move far and blur little.
const OVERLAP = 1.25
export function areaSplit(count: number): { move: number; blur: number } {
  const blur = Math.min(1, OVERLAP / Math.sqrt(Math.max(1, count)))
  return { move: 1 - blur, blur }
}

// The tangent of half the angle of the piece of the dome one sample stands for.
const DOME_MAX_TAN = 1.1
export function domeSpread(count: number): number {
  const cos = Math.max(0, 1 - 1 / Math.max(1, count))
  const tan = cos <= 0 ? DOME_MAX_TAN : Math.sqrt(1 - cos * cos) / cos
  return Math.min(DOME_MAX_TAN, tan * OVERLAP)
}

// How many taps of the shadow filter one sample takes, so a picture has about `perPicture` in all.
export function filterTaps(count: number, perPicture: number, least: number, most: number): number {
  return Math.min(most, Math.max(least, Math.round(perPicture / Math.max(1, count))))
}

const cache = new Map<number, Sample[]>()

// The same pattern for every picture with this many samples, so soft shadows hold still from frame to frame.
export function samples(count: number): Sample[] {
  const hit = cache.get(count)
  if (hit) return hit
  const rnd = stream('sampler')
  const offsets = Array.from({ length: 8 }, () => rnd.next())
  const lightOrder = order(count, rnd)
  const lensOrder = order(count, rnd)
  const domeOrder = order(count, rnd)
  const phaseOrder = order(count, rnd)
  const texelOrder = order(count, rnd)
  offsets.push(rnd.next(), rnd.next())
  const out: Sample[] = []
  for (let i = 0; i < count; i++) {
    const p = r2(i, offsets[0]!, offsets[1]!)
    const l = r2(lightOrder[i]!, offsets[2]!, offsets[3]!)
    const e = r2(lensOrder[i]!, offsets[4]!, offsets[5]!)
    const d = squareToDisk(...r2(domeOrder[i]!, offsets[6]!, offsets[7]!))
    const t = r2(texelOrder[i]!, offsets[8]!, offsets[9]!)
    const rr = d[0] * d[0] + d[1] * d[1]
    const dz = count === 1 ? 1 : Math.max(MIN_DOME_HEIGHT, 1 - rr)
    const ds = rr > 0 ? Math.sqrt(Math.max(0, 1 - dz * dz) / rr) : 0
    out.push({
      index: i,
      count,
      pixel: count === 1 ? [0, 0] : [p[0] - 0.5, p[1] - 0.5],
      light: count === 1 ? [0, 0] : squareToDisk(l[0], l[1]),
      lens: count === 1 ? [0, 0] : squareToDisk(e[0], e[1]),
      // In order of time, so the stage only ever steps forward inside one picture.
      shutter: (i + 0.5) / count,
      dome: count === 1 ? [0, 0, 1] : [d[0] * ds, d[1] * ds, dz],
      phase: (phaseOrder[i]! + 0.5) / count,
      texel: count === 1 ? [0, 0] : [t[0] - 0.5, t[1] - 0.5]
    })
  }
  cache.set(count, out)
  return out
}
