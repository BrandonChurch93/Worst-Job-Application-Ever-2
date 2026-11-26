// The interface on the wired site, measured in a browser: node src/ui/looks.mjs [keys] [bar] [ink] [motion] [touch]. Asked for by name only: history, probe.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createServer, preview } from 'vite'
import { launch } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const out = path.join(root, 'out/work/stills')
fs.mkdirSync(out, { recursive: true })
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const wants = (name) => only.length === 0 || only.includes(name)
const server = await createServer({ root, configFile: root + '/vite.config.ts', server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const { browser } = await launch()
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail })
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `: ${detail}` : ''}`)
}
const open = async (q, o = {}, base = 'http://localhost:5199/') => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...o })
  const page = await ctx.newPage()
  page.errors = []
  page.asked = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()) })
  page.on('request', (r) => page.asked.push(r.url()))
  await page.goto(`${base}${q}`)
  await page.waitForFunction(() => document.querySelector('#controls')?.children.length > 0 || !document.getElementById('fail').hidden, null, { timeout: 180000 })
  return page
}
const focus = (page) => page.evaluate(() => {
  const a = document.activeElement
  return a === document.body ? 'body' : `${a.tagName.toLowerCase()}:${a.getAttribute('aria-label') ?? a.textContent}`
})
const shown = (page) => page.evaluate(() => [...document.querySelectorAll('#controls button, #controls a, #controls input')].filter((e) => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map((e) => `${e.tagName.toLowerCase()}:${e.getAttribute('aria-label') ?? e.textContent}`))
const state = (page) => page.evaluate(() => {
  const r = document.querySelector('#controls [data-mode]')
  return r ? { mode: r.dataset.mode, backing: r.dataset.backing, row: r.dataset.row, search: location.search } : null
})
const tabs = async (page, n) => {
  const order = []
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab')
    order.push(await focus(page))
  }
  return order
}
const ring = (page) => page.evaluate(() => {
  const s = getComputedStyle(document.activeElement)
  return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`
})
const lum = (r, g, b) => {
  const f = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
// The contrast of the ink of one control against what lies behind it, read off the pixels of a picture of the window.
const inkOf = async (png, box) => {
  const left = Math.floor(box.x)
  const top = Math.floor(box.y)
  const { data, info } = await sharp(png).extract({ left, top, width: Math.ceil(box.width), height: Math.ceil(box.height) }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const ls = []
  for (let i = 0; i < data.length; i += info.channels) ls.push(lum(data[i], data[i + 1], data[i + 2]))
  const sorted = [...ls].sort((a, b) => a - b)
  const ground = sorted[Math.floor(sorted.length / 2)]
  const dark = sorted[Math.floor(sorted.length * 0.01)]
  const pale = sorted[Math.floor(sorted.length * 0.99)]
  const ink = Math.abs(dark - ground) > Math.abs(pale - ground) ? dark : pale
  const ratio = (Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05)
  return { ratio: Math.round(ratio * 100) / 100, ground: Math.round(ground * 1000) / 1000, ink: Math.round(ink * 1000) / 1000 }
}
const measure = async (page, name, wanted) => {
  await page.mouse.move(5, page.viewportSize().height - 5)
  await page.waitForTimeout(400)
  const png = await page.screenshot()
  fs.writeFileSync(path.join(out, `looks-ink-${name}.png`), png)
  const s = await state(page)
  const found = []
  for (const sel of ['#controls a', '#controls button[aria-label="Sound"]', '#controls button:not([aria-label])']) {
    const el = page.locator(sel).first()
    if (!(await el.count()) || !(await el.isVisible())) continue
    const box = await el.boundingBox()
    const what = await el.evaluate((e) => e.getAttribute('aria-label') ?? e.textContent)
    found.push({ what, ...(await inkOf(png, box)) })
  }
  const low = Math.min(...found.map((f) => f.ratio))
  check(`ink ${name}: the row is ${wanted.row ?? 'strip'} on ${wanted.backing}, and every control's ink stands at least 4.5 to 1 against its ground`, s.backing === wanted.backing && (wanted.row ?? 'strip') === s.row && found.length > 0 && low >= 4.5, `${JSON.stringify(s)} ${found.map((f) => `${f.what} ${f.ratio} to 1 (ink ${f.ink}, ground ${f.ground})`).join('; ')}`)
}
const waitDark = (page) => page.waitForFunction(() => document.querySelector('#controls [data-mode]')?.dataset.backing === 'dark', null, { timeout: 240000 })

if (wants('keys')) {
  const page = await open('')
  await page.waitForTimeout(2500)
  const controls = await shown(page)
  const order = await tabs(page, controls.length + 1)
  check('keys, careers page: Tab goes through the controls in their order and then to the picture', order.slice(0, -1).join('|') === controls.join('|') && order.at(-1) === 'canvas:', order.join(' | '))
  await page.keyboard.press('Shift+Tab')
  const on = await focus(page)
  const paper = await ring(page)
  await page.screenshot({ path: path.join(out, 'looks-ring-paper.png') })
  check('keys, careers page: the film link has a 2 px ring on the paper', on.startsWith('a:Watch') && paper.startsWith('solid 2px'), `${on} ${paper}`)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'film', null, { timeout: 60000 }).catch(() => {})
  check('keys: Enter on the film link opens the film', (await state(page)).mode === 'film', JSON.stringify(await state(page)))
  await page.waitForTimeout(800)
  const bar = await shown(page)
  const inBar = await tabs(page, bar.length)
  check('keys, film: Tab goes through the bar in its order', [...inBar].sort().join('|') === [...bar].sort().join('|'), `${inBar.join(' | ')} against ${bar.join(' | ')}`)
  await page.locator('#controls button[aria-label="Back to the application"]').focus()
  await page.keyboard.press('Space')
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'live', null, { timeout: 60000 }).catch(() => {})
  check('keys: Space on the back control returns to the live site', (await state(page)).mode === 'live', JSON.stringify(await state(page)))
  await page.waitForTimeout(800)
  await page.locator('#controls a').focus()
  await page.keyboard.press('Space')
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'film', null, { timeout: 20000 }).catch(() => {})
  check('keys: Space on the film link opens the film as Enter does', (await state(page)).mode === 'film', JSON.stringify(await state(page)))
  check('keys, careers page and film: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()

  const table = await open('?step=3&bot=keen')
  await waitDark(table).catch(() => {})
  const first = await tabs(table, 1)
  const dark = await ring(table)
  await table.screenshot({ path: path.join(out, 'looks-ring-table.png') })
  check('keys, step 3: over the dark table the first control has a 2 px ring', (await state(table)).backing === 'dark' && dark.startsWith('solid 2px'), `${first[0]} ${dark} ${JSON.stringify(await state(table))}`)
  await table.context().close()

  const step = await open('?step=1')
  const t = process.hrtime.bigint()
  await step.waitForFunction(() => [...document.querySelectorAll('#controls button')].some((b) => b.offsetParent && b.textContent.startsWith('Skip')), null, { timeout: 240000 }).catch(() => {})
  const waited = Number((process.hrtime.bigint() - t) / 1000000000n)
  const withSkip = await shown(step)
  const order1 = await tabs(step, withSkip.length + 1)
  check('keys, step 1: the order is sound, film link, skip link, picture', order1.slice(0, -1).join('|') === withSkip.join('|') && order1.at(-1) === 'canvas:' && order1.at(-2).startsWith('button:Skip') && order1.at(-3).startsWith('a:Watch'), `${order1.join(' | ')} after ${waited} s`)
  await step.keyboard.press('Shift+Tab')
  await step.screenshot({ path: path.join(out, 'looks-ring-skip.png') })
  await step.keyboard.press('Space')
  await step.waitForFunction(() => document.querySelector('#controls [role="status"]')?.textContent.includes('Step 2'), null, { timeout: 120000 }).catch(() => {})
  const said = await step.evaluate(() => document.querySelector('#controls [role="status"]')?.textContent ?? '')
  check('keys, step 1: Space on the skip link ends the step and the live region says the next heading', said.includes('Step 2'), said.slice(0, 120))
  check('keys, step 1: no error on the page', step.errors.length === 0, step.errors.slice(0, 3).join(' | '))
  await step.context().close()
}

