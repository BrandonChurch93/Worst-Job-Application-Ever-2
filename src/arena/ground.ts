// The ground of the arena: the ceramic page as nine slabs with chamfered edges, the seams that glow from below, the socket the button left, and the cracks that race over the page before it splits.
import * as THREE from 'three'
import { materials } from '../shell/materials'
import { merge, outlineOf, profile, sweep, translate, type ProfilePoint } from '../shell/solids'
import { crackHalf, crackTime, rnd, seamLight, seamOpen } from './change'
import { ARENA, PAGE, SEAMS, SLABS, inset, type Pt, type Slab } from './layout'

const wx = (x: number): number => x - PAGE.w / 2
const wy = (y: number): number => PAGE.h / 2 - y

// The picture the ground reads its wounds from: red soot, green depth of a cut, blue embers, alpha the light from below where a slab is broken through. Three texels to four page px.
export const DAMAGE = { w: 1440, h: 810 }
const SPILL = { w: 960, h: 540 }

export interface Wounds { texture: THREE.DataTexture; data: Uint8Array; time: { value: number }; ember: { value: number }; spill: THREE.DataTexture; seam: { value: number } }

export function makeWounds(): Wounds {
  const data = new Uint8Array(DAMAGE.w * DAMAGE.h * 4)
  const texture = new THREE.DataTexture(data, DAMAGE.w, DAMAGE.h, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.NoColorSpace
  texture.needsUpdate = true
  return { texture, data, time: { value: 0 }, ember: { value: 1 }, spill: spillTexture(), seam: { value: 0 } }
}

// How much of the seams' light falls on the ceramic beside them: 1 at a seam's edge, gone some 40 px away. Made once.
function spillTexture(): THREE.DataTexture {
  const W = SPILL.w, H = SPILL.h
  const data = new Uint8Array(W * H)
  const reach = 46
  // The light comes from below and the picture looks from below: the spill lies a little down the screen.
  const drop = ARENA.lean * ARENA.seamDepth * 0.5
  for (const seam of SEAMS) {
    const p = seam.points
    for (let i = 0; i < p.length - 1; i++) {
      const ax = p[i]!.x, ay = p[i]!.y + drop, bx = p[i + 1]!.x, by = p[i + 1]!.y + drop
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach) / 2)), i1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx) + reach) / 2))
      const j0 = Math.max(0, Math.floor((Math.min(ay, by) - reach) / 2)), j1 = Math.min(H - 1, Math.ceil((Math.max(ay, by) + reach) / 2))
      const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey || 1
      for (let j = j0; j <= j1; j++) {
        const y = j * 2 + 1
        for (let k = i0; k <= i1; k++) {
          const x = k * 2 + 1
          const u = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / l2))
          const d = Math.hypot(x - ax - ex * u, y - ay - ey * u) - ARENA.seamHalf * 0.6
          const v = d <= 0 ? 255 : Math.round(255 * Math.exp(-d / 13))
          const at = (H - 1 - j) * W + k
          if (v > data[at]!) data[at] = v
        }
      }
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.UnsignedByteType)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  t.colorSpace = THREE.NoColorSpace
  t.needsUpdate = true
  return t
}

