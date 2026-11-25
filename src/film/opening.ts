import { config } from '../config'
import type { LayoutNode } from '../copy'
import { restPose } from '../cursor/body'
import { column, drawLayout, group, node, text, type Item } from '../shell/layout'
import { block, measure, wrapLines } from '../shell/metrics'
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
const HEAD_TURN = Math.PI / 4

const TYPE = {
  prompt: { font: 'inter-400', px: 68 },
  level: { font: 'inter-500', px: 52 },
  title: { font: 'inter-display-600', px: 80 },
  line: { font: 'inter-400', px: 52 }
} satisfies Record<string, TypeSpec>

const SCREEN_Z = 2
const PANEL_Z = 12
const CONTROL_Z = 20
const MENU_Z = 34
const PANEL = { x: 216, y: 312, w: 1488, h: 456 }
const PAD = 64
const WRAP = PANEL.w - PAD * 2
const PILL = { w: 320, h: 96 }
const SEND = 96
const ROW = 96
const BAR = 16
const MARK = 56
const LINE_GAP = 32
const BUILD = { top: 220, ruleGap: 36, listGap: 48 }

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

function promptLines(): { from: number; text: string }[] {
  let at = 0
  return wrapLines(TYPE.prompt.font, intro.prompt, TYPE.prompt.px, WRAP).map((line) => {
    const from = intro.prompt.indexOf(line, at)
    at = from + line.length
    return { from, text: line }
  })
}

export const typedLines = (typed: string): string[] => promptLines().filter((l) => typed.length > l.from).map((l) => typed.slice(l.from, l.from + l.text.length))

export const typedAt = (time: number): string => intro.prompt.slice(0, Math.min(intro.prompt.length, Math.max(0, Math.floor(time * intro.charsPerSecond + 1e-9) + 1)))

const screen = (id: string, children: LayoutNode[]): LayoutNode => node(id, 'page', [0, 0, W, H], { part: PART, children: [node(`${id}-screen`, 'screen', [0, 0, W, H], { part: PART, tone: 'dark', height: SCREEN_Z, children })] })

export function promptLayout(): LayoutNode {
  const capOf = (t: TypeSpec) => block(t.font, 'X', t.px).cap
  const textX = PANEL.x + PAD
  const textY = PANEL.y + PAD + 8
  const rowY = PANEL.y + PANEL.h - PAD - (SEND + PILL.h) / 2
  const sendX = PANEL.x + PANEL.w - PAD - SEND
  const sendY = PANEL.y + PANEL.h - PAD - SEND
  const levelWord = (id: string, x: number, y: number, on: number, tone: string, states?: string[]): LayoutNode =>
    text(id, 'intro.reasoningLevel', { ...TYPE.level, align: 'centre' }, x, y - capOf(TYPE.level) / 2, { part: PART, on, tone, ...(states ? { states } : {}) })
  const pill = node('level', 'control', [textX, rowY, PILL.w, PILL.h], {
    part: PART, shape: 'capsule', tone: 'metal', height: CONTROL_Z, floor: PANEL_Z,
    children: [
      node('level-unset', 'bar', [textX + 56, rowY + PILL.h / 2 - BAR / 2, PILL.w - 112, BAR], { part: PART, shape: 'capsule', tone: 'pocket', height: CONTROL_Z + 2, floor: CONTROL_Z, states: ['unset'] }),
      levelWord('level-word', textX + PILL.w / 2, rowY + PILL.h / 2, CONTROL_Z, 'ink', ['set'])
    ]
  })
  const menuY = rowY + PILL.h + 12
  const rows: LayoutNode[] = []
  const bars = [150, 206]
  for (let i = 0; i < 3; i++) {
    const y = menuY + 10 + i * ROW
    const last = i === 2
    rows.push(node(`level-row-${i}`, 'option', [textX + 10, y, PILL.w + 44 - 20, ROW - 8], {
      part: PART, shape: 'capsule', tone: 'pocket', height: MENU_Z + 4, floor: MENU_Z, states: [`pick-${i}`],
      children: []
    }))
    rows.push(last
      ? levelWord('level-option-word', textX + 10 + 36 + block(TYPE.level.font, intro.reasoningLevel, TYPE.level.px).width / 2, y + (ROW - 8) / 2, MENU_Z + 4, 'ink')
      : node(`level-option-${i}`, 'bar', [textX + 10 + 36, y + (ROW - 8) / 2 - BAR / 2, bars[i]!, BAR], { part: PART, shape: 'capsule', tone: 'dark', height: MENU_Z + 6, floor: MENU_Z + 4 }))
  }
  const menu = node('level-menu', 'menu', [textX, menuY, PILL.w + 44, 3 * ROW + 12], { part: PART, tone: 'light', r: 24, height: MENU_Z, floor: PANEL_Z + 2, over: true, states: ['menu'], children: rows })
  const send = node('send', 'control', [sendX, sendY, SEND, SEND], {
    part: PART, shape: 'disc', tone: 'accent', height: CONTROL_Z, floor: PANEL_Z,
    children: [
      node('send-mark', 'mark', [sendX + SEND / 2 - 5, sendY + SEND / 2 - 20, 10, 44], { part: PART, shape: 'capsule', tone: 'light', height: CONTROL_Z + 2, floor: CONTROL_Z }),
      node('send-head-a', 'mark', [sendX + SEND / 2 - 24, sendY + SEND / 2 - 17, 30, 10], { part: PART, shape: 'capsule', tone: 'light', height: CONTROL_Z + 2, floor: CONTROL_Z, over: true }),
      node('send-head-b', 'mark', [sendX + SEND / 2 - 6, sendY + SEND / 2 - 17, 30, 10], { part: PART, shape: 'capsule', tone: 'light', height: CONTROL_Z + 2, floor: CONTROL_Z, over: true })
    ]
  })
  const typed = text('prompt-typed', 'runtime:opening.prompt', { ...TYPE.prompt, wrap: WRAP }, textX, textY, { part: PART, on: PANEL_Z, runtime: intro.prompt })
  const caret = node('prompt-caret', 'caret', [textX, textY - 13, 5, capOf(TYPE.prompt) + 26], { part: PART, tone: 'accent', height: PANEL_Z + 2, floor: PANEL_Z, states: ['caret'], over: true })
  const panel = node('prompt-panel', 'panel', [PANEL.x, PANEL.y, PANEL.w, PANEL.h], { part: PART, tone: 'raised', r: 40, height: PANEL_Z, floor: SCREEN_Z, children: [typed, caret, pill, send] })
  return screen('opening-prompt', [panel, menu])
}

