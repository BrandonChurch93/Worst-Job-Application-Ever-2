import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { makeBoss } from '../src/boss/look1/index'
import { LOOK1_ON } from '../src/boss/tune'
import type { BossView } from '../src/boss/view'
import { viewNow } from '../src/boss/viewof'
import { pages } from '../src/pages'
import { filmFlow, filmOptions, ScriptDriver, Stage } from '../src/stage/stage'

const film = (): Stage => new Stage({ mode: 'film', flow: filmFlow('boss'), pages, driver: new ScriptDriver(), film: filmOptions('boss') })
const r = (n: number): number => Math.round(n * 1e4) / 1e4

const stuff = (x: THREE.Material): string => {
  const m = x as THREE.MeshStandardMaterial
  return `${m.type} ${m.color ? m.color.getHexString() : ''} ${m.emissive ? m.emissive.getHexString() : ''} ${r(m.opacity)} ${m.name}`
}

// All that a picture is made of, for every object of the boss that is seen: where it is, how it is turned, its size and what it is made of.
const stateOf = (root: THREE.Object3D): string[] => {
  const out: string[] = []
  const walk = (o: THREE.Object3D, path: string): void => {
    if (!o.visible) {
      out.push(`${path} hidden`)
      return
    }
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    const made = m === undefined ? '' : (Array.isArray(m) ? m : [m]).map(stuff).join('+')
    out.push(`${path} at ${[o.position.x, o.position.y, o.position.z].map(r).join(',')} turned ${[o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w].map(r).join(',')} sized ${[o.scale.x, o.scale.y, o.scale.z].map(r).join(',')} of ${made}`)
    o.children.forEach((c, i) => walk(c, `${path}/${i}${c.name ? `:${c.name}` : ''}`))
  }
  walk(root, 'boss')
  return out
}

describe('the boss as drawn keeps nothing from one picture to the next', () => {
  it.runIf(LOOK1_ON)('a moment of the film posed after any later moment is posed as it is posed alone: every part of the boss that is seen, the bay and the carriage of the cannon among them, through the fight, the fall, the blast and the pieces that are left', () => {
    const stage = film()
    const views: { at: number; gag: string; view: BossView }[] = []
    let gone = -1
    while (stage.page.id === 'step4' && stage.time < 200) {
      stage.advance(6)
      if (stage.page.id !== 'step4') break
      stage.frameAt(stage.time)
      const v = viewNow()
      if (!v) continue
      views.push({ at: stage.time, gag: stage.page.gag() ?? '', view: structuredClone(v) })
      if (gone < 0 && stage.events.some((e) => e.name === 'boss-gone')) gone = views.length - 1
    }
    expect(gone).toBeGreaterThan(0)
    const fire = views.findIndex((x) => (x.view.boss.gone ?? 0) > 0)
    expect(fire).toBeGreaterThan(0)
    expect(fire).toBeLessThan(gone)
    const early = [0.1, 0.3, 0.5, 0.7, 0.9, 0.98].map((k) => views[Math.floor(fire * k)]!)
    const late = [...Array.from({ length: 12 }, (_, i) => views[fire + Math.round(((gone - fire) * (i + 1)) / 12)]!), views[Math.min(views.length - 1, gone + 20)]!, views[views.length - 1]!]
    const alone = early.map((e) => {
      const one = makeBoss()
      one.pose(e.view, 0)
      return stateOf(one.object)
    })
    for (const e of alone) expect(e.length).toBeGreaterThan(20)
    const used = makeBoss()
    let checked = 0
    for (const l of late) {
      used.pose(l.view, 0)
      early.forEach((e, i) => {
        used.pose(e.view, 0)
        expect(stateOf(used.object), `the moment ${e.at.toFixed(2)} s (${e.gag}) posed after ${l.at.toFixed(2)} s (${l.gag})`).toEqual(alone[i])
        checked++
        used.pose(l.view, 0)
      })
    }
    expect(checked).toBe(early.length * late.length)
    const all = makeBoss()
    for (const l of late) all.pose(l.view, 0)
    early.forEach((e, i) => {
      all.pose(e.view, 0)
      expect(stateOf(all.object), `the moment ${e.at.toFixed(2)} s after the whole blast`).toEqual(alone[i])
    })
    for (let i = late.length - 1; i >= 0; i--) {
      const one = makeBoss()
      one.pose(late[i]!.view, 0)
      all.pose(late[i]!.view, 0)
      expect(stateOf(all.object), `the moment ${late[i]!.at.toFixed(2)} s of the blast, posed after later ones`).toEqual(stateOf(one.object))
    }
  }, 240000)
})
