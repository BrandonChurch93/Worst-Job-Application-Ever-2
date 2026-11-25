import { config } from '../config'
import { copy, lookup } from '../copy'

export type Made = 'copy' | 'config' | 'runtime'

const data: Record<string, unknown> = {}

export function registerData(name: string, value: unknown): void {
  data[name] = value
}

const walk = (source: unknown, path: string): unknown => {
  let v: unknown = source
  for (const part of path.split('.')) v = v !== null && typeof v === 'object' ? (v as Record<string, unknown>)[part] : undefined
  return v
}

export const madeOf = (key: string): Made => (key.startsWith('copy:') ? 'copy' : key.startsWith('runtime:') ? 'runtime' : 'config')

export function hasWords(key: string): boolean {
  if (key.startsWith('runtime:')) return true
  if (key.startsWith('copy:')) return lookup(copy, key) !== undefined
  if (key.startsWith('data:')) return typeof walk(data, key.slice(5)) === 'string'
  return typeof walk(config, key) === 'string'
}

export function words(key: string, runtime?: string): string {
  if (key.startsWith('runtime:')) return runtime ?? ''
  if (key.startsWith('copy:')) {
    const v = lookup(copy, key)
    if (v === undefined) throw new Error(`No copy with the key "${key}"`)
    return v
  }
  if (key.startsWith('data:')) {
    const v = walk(data, key.slice(5))
    if (typeof v !== 'string') throw new Error(`No words in the data files under "${key}"`)
    return v
  }
  const v = walk(config, key)
  if (typeof v !== 'string') throw new Error(`No words in the config under "${key}"`)
  return v
}
