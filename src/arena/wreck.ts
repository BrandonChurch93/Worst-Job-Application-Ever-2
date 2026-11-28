// What the big cannon breaks, and the small things of the arena that come and go: the wounds painted into the ground, stumps, rubble, shattered glass, sparks, flashes, smoke, the warning band, the dust of the split and the glint of a shot on a pillar or pane.
// Everything is a function of the view and of the seed.
import * as THREE from 'three'
import type { BossView, ViewBreak } from '../boss/view'
import type { Emitter } from '../real/types'
import { layOver, lineOf, paintLayer, paintWounds, reachOf } from './breaks'
import { clamp01, rnd } from './change'
import { DAMAGE, fresh, geometryOf, tri, type V3, type Wounds } from './ground'
import { ARENA, PAGE, PANES, PILLARS, SEAMS } from './layout'
import { columnGeometry, softDot, stand, type Kit, type Pane, type Pillar } from './props'
import { STANDS, boxToSegment, brokenBy } from './solids'

const wx = (x: number): number => x - PAGE.w / 2
const wy = (y: number): number => PAGE.h / 2 - y

export interface Wreck { object: THREE.Group; pose(view: BossView, light?: (e: Emitter) => void): void; dispose(): void }

// How long each part of a break lasts, in seconds.
export const BREAK = { flash: 0.24, sparks: 0.7, fly: 0.55, smoke: 1.7, glint: 0.18, light: 0.5 }
const RUBBLE_EACH = 11
const SHARDS_EACH = 22
const SPARKS_EACH = 64
const SMOKE_EACH = 20
const DUST = 96
const DUST_SECONDS = 1.9
// Over how many frames the wound of an aimed blast is painted ahead.
const AHEAD_FRAMES = 36

// The broken foot of a pillar: brushed sides that end in a jagged edge, and the dark rough break on top.
function stumpGeometry(seed: number, id: number, high: number): { sides: THREE.BufferGeometry; top: THREE.BufferGeometry } {
  const S = ARENA.pillar.side / 2
  const ring: { x: number; y: number; z: number }[] = []
  const per = 5
  const corners: [number, number][] = [[-S, -S], [S, -S], [S, S], [-S, S]]
  for (let c = 0; c < 4; c++) {
    const a = corners[c]!, b = corners[(c + 1) % 4]!
    for (let i = 0; i < per; i++) {
      const u = i / per
      ring.push({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: high * (0.7 + 0.42 * rnd(seed, 700 + id, c * per + i) ** 1.6) })
    }
  }
  const sides = fresh(), top = fresh()
  const n = ring.length
  const inner = ring.map((p, i) => ({ x: p.x * (0.38 + 0.3 * rnd(seed, 725 + id, i)), y: p.y * (0.38 + 0.3 * rnd(seed, 726 + id, i)), z: high * (0.58 + 0.5 * rnd(seed, 720 + id, i)) }))
  const mid: V3 = [S * 0.3 * (rnd(seed, 741 + id) - 0.5), S * 0.3 * (rnd(seed, 742 + id) - 0.5), high * (0.62 + 0.2 * rnd(seed, 740 + id))]
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!
    const out: V3 = [p.x + q.x, p.y + q.y, 0]
    tri(sides, [p.x, p.y, 0], [q.x, q.y, 0], [q.x, q.y, q.z], out)
    tri(sides, [p.x, p.y, 0], [q.x, q.y, q.z], [p.x, p.y, p.z], out)
    const pi = inner[i]!, qi = inner[(i + 1) % n]!
    tri(top, [p.x, p.y, p.z], [q.x, q.y, q.z], [qi.x, qi.y, qi.z], [0, 0, 1])
    tri(top, [p.x, p.y, p.z], [qi.x, qi.y, qi.z], [pi.x, pi.y, pi.z], [0, 0, 1])
    tri(top, [pi.x, pi.y, pi.z], [qi.x, qi.y, qi.z], mid, [0, 0, 1])
  }
  const g = geometryOf(sides)
  // The brushing runs up the column, as on the whole one.
  const p = g.getAttribute('position'), nor = g.getAttribute('normal'), uv = g.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) * 1.7, (Math.abs(nor.getX(i)) > Math.abs(nor.getY(i)) ? p.getY(i) : p.getX(i)) * 6)
  return { sides: g, top: geometryOf(top) }
}

