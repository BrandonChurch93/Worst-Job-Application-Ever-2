// Drives the dev page as a visitor would and prints what happened: node src/ui/check.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { launch } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const server = await createServer({ root, configFile: root + '/vite.config.ts', server: { port: 5198 }, logLevel: 'error', optimizeDeps: { entries: ['src/ui/dev.html'] } })
await server.listen()
const { browser } = await launch()
const results = []
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail })
const open = async (q, o = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...o })
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  await page.goto(`http://localhost:5198/src/ui/dev.html?${q}`)
  await page.waitForTimeout(400)
  return page
}
const log = async (page) => {
  await page.waitForTimeout(120)
  return page.evaluate(() => window.dev.log.splice(0))
}
const focus = (page) => page.evaluate(() => {
  const a = document.activeElement
  return a === document.body ? 'body' : `${a.tagName.toLowerCase()}:${a.getAttribute('aria-label') ?? a.textContent}`
})

{
  const page = await open('view=skip&step=1')
  const order = []
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab')
    order.push(await focus(page))
  }
  check('tab order: sound, watch the film, skip, then the picture', order[0] === 'button:Sound' && order[1].startsWith('a:Watch') && order[2].startsWith('button:Skip') && order[3] === 'div:', order.join(' | '))
  await page.keyboard.press('b')
  const onPicture = await log(page)
  check('a letter typed while the picture has the focus goes to the page', onPicture.includes('page:key:b'), onPicture.join())
  await page.keyboard.press('Shift+Tab')
  check('Shift and Tab from the picture goes back to the last control', (await focus(page)).startsWith('button:Skip'), await focus(page))
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await log(page)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  let l = await log(page)
  check('sound by keyboard: Enter and Space toggle it', l.filter((x) => x.startsWith('setMuted')).join() === 'setMuted:false,setMuted:true', l.join())
  check('Enter and Space on a control do not reach the page', !l.includes('page:key:Enter') && !l.includes('page:key: '), l.join())
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth)
  check('visible focus ring on keyboard focus', ring === 'solid 2px', ring)
  await page.keyboard.press('a')
  l = await log(page)
  check('a letter typed while a control has the focus does not reach the page', !l.includes('page:key:a'), l.join())
  const state = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label]')
    return { pressed: b.getAttribute('aria-pressed'), icon: b.querySelector('svg').dataset.icon }
  })
  check('sound control shows its state', state.pressed === 'false' && state.icon === 'soundOff', JSON.stringify(state))
  await page.click('button[aria-label="Sound"]')
  l = await log(page)
  check('sound by pointer: one toggle, nothing reaches the page', l.join() === 'setMuted:false', l.join())
  check('a pointer click gives the keyboard back to the page', (await focus(page)) === 'body')
  const sizes = await page.evaluate(() => [...document.querySelectorAll('[class*="live"] > *')].map((e) => e.getBoundingClientRect()).map((r) => [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)]))
  check('every live control is at least 24 px on its short side', sizes.every((s) => Math.min(s[0], s[1]) >= 24), JSON.stringify(sizes))
  await page.click('text=Skip step')
  l = await log(page)
  check('skip link calls skip() and goes away', l.join() === 'skip' && !(await page.isVisible('text=Skip step')), l.join())
  const cursors = await page.evaluate(() => {
    const at = (x, y) => getComputedStyle(document.elementFromPoint(x, y)).cursor
    const r = document.querySelector('a').getBoundingClientRect()
    return { page: at(640, 400), link: at(r.left + 5, r.top + r.height / 2) }
  })
  check('system cursor hidden over the page and shown over a control', cursors.page === 'none' && cursors.link === 'pointer', JSON.stringify(cursors))
  await page.mouse.click(640, 400)
  l = await log(page)
  check('a click on the page still reaches the page', l.includes('page:pointerdown'), l.join())
  await page.click('text=Watch the film')
  l = await log(page)
  check('watch the film link calls watchFilm()', l.join() === 'watchFilm', l.join())
  check('no error on the page', page.errors.length === 0, page.errors.join())
  await page.context().close()
}
{
  const page = await open('view=live&step=2')
  await page.keyboard.press('m')
  let shown = await page.evaluate(() => !document.querySelector('[class*="menu"]').hidden)
  let l = await log(page)
  check('M opens the menu and the key does not reach the page', shown && !l.includes('page:key:m'), l.join())
  const tabbable = await page.evaluate(() => [...document.querySelectorAll('[class*="menu"] button')].every((b) => b.tabIndex === -1) && document.querySelector('[class*="menu"]').getAttribute('aria-hidden') === 'true')
  check('the menu is out of the tab order', tabbable)
  const words = await page.evaluate(() => [...document.querySelectorAll('[class*="menu"] button, [class*="menuName"]')].map((b) => b.textContent))
  check('the words of the menu are ids', words.join('|') === 'quality|high|medium|low|step|Mandatory Optional Overtime|About You|Personal Details|Skills Assessment|Submit|Decision|diag|beauty|standins', words.join('|'))
  await page.click('text=low')
  await page.click('text=Submit')
  await page.click('text=standins')
  l = await log(page)
  check('the menu switches quality, step and diagnostic', l.join() === 'quality:low,setStep:4,diag:standins', l.join())
  await page.keyboard.press('m')
  shown = await page.evaluate(() => !document.querySelector('[class*="menu"]').hidden)
  check('M closes the menu', !shown)
  await page.context().close()
}
{
  const page = await open('view=live&step=1&typing=1')
  await page.keyboard.press('m')
  const l = await log(page)
  const shown = await page.evaluate(() => !document.querySelector('[class*="menu"]').hidden)
  check('while the page takes typed letters M goes to the page', !shown && l.includes('page:key:m'), l.join())
  await page.keyboard.press('Alt+m')
  check('and Alt with M opens the menu', await page.evaluate(() => !document.querySelector('[class*="menu"]').hidden))
  await page.context().close()
}
{
  const page = await open('view=live&step=1&sound=0')
  check('with no sound files the sound control is not drawn (A11)', !(await page.isVisible('button[aria-label="Sound"]')))
  const said = await page.evaluate(() => {
    const r = document.querySelector('[role="status"]')
    return { live: r.getAttribute('aria-live'), text: r.textContent, w: r.getBoundingClientRect().width }
  })
  check('the live region holds the heading of the step', said.live === 'polite' && said.text === 'Step 1: About You' && said.w <= 1, JSON.stringify(said))
  await page.context().close()
}
{
  const page = await open('view=live&step=1&auto=1')
  await page.waitForTimeout(1500)
  const level = await page.evaluate(() => window.dev.state.level)
  check('the picker runs in update() and has picked a level', ['high', 'medium', 'low'].includes(level), level)
  await page.context().close()
}
{
  const page = await open('view=film&time=10')
  const names = await page.evaluate(() => [...document.querySelectorAll('[class*="bar"] > *')].filter((e) => e.offsetParent).map((e) => e.getAttribute('aria-label') ?? e.textContent))
  check('film: play, position, time, sound, back', names.join('|') === 'Play|Position in the film|0:10 / 2:33|Sound|Back to the application', names.join('|'))
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  await page.keyboard.press('ArrowRight')
  let l = await log(page)
  check('film: Space plays, the right arrow seeks, neither reaches the page', l[0] === 'play' && l.some((x) => x.startsWith('seek:')) && !l.some((x) => x.startsWith('page:key')), l.join())
  await page.mouse.click(640, 300)
  l = await log(page)
  check('film: a click on the picture pauses and does not reach the page', l.join() === 'pause', l.join())
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowRight')
  l = await log(page)
  check('film: the position bar works by keyboard', (await focus(page)).startsWith('input:Position') && l.some((x) => x.startsWith('seek:')), l.join())
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  l = await log(page)
  check('film: Space on the focused sound control toggles the sound and not the film', l.join() === 'setMuted:false', l.join())
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Space')
  l = await log(page)
  check('film: Space on the focused play control acts once', l.join() === 'play', l.join())
  await page.click('button[aria-label="Back to the application"]')
  l = await log(page)
  check('film: back calls backToSite()', l.includes('backToSite'), l.join())
  check('no error on the page', page.errors.length === 0, page.errors.join())
  await page.context().close()
}
{
  const page = await open('view=auto', { reducedMotion: 'reduce' })
  const mode = await page.evaluate(() => document.querySelector('[data-mode]').dataset.mode)
  check('lessMotion() is true for a visitor who asks for less motion', mode === 'film', mode)
  await page.context().close()
  const phone = await open('view=auto', { hasTouch: true, isMobile: true, viewport: { width: 390, height: 780 } })
  const text = await phone.evaluate(() => document.querySelector('main')?.innerText ?? '')
  check('touchOnly() is true on a touch-only device and the message is shown', text.includes("We're sorry.") && text.includes('considerably more patience'), text.replace(/\n+/g, ' / '))
  check('with no address the link of the touch message is not drawn', (await phone.evaluate(() => document.querySelectorAll('main a').length)) === 0)
  await phone.context().close()
  const desk = await open('view=auto')
  check('touchOnly() is false on a computer', (await desk.evaluate(() => !!document.querySelector('main'))) === false)
  await desk.context().close()
}
{
  const page = await open('view=skip&step=1&backing=light')
  await page.waitForTimeout(300)
  const drawn = await page.evaluate(() => [...document.querySelectorAll('[class*="live"] > [class*="link"]')].map((e) => ({ text: e.textContent, hidden: e.querySelector('svg')?.getAttribute('aria-hidden'), width: Math.round(e.querySelector('svg')?.getBoundingClientRect().width ?? 0) })))
  check('each word is drawn from the outlines and still stands in the page as text', drawn.length === 2 && drawn[0].text === 'Watch the film instead' && drawn[1].text === 'Skip step (Accept Defeat)' && drawn.every((d) => d.hidden === 'true' && d.width > 40), JSON.stringify(drawn))
  const alpha = (c) => Number((c.match(/rgba\([^)]*,\s*([\d.]+)\)/) ?? [0, c.startsWith('rgb(') ? 1 : 0])[1])
  const light = await page.evaluate(() => getComputedStyle(document.querySelector('[class*="live"]')).backgroundColor)
  check('over pale content the row gets a pale capsule', alpha(light) > 0.8, light)
  await page.context().close()
  const bare = await open('view=skip&step=1')
  const none = await bare.evaluate(() => getComputedStyle(document.querySelector('[class*="live"]')).backgroundColor)
  check('over the empty strip the row is drawn bare', alpha(none) === 0, none)
  await bare.context().close()
}
{
  const page = await open('view=probe&wait=20')
  await page.waitForTimeout(1200)
  const text = await page.evaluate(() => document.querySelector('pre').textContent)
  check('probe: the block holds twelve rows, the card, the screen and the pick', text.split('\n').length === 19 && /Graphics card: \S/.test(text) && /The site would pick: (high|medium|low)/.test(text), text.split('\n').slice(-5).join(' / '))
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  await page.click('text=Copy')
  await page.waitForTimeout(200)
  const label = await page.evaluate(() => document.querySelector('[class*="buttons"] button').textContent)
  check('probe: the Copy button copies the block', label === 'Copied', label)
  await page.context().close()
}
await browser.close()
await server.close()
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`)
console.log(`${results.filter((r) => r.ok).length} of ${results.length} checks hold`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
