// The ground of the finish: what the finishing blast scorches, the chips of ceramic it throws out, the smoke that stands over it after, and the arena's answer to the cold light of the beam.
// Everything is a function of the view and of the seed. The scorch is painted out of sight, a few rows a frame, while the arrow charges.
import * as THREE from 'three'
import type { BossView } from '../boss/view'
import type { Emitter } from '../real/types'
import { clamp01, rise, rnd } from './change'
import { SCORCHED, type Wounds } from './ground'
import { ARENA, PAGE, PANES, PILLARS } from './layout'
import { softDot, type Kit } from './props'
import { SCORCH, aimOf, beamOf, beamShadow, chipsOf, lineKeyOf, paintScorch, scorchFrom, scorchOf, scorchReach, type BeamLight, type BlastLine, type Chip, type Scorch } from './scorch'
import { STANDS, brokenBy } from './solids'
import { lumpGeometry } from './wreck'

const wx = (x: number): number => x - PAGE.w / 2
const wy = (y: number): number => PAGE.h / 2 - y

// Over how many frames the scorch is painted ahead while the arrow charges.
const AHEAD_FRAMES = 48
// How long a chip flies, as a share of the blast.
const CHIP_FLIGHT = 0.16
const COLUMNS = 4
// Up the screen and a little to the left, as everything that stands in the picture leans.
const UP = Math.atan2(ARENA.lean, ARENA.leanX) - Math.PI / 2

export type BeamDriver = (view: BossView) => BeamLight | null

export interface Finish { object: THREE.Group; pose(view: BossView, light?: (e: Emitter) => void, beam?: BeamDriver): void; dispose(): void }

