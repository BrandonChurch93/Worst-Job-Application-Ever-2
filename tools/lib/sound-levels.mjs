// npm run sound -- --levels: the voice against the bed, by number, at the busiest moment of four pages.
// The keen bot plays the whole live site through the stage. Every event of that visit is then sent, at its own time, to the site's own engine in a browser
// whose sound graph is rendered offline, with the voice, the bed (effects and room tone) and the output on tracks of their own.
// The first render has no line in it and gives the bed as it is. The second sets off one line of the film on each page, by its own trigger at the
// occurrence where the bed under it is loudest, and gives the loudness of the voice against the ducked bed over the span of the line.
import fs from 'node:fs'
import path from 'node:path'
import { at, readJson, writeJson } from './paths.mjs'

export const MOMENTS = [
  { name: 'step 1 under fire', page: 'step1', line: 'line.step1.email.0', event: 'slab-drop' },
  { name: 'step 1, the tug at the shredder', page: 'step1', line: 'line.step1.tug.0', event: 'arms-out' },
  { name: 'the slot machine paying out', page: 'step2', line: 'line.step2.dial.0', gag: 'step2.dial', at: 'coins' },
  { name: 'the bumpers', page: 'step3', line: 'line.pinball.coffee.0', event: 'bumper' },
  { name: "the boss's hit", page: 'step4', line: 'line.boss.slabs.0', event: 'slab-fire' }
]

const PRE = 0.5

const html = `<!doctype html><meta charset="utf-8"><title>levels</title><body><script type="module">
const dsp = await import('./dsp.js')
const { makeSound } = await import('./engine.js')
window.render = async (index, calls, seconds, spans, windowSeconds) => {
  const rate = index.sampleRate
  const quantum = 128
  const ctx = new OfflineAudioContext({ numberOfChannels: 6, length: Math.ceil(seconds * rate), sampleRate: rate })
  const gains = []
  const createGain = ctx.createGain.bind(ctx)
  ctx.createGain = () => { const g = createGain(); gains.push(g); return g }
  const merger = ctx.createChannelMerger(6)
  const connect = AudioNode.prototype.connect
  AudioNode.prototype.connect = function (to, ...rest) { return to === ctx.destination && this !== merger ? to : connect.call(this, to, ...rest) }
  merger.connect(ctx.destination)
  const resume = ctx.resume.bind(ctx)
  const suspend = ctx.suspend.bind(ctx)
  ctx.resume = () => Promise.resolve()
  ctx.suspend = () => Promise.resolve()
  ctx.close = () => Promise.resolve()
  window.AudioContext = function () { return ctx }
  const sound = makeSound({ base: './audio/', index })
  const unlocked = sound.unlock()
  ctx.createGain = createGain
  const [out, fx, voice, tone] = gains
  const track = (nodes, first) => {
    const sum = createGain()
    sum.channelCount = 2
    sum.channelCountMode = 'explicit'
    sum.channelInterpretation = 'speakers'
    for (const n of nodes) connect.call(n, sum)
    const split = ctx.createChannelSplitter(2)
    connect.call(sum, split)
    connect.call(split, merger, 0, first)
    connect.call(split, merger, 1, first + 1)
  }
  track([voice], 0)
  track([fx, tone], 2)
  track([out], 4)
  await unlocked
  const byQuantum = new Map()
  for (const c of calls) {
    const q = Math.ceil((c.at * rate) / quantum)
    if (!byQuantum.has(q)) byQuantum.set(q, [])
    byQuantum.get(q).push(c)
  }
  for (const [q, list] of byQuantum) {
    void suspend((q * quantum) / rate).then(() => {
      for (const c of list) {
        if (c.event) sound.event(c.event, c.live ? 'live' : 'film')
        else if (c.gag) sound.beat(c.gag, 'live')
        else if (c.volume !== undefined) sound.setVolume(c.volume)
      }
      void resume()
    })
  }
  const buffer = await ctx.startRendering()
  const ch = Array.from({ length: 6 }, (_, i) => buffer.getChannelData(i))
  const cut = (first, from, to) => ({ sampleRate: rate, channels: [ch[first], ch[first + 1]].map((c) => c.subarray(Math.max(0, Math.round(from * rate)), Math.min(c.length, Math.round(to * rate)))) })
  const lufs = (first, from, to) => { const v = dsp.loudness(cut(first, from, to)); return Number.isFinite(v) ? Number(v.toFixed(2)) : null }
  const loudest = (first, from, to, block, hop) => {
    let best = null
    for (let t = from; t + block <= to + 1e-9; t += hop) {
      const v = lufs(first, t, t + block)
      if (v !== null && (best === null || v > best.lufs)) best = { at: Number(t.toFixed(2)), lufs: v }
    }
    return best
  }
  const peakDb = (first, from, to) => { const v = dsp.truePeakDb(cut(first, from, to)); return Number.isFinite(v) ? Number(v.toFixed(2)) : null }
  return {
    state: sound.state(), backend: sound.backend(), seconds: buffer.duration, log: sound.log(),
    whole: { lufs: lufs(4, 0, seconds), truePeakDb: peakDb(4, 0, seconds) },
    spans: spans.map((s) => ({
      ...s,
      voice: lufs(0, s.from, s.to), voiceTruePeakDb: peakDb(0, s.from, s.to), bed: lufs(2, s.from, s.to), output: lufs(4, s.from, s.to), outputTruePeakDb: peakDb(4, s.from, s.to),
      bedLoudestMoment: loudest(2, s.from, s.to, 0.4, 0.1), voiceLoudestMoment: loudest(0, s.from, s.to, 0.4, 0.1),
      bedLoudestWindow: windowSeconds && s.to - s.from > windowSeconds ? loudest(2, s.from, s.to, windowSeconds, 0.25) : null
    }))
  }
}
window.ready = true
</script>`

