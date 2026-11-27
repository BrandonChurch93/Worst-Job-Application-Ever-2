// The harness of look 1, node side: a vite server over tools/bosslook/, the workspace's headless browser, and one call that renders a view to PNG bytes.
import path from 'node:path'
import fs from 'node:fs'
import { createServer } from 'vite'
import { at } from './lib/paths.mjs'
import { launch } from './lib/browser.mjs'
import { buildInfoPlugin } from './lib/hashes.mjs'
import { readCanvas } from './lib/capture.mjs'

export async function openLook() {
  const root = at()
  const full = {
    name: 'bosslook-assets-full',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0])
        const i = url.indexOf('/assets-full/')
        if (i < 0) return next()
        const file = path.join(root, 'assets-full', url.slice(i + '/assets-full/'.length))
        if (!file.startsWith(path.join(root, 'assets-full')) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('not found') }
        fs.createReadStream(file).pipe(res)
      })
    }
  }
  const server = await createServer({ configFile: false, root: path.join(root, 'tools', 'bosslook'), base: './', publicDir: path.join(root, 'public'), plugins: [buildInfoPlugin(root), full], css: { modules: { localsConvention: 'camelCaseOnly' } }, server: { port: 0, host: '127.0.0.1', fs: { allow: [root] }, hmr: false }, logLevel: 'warn', appType: 'mpa' })
  await server.listen()
  const port = server.httpServer.address().port
  const { browser } = await launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const problems = []
  page.on('pageerror', (e) => problems.push(String(e && e.message ? e.message : e)))
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) problems.push(m.text()) })
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) problems.push(`${r.status()} ${r.url()}`) })
  await page.goto(`http://127.0.0.1:${port}/index.html`)
  try {
    await page.waitForFunction(() => window.bosslook !== undefined, null, { timeout: 120000 })
    await page.evaluate(() => window.bosslook.ready)
  } catch (e) {
    await browser.close()
    await server.close()
    throw new Error(`The harness did not start: ${e.message}\n${problems.join('\n')}`)
  }
  return {
    problems,
    async render(spec) {
      const stats = await page.evaluate((s) => window.bosslook.render(s), spec)
      return { png: await readCanvas(page), stats }
    },
    counts: (spec) => page.evaluate((s) => window.bosslook.counts(s), spec),
    async close() { await browser.close(); await server.close() }
  }
}

const gun = () => ({ aim: Math.PI, tell: 0, firedAt: null })

// A view by hand: the formed boss at rest, facing left as in the targets, with whatever is given laid over it.
export function viewOf(more = {}, boss = {}) {
  const base = {
    time: 10, phase: 'fight',
    boss: { x: 960, y: 548, vx: 0, vy: 0, heading: Math.PI, walked: 0, form: 1, turret: 0, locked: false, health: 1, stage: 0, shield: { glancedAt: null, half: 0.5 }, guns: [gun(), gun()], big: null, weak: null, healedAt: null, hitAt: null, beaten: 0 },
    bullets: [], darts: [], hits: [],
    corners: [0, 1, 2, 3].map((id) => ({ id, x: [84, 1836, 84, 1836][id], y: [176, 176, 996, 996][id], aim: 0, tell: 0, firedAt: null })),
    arrow: { x: 400, y: 800, flat: 0, flatAt: null }, breaks: []
  }
  return { ...base, ...more, boss: { ...base.boss, ...boss } }
}

// The camera of a target sheet: the whole frame is 1920 / K page px wide round the boss, so the hull is 590 px long in a 1920 px picture.
export const SHEET_ZOOM = 590 / 226
