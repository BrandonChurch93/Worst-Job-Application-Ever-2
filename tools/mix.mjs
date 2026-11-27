// npm run mix: the film's sound laid on its events. It reads cut/CUTLIST.json when the cut has written one, and the stage itself until then.
// With no kept sound it writes a silent file of the film's exact length. Run twice, it gives the same bytes.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'
import { engineInBrowser, keptRecords, keptSounds, listenerFindings, modulesFrom, places, readLedger, refuseStale, sha, siteBuild, siteInBrowser, target } from './sound.mjs'
import { keptSum, mixBuild, proveCutList } from './lib/cut-build.mjs'

const rel = (p) => path.relative(at(), p)
const narration = () => readJson(at('content', 'narration.json'))
const lineExists = (r, c, cues) => {
  try {
    target({ line: r.beat ? `${r.beat}:${r.index}` : `live.${r.liveKey}:${r.index}` }, c, cues)
    return true
  } catch {
    return false
  }
}

// The events and the lines of the film, by frame.
// A cut list on disk is used only when it is, byte for byte, the list this build gives now: the film is run once more to prove it,
// and a list of another build is refused with the command that mends it. The plan carries the sha256 of the list it was read from.
export async function filmPlan(c, M, file = at('cut', 'CUTLIST.json')) {
  const fps = c.film.fps
  const seconds = c.film.units.reduce((s, u) => s + u.seconds, 0)
  const timed = M.copy.timedLines(c, narration())
  let lines = timed.map((l) => ({ id: M.cues.filmLineId(l.beat, l.index), beat: l.beat, index: l.index, frame: Math.round(l.start * fps) }))
  if (fs.existsSync(file)) {
    const cutSha256 = await proveCutList(M.load, file, 'the mix')
    const cut = readJson(file)
    const frameOf = (e) => (Number.isFinite(e.frame) ? e.frame : Number.isFinite(e.seconds) ? Math.floor(e.seconds * fps + 1e-6) : Number.isFinite(e.time) ? Math.floor(e.time * fps + 1e-6) : Number.isFinite(e.step) ? Math.floor((e.step * fps) / c.sim.stepHz) : NaN)
    const list = Array.isArray(cut.events) ? cut.events.map((e) => ({ name: e.name, frame: frameOf(e), x: Number.isFinite(e.x) ? e.x : 960, ...(typeof e.page === 'string' ? { page: e.page } : {}) })) : []
    if (list.length && list.every((e) => typeof e.name === 'string' && Number.isFinite(e.frame))) {
      const lineFrame = (l) => (Number.isFinite(l.first) ? l.first : frameOf({ frame: l.frame, seconds: l.startSeconds ?? l.start }))
      if (Array.isArray(cut.lines) && cut.lines.every((l) => typeof l.beat === 'string' && Number.isFinite(lineFrame(l)))) {
        lines = cut.lines.map((l) => ({ id: typeof l.id === 'string' ? l.id : M.cues.filmLineId(l.beat, l.index ?? 0), beat: l.beat, index: l.index ?? 0, frame: lineFrame(l) }))
      }
      const total = Number.isFinite(cut.frameCount) ? cut.frameCount / fps : Number.isFinite(cut.seconds) ? cut.seconds : seconds
      return { source: 'cut/CUTLIST.json', cutSha256, fps, seconds: total, events: list, lines }
    }
    console.log('mix: cut/CUTLIST.json is there but holds no list of events by name and frame, so the events are read from the stage')
  }
  const { Stage, ScriptDriver, wholeFilmFlow } = await M.load('/src/stage/stage.ts')
  const { pages } = await M.load('/src/pages/index.ts')
  const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  stage.advance(Math.round(seconds * c.sim.stepHz))
  const events = stage.events.map((e) => ({ name: e.name, frame: Math.floor((e.step * fps) / c.sim.stepHz), x: e.x, page: e.page }))
  return { source: 'the stage', fps, seconds, events, lines }
}

// The plan cut off at a time of the film: the events and the lines that start before it. For a preview of the first seconds alone.
export function planUntil(plan, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds >= plan.seconds) return plan
  const frames = Math.round(seconds * plan.fps)
  return { ...plan, source: `${plan.source}, its first ${seconds} s`, seconds: frames / plan.fps, events: plan.events.filter((e) => e.frame < frames), lines: plan.lines.filter((l) => l.frame < frames) }
}

const planSha = (plan) => sha(Buffer.from(JSON.stringify([plan.seconds, plan.fps, plan.events, plan.lines])))

