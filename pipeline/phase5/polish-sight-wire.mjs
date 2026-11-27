// The street's gate wire and bats on the screen at given places of the live view, at rest: the wire's top and pin, its lowest point and the px of screen under it (as polish-gate-measure.mjs has them), and the bats' lowest point.
// node pipeline/phase5/polish-sight-wire.mjs [--at 3715.2,3624,3623.47]
import { logic } from '../../tools/lib/logic.mjs'

const i = process.argv.indexOf('--at')
const places = (i < 0 ? '3715.2,3624' : process.argv[i + 1]).split(',').map(Number)
const { load, close } = await logic()
const C = await load('/src/stage/camera.ts')
const D = await load('/src/table/draw.ts')
const { BALL, FLIP, FLIP_REACH, MID, TH, TIER_Y, floorZ } = await load('/src/table/layout.ts')
const floor = floorZ(2) * BALL
for (const scroll of places) {
  const pose = C.homePose(scroll, floor)
  const at = (x, y, z) => C.projectPage(pose, x, y, floor + z)
  const pinY = (TIER_Y[2] + TH - D.WIRE.pin) * BALL
  const top = at(MID * BALL, pinY + D.WIRE.tall * Math.sin(D.WIRE.shut), D.WIRE.axle + D.WIRE.tall * Math.cos(D.WIRE.shut))
  const pin = at(MID * BALL, pinY, D.WIRE.axle)
  const low = Math.max(top.y, pin.y) + D.WIRE.thick * top.pxPerUnit
  const rest = (FLIP.rest * Math.PI) / 180
  const tipY = (TIER_Y[2] + FLIP.pivotV + FLIP_REACH * Math.sin(rest) + FLIP.tip) * BALL
  const bat = Math.max(at(MID * BALL, tipY, 0).y, at(MID * BALL, tipY, 0.5 * BALL).y)
  console.log(`view ${scroll}: the wire's top at y ${top.y.toFixed(1)}, its pin at y ${pin.y.toFixed(1)}, its lowest point at y ${low.toFixed(1)} of 1080, ${(1080 - low).toFixed(1)} px of screen under it; the bats' lowest point at y ${bat.toFixed(1)}, ${(1080 - bat).toFixed(1)} px of screen under it`)
}
await close()
