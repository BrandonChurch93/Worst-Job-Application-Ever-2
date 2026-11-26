import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { block } from '../../../shell/metrics'
import { controls } from '../../../shell/real/controls'
import { setRun, type Style } from '../../../shell/real/type'
import { outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import { words } from '../../../shell/words'
import type { Shape } from '../../../stage/types'

const q = (v: number): number => Math.round(v * 4) / 4
const WHITE: [number, number, number] = [1, 1, 1]
const LIT: Style = { setting: 'flat', fill: WHITE, lean: 0, rings: [{ d: 0.5, a: 0.8, c: WHITE }] }
const BEZEL = { wide: 6, sunk: 1.6 }
const LAMP = { colour: [2.3, 0.86, 0.2] as [number, number, number], halo: 0.16, reach: 420, power: 0.5 }

let faceMade: THREE.MeshPhysicalMaterial | null = null
let lampMade: THREE.MeshBasicMaterial | null = null
let haloMade: THREE.MeshBasicMaterial | null = null

function face(): THREE.MeshPhysicalMaterial {
  faceMade ??= studio(new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHex(0x14171a, THREE.SRGBColorSpace), roughness: 0.3, metalness: 0, specularIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.04 }))
  faceMade.name = 'wait-display'
  return faceMade
}

function lamp(): THREE.MeshBasicMaterial {
  if (!lampMade) {
    lampMade = new THREE.MeshBasicMaterial({ color: new THREE.Color(...LAMP.colour), vertexColors: true, transparent: true, depthWrite: false, toneMapped: false })
    lampMade.name = 'wait-lamp'
    lampMade.polygonOffset = true
    lampMade.polygonOffsetFactor = -2
    lampMade.polygonOffsetUnits = -4
  }
  return lampMade
}

function halo(): THREE.MeshBasicMaterial {
  if (!haloMade) {
    haloMade = new THREE.MeshBasicMaterial({ color: new THREE.Color(LAMP.colour[0] * LAMP.halo, LAMP.colour[1] * LAMP.halo, LAMP.colour[2] * LAMP.halo), vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })
    haloMade.name = 'wait-halo'
    haloMade.polygonOffset = true
    haloMade.polygonOffsetFactor = -1
    haloMade.polygonOffsetUnits = -2
  }
  return haloMade
}

function solid(g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m)
  mesh.castShadow = cast
  mesh.receiveShadow = true
  return mesh
}

// The display: a chrome bezel standing on the panel, a dark gap, and the smoked glass a little below the bezel's top.
function counterOf(s: Shape): THREE.Object3D {
  const m = materials()
  const h = s.z1 - s.z0
  const root = new THREE.Group()
  const w = BEZEL.wide
  const rim: ProfilePoint[] = [[0, 0, true], [0, h - 1.6], [0.5, h - 0.5], [1.6, h], [w - 2, h], [w - 0.8, h - 0.5], [w - 0.3, h - 1.4], [w - 0.3, 0.4, true]]
  root.add(solid(sweep(outlineOf(s, 0, 14), profile(rim), false), m.chrome))
  const gap: ProfilePoint[] = [[w - 0.4, h - BEZEL.sunk - 1.2, true], [w + 1.4, h - BEZEL.sunk - 1.2, true]]
  root.add(solid(sweep(outlineOf(s, 0, 14), profile(gap), false), m.gap, false))
  const half = Math.min(s.w, s.h) / 2
  const top = h - BEZEL.sunk
  const glass: ProfilePoint[] = [[w + 1.2, top - 1.4, true], [w + 1.5, top - 0.5], [w + 2.6, top - 0.1], ...[0.9, 0.6, 0.3, 0.05].map((t): ProfilePoint => [half - (half - w - 4) * t, top + 0.5 * (1 - t * t)])]
  root.add(solid(sweep(outlineOf(s, 0, 14), profile(glass)), face(), false))
  root.userData.own = true
  return root
}

interface Held { said: string }

function runOf(s: Shape, said: string, grow: number): THREE.BufferGeometry {
  const t = s.type!
  const b = block(t.font, said, t.px, t.wrap, t.lead)
  const align = t.align ?? 'left'
  const x = align === 'centre' ? 0 : align === 'right' ? s.w / 2 : -s.w / 2
  const style: Style = grow > 0 ? { setting: 'flat', fill: WHITE, lean: 0, rings: [{ d: grow * 0.35, a: 0.55, c: WHITE }, { d: grow, a: 0, c: WHITE }] } : LIT
  const data = setRun({ font: t.font, px: t.px, lines: b.lines, align, x, y: s.h / 2 - b.cap, lead: b.lead, style })
  const pos = Float32Array.from(data.position)
  for (let i = 2; i < pos.length; i += 3) pos[i] = 0
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(data.colour), 4))
  g.setIndex(Array.from(data.index))
  return g
}

function digitsOf(s: Shape): THREE.Object3D {
  const said = words(s.words!, s.text)
  const root = new THREE.Group()
  const glow = new THREE.Mesh(runOf(s, said, 7), halo())
  glow.name = 'halo'
  const lit = new THREE.Mesh(runOf(s, said, 0), lamp())
  lit.name = 'lit'
  for (const mesh of [glow, lit]) {
    mesh.position.z = -BEZEL.sunk + 0.5
    mesh.castShadow = false
    mesh.receiveShadow = false
    root.add(mesh)
  }
  const held: Held = { said }
  root.userData.held = held
  root.userData.own = true
  return root
}

export const wait: PartMaker | null = {
  key(s, ctx) {
    if (s.kind === 'text') {
      if (s.id !== 'wait-value' && s.id !== 'wait-count') return null
      return `lamp:${s.type!.font}:${s.type!.px}:${q(s.w)}:${q(s.h)}:${s.words}`
    }
    if (s.role === 'card') return controls.key(s, ctx)
    if (s.role === 'counter') return `counter:${q(s.w)}:${q(s.h)}:${q(s.r ?? 0)}:${q(s.z1 - s.z0)}`
    return null
  },
  make(s, ctx) {
    if (s.kind === 'text') return digitsOf(s)
    if (s.role === 'card') return controls.make(s, ctx)
    return counterOf(s)
  },
  pose(o, s, ctx) {
    if (s.kind !== 'text') return
    const held = o.userData.held as Held
    const said = words(s.words!, s.text)
    if (said !== held.said) {
      held.said = said
      const glow = o.getObjectByName('halo') as THREE.Mesh
      const lit = o.getObjectByName('lit') as THREE.Mesh
      glow.geometry.dispose()
      lit.geometry.dispose()
      glow.geometry = runOf(s, said, 7)
      lit.geometry = runOf(s, said, 0)
    }
    ctx.light({ x: s.x + s.w / 2, y: s.y + s.h / 2, z: s.z1 + 30, colour: LAMP.colour, power: LAMP.power, reach: LAMP.reach })
  },
  drop(o) {
    if (!o.userData.own) return
    o.traverse((c) => {
      const m = c as THREE.Mesh
      if (m.isMesh) m.geometry.dispose()
    })
  }
}