// Film A's plan: the opening's own sounds, then film B's plan moved back by the opening's frames. Null when the opening cannot be read.
export async function filmPlanA(c, M) {
  const b = await filmPlan(c, M)
  const cutFile = at('cut', 'CUTLIST.json')
  const cut = fs.existsSync(cutFile) ? readJson(cutFile) : {}
  let events = null
  let frames = cut.opening && Number.isFinite(cut.opening.frameCount) ? cut.opening.frameCount : null
  let source = 'cut/CUTLIST.json'
  if (cut.opening && Array.isArray(cut.opening.events) && cut.opening.events.every((e) => typeof e.name === 'string' && Number.isFinite(e.frame))) events = cut.opening.events.map((e) => ({ name: e.name, frame: e.frame, x: Number.isFinite(e.x) ? e.x : 960 }))
  else {
    try {
      const o = await M.load('/src/film/opening.ts')
      const t = o.openingTimes()
      events = M.mix.openingEvents({ prompt: c.intro.prompt, charsPerSecond: c.intro.charsPerSecond, levelOpens: t.levelOpens, levelPicks: t.levelPicks, sendPressed: t.held, linesDone: t.lines.map((l) => l.done) }, b.fps)
      if (frames === null) frames = o.openingFrames()
      source = 'the times of src/film/opening.ts'
    } catch (e) {
      return { plan: null, why: `the opening's times could not be read: ${e.message}` }
    }
  }
  if (frames === null) return { plan: null, why: 'the length of the opening is not known' }
  return { plan: { source: `${b.source}, behind the opening from ${source}`, cutSha256: b.cutSha256 ?? null, fps: b.fps, seconds: frames / b.fps + b.seconds, events: [...events, ...M.mix.behindOpening(b.events, frames)], lines: M.mix.behindOpening(b.lines, frames), toneFromFrame: frames, openingFrames: frames, openingEvents: events.length } }
}

export async function makeMix(P, c, M, out, name, given = null) {
  const plan = given ?? (await filmPlan(c, M))
  const { sounds, absent, stale } = keptSounds(P, M)
  refuseStale(stale, 'the mix')
  const result = M.mix.mixFilm({
    sampleRate: c.audio.sampleRate, fps: plan.fps, seconds: plan.seconds, events: plan.events, lines: plan.lines, sounds, sfx: c.audio.sfx,
    duckDb: c.audio.duckDb, holdMusicSeconds: c.audio.holdMusicSeconds, targetLufs: c.audio.filmLoudnessLufs, truePeakDb: c.audio.truePeakDb, toneFromFrame: plan.toneFromFrame ?? 0
  })
  const bytes = M.dsp.encodeWav(result.sound, M.levels.MIX.bitsPerSample)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, bytes)
  const fix = (v) => (Number.isFinite(v) ? Number(v.toFixed(2)) : null)
  const record = {
    mix: name, file: path.basename(out), source: plan.source, planSha256: planSha(plan), cutSha256: plan.cutSha256 ?? null, keptSha256: keptSum(keptRecords(P).filter((r) => sounds.has(r.id))), build: mixBuild(), ...(plan.openingFrames ? { openingFrames: plan.openingFrames, openingEvents: plan.openingEvents } : {}), seconds: plan.seconds, frames: Math.round(plan.seconds * plan.fps), fps: plan.fps, sampleRate: c.audio.sampleRate, bits: M.levels.MIX.bitsPerSample,
    samples: result.sound.channels[0].length, silent: result.mastered.silent, lufs: fix(result.mastered.lufs), truePeakDb: fix(result.mastered.truePeakDb), gainDb: fix(result.mastered.gainDb),
    targetLufs: c.audio.filmLoudnessLufs, ceilingDb: c.audio.truePeakDb, duckDb: c.audio.duckDb, bytes: bytes.length, sha256: sha(bytes),
    events: plan.events.length, mappedEvents: plan.events.filter((e) => M.cues.cueOfEvent(e.name)).length, cuesLaid: result.placed.filter((p) => p.kind === 'cue').length, linesLaid: result.placed.filter((p) => p.kind === 'line').length, standInsLaid: result.placed.filter((p) => p.kind === 'stand-in').length,
    missingCues: result.missingCues, missingLines: result.missingLines, recordsWithNoFile: absent, hushed: result.hushed, quiet: result.quiet,
    placed: result.placed.map((p) => ({ ...p, seconds: Number(p.seconds.toFixed(4)), pan: Number(p.pan.toFixed(3)) }))
  }
  writeJson(out.replace(/\.wav$/, '.json'), record)
  return record
}

