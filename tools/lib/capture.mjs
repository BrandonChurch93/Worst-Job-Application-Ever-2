// One capture session: the built site in `capture` mode, in the headless browser, driven through window.showcase.
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { at, config, readJson, writeJson } from './paths.mjs'
import { launch, machine } from './browser.mjs'
import { serve } from './serve.mjs'
import { buildInfo, buildIsCurrent, unitFolders } from './hashes.mjs'

export const formatOf = (id) => {
  const c = config()
  for (const [key, f] of Object.entries(c.formats)) if (f.id === id || key === id) return f
  throw new Error(`No format called "${id}"`)
}

// Builds the site again when the source has changed since dist/ was made, so no picture comes from a stale build.
export function ensureBuild() {
  if (buildIsCurrent(at())) return
  execFileSync('npx', ['vite', 'build'], { cwd: at(), stdio: ['ignore', 'ignore', 'inherit'] })
  if (!buildIsCurrent(at())) throw new Error('The build in dist/ does not match the source after building')
}

// `allowExtensions` limits what the page can get from WebGL to a list of names, and notes what it asked for.
export async function openSession({ format = 'hd', assets = 'full', target = null, mode = 'capture', query = '', allowExtensions = null } = {}) {
  ensureBuild()
  const server = await serve(at('dist'), { mounts: { '/assets-full/': at('assets-full') } })
  const { browser, version } = await launch()
  const f = formatOf(format)
  const context = await browser.newContext({ viewport: { width: Math.min(f.width, 1920), height: Math.min(f.height, 1080) }, deviceScaleFactor: 1 })
  if (allowExtensions) {
    await context.addInitScript((list) => {
      const allow = new Set(list)
      const asked = (window.__asked = {})
      const get = WebGL2RenderingContext.prototype.getExtension
      const all = WebGL2RenderingContext.prototype.getSupportedExtensions
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        asked[name] = allow.has(name)
        return allow.has(name) ? get.call(this, name) : null
      }
      WebGL2RenderingContext.prototype.getSupportedExtensions = function () {
        return (all.call(this) || []).filter((n) => allow.has(n))
      }
    }, allowExtensions)
  }
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`)
  })
  const url = `${server.url}/index.html?mode=${mode}&format=${f.id}&assets=${assets}${target ? `&target=${target}` : ''}${query}`
  await page.goto(url)
  try {
    await page.evaluate(() => window.showcase.ready)
  } catch (e) {
    await browser.close()
    await server.close()
    throw new Error(`The site did not start: ${e.message}\n${problems.join('\n')}`)
  }
  const info = await page.evaluate(() => window.showcase.info())
  const close = async () => {
    await browser.close()
    await server.close()
  }
  return { page, browser, version, server, problems, info, format: f, assets, close }
}

// The canvas as PNG bytes, exactly as drawn.
export async function readCanvas(page) {
  const b64 = await page.evaluate(async () => {
    const canvas = document.getElementById('stage')
    const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'))
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let s = ''
    for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768))
    return btoa(s)
  })
  return Buffer.from(b64, 'base64')
}

// What state an output was made from. An output is reused only when this matches.
export function recordFor(session, { units, tier, diagnostic, what }) {
  const info = buildInfo(at())
  const pageHashes = {}
  for (const u of units) if (info.pageHashes[u] !== undefined) pageHashes[u] = info.pageHashes[u]
  return { what, engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes, format: session.format.id, tier, assets: session.assets, diagnostic, browser: session.version, machine: machine() }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function fresh(file, record) {
  const rec = file.replace(/\.[a-z0-9]+$/i, '.json')
  if (!fs.existsSync(file) || !fs.existsSync(rec)) return false
  const old = readJson(rec)
  for (const k of Object.keys(record)) if (!same(old[k], record[k])) return false
  return true
}

export function writeRecord(file, record, extra = {}) {
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  writeJson(file.replace(/\.[a-z0-9]+$/i, '.json'), { ...record, ...extra, sha256 })
}

// Turns the command line's words into a still's spec, its units and its name.
export function stillFrom(a) {
  const c = config()
  const tier = a.tier || 'draft'
  let spec
  let name
  let unit
  if (a.key) {
    const k = c.keys.find((x) => x.id === a.key)
    if (!k) throw new Error(`No key called "${a.key}"`)
    unit = k.unit
    spec = { page: k.unit, beat: k.beat, at: k.at, camera: k.camera, tier }
    name = `key-${k.id}`
  } else if (a.id) {
    const s = c.stills.find((x) => x.id === a.id)
    if (!s) throw new Error(`No judged still called "${a.id}"`)
    unit = s.unit
    spec = { page: s.unit === 'site' ? c.film.units[0].id : s.unit, camera: s.camera, tier }
    for (const k of ['beat', 'at', 'scroll', 'interface', 'touchOnly']) if (s[k] !== undefined) spec[k] = s[k]
    name = `still-${s.id}`
  } else if (a.sheet) {
    const s = c.sheets.find((x) => x.id === a.sheet)
    if (!s) throw new Error(`No sheet called "${a.sheet}"`)
    unit = s.unit
    spec = { page: s.unit, camera: s.camera || 'sheet', tier, sheet: s.id }
    name = `sheet-${s.id}`
  } else {
    if (!a.page) throw new Error('Give --page, --key, --id or --sheet')
    unit = a.page
    spec = { page: a.page, camera: a.camera || 'home', tier }
    if (a.beat) spec.beat = a.beat
    if (a.at !== undefined) spec.at = Number(a.at)
    if (a.scroll !== undefined) spec.scroll = Number(a.scroll)
    name = [a.page, a.beat ? a.beat.replace(/\./g, '_') : 'rest', a.at !== undefined ? String(a.at).replace('.', 'p') : null, a.camera && a.camera !== 'home' ? a.camera : null].filter(Boolean).join('-')
  }
  if (a.interface) spec.interface = true
  if (a.live) spec.live = a.live
  return { spec, name, unit, units: Object.keys(unitFolders).includes(unit) ? [unit] : Object.keys(unitFolders) }
}

// Renders one still and writes it with its record. Reuses a still whose record matches.
export async function still(session, a, { force = false, dir = 'stills' } = {}) {
  const { spec, name, units } = stillFrom(a)
  const diagnostic = a.diag || 'beauty'
  const file = at('out', 'work', dir, `${a.out || name}-${session.format.id}-${spec.live ? `live-${spec.live}` : spec.tier}${diagnostic === 'beauty' ? '' : `-${diagnostic}`}.png`)
  const record = recordFor(session, { units, tier: spec.live ? `live:${spec.live}` : spec.tier, diagnostic, what: { still: spec } })
  if (!force && fresh(file, record)) return { file, reused: true, record: readJson(file.replace(/\.png$/, '.json')) }
  const t0 = process.hrtime.bigint()
  const stats = await session.page.evaluate(
    async ([s, view]) => {
      window.showcase.setDiagnostic(view)
      await window.showcase.renderStill(s)
      return window.showcase.pictureStats()
    },
    [spec, diagnostic]
  )
  const seconds = Number(process.hrtime.bigint() - t0) / 1e9
  const png = await readCanvas(session.page)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, png)
  const info = await session.page.evaluate(() => window.showcase.info())
  const extra = { seconds: Number(seconds.toFixed(3)), invalidValues: stats.invalidValues, standIns: info.standIns, counts: info.counts[spec.page], problems: [...session.problems] }
  writeRecord(file, record, extra)
  return { file, reused: false, record: { ...record, ...extra } }
}

// Renders one job, a still or a film frame, and gives back the canvas as PNG bytes.
export async function renderJob(session, job) {
  await session.page.evaluate(async (j) => {
    window.showcase.setDiagnostic(j.diag || 'beauty')
    if (j.kind === 'film') await window.showcase.renderFilmFrame(j.frame, j.tier)
    else await window.showcase.renderStill(j.spec)
  }, job)
  return readCanvas(session.page)
}
