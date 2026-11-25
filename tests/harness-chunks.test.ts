import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { chunksFrom, chunksTo, makeContext } from '../tools/lib/film-render.mjs'

const root = path.resolve(__dirname, '..')
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-chunks-'))
const format = { id: 'preview', ...cfg.formats.preview }
const context = (name: string) => makeContext({ cfg, format, tier: 'draft', mbps: 4, root: path.join(tmp, name) })
const sha = (file: string) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function put(dir: string, name: string, bytes: string) {
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, name)
  fs.writeFileSync(file, bytes)
  fs.writeFileSync(file.replace(/\.mp4$/, '.json'), JSON.stringify({ sha256: sha(file) }))
  return file
}

afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('chunks carried from one machine to another', () => {
  it('go out as whole chunks, and as loose pieces for a page that is not whole', () => {
    const here = context('here')
    put(here.dirs.chunks, 'boss-preview-draft.mp4', 'a whole page')
    put(here.dirs.pieces, 'boss-006540-007018-preview-draft.mp4', 'a piece of a whole page')
    put(here.dirs.pieces, 'step1-000840-001318-preview-draft.mp4', 'a piece of a page that is not whole')
    fs.writeFileSync(path.join(here.dirs.chunks, 'step2-preview-draft.part.mp4'), 'half written')
    const out = path.join(tmp, 'carried')
    expect(chunksTo(here, out)).toEqual({ chunks: 1, pieces: 1 })
    expect(fs.readdirSync(out).sort()).toEqual(['boss-preview-draft.json', 'boss-preview-draft.mp4', 'pieces'])
    expect(fs.readdirSync(path.join(out, 'pieces')).sort()).toEqual(['step1-000840-001318-preview-draft.json', 'step1-000840-001318-preview-draft.mp4'])
    expect(chunksTo(here, out).chunks).toBe(0)
  })

  it('come in only when the file is the one its record names', () => {
    const out = path.join(tmp, 'carried')
    const there = context('there')
    expect(chunksFrom(there, out)).toEqual({ taken: 2, bad: [] })
    expect(fs.existsSync(path.join(there.dirs.chunks, 'boss-preview-draft.mp4'))).toBe(true)
    expect(fs.existsSync(path.join(there.dirs.pieces, 'step1-000840-001318-preview-draft.json'))).toBe(true)
    fs.writeFileSync(path.join(out, 'boss-preview-draft.mp4'), 'not the same bytes')
    fs.writeFileSync(path.join(out, 'pinball-preview-draft.mp4'), 'no record')
    const again = chunksFrom(context('elsewhere'), out)
    expect(again.taken).toBe(1)
    expect(again.bad.length).toBe(2)
    expect(() => chunksFrom(there, path.join(tmp, 'nowhere'))).toThrow(/no folder/)
  })
})
