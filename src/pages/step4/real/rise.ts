// What the power-up's gold lights round the figure: the floor, the near pane, the shield and the boss's near side, and the ring that runs out at the burst.
import * as THREE from 'three'
import { finishState, powerPlan, standTilt } from '../../../boss/finish/index'
import { ringAt } from '../../../boss/rise'
import { GUARD, RISE_LIGHT as L, SOLID } from '../../../boss/tune'
import { finishNow, seatView, viewNow } from '../../../boss/viewof'
import type { Emitter, PartMaker, RealContext } from '../../../real/types'
import type { Shape } from '../../../stage/types'

export interface RiseLight {
  // 0 to 1: how much of the light is on, the flicker in it.
  level: number
  x: number
  y: number
  ground: number
  // The burst's ring: its radius in px and how strong it is, or null when there is none.
  ring: { radius: number; strength: number } | null
  lamps: Emitter[]
  // The flames' light on the figure itself: under each fist, and low before the feet.
  own: Emitter[]
}

const clamp01 = (u: number): number => Math.min(1, Math.max(0, u))

export function riseLight(): RiseLight | null {
  const i = finishNow()
  const pw = i?.power
  if (!i || !pw) return null
  const s = finishState(i)
  if (!s.up || s.fx.ring < 0.5) return null
  const flick = 0.85 + 0.15 * Math.sin(i.time * 23) * Math.sin(i.time * 7.3)
  const level = clamp01((s.fx.aura - L.none) / (1 - L.none)) * flick
  const x = s.pose.x
  const y = s.pose.y
  const since = i.time - pw.at - powerPlan(pw).end
  const radius = ringAt(since)
  const ring = radius !== null ? { radius, strength: L.ring.most * (1 - since / L.ring.seconds) } : null
  const lamps: Emitter[] = []
  const own: Emitter[] = []
  const colour: [number, number, number] = [L.colour[0], L.colour[1], L.colour[2]]
  const boss = viewNow()?.boss
  const bx = boss ? boss.x - x : 0
  const by = boss ? boss.y - y : 0
  const far = Math.hypot(bx, by)
  if (level > 0.01) {
    const big = s.pose.scale ?? 1
    const tilt = standTilt(s.pose.rise)
    const light = (px: number, py: number, pz: number, power: number, reach: number): void => {
      own.push({ x: x + big * px, y: y - big * (py * Math.cos(tilt) - pz * Math.sin(tilt)), z: s.pose.ground + Math.max(6, big * (py * Math.sin(tilt) + pz * Math.cos(tilt))), colour, power: power * level, reach: reach * big })
    }
    if (L.fist.power > 0) {
      for (const h of s.pose.hands) light(h[0] * L.fist.in, h[1] - L.fist.drop, h[2] + L.fist.front, L.fist.power, L.fist.reach)
      light(0, L.foot.up, L.foot.front, L.foot.power, L.foot.reach)
    }
    const pane = SOLID.panes.reduce((a, b) => (Math.abs((b[0] + b[2]) / 2 - x) < Math.abs((a[0] + a[2]) / 2 - x) ? b : a))
    const face = x > pane[2] ? pane[2] + L.lamp.off : pane[0] - L.lamp.off
    lamps.push({ x: face, y: Math.min(pane[3], Math.max(pane[1], y)), z: L.lamp.high, colour, power: L.lamp.power * level, reach: L.lamp.reach })
    if (boss && far > GUARD.radius) {
      const k = (far - GUARD.radius - L.lamp.off) / far
      lamps.push({ x: x + bx * k, y: y + by * k, z: L.lamp.high, colour, power: L.lamp.power * level, reach: L.lamp.reach })
    }
  }
  if (ring && boss && far > GUARD.radius) {
    const pass = clamp01(1 - Math.abs(ring.radius - (far - GUARD.radius)) / L.flash.near)
    const k = (far - GUARD.radius - 30) / far
    if (pass > 0) lamps.push({ x: x + bx * k, y: y + by * k, z: 60, colour, power: L.flash.power * pass, reach: L.flash.reach })
  }
  return { level, x, y, ground: s.pose.ground, ring, lamps, own }
}

const VERTEX = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

function stuff(fragment: string, colour: readonly [number, number, number] = L.colour): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uK: { value: 0 }, uR: { value: 0 }, uWide: { value: 0 }, uColour: { value: new THREE.Vector3(colour[0], colour[1], colour[2]) } },
    vertexShader: VERTEX,
    fragmentShader: fragment
  })
}

// Leaves what is darker than it as it is and takes down what is brighter.
function ceiling(m: THREE.ShaderMaterial): THREE.ShaderMaterial {
  m.blending = THREE.CustomBlending
  m.blendEquation = THREE.MinEquation
  m.blendSrc = THREE.OneFactor
  m.blendDst = THREE.OneFactor
  return m
}

const POOL = /* glsl */ `
  varying vec2 vUv; uniform float uK; uniform float uWide; uniform vec3 uColour;
  void main() {
    float f = max(0.0, 1.0 - length(vUv - 0.5) * 2.0);
    float a = uK * f * f * (3.0 - 2.0 * f);
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColour + (vec3(uWide) - uColour) * (1.0 - a) * (1.0 - a), 1.0);
  }`