export async function levelsRun(load, c, pub) {
  const { build } = await import('vite')
  const { serve } = await import('./serve.mjs')
  const { launch } = await import('./browser.mjs')
  const { visit } = await import('./sound-visit.mjs')
  const index = readJson(path.join(pub, 'index.json'))
  const lengthOf = (id) => index.lines.find((l) => l.id === id)?.seconds ?? 0
  const calls = []
  const v = await visit(load, c, 'keen', c.seed, calls)
  const shifted = calls.map((x) => ({ ...x, at: x.at + PRE }))
  const seconds = v.seconds + PRE + 1
  const turn = (page) => v.turns.find((t) => t.page === page)?.at ?? 0
  const pageEnd = (page) => { const i = v.turns.findIndex((t) => t.page === page); return v.turns[i + 1]?.at ?? v.seconds }
  const dir = at('out', 'work', 'audio', 'levels')
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  for (const [entry, name] of [['index.ts', 'engine.js'], ['dsp.ts', 'dsp.js']]) await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: at('src', 'audio', entry), formats: ['es'], fileName: () => name } } })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  const site = await serve(dir, { mounts: { '/audio/': pub } })
  const { browser, version } = await launch()
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e.message)))
    page.on('console', (m) => { if (m.type() === 'error' && !String(m.location().url).endsWith('/favicon.ico')) errors.push(m.text()) })
    await page.goto(`${site.url}/index.html`)
    await page.waitForFunction('window.ready === true')
    const render = (list, spans, windowSeconds) => page.evaluate(([i, l, s, sp, w]) => window.render(i, l, s, sp, w), [index, list, seconds, spans, windowSeconds])
    // First render: no line. Every occurrence of each moment's trigger, and each page whole.
    const tries = []
    for (const m of MOMENTS) {
      const name = m.event ?? m.at
      for (const x of shifted) if (x.event && x.event.name === name && x.event.page === m.page) tries.push({ moment: m.name, line: m.line, at: x.at, from: x.at, to: x.at + lengthOf(m.line) })
    }
    const pages = MOMENTS.map((m) => ({ page: m.page, from: turn(m.page) + PRE, to: pageEnd(m.page) + PRE }))
    const bare = await render(shifted.filter((x) => !x.gag), [...tries, ...pages], 3)
    await page.reload()
    await page.waitForFunction('window.ready === true')
    const chosen = MOMENTS.map((m) => {
      const mine = bare.spans.filter((s) => s.moment === m.name && s.bed !== null)
      if (!mine.length) throw new Error(`levels: the keen visit has no ${m.event ?? m.at} on ${m.page}`)
      return { m, pick: mine.reduce((a, b) => (b.bed > a.bed ? b : a)), tried: mine.length }
    })
    // Second render: the same visit, and on each page the one line, set off by its own trigger at the chosen occurrence.
    const spoken = shifted.filter((x) => !x.gag).map((x) => ({ ...x }))
    for (const { m, pick } of chosen) {
      if (m.gag) spoken.push({ at: pick.at, gag: m.gag })
      else spoken.find((x) => x.event && x.event.name === m.event && x.event.page === m.page && x.at === pick.at).live = true
    }
    spoken.sort((a, b) => a.at - b.at)
    const withLines = await render(spoken, chosen.map(({ m, pick }) => ({ moment: m.name, line: m.line, at: pick.at, from: pick.at, to: pick.to })), 0)
    const rows = chosen.map(({ m, pick, tried }, i) => {
      const s = withLines.spans[i]
      const said = withLines.log.find((e) => e.line === m.line && e.what === 'spoken')
      const whole = bare.spans.find((p) => p.page === m.page && p.moment === undefined)
      const busiest = whole?.bedLoudestWindow ?? null
      return {
        moment: m.name, page: m.page, line: m.line, trigger: m.event ? `event ${m.event}` : `gag ${m.gag}, placed at the event ${m.at}`, occurrences: tried,
        visitSeconds: Number((pick.at - PRE).toFixed(2)), lineSeconds: Number((pick.to - pick.from).toFixed(3)),
        spokenAt: said ? Number((said.start - PRE).toFixed(2)) : null,
        voiceLufs: s.voice, bedLufs: s.bed, marginDb: s.voice !== null && s.bed !== null ? Number((s.voice - s.bed).toFixed(2)) : null,
        bedWithoutLineLufs: pick.bed, duckDb: s.bed !== null ? Number((pick.bed - s.bed).toFixed(2)) : null,
        bedLoudestMomentLufs: s.bedLoudestMoment?.lufs ?? null, marginAtLoudestMomentDb: s.voice !== null && s.bedLoudestMoment ? Number((s.voice - s.bedLoudestMoment.lufs).toFixed(2)) : null,
        outputLufs: s.output, outputTruePeakDb: s.outputTruePeakDb, voiceTruePeakDb: s.voiceTruePeakDb,
        pageBusiest3s: busiest ? { visitSeconds: Number((busiest.at - PRE).toFixed(2)), lufs: busiest.lufs, underTheLine: busiest.at < pick.to && busiest.at + 3 > pick.from } : null
      }
    })
    const want = c.audio.duckDb
    const ceiling = c.audio.truePeakDb
    const record = {
      about: 'The keen visit, rendered offline through the engine of the site in a browser. Voice and bed are read before the master gain, in loudness units, over the span of the line.',
      browser: version, bot: 'keen', seed: c.seed, visitSeconds: v.seconds, events: shifted.filter((x) => x.event).length, backend: withLines.backend, errors,
      wantedMarginDb: want, rows, holds: rows.every((r) => r.marginDb !== null && r.marginDb >= want),
      filmCeilingDb: ceiling, overTheFilmCeiling: rows.filter((r) => r.outputTruePeakDb !== null && r.outputTruePeakDb > ceiling).map((r) => r.moment),
      wholeVisit: { withoutLines: bare.whole, withTheFourLines: withLines.whole },
      narratorLog: withLines.log
    }
    writeJson(at('out', 'work', 'audio', 'levels.json'), record)
    console.log(`levels: the keen visit, ${record.events} events over ${v.seconds} s, rendered offline through the site's engine in ${version}, backend ${record.backend}. Voice against bed over each line, wanted ${want} dB or more`)
    for (const r of rows) console.log(`levels: ${r.moment}: ${r.line} by ${r.trigger} at ${r.visitSeconds} s (loudest of ${r.occurrences}), spoken at ${r.spokenAt} s for ${r.lineSeconds} s. Voice ${r.voiceLufs} LUFS, bed ${r.bedLufs} LUFS, margin ${r.marginDb} dB. Bed with no line there ${r.bedWithoutLineLufs} LUFS, so the duck took ${r.duckDb} dB. Loudest 0.4 s of the bed ${r.bedLoudestMomentLufs} LUFS, margin there ${r.marginAtLoudestMomentDb} dB. Output ${r.outputLufs} LUFS, true peak ${r.outputTruePeakDb} dB; the voice alone peaks at ${r.voiceTruePeakDb} dB. The page's busiest 3 s: ${r.pageBusiest3s ? `at ${r.pageBusiest3s.visitSeconds} s, ${r.pageBusiest3s.lufs} LUFS, ${r.pageBusiest3s.underTheLine ? 'under the line' : 'not under the line'}` : 'unknown'}`)
    console.log(`levels: the whole visit at the output: ${bare.whole.lufs} LUFS and true peak ${bare.whole.truePeakDb} dB with no line, ${withLines.whole.lufs} LUFS and ${withLines.whole.truePeakDb} dB with the four. ${errors.length ? `Page errors: ${errors.join('; ')}` : 'No page error'}. Written to out/work/audio/levels.json`)
    return record
  } finally {
    await browser.close()
    await site.close()
  }
}
