import * as THREE from 'three'
import { Accumulator, type TargetKind } from './accumulator'
import { areaSplit, domeSpread, filterTaps, samples, type Sample } from './sampler'
import { Post } from '../post/post'
import { look } from '../post/look'
import { chooseEmitters, lampIntensity } from '../post/emitters'
import { EMITTER_BODY_PX, lightLaw, shadowFilter } from '../post/studio'
import type { Emitter } from '../real/types'
import { quality, type QualityId } from './quality'
import { levelPlan, REST_FRAMES, restSample, type LevelPlan } from './levelPlan'
import { SampleBounds } from './levelClamp'
import { RestBlend, restShare } from './levelRest'
import { StillShadows, type StillStats } from './levelShadows'

// What the lamps must cover, in world units: the page and everything that stands on it.
export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

const QUALITY: { minKeyPx: number; pool: number; shadows: number }[] = [
  { minKeyPx: 4096, pool: look.emitters.pool, shadows: look.emitters.shadows },
  { minKeyPx: 2048, pool: 4, shadows: 1 },
  { minKeyPx: 0, pool: 2, shadows: 0 }
]
// The heights the shadow map is fitted to. Things outside them still throw and take shadows inside the page.
const FIT_Z: [number, number] = [-40, 120]
const MIN_DOME_SHADOW_PX = 1024

// How far the map leans so that the page's upward axis, seen from the light through `m`, runs along the map's columns.
export function squareLean(m: THREE.Matrix4): number {
  const e = m.elements
  return Math.abs(e[5]!) > 1e-9 ? -e[4]! / e[5]! : 0
}

