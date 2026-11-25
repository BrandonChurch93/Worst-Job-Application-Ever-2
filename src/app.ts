import * as THREE from 'three'
import build from 'virtual:build-info'
import { beat as beatOf, config, configProblems, fail, formatById, stepHz, tierSamples, unitStart } from './config'
import { contentProblems, copy, narration, type LayoutNode } from './copy'
import { eventCues } from './audio/cues'
import { assetSet, type AssetSet } from './core/assets'
import { Engine, LightRig, type Shot } from './core/renderer'
import type { TargetKind } from './core/accumulator'
import { applyView, views } from './diagnostics/views'
import { look } from './post/look'
import { makeMaterials, studioEnvironment, type Materials } from './shell/materials'
import { loadFont } from './shell/type'
import { makeSpike } from './spike/spike'
import { ScriptDriver, Stage, type CursorState, type Driver, type PageRuntime } from './stage/stage'

export interface Loaded { page: PageRuntime; stage: Stage; rig: LightRig; script: Driver }

export interface StillSpec { page: string; beat?: string; at?: number; scroll?: number; camera: string; tier: string; sheet?: string; interface?: boolean; touchOnly?: boolean; live?: string }

const FONTS = ['inter-400', 'inter-500', 'inter-600', 'inter-display-600', 'playfair-700', 'playfair-900']
const layouts: Record<string, LayoutNode> = {}

export const pageUnits = config.film.units.map((u) => u.id)

export class App {
  engine!: Engine
  materials!: Materials
  environment!: THREE.Texture
  format = formatById('hd')
  tier = 'draft'
  assets: AssetSet = 'web'
  diagnostic = 'beauty'
  private loaded = new Map<string, Loaded>()
  private counts = new Map<string, { triangles: number; drawCalls: number }>()
  readonly camera = new THREE.PerspectiveCamera()

  // Everything that must hold before a picture is drawn. Stops at once, in plain words, when it does not.
  static check(): void {
    const problems = [...configProblems(config, { approved: build.approved, eventCues }), ...contentProblems(config, copy, narration, layouts)]
    if (problems.length) fail(problems)
  }

  async start(canvas: HTMLCanvasElement, o: { format: string; assets: string; capture: boolean; forceKind?: TargetKind }): Promise<void> {
    App.check()
    this.format = formatById(o.format)
    this.assets = assetSet(o.assets)
    this.engine = new Engine(canvas, this.format.width, this.format.height, { preserve: o.capture, forceKind: o.forceKind })
    this.engine.beforeSample = (shot, view) => applyView(view, shot.scene)
    await Promise.all(FONTS.map((name) => loadFont(name)))
    this.materials = makeMaterials(config.seed)
    this.environment = studioEnvironment(this.engine.renderer)
  }

  setFormat(id: string): void {
    this.format = formatById(id)
    this.engine.setSize(this.format.width, this.format.height)
  }

  setDiagnostic(view: string): void {
    if (!(views as readonly string[]).includes(view)) throw new Error(`No diagnostic view called "${view}"`)
    this.diagnostic = view
  }

