// npm run sound: files a take, keeps one, packs what the site ships, draws the sheet, runs the sound checks.
// It calls no sound service. A take is a file the Builder got from the sound tool.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'

export const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const rel = (p) => path.relative(at(), p)

// Where the sound files live. With --root everything is kept under one scratch folder, which is how fixtures are run without touching the build.
export function places(root) {
  if (root && root !== true) {
    const r = path.resolve(root)
    return { scratch: true, takes: path.join(r, 'takes'), audio: path.join(r, 'audio'), kept: path.join(r, 'audio', 'kept'), mix: path.join(r, 'audio', 'mix'), final: path.join(r, 'audio', 'final'), pub: path.join(r, 'public', 'audio') }
  }
  return { scratch: false, takes: at('out', 'work', 'audio', 'takes'), audio: at('audio'), kept: at('audio', 'kept'), mix: at('audio', 'mix'), final: at('audio', 'final'), pub: at('public', 'audio') }
}

let server = null
export async function modulesFrom(load) {
  return { dsp: await load('/src/audio/dsp.ts'), cues: await load('/src/audio/cues.ts'), levels: await load('/src/audio/levels.ts'), copy: await load('/src/copy.ts'), mix: await load('/src/audio/mix.ts'), narrator: await load('/src/audio/narrator.ts'), load }
}
export async function modules() {
  if (!server) server = await createServer({ root: at(), configFile: at('vite.config.ts'), server: { middlewareMode: true, hmr: false, watch: null, ws: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } })
  return modulesFrom((f) => server.ssrLoadModule(f))
}
export const closeModules = async () => {
  if (server) await server.close()
  server = null
}

const narration = () => readJson(at('content', 'narration.json'))
const run = (cmd, argv, opts = {}) => {
  const r = spawnSync(cmd, argv, { maxBuffer: 1 << 30, ...opts })
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || '').toString().trim().split('\n').slice(-3).join(' ')}`)
  return r.stdout
}

// Any sound file as samples at the build's sample rate.
export function decodeFile(file, sampleRate) {
  const probe = run('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', file]).toString().trim()
  const channels = Math.min(2, Math.max(1, Number(probe) || 1))
  const raw = run('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', String(channels), '-ar', String(sampleRate), '-'])
  const all = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4))
  const length = Math.floor(all.length / channels)
  const out = Array.from({ length: channels }, () => new Float32Array(length))
  for (let i = 0; i < length; i++) for (let c = 0; c < channels; c++) out[c][i] = all[i * channels + c]
  return { sampleRate, channels: out }
}

// What an id on the command line names.
export function target(a, c, cues) {
  if (a.cue && a.cue !== true) {
    const spec = cues.allCues(c.audio.sfx).find((s) => s.id === a.cue)
    if (!spec) throw new Error(`No cue called "${a.cue}" in audio.sfx or among the added cues`)
    const variants = spec.variants ?? 1
    if (a.variant && a.variant !== true && variants > 1) {
      const slot = Number(a.variant) - 1
      if (!(Number.isInteger(slot) && slot >= 0 && slot < variants)) throw new Error(`"${spec.id}" has variants 1 to ${variants}, not ${a.variant}`)
      const key = cues.variantId(spec.id, slot, variants)
      return { kind: 'cue', id: spec.id, key, seconds: spec.seconds, variants: 1, slot, of: variants, cls: cues.cueClass[spec.id], loop: cues.loopCues.includes(spec.id), max: c.audio.maxTakesPerCue, ids: [key] }
    }
    return { kind: 'cue', id: spec.id, key: spec.id, seconds: spec.seconds, variants, cls: cues.cueClass[spec.id], loop: cues.loopCues.includes(spec.id), max: c.audio.maxTakesPerCue, ids: Array.from({ length: variants }, (_, i) => cues.variantId(spec.id, i, variants)) }
  }
  if (a.line && a.line !== true) {
    const cut = String(a.line).lastIndexOf(':')
    const name = cut < 0 ? String(a.line) : String(a.line).slice(0, cut)
    const index = cut < 0 ? 0 : Number(String(a.line).slice(cut + 1))
    const n = narration()
    const isLive = name.startsWith('live.')
    const list = isLive ? n.liveOnly[name.slice(5)] : n.film[name]
    const entry = Array.isArray(list) ? list[index] : undefined
    if (entry === undefined) throw new Error(`No narrator line "${a.line}". A film line is BEAT:N, a live line is live.KEY:N`)
    const text = typeof entry === 'string' ? entry : entry.text
    const id = isLive ? cues.liveLineId(name.slice(5), index) : cues.filmLineId(name, index)
    return { kind: 'line', id, key: id, beat: isLive ? null : name, liveKey: isLive ? name.slice(5) : null, index, text, seconds: 60, variants: 1, cls: 'voice', loop: false, max: c.audio.narratorMaxTakesPerLine, ids: [id] }
  }
  throw new Error('Say which sound: --cue ID or --line BEAT:N')
}

export const ledgerFile = (P) => path.join(P.audio, 'TAKES.json')
export const readLedger = (P) => (fs.existsSync(ledgerFile(P)) ? readJson(ledgerFile(P)) : { about: 'Every take of every sound, as it was filed. The take files themselves are under out/work/audio/takes/ and are never committed.', takes: [] })

export const FAMILY_LINE = 'close and dry, recorded in a quiet room, real materials, no music, no melody, no voice'
export const HOLD_LINE = 'close and dry, recorded in a quiet room, real materials, no voice'
export const musical = (cue) => cue === 'hold-music' || cue === 'boss-loop'
export const promptLine = (cue) => (musical(cue) ? HOLD_LINE : FAMILY_LINE)

const spokenWords = (text, mark) => text.split(/\s+/).filter((w) => w.length > 0 && w !== mark)
export const SAME_WORD = { defense: 'defence' }
const plainWords = (text, mark) => spokenWords(text, mark).map((w) => w.toLowerCase().replace(/[^a-z0-9']/g, '')).filter(Boolean).map((w) => SAME_WORD[w] ?? w)

// What the numbers say about a narrator line: its pace, its pauses and the room it has in the film.
export function lineNumbers(t, measured, pauses, c, copy) {
  const n = narration()
  const words = spokenWords(t.text, n.pauseMark).length
  const marks = t.text.split(/\s+/).filter((w) => w === n.pauseMark).length
  const spoken = Math.max(0.001, measured.end - measured.start)
  const out = { words, seconds: Number(spoken.toFixed(3)), wordsPerSecond: Number((words / spoken).toFixed(3)), maxWordsPerSecond: c.audio.narratorMaxWordsPerSecond, pauseMarks: marks, pausesFound: pauses.length, pauses: pauses.map((p) => Number(((p.end - p.start) / c.audio.sampleRate).toFixed(3))) }
  out.paceHolds = out.wordsPerSecond <= c.audio.narratorMaxWordsPerSecond + 1e-9
  out.pausesHold = pauses.length >= marks
  if (t.beat) {
    const timed = copy.timedLines(c, n)
    const i = timed.findIndex((l) => l.beat === t.beat && l.index === t.index)
    const next = timed[i + 1]
    const b = c.film.beats.find((x) => x.id === t.beat)
    out.room = next ? Number((next.start - timed[i].start - c.audio.lineGapSeconds).toFixed(3)) : null
    out.fits = next ? spoken <= out.room + 1e-9 : true
    out.beatSeconds = b.to - b.from
  } else {
    out.room = null
    out.fits = true
  }
  return out
}

// What the listener's answers say, where a listener has answered.
export function listenerFindings(t, listener) {
  if (!listener) return { answered: false, holds: false, why: ['no listener has answered'] }
  const why = []
  if (t.kind === 'line') {
    const n = narration()
    const want = plainWords(t.text, n.pauseMark).join(' ')
    const got = plainWords(String(listener.transcript ?? ''), n.pauseMark).join(' ')
    if (want !== got) why.push(`the listener wrote "${listener.transcript ?? ''}", which is not the line`)
    for (const k of ['whisper', 'laugh', 'warmth', 'excitement']) if (listener[k] === true) why.push(`the listener heard ${k}`)
    if (listener.unimpressedAndSmug === false) why.push('the listener did not hear an unimpressed, slightly smug speaker')
    for (const k of ['whisper', 'laugh', 'warmth', 'excitement', 'unimpressedAndSmug']) if (typeof listener[k] !== 'boolean') why.push(`the listener left "${k}" unanswered`)
  } else {
    for (const k of ['voice', 'word', 'music', 'melody']) if (listener[k] === true && !(musical(t.id) && (k === 'music' || k === 'melody'))) why.push(`the listener heard ${k === 'word' ? 'a word' : k === 'voice' ? 'a voice' : k}`)
    if (listener.fits === false) why.push('the listener says it does not fit the line that describes the cue')
    if (listener.sameRoom === false) why.push('the listener says it does not belong in the same room as the kept sounds')
    for (const k of ['voice', 'word', 'music', 'melody', 'fits']) if (typeof listener[k] !== 'boolean') why.push(`the listener left "${k}" unanswered`)
  }
  return { answered: true, holds: why.length === 0, why }
}

// The same fixed questions for every take, and the answers file as it is handed back. null is a question nobody has answered.
export function listenerSheet(t, describes) {
  if (t.kind === 'line') {
    return {
      questions: [
        'Write down what is said, word for word, with nothing added. You are not told the line.',
        'Is any of it whispered?', 'Is there a laugh?', 'Does the speaker sound warm?', 'Does the speaker sound excited?',
        'Does the speaker sound unimpressed and a little smug?'
      ],
      answers: { by: null, transcript: null, whisper: null, laugh: null, warmth: null, excitement: null, unimpressedAndSmug: null }
    }
  }
  return {
    questions: [
      'What is heard?', 'What is it made of?', 'How many separate events are there?',
      'Is there a voice?', 'Is there a word?', 'Is there music?', 'Is there a melody?',
      `Does it fit this line: ${describes ?? 'the line that describes the cue'}`,
      'Only when two takes of other cues are kept and played first: do the three belong in the same room?'
    ],
    answers: { by: null, heard: null, madeOf: null, events: null, voice: null, word: null, music: null, melody: null, fits: null, sameRoom: null }
  }
}

function writeRecipe(P, ledger, c) {
  const file = path.join(P.audio, 'RECIPE.md')
  const mark = '## Takes'
  const head = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/^## Takes$/m)[0] : '# The log of every sound\n\n'
  const lines = [mark, '']
  if (!ledger.takes.length) lines.push('No take has been filed.', '')
  const ids = [...new Set(ledger.takes.map((t) => t.key))]
  for (const id of ids) {
    const mine = ledger.takes.filter((t) => t.key === id)
    lines.push(`### ${id}`, '', `Takes used: ${mine.length} of ${mine[0].kind === 'cue' ? c.audio.maxTakesPerCue : c.audio.narratorMaxTakesPerLine}.`, '', '| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const t of mine) lines.push(`| ${t.take} | ${t.round} | ${t.filed} | ${t.measured.seconds} s | ${t.measured.peakDb} dB | ${t.measured.lufs} LUFS | ${t.measured.hits} | ${t.cost ?? 'not recorded'} | ${t.kept ? `yes, as ${t.keptAs.join(', ')}` : 'no'} | ${(t.why ?? '').replace(/\|/g, '/')} |`)
    lines.push('', `${mine[0].kind === 'cue' ? 'Prompt' : 'Words'}: ${mine[mine.length - 1].prompt ?? mine[mine.length - 1].text ?? 'not recorded'}`, '')
  }
  fs.mkdirSync(P.audio, { recursive: true })
  fs.writeFileSync(file, head + lines.join('\n'))
}

