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

// A plate with a wide, shallow chamfer round its top: the face that looks at the light catches it, the far one falls into shade.
export function chamfer(points: [number, number][], z0: number, z1: number, run: number, rise: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.1, z1 - z0 - 2 * rise), bevelEnabled: true, bevelThickness: rise, bevelSize: run, bevelOffset: -run, bevelSegments: 1, steps: 1, curveSegments: 1 })
  return g.translate(0, 0, z0 + rise)
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
  limb: THREE.MeshPhysicalMaterial
  hull: THREE.MeshPhysicalMaterial
  wing: THREE.MeshPhysicalMaterial
  hatch: THREE.MeshPhysicalMaterial
  gunBody: THREE.MeshPhysicalMaterial
  gunBase: THREE.MeshPhysicalMaterial
  bezel: THREE.MeshPhysicalMaterial
  steel: THREE.MeshPhysicalMaterial
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
  glassCrack: THREE.MeshBasicMaterial
  soot: THREE.MeshBasicMaterial
  ceramic: THREE.MeshPhysicalMaterial
  scorched: THREE.MeshPhysicalMaterial
  torn: THREE.MeshPhysicalMaterial
  under: THREE.MeshPhysicalMaterial
}

let look: LookKit | null = null

export function lookKit(): LookKit {
  if (look) return look
  const b = bossKit()
  const m = materials()
  const plateLight = new THREE.MeshPhysicalMaterial({ color: srgb(0x64686d), roughness: 0.54, metalness: 0.3, specularIntensity: 0.5 })
  const brushed = (hex: number, metal: number, rough = 0.46): THREE.MeshPhysicalMaterial => { const c = b.plate.clone(); c.color = srgb(hex); c.metalness = metal; c.roughness = rough; return studio(c) }
  look = {
    hull: brushed(0x9c9fa3, 0.35, 0.52),
    wing: brushed(0x8f9296, 0.3, 0.55),
    hatch: brushed(0x8a8e94, 0.6, 0.44),
    bezel: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x70747a), roughness: 0.3, metalness: 0.85 })),
    steel: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xaeb1b5), roughness: 0.46, metalness: 0.5, specularIntensity: 0.6 })),
    gunBody: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x90949a), roughness: 0.5, metalness: 0.45, specularIntensity: 0.6 })),
    gunBase: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xb4b7bb), roughness: 0.42, metalness: 0.5, specularIntensity: 0.6 })),
    plate: b.plate,
    plateLight: studio(plateLight),
    limb: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x74787d), roughness: 0.5, metalness: 0.35, specularIntensity: 0.6 })),
    dark: b.plateSide,
    housing: b.housing,
    joint: b.joint,
    pin: b.pin,
    bed: b.bed,
    bore: b.bore,
    button: b.lacquer,
    orange: m.orange,
    glass: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x6fae92), roughness: 0.3, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, specularIntensity: 0.6, envMapIntensity: 0.5, transparent: true, opacity: 0.62, depthWrite: false })),
    glassEdge: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x9fcdb6), roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1 })),
    crack: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1c1a19), roughness: 0.9, metalness: 0, specularIntensity: 0.1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })),
    glassCrack: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.86, 0.95, 0.9), transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    soot: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.011, 0.01), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    ceramic: m.ceramic,
    scorched: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x4a4744), roughness: 0.62, metalness: 0.7, specularIntensity: 0.5 })),
    torn: torn(),
    under: studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x6a6d72), roughness: 0.6, metalness: 0.4, specularIntensity: 0.5 }))
  }
  return look
}

