import * as THREE from 'three'
import type { RealContext } from '../../../../real/types'
import { studio } from '../../../../post/studio'
import type { Shape } from '../../../../stage/types'
import { steel } from '../../frame/steel'
import { lit } from '../../light'
import { colours, groupsOf, levels } from '../../lights'
import { localOf, type Zone } from '../../zone'
import { Geo, type RGB, type V2, type V3 } from './geo'

export const hex = (h: number): RGB => {
  const c = new THREE.Color(h)
  return [c.r, c.g, c.b]
}
export const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k]
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

// The finishes of one material: a row of a small picture holds how rough and how metallic each is, and a mesh picks its finish by its coordinates.
export const FINISH = { polished: 0, brushed: 1, gloss: 2, matte: 3, stone: 4, satin: 5, leather: 6, cloth: 7 } as const
export type Finish = (typeof FINISH)[keyof typeof FINISH]
const ROUGH_METAL: [number, number][] = [[0.13, 1], [0.34, 1], [0.2, 0], [0.82, 0], [0.09, 0], [0.48, 0], [0.56, 0], [0.96, 0]]
const uvOf = (f: Finish): V2 => [(f + 0.5) / ROUGH_METAL.length, 0.5]

export const TONE = {
  brass: hex(0xc4a873),
  brassDark: hex(0x9b8252),
  gold: hex(0xd8be88),
  steel: hex(0xb3bcc6),
  steelDark: hex(0x7c8792),
  graphite: hex(0x3a3f47),
  roof: hex(0x565c66),
  stone: hex(0x70757b),
  nickel: hex(0xd3d7da),
  carpet: hex(0x4c0a10),
  carpetEdge: hex(0x33060a),
  rubber: hex(0x1b1b1d),
  marble: hex(0xc9cfdc),
  vein: hex(0x8f9296),
  wood: hex(0x6b3c20),
  woodLight: hex(0xb08a4e),
  leather: hex(0x5d5148),
  paper: hex(0xf2df63),
  paperShade: hex(0xd9c13f),
  folder: hex(0x243a5c),
  white: hex(0xe9e8e3),
  sand: hex(0xc9ad78),
  sea: hex(0x2f9fc4),
  seaDeep: hex(0x1b6f9e),
  foam: hex(0xf2f1ea),
  palm: hex(0x3f8f3a),
  palmDark: hex(0x2a6a2c),
  trunk: hex(0x8a6a43),
  sky: hex(0x8fcdf0),
  red: hex(0xc5332c)
}

let palette: THREE.DataTexture | null = null
function finishes(): THREE.DataTexture {
  if (palette) return palette
  const n = ROUGH_METAL.length
  const data = new Uint8Array(n * 4)
  ROUGH_METAL.forEach((f, i) => {
    data[i * 4] = 255
    data[i * 4 + 1] = Math.round(f[0] * 255)
    data[i * 4 + 2] = Math.round(f[1] * 255)
    data[i * 4 + 3] = 255
  })
  palette = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat)
  palette.colorSpace = THREE.NoColorSpace
  palette.magFilter = palette.minFilter = THREE.NearestFilter
  palette.generateMipmaps = false
  palette.needsUpdate = true
  return palette
}

export interface Mats {
  solid: THREE.MeshPhysicalMaterial
  glow: THREE.MeshPhysicalMaterial
  clear: THREE.MeshPhysicalMaterial
  pane: THREE.MeshPhysicalMaterial
  group: string | null
}

const GLOW = { windows: 1.15 }
const PANE = { edge: 0.45, body: 0.26 }
const made = new Map<string, Mats>()

