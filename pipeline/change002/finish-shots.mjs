// The standing arrow and the finish, from a written script of marks, through the site's light and finishing: builds the harness page, draws each moment, and lays the renders beside the approved pictures or in strips.
// node pipeline/change002/finish-shots.mjs [job ...] [--no-build] [--level low] [--samples 8]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import sharp from 'sharp'
import { launch } from '../../tools/lib/browser.mjs'
import { serve } from '../../tools/lib/serve.mjs'
import { buildInfoPlugin } from '../../tools/lib/hashes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const work = path.join(root, 'out', 'work', 'finish-harness')
const shots = path.join(root, 'out', 'work', 'finish-shots')
const proof = path.join(root, 'pipeline', 'change002', 'proof', 'finish')
const refs = path.join(root, 'references', 'approved-002')
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const wanted = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--level', '--samples'].includes(args[i - 1])))
const level = flag('--level') ?? null
const samples = Number(flag('--samples') ?? 8)
const FPS = 60

// The script the proofs are drawn from. The fight helper owns the real marks: these stand in for them.
const ARROW = { x: 690, y: 548 }
const BOSS = { x: 960, y: 650, heading: Math.PI }
const M = { arms: 0, charge: 1.25, fire: 4.13, end: 6.26, walk: 7.7 }
const POWER = { at: 0, end: 3.4 }
const CLOSE = { x: 520, y: 370, w: 960, h: 540 }
const SPEED = 62
let BUTTON = null
let WALK = null

const smooth = (v) => { const t = Math.min(1, Math.max(0, v)); return t * t * (3 - 2 * t) }

// The whole finish at one view time.
function finish(time) {
  const input = { time, arrow: ARROW, marks: { ...M }, target: { x: BOSS.x, y: BOSS.y }, button: BUTTON, charge: Math.min(1, Math.max(0, (time - M.charge) / (M.fire - M.charge - 0.3))), shot: 1 }
  let gone = 0
  if (time >= M.fire) gone = Math.min(1, (time - M.fire - 0.14) / (M.end - M.fire - 0.14))
  if (WALK) {
    const long = WALK.far / SPEED + 0.6
    const u = (time - M.walk) / long
    // It sets off slowly and comes to rest slowly.
    const share = u <= 0 ? 0 : u >= 1 ? 1 : smooth(smooth(u) * 0.5 + u * 0.5)
    const pace = u <= 0 || u >= 1 ? 0 : Math.min(1, Math.min(u, 1 - u) * long / 0.35)
    input.walk = { x: WALK.x0 + (WALK.x1 - WALK.x0) * share, y: WALK.y0 + (WALK.y1 - WALK.y0) * share, walked: WALK.far * share, pace }
    input.marks.kneel = M.walk + long + 0.25
    input.marks.fist = input.marks.kneel + 1.75
    input.marks.press = input.marks.fist + 1.15
  }
  return { input, boss: { ...BOSS, gone: Math.max(0, gone) }, cam: CLOSE }
}
const power = (time) => ({ input: { time, arrow: ARROW, power: POWER }, cam: CLOSE, arrow: true })

// Frames in a row: every frame for the first twelve, then every second.
const row = (from, count) => { const out = []; for (let i = 0; i < count; i++) out.push(from + (i < 12 ? i : 12 + (i - 12) * 2) / FPS); return out }

