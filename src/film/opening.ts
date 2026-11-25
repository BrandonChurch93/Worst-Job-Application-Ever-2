import { config } from '../config'
import type { LayoutNode } from '../copy'
import { restPose } from '../cursor/body'
import { column, drawLayout, group, node, text, type Item } from '../shell/layout'
import { block, measure } from '../shell/metrics'
import { homePose } from '../stage/camera'
import type { Frame } from '../stage/stage'
import type { CameraPose, DrawList, Shape, TypeSpec } from '../stage/types'
import type { FilmPiece } from './piece'

const intro = config.intro
const fps = config.film.fps
const PART = 'opening'
const W = 1920
const H = 1080

export const LEVEL_SECONDS = 0.5
export const SEND_SECONDS = 0.3
const LEVEL_OPENS = 0.05
const LEVEL_PICKS = 0.25
const LEVEL_CLOSES = 0.45
const SEND_SINKS = 0.12

const TYPE = {
  prompt: { font: 'inter-400', px: 38 },
  level: { font: 'inter-500', px: 26 },
  title: { font: 'inter-display-600', px: 56 },
  line: { font: 'inter-400', px: 34 }
} satisfies Record<string, TypeSpec>

const SCREEN_Z = 2
const PANEL_Z = 12
const CONTROL_Z = 20
const MENU_Z = 34
const PANEL = { x: 240, y: 380, w: 1440, h: 260 }
const PAD = 48
const PILL = { w: 208, h: 60 }
const SEND = 68
const ROW = 60
const LINE_PITCH = 44

export interface OpeningTimes {
  typed: number
  levelOpens: number
  levelPicks: number
  levelCloses: number
  held: number
  sent: number
  lines: { shown: number; done: number }[]
  end: number
}

export function openingTimes(): OpeningTimes {
  const typed = intro.prompt.length / intro.charsPerSecond
  const held = typed + LEVEL_SECONDS + intro.readHoldSeconds
  const sent = held + SEND_SECONDS
  const lines = intro.steps.map((_, i) => ({ shown: sent + i * intro.stepSeconds, done: sent + (i + 1) * intro.stepSeconds }))
  return { typed, levelOpens: typed + LEVEL_OPENS, levelPicks: typed + LEVEL_PICKS, levelCloses: typed + LEVEL_CLOSES, held, sent, lines, end: sent + intro.steps.length * intro.stepSeconds + intro.endHoldSeconds }
}

export const openingSeconds = (): number => openingTimes().end
export const openingFrames = (): number => Math.ceil(openingSeconds() * fps - 1e-9)
export const typedAt = (time: number): string => intro.prompt.slice(0, Math.min(intro.prompt.length, Math.max(0, Math.floor(time * intro.charsPerSecond + 1e-9) + 1)))

const screen = (id: string, children: LayoutNode[]): LayoutNode => node(id, 'page', [0, 0, W, H], { part: PART, children: [node(`${id}-screen`, 'screen', [0, 0, W, H], { part: PART, tone: 'dark', height: SCREEN_Z, children })] })