function saveLedger(P, ledger, c) {
  writeJson(ledgerFile(P), ledger)
  writeRecipe(P, ledger, c)
}

// The one line that describes each cue, from the table of kit/03-METHOD.md: what is heard.
export function cueLines(file = at('kit', '03-METHOD.md')) {
  const out = {}
  if (!fs.existsSync(file)) return out
  const part = fs.readFileSync(file, 'utf8').split(/^### The effects$/m)[1]?.split(/^### /m)[0] ?? ''
  for (const row of part.split('\n')) {
    const cells = row.split('|').map((x) => x.trim())
    if (cells.length < 5 || !/^(`[a-z0-9-]+`(, )?)+$/.test(cells[1])) continue
    const ids = [...cells[1].matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1])
    const parts = ids.length > 1 ? cells[2].split(', ') : [cells[2]]
    ids.forEach((id, i) => { out[id] = parts.length === ids.length ? parts[i].replace(/^./, (ch) => ch.toUpperCase()) : cells[2] })
  }
  for (const x of extraCues()) out[x.id] = x.heard
  return out
}

// Cues the kit's table does not hold: the one an addendum added and the ones the build added inside audio.extraCuesMax.
export const extraCues = (file = at('audio', 'EXTRA-CUES.json')) => (fs.existsSync(file) ? readJson(file).cues : [])

const readMaybe = (v) => (v && v !== true ? (fs.existsSync(v) ? fs.readFileSync(v, 'utf8').trim() : String(v)) : null)
const jsonMaybe = (v) => {
  const s = readMaybe(v)
  if (!s) return null
  return JSON.parse(s)
}

export async function fileTake(a, P, c, M, quiet = false) {
  const t = target(a, c, M.cues)
  if (t.variants > 1 && a.filed !== 'fixture') throw new Error(`"${t.id}" has ${t.variants} variants and a variant is its own take: say --variant N. Nothing filed, no take used`)
  if (!fs.existsSync(a.file)) throw new Error(`No such file: ${a.file}`)
  const ledger = readLedger(P)
  const mine = ledger.takes.filter((x) => x.key === t.key)
  const round = a.round && a.round !== true ? String(a.round) : 'build'
  const number = mine.length + 1
  const dir = path.join(P.takes, t.key)
  fs.mkdirSync(dir, { recursive: true })
  const ext = path.extname(a.file) || '.bin'
  const dest = path.join(dir, `take-${number}${ext}`)
  const same = mine.find((x) => x.sha256 === sha(fs.readFileSync(a.file)))
  if (same) throw new Error(`${a.file} is already filed as ${t.key} take ${same.take}. Nothing filed, no take used`)
  fs.copyFileSync(a.file, dest)
  let sound
  try {
    sound = decodeFile(dest, c.audio.sampleRate)
  } catch (e) {
    fs.rmSync(dest, { force: true })
    throw new Error(`${a.file} could not be read as sound. Nothing filed, no take used. ${e.message.split('\n')[0]}`)
  }
  if (!sound.channels[0]?.length) {
    fs.rmSync(dest, { force: true })
    throw new Error(`${a.file} holds no sound. Nothing filed, no take used`)
  }
  const measured = M.dsp.measure(sound)
  const record = {
    key: t.key, kind: t.kind, cue: t.kind === 'cue' ? t.id : undefined, take: number, round, file: path.basename(dest), sha256: sha(fs.readFileSync(dest)), filed: a.filed && a.filed !== true ? String(a.filed) : new Date().toISOString(),
    prompt: t.kind === 'cue' ? readMaybe(a.prompt) : undefined, text: t.kind === 'line' ? t.text : undefined, settings: jsonMaybe(a.settings), askedSeconds: a.asked && a.asked !== true ? Number(a.asked) : null,
    cost: a.cost && a.cost !== true ? String(a.cost) : null, measured, listener: jsonMaybe(a.listener), kept: false, keptAs: [], why: ''
  }
  if (t.kind === 'line') record.line = lineNumbers(t, measured, M.dsp.findPauses(M.dsp.toMono(sound), sound.sampleRate), c, M.copy)
  ledger.takes.push(record)
  saveLedger(P, ledger, c)
  writeJson(path.join(dir, `take-${number}.json`), record)
  if (!quiet) {
    console.log(`filed: ${t.key} take ${number} of ${t.max} (${round}) as ${rel(dest)}`)
    console.log(`  ${measured.seconds} s, sounding from ${measured.start} s to ${measured.end} s, peak ${measured.peakDb} dB, true peak ${measured.truePeakDb} dB, ${measured.lufs} LUFS`)
    console.log(`  energy: low ${measured.low}, middle ${measured.mid}, high ${measured.high}. tail ${measured.tailDb} dB under the peak. separate hits: ${measured.hits}${t.variants > 1 ? `, and the cue needs ${t.variants}` : ''}`)
    if (t.kind === 'cue') {
      console.log(`  the cue is ${t.seconds} s long, class ${t.cls}${t.loop ? ', a loop' : ''}`)
      if (record.prompt && !record.prompt.trim().replace(/\.$/, '').endsWith(promptLine(t.id))) console.log(`  note: the prompt does not end with the line every effect prompt ends with: ${promptLine(t.id)}`)
    } else {
      const l = record.line
      console.log(`  ${l.words} words in ${l.seconds} s: ${l.wordsPerSecond} words a second, limit ${l.maxWordsPerSecond}: ${l.paceHolds ? 'holds' : 'TOO FAST'}`)
      console.log(`  pauses: ${l.pausesFound} found for ${l.pauseMarks} marks: ${l.pausesHold ? 'holds' : 'A PAUSE IS MISSING'}`)
      if (l.room !== null) console.log(`  room in the film: ${l.room} s: ${l.fits ? 'fits' : 'TOO LONG FOR ITS PLACE. Move the beat inside its limits before asking for another take'}`)
    }
    if (number > t.max) console.log(`  WARNING: this is take ${number} and the limit is ${t.max}. Check A8 will report it`)
    else console.log(`  takes left: ${t.max - number}`)
  }
  return record
}