// The mix as a picture: its level over the film, the cues by class, the narrator's lines, and where the effects are held down.
export async function picture(c, M, wav, out) {
  const sharp = (await import('sharp')).default
  const r = readJson(wav.replace(/\.wav$/, '.json'))
  const mono = M.dsp.toMono(M.dsp.decodeWav(fs.readFileSync(wav)))
  const W = 1800
  const pad = 16
  const left = 120
  const w = W - left - pad
  const rows = ['hit', 'mechanism', 'tick', 'music']
  const names = { hit: 'hits and slams', mechanism: 'mechanisms', tick: 'steps and ticks', music: 'hold music' }
  const colour = { hit: '#e07a5f', mechanism: '#8fb6d9', tick: '#9fc490', music: '#c9a0dc' }
  const top = 86
  const waveH = 150
  const rowH = 34
  const H = top + waveH + 30 + rows.length * rowH + 60 + pad
  const x = (seconds) => left + (seconds / r.seconds) * w
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const text = (tx, ty, t, size = 12, fill = '#e9e6df', anchor = 'start') => `<text x="${tx}" y="${ty}" font-family="sans-serif" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(t)}</text>`
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1d1e22"/>`
  svg += text(pad, 28, r.silent ? `The mix of the film: ${r.seconds} s of silence, because no sound is kept` : `The mix of the film: ${r.seconds} s, ${r.cuesLaid} cues and ${r.linesLaid} lines from ${r.source}, ${r.lufs} LUFS, true peak ${r.truePeakDb} dB`, 18)
  svg += text(pad, 50, `sha256 ${r.sha256.slice(0, 16)}. Wanted: ${r.targetLufs} LUFS within one unit, peaks at or under ${r.ceilingDb} dB, effects ${r.duckDb} dB lower under a line`, 12, '#9fa3ab')
  let at = 0
  for (const u of c.film.units) {
    svg += `<line x1="${x(at).toFixed(1)}" y1="${top - 22}" x2="${x(at).toFixed(1)}" y2="${H - pad}" stroke="#3a3d44" stroke-width="1"/>` + text(x(at) + 4, top - 10, u.id, 12, '#9fa3ab')
    at += u.seconds
  }
  const mid = top + waveH / 2
  svg += `<rect x="${left}" y="${top}" width="${w}" height="${waveH}" fill="#26282d"/>` + text(pad, mid + 4, 'level', 12, '#9fa3ab')
  let d = ''
  for (let i = 0; i < w; i++) {
    const from = Math.floor((i / w) * mono.length)
    const p = M.dsp.peak(mono, from, Math.max(from + 1, Math.floor(((i + 1) / w) * mono.length)))
    if (p > 0) d += `M${left + i} ${(mid - p * (waveH / 2)).toFixed(1)}V${(mid + p * (waveH / 2)).toFixed(1)}`
  }
  if (d) svg += `<path d="${d}" stroke="#d8d4cb" stroke-width="1" fill="none"/>`
  const ceiling = M.levels.db(r.ceilingDb) * (waveH / 2)
  svg += `<line x1="${left}" y1="${(mid - ceiling).toFixed(1)}" x2="${left + w}" y2="${(mid - ceiling).toFixed(1)}" stroke="#e07a5f" stroke-width="1" stroke-dasharray="4 4"/>`
  let y = top + waveH + 30
  for (const cls of rows) {
    svg += text(pad, y + rowH / 2 + 4, names[cls], 12, '#9fa3ab') + `<rect x="${left}" y="${y + 3}" width="${w}" height="${rowH - 6}" fill="#26282d"/>`
    for (const p of r.placed.filter((q) => q.kind === 'cue' && M.cues.cueClass[q.cue] === cls)) svg += `<rect x="${x(p.sample / r.sampleRate).toFixed(1)}" y="${y + 6}" width="${Math.max(1.5, (p.seconds / r.seconds) * w).toFixed(1)}" height="${rowH - 12}" fill="${colour[cls]}" fill-opacity="0.8"/>`
    y += rowH
  }
  svg += text(pad, y + 22, 'the narrator', 12, '#9fa3ab') + `<rect x="${left}" y="${y + 3}" width="${w}" height="34" fill="#26282d"/>`
  for (const p of r.placed.filter((q) => q.kind === 'line')) svg += `<rect x="${x(p.sample / r.sampleRate).toFixed(1)}" y="${y + 6}" width="${Math.max(1.5, (p.seconds / r.seconds) * w).toFixed(1)}" height="28" fill="#e9a15b"/>`
  if (!r.placed.length) svg += text(left + 8, y + 24, `nothing is laid: ${r.missingCues.length} cues and ${r.missingLines.length} lines have no kept sound`, 12, '#9fa3ab')
  for (let t = 0; t <= r.seconds; t += 10) svg += text(x(t), H - pad - 2, `${t} s`, 11, '#9fa3ab', 'middle')
  svg += '</svg>'
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp(Buffer.from(svg)).png().toFile(out)
  return out
}

const lastLine = (r, out) => r.silent
  ? `mix: SILENT. No sound is kept, so ${rel(out)} is ${r.seconds.toFixed(3)} s of silence, ${r.samples} samples at ${r.sampleRate} Hz, the film's exact length. sha256 ${r.sha256.slice(0, 16)}`
  : `mix: ${rel(out)}, ${r.seconds.toFixed(3)} s, ${r.cuesLaid} cues and ${r.linesLaid} lines laid from ${r.source}, ${r.standInsLaid ?? 0} lines as silent stand-ins with no voice, ${r.lufs} LUFS, true peak ${r.truePeakDb} dB, ${r.missingCues.length} cues and ${r.missingLines.length} lines with no kept sound. sha256 ${r.sha256.slice(0, 16)}`

const has = (file, re) => fs.existsSync(file) && re.test(fs.readFileSync(file, 'utf8'))

function ffmpegLoudness(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 28 })
  const text = (r.stderr || '').toString()
  const tail = text.slice(text.lastIndexOf('Summary:'))
  const i = /I:\s+(-?[\d.]+|-inf) LUFS/.exec(tail)
  const p = /Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(tail)
  return { lufs: i ? Number(i[1]) : null, truePeakDb: p ? Number(p[1]) : null }
}

