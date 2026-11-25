import { config } from '../config'
import { quality, qualityIds } from '../core/quality'
import type { QualityLevel } from '../ui/picker'
import { labels } from './labels'
import css from './probe.module.css'
import { fpsText, measure, report, wouldPick, type ProbeMachine, type ProbeResult, type ProbeScene } from './stats'

export type { ProbeMachine, ProbeResult, ProbeScene }

// The four scenes the kit names, each with the beat of the film it is taken from.
export const PROBE_SCENES: ProbeScene[] = [
  { id: 'careers', unit: 'marketing', beat: 'marketing.stroll' },
  { id: 'step1-fire', unit: 'step1', beat: 'step1.firstName' },
  { id: 'reply-all', unit: 'pinball', beat: 'pinball.replyAll' },
  { id: 'boss', unit: 'boss', beat: 'boss.slabs' }
]

export interface ProbeRunner {
  // Plays one scene at one level for that many seconds with a bot driving, and calls frame with the wall time of every drawn frame, in seconds.
  // It resolves when the scene has played. A scene that cannot be played rejects: the page writes it down and goes on.
  play(scene: ProbeScene, level: string, seconds: number, frame: (seconds: number) => void): Promise<void>
  // Optional. The graphics card's name, read from the context the picture is drawn with. Left out, the page asks a context of its own.
  graphicsCard?(): string
}

export function graphicsCard(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return name
  } catch {
    return ''
  }
}

function machine(run: ProbeRunner): ProbeMachine {
  const ratio = window.devicePixelRatio || 1
  return {
    card: run.graphicsCard ? run.graphicsCard() : graphicsCard(),
    screen: `${screen.width} x ${screen.height} at ${ratio}`,
    window: `${window.innerWidth} x ${window.innerHeight}`,
    browser: navigator.userAgent
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string | undefined, parent: HTMLElement, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  parent.append(e)
  return e
}

export function mountProbe(host: HTMLElement, run: ProbeRunner): void {
  const levels: QualityLevel[] = qualityIds.map((id) => ({ id, minFps: quality(id).minFps }))
  const seconds = config.perf.probeSeconds
  const root = el('div', css.root, host)
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keyup', 'wheel'] as const) root.addEventListener(type, (e) => e.stopPropagation())
  const status = el('p', css.status, root)
  status.setAttribute('role', 'status')
  const panel = el('section', css.panel, root)
  panel.hidden = true
  el('h1', css.title, panel, labels.title)
  const table = el('table', css.table, panel)
  const facts = el('dl', css.facts, panel)
  const block = el('pre', css.block, panel)
  block.tabIndex = 0
  const buttons = el('div', css.buttons, panel)
  const copy = el('button', css.button, buttons, labels.copy)
  copy.type = 'button'
  const again = el('button', css.quiet, buttons, labels.again)
  again.type = 'button'

  const draw = (results: ProbeResult[], m: ProbeMachine) => {
    table.replaceChildren()
    const head = el('tr', undefined, el('thead', undefined, table))
    el('th', undefined, head)
    for (const scene of PROBE_SCENES) {
      const th = el('th', undefined, head, scene.id)
      th.colSpan = 2
      th.scope = 'colgroup'
    }
    const sub = el('tr', undefined, table.tHead!)
    el('th', undefined, sub)
    for (let i = 0; i < PROBE_SCENES.length; i++) {
      el('th', css.sub, sub, labels.median).scope = 'col'
      el('th', css.sub, sub, labels.slowest).scope = 'col'
    }
    const body = el('tbody', undefined, table)
    for (const level of levels) {
      const tr = el('tr', undefined, body)
      el('th', undefined, tr, level.id).scope = 'row'
      for (const scene of PROBE_SCENES) {
        const r = results.find((x) => x.level === level.id && x.scene === scene.id)
        if (!r || r.failed) {
          el('td', css.failed, tr, labels.failed).colSpan = 2
          continue
        }
        el('td', r.medianFps < level.minFps ? css.under : undefined, tr, fpsText(r.medianFps))
        el('td', undefined, tr, fpsText(r.slowestFps))
      }
    }
    facts.replaceChildren()
    const fact = (name: string, value: string) => {
      el('dt', undefined, facts, name)
      el('dd', undefined, facts, value)
    }
    fact(labels.card, m.card || labels.unknown)
    fact(labels.screen, m.screen)
    fact(labels.window, m.window)
    fact(labels.pick, wouldPick(results, levels))
    block.textContent = report(results, levels, PROBE_SCENES, m, seconds)
  }

  let busy = false
  const start = async () => {
    if (busy) return
    busy = true
    panel.hidden = true
    status.hidden = false
    const results: ProbeResult[] = []
    const total = levels.length * PROBE_SCENES.length
    for (const level of levels) {
      for (const scene of PROBE_SCENES) {
        status.textContent = `${labels.running} ${results.length + 1} / ${total}: ${level.id}, ${scene.id}`
        const times: number[] = []
        try {
          await run.play(scene, level.id, seconds, (t) => times.push(t))
        } catch {
          times.length = 0
        }
        results.push(measure(scene.id, level.id, times))
      }
    }
    draw(results, machine(run))
    copy.textContent = labels.copy
    status.hidden = true
    panel.hidden = false
    busy = false
  }

  copy.addEventListener('click', async () => {
    const text = block.textContent ?? ''
    let done = false
    try {
      await navigator.clipboard.writeText(text)
      done = true
    } catch {
      const range = document.createRange()
      range.selectNodeContents(block)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      try {
        done = document.execCommand('copy')
      } catch {
        done = false
      }
    }
    if (done) copy.textContent = labels.copied
  })
  again.addEventListener('click', () => void start())
  void start()
}