// The page's own ceramic, with the wounds read in: the soot darkens it, the cut bends its normal so the light of the site shades the trench, the embers and the light from below shine.
export function woundedCeramic(w: Wounds): THREE.MeshPhysicalMaterial {
  const base = materials().ceramic
  const m = new THREE.MeshPhysicalMaterial()
  m.copy(base)
  const before = base.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    before.call(base, shader, renderer)
    shader.uniforms.arenaWounds = { value: w.texture }
    shader.uniforms.arenaTime = w.time
    shader.uniforms.arenaEmber = w.ember
    shader.uniforms.arenaSpill = { value: w.spill }
    shader.uniforms.arenaSeam = w.seam
    shader.vertexShader = 'varying vec2 vArenaUv;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n\tvArenaUv = vec2( position.x / ${PAGE.w.toFixed(1)} + 0.5, position.y / ${PAGE.h.toFixed(1)} + 0.5 );`)
    const head = `varying vec2 vArenaUv;\nuniform sampler2D arenaWounds;\nuniform float arenaTime;\nuniform float arenaEmber;\nuniform sampler2D arenaSpill;\nuniform float arenaSeam;\nfloat arenaHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }\n`
    const texel = `vec2( ${(1.5 / DAMAGE.w).toFixed(6)}, ${(1.5 / DAMAGE.h).toFixed(6)} )`
    const colour = '#include <color_fragment>'
    const emissive = '#include <emissivemap_fragment>'
    if (!shader.fragmentShader.includes(colour) || !shader.fragmentShader.includes(emissive)) throw new Error('The surface code of this three.js release is not the one the arena was written for')
    shader.fragmentShader = head + shader.fragmentShader
      .replace(colour, `${colour}\n\tvec4 arenaW = texture2D( arenaWounds, vArenaUv );\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.2, 0.15, 0.115 ), smoothstep( 0.0, 0.5, arenaW.r ) * 0.85 );\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.03, 0.027, 0.025 ), smoothstep( 0.3, 1.0, arenaW.r ) );\n\tdiffuseColor.rgb *= mix( vec3( 1.0 ), vec3( 0.7, 0.6, 0.52 ), smoothstep( 0.08, 0.3, arenaW.a ) );`)
      .replace(emissive, `${emissive}
\t{
\t\tvec2 arenaT = ${texel};
\t\tfloat arenaDx = texture2D( arenaWounds, vArenaUv + vec2( arenaT.x, 0.0 ) ).g - texture2D( arenaWounds, vArenaUv - vec2( arenaT.x, 0.0 ) ).g;
\t\tfloat arenaDy = texture2D( arenaWounds, vArenaUv + vec2( 0.0, arenaT.y ) ).g - texture2D( arenaWounds, vArenaUv - vec2( 0.0, arenaT.y ) ).g;
\t\tnormal = normalize( normal + vec3( arenaDx, arenaDy, 0.0 ) * 2.6 );
\t\troughnessFactor = mix( roughnessFactor, 0.95, arenaW.r );
\t\tfloat arenaFlick = 0.76 + 0.24 * sin( arenaTime * 5.0 + vArenaUv.x * 173.0 + sin( vArenaUv.y * 131.0 + arenaTime * 3.1 ) * 2.0 );
\t\tfloat arenaLight = smoothstep( 0.55, 0.9, arenaW.a );
\t\tfloat arenaWall = smoothstep( 0.08, 0.3, arenaW.a ) * ( 1.0 - arenaLight );
\t\tfloat arenaB = arenaW.b * arenaW.b;
\t\ttotalEmissiveRadiance += arenaEmber * mix( vec3( 1.9, 0.36, 0.03 ), vec3( 3.6, 1.7, 0.34 ), arenaB ) * arenaB * arenaFlick;
\t\ttotalEmissiveRadiance += mix( vec3( 1.5, 0.4, 0.035 ), vec3( 2.9, 1.35, 0.24 ), smoothstep( 0.66, 1.0, arenaW.a ) ) * arenaLight + vec3( 0.2, 0.06, 0.01 ) * arenaWall;
\t\tfloat arenaS = texture2D( arenaSpill, vArenaUv ).r;
\t\ttotalEmissiveRadiance += vec3( 0.8, 0.2, 0.03 ) * arenaS * arenaS * arenaSeam * ( 1.0 - arenaW.r );
\t}`)
  }
  m.customProgramCacheKey = () => `${base.customProgramCacheKey()}-arena-wounds`
  return m
}

export interface Build { pos: number[]; nor: number[]; uv: number[]; col: number[] }
export const fresh = (): Build => ({ pos: [], nor: [], uv: [], col: [] })

export function geometryOf(b: Build, colour = false): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2))
  if (colour) g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3))
  return g
}

export type V3 = [number, number, number]
// One triangle, turned so that it faces the way `facing` points.
export function tri(b: Build, a: V3, c: V3, d: V3, facing: V3 | null, colours?: [V3, V3, V3]): void {
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2]
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2]
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
  const l = Math.hypot(nx, ny, nz) || 1
  nx /= l
  ny /= l
  nz /= l
  let order: V3[] = [a, c, d]
  let cols = colours
  if (facing && nx * facing[0] + ny * facing[1] + nz * facing[2] < 0) {
    order = [a, d, c]
    if (colours) cols = [colours[0], colours[2], colours[1]]
    nx = -nx
    ny = -ny
    nz = -nz
  }
  order.forEach((p, i) => {
    b.pos.push(p[0], p[1], p[2])
    b.nor.push(nx, ny, nz)
    b.uv.push(p[0] + p[2] * 0.7, p[1] + p[2] * 0.7)
    if (cols) b.col.push(cols[i]![0], cols[i]![1], cols[i]![2])
  })
}

const SLOT_RIM = 9

