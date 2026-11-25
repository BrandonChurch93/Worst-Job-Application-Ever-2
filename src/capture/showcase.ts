import build from 'virtual:build-info'
import { App, pageUnits, type CursorState, type StillSpec } from '../app'
import { config, filmSeconds, stepHz, unitStart } from '../config'
import { narration, timedLines } from '../copy'
import { assetSet } from '../core/assets'
import { pages } from '../pages'
import { TONES } from '../shell/blockout'
import { plannedHeight, typeRegister, walk } from '../shell/layout'
import { words } from '../shell/words'
import type { TableState } from '../stage/types'

export type { StillSpec, CursorState }

export interface Showcase {
  ready: Promise<void>
  info(): { fps: number; format: string; tier: string; assets: string; engineHash: string; pageHashes: Record<string, string>; standIns: { name: string; unit: string }[]; modules: Record<string, string[]>; counts: Record<string, { triangles: number; drawCalls: number; standingParts?: number }>; textureMb: Record<string, number>; versions: Record<string, string> }
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderStill(spec: StillSpec): Promise<void>
  pictureStats(): { invalidValues: number }
  typeRegister(page: string): { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[]
  stillState(spec: StillSpec): { layout: { id: string; kind: string; planned: number[]; drawn: number[]; plannedHeight: number | null; height: number; mechanism: boolean }[]; type: { key: string; text: string; box: number[]; px: number; contrast: number }[]; cursor: CursorState }
  tableState(): TableState
  film(): { frameCount: number; units: { id: string; first: number; last: number }[]; beats: { id: string; first: number; last: number }[]; lines: { beat: string; first: number; last: number }[] }
  filmState(frameIndex: number): { unit: string; beat: string; camera: number[]; cursor: CursorState; events: { name: string; x: number; y: number; hitsCursor: boolean }[]; standIns: string[] }
  renderFilmFrame(frameIndex: number, tier: string): Promise<void>
  opening(): { frameCount: number }
  renderOpeningFrame(frameIndex: number): Promise<void>
  loop(): { frameCount: number; scene: string }
  loopState(frameIndex: number): { cursorBox: number[]; threatBox: number[] }
  renderLoopFrame(frameIndex: number, tier: string): Promise<void>
}

const ratio = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

export function makeShowcase(app: App, ready: Promise<void>): Showcase {
  const fps = config.film.fps
  const frameOf = (seconds: number) => Math.round(seconds * fps)

  return {
    ready,
    info() {
      const counts: Record<string, { triangles: number; drawCalls: number }> = {}
      const textureMb: Record<string, number> = {}
      for (const unit of pageUnits) {
        counts[unit] = app.countsOf(unit)
        textureMb[unit] = 0
      }
      return { fps, format: app.format.id, tier: app.tier, assets: app.assets, engineHash: build.engineHash, pageHashes: build.pageHashes, standIns: app.standIns(), modules: build.modules, counts, textureMb, versions: { ...build.versions, target: app.engine.kind } }
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
      const out: { key: string; text: string; states: string[]; made: 'copy' | 'config' | 'runtime' }[] = []
      for (const id of pages[page] ? [page] : app.pagesOf(page)) for (const r of typeRegister(pages[id]!().layout)) out.push({ key: r.key, text: r.text, states: r.states, made: r.made })
      return out
    },
    stillState(spec) {
      const { frame, pose, page } = app.still(spec)
      const drawn = new Map(frame.list.map((s) => [s.id, s]))
      const layout: { id: string; kind: string; planned: number[]; drawn: number[]; plannedHeight: number | null; height: number; mechanism: boolean }[] = []
      walk(page.layout, (n) => {
        const s = drawn.get(n.id)
        if (!s || s.kind === 'text' || s.kind === 'well') return
        layout.push({ id: n.id, kind: n.kind, planned: [...n.box], drawn: [s.x, s.y, s.w, s.h], plannedHeight: plannedHeight(n.kind), height: s.pocket ? s.z0 : s.z1, mechanism: s.mechanism === true })
      })
      const type = frame.list.filter((s) => s.kind === 'text').map((s) => ({ key: s.words!, text: words(s.words!, s.text), box: [s.x, s.y, s.w, s.h], px: s.type!.px, contrast: ratio(TONES[s.tone], app.groundOf(frame.list, s)) }))
      return { layout, type, cursor: app.cursorState(frame.cursor, pose) }
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
      const { frame, pose } = app.filmFrame(unit, time)
      const stage = app.film(unit)
      const from = app.stepOf(time)
      const to = from + stepHz / fps
      if (stage.step < to) stage.advance(to - stage.step)
      const b = config.film.beats.find((x) => x.unit === unit && time >= x.from - 1e-9 && time < x.to - 1e-9) ?? config.film.beats.filter((x) => x.unit === unit).at(-1)!
      const events = stage.eventsBetween(from, to).map((e) => {
        const p = app.eventPlace(pose, e.x, e.y)
        return { name: e.name, x: p.x, y: p.y, hitsCursor: e.hitsCursor }
      })
      const parts = new Set<string>(['shell', 'cursor-body'])
      for (const s of frame.list) parts.add(s.part)
      return { unit, beat: b.id, camera: [...pose.eye, ...pose.target, pose.fov], cursor: app.cursorState(frame.cursor, pose), events, standIns: [...parts].sort() }
    },
    async renderFilmFrame(frameIndex, tier) {
      await ready
      await app.renderFilmFrame(frameIndex, tier)
    },
    opening() {
      return { frameCount: app.opening().frameCount }
    },
    async renderOpeningFrame(frameIndex) {
      await ready
      await app.renderPiece(app.opening(), frameIndex, app.tier, frameIndex + 1)
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
