// The arithmetic of measures M1 to M10 of kit/07-QUALITY-BAR.md. Pure: every function takes what was read and the config, and gives one result.
// A result: { id, status: 'pass' | 'fail' | 'notyet', summary, numbers, failing }. Each failing item names the still, the part or the run, and the number against its limit.

export const MEASURES = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10']
export const PICTURE_MEASURES = ['M1', 'M2', 'M3', 'M8']

const r2 = (v) => Number(Number(v).toFixed(2))
const r4 = (v) => Number(Number(v).toFixed(4))

/** @param {string} id @param {any[]} failing @param {string} summary @param {Record<string, any>} [numbers] */
export const result = (id, failing, summary, numbers = {}) => ({ id, status: failing.length ? 'fail' : 'pass', summary, numbers, failing })
/** @param {string} id @param {string} why @param {Record<string, any>} [numbers] */
export const notYet = (id, why, numbers = {}) => ({ id, status: 'notyet', summary: why, numbers, failing: [] })

// Which measures a unit gets: the "Units" column of the table.
export function measuresOf(unit, c) {
  if (unit === 'film') return ['M7']
  if (!c.film.units.some((u) => u.id === unit)) throw new Error(`No unit called "${unit}"`)
  return MEASURES.filter((m) => (m === 'M8' || m === 'M10' ? unit === 'pinball' : true))
}

export const tierCameras = (c) => c.table.tiers.map((id, i) => ({ tier: id, camera: `tier-${c.table.tiers.length - i}` }))
export const isTierCamera = (camera, c) => tierCameras(c).some((t) => t.camera === camera)

// The stills of a unit, from the judged list of the config: its keys, its stills and its sheets.
export function stillsOf(unit, c, tier) {
  const out = []
  for (const k of c.keys) if (k.unit === unit) out.push({ name: `key:${k.id}`, kind: 'key', id: k.id, camera: k.camera, rest: false, image: k.image, spec: { page: k.unit, beat: k.beat, at: k.at, camera: k.camera, tier } })
  for (const s of c.stills) {
    if (s.unit !== unit) continue
    const spec = { page: s.unit, camera: s.camera, tier }
    for (const k of ['beat', 'at', 'scroll', 'interface', 'touchOnly']) if (s[k] !== undefined) spec[k] = s[k]
    out.push({ name: `still:${s.id}`, kind: 'still', id: s.id, camera: s.camera, rest: s.beat === undefined, spec })
  }
  for (const s of c.sheets) if (s.unit === unit) out.push({ name: `sheet:${s.id}`, kind: 'sheet', id: s.id, camera: s.camera || 'sheet', rest: false, spec: { page: s.unit, camera: s.camera || 'sheet', tier, sheet: s.id } })
  return out
}

// "Each page at rest and each key": what M4, M5 and M9 read.
export const restAndKeys = (stills) => stills.filter((s) => s.kind === 'key' || (s.kind === 'still' && s.rest))

// M1. stills: [{ name, camera, invalidValues, edge: { pixels, bare } | null, cursor }]
export function m1(stills, c) {
  const hd = c.formats.hd
  const failing = []
  let invalid = 0
  let edgePixels = 0
  let bare = 0
  let offFrame = 0
  let edgesRead = 0
  for (const s of stills) {
    invalid += s.invalidValues
    if (s.invalidValues !== 0) failing.push({ still: s.name, what: 'invalid or infinite values in the picture before tone and grade', value: s.invalidValues, limit: 0 })
    if (s.camera === 'home' && s.edge) {
      edgesRead++
      edgePixels += s.edge.pixels
      bare += s.edge.bare
      if (s.edge.bare > 0) failing.push({ still: s.name, what: 'pixels on the frame\'s edge that are neither page surface nor something standing on the page', value: s.edge.bare, limit: 0, of: s.edge.pixels })
    }
    const k = s.cursor
    if (k && k.onPage && (k.x < 0 || k.x > hd.width || k.y < 0 || k.y > hd.height)) {
      offFrame++
      failing.push({ still: s.name, what: 'the cursor is on the page and outside the frame', value: [r2(k.x), r2(k.y)], limit: [0, 0, hd.width, hd.height] })
    }
  }
  return result('M1', failing, `${stills.length} stills: ${invalid} invalid values; ${bare} bare of ${edgePixels} edge pixels in ${edgesRead} stills from home; the cursor outside the frame in ${offFrame}`, { stills: stills.length, invalidValues: invalid, edgePixels, bareEdgePixels: bare, stillsFromHome: edgesRead, cursorOutside: offFrame })
}