function slotOutline(insetBy: number): THREE.Vector2[] {
  const o = outlineOf({ kind: 'capsule', w: ARENA.slot.w + SLOT_RIM * 2, h: ARENA.slot.h + SLOT_RIM * 2 }, insetBy, 16)
  const out: THREE.Vector2[] = []
  for (let i = 0; i < o.count; i++) out.push(new THREE.Vector2(wx(ARENA.slot.x) + o.x[i]!, wy(ARENA.slot.y) + o.y[i]!))
  return out
}

const WALL_TOP: V3 = [0.1, 0.034, 0.014]
const WALL_FOOT: V3 = [0.5, 0.14, 0.024]
const BED: V3 = [1.7, 0.5, 0.075]
const BED_INSET = 3.5

// The tops of the nine slabs with their chamfers, and the walls of the seams below them.
function slabs(): { tops: THREE.BufferGeometry; walls: THREE.BufferGeometry; bed: THREE.BufferGeometry } {
  const tops = fresh()
  const walls = fresh()
  const bed = fresh()
  const half = ARENA.seamHalf
  for (const slab of SLABS) {
    const top = inset(slab, half + ARENA.chamfer)
    const lip = inset(slab, half + 0.6)
    const foot = inset(slab, BED_INSET)
    const mid = slab.outline
    const contour = top.map((p) => new THREE.Vector2(wx(p.x), wy(p.y)))
    const holes = slab.id === 'bottom' ? [slotOutline(0)] : []
    const all = [...contour, ...holes.flat()]
    for (const f of THREE.ShapeUtils.triangulateShape(contour, holes)) {
      const p = f.map((i) => all[i]!)
      tri(tops, [p[0]!.x, p[0]!.y, 0], [p[1]!.x, p[1]!.y, 0], [p[2]!.x, p[2]!.y, 0], [0, 0, 1])
    }
    const n = top.length
    for (let i = 0; i < n; i++) {
      if (!slab.open[i]) continue
      const j = (i + 1) % n
      const t0: V3 = [wx(top[i]!.x), wy(top[i]!.y), 0], t1: V3 = [wx(top[j]!.x), wy(top[j]!.y), 0]
      const l0: V3 = [wx(lip[i]!.x), wy(lip[i]!.y), -ARENA.chamfer * 0.8], l1: V3 = [wx(lip[j]!.x), wy(lip[j]!.y), -ARENA.chamfer * 0.8]
      // The picture looks a little from below: what lies deep is seen further down the screen, so the wall under the upper edge shows and the bed glows along the lower edge.
      const deep = -ARENA.seamDepth, sunk = ARENA.lean * deep
      const f0: V3 = [wx(foot[i]!.x), wy(foot[i]!.y) + sunk, deep], f1: V3 = [wx(foot[j]!.x), wy(foot[j]!.y) + sunk, deep]
      const m0: V3 = [wx(mid[i]!.x), wy(mid[i]!.y) + sunk, deep], m1: V3 = [wx(mid[j]!.x), wy(mid[j]!.y) + sunk, deep]
      // The chamfer faces up and out into the seam.
      const out: V3 = [l0[0] - t0[0], l0[1] - t0[1], 3]
      tri(tops, t0, t1, l1, out)
      tri(tops, t0, l1, l0, out)
      tri(walls, l0, l1, f1, out, [WALL_TOP, WALL_TOP, WALL_FOOT])
      tri(walls, l0, f1, f0, out, [WALL_TOP, WALL_FOOT, WALL_FOOT])
      tri(bed, f0, f1, m1, [0, 0, 1], [WALL_FOOT, WALL_FOOT, BED])
      tri(bed, f0, m1, m0, [0, 0, 1], [WALL_FOOT, BED, BED])
    }
  }
  // Under every joint of three seams, where no slab's bed reaches: a patch of the same light.
  const z = -ARENA.seamDepth - 0.5, sunk = ARENA.lean * z, r = 30
  const seen = new Set<string>()
  for (const s of SEAMS) {
    for (const p of [s.points[0]!, s.points[s.points.length - 1]!]) {
      const key = `${Math.round(p.x)},${Math.round(p.y)}`
      if (seen.has(key)) continue
      seen.add(key)
      const x = wx(p.x), y = wy(p.y) + sunk
      const a: V3 = [x - r, y - r, z], b: V3 = [x + r, y - r, z], c: V3 = [x + r, y + r, z], d: V3 = [x - r, y + r, z]
      tri(bed, a, b, c, [0, 0, 1], [BED, BED, BED])
      tri(bed, a, c, d, [0, 0, 1], [BED, BED, BED])
    }
  }
  return { tops: geometryOf(tops), walls: geometryOf(walls, true), bed: geometryOf(bed, true) }
}

