// Drives the wired site itself (index.html, src/main.ts) as a visitor would: node src/ui/site.mjs [--probe] [--shots]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { launch } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const withProbe = process.argv.includes('--probe')
const withShots = process.argv.includes('--shots')
const out = path.join(root, 'out/work/stills')
fs.mkdirSync(out, { recursive: true })
const server = await createServer({ root, configFile: root + '/vite.config.ts', server: { port: 5196 }, logLevel: 'error' })
await server.listen()
const { browser } = await launch()
const results = []
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail })
const open = async (q, o = {}, settle = 2500) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...o })
  const page = await ctx.newPage()
  page.errors = []
  page.asked = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()) })
  page.on('request', (r) => page.asked.push(r.url()))
  await page.goto(`http://localhost:5196/${q}`)
  await page.waitForFunction(() => document.querySelector('#controls')?.children.length > 0 || !document.getElementById('fail').hidden, null, { timeout: 120000 })
  await page.waitForTimeout(settle)
  return page
}
const shot = async (page, name) => {
  if (withShots) await page.screenshot({ path: path.join(out, `${name}.png`) })
}
const focus = (page) => page.evaluate(() => {
  const a = document.activeElement
  return a === document.body ? 'body' : `${a.tagName.toLowerCase()}:${a.getAttribute('aria-label') ?? a.textContent}`
})
const seen = (page) => page.evaluate(() => [...document.querySelectorAll('#controls button, #controls a, #controls input')].filter((e) => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map((e) => `${e.tagName.toLowerCase()}:${e.getAttribute('aria-label') ?? e.textContent}`))
const fail = (page) => page.evaluate(() => (document.getElementById('fail').hidden ? '' : document.getElementById('fail').textContent))

{
  const page = await open('')
  check('live: the site starts and reports no error', (await fail(page)) === '' && page.errors.length === 0, (await fail(page)) + page.errors.join(' | '))
  const controls = await seen(page)
  const sound = controls.some((c) => c === 'button:Sound')
  check('live: the careers page shows the film link and no skip link', controls.some((c) => c.startsWith('a:Watch')) && !controls.some((c) => c.startsWith('button:Skip')), controls.join(' | '))
  const order = []
  for (let i = 0; i < controls.length + 1; i++) {
    await page.keyboard.press('Tab')
    order.push(await focus(page))
  }
  check('live: Tab goes through the controls and then to the picture', order.slice(0, -1).join('|') === controls.join('|') && order.at(-1) === 'canvas:', order.join(' | '))
  const ring = await page.evaluate(() => `${document.getElementById('stage').dataset.ring} ${getComputedStyle(document.getElementById('stage')).outlineStyle}`)
  check('live: the picture shows a ring after Tab', ring === 'true solid', ring)
  await page.keyboard.press('Shift+Tab')
  const back = await focus(page)
  const linkRing = await page.evaluate(() => `${getComputedStyle(document.activeElement).outlineStyle} ${getComputedStyle(document.activeElement).outlineWidth}`)
  check('live: Shift and Tab leads back to the last control, with a ring', back === controls.at(-1) && linkRing === 'solid 2px', `${back} ${linkRing}`)
  await page.mouse.click(640, 500)
  const after = await page.evaluate(() => document.getElementById('stage').dataset.ring)
  check('live: no ring on the picture after a click', after === 'false', after)
  const place = await page.evaluate(() => {
    const c = document.getElementById('stage').getBoundingClientRect()
    const r = document.querySelector('#controls [class*="live"]').getBoundingClientRect()
    const u = c.width / 1920
    return { left: Math.round((r.left - c.left) / u), top: Math.round((r.top - c.top) / u), right: Math.round((r.right - c.left) / u), bottom: Math.round((r.bottom - c.top) / u), cursor: getComputedStyle(document.getElementById('stage')).cursor, over: getComputedStyle(document.querySelector('#controls a')).cursor }
  })
  check('live: the row lies in the empty strip, x 112 to 1000 and y 0 to 60 of the page', place.left >= 100 && place.right <= 1000 && place.top >= 0 && place.bottom <= 60, JSON.stringify(place))
  check('live: the system cursor is hidden over the picture and shown over a control', place.cursor === 'none' && place.over === 'pointer', `${place.cursor} ${place.over}`)
  console.log(`sound control drawn on the careers page: ${sound}`)
  await shot(page, 'site-live')
  await page.keyboard.press('m')
  await page.waitForTimeout(300)
  const menu = await page.evaluate(() => [...document.querySelectorAll('#controls [class*="menu"] button')].filter((b) => b.offsetParent).map((b) => `${b.textContent}${b.dataset.current === 'true' ? '*' : ''}`))
  check('live: M opens the menu with the levels, the steps and the views', menu.length >= 11, menu.join(' '))
  await shot(page, 'site-menu')
  const before = await page.evaluate(() => document.getElementById('stage').width)
  await page.evaluate(() => [...document.querySelectorAll('#controls [class*="menu"] button')].find((b) => b.textContent === 'low').click())
  await page.waitForTimeout(600)
  const low = await page.evaluate(() => [...document.querySelectorAll('#controls [class*="menu"] button')].find((b) => b.textContent === 'low').dataset.current)
  check('live: the menu forces a level', low === 'true', `low pressed ${low}, canvas ${before} to ${await page.evaluate(() => document.getElementById('stage').width)}`)
  await page.evaluate(() => [...document.querySelectorAll('#controls [class*="menu"] button')].find((b) => b.textContent === 'Personal Details').click())
  await page.waitForTimeout(1500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await shot(page, 'site-step2')
  const said = await page.evaluate(() => document.querySelector('#controls [role="status"]').textContent)
  check('live: the menu goes to a step and the live region says its heading', said.includes('Step 2'), said)
  await page.locator('#controls a').click()
  await page.waitForTimeout(1200)
  const film = await seen(page)
  check('film: the film link opens the film with its bar', page.url().includes('mode=film') && film.some((c) => c === 'button:Play') && film.some((c) => c.startsWith('input:Position')) && film.some((c) => c.startsWith('button:Back')), `${page.url()} ${film.join(' | ')}`)
  const t0 = await page.evaluate(() => document.querySelector('#controls input').value)
  await page.waitForTimeout(1500)
  const t1 = await page.evaluate(() => document.querySelector('#controls input').value)
  check('film: it plays by itself for a visitor who did not ask for less motion', Number(t1) > Number(t0), `${t0} to ${t1}`)
  await page.keyboard.press('Space')
  await page.waitForTimeout(400)
  const p0 = await page.evaluate(() => document.querySelector('#controls input').value)
  await page.waitForTimeout(700)
  const p1 = await page.evaluate(() => document.querySelector('#controls input').value)
  check('film: Space pauses', p0 === p1, `${p0} ${p1}`)
  await shot(page, 'site-film')
  await page.locator('#controls button[aria-label="Back to the application"]').click()
  await page.waitForTimeout(800)
  check('film: back returns to the live site', !page.url().includes('mode=film') && (await seen(page)).some((c) => c.startsWith('a:Watch')), page.url())
  const stored = await page.evaluate(() => `${localStorage.length} ${sessionStorage.length} ${document.cookie.length}`)
  check('nothing is stored', stored === '0 0 0', stored)
  const foreign = page.asked.filter((u) => !u.startsWith('http://localhost:5196/') && !u.startsWith('data:') && !u.startsWith('blob:'))
  check('no request but for the site\'s own files', foreign.length === 0, `${page.asked.length} requests, foreign: ${foreign.slice(0, 3).join(' ')}`)
  check('live and film: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}
{
  const page = await open('?step=1')
  const t = process.hrtime.bigint()
  await page.waitForFunction(() => [...document.querySelectorAll('#controls button')].some((b) => b.offsetParent && b.textContent.startsWith('Skip')), null, { timeout: 240000 }).catch(() => {})
  const waited = Number((process.hrtime.bigint() - t) / 1000000000n)
  const controls = await seen(page)
  check('live: the skip link comes on step 1 when it is due', controls.some((c) => c.startsWith('button:Skip')), `${controls.join(' | ')} after ${waited} s of wall time`)
  await shot(page, 'site-skip')
  await page.locator('#controls button', { hasText: 'Skip' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('#controls [role="status"]').textContent.includes('Step 2'), null, { timeout: 240000 }).catch(() => {})
  const said = await page.evaluate(() => document.querySelector('#controls [role="status"]').textContent)
  check('live: Enter on the skip link plays the ending of the step and the next step comes', said.includes('Step 2'), said.slice(0, 80))
  check('live, step 1: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  await page.context().close()
}
{
  const page = await open('?step=1')
  await page.mouse.click(640, 400)
  await page.keyboard.press('m')
  await page.waitForTimeout(300)
  const open1 = await page.evaluate(() => [...document.querySelectorAll('#controls [class*="menu"] button')].filter((b) => b.offsetParent).length)
  console.log(`step 1, a plain M right after the page opens: the menu shows ${open1} buttons (0 means the page took the letter)`)
  await page.context().close()
}
{
  const page = await open('')
  const before = await page.evaluate(() => document.querySelector('#controls [data-mode]').dataset.backing)
  const box = await page.locator('#controls a').boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(2500)
  const after = await page.evaluate(() => document.querySelector('#controls [data-mode]').dataset.backing)
  check('live: a wheel turned over the row scrolls the page, and the row gets its capsule when content passes under it', before === 'page' && after !== 'page', `${before} then ${after}`)
  await shot(page, 'site-scrolled')
  await page.context().close()
}
{
  const page = await open('', { reducedMotion: 'reduce' })
  const controls = await seen(page)
  const mode = await page.evaluate(() => document.querySelector('#controls [data-mode]')?.dataset.mode)
  check('less motion: the visitor is offered the film in place of the live site', mode === 'film' && controls.some((c) => c === 'button:Play'), `mode ${mode}: ${controls.join(' | ')}`)
  await shot(page, 'site-less-motion')
  await page.context().close()
  const direct = await open('?mode=film', { reducedMotion: 'reduce' })
  const offer = await direct.evaluate(() => `${getComputedStyle(document.querySelector('#controls [class*="offer"]')).display} ${document.querySelector('#controls input').value}`)
  check('less motion: the film waits at 0 with the play sign', offer === 'flex 0', offer)
  await shot(direct, 'site-offer')
  await direct.context().close()
}
{
  const page = await open('', { hasTouch: true, isMobile: true, viewport: { width: 390, height: 780 } }, 800)
  const text = await page.evaluate(() => document.querySelector('#controls main')?.innerText ?? '')
  const hidden = await page.evaluate(() => document.getElementById('stage').hidden)
  check('touch: the message stands in place of the site', text.includes("We're sorry.") && hidden, `${text.replace(/\n+/g, ' / ')} canvas hidden ${hidden}`)
  const big = page.asked.filter((u) => /\.(glb|ktx2|bin|mp3|ogg|wav|hdr|exr)(\?|$)/.test(u))
  check('touch: no model, texture or sound file is asked for behind it', big.length === 0, `${page.asked.length} requests, ${big.length} of them heavy`)
  await shot(page, 'site-touch')
  await page.context().close()
}
if (withProbe) {
  const page = await open('?mode=probe', {}, 500)
  const t = process.hrtime.bigint()
  await page.waitForFunction(() => document.querySelector('#controls pre')?.textContent.length > 0 && !document.querySelector('#controls section').hidden, null, { timeout: 600000 })
  const text = await page.evaluate(() => document.querySelector('#controls pre').textContent)
  check('probe: it runs to its end and gives its block of text', text.split('\n').length === 19 && /The site would pick: \w+/.test(text), `${Number((process.hrtime.bigint() - t) / 1000000000n)} s`)
  check('probe: no error on the page', page.errors.length === 0, page.errors.slice(0, 3).join(' | '))
  console.log(text)
  await shot(page, 'site-probe')
  await page.context().close()
}
await browser.close()
await server.close()
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`)
console.log(`${results.filter((r) => r.ok).length} of ${results.length} checks hold`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