// A lump of broken metal or ceramic, one unit across.
export function lumpGeometry(seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(0.5, 0)
  const p = g.getAttribute('position')
  const moved = new Map<string, number>()
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
    if (!moved.has(key)) moved.set(key, 0.72 + 0.56 * rnd(seed, 760, moved.size))
    const k = moved.get(key)!
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}

// A flat shard of glass, one unit across: a five-cornered piece, or a three-cornered one. Stretched each its own way, the two give shards of many shapes.
function shardGeometry(three: boolean): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const pts: [number, number][] = three ? [[-0.58, -0.3], [0.62, -0.08], [-0.14, 0.5]] : [[-0.6, -0.12], [-0.08, -0.44], [0.56, -0.3], [0.34, 0.16], [-0.26, 0.5]]
  pts.forEach((q, i) => (i ? shape.lineTo(q[0], q[1]) : shape.moveTo(q[0], q[1])))
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.05, bevelSegments: 1 })
  return g
}

// The teeth a shattered pane leaves in its shoe: low, lowest where the blast went through, with a few thin splinters left standing.
function teethGeometry(seed: number, pane: { id: string; x: number; y0: number; y1: number }, crossed: number, id: number): THREE.BufferGeometry {
  const b = fresh()
  const T = ARENA.pane
  const long = pane.y1 - pane.y0
  const h = T.thick / 2
  let y = -long / 2
  let i = 0
  let last = 4
  let splinters = 0
  while (y < long / 2 - 1) {
    // Low teeth all along the shoe, and two or three thin splinters that still stand tall, away from where the blast went through. Nothing of it stops a shot: the splinters are thin and few so that they do not read as a wall.
    const thin = splinters < 3 && Math.abs(y - crossed) / long > 0.14 && rnd(seed, 880 + id, i) < 0.24
    if (thin) splinters++
    const w = Math.min(long / 2 - y, thin ? 8 + 8 * rnd(seed, 800 + id, i) : 22 + 40 * rnd(seed, 800 + id, i))
    const away = Math.abs(y + w / 2 - crossed) / long
    const tall = thin ? T.high * (0.4 + 0.42 * rnd(seed, 820 + id, i)) : Math.min(T.high * 0.24, 8 + T.high * (0.05 + 0.5 * away) * (0.35 + 0.9 * rnd(seed, 820 + id, i)))
    const tip = y + w * (0.2 + 0.6 * rnd(seed, 840 + id, i))
    const next = thin ? 4 + 8 * rnd(seed, 860 + id, i) : Math.max(4, tall * (0.25 + 0.5 * rnd(seed, 860 + id, i)))
    // Page y runs down: along the pane the tooth runs toward -y of the frame.
    const a0: V3 = [-h, -y, 0], a1: V3 = [h, -y, 0], b0: V3 = [-h, -(y + w), 0], b1: V3 = [h, -(y + w), 0]
    const la: V3 = [-h, -y, last], ra: V3 = [h, -y, last], lb: V3 = [-h, -(y + w), next], rb: V3 = [h, -(y + w), next]
    const lt: V3 = [-h, -tip, tall], rt: V3 = [h, -tip, tall]
    for (const [p, q, r, f] of [[a0, b0, lb, [-1, 0, 0]], [a0, lb, la, [-1, 0, 0]], [la, lb, lt, [-1, 0, 0]], [a1, b1, rb, [1, 0, 0]], [a1, rb, ra, [1, 0, 0]], [ra, rb, rt, [1, 0, 0]], [la, ra, rt, [0, 1, 1]], [la, rt, lt, [0, 1, 1]], [lt, rt, rb, [0, -1, 1]], [lt, rb, lb, [0, -1, 1]]] as [V3, V3, V3, V3][]) tri(b, p, q, r, f)
    y += w
    last = next
    i++
  }
  return geometryOf(b)
}

