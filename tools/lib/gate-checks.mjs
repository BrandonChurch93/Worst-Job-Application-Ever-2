// The rules of the checks G13, G15 and G16, with nothing in them that needs a browser: what G13 covers, its three tests, the hash of a part's files at a commit, the reading of the `standins` view, the limits of memory and counts, and the reading of the host report.
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

// The commits a stand-in hash may be taken from, the latest first: in each of them every part of the register was a stand-in.
// 729ee56 is the seam as it was handed to the builders of Phase 3, with every maker null. 4b65361 is the first commit of Phase 3. d0f83c8 is the last commit of Phase 2.
export const ANCHORS = ['729ee56', '4b65361', 'd0f83c8']
export const PART_STATES = ['stand-in', 'fallback', 'general fallback', 'last resort', 'finished', 'built']

// The table under "Units" in kit/PROGRESS.md: each unit's state and the rounds run on it.
export function unitStates(text) {
  const out = {}
  const start = text.indexOf('\n## Units')
  if (start < 0) return out
  const end = text.indexOf('\n## ', start + 5)
  for (const line of text.slice(start, end < 0 ? undefined : end).split('\n')) {
    const cells = line.split('|').map((x) => x.trim())
    const m = /^`([^`]+)`$/.exec(cells[1] ?? '')
    if (!m) continue
    out[m[1]] = { state: (cells[2] ?? '').replace(/`/g, ''), rounds: Number(cells[3]) || 0 }
  }
  return out
}

// The units G13 covers, each with why, as kit/07-QUALITY-BAR.md says: the unit a round is about (named on the command line), every unit marked finished,
// every unit but `film` once a round has run on `site` in Phase 5, and every unit once a round has run on `film` in Phase 6.
export function coveredUnits({ states, named = [], phase = 0, units }) {
  const out = new Map()
  const add = (unit, why) => {
    if (units.includes(unit) && !out.has(unit)) out.set(unit, why)
  }
  const begun = (unit) => states[unit] && (states[unit].state === 'in progress' || states[unit].state === 'finished' || states[unit].rounds > 0)
  for (const u of named) add(u, 'named with --unit')
  for (const u of units) if (states[u]?.state === 'finished') add(u, 'marked finished in kit/PROGRESS.md')
  if (phase >= 5 && begun('site')) for (const u of units) if (u !== 'film') add(u, 'a round has run on site in Phase 5')
  if (phase >= 6 && begun('film')) for (const u of units) add(u, 'a round has run on film in Phase 6')
  return [...out].map(([unit, why]) => ({ unit, why }))
}

export const unknownUnits = (named, units) => named.filter((u) => !units.includes(u))

// The hash of a list of files, as tools/lib/film-parts.mjs makes it: for each file in the order given its name, a zero byte, its bytes, a zero byte. Null when a file is not there.
export function hashOfBytes(files, read) {
  if (!files.length) return ''
  const h = crypto.createHash('sha256')
  for (const f of files) {
    const bytes = read(f)
    if (bytes === null || bytes === undefined) return null
    h.update(f)
    h.update('\0')
    h.update(bytes)
    h.update('\0')
  }
  return h.digest('hex')
}

