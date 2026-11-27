import { describe, expect, it } from 'vitest'
import { stepHz } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('step1'), pages, driver: new ScriptDriver(), film: filmOptions('step1') })
const NAMES = ['browse-press', 'folder-open', 'file-pick', 'paper-slide', 'slot-in', 'wind-gust', 'shredder', 'arms-out', 'tug-lost', 'strips-zip', 'resume-received', 'shredder-stop']

describe('the resume stage of change note 002', () => {
  it('plays its beats in the film in the order of the note', () => {
    const s = film()
    s.advance(Math.round(32 * stepHz))
    const got = s.events.filter((e) => NAMES.includes(e.name)).map((e) => `${e.name} ${e.step} ${(e.step / stepHz).toFixed(3)}`)
    console.log(got.join('\n'))
    expect(got.map((g) => g.split(' ')[0])).toEqual(['browse-press', 'folder-open', 'file-pick', 'paper-slide', 'slot-in', 'wind-gust', 'shredder', 'arms-out', 'strips-zip', 'resume-received'])
  })
})
