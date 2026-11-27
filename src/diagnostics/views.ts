import * as THREE from 'three'
import { hashName } from '../core/random'
import type { LayoutNode } from '../copy'
import type { CameraPose, Collider, DrawList, Shape, TableState } from '../stage/types'

export const views = ['beauty', 'standins', 'layout', 'type', 'texels', 'shadow', 'height', 'ids', 'coverage', 'lights', 'colliders', 'events'] as const

export interface ViewEvent { name: string; x: number; y: number; hitsCursor: boolean; age: number }

export interface ViewContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  width: number
  height: number
  pose: CameraPose | null
  layout: LayoutNode | null
  list: DrawList
  events: ViewEvent[]
  lights: THREE.Light[]
  table: () => TableState | null
  colliders: () => Collider[]
}

export const HEIGHT_KNEE = 64
export const TEXEL_RANGE = 4
export const COC_RANGE = 8
export const EVENT_TRAIL = 30

// `lights` alone is the first light group. `lights.NAME` is the group of that name.
export const isView = (view: string): boolean => (views as readonly string[]).includes(view) || /^lights\.[A-Za-z0-9_-]+$/.test(view)

export function standInColour(name: string): [number, number, number] {
  const h = hashName(name)
  return [0.35 + 0.65 * ((h & 255) / 255), 0.1 + 0.3 * (((h >>> 8) & 255) / 255), 0.35 + 0.65 * (((h >>> 16) & 255) / 255)]
}

// One fully bright colour per name: its largest channel is 1, so a pixel of the `ids` view that is under one half is nothing at all.
export function idColour(name: string): [number, number, number] {
  const h = hashName(name)
  const hue = ((h & 1023) / 1024) * 6
  const low = 0.02 + 0.33 * (((h >>> 10) & 255) / 255)
  const f = hue - Math.floor(hue)
  const up = low + (1 - low) * f
  const down = low + (1 - low) * (1 - f)
  const six: [number, number, number][] = [[1, up, low], [down, 1, low], [low, 1, up], [low, down, 1], [up, low, 1], [1, low, down]]
  return six[Math.floor(hue) % 6]!
}

// Height off the page surface as a grey: one half is the surface, and the curve flattens far from it so that a keycap and a tier's floor both read.
export const heightToGrey = (z: number): number => 0.5 + (0.5 * z) / (Math.abs(z) + HEIGHT_KNEE)
export const greyToHeight = (v: number): number => {
  const s = Math.min(0.999, Math.max(-0.999, 2 * v - 1))
  return (HEIGHT_KNEE * s) / (1 - Math.abs(s))
}

export const lightGroupOf = (light: { name: string; userData: Record<string, unknown> }, index: number): string => (light.userData.lightGroup as string | undefined) ?? (light.name || `light-${index + 1}`)

export function lightGroups(lights: { name: string; userData: Record<string, unknown> }[]): string[] {
  const out: string[] = []
  lights.forEach((l, i) => {
    const g = lightGroupOf(l, i)
    if (!out.includes(g)) out.push(g)
  })
  return out
}

export type Cover = 'floor' | 'mark' | 'none'

// What a mesh is in the `coverage` view. A mesh may say it itself (`userData.coverage`). Without that, the bare floor is the table's layout surface, and all else that is drawn marks it.
export function coverOf(data: Record<string, unknown>): Cover {
  const said = data.coverage as Cover | undefined
  if (said) return said
  if ((data.part ?? data.standIn) === 'table-layout' && !data.shape && !data.type) return 'floor'
  return 'mark'
}

// A printed surface says which of its pixels are printed with a mask on `userData.coverageMap`: white where there is a printed line or shape, black where the floor is bare.
const coverShades = new Map<THREE.Texture, THREE.MeshBasicMaterial>()
function coverShade(mask: THREE.Texture): THREE.MeshBasicMaterial {
  let m = coverShades.get(mask)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: mask })
    coverShades.set(mask, m)
  }
  return m
}

export function layoutBoxes(tree: LayoutNode | null): { id: string; kind: string; box: number[] }[] {
  const out: { id: string; kind: string; box: number[] }[] = []
  const visit = (n: LayoutNode): void => {
    out.push({ id: n.id, kind: n.kind, box: [...n.box] })
    for (const child of n.children ?? []) visit(child)
  }
  if (tree) visit(tree)
  return out
}

