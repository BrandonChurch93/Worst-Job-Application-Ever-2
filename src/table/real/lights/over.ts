// How a window in the floor answers a ball that rolls over it, in time. Where the ball is decides how far the window may rise (`near` of the levels); the count kept here decides how far it has come up since the ball came.

// `rise`: the seconds the brighter light of a window takes to come up, from the step the middle of the ball is over its glass. Four frames of the film.
// `shade`: how much of its own light the glass loses right under the ball. `spot`: how wide that soft dark spot is, in ball radii. `far`: where the spot ends, in ball radii from the middle of the ball: one radius and the reach of the window's answer, so the glass changes only with a ball in reach.
// `show`: how much of its show of the window the ball holds back while it stands on the glass, so the glass seen through the ball is darker than the glass beside it. `wall`: how much of the window's light the wall of the ball holds back there, so its rim stays the darker of the two.
export const OVER = { rise: 4 / 60, shade: 0.3, spot: 1.15, far: 2.1, show: 0.35, wall: 0.85 }

// One step of a window's count. `was` is how far its light has come up, 0 to 1, or undefined with no ball in reach. `gap` is the gap between the rim of the ball and the rim of the glass in balls: at half a ball under zero the middle of the ball is over the rim. `reach` is the gap at which the window forgets the ball.
export function stepOver(was: number | undefined, gap: number, reach: number, dt: number): number | undefined {
  if (gap >= reach) return undefined
  const k = was ?? 0
  return gap <= -0.5 ? Math.min(1, k + dt / OVER.rise) : k
}

// How far the light is up for a count: 0 to 1, eased at both ends, so no frame takes more than a part of the way.
export const risen = (k: number): number => {
  const t = Math.max(0, Math.min(1, k))
  return t * t * (3 - 2 * t)
}