// M2. stills: [{ name, texels: { textured, counted, soft } }]. `counted` leaves out what a lens has out of focus.
export function m2(stills, c) {
  const limit = c.detail.maxSoftPixelFraction
  const failing = []
  let textured = 0
  let worst = 0
  for (const s of stills) {
    textured += s.texels.textured
    if (!s.texels.counted) continue
    const share = s.texels.soft / s.texels.counted
    worst = Math.max(worst, share)
    if (share > limit) failing.push({ still: s.name, what: `textured pixels with fewer than detail.minTexelsPerPixel (${c.detail.minTexelsPerPixel}) texels per screen pixel`, value: r4(share), limit, of: s.texels.counted })
  }
  if (!stills.length) return notYet('M2', 'no still of this unit was read in the texels view')
  if (textured === 0) return notYet('M2', `no textured pixel in any of the ${stills.length} stills: nothing in this unit carries a texture yet`, { stills: stills.length, texturedPixels: 0 })
  return result('M2', failing, `${stills.length} stills, ${textured} textured pixels: the largest soft share ${r4(worst)}, the most allowed ${limit}`, { stills: stills.length, texturedPixels: textured, worstSoftShare: r4(worst), limit })
}

// M3. keys: [{ name, still, approved }], each the high frequency energy of a picture at one size.
export function m3(keys, c) {
  const limit = c.detail.minSharpnessRatio
  const failing = []
  let least = Infinity
  for (const k of keys) {
    const ratio = k.approved > 0 ? k.still / k.approved : Infinity
    least = Math.min(least, ratio)
    if (ratio < limit) failing.push({ still: k.name, what: 'fine detail against the approved image at the same size', value: r4(ratio), limit, energy: [r4(k.still), r4(k.approved)] })
  }
  if (!keys.length) return notYet('M3', 'this unit has no key to compare')
  return result('M3', failing, `${keys.length} keys: the least ratio of fine detail to the approved image ${r4(least)}, the least allowed ${limit}`, { keys: keys.length, leastRatio: r4(least), limit })
}

// M4. stills: [{ name, state }]
export function m4(stills, c) {
  const { minTextPx, minTextContrast } = c.layout
  const failing = []
  let runs = 0
  let leastPx = Infinity
  let leastContrast = Infinity
  for (const s of stills) {
    for (const t of s.state.type) {
      runs++
      leastPx = Math.min(leastPx, t.px)
      leastContrast = Math.min(leastContrast, t.contrast)
      if (t.px < minTextPx) failing.push({ still: s.name, run: t.key, text: t.text, what: 'height in page pixels', value: r2(t.px), limit: minTextPx })
      if (t.contrast < minTextContrast) failing.push({ still: s.name, run: t.key, text: t.text, what: 'contrast against what lies under it', value: r2(t.contrast), limit: minTextContrast })
    }
  }
  if (!runs) return notYet('M4', `no run of type in the ${stills.length} stills read`)
  return result('M4', failing, `${runs} runs of type in ${stills.length} stills: the smallest ${r2(leastPx)} px (least ${minTextPx}), the least contrast ${r2(leastContrast)} (least ${minTextContrast})`, { stills: stills.length, runs, leastPx: r2(leastPx), leastContrast: r2(leastContrast), minTextPx, minTextContrast })
}

const edges = (b) => [b[0], b[1], b[0] + b[2], b[1] + b[3]]
const EDGE = ['left', 'top', 'right', 'bottom']

