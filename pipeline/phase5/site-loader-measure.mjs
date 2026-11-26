// node pipeline/phase5/site-loader-measure.mjs --mbit 1.5 --bot skipper --seconds 240 --sheet out/work/site-loader/slow.png
// Opens the built site in live mode on a throttled line, as a visitor does (wall clock, no stepped harness), and measures:
// the seconds to the first complete picture, what is fetched while each page is on show, the longest gap between two frames, and a sheet of the run.
// --around <page> --before 8 --behind 4 makes the sheet of the shots round the first one of that page. The server compresses text as the host does. --mbit 0 leaves the line open. --from 3 starts at a step. --tiles 12. --view 960x540.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import zlib from 'node:zlib'
import sharp from 'sharp'
import { args, at, readJson, writeJson } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'

const a = args()
const mbit = Number(a.mbit ?? 0)
const bot = typeof a.bot === 'string' ? a.bot : 'skipper'
const limit = Number(a.seconds ?? 240)
// Software rendering plays slower than a visitor's machine: the site moves at most 0.1 s a frame. --scale N divides the line by N, so that the megabytes that arrive in a second of play are those of the line named.
const scale = Number(a.scale ?? 1)
const until = typeof a.until === 'string' ? a.until : ''
const after = Number(a.after ?? 30)
const tilesWanted = Number(a.tiles ?? 12)
const [vw, vh] = String(a.view ?? '960x540').split('x').map(Number)
const dist = at(typeof a.dist === 'string' ? a.dist : 'dist')
const base = typeof a.base === 'string' ? a.base : '/'
const name = typeof a.name === 'string' ? a.name : `${bot}-${mbit || 'open'}`
const outDir = at('out', 'work', 'site-loader')
fs.mkdirSync(outDir, { recursive: true })
const copy = readJson(at('content', 'copy.json'))
const headings = [['marketing', copy.marketing.hero.headline], ['step1', copy.step1.heading], ['step2', copy.step2.heading], ['step3', copy.step3.heading], ['step4', copy.step4.heading], ['step5', copy.step5.heading]]