// The socket the Submit button broke out of: a ribbed collar, dark walls, a black floor.
function slot(): { collar: THREE.BufferGeometry; pit: THREE.BufferGeometry } {
  const plan = { kind: 'capsule', w: ARENA.slot.w + SLOT_RIM * 2, h: ARENA.slot.h + SLOT_RIM * 2 }
  const rim: ProfilePoint[] = [[0, -1, true], [0, 1.2], [1.6, 2.6], [3.4, 2.6], [4.6, 1.4], [5.4, 2.6], [7, 2.6], [SLOT_RIM, 0.6], [SLOT_RIM, -6, true]]
  const collar = translate(sweep(outlineOf(plan, 0, 16), profile(rim), false), wx(ARENA.slot.x), wy(ARENA.slot.y))
  const wall: ProfilePoint[] = [[SLOT_RIM, -6, true], [SLOT_RIM + 1.5, -ARENA.wellDepth + 6, true]]
  const pit = merge([
    translate(sweep(outlineOf(plan, 0, 16), profile(wall), false), wx(ARENA.slot.x), wy(ARENA.slot.y)),
    translate(sweep(outlineOf(plan, SLOT_RIM + 1.5, 16), [{ inset: 0, z: -ARENA.wellDepth + 6, out: 0, up: 1 }]), wx(ARENA.slot.x), wy(ARENA.slot.y))
  ])
  return { collar, pit }
}

// The hairline cracks round the socket, as the picture has them: jagged lines that run out from its rim, some with a branch.
function slotCracks(seed: number): { geometry: THREE.BufferGeometry; grow: Float32Array } {
  const b = fresh()
  const grow: number[] = []
  const ribbon = (line: Pt[], w0: number, order: number): void => {
    let run = 0
    const total = line.reduce((a, p, i) => (i ? a + Math.hypot(p.x - line[i - 1]!.x, p.y - line[i - 1]!.y) : 0), 0) || 1
    for (let i = 0; i < line.length - 1; i++) {
      const p = line[i]!, q = line[i + 1]!
      const l = Math.hypot(q.x - p.x, q.y - p.y) || 1
      const nx = -(q.y - p.y) / l, ny = (q.x - p.x) / l
      const wa = w0 * (1 - run / total) + 0.25
      run += l
      const wb = w0 * (1 - run / total) + 0.25
      const a0: V3 = [wx(p.x + nx * wa), wy(p.y + ny * wa), 0], a1: V3 = [wx(p.x - nx * wa), wy(p.y - ny * wa), 0]
      const b0: V3 = [wx(q.x + nx * wb), wy(q.y + ny * wb), 0], b1: V3 = [wx(q.x - nx * wb), wy(q.y - ny * wb), 0]
      tri(b, a0, a1, b1, [0, 0, 1])
      tri(b, a0, b1, b0, [0, 0, 1])
      for (let k = 0; k < 6; k++) grow.push(order)
    }
  }
  const count = 11
  for (let c = 0; c < count; c++) {
    const a = (c / count) * Math.PI * 2 + (rnd(seed, 300 + c) - 0.5) * 0.5
    const ex = (ARENA.slot.w / 2 + SLOT_RIM - 30) * Math.cos(a) * 1.0
    const reach = 38 + 62 * rnd(seed, 320 + c)
    const dir = { x: Math.cos(a), y: Math.sin(a) }
    // Start on the collar's outline.
    const sx = Math.max(-(ARENA.slot.w - ARENA.slot.h) / 2, Math.min((ARENA.slot.w - ARENA.slot.h) / 2, ex))
    const r = ARENA.slot.h / 2 + SLOT_RIM + 1
    const start = { x: ARENA.slot.x + sx + dir.x * r, y: ARENA.slot.y + dir.y * r }
    const line: Pt[] = [start]
    let heading = a
    const steps = 5
    for (let k = 1; k <= steps; k++) {
      heading += (rnd(seed, 340 + c, k) - 0.5) * 1.1
      const last = line[line.length - 1]!
      line.push({ x: last.x + Math.cos(heading) * (reach / steps), y: last.y + Math.sin(heading) * (reach / steps) })
    }
    ribbon(line, 1.5, c / count)
    if (rnd(seed, 360 + c) > 0.45) {
      const from = line[2]!
      const turn = heading + (rnd(seed, 380 + c) > 0.5 ? 0.9 : -0.9)
      ribbon([from, { x: from.x + Math.cos(turn) * reach * 0.3, y: from.y + Math.sin(turn) * reach * 0.3 }, { x: from.x + Math.cos(turn + 0.4) * reach * 0.5, y: from.y + Math.sin(turn + 0.4) * reach * 0.5 }], 0.9, c / count)
    }
  }
  return { geometry: geometryOf(b), grow: new Float32Array(grow) }
}

