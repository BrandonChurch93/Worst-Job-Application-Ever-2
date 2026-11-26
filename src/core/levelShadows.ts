import * as THREE from 'three'

// The numbers of the kept shadows that the kit does not set.
export const STILL = {
  // A thing that has not changed for this many frames counts as still and goes into the kept map at the next bake.
  holdFrames: 12,
  // The shadow camera must have stood for this many frames before a map is kept.
  cameraFrames: 2,
  // A thing that broke a kept map by changing waits twice as long each time before it is kept again, up to two to this power.
  maxBreaks: 6
}

const MOVES = 1
const STANDS = 2
const BAKE = 31

interface Track { sig: number; changedAt: number; seenAt: number; breaks: number; shape: string | undefined; always: boolean }

export interface StillStats { bakes: number; keptFrames: number; liveFrames: number; movers: number; kept: number; cameraMoved: number; keptChanged: number; settled: number }

const quadVertex = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = position.xy * 0.5 + 0.5;
	gl_Position = vec4( position.xy, 0.0, 1.0 );
}`
const quadFragment = /* glsl */ `
uniform sampler2D tKept;
varying vec2 vUv;
void main() {
	gl_FragColor = vec4( 1.0 );
	gl_FragDepth = texture2D( tKept, vUv ).r;
}`

const hash = (m: THREE.Mesh): number => {
  const e = m.matrixWorld.elements
  let h = m.geometry.id * 0.6180339887
  for (let i = 0; i < 16; i++) h = h * 1.0000001 + e[i]! * (i + 1.37)
  const p = m.geometry.attributes.position as THREE.BufferAttribute | undefined
  h += (p ? p.version : 0) * 7.13
  const inst = (m as THREE.InstancedMesh).instanceMatrix as THREE.InstancedBufferAttribute | undefined
  if (inst) h += inst.version * 3.77 + (m as THREE.InstancedMesh).count * 1.91
  const morph = m.morphTargetInfluences
  if (morph) for (let i = 0; i < morph.length; i++) h += morph[i]! * (i + 2.3)
  const range = m.geometry.drawRange
  h += range.start * 0.37 + (Number.isFinite(range.count) ? range.count : -1) * 0.59
  const mat = m.material as THREE.Material | THREE.Material[]
  if (Array.isArray(mat)) for (const x of mat) h += x.id * 0.11 + (x.visible ? 0.7 : 0)
  else if (mat) h += mat.id * 0.11 + (mat.visible ? 0.7 : 0)
  return h
}

// What stands still is drawn into the key's shadow map once and kept. What moves is drawn into the map every frame, on top of the kept depths.
// The kept map is three's own shadow pass over the still things, so a kept frame and a frame drawn whole hold the same depths.
// Whenever a kept thing changes, or the shadow camera moves, the frame is drawn whole as it would be without this.
export class StillShadows {
  private tracks = new Map<THREE.Mesh, Track>()
  private keptSet = new Set<THREE.Mesh>()
  private kept: THREE.WebGLRenderTarget | null = null
  private spare: THREE.WebGLRenderTarget | null = null
  private shapes = new Map<string, string>()
  private shapeChanged = new Set<string>()
  private camera = new THREE.Matrix4()
  private cameraAt = new THREE.Matrix4()
  private keptCamera = new THREE.Matrix4()
  private cameraStill = 0
  private frame = 0
  private valid = false
  private on = false
  private readonly quad: THREE.Mesh
  private readonly away = new THREE.PerspectiveCamera()
  private readonly tiny = new THREE.WebGLRenderTarget(1, 1)
  private readonly uniforms = { tKept: { value: null as THREE.Texture | null } }
  readonly stats: StillStats = { bakes: 0, keptFrames: 0, liveFrames: 0, movers: 0, kept: 0, cameraMoved: 0, keptChanged: 0, settled: 0 }

  constructor() {
    const none = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, shadowSide: THREE.DoubleSide })
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), none)
    this.quad.name = 'kept-shadows'
    this.quad.customDepthMaterial = new THREE.ShaderMaterial({ vertexShader: quadVertex, fragmentShader: quadFragment, uniforms: this.uniforms, side: THREE.DoubleSide })
    this.quad.castShadow = true
    this.quad.receiveShadow = false
    this.quad.frustumCulled = false
    this.quad.layers.set(MOVES)
    this.away.layers.set(BAKE)
  }

  // Which shapes of the frame's list differ from the frame before.
  private read(list: readonly { id: string }[] | undefined): void {
    this.shapeChanged.clear()
    if (!list) return
    const seen = new Set<string>()
    for (const s of list) {
      const text = JSON.stringify(s)
      seen.add(s.id)
      if (this.shapes.get(s.id) !== text) {
        this.shapes.set(s.id, text)
        this.shapeChanged.add(s.id)
      }
    }
    if (this.shapes.size > seen.size) for (const id of this.shapes.keys()) if (!seen.has(id)) this.shapes.delete(id)
  }

  // Every mesh that throws a shadow in this frame, with when it last changed.
  private walk(scene: THREE.Scene): THREE.Mesh[] {
    const out: THREE.Mesh[] = []
    scene.updateMatrixWorld()
    scene.traverseVisible((o) => {
      const m = o as THREE.Mesh
      if (!(m.isMesh || (o as THREE.Line).isLine || (o as THREE.Points).isPoints) || !m.castShadow || m === this.quad) return
      let t = this.tracks.get(m)
      const sig = hash(m)
      if (!t) {
        const part = String(m.userData.part ?? '')
        t = { sig, changedAt: this.frame, seenAt: this.frame, breaks: 0, shape: m.userData.shape as string | undefined, always: part.startsWith('cursor') || (m as THREE.SkinnedMesh).isSkinnedMesh === true || m.customDepthMaterial !== undefined }
        this.tracks.set(m, t)
      } else {
        if (t.sig !== sig || t.seenAt !== this.frame - 1 || (t.shape !== undefined && this.shapeChanged.has(t.shape))) t.changedAt = this.frame
        t.sig = sig
        t.seenAt = this.frame
      }
      out.push(m)
    })
    return out
  }

  private moves(t: Track): boolean {
    return t.always || this.frame - t.changedAt < STILL.holdFrames * 2 ** t.breaks
  }

  // Called for a live frame at a level that keeps its still shadows, after the light is placed and before the frame is drawn.
  prepare(renderer: THREE.WebGLRenderer, scene: THREE.Scene, key: THREE.DirectionalLight, list?: readonly { id: string }[]): void {
    this.frame++
    this.on = true
    if (this.quad.parent !== scene) scene.add(this.quad)
    key.layers.enable(BAKE)
    this.camera.lookAt(key.position, key.target.position, key.up).setPosition(key.position).invert().premultiply(key.shadow.camera.projectionMatrix)
    if (this.camera.equals(this.cameraAt)) this.cameraStill++
    else {
      this.cameraStill = 0
      this.cameraAt.copy(this.camera)
    }
    this.read(list)
    const meshes = this.walk(scene)

    const size = key.shadow.mapSize.x
    if (this.valid) {
      let ok = this.kept !== null && this.kept.width === size && this.camera.equals(this.keptCamera)
      if (!ok) this.stats.cameraMoved++
      else {
        for (const m of this.keptSet) {
          const t = this.tracks.get(m)!
          if (t.seenAt === this.frame && t.changedAt <= this.keptAt) continue
          t.breaks = Math.min(STILL.maxBreaks, t.breaks + 1)
          t.changedAt = this.frame
          ok = false
        }
        if (!ok) this.stats.keptChanged++
      }
      if (!ok) this.valid = false
    }
    let bake = false
    let settled = 0
    for (const m of meshes) if (!(this.valid && this.keptSet.has(m)) && !this.moves(this.tracks.get(m)!)) settled++
    if (!this.valid) bake = settled > 0 && this.cameraStill >= STILL.cameraFrames
    else {
      bake = settled > 0
      if (bake) this.stats.settled++
    }
    if (bake) this.bake(renderer, scene, key, meshes)
    if (this.tracks.size > meshes.length * 2 + 64) for (const [m, t] of this.tracks) if (t.seenAt !== this.frame && !this.keptSet.has(m)) this.tracks.delete(m)

    if (!this.valid) {
      this.stats.liveFrames++
      this.stats.movers = meshes.length
      this.stats.kept = 0
      this.quad.visible = false
      key.shadow.camera.layers.set(0)
      key.shadow.autoUpdate = true
      return
    }
    let movers = 0
    for (const m of meshes) {
      if (this.keptSet.has(m)) m.layers.disable(MOVES)
      else {
        m.layers.enable(MOVES)
        movers++
      }
    }
    this.stats.keptFrames++
    this.stats.movers = movers
    this.stats.kept = this.keptSet.size
    this.uniforms.tKept.value = this.kept!.depthTexture
    this.quad.visible = true
    key.shadow.camera.layers.set(MOVES)
    key.shadow.autoUpdate = false
    key.shadow.needsUpdate = true
  }

  private keptAt = 0

  // One shadow pass over the still things alone, through a camera that sees nothing else, into a map that is then kept.
  private bake(renderer: THREE.WebGLRenderer, scene: THREE.Scene, key: THREE.DirectionalLight, meshes: THREE.Mesh[]): void {
    this.keptSet.clear()
    for (const m of meshes) {
      if (this.moves(this.tracks.get(m)!)) m.layers.disable(STANDS)
      else {
        m.layers.enable(STANDS)
        this.keptSet.add(m)
      }
    }
    const size = key.shadow.mapSize.x
    const mine = key.shadow.map as THREE.WebGLRenderTarget | null
    const next = this.spare && this.spare.width === size ? this.spare : null
    if (this.spare && !next) this.drop(this.spare)
    this.spare = null
    key.shadow.map = next
    this.quad.visible = false
    key.shadow.camera.layers.set(STANDS)
    key.shadow.autoUpdate = false
    key.shadow.needsUpdate = true
    const target = renderer.getRenderTarget()
    renderer.setRenderTarget(this.tiny)
    renderer.render(scene, this.away)
    renderer.setRenderTarget(target)
    if (this.kept) {
      if (this.kept.width === size) this.spare = this.kept
      else this.drop(this.kept)
    }
    this.kept = key.shadow.map as THREE.WebGLRenderTarget | null
    key.shadow.map = mine && mine.width === size ? mine : null
    if (mine && key.shadow.map !== mine) this.drop(mine)
    this.keptCamera.copy(this.camera)
    this.keptAt = this.frame
    this.valid = this.kept !== null
    this.stats.bakes++
  }

  private drop(t: THREE.WebGLRenderTarget): void {
    t.depthTexture?.dispose()
    t.dispose()
  }

  // Back to a light that draws its whole map every frame: for every picture this is not asked for.
  release(key: THREE.DirectionalLight): void {
    if (!this.on) return
    this.on = false
    this.valid = false
    this.cameraStill = 0
    this.quad.visible = false
    this.quad.removeFromParent()
    key.shadow.camera.layers.set(0)
    key.shadow.autoUpdate = true
    for (const t of [this.kept, this.spare]) if (t) this.drop(t)
    this.kept = null
    this.spare = null
    this.keptSet.clear()
    this.tracks.clear()
    this.shapes.clear()
  }
}
