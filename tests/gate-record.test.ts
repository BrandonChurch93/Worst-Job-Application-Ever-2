import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ANCHORS, hashOfBytes, recordedAgain, resolveCommit, showAt } from '../tools/lib/gate-checks.mjs'

const root = path.resolve(__dirname, '..')
const anchors = ANCHORS.map((c: string) => resolveCommit(root, c))
const here = anchors.every(Boolean)
const register = (parts: unknown[]) => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gate-record-')), 'PARTS.json')
  fs.writeFileSync(file, JSON.stringify({ parts }))
  return file
}
const record = (file: string, ...argv: string[]) => spawnSync('node', ['tools/parts.mjs', '--register', file, ...argv], { cwd: root, encoding: 'utf8' })
const blank = (name: string, o = {}) => ({ name, unit: 'step1', state: 'stand-in', files: [], standInHash: '', commit: '', ...o })

describe.skipIf(!here)('npm run parts -- --record', () => {
  it('records each file as it was at the latest commit in which every part was a stand-in', () => {
    const file = register([blank('materials'), blank('other')])
    const r = record(file, '--record', 'materials', '--files', 'src/shell/real/ground.ts,src/shell/materials.ts')
    expect(r.status).toBe(0)
    const [p, other] = JSON.parse(fs.readFileSync(file, 'utf8')).parts
    expect(p.files).toEqual(['src/shell/materials.ts', 'src/shell/real/ground.ts'])
    expect(p.hashAt).toEqual({ 'src/shell/materials.ts': anchors[0], 'src/shell/real/ground.ts': anchors[0] })
    expect(p.standInHash).toBe(hashOfBytes(p.files, (f: string) => showAt(root, p.hashAt[f], f)))
    expect(recordedAgain(p, (c: string, f: string) => showAt(root, c, f))).toBe(p.standInHash)
    expect(p.state).toBe('stand-in')
    expect(other).toEqual(blank('other'))
  })
  it('records a file that was in none of the commits as absent, and says so', () => {
    const file = register([blank('page-turn')])
    const r = record(file, '--record', 'page-turn', '--files', 'tools/lib/gate-checks.mjs')
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/in none of the commits .* recorded as absent/)
    const [p] = JSON.parse(fs.readFileSync(file, 'utf8')).parts
    expect(p.hashAt).toEqual({ 'tools/lib/gate-checks.mjs': 'absent' })
    expect(p.standInHash).toBe(hashOfBytes(p.files, () => Buffer.alloc(0)))
    expect(recordedAgain(p, (c: string, f: string) => showAt(root, c, f))).toBe(p.standInHash)
  })
  it('refuses a file that is not there, a part that is not there and no files', () => {
    const file = register([blank('materials')])
    const before = fs.readFileSync(file, 'utf8')
    expect(record(file, '--record', 'materials', '--files', 'src/no/such.ts').stderr).toMatch(/not a file of this tree/)
    expect(record(file, '--record', 'nothing', '--files', 'src/shell/materials.ts').stderr).toMatch(/no part called/)
    expect(record(file, '--record', 'materials').status).toBe(1)
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
  })
  it('leaves a recorded hash alone unless it is told to replace it', () => {
    const file = register([blank('shell', { files: ['src/shell/parts.ts'], standInHash: 'f'.repeat(64) })])
    expect(record(file, '--record', 'shell', '--files', 'src/shell/materials.ts').status).toBe(1)
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).parts[0].standInHash).toBe('f'.repeat(64))
    expect(record(file, '--record', 'shell', '--files', 'src/shell/materials.ts', '--replace').status).toBe(0)
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).parts[0].files).toEqual(['src/shell/materials.ts'])
  })
  it('keeps the commits of a record when the state is set', () => {
    const file = register([blank('materials')])
    record(file, '--record', 'materials', '--files', 'src/shell/materials.ts')
    expect(record(file, '--set', 'materials', '--state', 'finished').status).toBe(0)
    const p = JSON.parse(fs.readFileSync(file, 'utf8')).parts[0]
    expect(p.state).toBe('finished')
    expect(p.hashAt).toEqual({ 'src/shell/materials.ts': anchors[0] })
  })
})
