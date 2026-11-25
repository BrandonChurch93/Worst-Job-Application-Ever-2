import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { chainTexels, fullChain, luminance, median, surfaceOf, texelBytes, textureBytes, typeContrasts } from '../src/capture/showcase'
import type { Shape } from '../src/stage/types'

const MB = 1048576
const picture = (width: number, height: number, o: Partial<THREE.Texture> = {}) => Object.assign(new THREE.Texture({ width, height } as unknown as HTMLImageElement), o)

describe('the memory of a texture', () => {
  it('knows the bytes of a texel from its format and type', () => {
    expect(texelBytes(THREE.RGBAFormat, THREE.UnsignedByteType)).toBe(4)
    expect(texelBytes(THREE.RGBAFormat, THREE.HalfFloatType)).toBe(8)
    expect(texelBytes(THREE.RGBAFormat, THREE.FloatType)).toBe(16)
    expect(texelBytes(THREE.RedFormat, THREE.UnsignedByteType)).toBe(1)
    expect(texelBytes(THREE.RGFormat, THREE.HalfFloatType)).toBe(4)
    expect(texelBytes(THREE.DepthFormat, THREE.UnsignedIntType)).toBe(4)
    expect(texelBytes(THREE.DepthStencilFormat, THREE.UnsignedInt248Type)).toBe(4)
  })
  it('adds the chain of smaller copies down to one texel', () => {
    expect(fullChain(4096, 4096)).toBe(13)
    expect(fullChain(1920, 1080)).toBe(11)
    expect(chainTexels(4, 4, 1)).toBe(16)
    expect(chainTexels(4, 4, fullChain(4, 4))).toBe(16 + 4 + 1)
    expect(chainTexels(8, 2, 99)).toBe(16 + 4 + 2 + 1)
  })
  it('counts a 4096 picture with its chain as a third more than its 64 MB', () => {
    const t = picture(4096, 4096)
    expect(t.generateMipmaps).toBe(true)
    expect(textureBytes(t as never) / MB).toBeCloseTo((64 * 4) / 3, 3)
  })
  it('counts no chain for a texture that is read without one', () => {
    expect(textureBytes(picture(4096, 4096, { generateMipmaps: false }) as never) / MB).toBe(64)
    expect(textureBytes(picture(4096, 4096, { minFilter: THREE.LinearFilter }) as never) / MB).toBe(64)
  })
  it('counts a floating point target of the hd picture at its true size', () => {
    const target = new THREE.WebGLRenderTarget(1920, 1080, { type: THREE.FloatType, format: THREE.RGBAFormat })
    expect(textureBytes(target.texture as never)).toBe(1920 * 1080 * 16)
    target.dispose()
  })
  it('counts six faces for a cube and the layers of a data array', () => {
    const face = { width: 256, height: 256 }
    const cube = new THREE.CubeTexture([face, face, face, face, face, face] as never)
    cube.generateMipmaps = false
    expect(textureBytes(cube as never)).toBe(6 * 256 * 256 * 4)
    const layers = new THREE.DataArrayTexture(new Uint8Array(16 * 16 * 5 * 4), 16, 16, 5)
    expect(textureBytes(layers as never)).toBe(16 * 16 * 5 * 4)
  })
  it('counts a compressed texture by the bytes it was given, and nothing for a texture with no picture', () => {
    const c = new THREE.CompressedTexture([{ data: new Uint8Array(1000), width: 64, height: 64 }, { data: new Uint8Array(250), width: 32, height: 32 }] as never, 64, 64)
    expect(textureBytes(c as never)).toBe(1250)
    expect(textureBytes(new THREE.Texture() as never)).toBe(0)
  })
})