export function attachListener(a, P, c, M) {
  const t = target(a, c, M.cues)
  const ledger = readLedger(P)
  const mine = ledger.takes.filter((x) => x.key === t.key)
  const take = a.take && a.take !== true ? mine.find((x) => x.take === Number(a.take)) : mine[mine.length - 1]
  if (!take) throw new Error(`${t.key} has no such take`)
  take.listener = jsonMaybe(a.listener)
  saveLedger(P, ledger, c)
  const f = listenerFindings(t, take.listener)
  console.log(`listener: answers filed for ${t.key} take ${take.take}: ${f.holds ? 'they fit' : f.why.join('; ')}`)
}

// Runs the chain on a take and writes the kept sound with its record.
export async function keepTake(a, P, c, M, quiet = false) {
  const t = target(a, c, M.cues)
  const ledger = readLedger(P)
  const mine = ledger.takes.filter((x) => x.key === t.key)
  const take = a.take && a.take !== true ? mine.find((x) => x.take === Number(a.take)) : mine[mine.length - 1]
  if (!take) throw new Error(`${t.key} has no take to keep. File one first: --${t.kind} ... --file F`)
  if (a.listener && a.listener !== true) take.listener = jsonMaybe(a.listener)
  const file = path.join(P.takes, t.key, take.file)
  if (!fs.existsSync(file)) throw new Error(`The take file is gone: ${rel(file)}`)
  const sound = decodeFile(file, c.audio.sampleRate)
  const sr = sound.sampleRate
  const mono = M.dsp.toMono(sound)
  const problems = []
  const heard = listenerFindings(t, take.listener)
  if (!heard.holds) problems.push(...heard.why)
  if (take.measured.truePeakDb > 0) problems.push(`the take is clipped: its true peak is ${take.measured.truePeakDb} dB`)
  if (take.measured.end <= take.measured.start) problems.push('the take is silent')
  if (t.kind === 'line') {
    if (!take.line.paceHolds) problems.push(`it is spoken at ${take.line.wordsPerSecond} words a second and the limit is ${take.line.maxWordsPerSecond}`)
    if (!take.line.pausesHold) problems.push(`${take.line.pausesFound} pauses can be measured and the line has ${take.line.pauseMarks} marks`)
    if (!take.line.fits) problems.push(`it is ${take.line.seconds} s long and its place in the film has ${take.line.room} s`)
  }

  let parts = [{ from: 0, to: mono.length }]
  let slots = [0]
  if (t.variants > 1) {
    const hits = M.dsp.findHits(mono, sr)
    const chosen = a.hits && a.hits !== true ? String(a.hits).split(',').map((v) => hits[Number(v) - 1]).filter(Boolean) : hits.slice().sort((x, y) => y.peak - x.peak).slice(0, t.variants).sort((x, y) => x.start - y.start)
    slots = a.slots && a.slots !== true ? String(a.slots).split(',').map((v) => Number(v) - 1) : chosen.map((_, i) => i)
    const lead = Math.round(0.005 * sr)
    parts = chosen.map((h) => {
      const next = hits.find((x) => x.start > h.start)
      return { from: Math.max(0, h.start - lead), to: next ? Math.max(h.end, next.start - lead) : mono.length }
    })
    if (chosen.length < t.variants && !(a.slots && a.slots !== true)) problems.push(`the take holds ${hits.length} separate hits and the cue needs ${t.variants}`)
  }

  const made = parts.map((p, i) => {
    const id = t.ids[slots[i]]
    const out = M.dsp.chain(sound, { seconds: t.kind === 'line' ? 600 : t.seconds, cls: t.cls, loop: t.loop, from: p.from, to: p.to })
    if (out.record.loop && !out.record.loop.holds) problems.push(`the loop does not close: the step at its seam is ${out.record.loop.seamStepDb} dB over the usual step and the level there is ${out.record.loop.seamLevelDb} dB off`)
    return { id, variant: slots[i], ...out }
  }).filter((m) => m.id)

  const forced = Boolean(a.force)
  if (problems.length && !forced) {
    console.log(`not kept: ${t.key} take ${take.take}`)
    for (const p of problems) console.log(`  - ${p}`)
    console.log('  Keep it anyway with --force. The record then says it was forced and why it should not have been.')
    return null
  }
  fs.mkdirSync(P.kept, { recursive: true })
  const why = a.why && a.why !== true ? String(a.why) : ''
  for (const m of made) {
    const bytes = M.dsp.encodeWav(m.sound, 24)
    fs.writeFileSync(path.join(P.kept, `${m.id}.wav`), bytes)
    writeJson(path.join(P.kept, `${m.id}.json`), {
      id: m.id, kind: t.kind === 'line' && t.liveKey ? 'live-line' : t.kind, cue: t.kind === 'cue' ? t.id : null, variant: t.of ? t.slot + 1 : t.variants > 1 ? m.variant + 1 : null, class: t.cls, loop: t.loop,
      beat: t.beat ?? null, liveKey: t.liveKey ?? null, group: t.liveKey ?? null, describes: t.kind === 'cue' ? cueLines()[t.id] ?? null : null, index: t.kind === 'line' ? t.index : null,
      words: t.kind === 'line' ? t.text : null, text: t.kind === 'line' ? t.text : null, prompt: take.prompt ?? null, settings: take.settings ?? null, askedSeconds: take.askedSeconds, cost: take.cost,
      take: { number: take.take, round: take.round, file: take.file, sha256: take.sha256, filed: take.filed, measured: take.measured, line: take.line ?? null },
      chain: m.record, measured: M.dsp.measure(m.sound), listener: take.listener ?? null, why, forced, problems, fixture: Boolean(a.fixture),
      file: `${m.id}.wav`, seconds: Number((m.sound.channels[0].length / sr).toFixed(4)), sha256: sha(bytes)
    })
  }
  for (const x of mine) if (x.kept && x !== take) x.keptAs = x.keptAs.filter((id) => !made.some((m) => m.id === id))
  for (const x of mine) x.kept = x.keptAs.length > 0
  take.kept = true
  take.keptAs = [...new Set([...take.keptAs, ...made.map((m) => m.id)])]
  take.why = why || take.why
  saveLedger(P, ledger, c)
  writeAssetRows(P)
  if (!quiet) {
    for (const m of made) console.log(`kept: ${m.id}, ${(m.sound.channels[0].length / sr).toFixed(3)} s, level ${m.record.levelDb} dB by ${m.record.levelMeasure}, gain ${m.record.gainDb} dB, fade in ${m.record.fadeInMs} ms, fade out ${m.record.fadeOutMs} ms, low cut ${m.record.lowCutHz} Hz${m.record.loop ? `, loop seam step ${m.record.loop.seamStepDb} dB` : ''}`)
    if (forced && problems.length) console.log(`  forced over: ${problems.join('; ')}`)
    console.log(`  records: ${rel(P.kept)}/<id>.json. The rows for ASSETS.md are in ${rel(path.join(P.audio, 'ASSETS-ROWS.md'))}`)
  }
  return made.map((m) => m.id)
}

export function keptRecords(P) {
  if (!fs.existsSync(P.kept)) return []
  return fs.readdirSync(P.kept).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(path.join(P.kept, f)))
}

// The kept sounds that are really here, as samples. A record whose file is missing is named, not loaded.
export function keptSounds(P, M) {
  const sounds = new Map()
  const absent = []
  for (const r of keptRecords(P)) {
    const f = path.join(P.kept, r.file)
    if (!fs.existsSync(f)) {
      absent.push(r.id)
      continue
    }
    sounds.set(r.id, M.dsp.decodeWav(fs.readFileSync(f)))
  }
  return { sounds, absent }
}

