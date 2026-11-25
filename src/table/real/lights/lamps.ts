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
const rounded = (w: number, h: number, r: number): THREE.Shape => {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}
const slab = (shape: THREE.Shape, z0: number, depth: number, bevel = 0): THREE.BufferGeometry =>
  new THREE.ExtrudeGeometry(shape, { depth: depth - bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, z0)

const k = (c: RGB, v: number): RGB => [c[0] * v, c[1] * v, c[2] * v]

// A domed lens: brightest in the middle, where its lamp stands under it.
function dome(colour: RGB): THREE.BufferGeometry {
  const r = (SIZE.dome * SIZE.dome + SIZE.domeHigh * SIZE.domeHigh) / (2 * SIZE.domeHigh)
  const g = new THREE.SphereGeometry(r, 24, 7, 0, Math.PI * 2, 0, Math.asin(SIZE.dome / r)).rotateX(Math.PI / 2).translate(0, 0, 2.4 + SIZE.domeHigh - r)
  return paint(g, (x, y) => {
    const q = Math.min(1, (x * x + y * y) / (SIZE.dome * SIZE.dome))
    return k(colour, LENS.rim + (LENS.on - LENS.rim) * Math.pow(1 - q, 1.6))
  })
}
function socket(metal: RGB): THREE.BufferGeometry[] {
  const ring = paint(lathe([[SIZE.ring, 0.3], [SIZE.ring, 2.4], [SIZE.ring - 1.4, 3.8], [SIZE.dome + 2.6, 3.8], [SIZE.dome + 0.4, 2.6], [SIZE.dome + 0.4, 0.5]], 28), () => metal)
  const flange = new THREE.Shape()
  flange.absarc(-24, 0, 8, Math.PI / 2, Math.PI * 1.5, false)
  flange.absarc(24, 0, 8, -Math.PI / 2, Math.PI / 2, false)
  const plate = paint(slab(flange, 0.3, 1.5, 0.3), () => k(metal, 0.82))
  const well = paint(new THREE.CircleGeometry(SIZE.dome + 0.4, 20).translate(0, 0, 0.9), () => SOCKET)
  return [ring, plate, well]
}
// A lens let into a lane, with the arrow of the way the ball travels raised on it.
function arrowLens(colour: RGB): THREE.BufferGeometry[] {
  const [w, h] = SIZE.window
  const lens = paint(slab(rounded(w - 5, h - 5, 4), 0.7, 2.0, 0.5), (x, y) => {
    const q = Math.min(1, (x * x) / ((w * w) / 4) + (y * y) / ((h * h) / 4))
    return k(colour, LENS.rim + 0.5 * (1 - q))
  })
  const a = new THREE.Shape()
  a.moveTo(10, 0)
  a.lineTo(1, 6.5)
  a.lineTo(1, 2.6)
  a.lineTo(-9, 2.6)
  a.lineTo(-9, -2.6)
  a.lineTo(1, -2.6)
  a.lineTo(1, -6.5)
  a.closePath()
  const arrow = paint(slab(a, 2.7, 0.7), () => k(colour, LENS.on))
  return [lens, arrow]
}
function arrowBezel(metal: RGB): THREE.BufferGeometry[] {
  const [w, h] = SIZE.window
  const frame = rounded(w, h, 6)
  frame.holes.push(rounded(w - 5, h - 5, 4))
  return [paint(slab(frame, 0.3, 2.9, 0.5), () => metal), paint(new THREE.PlaneGeometry(w - 5, h - 5).translate(0, 0, 0.6), () => SOCKET)]
}
function globeStem(metal: RGB): THREE.BufferGeometry {
  return paint(lathe([[0, 0.3], [15, 0.3], [15, 2.2], [13.6, 3.2], [9, 3.4], [9, 6.2], [5.2, 7.4], [4.6, 24], [6.4, 26], [10.5, 29], [12.5, 33], [11, 33.4], [0, 33.4]], 24), () => metal)
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
      .replace('#include <color_fragment>', 'diffuseColor.rgb *= 0.34 + 0.3 * min( vColor.rgb / max( max( vColor.r, max( vColor.g, vColor.b ) ), 0.001 ), vec3( 1.0 ) );')
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
      lenses.push(put(dome(colourOf(groups.some((g) => g.name === 'lanes') ? 'lanes' : 'general')), p[0], p[1], 0))
      for (const g of socket(metal)) metals.push(put(g, p[0], p[1], 0))
      screws.push([p[0] - 25.5, p[1], 1.8], [p[0] + 25.5, p[1], 1.8])
    }
  }
  for (const n of table.inserts) {
    if (n.tier !== z.tier) continue
    const p = localBalls(z, n.c[0], n.c[1])
    const r = n.r * BALL
    metals.push(put(paint(lathe([[r + 0.6, 0.4], [r + 0.6, 1.5], [r + 1.6, 2.1], [r + 4.2, 2.1], [r + 5.4, 1.2], [r + 5.4, 0.4]], 64), () => metal), p[0], p[1], 0))
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
    const g = slab(rounded(s.w, s.h, 3.5), 0.5, 2.5, 0.45)
    g.deleteAttribute('uv')
    plates.push(put(g.index ? g.toNonIndexed() : g, p[0], p[1], 0))
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
    const head = new THREE.SphereGeometry(SIZE.screw * 1.25, 10, 4, 0, Math.PI * 2, 0, Math.PI * 0.3).rotateX(Math.PI / 2).translate(0, 0, -SIZE.screw * 1.25 * Math.cos(Math.PI * 0.3))
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
    const core = paint(new THREE.SphereGeometry(SIZE.core, 28, 18).rotateX(Math.PI / 2), (_x, _y, zz) => k(white, 0.78 + (LENS.on - 0.78) * Math.pow(0.5 - zz / (2 * SIZE.core), 1.5)))
    const cores = new THREE.InstancedMesh(core, lens, globes.length)
    const shell = new THREE.InstancedMesh(
      new THREE.SphereGeometry(SIZE.globe, 28, 18).rotateX(Math.PI / 2),
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
