import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { RealContext } from '../../../real/types'
import { studio } from '../../../post/studio'
import { BALL, table } from '../../layout'
import { lit } from '../light'
import { localBalls, localOf, shapesIn, type Zone } from '../zone'
import { LENS, type RGB } from './colours'
import { groupsOf } from './groups'

// The lamps as things: the lenses of the general lighting in their sockets, the globes, the bezels of the inserts and the plates under their labels.
const SIZE = { dome: 13, domeHigh: 6, ring: 20, screw: 3.1, window: [36, 22] as [number, number], globe: 21, core: 19 }
const STEEL: RGB = [0.74, 0.76, 0.79]
const BRASS: RGB = [0.83, 0.6, 0.27]
const SOCKET: RGB = [0.035, 0.035, 0.04]

const paint = (g: THREE.BufferGeometry, colour: (x: number, y: number, z: number) => RGB): THREE.BufferGeometry => {
  const flat = g.index ? g.toNonIndexed() : g
  flat.deleteAttribute('uv')
  const p = flat.getAttribute('position')
  const c = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const v = colour(p.getX(i), p.getY(i), p.getZ(i))
    c[i * 3] = v[0]
    c[i * 3 + 1] = v[1]
    c[i * 3 + 2] = v[2]
  }
  flat.setAttribute('color', new THREE.BufferAttribute(c, 3))
  return flat
}
const put = (g: THREE.BufferGeometry, x: number, y: number, z: number, turn = 0): THREE.BufferGeometry => {
  if (turn !== 0) g.rotateZ(turn)
  g.translate(x, y, z)
  return g
}
const lathe = (profile: [number, number][], segments: number): THREE.BufferGeometry => new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segments).rotateX(Math.PI / 2)

type Loop = [number, number][]
const roundedLoop = (w: number, h: number, r: number, steps = 3): Loop => {
  const out: Loop = []
  const corners: [number, number, number][] = [[w / 2 - r, -h / 2 + r, -Math.PI / 2], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI]]
  for (const c of corners) for (let i = 0; i <= steps; i++) out.push([c[0] + r * Math.cos(c[2] + (i / steps) * (Math.PI / 2)), c[1] + r * Math.sin(c[2] + (i / steps) * (Math.PI / 2))])
  return out
}
const stadiumLoop = (half: number, r: number, steps = 6): Loop => {
  const out: Loop = []
  for (let i = 0; i <= steps; i++) out.push([half + r * Math.cos(-Math.PI / 2 + (i / steps) * Math.PI), r * Math.sin(-Math.PI / 2 + (i / steps) * Math.PI)])
  for (let i = 0; i <= steps; i++) out.push([-half + r * Math.cos(Math.PI / 2 + (i / steps) * Math.PI), r * Math.sin(Math.PI / 2 + (i / steps) * Math.PI)])
  return out
}
class Solid {
  private readonly v: number[] = []
  band(a: Loop, za: number, b: Loop, zb: number): this {
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length
      this.v.push(a[i]![0], a[i]![1], za, a[j]![0], a[j]![1], za, b[j]![0], b[j]![1], zb, a[i]![0], a[i]![1], za, b[j]![0], b[j]![1], zb, b[i]![0], b[i]![1], zb)
    }
    return this
  }
  cap(a: Loop, z: number): this {
    for (let i = 1; i < a.length - 1; i++) this.v.push(a[0]![0], a[0]![1], z, a[i]![0], a[i]![1], z, a[i + 1]![0], a[i + 1]![1], z)
    return this
  }
  done(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.v), 3))
    g.computeVertexNormals()
    return g
  }
}
// A flat piece with a broken top edge: its top, the bevel and the side, and no underside, which nothing ever sees.
const tablet = (outer: Loop, top: Loop, z0: number, z1: number, bevel: number): THREE.BufferGeometry => new Solid().cap(top, z1).band(outer, z1 - bevel, top, z1).band(outer, z0, outer, z1 - bevel).done()

const k = (c: RGB, v: number): RGB => [c[0] * v, c[1] * v, c[2] * v]

