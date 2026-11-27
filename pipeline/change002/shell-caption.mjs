// node pipeline/change002/shell-caption.mjs: the caption against the voice, measured in a browser on the sound's own clock.
// Part 1, the live site as built, in real time, the keen bot playing it: every line that visit says, with pictures of the panel on its page.
// Part 2, every line of content/narration.json through the site's own engine in real time: its event is sent, and the caption and the voice are timed.
// The voice is timed where it is given to the browser (the start of its sound source and that plus the length of its sound); the caption is timed
// by a watcher of the page that reads the same clock when the panel comes on and goes. Neither number is taken from the caption's own log; that log is kept beside them.
// --site-only and --lines-only run one part.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from '../../tools/lib/paths.mjs'

const a = args()
const num = (v, d) => (typeof v === 'string' && Number.isFinite(Number(v)) ? Number(v) : d)
const VIEW = { width: num(a.wide, 1200), height: Math.round((num(a.wide, 1200) * 9) / 16) }
const SITE_SECONDS = num(a.seconds, 150)
const STEP = num(a.step, 0)
const QUALITY = typeof a.quality === 'string' ? a.quality : ''
const TAG = STEP || QUALITY || a.wide ? `site-step${STEP}${QUALITY ? `-${QUALITY}` : ''}-${VIEW.width}` : 'site'
const out = at('pipeline', 'change002')
const pictures = path.join(out, 'shell-pictures')
const shots = path.join(os.tmpdir(), 'shell-caption-shots')
fs.mkdirSync(pictures, { recursive: true })
fs.mkdirSync(shots, { recursive: true })

