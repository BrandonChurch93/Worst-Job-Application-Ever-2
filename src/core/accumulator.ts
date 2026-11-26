import * as THREE from 'three'

export type TargetKind = 'float' | 'half' | 'byte'

const quadVertex = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4( position.xy, 0.0, 1.0 );
}`

export function fullscreen(fragmentShader: string, uniforms: Record<string, THREE.IUniform>): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: 'in vec3 position;\nin vec2 uv;\n' + quadVertex,
    fragmentShader: 'precision highp float;\nprecision highp int;\nprecision highp sampler2D;\nin vec2 vUv;\nout vec4 outColor;\n' + fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false
  })
}

export class Quad {
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))

  constructor() {
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  draw(renderer: THREE.WebGLRenderer, material: THREE.Material, target: THREE.WebGLRenderTarget | null): void {
    this.mesh.material = material
    renderer.setRenderTarget(target)
    renderer.render(this.scene, this.camera)
  }
}

// Which kind of target this machine can draw into. Float first, then half float, then eight bits.
export function targetKind(renderer: THREE.WebGLRenderer): TargetKind {
  if (renderer.extensions.has('EXT_color_buffer_float')) return 'float'
  if (renderer.extensions.has('EXT_color_buffer_half_float')) return 'half'
  return 'byte'
}

function makeTarget(w: number, h: number, type: THREE.TextureDataType, depth: boolean, multisamples = 0): THREE.WebGLRenderTarget {
  const t = new THREE.WebGLRenderTarget(w, h, { type, format: THREE.RGBAFormat, depthBuffer: depth, stencilBuffer: false, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps: false, samples: multisamples })
  t.texture.colorSpace = type === THREE.UnsignedByteType ? THREE.SRGBColorSpace : THREE.NoColorSpace
  return t
}

// Keeps the running mean of the samples of one picture, in linear light.
export class Accumulator {
  readonly kind: TargetKind
  private plain: THREE.WebGLRenderTarget
  private deep: THREE.WebGLRenderTarget | null = null
  private deepOn = false
  private sampleType: THREE.TextureDataType
  private means: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]
  private stats: THREE.WebGLRenderTarget
  private current = 0
  private count = 0
  private mean: THREE.RawShaderMaterial
  private count_: THREE.RawShaderMaterial
  private quad = new Quad()
  width: number
  height: number

  constructor(private renderer: THREE.WebGLRenderer, width: number, height: number, forced?: TargetKind, private multisamples = 0) {
    this.kind = forced ?? targetKind(renderer)
    this.width = width
    this.height = height
    const sampleType = this.kind === 'byte' ? THREE.UnsignedByteType : THREE.HalfFloatType
    const meanType = this.kind === 'float' ? THREE.FloatType : sampleType
    this.sampleType = sampleType
    this.plain = makeTarget(width, height, sampleType, true, multisamples)
    this.means = [makeTarget(width, height, meanType, false), makeTarget(width, height, meanType, false)]
    this.stats = makeTarget(64, 36, this.kind === 'byte' ? THREE.UnsignedByteType : meanType, false)
    this.stats.texture.colorSpace = THREE.NoColorSpace
    this.mean = fullscreen(
      /* glsl */ `
uniform sampler2D tSample;
uniform sampler2D tMean;
uniform float weight;
void main() {
  outColor = mix( texture( tMean, vUv ), texture( tSample, vUv ), weight );
}`,
      { tSample: { value: null }, tMean: { value: null }, weight: { value: 1 } }
    )
    this.count_ = fullscreen(
      /* glsl */ `
uniform sampler2D tMean;
uniform ivec2 block;
void main() {
  ivec2 base = ivec2( gl_FragCoord.xy ) * block;
  float bad = 0.0;
  for ( int y = 0; y < block.y; y ++ ) {
    for ( int x = 0; x < block.x; x ++ ) {
      vec3 c = texelFetch( tMean, base + ivec2( x, y ), 0 ).rgb;
      bool wrong = any( isnan( c ) ) || any( isinf( c ) ) || any( lessThan( c, vec3( -0.001 ) ) );
      bad += wrong ? 1.0 : 0.0;
    }
  }
  outColor = vec4( bad, 0.0, 0.0, 1.0 );
}`,
      { tMean: { value: null }, block: { value: new THREE.Vector2(1, 1) } }
    )
  }

  // The target a sample is drawn into.
  get sample(): THREE.WebGLRenderTarget {
    return this.deepOn && this.deep ? this.deep : this.plain
  }

  // A picture seen through a lens keeps how far away each pixel of its last sample is. Every other picture is drawn as before.
  keepDepth(on: boolean): void {
    if (on && !this.deep) {
      this.deep = makeTarget(this.width, this.height, this.sampleType, true, this.multisamples)
      const d = new THREE.DepthTexture(this.width, this.height)
      d.minFilter = THREE.NearestFilter
      d.magFilter = THREE.NearestFilter
      this.deep.depthTexture = d
    }
    this.deepOn = on
  }

  get depth(): THREE.DepthTexture | null {
    return this.deepOn && this.deep ? this.deep.depthTexture : null
  }

  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.plain.setSize(width, height)
    this.deep?.setSize(width, height)
    this.means[0].setSize(width, height)
    this.means[1].setSize(width, height)
  }

  begin(): void {
    this.count = 0
  }

  // Folds the sample just drawn into the mean.
  add(): void {
    const from = this.means[this.current]
    const to = this.means[1 - this.current]
    this.mean.uniforms.tSample!.value = this.sample.texture
    this.mean.uniforms.tMean!.value = from.texture
    this.mean.uniforms.weight!.value = 1 / (this.count + 1)
    this.quad.draw(this.renderer, this.mean, to)
    this.current = 1 - this.current
    this.count++
  }

  get samples(): number {
    return this.count
  }

  get texture(): THREE.Texture {
    return this.means[this.current].texture
  }

  // Counts the pixels of the mean that hold no number, an endless one or a negative one.
  invalidValues(): number {
    if (this.kind === 'byte') return 0
    const bx = Math.ceil(this.width / 64)
    const by = Math.ceil(this.height / 36)
    this.count_.uniforms.tMean!.value = this.texture
    ;(this.count_.uniforms.block!.value as THREE.Vector2).set(bx, by)
    this.quad.draw(this.renderer, this.count_, this.stats)
    const total = 64 * 36
    let bad = 0
    if (this.kind === 'float') {
      const buf = new Float32Array(total * 4)
      this.renderer.readRenderTargetPixels(this.stats, 0, 0, 64, 36, buf)
      for (let i = 0; i < total; i++) bad += buf[i * 4]!
    } else {
      const buf = new Uint16Array(total * 4)
      this.renderer.readRenderTargetPixels(this.stats, 0, 0, 64, 36, buf)
      for (let i = 0; i < total; i++) bad += THREE.DataUtils.fromHalfFloat(buf[i * 4]!)
    }
    this.renderer.setRenderTarget(null)
    return Math.round(bad)
  }

  dispose(): void {
    this.plain.dispose()
    this.deep?.depthTexture?.dispose()
    this.deep?.dispose()
    this.means[0].dispose()
    this.means[1].dispose()
    this.stats.dispose()
    this.mean.dispose()
    this.count_.dispose()
  }
}