export const eventFade = (age: number): number => Math.max(0.15, 1 - age / EVENT_TRAIL)

const basics = new Map<string, THREE.MeshBasicMaterial>()
function basic(r: number, g: number, b: number, over = false, opacity = 1): THREE.MeshBasicMaterial {
  const key = `${r}|${g}|${b}|${over}|${opacity}`
  let m = basics.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: over ? THREE.DoubleSide : THREE.FrontSide, depthTest: !over, depthWrite: !over, transparent: opacity < 1, opacity })
    basics.set(key, m)
  }
  return m
}

const plain = basic(0.02, 0.02, 0.02)
const dim = basic(0.05, 0.05, 0.06)
const white = basic(1, 1, 1)
const black = basic(0, 0, 0)

let heightMaterial: THREE.ShaderMaterial | null = null
function heightShade(): THREE.ShaderMaterial {
  heightMaterial ??= new THREE.ShaderMaterial({
    uniforms: { knee: { value: HEIGHT_KNEE } },
    vertexShader: 'varying float vZ; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vZ = w.z; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float knee; varying float vZ; void main() { gl_FragColor = vec4(vec3(0.5 + 0.5 * vZ / (abs(vZ) + knee)), 1.0); }',
  })
  return heightMaterial
}

let shadowMaterial: THREE.ShadowMaterial | null = null
function shadowShade(): THREE.ShadowMaterial {
  if (!shadowMaterial) {
    shadowMaterial = new THREE.ShadowMaterial()
    shadowMaterial.transparent = false
    shadowMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );', 'gl_FragColor = vec4( vec3( getShadowMask() ), 1.0 );')
    }
  }
  return shadowMaterial
}

const texelVertex = 'varying vec2 vUv; varying float vDepth; void main() { vUv = uv; vec4 v = modelViewMatrix * vec4(position, 1.0); vDepth = -v.z; gl_Position = projectionMatrix * v; }'
const cocGlsl = 'uniform float aperture; uniform float focus; uniform float pxPerUnit; uniform float cocRange; varying float vDepth; float coc() { return aperture <= 0.0 ? 0.0 : clamp(aperture * abs(vDepth - focus) / max(vDepth, 0.0001) * pxPerUnit / cocRange, 0.0, 1.0); }'
const lens = { aperture: { value: 0 }, focus: { value: 1 }, pxPerUnit: { value: 1 }, cocRange: { value: COC_RANGE } }
const texelShades = new Map<string, THREE.ShaderMaterial>()
let untextured: THREE.ShaderMaterial | null = null

function texelShade(map: THREE.Texture | null | undefined): THREE.ShaderMaterial {
  const image = map?.image as { width?: number; height?: number } | undefined
  if (!map || !image?.width || !image.height) {
    untextured ??= new THREE.ShaderMaterial({ uniforms: lens, vertexShader: texelVertex, fragmentShader: `${cocGlsl} varying vec2 vUv; void main() { gl_FragColor = vec4(0.0, 0.0, coc(), 1.0); }` })
    return untextured
  }
  const key = `${image.width}|${image.height}|${map.repeat.x}|${map.repeat.y}`
  let m = texelShades.get(key)
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { ...lens, size: { value: new THREE.Vector2(image.width * map.repeat.x, image.height * map.repeat.y) }, texelRange: { value: TEXEL_RANGE } },
      vertexShader: texelVertex,
      fragmentShader: `${cocGlsl} uniform vec2 size; uniform float texelRange; varying vec2 vUv; void main() { vec2 t = vUv * size; float d = min(length(dFdx(t)), length(dFdy(t))); gl_FragColor = vec4(clamp(d / texelRange, 0.0, 1.0), 1.0, coc(), 1.0); }`,
    })
    texelShades.set(key, m)
  }
  return m
}

class Change {
  private undo: (() => void)[] = []
  private made: THREE.Object3D[] = []
  constructor(readonly scene: THREE.Scene) {}