// The three materials of the tier's models, made once for a zone and shared by all seven.
export function matsOf(z: Zone): Mats {
  const have = made.get(z.id)
  if (have) return have
  const solid = lit(steel(studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, roughnessMap: finishes(), metalnessMap: finishes() })), z), z)
  solid.name = `corporate.solid.${z.id}`
  // What gives light: its own colour, vertex by vertex, is the light it gives, at the level of its light group.
  const glow = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, roughnessMap: finishes(), metalnessMap: finishes(), emissive: new THREE.Color(...colours.CORPORATE_WINDOW), emissiveIntensity: 0 }))
  const room = glow.onBeforeCompile
  glow.onBeforeCompile = (shader, renderer) => {
    room.call(glow, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb * ( vRoughnessMapUv.y * 2.0 );\n#endif')
  }
  const key = glow.customProgramCacheKey
  glow.customProgramCacheKey = () => `${key.call(glow)}|corporate-glow`
  glow.userData.lit = true
  lit(glow, z)
  glow.name = `corporate.glow.${z.id}`
  const clear = studio(new THREE.MeshPhysicalMaterial({ color: 0x77858a, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.05, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, forceSinglePass: true }))
  const room2 = clear.onBeforeCompile
  clear.onBeforeCompile = (shader, renderer) => {
    room2.call(clear, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float wjcEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 3.0 );\ngl_FragColor.a = clamp( diffuseColor.a + wjcEdge * 0.6 + dot( outgoingLight, vec3( 0.3333 ) ) * 0.3, 0.0, 1.0 );\n#include <tonemapping_fragment>'
    )
  }
  const key2 = clear.customProgramCacheKey
  clear.customProgramCacheKey = () => `${key2.call(clear)}|corporate-clear`
  lit(clear, z)
  clear.name = `corporate.clear.${z.id}`
  // Glass with a tint of its own, vertex by vertex, and as dense as the second coordinate says.
  const pane = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 1, roughnessMap: finishes(), metalnessMap: finishes(), transparent: true, opacity: 0.4, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, forceSinglePass: true }))
  const room3 = pane.onBeforeCompile
  pane.onBeforeCompile = (shader, renderer) => {
    room3.call(pane, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float wjcEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 3.0 );\n#ifdef USE_COLOR\n\tgl_FragColor.rgb += vColor.rgb * PANE_BODY;\n#endif\ngl_FragColor.a = clamp( vRoughnessMapUv.y + wjcEdge * PANE_EDGE + dot( outgoingLight, vec3( 0.3333 ) ) * 0.35, 0.0, 1.0 );\n#include <tonemapping_fragment>'
    ).replace('PANE_EDGE', PANE.edge.toFixed(2)).replace('PANE_BODY', PANE.body.toFixed(2))
  }
  const key3 = pane.customProgramCacheKey
  pane.customProgramCacheKey = () => `${key3.call(pane)}|corporate-pane4`
  lit(pane, z)
  pane.name = `corporate.pane.${z.id}`
  const group = groupsOf(z).find((g) => g.name === 'windows')
  const out: Mats = { solid, glow, clear, pane, group: group ? group.id : null }
  made.set(z.id, out)
  return out
}

// Sets the light of everything that glows in the zone. Each of the seven may call it: it is one number.
export function poseGlow(z: Zone, ctx: RealContext): void {
  const m = made.get(z.id)
  if (!m) return
  m.glow.emissiveIntensity = GLOW.windows * (levels(ctx, z).byName.windows ?? 0)
}

// Everything added inside `fn` takes one finish. In the material that glows, `glow` is its share of the light.
export function fin(g: Geo, f: Finish, fn: () => void, glow = 1): void {
  const from = g.vertices
  fn()
  const uv: V2 = [uvOf(f)[0], glow / 2]
  g.map(from, () => uv)
}

// Everything added inside `fn` is moved by the matrix.
export function moved(g: Geo, m: THREE.Matrix4, fn: () => void): void {
  const from = g.vertices
  fn()
  g.move(from, m)
}

export const place = (x: number, y: number, z: number, rz = 0, rx = 0, ry = 0): THREE.Matrix4 => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'ZYX')), new THREE.Vector3(1, 1, 1))