const JOBS = {
  // The three poses seen at a right angle to the figure's own plane, beside the pose sheet.
  poses: async (page) => {
    const asks = [
      { name: 'pose-power', ...power(2.9), cam: 'front', arena: false },
      { name: 'pose-charge', ...finish(3.9), cam: 'front', arena: false, boss: null },
      { name: 'pose-fire', ...finish(5.2), cam: 'front', arena: false, boss: null }
    ]
    const tiles = []
    for (const a of asks) tiles.push(await sharp(await shot(page, a)).extract({ left: 660, top: 290, width: 600, height: 500 }).png().toBuffer())
    await beside('poses', path.join(refs, 'finish-poses.png'), tiles, 3)
    // The same three as the film sees them, from straight above.
    const above = []
    for (const a of asks) above.push(await sharp(await shot(page, { ...a, name: a.name + '-above', cam: { x: ARROW.x - 110, y: ARROW.y - 60, w: 320, h: 180 }, arena: true })).resize(640, 360).png().toBuffer())
    await strip('poses-above', above, 3)
  },
  // One pose at two rises, with its shadow: at film size and at three times.
  rise: async (page) => {
    const tiles = []
    for (const deg of [40, 60]) {
      const rise = (deg * Math.PI) / 180
      const base = { ...finish(1.15), rise, boss: null }
      const film = await shot(page, { ...base, name: `rise-${deg}-film`, cam: null })
      tiles.push(await sharp(film).extract({ left: 320, top: 310, width: 640, height: 480 }).png().toBuffer())
      const near = await shot(page, { ...base, name: `rise-${deg}-x3`, cam: { x: ARROW.x - 300, y: ARROW.y - 130, w: 640, h: 360 } })
      tiles.push(await sharp(near).extract({ left: 480, top: 60, width: 960, height: 720 }).resize(640, 480).png().toBuffer())
      const pw = await shot(page, { ...power(2.9), rise, name: `rise-${deg}-power-x3`, cam: { x: ARROW.x - 300, y: ARROW.y - 130, w: 640, h: 360 } })
      tiles.push(await sharp(pw).extract({ left: 480, top: 60, width: 960, height: 720 }).resize(640, 480).png().toBuffer())
    }
    await strip('rise-40-60', tiles, 3)
  },
  charge: async (page) => { await beside('charge', path.join(refs, 'finish-charge.png'), [await shot(page, { name: 'charge', ...finish(3.95) })], 1) },
  blast: async (page) => { await beside('blast', path.join(refs, 'finish-blast.png'), [await shot(page, { name: 'blast', ...finish(5.3) })], 1) },
  after: async (page) => { await beside('after', path.join(refs, 'finish-button-left.png'), [await shot(page, { name: 'after', ...finish(7.3) })], 1) },
  getup: (page) => frames(page, 'getup', row(-1 / FPS, 34), finish, { x: ARROW.x - 100, y: ARROW.y - 60, w: 240, h: 200 }),
  powerup: (page) => frames(page, 'powerup', row(0.9, 34), power, { x: ARROW.x - 100, y: ARROW.y - 60, w: 240, h: 200 }),
  liedown: (page) => frames(page, 'liedown', row(POWER.end - 2 / FPS, 44), power, { x: ARROW.x - 100, y: ARROW.y - 60, w: 240, h: 200 }),
  fire: (page) => frames(page, 'fire', row(M.fire - 2 / FPS, 30), finish, { x: ARROW.x - 130, y: ARROW.y - 40, w: 420, h: 200 }),
  knees: (page) => { const k = finish(M.walk + 1).input.marks.kneel; return frames(page, 'knees', row(k - 2 / FPS, 34), finish, kneelBox()) },
  blow: (page) => { const p = finish(M.walk + 1).input.marks.press; return frames(page, 'blow', row(p - 22 / FPS, 36), finish, kneelBox()) },
  walk: (page) => frames(page, 'walk', row(M.walk, 40).map((t, i) => M.walk + i * 4 / FPS), finish, { x: ARROW.x - 110, y: ARROW.y - 40, w: 420, h: 200 })
}
const kneelBox = () => ({ x: WALK.x1 - 90, y: WALK.y1 - 150, w: 240, h: 200 })

let counts = {}
async function shot(page, { name, ...ask }) {
  const got = await page.evaluate((a) => window.finishHarness.draw(a), { ...ask, level, samples: ask.samples ?? samples })
  const b64 = await page.evaluate(() => window.finishHarness.png())
  const file = path.join(shots, `${name}${level ? `-${level}` : ''}.png`)
  fs.writeFileSync(file, Buffer.from(b64, 'base64'))
  counts[name] = got
  console.log(name, JSON.stringify(got))
  return file
}

