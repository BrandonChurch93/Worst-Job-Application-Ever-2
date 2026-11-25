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

export interface Kit {
  brushed: THREE.DataTexture
  deck: THREE.MeshPhysicalMaterial
  well: THREE.MeshPhysicalMaterial
  turned: THREE.MeshPhysicalMaterial
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
  const deck = metal(0.46, 0.5, 0.1)
  deck.color.multiply(new THREE.Color(1, 1, 1.01))
  const well = metal(0.5, 0.5, 0.1)
  well.color.multiply(new THREE.Color(0.37, 0.38, 0.41))
  const turned = metal(0.36, 0.7, 0.16)
  turned.color.multiply(new THREE.Color(0.38, 0.39, 0.415))
  const bed = metal(0.55, 0.5, 0.12)
  bed.color.multiply(new THREE.Color(0.36, 0.37, 0.395))
  const barrel = metal(0.34, 0.6, 0.14)
  barrel.color.multiply(new THREE.Color(0.2, 0.205, 0.22))
  const cap = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf0e6d3), roughness: 0.62, metalness: 0, specularIntensity: 0.45, vertexColors: true }))
  const lamp = studio(m.orange.clone())
  lamp.emissive = srgb(0xff5a08)
  lamp.emissiveIntensity = 0
  lamp.roughness = 0.3
  lamp.clearcoat = 0.6
  lamp.clearcoatRoughness = 0.22
  const seat = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x4c4a47), roughness: 0.78, metalness: 0, specularIntensity: 0.3 }))
  const dark = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x201f1e), roughness: 0.55, metalness: 0.2, specularIntensity: 0.5 }))
  made = { brushed, deck, well, turned, barrel, bed, cap, orange: m.orange, lamp, seat, dark }
  return made
}

export const CAP = { rise: config.scale.heights.keycap - config.scale.heights.keyboardDeck, skirt: 7.2, rim: 0.9, dish: 16, corner: 10, tile: 96, gap: 1.2, shoulder: 8, fall: 5.6 }

// A keycap: a skirt that stands in its seat, straight walls, a wide soft shoulder and a shallow dished top.
// z = 0 is the crest of the rim, at the top of the key shape. The dish lies below it, so a flat legend at that height is never under the plastic.
export function capGeometry(w: number, h: number, perCorner = 5): THREE.BufferGeometry {
  const g0 = CAP.gap
  const rings: { inset: number; z: number; soft?: number }[] = [
    { inset: g0, z: -(CAP.rise + CAP.skirt) },
    { inset: g0, z: -CAP.rise + 0.5 },
    { inset: g0, z: -CAP.fall }
  ]
  for (let i = 1; i <= 10; i++) {
    const a = (Math.PI / 2) * (i / 10)
    rings.push({ inset: g0 + CAP.shoulder * (1 - Math.cos(a)), z: -CAP.fall * (1 - Math.sin(a)) })
  }
  const crest = rings[rings.length - 1]!.inset
  for (const d of [1.5, 3.5, 6, 9, CAP.dish]) rings.push({ inset: crest + d, z: -CAP.rim * smooth(d / CAP.dish), soft: d })
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
