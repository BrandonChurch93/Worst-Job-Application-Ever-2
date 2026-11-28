// What burns round the standing arrow: the gold flame and its ring on the ground, the ball, the beam, the skid marks, the smoke and the dust.
// Frame of `object`: the ground's own. x = page x - 960, y = 540 - page y, z = 0 on the page surface, in page px.
// All of it is drawn from an `Fx` of the acting and the view time: nothing here keeps a clock or draws a random number.
import * as THREE from 'three'
import { hash01 } from '../../core/random'
import type { Emitter } from '../../real/types'
import { STAND, type StandPose } from '../../cursor/stand/rig'
import type { Fx } from './acting'

export type Level = 'low' | 'medium' | 'high' | null

export interface FinishFx {
  object: THREE.Object3D
  pose(fx: Fx, figure: StandPose, time: number, light?: (e: Emitter) => void): void
  setLevel(level: Level): void
  counts(): { draws: number }
  dispose(): void
}

const GOLD: [number, number, number] = [1, 0.66, 0.2]
const COLD: [number, number, number] = [0.72, 0.86, 1]
const SEED = 4107

// How many pieces each level draws: flame tongues round the figure, flames of the ring, puffs.
const PIECES = { low: { tongues: 7, ring: 10, puffs: 14 }, medium: { tongues: 11, ring: 16, puffs: 24 }, high: { tongues: 14, ring: 22, puffs: 36 }, film: { tongues: 16, ring: 26, puffs: 44 } } as const
const MOST = PIECES.film

const NOISE = /* glsl */ `
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { return 0.6 * vn(p) + 0.3 * vn(p * 2.1 + 3.7) + 0.1 * vn(p * 4.3 + 9.1); }
`

// Laid over the picture, not added to it: the page is nearly white, and light added to white is only white.
const add = { transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide } as const

function flameStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...add,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aFlame;
      varying vec2 vUv;
      varying vec4 vFlame;
      void main() { vUv = uv; vFlame = aFlame; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec4 vFlame;
      ${NOISE}
      void main() {
        float seed = vFlame.x;
        float k = vFlame.y;
        float y = vUv.y;
        float m = vn(vec2(seed * 31.0, uTime * 2.3 + seed * 7.0));
        float tall = 0.6 + 0.4 * m;
        float t = clamp(y / tall, 0.0, 1.0);
        // A tongue: it leans one way, then the other, and comes to a point.
        float sway = sin(t * 4.2 + seed * 40.0 - uTime * 5.0) * 0.26 * t + (fbm(vec2(seed * 9.0, y * 3.0 - uTime * 2.6)) - 0.5) * 0.7 * t;
        float x = (vUv.x - 0.5) * 2.0 - sway;
        float w = (0.12 + 0.62 * sin(3.14159 * pow(1.0 - t, 0.6))) * pow(1.0 - t, 0.4);
        float ax = abs(x);
        float body = smoothstep(w, w * 0.72, ax) * smoothstep(0.0, 0.05, y) * step(y, tall);
        // A wisp: a bright thin skin, and only a breath of gold inside it.
        float inner = smoothstep(w * 0.62, w * 0.3, ax) * (1.0 - t * 0.6);
        float skin = body * (1.0 - (0.86 - 0.6 * vFlame.z) * inner);
        vec3 col = mix(vec3(1.75, 0.98, 0.16), vec3(1.5, 0.62, 0.06), clamp(inner + t * 0.35, 0.0, 1.0));
        float a = skin * k * (1.0 - 0.3 * t);
        if (a < 0.003) discard;
        gl_FragColor = vec4(col, min(1.0, a));
      }`
  })
}

function glowStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...add,
    uniforms: { uTime: { value: 0 }, uK: { value: 0 }, uBurst: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uK; uniform float uBurst;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float ang = atan(p.y, p.x);
        float lick = fbm(vec2(cos(ang), sin(ang)) * 3.0 + uTime * vec2(0.4, -0.9));
        float edge = 0.4 + 0.07 * (lick - 0.5) + 0.42 * uBurst;
        float ring = exp(-pow((r - edge) / (0.035 + 0.05 * uBurst), 2.0)) * (0.6 + 0.8 * lick);
        float pool = exp(-r * r * 5.5) * 0.36 + exp(-r * r * 2.2) * 0.1;
        float a = (ring * (1.0 - uBurst) + pool) * uK * smoothstep(1.0, 0.75, r);
        if (a < 0.002) discard;
        vec3 col = mix(vec3(1.5, 0.72, 0.1), vec3(1.9, 1.3, 0.4), clamp(ring, 0.0, 1.0));
        gl_FragColor = vec4(col, min(0.85, a));
      }`
  })
}

function ballStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...add,
    depthTest: false,
    uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uCore: { value: 0.2 }, uAim: { value: new THREE.Vector2(1, 0) }, uRays: { value: 1 }, uSize: { value: 1 } },
    // It faces whoever looks at it.
    vertexShader: /* glsl */ `uniform float uSize; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.xy * uSize, 0.0, 0.0)); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uGlow; uniform float uCore; uniform vec2 uAim; uniform float uRays;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        vec2 d = p / max(r, 1e-4);
        float core = smoothstep(uCore, uCore * 0.6, r);
        float rim = smoothstep(uCore * 1.5, uCore * 0.9, r);
        float halo = exp(-r * r / (uCore * uCore * 5.0));
        // Thin streaks that leave the ball, more of them the way it will go.
        float thin = pow(vn(d * 7.0 + uTime * vec2(1.3, -0.9)), 9.0) * 1.6 + pow(vn(d * 19.0 - uTime * vec2(0.8, 1.7) + 4.0), 12.0) * 1.4;
        float fore = 0.45 + 0.55 * smoothstep(-0.4, 0.9, dot(d, uAim));
        float run = fract(r * 1.6 - uTime * 1.9 + vn(d * 5.0) * 2.0);
        float rays = thin * fore * smoothstep(1.0, 0.3, r) * smoothstep(uCore * 0.8, uCore * 1.6, r) * (0.5 + 0.5 * run) * uRays;
        vec3 blue = vec3(0.34, 0.62, 1.0);
        vec3 col = mix(mix(blue * 1.25, vec3(0.75, 0.9, 1.3), clamp(rim + rays * 2.0, 0.0, 1.0)), vec3(2.3), core);
        float a = clamp(core + rim * 0.9 + halo * 0.4 + rays * 1.5, 0.0, 1.0) * min(1.0, uGlow) * smoothstep(1.0, 0.86, r);
        if (a < 0.002) discard;
        gl_FragColor = vec4(col, a);
      }`
  })
}

// The beam's sheet: `long` px along, `wide` px to each side at the far end.
export const BEAM = { long: 2600, wide: 520, core: [4, 0.03], glow: [15, 0.19], speed: 4200 } as const

function beamStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    ...add,
    depthTest: false,
    uniforms: { uTime: { value: 0 }, uOpen: { value: 0 }, uPower: { value: 1 }, uAge: { value: 0 }, uKeep: { value: new THREE.Vector4(0, 0, -1, -1) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uOpen; uniform float uPower; uniform float uAge; uniform vec4 uKeep;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        float d = vUv.x * ${BEAM.long.toFixed(1)};
        float y = (vUv.y - 0.5) * 2.0 * ${BEAM.wide.toFixed(1)};
        float s = (0.35 + 0.65 * uPower) * uOpen;
        float coreH = (${BEAM.core[0].toFixed(1)} + d * ${BEAM.core[1].toFixed(3)}) * s;
        float glowH = (${BEAM.glow[0].toFixed(1)} + d * ${BEAM.glow[1].toFixed(3)}) * s;
        float a = abs(y);
        float yn = y / max(glowH, 1e-3);
        float head = uAge * ${BEAM.speed.toFixed(1)};
        float reach = smoothstep(head, head - 160.0, d);
        float wob = (fbm(vec2(d * 0.004 - uTime * 6.0, 1.7)) - 0.5) * 0.25;
        float core = smoothstep(coreH * (1.0 + wob), coreH * 0.55, a);
        float glow = exp(-yn * yn * 3.2);
        // Streaks: thin lines that fan out with the beam and run along it.
        float lines = pow(vn(vec2(yn * 17.0, d * 0.003 - uTime * 9.0)), 8.0) * 2.4 + pow(vn(vec2(yn * 41.0 + 5.0, d * 0.005 - uTime * 13.0)), 11.0) * 2.6;
        float fan = pow(vn(vec2(yn * 6.0 + 11.0, d * 0.002 - uTime * 4.0)), 4.0);
        float streak = (lines * 2.2 + fan * 0.5) * smoothstep(1.25, 0.2, abs(yn));
        vec3 blue = vec3(0.1, 0.42, 1.0);
        vec3 col = mix(blue, vec3(0.5, 0.78, 1.25), clamp(glow * glow * 0.8, 0.0, 1.0));
        col = mix(col, vec3(0.86, 0.95, 1.4), clamp(streak, 0.0, 1.0));
        col = mix(col, vec3(2.0), core);
        float alpha = clamp(core + glow * 0.78 + streak * 0.85, 0.0, 1.0) * reach * smoothstep(0.0, 14.0, d) * uOpen;
        // The button is not the beam's to hide: the light parts round it and closes again behind.
        if (uKeep.z > 0.0) {
          vec2 q = abs(vec2(d, y) - uKeep.xy) - uKeep.zw + 12.0;
          float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 12.0;
          float lee = smoothstep(uKeep.z * 3.5, 0.0, d - uKeep.x) * step(uKeep.x, d) * smoothstep(uKeep.w * 1.15, uKeep.w * 0.4, abs(y - uKeep.y));
          alpha *= 1.0 - 0.94 * max(smoothstep(7.0, -2.0, sd), lee * 0.75);
          col = mix(col, vec3(1.7), exp(-max(sd, 0.0) / 9.0) * 0.5 * core);
        }
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(col, alpha);
      }`
  })
}

function markStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */ `attribute vec2 aMark; varying vec2 vUv; varying vec2 vMark; void main() { vUv = uv; vMark = aMark; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec2 vMark;
      ${NOISE}
      void main() {
        float y = (vUv.y - 0.5) * 2.0;
        float grain = 0.45 + 0.55 * vn(vec2(vUv.x * 9.0 + vMark.y * 13.0, y * 5.0 + vMark.y * 7.0));
        float lines = 0.3 + 0.7 * smoothstep(0.3, 0.6, vn(vec2(vMark.y * 3.0, y * 3.0 + vMark.y)));
        float a = smoothstep(1.0, 0.4, abs(y)) * smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.85, vUv.x) * (0.6 + 0.4 * grain) * lines * vMark.x;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vec3(0.12, 0.1, 0.08), a * 0.9);
      }`
  })
}

function puffStuff(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: /* glsl */ `attribute vec4 aPuff; varying vec2 vUv; varying vec4 vPuff; void main() { vUv = uv; vPuff = aPuff; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec4 vPuff;
      ${NOISE}
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float lumps = fbm(p * 2.2 + vPuff.x * 9.0);
        float a = smoothstep(1.0, 0.2, r + (lumps - 0.5) * 0.9) * vPuff.y;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vec3(vPuff.z) * (0.75 + 0.5 * lumps), a);
      }`
  })
}

export function makeFinishFx(): FinishFx {
  const object = new THREE.Group()
  object.name = 'finish-fx'
  const quad = new THREE.PlaneGeometry(1, 1)
  const standing = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
  const along = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0)
  let pieces: { tongues: number; ring: number; puffs: number } = MOST

  const flameGeo = new THREE.InstancedBufferGeometry().copy(standing as unknown as THREE.InstancedBufferGeometry)
  const flameData = new THREE.InstancedBufferAttribute(new Float32Array((MOST.tongues + MOST.ring) * 4), 4).setUsage(THREE.DynamicDrawUsage)
  flameGeo.setAttribute('aFlame', flameData)
  const flameMat = flameStuff()
  const flames = new THREE.InstancedMesh(flameGeo, flameMat, MOST.tongues + MOST.ring)
  const glowMat = glowStuff()
  const glow = new THREE.Mesh(quad, glowMat)
  const ballMat = ballStuff()
  const ball = new THREE.Mesh(quad, ballMat)
  const flareMat = ballStuff()
  const flare = new THREE.Mesh(quad, flareMat)
  const beamMat = beamStuff()
  const beam = new THREE.Mesh(along, beamMat)
  const markGeo = new THREE.InstancedBufferGeometry().copy(along as unknown as THREE.InstancedBufferGeometry)
  const markData = new THREE.InstancedBufferAttribute(new Float32Array(12 * 2), 2).setUsage(THREE.DynamicDrawUsage)
  markGeo.setAttribute('aMark', markData)
  const markMat = markStuff()
  const marks = new THREE.InstancedMesh(markGeo, markMat, 12)
  const puffGeo = new THREE.InstancedBufferGeometry().copy(quad as unknown as THREE.InstancedBufferGeometry)
  const puffData = new THREE.InstancedBufferAttribute(new Float32Array(MOST.puffs * 4), 4).setUsage(THREE.DynamicDrawUsage)
  puffGeo.setAttribute('aPuff', puffData)
  const puffMat = puffStuff()
  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, MOST.puffs)
  const all: THREE.Mesh[] = [marks, glow, flames, puffs, beam, ball, flare]
  all.forEach((m, i) => {
    m.frustumCulled = false
    m.castShadow = false
    m.receiveShadow = false
    m.renderOrder = 8 + i
    m.userData.order = 8 + i
    m.visible = false
    object.add(m)
  })

  const m4 = new THREE.Matrix4()
  const X = new THREE.Vector3()
  const Yv = new THREE.Vector3()
  const Zv = new THREE.Vector3()
  const O = new THREE.Vector3()

  // A card that stands in the figure's plane: its foot at a place of that plane, `w` wide and `h` tall, turned by `turn` in the plane.
  const card = (p: StandPose, fx: number, fy: number, fz: number, w: number, h: number, turn: number): THREE.Matrix4 => {
    const a = STAND.rise * p.rise
    const c = Math.cos(a)
    const s = Math.sin(a)
    const ct = Math.cos(turn)
    const st = Math.sin(turn)
    X.set(ct * w, st * c * w, st * s * w)
    Yv.set(-st * h, ct * c * h, ct * s * h)
    Zv.set(0, -s, c)
    O.set(p.x - 960 + fx, 540 - p.y + fy * c - fz * s, p.ground + fy * s + fz * c)
    return m4.makeBasis(X, Yv, Zv).setPosition(O)
  }

  const flat = (x: number, y: number, z: number, w: number, h: number, rot: number): THREE.Matrix4 => {
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    X.set(c * w, -s * w, 0)
    Yv.set(s * h, c * h, 0)
    Zv.set(0, 0, 1)
    return m4.makeBasis(X, Yv, Zv).setPosition(x - 960, 540 - y, z)
  }

  const pose = (fx: Fx, p: StandPose, time: number, light?: (e: Emitter) => void): void => {
    const k = fx.aura
    flames.visible = glow.visible = k > 0.01
    if (flames.visible) {
      flameMat.uniforms.uTime!.value = time
      glowMat.uniforms.uTime!.value = time
      glowMat.uniforms.uK!.value = Math.min(1.2, k)
      glowMat.uniforms.uBurst!.value = fx.burst
      const grow = 0.3 + 0.7 * Math.min(1, k) + 0.9 * Math.sin(Math.PI * Math.min(1, fx.burst * 1.6))
      const d = flameData.array as Float32Array
      let n = 0
      for (let j = 0; j < pieces.tongues; j++) {
        // Round the figure, from one shoe over the head to the other.
        const u = (j + 0.5) / pieces.tongues
        const th = Math.PI * (1.18 - 1.36 * u)
        const seed = hash01(j, 1, SEED)
        const rx = 37 + 8 * seed
        const ry = 50
        const bx = 2 + Math.cos(th) * rx * 0.86
        const by = 44 + Math.sin(th) * ry * 0.8
        const tall = (30 + 30 * hash01(j, 2, SEED)) * grow * (1.1 - 0.35 * Math.max(0, Math.sin(th)))
        flames.setMatrixAt(n, card(p, bx, by, -2.5, 15 + 7 * seed, tall, -Math.cos(th) * 0.5))
        d[n * 4] = seed
        d[n * 4 + 1] = Math.min(1, k) * (1 - 0.6 * fx.burst)
        d[n * 4 + 2] = 0.15
        d[n * 4 + 3] = 0
        n++
      }
      const wide = 1 + 0.9 * fx.burst
      for (let j = 0; j < pieces.ring; j++) {
        const ph = (j / pieces.ring) * Math.PI * 2 + 0.3
        const seed = hash01(j, 3, SEED)
        const gx = Math.cos(ph) * 56 * wide
        const gy = Math.sin(ph) * 21 * wide
        const tall = (11 + 15 * hash01(j, 4, SEED)) * grow
        // On the ground: the card's foot is carried from the page to the figure's plane at height 0.
        const a = STAND.rise * p.rise
        flames.setMatrixAt(n, card(p, gx, -gy * Math.cos(a), gy * Math.sin(a), 9 + 5 * seed, tall, (seed - 0.5) * 0.5))
        d[n * 4] = seed + 0.37
        d[n * 4 + 1] = Math.min(1, k) * (1 - fx.burst) * fx.ring
        d[n * 4 + 2] = 0.5
        d[n * 4 + 3] = 1
        n++
      }
      flames.count = n
      flames.instanceMatrix.needsUpdate = true
      flameData.needsUpdate = true
      glow.matrixAutoUpdate = false
      glow.matrix.copy(flat(p.x, p.y, p.ground + 0.6, 280, 105, 0))
      const flick = 0.85 + 0.15 * Math.sin(time * 23) * Math.sin(time * 7.3)
      light?.({ x: p.x, y: p.y - 26, z: p.ground + 44, colour: GOLD, power: (1.3 * Math.min(1, k) + 2.5 * Math.sin(Math.PI * Math.min(1, fx.burst * 1.6))) * flick, reach: 620 })
    }

    ball.visible = fx.ball !== null
    if (fx.ball) {
      const b = fx.ball
      const u = ballMat.uniforms
      u.uTime!.value = time
      u.uGlow!.value = Math.min(1.5, b.glow * 1.25)
      u.uCore!.value = 0.1
      u.uRays!.value = 0.3 + 0.7 * Math.min(1, b.glow)
      u.uSize!.value = b.size * 8
      ball.position.set(b.x - 960, 540 - b.y, b.z + b.size * 0.3)
      light?.({ x: b.x, y: b.y, z: b.z + 6, colour: COLD, power: 0.2 + 1.0 * b.glow, reach: 200 + 260 * b.glow, shadow: true })
    }

    beam.visible = flare.visible = fx.beam !== null
    if (fx.beam) {
      const b = fx.beam
      const u = beamMat.uniforms
      u.uTime!.value = time
      u.uOpen!.value = b.open
      u.uPower!.value = b.power
      u.uAge!.value = b.age
      const keep = u.uKeep!.value as THREE.Vector4
      if (b.keep) {
        const kx = b.keep.x - b.x
        const ky = b.keep.y - b.y
        keep.set(kx * Math.cos(b.aim) + ky * Math.sin(b.aim), kx * Math.sin(b.aim) - ky * Math.cos(b.aim), b.keep.w / 2, b.keep.h / 2)
      } else keep.set(0, 0, -1, -1)
      beam.matrixAutoUpdate = false
      beam.matrix.copy(flat(b.x, b.y, b.z, BEAM.long, BEAM.wide * 2, b.aim))
      const f = flareMat.uniforms
      f.uTime!.value = time * 1.7
      f.uGlow!.value = Math.min(1.4, b.open * 1.4)
      f.uCore!.value = 0.1
      f.uRays!.value = 1
      ;(f.uAim!.value as THREE.Vector2).set(Math.cos(b.aim), -Math.sin(b.aim))
      f.uSize!.value = (120 + 70 * b.power) * (0.5 + 0.5 * b.open) * (1 + 0.5 * Math.exp(-b.age * 9))
      flare.position.set(b.x - 960, 540 - b.y, b.z + 2)
      const s = (0.4 + 0.6 * b.power) * b.open * (0.92 + 0.08 * Math.sin(time * 61))
      const c = Math.cos(b.aim)
      const sn = Math.sin(b.aim)
      light?.({ x: b.x + c * 30, y: b.y + sn * 30, z: b.z + 2, colour: COLD, power: 2.0 * s, reach: 900, shadow: true })
      light?.({ x: b.x + c * 330, y: b.y + sn * 330, z: b.z + 14, colour: COLD, power: 1.6 * s, reach: 900, shadow: true })
      light?.({ x: b.x + c * 800, y: b.y + sn * 800, z: b.z + 40, colour: COLD, power: 1.2 * s, reach: 900 })
    }

    let n = 0
    const md = markData.array as Float32Array
    for (const s of fx.skid) {
      if (n >= 12 || s.k <= 0.01) continue
      const long = Math.hypot(s.x1 - s.x0, s.y1 - s.y0)
      marks.setMatrixAt(n, flat(s.x0, s.y0, 0.35, long, 6.5, Math.atan2(s.y1 - s.y0, s.x1 - s.x0)))
      md[n * 2] = s.k
      md[n * 2 + 1] = 0.3 + n
      n++
    }
    for (const s of fx.scuffs) {
      if (n >= 12) continue
      marks.setMatrixAt(n, flat(s.x - s.long / 2, s.y, 0.35, s.long, 4.5, 0))
      md[n * 2] = 0.7
      md[n * 2 + 1] = 2.1 + n
      n++
    }
    marks.visible = n > 0
    marks.count = n
    if (n > 0) {
      marks.instanceMatrix.needsUpdate = true
      markData.needsUpdate = true
    }

    let q = 0
    const pd = puffData.array as Float32Array
    const puff = (x: number, y: number, z: number, size: number, seed: number, alpha: number, grey: number): void => {
      if (q >= pieces.puffs || alpha <= 0.004) return
      puffs.setMatrixAt(q, flat(x, y, z, size, size, seed * 6.28))
      pd[q * 4] = seed
      pd[q * 4 + 1] = alpha
      pd[q * 4 + 2] = grey
      pd[q * 4 + 3] = 0
      q++
    }
    const wisp = pieces.puffs >= 36 ? 9 : pieces.puffs >= 24 ? 7 : 5
    fx.smoke.forEach((s, hnd) => {
      // A wisp: puffs leave the hand one after another, rise up the screen, widen and thin.
      for (let j = 0; j < wisp; j++) {
        const life = 1.5
        const born = (j / wisp) * life
        const age = ((s.age - born) % life + life) % life
        if (s.age < born) continue
        const u = age / life
        const seed = hash01(j, 7 + hnd, SEED)
        const sway = Math.sin(u * 5 + seed * 6 + hnd) * (3 + 9 * u)
        puff(s.x + sway, s.y - 3 - 58 * u, s.z + 6 + 30 * u, 6 + 17 * u, seed, 0.85 * s.k * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - 0.55 * u), 0.36)
      }
    })
    for (const dd of fx.dust) {
      const life = 0.9
      if (dd.age < 0 || dd.age >= life) continue
      const u = dd.age / life
      const ring = Math.min(8, Math.max(4, Math.floor(pieces.puffs / 5)))
      for (let j = 0; j < ring; j++) {
        const a = (j / ring) * Math.PI * 2 + 0.4
        const seed = hash01(j, 11, SEED)
        const far = dd.size * (0.25 + 0.85 * (1 - (1 - u) * (1 - u))) * (0.8 + 0.4 * seed)
        puff(dd.x + Math.cos(a) * far, dd.y + Math.sin(a) * far * 0.5, 3 + 8 * u, dd.size * (0.3 + 0.5 * u), seed, 0.42 * (1 - u) * (1 - u), 0.66)
      }
    }
    puffs.visible = q > 0
    puffs.count = q
    if (q > 0) {
      puffs.instanceMatrix.needsUpdate = true
      puffData.needsUpdate = true
    }
  }

  return {
    object,
    pose,
    setLevel(level: Level): void {
      pieces = level === null ? PIECES.film : PIECES[level]
    },
    counts(): { draws: number } {
      return { draws: all.filter((m) => m.visible).length }
    },
    dispose(): void {
      for (const g of [quad, standing, along, flameGeo, markGeo, puffGeo]) g.dispose()
      for (const m of [flameMat, glowMat, ballMat, flareMat, beamMat, markMat, puffMat]) m.dispose()
      flames.dispose()
      marks.dispose()
      puffs.dispose()
    }
  }
}
