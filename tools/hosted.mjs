// Opens the published copy in a fresh browser context and checks that it plays there.
// The address is given on the command line and is never written to a file.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at } from './lib/paths.mjs'
import { launch } from './lib/browser.mjs'

const a = args()
const url = a.url
if (!url || !/^https?:\/\//.test(url)) {
  console.error('hosted: give the address of the published index.html, --url https://...')
  process.exit(1)
}
const wait = Number(a.wait ?? 12000)
const outDir = at('out', 'work', 'hosted')
fs.mkdirSync(outDir, { recursive: true })
const dist = at('dist')
const sibling = (file) => new URL(file, url).toString()
const short = (u) => {
  const p = new URL(u)
  return `${p.pathname.split('/').slice(-2).join('/')}${p.search}`
}

const { browser, version } = await launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
const report = { time: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), browser: version, pages: [], fetches: [], ok: true }

async function visit(file, name, test) {
  const page = await context.newPage()
  const failed = []
  const errors = []
  const stopped = []
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? 'failed'
    if (r.resourceType() === 'media' && why === 'net::ERR_ABORTED') stopped.push(new URL(r.url()).pathname.split('/').slice(-2).join('/'))
    else failed.push(`${short(r.url())}: ${why}`)
  })
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${short(r.url())}: ${r.status()}`)
  })
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200))
  })
  const entry = { file, name, failed, errors, stopped }
  try {
    const response = await page.goto(sibling(file), { waitUntil: 'load', timeout: 60000 })
    entry.status = response ? response.status() : null
    entry.result = await test(page)
    const shot = path.join(outDir, `${name}.jpg`)
    await page.screenshot({ path: shot, type: 'jpeg', quality: 80 })
    const stats = await sharp(shot).stats()
    entry.spread = Math.round(Math.max(...stats.channels.map((c) => c.stdev)) * 10) / 10
    entry.picture = path.relative(at(), shot)
  } catch (e) {
    entry.error = String(e.message).split('\n')[0].slice(0, 200)
  }
  entry.ok = !entry.error && entry.status === 200 && !failed.length && !errors.length && entry.result?.ok !== false
  if (!entry.ok) report.ok = false
  report.pages.push(entry)
  await page.close()
  return entry
}

const canvasTest = async (page) => {
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas')
    return c && c.width > 0 && document.querySelector('#fail')?.hidden !== false
  }, null, { timeout: 30000 })
  await page.waitForTimeout(wait)
  const fail = await page.evaluate(() => {
    const f = document.querySelector('#fail')
    return f && !f.hidden ? f.textContent.slice(0, 300) : null
  })
  const size = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return c ? [c.width, c.height] : null
  })
  return { ok: !fail && !!size, fail, canvas: size }
}

const first = await visit('index.html', 'site', canvasTest)

if (fs.existsSync(path.join(dist, 'review.html'))) {
  await visit('review.html', 'review', async (page) => {
    await page.waitForTimeout(1500)
    const r = await page.evaluate(async () => {
      const imgs = [...document.images]
      for (const i of imgs) i.loading = 'eager'
      await Promise.all(imgs.map((i) => (i.complete && i.naturalWidth ? null : new Promise((done) => { i.onload = i.onerror = done; setTimeout(done, 20000) }))))
      const broken = imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src'))
      const links = [...document.querySelectorAll('#open a')].map((l) => l.getAttribute('href'))
      const played = [...document.querySelectorAll('video, audio')]
      await Promise.all(played.map((m) => (m.readyState >= 1 || m.error ? null : new Promise((done) => { m.onloadedmetadata = m.onerror = done; setTimeout(done, 30000) }))))
      const media = played.map((m) => ({ src: m.getAttribute('src'), seconds: Number.isFinite(m.duration) ? Math.round(m.duration * 100) / 100 : null, error: m.error ? m.error.code : null }))
      return { images: imgs.length, broken, links, media, parts: [...document.querySelectorAll('main section')].map((s) => s.id) }
    })
    const silent = r.media.filter((m) => m.error || !(m.seconds > 0)).map((m) => m.src)
    return { ...r, silent, ok: r.broken.length === 0 && silent.length === 0 && r.parts.length === 7 }
  })
  const page = await context.newPage()
  try {
    await page.goto(sibling('review.html'), { waitUntil: 'load', timeout: 60000 })
    await Promise.all([page.waitForNavigation({ timeout: 30000 }), page.click('#open a')])
    const landed = short(page.url())
    await page.waitForFunction(() => document.querySelector('canvas')?.width > 0, null, { timeout: 30000 })
    report.link = { from: 'review.html', to: landed, ok: /index\.html/.test(landed) }
  } catch (e) {
    report.link = { from: 'review.html', ok: false, error: String(e.message).split('\n')[0].slice(0, 200) }
  }
  if (!report.link.ok) report.ok = false
  await page.close()
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const all = fs.existsSync(dist) ? walk(dist).map((f) => path.relative(dist, f).split(path.sep).join('/')) : []
const pick = (test) => all.find(test)
const samples = [
  ['text', pick((f) => /\.json$/.test(f))],
  ['picture', pick((f) => /\.(jpe?g|png|webp)$/.test(f))],
  ['sound', pick((f) => /\.(mp3|m4a|ogg|wav)$/.test(f))],
  ['video', pick((f) => /\.mp4$/.test(f))],
  ['binary', pick((f) => /\.(bin|glb|ktx2|wasm)$/.test(f))]
].filter(([, f]) => f)

if (first.status === 200) {
  const page = await context.newPage()
  await page.goto(sibling('index.html'), { waitUntil: 'load', timeout: 60000 })
  for (const [kind, file] of samples) {
    const bytes = fs.statSync(path.join(dist, file)).size
    const got = await page.evaluate(async ({ file, kind }) => {
      const out = {}
      try {
        const r = await fetch(`./${file}`)
        const b = await r.arrayBuffer()
        out.script = { status: r.status, bytes: b.byteLength, type: r.headers.get('content-type') }
      } catch (e) {
        out.script = { error: String(e.message).slice(0, 120) }
      }
      if (kind === 'picture') {
        out.element = await new Promise((done) => {
          const i = new Image()
          i.crossOrigin = 'anonymous'
          i.onload = () => {
            try {
              const c = document.createElement('canvas')
              c.width = c.height = 4
              const g = c.getContext('2d')
              g.drawImage(i, 0, 0, 4, 4)
              g.getImageData(0, 0, 1, 1)
              done({ width: i.naturalWidth, readable: true })
            } catch {
              done({ width: i.naturalWidth, readable: false })
            }
          }
          i.onerror = () => done({ error: 'did not load' })
          i.src = `./${file}`
        })
      }
      if (kind === 'sound' || kind === 'video') {
        out.element = await new Promise((done) => {
          const m = document.createElement(kind === 'sound' ? 'audio' : 'video')
          m.preload = 'metadata'
          m.onloadedmetadata = () => done({ seconds: Math.round(m.duration * 100) / 100 })
          m.onerror = () => done({ error: 'did not load' })
          setTimeout(() => done({ error: 'no answer in 15 s' }), 15000)
          m.src = `./${file}`
        })
      }
      return out
    }, { file, kind })
    const whole = got.script?.bytes === bytes
    report.fetches.push({ kind, file, bytes, ...got, scriptWhole: whole })
  }
  await page.close()
}

await browser.close()
fs.writeFileSync(path.join(outDir, 'hosted.json'), JSON.stringify(report, null, 2) + '\n')
for (const p of report.pages) {
  const why = [p.error, ...p.failed, ...p.errors, p.result?.fail].filter(Boolean)
  console.log(`hosted: ${p.file} ${p.ok ? 'opens' : 'FAILS'}${p.result?.canvas ? `, canvas ${p.result.canvas.join(' by ')}` : ''}${p.result?.images !== undefined ? `, ${p.result.images} pictures, ${p.result.broken.length} broken, ${p.result.media.length} films and sounds, ${p.result.silent.length} that do not load, ${p.result.parts.length} parts` : ''}${p.stopped.length ? `, ${p.stopped.length} media request stopped by the browser after it had what it needed` : ''}${why.length ? `: ${why.slice(0, 4).join('; ')}` : ''}`)
}
if (report.link) console.log(`hosted: the first link of "Open it" ${report.link.ok ? `leads to ${report.link.to}` : `FAILS: ${report.link.error ?? report.link.to}`}`)
for (const f of report.fetches) {
  const s = f.script?.error ? `fails (${f.script.error})` : `${f.script.status}, ${f.script.bytes} of ${f.bytes} bytes${f.scriptWhole ? '' : ', NOT whole'}`
  const e = f.element ? (f.element.error ? `, by element: ${f.element.error}` : `, by element: ${f.element.width ? `${f.element.width} px wide, ${f.element.readable ? 'pixels readable' : 'pixels NOT readable'}` : `${f.element.seconds} s`}`) : ''
  console.log(`hosted: ${f.kind} ${f.file}, by script: ${s}${e}`)
}
console.log(`hosted: ${report.ok ? 'pass' : 'FAIL'}, report in out/work/hosted/hosted.json`)
process.exit(report.ok ? 0 : 1)
