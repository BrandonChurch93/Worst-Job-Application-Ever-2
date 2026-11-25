import * as THREE from 'three'
import { config } from '../../../config'
import { hash01 } from '../../../core/random'
import { studio } from '../../../post/studio'
import { materials } from '../../../shell/materials'
import { roundedRect } from '../../../shell/solids'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

export const BRUSH = { u: 1024, v: 256 }

// Straight brushing as a normal picture that tiles: long fine lines along x, each row its own.
export function brushedNormalMap(size: number, seed: number, strength: number): THREE.DataTexture {
  const h = new Float32Array(size * size)
  const line = (x: number, row: number, cells: number, salt: number) => {
    const f = (x / size) * cells + hash01(row, salt, seed) * cells
    const i = Math.floor(f)
    const t = smooth(f - i)
    const a = hash01(((i % cells) + cells) % cells, row, seed + salt)
    const b = hash01((((i + 1) % cells) + cells) % cells, row, seed + salt)
    return a + (b - a) * t
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      h[y * size + x] = line(x, y, 4, 3) * 0.5 + line(x, y >> 1, 8, 5) * 0.3 + line(x, y >> 2, 2, 7) * 0.35 + line(x, y >> 4, 2, 9) * 0.25
    }
  }
  const data = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength * 0.2
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const l = Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * size + x) * 4
      data[i] = Math.round((-dx / l) * 127.5 + 127.5)
      data[i + 1] = Math.round((-dy / l) * 127.5 + 127.5)
      data[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 8
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

// What the brushed top sends back at a place on the deck, as a share of its colour: soft upright bands of light across the brushing, a little lighter toward the upper left. u and v run from 0 to 1 over the deck, v upward.
export function sheen(u: number, v: number, seed: number): number {
  const wave = (x: number, cells: number, salt: number) => {
    const f = x * cells
    const i = Math.floor(f)
    const t = smooth(f - i)
    return hash01(i, salt, seed) + (hash01(i + 1, salt, seed) - hash01(i, salt, seed)) * t
  }
  const band = Math.exp(-(((u - 0.045) / 0.05) ** 2)) * 0.17 - Math.exp(-(((u - 0.115) / 0.03) ** 2)) * 0.05 + Math.exp(-(((u - 0.955) / 0.05) ** 2)) * 0.1
  const soft = (wave(u, 7, 21) - 0.5) * 0.2 + (wave(u, 19, 22) - 0.5) * 0.08
  const fall = 0.04 * (v - 0.5) - 0.18 * (u - 0.5)
  return Math.min(1, Math.max(0, 0.78 + band + soft + fall))
}

// Splits every edge longer than a length at its middle, so a flat face has points enough to carry a tone that changes across it.
export function refine(g: THREE.BufferGeometry, longest: number): THREE.BufferGeometry {
  const flat = g.index ? g.toNonIndexed() : g
  const p = flat.getAttribute('position')
  const out: number[] = []
  const todo: number[][] = []
  for (let i = 0; i < p.count; i += 3) todo.push([p.getX(i), p.getY(i), p.getX(i + 1), p.getY(i + 1), p.getX(i + 2), p.getY(i + 2)])
  const z = p.count ? p.getZ(0) : 0
  while (todo.length) {
    const t = todo.pop()!
    let worst = 0
    let far = 0
    for (let e = 0; e < 3; e++) {
      const a = e * 2
      const b = ((e + 1) % 3) * 2
      const d = Math.hypot(t[b]! - t[a]!, t[b + 1]! - t[a + 1]!)
      if (d > far) {
        far = d
        worst = e
      }
    }
    if (far <= longest) {
      out.push(t[0]!, t[1]!, z, t[2]!, t[3]!, z, t[4]!, t[5]!, z)
      continue
    }
    const a = worst * 2
    const b = ((worst + 1) % 3) * 2
    const c = ((worst + 2) % 3) * 2
    const mx = (t[a]! + t[b]!) / 2
    const my = (t[a + 1]! + t[b + 1]!) / 2
    todo.push([t[a]!, t[a + 1]!, mx, my, t[c]!, t[c + 1]!], [mx, my, t[b]!, t[b + 1]!, t[c]!, t[c + 1]!])
  }
  const made = new THREE.BufferGeometry()
  made.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  const n = out.length / 3
  const normal = new Float32Array(n * 3)
  const uv = new Float32Array(n * 2)
  for (let i = 0; i < n; i++) {
    normal[i * 3 + 2] = 1
    uv[i * 2] = out[i * 3]!
    uv[i * 2 + 1] = out[i * 3 + 1]!
  }
  made.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
  made.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return made
}

export interface Kit {
  brushed: THREE.DataTexture
  deck: THREE.MeshPhysicalMaterial
  well: THREE.MeshPhysicalMaterial
  turned: THREE.MeshPhysicalMaterial
  chrome: THREE.MeshPhysicalMaterial
  barrel: THREE.MeshPhysicalMaterial
  bed: THREE.MeshPhysicalMaterial
  cap: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  lamp: THREE.MeshPhysicalMaterial
  seat: THREE.MeshPhysicalMaterial
  dark: THREE.MeshPhysicalMaterial
}

let made: Kit | null = null

export function kit(): Kit {
  if (made) return made
  const m = materials()
  const brushed = brushedNormalMap(512, config.seed + 301, 1.6)
  const metal = (roughness: number, anisotropy: number, bump: number) => {
    const out = studio(m.aluminium.clone())
    out.roughness = roughness
    out.normalMap = brushed
    out.normalScale = new THREE.Vector2(bump, bump)
    out.anisotropy = anisotropy
    out.anisotropyRotation = 0
    return out
  }
  const deck = metal(0.3, 0.5, 0.08)
  deck.color.copy(srgb(0xe6e7e8))
  deck.metalness = 0.5
  const well = metal(0.44, 0.55, 0.13)
  well.color.copy(srgb(0xdfe0e1))
  well.metalness = 0.35
  well.vertexColors = true
  const turned = metal(0.34, 0.7, 0.14)
  turned.color.multiply(new THREE.Color(0.66, 0.665, 0.68))
  const chrome = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x8e9196), roughness: 0.42, metalness: 0.9 }))
  const bed = metal(0.55, 0.5, 0.12)
  bed.color.multiply(new THREE.Color(0.3, 0.3, 0.31))
  const barrel = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xb4b7bb), roughness: 0.28, metalness: 0.92 }))
  const cap = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xeee7db), roughness: 0.58, metalness: 0, specularIntensity: 0.5, vertexColors: true }))
  const lamp = studio(m.orange.clone())
  lamp.emissive = srgb(0xff5a08)
  lamp.emissiveIntensity = 0
  lamp.roughness = 0.3
  lamp.clearcoat = 0.6
  lamp.clearcoatRoughness = 0.22
  const seat = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x4c4a47), roughness: 0.78, metalness: 0, specularIntensity: 0.3 }))
  const dark = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x201f1e), roughness: 0.55, metalness: 0.2, specularIntensity: 0.5 }))
  made = { brushed, deck, well, turned, chrome, barrel, bed, cap, orange: m.orange, lamp, seat, dark }
  return made
}

