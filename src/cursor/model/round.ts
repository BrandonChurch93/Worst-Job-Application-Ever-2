// The smallest circle that holds n points, into out: its centre and its radius. It makes nothing, so it can run on every frame.
// Each point that lies outside the circle found so far must lie on the new one; the same holds for a second and a third.
export function smallestRound(x: Float64Array, y: Float64Array, n: number, out: { x: number; y: number; r: number }): void {
  let cx = n > 0 ? x[0]! : 0
  let cy = n > 0 ? y[0]! : 0
  let r = 0
  const slack = 1e-9
  for (let i = 1; i < n; i++) {
    const ax = x[i]!
    const ay = y[i]!
    if (Math.hypot(ax - cx, ay - cy) <= r + slack) continue
    cx = ax
    cy = ay
    r = 0
    for (let j = 0; j < i; j++) {
      const bx = x[j]!
      const by = y[j]!
      if (Math.hypot(bx - cx, by - cy) <= r + slack) continue
      cx = (ax + bx) / 2
      cy = (ay + by) / 2
      r = Math.hypot(ax - bx, ay - by) / 2
      for (let k = 0; k < j; k++) {
        const qx = x[k]!
        const qy = y[k]!
        if (Math.hypot(qx - cx, qy - cy) <= r + slack) continue
        const d = 2 * (ax * (by - qy) + bx * (qy - ay) + qx * (ay - by))
        if (Math.abs(d) < 1e-12) continue
        const a2 = ax * ax + ay * ay
        const b2 = bx * bx + by * by
        const q2 = qx * qx + qy * qy
        cx = (a2 * (by - qy) + b2 * (qy - ay) + q2 * (ay - by)) / d
        cy = (a2 * (qx - bx) + b2 * (ax - qx) + q2 * (bx - ax)) / d
        r = Math.hypot(ax - cx, ay - cy)
      }
    }
  }
  out.x = cx
  out.y = cy
  out.r = r
}
