// The arena alone, drawn from hand-written views through the site's own light and finishing. Used by tools/arena-shots.mjs; not part of the site.
import * as THREE from 'three'
import { App } from '../../app'
import type { BossView, ViewBreak, ViewCorner, ViewHit } from '../../boss/view'
import type { QualityId } from '../../core/quality'
import { restPose } from '../../cursor/body'
import type { PartMaker } from '../../real/types'
import { real } from '../../real/index'
import { block } from '../../shell/metrics'
import { words } from '../../shell/words'
import { homePose } from '../../stage/camera'
import type { Frame } from '../../stage/stage'
import type { Shape } from '../../stage/types'
import { ARENA, arenaPart, arenaWell, shake } from '../index'

export interface Ask {
  time: number
  breaks?: ViewBreak[]
  hits?: ViewHit[]
  health?: number
  boss?: { x: number; y: number; heading?: number } | null
  big?: { tell: number; aim: number; firedAt: number | null; x0: number; y0: number; x1: number; y1: number; width: number } | null
  corners?: { aim?: number; tell?: number; firedAt?: number | null }[]
  level?: QualityId | null
  samples?: number
  shake?: boolean
}

const canvas = document.getElementById('stage') as HTMLCanvasElement
const app = new App()
let view: BossView | null = null
let box: THREE.Mesh | null = null

function viewOf(a: Ask): BossView {
  const corners = ARENA.corners.map((c, i) => ({ id: i as 0 | 1 | 2 | 3, x: c.x, y: c.y, aim: a.corners?.[i]?.aim ?? Math.atan2(540 - c.y, 960 - c.x), tell: a.corners?.[i]?.tell ?? 0, firedAt: a.corners?.[i]?.firedAt ?? null })) as [ViewCorner, ViewCorner, ViewCorner, ViewCorner]
  const gun = { aim: 0, tell: 0, firedAt: null }
  return {
    time: a.time,
    phase: a.time < 2.9 ? 'form' : a.time < 4.65 ? 'turret' : 'fight',
    boss: {
      x: a.boss?.x ?? 960, y: a.boss?.y ?? 550, vx: 0, vy: 0, heading: a.boss?.heading ?? Math.PI / 2, walked: 0, form: 1, turret: 1, locked: true, health: a.health ?? 1, stage: 0,
      shield: { glancedAt: null, half: 0.6 }, guns: [gun, { ...gun }], big: a.big ?? null, weak: null, healedAt: null, hitAt: null, beaten: 0
    },
    bullets: [], darts: [], hits: a.hits ?? [], corners, arrow: { x: 960, y: 900, flat: 0, flatAt: null }, breaks: a.breaks ?? []
  }
}

function listOf(v: BossView): Shape[] {
  const list: Shape[] = []
  const well = arenaWell(v)
  if (well) list.push({ id: 'arena-well', part: 'boss-arena', kind: 'well', x: well.x, y: well.y, w: well.w, h: well.h, z0: well.z0, z1: 0, tone: 'dark' })
  list.push({ id: 'arena', part: 'boss-arena', kind: 'anchor', x: 0, y: 0, w: 1920, h: 1080, z0: 0, z1: 0, tone: 'dark' })
  if (v.time >= ARENA.barLands) {
    const type = { font: ARENA.label.font, px: ARENA.label.px }
    const b = block(type.font, words('copy:step4.bossHealthLabel'), type.px)
    list.push({ id: 'health-label', part: 'type', kind: 'text', x: ARENA.label.x - b.width / 2, y: ARENA.label.y - b.cap / 2, w: b.width, h: b.height, z0: 0, z1: 0, tone: 'ink', words: 'copy:step4.bossHealthLabel', type })
  }
  return list
}

async function boot(): Promise<void> {
  await app.start(canvas, { format: 'hd', assets: 'web', capture: true })
  ;(real.parts as Record<string, PartMaker | null>)['boss-arena'] = arenaPart(() => view)
}

async function draw(a: Ask): Promise<{ triangles: number; drawCalls: number; ms: number }> {
  view = viewOf(a)
  if (a.boss && !box) {
    // The boss as a plain box, 226 wide.
    box = new THREE.Mesh(new THREE.BoxGeometry(226, 226, 150), new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.6, metalness: 0.2 }))
    box.castShadow = true
    app.view.scene.add(box)
  }
  if (box) {
    box.visible = !!a.boss
    if (a.boss) {
      box.position.set(a.boss.x - 960, 540 - a.boss.y, 75)
      box.rotation.z = -(a.boss.heading ?? Math.PI / 2)
    }
  }
  const frame: Frame = { list: listOf(view), cursor: restPose(960, 900, { onPage: false }), turn: 0, scroll: 0, page: 'step4', view: null, time: a.time }
  const pose = homePose()
  if (a.shake) {
    const s = shake(a.time, (a.breaks ?? []).map((b) => b.at))
    pose.eye = [pose.eye[0] + s.x, pose.eye[1] + s.y, pose.eye[2]]
    pose.target = [pose.target[0] + s.x, pose.target[1] + s.y, pose.target[2]]
  }
  app.setLevel(a.level ?? null)
  app.put(frame, { width: 1920, height: 1080 }, pose)
  app.setCamera(pose)
  const t0 = performance.now()
  await app.engine.picture(app.shot(), { samples: a.level ? 1 : (a.samples ?? 8), frame: 0, diagnostic: 'beauty' })
  app.engine.renderer.getContext().finish()
  const ms = performance.now() - t0
  return { ...app.engine.lastCounts, ms }
}

async function png(): Promise<string> {
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/png'))
  const bytes = new Uint8Array(await blob!.arrayBuffer())
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

declare global { interface Window { arenaHarness: { ready: Promise<void>; draw: typeof draw; png: typeof png; failed?: string } } }
const ready = boot()
window.arenaHarness = { ready, draw, png }
ready.catch((e) => { window.arenaHarness.failed = String(e instanceof Error ? e.stack : e) })
