/// <reference types="vite/client" />

declare module 'virtual:build-info' {
  const info: {
    engineHash: string
    pageHashes: Record<string, string>
    assets: { web: Record<string, { file: string; bytes: number }[]>; full: Record<string, { file: string; bytes: number }[]> }
    approved: string[]
    versions: Record<string, string>
  }
  export default info
}

declare module 'opentype.js' {
  export interface PathCommand { type: 'M' | 'L' | 'C' | 'Q' | 'Z'; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number }
  export interface Path { commands: PathCommand[]; getBoundingBox(): { x1: number; y1: number; x2: number; y2: number } }
  export interface Glyph { advanceWidth?: number; index: number; name?: string | null; unicode?: number }
  export interface Font {
    unitsPerEm: number
    ascender: number
    descender: number
    names: Record<string, unknown>
    tables: Record<string, any>
    getPath(text: string, x: number, y: number, fontSize: number, options?: Record<string, unknown>): Path
    getAdvanceWidth(text: string, fontSize: number, options?: Record<string, unknown>): number
    charToGlyph(c: string): Glyph
    hasChar(c: string): boolean
  }
  export function parse(buffer: ArrayBuffer, options?: Record<string, unknown>): Font
  const opentype: { parse: typeof parse }
  export default opentype
}