// One row for each sound file under public/audio, so that every file the site ships is named.
function shippedRows(P, head) {
  const file = path.join(P.pub, 'index.json')
  const index = fs.existsSync(file) ? readJson(file) : null
  if (!index || index.sfx.length + index.loops.length + index.lines.length === 0) return []
  const made = 'Made by `npm run sound -- --pack` from'
  const rows = []
  if (index.pack) rows.push(`| \`public/audio/${index.pack.file}\` | The ${index.sfx.length} short sounds of the site in one file | ${made} the kept sounds of \`audio/kept/\` named in the index | \`public/audio/index.json\` |`)
  for (const f of [...index.loops, ...index.lines]) rows.push(`| \`public/audio/${f.file}\` | The site's copy of \`${f.id}\` | ${made} \`audio/kept/${f.id}.wav\` | \`audio/kept/${f.id}.json\` |`)
  return ['## What the site ships', '', ...head, ...rows]
}

function writeAssetRows(P) {
  const rows = keptRecords(P).map((r) => `| \`audio/kept/${r.file}\` | ${r.kind !== 'cue' ? `Narrator line: ${r.words}` : `Sound effect \`${r.cue}\`${r.variant ? `, variant ${r.variant}` : ''}`} | Generated with the sound tool, take ${r.take.number} (${r.take.round}) | \`audio/kept/${r.id}.json\` |`)
  const head = ['| File | What it is | How it was made | Record |', '| --- | --- | --- | --- |']
  const text = ['# Rows for ASSETS.md', '', 'One row for each kept sound, and after `--pack` one for each sound file the site ships. `npm run sound` writes this file. The Builder copies the rows under "Generated sounds" in `ASSETS.md`.', '', ...head, ...rows, '', ...shippedRows(P, head), ''].join('\n')
  fs.mkdirSync(P.audio, { recursive: true })
  fs.writeFileSync(path.join(P.audio, 'ASSETS-ROWS.md'), text)
}

const encode = (wav, argv) => run('ffmpeg', ['-v', 'error', '-i', wav, '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', ...argv, '-'])

// Builds what the site ships: one packed file of the short sounds with its index, the loops, the narrator's lines.
export function pack(P, c, M, quiet = false) {
  fs.mkdirSync(P.pub, { recursive: true })
  for (const f of fs.readdirSync(P.pub)) fs.rmSync(path.join(P.pub, f), { recursive: true, force: true })
  const records = keptRecords(P).filter((r) => fs.existsSync(path.join(P.kept, r.file)))
  const index = { version: 1, sampleRate: c.audio.sampleRate, pack: null, sfx: [], loops: [], lines: [], totalBytes: 0 }
  const chunks = []
  let offset = 0
  for (const r of records) {
    const wav = path.join(P.kept, r.file)
    if (r.kind !== 'cue') {
      const bytes = encode(wav, ['-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', '-id3v2_version', '0', '-f', 'mp3'])
      const file = `${r.id}.mp3`
      fs.writeFileSync(path.join(P.pub, file), bytes)
      index.lines.push({ id: r.id, file, seconds: r.seconds, mime: 'audio/mpeg', bytes: bytes.length, sha256: sha(bytes) })
    } else if (r.loop) {
      const bytes = encode(wav, ['-c:a', 'flac', '-sample_fmt', 's16', '-compression_level', '8', '-f', 'flac'])
      const file = `${r.id}.flac`
      fs.writeFileSync(path.join(P.pub, file), bytes)
      index.loops.push({ id: r.id, file, seconds: r.seconds, mime: 'audio/flac', bytes: bytes.length, sha256: sha(bytes) })
    } else {
      const bytes = encode(wav, ['-ac', '1', '-c:a', 'flac', '-sample_fmt', 's16', '-compression_level', '8', '-f', 'flac'])
      chunks.push(bytes)
      index.sfx.push({ id: r.id, at: offset, bytes: bytes.length, seconds: r.seconds, mime: 'audio/flac' })
      offset += bytes.length
    }
  }
  if (chunks.length) {
    const all = Buffer.concat(chunks)
    fs.writeFileSync(path.join(P.pub, 'sfx.bin'), all)
    index.pack = { file: 'sfx.bin', bytes: offset, sha256: sha(all) }
  }
  index.totalBytes = offset + [...index.loops, ...index.lines].reduce((s, f) => s + f.bytes, 0)
  writeJson(path.join(P.pub, 'index.json'), index)
  if (records.length || fs.existsSync(path.join(P.audio, 'ASSETS-ROWS.md'))) writeAssetRows(P)
  const mb = index.totalBytes / 1048576
  if (!quiet) {
    console.log(`packed: ${index.sfx.length} short sounds in one file, ${index.loops.length} loops, ${index.lines.length} narrator lines, ${mb.toFixed(2)} MB of ${c.audio.appMaxMb} MB, in ${rel(P.pub)}`)
    if (!records.length) console.log('pack: no sound is kept, so the index lists nothing and the site runs silent')
    if (mb > c.audio.appMaxMb) console.log(`pack: OVER THE LIMIT. The site's sound files are ${mb.toFixed(2)} MB and audio.appMaxMb is ${c.audio.appMaxMb}`)
  }
  return index
}

// The kept sounds as waveforms on one picture.
export async function sheet(P, c, M, out) {
  const sharp = (await import('sharp')).default
  const { sounds } = keptSounds(P, M)
  const records = keptRecords(P).filter((r) => sounds.has(r.id))
  const cols = 6
  const cw = 300
  const ch = 96
  const pad = 12
  const head = 44
  const rows = Math.max(1, Math.ceil(records.length / cols))
  const W = cols * cw + pad * 2
  const H = head + rows * ch + pad
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1d1e22"/>`
  svg += `<text x="${pad}" y="28" font-family="sans-serif" font-size="18" fill="#e9e6df">${records.length ? `${records.length} kept sounds` : 'No sound is kept yet'}${P.scratch ? ' (fixtures, not takes)' : ''}</text>`
  records.forEach((r, i) => {
    const x0 = pad + (i % cols) * cw
    const y0 = head + Math.floor(i / cols) * ch
    const mono = M.dsp.toMono(sounds.get(r.id))
    const w = cw - 16
    const mid = y0 + 56
    const half = 26
    const top = Math.max(1e-6, M.dsp.peak(mono))
    let d = ''
    for (let x = 0; x < w; x++) {
      const from = Math.floor((x / w) * mono.length)
      const to = Math.max(from + 1, Math.floor(((x + 1) / w) * mono.length))
      const p = M.dsp.peak(mono, from, to) / top
      d += `M${x0 + x} ${(mid - p * half).toFixed(1)}V${(mid + p * half).toFixed(1)}`
    }
    svg += `<rect x="${x0}" y="${y0}" width="${cw - 8}" height="${ch - 8}" rx="6" fill="#26282d"/>`
    svg += `<text x="${x0 + 8}" y="${y0 + 18}" font-family="sans-serif" font-size="12" fill="#e9e6df">${esc(r.id)}</text>`
    svg += `<text x="${x0 + cw - 16}" y="${y0 + 18}" font-family="sans-serif" font-size="12" fill="#9fa3ab" text-anchor="end">${r.seconds.toFixed(2)} s</text>`
    svg += `<path d="${d}" stroke="${r.kind !== 'cue' ? '#e9a15b' : '#8fb6d9'}" stroke-width="1" fill="none"/>`
  })
  svg += '</svg>'
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp(Buffer.from(svg)).png().toFile(out)
  return { file: out, count: records.length }
}