const TEXT = /\.(html|js|mjs|css|json|svg|txt|wasm)$/i
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' }
const sent = []
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!rel.startsWith(base)) {
    res.writeHead(404)
    res.end()
    return
  }
  rel = '/' + rel.slice(base.length)
  if (rel.endsWith('/')) rel += 'index.html'
  const file = path.join(dist, rel)
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  const raw = fs.readFileSync(file)
  const body = TEXT.test(file) ? zlib.gzipSync(raw, { level: 9 }) : raw
  sent.push({ file: rel.slice(1), bytes: raw.length, sent: body.length, at: Date.now() })
  res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store', 'content-length': body.length, ...(body === raw ? {} : { 'content-encoding': 'gzip' }) })
  res.end(body)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`

const { browser } = await launch()
const context = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Network.enable')
const line = (by) => cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (mbit * 1e6) / 8 / by, uploadThroughput: (mbit * 1e6) / 8 / by })
if (mbit > 0) await line(1)
const problems = []
page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
await page.addInitScript(() => {
  const w = window
  w.__frames = { count: 0, last: 0, gaps: [] }
  const tick = (t) => {
    const f = w.__frames
    if (f.last) f.gaps.push([t, t - f.last])
    f.last = t
    f.count++
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
const q = new URLSearchParams()
if (bot !== 'none') {
  q.set('bot', bot)
  q.set('seed', String(a.seed ?? 1))
}
if (a.from) q.set('step', String(a.from))
if (a.quality) q.set('quality', String(a.quality))
const t0 = Date.now()
await page.goto(`${origin}${base}${q.toString() ? `?${q}` : ''}`, { timeout: 120000 })
const ready = await page.evaluate(async () => {
  try {
    await window.showcase.ready
  } catch (e) {
    return String(e && e.message ? e.message : e)
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return ''
})
const firstPicture = (Date.now() - t0) / 1000
const firstFiles = sent.map((s) => ({ ...s }))
if (mbit > 0 && scale !== 1) await line(scale)
console.log(`measure: ${name}: the first complete picture after ${firstPicture.toFixed(2)} s, ${firstFiles.length} files, ${(firstFiles.reduce((n, f) => n + f.sent, 0) / 1048576).toFixed(3)} MB sent (${(firstFiles.reduce((n, f) => n + f.bytes, 0) / 1048576).toFixed(3)} MB stored)${ready ? `. NOT READY: ${ready}` : ''}`)

const pageNow = () => page.evaluate((hs) => {
  const said = document.querySelector('[role=status]')?.textContent ?? ''
  let found = ''
  for (const [id, h] of hs) if (said.includes(h)) found = id
  const info = window.showcase.info()
  return { page: found, said, loading: info.loading ?? null, standIns: info.standIns.map((s) => s.name), frames: window.__frames.count, now: performance.now() }
}, headings)

const shots = []
const marks = []
let finishedAt = 0
let was = ''
let seenLast = false
let reachedAt = 0
const every = Number(a.every ?? 2)
for (;;) {
  const wall = (Date.now() - t0) / 1000
  if (wall > limit) break
  const s = await pageNow()
  if (s.page !== was) {
    marks.push({ page: s.page, wall, now: s.now })
    console.log(`measure: ${name}: ${wall.toFixed(1)} s: on ${s.page || 'no page named'}${s.loading ? ` loading ${JSON.stringify(s.loading).slice(0, 300)}` : ''}`)
    if (was === 'step5' && s.page === 'marketing') seenLast = true
    was = s.page
  }
  const png = await page.screenshot({ type: 'png' })
  shots.push({ wall, page: s.page, png, standIns: s.standIns, loading: s.loading })
  if (seenLast && !finishedAt) finishedAt = wall
  if (finishedAt && wall > finishedAt + 6) break
  if (until && !reachedAt && s.page === until) reachedAt = wall
  if (reachedAt && wall > reachedAt + after) break
  await new Promise((r) => setTimeout(r, every * 1000))
}
const frames = await page.evaluate(() => window.__frames)
const end = await pageNow()
await browser.close()
server.close()

// What was fetched while each page was on show, and the longest gap between two frames on each.
const rows = marks.map((m, i) => {
  const to = marks[i + 1]
  const from = t0 + m.wall * 1000
  const until = to ? t0 + to.wall * 1000 : Infinity
  const files = sent.filter((s) => s.at >= from && s.at < until && !(i === 0 && firstFiles.some((f) => f.file === s.file && f.at === s.at)))
  const gaps = frames.gaps.filter(([t]) => t >= m.now && (!to || t < to.now)).map(([, g]) => g)
  const sorted = [...gaps].sort((x, y) => x - y)
  return { page: m.page, fromSeconds: Number(m.wall.toFixed(1)), seconds: Number(((to ? to.wall : end.now / 1000) - m.wall).toFixed(1)), files: files.length, sentMb: Number((files.reduce((n, f) => n + f.sent, 0) / 1048576).toFixed(3)), frames: gaps.length, playSeconds: Number(gaps.reduce((n, g) => n + Math.min(100, g) / 1000, 0).toFixed(1)), medianFrameMs: Math.round(sorted[Math.floor(sorted.length / 2)] ?? 0), longestFrameMs: Math.round(sorted.at(-1) ?? 0), fetched: files.map((f) => f.file) }
})
for (const r of rows) console.log(`measure: ${name}: ${r.page.padEnd(9)} from ${String(r.fromSeconds).padStart(6)} s for ${String(r.seconds).padStart(6)} s: fetched ${r.files} files, ${r.sentMb} MB; ${r.frames} frames, ${r.playSeconds} s of play, median ${r.medianFrameMs} ms, longest ${r.longestFrameMs} ms`)
const worst = [...frames.gaps].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([t, g]) => ({ atSeconds: Number((t / 1000).toFixed(2)), ms: Math.round(g) }))
console.log(`measure: ${name}: the five longest gaps between two frames: ${worst.map((w) => `${w.ms} ms at ${w.atSeconds} s`).join(', ')}`)
if (problems.length) console.log(`measure: ${name}: errors on the page: ${[...new Set(problems)].slice(0, 5).join(' | ')}`)

// --around step3 --before 8 --behind 4: the sheet shows the shots just before and just after the first one of that page, which is where a wait shows.
const around = typeof a.around === 'string' ? shots.findIndex((x) => x.page === a.around) : -1
const all = around >= 0 ? shots.slice(Math.max(0, around - Number(a.before ?? 8)), around + Number(a.behind ?? 4)) : shots
const pick = all.length <= tilesWanted ? all : Array.from({ length: tilesWanted }, (_, i) => all[Math.round((i * (all.length - 1)) / (tilesWanted - 1))])
if (!pick.length) process.exit(0)
const cols = 4
const tw = 300
const th = Math.round((tw * vh) / vw)
const label = 22
const rowsN = Math.ceil(pick.length / cols)
const tiles = await Promise.all(pick.map(async (s, i) => {
  const img = await sharp(s.png).resize(tw, th).png().toBuffer()
  const t3 = s.loading?.pages?.step3
  const text = `${s.wall.toFixed(0)} s  ${s.page}${t3 ? `  table ${t3.onCard}/${t3.files} on card` : ''}`.replace(/[<&>]/g, '')
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="16" font-family="monospace" font-size="13" fill="#eee">${text}</text></svg>`)
  return [{ input: img, left: (i % cols) * tw, top: Math.floor(i / cols) * (th + label) + label }, { input: svg, left: (i % cols) * tw, top: Math.floor(i / cols) * (th + label) }]
}))
const sheet = at(typeof a.sheet === 'string' ? a.sheet : path.join('out', 'work', 'site-loader', `${name}.png`))
fs.mkdirSync(path.dirname(sheet), { recursive: true })
await sharp({ create: { width: cols * tw, height: rowsN * (th + label), channels: 3, background: '#0b0b0c' } }).composite(tiles.flat()).png().toFile(sheet)
writeJson(path.join(outDir, `${name}.json`), { name, mbit, scale, bot, view: [vw, vh], firstPictureSeconds: firstPicture, firstLoad: { files: firstFiles.length, sentMb: firstFiles.reduce((n, f) => n + f.sent, 0) / 1048576, storedMb: firstFiles.reduce((n, f) => n + f.bytes, 0) / 1048576, list: firstFiles.map((f) => f.file) }, pages: rows, worst, finishedAtSeconds: finishedAt || null, problems: [...new Set(problems)], lastLoading: end.loading })
console.log(`measure: ${name}: wrote ${path.relative(at(), sheet)} and ${name}.json${finishedAt ? `; the run was back on the careers page after ${finishedAt.toFixed(0)} s` : `; stopped at the limit of ${limit} s on ${was}`}`)
