import * as THREE from 'three'
import type { RealContext } from '../../../real/types'
import { BALL, COLS, LANE_RAMP, MID, TH, TIERS, TIER_Y, floorZ, railOf, table } from '../../layout'
import { localBalls, zone, type Zone } from '../zone'
import { Geo, grooved, type V2 } from './geo'
import { TUBE } from './loader'
import { Screws, TONE, aluOf, mesh, paintOf, screwOf, steelOf } from './mats'

// What the walls of a tier are made to, in page pixels.
const WALL = { height: 60, seg: 56, chamfer: 4.5, strip: [30, 54] as V2, stripOut: 0.9 }
const METAL: [number, number, number] = [0.36, 0.37, 0.39]
const RAIL = { reveal: 30, revealWide: 4.5, revealDeep: 2, chamfer: 3, channel: 17, channelDepth: 3, ledge: 15, land: 84, step: 5, lip: 3, slope: 0.84, bank: 11, cuts: 10, tilt: [20, 58] as V2, gap: 1.2, joint: 1.4, screwStep: 1.5, cradle: 62.5, tubeUp: 48 }
const CROSS = { lower: 0.3, upper: 0.12, throat: 0.75, mouth: 1.2, tunnel: 122 }
const STEP = { back: 11, rise: 3, groove: 64, grooveWide: 4.5, grooveDeep: 2 }
const LANE = { strip: 0.24, stripWide: 3.2, clear: 0.6, lip: 9, lipTall: 1.6, line: 1.6, house: 0.8, elbowClear: 0.14, flange: 10 }
const PLAQUE = { wide: 1.1, tall: 0.42, inset: 0.55, foot: 0.21 }

