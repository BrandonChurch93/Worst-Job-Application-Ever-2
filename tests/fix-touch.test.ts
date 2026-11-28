import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '..')
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8')
const sheet = read('src/ui/touch.module.css')
const code = read('src/ui/touch.ts')
const first = read('src/ui/message.ts')

describe('the page of a touch-only device, built from the materials of the site', () => {
  it('fetches nothing for its look: every picture in its style sheet is a gradient or a data address', () => {
    const urls = [...sheet.matchAll(/url\((?:"([^"]*)"|([^)%]*)\))/g)].map((m) => m[1] ?? m[2]!)
    expect(urls.length).toBeGreaterThan(0)
    for (const u of urls) expect(u.startsWith('data:image/svg+xml,'), u.slice(0, 40)).toBe(true)
    expect(sheet).not.toMatch(/@import|@font-face|image-set\(/)
    for (const u of urls) expect(decodeURIComponent(u)).not.toMatch(/href=|<image|<use|url\((?!#)/)
  })
  it('is a still page: no animation, no transition, and neither a canvas nor a drawing context', () => {
    expect(sheet).not.toMatch(/animation|transition|@keyframes/)
    for (const text of [code, first]) expect(text).not.toMatch(/canvas'\)|getContext|requestAnimationFrame|WebGL|new Audio|fetch\(/)
  })
  it('has the ground with its grain and its light, the machined rule and the glass card with its lit edge, its inner shade and its contact shadow', () => {
    const block = (name: string): string => sheet.match(new RegExp(`\\.${name} \\{[^}]*\\}`))?.[0] ?? ''
    expect(block('page')).toMatch(/--grain: url\("data:image\/svg\+xml,[^"]*feTurbulence[^"]*feDiffuseLighting/)
    expect(block('page')).toMatch(/radial-gradient\(/)
    expect(block('rule')).toMatch(/linear-gradient\([^;]*box-shadow|linear-gradient[\s\S]*box-shadow/)
    const card = block('card')
    expect(card).toMatch(/var\(--grain\)/)
    expect(card.match(/inset /g)?.length).toBeGreaterThanOrEqual(3)
    expect(card.split('box-shadow:')[1]!.split(',\n').filter((l) => !l.includes('inset')).length).toBeGreaterThanOrEqual(2)
    for (const part of ['rule', 'card']) expect(code).toContain(`css.${part}!`)
  })
  it('stays the light page of the site under a dark colour scheme, and never sets its type under 16 px', () => {
    expect(sheet.match(/color-scheme: only light;/g)?.length).toBe(2)
    expect(sheet).not.toMatch(/prefers-color-scheme/)
    expect(first).toContain('classList.add(css.device!)')
    const sizes = [...sheet.matchAll(/font-size: clamp\((\d+)px/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBe(4)
    const fixed = [...sheet.matchAll(/font-size: (\d+)px;/g)].map((m) => Number(m[1]))
    expect(Math.min(...fixed)).toBeGreaterThanOrEqual(16)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16)
    expect(sheet.match(/font-size:/g)?.length).toBe(sizes.length + fixed.length)
  })
  it('writes no word of its own: what it shows comes from the copy by its key', () => {
    expect([...code.matchAll(/word\('(\w+)'\)/g)].map((m) => m[1])).toEqual(['title', 'touchTitle', 'touchBody', 'watchFilm'])
    const quoted = [...code.matchAll(/'([^'\n]*)'/g)].map((m) => m[1]!).filter((s) => / /.test(s))
    expect(quoted).toEqual([])
    expect(code).not.toMatch(/portfolio/i)
    expect(code).toMatch(/link\.href = FILM_PAGE/)
  })
  it('keeps the conventions: no long dash and no exclamation point in what it says', () => {
    for (const text of [sheet, code, first]) {
      expect(text).not.toContain('\u2014')
      expect(text.replace(/css\.\w+!|[!]==?|[!]important|\w[!][,)\s.]/g, '')).not.toContain('!')
    }
  })
})
