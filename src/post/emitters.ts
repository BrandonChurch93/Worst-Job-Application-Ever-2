import type { Emitter } from '../real/types'

// One true light of the frame: an emitter, or several that stand close and were made one.
export interface Lamp {
  x: number
  y: number
  z: number
  colour: [number, number, number]
  power: number
  reach: number
  shadow: boolean
}

const weight = (l: { power: number; reach: number }) => l.power * l.reach

function join(a: Lamp, b: Lamp): Lamp {
  const wa = weight(a)
  const wb = weight(b)
  const w = wa + wb
  const power = a.power + b.power
  return {
    x: (a.x * wa + b.x * wb) / w,
    y: (a.y * wa + b.y * wb) / w,
    z: (a.z * wa + b.z * wb) / w,
    colour: [0, 1, 2].map((c) => (a.colour[c]! * a.power + b.colour[c]! * b.power) / power) as [number, number, number],
    power,
    reach: Math.max(a.reach, b.reach),
    shadow: a.shadow || b.shadow
  }
}

// Turns the lights the parts give off into at most `pool` true lights, of which at most `shadows` throw a shadow.
// The cost of a frame never depends on how many emitters there are: while there are too many, the two whose joining
// loses least are made one, the weaker and the closer first. The lamps that throw a shadow come first in the answer.
export function chooseEmitters(list: readonly Emitter[], pool: number, shadows: number): Lamp[] {
  const lamps: Lamp[] = []
  for (const e of list) {
    if (!(e.power > 0) || !(e.reach > 0)) continue
    lamps.push({ x: e.x, y: e.y, z: e.z, colour: [e.colour[0], e.colour[1], e.colour[2]], power: e.power, reach: e.reach, shadow: e.shadow === true })
  }
  while (lamps.length > Math.max(0, pool)) {
    if (pool <= 0) {
      lamps.length = 0
      break
    }
    let bi = 0
    let bj = 1
    let best = Infinity
    for (let i = 0; i < lamps.length; i++) {
      for (let j = i + 1; j < lamps.length; j++) {
        const a = lamps[i]!
        const b = lamps[j]!
        const cost = ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 + 1) * Math.min(weight(a), weight(b))
        if (cost < best) {
          best = cost
          bi = i
          bj = j
        }
      }
    }
    lamps[bi] = join(lamps[bi]!, lamps[bj]!)
    lamps.splice(bj, 1)
  }
  const order = lamps.map((l, i) => ({ l, i }))
  order.sort((a, b) => weight(b.l) - weight(a.l) || a.i - b.i)
  const casting = order.filter((o) => o.l.shadow).slice(0, Math.max(0, shadows))
  const keep = new Set(casting.map((o) => o.i))
  return [...casting.map((o) => o.l), ...order.filter((o) => !keep.has(o.i)).map((o) => ({ ...o.l, shadow: false }))]
}

// What a lamp of the pool is set to. Power 1 means: a white matte surface 100 px away, facing the lamp, sends back
// about the lamp's colour in linear light.
export const EMITTER_UNIT_PX = 100
export function lampIntensity(power: number, bodyPx: number): number {
  return Math.PI * power * (EMITTER_UNIT_PX * EMITTER_UNIT_PX + bodyPx * bodyPx)
}