// The engine in a real browser, on a page of its own, with the sound files of this root beside it.
// It proves what a test with a stand-in cannot: that the browser decodes the pack, and that nothing happens before the first click.
export async function engineInBrowser(P, c) {
  const { build } = await import('vite')
  const { serve } = await import('./lib/serve.mjs')
  const { launch } = await import('./lib/browser.mjs')
  const dir = at('out', 'work', 'audio', 'harness')
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: at('src', 'audio', 'index.ts'), formats: ['es'], fileName: () => 'engine.js' } } })
  const html = (index, graph = true) => `<!doctype html><meta charset="utf-8"><title>harness</title><body><button id="go">go</button><script type="module">
const Real = window.AudioContext
window.contexts = []
window.taps = []
window.AudioContext = class extends Real {
  constructor(...a) {
    super(...a)
    window.contexts.push(this)
    const tap = this.createAnalyser()
    tap.fftSize = 2048
    window.taps.push(tap)
    const out = this.destination
    const connect = AudioNode.prototype.connect
    AudioNode.prototype.connect = function (to, ...rest) {
      if (to === out) connect.call(this, tap)
      return connect.call(this, to, ...rest)
    }
  }
}
window.plays = 0
const play = HTMLMediaElement.prototype.play
HTMLMediaElement.prototype.play = function (...a) { window.plays++; return play.apply(this, a) }
if (!${graph}) { window.AudioContext = undefined; window.webkitAudioContext = undefined }
const { makeSound } = await import('./engine.js')
window.sound = makeSound({ base: './audio/', index: ${JSON.stringify(index)} })
document.getElementById('go').addEventListener('click', () => { window.unlocked = window.sound.unlock() }, { once: true })
window.level = () => {
  const tap = window.taps[0]
  if (!tap) return 0
  const d = new Float32Array(tap.fftSize)
  tap.getFloatTimeDomainData(d)
  let top = 0
  for (const v of d) top = Math.max(top, Math.abs(v))
  return top
}
window.ready = true
</script>`
  const empty = path.join(dir, 'no-audio')
  fs.mkdirSync(empty, { recursive: true })
  const index = fs.existsSync(path.join(P.pub, 'index.json')) ? readJson(path.join(P.pub, 'index.json')) : null
  const nothing = { version: 1, sampleRate: c.audio.sampleRate, pack: null, sfx: [], loops: [], lines: [], totalBytes: 0 }
  const lists = Boolean(index) && index.sfx.length + index.loops.length + index.lines.length > 0
  const { browser, version } = await launch(['--autoplay-policy=user-gesture-required'])
  const runs = []
  const visit = async (name, folder, given, act, graph = true) => {
    fs.writeFileSync(path.join(dir, 'index.html'), html(given, graph))
    const site = await serve(dir, { mounts: { '/audio/': folder } })
    const page = await browser.newPage()
    const requests = []
    const consoleLines = []
    const errors = []
    page.on('request', (r) => requests.push(new URL(r.url()).pathname))
    page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !String(m.location().url).endsWith('/favicon.ico')) consoleLines.push(`${m.type()}: ${m.text()} ${new URL(m.location().url || site.url).pathname}`) })
    page.on('pageerror', (e) => errors.push(String(e.message)))
    try {
      await page.goto(`${site.url}/index.html`)
      await page.waitForFunction('window.ready === true')
      await page.evaluate(() => {
        window.sound.event({ name: 'step', x: 960, y: 540, hitsCursor: false }, 'live')
        window.sound.beat('marketing.stroll', 'film')
        window.sound.trigger('idle')
      })
      await page.waitForTimeout(300)
      const before = await page.evaluate(() => ({ contexts: window.contexts.length, plays: window.plays, state: window.sound.state(), available: window.sound.available() }))
      const soundRequestsBefore = requests.filter((r) => r.startsWith('/audio/')).length
      await page.click('#go')
      await page.evaluate(() => window.unlocked)
      const after = await page.evaluate(() => ({ contexts: window.contexts.length, state: window.sound.state(), available: window.sound.available(), backend: window.sound.backend(), context: window.contexts[0] ? window.contexts[0].state : 'none' }))
      const extra = act ? await act(page) : {}
      runs.push({ name, before, soundRequestsBefore, after, soundRequests: requests.filter((r) => r.startsWith('/audio/')).length, console: consoleLines, errors, ...extra })
    } finally {
      await page.close()
      await site.close()
    }
  }
  try {
    if (lists) await visit('with the sound files of this root', P.pub, index, async (page) => {
      const state = await page.evaluate(() => window.sound.state())
      if (state !== 'ready') return { heard: null }
      const listen = async (ms) => {
        let top = 0
        const steps = Math.ceil(ms / 20)
        for (let i = 0; i < steps; i++) {
          top = Math.max(top, await page.evaluate(() => window.level()))
          await page.waitForTimeout(20)
        }
        return Number(top.toFixed(5))
      }
      const tone = await listen(300)
      await page.evaluate(() => window.sound.event({ name: 'button-press', x: 960, y: 540, hitsCursor: false }, 'film'))
      const effect = await listen(300)
      await page.evaluate(() => window.sound.beat('marketing.stroll', 'film'))
      const line = await listen(1200)
      await page.evaluate(() => window.sound.setMuted(true))
      await page.waitForTimeout(200)
      const muted = await listen(200)
      await page.evaluate(() => { window.sound.setMuted(false); window.sound.stop() })
      return { heard: { tone, effect, line, muted } }
    })
    if (lists) await visit('with plain audio elements, the fallback', P.pub, index, async (page) => {
      const state = await page.evaluate(() => window.sound.state())
      if (state !== 'ready') return { played: null }
      const before = await page.evaluate(() => window.plays)
      await page.evaluate(() => {
        window.sound.event({ name: 'button-press', x: 960, y: 540, hitsCursor: false }, 'film')
        window.sound.beat('marketing.stroll', 'film')
      })
      await page.waitForTimeout(600)
      const played = await page.evaluate(() => window.plays)
      await page.evaluate(() => window.sound.stop())
      return { played: { roomTone: before, afterAnEffectAndALine: played } }
    }, false)
    await visit('with an index that lists nothing', empty, nothing)
    if (lists) await visit('with the sound files removed and the index still naming them', empty, index)
  } finally {
    await browser.close()
  }
  const out = { browser: version, lists, runs }
  writeJson(at('out', 'work', 'audio', 'browser.json'), out)
  return out
}

// The built site in a real browser, in live mode: what it starts and asks for before and after the first click.
// The built site with the sound files of a root. The real root is dist/ as npm run build makes it.
// A scratch root gets a build of its own with its index and its files, so the site can be heard with stand-ins.
export async function siteBuild(P) {
  if (!P.scratch) {
    const { ensureBuild } = await import('./lib/capture.mjs')
    ensureBuild()
    return at('dist')
  }
  const { build } = await import('vite')
  const dir = at('out', 'work', 'audio', 'site')
  const index = path.join(P.pub, 'index.json')
  if (!fs.existsSync(index)) throw new Error(`${rel(P.pub)} has no index. Run npm run sound -- --pack --root ${rel(path.dirname(P.audio))}`)
  const swap = { name: 'sound-index-of-a-root', enforce: 'pre', resolveId(source, importer) { return importer && /[\\/]src[\\/]audio[\\/]/.test(importer) && /public\/audio\/index\.json$/.test(source) ? index : null } }
  await build({ root: at(), configFile: at('vite.config.ts'), logLevel: 'silent', plugins: [swap], build: { outDir: dir, emptyOutDir: true } })
  fs.cpSync(P.pub, path.join(dir, 'audio'), { recursive: true })
  return dir
}

const audioChunks = (dir) => {
  const bundle = path.join(dir, 'bundle')
  if (!fs.existsSync(bundle)) return []
  return fs.readdirSync(bundle).filter((f) => f.endsWith('.js') && fs.statSync(path.join(bundle, f)).size < 200000 && /decodeAudioData/.test(fs.readFileSync(path.join(bundle, f), 'utf8')))
}

