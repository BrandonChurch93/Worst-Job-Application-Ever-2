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