// The sound checks A1 to A11. Each is pass, fail or not yet, with its reason. None can fail a gate.
export async function soundChecks(a, P, c, M) {
  const checks = []
  const add = (id, status, reason, facts = {}) => checks.push({ id, status, reason, ...facts })
  const records = keptRecords(P)
  const ledger = readLedger(P)
  const loads = /import\(['"][./]+\/audio(\/index)?(\.ts)?['"]\)/
  const sources = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? (path.join(dir, f.name) === at('src', 'audio') ? [] : sources(path.join(dir, f.name))) : /\.ts$/.test(f.name) ? [path.join(dir, f.name)] : []))
  const loaders = sources(at('src')).filter((f) => loads.test(fs.readFileSync(f, 'utf8'))).map(rel)
  const wired = loaders.length > 0
  const notWired = 'No file of the site loads the sound engine yet, so the site has no sound to test in a browser'

  const engine = await engineInBrowser(P, c)
  const site = wired ? await siteInBrowser(await siteBuild(P)) : null
  const live = site && site.built && site.live.started ? { built: true, ...site.live } : null
  const siteNote = !wired ? notWired : !site.built ? 'The site is not built. Run npm run build' : !site.live.started ? `The site did not start: ${site.live.errors.join('; ')}` : ''
  if (site) writeJson(P.scratch ? path.join(path.dirname(P.audio), 'site.json') : at('out', 'work', 'audio', 'site.json'), site)
  const early = engine.runs.filter((r) => r.before.contexts > 0 || r.before.plays > 0 || r.soundRequestsBefore > 0)
  const engineFact = `on a page of its own in a browser the engine made ${engine.runs.reduce((n, r) => n + r.before.contexts, 0)} audio contexts and asked for ${engine.runs.reduce((n, r) => n + r.soundRequestsBefore, 0)} sound files before the first click, over ${engine.runs.length} visits, with events, a beat and a trigger sent to it first`
  if (early.length) add('A1', 'fail', `the engine starts before the first click: ${engineFact}`, { engine: engine.runs.map((r) => ({ name: r.name, before: r.before })) })
  else if (live && live.built) {
    const ok = live.before.contexts === 0 && live.before.plays === 0
    add('A1', ok ? 'pass' : 'fail', `the live site, 3 s after its first picture and before any click: ${live.before.contexts} audio contexts, ${live.before.plays} sounds played, ${live.before.soundRequests} sound files asked for; after the click ${live.after.contexts} audio contexts and ${live.after.soundRequests} sound files. Also ${engineFact}${engine.lists ? '' : '. No sound is kept, so nothing plays after the click either'}`, { site: { before: live.before, after: live.after } })
  } else add('A1', 'not yet', `${siteNote}. Held so far: ${engineFact}`, { engine: engine.runs.map((r) => ({ name: r.name, before: r.before })) })
  if (!live) add('A2', 'not yet', siteNote)
  else if (!site.control) add('A2', engine.lists ? 'fail' : 'not yet', engine.lists ? `sound is kept and the live site shows no sound control ${site.live.controlWaitSeconds ?? 3.5} s after the first click: audio context ${live.after.context ?? 'not read'}, ${live.after.decoded ?? 'not read'} of ${live.after.decodes ?? 'not read'} sound files decoded, ${live.after.undecoded ?? 'not read'} refused, ${live.after.sources ?? 'not read'} sounds started, ${live.after.frames ?? 'not read'} frames drawn since the page opened, sound buttons in the page: ${JSON.stringify(live.after.soundButtons ?? 'not read')}` : 'no sound is kept, so the site hides the sound control, as it should: there is nothing to press yet')
  else {
    const k = site.control
    const [found, pointer, enter, space] = k.steps
    const flips = found.pressed !== pointer.pressed && pointer.pressed !== enter.pressed && enter.pressed !== space.pressed && [found, pointer, enter, space].every((x) => x.pressed === 'true' || x.pressed === 'false')
    const heard = k.steps.every((x) => (x.pressed === 'true') === (x.level > 0))
    const problems = []
    if (!k.name) problems.push('it has no name')
    if (!flips) problems.push(`its state did not change at every press: ${k.steps.map((x) => `${x.how} ${x.pressed}`).join(', ')}`)
    if (!k.reachedByTab) problems.push('the Tab key did not reach it')
    if (!k.pictureChanges) problems.push('its picture is the same in both states')
    if (live.after.contexts > 0 && !heard) problems.push(`what is heard does not follow it: ${k.steps.map((x) => `${x.how} level ${x.level}`).join(', ')}`)
    if (k.errors) problems.push(`${k.errors} errors on the page`)
    add('A2', problems.length ? 'fail' : 'pass', problems.length ? problems.join('; ') : `the control is named "${k.name}", is reached with ${k.tabs} presses of Tab, and changes its state and its picture at a pointer click, at Enter and at Space: ${k.steps.map((x) => `${x.how}: pressed ${x.pressed}, level heard ${x.level}`).join('; ')}`, { control: k })
  }

  const importers = []
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name)
      if (f.isDirectory()) {
        if (p !== at('src', 'audio')) walk(p)
      } else if (/\.(ts|js)$/.test(f.name)) {
        const text = fs.readFileSync(p, 'utf8')
        if (/from\s+['"][./]+\/audio(\/(?!cues)[\w-]+)?['"]/.test(text) || /from\s+['"]\.\/audio['"]/.test(text)) importers.push(rel(p))
      }
    }
  }
  walk(at('src'))
  const cuesClean = !/^import\s/m.test(fs.readFileSync(at('src', 'audio', 'cues.ts'), 'utf8'))
  if (importers.length || !cuesClean) add('A3', 'fail', importers.length ? `these files import audio code outright, so it would load in capture mode: ${importers.join(', ')}` : 'src/audio/cues.ts imports other code')
  else if (!site || !site.built || !site.capture) add('A3', 'not yet', `${siteNote || 'The still was not rendered'}. By its imports no audio code can load in capture mode: nothing outside src/audio/ imports it outright, and the table of cues imports nothing`)
  else {
    const k = site.capture
    if (!k.absent) add('A3', 'not yet', 'the build holds no audio code of its own to take away', { capture: k })
    else {
      const ok = k.present.sha256 !== null && k.present.sha256 === k.absent.sha256 && k.present.audioChunkRequests === 0 && k.present.contexts === 0
      add('A3', ok ? 'pass' : 'fail', `the judged still ${k.still} at ${k.format}, ${k.tier}, in capture mode: sha256 ${String(k.present.sha256).slice(0, 16)} with the audio code in the build and ${String(k.absent.sha256).slice(0, 16)} with it blocked. The page asked for the audio code ${k.present.audioChunkRequests} times, made ${k.present.contexts} audio contexts and asked for ${k.present.soundRequests} sound files. It is loaded by a dynamic import in ${loaders.join(', ')}`, { capture: k })
    }
  }

  const pubFiles = fs.existsSync(P.pub) ? fs.readdirSync(P.pub).map((f) => ({ f, bytes: fs.statSync(path.join(P.pub, f)).size })) : []
  const soundBytes = pubFiles.filter((x) => x.f !== 'index.json').reduce((s, x) => s + x.bytes, 0)
  const mb = soundBytes / 1048576
  if (!pubFiles.some((x) => x.f === 'index.json')) add('A4', 'not yet', `${rel(P.pub)} has no index. Run npm run sound -- --pack`)
  else if (mb > c.audio.appMaxMb) add('A4', 'fail', `the site's sound files are ${mb.toFixed(2)} MB together and audio.appMaxMb is ${c.audio.appMaxMb}`, { megabytes: Number(mb.toFixed(3)) })
  else if (live && (live.soundRequestsAtFirstPicture > 0 || live.before.soundRequests > 0)) add('A4', 'fail', `the live site asked for ${live.soundRequestsAtFirstPicture} sound files before its first picture and ${live.before.soundRequests} before the first click`, { megabytes: Number(mb.toFixed(3)) })
  else if (live) add('A4', 'pass', `${mb.toFixed(2)} MB of ${c.audio.appMaxMb} MB${soundBytes === 0 ? ', because no sound is kept' : ''}. The live site asked for 0 sound files before its first picture and 0 in the 3 s after it; after the first click it asked for ${live.after.soundRequests}`, { megabytes: Number(mb.toFixed(3)) })
  else add('A4', 'not yet', `${mb.toFixed(2)} MB of ${c.audio.appMaxMb} MB${soundBytes === 0 ? ', because no sound is kept' : ''}. ${siteNote}. Held so far: ${engineFact}`, { megabytes: Number(mb.toFixed(3)) })

  if (!records.length) add('A5', 'not yet', 'no sound is kept')
  else {
    const assetsFile = P.scratch ? path.join(path.dirname(P.audio), 'ASSETS.md') : at('ASSETS.md')
    const assets = fs.existsSync(assetsFile) ? fs.readFileSync(assetsFile, 'utf8') : ''
    const bad = []
    for (const r of records) {
      const lacks = []
      if (!ledger.takes.some((t) => t.sha256 === r.take.sha256)) lacks.push('its take in the log')
      if (!(r.kind !== 'cue' ? r.words : r.prompt)) lacks.push(r.kind !== 'cue' ? 'its words' : 'its prompt')
      if (!r.measured || !r.take.measured) lacks.push('its measurements')
      if (!r.listener) lacks.push("the listener's answers")
      if (!assets.includes(`audio/kept/${r.file}`)) lacks.push('its row in ASSETS.md')
      if (lacks.length) bad.push(`${r.id}: ${lacks.join(', ')}`)
    }
    add('A5', bad.length ? 'fail' : 'pass', bad.length ? `${bad.length} of ${records.length} kept sounds lack something: ${bad.slice(0, 6).join('; ')}${bad.length > 6 ? '; and more' : ''}` : `all ${records.length} kept sounds have their take, their prompt or words, their measurements, the listener's answers and a row`)
  }

  const mixes = [path.join(P.mix, 'review.wav'), ...(fs.existsSync(P.final) ? fs.readdirSync(P.final).filter((f) => f.endsWith('.wav')).map((f) => path.join(P.final, f)) : [])].filter((f) => fs.existsSync(f))
  if (!mixes.length) add('A6', 'not yet', 'no mix has been made. Run npm run mix')
  else {
    const measured = mixes.map((f) => {
      const s = M.dsp.decodeWav(fs.readFileSync(f))
      return { file: rel(f), lufs: M.dsp.loudness(s), truePeakDb: M.dsp.truePeakDb(s), ffmpeg: ffmpegLoudness(f) }
    })
    const facts = { mixes: measured.map((m) => ({ file: m.file, lufs: Number.isFinite(m.lufs) ? Number(m.lufs.toFixed(2)) : null, truePeakDb: Number.isFinite(m.truePeakDb) ? Number(m.truePeakDb.toFixed(2)) : null, ffmpegLufs: m.ffmpeg.lufs, ffmpegTruePeakDb: m.ffmpeg.truePeakDb })) }
    if (measured.every((m) => !Number.isFinite(m.lufs))) add('A6', 'not yet', 'the mix is silent because no sound is kept, so it has no loudness to measure', facts)
    else {
      const off = measured.filter((m) => Number.isFinite(m.lufs) && (Math.abs(m.lufs - c.audio.filmLoudnessLufs) > 1 || m.truePeakDb > c.audio.truePeakDb || (m.ffmpeg.lufs !== null && Math.abs(m.ffmpeg.lufs - c.audio.filmLoudnessLufs) > 1) || (m.ffmpeg.truePeakDb !== null && m.ffmpeg.truePeakDb > c.audio.truePeakDb)))
      add('A6', off.length ? 'fail' : 'pass', off.length ? `${off.map((m) => `${m.file} measures ${m.lufs.toFixed(2)} LUFS, true peak ${m.truePeakDb.toFixed(2)} dB`).join('; ')}. Wanted ${c.audio.filmLoudnessLufs} LUFS within one unit and peaks at or under ${c.audio.truePeakDb} dB` : `${measured.filter((m) => Number.isFinite(m.lufs)).map((m) => `${m.file}: ${m.lufs.toFixed(2)} LUFS, true peak ${m.truePeakDb.toFixed(2)} dB, and by ffmpeg ${m.ffmpeg.lufs} LUFS, ${m.ffmpeg.truePeakDb} dB`).join('; ')}`, facts)
    }
  }

  const one = await makeMix(P, c, M, at('out', 'work', 'audio', 'check', 'mix-1.wav'), 'check')
  const two = await makeMix(P, c, M, at('out', 'work', 'audio', 'check', 'mix-2.wav'), 'check')
  add('A7', one.sha256 === two.sha256 ? 'pass' : 'fail', one.sha256 === two.sha256 ? `the mix made twice has the same ${one.bytes} bytes, sha256 ${one.sha256.slice(0, 16)}${one.silent ? '. It is silent, because no sound is kept' : ''}` : `the mix made twice differs: ${one.sha256.slice(0, 16)} and ${two.sha256.slice(0, 16)}`, { sha256: [one.sha256, two.sha256], silent: one.silent })
  for (const f of ['mix-1.wav', 'mix-2.wav']) fs.rmSync(at('out', 'work', 'audio', 'check', f), { force: true })

  if (!ledger.takes.length) add('A8', 'pass', 'no take has been made, so no cue and no line is over its limit', { takes: 0 })
  else {
    const over = []
    const keys = [...new Set(ledger.takes.map((t) => t.key))]
    for (const key of keys) {
      const mine = ledger.takes.filter((t) => t.key === key)
      const max = mine[0].kind === 'cue' ? c.audio.maxTakesPerCue : c.audio.narratorMaxTakesPerLine
      for (const round of new Set(mine.map((t) => t.round))) {
        const n = mine.filter((t) => t.round === round).length
        if (n > max) over.push(`${key} used ${n} takes in ${round === 'build' ? 'the build' : `round ${round}`} and the limit is ${max}`)
      }
    }
    add('A8', over.length ? 'fail' : 'pass', over.length ? over.join('; ') : `${ledger.takes.length} takes over ${keys.length} sounds, none over its limit`, { takes: ledger.takes.length })
  }

  const mixRecord = path.join(P.mix, 'review.json')
  if (!fs.existsSync(mixRecord)) add('A9', 'not yet', 'no mix has been made, and cut/CUES.md is written by npm run cut')
  else {
    const r = readJson(mixRecord)
    let plan = null
    try {
      plan = await filmPlan(c, M)
    } catch (e) {
      add('A9', 'fail', `the film's events cannot be read for the check: ${String(e.message).replace(/^the mix is refused: /, '')}`)
    }
    if (!plan) {
      // Said above.
    } else if (r.planSha256 !== planSha(plan)) add('A9', 'not yet', `${rel(mixRecord)} was made from an older list of events than ${plan.source} holds now. Run npm run mix`)
    else {
    const late = []
    const seen = new Set()
    for (const e of plan.events) {
      const cue = M.cues.cueOfEvent(e.name)
      if (!cue || cue === 'room-tone' || r.missingCues.includes(cue)) continue
      if ((r.hushed ?? []).includes(`${e.name}@${e.frame}`)) continue
      const k = `${cue}@${e.frame}`
      if (seen.has(k)) continue
      seen.add(k)
      const p = r.placed.find((x) => x.kind === 'cue' && x.cue === cue && Math.abs(x.frame - e.frame) <= c.audio.contactSyncFrames)
      if (!p) late.push(`${e.name} at frame ${e.frame}`)
    }
    const timed = M.copy.timedLines(c, narration())
    const lineProblems = []
    const spoken = r.placed.filter((x) => x.kind === 'line' || x.kind === 'stand-in').sort((x, y) => x.sample - y.sample)
    let unitStart = 0
    const beatSpan = new Map()
    for (const u of c.film.units) {
      for (const b of c.film.beats.filter((x) => x.unit === u.id)) beatSpan.set(b.id, [unitStart + b.from, unitStart + b.to])
      unitStart += u.seconds
    }
    spoken.forEach((l, i) => {
      const start = l.sample / r.sampleRate
      const span = beatSpan.get(l.event)
      if (span && (start < span[0] - 1e-6 || start >= span[1])) lineProblems.push(`${l.id} starts at ${start.toFixed(2)} s, outside its beat`)
      const next = spoken[i + 1]
      if (next && start + l.seconds + c.audio.lineGapSeconds > next.sample / r.sampleRate + 1e-6) lineProblems.push(`${l.id} ends ${(next.sample / r.sampleRate - start - l.seconds).toFixed(2)} s before ${next.id}`)
    })
    const laid = r.cuesLaid + r.linesLaid
    const where = plan.source === 'cut/CUTLIST.json' ? 'Checked against the frames of cut/CUTLIST.json, the list cut/CUES.md is written from' : 'cut/CUES.md is not written yet: checked against the events of the stage'
    if (late.length || lineProblems.length) add('A9', 'fail', `${[...late.slice(0, 5).map((x) => `no cue within ${c.audio.contactSyncFrames} frame of ${x}`), ...lineProblems.slice(0, 5)].join('; ')}. ${where}`, { lateEvents: late.length, lineProblems: lineProblems.length })
    else add('A9', laid ? 'pass' : 'not yet', laid ? `${r.cuesLaid} cues start on the frame of their event and ${r.linesLaid + (r.standInsLaid ?? 0)} of ${timed.length} lines (${r.standInsLaid ?? 0} of them silent stand-ins) start inside their beat and end ${c.audio.lineGapSeconds} s before the next. ${where}` : `no sound is kept, so the mix lays nothing. ${where}`)
    }
  }

  const standIn = M.mix.scriptStandIns()
  const oldTakes = records.filter((r) => r.kind !== 'cue' && (standIn.has(r.id) || !lineExists(r, c, M.cues)))
  const lineRecords = records.filter((r) => r.kind !== 'cue' && !oldTakes.includes(r))
  if (!lineRecords.length) add('A10', 'not yet', oldTakes.length ? `no take of the script is kept: its ${standIn.size} lines are silent stand-ins, and the ${oldTakes.length} kept takes are of lines that are gone or reworded and are played nowhere` : 'no narrator line is kept')
  else {
    const bad = []
    for (const r of lineRecords) {
      const t = target({ line: r.beat ? `${r.beat}:${r.index}` : `live.${r.liveKey}:${r.index}` }, c, M.cues)
      const f = listenerFindings(t, r.listener)
      if (!f.answered) bad.push(`${r.id}: no listener has written it down`)
      else if (f.why.some((w) => w.includes('is not the line'))) bad.push(`${r.id}: ${f.why.find((w) => w.includes('is not the line'))}`)
      if (r.words !== t.text) bad.push(`${r.id}: the line in content/narration.json has changed since the take`)
    }
    add('A10', bad.length ? 'fail' : 'pass', bad.length ? `${bad.length} problems over ${lineRecords.length} kept lines: ${bad.slice(0, 5).join('; ')}${bad.length > 5 ? '; and more' : ''}` : `all ${lineRecords.length} kept lines were written down by the listener word for word`)
  }

  const none = engine.runs.find((r) => r.name === 'with an index that lists nothing')
  const gone = engine.runs.find((r) => r.name.startsWith('with the sound files removed'))
  const silentRun = (r) => r.after.state === 'silent' && r.after.available === false && r.errors.length === 0
  const engineSilent = `on a page of its own the engine, with an index that lists nothing, is ${none.after.state}, available() ${none.after.available}, ${none.after.contexts} audio contexts, ${none.soundRequests} requests, ${none.errors.length} errors, ${none.console.length} console lines${gone ? `; with the files removed and the index still naming them it is ${gone.after.state}, available() ${gone.after.available}, ${gone.errors.length} errors, and the browser itself writes ${gone.console.length} line about the file it did not find` : ''}`
  if (!silentRun(none) || none.console.length || (gone && !silentRun(gone))) add('A11', 'fail', engineSilent, { engine: engine.runs })
  else if (live) {
    const bare = site.removed
    const own = bare.console.filter((l) => !/Failed to load resource.*\/audio\//.test(l))
    const ok = bare.started && !bare.after.failShown && bare.after.control === 0 && bare.after.plays === 0 && bare.errors.length === 0 && own.length === 0 && (engine.lists || bare.console.length === 0)
    add('A11', ok ? 'pass' : 'fail', `the live site ${engine.lists ? 'with every sound file answered as not found' : 'as built, which has no sound files'}, after a click: sound control shown ${bare.after.control} times, ${bare.after.soundRequests} sound files asked for, ${bare.errors.length} errors, ${own.length} console lines of the site${bare.console.length - own.length ? ` and ${bare.console.length - own.length} that the browser writes itself about the file it did not find` : ''}, failure box ${bare.after.failShown ? 'shown' : 'hidden'}. Also ${engineSilent}`, { site: bare })
  } else add('A11', 'not yet', `${siteNote}. Held so far: ${engineSilent}`, { engine: engine.runs.map((r) => ({ name: r.name, after: r.after, errors: r.errors, console: r.console })) })

  const out = P.scratch ? path.join(path.dirname(P.audio), 'sound-checks.json') : at('out', 'work', 'sound-checks.json')
  writeJson(out, { about: 'The sound checks A1 to A11 of kit/07-QUALITY-BAR.md. None can fail a gate: a failing one is an open item.', root: P.scratch ? rel(P.audio) : 'audio', checks, also: { filmOnTheSite: site?.film ?? null, filmAOnTheSite: site?.filmA ?? null } })
  for (const k of checks) console.log(`${k.id}  ${k.status.padEnd(7)}  ${k.reason}`)
  const count = (s) => checks.filter((k) => k.status === s).length
  if (site?.film?.steps?.length) console.log(`also measured, the film on the site with its sound: ${site.film.steps.map((x) => `${x.what}: ${x.level === null ? 'held, nothing comes out' : `level ${x.level}`}, ${x.sources} sounds ${x.level === null ? 'waiting' : 'running'}, ${x.toneLoops} of them the room tone, graph ${x.context}`).join('; ')}. ${site.film.errors.length} errors`)
  if (site?.film?.seekInto) console.log(`also measured, a seek into a beat on the site: ${site.film.seekInto.secondsIntoTheBeat} s into ${site.film.seekInto.beat}, with ${site.film.seekInto.lineStillToCome} of ${site.film.seekInto.lineSeconds} s wanted ${site.film.seekInto.wantedIn} s later, at play the site set ${site.film.seekInto.booked.length} sounds ahead${site.film.seekInto.booked.length ? `: ${site.film.seekInto.booked.map((x) => `one of ${x.seconds} s in ${x.in} s`).join(', ')}` : ''}`)
  if (site?.filmA && site.filmA.heard !== null) console.log(`also measured, film A on the site: over its opening of ${site.filmA.openingSeconds.toFixed(3)} s it plays ${site.filmA.heard} sounds, the mix lays ${site.filmA.laid}; ${site.filmA.toneLoopsInTheOpening} room tones run in the opening and ${site.filmA.toneLoopsAfterIt} after it. ${site.filmA.errors.length} errors`)
  console.log(`sound checks: ${count('pass')} pass, ${count('fail')} fail, ${count('not yet')} not yet. Written to ${rel(out)}`)
  return checks
}

