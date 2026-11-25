import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { bareFloor, distanceSquared, edgeCount, exitCode, grouped, highFrequencyEnergy, isTierCamera, lines, m1, m10, m2, m3, m4, m5, m6, m7, m8, m9, measuresOf, notYet, restAndKeys, result, stillsOf, tierCameras } from '../tools/lib/measure-core.mjs'

const root = path.resolve(__dirname, '..')
const c = JSON.parse(fs.readFileSync(path.join(root, 'config/showcase.json'), 'utf8'))

type Cursor = { x: number; y: number; heightPx: number; screenHeightPx: number; worldScale: number; acting: string; damage: string[]; arms: boolean; onPage: boolean; inBall: boolean; ballScreenPx: number }
const cursor = (o: Partial<Cursor> = {}): Cursor => ({ x: 960, y: 540, heightPx: c.cursor.heightPxAt1080, screenHeightPx: c.cursor.heightPxAt1080, worldScale: 1, acting: 'plain', damage: [], arms: false, onPage: true, inBall: false, ballScreenPx: 0, ...o })
const part = (o: Record<string, unknown> = {}) => ({ id: 'a', kind: 'panel', planned: [100, 100, 200, 80], drawn: [100, 100, 200, 80], plannedHeight: null, height: 0, mechanism: false, ...o })
const run = (o: Record<string, unknown> = {}) => ({ key: 'copy:a', text: 'A', box: [0, 0, 100, 20], px: c.layout.minTextPx, contrast: c.layout.minTextContrast, ...o })
const still = (o: { layout?: unknown[]; type?: unknown[]; cursor?: Cursor; name?: string; camera?: string } = {}) => ({ name: o.name ?? 'still:x', camera: o.camera ?? 'home', state: { layout: o.layout ?? [], type: o.type ?? [], cursor: o.cursor ?? cursor() } })

