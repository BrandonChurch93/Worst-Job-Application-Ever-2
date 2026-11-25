import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import type { PartMaker, RealContext } from '../../../real/types'
import { materials } from '../../../shell/materials'
import type { Shape } from '../../../stage/types'
import { PAPER, SLOT } from '../layout'
import { INK, stock } from './paperStock'
import { CASSETTE as C, HOOD, chuteAngle, chuteOf, chuteReach, hoodUnder, openOf, panelsOf, riseOf, smooth } from './shredderShape'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

let steelMade: THREE.MeshPhysicalMaterial | null = null
let shadeMade: THREE.MeshPhysicalMaterial | null = null

// Hardened tool steel: darker and bluer than the housing's aluminium, ground rather than brushed.
function steel(): THREE.MeshPhysicalMaterial {
  steelMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xb9bdc4), roughness: 0.24, metalness: 1 }))
  return steelMade
}

// The cutters are ground tool steel: darker and duller than the polished shafts, so a row of them reads as one roller.
let cutterMade: THREE.MeshPhysicalMaterial | null = null
function cutterSteel(): THREE.MeshPhysicalMaterial {
  cutterMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xa2a6ad), roughness: 0.32, metalness: 1 }))
  return cutterMade
}

let brushedMade: THREE.MeshPhysicalMaterial | null = null
let brushMap: THREE.DataTexture | null = null

// Fine lines along x, as a roughness picture: the brushing of the housing's faces.
function brushing(): THREE.DataTexture {
  if (brushMap) return brushMap
  const w = 256
  const h = 256
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const line = hash01(y, 1, config.seed + 77)
    const band = hash01(Math.floor(y / 7), 2, config.seed + 77)
    for (let x = 0; x < w; x++) {
      const fleck = hash01(x >> 3, y, config.seed + 79)
      const v = 0.62 + 0.3 * line + 0.1 * band + (fleck - 0.5) * 0.08
      const i = (y * w + x) * 4
      data[i] = 255
      data[i + 1] = Math.round(Math.min(1, Math.max(0, v)) * 255)
      data[i + 2] = 255
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.repeat.set(1 / 96, 1 / 40)
  tex.needsUpdate = true
  brushMap = tex
  return tex
}

// The housing's aluminium, brushed along its length: the shared metal's colour, with the light drawn out across the brushing.
function brushed(): THREE.MeshPhysicalMaterial {
  brushedMade ??= studio(new THREE.MeshPhysicalMaterial({ color: materials().aluminium.color, roughness: 0.5, metalness: 1, roughnessMap: brushing(), anisotropy: 0.75, anisotropyRotation: 0 }))
  return brushedMade
}

// The inside of the cassette under the rollers: anodised dark, so the machine is lit from above and dark below.
function shade(): THREE.MeshPhysicalMaterial {
  shadeMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1f1e1d), roughness: 0.6, metalness: 0, specularIntensity: 0.4 }))
  return shadeMade
}

// Joins plain triangle lists into one, so one material is one draw call.
function merge(parts: THREE.BufferGeometry[], withUv = false): THREE.BufferGeometry {
  const plain = parts.map((g) => (g.getIndex() ? g.toNonIndexed() : g))
  let count = 0
  for (const g of plain) count += g.getAttribute('position').count
  const pos = new Float32Array(count * 3)
  const nor = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)
  let v = 0
  for (const g of plain) {
    pos.set(g.getAttribute('position').array as Float32Array, v * 3)
    nor.set(g.getAttribute('normal').array as Float32Array, v * 3)
    const u = g.getAttribute('uv')
    if (withUv && u) uv.set(u.array as Float32Array, v * 2)
    v += g.getAttribute('position').count
  }
  for (const g of [...parts, ...plain]) g.dispose()
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  if (withUv) out.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return out
}

