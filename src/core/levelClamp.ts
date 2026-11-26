import * as THREE from 'three'
import { fullscreen, Quad } from './accumulator'

// The most one sample of a live frame may hold. The largest finite number of a half float is 65504.
export const SAMPLE_MOST = 60000

function bound(equation: THREE.BlendingEquation, value: number): THREE.RawShaderMaterial {
  const m = fullscreen('uniform float value;\nvoid main() {\n  outColor = vec4( value );\n}', { value: { value } })
  m.blending = THREE.CustomBlending
  m.blendEquation = equation
  m.blendSrc = THREE.OneFactor
  m.blendDst = THREE.OneFactor
  return m
}

// Bounds every sample of a multisampled target where it lies, before the samples of a pixel are resolved into one:
// one sample below zero or without end would otherwise spoil the whole pixel.
export class SampleBounds {
  private quad = new Quad()
  private floor = bound(THREE.MaxEquation, 0)
  private roof = bound(THREE.MinEquation, SAMPLE_MOST)

  apply(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget): void {
    const auto = renderer.autoClear
    renderer.autoClear = false
    this.quad.draw(renderer, this.floor, target)
    this.quad.draw(renderer, this.roof, target)
    renderer.autoClear = auto
  }

  dispose(): void {
    this.floor.dispose()
    this.roof.dispose()
  }
}
