// A sheet of the cursor's body and effects that sweeps each number of the contract. It drives the model directly, outside the site.
import * as THREE from 'three'
import { Engine, LightRig } from '../../src/core/renderer'
import { look as pictureLook } from '../../src/post/look'
import { studioEnvironment } from '../../src/post/studio'
import { materials } from '../../src/shell/materials'
import { restLook, type BodyLook, type EffectsLook } from '../../src/cursor/contract'
import { makeBody } from '../../src/cursor/model/body'
import { makeEffects } from '../../src/cursor/model/effects'
import { SETS } from './cursor-model-sets'

const q = new URLSearchParams(location.search)
const set = SETS[q.get('set') ?? 'body'] ?? SETS.body!
const cols = Number(q.get('cols') ?? set.cols)
const samples = Number(q.get('samples') ?? 8)
const time = Number(q.get('time') ?? 0.7)
const pitchX = Number(q.get('pitch') ?? set.pitch ?? 120)
const pitchY = pitchX * (set.tall ?? 1.05)
const rows = Math.ceil(set.cells.length / cols)
const canvas = document.getElementById('stage') as HTMLCanvasElement
const W = 1920
const H = 1080
const engine = new Engine(canvas, W, H, { preserve: true })
const scene = new THREE.Scene()
scene.environment = studioEnvironment(engine.renderer)
scene.environmentIntensity = pictureLook.envIntensity
const rig = new LightRig()
rig.addTo(scene)
const wide = Math.max(cols * pitchX, (rows * pitchY * W) / H)
rig.setBounds({ minX: -wide / 2 - 40, maxX: wide / 2 + 40, minY: (-wide * H) / W / 2 - 40, maxY: (wide * H) / W / 2 + 40, minZ: -20, maxZ: 160 })
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), materials().ceramic)
ground.receiveShadow = true
scene.add(ground)
const fov = 12
const camera = new THREE.PerspectiveCamera(fov, W / H, 10, 20000)
const dist = wide / 2 / Math.tan((fov * Math.PI) / 360) / (W / H)
camera.position.set(0, 0, dist)
camera.lookAt(0, 0, 0)
const made: { apply: () => void }[] = []
set.cells.forEach((cell, i) => {
  const cx = ((i % cols) - (cols - 1) / 2) * pitchX - 22
  const cy = ((rows - 1) / 2 - Math.floor(i / cols)) * pitchY + 34
  const at = new THREE.Group()
  at.position.set(cx, cy, cell.z ?? 4)
  scene.add(at)
  const body = makeBody ? makeBody() : null
  const effects = makeEffects ? makeEffects() : null
  if (body) at.add(body.root)
  if (effects) at.add(effects.root)
  const turn = cell.turn ?? 0
  made.push({
    apply: () => {
      const t = cell.time ?? time
      const look = restLook(t)
      Object.assign(look.body, cell.body ?? {}, { time: t } as Partial<BodyLook>)
      Object.assign(look.effects, cell.effects ?? {}, { time: t } as Partial<EffectsLook>)
      if (body) {
        body.root.rotation.z = turn
        body.apply(look.body)
      }
      if (effects && body) effects.apply(look.effects, body, turn)
    }
  })
})
const run = async (): Promise<void> => {
  for (const m of made) m.apply()
  await engine.picture({ scene, camera, rig }, { samples, frame: 0, diagnostic: 'beauty' })
  ;(window as unknown as { sweep: unknown }).sweep = { done: true, counts: engine.lastCounts, cells: set.cells.map((c) => c.name) }
}
void run()
