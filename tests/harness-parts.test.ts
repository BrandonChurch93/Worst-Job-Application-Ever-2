import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseAst } from 'vite'
import { STATES, compare, filesOfParts, fill, flagsInCode, flagsInData, hashOf, isSource, scan, setState, templateTest } from '../tools/lib/film-parts.mjs'

const root = path.resolve(__dirname, '..')
const flags = (files: Record<string, string>) => flagsInCode(Object.entries(files).map(([file, text]) => ({ file, text })), parseAst)

describe('the flags a file carries', () => {
  it('reads a flag written on a shape and one put on an object', () => {
    const r = flags({ 'src/a.ts': `export const s = { id: 'x', part: 'dial' }\nconst m: any = {}\nm.userData.standIn = 'cursor-body'` })
    expect(r.flags).toEqual({ 'cursor-body': ['src/a.ts'], dial: ['src/a.ts'] })
  })
  it('follows a constant, a shorthand, a default and a fallback', () => {
    const r = flags({
      'src/a.ts': `const PART = 'opening'\nexport const s = { part: PART }\nconst part = 'boss-body'\nexport const t = { part }\nexport function walk(n: unknown, part = 'shell') { return { n, part } }\nexport const f = (o: { part?: string }) => ({ part: o.part ?? 'type' })`,
    })
    expect(Object.keys(r.flags)).toEqual(['boss-body', 'opening', 'shell', 'type'])
  })
  it('follows a parameter back to the calls that fill it, across files', () => {
    const r = flags({
      'src/draw.ts': `export function disc(out: unknown[], id: string, part: string) { out.push({ id, part }) }\nconst inner = (id: string, p: string) => disc([], id, p)\ninner('a', 'ramps')`,
      'src/page.ts': `import { disc } from './draw'\ndisc([], 'b', 'bumpers')\ndisc([], 'c', cond ? 'lift' : 'targets')`,
      'src/other.ts': `const disc = (a: unknown, b: string, c: string) => c\ndisc(0, 'x', 'not-a-flag')`,
    })
    expect(r.flags).toEqual({ bumpers: ['src/page.ts'], lift: ['src/page.ts'], ramps: ['src/draw.ts'], targets: ['src/page.ts'] })
  })
  it('takes no word that is not used as a flag', () => {
    const r = flags({ 'src/a.ts': `type Phase = 'slabs' | 'rest'\nconst label = 'shredder'\nexport const s = { partial: 'crank', name: label, part: 'Not A Name' }` })
    expect(r.flags).toEqual({})
  })
  it('keeps a name made at run time as a template', () => {
    const r = flags({ 'src/a.ts': 'export const m = (id: string) => ({ part: `model-${id}` })' })
    expect(r.templates).toEqual([{ file: 'src/a.ts', parts: ['model-', ''] }])
    expect(templateTest(r.templates[0].parts).test('model-hq')).toBe(true)
    expect(templateTest(r.templates[0].parts).test('remodel-hq')).toBe(false)
    expect(filesOfParts(['model-hq', 'dial'], r)).toEqual({ 'model-hq': ['src/a.ts'], dial: [] })
  })
  it('reads flags in data and knows what a source file is', () => {
    expect(flagsInData('{ "a": [{ "part": "slot" }, { "standIn": "rows" }, { "part": "Not this" }] }')).toEqual(['rows', 'slot'])
    expect(isSource('src/a.ts')).toBe(true)
    expect(isSource('src/a.test.ts')).toBe(false)
    expect(isSource('src/a.d.ts')).toBe(false)
  })
})