// A machined block: flat faces, and a chamfer round the top that catches one crisp line of light. Local x east, y north, z up.
function block(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: number): THREE.BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const quad = (a: number[], b: number[], d: number[], e: number[]): void => {
    for (const p of [a, b, d, a, d, e]) {
      pos.push(p[0]!, p[1]!, p[2]!)
      uv.push(p[0]!, p[1]! + p[2]!)
    }
  }
  const zc = z1 - c
  const lo = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]
  const mid = [[x0, y0, zc], [x1, y0, zc], [x1, y1, zc], [x0, y1, zc]]
  const top = [[x0 + c, y0 + c, z1], [x1 - c, y0 + c, z1], [x1 - c, y1 - c, z1], [x0 + c, y1 - c, z1]]
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    quad(lo[i]!, lo[j]!, mid[j]!, mid[i]!)
    quad(mid[i]!, mid[j]!, top[j]!, top[i]!)
  }
  quad(top[0]!, top[1]!, top[2]!, top[3]!)
  quad(lo[3]!, lo[2]!, lo[1]!, lo[0]!)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

// A strip of sheet metal along x with the given run across it: the outer face smooth, the cut ends flat.
// Its thickness lies under the run, so the face that is seen is the one the light reaches first.
function sheetMetal(x0: number, x1: number, run: [number, number][], thick: number): THREE.BufferGeometry {
  const n = run.length
  const ny = new Float32Array(n)
  const nz = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const a = run[Math.max(0, i - 1)]!
    const b = run[Math.min(n - 1, i + 1)]!
    const ty = b[0] - a[0]
    const tz = b[1] - a[1]
    const l = Math.hypot(ty, tz) || 1
    ny[i] = -tz / l
    nz[i] = ty / l
  }
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  let at = 0
  const tri = (p: number[][], q: number[][]): void => {
    for (let i = 0; i < 3; i++) {
      pos.push(p[i]![0]!, p[i]![1]!, p[i]![2]!)
      nor.push(q[i]![0]!, q[i]![1]!, q[i]![2]!)
      uv.push(p[i]![0]!, p[i]![3] ?? 0)
    }
  }
  const quad = (a: number[], b: number[], c: number[], d: number[], na: number[], nb: number[]): void => {
    tri([a, b, c], [na, na, nb])
    tri([a, c, d], [na, nb, nb])
  }
  for (let i = 0; i + 1 < n; i++) {
    const [y0, z0] = run[i]!
    const [y1, z1] = run[i + 1]!
    const next = at + Math.hypot(y1 - y0, z1 - z0)
    const n0 = [0, ny[i]!, nz[i]!]
    const n1 = [0, ny[i + 1]!, nz[i + 1]!]
    const i0 = [y0 - ny[i]! * thick, z0 - nz[i]! * thick]
    const i1 = [y1 - ny[i + 1]! * thick, z1 - nz[i + 1]! * thick]
    quad([x0, y0, z0, at], [x1, y0, z0, at], [x1, y1, z1, next], [x0, y1, z1, next], n0, n1)
    quad([x1, i0[0]!, i0[1]!, at], [x0, i0[0]!, i0[1]!, at], [x0, i1[0]!, i1[1]!, next], [x1, i1[0]!, i1[1]!, next], [0, -n0[1]!, -n0[2]!], [0, -n1[1]!, -n1[2]!])
    quad([x1, y0, z0, at], [x1, i0[0]!, i0[1]!, at], [x1, i1[0]!, i1[1]!, next], [x1, y1, z1, next], [1, 0, 0], [1, 0, 0])
    quad([x0, i0[0]!, i0[1]!, at], [x0, y0, z0, at], [x0, y1, z1, next], [x0, i1[0]!, i1[1]!, next], [-1, 0, 0], [-1, 0, 0])
    at = next
  }
  for (const [i, sign] of [[0, -1], [n - 1, 1]] as [number, number][]) {
    const j = i === 0 ? 1 : n - 2
    const ty = (run[i]![0] - run[j]![0])
    const tz = (run[i]![1] - run[j]![1])
    const l = Math.hypot(ty, tz) || 1
    const e = [0, ty / l, tz / l]
    const o = [run[i]![0], run[i]![1]]
    const u = [o[0]! - ny[i]! * thick, o[1]! - nz[i]! * thick]
    if (sign > 0) quad([x0, o[0]!, o[1]!, at], [x1, o[0]!, o[1]!, at], [x1, u[0]!, u[1]!, at], [x0, u[0]!, u[1]!, at], e, e)
    else quad([x1, o[0]!, o[1]!, 0], [x0, o[0]!, o[1]!, 0], [x0, u[0]!, u[1]!, 0], [x1, u[0]!, u[1]!, 0], e, e)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return g
}