export function mesh(g: Geo, m: THREE.Material, name: string, o: { cast?: boolean; fine?: boolean; group?: string | null; order?: number } = {}): THREE.Mesh {
  const out = new THREE.Mesh(g.done(), m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = true
  if (o.fine) out.userData.fine = true
  if (o.group) out.userData.lightGroup = o.group
  if (o.order !== undefined) {
    out.renderOrder = o.order
    out.userData.order = o.order
  }
  return out
}

// A screw head with a slot, standing on z, its slot turned by a rule of its place so no two lie alike.
export function screw(g: Geo, x: number, y: number, z: number, r: number, col: RGB, to?: V3): void {
  const turn = (((x * 12.9898 + y * 78.233 + z * 3.1) % 6.283) + 6.283) % 6.283
  const q = new THREE.Quaternion()
  if (to) q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...to).normalize())
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), turn))
  moved(g, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1)), () => {
    fin(g, FINISH.polished, () => {
      g.lathe([[r, 0], [r * 0.94, r * 0.22], [r * 0.7, r * 0.34], [0, r * 0.36]], 0, 0, 10, col)
      g.box(-r * 0.74, r * 0.74, -r * 0.13, r * 0.13, r * 0.3, r * 0.375, shade(col, 0.22))
    })
  })
}

// A washer under a screw.
export function washer(g: Geo, x: number, y: number, z: number, r: number, col: RGB): void {
  fin(g, FINISH.brushed, () => g.lathe([[r, 0], [r, r * 0.12], [r * 0.5, r * 0.12]], x, y, 12, col, z))
}

// The board under a run of type: a frame, a face a hair under the type and two brackets down to `foot`. The type lies on a plane tipped by `tilt` about the page's x axis, as its shape says.
export function signBoard(g: Geo, c: V3, w: number, h: number, tilt: number, foot: number, frame: RGB, face: RGB, o: { pad?: [number, number]; brackets?: boolean } = {}): void {
  const px = o.pad?.[0] ?? 12
  const py = o.pad?.[1] ?? 7
  const W = w / 2 + px
  const H = h / 2 + py
  moved(g, place(c[0], c[1], c[2], 0, tilt), () => {
    fin(g, FINISH.satin, () => g.box(-W, W, -H, H, -4.2, -0.8, face))
    fin(g, FINISH.brushed, () => {
      g.box(-W - 3, W + 3, H, H + 3, -6, 1.6, frame, { bevel: 0.8 })
      g.box(-W - 3, W + 3, -H - 3, -H, -6, 1.6, frame, { bevel: 0.8 })
      g.box(-W - 3, -W, -H, H, -6, 1.6, frame, { bevel: 0.8 })
      g.box(W, W + 3, -H, H, -6, 1.6, frame, { bevel: 0.8 })
      g.box(-W - 3, W + 3, -H - 3, H + 3, -7, -4.2, shade(frame, 0.7), { bottom: true })
    })
    screw(g, -W + 4, 0, -0.8, 1.7, frame)
    screw(g, W - 4, 0, -0.8, 1.7, frame)
  })
  if (o.brackets === false) return
  const back = Math.cos(tilt) * 7
  const drop = c[2] - Math.sin(tilt) * 0 - 6
  fin(g, FINISH.brushed, () => {
    for (const s of [-1, 1]) {
      const x = c[0] + s * (W - 14)
      g.box(x - 2, x + 2, c[1] + 1, c[1] + 1 + back, foot, Math.max(foot + 1, drop), shade(frame, 0.8))
      g.box(x - 5, x + 5, c[1] - 2, c[1] + 4 + back, foot, foot + 1.6, shade(frame, 0.8), { bevel: 0.5 })
    }
  })
}

// Where a run of type of the page stands in the zone's frame, with its size and tip, or what is given when the page has not laid it out.
export function textAt(ctx: RealContext, z: Zone, id: string, otherwise: { c: V3; w: number; h: number; tilt: number }): { c: V3; w: number; h: number; tilt: number } {
  const s: Shape | undefined = ctx.byId.get(id)
  if (!s) return otherwise
  const c = localOf(z, s)
  return { c: [c[0], c[1], c[2]], w: s.w, h: s.h, tilt: s.turnX ?? 0 }
}

export function drop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh) m.geometry.dispose()
  })
}

export const smooth = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
