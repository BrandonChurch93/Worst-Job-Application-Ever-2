// npm run credits: the one door to the sound service. Every call this build makes goes through it.
// It keeps audio/CREDITS.json and writes audio/CREDITS.md from it: a row for every call, written before the call returns.
// It makes no call that would take the build past its limit, and no sound effect call without a length.
// kit/addenda/001-sound-budget-and-narrator.md sets the rules.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'

const HOST = 'https://api.elevenlabs.io'
export const EFFECT_MIN_SECONDS = 0.5
export const EFFECT_MAX_SECONDS = 30
// The dearest rate each endpoint is known to charge. It stands in for a rate until that rate has been measured.
export const WORST = { speech: 1, effect: 40 }

export const ledgerPath = () => at('audio', 'CREDITS.json')
export const sheetPath = () => at('audio', 'CREDITS.md')
export const emptyLedger = () => ({
  about: 'Every call this build made to the sound service, in order. audio/CREDITS.md is written from this file by npm run credits: edit neither by hand.',
  rates: {},
  reviewReached: false,
  rows: []
})
export const readLedger = (file = ledgerPath()) => (fs.existsSync(file) ? readJson(file) : emptyLedger())
export const totalOf = (ledger) => ledger.rows.reduce((n, r) => n + r.cost, 0)
export const effectSeconds = (s) => Math.min(EFFECT_MAX_SECONDS, Math.max(EFFECT_MIN_SECONDS, s))

// A hard limit is a line Brandon has drawn under the cap for a stretch of the work. It is kept in the ledger with his words,
// never in the kit's numbers, and only his word takes it away. The lowest one that stands is the one that counts.
export const hardLimitOf = (ledger) => (ledger.hardLimits ?? []).filter((h) => !h.lifted).reduce((low, h) => (!low || h.limit < low.limit ? h : low), null)

export function limits(c, ledger) {
  const cap = c.audio.creditCap
  const reserve = ledger.reviewReached ? 0 : c.audio.creditReserveAfterReview
  const hard = hardLimitOf(ledger)
  return { cap, reserve, limit: hard ? Math.min(cap - reserve, hard.limit) : cap - reserve, hard, extrasStop: cap * c.audio.creditExtrasStopFraction }
}

// What a call is expected to cost, before it is made.
export function estimate(call, ledger) {
  if (call.kind === 'quota' || call.kind === 'voices') return 0
  // A model other than the voice's usual one is checked at its own measured rate, and at the dearest known rate until it has one.
  if (call.kind === 'speech' && call.model) return Math.ceil(String(call.text ?? '').length * (ledger.rates.speechByModel?.[call.model]?.perCharacter ?? WORST.speech))
  if (call.kind === 'speech') return Math.ceil(String(call.text ?? '').length * (ledger.rates.speech?.perCharacter ?? WORST.speech))
  if (call.kind === 'effect') return Math.ceil(effectSeconds(call.seconds) * (ledger.rates.effect?.perSecond ?? WORST.effect))
  throw new Error(`No kind of call named "${call.kind}"`)
}

// Whether a call may be made. Never without a length, never past the limit, and nothing extra once the extras line is passed.
export function allow(call, ledger, c) {
  const L = limits(c, ledger)
  const total = totalOf(ledger)
  if (call.kind === 'effect' && !(Number.isFinite(call.seconds) && call.seconds > 0)) return { ok: false, why: 'a sound effect call sets its length: give --seconds' }
  if (call.kind === 'effect' && !(typeof call.prompt === 'string' && call.prompt.trim())) return { ok: false, why: 'a sound effect call needs its prompt' }
  if (call.kind === 'speech' && !(typeof call.text === 'string' && call.text.trim())) return { ok: false, why: 'a speech call needs its text' }
  const cost = estimate(call, ledger)
  if (L.hard && total + cost > L.hard.limit) return { ok: false, cost, total, why: `the running total ${total} and this call's ${cost} would pass ${L.hard.limit}, the hard limit of ${L.hard.from}: ${L.hard.words}. Sound stops here and Brandon is asked` }
  if (total + cost > L.limit) return { ok: false, cost, total, why: `the running total ${total} and this call's ${cost} would pass ${L.limit}, which is the cap of ${L.cap}${L.reserve ? ` less the ${L.reserve} held back for the review` : ''}` }
  if (call.extra && total > L.extrasStop) return { ok: false, cost, total, why: `the running total ${total} is past ${L.extrasStop}, where nothing extra is made` }
  return { ok: true, cost, total, limit: L.limit }
}

