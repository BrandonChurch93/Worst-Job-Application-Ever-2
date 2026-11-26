import { config } from '../config'

const t = config.table

export type V = [number, number]
export type P3 = [number, number, number]
export type TierId = 'corporate' | 'office' | 'street'

export const BALL = t.ballPx
export const R = 0.5
export const W = t.tierWidthBalls
export const TH = t.tierHeightBalls
export const SCREEN = 1080 / BALL
export const MARQUEE_Y = SCREEN
export const MARQUEE_H = t.marqueeHeightBalls
export const TIERS = t.tiers as TierId[]
export const TIER_Y = TIERS.map((_, k) => MARQUEE_Y + MARQUEE_H + TH * k)
export const APRON_Y = TIER_Y[2]! + TH
export const APRON_H = 2
export const LAST_Y = APRON_Y + APRON_H
export const PAGE_BALLS = LAST_Y + SCREEN
export const PAGE_H = PAGE_BALLS * BALL
export const floorZ = (k: number): number => -(t.topFloorDepthBalls + k * t.tierStepBalls)
export const tierAt = (y: number): number => (y < TIER_Y[1]! ? 0 : y < TIER_Y[2]! ? 1 : 2)

export const COS25 = 0.9063077870366499
export const SIN25 = 0.42261826174069944
export const GRAVITY = 29.4

export const COLS = { border: 0.15, liftA: 1.55, liftB: 3.05, left: 3.25, right: 16.75, launchA: 16.95, launchB: 18.45, feed: 19.15, railB: 19.85, lift: 2.3, launch: 17.7 }
export const MID = 10
export const MOUTH = { half: 1.7, v: 10.35, hole: 11.05 }
export const OUTLANE = { inner: 4.65, v: 10.3 }
export const FLIP = { pivotU: 6.53, pivotV: 8.95, length: t.flipperBalls, radius: 0.4, tip: 0.26, rest: 25, up: -25, seconds: 0.07 }
export const FLIP_REACH = FLIP.length - FLIP.tip
export const FLIP_END_V = FLIP.pivotV + FLIP.length * SIN25
export const INLANE = { a: [OUTLANE.inner, 8.05] as V, b: [6.45, 8.5] as V, shoulder: 9.45 }
export const SLING = { a: [6.05, 5.55] as V, b: [6.05, 7.05] as V, c: [7.35, 7.45] as V }
export const INSERTS = { spots: [[8.3, 7.1], [MID, 8.0], [11.7, 7.1]] as V[], r: 0.62 }

export interface Seg { id: string; tier: number; a: V; b: V; kind: 'wall' | 'guide' | 'rubber' }
export interface Post { id: string; tier: number; c: V; r: number; lamp?: boolean }
export interface Model { id: string; tier: number; part: string; box: [number, number, number, number]; h: number; tone: string; solid: boolean; standing: boolean; round?: boolean; base?: number; sign?: string; signPx?: number; signAt?: [number, number]; bay?: [number, number, number] }
export interface Bumper { id: string; tier: number; c: V; r: number }
export interface Sling { id: string; tier: number; side: 'left' | 'right'; a: V; b: V; c: V }
export interface Target { id: string; tier: number; kind: 'drop' | 'standup' | 'spinner'; box: [number, number, number, number]; n: V; index: number }
export interface Insert { id: string; tier: number; c: V; r: number; mode: number; picture: string; index: number }
export interface Flipper { id: string; tier: number; side: 'left' | 'right'; pivot: V; index: number }
export interface Hold { id: string; tier: number; kind: 'gate' | 'scoop' | 'hatch' | 'kicker' | 'port' | 'plunger'; c: V; r: number; releases: boolean; stand?: V; mouth?: V }
export interface Rail { id: string; from: string; to: string; points: P3[]; speed: number; out: V; hidden?: boolean }
export interface Opening { id: string; tier: number; a: V; b: V }
export interface Display { id: string; tier: number; box: [number, number, number, number] }
export interface Lamp { id: string; tier: number; c: V; group: string; arrow?: V }
export interface Flat { id: string; tier: number; part: string; box: [number, number, number, number]; tone: string; round?: boolean }