// M5. stills: [{ name, state }]
export function m5(stills, c) {
  const limit = c.layout.tolerancePx
  const failing = []
  let parts = 0
  let worst = 0
  for (const s of stills) {
    for (const p of s.state.layout) {
      parts++
      const a = edges(p.planned)
      const b = edges(p.drawn)
      let off = 0
      let which = 0
      for (let i = 0; i < 4; i++) {
        const d = Math.abs(a[i] - b[i])
        if (d > off) {
          off = d
          which = i
        }
      }
      worst = Math.max(worst, off)
      if (off > limit) failing.push({ still: s.name, part: p.id, kind: p.kind, what: `its ${EDGE[which]} edge is off the layout tree`, value: r2(off), limit, planned: p.planned.map(r2), drawn: p.drawn.map(r2) })
    }
  }
  if (!parts) return notYet('M5', `no part of a layout tree in the ${stills.length} stills read`)
  return result('M5', failing, `${parts} parts in ${stills.length} stills: the furthest ${r2(worst)} px from the layout tree, the most allowed ${limit}`, { stills: stills.length, parts, worstPx: r2(worst), limit })
}

// M6. stills: [{ name, camera, state }]
export function m6(stills, c) {
  const want = c.cursor.heightPxAt1080
  const tol = c.cursor.sizeTolerancePx
  const ball = c.table.ballPx
  const inBall = ball * c.table.cursorInBallFraction
  const failing = []
  let home = 0
  let tier = 0
  let worst = 0
  for (const s of stills) {
    const k = s.state.cursor
    if (s.camera === 'home' && k.onPage && !k.inBall) {
      home++
      const off = Math.abs(k.heightPx - want)
      worst = Math.max(worst, off)
      if (off > tol) failing.push({ still: s.name, what: 'the cursor\'s height in page pixels', value: r2(k.heightPx), limit: `${want} within ${tol}` })
    }
    if (isTierCamera(s.camera, c)) {
      tier++
      if (!k.inBall) {
        failing.push({ still: s.name, what: 'a still from a tier camera in which the cursor is not in the ball', value: 0, limit: `${ball} within ${tol}` })
        continue
      }
      const offBall = Math.abs(k.ballScreenPx - ball)
      const offCursor = Math.abs(k.screenHeightPx - inBall)
      worst = Math.max(worst, offBall, offCursor)
      if (offBall > tol) failing.push({ still: s.name, what: 'the ball\'s width in the picture', value: r2(k.ballScreenPx), limit: `${ball} within ${tol}` })
      if (offCursor > tol) failing.push({ still: s.name, what: 'the cursor\'s length in the picture', value: r2(k.screenHeightPx), limit: `${r2(inBall)} within ${tol}` })
    }
  }
  if (!home && !tier) return notYet('M6', `none of the ${stills.length} stills shows the cursor at rest from home or in the ball from a tier camera`)
  return result('M6', failing, `${home} stills from home with the cursor at rest and ${tier} from a tier camera: the furthest ${r2(worst)} px from its size, the most allowed ${tol}`, { fromHome: home, fromTierCamera: tier, worstPx: r2(worst), heightPx: want, ballPx: ball, cursorInBallPx: r2(inBall), tolerancePx: tol })
}

const carriage = (k) => `${k.acting}|${k.damage.join(',')}`

