// npm run sound -- --loops: the seam of every loop the site ships, by number, and the cut of the hold music.
// The seam is the step from the last sample to the first, set against the largest step the loop takes anywhere in itself:
// at or under 0 dB the seam is no larger than a step the loop already holds, so it cannot be heard as a click.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { at, readJson, writeJson } from './paths.mjs'

const dbOf = (v) => (v > 0 ? Number((20 * Math.log10(v)).toFixed(2)) : null)

export function seamOf(channels) {
  let largest = 0
  let largestAt = 0
  let seam = 0
  let sum = 0
  let count = 0
  let peak = 0
  for (const x of channels) {
    const n = x.length
    for (let i = 1; i < n; i++) {
      const d = Math.abs(x[i] - x[i - 1])
      sum += d * d
      count++
      if (d > largest) {
        largest = d
        largestAt = i
      }
      if (Math.abs(x[i]) > peak) peak = Math.abs(x[i])
    }
    seam = Math.max(seam, Math.abs(x[0] - x[n - 1]))
  }
  const usual = count ? Math.sqrt(sum / count) : 0
  return { samples: channels[0]?.length ?? 0, seamStep: seam, largestStep: largest, largestStepAt: largestAt, usualStep: usual, peak, seamToLargestDb: dbOf(seam / (largest || 1)), seamToUsualDb: dbOf(seam / (usual || 1)) }
}

export function loopsRun(pub, c, decodeFile, levels) {
  const index = readJson(path.join(pub, 'index.json'))
  const rows = []
  for (const l of index.loops) {
    const file = path.join(pub, l.file)
    if (!fs.existsSync(file)) {
      rows.push({ id: l.id, missing: true })
      continue
    }
    const s = decodeFile(file, c.audio.sampleRate)
    rows.push({ id: l.id, seconds: l.seconds, channels: s.channels.length, ...seamOf(s.channels) })
  }
  const hold = index.sfx.find((s) => s.id === 'hold-music')
  let cut = null
  const pack = index.pack ? path.join(pub, index.pack.file) : null
  if (hold && pack && fs.existsSync(pack)) {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hold-')), 'hold-music.flac')
    const bytes = fs.readFileSync(pack)
    fs.writeFileSync(tmp, bytes.subarray(hold.at, hold.at + hold.bytes))
    const s = decodeFile(tmp, c.audio.sampleRate)
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true })
    const k = Math.round(c.audio.holdMusicSeconds * c.audio.sampleRate)
    const m = seamOf(s.channels)
    const step = Math.max(...s.channels.map((x) => Math.abs(x[Math.min(k, x.length) - 1] ?? 0)))
    cut = { id: 'hold-music', seconds: hold.seconds, cutAtSeconds: c.audio.holdMusicSeconds, samples: m.samples, stepAtTheCut: step, largestStep: m.largestStep, peak: m.peak, cutToLargestDb: dbOf(step / (m.largestStep || 1)) }
  }
  const out = { sampleRate: c.audio.sampleRate, loopFadeSeconds: levels.LIVE.loopFadeSeconds, toneFadeInSeconds: levels.LIVE.toneFadeInSeconds, loopMaxSeconds: levels.LIVE.loopMaxSeconds, loops: rows, holdMusic: cut }
  writeJson(at('out', 'work', 'audio', 'loops.json'), out)
  const f = (v) => v.toFixed(6)
  console.log('| loop | seconds | samples | step at the seam | largest step inside | seam against largest | seam against usual step |')
  console.log('| --- | --- | --- | --- | --- | --- | --- |')
  for (const r of rows) console.log(r.missing ? `| ${r.id} | file missing | | | | | |` : `| ${r.id} | ${r.seconds} | ${r.samples} | ${f(r.seamStep)} | ${f(r.largestStep)} | ${r.seamToLargestDb ?? 'no step'} dB | ${r.seamToUsualDb ?? 'no step'} dB |`)
  if (cut) console.log(`hold-music: ${cut.seconds} s long, cut at ${cut.cutAtSeconds} s with no fade: the step down to nothing there is ${f(cut.stepAtTheCut)}, its largest step inside is ${f(cut.largestStep)}, so the cut is ${cut.cutToLargestDb ?? 'no step'} dB against it`)
  else console.log('hold-music: not in the pack of this root')
  console.log('Written to out/work/audio/loops.json')
  return out
}
