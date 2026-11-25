export interface BakedFont {
  family: string
  style: string
  weight: number
  unitsPerEm: number
  ascender: number
  descender: number
  lineGap: number
  capHeight: number
  xHeight: number
  glyphs: Record<string, { a: number; p: number[] }>
  kern: Record<string, number[]>
}

export const FONTS = ['inter-400', 'inter-500', 'inter-600', 'inter-display-600', 'playfair-700', 'playfair-900'] as const

const fonts = new Map<string, BakedFont>()
const kernMaps = new Map<string, Map<number, number>>()

export function registerFont(name: string, data: BakedFont): void {
  fonts.set(name, data)
  const map = new Map<number, number>()
  for (const [left, list] of Object.entries(data.kern)) {
    const l = Number(left)
    for (let i = 0; i < list.length; i += 2) map.set(l * 65536 + list[i]!, list[i + 1]!)
  }
  kernMaps.set(name, map)
}

export const hasFont = (name: string): boolean => fonts.has(name)

export function font(name: string): BakedFont {
  const f = fonts.get(name)
  if (!f) throw new Error(`The font "${name}" is not loaded`)
  return f
}

export interface Measured { width: number; advances: number[] }

export function measure(name: string, text: string, px: number, tracking = 0): Measured {
  const f = font(name)
  const kern = kernMaps.get(name)!
  const scale = px / f.unitsPerEm
  const advances: number[] = []
  let x = 0
  const codes = Array.from(text, (ch) => ch.codePointAt(0)!)
  for (let i = 0; i < codes.length; i++) {
    const g = f.glyphs[String(codes[i])]
    if (!g) throw new Error(`The font "${name}" has no glyph for "${String.fromCodePoint(codes[i]!)}"`)
    advances.push(x)
    x += g.a * scale + tracking
    if (i + 1 < codes.length) x += (kern.get(codes[i]! * 65536 + codes[i + 1]!) ?? 0) * scale
  }
  return { width: codes.length ? x - tracking : 0, advances }
}

export const capHeight = (name: string, px: number): number => (font(name).capHeight / font(name).unitsPerEm) * px
export const leadOf = (px: number, lead?: number): number => lead ?? Math.round(px * 1.4)

export function wrapLines(name: string, text: string, px: number, width?: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    if (width === undefined) {
      out.push(para)
      continue
    }
    let line = ''
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (line && measure(name, next, px).width > width) {
        out.push(line)
        line = word
      } else line = next
    }
    out.push(line)
  }
  return out
}

export interface Block { lines: string[]; width: number; height: number; cap: number; lead: number }

export function block(name: string, text: string, px: number, wrap?: number, lead?: number): Block {
  const lines = wrapLines(name, text, px, wrap)
  const l = leadOf(px, lead)
  const cap = capHeight(name, px)
  let width = 0
  for (const line of lines) width = Math.max(width, measure(name, line, px).width)
  return { lines, width, height: cap + (lines.length - 1) * l, cap, lead: l }
}
