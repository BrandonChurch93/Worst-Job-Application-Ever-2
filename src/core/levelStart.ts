import { quality, qualityIds } from './quality'

// The level the site starts at: the one the address asks for, else the one the config names, else the best, from which the picker looks for the level the first frames hold.
export function startLevelOf(asked: string | null, byConfig: string): string {
  if (asked) return quality(asked) && asked
  return byConfig === 'auto' ? qualityIds[0]! : quality(byConfig) && byConfig
}

// True when the address or the config names one level. The picker then never moves it.
export const levelIsFixedOf = (asked: string | null, byConfig: string): boolean => asked !== null || byConfig !== 'auto'
