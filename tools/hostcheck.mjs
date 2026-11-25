// npm run hostcheck: builds the site from a clean copy and holds its size, its largest file, its first load and its build time against the limits in host.
// The copy is what the host gets: the tracked files of HEAD without the folders of .vercelignore. --whole copies every tracked file. --keep leaves the copy.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { args, at, config, writeJson } from './lib/paths.mjs'
import { launch, machine } from './lib/browser.mjs'
import { serve } from './lib/serve.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { filesOf, firstLoad, ignoredFolders, megabytes, sentBytes, verdict } from './lib/film-host.mjs'

const a = args()
const t0 = clock()
const say = (line) => console.log(`hostcheck: ${line}`)
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
  await page.goto(`${server.url}/`)
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
  const shot = await page.screenshot({ type: 'png' })
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
result.opensCareersLive = Boolean(load.state.ready && load.state.mode === null && load.state.standIns.includes('careers-page') && !load.problems.length && !load.failed.length && !load.missing.length)

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
for (const r of v.rows) say(`${r.name}: ${r.got === null ? 'not measured' : `${r.got} ${r.unit}`} against ${r.limit} ${r.unit}: ${r.inside ? 'inside' : 'OUTSIDE'}`)
if (!a.keep) fs.rmSync(copy, { recursive: true, force: true })
writeJson(out, result)
say(`wrote ${rel(out)} and ${rel(path.join(work, 'first-picture.png'))} in ${took(seconds(t0))}${a.keep ? `; the copy is kept in ${rel(copy)}` : ''}`)
process.exit(v.inside ? 0 : 2)