describe('which measures and which stills a unit gets', () => {
  it('gives the pages M1 to M7 and M9, the pinball page M8 and M10 as well, and the film M7 alone', () => {
    expect(measuresOf('step1', c)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M9'])
    expect(measuresOf('pinball', c)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'])
    expect(measuresOf('film', c)).toEqual(['M7'])
    expect(() => measuresOf('nowhere', c)).toThrow()
  })

  it('takes the keys, the stills and the sheets of the unit from the config', () => {
    for (const u of c.film.units) {
      const list = stillsOf(u.id, c, 'draft')
      const want = c.keys.filter((k: { unit: string }) => k.unit === u.id).length + c.stills.filter((k: { unit: string }) => k.unit === u.id).length + c.sheets.filter((k: { unit: string }) => k.unit === u.id).length
      expect(list.length).toBe(want)
      for (const s of list) expect(s.spec.tier).toBe('draft')
      expect(restAndKeys(list).every((s: { kind: string; rest: boolean }) => s.kind === 'key' || s.rest)).toBe(true)
      expect(restAndKeys(list).some((s: { kind: string }) => s.kind === 'sheet')).toBe(false)
    }
  })

  it('names one tier camera for each tier, the first tier from the highest camera', () => {
    const t = tierCameras(c)
    expect(t.map((x: { tier: string }) => x.tier)).toEqual(c.table.tiers)
    expect(t[0].camera).toBe(`tier-${c.table.tiers.length}`)
    expect(isTierCamera('tier-1', c)).toBe(true)
    expect(isTierCamera('home', c)).toBe(false)
    for (const x of t) expect(c.cameras[x.camera]).toBeDefined()
  })
})

describe('M1, sanity', () => {
  const hd = c.formats.hd
  it('is green for a clean picture with a full edge and the cursor in the frame', () => {
    const r = m1([{ name: 's', camera: 'home', invalidValues: 0, edge: { pixels: 100, bare: 0 }, cursor: cursor() }], c)
    expect(r.status).toBe('pass')
  })
  it('is red for one invalid value', () => {
    const r = m1([{ name: 's', camera: 'home', invalidValues: 1, edge: { pixels: 100, bare: 0 }, cursor: cursor() }], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].value).toBe(1)
  })
  it('is red when the ground shows on the edge of a still from home, and does not look at the edge from another camera', () => {
    expect(m1([{ name: 's', camera: 'home', invalidValues: 0, edge: { pixels: 100, bare: 3 }, cursor: cursor() }], c).status).toBe('fail')
    expect(m1([{ name: 's', camera: 'table-wide', invalidValues: 0, edge: { pixels: 100, bare: 3 }, cursor: cursor() }], c).status).toBe('pass')
  })
  it('is red when the cursor is on the page and outside the frame, and green when it is off the page', () => {
    expect(m1([{ name: 's', camera: 'home', invalidValues: 0, edge: null, cursor: cursor({ x: hd.width + 1 }) }], c).status).toBe('fail')
    expect(m1([{ name: 's', camera: 'home', invalidValues: 0, edge: null, cursor: cursor({ y: -1 }) }], c).status).toBe('fail')
    expect(m1([{ name: 's', camera: 'home', invalidValues: 0, edge: null, cursor: cursor({ y: -1, onPage: false }) }], c).status).toBe('pass')
  })
})

describe('M2, texture detail', () => {
  const limit = c.detail.maxSoftPixelFraction
  it('is not yet made when nothing is textured', () => {
    const r = m2([{ name: 's', texels: { textured: 0, counted: 0, soft: 0 } }], c)
    expect(r.status).toBe('notyet')
    expect(m2([], c).status).toBe('notyet')
  })
  it('is green at the limit and red over it', () => {
    expect(m2([{ name: 's', texels: { textured: 10000, counted: 10000, soft: Math.floor(10000 * limit) } }], c).status).toBe('pass')
    const r = m2([{ name: 's', texels: { textured: 10000, counted: 10000, soft: Math.floor(10000 * limit) + 1 } }], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].limit).toBe(limit)
  })
  it('counts only what is in focus', () => {
    expect(m2([{ name: 's', texels: { textured: 10000, counted: 100, soft: 100 } }], c).status).toBe('fail')
    expect(m2([{ name: 's', texels: { textured: 10000, counted: 0, soft: 0 } }], c).status).toBe('pass')
  })
})

describe('M3, real sharpness', () => {
  const least = c.detail.minSharpnessRatio
  it('is green at the least ratio and red under it', () => {
    expect(m3([{ name: 'key:a', still: least, approved: 1 }], c).status).toBe('pass')
    const r = m3([{ name: 'key:a', still: least - 0.01, approved: 1 }], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].still).toBe('key:a')
  })
  it('is not yet made without a key', () => {
    expect(m3([], c).status).toBe('notyet')
  })
  it('finds more energy in a picture with fine detail than in a flat one, and none in a flat one', () => {
    const w = 16
    const flat = new Uint8Array(w * w * 3).fill(128)
    const fine = new Uint8Array(w * w * 3)
    for (let i = 0; i < w * w; i++) fine.fill(((i % w) + Math.floor(i / w)) % 2 ? 255 : 0, i * 3, i * 3 + 3)
    expect(highFrequencyEnergy(flat, w, w, 3)).toBe(0)
    expect(highFrequencyEnergy(fine, w, w, 3)).toBeGreaterThan(1)
  })
})

