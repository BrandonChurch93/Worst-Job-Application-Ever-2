import * as THREE from 'three'
import build from 'virtual:build-info'
import register from '../parts/PARTS.json'
import { beat as beatOf, config, configProblems, fail, formatById, stepHz, tierSamples, unitStart } from './config'
import { contentProblems, copy, narration, type LayoutNode } from './copy'
import { eventCues } from './audio/cues'
import { assetSet, type AssetSet } from './core/assets'
import { Engine, LightRig, type Shot } from './core/renderer'
import type { TargetKind } from './core/accumulator'
import { restPose, type CursorPose } from './cursor/body'
import { cursorSheet } from './cursor/sheets'
import { EVENT_TRAIL, applyView, isView, type ViewContext, type ViewEvent } from './diagnostics/views'
import { makeLoop, makeOpening, type FilmPiece, type LoopPiece, type OpeningPiece } from './film'
import { pages, preparePages, unitPages } from './pages'
import { look } from './post/look'
import { BlockoutView, TONES } from './shell/blockout'
import { layoutProblems } from './shell/layout'
import { studioEnvironment } from './shell/materials'
import { FONTS } from './shell/metrics'
import { loadFont } from './shell/type'
import { homePose, project, toWorld } from './stage/camera'
import { filmFlow, filmOptions, ScriptDriver, Stage, StillDriver, TURN_HALF, type Frame } from './stage/stage'
import type { CameraPose, PageLogic, Shape } from './stage/types'

export interface StillSpec { page: string; beat?: string; at?: number; scroll?: number; camera: string; tier: string; sheet?: string; interface?: boolean; touchOnly?: boolean; live?: string }

export interface CursorState { x: number; y: number; heightPx: number; screenHeightPx: number; worldScale: number; acting: string; reaction: string | null; reactionAt: number; damage: string[]; arms: boolean; onPage: boolean; inBall: boolean; ballScreenPx: number }

export const pageUnits = config.film.units.map((u) => u.id)
export const unitOfPart = (name: string): string => register.parts.find((p) => p.name === name)?.unit ?? 'site'

const hd = formatById('hd')
const LIVE_MULTISAMPLES = 4

export class App {
  engine!: Engine
  environment!: THREE.Texture
  format = formatById('hd')
  tier = 'draft'
  assets: AssetSet = 'web'
  diagnostic = 'beauty'
  private shown: { frame: Frame; page: PageLogic | null; pose: CameraPose } | null = null
  private marks: ViewEvent[] = []
  readonly view = new BlockoutView()
  readonly rig = new LightRig()
  readonly camera = new THREE.PerspectiveCamera()
  private films = new Map<string, Stage>()
  private rests = new Map<string, Stage>()
  private counts = new Map<string, { triangles: number; drawCalls: number }>()
  private seen = new Set<string>()
  private pieces: { opening?: OpeningPiece; loop?: LoopPiece } = {}

  static layouts(): Record<string, LayoutNode> {
    const out: Record<string, LayoutNode> = {}
    for (const [id, make] of Object.entries(pages)) out[id] = make().layout
    return out
  }

  static check(): void {
    const layouts = App.layouts()
    const problems = [...configProblems(config, { approved: build.approved, eventCues }), ...contentProblems(config, copy, narration, layouts)]
    for (const [id, make] of Object.entries(pages)) {
      const p = make()
      if (p.id !== id) problems.push(`pages: the page "${id}" calls itself "${p.id}"`)
      problems.push(...layoutProblems(p.layout, { width: p.width, height: p.height }))
    }
    if (problems.length) fail(problems)
  }

  async start(canvas: HTMLCanvasElement, o: { format: string; assets: string; capture: boolean; forceKind?: TargetKind }): Promise<void> {
    this.format = formatById(o.format)
    this.assets = assetSet(o.assets)
    await Promise.all([...FONTS.map((name) => loadFont(name)), preparePages()])
    App.check()
    this.engine = new Engine(canvas, this.format.width, this.format.height, { preserve: o.capture, forceKind: o.forceKind, multisamples: o.capture ? 0 : LIVE_MULTISAMPLES })
    this.engine.beforeSample = (_shot, view) => (view === 'beauty' ? undefined : applyView(view, this.viewContext()))
    this.environment = studioEnvironment(this.engine.renderer)
    this.view.scene.environment = this.environment
    this.view.scene.environmentIntensity = look.envIntensity
    this.rig.key.name = 'key'
    this.rig.dome.name = 'dome'
    this.rig.addTo(this.view.scene)
  }

