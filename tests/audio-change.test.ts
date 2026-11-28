import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { changeCue, changeCues, changeCuesOf, changeLoops, changeStops, coverOf, cueFor, eventMatches } from '../src/audio/change'
import { allCues, cueOfEvent, cuesToCome, loopCues, newEventCues, newSilent, quietPageCues, stopEvents } from '../src/audio/cues'
import { CHAIN, CLASS_LEVEL } from '../src/audio/levels'

const root = process.cwd()
const text = (...p: string[]) => readFileSync(path.join(root, ...p), 'utf8')
const read = (...p: string[]) => JSON.parse(text(...p))
const cfg: any = read('config', 'showcase.json')
const file: any = read('audio', 'CHANGE-CUES.json')
const rows: any[] = file.cues
const prompts: Record<string, { prompt: string; loop?: boolean; seconds?: number }> = read('audio', 'PROMPTS.json').cues
const kit = allCues(cfg.audio.sfx as { id: string; seconds: number }[]).map((c) => c.id)
const none = () => false
const all = () => true
const plain = (row: any): string[] => row.events.filter((e: string) => !e.includes('*'))
const row = (id: string) => rows.find((r) => r.id === id)

describe('the list of the change notes, audio/CHANGE-CUES.json', () => {
  it('is what the audio code reads, row for row', () => {
    expect(changeCues).toEqual(rows)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(changeCue(r.id), r.id).toEqual(r)
  })

  it('gives every row an id of its own, a length, a class of levels.ts, its events, a stand-in or null, and one line of what is heard', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
    for (const r of rows) {
      expect(r.id, r.id).toMatch(/^[a-z0-9-]+$/)
      expect(kit, `${r.id} is a cue of the kit or of the build already`).not.toContain(r.id)
      expect(typeof r.seconds === 'number' && r.seconds > 0, r.id).toBe(true)
      expect(Object.keys(CLASS_LEVEL).filter((c) => c !== 'voice'), r.id).toContain(r.class)
      expect(['tone', 'music'], r.id).not.toContain(r.class)
      expect(typeof r.made, r.id).toBe('boolean')
      expect(Array.isArray(r.events) && r.events.length > 0, r.id).toBe(true)
      expect(r.standIn === null || kit.includes(r.standIn), `${r.id} stands in ${r.standIn}`).toBe(true)
      expect(typeof r.describes === 'string' && r.describes.length > 8 && !r.describes.includes('\\n'), r.id).toBe(true)
      for (const key of Object.keys(r)) expect(['id', 'seconds', 'class', 'loop', 'variants', 'made', 'events', 'page', 'standIn', 'covers', 'stops', 'describes', 'playedBy', 'orderedBy'], `${r.id}.${key}`).toContain(key)
      if (r.page !== undefined) expect(['step1', 'step2', 'step3', 'step4', 'step5'], r.id).toContain(r.page)
    }
  })

  it('repeats, as each row\'s stand-in, what its events play today by the table of cues', () => {
    for (const r of rows) for (const e of plain(r)) {
      const today = cueOfEvent(e)
      expect(today === r.id ? null : today ?? null, `${r.id} on ${e}`).toBe(r.standIn)
      if (r.standIn === null && today === undefined && newSilent.includes(e)) expect(newEventCues[e], e).toBeUndefined()
    }
    for (const r of rows) for (const e of r.events.filter((x: string) => x.includes('*'))) {
      expect(e.startsWith('strike:'), `${r.id} on ${e}`).toBe(true)
      expect(r.standIn, r.id).toBeNull()
      expect(cueOfEvent(e.replace(/\*/g, 'x')), e).toBeUndefined()
    }
    for (const [event, id] of Object.entries(cuesToCome)) expect(row(id)?.events, id).toContain(event)
  })

  it('has a prompt, word for word the one asked, for every row that is made and none for a row still to be made', () => {
    for (const r of rows) {
      if (!r.made) {
        expect(prompts[r.id], r.id).toBeUndefined()
        continue
      }
      expect(typeof prompts[r.id]?.prompt === 'string' && prompts[r.id]!.prompt.length > 20, r.id).toBe(true)
      expect(Boolean(prompts[r.id]!.loop), r.id).toBe(Boolean(r.loop))
      expect(prompts[r.id]!.seconds, `${r.id}: its length is in the list alone`).toBeUndefined()
    }
  })

  it('holds the rows the Builder named, with the events and the stand-ins he named', () => {
    const named: Record<string, { events: string[]; page?: string; standIn: string | null }> = {
      'turret-cannon': { events: ['bolt-fire'], page: 'step1', standIn: 'bolt-fire' },
      'slab-slam': { events: ['slab-drop'], page: 'step1', standIn: 'slab-drop' },
      'keys-break': { events: ['keys-break'], standIn: 'button-crack' },
      'button-burst': { events: ['button-crack'], page: 'step4', standIn: 'button-crack' },
      'big-fire': { events: ['big-fire'], standIn: 'slab-fire' }
    }
    for (const [id, want] of Object.entries(named)) {
      const r = row(id)
      expect(r, id).toBeDefined()
      expect({ events: r.events, page: r.page, standIn: r.standIn }, id).toEqual({ events: want.events, page: want.page, standIn: want.standIn })
      expect(r.made, id).toBe(true)
    }
    expect(row('slab-slam').covers).toEqual(['page-crack'])
    expect(Object.fromEntries(rows.filter((r) => r.covers).map((r) => [r.id, r.covers]))).toEqual({ 'slab-slam': ['page-crack'], 'pin-bumper': ['bumper'], 'pin-target': ['drop-target'], 'pin-kick': ['scoop-kick'], 'pin-sling': ['sling'] })
    expect(row('vacuum-slip').class).toBe('mechanism')
    expect(row('volume-sign').class).toBe('tick')
    expect(rows.filter((r) => r.loop).map((r) => r.id)).toEqual(['vacuum-roar'])
    expect(changeLoops).toEqual(['vacuum-roar'])
    for (const id of changeLoops) expect(loopCues, id).not.toContain(id)
    expect(changeStops('vacuum-lose')).toEqual(['vacuum-roar'])
    for (const r of rows) for (const e of r.stops ?? []) expect(stopEvents[e] ?? [], e).not.toContain(r.id)
    expect(changeCuesOf('bullet-fire')).toEqual([])
    expect(cueOfEvent('bullet-fire')).toBe('bolt-fire')
  })

  it('holds every sound of the shell\'s list with that list\'s length and events', () => {
    const shell: { id: string; seconds: number; events: string[] }[] = read('pipeline', 'change002', 'shell-sounds-to-make.json').sounds
    for (const s of shell) {
      const r = row(s.id)
      expect(r, s.id).toBeDefined()
      expect(r.seconds, s.id).toBe(s.seconds)
      if (!s.events.some((e) => e.includes('*'))) expect(r.events, s.id).toEqual(s.events)
      else for (const e of r.events) expect(e.startsWith('strike:'), `${s.id} on ${e}`).toBe(true)
    }
    expect(rows.length).toBe(shell.length + 5)
  })

  it('writes no length of the list a second time in the sound code or in the prompts', () => {
    const src = readdirSync(path.join(root, 'src', 'audio')).filter((f) => f.endsWith('.ts'))
    for (const f of src) {
      const body = text('src', 'audio', f)
      for (const r of rows) {
        const at = body.split('\n').filter((line) => new RegExp(`['"\`]${r.id}['"\`]`).test(line) && /\bseconds\b|\d\.\d/.test(line))
        expect(at, `${f} writes a number beside ${r.id}`).toEqual([])
      }
    }
    expect(text('src', 'audio', 'cues.ts')).not.toMatch(/file to come|files to come|cuesToMake/)
  })

  it('counts none of its rows against audio.extraCuesMax and adds none to audio.sfx', () => {
    const extra: { id: string }[] = read('audio', 'EXTRA-CUES.json').cues
    for (const r of rows) {
      expect(extra.some((x) => x.id === r.id), r.id).toBe(false)
      expect((cfg.audio.sfx as { id: string }[]).some((x) => x.id === r.id), r.id).toBe(false)
    }
  })
})

