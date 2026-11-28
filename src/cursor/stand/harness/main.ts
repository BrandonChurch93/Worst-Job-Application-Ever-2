// The standing arrow and the finish alone, on the arena, drawn through the site's own light and finishing. Used by pipeline/change002/finish-shots.mjs; not part of the site.
import * as THREE from 'three'
import { App } from '../../../app'
import { ARENA, arenaPart } from '../../../arena'
import { makeBoss, poseOf, SIZE, type BossLook } from '../../../boss/look1'
import { finishPart, finishState, kneelSpot, makeFinish, type FinishInput } from '../../../boss/finish/index'
import type { BossView, ViewCorner } from '../../../boss/view'
import type { QualityId } from '../../../core/quality'
import { restPose } from '../../body'
import type { PartMaker, RealContext } from '../../../real/types'
import { real } from '../../../real/index'
import { frame as frameBox, homePose } from '../../../stage/camera'
import type { Frame } from '../../../stage/stage'
import type { CameraPose, Shape } from '../../../stage/types'
import { STAND } from '../rig'

export interface Ask {
  input: FinishInput
  // The rise of a standing figure, radians. Left out: the rig's own.
  rise?: number
  // What the camera frames, page px: a box seen from straight above, or 'front' for the figure seen at a right angle to its own plane, as the pose sheet shows it.
  cam?: { x: number; y: number; w: number; h: number } | 'front' | null
  // The fallen boss: where, and how far gone (0 whole, 1 only the button). Left out: no boss.
  boss?: { x: number; y: number; heading?: number; gone?: number } | null
  arena?: boolean
  // Draw the ordinary arrow too, at the input's place, while the figure is down.
  arrow?: boolean
  level?: QualityId | null
  samples?: number
}

const canvas = document.getElementById('stage') as HTMLCanvasElement
const app = new App()
let view: BossView | null = null
let input: FinishInput | null = null
let level: QualityId | null = null
const own = STAND.rise

function viewOf(a: Ask): BossView {
  const corners = ARENA.corners.map((c, i) => ({ id: i as 0 | 1 | 2 | 3, x: c.x, y: c.y, aim: Math.atan2(540 - c.y, 960 - c.x), tell: 0, firedAt: null })) as [ViewCorner, ViewCorner, ViewCorner, ViewCorner]
  const gun = { aim: 0, tell: 0, firedAt: null }
  const s = finishState(a.input)
  const beam = s.fx.beam
  return {
    time: 40 + a.input.time,
    phase: 'beaten',
    boss: {
      x: a.boss?.x ?? 960, y: a.boss?.y ?? 650, vx: 0, vy: 0, heading: a.boss?.heading ?? Math.PI / 2, walked: 0, form: 1, turret: 1, locked: true, health: 0, stage: 2,
      shield: { glancedAt: null, half: 0.6 }, guns: [gun, { ...gun }], big: null, weak: null, healedAt: null, hitAt: null, beaten: 1, gone: a.boss?.gone ?? 0
    },
    bullets: [], darts: [], hits: [], corners, arrow: { x: a.input.arrow.x, y: a.input.arrow.y, flat: 0, flatAt: null }, breaks: [],
    finish: beam && a.boss ? { x0: beam.x, y0: beam.y, x1: a.boss.x, y1: a.boss.y, power: beam.power, firedAt: 40 + a.input.time - beam.age } : null
  }
}

const bossLook: PartMaker = {
  key: (s: Shape): string | null => (s.kind === 'anchor' ? 'boss-look1' : ''),
  make(): THREE.Object3D {
    const look = makeBoss()
    look.object.userData.look = look
    return look.object
  },
  pose(o: THREE.Object3D, _s: Shape, ctx: RealContext): void {
    if (view) (o.userData.look as BossLook).pose(view, 1 / 60, ctx.light)
  },
  drop(o: THREE.Object3D): void {
    ;(o.userData.look as BossLook | undefined)?.dispose()
  }
}

async function boot(): Promise<void> {
  await app.start(canvas, { format: 'hd', assets: 'web', capture: true })
  const parts = real.parts as Record<string, PartMaker | null>
  parts['boss-arena'] = arenaPart(() => view)
  parts['boss-look1'] = bossLook
  parts['boss-finish'] = finishPart(() => input, () => level)
}

function camera(a: Ask): CameraPose {
  if (!a.cam) return homePose()
  if (a.cam !== 'front') return frameBox(a.cam)
  const s = finishState(a.input)
  const r = STAND.rise * s.pose.rise
  const c = Math.cos(r)
  const sn = Math.sin(r)
  const mid = 42
  const far = 760
  const at: [number, number, number] = [s.pose.x - 960, 540 - s.pose.y + mid * c, mid * sn]
  return { eye: [at[0], at[1] - sn * far, at[2] + c * far], target: at, fov: 20, up: [0, c, sn] }
}

async function draw(a: Ask): Promise<{ triangles: number; drawCalls: number; ms: number; finish: { draws: number; triangles: number }; up: boolean; press: number }> {
  STAND.rise = a.rise ?? own
  input = a.input
  level = a.level ?? null
  view = a.arena === false ? null : viewOf(a)
  const list: Shape[] = []
  const anchor = (id: string, part: string): Shape => ({ id, part, kind: 'anchor', x: 0, y: 0, w: 1920, h: 1080, z0: 0, z1: 0, tone: 'dark' })
  if (view) list.push(anchor('arena', 'boss-arena'))
  if (view && a.boss) list.push(anchor('boss', 'boss-look1'))
  list.push(anchor('finish', 'boss-finish'))
  const s = finishState(a.input)
  const frame: Frame = { list, cursor: restPose(a.input.arrow.x, a.input.arrow.y, { onPage: a.arrow === true && !s.up }), turn: 0, scroll: 0, page: 'step4', view: null, time: a.input.time }
  const pose = camera(a)
  app.setLevel(level)
  app.put(frame, { width: 1920, height: 1080 }, pose)
  app.setCamera(pose)
  const t0 = performance.now()
  await app.engine.picture(app.shot(), { samples: level ? 1 : (a.samples ?? 8), frame: 0, diagnostic: 'beauty' })
  app.engine.renderer.getContext().finish()
  const ms = performance.now() - t0
  let finish = { draws: 0, triangles: 0 }
  app.view.scene.traverse((o) => {
    const f = o.userData.finish as ReturnType<typeof makeFinish> | undefined
    if (f) finish = f.counts()
  })
  return { ...app.engine.lastCounts, ms, finish, up: s.up, press: s.press }
}

// Where the button lies once the boss is gone, and where the figure kneels to strike it.
function button(boss: NonNullable<Ask['boss']>, arrow: { x: number; y: number }): { x: number; y: number; w: number; top: number; kneel: { x: number; y: number } } {
  const word = poseOf(viewOf({ input: { time: 0, arrow }, boss: { ...boss, gone: 1 } })).word
  const b = { x: word.x, y: word.y, w: SIZE.button.w, top: word.z }
  return { ...b, kneel: kneelSpot(b) }
}

async function png(): Promise<string> {
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/png'))
  const bytes = new Uint8Array(await blob!.arrayBuffer())
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

declare global { interface Window { finishHarness: { ready: Promise<void>; draw: typeof draw; png: typeof png; button: typeof button; failed?: string } } }
const ready = boot()
window.finishHarness = { ready, draw, png, button }
ready.catch((e) => { window.finishHarness.failed = String(e instanceof Error ? e.stack : e) })
