// A visitor's real mouse on the site, in a browser: node src/ui/hands.mjs
// 1. Both mouse buttons on the table of step 3 (stepped site). 2. A press made while the arrow is still on its way (stepped site).
// 3. The row of controls over the pages at two window sizes, and a real click on the film link (wired site). 4. The system cursor over the picture and over a control.
// 5. Both mouse buttons in the band beside the picture on step 3 (stepped site). 6. A real click on the skip link once it is offered (wired site).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { launch } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const out = path.join(root, 'out/work/stills')
fs.mkdirSync(out, { recursive: true })
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const wants = (name) => only.length === 0 || only.includes(name)
const server = await createServer({ root, configFile: root + '/vite.config.ts', server: { port: 5197 }, logLevel: 'error' })
await server.listen()
const { browser } = await launch()
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail })
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `: ${detail}` : ''}`)
}
const open = async (q, size, ready) => {
  const ctx = await browser.newContext({ viewport: size })
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()) })
  await page.goto(`http://localhost:5197/${q}`)
  await page.waitForFunction(ready, null, { timeout: 180000 })
  return page
}
const stepped = (page) => !!window.liveRun
const wired = () => document.querySelector('#controls')?.children.length > 0
const rect = (page) => page.evaluate(() => {
  const r = document.getElementById('stage').getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
})
const toClient = (r, p, scroll = 0) => ({ x: r.left + (p.x / 1920) * r.width, y: r.top + ((p.y - scroll) / 1080) * r.height })
const told = (page) => page.evaluate(() => window.liveRun.told())
const advance = (page, seconds) => page.evaluate((s) => { window.liveRun.advance(s, true) }, seconds)
const save = async (page, name) => {
  const png = await page.evaluate(() => window.liveRun.state().png)
  fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(png.split(',')[1], 'base64'))
}

