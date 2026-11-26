import * as THREE from 'three'
import type { PartMaker, RealContext } from '../../../../real/types'
import { table } from '../../../layout'
import { colours, levels } from '../../lights'
import { whole, type Zone } from '../../zone'
import { bank } from './bank'
import { firehouse, type Firehouse } from './firehouse'
import { garage } from './garage'
import { Geo, buckets, type Buckets, type V3 } from './geo'
import { houses } from './houses'
import { beaconLens, beaconReflector } from './kit'
import { glowOf, lensOf, metalOf, paintOf } from './mats'
import { HATCH, moms, type Moms } from './moms'
import { police } from './police'
import { roadSign, streetThings } from './things'

const VERSION = 'street-models-25'

// Everything the seven parts are built from in one zone, made once and shared: each part keeps the meshes that are its own.
interface Street {
  b: Buckets
  fire: Firehouse
  police: { beacon: V3 }
  moms: Moms
  signs: { geo: Geo; side: string }[]
  paint: THREE.MeshPhysicalMaterial
  metal: THREE.MeshPhysicalMaterial
}

const made = new Map<string, { key: string; street: Street }>()

function streetOf(z: Zone, ctx: RealContext): Street {
  const key = table.models.filter((m) => m.tier === z.tier && m.sign).map((m) => {
    const s = ctx.byId.get(`sign.${m.id}`)
    return s ? `${s.x},${s.y},${s.w},${s.h},${s.z0}` : ''
  }).join('|')
  const hit = made.get(z.id)
  if (hit && hit.key === key) return hit.street
  const b = buckets()
  const fire = firehouse(b, z, ctx)
  const pol = police(b, z, ctx)
  bank(b, z, ctx)
  garage(b, z)
  houses(b, z)
  const mom = moms(b, z, ctx)
  streetThings(b, z)
  const signs = table.slings.filter((s) => s.tier === z.tier).map((s) => ({ geo: roadSign(z, s).geo, side: s.side }))
  const street: Street = { b, fire, police: pol, moms: mom, signs, paint: paintOf(z), metal: metalOf(z) }
  made.set(z.id, { key, street })
  return street
}

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, name: string, o: { cast?: boolean; receive?: boolean } = {}): THREE.Mesh => {
  const out = new THREE.Mesh(g, m)
  out.name = name
  out.castShadow = o.cast ?? false
  out.receiveShadow = o.receive ?? true
  return out
}

const group = (z: Zone, name: string): string => `${z.id}.${name}`

interface Kept { [k: string]: THREE.Object3D | THREE.Material | number | V3 | undefined }
const kept = new WeakMap<THREE.Object3D, Kept>()

const stateOf = (ctx: RealContext, id: string): number[] => ctx.byId.get(id)?.v ?? []
const ease = (t: number): number => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

// How far the firehouse door is raised, 0 shut to 1 fully up, and how hard it rattles in its tracks. It stands raised at rest with its foot in the head of the opening, runs right up as a ball is caught, stays up while the ball is held and fired out, then comes down again.
export function doorOf(v: number[]): { raise: number; shake: number } {
  const held = (v[0] ?? 0) > 0.5
  const sinceIn = v[1] ?? 9
  const sinceOut = v[2] ?? 9
  const rest = 0.86
  const up = 0.95
  if (held) {
    const t = sinceIn
    if (t < 0.18) return { raise: rest + (up - rest) * ease(t / 0.18), shake: 0 }
    const u = t - 0.18
    return { raise: up - 0.035 * Math.exp(-u * 12) * Math.abs(Math.sin(u * 34)), shake: Math.exp(-u * 14) * 0.5 }
  }
  if (sinceOut >= 8.9) return { raise: rest, shake: 0 }
  const t = sinceOut
  if (t < 1.4) return { raise: up, shake: Math.exp(-t * 7) }
  return { raise: up + (rest - up) * ease((t - 1.4) / 1.2), shake: 0 }
}

