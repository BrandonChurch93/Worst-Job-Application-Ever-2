import type { Wound } from '../body'
import type { LookMaker } from '../contract'

const ramp = (u: number, a: number, b: number): number => Math.min(1, Math.max(0, (u - a) / (b - a)))
const smooth = (t: number): number => t * t * (3 - 2 * t)

// The shares of a kind of damage's life at which each thing happens. A heal is always seen: nothing switches back.
export const LIFE = {
  burn: { punched: 0.04, cold: 0.42, flake: [0.44, 0.6], smokeEnd: 0.6, close: 0.64, radius: 1.4, clean: 2.15 },
  scorched: { fade: 0.4, smokeEnd: 0.75 },
  flattened: { pressed: 0.05, peel: 0.5, refill: 0.78, crackEnd: 0.95 },
  reassembled: { seam: 0.76, firm: 0.88 }
}
const TIP = { x: 0.7, y: 1.6 }

export function woundOf(w: Wound, look: Parameters<LookMaker>[1], pose: Parameters<LookMaker>[0]): void {
  const b = look.body
  const e = look.effects
  const u = w.at
  if (w.kind === 'burn') {
    const L = LIFE.burn
    // The char flakes off once the rim is cold: what is left is a wider clean punched hole, and that closes.
    const burnt = 1 - smooth(ramp(u, L.flake[0], L.flake[1]))
    const r = (L.clean + (L.radius - L.clean) * burnt) * smooth(ramp(u, 0, L.punched)) * (1 - smooth(ramp(u, L.close, 1)))
    const hole = { x: w.x, y: w.y, r, glow: Math.pow(1 - ramp(u, 0, L.cold), 1.6), burnt }
    if (r > 0.03) b.holes.push(hole)
    const smoke = 1 - ramp(u, 0.08, L.smokeEnd)
    if (smoke > 0) e.smoke.push({ x: w.x, y: w.y - L.radius * 0.9, amount: smoke })
  } else if (w.kind === 'scorched') {
    const L = LIFE.scorched
    b.char = Math.max(b.char, 1 - smooth(ramp(u, L.fade, 1)))
    const smoke = 1 - ramp(u, 0.05, L.smokeEnd)
    if (smoke > 0) e.smoke.push({ x: TIP.x, y: TIP.y, amount: smoke })
  } else if (w.kind === 'flattened') {
    const L = LIFE.flattened
    const refill = smooth(ramp(u, L.refill, 1))
    const peel = smooth(ramp(u, L.peel, L.refill))
    b.flat = Math.max(b.flat, smooth(ramp(u, 0, L.pressed)) * (1 - 0.3 * peel) * (1 - refill))
    b.peel = Math.max(b.peel, peel * (1 - refill))
    b.crack = Math.max(b.crack, ramp(u, 0, L.pressed) * (1 - smooth(ramp(u, L.refill - 0.08, L.crackEnd))))
    b.stretch *= 1 + 0.16 * Math.sin(Math.PI * refill)
  } else if (w.kind === 'shredded') {
    b.melt = 0
    if (pose.strips) b.strips = pose.strips.map((p) => ({ ...p }))
  } else {
    // Strips do not sag: a tired body melts only once its seams are closing, or the tape and the seams are lost in the droop.
    b.melt *= smooth(ramp(u, LIFE.reassembled.firm, 1))
    const whole = !pose.strips || pose.strips.every((p) => p.x === 0 && p.y === 0 && p.z === 0 && p.rot === 0 && p.tilt === 0)
    if (whole) b.seam = Math.max(b.seam, 1 - smooth(ramp(u, LIFE.reassembled.seam, 1)))
    else b.strips = pose.strips!.map((p) => ({ ...p }))
  }
}

// What the damage it carries makes of the cursor's look, through the whole life of each kind.
export const damageLook: LookMaker | null = (pose, look) => {
  for (const w of pose.wounds) woundOf(w, look, pose)
  if (look.body.strips) {
    look.body.flat = 0
    look.body.peel = 0
  }
}
