// npm run hostcheck: builds the site from a clean copy and holds its size, its largest file, its first load and its build time against the limits in host.
// The copy is what the host gets: the tracked files of HEAD without the folders of .vercelignore. --whole copies every tracked file. --keep leaves the copy.
// It also opens the build from a sub path and lets a bot play it to step 1 (--no-subpath leaves that out), and says what the sound files of public/audio/ weigh in the numbers.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { launch, machine } from './lib/browser.mjs'
import { serve } from './lib/serve.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { filesOf, firstLoad, ignoredFolders, megabytes, sentBytes, verdict } from './lib/film-host.mjs'

const a = args()
const t0 = clock()
const say = (line) => console.log(`hostcheck: ${line}`)
// A software renderer can take 10 s for a frame and a page screenshot waits for frames, so the screenshot gets 240 s and not the browser driver's 30.
const SHOT_MS = 240000
const cfg = config()
const work = at('out', 'work', 'hostcheck')
const copy = path.join(work, 'clean')
const out = at('out', 'work', 'hostcheck.json')
const rel = (p) => path.relative(at(), p)
const result = { host: cfg.host.name, limits: { maxShippedMb: cfg.host.maxShippedMb, maxFileMb: cfg.host.maxFileMb, firstLoadMaxMb: cfg.host.firstLoadMaxMb, maxBuildMinutes: cfg.host.maxBuildMinutes }, megabyte: 1048576, machine: machine() }
const stop = (line, code = 1) => {
  result.failed = line
  writeJson(out, result)
  if (!a.keep) fs.rmSync(copy, { recursive: true, force: true })
  console.error(`hostcheck: ${line}. Wrote ${rel(out)} after ${took(seconds(t0))}`)
  process.exit(code)
}
const run = (cmd, argv, cwd, log) => {
  const t = clock()
  const r = spawnSync(cmd, argv, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, CI: '1' } })
  fs.writeFileSync(path.join(work, log), `${r.stdout || ''}${r.stderr || ''}`)
  return { ok: r.status === 0, seconds: seconds(t), last: `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').filter(Boolean).slice(-3).join(' | ') }
}

fs.rmSync(work, { recursive: true, force: true })
fs.mkdirSync(copy, { recursive: true })
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: at(), encoding: 'utf8' })
if (head.status !== 0) stop('git gives no commit for HEAD, so there is nothing to make a clean copy of')
result.commit = head.stdout.trim()
const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: at(), encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean)
result.uncommitted = dirty.length
const ignoreFile = at('.vercelignore')
const ignored = !a.whole && fs.existsSync(ignoreFile) ? ignoredFolders(fs.readFileSync(ignoreFile, 'utf8')) : []
result.copy = { how: a.whole ? 'git archive HEAD, every tracked file' : 'git archive HEAD, without the folders of .vercelignore, as the host gets it', left: ignored }

let t = clock()
const tar = path.join(work, 'head.tar')
const arch = spawnSync('git', ['archive', '--format=tar', '-o', tar, 'HEAD'], { cwd: at(), encoding: 'utf8' })
if (arch.status !== 0) stop(`git archive failed: ${String(arch.stderr).trim().split('\n')[0]}`)
const un = spawnSync('tar', ['-xf', tar, '-C', copy, '--anchored', ...ignored.map((f) => `--exclude=${f}`)], { encoding: 'utf8' })
if (un.status !== 0) stop(`the copy could not be unpacked: ${String(un.stderr).trim().split('\n')[0]}`)
fs.rmSync(tar, { force: true })
result.copy.seconds = seconds(t)
result.copy.files = filesOf(copy).length
say(`a clean copy of ${result.commit.slice(0, 7)} in ${rel(copy)}: ${result.copy.files} files, ${ignored.length ? `without ${ignored.join(', ')}` : 'every tracked file'}, in ${took(result.copy.seconds)}${dirty.length ? `. ${dirty.length} uncommitted change${dirty.length === 1 ? ' is' : 's are'} not in it` : ''}`)

const install = run('npm', ['ci', '--no-audit', '--no-fund'], copy, 'install.log')
result.install = { command: 'npm ci', seconds: install.seconds, ok: install.ok }
if (!install.ok) stop(`npm ci failed in the clean copy: ${install.last}`)
say(`npm ci in ${took(install.seconds)}`)
const build = run('npm', ['run', 'build'], copy, 'build.log')
result.build = { command: 'npm run build', seconds: build.seconds, ok: build.ok }
if (!build.ok) stop(`npm run build failed in the clean copy: ${build.last}`)
const dist = path.join(copy, 'dist')
if (!fs.existsSync(path.join(dist, 'index.html'))) stop('the build of the clean copy left no dist/index.html')
const buildMinutes = Number(((install.seconds + build.seconds) / 60).toFixed(3))
result.build.minutesWithInstall = buildMinutes
say(`npm run build in ${took(build.seconds)}: ${took(install.seconds + build.seconds)} with the install`)

const files = filesOf(dist)
const shipped = files.reduce((n, f) => n + f.bytes, 0)
result.dist = { files: files.length, bytes: shipped, mb: megabytes(shipped), largest: files.slice(0, 8).map((f) => ({ ...f, mb: megabytes(f.bytes) })) }

// The first load: the built site opened as a visitor opens it, with no query, until the page says it is ready and has drawn.
const server = await serve(dist)
let load
try {
  const { browser, version } = await launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const asked = []
  const failed = []
  const problems = []
  let open = true
  page.on('request', (r) => open && asked.push(r.url()))
  page.on('requestfailed', (r) => failed.push(r.url()))
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
  const tl = clock()
  await page.goto(`${server.url}/`, { timeout: 120000 })
  const state = await page.evaluate(async () => {
    if (!window.showcase) return { ready: false, why: 'the page has no window.showcase' }
    try {
      await window.showcase.ready
    } catch (e) {
      return { ready: false, why: String(e && e.message ? e.message : e) }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const canvas = document.querySelector('canvas')
    const info = window.showcase.info()
    return { ready: true, mode: new URLSearchParams(location.search).get('mode'), canvas: canvas ? [canvas.width, canvas.height] : null, assets: info.assets, standIns: info.standIns.map((s) => s.name) }
  })
  open = false
  const secondsToReady = seconds(tl)
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  const shot = await page.screenshot({ type: 'png', timeout: SHOT_MS })
  fs.writeFileSync(path.join(work, 'first-picture.png'), shot)
  await browser.close()
  const size = new Map(files.map((f) => [f.file, f.bytes]))
  const got = firstLoad(asked, server.url, (f) => (size.has(f) ? size.get(f) : null))
  const sent = got.files.reduce((n, f) => n + sentBytes(f.file, f.bytes, () => fs.readFileSync(path.join(dist, f.file))), 0)
  load = { ...got, mb: megabytes(got.bytes), compressedBytes: sent, compressedMb: megabytes(sent), requests: asked.length, secondsToReady, failed: [...new Set(failed)], problems, browser: version, state }
} finally {
  await server.close()
}
result.firstLoad = load
result.opensCareersLive = Boolean(load.state.ready && load.state.mode === null && load.state.canvas && load.state.standIns.length === 0 && !load.problems.length && !load.failed.length && !load.missing.length)

// The sound: what of dist/ and of the first load is sound files, so the numbers can be read with and without them.
const soundFiles = files.filter((f) => f.file.startsWith('audio/') && !f.file.endsWith('.json'))
const soundBytes = soundFiles.reduce((n, f) => n + f.bytes, 0)
const soundFirst = load.files.filter((f) => f.file.startsWith('audio/') && !f.file.endsWith('.json'))
result.sound = { files: soundFiles.length, mb: megabytes(soundBytes), distWithoutMb: megabytes(shipped - soundBytes), inFirstLoad: soundFirst.map((f) => f.file) }
const soundIndex = path.join(dist, 'audio', 'index.json')
if (fs.existsSync(soundIndex)) {
  const index = readJson(soundIndex)
  const named = [index.pack, ...(index.loops ?? []), ...(index.lines ?? [])].filter((f) => f && f.file)
  const namedBytes = named.reduce((n, f) => n + f.bytes, 0)
  const here = new Set(soundFiles.map((f) => f.file))
  const absent = named.filter((f) => !here.has(`audio/${f.file}`))
  const absentBytes = absent.reduce((n, f) => n + f.bytes, 0)
  result.sound.index = { files: named.length, mb: megabytes(namedBytes), largestMb: megabytes(Math.max(0, ...named.map((f) => f.bytes))), absent: absent.length, distWithMb: megabytes(shipped + absentBytes) }
}

// The sub path: the same build under a folder two levels down, opened in live mode and played by a bot until step 1 is on show.
let sub = null
if (!a['no-subpath']) {
  const prefix = '/some/folder/'
  const empty = path.join(work, 'empty')
  fs.mkdirSync(empty, { recursive: true })
  const under = await serve(empty, { mounts: { [prefix]: dist } })
  try {
    const { browser } = await launch()
    const context = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const problems = []
    const failed = []
    const outside = []
    page.on('request', (r) => !new URL(r.url()).pathname.startsWith(prefix) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && outside.push(r.url()))
    page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
    page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
    const ts = clock()
    await page.goto(`${under.url}${prefix}?bot=skipper&quality=low`, { timeout: 120000 })
    const limit = Number(a['subpath-seconds'] ?? 900)
    let show = ''
    let flags = []
    while (seconds(ts) < limit) {
      const s = await page.evaluate(async () => {
        if (!window.showcase) return null
        await window.showcase.ready
        const info = window.showcase.info()
        return { show: info.loading ? info.loading.show : '', flags: info.standIns.map((x) => x.name) }
      }).catch((e) => {
        problems.push(String(e && e.message ? e.message : e).split('\n')[0])
        return null
      })
      if (s) {
        show = s.show
        flags = s.flags
      }
      if (show === 'step1' || problems.length) break
      await new Promise((r) => setTimeout(r, 2000))
    }
    fs.writeFileSync(path.join(work, 'sub-path.png'), await page.screenshot({ type: 'png', timeout: SHOT_MS }))
    await browser.close()
    sub = { prefix, reached: show, seconds: seconds(ts), flags, problems, failed: [...new Set(failed)], outside: [...new Set(outside)], ok: show === 'step1' && !problems.length && !failed.length && !outside.length && !flags.length }
  } finally {
    await under.close()
  }
  result.subPath = sub
}

const v = verdict({ shippedMb: result.dist.mb, largestMb: megabytes(files[0].bytes), firstLoadMb: load.state.ready ? load.mb : null, buildMinutes }, cfg.host)
result.verdict = v
result.inside = v.inside
say(`dist/ holds ${files.length} files, ${result.dist.mb} MB. The largest is ${files[0].file}, ${megabytes(files[0].bytes)} MB`)
const why = load.state.ready ? '' : String(load.state.why).split('\n').filter(Boolean)
say(load.state.ready ? `the first picture of the careers page came after ${load.files.length} files, ${load.mb} MB as they are stored (${load.compressedMb} MB with text compressed), ${took(load.secondsToReady)} in this browser` : `the built site did not get ready: ${why.slice(0, 3).join(' ')}${why.length > 3 ? ` and ${why.length - 3} more lines, all in ${rel(out)}` : ''}`)
if (load.failed.length) say(`requests that failed: ${load.failed.join(', ')}`)
if (load.missing.length) say(`asked for and not in dist/: ${load.missing.join(', ')}`)
if (load.elsewhere.length) say(`asked from another address than the site's own: ${load.elsewhere.join(', ')}`)
if (load.problems.length) say(`errors on the page: ${load.problems.join(' | ')}`)
say(`the built site ${result.opensCareersLive ? 'opens the careers page in live mode' : 'does not open the careers page in live mode cleanly'}${load.state.ready ? ` (flags reported: ${load.state.standIns.join(', ') || 'none'})` : ''}`)
say(soundFiles.length ? `sound: ${soundFiles.length} sound files in dist/audio/, ${result.sound.mb} MB: dist/ is ${result.sound.distWithoutMb} MB without them. In the first load: ${soundFirst.length ? soundFirst.map((f) => f.file).join(', ') : 'none'}` : `sound: dist/audio/ holds no sound file${files.some((f) => f.file === 'audio/index.json') ? ', only its index' : ''}, so every number here is without the sound`)
if (result.sound.index) say(`sound: the index names ${result.sound.index.files} sound files, ${result.sound.index.mb} MB, the largest ${result.sound.index.largestMb} MB; ${result.sound.index.absent} of them are not in dist/. With all of them dist/ is ${result.sound.index.distWithMb} MB against ${cfg.host.maxShippedMb} MB`)
if (sub) say(`served from ${sub.prefix} the built site ${sub.ok ? `opened in live mode and a bot played it to step 1 in ${took(sub.seconds)}` : `did not play to step 1 cleanly: reached "${sub.reached || 'the careers page'}" in ${took(sub.seconds)}${sub.problems.length ? `; errors: ${sub.problems.join(' | ')}` : ''}${sub.failed.length ? `; failed: ${sub.failed.join(', ')}` : ''}${sub.outside.length ? `; asked outside the sub path: ${sub.outside.join(', ')}` : ''}${sub.flags.length ? `; flags: ${sub.flags.join(', ')}` : ''}`}`)
for (const r of v.rows) say(`${r.name}: ${r.got === null ? 'not measured' : `${r.got} ${r.unit}`} against ${r.limit} ${r.unit}: ${r.inside ? 'inside' : 'OUTSIDE'}`)
if (!a.keep) fs.rmSync(copy, { recursive: true, force: true })
writeJson(out, result)
say(`wrote ${rel(out)} and ${rel(path.join(work, 'first-picture.png'))} in ${took(seconds(t0))}${a.keep ? `; the copy is kept in ${rel(copy)}` : ''}`)
process.exit(v.inside && result.opensCareersLive && (!sub || sub.ok) ? 0 : 2)
