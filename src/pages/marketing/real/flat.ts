import * as THREE from 'three'
import { look } from '../../../post/look'
import { studio } from '../../../post/studio'
import type { Outline } from '../../../shell/solids'

export type Rgb = [number, number, number]

const MOST = 1.3

// The picture bends what is brighter than its knee. A flat colour is given the light that comes out of the bend as the colour asked for; white stops at 252.
const unbent = (v: number): number => Math.min(MOST, v <= look.knee ? v : look.knee - (1 - look.knee) * Math.log(Math.max(1e-4, 1 - (v - look.knee) / (1 - look.knee)))) / look.exposure

export function tint(hex: number): Rgb {
  const c = new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
  return [unbent(c.r), unbent(c.g), unbent(c.b)]
}

export const WHITE = tint(0xffffff)

// A share of white as the bend shows it: what a flat white is multiplied by to come out as `hex`.
export function share(hex: number): Rgb {
  const c = tint(hex)
  return [c[0] / WHITE[0], c[1] / WHITE[1], c[2] / WHITE[2]]
}

const SHADE = `
	outgoingLight = diffuseColor.rgb * mix( vec3( 0.66, 0.68, 0.73 ), vec3( 1.0 ), smoothstep( 0.0, 1.0, wjaOpen ) );
`

let flatMade: THREE.MeshPhysicalMaterial | null = null

// The website's own surface: it shows its colour as it is, wherever the lamp stands, and takes the shadow of what stands over it.
export function flat(): THREE.MeshPhysicalMaterial {
  if (flatMade) return flatMade
  const m = studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1, 1, 1), vertexColors: true, roughness: 1, metalness: 0, specularIntensity: 0, envMapIntensity: 0 }))
  const lit = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    lit.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', SHADE + '#include <opaque_fragment>')
  }
  m.customProgramCacheKey = () => 'wja-studio-flat'
  m.name = 'careers-flat'
  flatMade = m
  return m
}

let shadeMade: THREE.MeshBasicMaterial | null = null

// A painted shadow: it darkens what is under it by the colour of its corners.
export function shade(): THREE.MeshBasicMaterial {
  if (shadeMade) return shadeMade
  shadeMade = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor })
  shadeMade.name = 'careers-shade'
  return shadeMade
}

const inks = new Map<number, THREE.MeshBasicMaterial>()

export function ink(hex: number): THREE.MeshBasicMaterial {
  let m = inks.get(hex)
  if (!m) {
    const c = tint(hex)
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), vertexColors: true, transparent: true, depthWrite: false })
    m.name = `careers-ink-${hex.toString(16)}`
    inks.set(hex, m)
  }
  return m
}

const ease = (u: number): number => u * u * (3 - 2 * u)

// Flat faces, bands and lines laid one over the other, each with its own colour, as one mesh.
export class Paint {
  private pos: number[] = []
  private col: number[] = []
  private idx: number[] = []

  private point(x: number, y: number, z: number, c: Rgb): number {
    this.pos.push(x, y, z)
    this.col.push(c[0], c[1], c[2])
    return this.pos.length / 3 - 1
  }

  face(o: Outline, cx: number, cy: number, z: number, c: Rgb, inset = 0): this {
    const first = this.pos.length / 3
    for (let i = 0; i < o.count; i++) this.point(cx + o.x[i]! - inset * o.nx[i]!, cy + o.y[i]! - inset * o.ny[i]!, z, c)
    const mid = this.point(cx, cy, z, c)
    for (let i = 0; i < o.count; i++) this.idx.push(mid, first + i, first + ((i + 1) % o.count))
    return this
  }