// The warning across its width, as light on the ground: a narrow hot core, a soft orange fall-off, nothing at the edges.
function bandTexture(): THREE.DataTexture {
  const n = 128
  const data = new Uint8Array(n * 4)
  for (let i = 0; i < n; i++) {
    const u = Math.abs((i + 0.5) / n - 0.5) * 2
    const core = Math.exp(-((u / 0.13) ** 2))
    const glow = Math.exp(-((u / 0.46) ** 2)) * (1 - u * u * u)
    const v = Math.min(1, 0.92 * core + 0.4 * glow)
    data.set([255, Math.round(96 + 140 * core), Math.round(22 + 150 * core * core), Math.round(255 * v)], i * 4)
  }
  const t = new THREE.DataTexture(data, 1, n, THREE.RGBAFormat)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

// The same soft dot as a grey picture, for the things that are blended by their colour.
export function greyDot(): THREE.DataTexture {
  const src = softDot().image.data as Uint8Array
  const data = new Uint8Array(src.length)
  for (let i = 0; i < src.length; i += 4) data.set([src[i + 3]!, src[i + 3]!, src[i + 3]!, 255], i)
  const t = new THREE.DataTexture(data, 64, 64, THREE.RGBAFormat)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

export function makeWreck(seed: number, kit: Kit, wounds: Wounds, pillars: Pillar[], panes: Pane[]): Wreck {
  const root = new THREE.Group()
  root.name = 'arena-wreck'
  const made: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = []
  const keep = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(x: T): T => { made.push(x); return x }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color()
  const lean = ARENA.lean, leanX = ARENA.leanX

  // Stumps of the pillars, and for some the upper part lying where it fell.
  const fallen = keep(columnGeometry(ARENA.pillar.side, ARENA.pillar.high * 0.78))
  const stumps = PILLARS.map((p, i) => {
    const topples = rnd(seed, 900, i) < 0.36
    const high = topples ? 22 + 14 * rnd(seed, 901, i) : 84 + 56 * rnd(seed, 902, i)
    const g = stumpGeometry(seed, i, high)
    keep(g.sides)
    keep(g.top)
    const s = stand(p.x, p.y)
    const sides = new THREE.Mesh(g.sides, kit.aluminium)
    const top = new THREE.Mesh(g.top, kit.broken)
    for (const x of [sides, top]) { x.castShadow = true; x.receiveShadow = true }
    s.root.add(sides, top)
    s.lean.visible = false
    root.add(s.lean)
    let lying: THREE.Mesh | null = null
    if (topples) {
      lying = new THREE.Mesh(fallen, kit.fallen)
      lying.castShadow = true
      lying.receiveShadow = true
      lying.visible = false
      root.add(lying)
    }
    return { lean: s.lean, lying, high, topples }
  })

  // Teeth of the panes: built when a pane breaks, from where the blast went through it.
  const teeth = PANES.map((p) => {
    const s = stand(p.x, (p.y0 + p.y1) / 2)
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), kit.tooth)
    mesh.castShadow = false
    mesh.renderOrder = 4
    s.root.add(mesh)
    s.lean.visible = false
    root.add(s.lean)
    return { lean: s.lean, mesh, by: -1 }
  })

  const instanced = (g: THREE.BufferGeometry, stuff: THREE.Material, n: number, name: string, small: boolean, shadow: boolean): THREE.InstancedMesh => {
    const mesh = new THREE.InstancedMesh(g, stuff, n)
    mesh.name = name
    mesh.count = 0
    mesh.frustumCulled = false
    mesh.castShadow = shadow
    mesh.receiveShadow = shadow
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    if (small) mesh.userData.small = 'count'
    root.add(mesh)
    return mesh
  }
  const rubble = instanced(keep(lumpGeometry(seed)), kit.broken, PILLARS.length * RUBBLE_EACH, 'arena-rubble', true, true)
  const shards = instanced(keep(shardGeometry(false)), kit.shard, PANES.length * SHARDS_EACH, 'arena-shards', true, true)
  shards.renderOrder = 4
  const splinters = instanced(keep(shardGeometry(true)), kit.shard, PANES.length * SHARDS_EACH, 'arena-splinters', true, true)
  splinters.renderOrder = 4
  const plane = keep(new THREE.PlaneGeometry(1, 1))
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }
  const sparkStuff = keep(new THREE.MeshBasicMaterial({ map: softDot(), color: new THREE.Color(1, 1, 1), ...add }))
  const sparks = instanced(plane, sparkStuff, SPARKS_EACH * 2, 'arena-sparks', true, false)
  const flashStuff = keep(new THREE.MeshBasicMaterial({ map: softDot(), color: new THREE.Color(1, 1, 1), depthTest: false, ...add }))
  const flashes = instanced(plane, flashStuff, 24, 'arena-flashes', false, false)
  // Smoke and dust darken what lies under them: what is drawn is how much light they take away.
  const grey = keep(greyDot())
  const smokeStuff = keep(new THREE.MeshBasicMaterial({ map: grey, color: new THREE.Color(1, 1, 1), transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, depthWrite: false, toneMapped: false }))
  const smoke = instanced(plane, smokeStuff, SMOKE_EACH * 2 + DUST, 'arena-smoke', true, false)
  for (const mesh of [sparks, flashes, smoke]) {
    for (let i = 0; i < mesh.instanceMatrix.count; i++) mesh.setColorAt(i, col.setRGB(0, 0, 0))
    mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage)
  }
  sparks.renderOrder = 6
  flashes.renderOrder = 7
  smoke.renderOrder = 5

  const bandStuff = keep(new THREE.MeshBasicMaterial({ map: keep(bandTexture()), color: new THREE.Color(1.25, 1.25, 1.25), opacity: 0, ...add, blending: THREE.NormalBlending }))
  const band = new THREE.Mesh(plane, bandStuff)
  band.name = 'arena-warning'
  band.visible = false
  band.frustumCulled = false
  root.add(band)

  // Where the dust of the split rises: evenly along the seams, the same every run.
  const dust: { x: number; y: number; k: number }[] = []
  {
    const lengths = SEAMS.map((seam) => seam.points.reduce((a, p, i) => (i ? a + Math.hypot(p.x - seam.points[i - 1]!.x, p.y - seam.points[i - 1]!.y) : 0), 0))
    const total = lengths.reduce((a, b) => a + b, 0)
    for (let i = 0; i < DUST; i++) {
      // Every other puff first, so that a level that draws fewer still has them all along the seams.
      const slot = i < DUST / 2 ? i * 2 : (i - DUST / 2) * 2 + 1
      let at = ((slot + rnd(seed, 950, i)) / DUST) * total
      let n = 0
      while (n < SEAMS.length - 1 && at > lengths[n]!) at -= lengths[n++]!
      const pts = SEAMS[n]!.points
      let j = 1
      for (; j < pts.length - 1; j++) {
        const d = Math.hypot(pts[j]!.x - pts[j - 1]!.x, pts[j]!.y - pts[j - 1]!.y)
        if (at <= d) break
        at -= d
      }
      const a = pts[j - 1]!, b = pts[j]!
      const u = clamp01(at / (Math.hypot(b.x - a.x, b.y - a.y) || 1))
      dust.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: i })
    }
  }

  let painted = 'none'
  let ahead: { key: string; layer: Uint8Array; next: number } | null = null
  let aimedLast = ''
  const lineKey = (k: { x0: number; y0: number; x1: number; y1: number; width: number }): string => `${k.x0.toFixed(1)},${k.y0.toFixed(1)},${k.x1.toFixed(1)},${k.y1.toFixed(1)},${k.width}`
  const put = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, turn: number, w: number, h: number, r: number, g: number, b: number): void => {
    q.setFromAxisAngle(v.set(0, 0, 1), turn)
    m4.compose(v.set(x + leanX * z, y + lean * z, z), q, sc.set(w, h, 1))
    mesh.setMatrixAt(i, m4)
    mesh.setColorAt(i, col.setRGB(r, g, b))
  }

  const pose = (view: BossView, light?: (e: Emitter) => void): void => {
    const t = view.time
    const active = view.breaks.filter((k) => k.at <= t).sort((a, b) => a.at - b.at || a.id - b.id)
    const keys = active.map((k) => `${k.id}:${lineKey(k)}`)
    const key = keys.join('|')
    if (key !== painted) {
      // A blast more is laid over what is there; anything else is painted afresh. Both give the same picture.
      if (active.length > 0 && keys.slice(0, -1).join('|') === painted) {
        const k = active[active.length - 1]!
        const r = reachOf(k, DAMAGE.w, DAMAGE.h)
        if (ahead && ahead.key === lineKey(k)) paintLayer(ahead.layer, DAMAGE.w, DAMAGE.h, k, seed, ahead.next, r.j1 + 1)
        else {
          ahead = { key: lineKey(k), layer: ahead?.layer ?? new Uint8Array(wounds.data.length), next: 0 }
          paintLayer(ahead.layer, DAMAGE.w, DAMAGE.h, k, seed, r.j0, r.j1 + 1)
        }
        layOver(wounds.data, ahead.layer, DAMAGE.w, DAMAGE.h, k)
        ahead.key = ''
      } else paintWounds(wounds.data, DAMAGE.w, DAMAGE.h, active, seed)
      wounds.texture.needsUpdate = true
      painted = key
    }
    // While the big cannon takes aim its line is known: the wound it will leave is painted a few rows a frame, out of sight, so that the frame of the blast has little left to do. What is seen is the same either way.
    const aimed = view.boss.big
    if (aimed && aimed.firedAt === null) {
      const k: ViewBreak = { id: 0, at: 0, x0: aimed.x0, y0: aimed.y0, x1: aimed.x1, y1: aimed.y1, width: aimed.width }
      const r = reachOf(k, DAMAGE.w, DAMAGE.h)
      // A line that still turns is not painted: the work starts once it has lain still from one call to the next.
      const still = lineKey(k) === aimedLast
      aimedLast = lineKey(k)
      if (still && (!ahead || ahead.key !== lineKey(k))) ahead = { key: lineKey(k), layer: ahead?.layer ?? new Uint8Array(wounds.data.length), next: r.j0 }
      if (still && ahead && ahead.next <= r.j1) {
        const to = Math.min(r.j1 + 1, ahead.next + Math.ceil((r.j1 - r.j0 + 1) / AHEAD_FRAMES))
        paintLayer(ahead.layer, DAMAGE.w, DAMAGE.h, k, seed, ahead.next, to)
        ahead.next = to
      }
    }
    // The newest blast keeps its embers hot for a moment.
    const newest = active.reduce((a, k) => Math.max(a, k.at), -99)
    wounds.ember.value = 1 + 2.2 * Math.exp(-Math.max(0, t - newest) / 0.5)

    let nRubble = 0, nShards = 0, nSplinters = 0, nSparks = 0, nFlash = 0, nSmoke = 0

    // Pillars.
    pillars.forEach((p, i) => {
      const k = brokenBy(view.breaks, t, STANDS[i]!)
      const s = stumps[i]!
      s.lean.visible = !!k
      if (s.lying) s.lying.visible = !!k
      if (!k) return
      p.root.visible = false
      const age = t - k.at
      const l = lineOf(k, seed)
      // Away from the line of the blast.
      const side = -(p.x - k.x0) * l.uy + (p.y - k.y0) * l.ux >= 0 ? 1 : -1
      const ax = -l.uy * side, ay = l.ux * side
      const fly = clamp01(age / BREAK.fly)
      const out = 1 - (1 - fly) * (1 - fly)
      if (s.lying) {
        const turn = Math.atan2(-(ay + 0.55 * l.uy * (rnd(seed, 905, i) - 0.3)), ax + 0.55 * l.ux * (rnd(seed, 905, i) - 0.3))
        const down = fly * fly
        // It tips over about its broken end: upright at the break, flat on the ground at the end.
        e.set(0, (Math.PI / 2) * down, turn, 'ZYX')
        s.lying.quaternion.setFromEuler(e)
        const off = 34
        s.lying.position.set(wx(p.x) + Math.cos(turn) * off * down + leanX * (1 - down) * s.high, wy(p.y) + Math.sin(turn) * off * down + lean * (1 - down) * s.high, (1 - down) * s.high + down * (ARENA.pillar.side / 2))
      }
      for (let j = 0; j < RUBBLE_EACH; j++) {
        const a = Math.atan2(-ay, ax) + (rnd(seed, 910 + i, j) - 0.5) * 2.6
        const far = 34 + 120 * rnd(seed, 920 + i, j) ** 1.5
        const size = 14 + 38 * rnd(seed, 930 + i, j) ** 1.7
        const z = size * 0.3 + Math.sin(Math.PI * fly) * (30 + 60 * rnd(seed, 935 + i, j))
        e.set(rnd(seed, 940 + i, j) * 6 + fly * 5, rnd(seed, 941 + i, j) * 6 + fly * 4, rnd(seed, 942 + i, j) * 6)
        q.setFromEuler(e)
        m4.compose(v.set(wx(p.x) + Math.cos(a) * far * out + leanX * z, wy(p.y) + Math.sin(a) * far * out + lean * z, z), q, sc.set(size, size * (0.6 + 0.5 * rnd(seed, 943 + i, j)), size * 0.62))
        rubble.setMatrixAt(nRubble++, m4)
      }
    })

    // Panes.
    panes.forEach((p, i) => {
      const k = brokenBy(view.breaks, t, STANDS[PILLARS.length + i]!)
      const tt = teeth[i]!
      tt.lean.visible = !!k
      if (!k) return
      p.whole.visible = false
      p.shade.visible = false
      const l = lineOf(k, seed)
      // Where along the pane the line went through.
      const cross = Math.abs(l.ux) > 1e-6 ? k.y0 + ((p.x - k.x0) / l.ux) * l.uy : (p.y0 + p.y1) / 2
      const mid = (p.y0 + p.y1) / 2
      const at = Math.max(p.y0, Math.min(p.y1, cross))
      if (tt.by !== k.id) {
        tt.mesh.geometry.dispose()
        tt.mesh.geometry = teethGeometry(seed, PANES[i]!, at - mid, i)
        tt.by = k.id
      }
      const age = t - k.at
      const fly = clamp01(age / BREAK.fly)
      const out = 1 - (1 - fly) * (1 - fly)
      const push = l.ux >= 0 ? 1 : -1
      for (let j = 0; j < SHARDS_EACH; j++) {
        const along = p.y0 + (p.y1 - p.y0) * rnd(seed, 960 + i, j)
        const near = 1 - Math.min(1, Math.abs(along - at) / 260)
        // Most fall the way the blast went, some the other way.
        const dir = rnd(seed, 961 + i, j) < 0.7 ? push : -push
        const far = (24 + 170 * rnd(seed, 962 + i, j) ** 1.3) * (0.5 + 0.7 * near) * dir
        const size = 26 + 66 * rnd(seed, 963 + i, j) ** 1.8
        const z = 2 + size * 0.14 + Math.sin(Math.PI * fly) * (40 + 80 * rnd(seed, 964 + i, j)) + (1 - fly) * 60
        const flat = fly * fly
        e.set((1 - flat) * (rnd(seed, 965 + i, j) * 5 + 1) + 0.5 * (rnd(seed, 975 + i, j) - 0.5), (1 - flat) * (rnd(seed, 966 + i, j) * 5) + 0.5 * (rnd(seed, 976 + i, j) - 0.5), rnd(seed, 967 + i, j) * 6.283)
        q.setFromEuler(e)
        m4.compose(v.set(wx(p.x) + far * out + leanX * z, wy(along + (rnd(seed, 968 + i, j) - 0.5) * 60 * out) + lean * z, z), q, sc.set(size, size * (0.5 + 0.9 * rnd(seed, 969 + i, j)), size))
        if (j % 2) splinters.setMatrixAt(nSplinters++, m4)
        else shards.setMatrixAt(nShards++, m4)
      }
    })

    // Each blast: the flash on the ground along its line, the burst at its far end, sparks and smoke.
    for (const k of active) {
      const age = t - k.at
      if (age > BREAK.smoke) continue
      const l = lineOf(k, seed)
      const turn = Math.atan2(-l.uy, l.ux)
      if (age < BREAK.flash && nFlash < 20) {
        const f = (1 - age / BREAK.flash) ** 2
        put(flashes, nFlash++, wx((k.x0 + k.x1) / 2), wy((k.y0 + k.y1) / 2), 6, turn, l.long * 1.25, k.width * 2.3, 2.2 * f, 1.0 * f, 0.3 * f)
        put(flashes, nFlash++, wx((k.x0 + k.x1) / 2), wy((k.y0 + k.y1) / 2), 6, turn, l.long * 1.15, k.width * 0.9, 3 * f, 2.4 * f, 1.6 * f)
        put(flashes, nFlash++, wx(k.x1), wy(k.y1), 8, 0, 520 + 300 * (1 - f), 520 + 300 * (1 - f), 3 * f, 1.8 * f, 0.7 * f)
      }
      if (age < BREAK.sparks && nSparks + SPARKS_EACH <= sparks.instanceMatrix.count) {
        const f = age / BREAK.sparks
        // Sparks leave from the things that broke and from the far end.
        const from: { x: number; y: number }[] = [{ x: k.x1 - l.ux * 40, y: k.y1 - l.uy * 40 }]
        STANDS.forEach((s) => { if (brokenBy(view.breaks, t, s)?.id === k.id) from.push({ x: (s.box.x0 + s.box.x1) / 2, y: (s.box.y0 + s.box.y1) / 2 }) })
        for (let j = 0; j < SPARKS_EACH; j++) {
          const o = from[j % from.length]!
          const a = rnd(seed, 970 + k.id, j) * 6.283
          const speed = 160 + 620 * rnd(seed, 971 + k.id, j)
          const d = speed * (1 - Math.exp(-age * 5)) / 5 * 2.2
          const fade = Math.max(0, 1 - f - 0.5 * rnd(seed, 972 + k.id, j)) * 2
          const len = 6 + speed * 0.05 * (1 - f)
          put(sparks, nSparks++, wx(o.x) + Math.cos(a) * d, wy(o.y) + Math.sin(a) * d, 30 + 50 * Math.sin(Math.PI * Math.min(1, f * 1.4)) * rnd(seed, 973 + k.id, j), a, len, 3.2, 3.2 * fade, 1.9 * fade, 0.7 * fade)
        }
      }
      if (nSmoke + SMOKE_EACH <= SMOKE_EACH * 2) {
        const f = age / BREAK.smoke
        for (let j = 0; j < SMOKE_EACH; j++) {
          const s = l.long * rnd(seed, 980 + k.id, j)
          const c = (rnd(seed, 981 + k.id, j) - 0.5) * k.width * 0.7
          const born = 0.25 * rnd(seed, 982 + k.id, j)
          const g = clamp01((f - born) / (1 - born))
          const dark = 0.5 * Math.sin(Math.PI * Math.sqrt(g)) * (1 - g)
          const size = 70 + 150 * g + 60 * rnd(seed, 983 + k.id, j)
          put(smoke, nSmoke++, wx(k.x0 + l.ux * s - l.uy * c) + 30 * g * (rnd(seed, 984 + k.id, j) - 0.5), wy(k.y0 + l.uy * s + l.ux * c) + 46 * g, 20 + 60 * g, rnd(seed, 985 + k.id, j) * 6, size, size, dark * 0.9, dark * 0.95, dark)
        }
      }
      if (light && age < BREAK.light) {
        const f = (1 - age / BREAK.light) ** 2
        light({ x: (k.x0 + k.x1) / 2, y: (k.y0 + k.y1) / 2, z: 40, colour: [1, 0.62, 0.3], power: 3.2 * f, reach: 900 })
        light({ x: k.x1 - l.ux * 60, y: k.y1 - l.uy * 60, z: 30, colour: [1, 0.5, 0.18], power: 2.4 * f, reach: 600 })
      }
    }
    // The light that comes up through the newest hole.
    if (light && active.length) {
      const k = active.reduce((a, b) => (b.at > a.at ? b : a))
      const l = lineOf(k, seed)
      light({ x: k.x1 - l.ux * l.hole * 0.5, y: k.y1 - l.uy * l.hole * 0.5, z: 12, colour: [1, 0.5, 0.14], power: 0.55, reach: 300 })
    }

    // The dust of the split.
    const since = t - ARENA.splitAt
    if (since >= 0 && since < DUST_SECONDS) {
      for (const d of dust) {
        const born = 0.1 * rnd(seed, 990, d.k)
        const g = clamp01((since - born) / (DUST_SECONDS - born))
        // Up in a few frames, then it hangs and thins.
        // Pale and warm: it takes away a third of the light at most, and more of the blue than of the red.
        const dark = (0.24 + 0.14 * rnd(seed, 994, d.k)) * Math.sin(Math.PI * g ** 0.4) * (1 - g * 0.4)
        const size = 52 + 150 * Math.sqrt(g) + 46 * rnd(seed, 991, d.k)
        put(smoke, nSmoke++, wx(d.x) + 24 * g * (rnd(seed, 992, d.k) - 0.5), wy(d.y) + 30 * g, 10 + 40 * g, rnd(seed, 993, d.k) * 6, size, size * (0.7 + 0.5 * rnd(seed, 996, d.k)), dark * 0.74, dark * 0.86, dark)
      }
    }

    // The glint where a shot is stopped by a pillar or a pane.
    for (const h of view.hits) {
      const age = t - h.at
      if (h.kind !== 'solid' || age < 0 || age >= BREAK.glint || nFlash >= flashes.instanceMatrix.count - 1) continue
      const f = (1 - age / BREAK.glint) ** 1.5
      put(flashes, nFlash++, wx(h.x), wy(h.y), 40, 0, 46 + 70 * (1 - f), 46 + 70 * (1 - f), 2.6 * f, 1.6 * f, 0.7 * f)
      put(flashes, nFlash++, wx(h.x), wy(h.y), 40, rnd(seed, 995, h.id) * 3, 150 * f + 30, 5, 2.4 * f, 2 * f, 1.4 * f)
    }

    // The warning: light on the ground where the big cannon is about to cut. It narrows and brightens as the tell rises, and it lights the pillars and the pane that stand in it.
    const big = view.boss.big
    const warns = !!big && big.firedAt === null && big.tell > 0
    band.visible = warns
    if (warns && big) {
      const tell = clamp01(big.tell)
      const long = Math.hypot(big.x1 - big.x0, big.y1 - big.y0) || 1
      const ux = (big.x1 - big.x0) / long, uy = (big.y1 - big.y0) / long
      const beat = 0.86 + 0.14 * Math.sin(t * (9 + 22 * tell))
      band.position.set(wx((big.x0 + big.x1) / 2), wy((big.y0 + big.y1) / 2), 0.8)
      band.rotation.z = Math.atan2(-(big.y1 - big.y0), big.x1 - big.x0)
      band.scale.set(long, big.width * (1.5 - 1.02 * tell), 1)
      bandStuff.opacity = (0.3 + 0.7 * tell * tell) * beat
      if (light) {
        const power = (0.5 + 2.1 * tell * tell) * beat
        // On every thing the blast will break, and where the line leaves the page.
        let lit = 0
        for (const st of STANDS) {
          if (lit >= 4 || brokenBy(view.breaks, t, st) || boxToSegment(st.box, big.x0, big.y0, big.x1, big.y1) > big.width / 2) continue
          const cx = (st.box.x0 + st.box.x1) / 2, cy = (st.box.y0 + st.box.y1) / 2
          const along = clamp01(((cx - big.x0) * ux + (cy - big.y0) * uy) / long) * long
          light({ x: big.x0 + ux * along, y: big.y0 + uy * along, z: 26, colour: [1, 0.42, 0.1], power, reach: 260 })
          lit++
        }
        light({ x: big.x0 + ux * long * 0.5, y: big.y0 + uy * long * 0.5, z: 30, colour: [1, 0.45, 0.12], power: power * 0.7, reach: 420 })
      }
    }

    for (const [mesh, n] of [[rubble, nRubble], [shards, nShards], [splinters, nSplinters], [sparks, nSparks], [flashes, nFlash], [smoke, nSmoke]] as [THREE.InstancedMesh, number][]) {
      mesh.visible = n > 0
      mesh.count = n
      if (n > 0) {
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      }
    }
  }

  return {
    object: root,
    pose,
    dispose(): void {
      made.forEach((x) => x.dispose())
      teeth.forEach((x) => x.mesh.geometry.dispose())
      for (const mesh of [rubble, shards, splinters, sparks, flashes, smoke]) mesh.dispose()
    }
  }
}
