// The listening jobs of a batch and what becomes of their answers.
//   node tools/lib/sound-listen.mjs jobs --batch NAME [--ids ID,ID] [--kind line|cue]   writes out/work/audio/listen/NAME.json, one job for the newest take of each id without answers
//   node tools/lib/sound-listen.mjs apply --batch NAME                                   reads NAME-answers.json, settles each take's answers and files them with the take
// An answer is whole only if it answers every question and does not say it was given no sound. Two whole answers settle a take; where they
// disagree on a yes or no that decides the take, the majority of the whole answers decides, and a tie counts against the take.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from './paths.mjs'
import { cueLines, places, readLedger, musical } from '../sound.mjs'

const dir = at('out', 'work', 'audio', 'listen')
export const VOID = /no (actual |real )?audio|not (actually )?attached|cannot (actually )?(hear|listen|access|process)|can't (hear|listen)|unable to (hear|listen)|text-based|transcript|\btext\b|textual|semantic|inferred|\binfer\b|impl(y|ies|ied)\b|would naturally|phrasing|sentence structure|without (hearing|the audio)|did not receive|not provided|as an ai/i
export const LINE_KEYS = ['whisper', 'laugh', 'warmth', 'excitement', 'unimpressedAndSmug']
export const CUE_KEYS = ['voice', 'word', 'music', 'melody', 'fits']

export const linePrompt = () => [
  'This is a short voice recording. Answer from the recording. Reply with one JSON object and nothing else, with exactly these keys:',
  '"whisper": true or false. Is any of it whispered?',
  '"laugh": true or false. Is there a laugh?',
  '"warmth": true or false. Does the speaker sound warm?',
  '"excitement": true or false. Does the speaker sound excited?',
  '"attitude": a few words of your own for the attitude of the speaker.',
  '"unimpressedAndSmug": true or false. Does the speaker sound unimpressed and a little smug?',
  '"transcript": what is said, word for word, with nothing added.',
  '"basis": one sentence saying what your answers about the sound of the voice rest on.'
].join('\n')

export const cuePrompt = (describes) => [
  'This is a short sound recording. Answer from the recording. Reply with one JSON object and nothing else, with exactly these keys:',
  '"heard": what is heard, in one sentence.',
  '"madeOf": what the thing that makes the sound is made of.',
  '"events": a number. How many separate events are there?',
  '"voice": true or false. Is there a voice?',
  '"word": true or false. Is there a word?',
  '"music": true or false. Is there music?',
  '"melody": true or false. Is there a melody?',
  `"fits": true or false. Does it fit this line: ${describes}`,
  '"basis": one sentence saying what your answers rest on.'
].join('\n')

export function parseAnswer(report, kind) {
  const text = String(report ?? '')
  const m = text.match(/\{[\s\S]*\}/)
  let json = null
  try {
    json = m ? JSON.parse(m[0]) : null
  } catch {}
  const keys = kind === 'line' ? LINE_KEYS : CUE_KEYS
  const complete = Boolean(json) && keys.every((k) => typeof json[k] === 'boolean') && (kind === 'line' ? typeof json.transcript === 'string' && json.transcript.trim().length > 0 : typeof json.heard === 'string' && json.heard.trim().length > 0)
  const outside = m ? text.replace(m[0], '') : text
  const saysNoSound = VOID.test(`${outside} ${json?.basis ?? ''}`)
  return { json, whole: complete && !saysNoSound, complete, saysNoSound }
}

const plain = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean).join(' ')

