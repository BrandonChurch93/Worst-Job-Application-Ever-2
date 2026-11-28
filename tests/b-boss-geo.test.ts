import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { pages } from '../src/pages'
import { PageView } from '../src/shell/view'
import { BotDriver } from '../src/stage/bots'
import { Stage, type FlowEntry } from '../src/stage/stage'

const FROM = 29
const FRAMES = 300
const STEPS = 4
const SETTLED = 120

interface Count { all: number[]; flecks: number[]; shown: number[]; trails: number[] }

function plainFight(): Count {
  const flow: FlowEntry[] = [{ page: 'step4' }, { page: 'step5' }]
  const stage = new Stage({ mode: 'live', flow, pages, driver: new BotDriver('keen', 1), seed: 1 })
  stage.advance(FROM * 240)
  expect(stage.page.id).toBe('step4')
  const view = new PageView()
  const held = new Map<THREE.BufferGeometry, string>()
  const known = new WeakSet<THREE.BufferGeometry>()
  let shown = 0
  const walk = (o: THREE.Object3D): void => {
    if (!o.visible) return
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry) {
      const g = m.geometry
      if (!known.has(g)) {
        known.add(g)
        g.addEventListener('dispose', () => held.delete(g))
      }
      held.set(g, /^bullet-\d+-trail$/.test(String(o.userData.shape ?? '')) ? 'trail' : o.name)
      if (o.name === 'flecks') shown++
    }
    for (const c of o.children) walk(c)
  }
  const out: Count = { all: [], flecks: [], shown: [], trails: [] }
  const named = (name: string): number => [...held.values()].filter((n) => n === name).length
  for (let i = 0; i < FRAMES; i++) {
    stage.advance(STEPS)
    view.apply(stage.frameAt(stage.time), { width: 1920, height: 1080 })
    shown = 0
    walk(view.scene)
    out.all.push(held.size)
    out.flecks.push(named('flecks'))
    out.shown.push(shown)
    out.trails.push(named('trail'))
  }
  expect(stage.page.id).toBe('step4')
  return out
}

describe('the geometries the boss page holds in the plain fight', () => {
  const count = plainFight()

  it('has sparks to count: they come and go all through the 300 frames', () => {
    expect(Math.max(...count.shown)).toBeGreaterThan(0)
    expect(count.shown.filter((n, i) => i > 0 && n > count.shown[i - 1]!).length).toBeGreaterThan(20)
  })

  it('holds the flecks of no spark that is over: in every frame as many as there are sparks in the air', () => {
    count.flecks.forEach((n, i) => expect([i, n]).toEqual([i, count.shown[i]!]))
  })

  it('holds no more at the 300th frame than at the 120th, the sparks in the air and the trails of the bullets aside', () => {
    const level = count.all.map((n, i) => n - count.flecks[i]! - count.trails[i]!)
    expect(level[FRAMES - 1]!).toBeLessThanOrEqual(level[SETTLED - 1]!)
    expect(Math.max(...level.slice(SETTLED)) - Math.min(...level.slice(SETTLED))).toBe(0)
  })
})
