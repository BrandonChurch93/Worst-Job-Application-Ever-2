// The arena alone, from hand-written views, through the site's light and finishing: builds the harness page, draws each view at 1920 by 1080, and lays each render beside its target.
// node tools/arena-shots.mjs [set ...] [--no-build] [--level low] [--samples 8]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { build } from 'vite'
import sharp from 'sharp'
import { launch } from './lib/browser.mjs'
import { serve } from './lib/serve.mjs'
import { buildInfoPlugin } from './lib/hashes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const work = path.join(root, 'out', 'work', 'arena-harness')
const shots = path.join(root, 'out', 'work', 'arena-shots')
const proof = path.join(root, 'pipeline', 'change002', 'proof', 'arena')
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const wanted = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--level', '--samples'].includes(args[i - 1])))
const level = flag('--level') ?? null
const samples = Number(flag('--samples') ?? 8)

// A blast line the way the fight makes one: from the muzzle, 275 px ahead of the boss's centre, to the edge of the screen.
function line(id, at, bx, by, aim) {
  const x0 = bx + Math.cos(aim) * 275
  const y0 = by + Math.sin(aim) * 275
  let far = Infinity
  const c = Math.cos(aim), s = Math.sin(aim)
  if (c > 1e-6) far = Math.min(far, (1920 - x0) / c)
  if (c < -1e-6) far = Math.min(far, (0 - x0) / c)
  if (s > 1e-6) far = Math.min(far, (1080 - y0) / s)
  if (s < -1e-6) far = Math.min(far, (0 - y0) / s)
  return { id, at, x0, y0, x1: x0 + c * far, y1: y0 + s * far, width: 130 }
}

const REST = 9
const first = line(1, 6.0, 900, 560, Math.atan2(700 - 560, 1920 - 900))
const second = line(2, 12.0, 1010, 520, Math.atan2(700 - 520, 60 - 1010))
const third = line(3, 18.0, 960, 500, Math.atan2(1080 - 500, 640 - 960))
const boss = { x: 960, y: 550, heading: Math.PI / 2 }
// The line of the finishing blast: the arrow's centre at the moment of firing, and the place the boss fell.
const SCORCHED = { x0: 420, y0: 640, x1: 960, y1: 650 }

// Every set: the views it draws, and the target it sits beside.
const SETS = {
  rest: { target: 'boss-arena.png', views: [{ name: 'rest', ask: { time: REST } }] },
  change: {
    target: 'boss-arena.png',
    views: [0.05, 0.35, 0.8, 1.3, 1.9].map((time) => ({ name: `change-${time.toFixed(2)}`, ask: { time } }))
  },
  breaks: {
    target: 'boss-arena-after-the-cannon.png',
    views: [
      { name: 'break-1', ask: { time: 9, breaks: [first], health: 0.82 } },
      { name: 'break-2', ask: { time: 15, breaks: [first, second], health: 0.61 } },
      { name: 'break-3', ask: { time: 21, breaks: [first, second, third], health: 0.38 } }
    ]
  },
  blast: {
    target: 'boss-arena-after-the-cannon.png',
    views: [
      { name: 'warn', ask: { time: 5.7, boss: { x: 900, y: 560, heading: Math.atan2(140, 1020) }, big: { tell: 0.8, aim: Math.atan2(140, 1020), firedAt: null, x0: first.x0, y0: first.y0, x1: first.x1, y1: first.y1, width: 130 } } },
      { name: 'blast-0.03', ask: { time: 6.03, breaks: [first], boss: { x: 900, y: 560, heading: Math.atan2(140, 1020) } } },
      { name: 'blast-0.20', ask: { time: 6.2, breaks: [first], boss: { x: 900, y: 560, heading: Math.atan2(140, 1020) } } },
      { name: 'blast-0.70', ask: { time: 6.7, breaks: [first], boss: { x: 900, y: 560, heading: Math.atan2(140, 1020) } } }
    ]
  },
  // The finish, seen as the page shows it: the cold beam over the arena, the scorch half burnt in, and the ground it leaves.
  finish: {
    target: 'finish-button-left.png',
    views: [
      { name: 'finish-0.15', ask: { time: 60.3, breaks: [first], scorch: SCORCHED, gone: 0.15, beam: true, close: true } },
      { name: 'finish-0.60', ask: { time: 61.3, breaks: [first], scorch: SCORCHED, gone: 0.6, beam: true, close: true } },
      { name: 'finish-after', ask: { time: 64, breaks: [first], scorch: SCORCHED, gone: 1, close: true } },
      { name: 'finish-wide', ask: { time: 64, breaks: [first], scorch: SCORCHED, gone: 1 } },
      { name: 'finish-beam-wide', ask: { time: 61, breaks: [first], scorch: SCORCHED, gone: 0.45, beam: true } }
    ]
  },
  none: { target: 'boss-arena.png', views: [{ name: 'none', ask: { time: -1 } }] },
  box: { target: 'boss-arena.png', views: [{ name: 'box', ask: { time: REST, boss, hits: [{ id: 1, at: REST - 0.05, x: 577, y: 380, kind: 'solid' }] } }] }
}

