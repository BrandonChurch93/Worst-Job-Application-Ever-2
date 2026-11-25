import build from 'virtual:build-info'
import { config } from '../config'

export type AssetSet = keyof typeof config.assetSets

export function assetSet(id: string): AssetSet {
  if (!(id in config.assetSets)) throw new Error(`No asset set called "${id}"`)
  return id as AssetSet
}

// Every file a page folder holds in one asset set, from the build's index.
export function filesOf(folder: string, set: AssetSet): { file: string; bytes: number }[] {
  return build.assets[set][folder] ?? []
}

// Where a file of an asset set is fetched from. The full set is not shipped, so the harness mounts it beside the site.
export function assetUrl(folder: string, file: string, set: AssetSet): string {
  return set === 'full' ? `./assets-full/${file}` : `./assets/${file}`
}

export async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`The file "${url}" did not load: ${res.status}`)
  return res.arrayBuffer()
}