// The built site in a real browser: what it makes and asks for before the first click, the sound control by pointer and by keyboard,
// the site with its sound files taken away, and one judged still in capture mode with the audio code there and with it gone.
export async function siteInBrowser(dir = at('dist'), o = {}) {
  const { serve } = await import('./lib/serve.mjs')
  const { launch } = await import('./lib/browser.mjs')
  if (!fs.existsSync(path.join(dir, 'index.html'))) return { built: false }
  const c = config()
  const site = await serve(dir, { mounts: { '/assets-full/': at('assets-full') } })
  const { browser, version } = await launch(['--autoplay-policy=user-gesture-required'])
  const chunks = audioChunks(dir)
  const isSound = (r) => /\/audio\/(?!index\.json)/.test(r)
  const isChunk = (r) => chunks.some((f) => r.endsWith(`/bundle/${f}`))
  const visit = async (query, { block = null, wait = 3000 } = {}) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const requests = []
    const consoleLines = []
    const errors = []
    page.on('request', (r) => requests.push(new URL(r.url()).pathname))
    page.on('console', (m) => { if (m.type() === 'error' && !String(m.location().url).endsWith('/favicon.ico')) consoleLines.push(`${m.text()} ${m.location().url ? new URL(m.location().url).pathname : ''}`.trim()) })
    page.on('pageerror', (e) => errors.push(String(e.message)))
    if (block) await page.route(block, (route) => route.fulfill({ status: 404, body: 'not found' }))
    await page.addInitScript(() => {
      window.__sound = { contexts: 0, plays: 0, taps: [], running: new Set(), made: [], shots: 0, log: [] }
      const startSource = AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start = function (...r) {
        const node = this
        window.__sound.running.add(node)
        if (!node.loop) window.__sound.shots++
        window.__sound.log.push({ ahead: (r[0] ?? 0) - node.context.currentTime, seconds: node.buffer?.duration ?? 0, loop: node.loop })
        node.addEventListener('ended', () => window.__sound.running.delete(node))
        return startSource.apply(this, r)
      }
      const Real = window.AudioContext
      if (Real) {
        window.AudioContext = class extends Real {
          constructor(...a) {
            super(...a)
            window.__sound.contexts++
            window.__sound.made.push(this)
            const tap = this.createAnalyser()
            tap.fftSize = 2048
            window.__sound.taps.push(tap)
            const out = this.destination
            const connect = AudioNode.prototype.connect
            AudioNode.prototype.connect = function (to, ...rest) {
              if (to === out) connect.call(this, tap)
              return connect.call(this, to, ...rest)
            }
          }
        }
      }
      const play = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (...a) { window.__sound.plays++; return play.apply(this, a) }
      window.__level = () => {
        let top = 0
        for (const tap of window.__sound.taps) {
          const d = new Float32Array(tap.fftSize)
          tap.getFloatTimeDomainData(d)
          for (const v of d) top = Math.max(top, Math.abs(v))
        }
        return Number(top.toFixed(4))
      }
    })
    await page.goto(`${site.url}/index.html?${query}`)
    let started = true
    try {
      await page.evaluate(() => window.showcase.ready)
    } catch (e) {
      started = false
      errors.push(`the site did not start: ${e.message}`)
    }
    const atFirstPicture = requests.filter(isSound).length
    if (wait) await page.waitForTimeout(wait)
    const look = async () => ({
      ...(await page.evaluate(() => ({
        contexts: window.__sound.contexts, plays: window.__sound.plays,
        failShown: Boolean(document.getElementById('fail')) && !document.getElementById('fail').hidden,
        control: [...document.querySelectorAll('button[aria-label]')].filter((b) => b.querySelector('svg') && /sound/i.test(b.getAttribute('aria-label')) && b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden').length
      }))),
      soundRequests: requests.filter(isSound).length, chunkRequests: requests.filter(isChunk).length
    })
    return { context, page, requests, consoleLines, errors, started, atFirstPicture, look }
  }
  const out = { built: true, browser: version, audioChunks: chunks }
  try {
    const live = await visit('mode=live')
    const before = await live.look()
    await live.page.mouse.click(640, 360)
    await live.page.waitForTimeout(3500)
    const after = await live.look()
    out.live = { started: live.started, soundRequestsAtFirstPicture: live.atFirstPicture, before, after, console: live.consoleLines, errors: live.errors }

    if (after.control > 0) {
      const page = live.page
      const mark = async () => page.evaluate(() => {
        const b = [...document.querySelectorAll('button[aria-label]')].find((x) => x.querySelector('svg') && /sound/i.test(x.getAttribute('aria-label')) && x.getClientRects().length > 0)
        const r = b.getBoundingClientRect()
        b.setAttribute('data-sound-check', '1')
        return { name: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed'), picture: b.innerHTML, x: r.left + r.width / 2, y: r.top + r.height / 2, width: Math.round(r.width), height: Math.round(r.height), focused: document.activeElement === b }
      })
      const loud = async () => {
        let top = 0
        for (let i = 0; i < 12; i++) {
          top = Math.max(top, await page.evaluate(() => window.__level()))
          await page.waitForTimeout(60)
        }
        return top
      }
      const changed = async (from) => {
        let m = await mark()
        for (let i = 0; i < 40 && m.pressed === from.pressed; i++) {
          await page.waitForTimeout(100)
          m = await mark()
        }
        await page.waitForTimeout(150)
        return m
      }
      const steps = []
      const first = await mark()
      steps.push({ how: 'as found', pressed: first.pressed, level: await loud() })
      await page.mouse.click(first.x, first.y)
      const second = await changed(first)
      steps.push({ how: 'pointer click', pressed: second.pressed, level: await loud() })
      let tabs = 0
      let reached = false
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
      for (; tabs < 30 && !reached; tabs++) {
        await page.keyboard.press('Tab')
        reached = (await mark()).focused
      }
      if (!reached) await page.focus('[data-sound-check]')
      await page.keyboard.press('Enter')
      const third = await changed(second)
      steps.push({ how: 'Enter key', pressed: third.pressed, level: await loud() })
      await page.keyboard.press('Space')
      const fourth = await changed(third)
      steps.push({ how: 'Space key', pressed: fourth.pressed, level: await loud() })
      out.control = {
        name: first.name, width: first.width, height: first.height, reachedByTab: reached, tabs: reached ? tabs : null, steps,
        pictureChanges: first.picture !== second.picture && second.picture !== third.picture && third.picture !== fourth.picture,
        errors: live.errors.length
      }
    }
    await live.context.close()

    const gone = await visit('mode=live', { block: /\/audio\/(?!index\.json)/ })
    const goneBefore = await gone.look()
    await gone.page.mouse.click(640, 360)
    await gone.page.waitForTimeout(3500)
    out.removed = { started: gone.started, before: goneBefore, after: await gone.look(), console: gone.consoleLines, errors: gone.errors }
    await gone.context.close()

    if (after.control > 0) {
      const film = await visit('mode=film', { wait: 1200 })
      const page = film.page
      const read = async (what) => ({ what, ...(await page.evaluate(() => ({ level: window.__sound.made[0]?.state === 'running' ? window.__level() : null, sources: window.__sound.running.size, toneLoops: [...window.__sound.running].filter((n) => n.loop).length, context: window.__sound.made[0]?.state ?? 'none' }))) })
      const playButton = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button[aria-label]')].find((x) => !/sound/i.test(x.getAttribute('aria-label')) && x.hasAttribute('aria-pressed') && x.getClientRects().length > 0)
        if (b) b.setAttribute('data-play-check', '1')
        return Boolean(b)
      })
      const position = await page.evaluate(() => {
        const r = [...document.querySelectorAll('input[type="range"]')].find((x) => x.getClientRects().length > 0)
        if (r) r.setAttribute('data-position-check', '1')
        return r ? { min: Number(r.min || 0), max: Number(r.max || 0) } : null
      })
      const steps = []
      let seekInto = null
      if (playButton && position) {
        const press = () => page.click('[data-play-check]')
        const seek = (v) => page.evaluate((value) => {
          const r = document.querySelector('[data-position-check]')
          r.value = String(value)
          r.dispatchEvent(new Event('input', { bubbles: true }))
          r.dispatchEvent(new Event('change', { bubbles: true }))
        }, v)
        const hide = (state) => page.evaluate((v) => {
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v })
          document.dispatchEvent(new Event('visibilitychange'))
        }, state)
        await page.keyboard.press('Shift')
        await page.waitForTimeout(2500)
        steps.push(await read('playing'))
        await press()
        await page.waitForTimeout(400)
        steps.push(await read('paused'))
        await press()
        await page.waitForTimeout(200)
        steps.push(await read('playing again'))
        await seek(position.min + (position.max - position.min) * 0.4)
        await page.waitForTimeout(200)
        steps.push(await read('after a seek while playing'))
        await hide('hidden')
        await page.waitForTimeout(400)
        steps.push(await read('page hidden'))
        await hide('visible')
        await page.waitForTimeout(400)
        steps.push(await read('page back'))
        await press()
        await page.waitForTimeout(300)
        await seek(position.min + (position.max - position.min) * 0.1)
        await page.waitForTimeout(400)
        steps.push(await read('after a seek while paused'))
        const said = JSON.parse(fs.readFileSync(at('content', 'narration.json'), 'utf8')).film
        const listed = path.join(dir, 'audio', 'index.json')
        const lengths = new Map((fs.existsSync(listed) ? JSON.parse(fs.readFileSync(listed, 'utf8')).lines : []).map((l) => [l.id, l.seconds]))
        const two = c.film.beats.find((b) => (said[b.id] ?? []).length >= 2 && said[b.id][1].at > said[b.id][0].at && lengths.has(`line.${b.id}.1`))
        if (two) {
          const total = c.film.units.reduce((n, u) => n + u.seconds, 0)
          const beatAt = c.film.units.slice(0, c.film.units.findIndex((u) => u.id === two.unit)).reduce((n, u) => n + u.seconds, 0) + two.from
          const span = two.to - two.from
          const second = said[two.id][1].at * span
          const filmAt = () => page.evaluate(() => Number(document.querySelector('[data-position-check]').value)).then((v) => ((v - position.min) / (position.max - position.min)) * total)
          await seek(position.min + ((position.max - position.min) * (beatAt + (said[two.id][0].at * span + second) / 2)) / total)
          await page.waitForTimeout(300)
          const into = (await filmAt()) - beatAt
          const before = await page.evaluate(() => window.__sound.log.length)
          await press()
          await page.waitForTimeout(300)
          const booked = (await page.evaluate((n) => window.__sound.log.slice(n), before)).filter((x) => !x.loop && x.ahead > 0.3)
          await press()
          seekInto = { beat: two.id, secondsIntoTheBeat: Number(into.toFixed(2)), lineStillToCome: `line.${two.id}.1`, wantedIn: Number((second - into).toFixed(2)), lineSeconds: lengths.get(`line.${two.id}.1`), booked: booked.map((x) => ({ in: Number(x.ahead.toFixed(2)), seconds: Number(x.seconds.toFixed(2)) })) }
        }
      }
      out.film = { started: film.started, playButton, position: Boolean(position), steps, seekInto, errors: film.errors, console: film.consoleLines }
      await film.context.close()

      const a = await visit('mode=film&which=a', { wait: 300 })
      const M = await (await import('./lib/logic.mjs')).logic()
      let lead = null
      let laid = null
      let ahead = 0
      try {
        const o = await M.load('/src/film/opening.ts')
        const cues = await M.load('/src/audio/cues.ts')
        ahead = (await M.load('/src/audio/levels.ts')).LIVE.aheadSeconds
        const t = o.openingTimes()
        lead = o.openingFrames() / c.film.fps
        laid = cues.openingEvents({ prompt: c.intro.prompt, charsPerSecond: c.intro.charsPerSecond, levelOpens: t.levelOpens, levelPicks: t.levelPicks, sendPressed: t.held, linesDone: t.lines.map((l) => l.done) }, c.film.fps).length
      } finally {
        await M.close()
      }
      const bar = await a.page.evaluate(() => {
        const r = [...document.querySelectorAll('input[type="range"]')].find((x) => x.getClientRects().length > 0)
        if (r) r.setAttribute('data-position-check', '1')
        return r ? { min: Number(r.min || 0), max: Number(r.max || 0) } : null
      })
      const opening = { started: a.started, position: Boolean(bar), openingSeconds: lead, laid, heard: null, toneLoopsInTheOpening: null, toneLoopsAfterIt: null, errors: a.errors, console: a.consoleLines }
      if (bar && lead !== null) {
        const now = () => a.page.evaluate(() => ({ at: Number(document.querySelector('[data-position-check]').value), shots: window.__sound.shots, tone: [...window.__sound.running].filter((n) => n.loop).length }))
        const button = await a.page.evaluate(() => {
          const b = [...document.querySelectorAll('button[aria-label]')].find((x) => !/sound/i.test(x.getAttribute('aria-label')) && x.hasAttribute('aria-pressed') && x.getClientRects().length > 0)
          if (b) b.setAttribute('data-play-check', '1')
          return Boolean(b)
        })
        await a.page.keyboard.press('Shift')
        await a.page.waitForTimeout(1500)
        if (button) {
          await a.page.click('[data-play-check]')
          await a.page.waitForTimeout(300)
        }
        const from = (await now()).shots
        await a.page.evaluate((value) => {
          const r = document.querySelector('[data-position-check]')
          r.value = String(value)
          r.dispatchEvent(new Event('input', { bubbles: true }))
          r.dispatchEvent(new Event('change', { bubbles: true }))
        }, bar.min)
        if (button) await a.page.click('[data-play-check]')
        const unit = (bar.max - bar.min) / (lead + c.film.units.reduce((n, u) => n + u.seconds, 0))
        let tone = 0
        let last = await now()
        for (let i = 0; i < 400 && last.at < bar.min + (lead - ahead) * unit; i++) {
          tone = Math.max(tone, last.tone)
          await a.page.waitForTimeout(50)
          last = await now()
        }
        opening.toneLoopsInTheOpening = tone
        opening.heard = last.shots - from
        opening.heardBy = Number(((last.at - bar.min) / unit).toFixed(2))
        let end = await now()
        for (let i = 0; i < 200 && end.at < bar.min + (lead + 0.3) * unit; i++) {
          await a.page.waitForTimeout(50)
          end = await now()
        }
        opening.toneLoopsAfterIt = end.tone
        opening.endedAt = Number(((end.at - bar.min) / unit).toFixed(2))
      }
      out.filmA = opening
      await a.context.close()
    }

    if (o.still !== false && c.stills.length) {
      const { readCanvas, stillFrom } = await import('./lib/capture.mjs')
      const id = o.still && o.still !== true ? o.still : c.stills[0].id
      const { spec } = stillFrom({ id, tier: 'draft' })
      const shot = async (block) => {
        const v = await visit(`mode=capture&format=${c.formats.preview.id}&assets=full`, { block, wait: 0 })
        try {
          if (!v.started) return { sha256: null, errors: v.errors }
          await v.page.evaluate(async (s) => {
            window.showcase.setDiagnostic('beauty')
            await window.showcase.renderStill(s)
          }, spec)
          const png = await readCanvas(v.page)
          const seen = await v.look()
          return { sha256: sha(png), bytes: png.length, audioChunkRequests: seen.chunkRequests, soundRequests: seen.soundRequests, contexts: seen.contexts, errors: v.errors }
        } finally {
          await v.context.close()
        }
      }
      const present = await shot(null)
      const absent = chunks.length ? await shot((url) => isChunk(url.pathname)) : null
      out.capture = { still: id, tier: 'draft', format: c.formats.preview.id, present, absent }
    }
    return out
  } finally {
    await browser.close()
    await site.close()
  }
}