export function settle(reports, kind) {
  const parsed = reports.map((r) => parseAnswer(r, kind))
  const whole = parsed.filter((p) => p.whole).map((p) => p.json)
  const keys = kind === 'line' ? LINE_KEYS : CUE_KEYS
  const out = { by: `the audio evaluation tool: ${reports.length} asks, ${whole.length} whole, ${reports.length - whole.length} void`, asks: reports.length, whole: whole.length }
  if (kind === 'line') {
    const scripts = parsed.filter((p) => p.json && typeof p.json.transcript === 'string').map((p) => p.json.transcript.trim())
    const counts = new Map()
    for (const s of scripts) counts.set(plain(s), (counts.get(plain(s)) ?? 0) + 1)
    const top = [...counts].sort((a, b) => b[1] - a[1])[0]
    out.transcript = top ? scripts.find((s) => plain(s) === top[0]) : null
    out.transcripts = scripts
    out.transcriptAgreed = top ? `${top[1]} of ${scripts.length}` : '0 of 0'
    out.attitudes = whole.map((w) => w.attitude).filter(Boolean)
  } else {
    out.heard = whole.map((w) => w.heard).join(' / ') || null
    out.madeOf = whole.map((w) => w.madeOf).join(' / ') || null
    out.events = whole.map((w) => w.events).join(' / ') || null
  }
  if (kind === 'line') {
    // MEASURED 2026-11-25: asked neutrally to describe a voice, the tool answers that it was given no audio and only the words.
    // So its yes and no about how a voice sounds are guesses from the words. They are kept as claims and settle nothing.
    out.toneHeard = false
    out.toneClaims = Object.fromEntries(keys.map((k) => [k, `${parsed.filter((p) => p.json && p.json[k] === true).length} yes, ${parsed.filter((p) => p.json && p.json[k] === false).length} no`]))
    out.claimedFromSound = whole.length
    for (const k of keys) out[k] = null
    out.basis = parsed.filter((p) => p.json?.basis).map((p) => p.json.basis)
    return out
  }
  for (const k of keys) {
    const yes = whole.filter((w) => w[k] === true).length
    const no = whole.length - yes
    if (whole.length < 2) out[k] = null
    else if (yes === no) out[k] = k === 'unimpressedAndSmug' || k === 'fits' ? false : true
    else out[k] = yes > no
    out[`${k}Votes`] = `${yes} yes, ${no} no`
  }
  out.basis = parsed.filter((p) => p.json?.basis).map((p) => p.json.basis)
  return out
}

function main() {
  const a = args()
  const cmd = a._[0]
  const c = config()
  const P = places()
  const batch = String(a.batch)
  fs.mkdirSync(dir, { recursive: true })
  if (cmd === 'jobs') {
    const ids = a.ids && a.ids !== true ? String(a.ids).split(',') : null
    const lines = cueLines()
    const takes = readLedger(P).takes
    const newest = new Map()
    for (const t of takes) newest.set(t.key, t)
    const jobs = []
    for (const t of newest.values()) {
      if (ids ? !ids.includes(t.key) : t.listener) continue
      if (a.kind && a.kind !== true && t.kind !== a.kind) continue
      const src = path.join(P.takes, t.key, t.file)
      const name = `sm-${t.key.replace(/[^a-z0-9]+/gi, '-')}-t${t.take}${path.extname(t.file)}`
      fs.copyFileSync(src, path.join(dir, name))
      const cue = t.kind === 'cue' ? (t.cue ?? t.key) : null
      jobs.push({ id: t.key, take: t.take, kind: t.kind, file: path.join(dir, name), prompt: t.kind === 'line' ? linePrompt() : cuePrompt(lines[cue] ?? cue), decides: t.kind === 'line' ? LINE_KEYS : CUE_KEYS.filter((k) => !(musical(cue) && (k === 'music' || k === 'melody'))) })
    }
    writeJson(path.join(dir, `${batch}.json`), jobs)
    console.log(`listen: ${jobs.length} jobs written to out/work/audio/listen/${batch}.json`)
  } else if (cmd === 'apply') {
    const jobs = readJson(path.join(dir, `${batch}.json`))
    const answers = readJson(path.join(dir, `${batch}-answers.json`))
    const file = path.join(P.audio, 'TAKES.json')
    const ledger = readLedger(P)
    for (const j of jobs) {
      const reports = answers[`${j.id}#${j.take}`] ?? []
      const s = settle(reports, j.kind)
      const take = ledger.takes.find((t) => t.key === j.id && t.take === j.take)
      if (!take) continue
      take.listener = s
      writeJson(path.join(P.takes, j.id, `take-${j.take}.listener.json`), { settled: s, reports })
      const short = j.kind === 'line' ? `"${s.transcript}" (${s.transcriptAgreed}) ${LINE_KEYS.map((k) => `${k}=${s[k]}`).join(' ')} ${JSON.stringify(s.attitudes)}` : `${CUE_KEYS.map((k) => `${k}=${s[k]}`).join(' ')} events ${s.events} | ${s.heard}`
      console.log(`${j.id} take ${j.take}: ${s.asks} asks, ${s.whole} whole. ${short}`)
    }
    writeJson(file, ledger)
  } else console.log('say jobs or apply')
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(at('tools', 'lib', 'sound-listen.mjs'))) main()