describe('what an event of the list plays', () => {
  it('matches a name with * for any run of letters and a plain name only as itself', () => {
    expect(eventMatches('strike:*.bumper.*', 'strike:office.bumper.3:2')).toBe(true)
    expect(eventMatches('strike:*.bumper.*', 'strike:office.sling.left:1')).toBe(false)
    expect(eventMatches('strike:street.firehouse:*', 'strike:street.firehouse:2')).toBe(true)
    expect(eventMatches('bolt-fire', 'bolt-fire')).toBe(true)
    expect(eventMatches('bolt-fire', 'bolt-fire-2')).toBe(false)
    expect(eventMatches('a.b', 'axb')).toBe(false)
  })

  it('plays exactly what the table of cues gives while no sound of the list is kept', () => {
    const names = new Set<string>([...rows.flatMap((r) => plain(r)), ...Object.keys(newEventCues), ...newSilent, 'strike:office.bumper.3:2', 'page-crack', 'slab-fire', 'bolt-hit', 'no-such-event'])
    for (const name of names) for (const page of [undefined, 'step1', 'step4']) expect(cueFor(name, page, none), `${name} on ${page}`).toBe(cueOfEvent(name))
    expect(coverOf('page-crack', none)).toBeUndefined()
  })

  it('plays the row\'s own cue once its sound is kept, on the row\'s page only', () => {
    const kept = (...ids: string[]) => (id: string) => ids.includes(id)
    expect(cueFor('bolt-fire', 'step1', kept('turret-cannon'))).toBe('turret-cannon')
    expect(cueFor('bolt-fire', undefined, kept('turret-cannon'))).toBe('turret-cannon')
    expect(cueFor('bolt-fire', 'step4', kept('turret-cannon'))).toBe('bolt-fire')
    expect(cueFor('bolt-fire', 'step1', kept('slab-slam'))).toBe('bolt-fire')
    expect(cueFor('button-crack', 'step4', kept('button-burst'))).toBe('button-burst')
    expect(cueFor('arena-break', 'step4', kept('button-burst'))).toBe('button-crack')
    expect(cueFor('big-fire', 'step4', kept('big-fire'))).toBe('big-fire')
    expect(cueFor('slab-fire', 'step4', kept('big-fire', 'cannon-fire', 'turret-cannon'))).toBe('slab-fire')
    expect(cueFor('date-hit', 'step2', kept('stop-press'))).toBe('stop-press')
    expect(cueFor('vacuum-on', 'step3', kept('vacuum-roar'))).toBe('vacuum-roar')
    for (const e of ['stage-out-phone', 'stage-out-birth', 'stage-out-volume']) expect(cueFor(e, 'step2', kept('row-close')), e).toBe('row-close')
    expect(cueFor('strike:office.bumper.3:2', 'step3', kept('pin-bumper'))).toBe('pin-bumper')
    expect(cueFor('strike:office.sling.left:1', 'step3', kept('pin-bumper'))).toBeUndefined()
    expect(cueFor('strike:street.bank.drop.2:2', 'step3', all)).toBe('pin-target')
    expect(cueFor('strike:street.firehouse:2', 'step3', all)).toBe('pin-kick')
    expect(cueFor('strike:plunger:2', 'step3', all)).toBeUndefined()
    expect(cueFor('bumper', 'step3', all)).toBe('bumper')
    expect(coverOf('page-crack', kept('slab-slam'))?.id).toBe('slab-slam')
    expect(coverOf('page-crack', kept('keys-break'))).toBeUndefined()
    for (const r of rows) for (const e of plain(r)) expect(cueFor(e, r.page, kept(r.id)), `${r.id} on ${e}`).toBe(r.id)
  })

  it('gives no event two rows on one page, so the order of the list decides nothing', () => {
    const names = [...new Set(rows.flatMap((r) => plain(r)))]
    for (const name of names) for (const page of ['step1', 'step2', 'step3', 'step4', 'step5']) expect(changeCuesOf(name, page).length, `${name} on ${page}`).toBeLessThanOrEqual(1)
    const strikes = ['plunger', 'corporate.sling.left', 'corporate.revolving', 'corporate.hq', 'office.bumper.2', 'office.cubicles.drop.3', 'office.sling.right', 'office.rail', 'steel.1', 'office.gate', 'street.rail', 'street.bank.drop.1', 'street.firehouse', 'street.highway', 'street.garage']
    for (const id of strikes) for (const n of [1, 2, 3]) expect(changeCuesOf(`strike:${id}:${n}`, 'step3').length, id).toBeLessThanOrEqual(1)
  })

  it('leaves the careers page with the press of its button alone: no row plays on it or stands in for that press', () => {
    for (const r of rows) {
      expect(r.page, r.id).not.toBe('marketing')
      for (const cue of quietPageCues) {
        expect(r.id, r.id).not.toBe(cue)
        expect(r.events, r.id).not.toContain(cue)
      }
    }
    expect(CHAIN.contactMaxSeconds).toBeGreaterThan(0)
  })
})
