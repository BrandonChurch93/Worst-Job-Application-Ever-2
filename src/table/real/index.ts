import type { PageReal, PartMaker } from '../../real/types'
import { parts as art } from './art'
import { parts as ball } from './ball'
import { parts as displays } from './displays'
import { parts as frame } from './frame'
import { parts as hardware } from './hardware'
import { parts as lights } from './lights'
import { parts as corporate } from './models/corporate'
import { parts as office } from './models/office'
import { parts as street } from './models/street'
import { parts as play } from './play'

// Which folder makes which part of the table. A folder fills its own `index.ts` and nothing here.
export const OWNED: Record<string, string[]> = {
  art: ['tier-art'],
  corporate: ['model-hq', 'model-revolving-door', 'model-beach', 'model-boardroom', 'model-ladder', 'model-notes', 'model-wedges'],
  office: ['model-coffee-machine', 'model-cubicles', 'model-inbox', 'model-staplers'],
  street: ['model-firehouse', 'model-police', 'model-bank', 'model-garage', 'model-houses', 'model-moms', 'model-road-signs'],
  hardware: ['table-hardware', 'lift'],
  play: ['flippers', 'bumpers', 'targets', 'ramps'],
  frame: ['table-frame', 'marquee', 'loader'],
  lights: ['table-lights'],
  ball: ['clear-ball'],
  displays: ['displays'],
}

const folders: Record<string, Record<string, PartMaker | null>> = { art, corporate, office, street, hardware, play, frame, lights, ball, displays }
const all: Record<string, PartMaker | null> = {}
for (const [folder, names] of Object.entries(OWNED)) {
  const made = folders[folder]!
  for (const name of Object.keys(made)) if (!names.includes(name)) throw new Error(`The folder "${folder}" does not own the part "${name}"`)
  for (const name of names) all[name] = made[name] ?? null
}

export const real: PageReal = { parts: all }
