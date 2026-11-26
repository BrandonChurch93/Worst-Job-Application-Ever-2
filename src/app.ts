import * as THREE from 'three'
import build from 'virtual:build-info'
import register from '../parts/PARTS.json'
import { beat as beatOf, config, configProblems, fail, formatById, stepHz, tierSamples, unitStart } from './config'
import { contentProblems, copy, narration, type LayoutNode } from './copy'
import { eventCues } from './audio/cues'
import { assetSet, type AssetSet } from './core/assets'
import { pageReady, showPage, stageLoading } from './core/load'
import { Engine, LightRig, type Shot } from './core/renderer'
import type { TargetKind } from './core/accumulator'
import { restPose, type CursorPose } from './cursor/body'
import { cursorSheet } from './cursor/sheets'
import { EVENT_TRAIL, applyView, isView, type ViewContext, type ViewEvent } from './diagnostics/views'
import { makeLoop, makeOpening, type FilmPiece, type LoopPiece, type OpeningPiece } from './film'
import { pages, preparePages, unitPages } from './pages'
import { websiteLevel } from './real'
import { loadTable } from './table/real/assets'
import { look } from './post/look'
import { studioEnvironment } from './post/studio'
import { PageView } from './shell/view'
import { layoutProblems } from './shell/layout'
import { FONTS } from './shell/metrics'
import { loadFont } from './shell/type'
import type { QualityId } from './core/quality'
import { setGlass } from './core/levelGlass'
import { SmallThings } from './core/levelSmall'
import { isCoins, Streaks } from './core/levelStreak'
import { homePose, project, toWorld } from './stage/camera'
import { panelPlan, type PanelPlan } from './stage/panels'
import { filmFlow, filmOptions, liveFlow, ScriptDriver, Stage, StillDriver, TURN_HALF, type Frame } from './stage/stage'
import { setTurnWait, WAIT_TAP_SECONDS } from './stage/turn'
import type { CameraPose, PageLogic, Shape, Tone } from './stage/types'
import { wallSeconds } from './ui/clock'

export interface StillSpec { page: string; beat?: string; at?: number; scroll?: number; camera: string; tier: string; sheet?: string; panel?: number; interface?: boolean; touchOnly?: boolean; live?: string }

export interface CursorState { x: number; y: number; heightPx: number; screenHeightPx: number; worldScale: number; acting: string; reaction: string | null; reactionAt: number; damage: string[]; arms: boolean; onPage: boolean; inBall: boolean; ballScreenPx: number; ballX: number; ballY: number }

export const pageUnits = config.film.units.map((u) => u.id)
export const unitOfPart = (name: string): string => register.parts.find((p) => p.name === name)?.unit ?? 'site'

const hd = formatById('hd')
const LIVE_MULTISAMPLES = 4

// The frame as its camera sees it: where the camera leaves a box of the page out, the shapes wholly inside it go and its well comes in their place.
const seenBy = (frame: Frame, pose: CameraPose): Frame => {
  const o = pose.omit
  if (!o) return frame
  const inside = (s: Shape): boolean => s.x >= o.x - 1 && s.x + s.w <= o.x + o.w + 1 && s.y >= o.y - 1 && s.y + s.h <= o.y + o.h + 1
  return { ...frame, list: [...frame.list.filter((s) => !inside(s)), o] }
}

export class App {
  engine!: Engine
  environment!: THREE.Texture
  format = formatById('hd')
  tier = 'draft'
  assets: AssetSet = 'web'
  diagnostic = 'beauty'
  private shown: { frame: Frame; page: PageLogic | null; pose: CameraPose } | null = null
  private lens = { focus: 0, aperture: 0 }
  private marks: ViewEvent[] = []
  private level: QualityId | null = null
  private hidFine = false
  private small = new SmallThings()
  private streaks = new Streaks()
  readonly view = new PageView()
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

  // Called after every frame of the live site that is not the first page at rest: what the page on show and the pages after it are built from is fetched, and what a page left behind was built from is let go (`src/core/load.ts`).
  loadLater(): void {
    if (this.staged && this.shown) showPage(liveFlow().map((e) => e.page), this.shown.frame.page, this.assets, this.shown.frame.turn !== 0)
  }

  private staged = false

