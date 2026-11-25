// npm run mix: the film's sound laid on its events. It reads cut/CUTLIST.json when the cut has written one, and the stage itself until then.
// With no kept sound it writes a silent file of the film's exact length. Run twice, it gives the same bytes.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { logic } from './lib/logic.mjs'
import { keptRecords, keptSounds, listenerFindings, modulesFrom, places, readLedger, sha, target } from './sound.mjs'

const rel = (p) => path.relative(at(), p)
const narration = () => readJson(at('content', 'narration.json'))

// The events and the lines of the film, by frame.
export async function filmPlan(c, M) {
  const fps = c.film.fps
  const seconds = c.film.units.reduce((s, u) => s + u.seconds, 0)
  const timed = M.copy.timedLines(c, narration())
  let lines = timed.map((l) => ({ id: M.cues.filmLineId(l.beat, l.index), beat: l.beat, index: l.index, frame: Math.round(l.start * fps) }))
  const file = at('cut', 'CUTLIST.json')
  if (fs.existsSync(file)) {
    const cut = readJson(file)
    const frameOf = (e) => (Number.isFinite(e.frame) ? e.frame : Number.isFinite(e.seconds) ? Math.floor(e.seconds * fps + 1e-6) : Number.isFinite(e.time) ? Math.floor(e.time * fps + 1e-6) : Number.isFinite(e.step) ? Math.floor((e.step * fps) / c.sim.stepHz) : NaN)
    const list = Array.isArray(cut.events) ? cut.events.map((e) => ({ name: e.name, frame: frameOf(e), x: Number.isFinite(e.x) ? e.x : 960 })) : []
    if (list.length && list.every((e) => typeof e.name === 'string' && Number.isFinite(e.frame))) {
      const lineFrame = (l) => (Number.isFinite(l.first) ? l.first : frameOf({ frame: l.frame, seconds: l.startSeconds ?? l.start }))
      if (Array.isArray(cut.lines) && cut.lines.every((l) => typeof l.beat === 'string' && Number.isFinite(lineFrame(l)))) {
        lines = cut.lines.map((l) => ({ id: typeof l.id === 'string' ? l.id : M.cues.filmLineId(l.beat, l.index ?? 0), beat: l.beat, index: l.index ?? 0, frame: lineFrame(l) }))
      }
      const total = Number.isFinite(cut.frameCount) ? cut.frameCount / fps : Number.isFinite(cut.seconds) ? cut.seconds : seconds
      return { source: 'cut/CUTLIST.json', fps, seconds: total, events: list, lines }
    }
    console.log('mix: cut/CUTLIST.json is there but holds no list of events by name and frame, so the events are read from the stage')
  }
  const { Stage, ScriptDriver, wholeFilmFlow } = await M.load('/src/stage/stage.ts')
  const { pages } = await M.load('/src/pages/index.ts')
  const stage = new Stage({ mode: 'film', flow: wholeFilmFlow(), pages, driver: new ScriptDriver(), film: { arrive: false, leave: false } })
  stage.advance(Math.round(seconds * c.sim.stepHz))
  const events = stage.events.map((e) => ({ name: e.name, frame: Math.floor((e.step * fps) / c.sim.stepHz), x: e.x }))
  return { source: 'the stage', fps, seconds, events, lines }
}