export interface Table {
  segs: Seg[]; posts: Post[]; models: Model[]; bumpers: Bumper[]; slings: Sling[]; targets: Target[]; inserts: Insert[]; flippers: Flipper[]
  holds: Hold[]; rails: Rail[]; openings: Opening[]; displays: Display[]; lamps: Lamp[]; flats: Flat[]; sealed: string[]
  log: string[]
}

const segs: Seg[] = []
const posts: Post[] = []
const models: Model[] = []
const bumpers: Bumper[] = []
const slings: Sling[] = []
const targets: Target[] = []
const inserts: Insert[] = []
const flippers: Flipper[] = []
const holds: Hold[] = []
const rails: Rail[] = []
const openings: Opening[] = []
const displays: Display[] = []
const lamps: Lamp[] = []
const flats: Flat[] = []

const at = (k: number, u: number, v: number): V => [u, TIER_Y[k]! + v]
const nearest = (p: V, a: V, b: V): V => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return [a[0] + dx * u, a[1] + dy * u]
}
const INLANE_FOOT = nearest(SLING.b, INLANE.a, INLANE.b)
const SLING_FOOT = ((): V => {
  const q = nearest(SLING.c, [FLIP.pivotU, FLIP.pivotV], [FLIP.pivotU + FLIP_REACH * COS25, FLIP.pivotV + FLIP_REACH * SIN25])
  const along = Math.hypot(q[0] - FLIP.pivotU, q[1] - FLIP.pivotV) / FLIP_REACH
  const r = FLIP.radius + (FLIP.tip - FLIP.radius) * along
  const d = Math.hypot(SLING.c[0] - q[0], SLING.c[1] - q[1])
  return [q[0] + ((SLING.c[0] - q[0]) / d) * r, q[1] + ((SLING.c[1] - q[1]) / d) * r]
})()
const mir = (u: number): number => W - u
const seg = (k: number, id: string, a: V, b: V, kind: Seg['kind'] = 'wall'): void => {
  segs.push({ id: `${TIERS[k]}.${id}`, tier: k, a: at(k, a[0], a[1]), b: at(k, b[0], b[1]), kind })
}
const both = (k: number, id: string, a: V, b: V, kind: Seg['kind'] = 'wall'): void => {
  seg(k, `${id}.left`, a, b, kind)
  seg(k, `${id}.right`, [mir(a[0]), a[1]], [mir(b[0]), b[1]], kind)
}
const open = (k: number, id: string, a: V, b: V): void => {
  openings.push({ id: `${TIERS[k]}.${id}`, tier: k, a: at(k, a[0], a[1]), b: at(k, b[0], b[1]) })
}
const model = (k: number, id: string, part: string, box: [number, number, number, number], h: number, tone: string, extra: Partial<Model> = {}): void => {
  models.push({ id: `${TIERS[k]}.${id}`, tier: k, part, box: [box[0], TIER_Y[k]! + box[1], box[2], box[3]], h, tone, solid: true, standing: true, ...extra })
}
const dropBank = (k: number, id: string, u: number, v0: number, v1: number): void => {
  const n = t.dropTargetsPerBank
  const pitch = (v1 - v0) / n
  for (let i = 0; i < n; i++) targets.push({ id: `${TIERS[k]}.${id}.${i + 1}`, tier: k, kind: 'drop', box: [u, TIER_Y[k]! + v0 + i * pitch + 0.02, 0.2, pitch - 0.04], n: [1, 0], index: targets.length })
}

const LADDER: P3[] = [[12.3, 5.6, 0], [13.5, 5.1, 0.6], [15.2, 4.75, 1.2], [16.1, 5.1, 1.4], [15.9, 5.7, 1.2], [14.6, 5.75, 0.7], [13.0, 5.9, 0.2], [12.3, 6.0, 0]]
const GARAGE: V = [15.2, 5.45]
const CUBICLES = { u: 5.85, deep: 1.85 }
const INBOX = { u: 15.2, deep: 1.45 }
export const SPIRAL = { c: GARAGE, r: 0.75, pitch: t.minClearanceBalls + 0.05, under: t.minClearanceBalls + 0.05, tail: 0.2, perTurn: 24, frame: 1.525 }
export const SPIRAL_TOP = SPIRAL.under + SPIRAL.tail + t.spiralTurns * SPIRAL.pitch
export const HIGHWAY_TOP = SPIRAL_TOP + 0.3
const HIGHWAY: P3[] = ([[6.9, 4.9, 0], [7.6, 4.2, 0.175], [9.0, 3.7, 0.386], [10.6, 3.5, 0.596], [12.2, 3.6, 0.789], [13.4, 3.95, 0.93], [14.1, 4.45, 0.991], [14.45, 5.0, 1]] as P3[]).map((p) => [p[0], p[1], p[2] * HIGHWAY_TOP])

