import fs from 'node:fs'
import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { DrawList, Shape } from '../src/stage/types'
import { visit } from './polish-keys-run'

const f = (n: number | undefined, d = 2): string => (n === undefined ? '' : n.toFixed(d))
const HEAD = 'frame\ttime\tgag\tdown\ttipX\ttipY\tdeckY\tturret0 (charge:since:back)\tturret1\tbolts (id:x:y:z:share)\tkeys moved (name:dx:dy:depth:sink:hop)\tstrike\tevents'
const rowOf = (i: number, time: number, gag: string, down: boolean, x: number, y: number, list: DrawList, home: Map<string, Shape>, events: string[]): string => {
  const by = (id: string): Shape | undefined => list.find((s) => s.id === id)
  const turret = (n: number): string => {
    const t = by(`turret-${n}`)
    return t?.v ? `${f(t.v[2])}:${f(t.v[3], 3)}:${f(t.v[5])}` : ''
  }
  const bolts = list.filter((s) => /^bolt-\d+$/.test(s.id)).map((s) => `${s.id.slice(5)}:${f(s.x + s.w / 2, 0)}:${f(s.y + s.h / 2, 0)}:${f(s.z0, 0)}:${f(s.v?.[0])}`)
  const keys = list
    .filter((s) => s.id.startsWith('key-') && s.kind !== 'text')
    .map((s) => ({ s, h: home.get(s.id)! }))
    .filter(({ s, h }) => Math.abs(s.x - h.x) > 0.05 || Math.abs(s.y - h.y) > 0.05 || (s.v?.[0] ?? 0) > 0.001 || (s.v?.[6] ?? 0) !== 0 || Math.abs(s.v?.[1] ?? 0) > 0.05)
    .map(({ s, h }) => `${s.id.slice(4)}:${f(s.x - h.x, 1)}:${f(s.y - h.y, 1)}:${f(s.v?.[0])}:${f(s.v?.[6] ?? 0)}:${f(s.v?.[1] ?? 0, 1)}`)
  const strike = list.find((s) => /^scorch-9\d{4}$/.test(s.id))
  return [i, f(time, 3), gag.slice(6), down ? 1 : 0, f(x, 1), f(y, 1), f(by('keyboard-deck')?.y), turret(0), turret(1), bolts.join(' '), keys.join(' '), strike ? f(strike.v?.[0], 3) : '', events.join(',')].join('\t')
}

describe.skipIf(!process.env.POLISH_KEYS2_TABLE)('polish keys 2: what a shot, a flight, a hit and a press are, frame by frame', () => {
  it('writes the table of the visitor on the live site', () => {
    const rows = visit()
    const home = new Map<string, Shape>()
    const rest = rows.find((r) => r.gag === 'step1.firstName' && r.list.filter((s) => s.id.startsWith('key-') && s.kind !== 'text').every((s) => !s.moved))
    expect(rest).toBeDefined()
    for (const s of rest!.list) if (s.id.startsWith('key-') && s.kind !== 'text') home.set(s.id, s)
    fs.writeFileSync(process.env.POLISH_KEYS2_TABLE!, [HEAD, ...rows.map((r) => rowOf(r.i, r.time, r.gag, r.down, r.x, r.y, r.list, home, r.events))].join('\n') + '\n')
  })

  it('writes the table of the film and one hash of each frame', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
    const per = stepHz / 60
    const lists: { n: number; time: number; gag: string; x: number; y: number; list: DrawList; events: string[]; hash: string }[] = []
    let seen = 0
    let n = 0
    let events: string[] = []
    while (s.time < 32) {
      s.advance(1)
      n++
      events.push(...s.events.slice(seen).map((e) => e.name))
      seen = s.events.length
      if (n % per !== 0) continue
      const list: DrawList = []
      s.page.draw(list)
      const pose = s.cursor.pose()
      lists.push({ n: n / per, time: n / stepHz, gag: s.page.gag() ?? '', x: pose.x, y: pose.y, list, events, hash: crypto.createHash('sha1').update(JSON.stringify(list)).update(JSON.stringify(pose)).digest('hex') })
      events = []
    }
    const home = new Map<string, Shape>()
    const rest = lists.find((r) => r.gag === 'step1.firstName')!
    for (const x of rest.list) if (x.id.startsWith('key-') && x.kind !== 'text') home.set(x.id, x)
    fs.writeFileSync(process.env.POLISH_KEYS2_TABLE! + '.film', [HEAD, ...lists.map((r) => rowOf(r.n, r.time, r.gag, false, r.x, r.y, r.list, home, r.events))].join('\n') + '\n')
    fs.writeFileSync(process.env.POLISH_KEYS2_TABLE! + '.film.hash', lists.map((r) => `${r.n}\t${r.hash}`).join('\n') + '\n')
  })
})