// A file as it was at a commit. Null when the commit does not hold it or is not in this clone.
export function showAt(root, commit, file) {
  const r = spawnSync('git', ['show', `${commit}:${file}`], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
  return r.status === 0 ? r.stdout : null
}

export function resolveCommit(root, name) {
  const r = spawnSync('git', ['rev-parse', '--verify', '--quiet', `${name}^{commit}`], { cwd: root, encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

// The stand-in record of a part: each file hashed as it was at the first of `anchors` that holds it.
// `show(commit, file)` gives the bytes or null. A file that none of the commits holds is listed in `absent` and recorded as `ABSENT` with no bytes: it was not there while the part was a stand-in, so it differs as soon as it holds a byte.
export const ABSENT = 'absent'
export function anchoredRecord(files, anchors, show) {
  const sorted = [...new Set(files)].sort()
  const hashAt = {}
  const bytes = {}
  const absent = []
  for (const f of sorted) {
    let found = false
    for (const c of anchors) {
      const b = show(c, f)
      if (b === null || b === undefined) continue
      hashAt[f] = c
      bytes[f] = b
      found = true
      break
    }
    if (!found) {
      absent.push(f)
      hashAt[f] = ABSENT
      bytes[f] = Buffer.alloc(0)
    }
  }
  if (!sorted.length) return { files: sorted, hashAt, absent, hash: null }
  return { files: sorted, hashAt, absent, hash: hashOfBytes(sorted, (f) => bytes[f]) }
}

// The hash a record that names its commits should hold, made again from those commits. Null when a commit or a file is missing.
export function recordedAgain(part, show) {
  if (!part.hashAt || !part.files?.length) return null
  const bytes = {}
  for (const f of part.files) {
    const c = part.hashAt[f]
    const b = c === ABSENT ? Buffer.alloc(0) : c ? show(c, f) : null
    if (b === null || b === undefined) return null
    bytes[f] = b
  }
  return hashOfBytes(part.files, (f) => bytes[f])
}

// What test 2 needs to know about one part: the hash of its recorded files today, the files that are gone, the recorded hash made again from the commits the record names,
// and, for a record that names no commit, the hash the same files had at each anchor commit. `read(file)` gives a file's bytes today or null, `show(commit, file)` its bytes at a commit or null.
export function hashFacts(part, read, show, anchors = ANCHORS) {
  if (!part.files?.length || !part.standInHash) return {}
  const gone = part.files.filter((f) => read(f) === null)
  const facts = { hashNow: hashOfBytes(part.files, read), gone }
  if (part.hashAt) facts.again = recordedAgain(part, show)
  else facts.atAnchors = anchors.map((c) => ({ commit: c, hash: hashOfBytes(part.files, (f) => show(c, f)) }))
  return facts
}

// The three tests of kit/05-ARCHITECTURE.md on one part. Gives every reason the part is still a stand-in. An empty list is a pass.
// facts: those of hashFacts, and frames ({ count, of, first, beats }: the film frames in which the page reports the part), pixels ([{ still, pixels }]: flagged pixels in the `standins` view), reported (info().standIns lists it after the pictures).
export function standInTests(part, facts = {}) {
  const why = []
  if (part.state === 'stand-in') why.push('test 1: its state in the register is stand-in')
  else if (!PART_STATES.includes(part.state)) why.push(`test 1: its state in the register, "${part.state}", is not a state`)
  const same = (facts.atAnchors ?? []).find((x) => x.hash !== null && x.hash === facts.hashNow)
  if (!part.files?.length || !part.standInHash) why.push(`test 2: no stand-in hash is recorded for it, so there is nothing its files can be shown to differ from (npm run parts -- --record ${part.name} --files a,b)`)
  else if (facts.again !== undefined && facts.again !== part.standInHash) why.push(facts.again === null ? 'test 2: its recorded hash cannot be made again, because a commit or a file its record names is not in this clone' : 'test 2: its recorded hash is not the hash of its files at the commits its record names, so the comparison proves nothing')
  else if (facts.hashNow === undefined) why.push('test 2: the hash of its files today was not made')
  else if (facts.gone?.length) why.push(`test 2: ${facts.gone.join(' ')} ${facts.gone.length === 1 ? 'is' : 'are'} recorded for it and gone, so the hash cannot be made: a file that was moved would pass as well as one that was finished (npm run parts -- --record ${part.name} --files a,b --replace)`)
  else if (facts.hashNow === null) why.push('test 2: the hash of its files today cannot be made')
  else if (facts.hashNow === part.standInHash) why.push(`test 2: its files (${part.files.join(' ')}) are byte for byte what they were when it was recorded as a stand-in`)
  else if (same) why.push(`test 2: its files (${part.files.join(' ')}) are byte for byte what they were at ${same.commit.slice(0, 7)}, when every part was a stand-in. The hash recorded for it is older than that, so differing from it shows nothing`)
  else if (!part.hashAt) why.push(`test 2: its record names no commit, so it was not taken from the commits in which every part was a stand-in. A file it names may have changed since for a reason that has nothing to do with the part, and differing from such a hash shows nothing (npm run parts -- --record ${part.name} --files a,b --replace)`)
  const frames = facts.frames
  if (frames && frames.count > 0) why.push(`test 3: the page reports it as a stand-in in ${frames.count} of ${frames.of} film frames, first in frame ${frames.first} (${frames.beats.join(', ')})`)
  const lit = (facts.pixels ?? []).filter((p) => p.pixels > 0)
  if (lit.length) why.push(`test 3: the standins view shows it flagged in ${lit.map((p) => `${p.still} (${p.pixels} pixels)`).join(', ')}`)
  if (facts.reported && !(frames && frames.count > 0) && !lit.length) why.push('test 3: info().standIns lists it after the pictures of its unit')
  return why
}

// The byte a diagnostic view writes for a linear value: a view is drawn without tone and grade, and its picture holds the sRGB code of the linear value.
export const codeOf = (v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))

// Reads a picture of the `standins` view drawn with one sample a pixel, so that no pixel is a mix of two meshes: how many pixels show each part's flag colour.
// A pixel counts for every part whose colour it is within `tolerance` codes of, so two parts whose colours cannot be told apart both count. `other` is the pixels that are no flag colour and no ground.
export function flaggedPixels(data, width, height, channels, colours, grounds, { tolerance = 2 } = {}) {
  const near = (o, c) => Math.abs(data[o] - c[0]) <= tolerance && Math.abs(data[o + 1] - c[1]) <= tolerance && Math.abs(data[o + 2] - c[2]) <= tolerance
  const codes = Object.entries(colours).map(([name, c]) => ({ name, code: c.map(codeOf) }))
  const flat = grounds.map((g) => g.map(codeOf))
  const counts = {}
  const seen = new Map()
  let other = 0
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    const key = (data[o] << 16) | (data[o + 1] << 8) | data[o + 2]
    let names = seen.get(key)
    if (names === undefined) {
      names = codes.filter((x) => near(o, x.code)).map((x) => x.name)
      if (!names.length && !flat.some((g) => near(o, g))) names = null
      seen.set(key, names)
    }
    if (names === null) other++
    else for (const n of names) counts[n] = (counts[n] ?? 0) + 1
  }
  return { counts, other }
}

// G15. pages: [{ page, textureMb: { <set>: number }, counts: { <level>: { triangles, drawCalls } }, textures?: { <set>: { counted, held, unseenMb } } }].
// A number that is missing or zero was not measured, and that is a failure: zero is what the placeholder gave.
export function memoryAndCounts(pages, { assetSets, perf, levels }) {
  const detail = []
  let mostMb = 0
  let mostTriangles = 0
  let mostCalls = 0
  for (const p of pages) {
    for (const set of Object.keys(assetSets)) {
      const mb = p.textureMb?.[set]
      const limit = assetSets[set].maxTextureMb
      if (!(mb > 0)) detail.push(`${p.page}: info().textureMb for the asset set ${set} is ${mb === undefined ? 'missing' : mb}, which is no measurement`)
      else {
        mostMb = Math.max(mostMb, mb)
        if (mb > limit) detail.push(`${p.page}: ${mb.toFixed(1)} MB of textures in the asset set ${set}, over assetSets.${set}.maxTextureMb (${limit})`)
      }
    }
    for (const level of levels) {
      const n = p.counts?.[level]
      if (!n || !(n.triangles > 0) || !(n.drawCalls > 0)) {
        detail.push(`${p.page}: info().counts at the level ${level} is ${n ? `${n.triangles} triangles and ${n.drawCalls} draw calls` : 'missing'}, which is no measurement`)
        continue
      }
      mostTriangles = Math.max(mostTriangles, n.triangles)
      mostCalls = Math.max(mostCalls, n.drawCalls)
      if (n.triangles > perf.maxTriangles[level]) detail.push(`${p.page}: ${n.triangles} triangles${n.at ? ` in ${n.at}` : ''} at the level ${level}, over perf.maxTriangles.${level} (${perf.maxTriangles[level]})`)
      if (n.drawCalls > perf.maxDrawCalls[level]) detail.push(`${p.page}: ${n.drawCalls} draw calls${n.callsAt ?? n.at ? ` in ${n.callsAt ?? n.at}` : ''} at the level ${level}, over perf.maxDrawCalls.${level} (${perf.maxDrawCalls[level]})`)
    }
  }
  if (!pages.length) detail.push('no page was measured')
  return { pass: detail.length === 0, detail, most: { textureMb: mostMb, triangles: mostTriangles, drawCalls: mostCalls } }
}

// G16. report: out/work/hostcheck.json as `npm run hostcheck` wrote it. head: the commit that stands now. live: what the built site showed when it was opened in live mode ({ ready, page, problems }).
export function hosting(report, { head, careers, live }) {
  const detail = []
  if (!report) return { pass: false, detail: ['`npm run hostcheck` left no report'] }
  if (report.commit !== head) detail.push(`the host report is of the commit ${String(report.commit).slice(0, 7)}, and ${String(head).slice(0, 7)} stands now`)
  const rows = report.verdict?.rows ?? []
  if (!rows.length) detail.push('the host report holds no verdict: the copy, the install or the build failed')
  for (const r of rows) if (!r.inside) detail.push(`${r.name}: ${r.got === null ? 'not measured' : `${r.got} ${r.unit}`} against ${r.limit} ${r.unit}`)
  const first = report.firstLoad?.state
  if (!first?.ready) detail.push(`the clean build did not get ready when opened with no query${first?.why ? `: ${first.why}` : ''}`)
  else if (first.mode !== null) detail.push(`the clean build was opened in the mode "${first.mode}", not with no mode named`)
  for (const k of ['problems', 'failed', 'missing']) for (const x of (report.firstLoad?.[k] ?? []).slice(0, 4)) detail.push(`the clean build, first load, ${k}: ${typeof x === 'string' ? x : JSON.stringify(x)}`)
  if (!live?.ready) detail.push(`the built site did not start in live mode${live?.why ? `: ${live.why}` : ''}`)
  else if (live.page !== careers) detail.push(`the built site opens the page "${live.page}" in live mode, not the careers page ("${careers}")`)
  for (const p of (live?.problems ?? []).slice(0, 4)) detail.push(`the built site in live mode reported: ${p}`)
  return { pass: detail.length === 0, detail }
}

export function filmMoments(units, beats, fps, extra = []) {
  const out = new Map()
  const add = (u, frame) => {
    if (frame < u.first || frame > u.last || out.has(frame)) return
    const t = (frame - u.first) / fps
    const of = beats.filter((b) => b.unit === u.id)
    const b = of.find((x) => t >= x.from - 1e-9 && t < x.to - 1e-9) ?? of.at(-1)
    if (!b) return
    out.set(frame, { unit: u.id, frame, beat: b.id, at: Number(Math.min(1, Math.max(0, (t - b.from) / (b.to - b.from))).toFixed(6)) })
  }
  for (const u of units) {
    for (let f = u.first; f <= u.last; f += fps) add(u, f)
    add(u, u.last)
    for (const f of extra) add(u, f)
  }
  return [...out.values()].sort((a, b) => a.frame - b.frame)
}
