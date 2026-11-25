// npm run sheet: a contact sheet of critics.contactSheetFrames frames across a beat, a page, the film, the loop, the opening, the six pages at rest, a named moment, or a bot's run of the live site.
import path from 'node:path'
import { args, at, config, readJson } from './lib/paths.mjs'
import { fresh, openSession, readCanvas, recordFor, writeRecord } from './lib/capture.mjs'
import { addLook } from './lib/looks.mjs'
import { around, filmPlan, formatOfConfig, spread, stepOf, tierOfConfig, timeLabel, unitsShown } from './lib/film-plan.mjs'
import { checkDisk, clock, seconds, took } from './lib/film-encode.mjs'
import { ask, sources } from './lib/film-render.mjs'
import { composeSheet, findMoment, momentOf, sheetName } from './lib/film-sheet.mjs'

const a = args()
const cfg = config()
const t0 = clock()
const stop = (line) => {
  console.error(`sheet: ${line}`)
  process.exit(1)
}
const word = (v) => (v === undefined || v === true ? null : String(v))

const modes = ['beat', 'unit', 'film', 'loop', 'opening', 'pages', 'motion', 'live'].filter((m) => a[m] !== undefined)
if (!modes.length) stop('say what to sheet: --beat ID, --unit ID, --film, --loop, --opening, --pages, --motion NAME or --live')
const mode = modes.includes('motion') ? 'motion' : modes.includes('live') ? 'live' : modes[0]
let format
let tier
try {
  format = formatOfConfig(cfg, word(a.format) || 'preview')
  tier = tierOfConfig(cfg, word(a.tier) || 'draft')
} catch (e) {
  stop(e.message)
}
const plan = filmPlan(cfg)
const fps = cfg.film.fps
const count = cfg.critics.contactSheetFrames
const edge = cfg.critics.maxImageLongEdgePx
const step = a['every-frame'] ? 1 : stepOf(fps, cfg.film.previewFps)
const diag = word(a.diag) || 'beauty'
const by = word(a.by) || 'builder'
const beatAt = (frame) => plan.beats.find((b) => frame >= b.first && frame <= b.last) || plan.beats[plan.beats.length - 1]
const unitAt = (frame) => plan.units.find((u) => frame >= u.first && frame <= u.last) || plan.units[plan.units.length - 1]
const filmLabel = (frame) => `${timeLabel(frame, fps)}  ${beatAt(frame).id}  frame ${frame}`

if (mode === 'beat' && !plan.beats.some((b) => b.id === a.beat)) stop(`no beat called "${word(a.beat) || ''}". The beats are ${plan.beats.map((b) => b.id).join(', ')}`)
if ((mode === 'unit' || (mode === 'motion' && word(a.unit))) && !plan.units.some((u) => u.id === a.unit)) stop(`no page called "${word(a.unit) || ''}". The pages are ${plan.units.map((u) => u.id).join(', ')}`)
if (mode === 'motion' && !word(a.motion)) stop('--motion needs a name: hit, page-turn, reassembly, bumper, or the name of any event of the film')
try {
  checkDisk('sheet')
} catch (e) {
  stop(e.message.replace(/^sheet: /, ''))
}

const live = mode === 'live'
const bot = word(a.bot) || cfg.live.bots[0]
const seed = word(a.seed) ? Number(a.seed) : cfg.seed
if (live && !cfg.live.bots.includes(bot)) stop(`no bot called "${bot}". The bots are ${cfg.live.bots.join(', ')}`)

let session
try {
  session = live ? await openSession({ format: format.id, assets: 'web', mode: 'live', query: `&bot=${bot}&seed=${seed}&clock=steps${word(a.step) ? `&step=${a.step}` : ''}` }) : await openSession({ format: format.id, assets: word(a.assets) || 'full' })
} catch (e) {
  stop(e.message)
}

const written = []
async function write(name, units, what, heading, tiles, caption, columns = 0) {
  const file = at('out', 'work', 'sheets', `${name}.jpg`)
  const record = recordFor(session, { units, tier: live ? `live:${word(a.live) || 'default'}` : tier, diagnostic: diag, what: { sheet: what } })
  const g = await composeSheet(tiles, file, { edge, heading, columns })
  const info = live ? { standIns: [] } : await session.page.evaluate(() => window.showcase.info())
  writeRecord(file, record, { width: g.width, height: g.height, columns: g.columns, rows: g.rows, tile: [g.tileWidth, g.tileHeight], pictures: tiles.map((t) => t.label), standIns: info.standIns, problems: [...new Set(session.problems)] })
  addLook(file, caption, by)
  written.push(file)
  console.log(`sheet: wrote ${path.relative(at(), file)}, ${tiles.length} pictures in ${g.columns} by ${g.rows}, ${g.width} by ${g.height}`)
}