  // A band round an outline from `from` px inside it to `to` px inside it (less than nought is outside), its colour going from `a` to `b` in `steps` eased steps.
  band(o: Outline, cx: number, cy: number, z: number, from: number, to: number, a: Rgb, b: Rgb, steps = 1): this {
    let last = -1
    for (let k = 0; k <= steps; k++) {
      const u = k / steps
      const e = steps > 1 ? ease(u) : u
      const inset = from + (to - from) * u
      const c: Rgb = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]
      const first = this.pos.length / 3
      for (let i = 0; i < o.count; i++) this.point(cx + o.x[i]! - inset * o.nx[i]!, cy + o.y[i]! - inset * o.ny[i]!, z, c)
      if (last >= 0) {
        for (let i = 0; i < o.count; i++) {
          const j = (i + 1) % o.count
          this.idx.push(last + i, last + j, first + i, last + j, first + j, first + i)
        }
      }
      last = first
    }
    return this
  }

  // A line of one width through the points, with round ends and round corners.
  line(points: [number, number][], width: number, z: number, c: Rgb, closed = false): this {
    const r = width / 2
    const n = points.length
    const dot = (x: number, y: number): void => {
      const mid = this.point(x, y, z, c)
      const first = this.pos.length / 3
      const around = 10
      for (let i = 0; i < around; i++) this.point(x + Math.cos((i / around) * Math.PI * 2) * r, y + Math.sin((i / around) * Math.PI * 2) * r, z, c)
      for (let i = 0; i < around; i++) this.idx.push(mid, first + i, first + ((i + 1) % around))
    }
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const [ax, ay] = points[i]!
      const [bx, by] = points[(i + 1) % n]!
      const d = Math.hypot(bx - ax, by - ay)
      if (d < 1e-6) continue
      const nx = (-(by - ay) / d) * r
      const ny = ((bx - ax) / d) * r
      const p0 = this.point(ax + nx, ay + ny, z, c)
      const p1 = this.point(ax - nx, ay - ny, z, c)
      const p2 = this.point(bx - nx, by - ny, z, c)
      const p3 = this.point(bx + nx, by + ny, z, c)
      this.idx.push(p0, p1, p2, p0, p2, p3)
    }
    for (const [x, y] of points) dot(x, y)
    return this
  }

  // A filled shape through the points, which bulge outward everywhere.
  poly(points: [number, number][], z: number, c: Rgb): this {
    let mx = 0
    let my = 0
    for (const [x, y] of points) {
      mx += x / points.length
      my += y / points.length
    }
    const mid = this.point(mx, my, z, c)
    const first = this.pos.length / 3
    for (const [x, y] of points) this.point(x, y, z, c)
    for (let i = 0; i < points.length; i++) this.idx.push(mid, first + i, first + ((i + 1) % points.length))
    return this
  }

  // An oval whose colour goes from `inner` at its middle to `outer` at its edge.
  fan(cx: number, cy: number, rx: number, ry: number, z: number, inner: Rgb, outer: Rgb, rings = 12, around = 64): this {
    let last = -1
    for (let k = 0; k <= rings; k++) {
      const u = k / rings
      const e = ease(u)
      const c: Rgb = [inner[0] + (outer[0] - inner[0]) * e, inner[1] + (outer[1] - inner[1]) * e, inner[2] + (outer[2] - inner[2]) * e]
      const first = this.pos.length / 3
      for (let i = 0; i < around; i++) this.point(cx + Math.cos((i / around) * Math.PI * 2) * rx * u, cy + Math.sin((i / around) * Math.PI * 2) * ry * u, z, c)
      if (last >= 0) {
        for (let i = 0; i < around; i++) {
          const j = (i + 1) % around
          this.idx.push(last + i, last + j, first + i, last + j, first + j, first + i)
        }
      }
      last = first
    }
    return this
  }

  // The soft shadow of an outline: `dark` under it, fading to nothing over `spread` px outside it.
  soft(o: Outline, cx: number, cy: number, z: number, spread: number, dark: Rgb): this {
    this.face(o, cx, cy, z, dark)
    return this.band(o, cx, cy, z, 0, -spread, dark, [1, 1, 1], 6)
  }

  get empty(): boolean {
    return this.idx.length === 0
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    const count = this.pos.length / 3
    const normal = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) normal[i * 3 + 2] = 1
    const flip = this.idx.slice()
    const p = this.pos
    for (let i = 0; i < flip.length; i += 3) {
      const a = flip[i]! * 3
      const b = flip[i + 1]! * 3
      const c = flip[i + 2]! * 3
      const up = (p[b]! - p[a]!) * (p[c + 1]! - p[a + 1]!) - (p[b + 1]! - p[a + 1]!) * (p[c]! - p[a]!)
      if (up < 0) {
        const t = flip[i + 1]!
        flip[i + 1] = flip[i + 2]!
        flip[i + 2] = t
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2))
    g.setIndex(flip)
    return g
  }
}

// Points along an arc of a circle, for a line: angles in degrees, counted from the x axis toward y.
export function arcPoints(cx: number, cy: number, r: number, from: number, to: number, steps = 16): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return out
}