if (wants('chord')) {
  const page = await open('?clock=steps&step=3', { width: 1280, height: 720 }, stepped)
  const r = await rect(page)
  let t = await told(page)
  for (let i = 0; i < 900 && !(t.hint && (t.hint.flipLeft || t.hint.flipRight)); i++) {
    const c = toClient(r, t.hint ?? { x: 960, y: 540 + t.scroll }, t.scroll)
    await page.mouse.move(c.x, c.y)
    await advance(page, 0.1)
    t = await told(page)
  }
  check('step 3: the table is in play and asks for a flipper', !!t.hint && (t.hint.flipLeft || t.hint.flipRight), `page ${t.page} at ${t.pageTime.toFixed(1)} s`)
  const c = toClient(r, t.hint, t.scroll)
  await page.mouse.move(c.x, c.y)
  const stepOn = async (name) => {
    await advance(page, 0.2)
    await save(page, `hands-chord-${name}`)
  }
  await stepOn('0-none')
  await page.mouse.down({ button: 'left' })
  await stepOn('1-left')
  await page.mouse.down({ button: 'right' })
  await stepOn('2-both')
  await page.mouse.up({ button: 'left' })
  await stepOn('3-right')
  await page.mouse.up({ button: 'right' })
  await stepOn('4-none')
  check('step 3: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}

if (wants('press')) {
  const page = await open('?clock=steps', { width: 1280, height: 720 }, stepped)
  const r = await rect(page)
  let t = await told(page)
  let last = t.hint
  for (let i = 0; i < 400; i++) {
    const c = toClient(r, t.hint)
    await page.mouse.move(c.x, c.y)
    await advance(page, 0.1)
    t = await told(page)
    if (t.hint.x === last.x && t.hint.y === last.y && t.hint.down) break
    last = t.hint
  }
  const far = toClient(r, { x: 1500, y: 950 })
  await page.mouse.move(far.x, far.y)
  await advance(page, 1.5)
  t = await told(page)
  const goal = toClient(r, t.hint)
  await page.mouse.move(goal.x, goal.y)
  await advance(page, 0.03)
  const before = await told(page)
  const gap = Math.hypot(before.hero.x - before.hint.x, before.hero.y - before.hint.y)
  await page.mouse.down()
  await advance(page, 0.05)
  await page.mouse.up()
  await save(page, 'hands-press-on-the-way')
  await advance(page, 2)
  const after = await told(page)
  check('careers page: a press made with the arrow still on its way lands where the arrow is, not where the mouse is', gap > 22 && after.page === 'marketing' && !after.turning, `the mouse stood on Apply at ${Math.round(before.hint.x)}, ${Math.round(before.hint.y)}, the arrow ${gap.toFixed(0)} px from it at the press; 2 s later the page is ${after.page}, turning ${after.turning}`)
  await page.mouse.down()
  await advance(page, 0.05)
  await page.mouse.up()
  await advance(page, 3)
  const then = await told(page)
  check('careers page: the same press with the arrow arrived applies', then.page === 'step1' || then.turning, `page ${then.page}, turning ${then.turning}`)
  await page.context().close()
}

if (wants('row')) {
  for (const size of [{ width: 1920, height: 1080 }, { width: 520, height: 900 }, { width: 700, height: 380 }]) {
    const page = await open('', size, wired)
    await page.waitForTimeout(2500)
    const place = await page.evaluate(() => {
      const c = document.getElementById('stage').getBoundingClientRect()
      const u = c.width / 1920
      const box = (e) => {
        const b = e.getBoundingClientRect()
        return { what: e.getAttribute('aria-label') ?? e.textContent, client: [b.left, b.top, b.right, b.bottom].map(Math.round), page: [(b.left - c.left) / u, (b.top - c.top) / u, (b.right - c.left) / u, (b.bottom - c.top) / u].map(Math.round) }
      }
      return { row: document.querySelector('#controls > div').dataset.row, canvas: [c.left, c.top, c.width, c.height].map(Math.round), controls: [...document.querySelectorAll('#controls button, #controls a')].filter((e) => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(box) }
    })
    console.log(`${size.width} by ${size.height}: ${JSON.stringify(place)}`)
    await page.screenshot({ path: path.join(out, `hands-row-${size.width}.png`) })
    const link = place.controls.find((c) => c.what.startsWith('Watch'))
    await page.mouse.move((link.client[0] + link.client[2]) / 2, (link.client[1] + link.client[3]) / 2)
    const cursor = await page.evaluate(([x, y]) => {
      const over = document.elementFromPoint(x, y).closest('a, button, canvas')
      return { over: over.tagName, cursor: getComputedStyle(over).cursor, picture: getComputedStyle(document.getElementById('stage')).cursor }
    }, [(link.client[0] + link.client[2]) / 2, (link.client[1] + link.client[3]) / 2])
    check(`${size.width} by ${size.height}: the system cursor is hidden over the picture and shown over the film link`, cursor.picture === 'none' && cursor.cursor === 'pointer' && cursor.over === 'A', JSON.stringify(cursor))
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForFunction(() => document.querySelector('#controls > div')?.dataset.mode === 'film', null, { timeout: 60000 }).catch(() => {})
    const mode = await page.evaluate(() => `${document.querySelector('#controls > div')?.dataset.mode} ${location.search}`)
    check(`${size.width} by ${size.height}: a real click on the film link opens the film`, mode.startsWith('film') && mode.includes('mode=film'), mode)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(out, `hands-film-${size.width}.png`) })
    check(`${size.width} by ${size.height}: no error on the page`, page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
    await page.context().close()
  }
}

if (wants('band')) {
  const page = await open('?clock=steps&step=3', { width: 1700, height: 720 }, stepped)
  const r = await rect(page)
  let t = await told(page)
  for (let i = 0; i < 900 && !(t.hint && (t.hint.flipLeft || t.hint.flipRight)); i++) {
    const c = toClient(r, t.hint ?? { x: 960, y: 540 + t.scroll }, t.scroll)
    await page.mouse.move(c.x, c.y)
    await advance(page, 0.1)
    t = await told(page)
  }
  const beside = { x: Math.round(r.left / 2), y: 400 }
  await page.mouse.move(beside.x, beside.y)
  const under = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).tagName, [beside.x, beside.y])
  check('step 3: the mouse rests in the band beside the picture', r.left > 40 && under !== 'CANVAS', `the picture starts at ${Math.round(r.left)} px, the mouse is at ${beside.x}, ${beside.y} over ${under}`)
  await advance(page, 0.3)
  await save(page, 'hands-band-0-none')
  await page.mouse.down({ button: 'left' })
  await page.mouse.down({ button: 'right' })
  await advance(page, 0.3)
  await save(page, 'hands-band-1-both')
  await page.screenshot({ path: path.join(out, 'hands-band-window.png') })
  await page.mouse.up({ button: 'left' })
  await page.mouse.up({ button: 'right' })
  await advance(page, 0.3)
  await save(page, 'hands-band-2-none')
  check('step 3: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}

if (wants('skip')) {
  const page = await open('?step=1', { width: 1920, height: 1080 }, wired)
  const said = () => page.evaluate(() => document.querySelector('#controls [role="status"]')?.textContent ?? '')
  const link = () => page.evaluate(() => {
    const e = [...document.querySelectorAll('#controls button')].find((b) => !b.hidden && (b.getAttribute('aria-label') ?? b.textContent ?? '').startsWith('Skip'))
    if (!e || !e.offsetParent) return null
    const b = e.getBoundingClientRect()
    return { what: e.getAttribute('aria-label') ?? e.textContent, box: [b.left, b.top, b.right, b.bottom].map(Math.round) }
  })
  const t0 = Date.now()
  let l = null
  while (!l && Date.now() - t0 < 420000) {
    await page.waitForTimeout(500)
    l = await link()
  }
  const waited = (Date.now() - t0) / 1000
  check('step 1 at 1920 by 1080: the skip link is offered', !!l, l ? `"${l.what}" at ${l.box.join(', ')} after ${waited.toFixed(1)} s` : `not offered in ${waited.toFixed(0)} s`)
  if (l) {
    const before = await said()
    await page.screenshot({ path: path.join(out, 'hands-skip-before.png') })
    const x = (l.box[0] + l.box[2]) / 2
    const y = (l.box[1] + l.box[3]) / 2
    await page.mouse.move(x, y)
    const over = await page.evaluate(([px, py]) => {
      const e = document.elementFromPoint(px, py).closest('a, button, canvas')
      return `${e.tagName} "${e.getAttribute('aria-label') ?? e.textContent}" cursor ${getComputedStyle(e).cursor}`
    }, [x, y])
    await page.mouse.down()
    await page.mouse.up()
    const t1 = Date.now()
    let after = before
    while (Date.now() - t1 < 30000 && !/Step 2/.test(after)) {
      await page.waitForTimeout(250)
      after = await said()
    }
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(out, 'hands-skip-after.png') })
    const gone = await link()
    check('step 1 at 1920 by 1080: a real click on the skip link itself reaches step 2', /Step 2/.test(after), `the mouse was over ${over} at ${Math.round(x)}, ${Math.round(y)}; the page said "${before.slice(0, 80)}" before and "${after.slice(0, 120)}" ${((Date.now() - t1) / 1000 - 2.5).toFixed(1)} s after; the link is ${gone ? 'still shown' : 'gone'}`)
  }
  check('step 1 at 1920 by 1080: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}

await browser.close()
await server.close()
const bad = results.filter((r) => !r.ok)
console.log(`${results.length - bad.length} of ${results.length} checks hold`)
process.exit(bad.length ? 1 : 0)
