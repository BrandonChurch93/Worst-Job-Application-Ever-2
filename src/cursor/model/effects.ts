import * as THREE from 'three'
import { config } from '../../config'
import { hash01 } from '../../core/random'
import { look as picture } from '../../post/look'
import { studio } from '../../post/studio'
import { UNIT, type BodyModel, type EffectsLook, type EffectsModel } from '../contract'
import { CENTRE, inside } from './shape'
import { detailTexture } from './texture'

const DROPS = 24
const STEAM = 54
const SMOKE_POINTS = 4
const SMOKE_EACH = 26
const DUST = 22
const PUFFS = STEAM + SMOKE_POINTS * SMOKE_EACH + DUST
const SEED = config.seed
const HOVER = config.scale.heights.cursorHover
const TOPS: [number, number][] = [[0.5, 1.2], [0.7, 3.6], [2.2, 3.4], [0.8, 6.4], [3.8, 5.6], [5.6, 8.2], [0.8, 10], [9.2, 10.6]]

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
const smooth = (v: number): number => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}

type Surface = (x: number, y: number, out: THREE.Vector3) => THREE.Vector3

// A bead of water: no colour of its own, the studio in its skin, a dark thin edge, and the light it gathers on the side away from the lamp.
function dropMaterial(): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.03, 0.035, 0.04), roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.45, transparent: true, depthWrite: false }))
  m.blending = THREE.CustomBlending
  m.blendSrc = THREE.OneFactor
  m.blendDst = THREE.OneMinusSrcAlphaFactor
  const law = m.onBeforeCompile
  const key = { value: new THREE.Vector3(...picture.key.direction).normalize() }
  m.onBeforeCompile = (shader, renderer) => {
    law.call(m, shader, renderer)
    shader.uniforms.uKey = key
    shader.fragmentShader = ('uniform vec3 uKey;\n' + shader.fragmentShader).replace(
      '#include <opaque_fragment>',
      `
      vec3 wjaN = normalize( normal );
      vec3 wjaV = normalize( vViewPosition );
      vec3 wjaL = normalize( ( viewMatrix * vec4( uKey, 0.0 ) ).xyz );
      float wjaFacing = saturate( dot( wjaN, wjaV ) );
      vec3 wjaSide = wjaN - wjaV * dot( wjaN, wjaV );
      vec3 wjaLamp = normalize( wjaL - wjaV * dot( wjaL, wjaV ) );
      float wjaAway = -dot( wjaSide, wjaLamp );
      float wjaGather = smoothstep( 0.2, 0.75, wjaAway ) * ( 1.0 - smoothstep( 0.82, 0.98, length( wjaSide ) ) );
      float wjaEdge = pow( 1.0 - wjaFacing, 1.7 );
      float wjaGlint = smoothstep( 0.9, 0.965, dot( reflect( -wjaV, wjaN ), wjaL ) );
      float wjaRim = pow( 1.0 - wjaFacing, 3.0 );
      diffuseColor.a = 0.03 + 0.6 * wjaRim + 0.26 * smoothstep( 0.05, 0.85, -wjaAway ) * ( 1.0 - wjaRim );
      outgoingLight *= 0.12 * ( 1.0 - 0.9 * wjaEdge );
      outgoingLight += vec3( 0.5, 0.5, 0.47 ) * wjaGather + vec3( 2.6, 2.55, 2.45 ) * wjaGlint;
      #include <opaque_fragment>
      `
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-drop'
  return m
}

const PUFF_VERTEX = `
attribute vec4 aTint;
attribute vec3 aSeed;
varying vec3 vN;
varying vec3 vRound;
varying vec3 vV;
varying vec3 vAt;
varying vec4 vTint;
varying vec3 vSeed;
void main() {
  vTint = aTint;
  vSeed = aSeed;
  vAt = position;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
  mat3 im = mat3( instanceMatrix );
  vec3 scale2 = vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
  vN = normalize( normalMatrix * ( im * ( normal / scale2 ) ) );
  vRound = normalize( normalMatrix * ( im * ( normal / sqrt( scale2 ) ) ) );
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const PUFF_FRAGMENT = `
uniform sampler2D uDetail;
uniform vec3 uKey;
uniform vec3 uKeyColour;
varying vec3 vN;
varying vec3 vRound;
varying vec3 vV;
varying vec3 vAt;
varying vec4 vTint;
varying vec3 vSeed;
void main() {
  vec3 v = normalize( vV );
  vec3 l = normalize( ( viewMatrix * vec4( uKey, 0.0 ) ).xyz );
  float facing = clamp( dot( normalize( vRound ), v ), 0.0, 1.0 );
  vec2 at = vec2( vAt.x, vAt.y * 0.45 ) + vAt.z * vec2( 0.31, 0.17 );
  vec4 wide = texture2D( uDetail, at * 0.11 + vSeed.xy );
  vec4 fine = texture2D( uDetail, at * 0.34 + vSeed.yx * 1.7 );
  float cloud = clamp( ( wide.g * 0.6 + fine.b * 0.4 - 0.3 ) * 2.5, 0.0, 1.0 );
  float dense = facing * ( 0.6 + 0.4 * facing );
  float from = 0.03 + 0.62 * ( 1.0 - cloud );
  float thick = smoothstep( from, from + 0.5, dense );
  float alpha = vTint.a * thick;
  if ( alpha < 0.003 ) discard;
  vec3 n = normalize( mix( vRound, vN, 0.5 ) );
  float lit = 0.62 + 0.38 * dot( n, l ) + 0.16 * ( cloud - 0.5 );
  gl_FragColor = vec4( vTint.rgb * uKeyColour * lit, alpha );
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

class Effects implements EffectsModel {
  readonly root = new THREE.Group()
  private drops: THREE.InstancedMesh
  private puffs: THREE.InstancedMesh
  private tint: THREE.InstancedBufferAttribute
  private seeds: THREE.InstancedBufferAttribute
  private m = new THREE.Matrix4()
  private p = new THREE.Vector3()
  private s = new THREE.Vector3()
  private q = new THREE.Quaternion()
  private up = new THREE.Vector3(0, 0, 1)
  private a = new THREE.Vector3()
  private cos = 1
  private sin = 0
  private tops: THREE.Vector3[] = TOPS.map(() => new THREE.Vector3())

  constructor() {
    const bead = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    bead.rotateX(Math.PI / 2)
    this.drops = new THREE.InstancedMesh(bead, dropMaterial(), DROPS)
    this.drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const ball = new THREE.IcosahedronGeometry(1, 2)
    this.tint = new THREE.InstancedBufferAttribute(new Float32Array(PUFFS * 4), 4).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute
    this.seeds = new THREE.InstancedBufferAttribute(new Float32Array(PUFFS * 3), 3).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute
    ball.setAttribute('aTint', this.tint)
    ball.setAttribute('aSeed', this.seeds)
    const cloud = new THREE.ShaderMaterial({
      uniforms: {
        uDetail: { value: detailTexture() },
        uKey: { value: new THREE.Vector3(...picture.key.direction).normalize() },
        uKeyColour: { value: new THREE.Vector3(...picture.key.colour) }
      },
      vertexShader: PUFF_VERTEX,
      fragmentShader: PUFF_FRAGMENT,
      transparent: true,
      depthWrite: false
    })
    this.puffs = new THREE.InstancedMesh(ball, cloud, PUFFS)
    this.puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    for (const mesh of [this.drops, this.puffs]) {
      mesh.frustumCulled = false
      mesh.castShadow = mesh === this.drops
      mesh.receiveShadow = false
      mesh.count = 0
      mesh.visible = false
      mesh.userData.part = 'cursor-effects'
      this.root.add(mesh)
    }
  }

  // A point of the body, turned the way the body is turned, in the space the effects live in.
  private on(surface: Surface, x: number, y: number, out: THREE.Vector3): THREE.Vector3 {
    surface(x, y, out)
    const px = out.x * this.cos - out.y * this.sin
    out.y = out.x * this.sin + out.y * this.cos
    out.x = px
    return out
  }

  apply(look: EffectsLook, body: BodyModel, turn: number): void {
    this.cos = Math.cos(turn)
    this.sin = Math.sin(turn)
    const own = (body as { surface?: Surface }).surface
    const surface: Surface = own ? (x, y, out) => own.call(body, x, y, out) : (x, y, out) => body.anchor(x, y, out)
    this.sweat(look, surface)
    this.cloud(look, surface)
  }

  private sweat(look: EffectsLook, surface: Surface): void {
    const amount = clamp01(look.sweat)
    let n = 0
    if (amount > 0.01) {
      const dx = -this.sin
      const dy = this.cos
      const floor = -HOVER + 0.05
      const p = this.p
      for (let i = 0; i < DROPS; i++) {
        const on = clamp01(amount * (DROPS + 1) - i)
        if (on <= 0) continue
        const period = 1.5 + 1.3 * hash01(i, 1, SEED)
        const clock = look.time / period + hash01(i, 2, SEED)
        const cycle = Math.floor(clock)
        const t = clock - cycle
        let x = 2.6
        let y = 8
        for (let k = 0; k < 8; k++) {
          const hx = 0.5 + 10 * hash01(i * 31 + k, cycle, SEED + 3)
          const hy = 1.5 + 13.5 * Math.pow(hash01(i * 31 + k, cycle, SEED + 4), 1.25)
          if (inside(hx, hy) > 0.85) {
            x = hx
            y = hy
            break
          }
        }
        const size = (0.3 + 0.62 * Math.pow(hash01(i, cycle, SEED + 5), 1.8)) * (0.8 + 0.2 * amount) * on * UNIT
        const flyer = hash01(i, cycle, SEED + 6) < 0.2
        let r = size
        let long = 1
        let high = 0.8
        let angle = 0
        if (flyer) {
          this.on(surface, CENTRE[0], CENTRE[1], this.a)
          this.on(surface, x, y, p)
          const ox = p.x - this.a.x
          const oy = p.y - this.a.y
          const len = Math.max(1e-3, Math.hypot(ox, oy))
          const far = (2.5 + 3 * hash01(i, cycle, SEED + 7)) * UNIT
          const grow = smooth(t / 0.18)
          const w = clamp01((t - 0.18) / 0.5)
          const out = 1 - (1 - w) * (1 - w)
          const z0 = p.z
          p.x += (ox / len) * far * out
          p.y += (oy / len) * far * out - 1.5 * UNIT * w * w
          p.z = z0 + (floor - z0) * w * w + 2.5 * UNIT * w * (1 - w) * 2
          angle = Math.atan2(oy, ox) - Math.PI / 2
          long = 1 + 0.5 * Math.sin(Math.PI * w)
          r = size * 0.7 * grow
          if (t > 0.68) {
            const v = (t - 0.68) / 0.32
            p.z = floor
            high = 0.8 - 0.55 * smooth(v * 3)
            r *= (1 + 0.25 * smooth(v * 3)) * (1 - smooth((v - 0.35) / 0.65))
          }
        } else {
          let reach = 0
          for (let k = 0; k < 48; k++) {
            if (inside(x + dx * (reach + 0.35), y + dy * (reach + 0.35)) < 0.3) break
            reach += 0.35
          }
          const grow = smooth(t / 0.3)
          const u = clamp01((t - 0.3) / 0.42)
          const ran = reach * u * u
          this.on(surface, x + dx * ran, y + dy * ran, p)
          r = size * grow
          long = 1 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.1))
          if (t > 0.72) {
            const v = (t - 0.72) / 0.28
            const fall = clamp01(v / 0.4)
            p.y -= (0.8 + 1.6 * fall) * UNIT * fall
            p.z += (floor - p.z) * fall * fall
            long = 1 + 0.3 * Math.sin(Math.PI * fall)
            if (fall >= 1) {
              const w = (v - 0.4) / 0.6
              high = 0.8 - 0.55 * smooth(w * 3)
              r *= (1 + 0.3 * smooth(w * 3)) * (1 - smooth((w - 0.3) / 0.7))
            }
          }
        }
        if (r < 0.02) continue
        this.q.setFromAxisAngle(this.up, angle)
        this.s.set(r, r * long, r * high)
        this.m.compose(p, this.q, this.s)
        this.drops.setMatrixAt(n++, this.m)
      }
    }
    this.drops.count = n
    this.drops.visible = n > 0
    if (n > 0) this.drops.instanceMatrix.needsUpdate = true
  }

  private puff(n: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, turn: number, r: number, g: number, b: number, alpha: number, salt: number): number {
    if (alpha < 0.004 || n >= PUFFS) return n
    this.p.set(x, y, z + rz)
    this.q.setFromAxisAngle(this.up, turn)
    this.s.set(rx, ry, rz)
    this.m.compose(this.p, this.q, this.s)
    this.puffs.setMatrixAt(n, this.m)
    this.tint.setXYZW(n, r, g, b, alpha)
    this.seeds.setXYZ(n, hash01(salt, 11, SEED), hash01(salt, 12, SEED), hash01(salt, 13, SEED))
    return n + 1
  }

  // One rising column: its puffs follow one curling path, thin at the foot and wide at the head.
  private plume(n: number, x: number, y: number, z: number, amount: number, time: number, count: number, strands: number, high: number, period: number, thin: number, wide: number, dark: number, pale: number, dense: number, salt: number): number {
    const a0 = hash01(salt, 51, SEED) * 6.28
    const a1 = hash01(salt, 52, SEED) * 6.28
    const lean = (hash01(salt, 53, SEED) - 0.35) * 0.2
    const each = count / strands
    for (let i = 0; i < count; i++) {
      const s = i % strands
      const j = Math.floor(i / strands)
      const path = (h: number): number =>
        lean * h + (0.035 * h + 0.0095 * h * h) * Math.sin(h * (0.5 + 0.13 * s) + a0 + s * 2.2 - time * 1.6) + 0.1 * h * Math.sin(h * 0.21 + a1 + time * 0.55)
      const clock = time / period + (j + 0.41 * s) / each
      const cycle = Math.floor(clock)
      const t = clock - cycle
      const h = high * Math.pow(t, 0.9) * (1 - 0.07 * s)
      const off = path(h)
      const slope = (path(h + 0.2) - off) / 0.2
      const size = (thin + (wide - thin) * Math.pow(t, 1.5)) * (0.8 + 0.4 * hash01(i, cycle, SEED + salt + 1)) * UNIT
      const long = 3.4 - 1.6 * t
      const shade = dark + (pale - dark) * t
      const alpha = amount * dense * smooth(t / 0.06) * Math.pow(1 - t, 0.8) * (1 - 0.3 * t * t)
      n = this.puff(n, x + off * UNIT, y + h * UNIT, z + (0.1 + 3.2 * t + 0.5 * s * t) * UNIT, size, size * long, size * 0.7, -Math.atan(slope), shade, shade * 1.005, shade * 1.02, alpha, salt * 13 + i * 7 + cycle * 3)
    }
    return n
  }

  private cloud(look: EffectsLook, surface: Surface): void {
    let n = 0
    const steam = clamp01(look.steam)
    if (steam > 0.01) {
      TOPS.forEach((t, i) => this.on(surface, t[0], t[1], this.tops[i]!))
      let top = this.tops[0]!
      for (const t of this.tops) if (t.y > top.y) top = t
      n = this.plume(n, top.x, top.y - 2.2 * UNIT, top.z, steam, look.time, STEAM, 3, 17, 1.9, 0.32, 2.3, 1.0, 1.0, 0.6, 3)
    }
    const points = Math.min(SMOKE_POINTS, look.smoke.length)
    for (let k = 0; k < points; k++) {
      const s = look.smoke[k]!
      const amount = clamp01(s.amount)
      if (amount <= 0.01) continue
      this.on(surface, s.x, s.y, this.a)
      n = this.plume(n, this.a.x, this.a.y, this.a.z, amount, look.time, SMOKE_EACH, 2, 17, 4.8, 0.3, 2.4, 0.16, 0.46, 0.62, 40 + k * 9)
    }
    if (look.dust >= 0 && look.dust < 1) {
      const d = look.dust
      const ease = 1 - Math.pow(1 - d, 3)
      this.on(surface, CENTRE[0], CENTRE[1], this.a)
      const cx = this.a.x
      const cy = this.a.y
      for (let i = 0; i < DUST; i++) {
        const ang = ((i + 0.7 * hash01(i, 41, SEED)) / DUST) * Math.PI * 2
        const from = (4.4 + 2.6 * Math.abs(Math.sin(ang)) + 1.6 * hash01(i, 44, SEED)) * UNIT
        const reach = from + (2 + 5 * hash01(i, 42, SEED)) * UNIT * ease
        const size = (1.1 + 2.4 * ease) * (0.6 + 0.8 * hash01(i, 43, SEED)) * UNIT
        const alpha = 0.72 * smooth(d / 0.07) * Math.pow(1 - d, 1.5)
        n = this.puff(n, cx + Math.cos(ang) * reach, cy + Math.sin(ang) * reach, -HOVER + 0.4 * UNIT * ease, size * 1.25, size, size * 0.42, ang, 0.6, 0.56, 0.5, alpha, 400 + i)
      }
    }
    this.puffs.count = n
    this.puffs.visible = n > 0
    if (n > 0) {
      this.puffs.instanceMatrix.needsUpdate = true
      this.tint.needsUpdate = true
      this.seeds.needsUpdate = true
    }
  }

  dispose(): void {
    this.drops.geometry.dispose()
    this.puffs.geometry.dispose()
    ;(this.drops.material as THREE.Material).dispose()
    ;(this.puffs.material as THREE.Material).dispose()
  }
}

export const makeEffects: (() => EffectsModel) | null = () => new Effects()
