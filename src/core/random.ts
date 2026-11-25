import { config } from '../config'

export function hashName(name: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export class Random {
  private a: number
  private b: number
  private c: number
  private d: number

  constructor(seed: number, stream: string) {
    this.a = seed >>> 0
    this.b = hashName(stream)
    this.c = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0
    this.d = 1
    for (let i = 0; i < 16; i++) this.bits()
  }

  bits(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0
    this.d = (this.d + 1) | 0
    this.a = this.b ^ (this.b >>> 9)
    this.b = (this.c + (this.c << 3)) | 0
    this.c = (this.c << 21) | (this.c >>> 11)
    this.c = (this.c + t) | 0
    return t >>> 0
  }

  next(): number {
    return this.bits() / 4294967296
  }

  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next()
  }

  int(n: number): number {
    return Math.floor(this.next() * n)
  }

  pick<T>(list: readonly T[]): T {
    return list[this.int(list.length)]!
  }

  shuffle<T>(list: T[]): T[] {
    for (let i = list.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      const t = list[i]!
      list[i] = list[j]!
      list[j] = t
    }
    return list
  }

  state(): number[] {
    return [this.a, this.b, this.c, this.d]
  }

  restore(s: number[]): void {
    this.a = s[0]!
    this.b = s[1]!
    this.c = s[2]!
    this.d = s[3]!
  }
}

export const stream = (name: string, seed: number = config.seed): Random => new Random(seed, name)

// A hash of whole numbers to a number in [0, 1). The same on every machine.
export function hash01(x: number, y: number, z: number): number {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1)) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}
