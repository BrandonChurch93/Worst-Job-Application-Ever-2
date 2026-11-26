// The peak of a narrator line, held in the chain: after the gain to the line's level, a line whose true peak is over
// audio.truePeakDb goes through a look-ahead limiter at that bound and is measured again.
// npm run sound -- --rekeep-peaks does it for every kept line from its take. It calls no sound service.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readJson, writeJson } from './paths.mjs'

export const PEAK = { attackMs: 5, releaseMs: 50, stepDb: 0.02, rounds: 12, floorDb: -20 }

const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const round2 = (v) => Number(v.toFixed(2))
const lin = (dbv) => Math.pow(10, dbv / 20)

function ffmpeg(samples, sampleRate, argv) {
  const input = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-f', 'f32le', '-ar', String(sampleRate), '-ac', '1', '-i', '-', ...argv], { input, maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').toString().trim().split('\n').slice(-3).join(' ')}`)
  return r
}

// The true peak as ffmpeg measures it, in dB, to two places.
export function ffmpegTruePeakDb(samples, sampleRate) {
  const r = ffmpeg(samples, sampleRate, ['-af', 'loudnorm=print_format=json', '-f', 'null', '-'])
  const found = /"input_tp"\s*:\s*"([^"]+)"/.exec(r.stderr.toString())
  if (!found) throw new Error('ffmpeg gave no true peak')
  return found[1] === '-inf' ? -Infinity : Number(found[1])
}

function limited(samples, sampleRate, limitDb) {
  const pad = Math.round(((PEAK.attackMs * 4) / 1000) * sampleRate)
  const padded = new Float32Array(samples.length + pad)
  padded.set(samples)
  const filter = `alimiter=level_in=1:level_out=1:limit=${lin(limitDb).toFixed(6)}:attack=${PEAK.attackMs}:release=${PEAK.releaseMs}:asc=0:level=0`
  const raw = ffmpeg(padded, sampleRate, ['-af', filter, '-f', 'f32le', '-ac', '1', '-ar', String(sampleRate), '-']).stdout
  const out = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + Math.floor(raw.byteLength / 4) * 4))
  const span = Math.min(samples.length, out.length - pad, sampleRate * 2)
  let delay = 0
  let least = Infinity
  for (let d = 0; d <= pad && span > 0; d++) {
    let err = 0
    for (let i = 0; i < span && err < least; i++) err += Math.abs(out[i + d] - samples[i])
    if (err < least) {
      least = err
      delay = d
    }
  }
  const held = new Float32Array(samples.length)
  for (let i = 0; i < held.length; i++) held[i] = out[i + delay] ?? 0
  return held
}

// Holds the true peak of a levelled line at the bound. Under the bound the sound comes back as it went in, with no record.
export function holdPeak(sound, boundDb, dsp) {
  const before = { truePeakDb: Math.max(dsp.truePeakDb(sound), ffmpegTruePeakDb(sound.channels[0], sound.sampleRate)), lufs: dsp.loudness(sound) }
  if (sound.channels.length !== 1 || !(before.truePeakDb > boundDb)) return { sound, record: null, before, after: before }
  const x = sound.channels[0]
  let limitDb = boundDb
  for (let n = 1; n <= PEAK.rounds; n++) {
    const y = limited(x, sound.sampleRate, limitDb)
    const made = { sampleRate: sound.sampleRate, channels: [y] }
    const now = Math.max(dsp.truePeakDb(made), ffmpegTruePeakDb(y, sound.sampleRate))
    if (now <= boundDb) {
      let reduction = 0
      const floor = lin(PEAK.floorDb)
      for (let i = 0; i < x.length; i++) {
        const a = Math.abs(x[i])
        const b = Math.abs(y[i])
        if (a >= floor && b > 0 && a / b > reduction) reduction = a / b
      }
      const after = { truePeakDb: now, lufs: dsp.loudness(made) }
      return {
        sound: made, before, after,
        record: {
          by: 'ffmpeg alimiter, no make-up gain, its own level control off', boundDb, limitDb: round2(limitDb), attackMs: PEAK.attackMs, releaseMs: PEAK.releaseMs, rounds: n,
          truePeakBeforeDb: round2(before.truePeakDb), truePeakAfterDb: round2(now), reductionDb: round2(reduction > 0 ? 20 * Math.log10(reduction) : 0), lufsBefore: round2(before.lufs), lufsAfter: round2(after.lufs)
        }
      }
    }
    limitDb -= Math.max(now - boundDb + PEAK.stepDb, PEAK.stepDb * n * n)
  }
  throw new Error(`the limiter did not hold ${boundDb} dB in ${PEAK.rounds} rounds`)
}

// One kept line from its take again: the sound, its bytes and its record, as the chain makes them now.
export function lineAgain(record, P, c, M, decodeFile) {
  const file = path.join(P.takes, record.id, record.take.file)
  if (!fs.existsSync(file)) throw new Error(`${record.id}: the take file is missing: ${file}`)
  const found = sha(fs.readFileSync(file))
  if (found !== record.take.sha256) throw new Error(`${record.id}: the take file ${file} has sha256 ${found} and the record says ${record.take.sha256}`)
  const out = M.dsp.chain(decodeFile(file, c.audio.sampleRate), { seconds: 600, cls: 'voice', loop: false })
  const held = holdPeak(out.sound, c.audio.truePeakDb, M.dsp)
  const bytes = M.dsp.encodeWav(held.sound, 24)
  return { ...held, chain: held.record ? { ...out.record, peak: held.record } : out.record, bytes, sha256: sha(bytes) }
}

const show = (v) => (Number.isFinite(v) ? v.toFixed(2) : 'silent')

export function rekeepPeaks(a, P, c, M, decodeFile) {
  const write = Boolean(a.write)
  const when = a.when && a.when !== true ? String(a.when) : new Date().toISOString()
  const records = fs.readdirSync(P.kept).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(path.join(P.kept, f))).filter((r) => r.kind === 'line' || r.kind === 'live-line')
  const rows = records.map((r) => ({ r, made: lineAgain(r, P, c, M, decodeFile) }))
  let again = 0
  let odd = 0
  console.log(`rekeep-peaks: ${rows.length} kept lines, the bound is ${c.audio.truePeakDb} dB true peak, the level is ${M.levels.CLASS_LEVEL.voice.db} LUFS. ${write ? 'Writing.' : 'Nothing is written: this is the dry run. Add --write to keep them.'}`)
  for (const { r, made } of rows) {
    const same = made.sha256 === r.sha256
    const keep = !same && Boolean(made.record)
    if (keep) again++
    if (!same && !keep) odd++
    const fall = made.record ? `, ${show(M.levels.CLASS_LEVEL.voice.db - made.after.lufs)} under its level, ${made.record.reductionDb} dB off at the worst moment, limiter at ${made.record.limitDb} dB` : ''
    const state = keep ? 'kept again' : same ? 'unchanged' : 'NOT THE SAME BYTES as the kept file though no peak is held (the take, ffmpeg or the chain is not what it was). Left as it is: unchanged'
    console.log(`  ${r.id.padEnd(34)} true peak ${show(made.before.truePeakDb).padStart(6)} -> ${show(made.after.truePeakDb).padStart(6)} dB, loudness ${show(made.before.lufs)} -> ${show(made.after.lufs)} LUFS${fall}: ${state}`)
    if (!write || !keep) continue
    fs.writeFileSync(path.join(P.kept, `${r.id}.wav`), made.bytes)
    writeJson(path.join(P.kept, `${r.id}.json`), {
      ...r, chain: made.chain, measured: M.dsp.measure(made.sound), seconds: Number((made.sound.channels[0].length / made.sound.sampleRate).toFixed(4)), sha256: made.sha256,
      rekept: { when, why: `its levelled true peak was ${made.record.truePeakBeforeDb} dB, over the bound of ${c.audio.truePeakDb} dB: the same take went through the chain again with the peak held`, was: { sha256: r.sha256, truePeakDb: r.measured.truePeakDb, lufs: r.measured.lufs } }
    })
  }
  console.log(`rekeep-peaks: ${again} ${write ? 'kept again' : 'to keep again'}, ${rows.length - again} unchanged${odd ? `, of which ${odd} that the chain no longer makes byte for byte` : ''}.${write && again ? ' Run npm run sound -- --pack next: the packed lines are made from the kept files.' : ''}`)
  if (odd) process.exitCode = 1
  return { lines: rows.length, again, odd }
}
