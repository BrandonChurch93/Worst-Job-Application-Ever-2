// node pipeline/change002/shell-hum.mjs: what the site plays on the careers page after a restart, before the mend and after it, by number and in pictures.
// The keen bot plays the whole live site three times over. Every event of those visits is sent, at its own time, to the site's own engine in a browser whose
// sound graph is rendered offline. After each visit the page on screen is the careers page again, and nothing is sent for REST seconds: that is the restart.
// The engine before the mend is built from the commit the unit started on, in a checkout of its own beside the system's temporary files.
// It also runs the room tone file through the switch TONE.dehum and writes its spectrum before and after, and a clip of each.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from '../../tools/lib/paths.mjs'

const a = args()
const BEFORE = typeof a.before === 'string' ? a.before : 'fee1d033'
const REST = 20
const PRE = 0.5
const ROUNDS = 3
const WINDOW = 10
const SKIP = 1
const N = 65536
const out = at('pipeline', 'change002')
const pictures = path.join(out, 'shell-pictures')
const clips = path.join(out, 'shell-clips')

const html = `<!doctype html><meta charset="utf-8"><title>hum</title><body><script type="module">
window.render = async (engine, index, calls, seconds) => {
  const { makeSound } = await import(engine)
  const rate = index.sampleRate
  const quantum = 128
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: Math.ceil(seconds * rate), sampleRate: rate })
  const resume = ctx.resume.bind(ctx)
  const suspend = ctx.suspend.bind(ctx)
  ctx.resume = () => Promise.resolve()
  ctx.suspend = () => Promise.resolve()
  ctx.close = () => Promise.resolve()
  window.AudioContext = function () { return ctx }
  const sound = makeSound({ base: './audio/', index })
  if (sound.page) sound.page('marketing')
  await sound.unlock()
  const byQuantum = new Map()
  for (const c of calls) {
    const q = Math.ceil((c.at * rate) / quantum)
    if (!byQuantum.has(q)) byQuantum.set(q, [])
    byQuantum.get(q).push(c)
  }
  for (const [q, list] of byQuantum) {
    void suspend((q * quantum) / rate).then(() => {
      for (const c of list) {
        if (c.event) sound.event(c.event, 'live')
        else if (c.gag) sound.beat(c.gag, 'live')
        else if (c.volume !== undefined) sound.setVolume(c.volume)
        else if (c.quiet !== undefined) sound.quiet(c.quiet)
        else if (c.page && sound.page) sound.page(c.page)
        else if (c.restart) {
          sound.stop()
          if (sound.page) sound.page('marketing')
          sound.start()
        }
      }
      void resume()
    })
  }
  const buffer = await ctx.startRendering()
  window.kept = { rate, left: buffer.getChannelData(0), right: buffer.getChannelData(1) }
  return { state: sound.state(), backend: sound.backend(), seconds: buffer.duration, log: sound.log() }
}
window.take = (from, frames) => {
  const k = window.kept
  const n = Math.max(0, Math.min(frames, k.left.length - from))
  const both = new Float32Array(n * 2)
  for (let i = 0; i < n; i += 1) {
    both[i * 2] = k.left[from + i]
    both[i * 2 + 1] = k.right[from + i]
  }
  const bytes = new Uint8Array(both.buffer)
  let text = ''
  for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768))
  return btoa(text)
}
window.ready = true
</script>`

function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k)
        const wi = Math.sin(ang * k)
        const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi
        const xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr
        re[i + k + len / 2] = re[i + k] - xr
        im[i + k + len / 2] = im[i + k] - xi
        re[i + k] += xr
        im[i + k] += xi
      }
    }
  }
}

