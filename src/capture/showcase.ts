import * as THREE from 'three'
import build from 'virtual:build-info'
import { App, pageUnits, type CursorState, type StillSpec } from '../app'
import { config, filmSeconds, stepHz, unitStart } from '../config'
import { narration, timedLines } from '../copy'
import { assetSet } from '../core/assets'
import { pages } from '../pages'
import { look } from '../post/look'
import { standInsOf, TONES } from '../shell/view'
import { plannedHeight, typeRegister, walk } from '../shell/layout'
import { words } from '../shell/words'
import { projectPage } from '../stage/camera'
import type { PanelPlan } from '../stage/panels'
import type { CameraPose, Shape, TableState } from '../stage/types'

export type { StillSpec, CursorState }

export interface Showcase {
  ready: Promise<void>
  info(): { fps: number; format: string; tier: string; assets: string; engineHash: string; pageHashes: Record<string, string>; standIns: { name: string; unit: string }[]; modules: Record<string, string[]>; counts: Record<string, { triangles: number; drawCalls: number; standingParts?: number }>; textureMb: Record<string, number>; textures: Record<string, TextureCount>; versions: Record<string, string> }
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderStill(spec: StillSpec): Promise<void>
  sheetPanels(spec: StillSpec): PanelPlan | null
  countParts(spec: StillSpec): Promise<PartCounts>
  pictureStats(): { invalidValues: number }
  typeRegister(page: string): { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[]
  stillState(spec: StillSpec): { layout: { id: string; kind: string; planned: number[]; drawn: number[]; screen: number[]; plannedHeight: number | null; height: number; mechanism: boolean; moved: boolean }[]; type: { key: string; text: string; box: number[]; screen: number[]; px: number; contrast: number; ink: number; ground: number; contrastFrom: ContrastFrom }[]; shapes: { id: string; kind: string; part: string; screen: number[] }[]; cursor: CursorState }
  tableState(): TableState
  film(): { frameCount: number; units: { id: string; first: number; last: number }[]; beats: { id: string; first: number; last: number }[]; lines: { beat: string; first: number; last: number }[] }
  filmState(frameIndex: number): { unit: string; beat: string; camera: number[]; cursor: CursorState; events: { name: string; x: number; y: number; hitsCursor: boolean }[]; standIns: string[] }
  renderFilmFrame(frameIndex: number, tier: string): Promise<void>
  useCheckpoint(unit: string, saved: unknown): void
  opening(): { frameCount: number; seconds: number; marks: { typing: number; level: number; build: number } }
  renderOpeningFrame(frameIndex: number, tier?: string): Promise<void>
  loop(): { frameCount: number; scene: string }
  loopState(frameIndex: number): { cursorBox: number[]; threatBox: number[] }
  renderLoopFrame(frameIndex: number, tier: string): Promise<void>
}

export type ContrastFrom = 'materials' | 'stand-in tones'
export interface TextureRow { what: string; width: number; height: number; mb: number; target: boolean }
export interface TextureCount { mb: number; counted: number; held: number; assetMb: number; targetMb: number; unseenMb: number; largest?: TextureRow[] }

export interface PartRow { part: string; names: string[]; made: string; meshes: number; colour: number; through: number; shadow: Record<string, number>; calls: number; triangles: number }
export interface PartCounts { rows: PartRow[]; shadows: string[]; total: { calls: number; triangles: number }; renderer: { drawCalls: number; triangles: number }; other: { calls: number; triangles: number } }

type Rgb = [number, number, number]
type Rgba = [number, number, number, number]

const screenBox = (pose: CameraPose, x: number, y: number, w: number, h: number, z: number): number[] => {
  const at = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map((p) => projectPage(pose, p[0]!, p[1]!, z))
  const xs = at.map((p) => p.x)
  const ys = at.map((p) => p.y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
}
const MB = 1048576

const ratio = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
export const luminance = (c: Rgb): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
export const median = (list: number[]): number => {
  const s = [...list].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2
}

const CHANNELS: Record<number, number> = {
  [THREE.RGBAFormat]: 4, [THREE.RGBFormat]: 3, [THREE.RGFormat]: 2, [THREE.RedFormat]: 1, [THREE.AlphaFormat]: 1, [THREE.DepthFormat]: 1, [THREE.DepthStencilFormat]: 1,
  [THREE.RGBAIntegerFormat]: 4, [THREE.RGBIntegerFormat]: 3, [THREE.RGIntegerFormat]: 2, [THREE.RedIntegerFormat]: 1
}
const BYTES: Record<number, number> = {
  [THREE.UnsignedByteType]: 1, [THREE.ByteType]: 1, [THREE.UnsignedShortType]: 2, [THREE.ShortType]: 2, [THREE.HalfFloatType]: 2, [THREE.UnsignedIntType]: 4, [THREE.IntType]: 4, [THREE.FloatType]: 4
}
const PACKED: Record<number, number> = {
  [THREE.UnsignedShort4444Type]: 2, [THREE.UnsignedShort5551Type]: 2, [THREE.UnsignedInt248Type]: 4, [THREE.UnsignedInt5999Type]: 4, [THREE.UnsignedInt101111Type]: 4
}

// The bytes one texel takes on the graphics card, from the texture's format and type.
export function texelBytes(format: number, type: number): number {
  const packed = PACKED[type]
  if (packed !== undefined) return packed
  return (CHANNELS[format] ?? 4) * (BYTES[type] ?? 1)
}

// The texels of a picture with its chain of smaller copies, each half the size of the one before, down to one texel.
export function chainTexels(width: number, height: number, levels: number): number {
  let n = 0
  let w = Math.max(1, Math.floor(width))
  let h = Math.max(1, Math.floor(height))
  for (let i = 0; i < levels; i++) {
    n += w * h
    if (w === 1 && h === 1) break
    w = Math.max(1, w >> 1)
    h = Math.max(1, h >> 1)
  }
  return n
}

export const fullChain = (width: number, height: number): number => 1 + Math.floor(Math.log2(Math.max(1, width, height)))

interface TextureLike {
  format: number; type: number; generateMipmaps: boolean; minFilter: number
  image?: unknown; mipmaps?: { data?: { byteLength: number }; width?: number; height?: number }[]
  isCubeTexture?: boolean; isCompressedTexture?: boolean
}

// The bytes a texture holds on the graphics card: every face, every layer and every level of its chain.
export function textureSize(t: TextureLike): { width: number; height: number; depth: number } {
  const first = (t.isCubeTexture && Array.isArray(t.image) ? t.image[0] : t.image) as { width?: number; height?: number; depth?: number; videoWidth?: number; videoHeight?: number } | undefined
  const mips = t.mipmaps ?? []
  return { width: first?.width ?? first?.videoWidth ?? mips[0]?.width ?? 0, height: first?.height ?? first?.videoHeight ?? mips[0]?.height ?? 0, depth: first?.depth && first.depth > 0 ? first.depth : 1 }
}

export function textureBytes(t: TextureLike): number {
  const faces = t.isCubeTexture ? 6 : 1
  const mips = t.mipmaps ?? []
  if (t.isCompressedTexture && mips.length) return faces * mips.reduce((n, m) => n + (m.data?.byteLength ?? 0), 0)
  const { width, height, depth } = textureSize(t)
  if (!width || !height) return 0
  const chained = t.minFilter !== THREE.NearestFilter && t.minFilter !== THREE.LinearFilter
  const levels = mips.length > 1 ? mips.length : t.generateMipmaps && chained ? fullChain(width, height) : 1
  return faces * depth * chainTexels(width, height, levels) * texelBytes(t.format, t.type)
}

interface Held { texture: THREE.Texture; target: boolean }

// Every texture that can be reached from what the app draws with: the scene's materials and lights, the studio's reflection, the engine's own targets, and what the renderer itself gives a material (`also`).
function reach(roots: unknown[], also?: (o: object) => unknown): Held[] {
  const seen = new Set<object>()
  const out = new Map<THREE.Texture, Held>()
  const add = (t: THREE.Texture | null | undefined, target: boolean): void => {
    if (!t || !t.isTexture) return
    const of = target || (t as unknown as { isRenderTargetTexture?: boolean }).isRenderTargetTexture === true
    const had = out.get(t)
    if (!had) out.set(t, { texture: t, target: of })
    else if (of) had.target = true
  }
  const stack: unknown[] = [...roots]
  let budget = 2000000
  while (stack.length && budget-- > 0) {
    const v = stack.pop()
    if (v === null || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    if (seen.has(o)) continue
    seen.add(o)
    if (ArrayBuffer.isView(o) || o instanceof ArrayBuffer) continue
    if (typeof Node !== 'undefined' && o instanceof Node) continue
    if (o.isWebGLRenderer || o.isBufferGeometry || o.isBufferAttribute || o.isInterleavedBuffer) continue
    if (o.isTexture) {
      add(o as unknown as THREE.Texture, false)
      continue
    }
    if (o.isMaterial && also) stack.push(also(o))
    if (o.isRenderTarget) {
      const rt = o as unknown as THREE.WebGLRenderTarget
      for (const t of rt.textures ?? [rt.texture]) add(t, true)
      add(rt.depthTexture, true)
      continue
    }
    if (o instanceof Map) {
      for (const [k, x] of o) stack.push(k, x)
      continue
    }
    if (o instanceof Set || Array.isArray(o)) {
      for (const x of o as Iterable<unknown>) stack.push(x)
      continue
    }
    for (const k of Object.keys(o)) stack.push(o[k])
  }
  return [...out.values()]
}

// The memory of the textures the renderer holds now. A texture counts once it is on the graphics card, by the renderer's own record of it.
// `held` is the renderer's own count. What it holds and the walk did not reach is counted as a target the size of the picture with a full chain, the largest it can be.
// `known` keeps the textures met in earlier counts: a page drawn before still holds its textures, though the scene no longer leads to them.
export function textureMemory(app: App, known: Map<THREE.Texture, boolean> = new Map()): TextureCount {
  const renderer = app.engine?.renderer
  if (!renderer) return { mb: 0, counted: 0, held: 0, assetMb: 0, targetMb: 0, unseenMb: 0 }
  const props = renderer.properties as unknown as { has(o: object): boolean; get(o: object): { __webglTexture?: object } }
  const gpu = new Set<object>()
  let assets = 0
  let targets = 0
  const rows: TextureRow[] = []
  const given = (m: object): unknown => (props.has(m) ? (props.get(m) as { uniforms?: unknown }).uniforms : null)
  for (const h of reach([app.view.scene, app.environment, app.rig, app.engine], given)) known.set(h.texture, h.target || known.get(h.texture) === true)
  for (const [texture, target] of [...known]) {
    const on = props.has(texture) ? props.get(texture).__webglTexture : undefined
    if (!on) {
      known.delete(texture)
      continue
    }
    if (gpu.has(on)) continue
    gpu.add(on)
    const bytes = textureBytes(texture as unknown as TextureLike)
    if (target) targets += bytes
    else assets += bytes
    const size = textureSize(texture as unknown as TextureLike)
    rows.push({ what: texture.name || (target ? 'target' : 'picture'), width: size.width, height: size.height, mb: Number((bytes / MB).toFixed(3)), target })
  }
  rows.sort((a, b) => b.mb - a.mb)
  const held = renderer.info.memory.textures
  const unseen = Math.max(0, held - gpu.size) * chainTexels(app.engine.width, app.engine.height, fullChain(app.engine.width, app.engine.height)) * texelBytes(THREE.RGBAFormat, THREE.HalfFloatType)
  const r = (bytes: number) => Number((bytes / MB).toFixed(3))
  return { mb: r(assets + targets + unseen), counted: gpu.size, held, assetMb: r(assets), targetMb: r(targets), unseenMb: r(unseen), largest: rows.slice(0, 12) }
}

// The row of the count by part a drawn object belongs to: the part of the shape it was made for, with the ground, the type and the cursor as rows of their own.
export function rowOf(data: Record<string, unknown>): { part: string; name: string; made: 'real' | 'stand-in' | 'untagged' } {
  const name = String(data.part ?? data.standIn ?? '')
  const made = data.part !== undefined ? 'real' : data.standIn !== undefined ? 'stand-in' : 'untagged'
  if (!name) return { part: 'untagged', name: 'untagged', made }
  if (name.startsWith('cursor')) return { part: 'cursor', name, made }
  if (data.type !== undefined) return { part: 'type', name, made }
  if (data.shape === undefined) return { part: 'ground', name, made }
  return { part: name, name, made }
}

interface DrawnObject { isInstancedMesh?: boolean; count?: number; isLine?: boolean; isPoints?: boolean }
interface DrawnGeometry { index: { count: number } | null; attributes: { position?: { count: number } }; drawRange: { start: number; count: number }; isInstancedBufferGeometry?: boolean; instanceCount?: number }
interface DrawnMaterial { transparent?: boolean; side?: number; forceSinglePass?: boolean; wireframe?: boolean }

// What one object, with one group of its geometry, costs the renderer in one pass: the calls and triangles the renderer itself would count. Null when it draws nothing.
export function drawn(o: DrawnObject, g: DrawnGeometry, group: { start: number; count: number } | null, m: DrawnMaterial | null, shadow: boolean): { calls: number; triangles: number } | null {
  let start = g.drawRange.start
  let end = g.drawRange.start + g.drawRange.count
  if (group) {
    start = Math.max(start, group.start)
    end = Math.min(end, group.start + group.count)
  }
  const all = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : null
  if (all !== null) {
    start = Math.max(start, 0)
    end = Math.min(end, all)
  }
  const count = end - start
  if (count < 0 || count === Infinity) return null
  const instances = o.isInstancedMesh ? o.count ?? 1 : g.isInstancedBufferGeometry ? g.instanceCount ?? 1 : 1
  const twice = !shadow && m?.transparent === true && m.side === THREE.DoubleSide && m.forceSinglePass === false ? 2 : 1
  const triangles = o.isLine || o.isPoints || m?.wireframe === true ? 0 : (count / 3) * instances
  return { calls: twice, triangles: twice * triangles }
}

type Hook = (...a: unknown[]) => void

// Counts what the renderer draws of one scene, by part, while `draw` runs: the renderer tells every object before it draws it, once for each group of its geometry, in the colour pass and in each shadow pass.
// Only the first time the scene is drawn is counted, as info().counts does. `through` is the pass the renderer adds for materials that let light through.
export async function countByPart(renderer: THREE.WebGLRenderer, scene: THREE.Scene, draw: () => Promise<void>): Promise<{ rows: PartRow[]; shadows: string[]; total: { calls: number; triangles: number } }> {
  const proto = THREE.Object3D.prototype as unknown as { onBeforeRender: Hook; onBeforeShadow: Hook }
  const rows = new Map<string, PartRow & { seen: Set<object>; kinds: Set<string> }>()
  const lights = new Map<object, string>()
  scene.traverse((o) => {
    const l = o as unknown as { isLight?: boolean; shadow?: { camera: object }; name: string; type: string }
    if (l.isLight && l.shadow) lights.set(l.shadow.camera, l.name || l.type)
  })
  const shadows: string[] = []
  let renders = 0
  let counting = false
  let main: unknown = null
  const note = (o: THREE.Object3D, pass: string, geometry: unknown, material: unknown, group: unknown): void => {
    if (!counting || (geometry as { isBufferGeometry?: boolean } | null)?.isBufferGeometry !== true) return
    const cost = drawn(o as DrawnObject, geometry as DrawnGeometry, (group as { start: number; count: number } | null) ?? null, material as DrawnMaterial | null, pass.startsWith('shadow '))
    if (!cost) return
    const of = rowOf(o.userData)
    let row = rows.get(of.part)
    if (!row) rows.set(of.part, (row = { part: of.part, names: [], made: '', meshes: 0, colour: 0, through: 0, shadow: {}, calls: 0, triangles: 0, seen: new Set(), kinds: new Set() }))
    row.seen.add(o)
    row.kinds.add(of.made)
    if (!row.names.includes(of.name)) row.names.push(of.name)
    if (pass === 'colour') row.colour += cost.calls
    else if (pass === 'through') row.through += cost.calls
    else {
      const name = pass.slice(7)
      if (!shadows.includes(name)) shadows.push(name)
      row.shadow[name] = (row.shadow[name] ?? 0) + cost.calls
    }
    row.calls += cost.calls
    row.triangles += cost.triangles
  }
  const colour = function (this: THREE.Object3D, _r: unknown, _s: unknown, _c: unknown, geometry: unknown, material: unknown, group: unknown): void {
    note(this, renderer.getRenderTarget() === main ? 'colour' : 'through', geometry, material, group)
  } as Hook
  const shade = function (this: THREE.Object3D, _r: unknown, _o: unknown, _c: unknown, shadowCamera: unknown, geometry: unknown, material: unknown, group: unknown): void {
    note(this, `shadow ${lights.get(shadowCamera as object) ?? 'unnamed light'}`, geometry, material, group)
  } as Hook
  const own: { o: THREE.Object3D; key: 'onBeforeRender' | 'onBeforeShadow'; was: Hook }[] = []
  scene.traverse((o) => {
    for (const key of ['onBeforeRender', 'onBeforeShadow'] as const) {
      if (!Object.prototype.hasOwnProperty.call(o, key)) continue
      const was = (o as unknown as Record<string, Hook>)[key]!
      const counter = key === 'onBeforeRender' ? colour : shade
      own.push({ o, key, was })
      ;(o as unknown as Record<string, Hook>)[key] = function (this: THREE.Object3D, ...a: unknown[]): void {
        counter.apply(this, a)
        was.apply(this, a)
      }
    }
  })
  const before = { render: proto.onBeforeRender, shadow: proto.onBeforeShadow }
  const render = renderer.render
  proto.onBeforeRender = colour
  proto.onBeforeShadow = shade
  renderer.render = function (this: THREE.WebGLRenderer, s: THREE.Object3D, c: THREE.Camera): void {
    if (s !== scene) return render.call(this, s, c)
    renders++
    main = renderer.getRenderTarget()
    counting = renders === 1
    try {
      render.call(this, s, c)
    } finally {
      counting = false
    }
  }
  try {
    await draw()
  } finally {
    proto.onBeforeRender = before.render
    proto.onBeforeShadow = before.shadow
    delete (renderer as unknown as { render?: unknown }).render
    for (const x of own) (x.o as unknown as Record<string, Hook>)[x.key] = x.was
  }
  const out = [...rows.values()].map(({ seen, kinds, ...r }) => ({ ...r, meshes: seen.size, made: [...kinds].sort().join(' and '), triangles: Math.round(r.triangles) }))
  out.sort((a, b) => b.calls - a.calls || b.triangles - a.triangles || a.part.localeCompare(b.part))
  return { rows: out, shadows: shadows.sort(), total: { calls: out.reduce((n, r) => n + r.calls, 0), triangles: out.reduce((n, r) => n + r.triangles, 0) } }
}

const shown = (o: THREE.Object3D): boolean => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false
  return true
}

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)

// The colour and the cover a picture gives a surface at one place, when the picture is made of numbers this code can read.
function mapTexel(map: THREE.Texture | null | undefined, uv: THREE.Vector2 | undefined): Rgba | null {
  const image = map?.image as { data?: ArrayLike<number>; width?: number; height?: number } | undefined
  if (!map || !uv || !image?.data || !image.width || !image.height) return null
  const data = image.data
  const channels = Math.round(data.length / (image.width * image.height))
  if (channels < 3) return null
  const wrap = (v: number): number => v - Math.floor(v)
  const u = wrap(uv.x * map.repeat.x + map.offset.x)
  const w = wrap(uv.y * map.repeat.y + map.offset.y)
  const i = (Math.min(image.height - 1, Math.floor(w * image.height)) * image.width + Math.min(image.width - 1, Math.floor(u * image.width))) * channels
  const scale = data instanceof Float32Array || data instanceof Uint16Array ? 1 : 1 / 255
  const c: Rgb = [data[i]! * scale, data[i + 1]! * scale, data[i + 2]! * scale]
  const a = channels >= 4 ? data[i + 3]! * scale : 1
  return map.colorSpace === THREE.SRGBColorSpace ? [srgbToLinear(c[0]), srgbToLinear(c[1]), srgbToLinear(c[2]), a] : [c[0], c[1], c[2], a]
}

interface Surface { colour: Rgb; cover: number; through: number; tint: boolean; adds: boolean }

// The colour the corners of the face give a place on it, when the material takes its colour from them, times the colour of the copy when the mesh is drawn many times.
export function cornerColour(mesh: THREE.Mesh, hit: THREE.Intersection, material: THREE.Material | undefined): Rgba | null {
  const colour = material?.vertexColors ? (mesh.geometry.getAttribute('color') as THREE.BufferAttribute | undefined) : undefined
  const weight = (hit as { barycoord?: THREE.Vector3 }).barycoord
  const out: Rgba = [1, 1, 1, 1]
  let found = false
  if (colour && hit.face && weight) {
    const corner = [hit.face.a, hit.face.b, hit.face.c]
    const w = [weight.x, weight.y, weight.z]
    for (let k = 0; k < Math.min(4, colour.itemSize); k++) out[k] = corner.reduce((sum, v, j) => sum + w[j]! * colour.getComponent(v, k), 0)
    found = true
  }
  const copies = (mesh as unknown as THREE.InstancedMesh).instanceColor
  if (copies && hit.instanceId !== undefined) {
    for (let k = 0; k < 3; k++) out[k]! *= copies.getComponent(hit.instanceId, k)
    found = true
  }
  return found ? out : null
}

// The colour a material has in linear light: its colour, times its colour picture where one is set, plus what it gives off.
// `cover` is how much of that colour it lays down at the place: its opacity times the alpha of its pictures and of its corners' colours. A material that adds its light hides nothing under it.
export function surfaceOf(material: THREE.Material | undefined, uv?: THREE.Vector2, corners?: Rgba | null): Surface | null {
  const m = material as (THREE.MeshPhysicalMaterial & { visible: boolean }) | undefined
  if (!m || m.visible === false || !m.color || !m.color.isColor) return null
  const texel = mapTexel(m.map, uv) ?? [1, 1, 1, 1]
  const tint: Rgba = corners ?? [1, 1, 1, 1]
  const colour: Rgb = [m.color.r * texel[0] * tint[0], m.color.g * texel[1] * tint[1], m.color.b * texel[2] * tint[2]]
  if (m.emissive && m.emissive.isColor) {
    const k = m.emissiveIntensity ?? 1
    colour[0] += m.emissive.r * k
    colour[1] += m.emissive.g * k
    colour[2] += m.emissive.b * k
  }
  const clear = typeof m.transmission === 'number' && m.transmission > 0
  const alpha = texel[3] * tint[3] * (mapTexel(m.alphaMap, uv)?.[1] ?? 1)
  const cut = m.alphaTest > 0 ? (alpha >= m.alphaTest ? 1 : 0) : 1
  const cover = clear ? 1 - Math.min(1, m.transmission) : m.transparent ? Math.min(1, Math.max(0, m.opacity)) * alpha * cut : cut
  const adds = m.transparent === true && m.blending === THREE.AdditiveBlending
  return { colour, cover, through: adds ? 1 : 1 - cover, tint: clear, adds }
}

const materialAt = (mesh: THREE.Mesh, index: number | undefined): THREE.Material | undefined => (Array.isArray(mesh.material) ? mesh.material[index ?? 0] : mesh.material)
const isCursor = (data: Record<string, unknown>): boolean => String(data.part ?? data.standIn ?? '').startsWith('cursor')

// What lies under a place on the top of a run of type, seen along `down`: the first surface no higher than `LIFT` over the place that is neither type nor the cursor, and what shows through it when it is clear. Null when nothing lies there: the place is off the page.
// `glow` is the light that materials over the place add to it: it falls on the type and on the ground alike. Light added under the place falls on the ground only.
function groundAt(scene: THREE.Scene, ray: THREE.Raycaster, top: THREE.Vector3, down: THREE.Vector3): { ground: Rgb; glow: Rgb } | null {
  ray.set(top.clone().addScaledVector(down, -HIGH), down)
  const ground: Rgb = [0, 0, 0]
  const glow: Rgb = [0, 0, 0]
  let weight: Rgb = [1, 1, 1]
  let layers = 0
  let closed = false
  for (const hit of ray.intersectObject(scene, true)) {
    const mesh = hit.object as THREE.Mesh
    if (!mesh.isMesh || mesh.userData.type !== undefined || isCursor(mesh.userData) || !shown(mesh)) continue
    const height = HIGH - hit.distance
    const share = (hit as { barycoord?: THREE.Vector3 }).barycoord
    if (share && share.x + share.y + share.z === 0) continue
    const material = materialAt(mesh, hit.face?.materialIndex)
    const s = surfaceOf(material, hit.uv, cornerColour(mesh, hit, material))
    if (!s) continue
    if (s.adds) {
      for (let i = 0; i < 3; i++) (height >= 0 ? glow : ground)[i]! += (height >= 0 ? 1 : weight[i]!) * s.cover * s.colour[i]!
      continue
    }
    if (height > LIFT) continue
    for (let i = 0; i < 3; i++) ground[i]! += weight[i]! * s.cover * s.colour[i]!
    layers++
    if (s.through <= 0 || layers >= 6) {
      closed = true
      break
    }
    weight = [0, 1, 2].map((i) => weight[i]! * s.through * (s.tint ? s.colour[i]! : 1)) as Rgb
  }
  if (!layers) return null
  const back = look.background as unknown as number[]
  for (let i = 0; i < 3; i++) ground[i]! += (closed ? 0 : weight[i]! * (back[i] ?? 0)) + glow[i]!
  return { ground, glow }
}

const SAMPLES = [0.1, 0.3, 0.5, 0.7, 0.9]
const LIFT = 0.5
const HIGH = 1000

// The box of a mesh in the frame of its shape: x along the line of type, z out of the surface it lies on.
function boxIn(mesh: THREE.Mesh, toShape: THREE.Quaternion): THREE.Box3 {
  const inst = mesh as unknown as THREE.InstancedMesh
  let local: THREE.Box3 | null
  if (inst.isInstancedMesh) {
    if (!inst.boundingBox) inst.computeBoundingBox()
    local = inst.boundingBox
  } else {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    local = mesh.geometry.boundingBox
  }
  const out = new THREE.Box3()
  if (!local || local.isEmpty()) return out
  const p = new THREE.Vector3()
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? local.max.x : local.min.x, i & 2 ? local.max.y : local.min.y, i & 4 ? local.max.z : local.min.z)
    out.expandByPoint(p.applyMatrix4(mesh.matrixWorld).applyQuaternion(toShape))
  }
  return out
}