describe('M4, readable type', () => {
  it('is green at the least size and the least contrast', () => {
    expect(m4([still({ type: [run()] })], c).status).toBe('pass')
  })
  it('is red for a run under layout.minTextPx, and names the still, the run and the number', () => {
    const r = m4([still({ name: 'key:k', type: [run(), run({ key: 'copy:small', px: c.layout.minTextPx - 1 })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing).toHaveLength(1)
    expect(r.failing[0]).toMatchObject({ still: 'key:k', run: 'copy:small', value: c.layout.minTextPx - 1, limit: c.layout.minTextPx })
  })
  it('is red for a run under layout.minTextContrast', () => {
    const r = m4([still({ type: [run({ contrast: c.layout.minTextContrast - 0.1 })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].limit).toBe(c.layout.minTextContrast)
  })
  it('is not yet made when there is no type to read', () => {
    expect(m4([still()], c).status).toBe('notyet')
  })
})

describe('M5, layout', () => {
  const tol = c.layout.tolerancePx
  it('is green at the tolerance', () => {
    expect(m5([still({ layout: [part({ drawn: [100 + tol, 100, 200, 80] })] })], c).status).toBe('pass')
  })
  it('is red for a part moved by more than the tolerance', () => {
    const r = m5([still({ layout: [part(), part({ id: 'b', drawn: [100, 100 + tol + 1, 200, 80] })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing).toHaveLength(1)
    expect(r.failing[0]).toMatchObject({ part: 'b', value: tol + 1, limit: tol })
  })
  it('is red for a part of the wrong size, by the edge that is off', () => {
    const r = m5([still({ layout: [part({ drawn: [100, 100, 200 + tol + 3, 80] })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].what).toContain('right')
  })
})

describe('M6, the cursor\'s size', () => {
  const tol = c.cursor.sizeTolerancePx
  const ball = c.table.ballPx
  const len = ball * c.table.cursorInBallFraction
  it('is green for the cursor at its height from home, and red when it is off by more than the tolerance', () => {
    expect(m6([still({ cursor: cursor({ heightPx: c.cursor.heightPxAt1080 + tol }) })], c).status).toBe('pass')
    expect(m6([still({ cursor: cursor({ heightPx: c.cursor.heightPxAt1080 + tol + 1 }) })], c).status).toBe('fail')
  })
  it('reads the ball and the cursor in the picture from a tier camera', () => {
    const good = cursor({ inBall: true, ballScreenPx: ball, screenHeightPx: len })
    expect(m6([still({ camera: 'tier-2', cursor: good })], c).status).toBe('pass')
    expect(m6([still({ camera: 'tier-2', cursor: { ...good, ballScreenPx: ball + tol + 1 } })], c).status).toBe('fail')
    expect(m6([still({ camera: 'tier-2', cursor: { ...good, screenHeightPx: len - tol - 1 } })], c).status).toBe('fail')
    expect(m6([still({ camera: 'tier-2', cursor: cursor() })], c).status).toBe('fail')
  })
  it('does not judge a still from another camera, or one with the cursor off the page', () => {
    expect(m6([still({ camera: 'table-wide', cursor: cursor({ heightPx: 10 }) })], c).status).toBe('notyet')
    expect(m6([still({ cursor: cursor({ heightPx: 10, onPage: false }) })], c).status).toBe('notyet')
  })
})

describe('M7, contact', () => {
  const quiet = (index: number, o: Partial<Cursor> = {}) => ({ index, beat: 'b', cursor: cursor(o), events: [] as { name: string; x: number; y: number; hitsCursor: boolean }[] })
  const hit = (index: number, x: number, y: number, o: Partial<Cursor> = {}) => ({ ...quiet(index, o), events: [{ name: 'bolt', x, y, hitsCursor: true }] })
  it('is green for a hit at the cursor that changes its acting on the next frame', () => {
    const r = m7([quiet(9), hit(10, 970, 545), quiet(11, { acting: 'shocked' })], 10, 11)
    expect(r.status).toBe('pass')
    expect(r.numbers.hits).toBe(1)
  })
  it('is green when the damage changes on the frame of the hit', () => {
    expect(m7([quiet(9), hit(10, 960, 540, { damage: ['burn'] }), quiet(11, { damage: ['burn'] })], 10, 11).status).toBe('pass')
  })
  it('is red for a hit further from the cursor than its own height in the picture', () => {
    const far = c.cursor.heightPxAt1080 + 1
    const r = m7([quiet(9), hit(10, 960 + far, 540), quiet(11, { acting: 'shocked' })], 10, 11)
    expect(r.status).toBe('fail')
    expect(r.failing[0]).toMatchObject({ frame: 10, event: 'bolt', value: far, limit: c.cursor.heightPxAt1080 })
  })
  it('is red for a hit the cursor does not answer', () => {
    const r = m7([quiet(9), hit(10, 960, 540), quiet(11)], 10, 11)
    expect(r.status).toBe('fail')
    expect(r.failing[0].what).toContain('does not change')
  })
  it('does not judge an event that does not strike the cursor, or a frame outside the beats', () => {
    const miss = { ...quiet(10), events: [{ name: 'page-turn', x: 0, y: 0, hitsCursor: false }] }
    expect(m7([quiet(9), miss, quiet(11)], 10, 11).status).toBe('pass')
    expect(m7([hit(9, 0, 0), quiet(10), quiet(11)], 10, 11).status).toBe('pass')
  })
})

describe('M8, crowded tiers', () => {
  const least = c.table.minStandingPartsPerTier
  const limit = c.table.maxBareFraction
  it('is green with enough parts and little bare floor', () => {
    expect(m8([{ id: 'office', standingParts: least, still: 'key:tier-office', coverage: { floor: 1000, bare: Math.floor(1000 * limit) } }], c).status).toBe('pass')
  })
  it('is red with too few standing parts', () => {
    const r = m8([{ id: 'office', standingParts: least - 1, still: 'key:tier-office', coverage: { floor: 1000, bare: 0 } }], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0]).toMatchObject({ part: 'office', value: least - 1, limit: least })
  })
  it('is red with too much bare floor', () => {
    const r = m8([{ id: 'office', standingParts: least, still: 'key:tier-office', coverage: { floor: 1000, bare: Math.floor(1000 * limit) + 1 } }], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].limit).toBe(limit)
  })
  it('is not green when the coverage view could not be read', () => {
    expect(m8([{ id: 'office', standingParts: least, still: 'key:tier-office', coverage: null }], c).status).toBe('notyet')
    expect(m8([{ id: 'office', standingParts: least - 1, still: 'key:tier-office', coverage: null }], c).status).toBe('fail')
  })
  it('counts the floor further than a radius from anything marked', () => {
    const w = 21
    const kinds = new Uint8Array(w).fill(1)
    kinds[0] = 2
    kinds[20] = 0
    expect(bareFloor(kinds, w, 1, 5)).toEqual({ floor: 20, bare: 14 })
    const d = distanceSquared(Uint8Array.from([0, 0, 0, 0, 1, 0, 0, 0, 0]), 3, 3)
    expect([...d]).toEqual([2, 1, 2, 1, 0, 1, 2, 1, 2])
  })
})

describe('M9, one scale', () => {
  const sc = c.scale
  const tol = sc.tolerancePx
  const field = (o: Record<string, unknown> = {}) => part({ id: 'f', kind: 'field', drawn: [0, 0, 400, sc.sizes.field], plannedHeight: sc.heights.field, height: sc.heights.field, ...o })
  it('is green for a field of the size and the height the scale gives', () => {
    expect(m9([still({ layout: [field()] })], c).status).toBe('pass')
  })
  it('is red for a field of another height on the page', () => {
    const r = m9([still({ layout: [field({ drawn: [0, 0, 400, sc.sizes.field + tol + 1] })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0]).toMatchObject({ part: 'f', kind: 'field' })
  })
  it('is red for a part whose top is not at the height of its kind', () => {
    const r = m9([still({ layout: [part({ kind: 'card', plannedHeight: sc.heights.card, height: sc.heights.card + tol + 1 })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].value).toBe(sc.heights.card + tol + 1)
  })
  it('wants a progress button round and of the diameter the scale gives', () => {
    const d = sc.sizes.progressButton
    const good = part({ kind: 'progressButton', drawn: [0, 0, d, d], plannedHeight: sc.heights.progressButton, height: sc.heights.progressButton })
    expect(m9([still({ layout: [good] })], c).status).toBe('pass')
    expect(m9([still({ layout: [{ ...good, drawn: [0, 0, d + tol + 1, d] }] })], c).status).toBe('fail')
  })
  it('is red for a key whose short side is under scale.sizes.keycapMin, and lets a key travel down', () => {
    const key = part({ kind: 'keycap', drawn: [0, 0, 120, sc.sizes.keycapMin], plannedHeight: sc.heights.keycap, height: sc.heights.keycap })
    expect(m9([still({ layout: [key] })], c).status).toBe('pass')
    expect(m9([still({ layout: [{ ...key, height: sc.heights.keycap - sc.heights.keyTravel }] })], c).status).toBe('pass')
    expect(m9([still({ layout: [{ ...key, drawn: [0, 0, 120, sc.sizes.keycapMin - tol - 1] }] })], c).status).toBe('fail')
    expect(m9([still({ layout: [{ ...key, height: sc.heights.keycap - sc.heights.keyTravel - tol - 1 }] })], c).status).toBe('fail')
  })
  it('is red for a mechanism that stands lower than scale.heights.machineMinTop', () => {
    expect(m9([still({ layout: [part({ mechanism: true, height: sc.heights.machineMinTop })] })], c).status).toBe('pass')
    const r = m9([still({ layout: [part({ mechanism: true, height: sc.heights.machineMinTop - 1 })] })], c)
    expect(r.status).toBe('fail')
    expect(r.failing[0].what).toContain('mechanism')
  })
  it('does not check a part of another kind, or a still from another camera', () => {
    expect(m9([still({ layout: [part({ height: 500 })] })], c).status).toBe('notyet')
    expect(m9([still({ camera: 'film', layout: [field({ height: 99 })] })], c).status).toBe('notyet')
  })
})

describe('M10, ball paths', () => {
  const min = c.table.minClearanceBalls
  const tier = (id: string) => ({ id, standingParts: 30, inserts: c.table.insertsPerTier, dropTargets: 5, display: { box: [0, 0, 300, 70], charPx: c.layout.minTextPx } })
  const table = () => ({
    tiers: c.table.tiers.map(tier),
    openings: [
      { id: 'office.lift.door', tier: 'office', clearBalls: min },
      { id: 'street.lift.door', tier: 'street', clearBalls: min },
      { id: 'office.elbow', tier: 'office', clearBalls: min },
      { id: 'corporate.elbow', tier: 'corporate', clearBalls: min },
      { id: 'street.exit', tier: 'street', clearBalls: 2 }
    ],
    rails: [
      { id: 'lift.street', from: 'street.lift.door', to: 'office.elbow' },
      { id: 'lift.office', from: 'office.lift.door', to: 'corporate.elbow' },
      { id: 'drain', from: 'street.exit', to: 'outlet' }
    ],
    holds: [{ id: 'outlet', releases: true }],
    sealed: ['corporate.beach']
  })
  const clear = { status: 0, lines: ['paths: all clear'] }
  it('is green for a table in order whose balls all leave by the drain', () => {
    expect(m10(table(), c, {}, clear).status).toBe('pass')
  })
  it('is not green when the balls were not followed', () => {
    expect(m10(table(), c, {}, null).status).toBe('notyet')
  })
  it('is red for an opening narrower than table.minClearanceBalls', () => {
    const t = table()
    t.openings[4]!.clearBalls = min - 0.01
    const r = m10(t, c, {}, clear)
    expect(r.status).toBe('fail')
    expect(r.failing[0]).toMatchObject({ part: 'street.exit', limit: min })
  })
  it('is red for a rail that ends nowhere, and for one that leads into the sealed box', () => {
    const t = table()
    t.rails[2]!.to = 'nowhere'
    expect(m10(t, c, {}, clear).status).toBe('fail')
    const u = table()
    u.rails[2]!.to = 'corporate.beach'
    const r = m10(u, c, {}, clear)
    expect(r.status).toBe('fail')
    expect(r.failing[0].what).toContain('sealed')
  })
  it('is red for a lift without both doors and both elbows', () => {
    const t = table()
    t.openings.splice(0, 1)
    t.rails[1]!.from = 'office.elbow'
    const r = m10(t, c, {}, clear)
    expect(r.status).toBe('fail')
    expect(r.failing.some((f: { part: string }) => f.part === 'lift')).toBe(true)
  })
  it('is red for a hold that does not release, a tier short of an insert, and a display whose characters are too small in the still', () => {
    const t = table()
    t.holds[0]!.releases = false
    expect(m10(t, c, {}, clear).status).toBe('fail')
    const u = table()
    u.tiers[0]!.inserts = c.table.insertsPerTier - 1
    expect(m10(u, c, {}, clear).status).toBe('fail')
    const v = table()
    expect(m10(v, c, { [c.table.tiers[0]]: 0.5 }, clear).status).toBe('fail')
  })
  it('is red when npm run paths finds a ball at rest, and repeats what it printed', () => {
    const r = m10(table(), c, {}, { status: 1, lines: ['BALL     office.3: came to rest outside a hold (at 1, 2, after 3 s)', 'PROBLEM  ball office.3 came to rest outside a hold', 'paths: 1 problem'] })
    expect(r.status).toBe('fail')
    expect(r.failing).toHaveLength(1)
    expect(r.failing[0].what).toBe('ball office.3 came to rest outside a hold')
  })
})

describe('the picture helpers', () => {
  it('counts the pixels on the edge once each, and those of them that are bare', () => {
    const w = 5
    const h = 4
    const data = new Uint8Array(w * h * 3).fill(200)
    data.fill(0, 0, 3)
    data.fill(0, (1 * w + 2) * 3, (1 * w + 2) * 3 + 3)
    const e = edgeCount(data, w, h, 3, (r: number, g: number, b: number) => Math.max(r, g, b) < 100)
    expect(e).toEqual({ pixels: 2 * w + 2 * (h - 2), bare: 1 })
  })
})

describe('what is printed', () => {
  it('prints pass, FAIL or not yet, then each failing item on its own line', () => {
    expect(lines(result('M4', [], 'fine'))).toEqual(['pass  M4  fine'])
    expect(lines(notYet('M2', 'nothing is textured'))).toEqual(['not yet  M2  nothing is textured'])
    const red = lines(result('M4', [{ still: 'key:a', run: 'copy:x', text: 'Hello', what: 'height in page pixels', value: 12, limit: 14 }], 'one small'))
    expect(red[0]).toBe('FAIL  M4  one small')
    expect(red[1]).toContain('key:a')
    expect(red[1]).toContain('copy:x')
    expect(red[1]).toContain('12 against 14')
  })
  it('prints an item that fails in several stills once, and keeps them all in the record', () => {
    const items = ['key:a', 'key:b', 'still:c'].map((s) => ({ still: s, run: 'copy:x', what: 'contrast', value: 1, limit: 4.5 }))
    expect(grouped(items)).toHaveLength(1)
    expect(grouped(items)[0].still).toBe('key:a and 2 more stills')
    const r = result('M4', items, 'three')
    expect(lines(r)).toHaveLength(2)
    expect(r.failing).toHaveLength(3)
  })
  it('ends with 0 when all that ran is green, and 2 when one is red: a measure not yet made is neither', () => {
    expect(exitCode([result('M4', [], ''), notYet('M2', '')])).toBe(0)
    expect(exitCode([result('M4', [{ what: 'x', value: 1, limit: 0 }], ''), result('M5', [], '')])).toBe(2)
    expect(exitCode([notYet('M2', '')])).toBe(0)
  })
})