// The level of each frequency as the level a steady tone there would have, in dB below full scale: the mean of windowed spectra half a window apart.
function spectrum(x, rate) {
  const w = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N))
  const sum = w.reduce((p, v) => p + v, 0)
  const power = new Float64Array(N / 2)
  let count = 0
  for (let from = 0; from + N <= x.length; from += N / 2) {
    const re = Float64Array.from({ length: N }, (_, i) => x[from + i] * w[i])
    const im = new Float64Array(N)
    fft(re, im)
    for (let k = 0; k < N / 2; k++) power[k] += ((2 / sum) ** 2) * (re[k] * re[k] + im[k] * im[k])
    count++
  }
  return { hz: rate / N, db: Array.from(power, (p) => (count && p > 0 ? 10 * Math.log10(p / count) : -200)) }
}
const dbOf = (v) => (v > 0 ? Number((20 * Math.log10(v)).toFixed(1)) : null)
const rms = (x) => Math.sqrt(x.reduce((p, v) => p + v * v, 0) / Math.max(1, x.length))
const peak = (x) => x.reduce((p, v) => Math.max(p, Math.abs(v)), 0)
const median = (list) => list.slice().sort((p, q) => p - q)[Math.floor(list.length / 2)]
// The tones that stand out: bins more than 10 dB over the median of the 100 Hz around them, the tallest of each cluster.
function tones(s, from = 30, to = 10000) {
  const found = []
  const half = Math.round(50 / s.hz)
  for (let k = Math.ceil(from / s.hz); k < to / s.hz; k++) {
    const v = s.db[k]
    if (v <= s.db[k - 1] || v < s.db[k + 1]) continue
    const over = v - median(s.db.slice(Math.max(1, k - half), k + half))
    if (over > 10) found.push({ hz: Number((k * s.hz).toFixed(1)), db: Number(v.toFixed(1)), over: Number(over.toFixed(1)) })
  }
  return found
}
const at100 = (s) => {
  let best = -200
  for (let k = Math.floor(97 / s.hz); k <= Math.ceil(103 / s.hz); k++) best = Math.max(best, s.db[k])
  return Number(best.toFixed(1))
}
const band = (x, rate, lo, hi) => {
  const s = spectrum(x, rate)
  let p = 0
  for (let k = Math.ceil(lo / s.hz); k < hi / s.hz; k++) p += 10 ** (s.db[k] / 10)
  return p
}

function wav(file, channels, rate) {
  const n = channels[0].length
  const data = Buffer.alloc(n * channels.length * 2)
  for (let i = 0; i < n; i++) for (let c = 0; c < channels.length; c++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(channels[c][i] * 32767))), (i * channels.length + c) * 2)
  const head = Buffer.alloc(44)
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20)
  head.writeUInt16LE(channels.length, 22); head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * channels.length * 2, 28); head.writeUInt16LE(channels.length * 2, 32); head.writeUInt16LE(16, 34)
  head.write('data', 36); head.writeUInt32LE(data.length, 40)
  fs.writeFileSync(file, Buffer.concat([head, data]))
}
function flac(file, channels, rate) {
  const tmp = `${file}.wav`
  wav(tmp, channels, rate)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-c:a', 'flac', '-map_metadata', '-1', file])
  fs.rmSync(tmp)
}

