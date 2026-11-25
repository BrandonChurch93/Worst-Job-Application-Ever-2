import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config, configProblems } from '../src/config'
import { eventCues } from '../src/audio/cues'
import { approvedFiles } from '../tools/lib/hashes.mjs'

const named = [...new Set([...config.keys.map((k) => k.image), ...config.sheets.map((s) => s.image), ...Object.values(config.references.approved)])]
const lines = (approved: string[] | null) => configProblems(config, { approved, eventCues }).filter((p) => p.includes('the approved image'))

describe('the approved images at startup', () => {
  it('lists the folder where it exists and gives null where it does not', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'approved-'))
    expect(approvedFiles(root)).toBe(null)
    fs.mkdirSync(path.join(root, 'references', 'approved'), { recursive: true })
    expect(approvedFiles(root)).toEqual([])
    fs.writeFileSync(path.join(root, 'references', 'approved', 'b.png'), 'x')
    fs.writeFileSync(path.join(root, 'references', 'approved', 'a.jpg'), 'x')
    fs.writeFileSync(path.join(root, 'references', 'approved', 'MANIFEST.sha256'), 'x')
    expect(approvedFiles(root)).toEqual(['references/approved/a.jpg', 'references/approved/b.png'])
    fs.rmSync(root, { recursive: true })
  })
  it('with the folder there and one image missing, names that image', () => {
    const gone = named[0]!
    expect(lines(named.filter((f) => f !== gone))).toEqual([`config: the approved image "${gone}" is missing`])
  })
  it('with the folder there and empty, names every image the config holds', () => {
    expect(lines([])).toHaveLength(named.length)
    expect(named.length).toBeGreaterThan(0)
  })
  it('with the folder there and whole, has nothing to say', () => {
    expect(lines(named)).toEqual([])
  })
  it('with the folder absent, as on the host, has nothing to say about images and still checks the rest', () => {
    expect(lines(null)).toEqual([])
    const broken = { ...eventCues, 'made-up-event': 'no-such-cue' }
    const found = configProblems(config, { approved: null, eventCues: broken })
    expect(found.filter((p) => p.includes('made-up-event'))).toHaveLength(1)
  })
  it('in this repo the folder is there and holds every image the config names', () => {
    const here = approvedFiles(path.resolve(__dirname, '..'))
    expect(here).not.toBe(null)
    expect(lines(here)).toEqual([])
  })
})
