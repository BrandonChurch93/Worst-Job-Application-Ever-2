import { stepHz } from '../../config'

// The film's clock against the scene's own clock. The scene's clock stands still at `stop` (where the seal used to fall) while the fight with the port goes on, until the film's second `gone`, when the arrow is gone. To give those seconds back, the scene's clock skips three waits, each `[at, by, live]`: the ball on the plunger, the office tier emptying, the ball in the firehouse. All in seconds; the skips add up to `gone - stop`, so the film and the scene agree again after the last one. A skip whose `live` is 1 is made on the live site too, where the fight is that much longer than it was.
export const CLOCK = { stop: 3.3, gone: 6.9, skips: [[9.45, 0.9, 1], [23.4, 1.3, 0], [27.95, 1.4, 0]] }

const steps = (seconds: number): number => Math.round(seconds * stepHz)

export function sceneOf(film: number): number {
  const n = steps(film)
  if (n <= steps(CLOCK.stop)) return film
  if (n <= steps(CLOCK.gone)) return steps(CLOCK.stop) / stepHz
  let m = steps(CLOCK.stop) + n - steps(CLOCK.gone)
  for (const k of CLOCK.skips) if (m >= steps(k[0]!)) m += steps(k[1]!)
  return m / stepHz
}

export function filmOf(scene: number): number {
  if (scene <= CLOCK.stop) return scene
  let cut = 0
  for (const k of CLOCK.skips) cut += Math.max(0, Math.min(k[1]!, scene - k[0]!))
  return scene - cut + CLOCK.gone - CLOCK.stop
}