export async function makeMix(P, c, M, out, name) {
  const plan = await filmPlan(c, M)
  const { sounds, absent } = keptSounds(P, M)
  const result = M.mix.mixFilm({
    sampleRate: c.audio.sampleRate, fps: plan.fps, seconds: plan.seconds, events: plan.events, lines: plan.lines, sounds, sfx: c.audio.sfx,
    duckDb: c.audio.duckDb, holdMusicSeconds: c.audio.holdMusicSeconds, targetLufs: c.audio.filmLoudnessLufs, truePeakDb: c.audio.truePeakDb
  })
  const bytes = M.dsp.encodeWav(result.sound, M.levels.MIX.bitsPerSample)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, bytes)
  const fix = (v) => (Number.isFinite(v) ? Number(v.toFixed(2)) : null)
  const record = {
    mix: name, file: path.basename(out), source: plan.source, seconds: plan.seconds, frames: Math.round(plan.seconds * plan.fps), fps: plan.fps, sampleRate: c.audio.sampleRate, bits: M.levels.MIX.bitsPerSample,
    samples: result.sound.channels[0].length, silent: result.mastered.silent, lufs: fix(result.mastered.lufs), truePeakDb: fix(result.mastered.truePeakDb), gainDb: fix(result.mastered.gainDb),
    targetLufs: c.audio.filmLoudnessLufs, ceilingDb: c.audio.truePeakDb, duckDb: c.audio.duckDb, bytes: bytes.length, sha256: sha(bytes),
    events: plan.events.length, mappedEvents: plan.events.filter((e) => M.cues.eventCues[e.name]).length, cuesLaid: result.placed.filter((p) => p.kind === 'cue').length, linesLaid: result.placed.filter((p) => p.kind === 'line').length,
    missingCues: result.missingCues, missingLines: result.missingLines, recordsWithNoFile: absent,
    placed: result.placed.map((p) => ({ ...p, seconds: Number(p.seconds.toFixed(4)), pan: Number(p.pan.toFixed(3)) }))
  }
  writeJson(out.replace(/\.wav$/, '.json'), record)
  return record
}