  setFormat(id: string): void {
    this.format = formatById(id)
    this.engine.setSize(this.format.width, this.format.height)
  }

  setDiagnostic(view: string): void {
    if (!isView(view)) throw new Error(`No diagnostic view called "${view}"`)
    this.diagnostic = view
  }

  // What a diagnostic view is given: the scene, and what the frame on show is made of.
  viewContext(): ViewContext {
    const page = this.shown?.page ?? null
    return {
      scene: this.view.scene, camera: this.camera, width: this.engine.width, height: this.engine.height, pose: this.shown?.pose ?? null,
      layout: page?.layout ?? null, list: this.shown?.frame.list ?? [], events: this.marks, lights: [this.rig.key, this.rig.dome],
      table: () => page?.tableState?.() ?? null, colliders: () => page?.colliders?.() ?? [],
    }
  }

  // The events of the frame at `time` and of the half second before it, for the `events` view. Age counts film frames: 0 is this frame.
  private mark(stage: Stage | null, time: number): void {
    this.marks = []
    if (!stage || this.diagnostic !== 'events') return
    const per = stepHz / config.film.fps
    const to = this.stepOf(time) + per
    if (stage.step < to) stage.advance(to - stage.step)
    const page = stage.frameAt(time).page
    this.marks = stage.eventsBetween(to - (EVENT_TRAIL + 1) * per, to).filter((e) => e.page === page).map((e) => ({ name: e.name, x: e.x, y: e.y, hitsCursor: e.hitsCursor, age: Math.max(0, Math.floor((to - 1 - e.step) / per)) }))
  }

  private unit(unit: string): void {
    if (!pageUnits.includes(unit)) throw new Error(`No page called "${unit}"`)
  }

  film(unit: string): Stage {
    this.unit(unit)
    let s = this.films.get(unit)
    if (!s) {
      s = new Stage({ mode: 'film', flow: filmFlow(unit), pages, driver: new ScriptDriver(), film: filmOptions(unit) })
      this.films.set(unit, s)
    }
    return s
  }

  rest(unit: string): Stage {
    this.unit(unit)
    let s = this.rests.get(unit)
    if (!s) {
      const flow = [filmFlow(unit)[0]!]
      const start = pages[flow[0]!.page]!().start
      s = new Stage({ mode: 'live', flow, pages, driver: new StillDriver(start) })
      this.rests.set(unit, s)
    }
    return s
  }

  pageOf(unit: string): PageLogic {
    return this.rest(unit).page
  }

  // A still never shows a page in the middle of a turn: its moment moves to the nearest one with the page flat.
  momentOf(spec: { beat?: string; at?: number }): number {
    if (!spec.beat) return 0
    const b = beatOf(spec.beat)
    const t = Math.min(b.to - 1 / config.film.fps, b.from + (b.to - b.from) * (spec.at ?? 0))
    const turn = filmOptions(b.unit)
    const seconds = config.film.units.find((u) => u.id === b.unit)!.seconds
    return Math.min(turn.leave ? seconds - TURN_HALF - 1 / stepHz : seconds, Math.max(turn.arrive ? TURN_HALF : 0, t))
  }

  // A sheet: several moments of a part side by side, from the page that owns it or from the cursor's own sheets.
  sheet(spec: StillSpec): { frame: Frame; pose: CameraPose; page: PageLogic; size: { width: number; height: number } } | null {
    if (!spec.sheet) return null
    const page = this.pageOf(spec.page)
    const made = page.sheet?.(spec.sheet) ?? cursorSheet(spec.sheet, page)
    if (!made) return null
    const frame: Frame = { list: made.list, cursor: made.cursors[0] ?? restPose(-400, -400, { onPage: false }), cursors: made.cursors, turn: 0, scroll: 0, page: `${page.id}:${spec.sheet}`, view: made.view }
    return { frame, pose: made.view, page, size: { width: made.width ?? page.width, height: made.height ?? page.height } }
  }

