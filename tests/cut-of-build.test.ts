import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { preparePages } from '../src/pages'
import { cutOfBuild, cutState, firstDifference, keptRecordsIn, keptSum, mixBuild, mixNow, mixOfTree, proveCutList, reasonsAgainstMix, sha256, stateOf } from '../tools/lib/cut-build.mjs'
import { reasonsFromSound } from '../tools/lib/film-keep.mjs'
import { soundHash } from '../tools/lib/hashes.mjs'
import { filmPlan as planOf } from '../tools/mix.mjs'

// The committed cut list once stood two days behind the build, and the effects of every preview were laid by it.
// So: the files of cut/ are what this build gives, no mix is laid by a list of another build, and no film is joined with a mix of another build.

const root = path.resolve(__dirname, '..')
const cfg: any = JSON.parse(readFileSync(path.join(root, 'config', 'showcase.json'), 'utf8'))
const filmPlan = planOf as (c: unknown, M: unknown, file?: string) => Promise<any>
const load = (file: string): Promise<any> => {
  if (file === '/src/film/cut.ts') return import('../src/film/cut')
  if (file === '/src/pages/index.ts') return import('../src/pages')
  if (file === '/src/stage/stage.ts') return import('../src/stage/stage')
  throw new Error(`the test loads no ${file}`)
}
const shaOf = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex')

let fresh: Awaited<ReturnType<typeof cutOfBuild>>
let tmp = ''
beforeAll(async () => {
  await preparePages()
  fresh = await cutOfBuild(load)
  tmp = mkdtempSync(path.join(tmpdir(), 'cut-'))
})
afterAll(() => rmSync(tmp, { recursive: true, force: true }))

describe('the files of cut/', () => {
  it('are, byte for byte, what this build gives: run npm run cut and commit cut/ when this fails', () => {
    expect(cutState(fresh.files, root)).toEqual([
      { name: 'cut/CUTLIST.json', state: 'equal' },
      { name: 'cut/CUES.md', state: 'equal' },
      { name: 'cut/SHOTS.md', state: 'equal' }
    ])
  })

  it('are told apart as absent, stale and equal', () => {
    const file = path.join(tmp, 'state.txt')
    expect(stateOf(file, 'a')).toBe('absent')
    writeFileSync(file, 'a')
    expect(stateOf(file, 'a')).toBe('equal')
    expect(stateOf(file, 'b')).toBe('stale')
  })
})

describe('the plan a mix is laid by', () => {
  const M = () => ({ load, copy: { timedLines: () => [] }, cues: { filmLineId: (b: string, i: number) => `line.${b}.${i}` } })

  it('is read from the committed cut list and carries the sum of that file', async () => {
    const file = path.join(root, 'cut', 'CUTLIST.json')
    const plan = await filmPlan(cfg, M(), file)
    expect(plan.source).toBe('cut/CUTLIST.json')
    expect(plan.cutSha256).toBe(shaOf(readFileSync(file)))
    expect(plan.events.length).toBe(fresh.list.events.length)
    expect(plan.lines.length).toBe(fresh.list.lines.length)
  })

  it('is refused when the list on disk holds one event on another frame', async () => {
    const list = JSON.parse(fresh.files[0][1])
    list.events[3].frame += 1
    const file = path.join(tmp, 'moved.json')
    writeFileSync(file, JSON.stringify(list, null, 2) + '\n')
    await expect(filmPlan(cfg, M(), file)).rejects.toThrow(/^the mix is refused: cut\/CUTLIST\.json is not the list this build gives now .*Run npm run cut in this tree, then the mix again$/)
    const e = fresh.list.events[3]
    await expect(proveCutList(load, file, 'the mix')).rejects.toThrow(`event 4 is ${e.name} at frame ${e.frame + 1} on disk and ${e.name} at frame ${e.frame} in the build`)
  })

  it('is told where it first parts from the build: an event, the count of events, a line, or elsewhere', () => {
    const list = JSON.parse(fresh.files[0][1])
    expect(firstDifference(list, fresh.list)).toBe('the events and the lines are the same, the difference lies elsewhere in the file')
    expect(firstDifference({ ...list, events: list.events.slice(0, 5) }, fresh.list)).toBe('the first 5 events are the same')
    expect(firstDifference({ ...list, lines: list.lines.slice(1) }, fresh.list)).toMatch(/^line 1 is /)
    expect(firstDifference({ ...list, lines: list.lines.slice(0, 2) }, fresh.list)).toBe('the events are the same, the lines are not')
    expect(firstDifference({}, fresh.list)).toBe('the first 0 events are the same')
  })

  it('is refused when the list on disk is the list of an older build with fewer events, and the refusal counts both', async () => {
    const list = JSON.parse(fresh.files[0][1])
    list.events = list.events.slice(0, 689)
    const file = path.join(tmp, 'older.json')
    writeFileSync(file, JSON.stringify(list, null, 2) + '\n')
    await expect(proveCutList(load, file, 'the mix')).rejects.toThrow(`it holds 689 events and ${list.lines.length} lines; the build gives ${fresh.list.events.length} events and ${fresh.list.lines.length} lines; the first 689 events are the same`)
  })

  it('is refused when the list on disk differs only in how it is written', async () => {
    const file = path.join(tmp, 'tight.json')
    writeFileSync(file, JSON.stringify(JSON.parse(fresh.files[0][1])))
    await expect(proveCutList(load, file, 'the mix')).rejects.toThrow(/is not the list this build gives now/)
  })

  it('gives the sum of the list when the list is the build\'s', async () => {
    const file = path.join(tmp, 'same.json')
    writeFileSync(file, fresh.files[0][1])
    expect(await proveCutList(load, file, 'the mix')).toBe(shaOf(fresh.files[0][1]))
  })
})

