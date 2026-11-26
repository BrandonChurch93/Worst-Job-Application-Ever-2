import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { fileOfUrl, filesOf, firstLoad, ignoredFolders, megabytes, sentBytes, verdict } from '../tools/lib/film-host.mjs'

const root = path.resolve(__dirname, '..')
const host = { maxShippedMb: 95, maxFileMb: 20, firstLoadMaxMb: 16, maxBuildMinutes: 20 }

describe('what is measured', () => {
  it('lists every file under a folder, largest first', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'host-'))
    fs.mkdirSync(path.join(dir, 'bundle'))
    fs.writeFileSync(path.join(dir, 'index.html'), 'x'.repeat(10))
    fs.writeFileSync(path.join(dir, 'bundle', 'a.js'), 'x'.repeat(300))
    fs.writeFileSync(path.join(dir, 'bundle', 'b.js'), 'x'.repeat(20))
    expect(filesOf(dir)).toEqual([{ file: 'bundle/a.js', bytes: 300 }, { file: 'bundle/b.js', bytes: 20 }, { file: 'index.html', bytes: 10 }])
    expect(filesOf(path.join(dir, 'gone'))).toEqual([])
    fs.rmSync(dir, { recursive: true })
  })
  it('counts a megabyte as 1048576 bytes', () => {
    expect(megabytes(1048576)).toBe(1)
    expect(megabytes(20 * 1048576 + 1048)).toBe(20.001)
  })
  it('reads the folders the host never gets', () => {
    expect(ignoredFolders('assets-full/\n# a note\n\n/audio/\nout\n*.log\n!keep\n')).toEqual(['assets-full', 'audio', 'out'])
    const mine = ignoredFolders(fs.readFileSync(path.join(root, '.vercelignore'), 'utf8'))
    for (const f of ['assets-full', 'audio', 'references', 'out']) expect(mine).toContain(f)
    expect(mine).not.toContain('src')
    expect(mine).not.toContain('public')
  })
  it('keeps every folder of .vercelignore at the root of the repo, so the sound of public/audio/ is shipped', () => {
    const lines = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    expect(lines.sort()).toEqual(['/assets-full/', '/audio/', '/out/', '/pipeline/', '/references/', '/scorecards/'])
    for (const l of lines) expect(l.startsWith('/'), l).toBe(true)
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
    expect(vercel.buildCommand).toBe('npm run build')
    expect(vercel.outputDirectory).toBe('dist')
    const long = vercel.headers.find((h: { source: string }) => h.source === '/bundle/(.*)')
    expect(long.headers[0].value).toContain('immutable')
  })
  it('names the file a URL of the site asks for', () => {
    expect(fileOfUrl('http://127.0.0.1:5000/', 'http://127.0.0.1:5000')).toBe('index.html')
    expect(fileOfUrl('http://127.0.0.1:5000/bundle/a%20b.js?v=2', 'http://127.0.0.1:5000')).toBe('bundle/a b.js')
    expect(fileOfUrl('https://fonts.example/x.woff2', 'http://127.0.0.1:5000')).toBe(null)
  })
  it('compresses text and leaves the rest', () => {
    const text = Buffer.from('abc'.repeat(1000))
    expect(sentBytes('bundle/a.js', text.length, () => text)).toBe(zlib.gzipSync(text, { level: 9 }).length)
    expect(sentBytes('audio/a.mp3', 5000, () => text)).toBe(5000)
  })
})

describe('the first load', () => {
  const origin = 'http://127.0.0.1:5000'
  const sizes: Record<string, number> = { 'index.html': 100, 'bundle/a.js': 4000, 'fonts/f.json': 700 }
  const sizeOf = (f: string) => sizes[f] ?? null
  it('counts each file once and sums the bytes', () => {
    const r = firstLoad([`${origin}/`, `${origin}/bundle/a.js`, `${origin}/bundle/a.js`, `${origin}/fonts/f.json`, 'data:image/png;base64,AAAA', 'blob:x'], origin, sizeOf)
    expect(r.files).toEqual([{ file: 'bundle/a.js', bytes: 4000 }, { file: 'fonts/f.json', bytes: 700 }, { file: 'index.html', bytes: 100 }])
    expect(r.bytes).toBe(4800)
    expect(r.missing).toEqual([])
    expect(r.elsewhere).toEqual([])
  })
  it('names what is asked for and not shipped, and what is asked from elsewhere', () => {
    const r = firstLoad([`${origin}/`, `${origin}/assets-full/x.glb`, 'https://cdn.example/lib.js'], origin, sizeOf)
    expect(r.missing).toEqual(['assets-full/x.glb'])
    expect(r.elsewhere).toEqual(['https://cdn.example/lib.js'])
    expect(r.bytes).toBe(100)
  })
})

describe('the verdict', () => {
  const inside = { shippedMb: 5.3, largestMb: 4.2, firstLoadMb: 5.3, buildMinutes: 0.1 }
  it('is inside when every measure is at or under its limit', () => {
    expect(verdict(inside, host).inside).toBe(true)
    expect(verdict({ shippedMb: 95, largestMb: 20, firstLoadMb: 16, buildMinutes: 20 }, host).inside).toBe(true)
    expect(verdict(inside, host).rows.map((r: { name: string }) => r.name)).toEqual(['host.maxShippedMb', 'host.maxFileMb', 'host.firstLoadMaxMb', 'host.maxBuildMinutes'])
  })
  it('is outside when one measure is over, and names it', () => {
    for (const [key, name] of [['shippedMb', 'host.maxShippedMb'], ['largestMb', 'host.maxFileMb'], ['firstLoadMb', 'host.firstLoadMaxMb'], ['buildMinutes', 'host.maxBuildMinutes']] as const) {
      const v = verdict({ ...inside, [key]: 96 }, host)
      expect(v.inside).toBe(false)
      expect(v.rows.filter((r: { inside: boolean }) => !r.inside).map((r: { name: string }) => r.name)).toEqual([name])
    }
  })
  it('is outside when a measure could not be taken', () => {
    const v = verdict({ ...inside, firstLoadMb: null }, host)
    expect(v.inside).toBe(false)
    expect(v.rows[2]).toMatchObject({ got: null, inside: false })
  })
})