export function tier(z: Zone, _ctx: RealContext): THREE.Object3D {
  const k = z.tier
  const name = TIERS[k]!
  const H = -z.floor
  const A = new Geo()
  const P = new Geo()
  const S = new Geo()
  const screws = new Screws()
  const at = (u: number, v: number): V2 => {
    const p = localBalls(z, u, TIER_Y[k]! + v)
    return [p[0], p[1]]
  }
  const X = (u: number): number => at(u, 0)[0]
  const Y = (v: number): number => at(0, v)[1]
  const turnOf = (x: number, y: number): number => (((x * 12.9898 + y * 78.233) % 6.283) + 6.283) % 6.283
  const c = RAIL.chamfer
  const xb = X(COLS.border)
  const xa = X(COLS.liftA)
  const xl = X(COLS.liftB)
  const xL = X(COLS.left)
  const xR = X(COLS.right)
  const xr = X(COLS.launchA)
  const xc = X(COLS.launchB)
  const xe = X(COLS.railB)
  const xf = X(COLS.feed)
  const yT = Y(0)
  const yB = Y(TH)

  // The border of the page runs on down both sides of the well, with a hair of shadow between it and the rail.
  P.box(X(0), xb - RAIL.gap, yB, yT, 0, H, TONE.ceramic, { along: [0, 1, 0] })
  P.box(xe + RAIL.gap, X(20), yB, yT, 0, H, TONE.ceramic, { along: [0, 1, 0] })
  P.box(xb - RAIL.gap, xb, yB, yT, 0, H - 2.4, TONE.gap, { along: [0, 1, 0] })
  P.box(xe, xe + RAIL.gap, yB, yT, 0, H - 2.4, TONE.gap, { along: [0, 1, 0] })

  // Each rail is two lengths of one extrusion, met at a joint with a hair's gap.
  const lengths = (v0: number, v1: number, joint: number): [number, number][] => {
    const j = Y(joint)
    return joint > v0 && joint < v1 ? [[Y(v1), j - RAIL.joint / 2], [j + RAIL.joint / 2, Y(v0)]] : [[Y(v1), Y(v0)]]
  }
  // A fine groove runs along the lane side of each rail, a little under its top: the line an extrusion's die leaves.
  const reveal = (x: number, into: 1 | -1): V2[] => {
    const y = H - RAIL.reveal
    return H > RAIL.reveal + 30 ? [[x, y], [x + into * RAIL.revealDeep, y - 1.2], [x + into * RAIL.revealDeep, y - RAIL.revealWide + 1.2], [x, y - RAIL.revealWide]] : []
  }
  // The left rail: a narrow bright land at the page's edge, then a polished face that falls toward the lane and shows the lamps, then a low ledge at the lane.
  const land0 = xb + c
  const land1 = xb + RAIL.land
  const foot = xa - RAIL.ledge
  // The face is a low round, not a flat: each lamp shows in it as a point.
  const round: V2[] = []
  {
    const n = RAIL.cuts
    const tilt = (i: number): number => ((RAIL.tilt[0] + ((RAIL.tilt[1] - RAIL.tilt[0]) * (i + 0.5)) / n) * Math.PI) / 180
    let run = 0
    for (let i = 0; i < n; i++) run += Math.cos(tilt(i))
    const l = (foot - land1 - RAIL.lip) / run
    let x = land1 + RAIL.lip
    let h = H - RAIL.step
    round.push([x, h])
    for (let i = 0; i < n; i++) {
      x += l * Math.cos(tilt(i))
      h -= l * Math.sin(tilt(i))
      round.push([x, h])
    }
  }
  const zl = round[round.length - 1]![1]
  const mid = (land0 + land1) / 2
  const landed = (outline: V2[], rest: (edge: number) => [number, number, number], low = c) => (edge: number): [number, number, number] => {
    const p = outline[edge]!
    const q = outline[(edge + 1) % outline.length]!
    return p[1] >= H - low - 0.01 && q[1] >= H - low - 0.01 ? TONE.aluBright : rest(edge)
  }
  const left: V2[] = [[xb, 0], [xb, H - c], [land0, H], [land1 - c, H], [land1, H - c], [land1, H - RAIL.step], ...round, [xa - c, zl], [xa, zl - c], ...reveal(xa, -1), [xa, 0]]
  for (const [y0, y1] of lengths(0, TH, 5.6)) {
    A.prism(left, [0, y0], [0, y1], landed(left, grooved(left, [xa - RAIL.revealDeep], METAL, TONE.gap)))
    for (let i = 1; i < round.length; i++) {
      const p = round[i - 1]!
      const q = round[i]!
      S.face([[p[0], y0, p[1] + 0.3], [q[0], y0, q[1] + 0.3], [q[0], y1, q[1] + 0.3], [p[0], y1, p[1] + 0.3]], [p[1] - q[1], 0, q[0] - p[0]], [0, 1, 0], [1, 1, 1])
    }
  }
  for (let v = RAIL.screwStep / 2; v < TH; v += RAIL.screwStep) screws.add(mid, Y(v), H, 0.9, turnOf(mid, v))
  for (let v = RAIL.screwStep; v < TH; v += RAIL.screwStep * 2) screws.add((foot + xa) / 2, Y(v), zl, 0.7, turnOf(xa, v))

  // The right rail is a cradle: the feed tube lies in a round bed along its top.
  const feed = railOf('feed').points
  const dive = k === 2 ? feed[4]![1] - TIER_Y[k]! - 0.6 : TH
  const half = Math.sqrt(RAIL.cradle * RAIL.cradle - RAIL.tubeUp * RAIL.tubeUp)
  const t0 = Math.asin(half / RAIL.cradle)
  const right: V2[] = [[xc, 0], ...reveal(xc, 1).reverse(), [xc, H - RAIL.bank * RAIL.slope], [xc + RAIL.bank, H], [xf - half, H]]
  for (let i = 1; i < 12; i++) {
    const t = -t0 + (2 * t0 * i) / 12
    right.push([xf + RAIL.cradle * Math.sin(t), H + RAIL.tubeUp - RAIL.cradle * Math.cos(t)])
  }
  right.push([xf + half, H], [xe - c, H], [xe, H - c], [xe, 0])
  for (const [y0, y1] of lengths(0, dive, 5.6)) A.prism(right, [0, y0], [0, y1], landed(right, grooved(right, [xc + RAIL.revealDeep], METAL, TONE.gap), Math.max(RAIL.bank * RAIL.slope, RAIL.cradle - RAIL.tubeUp)))
  P.box(xc, xe, Y(5.6) - RAIL.joint / 2, Y(5.6) + RAIL.joint / 2, 0, H - 4, TONE.gap, { along: [0, 1, 0] })
  for (let v = RAIL.screwStep / 2; v < dive - 0.2; v += RAIL.screwStep) {
    screws.add((xc + c + xf - half) / 2, Y(v), H, 0.9, turnOf(xc, v))
    screws.add((xe - c + xf + half) / 2, Y(v), H, 0.9, turnOf(xe, v))
  }
  if (dive < TH) {
    // Where the tube dives to the plunger the rail is a shell: an outer wall and a dark pocket.
    {
      const shell: V2[] = [[xe - 20, 0], [xe - 20, H - c], [xe - 20 + c, H], [xe - c, H], [xe, H - c], [xe, 0]]
      A.prism(shell, [0, yB], [0, Y(dive)], landed(shell, () => METAL))
    }
    P.box(xc, xe - 20, yB, Y(dive), 0, 1.2, TONE.pocket)
  }

  // The low walls between the lanes and the floor, in the lengths the layout gives, with a strip of bright steel where the ball strikes.
  const wall = (x0: number, x1: number, v0: number, v1: number, face: 1 | -1): void => {
    if (v1 - v0 < 0.08) return
    const w = WALL.chamfer
    A.prism([[x0, 0], [x0, WALL.height - w], [x0 + w, WALL.height], [x1 - w, WALL.height], [x1, WALL.height - w], [x1, 0]], [0, Y(v1)], [0, Y(v0)], METAL)
    const xs = face > 0 ? x1 : x0
    S.box(Math.min(xs, xs + face * WALL.stripOut), Math.max(xs, xs + face * WALL.stripOut), Y(v1) + 3, Y(v0) - 3, WALL.strip[0], WALL.strip[1], [1, 1, 1], { along: [0, 1, 0] })
    const xm = (x0 + x1) / 2
    trim(xm, Y(v1) + 4, xm, Y(v0) - 4, face)
    for (let v = Math.ceil(v0 / RAIL.screwStep) * RAIL.screwStep + RAIL.screwStep / 2; v < v1 - 0.2; v += RAIL.screwStep * 2) if (k !== 1) screws.add(xm + (k === 0 ? 4.5 : 0), Y(v), WALL.height, 0.62, turnOf(xm, v))
  }
  // What marks the tier: a line of brass let into the top of the walls, a strip of grey laminate, or a kerb at their foot.
  const trim = (x0: number, y0: number, x1: number, y1: number, face: 1 | -1): void => {
    if (k === 0) A.box(x0 - 3.6, x0 - 1.2, y0, y1, WALL.height - 0.4, WALL.height + 0.35, TONE.brass, { along: [0, 1, 0] })
    if (k === 1) P.box(x0 - 5.2, x0 + 5.2, y0, y1, WALL.height - 0.4, WALL.height + 0.8, TONE.laminate, { along: [0, 1, 0], bevel: 0.6 })
    if (k === 2) {
      const xs = x0 + face * 9.6
      const a = Math.min(xs, xs + face * 7)
      const b = Math.max(xs, xs + face * 7)
      const sign0 = Y(6.9)
      const sign1 = Y(5.3)
      const plain = (p: number, q: number): void => {
        if (q - p > 1) P.box(a, b, p, q, 0, 9, TONE.kerb, { along: [0, 1, 0], bevel: 1.6 })
      }
      plain(y0, Math.min(y1, sign0))
      plain(Math.max(y0, sign1), y1)
      const s0 = Math.max(y0, sign0)
      const s1 = Math.min(y1, sign1)
      let i = 0
      for (let y = s0; y < s1 - 0.5; y += 12.8, i++) P.box(a, b, y, Math.min(s1, y + 12.8), 0, 9, i % 2 === 0 ? TONE.kerbYellow : TONE.kerbBlack, { along: [0, 1, 0], bevel: 1.6 })
    }
  }
  const launch = railOf('launch').points
  let throat: [number, number] | null = null
  if (k === 0) {
    for (let i = 1; i < launch.length; i++) {
      const p = launch[i - 1]!
      const q = launch[i]!
      if ((p[0] - COLS.right) * (q[0] - COLS.right) < 0) {
        const v = p[1] + ((q[1] - p[1]) * (COLS.right - p[0])) / (q[0] - p[0]) - TIER_Y[k]!
        throat = [CROSS.lower, v + 0.62]
      }
    }
  }
  for (const s of table.segs) {
    if (s.tier !== k) continue
    const v0 = Math.min(s.a[1], s.b[1]) - TIER_Y[k]!
    const v1 = Math.max(s.a[1], s.b[1]) - TIER_Y[k]!
    if (s.id.startsWith(`${name}.wall.left`)) wall(xl, xL, v0, v1, 1)
    if (s.id === `${name}.wall.right`) wall(xR, xr, throat ? throat[1] : v0, v1, -1)
  }

  // The top of the tier.
  const top = CROSS.lower * BALL
  if (k === 0) {
    const head: V2[] = [[0, 0], [0, H], [top - c, H], [top, H - c], ...reveal(top, -1), [top, 0]]
    A.prism(head, [xa, yT], [xc, yT], landed(head, grooved(head, [top - RAIL.revealDeep], METAL, TONE.gap)), [false, false])
    A.box(xL + 8, xR - 8, yT - top / 2 - 1.2, yT - top / 2 + 1.2, H - 0.4, H + 0.35, TONE.brass)
    for (let u = COLS.left + 0.75; u < COLS.right; u += RAIL.screwStep) screws.add(X(u), yT - 7, H, 0.8, turnOf(u, 1))
    // The throat: the launch lane turns into the top lane round a corner block cut to the ball's way.
    const cu = COLS.right - 0.3
    const cv = CROSS.lower + 2
    const loop: V2[] = [at(cu, CROSS.lower), at(COLS.launchB, CROSS.lower), at(COLS.launchB, cv)]
    for (let i = 1; i < 16; i++) {
      const t = (i / 16) * (Math.PI / 2)
      loop.push(at(cu + 2 * Math.cos(t), cv - 2 * Math.sin(t)))
    }
    A.slab(loop, 0, H, METAL, { bevel: c, top: TONE.aluBright })
    for (let i = 1; i < 16; i++) {
      const t0s = ((i - 0.5) / 16) * (Math.PI / 2)
      const t1s = ((i + 0.5) / 16) * (Math.PI / 2)
      const p = at(cu + 2 * Math.cos(t0s), cv - 2 * Math.sin(t0s))
      const q = at(cu + 2 * Math.cos(t1s), cv - 2 * Math.sin(t1s))
      const nx = -Math.cos((t0s + t1s) / 2)
      const ny = -Math.sin((t0s + t1s) / 2)
      S.face([[p[0] + nx * 0.9, p[1] + ny * 0.9, WALL.strip[0]], [q[0] + nx * 0.9, q[1] + ny * 0.9, WALL.strip[0]], [q[0] + nx * 0.9, q[1] + ny * 0.9, WALL.strip[1]], [p[0] + nx * 0.9, p[1] + ny * 0.9, WALL.strip[1]]], [nx, ny, 0], [q[0] - p[0], q[1] - p[1], 0], [1, 1, 1])
    }
    screws.add(...at(COLS.launchB - 0.35, CROSS.lower + 0.35), H, 1, 0.4).add(...at(COLS.launchB - 0.3, CROSS.lower + 1.5), H, 1, 1.1).add(...at(COLS.right + 0.4, CROSS.lower + 0.12), H, 0.8, 2.0)
  } else {
    // The cross rail: the wall the tier above ends on, with the chute's throat cut through it, and the step of the floor under it.
    const h = BALL + WALL.seg
    // Above the ball's height the wall steps back to a ledge, and a fine groove runs under the strip's line: light falls on it in bands, not as one sheet.
    const g = STEP.groove
    const in0 = top - STEP.back
    const cross: V2[] = [[0, 0], [0, h - c], [c, h], [in0 - c, h], [in0, h - c], [in0, BALL + STEP.rise], [top - STEP.rise, BALL + STEP.rise], [top, BALL], [top, g + STEP.grooveWide], [top - STEP.grooveDeep, g + STEP.grooveWide - 1.2], [top - STEP.grooveDeep, g + 1.2], [top, g], [top, 0]]
    const tone = (edge: number): [number, number, number] => (edge === 9 ? TONE.gap : edge === 4 || edge >= 7 ? TONE.aluDark : edge >= 1 && edge <= 3 ? TONE.alu : METAL)
    A.prism(cross, [xL, yT], [X(MID - CROSS.throat), yT], tone)
    A.prism(cross, [X(MID + CROSS.throat), yT], [xR, yT], tone)
    A.box(xl, xL, yT - 4, yT, 0, BALL, TONE.aluDark)
    A.box(xR, xr, yT - 4, yT, 0, BALL, TONE.aluDark)
    // Over the lift lane the cross rail is a closed housing: the tube runs into it and the ball rises to the tier above inside it.
    {
      const elbow = table.openings.find((o) => o.tier === k && o.id.endsWith('.elbow'))
      const deep = elbow ? Math.min(LANE.house, Math.min(elbow.a[1], elbow.b[1]) - TIER_Y[k]! - LANE.elbowClear) : Math.max(LANE.house, LANE_RAMP.lift * 2)
      const yf = Y(deep)
      A.box(xa, xl, yf, yT, 0, h, METAL, { bevel: c, along: [1, 0, 0], top: TONE.alu })
      P.box(xa, xl, yf - LANE.line, yf, 0, 0.9, TONE.gap)
      if (!elbow) {
        const o = TUBE.outer
        const xt = X(COLS.lift)
        const zt = o + 1.5
        const top = zt + o + LANE.flange
        A.box(xt - o - LANE.flange, xt + o + LANE.flange, yf - 5, yf, 0, top, TONE.aluDark, { bevel: 1.6, along: [1, 0, 0] })
        for (const sx of [-1, 1]) for (const sz of [7, top - 7]) screws.add(xt + sx * (o + LANE.flange - 6), yf - 5, sz, 0.6, sx + sz, new THREE.Vector3(0, -1, 0))
      }
    }
    // The launch lane climbs to the tier above by a ramp that stands on this floor between the lane's walls: its top follows the launch rail and meets the upper floor flush at the tier's line.
    {
      const y1 = TIER_Y[k]!
      const pts = railOf('launch').points.filter((p) => Math.abs(p[0] - COLS.launch) < 1e-6 && p[1] >= y1 - 1e-6 && p[1] <= y1 + LANE_RAMP.run + 1e-6).sort((p, q) => q[1] - p[1])
      const run = pts.map((p): [number, number] => [Y(p[1] - y1), (p[2] - floorZ(k)) * BALL])
      const x0 = xr + LANE.clear
      const x1 = xc - LANE.clear
      const xm = X(COLS.launch)
      for (let i = 1; i < run.length; i++) {
        const [ya, da] = run[i - 1]!
        const [yb, db] = run[i]!
        if (Math.max(da, db) < 0.01) continue
        const len = Math.hypot(yb - ya, db - da)
        const up: [number, number, number] = [0, (yb - ya) / len, (db - da) / len]
        const n: [number, number, number] = [0, -up[2], up[1]]
        A.face([[x0, ya, da], [x1, ya, da], [x1, yb, db], [x0, yb, db]], n, up, TONE.aluDeep)
        A.face([[x0, ya, 0], [x0, ya, da], [x0, yb, db], [x0, yb, 0]], [-1, 0, 0], [0, 1, 0], TONE.aluDark)
        A.face([[x1, ya, 0], [x1, ya, da], [x1, yb, db], [x1, yb, 0]], [1, 0, 0], [0, 1, 0], TONE.aluDark)
        for (const side of [-1, 1]) {
          const a = xm + side * LANE.strip * BALL - LANE.stripWide / 2
          const b = a + LANE.stripWide
          const l = 0.45
          S.face([[a, ya + n[1] * l, da + n[2] * l], [b, ya + n[1] * l, da + n[2] * l], [b, yb + n[1] * l, db + n[2] * l], [a, yb + n[1] * l, db + n[2] * l]], n, up, [1, 1, 1])
          for (const f of [0.14, 0.86]) screws.add(xm + side * 0.56 * BALL, ya + up[1] * len * f + n[1] * 0.1, da + up[2] * len * f + n[2] * 0.1, 0.62, turnOf(xm + side, f), new THREE.Vector3(n[0], n[1], n[2]))
        }
      }
      // The lip: a tongue of bright steel lying on the floor at the ramp's foot, and the line of shadow where it meets the floor.
      const foot = run.find((r, i) => r[1] < 0.01 && (run[i + 1]?.[1] ?? 0) > 0.01)
      if (foot) {
        S.box(x0, x1, foot[0] - LANE.lip, foot[0] + 3, 0.5, 0.5 + LANE.lipTall, [1, 1, 1], { bevel: 0.6 })
        P.box(x0, x1, foot[0] - LANE.lip - LANE.line, foot[0] - LANE.lip, 0.5, 0.95, TONE.gap)
      }
    }
    A.box(X(MID - CROSS.throat), X(MID + CROSS.throat), yT - 4, yT, 0, BALL * 0.42, TONE.aluDark)
    S.box(xL + 6, X(MID - CROSS.throat) - 6, yT - top - WALL.stripOut, yT - top, WALL.strip[0], WALL.strip[1], [1, 1, 1])
    S.box(X(MID + CROSS.throat) + 6, xR - 6, yT - top - WALL.stripOut, yT - top, WALL.strip[0], WALL.strip[1], [1, 1, 1])
    for (let u = COLS.left + 0.75; u < COLS.right; u += RAIL.screwStep) if (Math.abs(u - MID) > CROSS.throat + 0.3) screws.add(X(u), yT - in0 / 2, h, 0.8, turnOf(u, 2))
    const r = 0.5
    const fillet: V2[] = [at(COLS.right, CROSS.lower), at(COLS.right, CROSS.lower + r)]
    for (let i = 1; i <= 8; i++) {
      const t = (i / 8) * (Math.PI / 2)
      fillet.push(at(COLS.right - r + r * Math.cos(t), CROSS.lower + r - r * Math.sin(t)))
    }
    A.slab(fillet, 0, WALL.height, METAL, { bevel: WALL.chamfer })
  }

  // The foot of the tier.
  const low = CROSS.upper * BALL
  if (k < 2) {
    const bar: V2[] = [[0, 0], [0, WALL.seg - c], [c, WALL.seg], [low, WALL.seg], [low, 0]]
    A.prism(bar, [xL, yB + low], [X(MID - CROSS.mouth), yB + low], METAL)
    A.prism(bar, [X(MID + CROSS.mouth), yB + low], [xR, yB + low], METAL)
  } else {
    // Where the apron lies at the street's own height the street ends on a low wall, open at the mouth. Where it stands at the page's height the wall is the well's end, with a tunnel for the mouth.
    const open = zone('apron').floor <= z.floor + 0.01
    const top = open ? WALL.seg : H
    const bar: V2[] = [[0, 0], [0, top - c], [c, top], [low - c, top], [low, top - c], [low, 0]]
    const tone = (edge: number): [number, number, number] => (open && edge >= 1 && edge <= 3 ? TONE.alu : METAL)
    A.prism(bar, [xa, yB + low], [X(MID - CROSS.mouth), yB + low], tone)
    A.prism(bar, [X(MID + CROSS.mouth), yB + low], [xc, yB + low], tone)
    if (!open) A.box(X(MID - CROSS.mouth), X(MID + CROSS.mouth), yB, yB + low, CROSS.tunnel, H, METAL, { bottom: true })
    P.box(X(MID - CROSS.mouth), X(MID + CROSS.mouth), yB, yB + (open ? low : 1.5), 0, open ? 0.9 : CROSS.tunnel, TONE.pocket)
    S.box(xL + 6, X(MID - CROSS.mouth) - 6, yB + low, yB + low + WALL.stripOut, WALL.strip[0], WALL.strip[1], [1, 1, 1])
    S.box(X(MID + CROSS.mouth) + 6, xR - 6, yB + low, yB + low + WALL.stripOut, WALL.strip[0], WALL.strip[1], [1, 1, 1])
  }

  // The shoulders: a rim of wall round each lower corner, turned posts where the lengths meet.
  const posts = new Map<string, V2>()
  for (const s of table.segs) {
    if (s.tier !== k || !/\.(shoulder\.step|shoulder\.edge|mouth\.side|outlane\.side)\./.test(s.id)) continue
    const a = at(s.a[0], s.a[1] - TIER_Y[k]!)
    const b = at(s.b[0], s.b[1] - TIER_Y[k]!)
    const w = 5.76
    const w2 = WALL.chamfer
    A.prism([[-w, 0], [-w, WALL.seg - w2], [-w + w2, WALL.seg], [w - w2, WALL.seg], [w, WALL.seg - w2], [w, 0]], a, b, METAL, [false, false])
    if (k === 0 && s.id.includes('shoulder.edge')) {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1])
      const from = A.vertices
      A.box(8, d - 8, -1.2, 1.2, WALL.seg - 0.4, WALL.seg + 0.35, TONE.brass)
      A.move(from, new THREE.Matrix4().makeTranslation(a[0], a[1], 0).multiply(new THREE.Matrix4().makeRotationZ(Math.atan2(b[1] - a[1], b[0] - a[0]))))
    }
    posts.set(`${a[0].toFixed(1)},${a[1].toFixed(1)}`, a)
    if (b[1] > yB + 2) posts.set(`${b[0].toFixed(1)},${b[1].toFixed(1)}`, b)
  }
  for (const p of posts.values()) {
    A.lathe([[7.4, 0], [7.4, WALL.seg], [6.2, WALL.seg + 2.2], [2.6, WALL.seg + 2.2]], p[0], p[1], 14, METAL)
    screws.add(p[0], p[1], WALL.seg + 2.2, 0.58, turnOf(p[0], p[1]))
  }

  // The right shoulder holds the display: a dark seat round its pocket.
  const d = table.displays.find((x) => x.tier === k)
  if (d) {
    const a = at(d.box[0], d.box[1] - TIER_Y[k]!)
    const b = at(d.box[0] + d.box[2], d.box[1] + d.box[3] - TIER_Y[k]!)
    const m = 6
    const hgt = 35
    const x0 = a[0]
    const x1 = b[0]
    const y0 = b[1]
    const y1 = a[1]
    P.box(x0 - m, x1 + m, y1, y1 + m, 0, hgt, TONE.bezel, { bevel: 1.6 })
    P.box(x0 - m, x1 + m, y0 - m, y0, 0, hgt, TONE.bezel, { bevel: 1.6 })
    P.box(x0 - m, x0, y0, y1, 0, hgt, TONE.bezel, { bevel: 1.6, along: [0, 1, 0] })
    P.box(x1, x1 + m, y0, y1, 0, hgt, TONE.bezel, { bevel: 1.6, along: [0, 1, 0] })
    P.box(x0, x1, y0, y1, 0, 1.4, TONE.pocket)
    for (const [sx, sy] of [[x0 - m / 2, y0 - m / 2], [x1 + m / 2, y0 - m / 2], [x0 - m / 2, y1 + m / 2], [x1 + m / 2, y1 + m / 2]] as V2[]) screws.add(sx, sy, hgt, 0.5, turnOf(sx, sy))
  }

  // The left shoulder carries the mark of the tier: three pips of enamel at the top, two in the middle, one on the street.
  {
    const side = table.segs.find((x) => x.id === `${name}.mouth.side.left`)!
    const u1 = side.a[0] - PLAQUE.inset
    const v1 = Math.max(side.a[1], side.b[1]) - TIER_Y[k]! - PLAQUE.foot
    const a = at(u1 - PLAQUE.wide, v1 - PLAQUE.tall)
    const b = at(u1, v1)
    A.box(a[0], b[0], b[1], a[1], 0, 5, TONE.aluBright, { bevel: 1.4 })
    const n = 3 - k
    const cy = (a[1] + b[1]) / 2
    const cx = (a[0] + b[0]) / 2
    for (let i = 0; i < n; i++) {
      const px = cx + (i - (n - 1) / 2) * 22
      P.lathe([[8.4, 5.0], [8.4, 5.5], [7.2, 5.5]], px, cy, 20, TONE.enamelRing)
      P.lathe([[7.2, 5.5], [5.4, 6.3], [0, 6.5]], px, cy, 20, TONE.enamel)
    }
    screws.add(a[0] + 7, cy, 5, 0.55, 0.3).add(b[0] - 7, cy, 5, 0.55, 1.3)
  }

  const o = new THREE.Group()
  o.name = `table-frame.${z.id}`
  o.add(mesh(A, aluOf(z), `table-frame.metal.${z.id}`, { cast: true }))
  o.add(mesh(P, paintOf(z), `table-frame.paint.${z.id}`))
  if (S.vertices > 0) o.add(mesh(S, steelOf(z), `table-frame.wear.${z.id}`))
  const sc = screws.mesh(screwOf(z), `table-frame.screws.${z.id}`)
  if (sc) o.add(sc)
  return o
}