export class LightRig {
  readonly key = new THREE.DirectionalLight()
  readonly dome = new THREE.DirectionalLight()
  readonly lamps: THREE.PointLight[] = []
  private scene: THREE.Scene | null = null
  private levelSet: QualityId | null | undefined = undefined
  private pool = look.emitters.pool
  private shadows = look.emitters.shadows
  private axisU = new THREE.Vector3()
  private axisV = new THREE.Vector3()
  private base = new THREE.Vector3()
  private bounds: Bounds = { minX: -960, maxX: 960, minY: -540, maxY: 540, minZ: -40, maxZ: 120 }
  private rect = { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  private m = new THREE.Matrix4()
  private v = new THREE.Vector3()
  private w = new THREE.Vector3()
  private up = new THREE.Vector3()
  private shear = new THREE.Matrix4()
  level = 1
  emitters: Emitter[] = []

  constructor() {
    this.base.set(...look.key.direction).normalize()
    this.axisU.crossVectors(new THREE.Vector3(0, 0, 1), this.base).normalize()
    this.axisV.crossVectors(this.base, this.axisU).normalize()
    this.key.castShadow = true
    this.dome.castShadow = true
    for (let i = 0; i < look.emitters.pool; i++) {
      const lamp = new THREE.PointLight(0xffffff, 0, 100, 2)
      lamp.name = `emitter-${i}`
      lamp.shadow.mapSize.set(look.emitters.shadowMapPx, look.emitters.shadowMapPx)
      lamp.shadow.bias = -0.0015
      lamp.shadow.normalBias = 0.4
      lamp.shadow.camera.near = 2
      this.lamps.push(lamp)
    }
    this.setQuality(look.key.shadowMapPx, look.dome.shadowMapPx)
  }

  // What a level of the live site gets: the size of the shadow maps, whether the fill has shadows,
  // how many emitters are true lights and how many of those throw a shadow.
  setQuality(keyPx: number, domePx: number): void {
    this.levelSet = undefined
    this.resize(keyPx, domePx)
  }

  // One call for whoever draws: a level of `live.quality`, or null for a computed picture with everything on.
  // High: the key at its level's size, the fill's shadows, 6 lamps and 2 of them with shadows. Medium: half the size,
  // the fill's shadows, 4 lamps and 1. Low: a quarter, the key's shadow pass alone, 2 lamps and none with a shadow.
  setLevel(level: QualityId | null): void {
    if (level === this.levelSet) return
    if (level === null) this.resize(look.key.shadowMapPx, look.dome.shadowMapPx)
    else this.resize(quality(level).shadowMapPx, quality(level).shadowMapPx / 2)
    this.levelSet = level
  }

  private resize(keyPx: number, domePx: number): void {
    this.key.shadow.mapSize.set(keyPx, keyPx)
    this.dome.shadow.mapSize.set(domePx, domePx)
    this.dome.castShadow = domePx >= MIN_DOME_SHADOW_PX
    const q = QUALITY.find((l) => keyPx >= l.minKeyPx)!
    this.pool = Math.min(q.pool, this.lamps.length)
    this.shadows = Math.min(q.shadows, this.pool)
    this.lamps.forEach((lamp, i) => {
      lamp.castShadow = i < this.shadows
      lamp.shadow.autoUpdate = false
      lamp.shadow.needsUpdate = true
    })
    for (const light of [this.key, this.dome, ...this.lamps]) {
      if (light.shadow.map) {
        light.shadow.map.dispose()
        light.shadow.map = null
      }
    }
    this.join()
  }

  private join(): void {
    if (!this.scene) return
    this.lamps.forEach((lamp, i) => {
      if (i < this.pool) this.scene!.add(lamp)
      else this.scene!.remove(lamp)
    })
  }

  addTo(scene: THREE.Scene): void {
    this.scene = scene
    scene.add(this.key, this.key.target, this.dome, this.dome.target)
    this.join()
  }

  setBounds(b: Bounds): void {
    this.bounds = b
  }

  // The lights the parts give off in this frame, in world units.
  setEmitters(list: Emitter[]): void {
    this.emitters = list
  }

  // The part of the page the camera sees, where it looks at the page from the front. Otherwise the whole of the bounds.
  private seen(camera: THREE.Camera | undefined): void {
    const b = this.bounds
    const r = this.rect
    r.minX = b.minX
    r.maxX = b.maxX
    r.minY = b.minY
    r.maxY = b.maxY
    if (!camera) return
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < 4; i++) {
      this.v.set(i & 1 ? 1 : -1, i & 2 ? 1 : -1, -1).unproject(camera)
      this.w.set(i & 1 ? 1 : -1, i & 2 ? 1 : -1, 1).unproject(camera)
      const t = this.v.z / (this.v.z - this.w.z)
      if (!(t > 0 && t < 1)) return
      this.v.lerp(this.w, t)
      minX = Math.min(minX, this.v.x)
      maxX = Math.max(maxX, this.v.x)
      minY = Math.min(minY, this.v.y)
      maxY = Math.max(maxY, this.v.y)
    }
    const margin = 24
    minX = Math.max(b.minX, minX - margin)
    maxX = Math.min(b.maxX, maxX + margin)
    minY = Math.max(b.minY, minY - margin)
    maxY = Math.min(b.maxY, maxY + margin)
    if (!(maxX - minX > 1 && maxY - minY > 1)) return
    r.minX = minX
    r.maxX = maxX
    r.minY = minY
    r.maxY = maxY
  }

