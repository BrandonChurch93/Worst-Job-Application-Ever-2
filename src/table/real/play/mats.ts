import * as THREE from 'three'
import { studio } from '../../../post/studio'
import { lit } from '../light'
import { steel } from '../frame/steel'
import type { Zone } from '../zone'

export interface Mats {
  // Everything solid: the colour and the finish (roughness, metal, clear coat) ride on each vertex, so a zone's plastic, rubber, paper and steel are one material.
  solid: THREE.MeshPhysicalMaterial
  clear: THREE.MeshPhysicalMaterial
}

const made = new Map<string, Mats>()

function solidOf(z: Zone): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }))
  const room = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    room.call(m, shader, renderer)
    shader.vertexShader = 'attribute vec3 wjpFinish;\nvarying vec3 vWjpFinish;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWjpFinish = wjpFinish;')
    shader.fragmentShader =
      'varying vec3 vWjpFinish;\n' +
      shader.fragmentShader
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vWjpFinish.x;')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = vWjpFinish.y;')
        .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat = vWjpFinish.z;\n#endif')
  }
  m.customProgramCacheKey = () => 'wja-studio-play-solid-3'
  m.name = `play.solid.${z.id}`
  return lit(steel(m, z, { ceiling: 0.07, panel: 0.7, wide: 0.22, horizon: 1.6, lamps: 1.6, sky: 0.7 }), z)
}

// Clear plastic with no light passed through it: thin where it is seen straight on, bright where it turns away and at every edge.
function clearOf(z: Zone): THREE.MeshPhysicalMaterial {
  const m = studio(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.05, metalness: 0, transparent: true, opacity: 1, depthWrite: false, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, forceSinglePass: true }))
  const room = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    room.call(m, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      'float wjpEdge = pow( 1.0 - abs( dot( normalize( vViewPosition ), normalize( normal ) ) ), 2.4 );\ngl_FragColor.a = clamp( diffuseColor.a + wjpEdge * 0.34 + min( dot( outgoingLight, vec3( 0.3333 ) ) * 0.3, 0.2 ) * smoothstep( 0.0, 0.3, diffuseColor.a + wjpEdge ), 0.0, 1.0 );\n#include <tonemapping_fragment>'
    )
  }
  m.customProgramCacheKey = () => 'wja-studio-play-clear-2'
  m.name = `play.clear.${z.id}`
  return lit(m, z)
}

export function matsOf(z: Zone): Mats {
  let m = made.get(z.id)
  if (!m) {
    m = { solid: solidOf(z), clear: clearOf(z) }
    made.set(z.id, m)
  }
  return m
}

export function part(g: THREE.BufferGeometry, m: THREE.Material, name: string, o: { cast?: boolean; fine?: boolean } = {}): THREE.Mesh {
  const out = new THREE.Mesh(g, m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = true
  if (o.fine) out.userData.fine = true
  return out
}

export function drop(o: THREE.Object3D): void {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh && !m.geometry.userData.shared) m.geometry.dispose()
  })
}
