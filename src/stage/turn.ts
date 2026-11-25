const QUARTER = Math.PI / 2
const DEG = Math.PI / 180

export const TURN = {
  windUp: 0.12,
  lean: 1.6 * DEG,
  power: 2.2,
  seat: 0.6,
  knocks: [
    { size: 1.5 * DEG, lasts: 0.22 },
    { size: 0.4 * DEG, lasts: 0.12 }
  ]
} as const

const clamp01 = (u: number) => Math.min(1, Math.max(0, u))

export function leaveTurn(u: number): number {
  const t = clamp01(u)
  if (t <= 0) return 0
  if (t < TURN.windUp) {
    const s = t / TURN.windUp
    return -TURN.lean * Math.sin(Math.PI * s) * (1 - s)
  }
  const s = (t - TURN.windUp) / (1 - TURN.windUp)
  return QUARTER * Math.pow(s, TURN.power)
}

export function leaveSpeed(): number {
  return (QUARTER * TURN.power) / (1 - TURN.windUp)
}

export function arriveTurn(u: number): number {
  const t = clamp01(u)
  if (t < TURN.seat) {
    const w = t / TURN.seat
    const a = 1 - (leaveSpeed() * TURN.seat) / QUARTER
    return -QUARTER * (1 - w) * (1 + a * w)
  }
  let from = TURN.seat
  for (const k of TURN.knocks) {
    if (t < from + k.lasts) {
      const s = (t - from) / k.lasts
      return -k.size * 4 * s * (1 - s)
    }
    from += k.lasts
  }
  return 0
}

export function seatedAt(): number {
  return TURN.seat
}
