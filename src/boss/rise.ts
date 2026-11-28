import { RISE_LIGHT as L } from './tune'

// The ring that runs out over the floor at the power-up's burst: how far out it is `since` seconds after the burst (null when it is not there), and how long after the burst it is `far` px out (null when it never gets there).
export const ringAt = (since: number): number | null => {
  const u = since / L.ring.seconds
  return u >= 0 && u < 1 ? L.ring.from + (L.ring.reach - L.ring.from) * (1 - (1 - u) ** 2) : null
}

export const ringReaches = (far: number): number | null => {
  const k = (far - L.ring.from) / (L.ring.reach - L.ring.from)
  return k >= 1 ? null : k <= 0 ? 0 : L.ring.seconds * (1 - Math.sqrt(1 - k))
}