// One picture: spectra on a log axis of frequency, and under them the waveforms.
function chart({ title, sub, series, waves, floor = -130, top = -40 }) {
  const subs = Array.isArray(sub) ? sub : [sub]
  const W = 1200
  const H = 760
  const L = 70
  const R = 20
  const T = 130
  const PH = 350
  const x = (hz) => L + ((Math.log10(hz) - Math.log10(20)) / (Math.log10(12000) - Math.log10(20))) * (W - L - R)
  const y = (db) => T + ((top - Math.max(floor, db)) / (top - floor)) * PH
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Inter, Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#f4f2ec"/>`
  s += `<text x="${L}" y="30" font-size="20" font-weight="600" fill="#262522">${title}</text>${subs.map((t, i) => `<text x="${L}" y="${50 + i * 18}" font-size="13" fill="#55524b">${t}</text>`).join('')}`
  for (let db = top; db >= floor; db -= 10) s += `<line x1="${L}" x2="${W - R}" y1="${y(db)}" y2="${y(db)}" stroke="#d9d5cb"/><text x="${L - 8}" y="${y(db) + 4}" font-size="12" text-anchor="end" fill="#55524b">${db}</text>`
  for (const hz of [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]) s += `<line x1="${x(hz)}" x2="${x(hz)}" y1="${T}" y2="${T + PH}" stroke="#d9d5cb"/><text x="${x(hz)}" y="${T + PH + 18}" font-size="12" text-anchor="middle" fill="#55524b">${hz >= 1000 ? `${hz / 1000} k` : hz}</text>`
  s += `<text x="${W - R}" y="${T + PH + 38}" font-size="12" text-anchor="end" fill="#55524b">Hz</text><text x="${L}" y="${T + PH + 38}" font-size="12" fill="#55524b">up the side: dB below full scale, as the level of a steady tone</text>`
  series.forEach((q, i) => {
    if (q.spec) {
      let d = ''
      for (let k = Math.ceil(20 / q.spec.hz); k < 12000 / q.spec.hz; k++) d += `${d ? 'L' : 'M'}${x(k * q.spec.hz).toFixed(1)},${y(q.spec.db[k]).toFixed(1)}`
      s += `<path d="${d}" fill="none" stroke="${q.color}" stroke-width="1"/>`
    }
    s += `<rect x="${L}" y="${T - 40 + i * 20}" width="18" height="4" fill="${q.color}"/><text x="${L + 26}" y="${T - 34 + i * 20}" font-size="13" fill="#262522">${q.label}</text>`
    for (const m of q.marks ?? []) s += `<circle cx="${x(m.hz)}" cy="${y(m.db)}" r="3.5" fill="none" stroke="#262522"/><text x="${x(m.hz) + (m.dx ?? 6)}" y="${y(m.db) + (m.dy ?? -6)}" font-size="12" text-anchor="${m.anchor ?? 'start'}" fill="#262522">${m.hz} Hz, ${m.db} dB</text>`
  })
  const WT = T + PH + 60
  const WH = (H - WT - 20) / waves.length
  waves.forEach((q, i) => {
    const mid = WT + WH * i + WH / 2
    const scale = (WH / 2 - 6) / q.full
    s += `<line x1="${L}" x2="${W - R}" y1="${mid}" y2="${mid}" stroke="#d9d5cb"/>`
    const cols = W - L - R
    const per = q.x.length / cols
    let d = ''
    for (let cx = 0; cx < cols; cx++) {
      let lo = 0
      let hi = 0
      for (let k = Math.floor(cx * per); k < Math.floor((cx + 1) * per); k++) {
        lo = Math.min(lo, q.x[k])
        hi = Math.max(hi, q.x[k])
      }
      d += `M${L + cx},${(mid - hi * scale).toFixed(1)}V${(mid - lo * scale + 0.6).toFixed(1)}`
    }
    s += `<path d="${d}" stroke="${q.color}" stroke-width="1" fill="none"/><text x="${L + 6}" y="${WT + WH * i + 14}" font-size="12" fill="#262522">${q.label}</text>`
  })
  return s + '</svg>'
}

const { build } = await import('vite')
const { serve } = await import('../../tools/lib/serve.mjs')
const { launch } = await import('../../tools/lib/browser.mjs')
const { visit } = await import('../../tools/lib/sound-visit.mjs')
const { logic } = await import('../../tools/lib/logic.mjs')
const c = config()
const pub = at('public', 'audio')
const index = readJson(path.join(pub, 'index.json'))
const { load, close } = await logic()
const record = { made: 'node pipeline/change002/shell-hum.mjs', before: BEFORE, restSeconds: REST, windowSeconds: WINDOW, fftSize: N }
fs.mkdirSync(pictures, { recursive: true })
fs.mkdirSync(clips, { recursive: true })

