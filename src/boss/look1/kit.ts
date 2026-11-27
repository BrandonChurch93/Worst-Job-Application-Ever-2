import * as THREE from 'three'
import { materials } from '../../shell/materials'
import { studio } from '../../post/studio'
import { hash01 } from '../../core/random'

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true, receive = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = cast
  m.receiveShadow = receive
  return m
}

// A turned solid: (radius, height) points from the foot up the outside and in over the top, round the z axis.
export function lathe(points: [number, number][], segments = 48): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  let top = 1
  for (const p of points) top = Math.max(top, p[0])
  for (let k = 0; k < points.length - 1; k++) {
    const [r0, z0] = points[k]!
    const [r1, z1] = points[k + 1]!
    const dr = r1 - r0
    const dz = z1 - z0
    const len = Math.hypot(dr, dz)
    if (len < 1e-6) continue
    const nr = dz / len
    const nz = -dr / len
    const start = pos.length / 3
    for (const [r, z] of [[r0, z0], [r1, z1]] as [number, number][]) {
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        pos.push(r * c, r * s, z)
        nor.push(nr * c, nr * s, nz)
        uv.push(0.5 + (r / top) * 0.5 * c, 0.5 + (r / top) * 0.5 * s)
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = start + i
      const b = start + segments + 1 + i
      idx.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

// A flat plate cut from a closed line of points (counter clockwise seen from above), with a chamfer round its upper edge.
export function cutPlate(points: [number, number][], tall: number, bevel: number, out = 0, facets = 3): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.1, tall - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: out - bevel, bevelSegments: facets, steps: 1, curveSegments: 1 })
  g.translate(0, 0, 0)
  const p = g.getAttribute('position')
  let low = Infinity
  for (let i = 0; i < p.count; i++) low = Math.min(low, p.getZ(i))
  g.translate(0, 0, -low)
  const pos = g.getAttribute('position')
  for (let i = 0; i < pos.count; i++) if (pos.getZ(i) < bevel * 0.999) pos.setZ(i, Math.max(0, pos.getZ(i)))
  return g
}

export function joined(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  for (const part of parts) {
    const g = part.index ? part.toNonIndexed() : part
    const p = g.getAttribute('position')
    const n = g.getAttribute('normal')
    const u = g.getAttribute('uv')
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i))
      nor.push(n.getX(i), n.getY(i), n.getZ(i))
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0)
    }
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return out
}