  // Aims a lamp at the part of the page on show and fits its shadow map to it: square, so a texel is as wide as it is high.
  // `tan` is the tangent of half the angle of the piece of the light's area this sample stands for.
  // `square` turns and shears the map so that the page's two axes run along the map's rows and columns: the edge of a
  // thing that lies square on the page then falls into one row of texels and its shadow has no steps. Only a live frame
  // of a level that holds its light still asks for it; a computed picture never does.
  private aim(light: THREE.DirectionalLight, dx: number, dy: number, dz: number, tan: number, of: { biasPx: number; normalBiasPx: number; shadowMapPx: number }, s: Sample, alone: boolean, square = false): void {
    const b = this.bounds
    const r = this.rect
    const cx = (r.minX + r.maxX) / 2
    const cy = (r.minY + r.maxY) / 2
    const above = Math.max(0, b.maxZ) / dz
    const below = Math.min(0, b.minZ) / dz
    const reach = Math.hypot(r.maxX - r.minX, r.maxY - r.minY) + above + 200
    light.target.position.set(cx, cy, 0)
    light.position.set(cx + dx * reach, cy + dy * reach, dz * reach)
    if (square) this.up.set(0, dz, -dy).normalize()
    else this.up.set(0, 1, 0)
    light.up.copy(this.up)
    light.shadow.camera.up.copy(this.up)
    light.target.updateMatrixWorld()
    light.updateMatrixWorld()
    this.m.lookAt(light.position, light.target.position, light.up).setPosition(light.position).invert()
    const lean = square ? squareLean(this.m) : 0
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let near = Infinity
    let far = -Infinity
    for (let i = 0; i < 8; i++) {
      const z = i & 4 ? Math.min(b.maxZ, FIT_Z[1]) : Math.max(b.minZ, FIT_Z[0])
      this.v.set(i & 1 ? r.maxX : r.minX, i & 2 ? r.maxY : r.minY, z).applyMatrix4(this.m)
      this.v.x += lean * this.v.y
      minX = Math.min(minX, this.v.x)
      maxX = Math.max(maxX, this.v.x)
      minY = Math.min(minY, this.v.y)
      maxY = Math.max(maxY, this.v.y)
      this.v.set(i & 1 ? r.maxX : r.minX, i & 2 ? r.maxY : r.minY, 0).applyMatrix4(this.m)
      near = Math.min(near, -this.v.z)
      far = Math.max(far, -this.v.z)
    }
    const px = light.shadow.mapSize.x
    const side = Math.max(maxX - minX, maxY - minY) * (1 + 2 / px)
    const texel = side / px
    const mx = (minX + maxX) / 2 + s.texel[0] * texel
    const my = (minY + maxY) / 2 + s.texel[1] * texel
    const cam = light.shadow.camera
    cam.left = mx - side / 2
    cam.right = mx + side / 2
    cam.bottom = my - side / 2
    cam.top = my + side / 2
    cam.near = Math.max(1, near - above - 4)
    cam.far = far - below + 4
    cam.updateProjectionMatrix()
    if (lean !== 0) {
      this.shear.identity()
      this.shear.elements[4] = lean
      cam.projectionMatrix.multiply(this.shear)
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
    }
    const depth = cam.far - cam.near
    const coarse = Math.max(1, of.shadowMapPx / px)
    light.shadow.bias = (-of.biasPx * coarse) / depth
    light.shadow.normalBias = of.normalBiasPx * coarse
    light.shadow.radius = Math.floor((depth * tan) / texel) + (alone ? 0.5 : Math.min(0.998, Math.max(0, s.phase)))
  }

  private light(s: Sample, split: { move: number }): void {
    const lamps = chooseEmitters(this.emitters, this.pool, this.shadows)
    const used = new Set<number>()
    const slot = (casting: boolean): number => {
      for (let i = 0; i < this.pool; i++) if (!used.has(i) && i < this.shadows === casting) return i
      for (let i = 0; i < this.pool; i++) if (!used.has(i)) return i
      return -1
    }
    for (const l of lamps) {
      const i = slot(l.shadow)
      if (i < 0) break
      used.add(i)
      const lamp = this.lamps[i]!
      const size = look.emitters.sizePx * split.move
      lamp.position.set(l.x + s.light[0] * size, l.y + s.light[1] * size, l.z)
      lamp.color.setRGB(l.colour[0], l.colour[1], l.colour[2])
      lamp.intensity = lampIntensity(l.power, EMITTER_BODY_PX)
      lamp.distance = l.reach
      lamp.shadow.camera.far = Math.max(8, l.reach)
      const casts = lamp.castShadow && l.shadow
      lamp.shadow.intensity = casts ? 1 : 0
      lamp.shadow.autoUpdate = casts
    }
    for (let i = 0; i < this.pool; i++) {
      if (used.has(i)) continue
      const lamp = this.lamps[i]!
      lamp.intensity = 0
      lamp.shadow.autoUpdate = false
    }
  }