// A part the blast is tearing off: burnt dark, and hot where its faces turn away from the eye.
export const TORN = { colour: 0x24211f, rim: [2.4, 0.6, 0.1], power: 4 } as const
function torn(): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: srgb(TORN.colour), roughness: 0.8, metalness: 0.4, specularIntensity: 0.3, side: THREE.DoubleSide }))
  const lit = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    lit.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vec3( ${TORN.rim.map((v) => v.toFixed(3)).join(', ')} ) * pow( 1.0 - clamp( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ), 0.0, 1.0 ), ${TORN.power.toFixed(2)} );`)
  }
  m.customProgramCacheKey = () => 'wja-studio-torn'
  return m
}

// Light that is its own source: brighter than the picture's white, so the lens spreads it.
// A lamp that is off is dark smoked glass, never black.
const OFF = 0.012
export const setGlow = (m: THREE.MeshBasicMaterial, gain: number): void => { m.color.copy(m.userData.base as THREE.Color).multiplyScalar(Math.max(0, gain)).addScalar(OFF) }
export const glowMaterial = (hex: number, gain = 1): THREE.MeshBasicMaterial => {
  const m = new THREE.MeshBasicMaterial()
  m.userData.base = srgb(hex)
  setGlow(m, gain)
  return m
}

// A star of cracks lying on the ground: arms that wander outward and thin to nothing, each with a branch.
export function crackStar(seed: number, arms: number, r0: (a: number) => [number, number], reach: number, wide: number): THREE.BufferGeometry {
  const pos: number[] = []
  const h = (i: number, j: number): number => hash01(i, j, seed)
  const strip = (x: number, y: number, a: number, len: number, w: number, id: number, depth: number): void => {
    const steps = 5
    let px = x
    let py = y
    let ang = a
    for (let s = 0; s < steps; s++) {
      const w0 = w * (1 - s / steps)
      const w1 = w * (1 - (s + 1) / steps)
      const na = ang + (h(id * 13 + s, 3 + depth) - 0.5) * 1.1
      const l = (len / steps) * (0.7 + 0.6 * h(id * 17 + s, 5 + depth))
      const qx = px + Math.cos(na) * l
      const qy = py + Math.sin(na) * l
      const nx = -Math.sin(na)
      const ny = Math.cos(na)
      pos.push(px + nx * w0, py + ny * w0, 0, px - nx * w0, py - ny * w0, 0, qx + nx * w1, qy + ny * w1, 0)
      pos.push(px - nx * w0, py - ny * w0, 0, qx - nx * w1, qy - ny * w1, 0, qx + nx * w1, qy + ny * w1, 0)
      if (depth === 0 && s === 1 + (id % 2)) strip(qx, qy, na + (h(id, 9) > 0.5 ? 0.8 : -0.8), len * 0.45, w1 * 0.8, id + 100, 1)
      px = qx
      py = qy
      ang = na
    }
  }
  for (let i = 0; i < arms; i++) {
    const a = ((i + 0.5 * h(i, 1)) / arms) * Math.PI * 2
    const [x, y] = r0(a)
    strip(x, y, a, reach * (0.55 + 0.45 * h(i, 2)), wide * (0.6 + 0.4 * h(i, 4)), i, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return g
}

// A flat blot with a ragged edge, lying at z = 0: soot or a scorch.
export function blot(seed: number, r: number, n = 14): THREE.BufferGeometry {
  const shape = new THREE.Shape(Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const k = r * (0.62 + 0.5 * hash01(i, 7, seed)); return new THREE.Vector2(Math.cos(a) * k, Math.sin(a) * k) }))
  return new THREE.ShapeGeometry(shape)
}


// What is left of flat geometry inside a convex outline: soot and cracks stay on the plate they lie on.
export function clipTo(g: THREE.BufferGeometry, outline: [number, number][]): THREE.BufferGeometry {
  const src = g.index ? g.toNonIndexed() : g
  const p = src.getAttribute('position')
  let area = 0
  for (let i = 0; i < outline.length; i++) { const a = outline[i]!; const b = outline[(i + 1) % outline.length]!; area += a[0] * b[1] - b[0] * a[1] }
  const clip = area < 0 ? [...outline].reverse() : outline
  const pos: number[] = []
  for (let t = 0; t < p.count; t += 3) {
    const z = p.getZ(t)
    let poly: [number, number][] = [[p.getX(t), p.getY(t)], [p.getX(t + 1), p.getY(t + 1)], [p.getX(t + 2), p.getY(t + 2)]]
    for (let i = 0; i < clip.length && poly.length > 0; i++) {
      const a = clip[i]!
      const b = clip[(i + 1) % clip.length]!
      const side = (q: [number, number]): number => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])
      const out: [number, number][] = []
      for (let j = 0; j < poly.length; j++) {
        const c = poly[j]!
        const d = poly[(j + 1) % poly.length]!
        const sc = side(c)
        const sd = side(d)
        if (sc >= 0) out.push(c)
        if ((sc >= 0) !== (sd >= 0)) { const k = sc / (sc - sd); out.push([c[0] + (d[0] - c[0]) * k, c[1] + (d[1] - c[1]) * k]) }
      }
      poly = out
    }
    for (let j = 1; j + 1 < poly.length; j++) pos.push(poly[0]![0], poly[0]![1], z, poly[j]![0], poly[j]![1], z, poly[j + 1]![0], poly[j + 1]![1], z)
  }
  const o = new THREE.BufferGeometry()
  o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  o.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  o.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2))
  return o
}

// A piece of a solid part inside a convex outline, with its heights, normals and brushing kept: the hull comes apart along these cuts.
export function cutTo(g: THREE.BufferGeometry, outline: [number, number][]): THREE.BufferGeometry {
  const src = g.index ? g.toNonIndexed() : g
  const p = src.getAttribute('position')
  const n = src.getAttribute('normal')
  const u = src.getAttribute('uv')
  let area = 0
  for (let i = 0; i < outline.length; i++) { const a = outline[i]!; const b = outline[(i + 1) % outline.length]!; area += a[0] * b[1] - b[0] * a[1] }
  const clip = area < 0 ? [...outline].reverse() : outline
  const out: number[][] = []
  const at = (i: number): number[] => [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), u ? u.getX(i) : 0, u ? u.getY(i) : 0]
  for (let t = 0; t < p.count; t += 3) {
    let poly: number[][] = [at(t), at(t + 1), at(t + 2)]
    for (let i = 0; i < clip.length && poly.length > 0; i++) {
      const a = clip[i]!
      const b = clip[(i + 1) % clip.length]!
      const side = (q: number[]): number => (b[0] - a[0]) * (q[1]! - a[1]) - (b[1] - a[1]) * (q[0]! - a[0])
      const next: number[][] = []
      for (let j = 0; j < poly.length; j++) {
        const c = poly[j]!
        const d = poly[(j + 1) % poly.length]!
        const sc = side(c)
        const sd = side(d)
        if (sc >= 0) next.push(c)
        if ((sc >= 0) !== (sd >= 0)) { const k = sc / (sc - sd); next.push(c.map((v, m) => v + (d[m]! - v) * k)) }
      }
      poly = next
    }
    for (let j = 1; j + 1 < poly.length; j++) out.push(poly[0]!, poly[j]!, poly[j + 1]!)
  }
  const o = new THREE.BufferGeometry()
  o.setAttribute('position', new THREE.Float32BufferAttribute(out.flatMap((v) => [v[0]!, v[1]!, v[2]!]), 3))
  o.setAttribute('normal', new THREE.Float32BufferAttribute(out.flatMap((v) => [v[3]!, v[4]!, v[5]!]), 3))
  o.setAttribute('uv', new THREE.Float32BufferAttribute(out.flatMap((v) => [v[6]!, v[7]!]), 2))
  return o
}