  // The frame a still shows, and the camera it is seen from.
  still(spec: StillSpec): { frame: Frame; pose: CameraPose; page: PageLogic; size?: { width: number; height: number } } {
    const sheet = this.sheet(spec)
    if (sheet) return sheet
    const stage = spec.beat ? this.film(spec.page) : this.rest(spec.page)
    const time = this.momentOf(spec)
    const page = stage.page
    const at = stage.frameAt(time)
    const down = !spec.beat && spec.scroll && spec.camera === 'home' ? spec.scroll * Math.max(0, page.height - hd.height) : 0
    const lower = (c: CursorPose): CursorPose => ({ ...c, y: c.y + down })
    const frame: Frame = down ? { ...at, cursor: lower(at.cursor), cursors: at.cursors?.map(lower) } : at
    return { frame, page, pose: this.poseFor(spec.camera, page, frame, time, spec.scroll) }
  }

  poseFor(name: string, page: PageLogic, frame: Frame, time: number, scroll?: number): CameraPose {
    const cameras = config.cameras as Record<string, { fovDeg?: number; like?: string }>
    if (name !== 'film' && !cameras[name]) throw new Error(`No camera called "${name}"`)
    if (scroll !== undefined && (name === 'home' || name === 'film')) return homePose(scroll * Math.max(0, page.height - 1080))
    if (name === 'home') return frame.view ?? homePose(frame.scroll)
    return page.camera(name, time) ?? frame.view ?? homePose(frame.scroll)
  }

  setCamera(pose: CameraPose, width = this.format.width, height = this.format.height): THREE.PerspectiveCamera {
    const c = this.camera
    const d = Math.hypot(pose.eye[0] - pose.target[0], pose.eye[1] - pose.target[1], pose.eye[2] - pose.target[2])
    c.fov = pose.fov
    c.aspect = width / height
    c.near = Math.max(4, d - 1500)
    c.far = d + 3000
    c.position.set(...pose.eye)
    c.up.set(...(pose.up ?? [0, 1, 0]))
    c.lookAt(...pose.target)
    c.updateProjectionMatrix()
    c.updateMatrixWorld()
    return c
  }

  put(frame: Frame, page: { width: number; height: number }, pose: CameraPose, size?: { width: number; height: number }): void {
    this.view.apply(frame, size ?? { width: page.width, height: page.height })
    this.shown = { frame, page: 'layout' in page ? (page as PageLogic) : null, pose }
    const cy = pose.target[1]
    this.view.focus = -cy
    this.rig.setBounds(this.view.bounds())
    for (const s of this.view.standIns()) this.seen.add(s)
  }

  shot(pose?: (shutter: number) => void): Shot {
    return { scene: this.view.scene, camera: this.camera, rig: this.rig, pose }
  }

  private note(unit: string): void {
    this.counts.set(unit, { ...this.engine.lastCounts })
  }

  async renderStill(spec: StillSpec): Promise<void> {
    const { frame, pose, page, size } = this.still(spec)
    const entry = spec.sheet ? (config.sheets as { id: string; width?: number; height?: number }[]).find((s) => s.id === spec.sheet) : undefined
    const k = this.format.width / hd.width
    const width = entry?.width ? Math.round(entry.width * k) : this.format.width
    const height = entry?.height ? Math.round(entry.height * k) : this.format.height
    this.engine.setSize(width, height)
    this.mark(spec.beat && !spec.sheet ? this.film(spec.page) : null, this.momentOf(spec))
    this.put(frame, page, pose, size)
    this.setCamera(pose, width, height)
    this.tier = spec.tier
    await this.engine.picture(this.shot(), { samples: spec.live ? 1 : tierSamples(spec.tier), frame: 0, diagnostic: this.diagnostic })
    this.note(spec.page)
  }

  filmMoment(frameIndex: number): { unit: string; time: number } {
    return this.filmMomentAt(frameIndex / config.film.fps)
  }

  filmMomentAt(t: number): { unit: string; time: number } {
    let start = 0
    for (const u of config.film.units) {
      if (t < start + u.seconds - 1e-9) return { unit: u.id, time: t - start }
      start += u.seconds
    }
    const last = config.film.units[config.film.units.length - 1]!
    return { unit: last.id, time: last.seconds }
  }