  // A part open at the back, a shell or a sheet, would throw the shadow of its far walls only. Both sides of every
  // solid surface go into the shadow maps, so what the light sees first is what throws the shadow. Glass keeps its own rule.
  private close(): void {
    this.scene?.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || !mesh.castShadow) return
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!m || m.shadowSide !== null || m.transparent || (m as THREE.MeshPhysicalMaterial).transmission > 0) continue
        m.shadowSide = THREE.DoubleSide
      }
    })
  }

  // Puts the key at this sample's point of its area and the fill at this sample's point of the dome, each blurred by
  // the piece of the light it stands for, and turns this frame's emitters into the lamps of the pool.
  // `alone` is a picture of one sample: the light stays in the middle and the filter does all the softening.
  // `hold` is a live frame of a level that does not gather the light's area: the light stays in the middle as in a
  // picture of one sample, and each frame takes its own share of the filter's taps.
  place(s: Sample, camera?: THREE.Camera, alone = s.count === 1, hold = false): void {
    if (alone || s.index === 0) this.close()
    const one = alone || hold
    const split = areaSplit(one ? 1 : s.count)
    const r = Math.tan(look.key.radius)
    const d = this.v.copy(this.base).addScaledVector(this.axisU, s.light[0] * r * split.move).addScaledVector(this.axisV, s.light[1] * r * split.move).normalize()
    const [dx, dy, dz] = [d.x, d.y, d.z]
    this.seen(camera)
    this.key.color.setRGB(...look.key.colour)
    this.key.intensity = look.key.intensity * this.level
    this.aim(this.key, dx, dy, dz, r * split.blur, look.key, s, alone, hold)
    this.dome.color.setRGB(...look.dome.colour)
    const up = one ? 1 : s.dome[2]
    this.dome.intensity = (look.dome.intensity * this.level) / up
    if (one) this.aim(this.dome, 0, 0, 1, domeSpread(1), look.dome, s, alone, hold)
    else this.aim(this.dome, s.dome[0], s.dome[1], up, domeSpread(s.count), look.dome, s, alone)
    const cx = (this.rect.minX + this.rect.maxX) / 2
    const cy = (this.rect.minY + this.rect.maxY) / 2
    const at = look.key.at
    lightLaw.keyAt.value.set(cx + at[0], cy + at[1], at[2], at[0] * at[0] + at[1] * at[1] + at[2] * at[2])
    lightLaw.envDiffuse.value = look.envDiffuse
    lightLaw.keySpecular.value = look.keySpecular
    lightLaw.cap.value.set(look.glow.surfaceKnee, look.glow.surfaceMax)
    lightLaw.shade.value.set(look.studio.shadeKey, look.studio.shadeFill, look.studio.floorKept)
    const taps = filterTaps(one ? 1 : s.count, shadowFilter.tapsPerPicture, shadowFilter.minTaps, shadowFilter.blurTaps)
    const code = taps + 32 * (alone ? 1 : s.count)
    this.key.shadow.intensity = code
    this.dome.shadow.intensity = code
    this.light(s, split)
  }
}

export interface Shot {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  rig: LightRig
  // Puts everything that moves at this share of the shutter. Absent for a picture that holds still.
  pose?: (shutter: number) => void
  // The lens of the camera, read after `pose`: the distance that is sharp and the width of the opening, in page pixels.
  // Absent, or with no opening, everything is sharp.
  lens?: { focus: number; aperture: number } | null
  // The frame's draw list, for a level that keeps its still shadows: a shape that differs from the frame before has moved.
  list?: readonly { id: string }[]
}

export interface PictureOptions {
  samples: number
  // Seeds the grain, so each frame of a film has its own and a still always has the same.
  frame: number
  diagnostic: string
}

export class Engine {
  readonly renderer: THREE.WebGLRenderer
  readonly kind: TargetKind
  private acc: Accumulator
  private post = new Post()
  width: number
  height: number
  lastCounts = { triangles: 0, drawCalls: 0 }
  private lens: { near: number; far: number; focus: number; reach: number } | null = null
  beforeSample: ((shot: Shot, view: string) => (() => void) | void) | null = null
  private plan: LevelPlan | null = null
  private still = new StillShadows()
  private keeps = false
  private rest = new RestBlend()
  blendsRest = true
  private sampleBounds: SampleBounds | null = null

  constructor(canvas: HTMLCanvasElement, width: number, height: number, opts: { preserve: boolean; forceKind?: TargetKind; multisamples?: number }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: opts.preserve, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(width, height, false)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.BasicShadowMap
    this.renderer.info.autoReset = false
    // Solid things are drawn in an order that does not ask how far away they are. Two faces in one plane that meet
    // at an edge then always win the same pixels, whatever was on show before this frame.
    this.renderer.setOpaqueSort((a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.material.id - b.material.id || a.id - b.id)
    this.renderer.setClearColor(new THREE.Color(...look.background), 1)
    this.width = width
    this.height = height
    this.acc = new Accumulator(this.renderer, width, height, opts.forceKind, opts.multisamples ?? 0)
    this.kind = this.acc.kind
    if ((opts.multisamples ?? 0) > 0 && this.kind !== 'byte') this.sampleBounds = new SampleBounds()
  }

  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.renderer.setSize(width, height, false)
    this.acc.setSize(width, height)
  }