async function main() {
  if (!args.includes('--no-build')) {
    await build({
      configFile: false, root: path.join(root, 'src', 'arena', 'harness'), base: './', publicDir: path.join(root, 'public'), logLevel: 'warn',
      plugins: [buildInfoPlugin(root)], css: { modules: { localsConvention: 'camelCaseOnly' } },
      build: { outDir: work, emptyOutDir: true, target: 'es2022', assetsInlineLimit: 0, sourcemap: false, chunkSizeWarningLimit: 9000 }
    })
  }
  fs.mkdirSync(shots, { recursive: true })
  fs.mkdirSync(proof, { recursive: true })
  const site = await serve(work)
  const { browser } = await launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()) })
  await page.goto(`${site.url}/index.html`)
  await page.waitForFunction(() => window.arenaHarness !== undefined, null, { timeout: 60000 })
  const failed = await page.evaluate(() => window.arenaHarness.ready.then(() => null, (e) => String(e && e.stack ? e.stack : e)))
  if (failed) throw new Error(failed)
  if (args.includes('--measure')) {
    // The cost of the arena: each view drawn nine times at one sample, the first three thrown away, the median of the rest kept. `none` is the page's own ground with no arena.
    const views = [...SETS.none.views, ...SETS.rest.views, SETS.change.views[3], SETS.blast.views[2], SETS.breaks.views[2]]
    const out = {}
    for (const v of views) {
      const runs = []
      let got = null
      for (let i = 0; i < 9; i++) {
        got = await page.evaluate((ask) => window.arenaHarness.draw(ask), { ...v.ask, level: level ?? 'low', samples: 1 })
        if (i >= 3) runs.push(got.ms)
      }
      runs.sort((a, b) => a - b)
      out[v.name] = { triangles: got.triangles, drawCalls: got.drawCalls, ms: Math.round(runs[Math.floor(runs.length / 2)] * 10) / 10, least: Math.round(runs[0] * 10) / 10 }
      console.log(v.name, JSON.stringify(out[v.name]))
    }
    fs.writeFileSync(path.join(proof, `measure-${level ?? 'low'}.json`), JSON.stringify(out, null, 2) + '\n')
    await browser.close()
    await site.close()
    return
  }
  const counts = {}
  for (const name of wanted.length ? wanted : Object.keys(SETS)) {
    const set = SETS[name]
    if (!set) throw new Error(`No set called "${name}"`)
    const target = execFileSync('git', ['show', `origin/main:references/approved-002/${set.target}`], { cwd: root, maxBuffer: 1 << 28 })
    const files = []
    for (const v of set.views) {
      const got = await page.evaluate((ask) => window.arenaHarness.draw(ask), { ...v.ask, level, samples })
      const b64 = await page.evaluate(() => window.arenaHarness.png())
      const file = path.join(shots, `${v.name}${level ? `-${level}` : ''}.png`)
      fs.writeFileSync(file, Buffer.from(b64, 'base64'))
      counts[v.name] = got
      files.push(file)
      console.log(v.name, JSON.stringify(got))
    }
    await sheet(name, target, files)
  }
  fs.writeFileSync(path.join(shots, `counts${level ? `-${level}` : ''}.json`), JSON.stringify(counts, null, 2))
  await browser.close()
  await site.close()
}

// One sheet: the target on the left, the renders beside or below it, 1400 px wide at most.
async function sheet(name, target, files) {
  const W = 1400
  const gap = 8
  const cell = Math.floor((W - gap) / 2)
  const h = Math.round(cell * 1080 / 1920)
  const tiles = [await sharp(target).resize(cell, h, { fit: 'fill' }).png().toBuffer()]
  for (const f of files) tiles.push(await sharp(f).resize(cell, h).png().toBuffer())
  const rows = Math.ceil(tiles.length / 2)
  const out = sharp({ create: { width: W, height: rows * h + (rows - 1) * gap, channels: 3, background: '#0b0b0c' } })
  await out.composite(tiles.map((input, i) => ({ input, left: (i % 2) * (cell + gap), top: Math.floor(i / 2) * (h + gap) }))).png({ compressionLevel: 9 }).toFile(path.join(proof, `${name}${level ? `-${level}` : ''}.png`))
}

main().catch((e) => { console.error(e); process.exit(1) })
