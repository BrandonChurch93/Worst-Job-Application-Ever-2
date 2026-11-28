import { describe, expect, it } from 'vitest'
import { config, stepHz } from '../src/config'
import { LOOK1_ON } from '../src/boss/tune'
import { finishNow, seatView, viewNow } from '../src/boss/viewof'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const open = config.film.shutterDegrees / 360 / config.film.fps
const SHUTTER = [0, 0.25, 0.75]

// What the boss's parts are given when a picture is drawn: the step the picture's own anchor names.
const given = (f: ReturnType<Stage['frameAt']>): { time: number; figure: number | null } => {
  const anchor = f.list.find((s) => s.id === 'boss-look')!
  seatView(anchor)
  return { time: viewNow()!.time, figure: finishNow()?.time ?? null }
}
const picture = (stage: Stage, at: number): { time: number; figure: number | null }[] => SHUTTER.map((k) => given(stage.frameAt(at + k * open)))

// The first film frame (a whole number of sixtieths) at which `when` holds, looked for from `from` on.
const find = (when: () => boolean, from = 0): number => {
  const stage = film()
  const per = stepHz / config.film.fps
  stage.advance(Math.round(from * stepHz))
  while (stage.page.id === 'step4' && stage.time < 200) {
    stage.frameAt(stage.time)
    if (when()) return stage.time
    stage.advance(per * 6)
  }
  return -1
}

describe('a picture of the boss is the same however often and in whatever order it is drawn', () => {
  const fight = find(() => (viewNow()?.bullets.length ?? 0) > 0)
  const rise = find(() => (finishNow()?.power ?? null) !== null)
  const fall = find(() => (viewNow()?.boss.beaten ?? 0) > 0, fight)

  it.runIf(LOOK1_ON)('the film has a moment with bullets in the air, a moment of the power-up and a moment of the boss\'s fall', () => {
    expect(fight).toBeGreaterThan(0)
    expect(rise).toBeGreaterThan(0)
    expect(fall).toBeGreaterThan(fight)
  })

  for (const [name, at] of [['the fight', fight], ['the power-up', rise], ['the fall', fall]] as const) {
    it.runIf(LOOK1_ON)(`${name}: the three moments of the shutter are three steps of the page, and a second drawing of the same frame gives the parts the same three`, () => {
      const stage = film()
      const first = picture(stage, at)
      expect(first[1]!.time - first[0]!.time).toBeCloseTo(1 / stepHz, 9)
      expect(first[2]!.time - first[1]!.time).toBeCloseTo(1 / stepHz, 9)
      expect(picture(stage, at)).toEqual(first)
      expect(picture(stage, at)).toEqual(first)
    })

    it.runIf(LOOK1_ON)(`${name}: a frame drawn again after the frame that follows it, its steps still kept, gives the parts what it gives them drawn alone`, () => {
      const alone = picture(film(), at)
      const stage = film()
      picture(stage, at)
      const next = picture(stage, at + 1 / config.film.fps)
      expect(next[0]!.time).toBeGreaterThan(alone[2]!.time)
      expect(picture(stage, at)).toEqual(alone)
      expect(picture(stage, at + 1 / config.film.fps)).toEqual(next)
    })

    it.runIf(LOOK1_ON)(`${name}: a frame drawn after a later frame whose steps are no longer kept gives the parts what it gives them drawn alone`, () => {
      const alone = picture(film(), at)
      const stage = film()
      picture(stage, at + 0.2)
      expect(picture(stage, at)).toEqual(alone)
    })
  }

  it.runIf(LOOK1_ON)('two films side by side do not take each other\'s steps', () => {
    const a = film()
    const b = film()
    const one = picture(a, fight)
    picture(b, fight + 2 / config.film.fps)
    picture(b, fight)
    expect(picture(a, fight)).toEqual(one)
  })
})