export interface Ground { object: THREE.Group; wounds: Wounds; pose(time: number): void; dispose(): void }

export function makeGround(seed: number): Ground {
  const m = materials()
  const root = new THREE.Group()
  root.name = 'arena-ground'
  const wounds = makeWounds()
  const s = slabs()
  const topStuff = woundedCeramic(wounds)
  const top = new THREE.Mesh(s.tops, topStuff)
  top.receiveShadow = true
  top.castShadow = false
  top.frustumCulled = false
  const wallStuff = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  const walls = new THREE.Mesh(s.walls, wallStuff)
  const bed = new THREE.Mesh(s.bed, wallStuff)
  walls.frustumCulled = false
  bed.frustumCulled = false
  const sl = slot()
  const collarStuff = m.rubber.clone()
  collarStuff.onBeforeCompile = m.rubber.onBeforeCompile
  collarStuff.customProgramCacheKey = m.rubber.customProgramCacheKey
  collarStuff.color.setRGB(0.3, 0.3, 0.31)
  collarStuff.roughness = 0.7
  const collar = new THREE.Mesh(sl.collar, collarStuff)
  collar.castShadow = true
  collar.receiveShadow = true
  const pitStuff = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.004, 0.004, 0.005), toneMapped: false })
  const pit = new THREE.Mesh(sl.pit, pitStuff)
  const whole = new THREE.Group()
  whole.add(top, walls, bed, collar, pit)
  root.add(whole)

  // The lids of the seams: ceramic that still covers a seam, drawn back as the seam opens.
  const lidSlabs: { slab: Slab; top: Pt[]; from: number }[] = []
  let sides = 0
  for (const slab of SLABS) {
    lidSlabs.push({ slab, top: inset(slab, ARENA.seamHalf + ARENA.chamfer), from: sides })
    sides += slab.open.filter(Boolean).length
  }
  const lidPos = new Float32Array(sides * 18)
  const lidGeo = new THREE.BufferGeometry()
  const lidAt = new THREE.BufferAttribute(lidPos, 3)
  lidAt.setUsage(THREE.DynamicDrawUsage)
  lidGeo.setAttribute('position', lidAt)
  const lidNor = new Float32Array(sides * 18)
  for (let i = 2; i < lidNor.length; i += 3) lidNor[i] = 1
  lidGeo.setAttribute('normal', new THREE.BufferAttribute(lidNor, 3))
  const lidUv = new THREE.BufferAttribute(new Float32Array(sides * 12), 2)
  lidUv.setUsage(THREE.DynamicDrawUsage)
  lidGeo.setAttribute('uv', lidUv)
  const lids = new THREE.Mesh(lidGeo, m.ceramic)
  lids.receiveShadow = true
  lids.frustumCulled = false
  whole.add(lids)

  const crackStuff = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.016, 0.014, 0.013), toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })
  // The cracks over the whole page, while its own ground still lies there.
  let points = 0
  for (const seam of SEAMS) points += seam.points.length - 1
  const crackPos = new Float32Array(points * 18)
  const crackGeo = new THREE.BufferGeometry()
  const crackAt = new THREE.BufferAttribute(crackPos, 3)
  crackAt.setUsage(THREE.DynamicDrawUsage)
  crackGeo.setAttribute('position', crackAt)
  const cracks = new THREE.Mesh(crackGeo, crackStuff)
  cracks.frustumCulled = false
  cracks.position.z = 0.2
  root.add(cracks)

  const sc = slotCracks(seed)
  const scRest = Float32Array.from(sc.geometry.getAttribute('position').array as ArrayLike<number>)
  const hair = new THREE.Mesh(sc.geometry, crackStuff)
  hair.frustumCulled = false
  hair.position.z = 0.25
  root.add(hair)

  const reached = new Map<string, number[]>()
  for (const seam of SEAMS) reached.set(seam.id, seam.points.map((_, i) => crackTime(seam.id, i)))
  const lidShut = 1.7 / (ARENA.seamHalf + ARENA.chamfer)
  let lidsDone = false

  const pose = (time: number): void => {
    const on = time >= 0
    const split = time >= ARENA.clearAt
    whole.visible = split
    cracks.visible = on && !split
    hair.visible = on
    if (!on) return
    wounds.time.value = time
    const level = seamLight(time)
    wallStuff.color.setScalar(level)
    wounds.seam.value = level * Math.max(0, Math.min(1, (time - ARENA.splitAt) / (ARENA.splitTo - ARENA.splitAt)))
    if (cracks.visible) {
      let k = 0
      for (const seam of SEAMS) {
        const at = reached.get(seam.id)!
        const p = seam.points
        for (let i = 0; i < p.length - 1; i++) {
          const a = p[i]!, b = p[i + 1]!
          const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
          const nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l
          const ha = crackHalf(time, at[i]!), hb = crackHalf(time, at[i + 1]!)
          const q = [a.x + nx * ha, a.y + ny * ha, a.x - nx * ha, a.y - ny * ha, b.x - nx * hb, b.y - ny * hb, a.x + nx * ha, a.y + ny * ha, b.x - nx * hb, b.y - ny * hb, b.x + nx * hb, b.y + ny * hb]
          for (let v = 0; v < 6; v++) {
            crackPos[k++] = wx(q[v * 2]!)
            crackPos[k++] = wy(q[v * 2 + 1]!)
            crackPos[k++] = 0
          }
        }
      }
      crackAt.needsUpdate = true
    }
    // The socket's own cracks shoot out in the first tenth of a second.
    const hairAt = hair.geometry.getAttribute('position') as THREE.BufferAttribute
    if (time < 0.3 || !hair.userData.full) {
      const full = time >= 0.3
      const arr = hairAt.array as Float32Array
      const cx = wx(ARENA.slot.x), cy = wy(ARENA.slot.y)
      for (let i = 0; i < hairAt.count; i++) {
        const g = full ? 1 : Math.max(0, Math.min(1, (time - sc.grow[i]! * 0.06) / 0.12))
        arr[i * 3] = cx + (scRest[i * 3]! - cx) * (0.6 + 0.4 * g)
        arr[i * 3 + 1] = cy + (scRest[i * 3 + 1]! - cy) * (0.6 + 0.4 * g)
        arr[i * 3 + 2] = g > 0 ? 0 : -5
      }
      hairAt.needsUpdate = true
      hair.userData.full = full
    }
    if (!split) return
    const open = time < ARENA.splitTo + 0.4
    lids.visible = open
    if (!open) {
      lidsDone = true
      return
    }
    lidsDone = false
    let k = 0
    let u = 0
    const uvs = lidUv.array as Float32Array
    for (const entry of lidSlabs) {
      const o = entry.slab.outline
      const n = o.length
      const inner = (i: number): [number, number] => {
        const ref = entry.slab.at[i]
        const r = ref ? reached.get(ref.seam)![ref.index]! : 0
        const f = Math.max(lidShut, seamOpen(time, r))
        const c = o[i]!, t = entry.top[i]!
        return [c.x + (t.x - c.x) * Math.min(1, f), c.y + (t.y - c.y) * Math.min(1, f)]
      }
      for (let i = 0; i < n; i++) {
        if (!entry.slab.open[i]) continue
        const j = (i + 1) % n
        const a = inner(i), b = inner(j)
        const ta = entry.top[i]!, tb = entry.top[j]!
        const q = [a[0], a[1], tb.x, tb.y, b[0], b[1], a[0], a[1], ta.x, ta.y, tb.x, tb.y]
        for (let v = 0; v < 6; v++) {
          const X = wx(q[v * 2]!), Y = wy(q[v * 2 + 1]!)
          lidPos[k++] = X
          lidPos[k++] = Y
          lidPos[k++] = 0
          uvs[u++] = X
          uvs[u++] = Y
        }
      }
    }
    lidAt.needsUpdate = true
    lidUv.needsUpdate = true
  }
  void lidsDone

  return {
    object: root, wounds, pose,
    dispose(): void {
      for (const g of [s.tops, s.walls, s.bed, sl.collar, sl.pit, lidGeo, crackGeo, sc.geometry]) g.dispose()
      for (const x of [topStuff, wallStuff, collarStuff, pitStuff, crackStuff]) x.dispose()
      wounds.texture.dispose()
      wounds.spill.dispose()
    }
  }
}
