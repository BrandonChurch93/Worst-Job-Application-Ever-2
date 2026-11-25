import * as THREE from 'three'
import { look } from './look'

// The small studio the surfaces reflect: one large soft light at the upper left and dim surroundings.
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene()
  const room = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.09, 0.09, 0.095), side: THREE.BackSide }))
  scene.add(room)
  const d = new THREE.Vector3(...look.key.direction).normalize()
  const box = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(7.5, 7.2, 6.9), side: THREE.DoubleSide }))
  box.position.copy(d).multiplyScalar(20)
  box.lookAt(0, 0, 0)
  scene.add(box)
  const glowBox = new THREE.Mesh(new THREE.PlaneGeometry(44, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.54, 0.53), side: THREE.DoubleSide }))
  glowBox.position.copy(d).multiplyScalar(22)
  glowBox.lookAt(0, 0, 0)
  scene.add(glowBox)
  // A long dim strip behind the viewer keeps flat glossy faces from reading as a black mirror.
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.22, 0.225), side: THREE.DoubleSide }))
  back.position.set(0, 0, 30)
  back.lookAt(0, 0, 0)
  scene.add(back)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(scene, 0.03, 0.1, 200)
  pmrem.dispose()
  room.geometry.dispose()
  box.geometry.dispose()
  glowBox.geometry.dispose()
  back.geometry.dispose()
  return target.texture
}

const shared = { envDiffuse: { value: look.envDiffuse }, keySpecular: { value: look.keySpecular } }

const dirStart = '#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )'
function patchedBegin(): string {
  const chunk = THREE.ShaderChunk.lights_fragment_begin
  const at = chunk.indexOf(dirStart)
  const end = chunk.indexOf('#pragma unroll_loop_end', at)
  if (at < 0 || end < 0) throw new Error('The light code of this three.js release is not the one this build was written for')
  const stop = end + '#pragma unroll_loop_end'.length
  const before = '\n\tvec3 wjaSpec0 = reflectedLight.directSpecular;\n\t#ifdef USE_CLEARCOAT\n\tvec3 wjaCoat0 = clearcoatSpecularDirect;\n\t#endif\n'
  const after = '\n\treflectedLight.directSpecular = mix( wjaSpec0, reflectedLight.directSpecular, wjaKeySpecular );\n\t#ifdef USE_CLEARCOAT\n\tclearcoatSpecularDirect = mix( wjaCoat0, clearcoatSpecularDirect, wjaKeySpecular );\n\t#endif\n'
  return chunk.slice(0, at + dirStart.length) + before + chunk.slice(at + dirStart.length, stop) + after + chunk.slice(stop)
}
function patchedMaps(): string {
  const chunk = THREE.ShaderChunk.lights_fragment_maps
  const line = 'iblIrradiance += getIBLIrradiance( geometryNormal );'
  if (!chunk.includes(line)) throw new Error('The light code of this three.js release is not the one this build was written for')
  return chunk.replace(line, 'iblIrradiance += wjaEnvDiffuse * getIBLIrradiance( geometryNormal );')
}

// The studio rule: lamps with shadows give the diffuse light, the studio's reflection gives the highlights.
export function studio<T extends THREE.MeshStandardMaterial>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.wjaEnvDiffuse = shared.envDiffuse
    shader.uniforms.wjaKeySpecular = shared.keySpecular
    shader.fragmentShader =
      'uniform float wjaEnvDiffuse;\nuniform float wjaKeySpecular;\n' +
      shader.fragmentShader.replace('#include <lights_fragment_begin>', patchedBegin()).replace('#include <lights_fragment_maps>', patchedMaps())
  }
  material.customProgramCacheKey = () => 'wja-studio'
  return material
}
