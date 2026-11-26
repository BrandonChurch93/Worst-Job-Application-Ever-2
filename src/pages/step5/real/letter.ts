import * as THREE from 'three'
import { look } from '../../../post/look'
import type { PartMaker } from '../../../real/types'
import { roundedRect } from '../../../shell/solids'
import { STOCK, stock } from './letterStock'

const q = (v: number): number => Math.round(v * 4) / 4
const ease = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

const GRID = { nx: 72, ny: 48 }
const CURL: [number, number, number, number][] = [[1, 1, 5.6, 104], [1, 0, 1.8, 64], [0, 1, 1.5, 58], [0, 0, 0.7, 44]]
const SHADE = { rings: [[-14, 0.62], [0, 0.62], [1.4, 0.48], [3.6, 0.35], [7, 0.24], [12, 0.15], [18, 0.085], [26, 0.04], [38, 0]] as [number, number][], round: [[-10, 0.26], [0, 0.26], [1.5, 0.17], [4, 0.1], [8, 0.045], [14, 0]] as [number, number][], dx: 7, dy: -8.5, colour: 0x1b1815 }
const AIR = { glow: 0.16, full: 140 }

export function liftAt(u: number, v: number, w: number, h: number): number {
  let z = 0
  for (const [cu, cv, tall, reach] of CURL) {
    const d = Math.hypot((u - cu) * w, (v - cv) * h)
    const k = ease(1 - d / reach)
    z += tall * k * k * k
  }
  return z
}

function sheetGeometry(w: number, h: number, thick: number): THREE.BufferGeometry {
  const { nx, ny } = GRID
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3)
  const uv = new Float32Array((nx + 1) * (ny + 1) * 2)
  const col = new Float32Array((nx + 1) * (ny + 1) * 3)
  const idx: number[] = []
  const [lx, ly] = look.key.direction
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const u = i / nx
      const v = j / ny
      const n = j * (nx + 1) + i
      const jx = 0
      const jy = 0
      const x = (u - 0.5) * w + jx
      const y = (0.5 - v) * h + jy
      pos[n * 3] = x
      pos[n * 3 + 1] = y
      pos[n * 3 + 2] = thick + liftAt(u, v, w, h)
      uv[n * 2] = x / STOCK.tile
      uv[n * 2 + 1] = y / STOCK.tile
      const e = 0.004
      const sx = (liftAt(u + e, v, w, h) - liftAt(u - e, v, w, h)) / (2 * e * w)
      const sy = -(liftAt(u, v + e, w, h) - liftAt(u, v - e, w, h)) / (2 * e * h)
      const lit = Math.min(0.05, Math.max(-0.2, (sx * lx + sy * ly) * 1.5))
      const edge = Math.min(u * w, (1 - u) * w, v * h, (1 - v) * h)
      const worn = 1 - 0.035 * Math.exp(-edge / 2.2)
      const tone = (1 + lit) * worn
      col[n * 3] = tone
      col[n * 3 + 1] = tone
      col[n * 3 + 2] = tone
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i
      const b = a + 1
      const c = a + nx + 1
      const d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function shadeGeometry(w: number, h: number, rings: [number, number][]): THREE.BufferGeometry {
  const per = 8
  const n = (per + 1) * 4
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const [d, a] of rings) {
    const o = roundedRect(w + 2 * d, h + 2 * d, Math.max(0.5, 1 + d), per)
    for (let i = 0; i < n; i++) {
      pos.push(o.x[i]!, o.y[i]!, 0)
      col.push(1, 1, 1, a)
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(k * n + i, k * n + j, (k + 1) * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

export const letter: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.id !== 'letter') return null
    return `letter:${q(s.w)}:${q(s.h)}:${q(s.z1 - s.z0)}`
  },
  make(s) {
    const root = new THREE.Group()
    const sheet = new THREE.Mesh(sheetGeometry(s.w, s.h, s.z1 - s.z0), stock().sheet)
    sheet.castShadow = true
    sheet.receiveShadow = true
    sheet.frustumCulled = false
    const shade = new THREE.Mesh(shadeGeometry(s.w, s.h, SHADE.rings), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHex(SHADE.colour, THREE.SRGBColorSpace), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
    shade.name = 'shade'
    shade.frustumCulled = false
    shade.material.polygonOffset = true
    shade.material.polygonOffsetFactor = -1
    shade.material.polygonOffsetUnits = -3
    const round = new THREE.Mesh(shadeGeometry(s.w, s.h, SHADE.round), shade.material)
    round.name = 'round'
    round.frustumCulled = false
    root.add(round, shade, sheet)
    return root
  },
  pose(o, s) {
    const shade = o.getObjectByName('shade') as THREE.Mesh
    const up = s.z0
    const k = 1 / (1 + (up / 5) * (up / 5))
    shade.visible = k > 0.02
    shade.position.set(SHADE.dx + up * 0.6, SHADE.dy - up * 0.6, 0.06 - up)
    const round = o.getObjectByName('round') as THREE.Mesh
    round.visible = shade.visible
    round.position.set(0, 0, 0.05 - up)
    ;(shade.material as THREE.MeshBasicMaterial).opacity = k
    stock().sheet.emissive.setScalar(AIR.glow * Math.min(1, up / AIR.full))
  },
  drop(o) {
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (!m.isMesh) return
      m.geometry.dispose()
      if (m.name === 'shade') (m.material as THREE.Material).dispose()
    })
  }
}