// The contrast of every run of type in the frame the view shows, from the materials the scene is drawn with.
// A run's colour is the colour of the mesh that carries its key. Its ground is read at five places along the middle line of that mesh, looking down the shape's own axis, and the middle value of the places that lie over something counts.
export function typeContrasts(scene: THREE.Scene, list: Shape[]): Map<string, { contrast: number; ink: number; ground: number }> {
  scene.updateMatrixWorld(true)
  const byShape = new Map<string, THREE.Mesh>()
  const byKey = new Map<string, THREE.Mesh[]>()
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || m.userData.type === undefined || !shown(m)) return
    const key = String(m.userData.type)
    if (m.userData.shape !== undefined && !byShape.has(`${m.userData.shape}|${key}`)) byShape.set(`${m.userData.shape}|${key}`, m)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(m)
  })
  const ray = new THREE.Raycaster()
  ray.far = 4000
  const turn = new THREE.Quaternion()
  const back = new THREE.Quaternion()
  const centre = new THREE.Vector3()
  const at = new THREE.Vector3()
  const out = new Map<string, { contrast: number; ink: number; ground: number }>()
  for (const s of list) {
    if (s.kind !== 'text') continue
    centre.set(s.x + s.w / 2 - 960, 540 - (s.y + s.h / 2), s.z1)
    let mesh = byShape.get(`${s.id}|${s.words}`)
    if (!mesh) {
      let near = Infinity
      for (const m of byKey.get(String(s.words)) ?? []) {
        if (m.userData.shape !== undefined) continue
        const d = m.getWorldPosition(at).distanceToSquared(centre)
        if (d < near) {
          near = d
          mesh = m
        }
      }
    }
    const inkOf = mesh ? surfaceOf(materialAt(mesh, 0)) : null
    if (!mesh || !inkOf) continue
    turn.setFromEuler(new THREE.Euler(s.turnX ?? 0, s.turnY ?? 0, -(s.rot ?? 0)))
    back.copy(turn).invert()
    const box = boxIn(mesh, back)
    if (box.isEmpty()) continue
    const down = new THREE.Vector3(0, 0, -1).applyQuaternion(turn)
    const grounds: number[] = []
    const inks: number[] = []
    for (const k of SAMPLES) {
      const under = groundAt(scene, ray, new THREE.Vector3(box.min.x + (box.max.x - box.min.x) * k, (box.min.y + box.max.y) / 2, box.max.z).applyQuaternion(turn), down)
      if (!under) continue
      grounds.push(luminance(under.ground))
      inks.push(luminance([inkOf.colour[0] + under.glow[0], inkOf.colour[1] + under.glow[1], inkOf.colour[2] + under.glow[2]]))
    }
    if (!grounds.length) continue
    const ground = median(grounds)
    const ink = median(inks)
    out.set(s.id, { contrast: ratio(ink, ground), ink, ground })
  }
  return out
}

