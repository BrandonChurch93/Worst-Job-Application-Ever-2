import * as THREE from 'three'
import { CANNON, HATCH, HULL, WING } from './numbers'
import type { Pose } from './pose'

// His own shadow on the ground, wide and soft, under the same light as the pillars of the arena.
// The site's key (src/post/look.ts): toward the light (-0.65, 0.6, 0.36), so a shadow falls right and down the page, 42.7 degrees below +x.
// SHADE.reach is model units of shadow for each unit of height; blur is the width of the soft edge; dark is what the ground keeps at the core.
export const SHADE = { dir: [0.735, -0.678] as [number, number], reach: 0.5, blur: 64, dark: 0.4, legWide: 124 }

type P2 = [number, number]

function offset(points: P2[], d: number): P2[] {
  const n = points.length
  return points.map((p, i) => {
    const a = points[(i + n - 1) % n]!
    const b = points[(i + 1) % n]!
    const e0 = [p[0] - a[0], p[1] - a[1]]
    const e1 = [b[0] - p[0], b[1] - p[1]]
    const l0 = Math.hypot(e0[0]!, e0[1]!) || 1
    const l1 = Math.hypot(e1[0]!, e1[1]!) || 1
    const n0 = [e0[1]! / l0, -e0[0]! / l0]
    const n1 = [e1[1]! / l1, -e1[0]! / l1]
    const mx = n0[0]! + n1[0]!
    const my = n0[1]! + n1[1]!
    const k = 2 / Math.max(0.6, mx * mx + my * my)
    return [p[0] + mx * k * d, p[1] + my * k * d] as P2
  })
}

// A flat shape, counter clockwise, whose edge fades over `blur`: full inside, nothing outside.
const soft = (points: P2[], blur: number): THREE.BufferGeometry => rings([offset(points, -blur * 0.5), offset(points, -blur * 0.17), offset(points, blur * 0.17), offset(points, blur * 0.5)])

