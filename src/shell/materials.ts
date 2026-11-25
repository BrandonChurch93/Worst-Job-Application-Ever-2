import * as THREE from 'three'
import { hash01 } from '../core/random'
import { look } from '../post/look'

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

const srgb = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace)

// A height field of fine grain made from the seed, as a normal picture that tiles.
export function grainNormalMap(size: number, seed: number, strength: number): THREE.DataTexture {
  const h = new Float32Array(size * size)
  const cell = (x: number, y: number, period: number, salt: number) => hash01(((x % period) + period) % period, ((y % period) + period) % period, seed + salt)
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const octave = (x: number, y: number, freq: number, salt: number) => {
    const period = size / freq
    const fx = x / freq
    const fy = y / freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = smooth(fx - x0)
    const ty = smooth(fy - y0)
    const a = cell(x0, y0, period, salt)
    const b = cell(x0 + 1, y0, period, salt)
    const c = cell(x0, y0 + 1, period, salt)
    const d = cell(x0 + 1, y0 + 1, period, salt)
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      h[y * size + x] = octave(x, y, 2, 11) * 0.5 + octave(x, y, 4, 23) * 0.3 + octave(x, y, 8, 37) * 0.2 + hash01(x, y, seed + 51) * 0.12
    }
  }
  const data = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const l = Math.sqrt(dx * dx + dy * dy + 1)
      const i = (y * size + x) * 4
      data[i] = Math.round((-dx / l) * 127.5 + 127.5)
      data[i + 1] = Math.round((-dy / l) * 127.5 + 127.5)
      data[i + 2] = Math.round((1 / l) * 127.5 + 127.5)
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

export interface Materials {
  ceramic: THREE.MeshPhysicalMaterial
  pocket: THREE.MeshPhysicalMaterial
  glass: THREE.MeshPhysicalMaterial
  aluminium: THREE.MeshPhysicalMaterial
  orange: THREE.MeshPhysicalMaterial
  gap: THREE.MeshPhysicalMaterial
  ink: THREE.MeshPhysicalMaterial
  inkOnOrange: THREE.MeshPhysicalMaterial
  enamel: THREE.MeshPhysicalMaterial
  edge: THREE.MeshPhysicalMaterial
  textures: THREE.Texture[]
}

export function makeMaterials(seed: number): Materials {
  const grain = grainNormalMap(512, seed, 2.2)
  // The surface's coordinates are page pixels, so one tile of grain is this many pixels wide.
  grain.repeat.set(1 / 300, 1 / 300)
  const ceramic = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xefe9df), roughness: 0.58, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 0.55 }))
  const pocket = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd9d8cf), roughness: 0.7, metalness: 0, normalMap: grain, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 0.4 }))
  const glass = studio(
    new THREE.MeshPhysicalMaterial({
      color: srgb(0xe6ece6),
      roughness: 0.5,
      metalness: 0,
      transmission: 1,
      thickness: 5,
      ior: 1.48,
      attenuationColor: srgb(0xbfd2c4),
      attenuationDistance: 9,
      clearcoat: 0.6,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.0
    })
  )
  const aluminium = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xd3d6d8), roughness: 0.32, metalness: 1, envMapIntensity: 1.25 }))
  const orange = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf0641c), roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.1 }))
  const gap = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x23211f), roughness: 0.85, metalness: 0, envMapIntensity: 0.3 }))
  const ink = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x2a2927), roughness: 0.48, metalness: 0, envMapIntensity: 0.5 }))
  const inkOnOrange = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xfbf6ee), roughness: 0.4, metalness: 0, envMapIntensity: 0.6 }))
  const enamel = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xf7f5f0), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 }))
  const edge = studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x1b1a19), roughness: 0.35, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.0 }))
  for (const m of [ink, inkOnOrange]) {
    m.polygonOffset = true
    m.polygonOffsetFactor = -1
    m.polygonOffsetUnits = -2
  }
  return { ceramic, pocket, glass, aluminium, orange, gap, ink, inkOnOrange, enamel, edge, textures: [grain] }
}

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