// M7. frames: [{ index, beat, cursor, events }] in order, with one frame before and one after where the film has them.
// first and last bound the frames whose events are judged.
export function m7(frames, first, last) {
  const failing = []
  let hits = 0
  let far = 0
  let unmoved = 0
  let worst = 0
  for (let n = 0; n < frames.length; n++) {
    const f = frames[n]
    if (f.index < first || f.index > last) continue
    const before = frames[n - 1]
    const after = frames[n + 1]
    const changed = (before !== undefined && carriage(before.cursor) !== carriage(f.cursor)) || (after !== undefined && carriage(after.cursor) !== carriage(f.cursor))
    for (const e of f.events) {
      if (!e.hitsCursor) continue
      hits++
      const reach = f.cursor.screenHeightPx
      const d = Math.hypot(e.x - f.cursor.x, e.y - f.cursor.y)
      worst = Math.max(worst, d - reach)
      if (d > reach) {
        far++
        failing.push({ frame: f.index, beat: f.beat, event: e.name, what: 'distance in the picture from the event to the cursor', value: r2(d), limit: r2(reach), event_at: [r2(e.x), r2(e.y)], cursor_at: [r2(f.cursor.x), r2(f.cursor.y)], onPage: f.cursor.onPage })
      }
      if (!changed) {
        unmoved++
        failing.push({ frame: f.index, beat: f.beat, event: e.name, what: 'the cursor\'s damage or acting state does not change on that frame or the next', value: carriage(f.cursor), limit: 'a change', next: after ? carriage(after.cursor) : null })
      }
    }
  }
  const read = frames.filter((f) => f.index >= first && f.index <= last).length
  if (!hits) return result('M7', [], `${read} frames read: no event strikes the cursor in them`, { frames: read, hits: 0 })
  return result('M7', failing, `${read} frames read, ${hits} events strike the cursor: ${far} further from it than its own height in the picture, ${unmoved} with no change of damage or acting on that frame or the next`, { frames: read, hits, tooFar: far, noChange: unmoved, worstOverPx: r2(Math.max(0, worst)) })
}

// M8. tiers: [{ id, standingParts, coverage: { floor, bare } | null, still }]
export function m8(tiers, c) {
  const least = c.table.minStandingPartsPerTier
  const limit = c.table.maxBareFraction
  const failing = []
  const numbers = { tiers: {} }
  const bits = []
  let unread = 0
  for (const t of tiers) {
    numbers.tiers[t.id] = { standingParts: t.standingParts, bareShare: null }
    if (t.standingParts < least) failing.push({ still: t.still, part: t.id, what: 'standing parts on the tier', value: t.standingParts, limit: least })
    if (!t.coverage || !t.coverage.floor) {
      unread++
      bits.push(`${t.id} ${t.standingParts} parts`)
      continue
    }
    const share = t.coverage.bare / t.coverage.floor
    numbers.tiers[t.id].bareShare = r4(share)
    bits.push(`${t.id} ${t.standingParts} parts, ${r4(share)} bare`)
    if (share > limit) failing.push({ still: t.still, part: t.id, what: `floor pixels further than table.bareDistanceFraction (${c.table.bareDistanceFraction}) of the tier's width from any standing part, insert or printed line`, value: r4(share), limit, of: t.coverage.floor })
  }
  if (!tiers.length) return notYet('M8', 'tableState lists no tier')
  if (unread && !failing.length) return notYet('M8', `the coverage view of ${unread} of ${tiers.length} tiers could not be read (${bits.join('; ')}; at least ${least} parts)`, numbers)
  return result('M8', failing, `${bits.join('; ')} (at least ${least} parts, at most ${limit} bare)`, { ...numbers, minStandingParts: least, maxBareFraction: limit })
}

const SIZED = ['field', 'button', 'heroButton', 'progressButton']