export function makeFinish(seed: number, kit: Kit, wounds: Wounds): Finish {
  const root = new THREE.Group()
  root.name = 'arena-finish'
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3()
  const lean = ARENA.lean, leanX = ARENA.leanX

  const lump = lumpGeometry(seed + 7)
  const chips = new THREE.InstancedMesh(lump, kit.chip, SCORCH.chips)
  chips.name = 'arena-chips'
  chips.count = 0
  chips.visible = false
  chips.frustumCulled = false
  chips.castShadow = true
  chips.receiveShadow = true
  chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  chips.userData.small = 'count'
  root.add(chips)

  // Wisps of smoke: grey, lighter than the black they stand over and darker than the white beside it. Each has its own strength.
  const plane = new THREE.PlaneGeometry(1, 1)
  const fade = new THREE.InstancedBufferAttribute(new Float32Array(SCORCH.smoke), 1)
  fade.setUsage(THREE.DynamicDrawUsage)
  plane.setAttribute('arenaFade', fade)
  const dot = softDot()
  const smokeStuff = new THREE.MeshBasicMaterial({ map: dot, color: new THREE.Color(0.42, 0.42, 0.43), transparent: true, depthWrite: false, toneMapped: false, fog: false })
  smokeStuff.onBeforeCompile = (shader) => {
    shader.vertexShader = 'attribute float arenaFade;\nvarying float vArenaFade;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvArenaFade = arenaFade;')
    shader.fragmentShader = 'varying float vArenaFade;\n' + shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.a *= vArenaFade;')
  }
  smokeStuff.customProgramCacheKey = () => 'arena-wisps'
  const smoke = new THREE.InstancedMesh(plane, smokeStuff, SCORCH.smoke)
  smoke.name = 'arena-wisps'
  smoke.count = 0
  smoke.visible = false
  smoke.frustumCulled = false
  smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  smoke.userData.small = 'count'
  smoke.renderOrder = 5
  root.add(smoke)

  // The shadows the beam throws: what is drawn is the light they leave, laid over the ground by multiplying.
  const QUADS = STANDS.length
  const shadowPos = new Float32Array(QUADS * 18)
  const shadowCol = new Float32Array(QUADS * 18)
  const shadowGeo = new THREE.BufferGeometry()
  const shadowAt = new THREE.BufferAttribute(shadowPos, 3)
  const shadowTint = new THREE.BufferAttribute(shadowCol, 3)
  shadowAt.setUsage(THREE.DynamicDrawUsage)
  shadowTint.setUsage(THREE.DynamicDrawUsage)
  shadowGeo.setAttribute('position', shadowAt)
  shadowGeo.setAttribute('color', shadowTint)
  const shadowStuff = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, depthWrite: false, depthFunc: THREE.GreaterDepth, toneMapped: false, side: THREE.DoubleSide })
  const shadows = new THREE.Mesh(shadowGeo, shadowStuff)
  shadows.name = 'arena-beam-shadows'
  shadows.frustumCulled = false
  shadows.visible = false
  shadows.renderOrder = 3
  // It lies a hair under the top of the slabs and is drawn only where something lies over it: on the ceramic and on what stands on it, never down in a seam or a hole, whose light a shadow cannot dim.
  shadows.position.z = -1.4
  root.add(shadows)

  let job: { key: string; s: Scorch; next: number; j1: number; done: boolean } | null = null
  let aimedLast = ''
  let last: BlastLine | null = null
  let chipsKey = ''
  let chipList: Chip[] = []
  const W = SCORCHED.w, H = SCORCHED.h

  // Paints rows of the scorch of a line: all that is left of it when `whole`, else one frame's share.
  const paint = (line: BlastLine, whole: boolean): void => {
    const key = lineKeyOf(line)
    if (!job || job.key !== key) {
      // Another line: the picture is wiped where the old one lay.
      if (job) {
        const r = scorchReach(job.s, W, H)
        for (let j = r.j0; j <= r.j1; j++) wounds.scorchData.fill(0, (j * W + r.i0) * 4, (j * W + r.i1 + 1) * 4)
      }
      const s = scorchFrom(line)
      const r = scorchReach(s, W, H)
      job = { key, s, next: r.j0, j1: r.j1, done: false }
    }
    if (job.done) return
    const rows = job.j1 - scorchReach(job.s, W, H).j0 + 1
    const to = whole ? job.j1 + 1 : Math.min(job.j1 + 1, job.next + Math.ceil(rows / AHEAD_FRAMES))
    paintScorch(wounds.scorchData, W, H, job.s, seed, job.next, to)
    job.next = to
    if (to > job.j1) {
      job.done = true
      wounds.scorch.needsUpdate = true
    }
  }

  const pose = (view: BossView, light?: (e: Emitter) => void, beam?: BeamDriver): void => {
    const t = view.time
    if (view.finish) last = { x0: view.finish.x0, y0: view.finish.y0, x1: view.finish.x1, y1: view.finish.y1 }
    const burnt = scorchOf(view, last)
    const aim = burnt ? null : aimOf(view)
    if (burnt) paint(burnt.line, true)
    else if (aim) {
      // A line that still moves is not painted: the work starts once it has lain still from one call to the next.
      const key = lineKeyOf(aim)
      if (key === aimedLast) paint(aim, false)
      aimedLast = key
    }
    const share = burnt ? burnt.share : 0
    wounds.burn.value.set(share, 1 + 1.4 * Math.sqrt(Math.max(0, Math.sin(Math.PI * share))))

    // The chips: thrown out as the front passes, then they lie.
    let nChips = 0
    if (burnt && share > 0 && job) {
      if (chipsKey !== job.key) {
        chipList = chipsOf(job.s, seed)
        chipsKey = job.key
      }
      for (let i = 0; i < chipList.length; i++) {
        const c = chipList[i]!
        const f = clamp01((share * 1.12 - c.when) / CHIP_FLIGHT)
        if (f <= 0) continue
        const out = 1 - (1 - f) * (1 - f)
        const z = c.size * 0.3 + Math.sin(Math.PI * f) * (14 + 44 * rnd(seed, 450, i))
        e.set((1 - f) * (3 + 5 * rnd(seed, 451, i)) + rnd(seed, 452, i) * 6, (1 - f) * 4 * rnd(seed, 453, i) + rnd(seed, 454, i) * 6, c.turn)
        q.setFromEuler(e)
        m4.compose(v.set(wx(c.fx + (c.x - c.fx) * out) + leanX * z, wy(c.fy + (c.y - c.fy) * out) + lean * z, z), q, sc.set(c.size, c.size * (0.6 + 0.5 * rnd(seed, 455, i)), c.size * 0.66))
        chips.setMatrixAt(nChips++, m4)
      }
    }
    chips.count = nChips
    chips.visible = nChips > 0
    if (nChips > 0) chips.instanceMatrix.needsUpdate = true

    // Smoke: thin columns that stand over the burn and the trench once the black is there.
    let nSmoke = 0
    if (burnt && share > 0.35 && job) {
      const s = job.s
      const strong = clamp01((share - 0.35) / 0.4)
      const each = Math.floor(SCORCH.smoke / COLUMNS)
      for (let c = 0; c < COLUMNS; c++) {
        const along = c < 2 ? s.at + (rnd(seed, 460, c) - 0.5) * SCORCH.burn * 1.5 : s.at * (0.12 + 0.6 * rnd(seed, 461, c))
        const across = (rnd(seed, 462, c) - 0.5) * (c < 2 ? SCORCH.burn * 1.3 : SCORCH.half * 0.6)
        const x = s.sx + s.ux * along - s.uy * across, y = s.sy + s.uy * along + s.ux * across
        const period = 2.6 + 1.2 * rnd(seed, 463, c)
        for (let j = 0; j < each; j++) {
          const g = (((t / period + j / each + rnd(seed, 464, c)) % 1) + 1) % 1
          // Thin smoke: the two over the burn stand a little taller than the wisps along the trench.
          const big = c < 2 ? 1 : 0
          const thick = (0.3 + 0.05 * big) * strong * Math.sin(Math.PI * Math.sqrt(g)) * (1 - g) ** 1.2
          const size = 12 + (56 + 22 * big) * g
          const z = 8 + (230 + 70 * big) * g
          const sway = 16 * g * Math.sin(t * 1.3 + c * 2.1 + g * 5)
          q.setFromAxisAngle(v.set(0, 0, 1), UP + 0.5 * (rnd(seed, 465, c * 8 + j) - 0.5))
          m4.compose(v.set(wx(x) + sway + leanX * z, wy(y) + lean * z, z), q, sc.set(size, size * 1.9, 1))
          smoke.setMatrixAt(nSmoke, m4)
          fade.setX(nSmoke++, thick)
        }
      }
    }
    smoke.count = nSmoke
    smoke.visible = nSmoke > 0
    if (nSmoke > 0) {
      smoke.instanceMatrix.needsUpdate = true
      fade.needsUpdate = true
    }

    // The cold beam: light on the ground from its line, and the shadows of what stands.
    const b = (beam ?? beamOf)(view)
    const on = !!b && b.strength > 0
    wounds.cold.value = on ? clamp01(b!.strength) : 0
    shadows.visible = on
    if (on && b) {
      wounds.beam.value.set(b.x0, b.y0, b.x1, b.y1)
      let k = 0
      const quad = (x: number[], y: number[], dark: number, glass: boolean): void => {
        const order = [0, 1, 2, 0, 2, 3]
        for (const n of order) {
          shadowPos[k] = wx(x[n]!)
          shadowPos[k + 1] = wy(y[n]!)
          shadowPos[k + 2] = 0
          // Dark at the thing, gone at the far end.
          const d = n < 2 ? dark : 0
          shadowCol[k] = 1 - d * (glass ? 0.95 : 1)
          shadowCol[k + 1] = 1 - d * (glass ? 0.7 : 0.95)
          shadowCol[k + 2] = 1 - d * (glass ? 0.8 : 0.84)
          k += 3
        }
      }
      PILLARS.forEach((p, i) => {
        if (rise(t, 0) <= 0) return
        const broken = !!brokenBy(view.breaks, t, STANDS[i]!)
        // Across the way the shadow falls: the pillar's width as the beam sees it.
        const ex = b.x1 - b.x0, ey = b.y1 - b.y0, l = Math.hypot(ex, ey) || 1
        const half = ARENA.pillar.side * 0.56
        const sh = beamShadow(b, [{ x: p.x - (ex / l) * half, y: p.y - (ey / l) * half }, { x: p.x + (ex / l) * half, y: p.y + (ey / l) * half }], broken ? 60 : ARENA.pillar.high, false)
        if (sh) quad(sh.x, sh.y, sh.dark, false)
      })
      PANES.forEach((p, i) => {
        if (brokenBy(view.breaks, t, STANDS[PILLARS.length + i]!)) return
        const sh = beamShadow(b, [{ x: p.x, y: p.y0 }, { x: p.x, y: p.y1 }], ARENA.pane.high, true)
        if (sh) quad(sh.x, sh.y, sh.dark, true)
      })
      shadowGeo.setDrawRange(0, k / 3)
      shadowAt.needsUpdate = true
      shadowTint.needsUpdate = true
      shadows.visible = k > 0
      if (light && !beam) {
        // The beam itself is another's. Nobody drives it: three cold lights along it stand in for the light it throws on the arena's own things. Whoever drives it brings its own lights, so there are none of mine then.
        for (const u of [0.15, 0.5, 0.85]) light({ x: b.x0 + (b.x1 - b.x0) * u, y: b.y0 + (b.y1 - b.y0) * u, z: 46, colour: [0.72, 0.86, 1], power: 1.6 * b.strength, reach: 900 })
      }
    }
  }

  return {
    object: root,
    pose,
    dispose(): void {
      lump.dispose()
      plane.dispose()
      dot.dispose()
      smokeStuff.dispose()
      shadowGeo.dispose()
      shadowStuff.dispose()
      chips.dispose()
      smoke.dispose()
    }
  }
}
