import * as THREE from 'three'
import { font, loadFont, measure, type BakedFont } from './metrics'
import { madeOf, words, type Made } from './words'

export { font, loadFont, measure, words }
export type { BakedFont, Made }

const glyphCache = new Map<string, { position: Float32Array; index: Uint32Array }>()

function glyphGeometry(name: string, code: number, segments: number): { position: Float32Array; index: Uint32Array } {
  const key = `${name}:${code}:${segments}`
  const hit = glyphCache.get(key)
  if (hit) return hit
  const g = font(name).glyphs[String(code)]
  const empty = { position: new Float32Array(0), index: new Uint32Array(0) }
  if (!g || g.p.length === 0) {
    glyphCache.set(key, empty)
    return empty
  }
  const path = new THREE.ShapePath()
  const p = g.p
  for (let i = 0; i < p.length; ) {
    const c = p[i]!
    if (c === 0) {
      path.moveTo(p[i + 1]!, p[i + 2]!)
      i += 3
    } else if (c === 1) {
      path.lineTo(p[i + 1]!, p[i + 2]!)
      i += 3
    } else if (c === 2) {
      path.quadraticCurveTo(p[i + 1]!, p[i + 2]!, p[i + 3]!, p[i + 4]!)
      i += 5
    } else if (c === 3) {
      path.bezierCurveTo(p[i + 1]!, p[i + 2]!, p[i + 3]!, p[i + 4]!, p[i + 5]!, p[i + 6]!)
      i += 7
    } else {
      path.currentPath?.closePath()
      i += 1
    }
  }
  const geo = new THREE.ShapeGeometry(path.toShapes(), segments)
  const src = geo.getAttribute('position')
  const position = new Float32Array(src.count * 2)
  for (let i = 0; i < src.count; i++) {
    position[i * 2] = src.getX(i)
    position[i * 2 + 1] = src.getY(i)
  }
  const index = new Uint32Array(geo.getIndex()!.array)
  geo.dispose()
  const out = { position, index }
  glyphCache.set(key, out)
  return out
}

export interface TypeRun {
  // The copy key or config key the words come from, written as the kit writes it.
  key: string
  text: string
  made: Made
  font: string
  px: number
  // Page pixels: left, top, width, height of the run's ink box.
  box: [number, number, number, number]
  states: string[]
  mesh: THREE.Mesh
}

export interface RunSpec {
  key: string
  made?: Made
  // Only for runs made at run time: typed input, a counter, the score display.
  text?: string
  line?: string
  font: string
  px: number
  // Page pixels: where the baseline starts, or its centre or end with align.
  x: number
  y: number
  align?: 'left' | 'centre' | 'right'
  tracking?: number
  z?: number
  states?: string[]
}

export class TypeRegister {
  readonly runs: TypeRun[] = []

  // Sets one run of type as geometry, lying on the surface. Page pixels in, world units out.
  set(spec: RunSpec, material: THREE.Material): TypeRun {
    const made: Made = spec.made ?? madeOf(spec.key)
    const text = spec.line ?? words(spec.key, spec.text)
    const f = font(spec.font)
    const scale = spec.px / f.unitsPerEm
    const m = measure(spec.font, text, spec.px, spec.tracking ?? 0)
    const left = spec.align === 'centre' ? spec.x - m.width / 2 : spec.align === 'right' ? spec.x - m.width : spec.x
    const segments = Math.max(3, Math.min(12, Math.round(spec.px / 6)))
    const codes = Array.from(text, (ch) => ch.codePointAt(0)!)
    let vertices = 0
    let indices = 0
    const parts = codes.map((code) => {
      const g = glyphGeometry(spec.font, code, segments)
      vertices += g.position.length / 2
      indices += g.index.length
      return g
    })
    const position = new Float32Array(vertices * 3)
    const normal = new Float32Array(vertices * 3)
    const index = new Uint32Array(indices)
    let v = 0
    let k = 0
    let top = -Infinity
    let bottom = Infinity
    parts.forEach((g, i) => {
      const ox = m.advances[i]!
      for (let j = 0; j < g.position.length; j += 2) {
        const gy = g.position[j + 1]! * scale
        position[v * 3 + (j / 2) * 3] = ox + g.position[j]! * scale
        position[v * 3 + (j / 2) * 3 + 1] = gy
        normal[v * 3 + (j / 2) * 3 + 2] = 1
        if (gy > top) top = gy
        if (gy < bottom) bottom = gy
      }
      for (let j = 0; j < g.index.length; j++) index[k++] = g.index[j]! + v
      v += g.position.length / 2
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(left - 960, 540 - spec.y, spec.z ?? 0.06)
    mesh.receiveShadow = true
    mesh.userData.type = spec.key
    if (!Number.isFinite(top)) {
      top = 0
      bottom = 0
    }
    const run: TypeRun = { key: spec.key, text, made, font: spec.font, px: spec.px, box: [left, spec.y - top, m.width, top - bottom], states: spec.states ?? ['rest'], mesh }
    this.runs.push(run)
    return run
  }

  clear(): void {
    for (const run of this.runs) run.mesh.geometry.dispose()
    this.runs.length = 0
  }
}
