import * as THREE from 'three'
import { studio } from '../../../post/studio'
import type { PartMaker } from '../../../real/types'
import { outlineOf, profile, sweep } from '../../../shell/solids'
import type { Shape } from '../../../stage/types'
import { dims, mesh, q, shared, srgb } from './careers-solids'
import { cardGlass, GLASS, glassOptions, groundEdge, SLAB, slabGeometry } from './perk-cards'

export const TICKER_LOOK = { clear: 0.1, wedge: 4.4, caster: 2.6, dot: 0x3c4043 }

let tapeMade: THREE.MeshPhysicalMaterial | null = null
let paneMade: THREE.MeshPhysicalMaterial | null = null
let dotMade: THREE.MeshPhysicalMaterial | null = null

// The tape runs in a shallow channel under the strip. It is the same frosted stuff as the strip, so the two read as one slab with the words inside it.
const tape = (): THREE.MeshPhysicalMaterial => (tapeMade ??= studio(new THREE.MeshPhysicalMaterial({ ...glassOptions(), vertexColors: false, clearcoat: 0, roughness: 0.6 })))

// The polished top of the strip over the channel: clear, seen by what it reflects and by a little of the glass's own colour.
const pane = (): THREE.MeshPhysicalMaterial =>
  (paneMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(GLASS.colour), roughness: 0.3, metalness: 0, transparent: true, opacity: TICKER_LOOK.clear, clearcoat: 0.6, clearcoatRoughness: 0.22, specularIntensity: 0.6, depthWrite: false })))

const dot = (): THREE.MeshPhysicalMaterial => (dotMade ??= studio(new THREE.MeshPhysicalMaterial({ color: srgb(TICKER_LOOK.dot), roughness: 0.7, metalness: 0 })))

// The strip: the cards' slab lying on the page, its ground edge all round, hollow over the channel the tape runs in.
// Its shadow on the page is thrown by a wedge under the ground edge, which is lower than the light all the way in, so none falls on the tape.
function strip(s: Shape): THREE.Object3D {
  const thick = s.z1 - s.z0
  const root = new THREE.Group()
  const rim = mesh(shared(`tickerRim:${dims(s)}:${q(thick)}`, () => slabGeometry(s, thick, true)), cardGlass(), false)
  rim.position.z = thick / 2
  root.add(rim)
  const inset = groundEdge(s) - 0.4
  const top = mesh(shared(`tickerPane:${dims(s)}:${q(thick)}`, () => sweep(outlineOf(s, inset, 10), [{ inset: 0, z: thick, out: 0, up: 1 }])), pane(), false, false)
  top.userData.order = true
  top.renderOrder = 880000
  root.add(top)
  const foot = mesh(shared(`tickerFoot:${dims(s)}`, () => sweep(outlineOf(s, SLAB.frame + 0.6, 8), profile([[0, 0, true], [0, TICKER_LOOK.caster, true], [TICKER_LOOK.wedge, 0.2, true]]), false)), cardGlass(), true, false)
  foot.name = 'foot'
  root.add(foot)
  return root
}

function band(s: Shape): THREE.Object3D {
  const h = Math.max(0.2, s.z1 - s.z0)
  return mesh(shared(`tickerTape:${dims(s)}`, () => sweep(outlineOf({ kind: 'box', w: s.w + 6, h: s.h + 6 }, 0, 4), [{ inset: 0, z: h, out: 0, up: 1 }])), tape(), false, true)
}

export const ticker: PartMaker | null = {
  key(s) {
    if (s.kind === 'text' || s.kind === 'well') return null
    if (s.role === 'tickerWindow') return ''
    if (s.id === 'ticker-glass') return `tickerGlass:${dims(s)}:${q(s.z1 - s.z0)}`
    if (s.id === 'ticker-tape') return `tickerTape:${dims(s)}`
    if (s.kind === 'disc') return `tickerDot:${q(s.w)}`
    return null
  },
  make(s) {
    if (s.id === 'ticker-glass') return strip(s)
    if (s.id === 'ticker-tape') return band(s)
    return mesh(shared(`tickerDot:${q(s.w)}`, () => new THREE.CircleGeometry(s.w / 2, 16).translate(0, 0, 0.08)), dot(), false)
  }
}