export function promptLayout(): LayoutNode {
  const capOf = (t: TypeSpec) => block(t.font, 'X', t.px).cap
  const textX = PANEL.x + PAD
  const textY = PANEL.y + PAD + 8
  const rowY = PANEL.y + PANEL.h - PAD - PILL.h
  const sendX = PANEL.x + PANEL.w - PAD - SEND
  const sendY = PANEL.y + PANEL.h - PAD - SEND
  const levelWord = (id: string, x: number, y: number, on: number, tone: string, states?: string[]): LayoutNode =>
    text(id, 'intro.reasoningLevel', { ...TYPE.level, align: 'centre' }, x, y - capOf(TYPE.level) / 2, { part: PART, on, tone, ...(states ? { states } : {}) })
  const pill = node('level', 'control', [textX, rowY, PILL.w, PILL.h], {
    part: PART, shape: 'capsule', tone: 'metal', height: CONTROL_Z, floor: PANEL_Z,
    children: [
      node('level-unset', 'bar', [textX + 44, rowY + PILL.h / 2 - 7, PILL.w - 88, 14], { part: PART, shape: 'capsule', tone: 'pocket', height: CONTROL_Z + 2, floor: CONTROL_Z, states: ['unset'] }),
      levelWord('level-word', textX + PILL.w / 2, rowY + PILL.h / 2, CONTROL_Z, 'ink', ['set'])
    ]
  })
  const menuY = rowY + PILL.h + 12
  const rows: LayoutNode[] = []
  const bars = [96, 132]
  for (let i = 0; i < 3; i++) {
    const y = menuY + 10 + i * ROW
    const last = i === 2
    rows.push(node(`level-row-${i}`, 'option', [textX + 10, y, PILL.w + 44 - 20, ROW - 8], {
      part: PART, shape: 'capsule', tone: 'pocket', height: MENU_Z + 4, floor: MENU_Z, states: [`pick-${i}`],
      children: []
    }))
    rows.push(last
      ? levelWord('level-option-word', textX + 10 + 28 + block(TYPE.level.font, intro.reasoningLevel, TYPE.level.px).width / 2, y + (ROW - 8) / 2, MENU_Z + 4, 'ink')
      : node(`level-option-${i}`, 'bar', [textX + 10 + 28, y + (ROW - 8) / 2 - 7, bars[i]!, 14], { part: PART, shape: 'capsule', tone: 'dark', height: MENU_Z + 6, floor: MENU_Z + 4 }))
  }
  const menu = node('level-menu', 'menu', [textX, menuY, PILL.w + 44, 3 * ROW + 12], { part: PART, tone: 'light', r: 18, height: MENU_Z, floor: PANEL_Z + 2, over: true, states: ['menu'], children: rows })
  const send = node('send', 'control', [sendX, sendY, SEND, SEND], {
    part: PART, shape: 'disc', tone: 'accent', height: CONTROL_Z, floor: PANEL_Z,
    children: [node('send-mark', 'mark', [sendX + SEND / 2 - 5, sendY + 18, 10, SEND - 36], { part: PART, shape: 'capsule', tone: 'light', height: CONTROL_Z + 2, floor: CONTROL_Z })]
  })
  const typed = text('prompt-typed', 'runtime:opening.prompt', { ...TYPE.prompt, wrap: PANEL.w - PAD * 2 }, textX, textY, { part: PART, on: PANEL_Z, runtime: intro.prompt })
  const caret = node('prompt-caret', 'caret', [textX, textY - 9, 4, capOf(TYPE.prompt) + 18], { part: PART, tone: 'accent', height: PANEL_Z + 2, floor: PANEL_Z, states: ['caret'], over: true })
  const panel = node('prompt-panel', 'panel', [PANEL.x, PANEL.y, PANEL.w, PANEL.h], { part: PART, tone: 'raised', r: 32, height: PANEL_Z, floor: SCREEN_Z, children: [typed, caret, pill, send] })
  return screen('opening-prompt', [panel, menu])
}

