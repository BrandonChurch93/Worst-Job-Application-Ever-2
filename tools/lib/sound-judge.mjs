// Judges the newest take of every sound that has none kept, and keeps what holds.
//   node tools/lib/sound-judge.mjs [--do] [--kind line|cue] [--only ID,ID]
// A take holds when its numbers hold and two whole answers of the listener hold. It is kept as it is.
// A take whose numbers hold and that the listener could not be made to hear twice in its asks is kept with --force, and its record says so.
// A line that only fails by being too long for its place in the film is kept with --force too: the Builder is told its seconds.
// The Builder's ruling of 18:46Z: a line fails on tone only where two whole answers agree that it laughs, whispers or is excited.
// Everything else fails and waits for another take.
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { args, at, config } from './paths.mjs'
import { places, readLedger, listenerFindings, musical } from '../sound.mjs'

export const QUIET_PEAK_DB = -36

export function judge(take, c) {
  const fails = []
  const forced = []
  const l = take.listener
  const whole = l?.whole ?? 0
  const m = take.measured
  if (m.end <= m.start) fails.push('silent')
  if (m.truePeakDb > 0) forced.push(`clipped as delivered: true peak ${m.truePeakDb} dB`)
  if (take.kind === 'line') {
    const want = plain(take.text)
    if (!l || plain(l.transcript) !== want) fails.push(`transcript differs: "${l?.transcript ?? ''}"`)
    else if (String(l.transcript).toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean).join(' ') !== String(take.text).toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean).join(' ')) forced.push(`the listener wrote "${l.transcript}": the same words in another spelling`)
    if (!take.line.paceHolds) fails.push(`pace ${take.line.wordsPerSecond} words a second`)
    if (!take.line.pausesHold) fails.push(`${take.line.pausesFound} pauses for ${take.line.pauseMarks} marks`)
    if (!take.line.fits) forced.push(`too long for its place: ${take.line.seconds} s in ${take.line.room} s, over by ${(take.line.seconds - take.line.room).toFixed(3)} s`)
    if (whole >= 2) {
      for (const k of ['whisper', 'laugh', 'excitement']) if (l[k] === true) fails.push(`listener heard ${k} (${l[`${k}Votes`]})`)
      if (l.warmth === true) forced.push(`listener heard warmth (${l.warmthVotes})`)
      if (l.unimpressedAndSmug === false) forced.push(`listener: not unimpressed and a little smug (${l.unimpressedAndSmugVotes}; ${JSON.stringify(l.attitudes)}). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence`)
    } else forced.push(`tone not judged: ${whole} whole answers in ${l?.asks ?? 0} asks`)
  } else {
    const cue = take.cue ?? take.key
    if (whole >= 2) {
      for (const k of ['voice', 'word', 'music', 'melody']) if (l[k] === true && !(musical(cue) && (k === 'music' || k === 'melody'))) fails.push(`listener heard ${k} (${l[`${k}Votes`]})`)
      if (l.fits === false) fails.push(`listener: does not fit (${l.fitsVotes}): ${l.heard}`)
    } else if (m.peakDb < QUIET_PEAK_DB) fails.push(`peak ${m.peakDb} dB as delivered and the listener heard nothing in it raised by ${l?.heardRaisedByDb ?? 0} dB: ${whole} whole answers in ${l?.asks ?? 0} asks`)
    else forced.push(`not judged by ear: ${whole} whole answers in ${l?.asks ?? 0} asks`)
  }
  return { verdict: fails.length ? 'fail' : forced.length ? 'force' : 'keep', fails, forced }
}

// One word, two spellings: the listener writes the American one.
export const SAME_WORD = { defense: 'defence' }
const plain = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => SAME_WORD[w] ?? w).join(' ')

export const cliOf = (take) => {
  if (take.kind === 'line') {
    const rest = take.key.slice('line.'.length)
    const i = rest.lastIndexOf('.')
    return ['--line', `${rest.slice(0, i)}:${rest.slice(i + 1)}`]
  }
  if (take.cue && take.cue !== take.key) return ['--cue', take.cue, '--variant', String(Number(take.key.slice(take.cue.length + 1)))]
  return ['--cue', take.key]
}

function main() {
  const a = args()
  const c = config()
  const P = places()
  const only = a.only && a.only !== true ? String(a.only).split(',') : null
  const ledger = readLedger(P)
  const newest = new Map()
  const kept = new Set()
  for (const t of ledger.takes) {
    newest.set(t.key, t)
    if (t.kept) kept.add(t.key)
  }
  const count = { keep: 0, force: 0, fail: 0 }
  for (const t of newest.values()) {
    if (kept.has(t.key) || !t.listener) continue
    if (a.kind && a.kind !== true && t.kind !== a.kind) continue
    if (only && !only.includes(t.key)) continue
    const j = judge(t, c)
    count[j.verdict]++
    console.log(`${j.verdict.toUpperCase()}\t${t.key} take ${t.take}\t${[...j.fails, ...j.forced].join('; ')}`)
    if (!a.do || j.verdict === 'fail') continue
    const cmd = [at('tools', 'sound.mjs'), ...cliOf(t), '--take', String(t.take), '--keep']
    if (j.verdict === 'force') cmd.push('--force', '--why', j.forced.join('; '))
    const r = spawnSync('node', cmd, { encoding: 'utf8' })
    const out = `${r.stdout}${r.stderr}`.trim().split('\n')
    console.log(`  ${out[0]}${r.status === 0 ? '' : ` (exit ${r.status}) ${out.slice(1, 4).join(' | ')}`}`)
  }
  console.log(`judge: ${count.keep} hold, ${count.force} kept with a flag, ${count.fail} fail`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(at('tools', 'lib', 'sound-judge.mjs'))) main()
