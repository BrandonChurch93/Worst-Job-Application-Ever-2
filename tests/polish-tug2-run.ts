import { config, stepHz } from '../src/config'
import type { CursorPose } from '../src/cursor/body'
import { pages } from '../src/pages'
import { SLOT } from '../src/pages/step1/layout'
import { openOf, shutOf } from '../src/pages/step1/real/shredderShape'
import { BotDriver } from '../src/stage/bots'
import { liveFlow, MouseDriver, Stage } from '../src/stage/stage'
import type { DrawList, Shape } from '../src/stage/types'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'

export const PER = stepHz / 60
export const BODY = { x: 14, y: 26 }
export interface Frame {
  i: number; time: number; gag: string; down: boolean; px: number; py: number; pose: CursorPose; taken: boolean; events: string[]
  angle: number; heat: number; arms: number; paper: number; paperX: number; paperY: number; far: number; zoneY: number; open: number; shut: number; slotY: number; strips: Shape[]; keys: Map<string, Shape>; words: Map<string, Shape>; list: DrawList
}

const deg = (r: number): number => (r * 180) / Math.PI

function frame(s: Stage, i: number, down: boolean, px: number, py: number, events: string[]): Frame {
  const c = s.cursor.pose()
  const list: DrawList = []
  s.page.draw(list)
  const by = (id: string): Shape | undefined => list.find((x) => x.id === id)
  const paper = by('resume-paper')
  const jaw = by('shredder-jaw-1')
  const keys = new Map<string, Shape>()
  const words = new Map<string, Shape>()
  for (const x of list) {
    if (x.id.startsWith('key-') && x.kind !== 'text') keys.set(x.id.slice(4), x)
    if (x.id.startsWith('key-') && x.kind === 'text') words.set(x.id.slice(4, -7), x)
  }
  const busy = c.arms ? Math.min(1, Math.max(0, c.sprout)) : 0
  return {
    i, time: s.time, gag: s.page.gag() ?? '', down, px, py, pose: c, taken: c.taken, events,
    angle: deg(c.lean + c.spin), heat: c.feel.heat * (1 - 0.72 * busy), arms: c.arms ? c.sprout : 0, paper: deg(paper?.rot ?? 0), paperX: paper?.x ?? 0, paperY: paper?.y ?? 0,
    far: Math.hypot(c.x + BODY.x - SLOT.cx, c.y + BODY.y - SLOT.cy), zoneY: by('resume-zone')?.y ?? 0, open: openOf(jaw), shut: shutOf(jaw), slotY: jaw?.y ?? 0, strips: list.filter((x) => x.id.startsWith('strip-')), keys, words, list
  }
}

// The pack's own visitor, or a bot, on the stepped live stage with no browser: one row for each frame of 60 while the visit is on step 1.
export function visit(who: 'visitor' | 'keen' | 'clumsy' = 'visitor', mostSeconds = 120): Frame[] {
  const rows: Frame[] = []
  let seen = 0
  let was = false
  if (who !== 'visitor') {
    const bot = new BotDriver(who, config.seed)
    const hand = bot as unknown as { x: number; y: number }
    const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: bot })
    for (let i = 0; i < mostSeconds * 60 && !s.finished; i++) {
      s.advance(PER)
      const events = s.events.slice(seen).map((e) => e.name)
      seen = s.events.length
      const on = s.page.id === 'step1' && !s.turning
      if (was && !on) break
      was = on
      if (on) rows.push(frame(s, i, false, hand.x, hand.y, events))
    }
    return rows
  }
  const d = new MouseDriver()
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
  const v = makeVisitor(1, VISITOR, keyBlock(config))
  let at = { x: VISITOR.start[0] as number, y: VISITOR.start[1] as number }
  for (let i = 0; i < mostSeconds * 60 && !s.finished; i++) {
    const pose = s.cursor.pose()
    const t = { time: s.time, page: s.page.id, gags: s.gagsReached, finished: s.finished, turning: s.turning, scroll: s.page.scroll(), hint: s.page.hint(), hero: { x: pose.x, y: pose.y }, hits: s.events.filter((e) => e.hitsCursor).map((e) => ({ name: e.name, page: e.page, x: e.x, y: e.y })) }
    for (const a of v.act(t) as Record<string, unknown>[]) {
      if (a.move) {
        at = { x: (a.move as number[])[0]!, y: (a.move as number[])[1]! }
        Object.assign(d.pointer, { x: at.x, y: at.y })
      }
      if (a.down) d.pointer.down = true
      if (a.up) d.pointer.down = false
      if (a.wheel) d.pulse({ wheel: a.wheel as number })
      if (a.press) d.pulse({ key: a.press === 'Space' ? ' ' : (a.press as string) })
    }
    s.advance(PER)
    const events = s.events.slice(seen).map((e) => e.name)
    seen = s.events.length
    const on = s.page.id === 'step1' && !s.turning
    if (was && !on) break
    was = on
    if (on) rows.push(frame(s, i, d.pointer.down, at.x, at.y, events))
  }
  return rows
}

const f = (n: number, d = 1): string => n.toFixed(d)
export const HEAD = 'frame\ttime\tgag\ttaken\tptrX\tptrY\ttipX\ttipY\tz\tarms\tgrip\tstrain\tangle\tlean\tspin\tsquash\theat\tacting\treaction\tpaperDeg\tfar\tspeed\tzoneY\tslotY\topen\tstrips\tevents'
export const line = (r: Frame, before?: Frame): string =>
  [r.i, f(r.time, 3), r.gag.slice(6), r.taken ? 1 : 0, f(r.px, 0), f(r.py, 0), f(r.pose.x), f(r.pose.y), f(r.pose.z), f(r.arms, 2), f(r.pose.grip[0], 2), f(r.pose.strain, 2), f(r.angle), f(deg(r.pose.lean)), f(deg(r.pose.spin)), f(r.pose.squash, 3), f(r.heat, 3), r.pose.acting, r.pose.reaction ?? '-', f(r.paper), f(r.far),
    before ? f(Math.hypot(r.pose.x - before.pose.x, r.pose.y - before.pose.y), 2) : '', f(r.zoneY, 2), f(r.slotY, 2), f(r.open, 3), r.strips.length, r.events.filter((e) => e !== 'step').join(' ')].join('\t')