function spiral(): P3[] {
  const out: P3[] = [HIGHWAY[HIGHWAY.length - 1]!]
  const steps = t.spiralTurns * SPIRAL.perTurn
  const drop = t.spiralTurns * SPIRAL.pitch
  for (let i = 0; i <= steps; i++) {
    const a = (i / SPIRAL.perTurn) * 2 * Math.PI
    out.push([GARAGE[0] - SPIRAL.r * Math.cos(a), GARAGE[1] + SPIRAL.r * Math.sin(a), SPIRAL_TOP - (drop * i) / steps])
  }
  out.push([14.5, 5.9, SPIRAL.under + SPIRAL.tail / 2], [14.6, 6.3, SPIRAL.under], [14.6, 6.7, 0])
  return out
}

for (let k = 0; k < 3; k++) {
  const name = TIERS[k]!
  const L = COLS.left
  seg(k, 'top', [L, 0.3], [mir(L), 0.3])
  seg(k, 'wall.right', [mir(L), 0.3], [mir(L), TH])
  if (k === 0) seg(k, 'wall.left', [L, 0.3], [L, TH])
  if (k < 2) open(k, 'elbow', [L, 0.4], [L, 1.7])
  if (k === 1) {
    seg(k, 'wall.left.upper', [L, 0.3], [L, 4.5])
    seg(k, 'wall.left.lower', [L, 5.9], [L, TH])
    open(k, 'lift.door', [L, 4.5], [L, 5.9])
  }
  if (k === 2) {
    seg(k, 'wall.left.upper', [L, 0.3], [L, 0.35])
    seg(k, 'wall.left.lower', [L, 1.7], [L, TH])
    open(k, 'lift.door', [L, 0.35], [L, 1.7])
  }
  both(k, 'outlane.floor', [L, TH], [OUTLANE.inner, TH])
  both(k, 'lane.guide', [OUTLANE.inner, 6.3], INLANE.a, 'guide')
  both(k, 'inlane.floor', INLANE.a, INLANE.b, 'guide')
  both(k, 'shoulder.step', INLANE.b, [INLANE.b[0], INLANE.shoulder])
  both(k, 'shoulder.edge', [INLANE.b[0], INLANE.shoulder], [8.8, 10.8])
  both(k, 'mouth.side', [8.8, 10.8], [8.8, TH])
  both(k, 'outlane.side', INLANE.a, [OUTLANE.inner, TH])
  for (const side of ['left', 'right'] as const) {
    const m = (u: number) => (side === 'left' ? u : mir(u))
    posts.push({ id: `${name}.lane.post.${side}`, tier: k, c: at(k, m(OUTLANE.inner), 6.3), r: 0.1 })
    slings.push({ id: `${name}.sling.${side}`, tier: k, side, a: at(k, m(SLING.a[0]), SLING.a[1]), b: at(k, m(SLING.b[0]), SLING.b[1]), c: at(k, m(SLING.c[0]), SLING.c[1]) })
    flippers.push({ id: `${name}.flipper.${side}`, tier: k, side, pivot: at(k, m(FLIP.pivotU), FLIP.pivotV), index: flippers.length })
    holds.push({ id: `${name}.outlane.${side}`, tier: k, kind: 'gate', c: at(k, m(3.95), 10.6), r: 0.55, releases: true })
    open(k, `outlane.${side}`, [m(L), 6.3], [m(OUTLANE.inner - 0.1), 6.3])
    open(k, `inlane.${side}`, [m(OUTLANE.inner + 0.1), 6.3], [m(SLING.a[0]), 6.3])
    open(k, `inlane.foot.${side}`, [m(SLING.b[0]), SLING.b[1]], [m(INLANE_FOOT[0]), INLANE_FOOT[1]])
    open(k, `sling.foot.${side}`, [m(SLING.c[0]), SLING.c[1]], [m(SLING_FOOT[0]), SLING_FOOT[1]])
    for (let i = 0; i < 2; i++) lamps.push({ id: `${name}.lane.lamp.${side}.${i + 1}`, tier: k, c: at(k, m(3.95 + i * 1.4), 7.4), group: `${name}.general` })
    posts.push({ id: `${name}.sling.post.${side}.a`, tier: k, c: at(k, m(SLING.a[0]), SLING.a[1]), r: 0.12 })
    posts.push({ id: `${name}.sling.post.${side}.c`, tier: k, c: at(k, m(SLING.c[0]), SLING.c[1]), r: 0.12 })
    posts.push({ id: `${name}.sling.post.${side}.b`, tier: k, c: at(k, m(SLING.b[0]), SLING.b[1]), r: 0.12 })
  }
  open(k, 'flipper.gap', [MID - t.flipperGapBalls / 2, FLIP_END_V], [MID + t.flipperGapBalls / 2, FLIP_END_V])
  open(k, 'exit', [8.8, 10.8], [11.2, 10.8])
  open(k, 'top.lane', [8, 0.3], [8, k === 0 ? 1.99 : 1.75])
  open(k, 'launch.lane', [COLS.launchA, 5], [COLS.launchB, 5])
  open(k, 'lift.tube', [COLS.liftA, 5], [COLS.liftB, 5])
  open(k, 'feed.tube', [COLS.feed - 0.625, 5], [COLS.feed + 0.625, 5])
  holds.push({ id: `${name}.gate`, tier: k, kind: 'gate', c: at(k, MID, 11.05), r: 1.2, releases: true })
  const picks = t.inserts.filter((n) => n.tier === name)
  const spots = INSERTS.spots
  picks.forEach((n, i) => inserts.push({ id: `${name}.insert.${i + 1}`, tier: k, c: at(k, spots[i]![0], spots[i]![1]), r: INSERTS.r, mode: n.mode, picture: n.picture, index: inserts.length }))
  displays.push({ id: `${name}.display`, tier: k, box: [12.0, TIER_Y[k]! + 10.35, t.displayWidthBalls, t.displayHeightBalls] })
  for (let i = 0; i < 7; i++) lamps.push({ id: `${name}.top.lamp.${i + 1}`, tier: k, c: at(k, 4.3 + i * 1.9, 1.05), group: `${name}.general`, arrow: [-1, 0] })
  for (let i = 0; i < 4; i++) lamps.push({ id: `${name}.launch.lamp.${i + 1}`, tier: k, c: at(k, COLS.launch, 2 + i * 2.4), group: `${name}.general`, arrow: [0, -1] })
  for (let i = 0; i < 3; i++) lamps.push({ id: `${name}.lift.lamp.${i + 1}`, tier: k, c: at(k, COLS.lift, 3 + i * 2.6), group: `${name}.general`, arrow: [0, -1] })
  for (const u of [9.0, 11.0]) posts.push({ id: `${name}.screw.${u}`, tier: k, c: at(k, u, 0.15), r: 0.08 })
}

