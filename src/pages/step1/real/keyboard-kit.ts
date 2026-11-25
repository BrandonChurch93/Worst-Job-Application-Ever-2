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
  turned: THREE.MeshPhysicalMaterial
  barrel: THREE.MeshPhysicalMaterial
  bed: THREE.MeshPhysicalMaterial
  cap: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
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
  const deck = metal(0.52, 0.45, 0.22)
  deck.color.multiply(new THREE.Color(0.95, 0.96, 0.98))
  const turned = metal(0.42, 0.4, 0.14)
  turned.color.multiply(new THREE.Color(0.5, 0.515, 0.54))
  const bed = metal(0.55, 0.5, 0.12)
  bed.color.multiply(new THREE.Color(0.8, 0.81, 0.83))
  const barrel = metal(0.34, 0.6, 0.14)
  barrel.color.multiply(new THREE.Color(0.3, 0.31, 0.33))
  const speckle = m.textures[0]!.clone()
  speckle.repeat.set(1, 1)
  speckle.needsUpdate = true
  const cap = studio(
    new THREE.MeshPhysicalMaterial({ color: srgb(0xe6dfd2), roughness: 0.56, metalness: 0, normalMap: speckle, normalScale: new THREE.Vector2(0.07, 0.07), specularIntensity: 0.55, clearcoat: 0.1, clearcoatRoughness: 0.5 })
  )
  const seat = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x8a8782), roughness: 0.78, metalness: 0, specularIntensity: 0.3 }))
  const dark = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x201f1e), roughness: 0.55, metalness: 0.2, specularIntensity: 0.5 }))
  made = { brushed, deck, turned, barrel, bed, cap, orange: m.orange, seat, dark }
  return made
}

export const CAP = { rise: config.scale.heights.keycap - config.scale.heights.keyboardDeck, skirt: 7.2, rim: 0.5, dish: 13, corner: 10, tile: 96 }

// A keycap: a skirt that stands in its seat, walls that lean in, a soft shoulder and a dished top.
// z = 0 is the crest of the rim, at the top of the key shape. The dish lies below it, so a flat legend at that height is never under the plastic.
export function capGeometry(w: number, h: number, perCorner = 5): THREE.BufferGeometry {
  const lean = 0
  const round = 4.6
  const zs = -round * (1 - Math.sin(lean))
  const foot = -CAP.rise + 0.5
  const taper = Math.tan(lean) * (zs - foot)
  const rings: { inset: number; z: number }[] = [
    { inset: 0, z: -(CAP.rise + CAP.skirt) },
    { inset: 0, z: foot },
    { inset: taper, z: zs }
  ]
  for (let i = 1; i <= 8; i++) {
    const a = lean + ((Math.PI / 2 - lean) * i) / 8
    rings.push({ inset: taper + round * (Math.cos(lean) - Math.cos(a)), z: zs + round * (Math.sin(a) - Math.sin(lean)) })
  }
  const crest = rings[rings.length - 1]!.inset
  for (const d of [2, 4.5, 7, 10, CAP.dish]) rings.push({ inset: crest + d, z: -CAP.rim * smooth(d / CAP.dish) })
  const n = (perCorner + 1) * 4
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const ring of rings) {
    const o = roundedRect(w - ring.inset * 2, h - ring.inset * 2, Math.max(1.5, CAP.corner - ring.inset * 0.45), perCorner)
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
