import * as THREE from 'three'
import { Accumulator, type TargetKind } from './accumulator'
import { areaSplit, domeSpread, filterTaps, samples, type Sample } from './sampler'
import { Post } from '../post/post'
import { look } from '../post/look'
import { chooseEmitters, lampIntensity } from '../post/emitters'
import { EMITTER_BODY_PX, lightLaw, shadowFilter } from '../post/studio'
import type { Emitter } from '../real/types'

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

export class LightRig {
  readonly key = new THREE.DirectionalLight()
  readonly dome = new THREE.DirectionalLight()
  readonly lamps: THREE.PointLight[] = []
  private scene: THREE.Scene | null = null
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
  level = 1
  emitters: Emitter[] = []

  constructor() {
    this.base.set(...look.key.direction).normalize()
    this.axisU.crossVectors(new THREE.Vector3(0, 0, 1), this.base).normalize()
    this.axisV.crossVectors(this.base, this.axisU).normalize()
    this.key.castShadow = true
    this.dome.castShadow = true
    this.key.shadow.normalBias = look.key.normalBiasPx
    this.dome.shadow.normalBias = look.dome.normalBiasPx
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
  private aim(light: THREE.DirectionalLight, dx: number, dy: number, dz: number, tan: number, biasPx: number, s: Sample, alone: boolean): void {
    const b = this.bounds
    const r = this.rect
    const cx = (r.minX + r.maxX) / 2
    const cy = (r.minY + r.maxY) / 2
    const above = Math.max(0, b.maxZ) / dz
    const below = Math.min(0, b.minZ) / dz
    const reach = Math.hypot(r.maxX - r.minX, r.maxY - r.minY) + above + 200
    light.target.position.set(cx, cy, 0)
    light.position.set(cx + dx * reach, cy + dy * reach, dz * reach)
    light.target.updateMatrixWorld()
    light.updateMatrixWorld()
    this.m.lookAt(light.position, light.target.position, light.up).setPosition(light.position).invert()
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let near = Infinity
    let far = -Infinity
    for (let i = 0; i < 8; i++) {
      const z = i & 4 ? Math.min(b.maxZ, FIT_Z[1]) : Math.max(b.minZ, FIT_Z[0])
      this.v.set(i & 1 ? r.maxX : r.minX, i & 2 ? r.maxY : r.minY, z).applyMatrix4(this.m)
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
    const depth = cam.far - cam.near
    light.shadow.bias = -biasPx / depth
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
      lamp.shadow.autoUpdate = lamp.castShadow
    }
    for (let i = 0; i < this.pool; i++) {
      if (used.has(i)) continue
      const lamp = this.lamps[i]!
      lamp.intensity = 0
      lamp.shadow.autoUpdate = false
    }
  }

  // Puts the key at this sample's point of its area and the fill at this sample's point of the dome, each blurred by
  // the piece of the light it stands for, and turns this frame's emitters into the lamps of the pool.
  // `alone` is a picture of one sample: the light stays in the middle and the filter does all the softening.
  place(s: Sample, camera?: THREE.Camera, alone = s.count === 1): void {
    const split = areaSplit(alone ? 1 : s.count)
    const r = Math.tan(look.key.radius)
    const d = this.v.copy(this.base).addScaledVector(this.axisU, s.light[0] * r * split.move).addScaledVector(this.axisV, s.light[1] * r * split.move).normalize()
    const [dx, dy, dz] = [d.x, d.y, d.z]
    this.seen(camera)
    this.key.color.setRGB(...look.key.colour)
    this.key.intensity = look.key.intensity * this.level
    this.aim(this.key, dx, dy, dz, r * split.blur, look.key.biasPx, s, alone)
    this.dome.color.setRGB(...look.dome.colour)
    const up = alone ? 1 : s.dome[2]
    this.dome.intensity = (look.dome.intensity * this.level) / up
    if (alone) this.aim(this.dome, 0, 0, 1, domeSpread(1), look.dome.biasPx, s, alone)
    else this.aim(this.dome, s.dome[0], s.dome[1], up, domeSpread(s.count), look.dome.biasPx, s, alone)
    const cx = (this.rect.minX + this.rect.maxX) / 2
    const cy = (this.rect.minY + this.rect.maxY) / 2
    const at = look.key.at
    lightLaw.keyAt.value.set(cx + at[0], cy + at[1], at[2], at[0] * at[0] + at[1] * at[1] + at[2] * at[2])
    lightLaw.envDiffuse.value = look.envDiffuse
    lightLaw.keySpecular.value = look.keySpecular
    lightLaw.cap.value.set(look.glow.surfaceKnee, look.glow.surfaceMax)
    const taps = filterTaps(alone ? 1 : s.count, shadowFilter.tapsPerPicture, shadowFilter.minTaps, shadowFilter.blurTaps)
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
  beforeSample: ((shot: Shot, view: string) => (() => void) | void) | null = null

  constructor(canvas: HTMLCanvasElement, width: number, height: number, opts: { preserve: boolean; forceKind?: TargetKind; multisamples?: number }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: opts.preserve, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(width, height, false)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.BasicShadowMap
    this.renderer.info.autoReset = false
    this.renderer.setClearColor(new THREE.Color(...look.background), 1)
    this.width = width
    this.height = height
    this.acc = new Accumulator(this.renderer, width, height, opts.forceKind, opts.multisamples ?? 0)
    this.kind = this.acc.kind
  }

  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.renderer.setSize(width, height, false)
    this.acc.setSize(width, height)
  }

  // Draws one sample into the mean. The caller decides how many and when to show the result.
  private sample(shot: Shot, s: Sample, view: string, alone: boolean): void {
    const r = this.renderer
    shot.pose?.(s.shutter)
    shot.camera.updateMatrixWorld()
    lightLaw.viewInverse.value.copy(shot.camera.matrixWorld)
    shot.rig.place(s, shot.camera, alone)
    shot.camera.setViewOffset(this.width, this.height, s.pixel[0], s.pixel[1], this.width, this.height)
    const restore = this.beforeSample?.(shot, view)
    r.setRenderTarget(this.acc.sample)
    r.clear(true, true, false)
    r.render(shot.scene, shot.camera)
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
    this.present(o.frame, o.diagnostic)
    this.settle()
  }

  // The live site's path: one sample, drawn now.
  frame(shot: Shot, s: Sample, restart: boolean, frame: number, view: string): void {
    if (restart) this.acc.begin()
    this.sample(shot, s, view, restart)
    this.present(frame, view)
  }

  private present(frame: number, view: string): void {
    this.post.draw(this.renderer, this.acc.texture, frame, view !== 'beauty', this.kind === 'byte')
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