{
  const k = 0
  seg(k, 'top.guide.left', [6.0, 2.15], [9.45, 1.88], 'guide')
  seg(k, 'top.guide.right', [9.45, 1.88], [12.9, 2.15], 'guide')
  seg(k, 'boardroom.roof', [COLS.left, 1.9], [4.65, 2.5], 'guide')
  seg(k, 'beach.roof', [COLS.right, 1.9], [14.2, 2.5], 'guide')
  model(k, 'boardroom', 'model-boardroom', [COLS.left, 2.5, 1.2, 1.9], 0.9, 'raised')
  dropBank(k, 'boardroom.drop', 4.45, 2.5, 4.4)
  for (let i = 0; i < 3; i++) targets.push({ id: `corporate.note.${i + 1}`, tier: k, kind: 'standup', box: [3.3 + i * 0.38, TIER_Y[k]! + 4.4, 0.34, 0.2], n: [0, 1], index: targets.length })
  model(k, 'hq', 'model-hq', [8.3, 2.2, 3.4, 2.3], 4, 'glass', { sign: 'copy:step3.table.buildings.hq' })
  model(k, 'beach', 'model-beach', [14.2, 2.5, 2.55, 1.9], 1.4, 'light', { sign: 'copy:step3.table.buildings.beach' })
  posts.push({ id: 'corporate.globe.left', tier: k, c: at(k, 8.8, 4.85), r: 0.22, lamp: true }, { id: 'corporate.globe.right', tier: k, c: at(k, 11.2, 4.85), r: 0.22, lamp: true })
  flats.push({ id: 'corporate.carpet', tier: k, part: 'model-hq', box: [9.2, TIER_Y[k]! + 4.7, 1.6, 2.6], tone: 'danger' })
  holds.push({ id: 'corporate.revolving', tier: k, kind: 'kicker', c: at(k, 9.5, 6.1), r: 0.75, releases: true, stand: at(k, 10.25, 7.0) })
  holds.push({ id: 'corporate.doors', tier: k, kind: 'kicker', c: at(k, MID, 5.02), r: 0.5, releases: true })
  open(k, 'lobby', [9.02, 4.85], [10.98, 4.85])
  open(k, 'top.exit.left', [4.65, 2.5], [6.0, 2.15])
  open(k, 'top.exit.right', [12.9, 2.15], [14.2, 2.5])
  open(k, 'boardroom.foot', [4.65, 4.6], [OUTLANE.inner, 6.2])
  rails.push({ id: 'ladder', from: 'corporate.ladder.track', to: 'corporate.ladder.track', points: LADDER.map((p) => [p[0], TIER_Y[k]! + p[1], p[2] + floorZ(k)] as P3), speed: 9, out: [-4, 2] })
  open(k, 'ladder.track', [12.3, 5.0], [12.3, 6.25])
}