// A run round the hood's circle from one angle to another, about a centre at (cy, cz), with a rolled lip at its far end.
function arcRun(cy: number, cz: number, r: number, from: number, to: number, lip: number): [number, number][] {
  const run: [number, number][] = []
  const steps = Math.max(4, Math.ceil(Math.abs(to - from) / 0.045))
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps
    run.push([cy - r * Math.sin(a), cz + r * Math.cos(a)])
  }
  if (lip > 0) {
    const ky = cy - (r + lip) * Math.sin(to)
    const kz = cz + (r + lip) * Math.cos(to)
    for (let i = 1; i <= 9; i++) {
      const a = to + Math.PI - (i / 9) * 2.5
      run.push([ky - lip * Math.sin(a), kz + lip * Math.cos(a)])
    }
  }
  return run
}

// A rod along x.
function rod(x0: number, x1: number, r: number, segments: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, x1 - x0, segments, 1, false)
  g.rotateZ(Math.PI / 2)
  g.translate((x0 + x1) / 2, 0, 0)
  return g.toNonIndexed()
}

// One roller: a shaft with hooked cutting discs along it, each turned an eighth of a tooth from the last, as cutters are stacked, so the turning shows as one slow spiral.
function rollerGeometry(): THREE.BufferGeometry {
  const r = C.roller
  const pos: number[] = []
  const nor: number[] = []
  const per = 5
  const n = r.teeth * per
  const oy = new Float32Array(n)
  const oz = new Float32Array(n)
  const span = (Math.PI * 2) / r.teeth
  const h = r.r - r.root
  const tooth: [number, number][] = [[0, 0], [0.3, 0.3], [0.58, 0.68], [0.82, 1], [0.88, 0.12]]
  const inner = C.half - C.cheek
  const first = -inner + 5
  const count = Math.floor((inner * 2 - 10 - 3) / r.pitch) + 1
  for (let k = 0; k < count; k++) {
    const x0 = first + k * r.pitch - r.disc / 2
    const x1 = x0 + r.disc
    const phase = k * 0.125 * span
    for (let t = 0; t < r.teeth; t++) {
      tooth.forEach(([at, up], i) => {
        const a = phase + (t + at) * span
        const rad = r.root + h * up
        oy[t * per + i] = Math.cos(a) * rad
        oz[t * per + i] = Math.sin(a) * rad
      })
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const dy = oy[j]! - oy[i]!
      const dz = oz[j]! - oz[i]!
      const l = Math.hypot(dy, dz) || 1
      pos.push(x0, oy[i]!, oz[i]!, x1, oy[i]!, oz[i]!, x1, oy[j]!, oz[j]!, x0, oy[i]!, oz[i]!, x1, oy[j]!, oz[j]!, x0, oy[j]!, oz[j]!)
      for (let q = 0; q < 6; q++) nor.push(0, dz / l, -dy / l)
      pos.push(x1, 0, 0, x1, oy[i]!, oz[i]!, x1, oy[j]!, oz[j]!)
      for (let q = 0; q < 3; q++) nor.push(1, 0, 0)
      pos.push(x0, 0, 0, x0, oy[j]!, oz[j]!, x0, oy[i]!, oz[i]!)
      for (let q = 0; q < 3; q++) nor.push(-1, 0, 0)
    }
  }
  const discs = new THREE.BufferGeometry()
  discs.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  discs.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  const shaft = rod(-inner, inner, r.hub, 14)
  shaft.deleteAttribute('uv')
  return merge([discs, shaft])
}

// Four socket screws seen from above: a low head with a rolled edge, and the dark hexagon in it.
function screws(at: [number, number][], z: number): { heads: THREE.BufferGeometry; sockets: THREE.BufferGeometry } {
  const heads: THREE.BufferGeometry[] = []
  const sockets: THREE.BufferGeometry[] = []
  for (const [x, y] of at) {
    const head = new THREE.LatheGeometry([new THREE.Vector2(0, 0.9), new THREE.Vector2(1.9, 0.9), new THREE.Vector2(2.35, 0.6), new THREE.Vector2(2.5, 0)], 20)
    head.rotateX(Math.PI / 2)
    head.translate(x, y, z)
    const plain = head.toNonIndexed()
    plain.deleteAttribute('uv')
    heads.push(plain)
    const hex = new THREE.CircleGeometry(1.25, 6)
    hex.rotateZ(hash01(Math.round(x), Math.round(y), config.seed + 5) * Math.PI)
    hex.translate(x, y, z + 0.93)
    const flat = hex.toNonIndexed()
    flat.deleteAttribute('uv')
    sockets.push(flat)
  }
  return { heads: merge(heads), sockets: merge(sockets) }
}

