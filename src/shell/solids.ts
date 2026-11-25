import * as THREE from 'three'

export interface Outline {
  // Points in order, counter clockwise seen from above the page, with the outward normal at each.
  x: Float32Array
  y: Float32Array
  nx: Float32Array
  ny: Float32Array
  count: number
}

export function roundedRect(w: number, h: number, r: number, perCorner = 10): Outline {
  const rr = Math.max(0.001, Math.min(r, w / 2, h / 2))
  const n = perCorner + 1
  const count = n * 4
  const o: Outline = { x: new Float32Array(count), y: new Float32Array(count), nx: new Float32Array(count), ny: new Float32Array(count), count }
  const corners: [number, number, number][] = [
    [w / 2 - rr, h / 2 - rr, 0],
    [-w / 2 + rr, h / 2 - rr, 1],
    [-w / 2 + rr, -h / 2 + rr, 2],
    [w / 2 - rr, -h / 2 + rr, 3]
  ]
  let k = 0
  for (const [cx, cy, q] of corners) {
    for (let i = 0; i < n; i++) {
      const a = (q + i / perCorner) * (Math.PI / 2)
      const c = Math.cos(a)
      const s = Math.sin(a)
      o.x[k] = cx + rr * c
      o.y[k] = cy + rr * s
      o.nx[k] = c
      o.ny[k] = s
      k++
    }
  }
  return o
}

export function circle(r: number, segments = 48): Outline {
  const o: Outline = { x: new Float32Array(segments), y: new Float32Array(segments), nx: new Float32Array(segments), ny: new Float32Array(segments), count: segments }
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    o.nx[i] = Math.cos(a)
    o.ny[i] = Math.sin(a)
    o.x[i] = r * o.nx[i]!
    o.y[i] = r * o.ny[i]!
  }
  return o
}

// One step of a swept profile: how far the outline has moved inward, how high it is,
// and which way the surface faces there (outward share, upward share).
export interface Ring { inset: number; z: number; out: number; up: number }

export function plateProfile(height: number, bevel: number, base = 0, steps = 6): Ring[] {
  const b = Math.min(bevel, height - base)
  const rings: Ring[] = [
    { inset: 0, z: base, out: 1, up: 0 },
    { inset: 0, z: height - b, out: 1, up: 0 }
  ]
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    rings.push({ inset: b * (1 - Math.cos(a)), z: height - b + b * Math.sin(a), out: Math.cos(a), up: Math.sin(a) })
  }
  return rings
}

export function pocketProfile(depth: number, lip: number, steps = 5): Ring[] {
  const b = Math.min(lip, depth)
  const rings: Ring[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    rings.push({ inset: -b + b * Math.sin(a), z: -b + b * Math.cos(a), out: -Math.sin(a), up: Math.cos(a) })
  }
  rings.push({ inset: 0, z: -depth, out: -1, up: 0 })
  return rings
}

// Sweeps a profile round an outline and closes the last ring with a flat face looking up.
export function sweep(outline: Outline, rings: Ring[], cap = true): THREE.BufferGeometry {
  const n = outline.count
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const ring of rings) {
    for (let i = 0; i < n; i++) {
      const x = outline.x[i]! - ring.inset * outline.nx[i]!
      const y = outline.y[i]! - ring.inset * outline.ny[i]!
      pos.push(x, y, ring.z)
      nor.push(outline.nx[i]! * ring.out, outline.ny[i]! * ring.out, ring.up)
      uv.push(x, y)
    }
  }
  for (let k = 0; k < rings.length - 1; k++) {
    const a = k * n
    const b = (k + 1) * n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      idx.push(a + i, a + j, b + i, a + j, b + j, b + i)
    }
  }
  if (cap) {
    const last = rings[rings.length - 1]!
    const start = pos.length / 3
    let cx = 0
    let cy = 0
    for (let i = 0; i < n; i++) {
      const x = outline.x[i]! - last.inset * outline.nx[i]!
      const y = outline.y[i]! - last.inset * outline.ny[i]!
      cx += x / n
      cy += y / n
      pos.push(x, y, last.z)
      nor.push(0, 0, 1)
      uv.push(x, y)
    }
    pos.push(cx, cy, last.z)
    nor.push(0, 0, 1)
    uv.push(cx, cy)
    const centre = start + n
    for (let i = 0; i < n; i++) idx.push(centre, start + i, start + ((i + 1) % n))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

export function ringPath(outline: Outline, inset: number, cx: number, cy: number): THREE.Path {
  const path = new THREE.Path()
  for (let i = 0; i < outline.count; i++) {
    const x = cx + outline.x[i]! - inset * outline.nx[i]!
    const y = cy + outline.y[i]! - inset * outline.ny[i]!
    if (i === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  path.closePath()
  return path
}

export interface Hole { outline: Outline; cx: number; cy: number; lip: number }

// The top face of a slab, with an opening for every pocket, and its outer wall.
export function slab(w: number, h: number, thickness: number, holes: Hole[], edge = 2): THREE.BufferGeometry {
  const outer = roundedRect(w, h, edge, 3)
  const shape = new THREE.Shape()
  for (let i = 0; i < outer.count; i++) {
    const x = outer.x[i]! - edge * outer.nx[i]!
    const y = outer.y[i]! - edge * outer.ny[i]!
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  for (const hole of holes) shape.holes.push(ringPath(hole.outline, -hole.lip, hole.cx, hole.cy))
  const top = new THREE.ShapeGeometry(shape)
  const p = top.getAttribute('position')
  const uvs = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    uvs[i * 2] = p.getX(i)
    uvs[i * 2 + 1] = p.getY(i)
  }
  top.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  const wall = sweep(outer, plateProfile(0, edge, -thickness, 3), false)
  return merge([top, wall])
}

export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let vertices = 0
  let indices = 0
  for (const g of parts) {
    vertices += g.getAttribute('position').count
    indices += g.getIndex()!.count
  }
  const pos = new Float32Array(vertices * 3)
  const nor = new Float32Array(vertices * 3)
  const uv = new Float32Array(vertices * 2)
  const idx = new Uint32Array(indices)
  let v = 0
  let k = 0
  for (const g of parts) {
    const gp = g.getAttribute('position')
    const gn = g.getAttribute('normal')
    const gu = g.getAttribute('uv')
    pos.set(gp.array as Float32Array, v * 3)
    nor.set(gn.array as Float32Array, v * 3)
    if (gu) uv.set(gu.array as Float32Array, v * 2)
    const gi = g.getIndex()!
    for (let i = 0; i < gi.count; i++) idx[k++] = gi.getX(i) + v
    v += gp.count
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  out.setIndex(new THREE.BufferAttribute(idx, 1))
  return out
}

export function translate(g: THREE.BufferGeometry, x: number, y: number, z = 0): THREE.BufferGeometry {
  g.translate(x, y, z)
  const u = g.getAttribute('uv')
  if (u) {
    for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) + x, u.getY(i) + y)
    u.needsUpdate = true
  }
  return g
}