{
  const k = 1
  seg(k, 'cubicles.roof', [COLS.left, 1.45], [CUBICLES.u + 0.2, 2.25], 'guide')
  seg(k, 'coffee.roof', [COLS.right, 1.75], [14.3, 2.25], 'guide')
  model(k, 'cubicles', 'model-cubicles', [COLS.left, 2.25, CUBICLES.u - COLS.left, CUBICLES.deep], 0.7, 'raised')
  dropBank(k, 'cubicles.drop', CUBICLES.u, 2.25, 2.25 + CUBICLES.deep)
  model(k, 'coffee', 'model-coffee-machine', [14.3, 2.25, 2.45, 1.35], 1.6, 'metal', { sign: 'copy:step3.table.buildings.coffee' })
  targets.push({ id: 'office.coffee.standup', tier: k, kind: 'standup', box: [14.1, TIER_Y[k]! + 2.7, 0.2, 0.8], n: [-1, 0], index: targets.length })
  model(k, 'inbox', 'model-inbox', [INBOX.u, 3.6, COLS.right - INBOX.u, INBOX.deep], 1.15, 'paper')
  bumpers.push({ id: 'office.bumper.1', tier: k, c: at(k, 8.9, 3.2), r: 0.75 }, { id: 'office.bumper.2', tier: k, c: at(k, 11.1, 3.2), r: 0.75 }, { id: 'office.bumper.3', tier: k, c: at(k, MID, 5.1), r: 0.75 })
  holds.push({ id: 'office.inbox', tier: k, kind: 'scoop', c: at(k, 14.6, 4.35), r: 0.5, releases: true })
  open(k, 'cubicles.side', [CUBICLES.u + 0.2, 3.2], [8.15, 3.2])
  open(k, 'coffee.side', [11.85, 3.2], [14.1, 3.2])
  open(k, 'cubicles.foot', [CUBICLES.u + 0.2, 2.25 + CUBICLES.deep], [6.05, 5.4])
  open(k, 'inbox.foot', [INBOX.u, 3.6 + INBOX.deep], [13.95, 5.4])
  open(k, 'chute.mouth', [MID - 0.75, 0.3], [MID + 0.75, 0.3])
}