// M9. stills: [{ name, camera, state }]. Only stills from home are read.
export function m9(stills, c) {
  const sc = c.scale
  const tol = sc.tolerancePx
  const failing = []
  let parts = 0
  let checked = 0
  let worst = 0
  const fromHome = stills.filter((s) => s.camera === 'home')
  for (const s of fromHome) {
    for (const p of s.state.layout) {
      parts++
      const [, , w, h] = p.drawn
      let any = false
      if (SIZED.includes(p.kind)) {
        any = true
        const want = sc.sizes[p.kind]
        const sides = p.kind === 'progressButton' ? [w, h] : [h]
        const off = Math.max(...sides.map((v) => Math.abs(v - want)))
        worst = Math.max(worst, off)
        if (off > tol) failing.push({ still: s.name, part: p.id, kind: p.kind, what: p.kind === 'progressButton' ? 'its diameter' : 'its height on the page', value: sides.map(r2), limit: `${want} within ${tol}` })
      }
      if (p.kind === 'keycap') {
        any = true
        const short = Math.min(w, h)
        if (short < sc.sizes.keycapMin - tol) failing.push({ still: s.name, part: p.id, kind: p.kind, what: 'its short side', value: r2(short), limit: `at least ${sc.sizes.keycapMin} within ${tol}` })
      }
      if (sc.kinds.includes(p.kind)) {
        any = true
        const want = sc.heights[p.kind]
        const low = p.kind === 'keycap' ? want - sc.heights.keyTravel : want
        const off = p.height > want ? p.height - want : p.height < low ? low - p.height : 0
        worst = Math.max(worst, off)
        if (off > tol) failing.push({ still: s.name, part: p.id, kind: p.kind, what: 'the height of its top above the page surface', value: r2(p.height), limit: p.kind === 'keycap' ? `${low} to ${want} within ${tol}` : `${want} within ${tol}` })
        if (p.plannedHeight !== want) failing.push({ still: s.name, part: p.id, kind: p.kind, what: 'the planned height the page reports is not the entry of scale.heights', value: p.plannedHeight, limit: want })
      }
      if (p.mechanism) {
        any = true
        if (p.height < sc.heights.machineMinTop) failing.push({ still: s.name, part: p.id, kind: p.kind, what: 'a mechanism\'s top above the page surface', value: r2(p.height), limit: `at least ${sc.heights.machineMinTop}` })
      }
      if (any) checked++
    }
  }
  if (!fromHome.length) return notYet('M9', 'no still from home was read')
  if (!checked) return notYet('M9', `none of the ${parts} parts in ${fromHome.length} stills from home is of a kind this measure checks`)
  return result('M9', failing, `${checked} of ${parts} parts checked in ${fromHome.length} stills from home: the furthest ${r2(worst)} px from its size or height, the most allowed ${tol}`, { stills: fromHome.length, parts, checked, worstPx: r2(worst), tolerancePx: tol })
}