const watch = () => {
  window.__src = []
  window.__cap = []
  window.__frames = []
  window.__ctx = null
  const AC = window.AudioContext
  const Wrapped = function (...x) {
    const c = new AC(...x)
    window.__ctx = c
    return c
  }
  Wrapped.prototype = AC.prototype
  window.AudioContext = Wrapped
  const start = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, duration) {
    const now = this.context.currentTime
    window.__src.push({ when: Math.max(when, now), asked: now, seconds: duration ?? (this.buffer ? this.buffer.duration - offset : 0), loop: this.loop })
    return start.call(this, when, offset, duration)
  }
  let on = false
  let line = ''
  const look = () => {
    const el = document.querySelector('[data-narrator-caption]')
    if (!el || !window.__ctx) return
    const now = el.style.display !== 'none'
    const id = el.dataset.line || ''
    if (now === on && (!now || id === line)) return
    const t = window.__ctx.currentTime
    if (on) window.__cap.push({ t, on: false, line })
    if (now) {
      const b = el.getBoundingClientRect()
      window.__cap.push({ t, on: true, line: id, words: el.textContent, box: [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10), y: el.dataset.y })
    }
    on = now
    line = id
  }
  new MutationObserver(look).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'data-line'] })
  let before = 0
  const tick = (t) => {
    if (before) window.__frames.push(t - before)
    before = t
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const r3 = (x) => (x === null || x === undefined ? null : Math.round(x * 1000) / 1000)

// One row a line: the voice's start and end, the caption's start and end, and the two differences, all in seconds of the sound's clock.
function rows(cap, src, log) {
  const list = []
  let open = null
  for (const c of cap) {
    if (c.on) {
      open = { line: c.line, words: c.words, box: c.box, y: c.y, captionOn: c.t, captionOff: null }
      list.push(open)
    } else if (open && open.line === c.line) {
      open.captionOff = c.t
      open = null
    }
  }
  for (const row of list) {
    const voice = src.filter((s) => !s.loop && s.when <= row.captionOn + 0.002 && s.when + s.seconds > row.captionOn).sort((p, q) => Math.abs(p.seconds - (row.captionOff ?? row.captionOn) + row.captionOn) - Math.abs(q.seconds - (row.captionOff ?? row.captionOn) + row.captionOn))
    const own = log.find((l) => l.id === row.line && Math.abs(l.shown - row.captionOn) < 0.25)
    const v = own ? voice.find((s) => Math.abs(s.when - own.start) < 0.003) ?? null : voice[0] ?? null
    row.voiceStart = v ? v.when : null
    row.voiceEnd = v ? v.when + v.seconds : null
    row.onAfterVoiceStart = v ? row.captionOn - v.when : null
    row.offAfterVoiceEnd = v && row.captionOff !== null ? row.captionOff - (v.when + v.seconds) : null
    row.ownLog = own ? { start: own.start, end: own.end, shown: own.shown, hidden: own.hidden } : null
    for (const k of ['captionOn', 'captionOff', 'voiceStart', 'voiceEnd', 'onAfterVoiceStart', 'offAfterVoiceEnd']) row[k] = r3(row[k])
  }
  return list
}

const worst = (list, key) => list.reduce((m, r) => (r[key] === null ? m : Math.max(m, Math.abs(r[key]))), 0)
const frameOf = (f) => {
  const s = [...f].sort((p, q) => p - q)
  return s.length ? { frames: s.length, medianMs: r3(s[Math.floor(s.length / 2)]), p95Ms: r3(s[Math.floor(s.length * 0.95)]), longestMs: r3(s[s.length - 1]) } : null
}

const { serve } = await import('../../tools/lib/serve.mjs')
const { launch } = await import('../../tools/lib/browser.mjs')
const c = config()
const record = fs.existsSync(path.join(out, 'shell-caption.json')) ? readJson(path.join(out, 'shell-caption.json')) : {}
record.made = 'node pipeline/change002/shell-caption.mjs'
record.view = VIEW
record.clock = 'seconds of the AudioContext the site made. Voice: the start given to its sound source, and that plus the length of its sound. Caption: the clock read by a watcher of the page when the panel came on and went.'

const launched = await launch(['--autoplay-policy=no-user-gesture-required'])
const browser = launched.browser
record.browser = launched.version
let site = null
try {
  if (!a['lines-only']) {
    const { ensureBuild } = await import('../../tools/lib/capture.mjs')
    ensureBuild()
    site = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
    const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 })
    await context.addInitScript(watch)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e.message)))
    await page.goto(`${site.url}/index.html?mode=live&format=hd&assets=web&bot=keen&seed=${c.seed}${STEP ? `&step=${STEP}` : ''}${QUALITY ? `&quality=${QUALITY}` : ''}`)
    await page.evaluate(() => window.showcase.ready)
    await page.keyboard.press('Shift')
    const began = process.hrtime.bigint()
    const taken = new Set()
    let last = 0
    for (;;) {
      const seconds = Number(process.hrtime.bigint() - began) / 1e9
      const state = await page.evaluate(() => ({ n: window.__cap.length, last: window.__cap.at(-1) ?? null, t: window.__ctx ? window.__ctx.currentTime : null }))
      if (state.last && state.last.on && !taken.has(state.last.line)) {
        const file = path.join(shots, `${TAG}-${state.last.line}.png`)
        await page.screenshot({ path: file })
        const still = await page.evaluate(() => window.__cap.at(-1))
        if (still.on && still.line === state.last.line) taken.add(state.last.line)
        else fs.rmSync(file, { force: true })
      }
      if (state.n !== last) {
        last = state.n
        console.log(`caption: site ${seconds.toFixed(1)} s, ${state.last.on ? 'on ' : 'off'} ${state.last.line}`)
      }
      if (seconds > SITE_SECONDS) break
      await new Promise((r) => setTimeout(r, 150))
    }
    const got = await page.evaluate(() => {
      const el = document.querySelector('[data-narrator-caption]')
      return { cap: window.__cap, src: window.__src, frames: window.__frames, log: el && el.dataset.log ? JSON.parse(el.dataset.log) : [], state: window.__ctx ? window.__ctx.state : null, rate: window.__ctx ? window.__ctx.sampleRate : null }
    })
    const list = rows(got.cap, got.src, got.log)
    record[TAG] = {
      what: `the built site, mode live${STEP ? `, from step ${STEP}` : ''}${QUALITY ? `, quality ${QUALITY}` : ''}, ${VIEW.width} by ${VIEW.height}, the keen bot playing it in real time for ${SITE_SECONDS} s, seed ${c.seed}`,
      audioContext: got.state,
      sampleRate: got.rate,
      drawnFrames: frameOf(got.frames),
      lines: list,
      linesSaid: list.length,
      worstOnAfterVoiceStart: r3(worst(list, 'onAfterVoiceStart')),
      worstOffAfterVoiceEnd: r3(worst(list, 'offAfterVoiceEnd')),
      pageErrors: errors,
      shots: [...taken]
    }
    console.log(`caption: site, ${list.length} lines, caption on at most ${record[TAG].worstOnAfterVoiceStart} s from the voice's start, off at most ${record[TAG].worstOffAfterVoiceEnd} s from its end, frame median ${record[TAG].drawnFrames?.medianMs} ms, errors ${errors.length}`)
    await context.close()
    await site.close()
    site = null
  }

  if (!a['site-only']) {
    const { build } = await import('vite')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-caption-'))
    await build({ root: at(), configFile: false, logLevel: 'silent', publicDir: false, build: { outDir: dir, emptyOutDir: false, target: 'es2022', minify: false, lib: { entry: at('src', 'audio', 'index.ts'), formats: ['es'], fileName: () => 'engine.js' } } })
    const css = fs.readdirSync(dir).filter((f) => f.endsWith('.css'))
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>caption</title>${css.map((f) => `<link rel="stylesheet" href="./${f}">`).join('')}<body style="margin:0;background:#16130f"><script type="module">
import { makeSound } from './engine.js'
const sound = makeSound({ base: './audio/' })
sound.page('marketing')
window.sound = sound
window.one = async (page, call) => {
  sound.stop()
  sound.page(page)
  sound.start()
  const from = window.__cap.length
  const t0 = window.__ctx.currentTime
  if (call.watch) {
    sound.stop()
    sound.opening(0, 0)
    sound.start()
    sound.trigger(call.watch)
  } else if (call.trigger) sound.trigger(call.trigger)
  else if (call.quiet !== undefined) sound.quiet(call.quiet)
  else sound.event({ name: call.event, x: 0.5, y: 0.5, hitsCursor: Boolean(call.hit), page }, 'live')
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  while (window.__ctx.currentTime - t0 < 1 && window.__cap.length === from) await wait(20)
  if (window.__cap.length === from) return null
  while (window.__cap.at(-1).on) await wait(20)
  await wait(120)
  return window.__cap[from].line
}
window.ready = sound.unlock().then(() => true)
</script>`)
    site = await serve(dir, { mounts: { '/audio/': at('public', 'audio') } })
    const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 })
    await context.addInitScript(watch)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e.message)))
    await page.goto(`${site.url}/index.html`)
    await page.evaluate(() => window.ready)
    const { load, close } = await (await import('../../tools/lib/logic.mjs')).logic()
    const cues = await load('/src/audio/cues.ts')
    const narration = readJson(at('content', 'narration.json'))
    const wanted = []
    for (const [key, t] of Object.entries(cues.filmLive)) {
      const beat = key.slice(0, key.lastIndexOf('.'))
      wanted.push({ id: `line.${key}`, page: cues.unitPage[beat.split('.')[0]], call: { event: t.event }, by: `event ${t.event}` })
    }
    const livePage = { 'slowTyping': 'step1', 'realKeyboard': 'step1', 'tugLost': 'step1', 'pinball.flipper': 'step3', 'boss.verify': 'step4', 'boss.slow': 'step4', 'hit': 'step1', 'skip': 'step2', 'watchFilm': 'step2', 'idle': 'step1' }
    for (const [key, t] of Object.entries(cues.liveTriggers)) {
      const n = (narration.liveOnly?.[key] ?? []).length || 1
      for (let i = 0; i < n; i++) {
        const call = t.on === 'hit' ? { event: 'hit', hit: true } : t.on === 'event' ? { event: t.event } : key === 'idle' ? { quiet: 60 } : key === 'watchFilm' ? { watch: key } : { trigger: key }
        wanted.push({ id: `line.live.${key}.${i}`, page: livePage[key] ?? 'step1', call, by: t.on === 'hit' ? 'an event that hits the cursor' : t.on === 'event' ? `event ${t.event}` : key === 'idle' ? 'no event: 60 s of stillness told to the engine' : key === 'watchFilm' ? 'the press of Watch the film, as src/main.ts passes it on: stop, opening(0, 0), start, trigger' : `the control ${key}` })
      }
    }
    const heard = []
    for (const w of wanted) {
      let got = null
      for (let i = 0; i < 4 && got !== w.id; i++) {
        got = await page.evaluate(([p, k]) => window.one(p, k), [w.page, w.call])
        if (got === null) break
      }
      heard.push({ ...w, said: got })
      console.log(`caption: ${w.id} by ${w.by} on ${w.page}: ${got === w.id ? 'said' : got === null ? 'nothing said' : `said ${got}`}`)
    }
    await close()
    const got = await page.evaluate(() => {
      const el = document.querySelector('[data-narrator-caption]')
      return { cap: window.__cap, src: window.__src, frames: window.__frames, log: el && el.dataset.log ? JSON.parse(el.dataset.log) : [] }
    })
    const all = rows(got.cap, got.src, got.log)
    const index = readJson(at('public', 'audio', 'index.json'))
    const lengths = new Map()
    const walk = (x) => {
      if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') {
        if (typeof x.id === 'string' && typeof x.seconds === 'number') lengths.set(x.id, x.seconds)
        Object.values(x).forEach(walk)
      }
    }
    walk(index)
    const lengthOf = (id) => lengths.get(id) ?? null
    const lines = heard.map((w) => {
      const row = w.said === w.id ? [...all].reverse().find((r) => r.line === w.id) : null
      return { id: w.id, page: w.page, by: w.by, said: w.said === w.id, lengthInIndex: lengthOf(w.id), ...(row ?? {}) }
    })
    const said = lines.filter((l) => l.said)
    record.lines = {
      what: 'every line of content/narration.json, its event sent to the site\'s engine in a browser in real time; between lines the sound is stopped and started so that the 6 s of silence do not have to be waited out',
      drawnFrames: frameOf(got.frames),
      lines,
      said: said.length,
      notSaid: lines.filter((l) => !l.said).map((l) => l.id),
      worstOnAfterVoiceStart: r3(worst(said, 'onAfterVoiceStart')),
      worstOffAfterVoiceEnd: r3(worst(said, 'offAfterVoiceEnd')),
      wordsMatch: said.every((l) => typeof l.words === 'string' && l.words.length > 0),
      pageErrors: errors
    }
    console.log(`caption: lines, ${said.length} of ${lines.length} said, not said: ${record.lines.notSaid.join(', ') || 'none'}; caption on at most ${record.lines.worstOnAfterVoiceStart} s from the voice's start, off at most ${record.lines.worstOffAfterVoiceEnd} s from its end; frame median ${record.lines.drawnFrames?.medianMs} ms; errors ${errors.length}`)
    await context.close()
  }
} finally {
  await browser.close()
  if (site) await site.close()
}
writeJson(path.join(out, 'shell-caption.json'), record)
console.log(`caption: written pipeline/change002/shell-caption.json; pictures of the panel in ${shots}`)
