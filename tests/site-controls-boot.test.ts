import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { messageOnly } from '../src/ui/device'

const root = path.resolve(__dirname, '..')

// Every file a module pulls in when it is loaded: its static imports, and theirs. An import() is not followed, it loads nothing until it is called.
function loads(entry: string): { files: string[]; packages: string[] } {
  const files = new Set<string>()
  const packages = new Set<string>()
  const find = (from: string, name: string): string | null => {
    const base = path.resolve(path.dirname(from), name)
    for (const tail of ['', '.ts', '.mjs', '/index.ts']) {
      const p = base + tail
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
    }
    return null
  }
  const walk = (file: string) => {
    if (files.has(file)) return
    files.add(file)
    if (!/\.(ts|mjs)$/.test(file)) return
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/^\s*(?:import|export)\s+(?!type\s)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
      const name = m[1]!
      if (!name.startsWith('.')) {
        packages.add(name)
        continue
      }
      const found = find(file, name)
      if (!found) throw new Error(`${path.relative(root, file)} imports "${name}", which is not found`)
      walk(found)
    }
  }
  walk(path.join(root, entry))
  return { files: [...files].map((f) => path.relative(root, f)).sort(), packages: [...packages].sort() }
}

describe('who gets the message for a touch-only device', () => {
  it('a touch-only device that asks for the site, or for the live site by name', () => {
    expect(messageOnly('', true)).toBe(true)
    expect(messageOnly('?mode=live', true)).toBe(true)
    expect(messageOnly('?step=3&quality=low', true)).toBe(true)
  })
  it('not a computer, not a bot, and not a touch-only device that asks for the film, the loop or the probe', () => {
    expect(messageOnly('', false)).toBe(false)
    expect(messageOnly('?bot=keen', true)).toBe(false)
    for (const mode of ['film', 'loop', 'probe', 'capture']) expect(messageOnly(`?mode=${mode}`, true), mode).toBe(false)
  })
})

describe('what loads behind the message', () => {
  const first = loads('src/ui/boot.ts')
  const message = loads('src/ui/message.ts')
  const all = [...new Set([...first.files, ...message.files])]

  it('the first module of the page is small and pulls in nothing of the site', () => {
    expect(first.files).toEqual(['src/ui/boot.ts', 'src/ui/device.ts'])
    expect(first.packages).toEqual([])
  })
  it('the message pulls in no page, no stage, no sound, no picture of the site and no drawing library', () => {
    for (const f of all) {
      expect(f, f).not.toMatch(/^src\/(pages|stage|audio|table|boss|cursor|core|film|probe)\//)
      expect(f, f).not.toBe('src/main.ts')
      expect(f, f).not.toMatch(/\.(glb|ktx2|png|jpe?g|webp|mp3|ogg|wav)$/)
    }
    expect([...first.packages, ...message.packages].filter((p) => p === 'three' || p.startsWith('three/'))).toEqual([])
    console.log(`the message loads ${all.length} files: ${all.join(', ')}; packages: ${message.packages.join(', ') || 'none'}`)
  })
  it('the site itself is asked for in one place only, and only where the message is not', () => {
    const text = fs.readFileSync(path.join(root, 'src/ui/boot.ts'), 'utf8')
    expect(text.match(/import\('\.\.\/main'\)/g)?.length).toBe(1)
    expect(text.match(/import\('\.\/message'\)/g)?.length).toBe(1)
    expect(text).toMatch(/if \(messageOnly\(location\.search, touchOnly\(\)\)\) void import\('\.\/message'\)\s+else \{/)
  })
})