{
  const k = 2
  seg(k, 'firehouse.roof', [COLS.left, 1.75], [5.75, 2.3], 'guide')
  seg(k, 'police.roof', [COLS.right, 1.75], [14.25, 2.3], 'guide')
  model(k, 'firehouse', 'model-firehouse', [COLS.left, 2.3, 2.5, 1.5], 2.0, 'danger', { sign: 'copy:step3.table.buildings.firehouse', bay: [4.4, 5.7, 0.55] })
  model(k, 'bank', 'model-bank', [COLS.left, 3.8, 1.0, 1.1], 1.2, 'raised', { sign: 'copy:step3.table.buildings.bank', signPx: 16 })
  dropBank(k, 'bank.drop', 4.25, 3.8, 4.9)
  model(k, 'police', 'model-police', [14.25, 2.3, 2.5, 1.5], 2.0, 'glass', { sign: 'copy:step3.table.buildings.police', signAt: [1.8, 1.4] })
  targets.push({ id: 'street.spinner', tier: k, kind: 'spinner', box: [13.2, TIER_Y[k]! + 2.95, 0.9, 0.1], n: [0, 1], index: targets.length })
  model(k, 'garage', 'model-garage', [GARAGE[0] - SPIRAL.frame, GARAGE[1] - SPIRAL.frame, 2 * SPIRAL.frame, 2 * SPIRAL.frame], SPIRAL_TOP + 0.2 - SPIRAL.under, 'raised', { solid: false, round: true, base: SPIRAL.under })
  holds.push({ id: 'street.firehouse', tier: k, kind: 'scoop', c: at(k, 5.05, 3.9), r: 0.5, releases: true, mouth: at(k, 5.05, 4.35) })
  holds.push({ id: 'street.mom', tier: k, kind: 'hatch', c: at(k, 3.95, 9.3), r: 0.5, releases: true })
  model(k, 'mom', 'model-moms', [4.8, 9.25, 1.0, 0.8], 0.8, 'raised', { solid: false, sign: 'copy:step3.table.buildings.outlane', signPx: 16 })
  for (let i = 0; i < 3; i++) {
    model(k, `house.left.${i + 1}`, 'model-houses', [5.0 + i * 0.75, 10.5, 0.5, 0.5], 0.5, 'raised', { solid: false })
    model(k, `house.right.${i + 1}`, 'model-houses', [13.6 + i * 0.58, 9.35, 0.45, 0.45], 0.5, 'raised', { solid: false })
  }
  flats.push({ id: 'street.road', tier: k, part: 'tier-art', box: [9.6, TIER_Y[k]! + 0.3, 0.8, 8.2], tone: 'dark' })
  rails.push({ id: 'highway', from: 'street.highway.track', to: 'spiral', points: HIGHWAY.map((p) => [p[0], TIER_Y[k]! + p[1], p[2] + floorZ(k)] as P3), speed: 6, out: [0, 0] })
  rails.push({ id: 'spiral', from: 'highway', to: 'street.inlane.right', points: spiral().map((p) => [p[0], TIER_Y[k]! + p[1], p[2] + floorZ(k)] as P3), speed: 8, out: [0, 3] })
  open(k, 'firehouse.foot', [4.45, 4.9], [OUTLANE.inner, 6.2])
  open(k, 'firehouse.door', [4.4, 3.8], [5.7, 3.8])
  open(k, 'police.foot', [14.25, 3.8], [13.95, 5.4])
  open(k, 'highway.track', [6.9, 4.275], [6.9, 5.525])
  open(k, 'spiral.turn', [GARAGE[0] - SPIRAL.r - t.minClearanceBalls / 2, GARAGE[1]], [GARAGE[0] - SPIRAL.r + t.minClearanceBalls / 2, GARAGE[1]])
  open(k, 'chute.mouth', [MID - 0.75, 0.3], [MID + 0.75, 0.3])
  open(k, 'mom.hatch', [COLS.left, 9.3], [OUTLANE.inner, 9.3])
}

export const PORT = { x: 1627 / BALL, y: 520 / BALL, ring: 330 / BALL, cup: 220 / BALL }
export const OUTLET = { x: 293 / BALL, y: LAST_Y + 420 / BALL, ring: 330 / BALL, cup: 220 / BALL }
export const PLUNGER: V = [COLS.launch, TIER_Y[2]! + 10.5]

