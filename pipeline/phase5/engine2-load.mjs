// Loads the built site in one browser engine and keeps what it drew and what it said.
// node pipeline/phase5/engine2-load.mjs --engine chromium|firefox|webkit --job careers|visit|stepped [--out DIR] [--name NAME]
//   [--query "?quality=low"] [--width 1920] [--height 1080] [--also 30,60] [--seconds 360] [--every 10] [--until step5] [--headed] [--prefs '{"webgl.force-enabled":true}'] [--env '{"K":"V"}']
// careers: the live site, a still 3 s after it is ready. visit: the live site played by a bot in real time, a still every --every seconds.
// stepped: the same bot with clock=steps, where the tool moves the site's time itself (window.liveRun), so a slow engine still reaches every page; a still every --every seconds of the site's time.
// One engine a run. Nothing is written into the repo unless --out points there.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { firefox, webkit } from 'playwright-core'
import { serve } from '../../tools/lib/serve.mjs'
import { launch as launchChromium } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const a = {}
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i]
  if (!k.startsWith('--')) continue
  const next = process.argv[i + 1]
  if (next === undefined || next.startsWith('--')) a[k.slice(2)] = true
  else a[k.slice(2)] = process.argv[++i]
}
const engine = a.engine ?? 'chromium'
const job = a.job ?? 'careers'
const out = path.resolve(a.out ?? path.join(root, 'out', 'work', 'engine2'))
const name = a.name ?? `${engine}-${job}`
const query = a.query ?? (job === 'visit' ? '?bot=skipper&quality=low' : job === 'stepped' ? '?bot=skipper&quality=low&clock=steps' : '?quality=low')
const limit = Number(a.seconds ?? 360)
const every = Number(a.every ?? 10)
const until = a.until ?? 'step5'
const also = a.also ? String(a.also).split(',').map(Number) : []
const width = Number(a.width ?? 1920)
const height = Number(a.height ?? 1080)
const prefs = a.prefs ? JSON.parse(a.prefs) : {}
const env = { ...process.env, ...(a.env ? JSON.parse(a.env) : {}) }
fs.mkdirSync(out, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const t0 = Date.now()
const secs = () => Math.round((Date.now() - t0) / 100) / 10
const lines = []
const say = (kind, text) => {
  lines.push({ at: secs(), kind, text })
  console.log(`[${secs()}s] ${kind}: ${text}`)
}

// Runs before the site's code: counts the frames the page asks for, keeps the site's own WebGL context, and notes every extension asked of it.
function spy() {
  const w = window
  w.__e2 = { frames: 0, first: 0, last: 0, asked: {}, gl: null, kind: null, lost: 0, gaps: [] }
  const raf = w.requestAnimationFrame.bind(w)
  w.requestAnimationFrame = (f) => raf((t) => {
    const s = w.__e2
    if (t !== s.last) {
      if (!s.first) s.first = t
      else if (s.gaps.length < 20000) s.gaps.push(t - s.last)
      s.frames++
      s.last = t
    }
    f(t)
  })
  const get = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const gl = get.call(this, kind, ...rest)
    if (gl && this.id === 'stage' && !w.__e2.gl && String(kind).startsWith('webgl')) {
      w.__e2.gl = gl
      w.__e2.kind = kind
      const ext = gl.getExtension.bind(gl)
      gl.getExtension = (n) => {
        const e = ext(n)
        w.__e2.asked[n] = e !== null
        return e
      }
      this.addEventListener('webglcontextlost', () => w.__e2.lost++)
    }
    return gl
  }
}