// M10. table: tableState. displayScale: { tierId: picture pixels per page pixel in the tier's still }. paths: { status, lines } of `npm run paths`, or null when it was not run.
export function m10(table, c, displayScale, paths) {
  const min = c.table.minClearanceBalls
  const failing = []
  if (!table.tiers.length) return notYet('M10', 'tableState lists no tier')
  const tiers = new Set(table.tiers.map((t) => t.id))
  const holds = new Set(table.holds.map((h) => h.id))
  const rails = new Set(table.rails.map((r) => r.id))
  const openings = new Map(table.openings.map((o) => [o.id, o]))
  const sealed = table.sealed
  const inSealed = (name) => typeof name === 'string' && sealed.some((s) => name === s || name.startsWith(`${s}.`))
  let narrowest = Infinity
  for (const o of table.openings) {
    narrowest = Math.min(narrowest, o.clearBalls)
    if (o.clearBalls < min - 1e-9) failing.push({ part: o.id, what: 'the clear width of the opening, in balls', value: r4(o.clearBalls), limit: min })
    if (inSealed(o.id) || inSealed(o.tier)) failing.push({ part: o.id, what: 'an opening that leads into a sealed box', value: o.tier, limit: `none into ${sealed.join(', ')}` })
  }
  const place = (name) => (tiers.has(name) ? 'tier' : holds.has(name) ? 'hold' : rails.has(name) ? 'rail' : openings.has(name) && tiers.has(openings.get(name).tier) ? 'tier' : null)
  for (const r of table.rails) {
    for (const [end, name] of [['entry', r.from], ['exit', r.to]]) {
      if (!name) failing.push({ part: `rail ${r.id}`, what: `it has no ${end}`, value: null, limit: 'a tier, a hold or another rail' })
      else if (inSealed(name)) failing.push({ part: `rail ${r.id}`, what: `its ${end} leads into a sealed box`, value: name, limit: `none into ${sealed.join(', ')}` })
      else if (!place(name)) failing.push({ part: `rail ${r.id}`, what: `its ${end} opens onto nothing tableState lists`, value: name, limit: 'a tier, a hold or another rail' })
    }
  }
  const lift = { doors: table.openings.filter((o) => /(^|\.)lift\.door$/.test(o.id)), elbows: table.openings.filter((o) => /(^|\.)elbow$/.test(o.id)) }
  for (const [what, list] of Object.entries(lift)) {
    if (list.length !== 2) failing.push({ part: 'lift', what: `the number of its ${what} among the openings`, value: list.length, limit: 2 })
  }
  for (const h of table.holds) if (!h.releases) failing.push({ part: `hold ${h.id}`, what: 'it does not release', value: false, limit: true })
  let leastChar = Infinity
  for (const t of table.tiers) {
    if (t.inserts !== c.table.insertsPerTier) failing.push({ part: `tier ${t.id}`, what: 'its inserts', value: t.inserts, limit: c.table.insertsPerTier })
    const d = t.display
    if (!d || !Array.isArray(d.box) || d.box.length !== 4 || !(d.charPx > 0)) {
      failing.push({ part: `tier ${t.id}`, what: 'it has no display', value: null, limit: 1 })
      continue
    }
    const px = d.charPx * (displayScale[t.id] ?? 1)
    leastChar = Math.min(leastChar, px)
    if (px < c.layout.minTextPx) failing.push({ part: `tier ${t.id}`, what: 'the height of its display\'s characters in the tier\'s still', value: r2(px), limit: c.layout.minTextPx })
  }
  const numbers = { openings: table.openings.length, narrowestBalls: r4(narrowest), minClearanceBalls: min, rails: table.rails.length, holds: table.holds.length, liftDoors: lift.doors.length, liftElbows: lift.elbows.length, sealed, leastDisplayCharPx: r2(leastChar), paths: paths ? { status: paths.status, last: paths.lines.at(-1) ?? '' } : null }
  if (!paths) return failing.length ? result('M10', failing, 'tableState read; npm run paths was not run', numbers) : notYet('M10', 'tableState is in order, but npm run paths was not run, so the balls were not followed', numbers)
  if (paths.status !== 0) {
    const told = paths.lines.filter((l) => /^(PROBLEM|BALL|NARROW|WAY IN|OPEN RAIL)\b/.test(l))
    const problems = told.filter((l) => l.startsWith('PROBLEM'))
    for (const l of problems.length ? problems : told) failing.push({ part: 'npm run paths', what: l.replace(/^PROBLEM\s+/, ''), value: paths.status, limit: 0 })
    if (!told.length) failing.push({ part: 'npm run paths', what: `it ended with code ${paths.status}: ${paths.lines.at(-1) ?? 'nothing printed'}`, value: paths.status, limit: 0 })
  }
  return result('M10', failing, `${table.openings.length} openings, the narrowest ${r4(narrowest)} balls (least ${min}); ${table.rails.length} rails; ${table.holds.length} holds; the lift has ${lift.doors.length} doors and ${lift.elbows.length} elbows; display characters ${r2(leastChar)} px in the tier stills (least ${c.layout.minTextPx}); npm run paths ended with code ${paths.status}: ${paths.lines.at(-1) ?? ''}`, numbers)
}

// High frequency energy of a picture: the mean square of the Laplacian of its luminance, for M3. data holds 8 bit channels.
export function highFrequencyEnergy(data, width, height, channels) {
  const lum = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    lum[i] = channels >= 3 ? (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255 : data[o] / 255
  }
  let sum = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const v = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - width] - lum[i + width]
      sum += v * v
      n++
    }
  }
  return n ? sum / n : 0
}