const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()

export function sheetOf(ledger, c) {
  const L = limits(c, ledger)
  const total = totalOf(ledger)
  const rate = (r, unit) => (r ? `${r[unit === 'character' ? 'perCharacter' : 'perSecond']} credits a ${unit}. ${r.how}` : `not measured yet. Until it is, a call is checked at ${unit === 'character' ? WORST.speech : WORST.effect} credits a ${unit}`)
  const lines = [
    '# The sound credits of this build',
    '',
    `This build may spend at most ${L.cap} ElevenLabs credits in all, on every call of every kind. ${ledger.reviewReached ? 'The review has been reached, so the whole cap may be used.' : `${L.reserve} of them are held back for what Brandon asks for at the review, so the build stops at ${L.limit} before it.`} Nothing extra is made once the total passes ${L.extrasStop}.`,
    '',
    'The count is of this build\'s own calls, never of what the account has left: the account is shared with other builds. Every call goes through `npm run credits`, which writes its row here before it returns and makes no call that would pass the limit. A sound effect is never asked for without its length. `kit/addenda/001-sound-budget-and-narrator.md` sets these rules. This file is written by the tool from `audio/CREDITS.json`.',
    '',
    `Running total: ${total} of ${L.cap}. Calls: ${ledger.rows.length}.`,
    ...(L.hard ? ['', `Hard limit: ${L.hard.limit}. ${L.hard.from}: ${L.hard.words} Left before it: ${L.hard.limit - total}. No call is made that would pass it.`] : []),
    '',
    '## Rates',
    '',
    `- Speech: ${rate(ledger.rates.speech, 'character')}`,
    `- Sound effects: ${rate(ledger.rates.effect, 'second')}`,
    ...Object.entries(ledger.rates.speechByModel ?? {}).map(([m, r]) => `- Speech with the model ${m}: ${r.perCharacter} credits a character. ${r.how}`),
    '',
    '## Calls',
    '',
    '| # | Time, UTC | Endpoint | Line or cue | Asked for | Answer | Cost | How the cost is known | Running total |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ]
  let run = 0
  for (const r of ledger.rows) {
    run += r.cost
    lines.push(`| ${r.n} | ${r.time} | ${cell(r.endpoint)} | ${cell(r.what)} | ${cell(r.asked)} | ${cell(r.answer)} | ${r.cost} | ${cell(r.how)} | ${run} |`)
  }
  return lines.join('\n') + '\n'
}

export function addRow(ledger, row) {
  const n = ledger.rows.length + 1
  ledger.rows.push({ n, ...row })
  return n
}

function save(ledger, c) {
  writeJson(ledgerPath(), ledger)
  fs.writeFileSync(sheetPath(), sheetOf(ledger, c))
}

const lockFile = () => at('out', 'work', 'audio', 'credits.lock')
function lock() {
  fs.mkdirSync(path.dirname(lockFile()), { recursive: true })
  const until = Date.now() + 240000
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lockFile(), 'wx'))
      held = true
      return
    } catch {
      if (Date.now() > until) throw new Error('another sound call has held the ledger for four minutes: look at out/work/audio/credits.lock')
      spawnSync('sleep', ['0.5'])
    }
  }
}
let held = false
const unlock = () => {
  if (held) fs.rmSync(lockFile(), { force: true })
  held = false
}

function curl(argv) {
  const handle = process.env.SOUND_CREDENTIAL
  if (!handle) throw new Error('set SOUND_CREDENTIAL to the handle of the saved credential of the sound service')
  const r = spawnSync('pplx', ['credentials', 'run', handle, '--', 'curl', '-sS', '--max-time', '240', ...argv], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.error) throw new Error(`the call could not be started: ${r.error.message}`)
  return r
}