// Stand-in sounds made with ffmpeg, so every step can be run before a take exists. They are never committed and never shipped.
export async function fixtures(a, c, M) {
  const dir = at('out', 'work', 'audio', 'fixtures')
  const root = a.root && a.root !== true ? a.root : at('out', 'work', 'audio', 'fixture-run')
  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const P = places(root)
  const n = narration()
  const make = (name, expr, secs) => {
    const file = path.join(dir, `${name}.mp3`)
    run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `aevalsrc=${expr}:s=${c.audio.sampleRate}:d=${secs.toFixed(3)}`, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '2', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-map_metadata', '-1', file])
    return file
  }
  const only = a.only && a.only !== true ? String(a.only).split(',') : null
  let made = 0
  const sfx = c.audio.sfx.filter((s) => !only || only.includes(s.id))
  for (const [i, s] of sfx.entries()) {
    const v = s.variants ?? 1
    let expr
    let secs
    if (M.cues.loopCues.includes(s.id)) {
      secs = s.seconds + 6
      expr = `0.2*(random(${i})*2-1)*(0.75+0.25*sin(2*PI*0.37*t))`
    } else if (s.id === 'hold-music') {
      secs = s.seconds + 0.6
      expr = `0.4*sin(2*PI*(392+98*floor(mod(t*4\\,4)))*t)*between(t\\,0.2\\,${(s.seconds + 0.4).toFixed(2)})`
    } else {
      const len = Math.max(0.05, s.seconds * (v > 1 ? 0.8 : 1.2))
      const count = v > 1 ? v + 1 : 1
      const step = len + 0.3
      const bursts = []
      for (let k = 0; k < count; k++) {
        const t0 = 0.15 + k * step
        const f = 220 + ((i * 53 + k * 131) % 900)
        const amp = (0.8 - k * 0.07).toFixed(2)
        bursts.push(`${amp}*(0.7*sin(2*PI*${f}*(t-${t0.toFixed(3)}))+0.3*(random(${k + 1})*2-1))*exp(-(t-${t0.toFixed(3)})*${(4 / len).toFixed(2)})*between(t\\,${t0.toFixed(3)}\\,${(t0 + len).toFixed(3)})`)
      }
      secs = 0.15 + count * step
      expr = bursts.join('+')
    }
    const file = make(`cue-${s.id}`, expr, secs)
    await fileTake({ cue: s.id, file, prompt: `A fixture made with ffmpeg, not a take. ${promptLine(s.id)}`, cost: '0', filed: 'fixture', root }, P, c, M, true)
    await keepTake({ cue: s.id, force: true, fixture: true, why: 'a fixture, kept so the tools can be run', listener: a.answered ? JSON.stringify({ by: 'a stand-in answer, nobody listened', voice: false, word: false, music: musical(s.id), melody: musical(s.id), fits: true }) : undefined, root }, P, c, M, true)
    made++
  }
  const lines = []
  for (const [beat, list] of Object.entries(n.film)) list.forEach((_, k) => lines.push(`${beat}:${k}`))
  for (const [key, list] of Object.entries(n.liveOnly)) if (Array.isArray(list)) list.forEach((_, k) => lines.push(`live.${key}:${k}`))
  for (const [i, name] of (only ? [] : lines).entries()) {
    const t = target({ line: name }, c, M.cues)
    const segs = t.text.split(n.pauseMark).map((s) => s.trim().split(/\s+/).filter(Boolean).length).filter((w) => w > 0)
    const words = segs.reduce((x, y) => x + y, 0)
    const total = words / (c.audio.narratorMaxWordsPerSecond * 0.99)
    const talk = words / 2.6
    const pause = segs.length > 1 ? Math.max(0.25, (total - talk) / (segs.length - 1)) : 0
    const stretch = segs.length > 1 ? 1 : total / talk
    let at0 = 0.12
    const parts = []
    for (const w of segs) {
      const len = (w / 2.6) * stretch
      parts.push(`0.5*sin(2*PI*${130 + (i % 5) * 9}*t)*(0.65+0.35*sin(2*PI*5*t))*between(t\\,${at0.toFixed(3)}\\,${(at0 + len).toFixed(3)})`)
      at0 += len + pause
    }
    const file = make(`line-${t.id}`, parts.join('+'), at0 - pause + 0.15)
    await fileTake({ line: name, file, cost: '0', filed: 'fixture', root }, P, c, M, true)
    await keepTake({ line: name, force: true, fixture: true, why: 'a fixture, kept so the tools can be run', listener: a.answered ? JSON.stringify({ by: 'a stand-in answer, nobody listened', transcript: t.text, whisper: false, laugh: false, warmth: false, excitement: false, unimpressedAndSmug: true }) : undefined, root }, P, c, M, true)
    made++
  }
  if (a.answered) fs.copyFileSync(path.join(P.audio, 'ASSETS-ROWS.md'), path.join(path.dirname(P.audio), 'ASSETS.md'))
  const index = pack(P, c, M, true)
  console.log(`fixtures: ${made} stand-in sounds made with ffmpeg in ${rel(dir)}, filed, kept and packed under ${rel(path.resolve(root))}`)
  console.log(`fixtures: ${index.sfx.length} short sounds, ${index.loops.length} loops, ${index.lines.length} lines, ${(index.totalBytes / 1048576).toFixed(2)} MB. They are not takes: nothing here is committed or shipped`)
  return P
}

