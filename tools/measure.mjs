// npm run measure -- --unit ID: measures M1 to M10 of kit/07-QUALITY-BAR.md for one unit, with a pass or FAIL line for each.
// Exit 0 when every measure that ran is green, 2 when one is red, 1 when the tool could not do its work.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { args, at, config, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { state } from './lib/state.mjs'
import { MEASURES, PICTURE_MEASURES, exitCode, isTierCamera, lines, m10, m4, m5, m6, m7, m9, measuresOf, notYet, restAndKeys, stillsOf, tierCameras } from './lib/measure-core.mjs'

const a = args()
const c = config()
const tier = a.tier === true || !a.tier ? 'draft' : String(a.tier)
const format = a.format === true || !a.format ? 'hd' : String(a.format)
const judgedTier = 'final'
const pageUnits = c.film.units.map((u) => u.id)
const allUnits = [...pageUnits, 'film']

function usage(why) {
  console.error(`measure: ${why}`)
  console.error(`usage: npm run measure -- --unit <${allUnits.join(' | ')} | all> [--only M4,M5] [--tier ${Object.keys(c.tiers).join(' | ')}] [--format ${Object.values(c.formats).map((f) => f.id).join(' | ')}] [--max-lines 40]`)
  console.error('       npm run measure -- --views [--tier T] [--format F]: after every view, the beauty still is byte equal to the one before it')
  process.exit(1)
}

if (!a.views && (!a.unit || a.unit === true)) usage('give --unit, or --views for the check that no view changes beauty')
if (!a.views && a.unit !== 'all' && !allUnits.includes(a.unit)) usage(`no unit called "${a.unit}"`)
if (!c.tiers[tier]) usage(`no tier called "${tier}"`)
if (!Object.values(c.formats).some((f) => f.id === format)) usage(`no format called "${format}"`)
const only = a.only && a.only !== true ? String(a.only).toUpperCase().split(',').map((s) => s.trim()).filter(Boolean) : null
if (only) for (const id of only) if (!MEASURES.includes(id)) usage(`no measure called "${id}"`)
const maxLines = a['max-lines'] && a['max-lines'] !== true ? Number(a['max-lines']) : 40
const units = a.views ? [] : a.unit === 'all' ? allUnits : [a.unit]

let s = null
let pictures = null
let pathsRun = null
let status = 0
const summary = []

async function picturesFor() {
  if (pictures) return pictures
  const { openPictures } = await import('./lib/measure-pictures.mjs')
  pictures = await openPictures({ format, tier, views: s.views, ranges: s.ranges })
  return pictures
}