export const CAP = { rise: config.scale.heights.keycap - config.scale.heights.keyboardDeck, skirt: 7.2, rim: 0.55, dish: 18, corner: 11, tile: 96, gap: 1.2, shoulder: 4.8, fall: 5.6, crest: 1.3 }

// A keycap: a skirt that stands in its seat, straight walls, a flat sloped shoulder with a hard lower edge, a tight crest and a top that is all but flat.
// z = 0 is the crest of the rim, at the top of the key shape. The dish lies below it, so a flat legend at that height is never under the plastic.
export function capGeometry(w: number, h: number, perCorner = 5): THREE.BufferGeometry {
  const g0 = CAP.gap
  const rings: { inset: number; z: number; soft?: number }[] = [
    { inset: g0, z: -(CAP.rise + CAP.skirt) },
    { inset: g0, z: -CAP.rise + 0.5 },
    { inset: g0, z: -CAP.fall },
    { inset: g0, z: -CAP.fall }
  ]
  const slope = CAP.shoulder - CAP.crest
  rings.push({ inset: g0 + slope, z: -CAP.crest })
  for (let i = 0; i <= 4; i++) {
    const a = (Math.PI / 2) * (i / 4)
    rings.push({ inset: g0 + slope + CAP.crest * Math.sin(a) * 0.9, z: -CAP.crest * (1 - Math.sin(a)) * (i === 0 ? 1 : 0.8) })
  }
  const crest = rings[rings.length - 1]!.inset
  for (const d of [2, 5, 9, 13, CAP.dish]) rings.push({ inset: crest + d, z: -CAP.rim * smooth(d / CAP.dish), soft: d })
  const n = (perCorner + 1) * 4
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const ring of rings) {
    const half = Math.min(w, h) / 2 - ring.inset
    const o = roundedRect(w - ring.inset * 2, h - ring.inset * 2, Math.min(half, Math.max(1.5, CAP.corner - ring.inset * 0.45) + (ring.soft ?? 0) * 0.9), perCorner)
    for (let i = 0; i < n; i++) {
      pos.push(o.x[i]!, o.y[i]!, ring.z)
      uv.push(o.x[i]! / CAP.tile, o.y[i]! / CAP.tile)
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    const a = k * n
    const b = a + n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(a + i, a + j, b + i, a + j, b + j, b + i)
    }
  }
  const last = (rings.length - 1) * n
  pos.push(0, 0, -CAP.rim)
  uv.push(0, 0)
  const centre = rings.length * n
  for (let i = 0; i < n; i++) idx.push(centre, last + i, last + ((i + 1) % n))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// A turned part: a profile of radius and height swept round the z axis, every band with its own flat face.
export function turn(profile: [number, number][], segments = 48, tiles = 3): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  let run = 0
  for (let k = 0; k < profile.length - 1; k++) {
    const [r0, z0] = profile[k]!
    const [r1, z1] = profile[k + 1]!
    const dr = r1 - r0
    const dz = z1 - z0
    const len = Math.hypot(dr, dz)
    if (len < 1e-6) continue
    const nr = dz / len
    const nz = -dr / len
    const start = pos.length / 3
    for (const [r, z, v] of [[r0, z0, run], [r1, z1, run + len]] as [number, number, number][]) {
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        pos.push(r * c, r * s, z)
        nor.push(nr * c, nr * s, nz)
        uv.push((i / segments) * tiles, v / BRUSH.v)
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = start + i
      const b = start + segments + 1 + i
      idx.push(a, a + 1, b, a + 1, b + 1, b)
    }
    run += len
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

export function scaleUv(g: THREE.BufferGeometry, su: number, sv: number): THREE.BufferGeometry {
  const u = g.getAttribute('uv')
  for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * su, u.getY(i) * sv)
  u.needsUpdate = true
  return g
}

export function lit(o: THREE.Object3D, cast = true, receive = true): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh) return
    m.castShadow = cast
    m.receiveShadow = receive
  })
}
