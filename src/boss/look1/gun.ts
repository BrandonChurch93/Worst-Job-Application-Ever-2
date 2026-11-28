import * as THREE from 'three'
import { GUN } from './numbers'
import { across, along, boxAt, discAt, glowMaterial, joined, lookKit, mesh, setGlow, turnedAt } from './kit'

// The rotary gun of look 1: six barrels on a domed mount. The boss carries two; the arena's corners carry the same gun.
// Units are those of the target sheets; scale the root by K (pose.ts) to stand it on the page at the boss's size.
// The root's origin is the foot of the mount, z up; the gun aims along +x; turn `turret` about z to aim.

export interface Gun {
  root: THREE.Group
  // Everything that turns to aim: the cradle, the receiver and the barrels.
  turret: THREE.Group
  barrels: THREE.Group
  lamp: THREE.MeshBasicMaterial
  flash: THREE.Mesh
  dispose(): void
}

export interface GunState { yaw: number; spin: number; recoil: number; lamp: number; flash: number }

let cache: Record<string, THREE.BufferGeometry> | null = null

function parts(): Record<string, THREE.BufferGeometry> {
  if (cache) return cache
  const a = GUN.axis
  const mount = joined([
    turnedAt([[0, 0], [60, 0], [60, 4], [56, 8], [50, 8], [47, 11], [44, 18], [36, 26], [24, 31], [0, 33]], 0, 0, 0, 36),
    turnedAt([[0, 0], [20, 0], [20, 6], [0, 6]], 0, 0, 32, 20)
  ])
  const cradle = joined([
    boxAt(-34, 27, 14, 40, 36, a + 10, 3), boxAt(-34, -36, 14, 40, -27, a + 10, 3),
    boxAt(-30, -30, 26, 30, 30, 34, 2.5),
    across(13, 38, 2, 16).translate(0, 0, a)
  ])
  const receiver = joined([
    along([[0, -70], [18, -70], [24, -64], [26, -58], [26, 30], [30, 34], [30, 44], [24, 48], [0, 48]], 22).translate(0, 0, a),
    boxAt(-52, -15, a + 20, 14, 15, a + 31, 3),
    turnedAt([[0, 0], [19, 0], [21, 3], [21, 30], [18, 34], [0, 34]], -24, -46, 12, 18),
    boxAt(-36, -40, a - 8, -12, -24, a + 8, 2)
  ])
  const dark = joined([
    along([[26.4, -50], [28, -48], [28, -40], [26.4, -38]], 22).translate(0, 0, a),
    along([[26.4, -6], [28, -4], [28, 4], [26.4, 6]], 22).translate(0, 0, a),
    boxAt(-44, -9, a + 30.6, 6, 9, a + 32.6, 0.6)
  ])
  const tubes: THREE.BufferGeometry[] = [along([[0, 44], [7, 44], [7, GUN.reach - 20], [0, GUN.reach - 20]], 10)]
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * Math.PI * 2
    tubes.push(along([[3.4, 46], [6.2, 46], [6.2, GUN.reach], [3.4, GUN.reach]], 9).translate(0, Math.cos(an) * 15, Math.sin(an) * 15))
  }
  const clamps = joined([
    along([[5, 52], [24, 52], [24, 62], [5, 62]], 22),
    along([[5, 112], [23, 112], [23, 120], [5, 120]], 22),
    along([[5, GUN.reach - 22], [23, GUN.reach - 22], [24.5, GUN.reach - 19], [24.5, GUN.reach - 10], [23, GUN.reach - 7], [5, GUN.reach - 7]], 22)
  ])
  const flash = joined([along([[0, 0], [18, 8], [34, 46], [16, 120], [0, 165]], 12), along([[0, -4], [50, 10], [0, 26]], 12)])
  cache = { mount, cradle, receiver, dark, tubes: joined(tubes), clamps, flash, lamp: discAt(6, -34, 0, a + 31, a + 34.5, 0.8, 14) }
  return cache
}

export function makeGun(): Gun {
  const kit = lookKit()
  const g = parts()
  const root = new THREE.Group()
  root.name = 'look1-gun'
  const turret = new THREE.Group()
  const barrels = new THREE.Group()
  barrels.position.z = GUN.axis
  barrels.add(mesh(g.tubes!, kit.joint), mesh(g.clamps!, kit.dark))
  const lamp = glowMaterial(0xff5a14, 0.2)
  const flashMat = glowMaterial(0xffb060, 5)
  const flash = mesh(g.flash!, flashMat, false, false)
  flash.position.set(GUN.reach, 0, GUN.axis)
  flash.visible = false
  turret.add(mesh(g.cradle!, kit.limb), mesh(g.receiver!, kit.gunBody), mesh(g.dark!, kit.bed), barrels, flash, mesh(g.lamp!, lamp, false, false))
  root.add(mesh(g.mount!, kit.gunBase), turret)
  return { root, turret, barrels, lamp, flash, dispose: () => { lamp.dispose(); flashMat.dispose() } }
}

export function poseGun(g: Gun, s: GunState): void {
  g.turret.rotation.z = s.yaw
  g.barrels.position.x = -s.recoil
  g.barrels.rotation.x = s.spin
  setGlow(g.lamp, s.lamp)
  g.flash.visible = s.flash > 0
  g.flash.scale.setScalar(0.6 + 0.6 * s.flash)
}