  async start(canvas: HTMLCanvasElement, o: { format: string; assets: string; capture: boolean; stepped?: boolean; forceKind?: TargetKind }): Promise<void> {
    this.format = formatById(o.format)
    this.assets = assetSet(o.assets)
    await Promise.all([...FONTS.map((name) => loadFont(name)), preparePages(), o.capture || o.stepped ? loadTable(this.assets) : Promise.resolve()])
    App.check()
    this.engine = new Engine(canvas, this.format.width, this.format.height, { preserve: o.capture, forceKind: o.forceKind, multisamples: o.capture ? 0 : LIVE_MULTISAMPLES })
    this.engine.beforeSample = (_shot, view) => (view === 'beauty' ? undefined : applyView(view, this.viewContext()))
    this.staged = !o.capture && !o.stepped
    if (this.staged) {
      stageLoading(this.engine.renderer, wallSeconds)
      setTurnWait({ ready: pageReady, steps: Math.round(config.live.loadWaitSeconds * stepHz), every: Math.round(WAIT_TAP_SECONDS * stepHz) })
    }
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
    const page = stage.frameAt(time).page
    if (stage.step < to) stage.advance(to - stage.step)
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
  sheet(spec: StillSpec): { frame: Frame; pose: CameraPose; page: PageLogic; size: { width: number; height: number }; panels: PanelPlan | null } | null {
    if (!spec.sheet) return null
    const page = this.pageOf(spec.page)
    const made = page.sheet?.(spec.sheet) ?? cursorSheet(spec.sheet, page)
    if (!made) return null
    const size = { width: made.width ?? page.width, height: made.height ?? page.height }
    const panels = made.panels && made.panels.length > 1 ? panelPlan(hd.width, made.panels.length, made.gutter ?? 0) : null
    const one = panels && spec.panel !== undefined ? made.panels![Math.max(0, Math.min(panels.count - 1, Math.floor(spec.panel)))]! : null
    const list = one?.list ?? made.list
    const cursors = one?.cursors ?? made.cursors
    const view = one?.view ?? made.view
    const frame: Frame = { list, cursor: cursors[0] ?? restPose(-400, -400, { onPage: false }), cursors, turn: 0, scroll: 0, page: `${page.id}:${spec.sheet}`, view }
    return { frame, pose: view, page, size, panels }
  }

  // How a sheet in panels is laid out in the current format, or null where the sheet is one picture.
  sheetPanels(spec: StillSpec): PanelPlan | null {
    const plan = this.sheet(spec)?.panels
    return plan ? panelPlan(this.format.width, plan.count, plan.gutter * (this.format.width / hd.width)) : null
  }

  // The frame a still shows, and the camera it is seen from.
  still(spec: StillSpec): { frame: Frame; pose: CameraPose; page: PageLogic; size?: { width: number; height: number } } {
    const sheet = this.sheet(spec)
    if (sheet) return sheet
    const stage = spec.beat ? this.film(spec.page) : this.rest(spec.page)
    const time = this.momentOf(spec)
    const page = stage.page
    const made = stage.frameAt(time)
    const open: Record<string, Tone> = { 'continue-cap': 'accent', 'continue-label': 'inkLight' }
    const at: Frame = spec.sheet === 'page-look' ? { ...made, list: made.list.map((x) => (open[x.id] ? { ...x, tone: open[x.id] } : x)) } : made
    const down = !spec.beat && spec.scroll && spec.camera === 'home' ? spec.scroll * Math.max(0, page.height - hd.height) : 0
    const lower = (c: CursorPose): CursorPose => ({ ...c, y: c.y + down })
    const frame: Frame = down ? { ...at, cursor: lower(at.cursor), cursors: at.cursors?.map(lower) } : at
    const pose = this.poseFor(spec.camera, page, frame, time, spec.scroll)
    return { frame: seenBy(frame, pose), page, pose }
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
    this.lens.focus = pose.focus ?? d
    this.lens.aperture = pose.aperture ?? 0
    c.position.set(...pose.eye)
    c.up.set(...(pose.up ?? [0, 1, 0]))
    c.lookAt(...pose.target)
    c.updateProjectionMatrix()
    c.updateMatrixWorld()
    return c
  }

  private readonly behind = new THREE.Color()

  put(frame: Frame, page: { width: number; height: number }, pose: CameraPose, size?: { width: number; height: number }): void {
    this.view.apply(frame, size ?? { width: page.width, height: page.height })
    this.fine()
    if (this.engine.levelPlan) this.streaks.apply(this.view.scene, config.film.shutterDegrees / 360, isCoins)
    else this.streaks.release()
    this.small.apply(this.view.scene, this.engine.levelPlan?.particles ?? 1, config.seed)
    this.shown = { frame, page: 'layout' in page ? (page as PageLogic) : null, pose }
    const cy = pose.target[1]
    this.view.focus = -cy
    this.rig.setBounds(this.view.bounds())
    this.rig.setEmitters(this.view.emitters())
    const website = websiteLevel(frame.list)
    this.rig.level = website
    this.view.scene.environmentIntensity = look.envIntensity * website
    this.engine.renderer.setClearColor(this.behind.setRGB(...look.background).multiplyScalar(0.12 + 0.88 * website), 1)
    for (const s of this.view.standIns()) this.seen.add(s)
  }

  setLevel(level: QualityId | null): void {
    this.level = level
    this.rig.setLevel(level)
    this.engine.setLevel(level)
    setGlass(this.engine.levelPlan?.glass ?? null)
  }

  private fine(): void {
    const hide = this.level === 'low'
    if (!hide && !this.hidFine) return
    this.view.scene.traverse((o) => {
      if (!o.userData.fine) return
      if (hide) {
        if (o.visible) {
          o.visible = false
          o.userData.fineHidden = true
        }
      } else if (o.userData.fineHidden) {
        o.visible = true
        o.userData.fineHidden = false
      }
    })
    this.hidFine = hide
  }

  shot(pose?: (shutter: number) => void): Shot {
    return { scene: this.view.scene, camera: this.camera, rig: this.rig, pose, lens: this.level === 'low' ? null : this.lens, list: this.shown?.frame.list }
  }

  private note(unit: string): void {
    this.counts.set(unit, { ...this.engine.lastCounts })
  }

  async renderStill(spec: StillSpec): Promise<void> {
    const { frame, pose, page, size } = this.still(spec)
    const entry = spec.sheet ? (config.sheets as { id: string; width?: number; height?: number }[]).find((s) => s.id === spec.sheet) : undefined
    const k = this.format.width / hd.width
    const panel = spec.panel !== undefined ? this.sheetPanels(spec) : null
    const width = panel ? panel.width : entry?.width ? Math.round(entry.width * k) : this.format.width
    const height = entry?.height ? Math.round(entry.height * k) : this.format.height
    this.engine.setSize(width, height)
    this.mark(spec.beat && !spec.sheet ? this.film(spec.page) : null, this.momentOf(spec))
    this.setLevel((spec.live as QualityId | undefined) ?? null)
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

  useCheckpoint(unit: string, saved: unknown): void {
    this.film(unit).restore(saved)
  }

  filmFrame(unit: string, time: number): { frame: Frame; pose: CameraPose; page: PageLogic } {
    const stage = this.film(unit)
    const frame = stage.frameAt(time)
    const page = stage.page
    const pose = this.poseFor('film', page, frame, stage.pageTimeAt(time))
    return { frame: seenBy(frame, pose), page, pose }
  }

  async renderFilmFrame(frameIndex: number, tier: string): Promise<void> {
    const { unit, time } = this.filmMoment(frameIndex)
    const open = config.film.shutterDegrees / 360 / config.film.fps
    this.tier = tier
    this.setLevel(null)
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
    this.setLevel(null)
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
    // Sealed in the ball, the character is the ball: its middle stands half a ball above the place the cursor has.
    const ball = c.inBall ? project(pose, toWorld(c.x, c.y, c.z + config.table.ballPx / 2), hd.width, hd.height) : null
    return {
      x: p.x, y: p.y, heightPx, screenHeightPx: heightPx * p.pxPerUnit, worldScale: c.scale, acting: c.acting, reaction: c.reaction, reactionAt: c.reactionAt, damage: [...c.damage], arms: c.arms, onPage: c.onPage, inBall: c.inBall,
      ballScreenPx: ball ? config.table.ballPx * ball.pxPerUnit : 0, ballX: ball ? ball.x : 0, ballY: ball ? ball.y : 0
    }
  }

  eventPlace(pose: CameraPose, x: number, y: number): { x: number; y: number } {
    const p = project(pose, toWorld(x, y, 0), hd.width, hd.height)
    return { x: p.x, y: p.y }
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