async function main() {
  const a = args()
  const c = config()
  const P = places(a.root)
  const { load, close } = await logic()
  try {
    const M = await modulesFrom(load)
    if (a.picture) {
      const wav = path.join(P.mix, 'review.wav')
      if (!fs.existsSync(wav)) throw new Error('no mix to draw. Run npm run mix first')
      const out = a.out && a.out !== true ? path.resolve(a.out) : at('out', 'work', 'audio', P.scratch ? 'mix-fixtures.png' : 'mix.png')
      console.log(`mix: drawn on ${rel(await picture(c, M, wav, out))}`)
    } else if (a.final) {
      const out = a.out && a.out !== true ? path.resolve(a.out) : path.join(P.final, 'film-b.wav')
      const r = await makeMix(P, c, M, out, 'film-b')
      console.log(lastLine(r, out))
      if (!(a.out && a.out !== true)) {
        const A = await filmPlanA(c, M)
        if (!A.plan) console.log(`mix: film A is not mixed, because ${A.why}`)
        else {
          const outA = path.join(P.final, 'film-a.wav')
          const ra = await makeMix(P, c, M, outA, 'film-a', A.plan)
          console.log(`mix: film A is the opening, ${A.plan.openingFrames} frames with ${A.plan.openingEvents} sounds of its own, and then film B unchanged`)
          console.log(lastLine(ra, outA))
        }
      }
    } else {
      const out = a.out && a.out !== true ? path.resolve(a.out) : path.join(P.mix, 'review.wav')
      const r = await makeMix(P, c, M, out, 'review', a.until !== undefined && a.until !== true ? planUntil(await filmPlan(c, M), Number(a.until)) : null)
      console.log(`mix: ${r.events} events of the film from ${r.source}, ${r.mappedEvents} of them with a cue`)
      if (r.missingCues.length && !r.silent) console.log(`mix: no kept sound for: ${r.missingCues.join(', ')}`)
      if (r.missingLines.length && !r.silent) console.log(`mix: no kept line for: ${r.missingLines.join(', ')}`)
      console.log(lastLine(r, out))
    }
  } finally {
    await close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`mix: ${e.message}`)
    process.exit(1)
  })
}