const facts = () => {
  const s = window.__e2
  const mm = (q) => (typeof matchMedia === 'function' ? matchMedia(q).matches : null)
  const o = {
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    inner: [window.innerWidth, window.innerHeight],
    media: {
      'prefers-reduced-motion: reduce': mm('(prefers-reduced-motion: reduce)'),
      'any-hover: hover': mm('(any-hover: hover)'),
      'any-pointer: fine': mm('(any-pointer: fine)'),
      'any-pointer: coarse': mm('(any-pointer: coarse)'),
      'hover: hover': mm('(hover: hover)'),
      'pointer: fine': mm('(pointer: fine)'),
      maxTouchPoints: navigator.maxTouchPoints
    },
    canvas: null,
    fail: null,
    gl: null
  }
  const c = document.getElementById('stage')
  if (c) o.canvas = { hidden: c.hidden, width: c.width, height: c.height, css: [c.style.width, c.style.height] }
  const f = document.getElementById('fail')
  if (f) o.fail = { hidden: f.hidden, text: f.textContent }
  const gl = s && s.gl
  if (gl) {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const p = (n) => gl.getParameter(n)
    o.gl = {
      kind: s.kind,
      VERSION: p(gl.VERSION),
      SHADING_LANGUAGE_VERSION: p(gl.SHADING_LANGUAGE_VERSION),
      VENDOR: p(gl.VENDOR),
      RENDERER: p(gl.RENDERER),
      UNMASKED_VENDOR: dbg ? p(dbg.UNMASKED_VENDOR_WEBGL) : null,
      UNMASKED_RENDERER: dbg ? p(dbg.UNMASKED_RENDERER_WEBGL) : null,
      MAX_TEXTURE_SIZE: p(gl.MAX_TEXTURE_SIZE),
      MAX_RENDERBUFFER_SIZE: p(gl.MAX_RENDERBUFFER_SIZE),
      MAX_SAMPLES: gl.MAX_SAMPLES ? p(gl.MAX_SAMPLES) : null,
      MAX_VIEWPORT_DIMS: Array.from(p(gl.MAX_VIEWPORT_DIMS)),
      MAX_TEXTURE_IMAGE_UNITS: p(gl.MAX_TEXTURE_IMAGE_UNITS),
      MAX_DRAW_BUFFERS: gl.MAX_DRAW_BUFFERS ? p(gl.MAX_DRAW_BUFFERS) : null,
      contextLost: gl.isContextLost(),
      lostEvents: s.lost,
      error: gl.getError(),
      attributes: gl.getContextAttributes(),
      supported: gl.getSupportedExtensions(),
      asked: s.asked,
      askedMissing: Object.keys(s.asked).filter((k) => !s.asked[k]).sort()
    }
  }
  return o
}

const rate = () => {
  const s = window.__e2
  const g = s.gaps.splice(0)
  if (!g.length) return { frames: s.frames, n: 0 }
  const sum = g.reduce((x, y) => x + y, 0)
  const sorted = g.slice().sort((x, y) => x - y)
  return { frames: s.frames, n: g.length, fps: Math.round((g.length / sum) * 100000) / 100, medianMs: Math.round(sorted[g.length >> 1] * 10) / 10, worstMs: Math.round(sorted[g.length - 1] * 10) / 10 }
}

const told = () => {
  const i = window.showcase.info()
  return { show: i.loading.show, waiting: i.loading.waiting, card: i.loading.card, standIns: i.standIns.map((s) => s.name), tier: i.tier, format: i.format, target: i.versions.target }
}