// Every event name the pages emit, read from the source, with what the sound side does with it.
export function emittedEvents(M) {
  const found = new Map()
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name)
      if (f.isDirectory()) {
        if (path.relative(at(), p) !== path.join('src', 'audio')) walk(p)
      } else if (f.name.endsWith('.ts')) {
        const text = fs.readFileSync(p, 'utf8')
        const passesOn = /const say = [^\n]*io\.emit\(/.test(text)
        for (const m of text.matchAll(/\b(io\.emit|say)\(\s*'([a-z0-9-]+)'/g)) if (m[1] === 'io.emit' || passesOn) found.set(m[2], path.relative(at(), p))
      }
    }
  }
  walk(at('src'))
  const live = new Set(Object.values(M.cues.liveTriggers).map((t) => (t.on === 'event' ? t.event : '')))
  const unknown = [...found].filter(([name]) => !M.cues.cueOfEvent(name) && !M.cues.stopEvents[name] && !live.has(name) && !M.cues.silentEvents.includes(name))
  return { count: found.size, unknown: unknown.map(([name, file]) => `${name} (${file})`) }
}

function status(P, c, M) {
  const kept = new Set(keptRecords(P).map((r) => r.id))
  const ledger = readLedger(P)
  const n = narration()
  const want = []
  for (const s of M.cues.allCues(c.audio.sfx)) for (let i = 0; i < (s.variants ?? 1); i++) want.push({ id: M.cues.variantId(s.id, i, s.variants ?? 1), key: s.id })
  for (const [beat, list] of Object.entries(n.film)) list.forEach((_, k) => want.push({ id: M.cues.filmLineId(beat, k), key: M.cues.filmLineId(beat, k) }))
  for (const [key, list] of Object.entries(n.liveOnly)) if (Array.isArray(list)) list.forEach((_, k) => want.push({ id: M.cues.liveLineId(key, k), key: M.cues.liveLineId(key, k) }))
  const missing = want.filter((w) => !kept.has(w.id))
  console.log(`sound: ${want.length - missing.length} of ${want.length} sounds kept (${M.cues.allCues(c.audio.sfx).length} cues with their variants, and the narrator's lines). ${ledger.takes.length} takes filed`)
  if (missing.length) console.log(`sound: not kept yet: ${missing.slice(0, 12).map((m) => m.id).join(', ')}${missing.length > 12 ? `, and ${missing.length - 12} more` : ''}`)
  const e = emittedEvents(M)
  console.log(`sound: the pages emit ${e.count} events by name. ${e.unknown.length ? `With no cue, no stop, no line and not listed as silent in src/audio/cues.ts: ${e.unknown.join(', ')}` : 'Each has a cue, stops one, sets off a line or is listed as silent on purpose'}`)
  console.log('sound: --cue ID --file F files a take, --line BEAT:N --file F files a line, --keep keeps one, --pack builds what the site ships, --pack-check compares public/audio/ with the committed index, --sheet draws the kept sounds, --check runs the sound checks, --fixtures makes stand-ins to test with')
}

async function main() {
  const a = args()
  const c = config()
  const P = places(a.root)
  if (a['pack-check']) {
    const { packCheck } = await import('./lib/sound-packcheck.mjs')
    if (!packCheck(at(), P.pub)) process.exitCode = 1
    return
  }
  const M = await modules()
  try {
    if (a.fixtures) await fixtures(a, c, M)
    else if (a.browser) {
      const r = await engineInBrowser(P, c)
      for (const run of r.runs) console.log(`browser: ${run.name}: before the click ${run.before.contexts} audio contexts and ${run.soundRequestsBefore} requests for sound; after it state ${run.after.state}, available ${run.after.available}, backend ${run.after.backend}, ${run.soundRequests} requests, ${run.errors.length} errors, ${run.console.length} console lines${run.heard ? `; heard: room tone ${run.heard.tone}, effect ${run.heard.effect}, line ${run.heard.line}, muted ${run.heard.muted}` : ''}${run.played ? `; elements played: ${run.played.roomTone} for the room tone, ${run.played.afterAnEffectAndALine} after an effect and a line` : ''}`)
      console.log(`browser: ${r.browser}. Written to out/work/audio/browser.json`)
      if (a.site) {
        const s = await siteInBrowser(await siteBuild(P))
        writeJson(at('out', 'work', 'audio', P.scratch ? 'site-fixtures.json' : 'site.json'), s)
        console.log(`site: ${JSON.stringify(s)}`)
      }
    }
    else if (a.check) {
      const { soundChecks } = await import('./mix.mjs')
      const { logic } = await import('./lib/logic.mjs')
      const site = await logic()
      try {
        await soundChecks(a, P, c, await modulesFrom(site.load))
      } finally {
        await site.close()
      }
    } else if (a.pack) pack(P, c, M)
    else if (a.sheet) {
      const out = a.out && a.out !== true ? path.resolve(a.out) : at('out', 'work', 'audio', P.scratch ? 'sheet-fixtures.png' : 'sheet.png')
      const s = await sheet(P, c, M, out)
      console.log(`sheet: ${s.count} kept sounds drawn on ${rel(s.file)}`)
    } else if (a.file && a.file !== true) {
      await fileTake(a, P, c, M)
      if (a.keep) await keepTake(a, P, c, M)
    } else if (a.keep) await keepTake(a, P, c, M)
    else if (a.listener && a.listener !== true) attachListener(a, P, c, M)
    else if (a.cue || a.line) {
      const t = target(a, c, M.cues)
      const used = readLedger(P).takes.filter((x) => x.key === t.key).length
      console.log(`${t.key}: ${used} of ${t.max} takes used. ${t.kind === 'cue' ? `${t.seconds} s, class ${t.cls}, ${t.variants} variant${t.variants === 1 ? '' : 's'}. Every prompt ends with: ${promptLine(t.id)}` : `Words: ${t.text}`}`)
      const describes = t.kind === 'cue' ? cueLines()[t.id] : undefined
      if (describes) console.log(`What is heard: ${describes}`)
      const sheet = listenerSheet(t, describes)
      console.log(`The listener's questions, the same for every take:\n${sheet.questions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}`)
      console.log(`The answers go back as a file, with --listener FILE:\n${JSON.stringify(sheet.answers)}`)
    } else status(P, c, M)
  } finally {
    await closeModules()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`sound: ${e.message}`)
    process.exit(1)
  })
}
