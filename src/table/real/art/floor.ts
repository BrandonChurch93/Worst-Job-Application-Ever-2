import * as THREE from 'three'

const seen = new THREE.Frustum()
const view = new THREE.Matrix4()
const stood = new THREE.Box3()

// A floor is far wider than it is deep, so the sphere round it reaches into the tiers beside it. The renderer asks this before it draws: the floor is shown when its own rectangle is in the camera's view.
export class Floor extends THREE.LOD {
  private readonly flat: THREE.Box3

  constructor(w: number, h: number, top: number) {
    super()
    this.flat = new THREE.Box3(new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, h / 2, top))
  }

  override update(camera: THREE.Camera): void {
    seen.setFromProjectionMatrix(view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
    const inView = seen.intersectsBox(stood.copy(this.flat).applyMatrix4(this.matrixWorld))
    for (const c of this.children) c.visible = inView
  }
}
