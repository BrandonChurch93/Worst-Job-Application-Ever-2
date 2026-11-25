// What the interface needs from the site, and what the site calls. The Builder builds against this file.
import { mountInterface } from './interface'
import { makeQualityPicker, type QualityLevel, type QualityPicker } from './picker'
import { lessMotion, touchOnly } from './device'
import { mountTouchMessage } from './touch'
import { mountProbe, PROBE_SCENES, type ProbeRunner, type ProbeScene } from '../probe'

export interface SoundApi {
  // False when the site has no sound files: the control is then not drawn.
  available(): boolean
  muted(): boolean
  setMuted(muted: boolean): void
}

export interface QualityApi {
  // The ids of live.quality, best first.
  levels: string[]
  level(): string
  set(level: string): void
  // Optional. False when the address or the config names one level: the picker then leaves the level alone.
  // Left out, the interface reads live.defaultQuality: it picks by itself when that is "auto".
  auto?(): boolean
}

export interface FilmApi {
  seconds: number
  time(): number
  playing(): boolean
  play(): void
  pause(): void
  seek(seconds: number): void
}

export interface InterfaceApi {
  mode(): 'live' | 'film' | 'loop'
  // The element the picture is drawn in. The controls lay themselves over its rectangle and follow it when it moves.
  canvas: HTMLElement
  // 0 is the careers page, 1 to 5 are the steps.
  step(): number
  setStep(step: number): void
  // The current step's heading, as the page shows it, for the hidden live region.
  heading(): string
  // The messages the page shows now, oldest first. Each one is said once.
  messages(): string[]
  skipOffered(): boolean
  skip(): void
  watchFilm(): void
  backToSite(): void
  sound: SoundApi
  quality: QualityApi
  // The names of the diagnostic views, the current one, and how to change it.
  diagnostics: string[]
  diagnostic(): string
  setDiagnostic(view: string): void
  // Present in film mode: the playback controls are drawn from it.
  film?: FilmApi
  // The wall time of the last drawn frame in seconds, for the level picker.
  frameSeconds(): number
  // Optional. True while the page takes typed letters: the M key then belongs to the page, and the menu opens with Alt and M.
  typing?(): boolean
}

export interface Mounted {
  // Called once a drawn frame.
  update(): void
  destroy(): void
}

export type { ProbeRunner, ProbeScene, QualityLevel, QualityPicker }
export { lessMotion, makeQualityPicker, mountInterface, mountProbe, mountTouchMessage, PROBE_SCENES, touchOnly }
