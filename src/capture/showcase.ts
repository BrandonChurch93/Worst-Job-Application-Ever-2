// The frame interface: the one object the page puts on `window`, as kit/05-ARCHITECTURE.md types it.
import * as THREE from 'three'
import build from 'virtual:build-info'
import { App, pageUnits, type StillSpec } from '../app'
import { config, filmSeconds, stepHz, unitStart } from '../config'
import { narration, timedLines } from '../copy'
import { assetSet } from '../core/assets'
import type { CursorState } from '../stage/stage'

export type { StillSpec }

export interface Showcase {
  ready: Promise<void>
  info(): { fps: number; format: string; tier: string; assets: string; engineHash: string; pageHashes: Record<string, string>; standIns: { name: string; unit: string }[]; modules: { film: string[]; live: string[] }; counts: Record<string, { triangles: number; drawCalls: number; standingParts?: number }>; textureMb: Record<string, number>; versions: Record<string, string> }
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderStill(spec: StillSpec): Promise<void>
  pictureStats(): { invalidValues: number }
  typeRegister(page: string): { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[]
  stillState(spec: StillSpec): { layout: { id: string; kind: string; planned: number[]; drawn: number[]; plannedHeight: number | null; height: number; mechanism: boolean }[]; type: { key: string; text: string; box: number[]; px: number; contrast: number }[]; cursor: CursorState }
  tableState(): { tiers: { id: string; standingParts: number; inserts: number; dropTargets: number; display: { box: number[]; charPx: number } }[]; openings: { id: string; tier: string; clearBalls: number }[]; rails: { id: string; from: string; to: string }[]; holds: { id: string; releases: boolean }[]; sealed: string[] }
  film(): { frameCount: number; units: { id: string; first: number; last: number }[]; beats: { id: string; first: number; last: number }[]; lines: { beat: string; first: number; last: number }[] }
  filmState(frameIndex: number): { unit: string; beat: string; camera: number[]; cursor: CursorState; events: { name: string; x: number; y: number; hitsCursor: boolean }[]; standIns: string[] }
  renderFilmFrame(frameIndex: number, tier: string): Promise<void>
  opening(): { frameCount: number }
  renderOpeningFrame(frameIndex: number): Promise<void>
  loop(): { frameCount: number; scene: string }
  loopState(frameIndex: number): { cursorBox: number[]; threatBox: number[] }
  renderLoopFrame(frameIndex: number, tier: string): Promise<void>
}

const luminance = (c: THREE.Color): number => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
const contrast = (a: THREE.Color, b: THREE.Color): number => {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export function makeShowcase(app: App, ready: Promise<void>): Showcase {
  const fps = config.film.fps
  const frameOf = (seconds: number) => Math.round(seconds * fps)
  const notYet = (what: string): never => {
    throw new Error(`${what} is not built yet`)
  }

  return {
    ready,
    info() {
      const counts: Record<string, { triangles: number; drawCalls: number }> = {}
      const textureMb: Record<string, number> = {}
      for (const unit of pageUnits) {
        counts[unit] = app.countsOf(unit)
        textureMb[unit] = 0
      }
      const standIns: { name: string; unit: string }[] = []
      for (const l of app.loadedPages()) {
        standIns.push(...l.page.standIns())
        textureMb[l.page.id] = l.page.textureBytes() / 1048576
      }
      return { fps, format: app.format.id, tier: app.tier, assets: app.assets, engineHash: build.engineHash, pageHashes: build.pageHashes, standIns, modules: { film: [], live: [] }, counts, textureMb, versions: build.versions }
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
    },
    pictureStats() {
      return { invalidValues: app.engine.invalidValues() }
    },
    typeRegister(page) {
      return app.page(page).page.type().map((r) => ({ key: r.key, text: r.text, states: r.states, made: r.made }))
    },
    stillState(spec) {
      const l = app.page(spec.page)
      l.stage.driver = l.script
      l.stage.seek(app.momentOf(spec))
      const camera = app.cameraFor(spec.camera)
      const type = l.page.type().map((r) => {
        const ink = (r.mesh.material as THREE.MeshStandardMaterial).color
        const ground = (r.mesh.userData.ground as THREE.Color | undefined) ?? app.materials.ceramic.color
        return { key: r.key, text: r.text, box: [...r.box], px: r.px, contrast: contrast(ink, ground) }
      })
      return { layout: l.page.layout(), type, cursor: app.cursorState(l, camera) }
    },
    tableState() {
      return { tiers: [], openings: [], rails: [], holds: [], sealed: [] }
    },
    film() {
      const units = config.film.units.map((u) => ({ id: u.id, first: frameOf(unitStart(u.id)), last: frameOf(unitStart(u.id) + u.seconds) - 1 }))
      const beats = config.film.beats.map((b) => ({ id: b.id, first: frameOf(unitStart(b.unit) + b.from), last: frameOf(unitStart(b.unit) + b.to) - 1 }))
      const lines = timedLines(config, narration).map((l) => ({ beat: l.beat, first: frameOf(l.start), last: Math.max(frameOf(l.start), frameOf(l.end) - 1) }))
      return { frameCount: frameOf(filmSeconds()), units, beats, lines }
    },
    filmState(frameIndex) {
      const { unit, time } = app.filmMoment(frameIndex)
      const l = app.page(unit)
      l.stage.driver = l.script
      l.stage.seek(time)
      const camera = app.cameraFor('film')
      const b = config.film.beats.find((x) => x.unit === unit && time >= x.from - 1e-9 && time < x.to - 1e-9) ?? config.film.beats.filter((x) => x.unit === unit).at(-1)!
      const from = app.stepOf(time)
      const events = l.stage.eventsBetween(from, from + stepHz / fps).map((e) => ({ name: e.name, x: e.x, y: e.y, hitsCursor: e.hitsCursor }))
      return { unit, beat: b.id, camera: [...camera.position.toArray(), ...camera.quaternion.toArray(), camera.fov], cursor: app.cursorState(l, camera), events, standIns: l.page.standIns().map((s) => s.name) }
    },
    async renderFilmFrame(frameIndex, tier) {
      await ready
      await app.renderFilmFrame(frameIndex, tier)
    },
    opening() {
      return notYet('The opening of film A')
    },
    async renderOpeningFrame() {
      return notYet('The opening of film A')
    },
    loop() {
      return notYet('The card loop')
    },
    loopState() {
      return notYet('The card loop')
    },
    async renderLoopFrame() {
      return notYet('The card loop')
    }
  }
}