function rings(shapes: P2[][]): THREE.BufferGeometry {
  const loops: [P2[], number][] = shapes.map((l, i) => [l, [1, 0.78, 0.24, 0][i]!])
  const points = shapes[0]!
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const n = points.length
  for (const [loop, a] of loops) for (const [x, y] of loop) { pos.push(x, y, 0); col.push(1, 1, 1, a) }
  let cx = 0
  let cy = 0
  for (const [x, y] of loops[0]![0]) { cx += x / n; cy += y / n }
  pos.push(cx, cy, 0)
  col.push(1, 1, 1, 1)
  const c = 4 * n
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    idx.push(c, i, j)
    for (let r = 0; r < 3; r++) idx.push(r * n + i, (r + 1) * n + i, (r + 1) * n + j, r * n + i, (r + 1) * n + j, r * n + j)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

const pill = (len: number, wide: number, per = 5): P2[] => {
  const r = wide / 2
  const pts: P2[] = []
  for (let i = 0; i <= per * 2; i++) { const a = -Math.PI / 2 + (i / (per * 2)) * Math.PI; pts.push([len / 2 + r * Math.cos(a), r * Math.sin(a)]) }
  for (let i = 0; i <= per * 2; i++) { const a = Math.PI / 2 + (i / (per * 2)) * Math.PI; pts.push([-len / 2 + r * Math.cos(a), r * Math.sin(a)]) }
  return pts
}

export interface Shade { object: THREE.Group; pose(p: Pose): void; dispose(): void }

export function makeShade(): Shade {
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.011, 0.01), vertexColors: true, transparent: true, opacity: 1 - SHADE.dark, depthWrite: false, side: THREE.DoubleSide })
  const object = new THREE.Group()
  object.name = 'boss-look1-shade'
  const flat = (g: THREE.BufferGeometry): THREE.Mesh => {
    const m = new THREE.Mesh(g, material)
    m.castShadow = false
    m.receiveShadow = false
    m.frustumCulled = false
    m.renderOrder = 1
    m.userData.order = true
    object.add(m)
    return m
  }
  const hx = HULL.hx
  const hy = HULL.hy
  const c = HULL.c
  const wy = hy + WING.reach
  const back = HATCH.cx - HATCH.hx
  const outline: P2[] = [
    [hx, -hy + c], [hx, hy - c], [hx - c, hy], [WING.inner, hy], [WING.outer, wy], [-WING.outer, wy], [-WING.inner, hy], [back + HATCH.c, hy], [back, hy - HATCH.c],
    [back, -hy + HATCH.c], [back + HATCH.c, -hy], [-WING.inner, -hy], [-WING.outer, -wy], [WING.outer, -wy], [WING.inner, -hy], [hx - c, -hy]
  ]
  const body = flat(soft(outline, SHADE.blur))
  const box = (x: number, y: number): P2[] => [[x, -y], [x, y], [-x, y], [-x, -y]]
  const link = rings([box(0.47, 0.22), box(0.5, 0.4), box(0.53, 0.6), box(0.57, 0.78)])
  const legs = [0, 1, 2, 3].map(() => [flat(link), flat(link)] as const)
  const barrel = flat(soft(pill(CANNON.brake[1] - CANNON.ribs[0], 90), SHADE.blur * 0.8))
  const shield = flat(soft(pill(380, 30), 30))
  const [dx, dy] = SHADE.dir
  const at = (x: number, y: number, z: number): P2 => [x + dx * z * SHADE.reach, y + dy * z * SHADE.reach]
  const strip = (m: THREE.Mesh, a: readonly number[], b: readonly number[], wide: number, on: boolean): void => {
    m.visible = on
    if (!on) return
    const [ax, ay] = at(a[0]!, a[1]!, Math.max(0, a[2]!))
    const [bx, by] = at(b[0]!, b[1]!, Math.max(0, b[2]!))
    const len = Math.hypot(bx - ax, by - ay)
    m.position.set((ax + bx) / 2, (ay + by) / 2, 0.5)
    m.rotation.z = Math.atan2(by - ay, bx - ax)
    m.scale.set(Math.max(1, len), wide, 1)
  }
  const pose = (p: Pose): void => {
    const cy = Math.cos(p.body.yaw)
    const sy = Math.sin(p.body.yaw)
    const world = (x: number, y: number): P2 => [x * cy - y * sy, x * sy + y * cy]
    const high = Math.max(0, HULL.top + p.body.z + p.hull.z)
    const fade = 1 / (1 + Math.max(0, p.body.z + p.hull.z) / 260)
    const gone = 1 - p.away.hull
    material.opacity = (1 - SHADE.dark) * fade
    const [ox, oy] = world(p.body.x + p.hull.x, p.body.y + p.hull.y)
    const [sx, sy2] = at(ox, oy, high)
    body.visible = p.hull.show && gone >= 1 && Math.min(p.wings[0]!, p.wings[1]!) > 0.5
    body.position.set(sx, sy2, 0.4)
    body.rotation.z = p.body.yaw
    p.legs.forEach((l, i) => {
      const on = l.show > 0 && p.away.legs[i]! <= 0
      strip(legs[i]![0], l.hip, l.knee, SHADE.legWide, on)
      strip(legs[i]![1], l.knee, l.foot, SHADE.legWide * 0.9, on)
    })
    const out = p.cannon.show && p.cannon.off <= 0 && p.cannon.barrel > -200
    barrel.visible = out
    if (out) {
      const mid = (CANNON.ribs[0] + CANNON.brake[1]) / 2 + CANNON.pivotX
      const [bx, by] = world(p.body.x + mid, p.body.y)
      const [qx, qy] = at(bx, by, CANNON.z + p.body.z)
      barrel.position.set(qx, qy, 0.45)
      barrel.rotation.z = p.body.yaw
    }
    const glass = p.shield.show && p.shield.rise > 0.5 && p.away.shield <= 0 && p.hull.show
    shield.visible = glass
    if (glass) {
      const [bx, by] = world(p.body.x + 372, p.body.y)
      const [qx, qy] = at(bx, by, 150 + p.body.z)
      shield.position.set(qx, qy, 0.42)
      shield.rotation.z = p.body.yaw + Math.PI / 2
    }
  }
  return { object, pose, dispose: () => { material.dispose(); body.geometry.dispose(); link.dispose(); barrel.geometry.dispose(); shield.geometry.dispose() } }
}
