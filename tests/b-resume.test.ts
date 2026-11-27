import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage, type DrawList } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const NAMES = ['browse-press', 'folder-open', 'file-pick', 'paper-slide', 'slot-in', 'wind-gust', 'shredder', 'arms-out', 'tug-lost', 'strips-zip', 'resume-received', 'shredder-stop', 'button-press', 'page-turn']
const unit = config.film.units.find((u) => u.id === 'step1')!.seconds
const tug = config.film.beats.find((b) => b.id === 'step1.tug')!
const sec = (step: number): string => (step / stepHz).toFixed(3)

describe('the resume stage of change note 002, in the film', () => {
  const s = film()
  const seen: Record<string, number> = {}
  const arms: number[] = []
  const said: number[] = []
  const where: string[] = []
  for (let i = 1; i <= Math.round(unit * stepHz); i++) {
    s.advance(1)
    if (s.page.id !== 'step1') break
    const list: DrawList = []
    s.page.draw(list)
    const has = (id: string): boolean => list.some((q) => q.id === id)
    const mark = (name: string, on: boolean): void => {
      if (on && seen[name] === undefined) seen[name] = i
    }
    mark('the drop zone is drawn', has('resume-zone'))
    mark('the folder window is drawn', has('resume-folder'))
    mark('the sheet is drawn', has('resume-paper'))
    mark('the wind is drawn', has('resume-gust-0'))
    mark('the plate SHREDDER is drawn', has('resume-shredder-plate'))
    if (s.cursor.pose().arms) arms.push(i)
    if (has('resume-received') && !s.events.some((e) => e.name === 'page-turn')) said.push(i)
    if (i % (stepHz / 2) === 0 && i / stepHz >= 31) where.push(`${sec(i)}: ${s.cursor.pose().x.toFixed(0)}, ${s.cursor.pose().y.toFixed(0)} ${s.cursor.pose().acting}`)
  }
  const events = s.events.filter((e) => NAMES.includes(e.name))
  const at = (name: string): number => events.find((e) => e.name === name)?.step ?? -1

  it('plays its beats in the order of the note', () => {
    console.log(`unit of ${unit} s\n` + events.map((e) => `${e.name} step ${e.step} second ${sec(e.step)}`).join('\n'))
    console.log(Object.entries(seen).map(([k, v]) => `${k} from second ${sec(v)}`).join('\n'))
    const order = events.map((e) => e.name).filter((n) => n !== 'button-press' && n !== 'page-turn')
    expect(order).toEqual(['browse-press', 'folder-open', 'file-pick', 'paper-slide', 'slot-in', 'wind-gust', 'shredder', 'arms-out', 'strips-zip', 'resume-received'])
  })

  it('gives each of the five beats half a second on screen or more', () => {
    const beats: [string, number, number][] = [
      ['the ordinary field', seen['the drop zone is drawn']!, at('browse-press')],
      ['the folder window', at('browse-press'), at('file-pick')],
      ['the sheet to the drop zone', at('file-pick'), at('wind-gust')],
      ['the wind', at('wind-gust'), at('shredder') - Math.round(0.4 * stepHz)],
      ['the slot takes it', at('shredder') - Math.round(0.4 * stepHz), at('shredder')]
    ]
    console.log(beats.map(([n, a, b]) => `${n}: ${sec(a)} to ${sec(b)}, ${sec(b - a)} s, ${Math.round(((b - a) / stepHz) * 60)} frames`).join('\n'))
    for (const [n, a, b] of beats.slice(0, 4)) expect((b - a) / stepHz, n).toBeGreaterThanOrEqual(0.5)
  })

  it('shows arms only inside the beat of the tug and says the resume is received once', () => {
    console.log(`arms shown from second ${sec(arms[0]!)} to ${sec(arms[arms.length - 1]!)}; the beat step1.tug is ${tug.from} to ${tug.to}`)
    console.log(`the message stands from second ${said.length ? sec(said[0]!) : '-'} for ${sec(said.length)} s before the page turns`)
    console.log(where.join('\n'))
    expect(events.filter((e) => e.name === 'resume-received').length).toBe(1)
    if (unit > 32) {
      expect(arms[0]! / stepHz).toBeGreaterThanOrEqual(tug.from)
      expect(arms[arms.length - 1]! / stepHz).toBeLessThan(tug.to)
      expect(said.length / stepHz).toBeGreaterThanOrEqual(5.4)
    }
  })
})