// The visits and the rests, as one list of calls.
const one = []
const v = await visit(load, c, 'keen', c.seed, one)
const round = v.seconds + REST
const calls = []
const returns = []
for (let r = 0; r < ROUNDS; r++) {
  const base = PRE + r * round
  if (r > 0) calls.push({ at: base - 0.02, restart: true })
  for (const x of one) calls.push({ ...x, at: x.at + base })
  const back = v.turns.filter((t) => t.page === 'marketing').pop().at + base
  returns.push(back)
  for (let t = 0; t < REST - 0.6; t += 0.5) calls.push({ at: back + t, page: 'marketing' })
}
calls.sort((p, q) => p.at - q.at)
const seconds = PRE + ROUNDS * round
record.visit = { bot: 'keen', seed: c.seed, seconds: v.seconds, rounds: ROUNDS, events: one.filter((x) => x.event).length, backOnCareersAt: returns.map((t) => Number(t.toFixed(2))) }

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-hum-'))
const old = path.join(work, 'before')
execFileSync('git', ['worktree', 'add', '--detach', old, BEFORE], { cwd: at(), stdio: 'ignore' })
fs.symlinkSync(at('node_modules'), path.join(old, 'node_modules'))
const dir = path.join(work, 'site')
fs.mkdirSync(dir, { recursive: true })
let browser = null
let site = null
try {
  for (const [name, from] of [['after', at()], ['before', old]]) await build({ root: from, configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: path.join(dir, name), emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: path.join(from, 'src', 'audio', 'index.ts'), formats: ['es'], fileName: () => 'engine.js' } } })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  site = await serve(dir, { mounts: { '/audio/': pub } })
  const launched = await launch()
  browser = launched.browser
  record.browser = launched.version
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message)))
  const heard = {}
  for (const name of ['before', 'after']) {
    await page.goto(`${site.url}/index.html`)
    await page.waitForFunction('window.ready === true')
    const r = await page.evaluate(([e, i, l, s]) => window.render(e, i, l, s), [`./${name}/engine.js`, index, calls, seconds])
    const rate = index.sampleRate
    const windows = []
    for (const back of returns) {
      const got = Buffer.from(await page.evaluate(([f, n]) => window.take(f, n), [Math.round((back + SKIP) * rate), WINDOW * rate]), 'base64')
      const both = new Float32Array(got.buffer, got.byteOffset, got.length / 4)
      const left = Float32Array.from({ length: both.length / 2 }, (_, i) => both[i * 2])
      const right = Float32Array.from({ length: both.length / 2 }, (_, i) => both[i * 2 + 1])
      windows.push({ left, right })
    }
    heard[name] = { r, windows, rate }
    record[name] = {
      backend: r.backend, state: r.state, renderedSeconds: r.seconds, linesSpoken: r.log.filter((e) => e.what === 'spoken').length,
      afterEachRestart: windows.map((w, i) => {
        const s = spectrum(w.left, rate)
        const t = tones(s)
        const loud = t.slice().sort((p, q) => q.db - p.db)
        return {
          restart: i + 1, fromSeconds: Number((returns[i] + SKIP).toFixed(2)), toSeconds: Number((returns[i] + SKIP + WINDOW).toFixed(2)),
          rmsDb: dbOf(Math.max(rms(w.left), rms(w.right))), peakDb: dbOf(Math.max(peak(w.left), peak(w.right))), samplesNotZero: w.left.reduce((p, x) => p + (x !== 0 ? 1 : 0), 0) + w.right.reduce((p, x) => p + (x !== 0 ? 1 : 0), 0),
          at100HzDb: rms(w.left) > 0 ? at100(s) : null, tonesOver10Db: t.length, loudestTones: loud.slice(0, 5), shareOfEnergy80To160Hz: rms(w.left) > 0 ? Number((band(w.left, rate, 80, 160) / band(w.left, rate, 20, 20000)).toFixed(3)) : null
        }
      })
    }
  }
  record.errors = errors

  // The picture of the restart: the first rest, before and after the mend.
  const b = heard.before.windows[0]
  const f = heard.after.windows[0]
  const bs = spectrum(b.left, heard.before.rate)
  const fsp = rms(f.left) > 0 ? spectrum(f.left, heard.after.rate) : null
  const rb = record.before.afterEachRestart
  const ra = record.after.afterEachRestart
  const marks = [{ hz: 100, db: rb[0].at100HzDb, anchor: 'end', dx: -8 }, ...rb[0].loudestTones.filter((t) => Math.abs(t.hz - 100) > 5).slice(0, 2).map((t) => ({ ...t, dy: -10 }))]
  const full = Math.max(peak(b.left), 1e-6)
  const svg = chart({
    title: 'The careers page after a restart: what the site plays, 1 s to 11 s after the page is back on screen',
    sub: [`The keen visit of ${v.seconds} s, three times over, rendered offline through the site's own engine in a browser (${record.browser}).`, `Before: the engine of commit ${BEFORE}. After: the engine of this build. Left channel, at the output of the engine.`],
    series: [
      { label: `before the mend, restart 1: rms ${rb[0].rmsDb} dB, peak ${rb[0].peakDb} dB, ${rb[0].tonesOver10Db} tones more than 10 dB over the noise beside them. Restarts 2 and 3: rms ${rb[1].rmsDb} and ${rb[2].rmsDb} dB`, color: '#d56125', spec: bs, marks },
      { label: `after the mend: ${ra.map((x) => (x.samplesNotZero === 0 ? 'every sample 0' : `rms ${x.rmsDb} dB`)).join(' / ')} after restarts 1 / 2 / 3`, color: '#2c5f8a', spec: fsp }
    ],
    waves: [{ label: `before, 10 s, full height ${dbOf(full)} dB`, color: '#d56125', x: b.left, full }, { label: `after, 10 s, same scale`, color: '#2c5f8a', x: f.left, full }]
  })
  await page.setViewportSize({ width: 1200, height: 760 })
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  await page.screenshot({ path: path.join(pictures, 'hum-after-restart-before-after.png') })
  flac(path.join(clips, 'careers-after-restart-before-mend-10s.flac'), [b.left, b.right], heard.before.rate)
  flac(path.join(clips, 'careers-after-restart-after-mend-10s.flac'), [f.left, f.right], heard.after.rate)

  // The room tone itself, with the switch off and on.
  const dsp = await load('/src/audio/dsp.ts')
  const { TONE } = await load('/src/audio/levels.ts')
  const tone = index.loops.find((l) => l.id === 'room-tone')
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(pub, tone.file), '-f', 'f32le', '-ac', '2', '-ar', String(index.sampleRate), '-'], { maxBuffer: 1 << 30 })
  const both = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4)
  const ch = [0, 1].map((k) => Float32Array.from({ length: both.length / 2 }, (_, i) => both[i * 2 + k]))
  const mended = ch.map((x) => dsp.dehum(x, index.sampleRate, TONE))
  const s0 = spectrum(ch[0], index.sampleRate)
  const s1 = spectrum(mended[0], index.sampleRate)
  const t0 = tones(s0)
  const t1 = tones(s1)
  const bands = [[20, 80], [80, 160], [160, 640], [640, 5000], [5000, 20000]].map(([lo, hi]) => ({ fromHz: lo, toHz: hi, changeDb: Number((10 * Math.log10(band(mended[0], index.sampleRate, lo, hi) / band(ch[0], index.sampleRate, lo, hi))).toFixed(2)) }))
  record.roomTone = {
    file: `public/audio/${tone.file}`, seconds: ch[0].length / index.sampleRate, switch: 'TONE.dehum in src/audio/levels.ts', settings: TONE,
    off: { rmsDb: dbOf(rms(ch[0])), peakDb: dbOf(peak(ch[0])), at100HzDb: at100(s0), tonesOver10Db: t0.length, loudestTones: t0.slice().sort((p, q) => q.db - p.db).slice(0, 5) },
    on: { rmsDb: dbOf(rms(mended[0])), peakDb: dbOf(peak(mended[0])), at100HzDb: at100(s1), tonesOver10Db: t1.length, loudestTones: t1.slice().sort((p, q) => q.db - p.db).slice(0, 5) },
    bands
  }
  const ten = index.sampleRate * WINDOW
  const fullTone = peak(ch[0])
  const svg2 = chart({
    title: 'The room tone under steps 1 to 5, with the switch TONE.dehum off and on',
    sub: [`${record.roomTone.file}, ${record.roomTone.seconds} s, left channel, at the level of the file.`, `Change of energy by band with the switch on: ${bands.map((q) => `${q.fromHz} to ${q.toHz} Hz ${q.changeDb} dB`).join(', ')}.`],
    series: [
      { label: `off, the file as it is: rms ${record.roomTone.off.rmsDb} dB, 100 Hz at ${record.roomTone.off.at100HzDb} dB, ${t0.length} tones more than 10 dB over the noise beside them`, color: '#d56125', spec: s0, marks: [{ hz: 100, db: record.roomTone.off.at100HzDb, anchor: 'end', dx: -8 }] },
      { label: `on: rms ${record.roomTone.on.rmsDb} dB, 100 Hz at ${record.roomTone.on.at100HzDb} dB, ${t1.length} such tones`, color: '#2c5f8a', spec: s1, marks: [{ hz: 100, db: record.roomTone.on.at100HzDb, anchor: 'end', dx: -8, dy: 16 }] }
    ],
    waves: [{ label: 'off, first 10 s', color: '#d56125', x: ch[0].subarray(0, ten), full: fullTone }, { label: 'on, first 10 s, same scale', color: '#2c5f8a', x: mended[0].subarray(0, ten), full: fullTone }],
    floor: -120, top: -50
  })
  await page.setContent(`<body style="margin:0">${svg2}</body>`)
  await page.screenshot({ path: path.join(pictures, 'room-tone-dehum-off-on.png') })
  flac(path.join(clips, 'room-tone-dehum-off-10s.flac'), ch.map((x) => x.subarray(0, ten)), index.sampleRate)
  flac(path.join(clips, 'room-tone-dehum-on-10s.flac'), mended.map((x) => x.subarray(0, ten)), index.sampleRate)
  writeJson(path.join(out, 'shell-hum.json'), record)
  const line = (name) => record[name].afterEachRestart.map((x) => `restart ${x.restart}: rms ${x.rmsDb} dB, peak ${x.peakDb} dB, 100 Hz ${x.at100HzDb} dB, ${x.tonesOver10Db} tones, ${x.samplesNotZero} samples not 0`).join('; ')
  console.log(`hum: before (${BEFORE}), the careers page after a restart, ${WINDOW} s: ${line('before')}`)
  console.log(`hum: after (this build): ${line('after')}`)
  console.log(`hum: room tone, switch off: rms ${record.roomTone.off.rmsDb} dB, 100 Hz ${record.roomTone.off.at100HzDb} dB, ${t0.length} tones. On: rms ${record.roomTone.on.rmsDb} dB, 100 Hz ${record.roomTone.on.at100HzDb} dB, ${t1.length} tones. Bands: ${bands.map((q) => `${q.fromHz}-${q.toHz} Hz ${q.changeDb} dB`).join(', ')}`)
  console.log(`hum: lines spoken in the three visits: before ${record.before.linesSpoken}, after ${record.after.linesSpoken}. Errors in the page: ${errors.length}`)
  console.log('hum: written pipeline/change002/shell-hum.json, shell-pictures/hum-after-restart-before-after.png, shell-pictures/room-tone-dehum-off-on.png and four clips in shell-clips/')
} finally {
  if (browser) await browser.close()
  if (site) await site.close()
  await close()
  execFileSync('git', ['worktree', 'remove', '--force', old], { cwd: at(), stdio: 'ignore' })
  fs.rmSync(work, { recursive: true, force: true })
}
