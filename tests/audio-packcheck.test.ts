import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { comparePack, linesOverFullScale, listedFiles } from '../tools/lib/sound-packcheck.mjs'

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const files: Record<string, Buffer> = { 'sfx.bin': Buffer.from('short sounds'), 'room-tone.flac': Buffer.from('a loop'), 'line.a.0.mp3': Buffer.from('a line') }
const index = () => ({
  version: 1,
  pack: { file: 'sfx.bin', bytes: files['sfx.bin']!.length, sha256: sha(files['sfx.bin']!) },
  sfx: [{ id: 'step.1', at: 0, bytes: 12, seconds: 0.1, mime: 'audio/flac' }],
  loops: [{ id: 'room-tone', file: 'room-tone.flac', seconds: 1, mime: 'audio/flac', bytes: files['room-tone.flac']!.length, sha256: sha(files['room-tone.flac']!) }],
  lines: [{ id: 'line.a.0', file: 'line.a.0.mp3', seconds: 1, mime: 'audio/mpeg', bytes: files['line.a.0.mp3']!.length, sha256: sha(files['line.a.0.mp3']!) }]
})

describe('the check of the pack against the committed index', () => {
  let dir = ''
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'pack-'))
    for (const [name, bytes] of Object.entries(files)) writeFileSync(path.join(dir, name), bytes)
    writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index(), null, 2))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('lists the packed file, the loops and the lines', () => {
    expect(listedFiles(index()).map((f: { file: string }) => f.file)).toEqual(['sfx.bin', 'room-tone.flac', 'line.a.0.mp3'])
  })

  it('passes a folder that holds exactly the listed files', () => {
    expect(comparePack(dir, index())).toEqual({ files: 3, problems: [] })
  })

  it('names a file that is missing', () => {
    rmSync(path.join(dir, 'line.a.0.mp3'))
    expect(comparePack(dir, index()).problems).toEqual(['missing: line.a.0.mp3'])
  })

  it('names a file of another size and a file of the same size with other content', () => {
    writeFileSync(path.join(dir, 'sfx.bin'), Buffer.from('short'))
    writeFileSync(path.join(dir, 'room-tone.flac'), Buffer.from('b loop'))
    const p: string[] = comparePack(dir, index()).problems
    expect(p.length).toBe(2)
    expect(p[0]).toContain('different size: sfx.bin is 5 bytes, the index says 12')
    expect(p[1]).toContain('different content: room-tone.flac')
  })

  it('names a file the index does not list, an index that is not the committed one, and an empty folder', () => {
    writeFileSync(path.join(dir, 'old.mp3'), Buffer.from('x'))
    const other = index()
    other.lines[0]!.seconds = 2
    writeFileSync(path.join(dir, 'index.json'), JSON.stringify(other))
    expect(comparePack(dir, index()).problems).toEqual(['not in the index: old.mp3', 'different content: index.json in the folder is not the committed one'])
    const empty = mkdtempSync(path.join(tmpdir(), 'pack-'))
    expect(comparePack(empty, index()).problems).toEqual(['missing: sfx.bin', 'missing: room-tone.flac', 'missing: line.a.0.mp3', 'missing: index.json'])
    rmSync(empty, { recursive: true, force: true })
  })

  it('does not pass an index that carries no sha256', () => {
    const old = index()
    delete (old.pack as { sha256?: string }).sha256
    expect(comparePack(dir, old).problems).toEqual(['no sha256 in the index for sfx.bin: pack again with this tool', 'different content: index.json in the folder is not the committed one'])
  })
})

describe.skipIf(spawnSync('ffmpeg', ['-version']).status !== 0)('the check that a packed line decodes under full scale', () => {
  let dir = ''
  const line = (name: string, amplitude: number) => {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `aevalsrc=${amplitude}*sin(2*PI*220*t):s=48000:d=0.5`, '-c:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', path.join(dir, name)])
    expect(r.status).toBe(0)
    return { id: name.replace('.mp3', ''), file: name, seconds: 0.5, mime: 'audio/mpeg' }
  }
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'pack-'))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('passes lines under full scale and says which is the largest', () => {
    const r = linesOverFullScale(dir, { lines: [line('line.a.0.mp3', 0.25), line('line.b.0.mp3', 0.5)] })
    expect(r.problems).toEqual([])
    expect(r.lines).toBe(2)
    expect(r.largest?.file).toBe('line.b.0.mp3')
    expect(r.largest?.db ?? 0).toBeGreaterThan(-7)
    expect(r.largest?.db ?? 0).toBeLessThan(-5)
  })

  it('names a line that decodes over full scale, and a file that is no sound', () => {
    const lines = [line('line.a.0.mp3', 0.5), line('line.loud.0.mp3', 1.3)]
    writeFileSync(path.join(dir, 'line.bad.0.mp3'), Buffer.from('a line'))
    const r = linesOverFullScale(dir, { lines: [...lines, { id: 'line.bad.0', file: 'line.bad.0.mp3' }] })
    expect(r.problems.length).toBe(2)
    expect(r.problems[0]).toMatch(/^over full scale: line\.loud\.0\.mp3 decodes with its largest sample at \+[12]\.\d\d dB/)
    expect(r.problems[1]).toBe('cannot be decoded: line.bad.0.mp3')
  })
})