// A strip of one move: each frame cut to a box of the page, seen at four times its size on the page.
async function frames(page, name, times, script, box) {
  const scale = 3
  const view = { x: box.x + box.w / 2 - 320, y: box.y + box.h / 2 - 180, w: 640, h: 360 }
  const tiles = []
  for (let i = 0; i < times.length; i++) {
    const a = script(times[i])
    const file = await shot(page, { ...a, name: `${name}-${String(i).padStart(2, '0')}`, cam: view, samples: Math.min(samples, 3) })
    tiles.push(await sharp(file).extract({ left: Math.round(960 - box.w * scale / 2), top: Math.round(540 - box.h * scale / 2), width: box.w * scale, height: box.h * scale }).resize(Math.round(box.w * 1.2), Math.round(box.h * 1.2)).png().toBuffer())
  }
  await strip(name, tiles, Math.min(tiles.length, Math.max(4, Math.floor(1900 / (box.w * 1.2 + 4)))))
}

async function strip(name, tiles, per) {
  const gap = 4
  const m = await sharp(tiles[0]).metadata()
  const rows = Math.ceil(tiles.length / per)
  const out = sharp({ create: { width: per * m.width + (per - 1) * gap, height: rows * m.height + (rows - 1) * gap, channels: 3, background: '#0b0b0c' } })
  await out.composite(tiles.map((input, i) => ({ input, left: (i % per) * (m.width + gap), top: Math.floor(i / per) * (m.height + gap) }))).png({ compressionLevel: 9 }).toFile(path.join(proof, `${name}${level ? `-${level}` : ''}.png`))
}

// The approved picture above, the renders below it: 1200 px wide.
async function beside(name, target, files, per) {
  const W = 1200
  const gap = 6
  const top = await sharp(target).resize(W).png().toBuffer()
  const th = (await sharp(top).metadata()).height
  const cell = Math.floor((W - gap * (per - 1)) / per)
  const tiles = []
  for (const f of files) tiles.push(await sharp(f).resize(cell).png().toBuffer())
  const h = (await sharp(tiles[0]).metadata()).height
  const out = sharp({ create: { width: W, height: th + gap + h, channels: 3, background: '#0b0b0c' } })
  await out.composite([{ input: top, left: 0, top: 0 }, ...tiles.map((input, i) => ({ input, left: i * (cell + gap), top: th + gap }))]).png({ compressionLevel: 9 }).toFile(path.join(proof, `${name}${level ? `-${level}` : ''}.png`))
}

async function main() {
  if (!args.includes('--no-build')) {
    await build({
      configFile: false, root: path.join(root, 'src', 'cursor', 'stand', 'harness'), base: './', publicDir: path.join(root, 'public'), logLevel: 'warn',
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
  await page.waitForFunction(() => window.finishHarness !== undefined, null, { timeout: 60000 })
  const failed = await page.evaluate(() => window.finishHarness.ready.then(() => null, (e) => String(e && e.stack ? e.stack : e)))
  if (failed) throw new Error(failed)
  const b = await page.evaluate(([boss, arrow]) => window.finishHarness.button(boss, arrow), [BOSS, ARROW])
  BUTTON = { x: b.x, y: b.y, w: b.w, h: b.h, top: b.top }
  const start = await page.evaluate((a) => window.finishHarness.draw(a).then(() => null), { ...finish(M.walk - 0.01), samples: 1 })
  void start
  const feet = { x: ARROW.x + 17.3 - 38, y: ARROW.y + 91.8 }
  WALK = { x0: feet.x, y0: feet.y, x1: b.kneel.x, y1: b.kneel.y, far: Math.hypot(b.kneel.x - feet.x, b.kneel.y - feet.y) }
  console.log('button', JSON.stringify(b), 'walk', JSON.stringify(WALK))
  for (const name of wanted.length ? wanted : Object.keys(JOBS)) {
    if (!JOBS[name]) throw new Error(`No job called "${name}"`)
    await JOBS[name](page)
  }
  fs.writeFileSync(path.join(shots, `counts${level ? `-${level}` : ''}.json`), JSON.stringify(counts, null, 2))
  await browser.close()
  await site.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
