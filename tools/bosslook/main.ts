// The harness of look 1: the site's own engine, light, studio and ground on an empty page, with the boss added from a hand-written view.
import { App } from '../../src/app'
import { makeBoss, type BossLook } from '../../src/boss/look1'
import type { BossView } from '../../src/boss/view'
import { label } from '../../src/boss/body'
import { restPose } from '../../src/cursor/body'
import { homeDistance } from '../../src/stage/camera'
import { TYPE } from '../../src/shell/parts'
import type { Emitter } from '../../src/real/types'
import type { Frame } from '../../src/stage/stage'
import type { CameraPose, Shape } from '../../src/stage/types'
import { tierSamples } from '../../src/config'
import { wordAt } from '../../src/boss/look1'

interface Spec { view: BossView; cx: number; cy: number; zoom: number; width: number; height: number; tier?: string; level?: 'low' | 'medium' | 'high'; word?: boolean; options?: Record<string, unknown> }

const canvas = document.getElementById('stage') as HTMLCanvasElement
const app = new App()
let boss: BossLook | null = null
let key = ''

const ready = app.start(canvas, { format: 'hd', assets: 'full', capture: true })

async function render(spec: Spec): Promise<{ triangles: number; drawCalls: number; ms: number }> {
  await ready
  const k = JSON.stringify([spec.options ?? {}, spec.level ?? null])
  if (!boss || k !== key) {
    if (boss) { app.view.scene.remove(boss.object); boss.dispose() }
    boss = makeBoss({ ...(spec.options ?? {}), level: spec.level ?? null })
    app.view.scene.add(boss.object)
    key = k
  }
  const list: Shape[] = []
  const w = wordAt(spec.view)
  if (spec.word !== false && w.show) list.push(label('boss-word', 'boss-body', 'copy:step4.submit', w.x, w.y, TYPE.button, w.z, 'inkLight', w.rot))
  const frame: Frame = { list, cursor: restPose(-400, -400, { onPage: false }), turn: 0, scroll: 0, page: 'bosslook', view: null, time: spec.view.time }
  const pose: CameraPose = { eye: [spec.cx - 960, 540 - spec.cy, homeDistance() / spec.zoom], target: [spec.cx - 960, 540 - spec.cy, 0], fov: 20 }
  app.engine.setSize(spec.width, spec.height)
  app.setLevel(spec.level ?? null)
  app.put(frame, { width: 1920, height: 1080 }, pose)
  const lit: Emitter[] = []
  boss.pose(spec.view, 1 / 60, (e) => lit.push({ ...e, x: e.x - 960, y: 540 - e.y }))
  app.rig.setEmitters([...app.view.emitters(), ...lit])
  app.setCamera(pose, spec.width, spec.height)
  const t0 = performance.now()
  await app.engine.picture(app.shot(), { samples: spec.level ? 1 : tierSamples(spec.tier ?? 'draft'), frame: 0, diagnostic: 'beauty' })
  const ms = performance.now() - t0
  return { ...app.engine.lastCounts, ms }
}

// Counts of the boss alone: the same frame with and without him.
async function counts(spec: Spec): Promise<{ with: { triangles: number; drawCalls: number; ms: number }; without: { triangles: number; drawCalls: number; ms: number } }> {
  const a = await render(spec)
  boss!.object.visible = false
  await app.engine.picture(app.shot(), { samples: 1, frame: 0, diagnostic: 'beauty' })
  const t0 = performance.now()
  await app.engine.picture(app.shot(), { samples: spec.level ? 1 : tierSamples(spec.tier ?? 'draft'), frame: 0, diagnostic: 'beauty' })
  const without = { ...app.engine.lastCounts, ms: performance.now() - t0 }
  boss!.object.visible = true
  return { with: a, without }
}

declare global { interface Window { bosslook: { ready: Promise<void>; render: typeof render; counts: typeof counts } } }
window.bosslook = { ready, render, counts }