function usage() {
  const r = curl([`${HOST}/v1/user/subscription`])
  try {
    const d = JSON.parse(r.stdout)
    if (typeof d.character_count !== 'number') throw new Error('no count')
    return { used: d.character_count, limit: d.character_limit, tier: d.tier, status: d.status, reset: d.next_character_count_reset_unix }
  } catch {
    throw new Error(`the account's usage could not be read: ${(r.stdout || r.stderr || '').slice(0, 200)}`)
  }
}

function voiceId(c, given) {
  if (given && given !== true) return String(given)
  const cache = at('out', 'work', 'audio', 'voice.json')
  if (fs.existsSync(cache)) {
    const v = readJson(cache)
    if (v.name === c.audio.narratorVoice) return v.id
  }
  const r = curl([`${HOST}/v1/voices`])
  const hit = (JSON.parse(r.stdout).voices ?? []).find((v) => v.name === c.audio.narratorVoice)
  if (!hit) throw new Error(`no voice named "${c.audio.narratorVoice}" in the account`)
  fs.mkdirSync(path.dirname(cache), { recursive: true })
  writeJson(cache, { name: hit.name, id: hit.voice_id })
  return hit.voice_id
}

const headersOf = (file) => {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cut = line.indexOf(':')
    if (cut > 0) out[line.slice(0, cut).trim().toLowerCase()] = line.slice(cut + 1).trim()
  }
  return out
}

const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const textOf = (v, file) => (file && file !== true ? fs.readFileSync(String(file), 'utf8').replace(/\n+$/, '') : v && v !== true ? String(v) : '')
const num = (v) => (v === undefined || v === true ? undefined : Number(v))