const zf = (k: number): number => floorZ(k)
export const LANE_RAMP = { run: 1.5, hop: [[0.5, 0.22], [1, 0.3], [1.5, 0.22], [2, 0]] as V[], lift: 0.4 }
const climb = (u: number, k: number): P3[] => {
  const y = TIER_Y[k]!
  return [[u, y + LANE_RAMP.run, zf(k)], [u, y, zf(k - 1)], ...LANE_RAMP.hop.map((h) => [u, y - h[0], zf(k - 1) + h[1]] as P3)]
}
const rise = (u: number, k: number): P3[] => [[u, TIER_Y[k]! + LANE_RAMP.lift, zf(k)], [u, TIER_Y[k]! - LANE_RAMP.lift, zf(k - 1)]]
rails.push({
  id: 'feed', from: 'loader', to: 'plunger', speed: 9.4, out: [0, 0],
  points: [[PORT.x, PORT.y, -0.4], [PORT.x, PORT.y + 2.2, 0], [PORT.x, MARQUEE_Y + 0.15, 0], [COLS.feed, MARQUEE_Y + 2.15, 0], [COLS.feed, TIER_Y[2]! + 10.2, 0], [COLS.feed, TIER_Y[2]! + 10.9, -1.5], [18.5, TIER_Y[2]! + 11.1, zf(2)], [PLUNGER[0], PLUNGER[1], zf(2)]]
})
rails.push({
  id: 'launch', from: 'plunger', to: 'corporate.top.lane', speed: 30, out: [4.55, 3],
  points: [[PLUNGER[0], PLUNGER[1], zf(2)], ...climb(COLS.launch, 2), ...climb(COLS.launch, 1), [COLS.launch, TIER_Y[0]! + 1.9, zf(0)], [17.3, TIER_Y[0]! + 1.3, zf(0)], [16.4, TIER_Y[0]! + 1.05, zf(0)], [7.0, TIER_Y[0]! + 1.05, zf(0)], [5.8, TIER_Y[0]! + 1.3, zf(0)], [5.3, TIER_Y[0]! + 1.9, zf(0)], [5.3, TIER_Y[0]! + 2.7, zf(0)]]
})
for (let k = 0; k < 3; k++) {
  const name = TIERS[k]!
  const y = TIER_Y[k]!
  for (const side of ['left', 'right'] as const) {
    const u = side === 'left' ? 3.95 : mir(3.95)
    rails.push({ id: `outlane.${name}.${side}`, from: `${name}.outlane.${side}`, to: `${name}.exit`, speed: 16, out: [0, 0], hidden: true, points: [[u, y + 10.6, zf(k)], [u, y + 11.45, zf(k)], [MID, y + 11.45, zf(k)], [MID, y + 11.05, zf(k)]] })
  }
  if (k < 2) rails.push({ id: `chute.${name}`, from: `${name}.exit`, to: `${TIERS[k + 1]}.chute.mouth`, speed: 4, out: [0.8, 4], points: [[MID, y + 11.05, zf(k)], [MID, y + TH + 0.3, zf(k + 1) + 0.6], [MID, y + TH + 0.9, zf(k + 1)]] })
}
rails.push({
  id: 'drain', from: 'street.exit', to: 'outlet', speed: 7.5, out: [0, 0],
  points: [[MID, TIER_Y[2]! + 11.05, zf(2)], [MID, APRON_Y + 1.2, zf(2)], [MID, LAST_Y + 0.9, -1.2], [OUTLET.x, LAST_Y + 1.6, -0.6], [OUTLET.x, OUTLET.y, -0.4]]
})
rails.push({ id: 'lift.street', from: 'street.lift.door', to: 'office.elbow', speed: 14, out: [7, 0], points: [[3.3, TIER_Y[2]! + 1.05, zf(2)], [COLS.lift, TIER_Y[2]! + 1.05, zf(2)], ...rise(COLS.lift, 2), [COLS.lift, TIER_Y[1]! + 1.05, zf(1)], [3.9, TIER_Y[1]! + 1.05, zf(1)]] })
rails.push({ id: 'lift.office', from: 'office.lift.door', to: 'corporate.elbow', speed: 14, out: [7, 0], points: [[3.3, TIER_Y[1]! + 5.2, zf(1)], [COLS.lift, TIER_Y[1]! + 5.2, zf(1)], ...rise(COLS.lift, 1), [COLS.lift, TIER_Y[0]! + 1.05, zf(0)], [3.9, TIER_Y[0]! + 1.05, zf(0)]] })
holds.push({ id: 'loader', tier: -1, kind: 'port', c: [PORT.x, PORT.y], r: PORT.cup / 2, releases: true })
holds.push({ id: 'plunger', tier: 2, kind: 'plunger', c: PLUNGER, r: 0.6, releases: true })
holds.push({ id: 'outlet', tier: 3, kind: 'port', c: [OUTLET.x, OUTLET.y], r: OUTLET.cup / 2, releases: true })

