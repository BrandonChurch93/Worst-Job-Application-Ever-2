import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { liveFlow, MouseDriver, Stage } from '../src/stage/stage'
import type { DrawList, Shape } from '../src/stage/types'
import { keyBlock, makeVisitor, VISITOR } from '../tools/lib/pack-site.mjs'

export interface KeyRow { name: string; depth: number; hop: number; heat: number; top: number; y: number; tipY: number }
export interface Row {
  i: number; time: number; gag: string; down: boolean; px: number; py: number; x: number; y: number; z: number; taken: boolean; squash: number; turn: number; damage: string
  events: string[]; keys: KeyRow[]; all: Map<string, KeyRow>; shake: number; deckY: number; charge: [number, number]; lamp: number; slot: number; slotY: number; strips: number; zoneY: number; list: DrawList
}
export const PER = stepHz / 60

const keyRow = (s: Shape): KeyRow => ({ name: s.id.slice(4), depth: s.v?.[0] ?? 0, hop: s.v?.[1] ?? 0, heat: s.v?.[3] ?? 0, top: s.z1, y: s.y, tipY: s.v?.[4] ?? 0 })

// The pack's own visitor on the stepped live stage with no browser, one row for each frame of 60 while the visit is on step 1.
export function visit(mostSeconds = 90): Row[] {
  const d = new MouseDriver()
  const s = new Stage({ mode: 'live', flow: liveFlow(), pages, driver: d })
  const v = makeVisitor(1, VISITOR, keyBlock(config))
  const rows: Row[] = []
  let seen = 0
  let at = { x: VISITOR.start[0] as number, y: VISITOR.start[1] as number }
  let was = false
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
    if (!on) continue
    const c = s.cursor.pose()
    const list: DrawList = []
    s.page.draw(list)
    const by = (id: string): Shape | undefined => list.find((x) => x.id === id)
    const all = new Map<string, KeyRow>()
    for (const x of list) if (x.id.startsWith('key-') && x.kind !== 'text') all.set(x.id.slice(4), keyRow(x))
    const deck = by('keyboard-deck')
    const jaw = by('shredder-jaw-0')
    rows.push({
      i, time: s.time, gag: s.page.gag() ?? '', down: d.pointer.down, px: at.x, py: at.y, x: c.x, y: c.y, z: c.z, taken: c.taken, squash: c.squash, turn: c.lean + c.spin, damage: c.damage.join('+'), events,
      keys: [...all.values()].filter((k) => k.depth > 0.001), all, shake: deck?.v?.[2] ?? 0, deckY: deck?.y ?? 0, charge: [by('turret-0')?.v?.[2] ?? 0, by('turret-1')?.v?.[2] ?? 0], lamp: all.get('enter')?.depth ?? 0,
      slot: jaw?.v?.[0] ?? 0, slotY: jaw?.y ?? 0, strips: list.filter((x) => x.id.startsWith('strip-')).length, zoneY: by('resume-zone')?.y ?? 0, list
    })
  }
  return rows
}

const f = (n: number, d = 1): string => n.toFixed(d)
export const HEAD = 'frame\ttime\tgag\tdown\tptrX\tptrY\ttipX\ttipY\tz\ttaken\tsquash\tturn\tdamage\tshake\tdeckY\tcharge0\tcharge1\tslot\tslotY\tstrips\tzoneY\tkeys down (name:depth:top)\tevents'
export const line = (r: Row): string => [r.i, f(r.time, 3), r.gag.slice(6), r.down ? 1 : 0, f(r.px, 0), f(r.py, 0), f(r.x), f(r.y), f(r.z), r.taken ? 1 : 0, f(r.squash, 3), f(r.turn, 3), r.damage, f(r.shake, 2), f(r.deckY, 2), f(r.charge[0], 2), f(r.charge[1], 2), f(r.slot, 2), f(r.slotY, 1), r.strips, f(r.zoneY, 1), r.keys.map((k) => `${k.name}:${f(k.depth, 2)}:${f(k.top, 2)}`).join(' '), r.events.filter((e) => e !== 'step').join(' ')].join('\t')
