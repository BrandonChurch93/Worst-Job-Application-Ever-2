import * as THREE from 'three'
import { table, type Insert } from '../../layout'

// The colour each window glows in, by the picture `table.inserts` gives it. The owner of the lights reads it for the light a window throws.
const COLOURS: Record<string, number> = {
  'a magnifying glass': 0x2f9bff,
  'an hourglass': 0xf3ecdc,
  'a clipboard with a tick': 0xffad3a,
  'a slice of pizza': 0xffad3a,
  'an envelope with two arrows': 0x35c873,
  'a knot in a rope': 0x2f9bff,
  'a ladder': 0xff3d2e,
  'a clock face': 0xffb648,
  'three hats stacked': 0xf3ecdc
}

export const insertColour = (n: Insert): THREE.Color => {
  const hex = COLOURS[n.picture]
  if (hex === undefined) throw new Error(`No window colour for the picture "${n.picture}"`)
  return new THREE.Color().setHex(hex, THREE.SRGBColorSpace)
}

// How bright a window is: with the machine asleep it only catches the room, with the tier's lamps on it glows low in its colour, lit it glows from below, brightest in the middle.
export const INSERT_GLOW = { off: 0.05, rest: 0.6, on: 1.9 }

// The cell of the three by three atlases a window's picture lies in: its index in `table.inserts`.
export const insertCell = (n: Insert): [number, number] => [n.index % 3, Math.floor(n.index / 3)]

export const insertsOf = (tier: number): Insert[] => table.inserts.filter((n) => n.tier === tier)
