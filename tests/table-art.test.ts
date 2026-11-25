import { describe, expect, test } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import * as THREE from 'three'
import cfg from '../config/showcase.json'
import { table, TIERS } from '../src/table/layout'
import { OWNED } from '../src/table/real'
import { askedFiles } from '../src/table/real/assets'
import { parts } from '../src/table/real/art'
import { INSERT_GLOW, insertCell, insertColour, insertsOf } from '../src/table/real/art/inserts'

const root = path.resolve(__dirname, '..')
const sets = { web: path.join(root, 'public', 'assets', 'table', 'art'), full: path.join(root, 'assets-full', 'table', 'art') }
const names = [...TIERS.flatMap((id) => [`${id}.webp`, `${id}-mask.png`, `${id}-coat.png`]), 'inserts-lens.webp', 'inserts-glow.webp', 'inserts-relief.png']

describe('the printed floors', () => {
  test('the folder makes the one part it owns', () => {
    expect(OWNED.art).toEqual(['tier-art'])
    expect(parts['tier-art']).not.toBeNull()
  })

  test('both asset sets hold the same pictures under the same names', () => {
    for (const dir of Object.values(sets)) expect(fs.readdirSync(dir).sort()).toEqual([...names].sort())
  })

  test('every picture the maker asks for is in both sets', () => {
    const asked = askedFiles().filter((f) => f.startsWith('table/art/'))
    expect(asked.sort()).toEqual(names.map((n) => `table/art/${n}`).sort())
  })

  test('the web set stays inside 12 MB and no file of either set reaches the host limit', () => {
    let web = 0
    for (const n of names) web += fs.statSync(path.join(sets.web, n)).size
    expect(web / 1048576).toBeLessThanOrEqual(12)
    for (const dir of Object.values(sets)) for (const n of names) expect(fs.statSync(path.join(dir, n)).size / 1048576).toBeLessThan(cfg.host.maxFileMb)
  })

  test('a floor is as wide as its asset set allows and sixteen by nine', async () => {
    for (const [set, dir] of Object.entries(sets)) {
      for (const id of TIERS) {
        const m = await sharp(path.join(dir, `${id}.webp`), { limitInputPixels: false }).metadata()
        expect(m.width).toBe(cfg.assetSets[set as 'web' | 'full'].tableArtWidth)
        expect(m.width! / m.height!).toBeCloseTo(16 / 9, 3)
      }
    }
  })

  test('the coverage mask is two tones, and says printed for some of the floor and flat for some', async () => {
    for (const id of TIERS) {
      const { data } = await sharp(path.join(sets.web, `${id}-mask.png`)).greyscale().raw().toBuffer({ resolveWithObject: true })
      let white = 0
      let other = 0
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 245) white++
        else if (data[i] !== 10) other++
      }
      expect(other).toBe(0)
      const share = white / data.length
      expect(share).toBeGreaterThan(0.08)
      expect(share).toBeLessThan(0.8)
    }
  })

  test('no floor has a pixel of pure black or pure white', async () => {
    for (const id of TIERS) {
      const s = await sharp(path.join(sets.web, `${id}.webp`)).stats()
      const lo = Math.max(...s.channels.map((c) => c.min))
      const hi = Math.min(...s.channels.map((c) => c.max))
      expect(lo).toBeGreaterThan(0)
      expect(hi).toBeLessThan(255)
    }
  })
})

describe('the insert windows', () => {
  test('nine windows, three a tier, each with a colour and a cell of its own', () => {
    expect(table.inserts.length).toBe(9)
    const cells = new Set<string>()
    for (let k = 0; k < 3; k++) expect(insertsOf(k).length).toBe(3)
    for (const n of table.inserts) {
      const c = insertColour(n)
      expect(c).toBeInstanceOf(THREE.Color)
      const hsl = { h: 0, s: 0, l: 0 }
      c.getHSL(hsl, THREE.SRGBColorSpace)
      const orange = hsl.s > 0.5 && hsl.h > 0.035 && hsl.h < 0.085
      expect(orange).toBe(false)
      const [col, row] = insertCell(n)
      expect(col).toBeGreaterThanOrEqual(0)
      expect(col).toBeLessThan(3)
      expect(row).toBeLessThan(3)
      cells.add(`${col},${row}`)
    }
    expect(cells.size).toBe(9)
  })

  test('a lit window is far brighter than an unlit one', () => {
    expect(INSERT_GLOW.on).toBeGreaterThan(INSERT_GLOW.off * 10)
  })

  test('the atlases are three by three square cells', async () => {
    for (const n of ['inserts-lens.webp', 'inserts-glow.webp', 'inserts-relief.png']) {
      const m = await sharp(path.join(sets.web, n)).metadata()
      expect(m.width).toBe(m.height)
      expect(m.width! % 3).toBe(0)
    }
  })

  test('the glow of every window is brightest in its middle', async () => {
    const { data, info } = await sharp(path.join(sets.web, 'inserts-glow.webp')).greyscale().raw().toBuffer({ resolveWithObject: true })
    const cell = info.width / 3
    const ring = (cx: number, cy: number, r: number) => {
      let sum = 0
      for (let q = 0; q < 180; q++) sum += data[Math.round(cy + Math.sin(q / 28.6479) * r) * info.width + Math.round(cx + Math.cos(q / 28.6479) * r)]!
      return sum / 180
    }
    for (const n of table.inserts) {
      const [col, row] = insertCell(n)
      const cx = (col + 0.5) * cell
      const cy = (row + 0.5) * cell
      const inner = (ring(cx, cy, cell * 0.08) + ring(cx, cy, cell * 0.14) + ring(cx, cy, cell * 0.2)) / 3
      expect(inner).toBeGreaterThan(ring(cx, cy, cell * 0.47))
    }
  })
})

describe('the sources of the floors', () => {
  test('the recipe names every file of the set', () => {
    const recipe = fs.readFileSync(path.join(root, 'assets-src', 'table', 'art', 'RECIPE.md'), 'utf8')
    for (const n of names) expect(recipe).toContain(n)
  })

  test('nothing in the folder draws a letter or a number', () => {
    for (const f of ['lib.mjs', 'tiers.mjs', 'inserts.mjs', 'make.mjs']) {
      const src = fs.readFileSync(path.join(root, 'assets-src', 'table', 'art', f), 'utf8')
      expect(/<text|<tspan|font-family/.test(src)).toBe(false)
    }
  })
})