const PANEL = { thick: 3.6, lift: 0.3, clear: 1 }
const SEAT = 1.1

interface Cassette {
  lift: THREE.Group
  north: THREE.Group
  south: THREE.Group
  chute: THREE.Group
  reach: THREE.Mesh
  panelN: THREE.Mesh
  panelS: THREE.Mesh
  seat: THREE.Mesh
  geometries: THREE.BufferGeometry[]
}

function strip(g: THREE.BufferGeometry): THREE.BufferGeometry {
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  return g
}

function makeCassette(): THREE.Group {
  const m = materials()
  const root = new THREE.Group()
  const lift = new THREE.Group()
  root.add(lift)
  const inner = C.half - C.cheek
  const geometries: THREE.BufferGeometry[] = []
  const add = (parent: THREE.Object3D, g: THREE.BufferGeometry, material: THREE.Material, cast = true): THREE.Mesh => {
    const mesh = new THREE.Mesh(g, material)
    mesh.castShadow = cast
    mesh.receiveShadow = true
    parent.add(mesh)
    geometries.push(g)
    return mesh
  }
  const body = merge([
    block(-C.half, -inner, -C.deep, C.deep, -C.sink, C.top, 1.1),
    block(inner, C.half, -C.deep, C.deep, -C.sink, C.top, 1.1),
    block(-inner, inner, C.deep - C.wall, C.deep, -C.sink, C.top - 6.5, 0.5),
    block(-inner, inner, -C.deep, -C.deep + C.wall, -C.sink, C.chute.z - 0.6, 0.5)
  ], true)
  add(lift, body, brushed())
  const hard = screws(
    [
      [-C.half + C.cheek / 2, C.deep - 5.2],
      [-C.half + C.cheek / 2, -C.deep + 5.2],
      [C.half - C.cheek / 2, C.deep - 5.2],
      [C.half - C.cheek / 2, -C.deep + 5.2]
    ],
    C.top
  )
  const pin = rod(-inner, inner, 1.15, 10)
  pin.deleteAttribute('uv')
  pin.translate(0, -C.deep, C.chute.z)
  add(lift, merge([hard.heads, pin]), steel())
  add(lift, merge([hard.sockets, strip(block(-inner, inner, -C.deep + C.wall, C.deep - C.wall, C.floor - 2, C.floor, 0.01))]), shade(), false)

  const roller = rollerGeometry()
  geometries.push(roller)
  const north = new THREE.Group()
  const south = new THREE.Group()
  north.position.set(0, -C.roller.north, C.roller.z)
  south.position.set(C.roller.pitch / 2, -C.roller.south, C.roller.z)
  const a = new THREE.Mesh(roller, cutterSteel())
  const b = new THREE.Mesh(roller, cutterSteel())
  b.rotation.z = Math.PI
  for (const r of [a, b]) {
    r.castShadow = true
    r.receiveShadow = true
  }
  north.add(a)
  south.add(b)
  lift.add(north, south)

  const chute = new THREE.Group()
  chute.position.set(0, -C.deep, C.chute.z)
  lift.add(chute)
  add(chute, sheetMetal(-inner + 0.6, inner - 0.6, arcRun(HOOD.cy, HOOD.cz, HOOD.r, HOOD.from, HOOD.to, 0), C.chute.thick), brushed())
  const slide = new THREE.Group()
  slide.position.set(0, HOOD.cy, HOOD.cz)
  chute.add(slide)
  const reach = add(slide, sheetMetal(-inner + 4, inner - 4, arcRun(0, 0, HOOD.r - C.chute.thick - 0.35, HOOD.to - HOOD.more - 0.08, HOOD.to + 0.02, 1.25), C.chute.thick), brushed())

  // The two panels that close the slot. They are the page's own ceramic, so shut they are two tiles with a seam.
  // Open, they have come up out of the slot and lie on the page either side of it, their thickness showing.
  const panel = (y0: number, y1: number): THREE.Mesh => {
    const tile = add(root, block(-SLOT.w / 2, SLOT.w / 2, y0, y1, -0.2 - PANEL.thick, -0.2, 0.5), m.ceramic, true)
    // The dark line a tile lying on the page has round its foot.
    add(tile, strip(block(-SLOT.w / 2 - SEAT, SLOT.w / 2 + SEAT, y0 - SEAT, y1 + SEAT, -0.2 - PANEL.thick - 0.2, -0.2 - PANEL.thick + 0.25, 0.01)), shade(), false)
    return tile
  }
  const panelN = panel(0, SLOT.h / 2)
  const panelS = panel(-SLOT.h / 2, 0)
  // The cutout the cassette stands in: the dark of the opening round it, a hair wider than the slot.
  const seat = add(root, strip(block(-SLOT.w / 2 - SEAT, SLOT.w / 2 + SEAT, -SLOT.h / 2 - SEAT, SLOT.h / 2 + SEAT, -0.4, 0.07, 0.01)), shade(), false)
  const rig: Cassette = { lift, north, south, chute, reach, panelN, panelS, seat, geometries }
  root.userData.rig = rig
  return root
}