// The pixels on the edge of a frame that show the ground behind the page, for M1. `isBare(r, g, b)` says which.
export function edgeCount(data, width, height, channels, isBare) {
  let pixels = 0
  let bare = 0
  const look = (x, y) => {
    const o = (y * width + x) * channels
    pixels++
    if (isBare(data[o], data[o + 1], data[o + 2])) bare++
  }
  for (let x = 0; x < width; x++) {
    look(x, 0)
    if (height > 1) look(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    look(0, y)
    if (width > 1) look(width - 1, y)
  }
  return { pixels, bare }
}

// Squared distance from every pixel to the nearest marked one, exactly, in two passes of one dimension each.
export function distanceSquared(marked, width, height) {
  const INF = 1e20
  const out = new Float64Array(width * height)
  for (let i = 0; i < out.length; i++) out[i] = marked[i] ? 0 : INF
  const pass = (n, get, set) => {
    const f = new Float64Array(n)
    const v = new Int32Array(n)
    const z = new Float64Array(n + 1)
    for (let q = 0; q < n; q++) f[q] = get(q)
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (let q = 1; q < n; q++) {
      let s = 0
      for (;;) {
        const p = v[k]
        s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p)
        if (s <= z[k] && k > 0) k--
        else break
      }
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++
      const p = v[k]
      set(q, (q - p) * (q - p) + f[p])
    }
  }
  for (let x = 0; x < width; x++) pass(height, (y) => out[y * width + x], (y, d) => (out[y * width + x] = d))
  for (let y = 0; y < height; y++) pass(width, (x) => out[y * width + x], (x, d) => (out[y * width + x] = d))
  return out
}

// Floor pixels and those of them further than `radius` pixels from anything marked, for M8.
// kinds holds one entry per pixel: 0 for what is not floor, 1 for bare floor, 2 for a standing part, an insert or a printed line.
export function bareFloor(kinds, width, height, radius) {
  const marked = new Uint8Array(width * height)
  let floor = 0
  for (let i = 0; i < marked.length; i++) {
    if (kinds[i] === 2) marked[i] = 1
    if (kinds[i] !== 0) floor++
  }
  const d = distanceSquared(marked, width, height)
  let bare = 0
  const far = radius * radius
  for (let i = 0; i < marked.length; i++) if (kinds[i] === 1 && d[i] > far) bare++
  return { floor, bare }
}

const show = (v) => (Array.isArray(v) ? `[${v.join(', ')}]` : v === null || v === undefined ? 'nothing' : String(v))

export function itemLine(f) {
  const where = [f.still, f.frame !== undefined ? `frame ${f.frame}${f.beat ? ` (${f.beat})` : ''}` : null, f.part, f.run ? `run ${f.run}${f.text ? ` "${String(f.text).slice(0, 40)}"` : ''}` : null, f.event ? `event ${f.event}` : null].filter(Boolean).join(', ')
  return `      ${where}: ${f.what}: ${show(f.value)} against ${show(f.limit)}${f.of !== undefined ? ` (of ${f.of})` : ''}`
}

// Items that differ only in their still are printed once, with the number of stills. The record keeps them all.
export function grouped(failing) {
  const groups = new Map()
  for (const f of failing) {
    const { still, ...rest } = f
    const key = JSON.stringify(rest)
    const g = groups.get(key)
    if (g) g.stills.push(still)
    else groups.set(key, { item: f, stills: [still] })
  }
  return [...groups.values()].map((g) => (g.stills.length > 1 ? { ...g.item, still: `${g.stills[0]} and ${g.stills.length - 1} more still${g.stills.length === 2 ? '' : 's'}` } : g.item))
}

export function lines(r, max = Infinity) {
  const head = r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'FAIL' : 'not yet'
  const out = [`${head}  ${r.id}  ${r.summary}`]
  const all = grouped(r.failing)
  const list = all.slice(0, max)
  for (const f of list) out.push(itemLine(f))
  if (all.length > list.length) out.push(`      and ${all.length - list.length} more, in the record`)
  return out
}

// 0 when every measure that ran is green, 2 when one is red.
export const exitCode = (results) => (results.some((r) => r.status === 'fail') ? 2 : 0)
