import type { BodyLook, EffectsLook } from '../../src/cursor/contract'

export interface Cell { name: string; body?: Partial<BodyLook>; effects?: Partial<EffectsLook>; turn?: number; z?: number; time?: number }
export interface CellSet { cols: number; pitch?: number; tall?: number; cells: Cell[] }

const three = (name: string, make: (v: number) => Partial<BodyLook>): Cell[] => [0, 0.5, 1].map((v) => ({ name: `${name} ${v}`, body: make(v) }))
const strip = (n: number, spread: number): BodyLook['strips'] =>
  Array.from({ length: n }, (_, i) => ({ x: (i - (n - 1) / 2) * spread * 2.2 + Math.sin(i * 2.3) * spread * 3, y: Math.cos(i * 1.7) * spread * 5, z: spread > 2 ? -3 + (i % 3) * 1.2 : 0, rot: Math.sin(i * 1.3) * spread * 0.09, tilt: 0 }))

export const SETS: Record<string, CellSet> = {
  fix: {
    cols: 6,
    pitch: 95,
    cells: [
      ...three('flat', (v) => ({ flat: v, crack: v })),
      ...three('melt', (v) => ({ melt: v })),
      ...three('peel', (v) => ({ peel: v, flat: 1, crack: 1 })),
      ...[0, 0.5, 1].map((v) => ({ name: `steam ${v}`, effects: { steam: v }, body: { heat: v } })),
      { name: 'melt and sweat', body: { melt: 0.6 }, effects: { sweat: 1 } },
      { name: 'crack on its own', body: { crack: 1 } },
      { name: 'stone, cracked', body: { pale: 1, crack: 0.6 } }
    ]
  },
  rest: { cols: 3, pitch: 90, cells: [{ name: 'rest' }, { name: 'rest lifted', z: 26 }, { name: 'rest turned', turn: 0.5 }] },
  body: {
    cols: 6,
    cells: [
      ...[0.6, 1, 1.4].map((v) => ({ name: `stretch ${v}`, body: { stretch: v } })),
      ...[-1, 0.5, 1].map((v) => ({ name: `bend ${v}`, body: { bend: v } })),
      ...three('puff', (v) => ({ puff: v })),
      ...three('tremble', (v) => ({ tremble: v })),
      ...three('flat', (v) => ({ flat: v, crack: v })),
      ...three('melt', (v) => ({ melt: v }))
    ]
  },
  surface: {
    cols: 6,
    cells: [
      ...three('pale', (v) => ({ pale: v })),
      ...three('heat', (v) => ({ heat: v })),
      ...three('char', (v) => ({ char: v })),
      ...three('crack', (v) => ({ crack: v })),
      ...three('seam', (v) => ({ seam: v })),
      ...three('peel', (v) => ({ peel: v, flat: 1, crack: 1 }))
    ]
  },
  damage: {
    cols: 6,
    cells: [
      { name: 'hole new', body: { holes: [{ x: 4.2, y: 9.5, r: 2.2, glow: 1 }] } },
      { name: 'hole cooling', body: { holes: [{ x: 4.2, y: 9.5, r: 1.6, glow: 0.4 }] } },
      { name: 'hole closing', body: { holes: [{ x: 4.2, y: 9.5, r: 0.6, glow: 0 }] } },
      { name: 'three holes', body: { holes: [{ x: 3, y: 7, r: 1.4, glow: 1 }, { x: 6.5, y: 10, r: 1.1, glow: 0.5 }, { x: 6.6, y: 15.5, r: 0.9, glow: 0 }] } },
      { name: 'strips pile', body: { strips: strip(9, 4) } },
      { name: 'strips loose', body: { strips: strip(9, 1) } },
      { name: 'strips near', body: { strips: strip(9, 0.25) } },
      { name: 'strips true, seam', body: { seam: 1 } },
      { name: 'gulp 0.3', body: { gulp: 0.3 } },
      { name: 'gulp 0.7', body: { gulp: 0.7 } },
      { name: 'mixed: hot, bent, puffed', body: { heat: 0.8, bend: 0.6, puff: 0.7, stretch: 1.15 } },
      { name: 'mixed: pale, trembling, squashed', body: { pale: 1, tremble: 1, stretch: 0.75, bend: -0.5 } },
      { name: 'mixed: melted, hole, charred', body: { melt: 0.7, char: 0.5, holes: [{ x: 5, y: 10, r: 1.5, glow: 0.6 }] } },
      { name: 'mixed: flat, hot, hole', body: { flat: 1, crack: 1, heat: 0.5, holes: [{ x: 4.2, y: 9.5, r: 1.5, glow: 0.3 }] } },
      { name: 'mixed: half of all', body: { stretch: 1.2, bend: 0.5, puff: 0.5, tremble: 0.5, pale: 0.5, heat: 0.5, melt: 0.5, flat: 0.5, char: 0.5, crack: 0.5 } },
      { name: 'scorched', body: { char: 1 } },
      { name: 'char and bend', body: { char: 0.6, bend: -0.8 } },
      { name: 'pale half, hole', body: { pale: 0.5, holes: [{ x: 4.2, y: 9.5, r: 2, glow: 0.8 }] } }
    ]
  },
  effects: {
    cols: 6,
    cells: [
      ...[0, 0.5, 1].map((v) => ({ name: `sweat ${v}`, effects: { sweat: v } })),
      ...[0, 0.5, 1].map((v) => ({ name: `steam ${v}`, effects: { steam: v }, body: { heat: v } })),
      ...[0, 0.5, 1].map((v) => ({ name: `smoke ${v}`, effects: { smoke: [{ x: 4.2, y: 9.5, amount: v }] }, body: { holes: v > 0 ? [{ x: 4.2, y: 9.5, r: 2, glow: v }] : [] } })),
      ...[0.1, 0.5, 0.9].map((v) => ({ name: `dust ${v}`, effects: { dust: v } })),
      { name: 'sweat, turned', effects: { sweat: 1 }, turn: 0.6 },
      { name: 'sweat and tremble', effects: { sweat: 1 }, body: { tremble: 1, pale: 0.3 } },
      { name: 'steam and smoke from the tip', effects: { steam: 1, smoke: [{ x: 0.5, y: 1.2, amount: 1 }] }, body: { char: 0.8 } },
      { name: 'sweat late', effects: { sweat: 1 }, time: 3.3 },
      { name: 'steam late', effects: { steam: 1 }, body: { heat: 1 }, time: 3.3 },
      { name: 'smoke late', effects: { smoke: [{ x: 0.5, y: 1.2, amount: 1 }] }, body: { char: 1 }, time: 3.3 }
    ]
  }
}