// Drawn only where something stands over it, and what is there is made brighter by its colour, as a light would: the dark stays dark.
function over(m: THREE.ShaderMaterial): THREE.ShaderMaterial {
  m.depthFunc = THREE.GreaterDepth
  m.blending = THREE.CustomBlending
  m.blendSrc = THREE.DstColorFactor
  m.blendDst = THREE.OneFactor
  m.blendSrcAlpha = THREE.ZeroFactor
  m.blendDstAlpha = THREE.OneFactor
  return m
}

const NEAR = /* glsl */ `
  varying vec2 vUv; uniform float uK; uniform float uR; uniform float uWide; uniform vec3 uColour;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = uK * smoothstep(uR, uR + uWide, d) * clamp((1.0 - d) / (1.0 - uR - uWide), 0.0, 1.0);
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColour * a, 1.0);
  }`

const FLOOR = /* glsl */ `
  varying vec2 vUv; uniform float uK; uniform vec3 uColour;
  void main() {
    float f = max(0.0, 1.0 - length(vUv - 0.5) * 2.0);
    float a = uK * f * f * (3.0 - 2.0 * f);
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColour, a);
  }`

const RING = /* glsl */ `
  varying vec2 vUv; uniform float uK; uniform float uR; uniform float uWide; uniform vec3 uColour;
  void main() {
    float d = abs(length(vUv - 0.5) * 2.0 - uR);
    float a = uK * smoothstep(uWide, 0.0, d);
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uColour * vec3(1.0, 0.8, 0.5), vec3(1.0, 0.93, 0.6), smoothstep(uWide * 0.4, 0.0, d)), a);
  }`

// The figure's part with its light: the same anchor draws both.
export function lit(inner: PartMaker): PartMaker {
  return {
    key: (s: Shape, ctx: RealContext): string | null => inner.key(s, ctx),
    make(s: Shape, ctx: RealContext): THREE.Object3D {
      const group = new THREE.Group()
      const o = inner.make(s, ctx)
      const quad = new THREE.PlaneGeometry(1, 1)
      const pool = new THREE.Mesh(quad, ceiling(stuff(POOL, L.pool.colour)))
      const floor = new THREE.Mesh(quad, stuff(FLOOR, L.pool.colour))
      const ring = new THREE.Mesh(quad, stuff(RING))
      const near = new THREE.Mesh(quad, over(stuff(NEAR, L.near.colour)))
      for (const [n, m] of [pool, floor, ring, near].entries()) {
        m.visible = false
        m.frustumCulled = false
        m.renderOrder = m === near ? 4.5 : 6 + n / 2
        m.userData.order = m.renderOrder
      }
      group.add(o, pool, floor, ring, near)
      group.userData.inner = o
      group.userData.pool = pool
      group.userData.floor = floor
      group.userData.ring = ring
      group.userData.near = near
      return group
    },
    pose(group: THREE.Object3D, s: Shape, ctx: RealContext): void {
      seatView(s)
      inner.pose?.(group.userData.inner as THREE.Object3D, s, ctx)
      const floor = group.userData.floor as THREE.Mesh
      const ring = group.userData.ring as THREE.Mesh
      const near = group.userData.near as THREE.Mesh
      const pool = group.userData.pool as THREE.Mesh
      const r = riseLight()
      floor.visible = r !== null && r.level > 0.01
      ring.visible = r !== null && r.ring !== null
      near.visible = floor.visible && L.near.most > 0
      pool.visible = floor.visible && L.pool.most > 0
      if (!r) return
      if (pool.visible) {
        const u = (pool.material as THREE.ShaderMaterial).uniforms
        pool.position.set(r.x - 960, 540 - r.y, r.ground + 0.3)
        pool.scale.set(L.floor.reach * 2, L.floor.reach * 2, 1)
        u.uK!.value = Math.min(1, L.pool.most * r.level)
        u.uWide!.value = L.pool.top
      }
      if (near.visible) {
        const u = (near.material as THREE.ShaderMaterial).uniforms
        near.position.set(r.x - 960, 540 - r.y, r.ground + L.near.high)
        near.scale.set(L.near.reach * 2, L.near.reach * 2, 1)
        u.uK!.value = L.near.most * r.level
        u.uR!.value = L.near.hole / L.near.reach
        u.uWide!.value = L.near.soft / L.near.reach
      }
      if (floor.visible) {
        floor.position.set(r.x - 960, 540 - r.y, r.ground + 0.4)
        floor.scale.set(L.floor.reach * 2, L.floor.reach * 2, 1)
        ;(floor.material as THREE.ShaderMaterial).uniforms.uK!.value = L.floor.most * r.level
      }
      if (r.ring) {
        const half = L.ring.reach + L.ring.wide
        const u = (ring.material as THREE.ShaderMaterial).uniforms
        ring.position.set(r.x - 960, 540 - r.y, r.ground + 0.5)
        ring.scale.set(half * 2, half * 2, 1)
        u.uK!.value = r.ring.strength
        u.uR!.value = r.ring.radius / half
        u.uWide!.value = L.ring.wide / half
      }
      for (const e of [...r.own, ...r.lamps]) ctx.light(e)
    },
    drop(group: THREE.Object3D): void {
      inner.drop?.(group.userData.inner as THREE.Object3D)
      const floor = group.userData.floor as THREE.Mesh
      floor.geometry.dispose()
      ;(floor.material as THREE.Material).dispose()
      ;((group.userData.ring as THREE.Mesh).material as THREE.Material).dispose()
      ;((group.userData.near as THREE.Mesh).material as THREE.Material).dispose()
      ;((group.userData.pool as THREE.Mesh).material as THREE.Material).dispose()
    }
  }
}