// How far the cellar doors stand open, 0 shut to 1, and how bright the cellar is.
export function hatchOf(v: number[]): { open: number; light: number } {
  const held = (v[0] ?? 0) > 0.5
  const sinceIn = v[1] ?? 9
  const sinceOut = v[2] ?? 9
  const live = (v[3] ?? 0) > 0.5
  if (held) {
    const t = sinceIn
    if (t < 0.12) return { open: 1 - ease(t / 0.12), light: 1 - ease(t / 0.12) }
    const u = t - 0.12
    return { open: 0.06 * Math.exp(-u * 15) * Math.abs(Math.sin(u * 36)), light: 0 }
  }
  if (sinceOut < 8.9) {
    const t = sinceOut
    if (t < 0.1) return { open: 1.06 * ease(t / 0.1), light: ease(t / 0.1) }
    if (live) return { open: 1 + 0.06 * Math.exp(-(t - 0.1) * 8) * Math.cos((t - 0.1) * 26), light: 1 }
    if (t < 0.8) return { open: 1 + 0.06 * Math.exp(-(t - 0.1) * 8) * Math.cos((t - 0.1) * 26), light: 1 }
    const u = t - 0.8
    if (u < 0.22) return { open: 1 - ease(u / 0.22), light: 1 - ease(u / 0.22) }
    return { open: 0.05 * Math.exp(-(u - 0.22) * 15) * Math.abs(Math.sin((u - 0.22) * 36)), light: 0 }
  }
  return live ? { open: 1, light: 1 } : { open: 0, light: 0 }
}

const m4 = new THREE.Matrix4()
const m4b = new THREE.Matrix4()

// What a build made is its own: every geometry is let go with it. Materials are shared by the zone and stay.
const drop = (o: THREE.Object3D): void => {
  o.traverse((x) => {
    const g = (x as THREE.Mesh).geometry
    if (g) g.dispose()
  })
  kept.delete(o)
}

const fire = whole('model-firehouse', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    o.add(mesh(s.b.paint.done(), s.paint, `street.models.paint.${z.id}`, { cast: true }))
    const door = mesh(s.fire.door.done(), s.paint, `street.firehouse.door.${z.id}`)
    door.position.set(s.fire.doorAt[0], s.fire.doorAt[1], s.fire.doorAt[2])
    o.add(door)
    const lens = lensOf(z, 'red', colours.STREET_RED)
    const glow = glowOf(z, 'red', colours.STREET_RED)
    const dome = mesh(beaconLens(), lens, `street.firehouse.beacon.${z.id}`, { receive: false })
    dome.position.set(s.fire.beacon[0], s.fire.beacon[1], s.fire.beacon[2])
    dome.userData.lightGroup = group(z, 'red')
    const turn = mesh(beaconReflector(), glow, `street.firehouse.reflector.${z.id}`, { receive: false })
    turn.position.copy(dome.position)
    turn.userData.lightGroup = group(z, 'red')
    const bay = mesh(s.fire.bay.done(), glow, `street.firehouse.bay.${z.id}`, { receive: false })
    bay.userData.lightGroup = group(z, 'red')
    o.add(bay, turn, dome)
    kept.set(o, { door, lens, glow, turn, x0: s.fire.doorAt[0], z0: s.fire.doorAt[2], travel: s.fire.travel })
    return o
  },
  pose(o, z, ctx) {
    const k = kept.get(o)
    if (!k) return
    const d = doorOf(stateOf(ctx, 'model.street.firehouse'))
    const door = k.door as THREE.Mesh
    door.position.z = (k.z0 as number) + d.raise * (k.travel as number) + Math.abs(Math.sin(ctx.time * 53)) * 0.8 * d.shake
    door.position.x = (k.x0 as number) + Math.sin(ctx.time * 71) * 0.7 * d.shake
    const red = levels(ctx, z).byName.red ?? 0
    ;(k.lens as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.35 + 1.5 * red
    ;(k.glow as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 3 * red
    ;(k.turn as THREE.Mesh).rotation.z = red > 0.6 ? ctx.time * 8.5 : 0.6
  }
})

const cops = whole('model-police', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    const lens = lensOf(z, 'blue', colours.STREET_BLUE)
    const glow = glowOf(z, 'blue', colours.STREET_BLUE)
    const dome = mesh(beaconLens(), lens, `street.police.beacon.${z.id}`, { receive: false })
    dome.position.set(s.police.beacon[0], s.police.beacon[1], s.police.beacon[2])
    dome.userData.lightGroup = group(z, 'blue')
    const turn = mesh(beaconReflector(), glow, `street.police.reflector.${z.id}`, { receive: false })
    turn.position.copy(dome.position)
    turn.userData.lightGroup = group(z, 'blue')
    o.add(turn, dome)
    kept.set(o, { lens, glow, turn })
    return o
  },
  pose(o, z, ctx) {
    const k = kept.get(o)
    if (!k) return
    const blue = levels(ctx, z).byName.blue ?? 0
    ;(k.lens as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.35 + 1.5 * blue
    ;(k.glow as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 3 * blue
    ;(k.turn as THREE.Mesh).rotation.z = blue > 0.6 ? -ctx.time * 8.5 : 2.2
  }
})