const reusable = (name, units, what) => {
  const file = at('out', 'work', 'sheets', `${name}.jpg`)
  if (a.force || live) return false
  if (!fresh(file, recordFor(session, { units, tier, diagnostic: diag, what: { sheet: what } }))) return false
  console.log(`sheet: reused ${path.relative(at(), file)}, it is of this build`)
  written.push(file)
  return true
}

async function filmFrames(frames) {
  const tiles = []
  for (const frame of frames) {
    await session.page.evaluate(async ([n, t, d]) => {
      window.showcase.setDiagnostic(d)
      await window.showcase.renderFilmFrame(n, t)
    }, [frame, tier, diag])
    tiles.push({ png: await readCanvas(session.page), label: filmLabel(frame) })
  }
  return tiles
}

async function filmSheet(kind, id, frames, heading, caption, part = 0, of = 0) {
  const name = sheetName(kind, id, format.id, tier, part, of) + (diag === 'beauty' ? '' : `-${diag}`)
  const units = [...new Set(frames.flatMap((f) => unitsShown(cfg, unitAt(f).id)))]
  const what = { kind, id, frames }
  if (reusable(name, units, what)) return
  await write(name, units, what, heading, await filmFrames(frames), caption)
}

async function across(kind, id, range, sheets, words) {
  const frames = spread(range.first, range.last, count * sheets, step)
  for (let s = 0; s < sheets; s++) {
    const group = frames.slice(s * count, (s + 1) * count)
    if (!group.length) continue
    const part = sheets > 1 ? `, sheet ${s + 1} of ${sheets}` : ''
    await filmSheet(kind, id, group, `${words}${part}: ${timeLabel(group[0], fps)} to ${timeLabel(group[group.length - 1], fps)}, ${tier} tier`, `Contact sheet, ${words}${part}: ${group.length} frames from ${timeLabel(group[0], fps)} to ${timeLabel(group[group.length - 1], fps)}, ${tier} tier, ${format.id}`, s + 1, sheets)
  }
}

