import * as THREE from 'three'
import { Accumulator, type TargetKind } from './accumulator'
import { samples, type Sample } from './sampler'
import { Post } from '../post/post'
import { look } from '../post/look'

// What the lamps must cover, in world units: the page and everything that stands on it.
export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

export class LightRig {
  readonly key = new THREE.DirectionalLight()
  readonly dome = new THREE.DirectionalLight()
  private axisU = new THREE.Vector3()
  private axisV = new THREE.Vector3()
  private base = new THREE.Vector3()
  private bounds: Bounds = { minX: -960, maxX: 960, minY: -540, maxY: 540, minZ: -40, maxZ: 120 }
  private m = new THREE.Matrix4()
  private v = new THREE.Vector3()
  level = 1

  constructor() {
    this.base.set(...look.key.direction).normalize()
    this.axisU.crossVectors(new THREE.Vector3(0, 0, 1), this.base).normalize()
    this.axisV.crossVectors(this.base, this.axisU).normalize()
    this.key.castShadow = true
    this.dome.castShadow = true
    this.key.shadow.bias = -0.00035
    this.key.shadow.normalBias = 0.5
    this.dome.shadow.bias = -0.0006
    this.dome.shadow.normalBias = 0.9
    this.setQuality(look.key.shadowMapPx, look.dome.shadowMapPx)
  }

  setQuality(keyPx: number, domePx: number): void {
    this.key.shadow.mapSize.set(keyPx, keyPx)
    this.dome.shadow.mapSize.set(domePx, domePx)
    this.key.shadow.radius = look.key.shadowRadius
    this.dome.shadow.radius = look.dome.shadowRadius
    for (const light of [this.key, this.dome]) {
      if (light.shadow.map) {
        light.shadow.map.dispose()
        light.shadow.map = null
      }
    }
  }

  addTo(scene: THREE.Scene): void {
    scene.add(this.key, this.key.target, this.dome, this.dome.target)
  }

  setBounds(b: Bounds): void {
    this.bounds = b
  }

  private aim(light: THREE.DirectionalLight, dx: number, dy: number, dz: number): void {
    const b = this.bounds
    const cx = (b.minX + b.maxX) / 2
    const cy = (b.minY + b.maxY) / 2
    const reach = Math.hypot(b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ)
    light.target.position.set(cx, cy, 0)
    light.position.set(cx + dx * reach, cy + dy * reach, dz * reach)
    light.target.updateMatrixWorld()
    light.updateMatrixWorld()
    this.m.lookAt(light.position, light.target.position, light.up).setPosition(light.position).invert()
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (let i = 0; i < 8; i++) {
      this.v.set(i & 1 ? b.maxX : b.minX, i & 2 ? b.maxY : b.minY, i & 4 ? b.maxZ : b.minZ).applyMatrix4(this.m)
      minX = Math.min(minX, this.v.x)
      maxX = Math.max(maxX, this.v.x)
      minY = Math.min(minY, this.v.y)
      maxY = Math.max(maxY, this.v.y)
      minZ = Math.min(minZ, this.v.z)
      maxZ = Math.max(maxZ, this.v.z)
    }
    const cam = light.shadow.camera
    cam.left = minX
    cam.right = maxX
    cam.bottom = minY
    cam.top = maxY
    cam.near = Math.max(1, -maxZ - 4)
    cam.far = -minZ + 4
    cam.updateProjectionMatrix()
  }

  // Puts the key at this sample's point of its area and the fill at this sample's point of the dome.
  place(s: Sample): void {
    const r = Math.tan(look.key.radius)
    const d = this.v.copy(this.base).addScaledVector(this.axisU, s.light[0] * r).addScaledVector(this.axisV, s.light[1] * r).normalize()
    const [dx, dy, dz] = [d.x, d.y, d.z]
    this.key.color.setRGB(...look.key.colour)
    this.key.intensity = look.key.intensity * this.level
    this.aim(this.key, dx, dy, dz)
    this.dome.color.setRGB(...look.dome.colour)
    this.dome.intensity = look.dome.intensity * this.level
    this.aim(this.dome, s.dome[0], s.dome[1], s.dome[2])
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

  constructor(canvas: HTMLCanvasElement, width: number, height: number, opts: { preserve: boolean; forceKind?: TargetKind }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: opts.preserve, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(width, height, false)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.info.autoReset = false
    this.renderer.setClearColor(new THREE.Color(...look.background), 1)
    this.width = width
    this.height = height
    this.acc = new Accumulator(this.renderer, width, height, opts.forceKind)
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
  private sample(shot: Shot, s: Sample, view: string): void {
    const r = this.renderer
    shot.pose?.(s.shutter)
    shot.rig.place(s)
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
      this.sample(shot, list[i]!, o.diagnostic)
      if (i === 0) this.lastCounts = { triangles: this.renderer.info.render.triangles, drawCalls: this.renderer.info.render.calls }
      if (i % 2 === 1) await new Promise<void>((done) => setTimeout(done, 0))
    }
    this.present(o.frame, o.diagnostic)
    this.settle()
  }

  // The live site's path: one sample, drawn now.
  frame(shot: Shot, s: Sample, restart: boolean, frame: number, view: string): void {
    if (restart) this.acc.begin()
    this.sample(shot, s, view)
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