  // The page of a unit, built on first use. Only one page is kept on the graphics card at a time.
  page(unit: string): Loaded {
    if (!pageUnits.includes(unit)) throw new Error(`No page called "${unit}"`)
    const hit = this.loaded.get(unit)
    if (hit) return hit
    for (const [id, other] of this.loaded) {
      other.page.scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) m.geometry.dispose()
      })
      this.loaded.delete(id)
    }
    const page = makeSpike(unit, this.materials)
    page.scene.environment = this.environment
    page.scene.environmentIntensity = look.envIntensity
    const rig = new LightRig()
    rig.addTo(page.scene)
    rig.setBounds(page.bounds)
    const script = new ScriptDriver(page)
    const made = { page, stage: new Stage(page, script), rig, script }
    this.loaded.set(unit, made)
    return made
  }

  loadedPages(): Loaded[] {
    return [...this.loaded.values()]
  }

  // The camera of a name, placed for the format in use.
  cameraFor(name: string): THREE.PerspectiveCamera {
    const cameras = config.cameras as Record<string, { fovDeg?: number; like?: string }>
    let entry = cameras[name === 'film' ? 'home' : name]
    if (!entry) throw new Error(`No camera called "${name}"`)
    if (entry.like) entry = cameras[entry.like]!
    const fov = entry.fovDeg ?? config.cameras.home.fovDeg
    const distance = 540 / Math.tan(THREE.MathUtils.degToRad(fov / 2))
    const c = this.camera
    c.fov = fov
    c.aspect = this.format.width / this.format.height
    c.near = distance - 600
    c.far = distance + 400
    c.position.set(0, 0, distance)
    c.up.set(0, 1, 0)
    c.lookAt(0, 0, 0)
    c.updateProjectionMatrix()
    c.updateMatrixWorld()
    return c
  }

  // The moment of a still inside its page, in seconds. A still with no beat is the page at rest.
  momentOf(spec: { beat?: string; at?: number }): number {
    if (!spec.beat) return 0
    const b = beatOf(spec.beat)
    return b.from + (b.to - b.from) * (spec.at ?? 0)
  }

  shot(l: Loaded, camera: THREE.PerspectiveCamera, pose?: (shutter: number) => void): Shot {
    return { scene: l.page.scene, camera, rig: l.rig, pose }
  }

  private note(unit: string): void {
    this.counts.set(unit, { ...this.engine.lastCounts })
  }

  async renderStill(spec: StillSpec): Promise<void> {
    const l = this.page(spec.page)
    l.stage.driver = l.script
    l.stage.seek(this.momentOf(spec))
    const camera = this.cameraFor(spec.camera)
    this.tier = spec.tier
    await this.engine.picture(this.shot(l, camera), { samples: spec.live ? 1 : tierSamples(spec.tier), frame: 0, diagnostic: this.diagnostic })
    this.note(spec.page)
  }

  // Which page a film frame belongs to, and the moment inside it.
  filmMoment(frameIndex: number): { unit: string; time: number } {
    const t = frameIndex / config.film.fps
    let start = 0
    for (const u of config.film.units) {
      if (t < start + u.seconds - 1e-9) return { unit: u.id, time: t - start }
      start += u.seconds
    }
    const last = config.film.units[config.film.units.length - 1]!
    return { unit: last.id, time: last.seconds }
  }

  async renderFilmFrame(frameIndex: number, tier: string): Promise<void> {
    const { unit, time } = this.filmMoment(frameIndex)
    const l = this.page(unit)
    l.stage.driver = l.script
    const open = config.film.shutterDegrees / 360 / config.film.fps
    const camera = this.cameraFor('film')
    this.tier = tier
    await this.engine.picture(this.shot(l, camera, (s) => l.stage.seek(time + s * open)), { samples: tierSamples(tier), frame: frameIndex + 1, diagnostic: this.diagnostic })
    this.note(unit)
  }

  cursorState(l: Loaded, camera: THREE.PerspectiveCamera): CursorState {
    const c = l.page.cursor()
    const hd = formatById('hd')
    const v = new THREE.Vector3(c.x - 960, 540 - c.y, c.z).project(camera)
    const heightPx = config.cursor.heightPxAt1080 * c.scale
    const distance = camera.position.z - c.z
    const pxPerUnit = hd.height / 2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance)
    return {
      x: (v.x * 0.5 + 0.5) * hd.width,
      y: (0.5 - v.y * 0.5) * hd.height,
      heightPx,
      screenHeightPx: heightPx * pxPerUnit,
      worldScale: c.scale,
      acting: c.acting,
      damage: c.damage,
      arms: c.arms,
      onPage: c.onPage,
      inBall: c.inBall,
      ballScreenPx: 0
    }
  }

  countsOf(unit: string): { triangles: number; drawCalls: number } {
    return this.counts.get(unit) ?? { triangles: 0, drawCalls: 0 }
  }

  stepOf(time: number): number {
    return Math.floor(time * stepHz + 1e-7)
  }

  unitStart(unit: string): number {
    return unitStart(unit)
  }
}
