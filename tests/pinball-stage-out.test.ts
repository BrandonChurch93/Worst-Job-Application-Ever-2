import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { pages } from '../src/pages'
import { makePage } from '../src/pages/step3'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'
import type { CameraPose, Shape } from '../src/stage/types'
import { BALL, LAST_Y, PAGE_H, floorZ } from '../src/table/layout'

const OUT = ['table-wide', 'table-save']
const far = (a: number[], b: number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!)

describe('the two cameras that look in over the apron', () => {
  it('leaves the last screen out for table-wide and table-save, and for no other camera', () => {
    const page = makePage()
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    for (const name of OUT) {
      const o = page.camera(name, 0)!.omit!
      expect(o.kind).toBe('well')
      expect([o.x, o.y, o.w, o.y + o.h]).toEqual([0, LAST_Y * BALL, 1920, PAGE_H])
      expect(o.z0).toBeLessThan(-3 * BALL)
    }
    for (const name of Object.keys(config.cameras)) {
      if (OUT.includes(name)) continue
      expect(page.camera(name, 0)?.omit, name).toBeUndefined()
    }
    expect(page.view()?.omit).toBeUndefined()
  })

  it('stands the apron slabs one slab high on the apron floor, as parts of the machine and not of the page', () => {
    const page = makePage()
    page.reset({ mode: 'live', variant: '', applicant: null, seed: config.seed })
    const list: Shape[] = []
    page.draw(list)
    const floor = floorZ(2) * BALL
    for (const id of ['apron-left', 'apron-right']) {
      const slab = list.find((x) => x.id === id)!
      expect([slab.z0, slab.z1]).toEqual([floor, floor + config.scale.heights.slab])
      expect(slab.role).toBe('apronSlab')
      expect(slab.tone).toBe('danger')
    }
  })

  it('switches only on a cut of the film, and never touches what the page draws', () => {
    const s = new Stage({ mode: 'film', flow: filmFlow('pinball'), pages, driver: new ScriptDriver(), film: filmOptions('pinball') })
    let before: CameraPose | null = null
    let flips = 0
    let out = 0
    while (!s.finished && s.time < 39) {
      s.advance(1)
      const pose = s.page.camera('film', s.time)!
      const list: Shape[] = []
      s.page.draw(list)
      expect(list.some((x) => x.id === 'outlet.ring')).toBe(true)
      expect(list.some((x) => x.id === 'last.out')).toBe(false)
      expect(s.page.view()?.omit).toBeUndefined()
      if (pose.omit) {
        out++
        expect(OUT.some((name) => far(s.page.camera(name, s.time)!.eye, pose.eye) < 1)).toBe(true)
      }
      if (before && !!before.omit !== !!pose.omit) {
        flips++
        expect(far(before.eye, pose.eye)).toBeGreaterThan(2 * BALL)
      }
      before = pose
    }
    expect(flips).toBe(4)
    expect(out).toBeGreaterThan(200)
  })
})