  paint(pick: (mesh: THREE.Mesh) => THREE.Material | null): void {
    const saved: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const next = pick(m)
      if (!next) return
      saved.push([m, m.material])
      m.material = next
    })
    this.undo.push(() => {
      for (const [m, material] of saved) m.material = material
    })
  }

  ground(r: number, g: number, b: number): void {
    const before = this.scene.background
    this.scene.background = new THREE.Color(r, g, b)
    this.undo.push(() => {
      this.scene.background = before
    })
  }

  set<T extends object, K extends keyof T>(target: T, key: K, value: T[K]): void {
    const before = target[key]
    target[key] = value
    this.undo.push(() => {
      target[key] = before
    })
  }

  add(o: THREE.Object3D): void {
    this.made.push(o)
    this.scene.add(o)
  }

  done(): () => void {
    return () => {
      for (const o of this.made) {
        this.scene.remove(o)
        o.traverse((c) => {
          const m = c as THREE.Mesh
          if (m.isMesh) m.geometry.dispose()
        })
      }
      for (let i = this.undo.length - 1; i >= 0; i--) this.undo[i]!()
    }
  }
}

const OVER = 100000
const unit = new THREE.PlaneGeometry(1, 1)

function quad(x: number, y: number, w: number, h: number, z: number, material: THREE.Material, rot = 0): THREE.Mesh {
  const m = new THREE.Mesh(unit.clone(), material)
  m.position.set(x - 960, 540 - y, z)
  m.rotation.z = -rot
  m.scale.set(w, h, 1)
  m.renderOrder = OVER
  m.frustumCulled = false
  return m
}

// A line between two points of the page, as a thin quad that always draws.
function line(a: [number, number], b: [number, number], z: number, thick: number, material: THREE.Material): THREE.Mesh {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  return quad((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(len, thick), thick, z, material, Math.atan2(b[1] - a[1], b[0] - a[0]))
}

function outline(box: number[], z: number, thick: number, material: THREE.Material, s?: Shape): THREE.Object3D {
  const [x, y, w, h] = box as [number, number, number, number]
  const g = new THREE.Group()
  g.position.set(x + w / 2 - 960, 540 - (y + h / 2), z)
  if (s) g.rotation.set(s.turnX ?? 0, s.turnY ?? 0, -(s.rot ?? 0))
  const side = (cx: number, cy: number, sw: number, sh: number): void => {
    const m = new THREE.Mesh(unit.clone(), material)
    m.position.set(cx, cy, 0)
    m.scale.set(sw, sh, 1)
    m.renderOrder = OVER
    m.frustumCulled = false
    g.add(m)
  }
  side(0, h / 2 - thick / 2, w, thick)
  side(0, -h / 2 + thick / 2, w, thick)
  side(-w / 2 + thick / 2, 0, thick, h)
  side(w / 2 - thick / 2, 0, thick, h)
  return g
}

function ring(x: number, y: number, r: number, z: number, thick: number, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.01, r - thick), r, 40), material)
  m.position.set(x - 960, 540 - y, z)
  m.renderOrder = OVER
  m.frustumCulled = false
  return m
}

const kindColour = (kind: string, opacity = 1): THREE.MeshBasicMaterial => {
  const c = idColour(`kind:${kind}`)
  return basic(c[0], c[1], c[2], true, opacity)
}

function paintLights(ctx: ViewContext, change: Change, view: string): void {
  const groups = lightGroups(ctx.lights)
  const want = view === 'lights' ? groups[0] : view.slice('lights.'.length)
  if (want === undefined || !groups.includes(want)) throw new Error(`No light group called "${want ?? ''}". There ${groups.length === 1 ? 'is' : 'are'}: ${groups.join(', ') || 'none'}`)
  ctx.lights.forEach((l, i) => {
    if (lightGroupOf(l, i) !== want) change.set(l, 'intensity', 0)
  })
  change.set(ctx.scene, 'environmentIntensity', 0)
  const seen = new Set<THREE.Material>()
  ctx.scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || m.userData.lightGroup === want) return
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      const lit = mat as THREE.MeshStandardMaterial
      if (seen.has(mat) || !lit.emissive || !lit.emissiveIntensity) continue
      seen.add(mat)
      change.set(lit, 'emissiveIntensity', 0)
    }
  })
}