function poseCassette(o: THREE.Object3D, s: Shape, ctx: RealContext): void {
  const rig = o.userData.rig as Cassette
  o.position.set(SLOT.cx - 960, 540 - SLOT.cy, 0)
  o.rotation.set(0, 0, 0)
  const open = openOf(s)
  const rise = riseOf(open)
  const p = panelsOf(open)
  rig.lift.position.z = -C.sink * (1 - rise)
  rig.lift.visible = p > 0.5
  rig.seat.visible = rig.lift.visible
  const turn = s.v && s.v.length > 1 ? s.v[1]! : ctx.time * 9
  rig.north.rotation.x = turn
  rig.south.rotation.x = -turn
  const c = chuteOf(open)
  rig.chute.rotation.x = chuteAngle(c)
  rig.reach.rotation.x = chuteReach(c) / HOOD.r
  const up = (PANEL.thick + 0.5) * smooth(p / PANEL.lift)
  const slide = (SLOT.h / 2 + PANEL.clear) * smooth((p - PANEL.lift * 0.7) / (1 - PANEL.lift * 0.7))
  rig.panelN.position.set(0, slide, up)
  rig.panelS.position.set(0, -slide, up)
}

const SEG = 26
const MAX = 16
const RIBBON = 7.6

interface Strips { geometry: THREE.BufferGeometry; was: string }

const face = new Float32Array(SEG * 3)
// What a strip keeps of a rule of the sheet: a tick paler than the rule, as the cut edge frays it.
const RULE = INK.bar.clone().lerp(INK.paper, 0.35)

function makeStrips(): THREE.Group {
  const g = new THREE.BufferGeometry()
  const verts = MAX * SEG * 4
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
  const index: number[] = []
  for (let q = 0; q < MAX * SEG; q++) index.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3)
  g.setIndex(index)
  g.setDrawRange(0, 0)
  const mesh = new THREE.Mesh(g, stock(PAPER.w, PAPER.h).strip)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  const group = new THREE.Group()
  group.add(mesh)
  group.userData.strips = { geometry: g, was: '' } satisfies Strips
  return group
}

const isStrip = (s: Shape): boolean => s.id.startsWith('strip-')

// Where the hood's underside is over a point south of the cassette, so a strip still under it stays under it.
const ceiling = (y: number): number => hoodUnder(y - SLOT.cy - C.deep) - 0.6