if (wants('bar')) {
  for (const size of [{ width: 1280, height: 720 }, { width: 3840, height: 2160 }]) {
    const page = await open('?mode=film', { viewport: size })
    await page.waitForTimeout(3000)
    await page.mouse.move(size.width / 2, size.height / 2)
    await page.waitForTimeout(300)
    const place = () => page.evaluate(() => {
      const c = document.getElementById('stage').getBoundingClientRect()
      const b = document.querySelector('#controls input').parentElement.getBoundingClientRect()
      const r = document.querySelector('#controls [data-mode]')
      const input = document.querySelector('#controls input')
      return { picture: [c.left, c.top, c.width, c.height].map(Math.round), bar: [b.left, b.top, b.width, b.height].map(Math.round), playing: r.dataset.playing, at: input.value, of: input.max, time: document.querySelector('#controls [class*="time"]')?.getAttribute('aria-label') ?? document.querySelector('#controls [class*="time"]')?.textContent }
    })
    const a = await place()
    await page.screenshot({ path: path.join(out, `looks-bar-${size.width}.png`) })
    check(`bar ${size.width} by ${size.height}: the bar is 56 px high, below the picture, inside the window`, a.bar[3] === 56 && a.bar[1] >= a.picture[1] + a.picture[3] && a.bar[1] + a.bar[3] <= size.height, JSON.stringify(a))
    await page.locator('#controls input').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(2500)
    await page.mouse.move(size.width / 2, size.height / 2 + 3)
    await page.waitForTimeout(300)
    const e = await place()
    await page.screenshot({ path: path.join(out, `looks-bar-${size.width}-ended.png`) })
    check(`bar ${size.width} by ${size.height}: at its end the film stands, the control shows play and the bar keeps its place`, e.playing === 'false' && Number(e.at) >= Number(e.of) - 0.11 && e.bar.join() === a.bar.join(), JSON.stringify(e))
    check(`bar ${size.width} by ${size.height}: no error on the page`, page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
    await page.context().close()
  }
}

if (wants('ink')) {
  const big = { viewport: { width: 1920, height: 1080 } }
  const page = await open('', big)
  await page.waitForTimeout(2500)
  await measure(page, 'page', { backing: 'page' })
  const box = await page.locator('#controls a').boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(2500)
  await measure(page, 'pale-capsule', { backing: 'light' })
  await page.context().close()
  const table = await open('?step=3&bot=keen', big)
  await waitDark(table).catch(() => {})
  await measure(table, 'dark-capsule', { backing: 'dark' })
  await table.context().close()
  const tall = await open('', { viewport: { width: 520, height: 900 } })
  await tall.waitForTimeout(2500)
  await measure(tall, 'above-the-picture', { backing: 'page', row: 'above' })
  await tall.context().close()
  const low = await open('', { viewport: { width: 700, height: 380 } })
  await low.waitForTimeout(2500)
  await measure(low, 'small-capsule', { backing: 'light', row: 'over' })
  await low.context().close()
}

if (wants('motion')) {
  const page = await open('', { reducedMotion: 'reduce' })
  await page.waitForTimeout(2000)
  const a = await state(page)
  const at = await page.evaluate(() => document.querySelector('#controls input').value)
  await page.waitForTimeout(1500)
  const later = await page.evaluate(() => document.querySelector('#controls input').value)
  check('less motion: the visitor gets the film, standing at 0 until he plays it', a.mode === 'film' && at === '0' && later === '0', `${JSON.stringify(a)} at ${at}, 1.5 s later ${later}`)
  await page.screenshot({ path: path.join(out, 'looks-motion-film.png') })
  await page.locator('#controls button[aria-label="Back to the application"]').click()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'live', null, { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2500)
  const b = await state(page)
  const controls = await shown(page)
  await page.screenshot({ path: path.join(out, 'looks-motion-live.png') })
  check('less motion: the back control still leads to the live site, with its film link', b.mode === 'live' && controls.some((c) => c.startsWith('a:Watch')), `${JSON.stringify(b)} ${controls.join(' | ')}`)
  check('less motion: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
  const asked = await open('?mode=live', { reducedMotion: 'reduce' })
  await asked.waitForTimeout(1500)
  check('less motion: the address ?mode=live gives the live site', (await state(asked)).mode === 'live', JSON.stringify(await state(asked)))
  await asked.context().close()
}

if (wants('touch')) {
  const phone = { hasTouch: true, isMobile: true, viewport: { width: 390, height: 780 } }
  const kinds = (urls, base) => {
    const paths = urls.filter((u) => !u.startsWith('data:')).map((u) => u.replace(base, '/').replace(/\?.*$/, ''))
    return {
      paths,
      pages: paths.filter((p) => /\/src\/pages\//.test(p)),
      sounds: paths.filter((p) => /\.(mp3|ogg|wav|m4a|opus)$/.test(p) || /\/(audio|sounds?)\//.test(p)),
      assets: paths.filter((p) => /\.(glb|gltf|ktx2|bin|hdr|exr|png|jpe?g|webp|avif|mp4|webm)$/.test(p)),
      foreign: urls.filter((u) => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:'))
    }
  }
  const run = async (name, base) => {
    const page = await open('', phone, base)
    await page.waitForTimeout(3000)
    const text = await page.evaluate(() => document.querySelector('#controls main')?.innerText ?? '')
    const links = await page.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')))
    const k = kinds(page.asked, base)
    console.log(`touch, ${name}: ${k.paths.length} requests`)
    for (const p of k.paths) console.log(`  ${p}`)
    await page.screenshot({ path: path.join(out, `looks-touch-${name}.png`) })
    check(`touch, ${name}: the message stands in place of the site`, text.includes("We're sorry.") && (await page.evaluate(() => document.getElementById('stage').hidden)), text.replace(/\n+/g, ' / '))
    check(`touch, ${name}: no page module, no asset and no sound is asked for`, k.pages.length === 0 && k.sounds.length === 0 && k.assets.length === 0 && k.foreign.length === 0, `${k.paths.length} requests: ${k.pages.length} page modules, ${k.assets.length} assets, ${k.sounds.length} sounds, ${k.foreign.length} from elsewhere`)
    check(`touch, ${name}: with no address in links.portfolioWork no link is drawn`, links.length === 0, `links: ${JSON.stringify(links)}`)
    check(`touch, ${name}: no error on the page`, page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
    await page.context().close()
  }
  await run('source', 'http://localhost:5199/')
  if (fs.existsSync(path.join(root, 'dist/index.html'))) {
    const built = await preview({ root, configFile: root + '/vite.config.ts', preview: { port: 5200 }, logLevel: 'error' })
    await run('built', 'http://localhost:5200/')
    const sizes = fs.readdirSync(path.join(root, 'dist/bundle')).map((f) => `${f} ${fs.statSync(path.join(root, 'dist/bundle', f)).size}`)
    console.log(`dist/bundle: ${sizes.join(', ')}`)
    await new Promise((done) => built.httpServer.close(done))
  } else console.log('touch, built: no dist, run npm run build first')
}

if (only.includes('history')) {
  const page = await open('')
  await page.waitForTimeout(2000)
  const trail = []
  const note = async (what) => {
    const s = await state(page)
    trail.push(`${what}: ${s.mode} "${s.search}"`)
    return s
  }
  await note('opened')
  await page.locator('#controls a').click()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'film', null, { timeout: 60000 }).catch(() => {})
  const film = await note('film link')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'live', null, { timeout: 60000 }).catch(() => {})
  const back = await note('browser back')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'film', null, { timeout: 60000 }).catch(() => {})
  const forward = await note('browser forward')
  await page.locator('#controls button[aria-label="Back to the application"]').click()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'live', null, { timeout: 60000 }).catch(() => {})
  const control = await note('back control')
  await page.goBack()
  await page.waitForFunction(() => document.querySelector('#controls [data-mode]').dataset.mode === 'film', null, { timeout: 60000 }).catch(() => {})
  const again = await note('browser back again')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'looks-history.png') })
  const loads = page.asked.filter((u) => /\/(index\.html)?(\?[^/]*)?$/.test(u.replace('http://localhost:5199', ''))).length
  check('history: the film link, the browser\'s back and forward and the back control each change the mode and the address together, without a new load of the page', film.mode === 'film' && film.search.includes('mode=film') && back.mode === 'live' && !back.search.includes('mode=film') && forward.mode === 'film' && forward.search.includes('mode=film') && control.mode === 'live' && !control.search.includes('mode=film') && again.mode === 'film' && loads === 1, `${trail.join('; ')}; the page was loaded ${loads} time`)
  check('history: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}

if (only.includes('probe')) {
  const page = await open('?mode=probe')
  const t = process.hrtime.bigint()
  const seen = new Set()
  const done = () => page.evaluate(() => (document.querySelector('#controls pre')?.textContent.length ?? 0) > 0 && !document.querySelector('#controls section').hidden)
  while (!(await done()) && Number((process.hrtime.bigint() - t) / 1000000000n) < 1500) {
    const now = await page.evaluate(() => document.querySelector('#controls [role="status"]')?.textContent ?? document.querySelector('#controls')?.innerText ?? '')
    for (const line of now.split('\n')) if (line.trim()) seen.add(line.trim())
    await page.waitForTimeout(1000)
  }
  const seconds = Number((process.hrtime.bigint() - t) / 1000000000n)
  const text = await page.evaluate(() => document.querySelector('#controls pre')?.textContent ?? '')
  console.log(`probe, said while it ran: ${[...seen].join(' | ')}`)
  console.log(text)
  fs.writeFileSync(path.join(out, 'looks-probe.txt'), text)
  await page.screenshot({ path: path.join(out, 'looks-probe.png') })
  check('probe at 1280 by 720: it runs to its end and gives its block of text', /The site would pick: \w+/.test(text), `${seconds} s, ${text.split('\n').length} lines`)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  const copy = page.locator('#controls button', { hasText: 'Copy' }).first()
  await copy.click()
  await page.waitForTimeout(500)
  const label = await copy.evaluate((e) => e.getAttribute('aria-label') ?? e.textContent)
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => `not readable: ${e}`)
  await page.screenshot({ path: path.join(out, 'looks-probe-copied.png') })
  check('probe: Copy puts the block on the clipboard and says so', clip === text && label === 'Copied', `the control reads "${label}", the clipboard holds ${clip === text ? 'the same text' : clip.slice(0, 80)}`)
  check('probe: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}

await browser.close()
await server.close()
const bad = results.filter((r) => !r.ok)
console.log(`${results.length - bad.length} of ${results.length} checks hold`)
process.exit(bad.length ? 1 : 0)