function post(c, ledger, call, a) {
  const verdict = allow(call, ledger, c)
  if (!verdict.ok) return { ok: false, refused: true, why: verdict.why, total: totalOf(ledger) }
  const n = ledger.rows.length + 1
  const dir = at('out', 'work', 'audio', 'calls')
  fs.mkdirSync(dir, { recursive: true })
  const slug = String(call.what).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || call.kind
  const out = a.out && a.out !== true ? path.resolve(String(a.out)) : path.join(dir, `${String(n).padStart(4, '0')}-${slug}.mp3`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const bodyFile = path.join(dir, `${String(n).padStart(4, '0')}-${slug}.request.json`)
  const headFile = path.join(dir, `${String(n).padStart(4, '0')}-${slug}.headers.txt`)
  let url
  let body
  let asked
  if (call.kind === 'speech') {
    const settings = {}
    if (call.stability !== undefined) settings.stability = call.stability
    if (call.similarity !== undefined) settings.similarity_boost = call.similarity
    if (call.style !== undefined) settings.style = call.style
    if (call.speed !== undefined) settings.speed = call.speed
    body = { text: call.text }
    if (call.model) body.model_id = call.model
    if (Object.keys(settings).length) body.voice_settings = settings
    if (call.seed !== undefined) body.seed = call.seed
    url = `${HOST}/v1/text-to-speech/${call.voice}?output_format=mp3_44100_128`
    asked = `${call.text.length} characters${Object.keys(settings).length ? `, ${Object.entries(settings).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}${call.model ? `, model ${call.model}` : ''}`
  } else {
    const seconds = effectSeconds(call.seconds)
    body = { text: call.prompt, duration_seconds: seconds }
    if (call.influence !== undefined) body.prompt_influence = call.influence
    if (call.loop) body.loop = true
    if (call.model) body.model_id = call.model
    url = `${HOST}/v1/sound-generation?output_format=mp3_44100_128`
    asked = `${seconds} s${seconds !== call.seconds ? ` for a cue of ${call.seconds} s` : ''}${call.loop ? ', a loop' : ''}${call.influence !== undefined ? `, influence ${call.influence}` : ''}`
  }
  writeJson(bodyFile, body)
  const measure = a.measure === true || !ledger.rates[call.kind]
  const before = measure ? usage() : null
  const time = now()
  const started = Date.now()
  const r = curl(['-X', 'POST', '-H', 'Content-Type: application/json', '--data-binary', `@${bodyFile}`, '-D', headFile, '-o', out, '-w', '%{http_code}', url])
  const took = (Date.now() - started) / 1000
  const status = Number(String(r.stdout).trim().slice(-3))
  const after = measure ? usage() : null
  const head = headersOf(headFile)
  const reported = Number(head['character-cost'])
  const delta = before && after ? after.used - before.used : null
  const units = call.kind === 'speech' ? call.text.length : effectSeconds(call.seconds)
  let cost
  let how
  if (Number.isFinite(reported) && head['character-cost'] !== undefined) {
    cost = reported
    how = 'reported by the response'
    if (delta !== null) how += `; the account's usage moved by ${delta} across the call`
  } else if (delta !== null && delta > 0) {
    cost = delta
    how = `measured: the account's usage read ${before.used} straight before and ${after.used} straight after`
  } else if (status === 200 && !ledger.rates[call.kind]) {
    cost = Math.ceil(units * WORST[call.kind])
    how = 'not reported, and the account\'s usage did not move across the call: counted at the dearest known rate'
  } else if (status === 200) {
    cost = Math.ceil(units * (call.kind === 'speech' ? ledger.rates.speech.perCharacter : ledger.rates.effect.perSecond))
    how = 'by the measured rate'
  } else {
    cost = 0
    how = 'the call failed and reported no cost'
  }
  if (status === 200 && cost > 0 && !ledger.rates[call.kind] && !how.startsWith('not reported')) {
    const per = Number((cost / units).toFixed(4))
    ledger.rates[call.kind] = call.kind === 'speech'
      ? { perCharacter: per, how: `MEASURED ${time} on call ${n}: ${cost} credits for ${units} characters, ${how}.` }
      : { perSecond: per, how: `MEASURED ${time} on call ${n}: ${cost} credits for ${units} s asked, ${how}.` }
  }
  if (status === 200 && cost > 0 && call.kind === 'speech' && call.model && !ledger.rates.speechByModel?.[call.model] && how.startsWith('reported')) {
    ledger.rates.speechByModel = { ...(ledger.rates.speechByModel ?? {}), [call.model]: { perCharacter: Number((cost / units).toFixed(4)), how: `MEASURED ${time} on call ${n}: ${cost} credits for ${units} characters, ${how}.` } }
  }
  let answer = `HTTP ${status}, ${took.toFixed(1)} s`
  if (status !== 200) {
    let said = ''
    try {
      said = fs.readFileSync(out, 'utf8').slice(0, 160)
    } catch {}
    answer += said ? `: ${said}` : ''
    fs.rmSync(out, { force: true })
  }
  addRow(ledger, { time, endpoint: call.kind === 'speech' ? 'POST /v1/text-to-speech' : 'POST /v1/sound-generation', what: call.what, asked, answer, cost, how })
  save(ledger, c)
  return { ok: status === 200, n, status, file: status === 200 ? out : null, cost, how, total: totalOf(ledger), left: limits(c, ledger).limit - totalOf(ledger), seconds: took, headers: Object.keys(head) }
}

async function main() {
  const a = args()
  const c = config()
  if (a.speech || a.effect || a.quota || a.models || a['voice-info'] || a['review-reached']) lock()
  try {
    const ledger = readLedger()
    if (a['review-reached']) {
      ledger.reviewReached = true
      save(ledger, c)
      console.log('credits: the review has been reached, the held back credits may now be used')
      return
    }
    if (a.quota) {
      const u = usage()
      addRow(ledger, { time: now(), endpoint: 'GET /v1/user/subscription', what: a.what && a.what !== true ? String(a.what) : 'the account\'s quota', asked: 'nothing, a read', answer: `plan ${u.tier}, ${u.status}: ${u.used} of ${u.limit} used by every build on the account, reset ${new Date(u.reset * 1000).toISOString().replace(/\.\d+Z$/, 'Z')}`, cost: 0, how: 'a read costs nothing' })
      save(ledger, c)
      console.log(JSON.stringify({ ok: true, ...u, total: totalOf(ledger) }))
      return
    }
    if (a.models || a['voice-info']) {
      // Reads that cost nothing: which models the account may speak with, and what the narrator's voice is.
      const id = a['voice-info'] ? voiceId(c, a.voice) : null
      const r = curl([a.models ? `${HOST}/v1/models` : `${HOST}/v1/voices/${id}`])
      let d
      try {
        d = JSON.parse(r.stdout)
      } catch {
        throw new Error(`the read gave no JSON: ${(r.stdout || r.stderr || '').slice(0, 200)}`)
      }
      const said = a.models
        ? (Array.isArray(d) ? d : []).filter((m) => m.can_do_text_to_speech).map((m) => ({ id: m.model_id, name: m.name, costFactor: m.token_cost_factor, rate: m.model_rates?.character_cost_multiplier, maxChars: m.maximum_text_length_per_request, style: m.can_use_style, boost: m.can_use_speaker_boost }))
        : { name: d.name, id: d.voice_id, category: d.category, models: d.high_quality_base_model_ids, settings: d.settings, labels: d.labels, description: d.description, verified: d.voice_verification?.is_verified, fineTuning: d.fine_tuning?.state }
      addRow(ledger, { time: now(), endpoint: a.models ? 'GET /v1/models' : 'GET /v1/voices/{the narrator}', what: a.what && a.what !== true ? String(a.what) : a.models ? 'which models may speak' : 'what the narrator\'s voice is', asked: 'nothing, a read', answer: a.models ? `${said.length} models that speak` : `voice ${said.name}, ${said.category}`, cost: 0, how: 'a read costs nothing' })
      save(ledger, c)
      console.log(JSON.stringify({ ok: true, said, total: totalOf(ledger) }))
      return
    }
    if (a.speech || a.effect) {
      const what = a.what && a.what !== true ? String(a.what) : ''
      if (!what) throw new Error('say what the call is for: --what "the line or the cue, and which take"')
      const call = a.speech
        ? { kind: 'speech', what, text: textOf(a.text, a['text-file']), voice: voiceId(c, a.voice), model: a.model && a.model !== true ? String(a.model) : undefined, speed: num(a.speed), stability: num(a.stability), similarity: num(a.similarity), style: num(a.style), seed: num(a.seed), extra: a.extra === true }
        : { kind: 'effect', what, prompt: textOf(a.prompt, a['prompt-file']), seconds: num(a.seconds), influence: num(a.influence), loop: a.loop === true, model: a.model && a.model !== true ? String(a.model) : undefined, extra: a.extra === true }
      const r = post(c, ledger, call, a)
      console.log(JSON.stringify(r))
      if (!r.ok) process.exitCode = r.refused ? 3 : 2
      return
    }
    const L = limits(c, ledger)
    const total = totalOf(ledger)
    console.log(`credits: ${total} of ${L.cap} used in ${ledger.rows.length} calls. ${L.limit - total} left before ${L.hard && L.hard.limit === L.limit ? `the hard limit of ${L.hard.limit}` : ledger.reviewReached ? 'the cap' : `the review's reserve of ${L.reserve}`}.`)
    if (L.hard) console.log(`credits: the hard limit is from ${L.hard.from}.`)
    console.log(`credits: speech ${ledger.rates.speech ? `${ledger.rates.speech.perCharacter} a character` : 'not measured'}, effects ${ledger.rates.effect ? `${ledger.rates.effect.perSecond} a second` : 'not measured'}`)
    console.log('credits: --quota reads the account. --speech --what W --text T | --text-file F [--speed N --stability N --similarity N --style N --model ID --voice ID --out F] speaks a line. --effect --what W --prompt P | --prompt-file F --seconds N [--loop --influence N --out F] makes an effect. --measure reads the usage round a call. --extra marks a call section 2 of the addendum calls extra.')
  } finally {
    unlock()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    unlock()
    console.error(`credits: ${e.message}`)
    process.exit(1)
  })
}