const banks = whole('model-bank', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    o.add(mesh(s.b.metal.done(), s.metal, `street.models.metal.${z.id}`))
    return o
  }
})

const park = whole('model-garage', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    const glow = glowOf(z, 'windows', colours.STREET_WINDOW)
    const lit = mesh(s.b.glow.done(), glow, `street.models.glow.${z.id}`, { receive: false })
    lit.userData.lightGroup = group(z, 'windows')
    o.add(lit)
    kept.set(o, { glow })
    return o
  },
  pose(o, z, ctx) {
    const k = kept.get(o)
    if (!k) return
    ;(k.glow as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 1.05 * (levels(ctx, z).byName.windows ?? 0)
  }
})

const homes = whole('model-houses', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    const head = new Geo()
    head.lathe([[1, 0], [1, 0.45], [0.72, 0.8], [0, 0.9]], 0, 0, 10, [0.72, 0.74, 0.77])
    head.box(-0.78, 0.78, -0.13, 0.13, 0.86, 0.93, [0.12, 0.12, 0.13], { skip: 'lrfb' })
    const screws = new THREE.InstancedMesh(head.done(), s.metal, s.b.screws.length)
    screws.name = `street.models.screws.${z.id}`
    screws.userData.fine = true
    screws.receiveShadow = true
    s.b.screws.forEach((q, i) => {
      m4.makeRotationZ(i * 2.399).scale(new THREE.Vector3(q[3], q[3], q[3])).setPosition(q[0], q[1], q[2])
      screws.setMatrixAt(i, m4)
    })
    screws.instanceMatrix.needsUpdate = true
    screws.computeBoundingSphere()
    o.add(screws)
    return o
  }
})

const hatchMatrix = (out: THREE.Matrix4, hinge: V3, tilt: number, side: number, open: number): THREE.Matrix4 => {
  out.makeRotationX(-tilt)
  if (side > 0) out.multiply(m4b.makeRotationZ(Math.PI))
  out.multiply(m4b.makeRotationY(-open * HATCH.open))
  return out.setPosition(hinge[0], hinge[1], hinge[2])
}

const mother = whole('model-moms', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    const doors = new THREE.InstancedMesh(s.moms.door.done(), s.paint, 2)
    doors.name = `street.mom.hatch.${z.id}`
    doors.castShadow = true
    doors.receiveShadow = true
    doors.frustumCulled = false
    const glow = glowOf(z, 'cellar', colours.STREET_WINDOW)
    const light = mesh(s.moms.light.done(), glow, `street.mom.cellar.${z.id}`, { receive: false })
    light.userData.lightGroup = group(z, 'windows')
    o.add(light, doors)
    kept.set(o, { doors, glow, tilt: s.moms.tilt, left: s.moms.hinge[0], right: s.moms.hinge[1] })
    return o
  },
  pose(o, z, ctx) {
    const k = kept.get(o)
    if (!k) return
    const h = hatchOf(stateOf(ctx, 'model.street.mom'))
    const doors = k.doors as THREE.InstancedMesh
    doors.setMatrixAt(0, hatchMatrix(m4, k.left as V3, k.tilt as number, -1, h.open))
    doors.setMatrixAt(1, hatchMatrix(m4, k.right as V3, k.tilt as number, 1, h.open))
    doors.instanceMatrix.needsUpdate = true
    ;(k.glow as THREE.MeshStandardMaterial).emissiveIntensity = 2.6 * h.light * (0.35 + 0.65 * (levels(ctx, z).byName.windows ?? 0))
  }
})

const signs = whole('model-road-signs', {
  version: VERSION,
  drop,
  build(z, ctx) {
    const s = streetOf(z, ctx)
    const o = new THREE.Group()
    for (const sign of s.signs) {
      const plate = mesh(sign.geo.done(), s.paint, `street.sign.${sign.side}.${z.id}`, { cast: true })
      plate.userData.side = sign.side
      o.add(plate)
    }
    return o
  },
  pose(o, _z, ctx) {
    for (const plate of o.children) {
      let since = 9
      for (let n = 1; n <= 3; n++) since = Math.min(since, stateOf(ctx, `sling.street.sling.${plate.userData.side as string}.${n}`)[0] ?? 9)
      plate.position.z = since < 0.5 ? 2.4 * Math.exp(-since * 16) * Math.abs(Math.cos(since * 44)) : 0
    }
  }
})

export const parts: Record<string, PartMaker | null> = { 'model-firehouse': fire, 'model-police': cops, 'model-bank': banks, 'model-garage': park, 'model-houses': homes, 'model-moms': mother, 'model-road-signs': signs }