function poseStrips(o: THREE.Object3D, ctx: RealContext): void {
  const rig = o.userData.strips as Strips
  o.position.set(0, 0, 0)
  o.rotation.set(0, 0, 0)
  const list = ctx.list.filter(isStrip).slice(0, MAX)
  const was = list.map((s) => `${s.id}:${s.x.toFixed(2)}:${s.y.toFixed(2)}:${s.h.toFixed(2)}:${s.z0.toFixed(2)}:${(s.rot ?? 0).toFixed(3)}:${s.tone}:${s.v ? s.v.map((n) => n.toFixed(3)).join('/') : ''}`).join(';')
  if (was === rig.was) return
  rig.was = was
  const g = rig.geometry
  const pos = (g.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
  const nor = (g.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array
  const col = (g.getAttribute('color') as THREE.BufferAttribute).array as Float32Array
  const seed = config.seed + 311
  let k = 0
  const put = (x: number, y: number, z: number, nx: number, ny: number, nz: number, c: THREE.Color): void => {
    let py = y
    let pz = z
    if (Math.abs(x - SLOT.cx) < C.half) {
      const top = ceiling(py)
      if (pz > top) pz = Math.max(0.5, top)
      if (py < SLOT.cy + C.deep + 1) {
        py = SLOT.cy + C.deep + 1
        pz = Math.min(pz, 6)
      }
    }
    pos[k * 3] = x - 960
    pos[k * 3 + 1] = 540 - py
    pos[k * 3 + 2] = pz
    nor[k * 3] = nx
    nor[k * 3 + 1] = -ny
    nor[k * 3 + 2] = nz
    col[k * 3] = c.r
    col[k * 3 + 1] = c.g
    col[k * 3 + 2] = c.b
    k++
  }
  for (const s of list) {
    const n = Number(s.id.slice(6)) || 0
    const len = s.h
    if (len < 1) continue
    const ink = s.v && s.v.length > 1 ? s.v[1]! > 0.5 : s.tone === 'dark'
    const rot = s.rot ?? 0
    const ax = -Math.sin(rot)
    const ay = Math.cos(rot)
    const wx = Math.cos(rot)
    const wy = Math.sin(rot)
    const cx = s.x + s.w / 2
    const cy = s.y + s.h / 2
    const curl = (0.016 + 0.03 * hash01(n, 1, seed)) * (hash01(n, 2, seed) < 0.25 ? -0.5 : 1)
    const twist = (hash01(n, 3, seed) - 0.5) * 1.5
    const off = hash01(n, 4, seed) * 24
    const sway = len * (0.02 + 0.05 * hash01(n, 5, seed))
    const waves = 0.8 + 1.4 * hash01(n, 6, seed)
    const phase = hash01(n, 7, seed) * 2
    const sag = curl < 0 ? (1 - Math.cos(curl * len * 0.5)) / -curl : 0
    // A strip leaves the hood at the hood's height and its free end comes to rest on the page, so its shadow meets it there.
    const high = Math.max(0, s.z0 - 1.2)
    const ring = (t: number, o: number[]): void => {
      const d = (t - 0.5) * len
      const along = Math.sin(curl * d) / curl
      const up = (1 - Math.cos(curl * d)) / curl + sag
      const ta = Math.cos(curl * d)
      const tu = Math.sin(curl * d)
      const roll = twist * (t - 0.5)
      const cr = Math.cos(roll)
      const sr = Math.sin(roll)
      // Across the ribbon: the flat width turned about the ribbon's own run.
      const ux = wx * cr + ax * -tu * sr
      const uy = wy * cr + ay * -tu * sr
      const uz = ta * sr
      const side = sway * Math.sin(Math.PI * (t * waves + phase))
      const mx = cx + ax * along + wx * side
      const my = cy + ay * along + wy * side
      const mz = s.z0 - high * 0.92 * smooth(t * 1.25) + 0.4 + up + Math.abs(uz) * RIBBON * 0.5
      o[0] = mx - ux * RIBBON * 0.5
      o[1] = my - uy * RIBBON * 0.5
      o[2] = mz - uz * RIBBON * 0.5
      o[3] = mx + ux * RIBBON * 0.5
      o[4] = my + uy * RIBBON * 0.5
      o[5] = mz + uz * RIBBON * 0.5
      const tx = ax * ta
      const ty = ay * ta
      const tz = tu
      o[6] = uy * tz - uz * ty
      o[7] = uz * tx - ux * tz
      o[8] = ux * ty - uy * tx
      if (o[8]! < 0) {
        o[6] = -o[6]!
        o[7] = -o[7]!
        o[8] = -o[8]!
      }
    }
    const a = new Array<number>(9).fill(0)
    const b = new Array<number>(9).fill(0)
    const first = k
    for (let i = 0; i < SEG; i++) {
      ring(i / SEG, a)
      ring((i + 1) / SEG, b)
      const d = (i + 0.5) * (len / SEG) + off
      const marked = ink ? (d % 11) < 6.2 && hash01(n, Math.floor(d / 11), seed + 9) < 0.7 : (d % 24) < Math.min(3.3, len / SEG)
      const c = marked ? (ink ? INK.title : RULE) : INK.paper
      put(a[0]!, a[1]!, a[2]!, 0, 0, 1, c)
      put(a[3]!, a[4]!, a[5]!, 0, 0, 1, c)
      put(b[0]!, b[1]!, b[2]!, 0, 0, 1, c)
      put(b[3]!, b[4]!, b[5]!, 0, 0, 1, c)
      // The face's own normal, from the points as they ended up, so both sides of the ribbon are lit as they lie.
      const o = (k - 4) * 3
      const e1x = pos[o + 3]! - pos[o]!
      const e1y = pos[o + 4]! - pos[o + 1]!
      const e1z = pos[o + 5]! - pos[o + 2]!
      const e2x = pos[o + 6]! - pos[o]!
      const e2y = pos[o + 7]! - pos[o + 1]!
      const e2z = pos[o + 8]! - pos[o + 2]!
      let fx = e1y * e2z - e1z * e2y
      let fy = e1z * e2x - e1x * e2z
      let fz = e1x * e2y - e1y * e2x
      const fl = Math.hypot(fx, fy, fz)
      if (fl < 1e-9) {
        fx = 0
        fy = 0
        fz = 1
      } else {
        fx /= fl
        fy /= fl
        fz /= fl
      }
      if (fz < 0) {
        // Turned over: the quad is wound the other way, so its lit side and its shadow side are the ones that face up.
        for (const at of [o, o + 6]) {
          for (let c = 0; c < 3; c++) {
            const keep = pos[at + c]!
            pos[at + c] = pos[at + 3 + c]!
            pos[at + 3 + c] = keep
          }
        }
        fx = -fx
        fy = -fy
        fz = -fz
      }
      for (let q = 0; q < 4; q++) {
        nor[o + q * 3] = fx
        nor[o + q * 3 + 1] = fy
        nor[o + q * 3 + 2] = fz
      }
    }
    // A ribbon of paper bends, it has no facets: each ring takes the mean of the two faces that meet on it.
    for (let i = 0; i < SEG; i++) face.set(nor.subarray((first + i * 4) * 3, (first + i * 4) * 3 + 3), i * 3)
    for (let i = 0; i < SEG; i++) {
      for (let end = 0; end < 2; end++) {
        const j = Math.min(SEG - 1, Math.max(0, i + (end === 0 ? -1 : 1)))
        const x = face[i * 3]! + face[j * 3]!
        const y = face[i * 3 + 1]! + face[j * 3 + 1]!
        const z = face[i * 3 + 2]! + face[j * 3 + 2]!
        const l = Math.hypot(x, y, z) || 1
        for (let q = 0; q < 2; q++) {
          const at = (first + i * 4 + end * 2 + q) * 3
          nor[at] = x / l
          nor[at + 1] = y / l
          nor[at + 2] = z / l
        }
      }
    }
  }
  g.setDrawRange(0, (k / 4) * 6)
  g.getAttribute('position').needsUpdate = true
  g.getAttribute('normal').needsUpdate = true
  g.getAttribute('color').needsUpdate = true
  g.computeBoundingSphere()
}

export const shredder: PartMaker = {
  key(s, ctx) {
    if (s.id === 'shredder-jaw-1') return 'cassette'
    if (s.id === 'shredder-jaw-0') return ''
    if (isStrip(s)) return ctx.list.find(isStrip) === s ? 'strips' : ''
    return null
  },
  make(s) {
    return isStrip(s) ? makeStrips() : makeCassette()
  },
  pose(o, s, ctx) {
    if (o.userData.strips) poseStrips(o, ctx)
    else if (o.userData.rig) poseCassette(o, s, ctx)
  },
  drop(o) {
    const strips = o.userData.strips as Strips | undefined
    if (strips) strips.geometry.dispose()
    const rig = o.userData.rig as Cassette | undefined
    if (rig) for (const g of rig.geometries) g.dispose()
  }
}