describe('the mix a film is joined with', () => {
  const build = { engine: 'e', pages: { step1: 'p1', pinball: 'p3' }, sound: 's' }
  const now = { wavSha256: 'w', cutSha256: 'c', build, keptSha256: 'k' }
  const record = (over: Record<string, unknown> = {}) => ({ sha256: 'w', cutSha256: 'c', keptSha256: 'k', build: { engine: 'e', pages: { step1: 'p1', pinball: 'p3' }, sound: 's' }, recordsWithNoFile: [], ...over })

  it('is taken when its record names this wav, this cut list, this build and these kept sounds', () => {
    expect(reasonsAgainstMix(record(), now)).toEqual([])
  })

  it('is refused with no record', () => {
    expect(reasonsAgainstMix(null, now)).toEqual(['it has no record beside it'])
  })

  it('is refused when the wav is another file than its record names', () => {
    expect(reasonsAgainstMix(record({ sha256: 'x' }), now)).toEqual(['the wav is not the file its record names (sha256 differs)'])
  })

  it('is refused when it was laid by another cut list, or when no cut list is here', () => {
    expect(reasonsAgainstMix(record({ cutSha256: 'x' }), now)).toEqual(['it was laid by another cut list than cut/CUTLIST.json holds now'])
    expect(reasonsAgainstMix(record(), { ...now, cutSha256: null })).toEqual(['cut/CUTLIST.json does not exist now'])
  })

  it('is refused when the engine, a page or the sound code changed, and names each', () => {
    expect(reasonsAgainstMix(record({ build: { ...build, engine: 'x' } }), now)).toEqual(['it is not of this build: the engine changed since it was made'])
    expect(reasonsAgainstMix(record({ build: { ...build, pages: { step1: 'p1', pinball: 'x' } } }), now)).toEqual(['it is not of this build: pinball changed since it was made'])
    expect(reasonsAgainstMix(record({ build: { ...build, sound: 'x' } }), now)).toEqual(['it is not of this build: the sound code changed since it was made'])
    expect(reasonsAgainstMix(record({ build: { engine: 'x', pages: {}, sound: 'x' } }), now)).toEqual(['it is not of this build: the engine, step1, pinball, the sound code changed since it was made'])
  })

  it('is refused when a kept sound was replaced or was missing when it was made', () => {
    expect(reasonsAgainstMix(record({ keptSha256: 'x' }), now)).toEqual(['the kept sounds have changed since it was made'])
    expect(reasonsAgainstMix(record({ recordsWithNoFile: ['step.1', 'step.2'] }), now)).toEqual(['it was made with 2 of the kept sounds missing from the tree'])
  })

  it('is refused when its record is of the time before these proofs, and says what the record lacks', () => {
    expect(reasonsAgainstMix({ sha256: 'w', planSha256: 'p' }, now)).toEqual([
      'its record does not name the cut list it was laid by',
      'its record does not name the build it was made in',
      'its record does not name the kept sounds it was made from'
    ])
  })

  it('has one sum over the kept sounds, whatever order they are read in, that changes with one take', () => {
    const a = [{ id: 'step.1', sha256: 'aa' }, { id: 'step.2', sha256: 'bb' }]
    expect(keptSum(a)).toBe(keptSum([a[1], a[0]]))
    expect(keptSum(a)).not.toBe(keptSum([a[0], { id: 'step.2', sha256: 'bc' }]))
    expect(keptSum(a)).not.toBe(keptSum([a[0]]))
    expect(keptSum(a)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('reads what the tree gives now from disk: the wav, the cut list, the build with the sound code, the kept records', () => {
    const wav = path.join(tmp, 'review.wav')
    writeFileSync(wav, 'not a wav, and that is enough for a sum')
    const n = mixNow(wav, root)
    expect(n.wavSha256).toBe(shaOf('not a wav, and that is enough for a sum'))
    expect(n.cutSha256).toBe(shaOf(readFileSync(path.join(root, 'cut', 'CUTLIST.json'))))
    expect(n.build).toEqual(mixBuild(root))
    expect(n.build.sound).toBe(soundHash(root))
    expect(n.build.sound).toMatch(/^[0-9a-f]{16}$/)
    expect(Object.keys(n.build.pages).sort()).toEqual(cfg.film.units.map((u: { id: string }) => u.id).sort())
    expect(n.keptSha256).toBe(keptSum(keptRecordsIn(path.join(root, 'audio', 'kept'))))
    expect(sha256(Buffer.from('a'))).toBe(shaOf('a'))
  })

  it('refuses a wav that lies in a tree with no record, and takes one whose record names everything the tree gives', () => {
    const wav = path.join(tmp, 'lone.wav')
    writeFileSync(wav, 'one')
    expect(mixOfTree(wav, root).reasons).toEqual(['it has no record beside it'])
    const n = mixNow(wav, root)
    writeFileSync(wav.replace(/\.wav$/, '.json'), JSON.stringify({ sha256: n.wavSha256, cutSha256: n.cutSha256, keptSha256: n.keptSha256, build: n.build, recordsWithNoFile: [] }))
    expect(mixOfTree(wav, root).reasons).toEqual([])
    writeFileSync(wav, 'two')
    expect(mixOfTree(wav, root).reasons).toEqual(['the wav is not the file its record names (sha256 differs)'])
    expect(existsSync(wav.replace(/\.wav$/, '.json'))).toBe(true)
  })
})

describe('a film with sound that is kept', () => {
  const nowSound = { cutSha256: 'c', keptSha256: 'k' }

  it('needs no mix when it is silent', () => {
    expect(reasonsFromSound({ sound: null }, nowSound)).toEqual([])
  })

  it('names the mix it was joined with', () => {
    expect(reasonsFromSound({ sound: 'audio/mix/review.wav' }, nowSound)).toEqual(['it has sound, and its record does not name the mix it was joined with (join it again with npm run film -- --join)'])
    expect(reasonsFromSound({ sound: 'audio/mix/review.wav', mix: { cutSha256: 'c', keptSha256: 'k' } }, nowSound)).toEqual([])
  })

  it('is refused when the cut list or the kept sounds have changed since its sound was mixed', () => {
    expect(reasonsFromSound({ sound: 'audio/mix/review.wav', mix: { cutSha256: 'x', keptSha256: 'k' } }, nowSound)).toEqual(['its sound was laid by another cut list than cut/CUTLIST.json holds now'])
    expect(reasonsFromSound({ sound: 'audio/mix/review.wav', mix: { cutSha256: 'c', keptSha256: 'x' } }, nowSound)).toEqual(['the kept sounds have changed since its sound was mixed'])
  })
})