// The stand-in measure: the tone of the run against the tone of the highest shape under it. Used only for a run the scene holds no mesh for.
function toneGround(list: Shape[], s: Shape): number {
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  let best = -Infinity
  let tone = TONES.page
  for (const o of list) {
    if (o.kind === 'text' || o.kind === 'well' || o.kind === 'anchor' || o === s) continue
    if (cx < o.x || cx > o.x + o.w || cy < o.y || cy > o.y + o.h) continue
    const top = o.pocket ? o.z0 : o.z1
    if (top > s.z1 + 0.5 || top < best) continue
    best = top
    tone = TONES[o.pocket && o.tone !== 'dark' ? 'pocket' : o.tone]
  }
  return tone
}

export function makeShowcase(app: App, ready: Promise<void>): Showcase {
  const fps = config.film.fps
  const frameOf = (seconds: number) => Math.round(seconds * fps)
  const memory = new Map<string, TextureCount>()
  const known = new Map<THREE.Texture, boolean>()
  let last: string | null = null
  const weigh = (): void => {
    if (last !== null) memory.set(last, textureMemory(app, known))
  }
  const drew = (unit: string): void => {
    last = unit
    weigh()
  }

  return {
    ready,
    info() {
      const counts: Record<string, { triangles: number; drawCalls: number }> = {}
      const textureMb: Record<string, number> = {}
      const textures: Record<string, TextureCount> = {}
      weigh()
      for (const unit of pageUnits) {
        counts[unit] = app.countsOf(unit)
        textures[unit] = memory.get(unit) ?? { mb: 0, counted: 0, held: 0, assetMb: 0, targetMb: 0, unseenMb: 0 }
        textureMb[unit] = textures[unit]!.mb
      }
      return { fps, format: app.format.id, tier: app.tier, assets: app.assets, engineHash: build.engineHash, pageHashes: build.pageHashes, standIns: app.standIns(), modules: build.modules, counts, textureMb, textures, versions: { ...build.versions, target: app.engine.kind } }
    },
    async setFormat(id) {
      await ready
      app.setFormat(id)
    },
    async setAssets(id) {
      await ready
      app.assets = assetSet(id)
    },
    setDiagnostic(view) {
      app.setDiagnostic(view)
    },
    async renderStill(spec) {
      await ready
      await app.renderStill(spec)
      drew(spec.page)
    },
    sheetPanels(spec) {
      return app.sheetPanels(spec)
    },
    async countParts(spec) {
      await ready
      await app.renderStill(spec)
      const got = await countByPart(app.engine.renderer, app.view.scene, () => app.renderStill(spec))
      drew(spec.page)
      const told = app.countsOf(spec.page)
      return { ...got, renderer: told, other: { calls: told.drawCalls - got.total.calls, triangles: Math.round(told.triangles) - got.total.triangles } }
    },
    pictureStats() {
      return { invalidValues: app.engine.invalidValues() }
    },
    typeRegister(page) {
      const out: { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[] = []
      for (const id of pages[page] ? [page] : app.pagesOf(page)) for (const r of typeRegister(pages[id]!().layout)) out.push({ key: r.key, text: r.text, states: r.states, made: r.made })
      return out
    },
    stillState(spec) {
      const { frame, pose, page, size } = app.still(spec)
      const drawn = new Map(frame.list.map((s) => [s.id, s]))
      const layout: { id: string; kind: string; planned: number[]; drawn: number[]; screen: number[]; plannedHeight: number | null; height: number; mechanism: boolean; moved: boolean }[] = []
      walk(page.layout, (n) => {
        const s = drawn.get(n.id)
        if (!s || s.kind === 'text' || s.kind === 'well') return
        layout.push({ id: n.id, kind: n.kind, planned: [...n.box], drawn: [s.x, s.y, s.w, s.h], screen: screenBox(pose, s.x, s.y, s.w, s.h, s.pocket ? s.z0 : s.z1), plannedHeight: plannedHeight(n.kind), height: s.pocket ? s.z0 : s.z1, mechanism: s.mechanism === true, moved: s.moved === true })
      })
      let real = new Map<string, { contrast: number; ink: number; ground: number }>()
      try {
        app.view.apply(frame, size ?? { width: page.width, height: page.height })
        real = typeContrasts(app.view.scene, frame.list)
      } catch {
        real = new Map()
      }
      const type = frame.list.filter((s) => s.kind === 'text').map((s) => {
        const run = { key: s.words!, text: words(s.words!, s.text), box: [s.x, s.y, s.w, s.h], screen: screenBox(pose, s.x, s.y, s.w, s.h, s.z1), px: s.type!.px }
        const hit = real.get(s.id)
        if (hit) return { ...run, contrast: hit.contrast, ink: hit.ink, ground: hit.ground, contrastFrom: 'materials' as ContrastFrom }
        const ink = TONES[s.tone]
        const ground = toneGround(frame.list, s)
        return { ...run, contrast: ratio(ink, ground), ink, ground, contrastFrom: 'stand-in tones' as ContrastFrom }
      })
      const shapes = frame.list.filter((s) => s.kind !== 'text' && s.kind !== 'well').map((s) => ({ id: s.id, kind: s.kind, part: s.part, screen: screenBox(pose, s.x, s.y, s.w, s.h, s.pocket ? s.z0 : s.z1) }))
      return { layout, type, shapes, cursor: app.cursorState(frame.cursor, pose) }
    },
    tableState() {
      const table = app.pageOf('pinball').tableState?.()
      return table ?? { tiers: [], openings: [], rails: [], holds: [], sealed: [] }
    },
    film() {
      const units = config.film.units.map((u) => ({ id: u.id, first: frameOf(unitStart(u.id)), last: frameOf(unitStart(u.id) + u.seconds) - 1 }))
      const beats = config.film.beats.map((b) => ({ id: b.id, first: frameOf(unitStart(b.unit) + b.from), last: frameOf(unitStart(b.unit) + b.to) - 1 }))
      const lines = timedLines(config, narration).map((l) => ({ beat: l.beat, first: frameOf(l.start), last: Math.max(frameOf(l.start), frameOf(l.end) - 1) }))
      return { frameCount: frameOf(filmSeconds()), units, beats, lines }
    },
    filmState(frameIndex) {
      const { unit, time } = app.filmMoment(frameIndex)
      const { frame, pose, page } = app.filmFrame(unit, time)
      const stage = app.film(unit)
      const from = app.stepOf(time)
      const to = from + stepHz / fps
      if (stage.step < to) stage.advance(to - stage.step)
      const b = config.film.beats.find((x) => x.unit === unit && time >= x.from - 1e-9 && time < x.to - 1e-9) ?? config.film.beats.filter((x) => x.unit === unit).at(-1)!
      const events = stage.eventsBetween(from, to).map((e) => {
        const p = app.eventPlace(pose, e.x, e.y)
        return { name: e.name, x: p.x, y: p.y, hitsCursor: e.hitsCursor }
      })
      return { unit, beat: b.id, camera: [...pose.eye, ...pose.target, pose.fov], cursor: app.cursorState(frame.cursor, pose), events, standIns: standInsOf(frame, page).sort() }
    },
    useCheckpoint(unit, saved) {
      app.useCheckpoint(unit, saved)
    },
    async renderFilmFrame(frameIndex, tier) {
      await ready
      await app.renderFilmFrame(frameIndex, tier)
      drew(app.filmMoment(frameIndex).unit)
    },
    opening() {
      const piece = app.opening()
      return { frameCount: piece.frameCount, seconds: piece.seconds, marks: { ...piece.marks } }
    },
    async renderOpeningFrame(frameIndex, tier) {
      await ready
      await app.renderPiece(app.opening(), frameIndex, tier ?? app.tier, frameIndex + 1)
    },
    loop() {
      const piece = app.loop()
      return { frameCount: piece.frameCount, scene: piece.scene }
    },
    loopState(frameIndex) {
      const s = app.loop().state(frameIndex)
      return { cursorBox: [s.cursor.x, s.cursor.y, s.cursor.w, s.cursor.h], threatBox: [s.threat.x, s.threat.y, s.threat.w, s.threat.h] }
    },
    async renderLoopFrame(frameIndex, tier) {
      await ready
      const piece = app.loop()
      const n = piece.frameCount
      await app.renderPiece(piece, frameIndex, tier, (((frameIndex % n) + n) % n) + 1)
    }
  }
}