  // The level of `live.quality` the live frames are drawn at, or null for a computed picture.
  setLevel(level: QualityId | null): void {
    this.plan = level === null ? null : levelPlan(level)
  }

  get levelPlan(): LevelPlan | null {
    return this.plan
  }

  get stillShadows(): StillStats {
    return this.still.stats
  }

  // Draws one sample into the mean. The caller decides how many and when to show the result.
  private sample(shot: Shot, s: Sample, view: string, alone: boolean, hold = false, keep = false): void {
    const r = this.renderer
    shot.pose?.(s.shutter)
    shot.camera.updateMatrixWorld()
    lightLaw.viewInverse.value.copy(shot.camera.matrixWorld)
    shot.rig.place(s, shot.camera, alone, hold)
    if (keep && view === 'beauty') {
      this.still.prepare(r, shot.scene, shot.rig.key, shot.list)
      this.keeps = true
    } else if (this.keeps) {
      this.still.release(shot.rig.key)
      this.keeps = false
    }
    shot.camera.setViewOffset(this.width, this.height, s.pixel[0], s.pixel[1], this.width, this.height)
    const l = view === 'beauty' && this.kind !== 'byte' && shot.lens && shot.lens.aperture > 0 && shot.lens.focus > 0 ? shot.lens : null
    this.acc.keepDepth(l !== null)
    // `reach` is the radius in pixels of the blur circle of a thing endlessly far away.
    this.lens = l ? { near: shot.camera.near, far: shot.camera.far, focus: l.focus, reach: (l.aperture * this.height) / (4 * l.focus * Math.tan((shot.camera.fov * Math.PI) / 360)) } : null
    const restore = this.beforeSample?.(shot, view)
    r.setRenderTarget(this.acc.sample)
    r.clear(true, true, false)
    r.render(shot.scene, shot.camera)
    this.sampleBounds?.apply(r, this.acc.sample)
    if (restore) restore()
    shot.camera.clearViewOffset()
    this.acc.add()
  }

  async picture(shot: Shot, o: PictureOptions): Promise<void> {
    const list = samples(o.samples)
    this.acc.begin()
    this.renderer.info.reset()
    for (let i = 0; i < list.length; i++) {
      this.sample(shot, list[i]!, o.diagnostic, list.length === 1)
      if (i === 0) this.lastCounts = { triangles: this.renderer.info.render.triangles, drawCalls: this.renderer.info.render.calls }
      if (i % 2 === 1) await new Promise<void>((done) => setTimeout(done, 0))
    }
    this.present(o.frame, o.diagnostic, false)
    this.settle()
  }

  // The live site's path: one sample, drawn now.
  // A page at rest is gathered over the frames its level's shadows ask for, then the picture is kept as it is.
  frame(shot: Shot, s: Sample, restart: boolean, frame: number, view: string): void {
    const mode = this.plan?.shadows ?? 'accumulated'
    const own = restart ? s : restSample(mode, s)
    if (!own) return
    const gathers = mode === 'accumulated'
    if (restart) {
      this.acc.begin()
      this.rest.drop()
    } else if (gathers && this.blendsRest && this.acc.samples === 1) this.rest.hold(this.renderer, this.acc.texture, this.acc.width, this.acc.height, this.kind)
    this.sample(shot, own, view, restart, !gathers, mode === 'baked')
    const share = gathers && this.rest.held ? restShare(this.acc.samples, REST_FRAMES.accumulated) : 1
    this.present(frame, view, true, this.rest.blend(this.renderer, this.acc.texture, share))
  }

  private present(frame: number, view: string, quick: boolean, picture: THREE.Texture = this.acc.texture): void {
    const depth = this.acc.depth
    this.post.draw(this.renderer, picture, frame, view !== 'beauty', this.kind === 'byte', this.lens && depth ? { ...this.lens, depth, quick } : null)
  }

  // WebGL calls return before the picture is done. Reading a pixel back waits for it.
  settle(): void {
    const gl = this.renderer.getContext()
    this.renderer.setRenderTarget(null)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
  }

  invalidValues(): number {
    return this.acc.invalidValues()
  }

  get samplesDone(): number {
    return this.acc.samples
  }
}