async function run() {
  if (mode === 'beat') {
    const b = plan.beats.find((x) => x.id === a.beat)
    await across('beat', b.id, b, 1, `the beat ${b.id}`)
  } else if (mode === 'unit') {
    const u = plan.units.find((x) => x.id === a.unit)
    const sheets = word(a.sheets) ? Number(a.sheets) : Math.ceil((u.last - u.first + 1) / fps / count)
    await across('unit', u.id, u, sheets, `the page ${u.id}`)
  } else if (mode === 'film') {
    if (word(a.sheets)) await across('film', '', { first: 0, last: plan.frameCount - 1 }, Number(a.sheets), 'the whole film')
    else for (let i = 0; i < plan.units.length; i++) await filmSheet('film', plan.units[i].id, spread(plan.units[i].first, plan.units[i].last, count, step), `The whole film, sheet ${i + 1} of ${plan.units.length}: the page ${plan.units[i].id}, ${tier} tier`, `Contact sheet across the whole film, sheet ${i + 1} of ${plan.units.length}: the page ${plan.units[i].id}, ${tier} tier, ${format.id}`, i + 1, plan.units.length)
  } else if (mode === 'pages') {
    const name = sheetName('pages', '', format.id, tier)
    const units = plan.units.map((u) => u.id)
    const what = { kind: 'pages', pages: units }
    if (reusable(name, units, what)) return
    const tiles = []
    for (const u of units) {
      await session.page.evaluate(async ([spec, d]) => {
        window.showcase.setDiagnostic(d)
        await window.showcase.renderStill(spec)
      }, [{ page: u, camera: 'home', tier }, diag])
      tiles.push({ png: await readCanvas(session.page), label: `${u}  at rest` })
    }
    await write(name, units, what, `The six pages at rest, ${tier} tier`, tiles, `The six pages at rest on one sheet, ${tier} tier, ${format.id}`, 3)
  } else if (mode === 'loop' || mode === 'opening') {
    const words = mode === 'loop' ? 'the card loop' : "film A's opening"
    const got = await ask(session, mode)
    if (!got.value) throw new Error(`${got.missing}, so there is nothing to sheet yet`)
    const frames = spread(0, got.value.frameCount - 1, count, mode === 'loop' ? stepOf(fps, cfg.deliver.cardLoop.fps) : step)
    const name = sheetName(mode, '', format.id, tier)
    const units = mode === 'loop' ? plan.units.map((u) => u.id) : []
    const what = { kind: mode, frames }
    if (reusable(name, units, what)) return
    const tiles = []
    for (const frame of frames) {
      await sources[mode].draw(session.page, frame, tier, 'beauty')
      tiles.push({ png: await readCanvas(session.page), label: `${timeLabel(frame, fps)}  ${mode === 'loop' ? `the loop, ${got.value.scene}` : 'the opening'}  frame ${frame}` })
    }
    await write(name, units, what, `Across ${words}, ${tier} tier`, tiles, `Contact sheet across ${words}: ${frames.length} frames, ${tier} tier, ${format.id}`)
  } else if (mode === 'motion') {
    const moment = momentOf(a.motion)
    const nth = word(a.nth) ? Number(a.nth) : 1
    const only = word(a.unit) ? plan.units.find((u) => u.id === a.unit) : null
    const found = await findMoment(session, plan, a.motion, { nth, unit: only, tolerance: cfg.film.beatToleranceSeconds })
    if (!found) throw new Error(`the film reports no ${moment.words}${nth > 1 ? ` number ${nth}` : ''}${only ? ` in ${only.id}` : ''}, so there is no moment to sheet`)
    const frames = around(found.frame, count, step, 0, plan.frameCount - 1)
    await filmSheet('motion', `${a.motion}${nth > 1 ? `-${nth}` : ''}${only ? `-${only.id}` : ''}`, frames, `The ${moment.words}: the event ${found.name} at frame ${found.frame}, ${timeLabel(found.frame, fps)}, and the ${frames.length} frames round it, ${tier} tier`, `Consecutive frames of the ${moment.words}: the event ${found.name} at ${timeLabel(found.frame, fps)} in ${beatAt(found.frame).id}, ${tier} tier, ${format.id}`)
  } else if (mode === 'live') {
    const has = await session.page.evaluate(() => Boolean(window.liveRun))
    if (!has) throw new Error('the live site cannot be stepped by a bot yet. It needs the change in tools/HARNESS-NEEDS.patch (a bot as the driver and a stepped clock in live mode)')
    const total = word(a.seconds) ? Number(a.seconds) : null
    const first = await session.page.evaluate(() => window.liveRun.state())
    let length = total
    if (!length) {
      const run = readJson(at('out', 'work', 'bots.json')).runs.find((r) => r.bot === bot && r.seed === seed)
      if (!run) throw new Error(`no run of ${bot} with seed ${seed} in out/work/bots.json to take the length from. Run npm run bots, or give --seconds`)
      length = run.seconds
    }
    const tiles = []
    let now = first.time
    for (let i = 0; i < count; i++) {
      const to = (length * (i + 0.5)) / count
      const s = await session.page.evaluate((dt) => window.liveRun.advance(dt), Math.max(0, to - now))
      now = s.time
      tiles.push({ png: Buffer.from(s.png.split(',')[1], 'base64'), label: `${s.time.toFixed(1)} s  ${s.page}${s.gag ? `  ${s.gag}` : ''}` })
      if (s.finished) break
    }
    await write(sheetName('live', `${bot}-${seed}`, format.id, 'live'), plan.units.map((u) => u.id), { kind: 'live', bot, seed, seconds: length }, `The live site with the bot ${bot} driving, seed ${seed}, ${length.toFixed(1)} s`, tiles, `The live site's own path with the bot ${bot} driving, seed ${seed}: ${tiles.length} moments of its run of ${length.toFixed(1)} s`)
  }
}

let code = 0
try {
  await run()
} catch (e) {
  console.error(`sheet: ${String(e.message).replace(/^sheet: /, '')}`)
  code = 1
} finally {
  await session.close()
}
console.log(`sheet: ${written.length} sheet${written.length === 1 ? '' : 's'} in ${took(seconds(t0))}`)
process.exit(code)