describe('the colour a material really has', () => {
  it('weighs linear colour as the measure of contrast does', () => {
    expect(luminance([1, 1, 1])).toBeCloseTo(1, 6)
    expect(luminance([0, 1, 0])).toBeCloseTo(0.7152, 6)
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
  it('reads the colour, the colour picture at the place, and what the material gives off', () => {
    const plain = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.25, 0.125) })
    expect(surfaceOf(plain)!.colour).toEqual([0.5, 0.25, 0.125])
    const map = new THREE.DataTexture(Uint8Array.from([255, 255, 255, 255, 0, 0, 0, 255]), 2, 1)
    const mapped = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.5, 0.5), map })
    expect(surfaceOf(mapped, new THREE.Vector2(0.25, 0.5))!.colour).toEqual([0.5, 0.5, 0.5])
    expect(surfaceOf(mapped, new THREE.Vector2(0.75, 0.5))!.colour).toEqual([0, 0, 0])
    const lit = new THREE.MeshStandardMaterial({ color: new THREE.Color(0, 0, 0), emissive: new THREE.Color(0.2, 0.2, 0.2), emissiveIntensity: 2 })
    expect(surfaceOf(lit)!.colour[0]).toBeCloseTo(0.4, 6)
  })
  it('knows how much shows through a clear or a faded material', () => {
    expect(surfaceOf(new THREE.MeshStandardMaterial())!.through).toBe(0)
    expect(surfaceOf(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.25 }))!.through).toBe(0.75)
    const glass = surfaceOf(new THREE.MeshPhysicalMaterial({ transmission: 0.9 }))!
    expect(glass.through).toBeCloseTo(0.9, 6)
    expect(glass.tint).toBe(true)
  })
})

describe('the contrast of a run of type', () => {
  const grey = (v: number) => new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v) })
  const run = (o: Partial<Shape> = {}): Shape => ({ id: 'label', kind: 'text', words: 'copy:a', x: 900, y: 520, w: 120, h: 40, z0: 0, z1: 2, tone: 'ink', ...o }) as unknown as Shape
  const flat = (w: number, h: number, z: number, material: THREE.Material, data: Record<string, unknown> = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
    m.position.set(0, 0, z)
    Object.assign(m.userData, data)
    return m
  }
  const scene = (...meshes: THREE.Mesh[]) => {
    const s = new THREE.Scene()
    for (const m of meshes) s.add(m)
    return s
  }
  const wcag = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  it('is the colour of the type against the colour of what lies under it', () => {
    const got = typeContrasts(scene(flat(2000, 2000, 0, grey(0.8)), flat(120, 40, 2, grey(0.02), { type: 'copy:a', shape: 'label' })), [run()]).get('label')!
    expect(got.ink).toBeCloseTo(0.02, 6)
    expect(got.ground).toBeCloseTo(0.8, 6)
    expect(got.contrast).toBeCloseTo(wcag(0.02, 0.8), 6)
  })
  it('changes when the material under the type changes, which the tones never did', () => {
    const dark = typeContrasts(scene(flat(2000, 2000, 0, grey(0.03)), flat(120, 40, 2, grey(0.02), { type: 'copy:a', shape: 'label' })), [run()]).get('label')!
    expect(dark.contrast).toBeLessThan(1.2)
  })
  it('takes the highest surface under the type, and looks through one that is clear', () => {
    const type = () => flat(120, 40, 6, grey(0.02), { type: 'copy:a', shape: 'label' })
    const solid = typeContrasts(scene(flat(2000, 2000, 0, grey(0.8)), flat(300, 300, 4, grey(0.2)), type()), [run({ z1: 6 })]).get('label')!
    expect(solid.ground).toBeCloseTo(0.2, 6)
    const faded = typeContrasts(scene(flat(2000, 2000, 0, grey(0.8)), flat(300, 300, 4, new THREE.MeshStandardMaterial({ color: new THREE.Color(0.2, 0.2, 0.2), transparent: true, opacity: 0.5 })), type()), [run({ z1: 6 })]).get('label')!
    expect(faded.ground).toBeCloseTo(0.5 * 0.2 + 0.5 * 0.8, 6)
  })
  it('does not take other type or the cursor for the ground', () => {
    const got = typeContrasts(scene(flat(2000, 2000, 0, grey(0.8)), flat(300, 300, 1, grey(0.5), { standIn: 'cursor-body' }), flat(300, 300, 1.5, grey(0.4), { type: 'copy:b' }), flat(120, 40, 2, grey(0.02), { type: 'copy:a', shape: 'label' })), [run()]).get('label')!
    expect(got.ground).toBeCloseTo(0.8, 6)
  })
  it('gives nothing for a run the scene holds no mesh for, or one that lies over nothing', () => {
    expect(typeContrasts(scene(flat(2000, 2000, 0, grey(0.8))), [run()]).size).toBe(0)
    expect(typeContrasts(scene(flat(120, 40, 2, grey(0.02), { type: 'copy:a', shape: 'label' })), [run()]).size).toBe(0)
  })
})
