import * as THREE from 'three'
import { studio } from '../../post/studio'
import type { BodyModel } from '../contract'
import { OUTLINE, UNIT } from '../contract'

// Three lengths of clear sticky tape hold the strips of a reassembled body: each is rolled on from one end and pulled off from the other.
export const TAPE = {
  along: 30,
  lie: 0.35,
  thick: 1.1,
  // The mesh reaches this far past the tape's own edge, in page pixels: the tape's small shadow is drawn there.
  margin: 2.2,
  on: [0.4, 0.56] as [number, number],
  off: [0.8, 0.97] as [number, number],
  pieces: [
    { x: 3.4, y: 5.6, turn: 0.16, half: 20, wide: 5.4, cut: 2.2, late: 0 },
    { x: 5.0, y: 10.4, turn: -0.12, half: 27, wide: 5.8, cut: -1.8, late: 0.03 },
    { x: 8.3, y: 16.0, turn: 0.3, half: 15, wide: 5.0, cut: 1.6, late: 0.06 }
  ]
}

const ramp = (u: number, a: number, b: number): number => Math.min(1, Math.max(0, (u - a) / (b - a)))

function within(x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const a = OUTLINE[i]!
    const b = OUTLINE[j]!
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}

// Clear matte tape: a faint frost over what it covers, a thin bright line on the edges toward the lamp, a thin dark one on the edges away from it,
// pinked ends, one corner of the far end that never stuck down and catches the light, and a small soft shadow just outside the edges that face away from the lamp.
function tapeMaterial(): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xebe8dc, roughness: 0.3, metalness: 0, specularIntensity: 1, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide }))
  const law = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    law.call(m, shader, renderer)
    shader.vertexShader = ('attribute vec4 aTape;\nvarying vec4 vTape;\n' + shader.vertexShader).replace('#include <begin_vertex>', '#include <begin_vertex>\nvTape = aTape;')
    shader.fragmentShader = ('varying vec4 vTape;\n' + shader.fragmentShader).replace(
      '#include <opaque_fragment>',
      `
      float wjaSaw = 1.1 * abs( fract( vTape.z / 1.9 ) - 0.5 ) * 2.0;
      float wjaOut = max( abs( vTape.z ) - vTape.w, max( wjaSaw - vTape.x, wjaSaw - vTape.y ) );
      float wjaAa = max( fwidth( wjaOut ), 1e-4 );
      float wjaBody = 1.0 - smoothstep( -wjaAa, wjaAa, wjaOut );
      vec2 wjaGrad = vec2( dFdx( wjaOut ), dFdy( wjaOut ) );
      float wjaLee = dot( wjaGrad / max( length( wjaGrad ), 1e-5 ), vec2( 0.6, -0.8 ) );
      float wjaRim = wjaBody * ( 1.0 - smoothstep( 0.0, max( 0.7, 2.0 * wjaAa ), -wjaOut ) );
      float wjaRun = 0.55 + 0.45 * sin( vTape.x * 0.83 + vTape.z * 0.4 ) * sin( vTape.x * 0.21 + 1.3 );
      float wjaBright = wjaRim * smoothstep( 0.1, 0.9, -wjaLee ) * wjaRun;
      float wjaDark = wjaRim * smoothstep( 0.1, 0.9, wjaLee );
      float wjaCast = ( 1.0 - wjaBody ) * ( 1.0 - smoothstep( 0.0, ${(2.0).toFixed(1)}, wjaOut ) ) * smoothstep( -0.1, 0.8, wjaLee );
      float wjaFrost = 0.33 + 0.07 * sin( vTape.x * 0.37 + vTape.z * 1.7 );
      float wjaBand = ( vTape.z / vTape.w + 0.38 ) / 0.2;
      float wjaSheen = wjaBody * exp( -wjaBand * wjaBand ) * ( 0.45 + 0.55 * sin( vTape.x * 0.29 + 0.7 ) * sin( vTape.x * 0.11 + 2.1 ) );
      float wjaFold = sin( vTape.x * 0.9 + vTape.z * 1.3 + 2.0 * sin( vTape.x * 0.13 ) );
      float wjaCrease = wjaBody * pow( max( wjaFold, 0.0 ), 28.0 ) * step( 0.55, sin( vTape.x * 0.19 + 1.0 ) );
      float wjaCorner = wjaBody * ( 1.0 - smoothstep( 0.0, 5.0, vTape.y + ( 1.0 - vTape.z / vTape.w ) * 2.5 ) );
      float wjaShine = 0.55 * max( wjaSheen, 0.0 ) + 0.5 * wjaCrease + 0.7 * wjaCorner;
      outgoingLight = mix( outgoingLight * 0.9 * ( 1.0 - 0.75 * wjaDark ) + vec3( 0.36, 0.355, 0.34 ) * wjaBright + vec3( 0.5, 0.495, 0.48 ) * wjaShine, vec3( 0.03, 0.028, 0.026 ), 1.0 - wjaBody );
      diffuseColor.a = wjaBody * min( 1.0, wjaFrost + 0.5 * wjaBright + 0.4 * wjaDark + 0.6 * wjaShine ) + 0.46 * wjaCast * wjaCast;
      if ( diffuseColor.a < 0.004 ) discard;
      #include <opaque_fragment>
      `
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-cursor-tape'
  return m
}

