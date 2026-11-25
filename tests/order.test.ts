import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (unit: string): Stage => new Stage({ mode: 'film', flow: filmFlow(unit), pages, driver: new ScriptDriver(), film: filmOptions(unit) })

describe('a film frame depends on its own moment only', () => {
  const fps = config.film.fps
  const open = config.film.shutterDegrees / 360 / fps
  for (const u of config.film.units) {
    it(`${u.id}: the same draw list in order, backwards and alone`, () => {
      const count = 36
      const frames = Array.from({ length: count }, (_, i) => Math.round(((i + 0.5) / count) * u.seconds * fps))
      const moments = frames.flatMap((f) => [f / fps, f / fps + 0.5 * open])
      const forward = film(u.id)
      const inOrder = moments.map((t) => JSON.stringify(forward.frameAt(t)))
      const backward = film(u.id)
      const reversed = [...moments].reverse().map((t) => JSON.stringify(backward.frameAt(t))).reverse()
      const differs = moments.filter((_, i) => reversed[i] !== inOrder[i])
      expect(differs).toEqual([])
      const again = moments.map((t) => JSON.stringify(forward.frameAt(t)))
      expect(moments.filter((_, i) => again[i] !== inOrder[i])).toEqual([])
      for (const i of [5, 29, 50, 71]) expect(JSON.stringify(film(u.id).frameAt(moments[i]!))).toBe(inOrder[i])
    }, 120000)
  }
})