const result = { engine, job, name, query, window: [width, height], started: new Date().toISOString(), headed: Boolean(a.headed), prefs, envSet: a.env ? JSON.parse(a.env) : {} }
const server = await serve(path.join(root, 'dist'))
let browser = null
let code = 0
try {
  if (engine === 'chromium') {
    const l = await launchChromium()
    browser = l.browser
    result.executable = l.executablePath
  } else {
    const type = engine === 'firefox' ? firefox : webkit
    const o = { headless: !a.headed, env }
    if (engine === 'firefox') o.firefoxUserPrefs = prefs
    browser = await type.launch(o)
    result.executable = type.executablePath()
  }
  result.version = browser.version()
  say('launch', `${engine} ${result.version} ${result.executable}`)
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  await context.addInitScript(spy)
  const page = await context.newPage()
  page.on('console', (m) => say(`console.${m.type()}`, m.text()))
  page.on('pageerror', (e) => say('pageerror', `${e && e.message ? e.message : e}${e && e.stack ? ` | ${String(e.stack).split('\n').slice(0, 4).join(' | ')}` : ''}`))
  page.on('requestfailed', (r) => say('requestfailed', `${r.url()} ${r.failure() ? r.failure().errorText : ''}`))
  page.on('response', (r) => r.status() >= 400 && say('http', `${r.status()} ${r.url()}`))
  page.on('crash', () => say('crash', 'the page crashed'))
  const shot = async (file) => {
    const t = Date.now()
    const png = await page.screenshot({ type: 'png', timeout: 120000 })
    fs.writeFileSync(path.join(out, file), png)
    return Date.now() - t
  }

  const tl = Date.now()
  await page.goto(`${server.url}/${query}`, { timeout: 180000 })
  const state = await page.evaluate(async () => {
    if (!window.showcase) return { ready: false, why: 'the page has no window.showcase' }
    try {
      await Promise.race([window.showcase.ready, new Promise((_, no) => setTimeout(() => no(new Error('showcase.ready did not settle in 240 s')), 240000))])
    } catch (e) {
      return { ready: false, why: String(e && e.message ? e.message : e) }
    }
    return { ready: true }
  }).catch((e) => ({ ready: false, why: String(e && e.message ? e.message : e).split('\n')[0] }))
  result.secondsToReady = Math.round((Date.now() - tl) / 100) / 10
  result.state = state
  say('ready', JSON.stringify(state) + ` after ${result.secondsToReady}s`)

  if (job === 'careers') {
    await sleep(3000)
    result.shotMs = await shot(`${name}.png`)
    result.facts = await page.evaluate(facts).catch((e) => ({ error: String(e) }))
    result.rate = await page.evaluate(rate).catch(() => null)
    result.info = state.ready ? await page.evaluate(() => window.showcase.info()).catch((e) => ({ error: String(e) })) : null
    await sleep(2000)
    result.rateAfter = await page.evaluate(rate).catch(() => null)
    result.later = []
    const tr = Date.now()
    for (const at of also) {
      await sleep(Math.max(0, at * 1000 - (Date.now() - tr)))
      const r = await page.evaluate(rate).catch(() => null)
      const file = `${name}-plus${String(at).padStart(3, '0')}s.png`
      const ms = await shot(file).catch((e) => {
        say('shot', String(e).split('\n')[0])
        return -1
      })
      result.later.push({ at, file, shotMs: ms, rate: r, show: state.ready ? await page.evaluate(told).catch(() => null) : null })
      say('still', `${file} ${JSON.stringify(r)}`)
    }
  } else if (job === 'stepped') {
    result.facts = await page.evaluate(facts).catch((e) => ({ error: String(e) }))
    const has = state.ready && (await page.evaluate(async () => {
      for (let i = 0; i < 400 && !window.liveRun; i++) await new Promise((r) => setTimeout(r, 50))
      return Boolean(window.liveRun)
    }))
    if (!has) throw new Error('the page has no window.liveRun')
    const tv = Date.now()
    const el = () => Math.round((Date.now() - tv) / 100) / 10
    const stills = []
    const seen = {}
    const keep = async (why) => {
      const t = Date.now()
      const s = await page.evaluate(() => {
        const x = window.liveRun.state()
        const t = window.liveRun.told()
        const gl = window.__e2.gl
        return { time: x.time, page: x.page, gag: x.gag, finished: x.finished, png: x.png, pageTime: t.pageTime, turning: t.turning, glError: gl ? gl.getError() : null, lost: gl ? gl.isContextLost() : null }
      })
      const file = `${name}-${String(Math.round(s.time)).padStart(3, '0')}s-${s.page}.png`
      fs.writeFileSync(path.join(out, file), Buffer.from(s.png.split(',')[1], 'base64'))
      const row = { why, file, time: s.time, page: s.page, pageTime: Math.round(s.pageTime * 10) / 10, turning: s.turning, gag: s.gag, drawMs: Date.now() - t, glError: s.glError, lost: s.lost, wall: el() }
      stills.push(row)
      say('still', JSON.stringify(row))
      return s
    }
    let last = await keep('start')
    seen[last.page] = { time: last.time, wall: el() }
    let nextAt = every
    let stood = null
    while (el() < limit) {
      const t = await page.evaluate(() => {
        window.liveRun.advance(1, true)
        const x = window.liveRun.told()
        return { time: x.time, page: x.page, pageTime: x.pageTime, turning: x.turning, finished: x.finished, skipOffered: x.skipOffered }
      })
      const fresh = !(t.page in seen)
      if (fresh) {
        seen[t.page] = { time: t.time, wall: el() }
        say('page', `${t.page} on show at ${t.time}s of the site's time, ${el()}s of mine`)
      }
      const settled = stills.length && stills[stills.length - 1].page === t.page && stills.filter((x) => x.page === t.page && !x.turning).length === 0 && !t.turning && t.pageTime >= 3
      if (fresh || settled || t.time >= nextAt) {
        await keep(fresh ? 'new page' : settled ? 'page stands' : 'every')
        while (nextAt <= t.time) nextAt += every
      }
      if (t.page === until && stood === null) stood = t.time
      if (t.finished || (stood !== null && t.time - stood >= 12)) {
        await keep('end')
        break
      }
    }
    result.visitSeconds = el()
    result.reached = seen
    result.stills = stills
    result.info = await page.evaluate(() => window.showcase.info()).catch((e) => ({ error: String(e) }))
    result.factsAfter = await page.evaluate(facts).catch((e) => ({ error: String(e) }))
  } else {
    result.facts = await page.evaluate(facts).catch((e) => ({ error: String(e) }))
    const tv = Date.now()
    const el = () => Math.round((Date.now() - tv) / 100) / 10
    const pages = []
    const seen = new Map()
    let next = 0
    let stoodSince = null
    await page.evaluate(rate).catch(() => null)
    while (el() < limit) {
      const s = state.ready ? await page.evaluate(told).catch((e) => ({ error: String(e).split('\n')[0] })) : { error: state.why }
      const at = el()
      if (s.show && !seen.has(s.show)) {
        seen.set(s.show, at)
        say('page', `${s.show} on show at ${at}s`)
      }
      if (at >= next) {
        const sec = Math.round(at)
        const r = await page.evaluate(rate).catch(() => null)
        const file = `${name}-${String(sec).padStart(3, '0')}s.png`
        const ms = await shot(file).catch((e) => {
          say('shot', String(e).split('\n')[0])
          return -1
        })
        pages.push({ at, file, shotMs: ms, ...s, rate: r })
        say('still', `${file} ${JSON.stringify({ show: s.show, waiting: s.waiting, standIns: s.standIns, error: s.error, rate: r })}`)
        next += every
        await page.evaluate(rate).catch(() => null)
      }
      if (s.show === until && stoodSince === null) stoodSince = el()
      if (stoodSince !== null && el() - stoodSince > 8) {
        const file = `${name}-${until}-${String(Math.round(el())).padStart(3, '0')}s.png`
        await shot(file).catch(() => {})
        pages.push({ at: el(), file, ...s, last: true })
        say('still', `${file} the page ${until} stood for 8 s`)
        break
      }
      await sleep(1000)
    }
    result.visitSeconds = el()
    result.reached = Object.fromEntries(seen)
    result.stills = pages
    result.info = state.ready ? await page.evaluate(() => window.showcase.info()).catch((e) => ({ error: String(e) })) : null
    result.factsAfter = await page.evaluate(facts).catch((e) => ({ error: String(e) }))
  }
} catch (e) {
  say('script', String(e && e.stack ? e.stack : e))
  result.failed = String(e && e.message ? e.message : e)
  code = 1
} finally {
  if (browser) await browser.close().catch(() => {})
  await server.close()
}
result.console = lines
fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(result, null, 2))
console.log(`wrote ${path.join(out, `${name}.json`)}`)
process.exit(code)
