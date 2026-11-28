import * as THREE from 'three'
import type { PartMaker } from '../../../real/types'
import { COLOUR } from '../layout'
import { q, shared } from './careers-solids'
import { ink } from './flat'

// The band itself is printed on the first sheet. What runs along it is the type, set by the page, and the dots between the items.
export const ticker: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.kind === 'disc') return `tickerDot:${q(s.w)}`
    return ''
  },
  make(s) {
    const g = shared(`tickerDot:${q(s.w)}`, () => {
      const c = new THREE.CircleGeometry(s.w / 2, 20)
      const n = c.getAttribute('position').count
      c.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3))
      return c
    })
    const m = new THREE.Mesh(g, ink(COLOUR.orange))
    m.castShadow = false
    m.position.z = 0.05
    return m
  }
}
