import * as THREE from 'three'
import { fullscreen, Quad, type TargetKind } from './accumulator'

// How much of the gathered mean a page at rest shows once `done` of `of` frames are in it. The rest is the one-sample
// picture the page showed while it moved. The first frames of a mean are far from where it ends, so they weigh little.
export function restShare(done: number, of: number): number {
  if (of <= 1) return 1
  return Math.min(1, Math.max(0, (done - 1) / (of - 1)))
}

const TYPE: Record<TargetKind, THREE.TextureDataType> = { float: THREE.HalfFloatType, half: THREE.HalfFloatType, byte: THREE.UnsignedByteType }

// Holds the picture a page showed as it came to rest and gives the picture to show while the mean is gathered.
export class RestBlend {
  private first: THREE.WebGLRenderTarget | null = null
  private shown: THREE.WebGLRenderTarget | null = null
  private quad = new Quad()
  private copy = fullscreen('uniform sampler2D tFrom;\nvoid main() {\n  outColor = texture( tFrom, vUv );\n}', { tFrom: { value: null } })
  private mix = fullscreen('uniform sampler2D tFirst;\nuniform sampler2D tMean;\nuniform float share;\nvoid main() {\n  outColor = mix( texture( tFirst, vUv ), texture( tMean, vUv ), share );\n}', { tFirst: { value: null }, tMean: { value: null }, share: { value: 1 } })
  private holds = false

  private target(old: THREE.WebGLRenderTarget | null, width: number, height: number, kind: TargetKind): THREE.WebGLRenderTarget {
    if (old && old.width === width && old.height === height) return old
    old?.dispose()
    const t = new THREE.WebGLRenderTarget(width, height, { type: TYPE[kind], format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false })
    t.texture.colorSpace = kind === 'byte' ? THREE.SRGBColorSpace : THREE.NoColorSpace
    return t
  }

  get held(): boolean {
    return this.holds
  }

  drop(): void {
    this.holds = false
  }

  hold(renderer: THREE.WebGLRenderer, picture: THREE.Texture, width: number, height: number, kind: TargetKind): void {
    this.first = this.target(this.first, width, height, kind)
    this.shown = this.target(this.shown, width, height, kind)
    this.copy.uniforms.tFrom!.value = picture
    this.quad.draw(renderer, this.copy, this.first)
    this.holds = true
  }

  blend(renderer: THREE.WebGLRenderer, mean: THREE.Texture, share: number): THREE.Texture {
    if (!this.holds || !this.first || !this.shown) return mean
    if (share >= 1) {
      this.free()
      return mean
    }
    this.mix.uniforms.tFirst!.value = this.first.texture
    this.mix.uniforms.tMean!.value = mean
    this.mix.uniforms.share!.value = share
    this.quad.draw(renderer, this.mix, this.shown)
    return this.shown.texture
  }

  private free(): void {
    this.first?.dispose()
    this.shown?.dispose()
    this.first = null
    this.shown = null
    this.holds = false
  }

  dispose(): void {
    this.free()
    this.copy.dispose()
    this.mix.dispose()
  }
}
