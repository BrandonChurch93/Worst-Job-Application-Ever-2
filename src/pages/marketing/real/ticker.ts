import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { materials } from '../../../shell/materials'
import { arc, outlineOf, profile, sweep, type ProfilePoint } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, mesh, q, shared, srgb } from './careers-solids'

export const TICKER_LOOK = { bezel: 3.2, proud: 0.9, glass: 1.6, pane: 0.9, lamp: [1, 0.93, 0.82] as [number, number, number], power: 0.55, reach: 150, lamps: 4 }

let tapeMade: THREE.MeshPhysicalMaterial | null = null
let paneMade: THREE.MeshPhysicalMaterial | null = null
let dotMade: THREE.MeshPhysicalMaterial | null = null
let wallMade: THREE.MeshPhysicalMaterial | null = null

// The tape is thin paper with a lamp behind it: it gives off a little warm light of its own.
const tape = (): THREE.MeshPhysicalMaterial =>
  (tapeMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xefe9dc), roughness: 0.88, metalness: 0, specularIntensity: 0.2, emissive: srgb(0xf2e2c4), emissiveIntensity: 0.42 })))

// The pane over the window: clear glass, seen only by what it reflects and by a faint green in its body.
const pane = (): THREE.MeshPhysicalMaterial =>
  (paneMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xc9d6d2), roughness: 0.12, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, specularIntensity: 1, depthWrite: false })))

const dot = (): THREE.MeshPhysicalMaterial => (dotMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0xb8470a), roughness: 0.6, metalness: 0 })))
const wall = (): THREE.MeshPhysicalMaterial => (wallMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(0x3a3b3c), roughness: 0.6, metalness: 0.4 })))

// The window: a polished bezel at the mouth of the cut, a dark sleeve down to the tape, and a pane of glass let into the bezel.
function window(s: Shape): THREE.Object3D {
  const m = materials()
  const L = TICKER_LOOK
  const root = new THREE.Group()
  const depth = -s.z0
  const top = depth + L.proud
  const lip: ProfilePoint[] = [[-1.4, depth - 0.3, true], [-1.4, depth + 0.1], ...arc(-1.4, depth + 0.1, 1.3, L.proud - 0.1, 5).slice(1), [L.bezel - 1.2, top], [L.bezel - 0.3, top - 0.6], [L.bezel, top - 1.6, true]]
  root.add(mesh(shared(`tickerBezel:${dims(s)}:${q(depth)}`, () => sweep(outlineOf(s, 0, 20), profile(lip), false)), m.chrome))
  const sleeve: ProfilePoint[] = [[L.bezel, top - 1.6, true], [L.bezel + 0.4, 0.2, true], [L.bezel + 1.6, 0.2, true]]
  const liner = mesh(shared(`tickerSleeve:${dims(s)}:${q(depth)}`, () => sweep(outlineOf(s, 0, 20), profile(sleeve), false)), wall(), false)
  root.add(liner)
  const glassTop = depth - 0.2
  const sheet: ProfilePoint[] = [[L.bezel - 0.1, glassTop - L.glass, true], [L.bezel - 0.1, glassTop - 0.5], ...arc(L.bezel - 0.1, glassTop - 0.5, 0.6, 0.5, 3).slice(1)]
  const glass = mesh(shared(`tickerPane:${dims(s)}:${q(depth)}`, () => sweep(outlineOf(s, 0, 20), profile(sheet))), pane(), false, false)
  glass.userData.order = true
  glass.renderOrder = 880000
  root.add(glass)
  return root
}

function strip(s: Shape): THREE.Object3D {
  const h = Math.max(0.2, s.z1 - s.z0)
  return mesh(shared(`tickerTape:${dims(s)}`, () => sweep(outlineOf({ kind: 'capsule', w: s.w, h: s.h + 8 }, 4, 20), [{ inset: 0, z: h, out: 0, up: 1 }])), tape(), false, true)
}

export const ticker: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role === 'tickerWindow') return `tickerWindow:${dims(s)}:${q(s.z0)}`
    if (s.id === 'ticker-tape') return `tickerTape:${dims(s)}`
    if (s.kind === 'disc') return `tickerDot:${q(s.w)}`
    return null
  },
  make(s) {
    if (s.role === 'tickerWindow') return window(s)
    if (s.id === 'ticker-tape') return strip(s)
    return mesh(shared(`tickerDot:${q(s.w)}`, () => new THREE.CircleGeometry(s.w / 2 - 1, 24).translate(0, 0, 0.08)), dot(), false)
  },
  pose(_o, s, ctx) {
    if (s.id !== 'ticker-tape') return
    const L = TICKER_LOOK
    for (let i = 0; i < L.lamps; i++) ctx.light({ x: s.x + (s.w * (i + 0.5)) / L.lamps, y: s.y + s.h / 2, z: s.z1 + 2.5, colour: L.lamp, power: L.power, reach: L.reach })
  }
}