export const moved = (g: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry => g.clone().translate(x, y, z)

// A screw head: a low dome with a hex pocket, turned to its own angle.
export function screw(r: number, tall: number, seed: number): THREE.BufferGeometry {
  const head = lathe([[r, 0], [r, tall * 0.55], [r * 0.82, tall], [r * 0.52, tall], [r * 0.46, tall * 0.25], [0, tall * 0.25]], 6 * 4)
  head.rotateZ(hash01(seed, 3, 9) * Math.PI)
  return head
}

// A cylinder lying along x from 0 toward minus x, drawn as (radius, distance) points.
export function lying(points: [number, number][], segments = 32): THREE.BufferGeometry {
  return lathe(points, segments).rotateY(-Math.PI / 2)
}

export const BRUSH = { w: 512, h: 128, perPx: 2.4, deep: 0.42, cells: 8 }

// Fine straight brushing along x, as a grey that the plate's colour is multiplied by: every row its own tone, drifting slowly along its length, and a few sharper scratches.
export function brushPixels(seed = 5): Uint8Array {
  const { w, h, deep, cells } = BRUSH
  const out = new Uint8Array(w * h * 4)
  const smooth = (t: number): number => t * t * (3 - 2 * t)
  for (let y = 0; y < h; y++) {
    const row = 0.25 * hash01(y, 1, seed) + 0.35 * hash01(y >> 1, 2, seed) + 0.4 * hash01(y >> 2, 3, seed)
    const scratch = hash01(y, 4, seed) > 0.93 ? 0.5 : 0
    for (let x = 0; x < w; x++) {
      const at = (x / w) * cells
      const c = Math.floor(at)
      const drift = hash01(y * 31 + (c % cells), 5, seed) + (hash01(y * 31 + ((c + 1) % cells), 5, seed) - hash01(y * 31 + (c % cells), 5, seed)) * smooth(at - c)
      const dark = Math.min(1, 0.5 * row + 0.5 * drift + scratch * drift)
      const g = Math.round(255 * (1 - deep * dark))
      const i = (y * w + x) * 4
      out[i] = g
      out[i + 1] = g
      out[i + 2] = g
      out[i + 3] = 255
    }
  }
  return out
}

let brush: THREE.DataTexture | null = null

function brushing(): THREE.DataTexture {
  if (brush) return brush
  brush = new THREE.DataTexture(brushPixels(), BRUSH.w, BRUSH.h, THREE.RGBAFormat)
  brush.wrapS = THREE.RepeatWrapping
  brush.wrapT = THREE.RepeatWrapping
  brush.repeat.set(BRUSH.perPx / BRUSH.w, BRUSH.perPx / BRUSH.h)
  brush.magFilter = THREE.LinearFilter
  brush.minFilter = THREE.LinearMipmapLinearFilter
  brush.generateMipmaps = true
  brush.anisotropy = 4
  brush.needsUpdate = true
  return brush
}

export interface BossKit {
  housing: THREE.MeshPhysicalMaterial
  bore: THREE.MeshPhysicalMaterial
  bed: THREE.MeshPhysicalMaterial
  pin: THREE.MeshPhysicalMaterial
  crack: THREE.MeshPhysicalMaterial
  plate: THREE.MeshPhysicalMaterial
  plateSide: THREE.MeshPhysicalMaterial
  pocket: THREE.MeshPhysicalMaterial
  link: THREE.MeshPhysicalMaterial
  joint: THREE.MeshPhysicalMaterial
  trim: THREE.MeshPhysicalMaterial
  lacquer: THREE.MeshPhysicalMaterial
}

let made: BossKit | null = null

export const PLATE_TONE = { live: srgb(0x868a90), dead: srgb(0x6e7277) }
export const FLANGE_TONE = { live: srgb(0x35373a), dead: srgb(0x2e3033), rough: [0.55, 0.6] }
export const WORN = { trim: [srgb(0x9da1a6), srgb(0x7b7f84)], joint: [srgb(0x9a9ea3), srgb(0x777b80)], pin: [srgb(0xc9ccd0), srgb(0x8e9296)] }

function lacquer(): THREE.MeshPhysicalMaterial {
  const m = materials().orange.clone()
  m.clearcoat = 1
  m.clearcoatRoughness = 0.1
  m.envMapIntensity = 2.4
  return studio(m)
}

export function bossKit(): BossKit {
  made ??= {
    lacquer: lacquer(),
    housing: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xa3a7ab), roughness: 0.34, metalness: 0.9 })),
    bore: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x121212), roughness: 0.8, metalness: 0.2, specularIntensity: 0.3 })),
    bed: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1f2022), roughness: 0.62, metalness: 0.55, specularIntensity: 0.5 })),
    pin: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xc9ccd0), roughness: 0.2, metalness: 1 })),
    plate: studio(new THREE.MeshPhysicalMaterial({ color: PLATE_TONE.live.clone(), roughness: 0.46, metalness: 1, map: brushing(), anisotropy: 0.55, anisotropyRotation: Math.PI / 2 })),
    plateSide: studio(new THREE.MeshPhysicalMaterial({ color: FLANGE_TONE.live.clone(), roughness: FLANGE_TONE.rough[0], metalness: 0.88 })),
    pocket: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x63666a), roughness: 0.5, metalness: 0.9 })),
    link: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x7d8187), roughness: 0.4, metalness: 0.92, anisotropy: 0.5 })),
    joint: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9a9ea3), roughness: 0.26, metalness: 0.95 })),
    trim: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9da1a6), roughness: 0.36, metalness: 0.9 })),
    crack: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x3a1608), roughness: 0.85, metalness: 0, specularIntensity: 0.15, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }))
  }
  return made
}

export type V3 = [number, number, number]

// An eight sided plate outline, counter clockwise, round (cx, cy).
export function oct(hx: number, hy: number, c: number, cx = 0, cy = 0): [number, number][] {
  return [[cx - hx + c, cy - hy], [cx + hx - c, cy - hy], [cx + hx, cy - hy + c], [cx + hx, cy + hy - c], [cx + hx - c, cy + hy], [cx - hx + c, cy + hy], [cx - hx, cy + hy - c], [cx - hx, cy - hy + c]]
}

export function pillOutline(w: number, h: number, r: number, per = 10): [number, number][] {
  const pts: [number, number][] = []
  const corners: [number, number, number][] = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]]
  for (const [cx, cy, q] of corners) for (let i = 0; i <= per; i++) { const a = (q + i / per) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
  return pts
}