describe('the register', () => {
  const blank = (name: string, state = 'stand-in') => ({ name, unit: 'step1', state, files: [] as string[], standInHash: '', commit: '' })
  it('hashes names and bytes in the order given', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parts-'))
    fs.writeFileSync(path.join(dir, 'a.ts'), 'one')
    fs.writeFileSync(path.join(dir, 'b.ts'), 'two')
    const h = hashOf(dir, ['a.ts', 'b.ts'])
    expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(hashOf(dir, ['a.ts', 'b.ts'])).toBe(h)
    expect(hashOf(dir, ['b.ts', 'a.ts'])).not.toBe(h)
    fs.writeFileSync(path.join(dir, 'b.ts'), 'two.')
    expect(hashOf(dir, ['a.ts', 'b.ts'])).not.toBe(h)
    expect(hashOf(dir, [])).toBe('')
    expect(hashOf(dir, ['gone.ts'])).toBe(null)
    fs.rmSync(dir, { recursive: true })
  })
  it('fills an empty stand-in and never rewrites a recorded hash', () => {
    const reg = { parts: [blank('dial'), { ...blank('slot'), files: ['old.ts'], standInHash: 'recorded', commit: 'c0' }, blank('crank', 'finished'), blank('director')] }
    const files = { dial: ['a.ts'], slot: ['a.ts', 'b.ts'], crank: ['a.ts'], director: [] }
    const r = fill(reg, files, (l: string[]) => `hash:${l.join('+')}`, 'c1')
    expect(r.filled).toBe(1)
    expect(r.register.parts[0]).toEqual({ ...blank('dial'), files: ['a.ts'], standInHash: 'hash:a.ts', commit: 'c1' })
    expect(r.register.parts[1]).toEqual(reg.parts[1])
    expect(r.register.parts[2]).toEqual(reg.parts[2])
    expect(r.register.parts[3]).toEqual(reg.parts[3])
    expect(fill(r.register, files, () => 'other', 'c2').filled).toBe(0)
  })
  it('sets a state with its commit and keeps the hash', () => {
    const reg = { parts: [{ ...blank('dial'), files: ['a.ts'], standInHash: 'h', commit: 'c1' }] }
    expect(setState(reg, 'dial', 'finished', 'c9').parts[0]).toEqual({ ...reg.parts[0], state: 'finished', commit: 'c9' })
    expect(() => setState(reg, 'dial', 'done', 'c9')).toThrow(/not a state/)
    expect(() => setState(reg, 'nothing', 'finished', 'c9')).toThrow(/no part called/)
    expect(STATES).toEqual(['stand-in', 'fallback', 'general fallback', 'last resort', 'finished'])
  })
  it('names what the register and the code disagree on', () => {
    const reg = { parts: [blank('dial'), blank('director')] }
    const found = { flags: { dial: ['a.ts'], extra: ['b.ts'] }, templates: [{ file: 'c.ts', parts: ['model-', ''] }] }
    const d = compare(reg, filesOfParts(['dial', 'director'], found), found)
    expect(d.notCarried).toEqual(['director'])
    expect(d.notInRegister).toEqual(['extra'])
    expect(d.idleTemplates).toHaveLength(1)
  })
})

describe('the register of this repo', () => {
  const reg = JSON.parse(fs.readFileSync(path.join(root, 'parts/PARTS.json'), 'utf8'))
  const found = scan(root, parseAst) as { flags: Record<string, string[]>; templates: { file: string; parts: string[] }[] }
  it('finds the flags the pages are known to carry', () => {
    for (const n of ['shell', 'type', 'opening', 'boss-body', 'flippers', 'model-beach', 'cursor-body', 'keyboard']) expect(found.flags[n]?.length, n).toBeGreaterThan(0)
    expect(found.flags['boss-body']).toEqual(['src/boss/body.ts'])
    expect(found.flags.slabs).toEqual(['src/pages/step1/layout.ts'])
  })
  it('holds sorted files and a hash that was made from them for every part with a hash', () => {
    for (const p of reg.parts) {
      expect(STATES).toContain(p.state)
      expect([...p.files].sort()).toEqual(p.files)
      expect(Boolean(p.standInHash)).toBe(p.files.length > 0)
      if (p.standInHash) expect(p.standInHash).toMatch(/^[0-9a-f]{64}$/)
      if (p.standInHash) expect(p.commit).toMatch(/^[0-9a-f]{40}$/)
    }
  })
})