const lastLine = (r, out) => r.silent
  ? `mix: SILENT. No sound is kept, so ${rel(out)} is ${r.seconds.toFixed(3)} s of silence, ${r.samples} samples at ${r.sampleRate} Hz, the film's exact length. sha256 ${r.sha256.slice(0, 16)}`
  : `mix: ${rel(out)}, ${r.seconds.toFixed(3)} s, ${r.cuesLaid} cues and ${r.linesLaid} lines laid from ${r.source}, ${r.lufs} LUFS, true peak ${r.truePeakDb} dB, ${r.missingCues.length} cues and ${r.missingLines.length} lines with no kept sound. sha256 ${r.sha256.slice(0, 16)}`

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
  const wired = has(at('src', 'main.ts'), /import\(['"]\.\/audio(\/index)?['"]\)/)
  const notWired = 'src/main.ts does not load the sound engine yet, so the site has no sound to test in a browser'

  add('A1', 'not yet', wired ? 'the browser test of the first click is not run by this command yet' : notWired, { byCode: 'src/audio/index.ts makes no audio context, no audio element and no request before unlock(): tests/audio-engine.test.ts holds it to that' })
  add('A2', 'not yet', wired ? 'the sound control is the interface\'s part: its test is not run by this command yet' : notWired)

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
  else add('A3', wired ? 'pass' : 'not yet', wired ? 'by its imports: only src/main.ts loads the sound engine, by a dynamic import outside capture mode, and the table of cues imports nothing. The two stills themselves are not rendered by this command' : `${notWired}. By its imports no audio code can load in capture mode: nothing outside src/audio/ imports it, and the table of cues imports nothing`)

  const pubFiles = fs.existsSync(P.pub) ? fs.readdirSync(P.pub).map((f) => ({ f, bytes: fs.statSync(path.join(P.pub, f)).size })) : []
  const soundBytes = pubFiles.filter((x) => x.f !== 'index.json').reduce((s, x) => s + x.bytes, 0)
  const mb = soundBytes / 1048576
  if (!pubFiles.some((x) => x.f === 'index.json')) add('A4', 'not yet', `${rel(P.pub)} has no index. Run npm run sound -- --pack`)
  else if (mb > c.audio.appMaxMb) add('A4', 'fail', `the site's sound files are ${mb.toFixed(2)} MB together and audio.appMaxMb is ${c.audio.appMaxMb}`, { megabytes: Number(mb.toFixed(3)) })
  else add('A4', soundBytes > 0 && wired ? 'pass' : 'not yet', soundBytes === 0 ? `no sound is kept, so the site ships an index that lists nothing: 0 MB of ${c.audio.appMaxMb} MB` : `${mb.toFixed(2)} MB of ${c.audio.appMaxMb} MB. The engine fetches nothing before unlock(), which the first click calls${wired ? '' : `. ${notWired}`}`, { megabytes: Number(mb.toFixed(3)) })

  if (!records.length) add('A5', 'not yet', 'no sound is kept')
  else {
    const assets = fs.existsSync(at('ASSETS.md')) ? fs.readFileSync(at('ASSETS.md'), 'utf8') : ''
    const bad = []
    for (const r of records) {
      const lacks = []
      if (!ledger.takes.some((t) => t.sha256 === r.take.sha256)) lacks.push('its take in the log')
      if (!(r.kind === 'line' ? r.words : r.prompt)) lacks.push(r.kind === 'line' ? 'its words' : 'its prompt')
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

  const cuesFile = at('cut', 'CUES.md')
  const mixRecord = path.join(P.mix, 'review.json')
  if (!fs.existsSync(mixRecord)) add('A9', 'not yet', 'no mix has been made, and cut/CUES.md is written by npm run cut')
  else {
    const r = readJson(mixRecord)
    const plan = await filmPlan(c, M)
    const late = []
    const seen = new Set()
    for (const e of plan.events) {
      const cue = M.cues.eventCues[e.name]
      if (!cue || cue === 'room-tone' || r.missingCues.includes(cue)) continue
      const k = `${cue}@${e.frame}`
      if (seen.has(k)) continue
      seen.add(k)
      const p = r.placed.find((x) => x.kind === 'cue' && x.cue === cue && Math.abs(x.frame - e.frame) <= c.audio.contactSyncFrames)
      if (!p) late.push(`${e.name} at frame ${e.frame}`)
    }
    const timed = M.copy.timedLines(c, narration())
    const lineProblems = []
    const spoken = r.placed.filter((x) => x.kind === 'line').sort((x, y) => x.sample - y.sample)
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
    const where = fs.existsSync(cuesFile) ? 'cut/CUES.md is there but is the cut\'s to check: this is checked on the mix\'s own record' : 'cut/CUES.md is not written yet: this is checked on the mix\'s own record'
    if (late.length || lineProblems.length) add('A9', 'fail', `${[...late.slice(0, 5).map((x) => `no cue within ${c.audio.contactSyncFrames} frame of ${x}`), ...lineProblems.slice(0, 5)].join('; ')}. ${where}`, { lateEvents: late.length, lineProblems: lineProblems.length })
    else add('A9', laid ? 'pass' : 'not yet', laid ? `${r.cuesLaid} cues start on the frame of their event and ${r.linesLaid} of ${timed.length} lines start inside their beat and end ${c.audio.lineGapSeconds} s before the next. ${where}` : `no sound is kept, so the mix lays nothing. ${where}`)
  }

  const lineRecords = records.filter((r) => r.kind === 'line')
  if (!lineRecords.length) add('A10', 'not yet', 'no narrator line is kept')
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

  add('A11', 'not yet', wired ? 'the browser test with the sound files removed is not run by this command yet' : notWired, { byCode: 'with no index, or an index that lists nothing, the engine turns silent, available() is false and nothing is thrown or logged: tests/audio-engine.test.ts holds it to that' })

  const out = P.scratch ? path.join(path.dirname(P.audio), 'sound-checks.json') : at('out', 'work', 'sound-checks.json')
  writeJson(out, { about: 'The sound checks A1 to A11 of kit/07-QUALITY-BAR.md. None can fail a gate: a failing one is an open item.', root: P.scratch ? rel(P.audio) : 'audio', checks })
  for (const k of checks) console.log(`${k.id}  ${k.status.padEnd(7)}  ${k.reason}`)
  const count = (s) => checks.filter((k) => k.status === s).length
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
    if (a.final) {
      const out = a.out && a.out !== true ? path.resolve(a.out) : path.join(P.final, 'film-b.wav')
      const r = await makeMix(P, c, M, out, 'film-b')
      console.log('mix: film A is film B behind the prompt opening. Its opening has no events yet, so only film B is mixed')
      console.log(lastLine(r, out))
    } else {
      const out = a.out && a.out !== true ? path.resolve(a.out) : path.join(P.mix, 'review.wav')
      const r = await makeMix(P, c, M, out, 'review')
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
