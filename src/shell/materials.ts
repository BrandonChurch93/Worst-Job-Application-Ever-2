import * as THREE from 'three'
import { config } from '../config'
import { hash01 } from '../core/random'
import { studio } from '../post/studio'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

// A height field of fine grain made from the seed, as a normal picture that tiles.
export function grainNormalMap(size: number, seed: number, strength: number): THREE.DataTexture {
  const h = new Float32Array(size * size)
  const cell = (x: number, y: number, period: number, salt: number) => hash01(((x % period) + period) % period, ((y % period) + period) % period, seed + salt)
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const octave = (x: number, y: number, freq: number, salt: number) => {
    const period = size / freq
    const fx = x / freq
    const fy = y / freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = smooth(fx - x0)
    const ty = smooth(fy - y0)
    const a = cell(x0, y0, period, salt)
    const b = cell(x0 + 1, y0, period, salt)
    const c = cell(x0, y0 + 1, period, salt)
    const d = cell(x0 + 1, y0 + 1, period, salt)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      h[y * size + x] = octave(x, y, 2, 11) * 0.5 + octave(x, y, 4, 23) * 0.3 + octave(x, y, 8, 37) * 0.2 + hash01(x, y, seed + 51) * 0.12
    }
  }
  const data = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
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
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

export interface Materials {
  ceramic: THREE.MeshPhysicalMaterial
  pocket: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  aluminium: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  gap: THREE.MeshPhysicalMaterial
  ink: THREE.MeshPhysicalMaterial
  inkOnOrange: THREE.MeshPhysicalMaterial
  enamel: THREE.MeshPhysicalMaterial
  edge: THREE.MeshPhysicalMaterial
  smoked: THREE.MeshPhysicalMaterial
  paper: THREE.MeshPhysicalMaterial
  red: THREE.MeshPhysicalMaterial
  keycap: THREE.MeshPhysicalMaterial
  steel: THREE.MeshPhysicalMaterial
  rubber: THREE.MeshPhysicalMaterial
  textures: THREE.Texture[]
}

export function makeMaterials(seed: number): Materials {
  const grain = grainNormalMap(512, seed, 2.2)
  // The surface's coordinates are page pixels, so one tile of grain is this many pixels wide.
  grain.repeat.set(1 / 300, 1 / 300)
  const ceramic = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xefe9df), roughness: 0.58, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 0.55 }))
  const pocket = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd9d8cf), roughness: 0.7, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 0.4 }))
  const glass = studio(
    new THREE.MeshPhysicalMaterial({
      color: srgb(0xe6ece6),
      roughness: 0.5,
      metalness: 0,
      transmission: 1,
      thickness: 5,
      ior: 1.48,
      attenuationColor: srgb(0xbfd2c4),
      attenuationDistance: 9,
      clearcoat: 0.6,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.0
    })
  )
  const aluminium = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd3d6d8), roughness: 0.32, metalness: 1, envMapIntensity: 1.25 }))
  const orange = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf0641c), roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.1 }))
  const gap = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x23211f), roughness: 0.85, metalness: 0, envMapIntensity: 0.3 }))
  const ink = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x2a2927), roughness: 0.48, metalness: 0, envMapIntensity: 0.5 }))
  const inkOnOrange = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xfbf6ee), roughness: 0.4, metalness: 0, envMapIntensity: 0.6 }))
  const enamel = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf7f5f0), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 }))
  const edge = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1b1a19), roughness: 0.35, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.0 }))
  const smoked = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x4a4c4d), roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1 }))
  const paper = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf3efe6), roughness: 0.88, metalness: 0, envMapIntensity: 0.3, side: THREE.DoubleSide }))
  const red = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xc22a1e), roughness: 0.4, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.0 }))
  const keycap = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xece4d4), roughness: 0.52, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.7 }))
  const steel = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9a9ea3), roughness: 0.24, metalness: 1, envMapIntensity: 1.3 }))
  const rubber = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1c1c1d), roughness: 0.92, metalness: 0, envMapIntensity: 0.3 }))
  for (const m of [ink, inkOnOrange]) {
    m.polygonOffset = true
    m.polygonOffsetFactor = -1
    m.polygonOffsetUnits = -2
  }
  return { ceramic, pocket, glass, aluminium, orange, gap, ink, inkOnOrange, enamel, edge, smoked, paper, red, keycap, steel, rubber, textures: [grain] }
}

let made: Materials | null = null
// The one set of materials every part shares, so the orange is the same orange everywhere.
export function materials(): Materials {
  made ??= makeMaterials(config.seed)
  return made
}