// A domed lens: brightest in the middle, where its lamp stands under it.
function dome(colour: RGB): THREE.BufferGeometry {
  const r = (SIZE.dome * SIZE.dome + SIZE.domeHigh * SIZE.domeHigh) / (2 * SIZE.domeHigh)
  const g = new THREE.SphereGeometry(r, 18, 4, 0, Math.PI * 2, 0, Math.asin(SIZE.dome / r)).rotateX(Math.PI / 2).translate(0, 0, 2.4 + SIZE.domeHigh - r)
  return paint(g, (x, y) => {
    const q = Math.min(1, (x * x + y * y) / (SIZE.dome * SIZE.dome))
    return k(colour, LENS.rim + (LENS.on - LENS.rim) * Math.pow(1 - q, 1.6))
  })
}
function socket(metal: RGB): THREE.BufferGeometry[] {
  const ring = paint(lathe([[SIZE.ring, 0.3], [SIZE.ring, 2.4], [SIZE.ring - 1.4, 3.8], [SIZE.dome + 2.6, 3.8], [SIZE.dome + 0.4, 2.6]], 20), () => metal)
  const plate = paint(tablet(stadiumLoop(24, 8), stadiumLoop(24, 7.6), 0.3, 1.8, 0.4), () => k(metal, 0.82))
  return [ring, plate]
}
// A lens let into a lane, with the arrow of the way the ball travels raised on it.
function arrowLens(colour: RGB): THREE.BufferGeometry[] {
  const [w, h] = SIZE.window
  const lens = paint(tablet(roundedLoop(w - 5, h - 5, 4), roundedLoop(w - 6.2, h - 6.2, 3.4), 0.7, 2.7, 0.6), (x, y) => {
    const q = Math.min(1, (x * x) / ((w * w) / 4) + (y * y) / ((h * h) / 4))
    return k(colour, 0.5 + (LENS.window - 0.5) * Math.pow(1 - q, 1.4))
  })
  const a: Loop = [[10, 0], [1, 6.5], [1, 2.6], [-9, 2.6], [-9, -2.6], [1, -2.6], [1, -6.5]]
  const head: Loop = [[10, 0], [1, 6.5], [1, -6.5]]
  const tail: Loop = [[1, 2.6], [-9, 2.6], [-9, -2.6], [1, -2.6]]
  const arrow = paint(new Solid().cap(head, 3.4).cap(tail, 3.4).band(a, 2.7, a, 3.4).done(), () => k(colour, 0.1))
  return [lens, arrow]
}
function arrowBezel(metal: RGB): THREE.BufferGeometry[] {
  const [w, h] = SIZE.window
  const outer = roundedLoop(w, h, 6)
  const top = roundedLoop(w - 1, h - 1, 5.5)
  const inner = roundedLoop(w - 5, h - 5, 4)
  return [paint(new Solid().band(top, 3.2, inner, 3.2).band(outer, 2.7, top, 3.2).band(outer, 0.3, outer, 2.7).band(inner, 3.2, inner, 0.6).done(), () => metal)]
}
function globeStem(metal: RGB): THREE.BufferGeometry {
  return paint(lathe([[15, 0.3], [15, 2.2], [13.6, 3.2], [9, 3.4], [9, 6.2], [5.2, 7.4], [4.6, 24], [6.4, 26], [10.5, 29], [12.5, 33], [11, 33.4], [0, 33.4]], 18), () => metal)
}

export interface Lamps {
  group: THREE.Group
  lens: THREE.MeshStandardMaterial | null
  cores: THREE.InstancedMesh | null
  coreGroups: string[]
}

// The lens of every lamp shows its own colour as light, brightest where the vertex says, and stays a pale thing when its lamp is out.
function lensMaterial(z: Zone): THREE.MeshStandardMaterial {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.16, metalness: 0, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 0.6 })
  m.userData.lit = true
  lit(studio(m), z)
  const inner = m.onBeforeCompile
  m.onBeforeCompile = function (shader, renderer) {
    inner.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <color_fragment>', 'diffuseColor.rgb *= 0.05 + 0.09 * min( vColor.rgb / max( max( vColor.r, max( vColor.g, vColor.b ) ), 0.001 ), vec3( 1.0 ) );')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;')
  }
  const key = m.customProgramCacheKey
  m.customProgramCacheKey = () => `${key.call(m)}|wjl-lens`
  return m
}