export const table: Table = {
  segs, posts, models, bumpers, slings, targets, inserts, flippers, holds, rails, openings, displays, lamps, flats, sealed: ['corporate.beach'],
  log: [
    'The playfield of every tier lies between 3.25 and 16.75 balls, centred on the page. Left of it: the page border, a wide rail and the lift tube. Right of it: the launch lane and a rail that houses the feed tube.',
    'Flippers: pivots at 6.53 and 13.47 balls, 8.95 balls down the tier, 25 degrees below level at rest and 25 above when up, 0.07 s for the stroke. Each is a bat 3 balls long from the centre of its pivot to its far end, 0.8 balls thick round the pivot and 0.52 at the tip, and the ball meets that shape.',
    'Slingshots stand between 5.55 and 7.45 balls down the tier, as low as the lane under them and the bat before them leave a ball its 1.25. The three windows of a tier are 1.24 balls across and lie at 7.1, 8.0 and 7.1 balls down, between the slingshots and over the flippers.',
    'Outlanes are 1.4 balls wide and end in a hole that leads through the cross rail into the tier exit. The lower corners are solid shoulders and carry the display, the houses and the card.',
    'Bumpers are 1.5 balls across, set 3.0 and 2.83 balls apart, so every gap between them clears 1.25 balls.',
    'The garage, the ladder and the highway stand above the floor on supports: a ball on the floor passes under them.',
    'The garage spiral turns table.spiralTurns times round a path 0.75 balls in radius, each turn 1.3 balls under the one above. Its top is table.spiralTurns times 1.3 plus 1.5 balls above the street floor and its open end 1.3 balls above the right inlane, where the ball drops off. The round frame of the garage stands outside the trough, 1.525 balls from its centre, clear of the police station and of the right wall.',
    'The highway climbs from its flap on the street floor to 0.3 balls over the top of the spiral, turns down the page and ends over the top of the spiral.',
    'Gravity along the floor is 29.4 balls a second squared: a rolling 27 mm ball on a slope of table.slopeDeg.',
    'The launch lane and the lift tubes lie at the floor height of the tier they pass. The launch lane climbs to the next tier by a ramp 1.5 balls long that ends on the tier line, and the launched ball leaves its top in a hop 0.3 balls high and 2 balls long. Each lift tube rises one tier inside the cross rail, within 0.4 balls of the tier line.',
    'The apron is 2 balls deep. The loader port and the outlet port are 330 px rings with a 220 px cup.'
  ]
}

export const railOf = (id: string): Rail => {
  const r = rails.find((x) => x.id === id)
  if (!r) throw new Error(`No rail called "${id}"`)
  return r
}
export const holdOf = (id: string): Hold => {
  const h = holds.find((x) => x.id === id)
  if (!h) throw new Error(`No hold called "${id}"`)
  return h
}
export const railLength = (r: Rail): number => {
  let d = 0
  for (let i = 1; i < r.points.length; i++) d += Math.hypot(r.points[i]![0] - r.points[i - 1]![0], r.points[i]![1] - r.points[i - 1]![1])
  return d
}
export function railAt(r: Rail, s: number): { x: number; y: number; z: number; dx: number; dy: number; end: boolean } {
  let left = Math.max(0, s)
  for (let i = 1; i < r.points.length; i++) {
    const a = r.points[i - 1]!
    const b = r.points[i]!
    const d = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (left <= d || i === r.points.length - 1) {
      const u = d > 0 ? Math.min(1, left / d) : 1
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, dx: d > 0 ? (b[0] - a[0]) / d : 0, dy: d > 0 ? (b[1] - a[1]) / d : 1, end: left >= d && i === r.points.length - 1 }
    }
    left -= d
  }
  const p = r.points[r.points.length - 1]!
  return { x: p[0], y: p[1], z: p[2], dx: 0, dy: 1, end: true }
}

export const solids = (m: Model): [number, number, number, number][] => {
  const [x, y, w, h] = m.box
  if (!m.bay) return [[x, y, w, h]]
  const [a, b, deep] = m.bay
  return [[x, y, a - x, h], [b, y, x + w - b, h], [a, y, b - a, h - deep]]
}
