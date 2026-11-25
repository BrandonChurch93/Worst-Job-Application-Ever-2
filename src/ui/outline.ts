import { font, measure } from '../shell/metrics'

export interface Outline { d: string; width: number; top: number; bottom: number; unitsPerEm: number }

const DIGITS = '0123456789'

export function outline(name: string, text: string, tabular = false): Outline {
  const f = font(name)
  const chars = Array.from(text)
  const kerned = measure(name, text, f.unitsPerEm).advances
  const cell = Math.max(...Array.from(DIGITS, (c) => f.glyphs[String(c.codePointAt(0))]?.a ?? 0))
  const d: string[] = []
  let pen = 0
  chars.forEach((ch, i) => {
    const g = f.glyphs[String(ch.codePointAt(0))]!
    const digit = tabular && DIGITS.includes(ch)
    const x = tabular ? pen + (digit ? Math.round((cell - g.a) / 2) : 0) : kerned[i]!
    pen += digit ? cell : g.a
    const p = g.p
    for (let k = 0; k < p.length; ) {
      const c = p[k]!
      if (c === 0 || c === 1) {
        d.push(`${c === 0 ? 'M' : 'L'}${x + p[k + 1]!} ${-p[k + 2]!}`)
        k += 3
      } else if (c === 2) {
        d.push(`Q${x + p[k + 1]!} ${-p[k + 2]!} ${x + p[k + 3]!} ${-p[k + 4]!}`)
        k += 5
      } else if (c === 3) {
        d.push(`C${x + p[k + 1]!} ${-p[k + 2]!} ${x + p[k + 3]!} ${-p[k + 4]!} ${x + p[k + 5]!} ${-p[k + 6]!}`)
        k += 7
      } else {
        d.push('Z')
        k += 1
      }
    }
  })
  const width = tabular ? pen : measure(name, text, f.unitsPerEm).width
  return { d: d.join(''), width, top: f.ascender, bottom: f.descender, unitsPerEm: f.unitsPerEm }
}

export const spaceOf = (name: string): number => (font(name).glyphs['32']?.a ?? font(name).unitsPerEm / 4) / font(name).unitsPerEm