function runPaths() {
  if (pathsRun) return pathsRun
  const r = spawnSync('npm', ['run', '-s', 'paths'], { cwd: at(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  pathsRun = { status: r.status ?? 1, lines: `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').map((l) => l.trimEnd()).filter(Boolean) }
  return pathsRun
}

function filmFrames(first, last, count) {
  const frames = []
  for (let i = Math.max(0, first - 1); i <= Math.min(count - 1, last + 1); i++) {
    const st = s.showcase.filmState(i)
    frames.push({ index: i, beat: st.beat, cursor: st.cursor, events: st.events })
  }
  return frames
}

async function measureUnit(unit) {
  const wanted = measuresOf(unit, c).filter((id) => !only || only.includes(id))
  const film = s.showcase.film()
  const results = []
  const read = unit === 'film' ? [] : stillsOf(unit, c, tier).map((st) => ({ ...st, state: st.kind === 'sheet' ? null : s.showcase.stillState(st.spec) }))
  const pages = read.filter((st) => st.kind !== 'sheet')
  for (const id of wanted) {
    let r
    if (PICTURE_MEASURES.includes(id)) {
      const p = await picturesFor()
      r = await p.measure(id, unit, read, s, c)
    } else if (id === 'M4') r = m4(restAndKeys(pages), c)
    else if (id === 'M5') r = m5(restAndKeys(pages), c)
    else if (id === 'M6') r = m6(pages, c)
    else if (id === 'M9') r = m9(restAndKeys(pages), c)
    else if (id === 'M7') {
      const span = unit === 'film' ? { first: 0, last: film.frameCount - 1 } : film.units.find((u) => u.id === unit)
      const beats = unit === 'film' ? film.beats : film.beats.filter((b) => b.first >= span.first && b.last <= span.last)
      const first = Math.min(...beats.map((b) => b.first))
      const last = Math.max(...beats.map((b) => b.last))
      r = m7(filmFrames(first, last, film.frameCount), first, last)
      r.numbers.beats = beats.length
      r.numbers.firstFrame = first
      r.numbers.lastFrame = last
    } else if (id === 'M10') {
      const scale = {}
      for (const t of tierCameras(c)) {
        const key = pages.find((st) => st.kind === 'key' && st.camera === t.camera && isTierCamera(st.camera, c))
        if (key) scale[t.tier] = key.state.cursor.screenHeightPx / key.state.cursor.heightPx
      }
      r = m10(s.showcase.tableState(), c, scale, runPaths())
      r.numbers.displayScale = scale
    } else r = notYet(id, 'this measure is not built')
    results.push(r)
  }
  return { unit, stills: read.map((st) => st.name), results }
}

try {
  s = await state()
  const viewsOf = await s.load('/src/diagnostics/views.ts')
  s.views = [...viewsOf.views]
  s.ranges = { texel: viewsOf.TEXEL_RANGE, coc: viewsOf.COC_RANGE }
  const info = buildInfo(at())
  if (a.views) {
    const { viewsLeaveBeauty } = await import('./lib/measure-pictures.mjs')
    const wanted = [...s.views]
    const keys = c.keys.filter((k) => k.camera === 'home').slice(0, 1).concat(c.keys.filter((k) => isTierCamera(k.camera, c)).slice(0, 1))
    const struck = []
    const film = s.showcase.film()
    for (let i = 0; i < film.frameCount && !struck.length; i++) if (s.showcase.filmState(i).events.length) struck.push(i)
    const rows = await viewsLeaveBeauty({ format, tier, views: wanted, specs: keys.map((k) => ({ name: `key:${k.id}`, spec: { page: k.unit, beat: k.beat, at: k.at, camera: k.camera } })), frames: struck })
    const changed = rows.filter((r) => !r.same)
    const idle = rows.filter((r) => !r.drawsSomethingElse)
    console.log(`measure: the views, tier ${tier}, format ${format}, engine ${info.engineHash}`)
    console.log(`${changed.length ? 'FAIL' : 'pass'}  views  ${rows.length} views drawn over ${new Set(rows.map((r) => r.still)).size} moments: beauty differs after ${changed.length} of them; ${idle.length} drew the same bytes as beauty`)
    for (const r of changed) console.log(`      ${r.still}, after ${r.view}: beauty is ${r.after.slice(0, 12)} against ${r.before.slice(0, 12)} before`)
    for (const r of idle) console.log(`      ${r.still}, ${r.view}: the view's picture is byte equal to beauty`)
    const file = at('out', 'work', 'measures', 'views.json')
    writeJson(file, { tier, format, engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes: info.pageHashes, exit: changed.length ? 2 : 0, rows })
    console.log(`record: ${path.relative(at(), file)}`)
    status = changed.length ? 2 : 0
  }
  if (!a.views) console.log(`measure: tier ${tier}, format ${format}${tier === judgedTier ? '' : ` (a judged still is rendered at ${judgedTier}: these numbers are from ${tier})`}, engine ${info.engineHash}`)
  for (const unit of units) {
    const { stills, results } = await measureUnit(unit)
    console.log(`\nunit ${unit}: ${stills.length ? `${stills.length} judged stills` : 'the frames of the film'}`)
    for (const r of results) for (const l of lines(r, maxLines)) console.log(l)
    const code = exitCode(results)
    status = Math.max(status, code)
    const pageHashes = {}
    for (const u of unit === 'film' ? pageUnits : [unit]) pageHashes[u] = info.pageHashes[u]
    const file = at('out', 'work', 'measures', `${unit}.json`)
    writeJson(file, { unit, tier, judgedTier, format, engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes, only, stills, exit: code, green: results.filter((r) => r.status === 'pass').map((r) => r.id), red: results.filter((r) => r.status === 'fail').map((r) => r.id), notYet: results.filter((r) => r.status === 'notyet').map((r) => r.id), measures: results })
    console.log(`record: ${path.relative(at(), file)}`)
    summary.push({ unit, results })
  }
  if (units.length > 1) {
    console.log('\nsummary')
    for (const u of summary) console.log(`  ${u.unit.padEnd(10)} ${u.results.map((r) => `${r.id} ${r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'FAIL' : 'not yet'}`).join(', ')}`)
  }
  const all = summary.flatMap((u) => u.results)
  if (!a.views) console.log(`\nmeasure: ${all.filter((r) => r.status === 'pass').length} green, ${all.filter((r) => r.status === 'fail').length} red, ${all.filter((r) => r.status === 'notyet').length} not yet`)
} catch (e) {
  console.error(`measure: could not do its work: ${e && e.stack ? e.stack : e}`)
  status = 1
} finally {
  if (pictures) await pictures.close().catch(() => {})
  if (s) await s.close().catch(() => {})
}
process.exit(status)