export function buildLamps(z: Zone, ctx: RealContext): Lamps {
  const group = new THREE.Group()
  group.name = `table-lights.${z.id}`
  const out: Lamps = { group, lens: null, cores: null, coreGroups: [] }
  if (z.tier < 0) return out
  const groups = groupsOf(z)
  const colourOf = (name: string): RGB => groups.find((g) => g.name === name)?.colour ?? groups[0]!.colour
  const metal: RGB = z.id === 'corporate' ? BRASS : STEEL
  const lenses: THREE.BufferGeometry[] = []
  const metals: THREE.BufferGeometry[] = []
  const screws: [number, number, number][] = []
  for (const l of table.lamps) {
    if (l.tier !== z.tier) continue
    const p = localBalls(z, l.c[0], l.c[1])
    if (l.arrow) {
      const turn = Math.atan2(-l.arrow[1], l.arrow[0])
      for (const g of arrowLens(colourOf('general'))) lenses.push(put(g, p[0], p[1], 0, turn))
      for (const g of arrowBezel(STEEL)) metals.push(put(g, p[0], p[1], 0, turn))
    } else {
      lenses.push(put(dome(colourOf(groups.some((g) => g.name === 'lanes') ? 'lanes' : 'windows')), p[0], p[1], 0))
      for (const g of socket(metal)) metals.push(put(g, p[0], p[1], 0))
      screws.push([p[0] - 25.5, p[1], 1.8], [p[0] + 25.5, p[1], 1.8])
    }
  }
  for (const n of table.inserts) {
    if (n.tier !== z.tier) continue
    const p = localBalls(z, n.c[0], n.c[1])
    const r = n.r * BALL
    metals.push(put(paint(lathe([[r + 5.4, 0.4], [r + 5.4, 1.2], [r + 4.2, 2.1], [r + 1.6, 2.1], [r + 0.6, 1.5]], 48), () => metal), p[0], p[1], 0))
  }
  const globes = table.posts.filter((q) => q.tier === z.tier && q.lamp)
  for (const q of globes) {
    const p = localBalls(z, q.c[0], q.c[1])
    metals.push(put(globeStem(metal), p[0], p[1], 0))
  }
  const plates: THREE.BufferGeometry[] = []
  for (const s of shapesIn(ctx, 'table-lights', z)) {
    if (!s.id.startsWith('insert-plate.')) continue
    const p = localOf(z, s)
    plates.push(put(tablet(roundedLoop(s.w, s.h, 3.5), roundedLoop(s.w - 1, s.h - 1, 3), 0.5, 3.0, 0.5), p[0], p[1], 0))
    screws.push([p[0] - s.w / 2 + 5.5, p[1], 3.0], [p[0] + s.w / 2 - 5.5, p[1], 3.0])
  }
  if (lenses.length > 0) {
    out.lens = lensMaterial(z)
    const mesh = new THREE.Mesh(mergeGeometries(lenses), out.lens)
    mesh.name = 'lenses'
    mesh.userData.lightGroup = `${z.id}.general`
    mesh.receiveShadow = true
    group.add(mesh)
  }
  if (metals.length > 0) {
    const m = lit(studio(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 1, roughness: 0.3, envMapIntensity: 1 })), z)
    const mesh = new THREE.Mesh(mergeGeometries(metals), m)
    mesh.name = 'sockets'
    mesh.receiveShadow = true
    group.add(mesh)
  }
  if (plates.length > 0) {
    const m =
      z.id === 'corporate'
        ? new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.66, 0.34), metalness: 1, roughness: 0.36 })
        : z.id === 'office'
          ? new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.85, 0.79), metalness: 0, roughness: 0.85, clearcoat: 1, clearcoatRoughness: 0.07 })
          : new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.88, 0.87, 0.82), metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 })
    const mesh = new THREE.Mesh(mergeGeometries(plates), lit(studio(m), z))
    mesh.name = 'plates'
    mesh.receiveShadow = true
    group.add(mesh)
  }
  if (screws.length > 0) {
    const head = new THREE.SphereGeometry(SIZE.screw * 1.25, 8, 3, 0, Math.PI * 2, 0, Math.PI * 0.3).rotateX(Math.PI / 2).translate(0, 0, -SIZE.screw * 1.25 * Math.cos(Math.PI * 0.3))
    const m = lit(studio(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.7, 0.71, 0.73), metalness: 1, roughness: 0.24 })), z)
    const mesh = new THREE.InstancedMesh(head, m, screws.length)
    const at = new THREE.Matrix4()
    screws.forEach((s, i) => mesh.setMatrixAt(i, at.makeTranslation(s[0], s[1], s[2])))
    mesh.instanceMatrix.needsUpdate = true
    mesh.name = 'screws'
    mesh.userData.fine = true
    group.add(mesh)
  }
  if (globes.length > 0) {
    const lens = lensMaterial(z)
    lens.emissiveIntensity = 1
    lens.roughness = 0.35
    const white = colourOf('globe.left')
    const core = paint(new THREE.SphereGeometry(SIZE.core, 24, 14).rotateX(Math.PI / 2), (_x, _y, zz) => k(white, 0.78 + (LENS.on - 0.78) * Math.pow(0.5 - zz / (2 * SIZE.core), 1.5)))
    const cores = new THREE.InstancedMesh(core, lens, globes.length)
    const shell = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.globe, 24, 14).rotateX(Math.PI / 2),
      lit(studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.9, 0.92, 0.95), transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false })), z),
      globes.length
    )
    const at = new THREE.Matrix4()
    globes.forEach((q, i) => {
      const p = localBalls(z, q.c[0], q.c[1])
      at.makeTranslation(p[0], p[1], 49)
      cores.setMatrixAt(i, at)
      shell.setMatrixAt(i, at)
      cores.setColorAt(i, new THREE.Color(0, 0, 0))
      out.coreGroups.push(`${z.id}.${q.id.slice(q.id.indexOf('.') + 1)}`)
    })
    cores.instanceMatrix.needsUpdate = true
    shell.instanceMatrix.needsUpdate = true
    cores.name = 'globes'
    cores.userData.lightGroup = out.coreGroups[0]
    cores.userData.lightGroups = out.coreGroups
    shell.name = 'globe-glass'
    shell.userData.order = 5
    shell.renderOrder = 5
    group.add(cores, shell)
    out.cores = cores
  }
  return out
}