function paintTexels(ctx: ViewContext, change: Change): void {
  const pose = ctx.pose
  lens.aperture.value = pose?.aperture ?? 0
  const focus = pose?.focus ?? (pose ? Math.hypot(pose.eye[0] - pose.target[0], pose.eye[1] - pose.target[1], pose.eye[2] - pose.target[2]) : 1)
  lens.focus.value = focus
  lens.pxPerUnit.value = ctx.height / (2 * focus * Math.tan(((pose?.fov ?? ctx.camera.fov) * Math.PI) / 360))
  change.ground(0, 0, 0)
  // A mesh that only shades what lies under it, and says so, is left out: the surface under it is what the eye sees there.
  ctx.scene.traverse((o) => {
    if (o.userData.texels === 'through' && o.visible) change.set(o, 'visible', false)
  })
  change.paint((m) => texelShade(Array.isArray(m.material) ? null : (m.material as THREE.MeshStandardMaterial).map))
}

// Draws the scene as a diagnostic view, and gives back what puts everything right again. `beauty` changes nothing.
export function applyView(view: string, ctx: ViewContext): (() => void) | void {
  if (view === 'beauty') return
  if (!isView(view)) throw new Error(`No diagnostic view called "${view}"`)
  const change = new Change(ctx.scene)
  const name = view.startsWith('lights') ? 'lights' : view
  if (name === 'standins') {
    change.paint((m) => {
      const part = m.userData.standIn as string | undefined
      return part ? basic(...standInColour(part)) : plain
    })
  } else if (name === 'ids') {
    change.ground(0, 0, 0)
    change.paint((m) => basic(...idColour((m.userData.part as string | undefined) ?? (m.userData.standIn as string | undefined) ?? 'unnamed')))
  } else if (name === 'height') {
    change.ground(0, 0, 0.2)
    change.paint(() => heightShade())
  } else if (name === 'shadow') {
    change.ground(1, 1, 1)
    change.paint(() => shadowShade())
  } else if (name === 'texels') {
    paintTexels(ctx, change)
  } else if (name === 'lights') {
    paintLights(ctx, change, view)
  } else if (name === 'coverage') {
    change.ground(0.2, 0.2, 0.2)
    change.paint((m) => {
      const mask = m.userData.coverageMap as THREE.Texture | undefined
      if (mask) return coverShade(mask)
      const c = coverOf(m.userData)
      return c === 'floor' ? black : c === 'mark' ? white : basic(0.2, 0.2, 0.2)
    })
  } else if (name === 'type') {
    change.ground(1, 1, 1)
    change.paint((m) => (m.userData.type ? black : white))
    const edge = basic(0, 0.35, 1, true)
    for (const s of ctx.list) if (s.kind === 'text') change.add(outline([s.x, s.y, s.w, s.h], Math.max(0, s.z1) + 0.2, 1.5, edge, s))
  } else if (name === 'layout') {
    for (const n of layoutBoxes(ctx.layout)) change.add(outline(n.box, 0, 2, kindColour(n.kind)))
  } else if (name === 'events') {
    for (const e of ctx.events) {
      const fade = eventFade(e.age)
      const m = e.hitsCursor ? basic(1, 0.05, 0.05, true, fade) : basic(0, 0.9, 1, true, fade)
      const r = e.age === 0 ? 30 : 18
      change.add(ring(e.x, e.y, r, 0, e.age === 0 ? 5 : 3, m))
      if (e.age === 0) {
        change.add(line([e.x - r - 12, e.y], [e.x + r + 12, e.y], 0, 3, m))
        change.add(line([e.x, e.y - r - 12], [e.x, e.y + r + 12], 0, 3, m))
      }
    }
  } else if (name === 'colliders') {
    change.ground(0, 0, 0)
    change.paint(() => dim)
    for (const c of ctx.colliders()) {
      const m = kindColour(c.kind)
      const p = c.points
      if (c.r !== undefined && p.length >= 2) {
        change.add(ring(p[0]!, p[1]!, c.r, c.z, Math.max(2, Math.min(4, c.r)), m))
        for (let i = 2; i + 1 < p.length; i += 2) change.add(line([p[i - 2]!, p[i - 1]!], [p[i]!, p[i + 1]!], c.z, 2 * c.r, kindColour(c.kind, 0.45)))
        continue
      }
      for (let i = 2; i + 1 < p.length; i += 2) change.add(line([p[i - 2]!, p[i - 1]!], [p[i]!, p[i + 1]!], c.z, 3, m))
      if (c.closed && p.length >= 6) change.add(line([p[p.length - 2]!, p[p.length - 1]!], [p[0]!, p[1]!], c.z, 3, m))
    }
  }
  return change.done()
}