  filmFrame(unit: string, time: number): { frame: Frame; pose: CameraPose; page: PageLogic } {
    const stage = this.film(unit)
    const frame = stage.frameAt(time)
    const page = stage.page
    return { frame, page, pose: this.poseFor('film', page, frame, stage.pageTimeAt(time)) }
  }

  async renderFilmFrame(frameIndex: number, tier: string): Promise<void> {
    const { unit, time } = this.filmMoment(frameIndex)
    const open = config.film.shutterDegrees / 360 / config.film.fps
    this.tier = tier
    this.engine.setSize(this.format.width, this.format.height)
    const pose = (s: number) => {
      const f = this.filmFrame(unit, time + s * open)
      this.put(f.frame, f.page, f.pose)
      this.setCamera(f.pose)
    }
    this.mark(this.film(unit), time)
    pose(0)
    await this.engine.picture(this.shot(pose), { samples: tierSamples(tier), frame: frameIndex + 1, diagnostic: this.diagnostic })
    this.note(unit)
  }

  opening(): OpeningPiece {
    return (this.pieces.opening ??= makeOpening())
  }

  loop(): LoopPiece {
    return (this.pieces.loop ??= makeLoop())
  }

  // One frame of a piece that is not a page of the film: the opening of film A, the card loop.
  // The shutter is open over the same part of a frame as in the film.
  async renderPiece(piece: FilmPiece, index: number, tier: string, seed: number): Promise<void> {
    const open = config.film.shutterDegrees / 360
    this.tier = tier
    this.engine.setSize(this.format.width, this.format.height)
    const pose = (s: number) => {
      const i = index + s * open
      const view = piece.pose(i)
      this.put(piece.frame(i), piece.size, view, piece.size)
      this.setCamera(view)
    }
    this.mark(null, 0)
    pose(0)
    await this.engine.picture(this.shot(pose), { samples: tierSamples(tier), frame: seed, diagnostic: this.diagnostic })
  }

  cursorState(c: CursorPose, pose: CameraPose): CursorState {
    const p = project(pose, toWorld(c.x, c.y, c.z), hd.width, hd.height)
    const heightPx = config.cursor.heightPxAt1080 * c.scale
    return {
      x: p.x, y: p.y, heightPx, screenHeightPx: heightPx * p.pxPerUnit, worldScale: c.scale, acting: c.acting, reaction: c.reaction, reactionAt: c.reactionAt, damage: [...c.damage], arms: c.arms, onPage: c.onPage, inBall: c.inBall,
      ballScreenPx: c.inBall ? config.table.ballPx * p.pxPerUnit : 0
    }
  }

  eventPlace(pose: CameraPose, x: number, y: number): { x: number; y: number } {
    const p = project(pose, toWorld(x, y, 0), hd.width, hd.height)
    return { x: p.x, y: p.y }
  }

  groundOf(list: Shape[], s: Shape): number {
    const cx = s.x + s.w / 2
    const cy = s.y + s.h / 2
    let best = -Infinity
    let tone = TONES.page
    for (const o of list) {
      if (o.kind === 'text' || o.kind === 'well' || o === s) continue
      if (cx < o.x || cx > o.x + o.w || cy < o.y || cy > o.y + o.h) continue
      const top = o.pocket ? o.z0 : o.z1
      if (top > s.z1 + 0.5 || top < best) continue
      best = top
      tone = TONES[o.pocket && o.tone !== 'dark' ? 'pocket' : o.tone]
    }
    return tone
  }

  countsOf(unit: string): { triangles: number; drawCalls: number } {
    return this.counts.get(unit) ?? { triangles: 0, drawCalls: 0 }
  }

  standIns(): { name: string; unit: string }[] {
    return [...this.seen].sort().map((name) => ({ name, unit: unitOfPart(name) }))
  }

  pagesOf(unit: string): string[] {
    this.unit(unit)
    return unitPages[unit]!
  }

  stepOf(time: number): number {
    return Math.floor(time * stepHz + 1e-7)
  }

  unitStart(unit: string): number {
    return unitStart(unit)
  }
}
