import * as THREE from 'three'
import { assetUrl, fetchBytes, filesOf, type AssetSet } from '../../core/assets'

// A picture a part of the table is built from: a file of the asset sets, named from `table/` on, the same name in `public/assets/` and in `assets-full/`.
export interface Asked {
  file: string
  // False while the file is not in the asset set in use, or not loaded yet. A maker answers null until its pictures are ready.
  ready(): boolean
  texture(): THREE.Texture
}

interface Entry { file: string; colour: boolean; repeat: boolean; texture: THREE.Texture | null }

const asked = new Map<string, Entry>()

// Call it at the top of a file, never inside `make`. Colour pictures are read as sRGB, data pictures as they are.
export function ask(file: string, o: { colour: boolean; repeat?: boolean }): Asked {
  if (!file.startsWith('table/')) throw new Error(`A picture of the table is named from "table/" on: "${file}"`)
  let e = asked.get(file)
  if (!e) {
    e = { file, colour: o.colour, repeat: o.repeat ?? false, texture: null }
    asked.set(file, e)
  } else if (e.colour !== o.colour || e.repeat !== (o.repeat ?? false)) throw new Error(`The picture "${file}" is asked for in two ways`)
  const entry = e
  return {
    file,
    ready: () => entry.texture !== null,
    texture() {
      if (!entry.texture) throw new Error(`The picture "${file}" is not loaded: answer null from key() while ready() is false`)
      return entry.texture
    }
  }
}

export const askedFiles = (): string[] => [...asked.keys()].sort()

// Loads every picture that was asked for and is in the asset set. The app awaits it before any page draws its first frame.
export async function loadTable(set: AssetSet): Promise<void> {
  const have = new Set(filesOf('table', set).map((f) => f.file))
  await Promise.all(
    [...asked.values()]
      .filter((e) => have.has(e.file) && !e.texture)
      .map(async (e) => {
        const bytes = await fetchBytes(assetUrl('table', e.file, set))
        const bitmap = await createImageBitmap(new Blob([bytes]), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
        const t = new THREE.Texture(bitmap)
        t.colorSpace = e.colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
        t.wrapS = t.wrapT = e.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
        t.generateMipmaps = true
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.magFilter = THREE.LinearFilter
        t.anisotropy = 8
        t.name = e.file
        t.needsUpdate = true
        e.texture = t
      })
  )
}
