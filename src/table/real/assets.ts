import type { AssetSet } from '../../core/assets'
import { loadPage, picture, picturesOf, type Asked } from '../../core/load'

// A picture a part of the table is built from: a file of the asset sets, named from `table/` on, the same name in `public/assets/` and in `assets-full/`.
export type { Asked }

// Call it at the top of a file, never inside `make`. Colour pictures are read as sRGB, data pictures as they are.
export function ask(file: string, o: { colour: boolean; repeat?: boolean }): Asked {
  if (!file.startsWith('table/')) throw new Error(`A picture of the table is named from "table/" on: "${file}"`)
  return picture('step3', 'table', file, o)
}

export const askedFiles = (): string[] => picturesOf('step3')

// Loads every picture that was asked for and is in the asset set. A capture awaits it before its first frame; the live site starts it while the visitor is on step 1 (`src/core/load.ts`).
export const loadTable = (set: AssetSet): Promise<void> => loadPage('step3', set)