export interface Tape {
  root: THREE.Object3D
  // u is the share of the reassembly that has passed, lift is how far the strips stand off the body's face.
  apply(u: number, body: BodyModel, lift: number): void
  dispose(): void
}

export function makeTape(): Tape {
  const root = new THREE.Group()
  const rows = TAPE.along + 1
  const count = TAPE.pieces.length * rows * 2
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  position.setUsage(THREE.DynamicDrawUsage)
  const index: number[] = []
  TAPE.pieces.forEach((_, p) => {
    for (let i = 0; i < TAPE.along; i++) {
      const a = (p * rows + i) * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', position)
  geometry.setIndex(index)
  const lay = new THREE.BufferAttribute(new Float32Array(count * 4), 4)
  lay.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('aTape', lay)
  const material = tapeMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = false
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  mesh.userData.part = 'cursor-damage'
  root.add(mesh)
  const at = new THREE.Vector3()
  const high = new Float32Array(rows)
  const soft = new Float32Array(rows)
  return {
    root,
    apply(u: number, body: BodyModel, lift: number): void {
      let shown = false
      TAPE.pieces.forEach((piece, p) => {
        const on = ramp(u, TAPE.on[0] + piece.late, TAPE.on[1] + piece.late)
        const off = ramp(u, TAPE.off[0] + piece.late * 0.5, TAPE.off[1] + piece.late * 0.5)
        if (on > off) shown = true
        const c = Math.cos(piece.turn)
        const n = Math.sin(piece.turn)
        const s0 = -piece.half + 2 * piece.half * off
        const s1 = -piece.half + 2 * piece.half * Math.max(on, off)
        for (let e = 0; e < 2; e++) {
          const side = e ? 1 : -1
          for (let i = 0; i < rows; i++) {
            const s = s0 - TAPE.margin + ((s1 - s0 + 2 * TAPE.margin) * i) / TAPE.along
            const reach = piece.wide + TAPE.margin
            const x = piece.x * UNIT + s * c - side * reach * n
            const y = -piece.y * UNIT + s * n + side * reach * c
            lay.setXYZW((p * rows + i) * 2 + e, s - s0 - side * piece.cut * 0.5, s1 - s + side * piece.cut * 0.5, side * reach, piece.wide)
            // The tape is stuck to the body: it goes where the body's own point goes when the body is stretched, squashed or bent.
            body.anchor(x / UNIT, -y / UNIT, at)
            high[i] = within(x / UNIT, -y / UNIT) ? at.z * 2 + lift + TAPE.thick : TAPE.lie
            position.setXYZ((p * rows + i) * 2 + e, at.x, at.y, 0)
          }
          for (let i = 0; i < rows; i++) soft[i] = Math.max(high[Math.max(0, i - 1)]!, high[i]!, high[Math.min(rows - 1, i + 1)]!)
          high.set(soft)
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < rows; i++) soft[i] = Math.max(high[i]!, (high[Math.max(0, i - 1)]! + 2 * high[i]! + high[Math.min(rows - 1, i + 1)]!) / 4)
            high.set(soft)
          }
          // The free end curls up off the page as it is pulled.
          for (let i = 0; i < rows; i++) position.setZ((p * rows + i) * 2 + e, high[i]! + (off > 0 && off < 1 ? 9 * Math.exp(-i / 3) : 0))
        }
      })
      mesh.visible = shown
      if (!shown) return
      position.needsUpdate = true
      lay.needsUpdate = true
      geometry.computeVertexNormals()
    },
    dispose(): void {
      geometry.dispose()
      material.dispose()
    }
  }
}