export function buildLayout(): LayoutNode {
  const mark = MARK
  const k = mark / 40
  const cap = block(TYPE.line.font, 'X', TYPE.line.px).cap
  const head = block(TYPE.title.font, intro.title, TYPE.title.px)
  const wide = Math.ceil(head.width)
  const left = Math.round((W - wide) / 2)
  const ruleY = BUILD.top + Math.round(head.cap) + BUILD.ruleGap
  const title = text('build-title', 'intro.title', TYPE.title, left, BUILD.top, { part: PART, on: SCREEN_Z, tone: 'inkLight' })
  const rule = node('build-rule', 'rule', [left, ruleY, wide, 3], { part: PART, tone: 'metal', height: SCREEN_Z + 2, floor: SCREEN_Z })
  const items: Item[] = intro.steps.map((_, i): Item => (x, y) => {
    const tick = [
      node(`build-tick-${i}-a`, 'mark', [x + 10 * k, y + 19 * k, 12 * k, 6 * k], { part: PART, shape: 'capsule', tone: 'dark', height: SCREEN_Z + 8, floor: SCREEN_Z + 6, states: [`done-${i}`] }),
      node(`build-tick-${i}-b`, 'mark', [x + 15 * k, y + 17 * k, 20 * k, 6 * k], { part: PART, shape: 'capsule', tone: 'dark', height: SCREEN_Z + 8, floor: SCREEN_Z + 6, states: [`done-${i}`], over: true })
    ]
    const done = node(`build-done-${i}`, 'mark', [x, y, mark, mark], { part: PART, shape: 'disc', tone: 'light', height: SCREEN_Z + 6, floor: SCREEN_Z, states: [`done-${i}`], children: tick })
    const busy = node(`build-busy-${i}`, 'mark', [x, y, mark, mark], {
      part: PART, shape: 'disc', tone: 'metal', height: SCREEN_Z + 4, floor: SCREEN_Z, states: [`busy-${i}`],
      children: [node(`build-busy-${i}-eye`, 'mark', [x + 9 * k, y + 9 * k, mark - 18 * k, mark - 18 * k], { part: PART, shape: 'disc', tone: 'dark', height: SCREEN_Z + 5, floor: SCREEN_Z + 4, states: [`busy-${i}`] })]
    })
    const words = text(`build-line-${i}`, `intro.steps.${i}`, TYPE.line, x + mark + 32, y + (mark - cap) / 2, { part: PART, on: SCREEN_Z, tone: 'inkLight' })
    return group(`build-row-${i}`, [done, busy, words], { states: [`busy-${i}`, `done-${i}`] })
  })
  const list = column('build-list', left, ruleY + BUILD.listGap, LINE_GAP, items)
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
  const caretY = PANEL.y + PAD + 8 - 13
  const lead = block(TYPE.prompt.font, intro.prompt, TYPE.prompt.px, WRAP).lead
  const tilt: Record<number, number> = { 0: 0.785, 1: -0.87 }

  const promptAt = (time: number): DrawList => {
    const lines = typedLines(typedAt(time))
    const last = lines[lines.length - 1] ?? ''
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
      runtime: { 'opening.prompt': lines.join('\n') },
      over: {
        'prompt-caret': { x: textX + measure(TYPE.prompt.font, last, TYPE.prompt.px).width + 6, y: caretY + (lines.length - 1) * lead },
        send: { z1: CONTROL_Z - sink },
        'send-mark': { z0: CONTROL_Z - sink, z1: CONTROL_Z + 2 - sink },
        'send-head-a': { z0: CONTROL_Z - sink, z1: CONTROL_Z + 2 - sink, rot: -HEAD_TURN },
        'send-head-b': { z0: CONTROL_Z - sink, z1: CONTROL_Z + 2 - sink, rot: HEAD_TURN },
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