export function buildLayout(): LayoutNode {
  const left = 480
  const mark = 40
  const cap = block(TYPE.line.font, 'X', TYPE.line.px).cap
  const title = text('build-title', 'intro.title', TYPE.title, left, 236, { part: PART, on: SCREEN_Z, tone: 'inkLight' })
  const rule = node('build-rule', 'rule', [left, 318, 960, 2], { part: PART, tone: 'metal', height: SCREEN_Z + 2, floor: SCREEN_Z })
  const items: Item[] = intro.steps.map((_, i): Item => (x, y) => {
    const tick = [
      node(`build-tick-${i}-a`, 'mark', [x + 10, y + 19, 12, 6], { part: PART, shape: 'capsule', tone: 'dark', height: SCREEN_Z + 8, floor: SCREEN_Z + 6, states: [`done-${i}`] }),
      node(`build-tick-${i}-b`, 'mark', [x + 15, y + 17, 20, 6], { part: PART, shape: 'capsule', tone: 'dark', height: SCREEN_Z + 8, floor: SCREEN_Z + 6, states: [`done-${i}`], over: true })
    ]
    const done = node(`build-done-${i}`, 'mark', [x, y, mark, mark], { part: PART, shape: 'disc', tone: 'light', height: SCREEN_Z + 6, floor: SCREEN_Z, states: [`done-${i}`], children: tick })
    const busy = node(`build-busy-${i}`, 'mark', [x, y, mark, mark], {
      part: PART, shape: 'disc', tone: 'metal', height: SCREEN_Z + 4, floor: SCREEN_Z, states: [`busy-${i}`],
      children: [node(`build-busy-${i}-eye`, 'mark', [x + 9, y + 9, mark - 18, mark - 18], { part: PART, shape: 'disc', tone: 'dark', height: SCREEN_Z + 5, floor: SCREEN_Z + 4, states: [`busy-${i}`] })]
    })
    const words = text(`build-line-${i}`, `intro.steps.${i}`, TYPE.line, x + mark + 28, y + (mark - cap) / 2, { part: PART, on: SCREEN_Z, tone: 'inkLight' })
    return group(`build-row-${i}`, [done, busy, words], { states: [`busy-${i}`, `done-${i}`] })
  })
  const list = column('build-list', left, 372, LINE_PITCH, items)
  return screen('opening-build', [title, rule, list])
}

export interface OpeningPiece extends FilmPiece { marks: { typing: number; level: number; build: number } }

export function makeOpening(): OpeningPiece {
  const t = openingTimes()
  const prompt = promptLayout()
  const build = buildLayout()
  const frameCount = openingFrames()
  const pose = homePose(0)
  const cursor = restPose(-400, -400, { onPage: false })
  const textX = PANEL.x + PAD
  const tilt: Record<number, number> = { 0: 0.785, 1: -0.87 }

  const promptAt = (time: number): DrawList => {
    const typed = typedAt(time)
    const states = ['rest']
    const typing = time < t.typed
    if (typing || Math.floor((time - t.typed) * 2) % 2 === 1) states.push('caret')
    if (time >= t.levelOpens && time < t.levelCloses) states.push('menu', time < t.levelPicks ? 'pick-1' : 'pick-2')
    states.push(time < t.levelPicks ? 'unset' : 'set')
    const sink = time >= t.held ? Math.min(1, (time - t.held) / SEND_SINKS) * 6 : 0
    const pressed = time >= t.levelOpens && time < t.levelCloses ? 4 : 0
    const list: DrawList = []
    drawLayout(list, prompt, {
      states,
      runtime: { 'opening.prompt': typed },
      over: {
        'prompt-caret': { x: textX + measure(TYPE.prompt.font, typed, TYPE.prompt.px).width + 5 },
        send: { z1: CONTROL_Z - sink },
        'send-mark': { z0: CONTROL_Z - sink, z1: CONTROL_Z + 2 - sink },
        level: { z1: CONTROL_Z - pressed }
      }
    })
    return list
  }

  const buildAt = (time: number): DrawList => {
    const states = ['rest']
    t.lines.forEach((l, i) => {
      if (time >= l.done) states.push(`done-${i}`)
      else if (time >= l.shown) states.push(`busy-${i}`)
    })
    const list: DrawList = []
    drawLayout(list, build, { states })
    for (const s of list) {
      const m = /^build-tick-\d+-([ab])$/.exec(s.id)
      if (m) (s as Shape).rot = tilt[m[1] === 'a' ? 0 : 1]!
    }
    return list
  }

  return {
    frameCount,
    seconds: frameCount / fps,
    size: { width: W, height: H },
    marks: { typing: Math.round((t.typed / 2) * fps), level: Math.round(((t.levelPicks + t.levelCloses) / 2) * fps), build: Math.round(((t.sent + t.end - intro.endHoldSeconds) / 2) * fps) },
    frame(index: number): Frame {
      const time = Math.max(0, index) / fps
      const sent = time >= t.sent
      return { list: sent ? buildAt(time) : promptAt(time), cursor, turn: 0, scroll: 0, page: sent ? 'opening-build' : 'opening-prompt', view: null }
    },
    pose: (): CameraPose => pose
  }
}