// A plate with a hole in it, from z = 0 up.
export function ringPlate(outer: [number, number][], inner: [number, number][], tall: number, bevel: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)))
  shape.holes.push(new THREE.Path(inner.map(([x, y]) => new THREE.Vector2(x, y))))
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.1, tall - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2, steps: 1, curveSegments: 1 })
  g.translate(0, 0, bevel)
  return g
}

export const plateAt = (points: [number, number][], z0: number, z1: number, bevel = 3): THREE.BufferGeometry => cutPlate(points, z1 - z0, Math.min(bevel, (z1 - z0) / 2.2)).translate(0, 0, z0)

export function boxAt(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, bevel = 1.5): THREE.BufferGeometry {
  return plateAt([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, bevel)
}

// An upright turned solid at a place.
export const turnedAt = (points: [number, number][], x: number, y: number, z: number, segments = 32): THREE.BufferGeometry => lathe(points, segments).translate(x, y, z)

export const discAt = (r: number, x: number, y: number, z0: number, z1: number, bevel = 2, segments = 32): THREE.BufferGeometry => turnedAt([[0, 0], [r, 0], [r, z1 - z0 - bevel], [r - bevel, z1 - z0], [0, z1 - z0]], x, y, z0, segments)

// A turned solid lying along +x: (radius, x) points from the rear to the front.
export const along = (points: [number, number][], segments = 32): THREE.BufferGeometry => lathe(points, segments).rotateY(Math.PI / 2)

// A turned solid lying along +y, centred on the x axis: an axle or a joint disc.
export const across = (r: number, half: number, bevel = 2, segments = 28): THREE.BufferGeometry => lathe([[0, -half], [r - bevel, -half], [r, -half + bevel], [r, half - bevel], [r - bevel, half], [0, half]], segments).rotateX(-Math.PI / 2)

// A round rod between two points.
export function rod(a: V3, b: V3, r: number, segments = 10): THREE.BufferGeometry {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const len = d.length()
  const g = lathe([[0, 0], [r, 0], [r, len], [0, len]], segments)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize())
  g.applyQuaternion(q)
  g.translate(a[0], a[1], a[2])
  return g
}

// A hose through points.
export function hose(points: V3[], r: number, segments = 24, sides = 8): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal')
  return new THREE.TubeGeometry(curve, segments, r, sides, false)
}

export interface LookKit {
  plate: THREE.MeshPhysicalMaterial
  plateLight: THREE.MeshPhysicalMaterial
  dark: THREE.MeshPhysicalMaterial
  housing: THREE.MeshPhysicalMaterial
  joint: THREE.MeshPhysicalMaterial
  pin: THREE.MeshPhysicalMaterial
  bed: THREE.MeshPhysicalMaterial
  bore: THREE.MeshPhysicalMaterial
  button: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  glassEdge: THREE.MeshPhysicalMaterial
  crack: THREE.MeshPhysicalMaterial
  soot: THREE.MeshPhysicalMaterial
  ceramic: THREE.MeshPhysicalMaterial
}

let look: LookKit | null = null

export function lookKit(): LookKit {
  if (look) return look
  const b = bossKit()
  const m = materials()
  const plateLight = b.plate.clone()
  plateLight.color = srgb(0xa4a8ad)
  look = {
    plate: b.plate,
    plateLight: studio(plateLight),
    dark: b.plateSide,
    housing: b.housing,
    joint: b.joint,
    pin: b.pin,
    bed: b.bed,
    bore: b.bore,
    button: b.lacquer,
    orange: m.orange,
    glass: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9cc4b0), roughness: 0.3, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, specularIntensity: 0.6, envMapIntensity: 0.5, transparent: true, opacity: 0.62, depthWrite: false })),
    glassEdge: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xcfe2d8), roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1 })),
    crack: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1c1a19), roughness: 0.9, metalness: 0, specularIntensity: 0.1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })),
    soot: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1a1a1b), roughness: 0.95, metalness: 0, specularIntensity: 0.05, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })),
    ceramic: m.ceramic
  }
  return look
}

// Light that is its own source: brighter than the picture's white, so the lens spreads it.
export const glowMaterial = (hex: number, gain = 1): THREE.MeshBasicMaterial => {
  const m = new THREE.MeshBasicMaterial({ color: srgb(hex).multiplyScalar(gain) })
  m.userData.base = srgb(hex)
  return m
}
export const setGlow = (m: THREE.MeshBasicMaterial, gain: number): void => { m.color.copy(m.userData.base as THREE.Color).multiplyScalar(gain) }
