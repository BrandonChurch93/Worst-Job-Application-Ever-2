import fs from 'node:fs'
import path from 'node:path'
import { at, readJson } from './paths.mjs'

const MARK = '## Every take'
const file = at('pipeline', 'sound', 'NOTES.md')
const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()
const kept = (id) => {
  const f = at('audio', 'kept', `${id}.json`)
  return fs.existsSync(f) ? readJson(f) : null
}

function lineRows(takes) {
  const out = ['| Line | Take | Call | Credits | Break N | Seconds | Words a second | Pauses found of marks (s) | Listener | Kept |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
  for (const t of takes) {
    const l = t.line ?? {}
    const s = t.listener
    const heard = !s ? 'not asked' : `${s.asks} asks, ${s.whole} whole; transcript ${s.transcript ? `"${s.transcript}" (${s.transcriptAgreed})` : 'none'}; whisper ${s.whisperVotes}; laugh ${s.laughVotes}; warmth ${s.warmthVotes}; excitement ${s.excitementVotes}; unimpressed and smug ${s.unimpressedAndSmugVotes}; attitude ${(s.attitudes ?? []).join(' / ') || 'none'}`
    const k = t.kept ? kept(t.key) : null
    const how = !t.kept ? 'no' : k?.forced ? `yes, by force: ${k.why}. Forced over: ${(k.problems ?? []).join('; ')}` : 'yes'
    out.push(`| \`${t.key}\` | ${t.take} | ${t.settings?.call ?? ''} | ${t.cost ?? ''} | ${t.settings?.breakSeconds ?? 'none'} | ${l.seconds ?? ''} | ${l.wordsPerSecond ?? ''} | ${l.pausesFound ?? ''} of ${l.pauseMarks ?? ''} (${(l.pauses ?? []).join(', ')}) | ${cell(heard)} | ${cell(how)} |`)
  }
  return out
}

function cueBlocks(takes) {
  const out = []
  const cues = [...new Set(takes.map((t) => t.cue))]
  for (const cue of cues) {
    const mine = takes.filter((t) => t.cue === cue)
    out.push(`### ${cue}`, '')
    const prompts = [...new Set(mine.map((t) => t.prompt))]
    prompts.forEach((p) => out.push(`Prompt of ${mine.filter((t) => t.prompt === p).map((t) => `${t.key} take ${t.take}`).join(', ')}:`, '', `> ${cell(p)}`, ''))
    out.push('| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const t of mine) {
      const s = t.listener
      const heard = !s ? 'not asked' : `${s.asks} asks, ${s.whole} whole; fits ${s.fitsVotes}; voice ${s.voiceVotes}; music ${s.musicVotes}; heard: ${s.heard ?? 'nothing'}`
      const k = t.kept ? kept(t.key) : null
      const how = !t.kept ? 'no' : k?.forced ? `yes, by force: ${k.why}. Forced over: ${(k.problems ?? []).join('; ')}` : 'yes'
      out.push(`| \`${t.key}\` | ${t.take} | ${t.settings?.call ?? ''} | ${t.cost ?? ''} | ${t.askedSeconds ?? ''} | ${t.settings?.loop ? 'yes' : 'no'} | ${t.measured?.peakDb ?? ''} | ${cell(heard)} | ${cell(how)} |`)
    }
    out.push('')
  }
  return out
}

function main() {
  const takes = readJson(at('audio', 'TAKES.json')).takes
  const film = takes.filter((t) => t.kind === 'line' && !t.key.startsWith('line.live.'))
  const live = takes.filter((t) => t.kind === 'line' && t.key.startsWith('line.live.'))
  const cues = takes.filter((t) => t.kind === 'cue')
  const body = [
    `${MARK}`,
    '',
    'This part is written by `node tools/lib/sound-notes.mjs` from `audio/TAKES.json` and `audio/kept/`. Do not edit it by hand: edit above it.',
    '',
    `${takes.length} takes: ${film.length} of the film's lines, ${live.length} of the lines only the live site has, ${cues.length} of effects.`,
    '',
    'A line is sent with every ` / ` of the script replaced by ` <break time="N.Ns" /> `, N being the number in the column Break N, the same at every mark of the line. Speed 0.7, stability 0.75, the default voice, no model named. The listener\'s words are STATED by the listener; every number is MEASURED by the chain.',
    '',
    '### The lines of the film',
    '',
    ...lineRows(film),
    '',
    '### The lines only the live site has',
    '',
    ...lineRows(live),
    '',
    '## Every effect: its prompt beside its takes',
    '',
    ...cueBlocks(cues)
  ].join('\n')
  const head = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Notes of the sound side\n\n'
  const cut = head.indexOf(`\n${MARK}`)
  const kept0 = (cut >= 0 ? head.slice(0, cut) : head).replace(/\s+$/, '')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${kept0}\n\n${body.replace(/\s+$/, '')}\n`)
  console.log(`notes: ${takes.length} takes written into pipeline/sound/NOTES.md`)
}

main()
