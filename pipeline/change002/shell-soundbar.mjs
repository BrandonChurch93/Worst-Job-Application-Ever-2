// node pipeline/change002/shell-soundbar.mjs [bar] [phone] [step2]: change note 004 in a browser, on the dev server of this tree, at real size.
// bar: the sound bar on the careers page at 1280 by 720 and 1920 by 1080 (before Accept, leaving, gone), with where each thing lies. phone: the notice at 390 by 844 and 844 by 390.
// step2: step 2 played by the keen bot with sound allowed and without, with when each caption came and when the page turned. Pictures land in pipeline/change002/shell-pictures/.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'
import { at, writeJson } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'

const wants = (name) => process.argv.length === 2 || process.argv.includes(name)
const pictures = at('pipeline', 'change002', 'shell-pictures')
const server = await createServer({ root: at(), configFile: at('vite.config.ts'), server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const { browser, version } = await launch()
const HOLD = 0.6
const record = { made: 'node pipeline/change002/shell-soundbar.mjs', browser: version }
const open = async (q, o) => {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...o })
  const page = await ctx.newPage()
  page.setDefaultTimeout(240000)
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(String(e)))
  await page.goto(`http://localhost:5199/${q}`)
  await page.waitForFunction(() => document.querySelector('#controls')?.children.length > 0, null, { timeout: 180000 })
  return page
}
const rects = (page) => page.evaluate(() => {
  const r = (e) => { if (!e || e.hidden) return null; const b = e.getBoundingClientRect(); if (b.width === 0) return null; return { left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) } }
  const accept = [...document.querySelectorAll('#controls button')].find((b) => b.textContent === 'Accept')
  const soundButton = [...document.querySelectorAll('#controls button')].find((b) => /sound/i.test(b.getAttribute('aria-label') ?? '') && b.offsetParent)
  const caption = [...document.querySelectorAll('[data-narrator-caption]')].find((e) => e.style.display !== 'none')
  const a = document.activeElement
  return { bar: r(accept?.parentElement), accept: r(accept), capsule: r(soundButton?.parentElement), caption: r(caption), captionWords: caption?.textContent ?? null, canvas: r(document.querySelector('canvas')), focus: a === document.body ? 'body' : a.textContent || a.getAttribute('aria-label'), step: document.querySelector('#controls [data-mode]')?.dataset.step }
})
try {
  if (wants('bar')) {
    record.bar = []
    const ready = async (view) => {
      const page = await open('', { viewport: view })
      await page.waitForFunction(() => [...document.querySelectorAll('#controls button')].some((b) => b.textContent === 'Accept' && b.offsetParent), null, { timeout: 120000 })
      await page.waitForTimeout(2500)
      return page
    }
    for (const [view, key] of [[{ width: 1280, height: 720 }, 'Enter'], [{ width: 1920, height: 1080 }, 'Space']]) {
      const k = view.width / 1920
      const name = `soundbar-${view.width}`
      const row = { view, by: `Tab, then ${key}`, apply: { stated: 'hero-cta of src/pages/marketing/layout.ts, page pixels 685, 568, 550 by 78, scaled to the picture', left: Math.round(685 * k), top: Math.round(568 * k), right: Math.round(1235 * k), bottom: Math.round(646 * k) } }
      let page = await ready(view)
      row.before = await rects(page)
      let t = Date.now()
      await page.screenshot({ path: path.join(pictures, `${name}-before.png`) })
      row.pictureSeconds = (Date.now() - t) / 1000
      await page.keyboard.press('Tab')
      row.afterTab = await rects(page)
      await page.keyboard.press(key === 'Space' ? ' ' : key)
      // The move at its real speed, timed by the bar's own rectangle.
      row.move = await page.evaluate(() => new Promise((done) => {
        const bar = [...document.querySelectorAll('#controls button')].find((b) => b.textContent === 'Accept').parentElement
        const t0 = performance.now()
        const seen = []
        const look = () => {
          const ms = Math.round(performance.now() - t0)
          if (bar.hidden) return done({ hiddenAfterMs: ms, seen })
          seen.push([ms, Math.round(bar.getBoundingClientRect().top)])
          if (ms > 3000) return done({ hiddenAfterMs: null, seen })
          setTimeout(look, 30)
        }
        look()
      }))
      for (let i = 0; i < 40 && !(await rects(page)).caption; i++) await page.waitForTimeout(100)
      row.gone = await rects(page)
      await page.screenshot({ path: path.join(pictures, `${name}-gone.png`) })
      row.goneAfterPicture = await rects(page)
      row.errors = page.errors
      await page.context().close()
      // A second visit for the picture on the way out: the press is on Apply at 1280 and on Accept at 1920, and the move is held at HOLD of its time while the picture is taken. The timer that ends the move is kept from ending it.
      page = await ready(view)
      await page.evaluate(() => {
        const st = window.setTimeout
        window.setTimeout = (f, ms, ...a) => st(f, ms === 260 ? 600000 : ms, ...a)
      })
      if (view.width === 1280) await page.mouse.click(960 * k, 607 * k)
      else await page.mouse.click((row.before.accept.left + row.before.accept.right) / 2, (row.before.accept.top + row.before.accept.bottom) / 2)
      row.leavingBy = view.width === 1280 ? 'a press on Apply for a Job' : 'a press on Accept with the mouse'
      row.held = await page.evaluate((hold) => {
        const bar = [...document.querySelectorAll('#controls button')].find((b) => b.textContent === 'Accept').parentElement
        void getComputedStyle(bar).transform
        const a = bar.getAnimations()[0]
        if (!a) return { leaving: bar.dataset.leaving ?? null, animation: null }
        a.pause()
        const whole = a.effect.getComputedTiming().duration
        a.currentTime = whole * hold
        return { leaving: bar.dataset.leaving ?? null, animation: a.transitionProperty ?? null, wholeMs: whole, heldAtMs: whole * hold }
      }, HOLD)
      row.leaving = await rects(page)
      await page.screenshot({ path: path.join(pictures, `${name}-leaving.png`) })
      row.leavingAfterPicture = await rects(page)
      row.errorsSecond = page.errors
      record.bar.push(row)
      console.log(JSON.stringify(row))
      await page.context().close()
    }
    const film = await open('?mode=film', { viewport: { width: 1280, height: 720 } })
    await film.waitForTimeout(4000)
    record.film = await rects(film)
    console.log('film', JSON.stringify(record.film))
    await film.context().close()
  }
  if (wants('phone')) {
    record.phone = []
    for (const view of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const page = await open('', { viewport: view, hasTouch: true, isMobile: true })
      await page.waitForTimeout(2500)
      const row = await page.evaluate(() => ({
        text: document.querySelector('#controls main')?.innerText ?? '',
        links: [...document.querySelectorAll('a')].map((a) => { const b = a.getBoundingClientRect(); return { href: a.getAttribute('href'), words: a.textContent, target: a.target, left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) } }),
        buttons: [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent),
        scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }
      }))
      row.view = view
      row.errors = page.errors
      await page.screenshot({ path: path.join(pictures, `phone-${view.width}x${view.height}.png`) })
      record.phone.push(row)
      console.log(JSON.stringify(row))
      await page.context().close()
    }
  }
  if (wants('step2')) {
    // Step 2 played by the keen bot. With sound allowed by a press on the page the narrator says line 4; without it nothing is owed. The page is looked at every 100 ms; pictures are taken when the second part of line 4 is on its panel and when it has left.
    record.step2 = []
    for (const sound of [true, false]) {
      const page = await open('?step=2&bot=keen', { viewport: { width: 1280, height: 720 } })
      const t0 = Date.now()
      if (sound) await page.mouse.click(1270, 10)
      const row = { sound, captions: [], turnedAt: null, pictures: [] }
      let last = null
      let state = 'before'
      for (let i = 0; i < 900; i++) {
        const r = await rects(page)
        const at0 = (Date.now() - t0) / 1000
        if (r.captionWords !== last) { row.captions.push([Number(at0.toFixed(2)), r.captionWords]); last = r.captionWords }
        if (r.step !== '2') { row.turnedAt = Number(at0.toFixed(2)); break }
        if (sound && state === 'before' && /regret/i.test(r.captionWords ?? '')) {
          state = 'waiting'
          await page.screenshot({ path: path.join(pictures, 'step2-continue-waiting.png') })
          row.pictures.push({ what: 'waiting', asked: Number(at0.toFixed(2)), done: Number(((Date.now() - t0) / 1000).toFixed(2)), after: (await rects(page)).captionWords })
        } else if (sound && state === 'waiting' && r.captionWords === null) {
          state = 'ready'
          await page.screenshot({ path: path.join(pictures, 'step2-continue-ready.png') })
          const after = await rects(page)
          row.pictures.push({ what: 'ready', asked: Number(at0.toFixed(2)), done: Number(((Date.now() - t0) / 1000).toFixed(2)), stepAfter: after.step })
        }
        await page.waitForTimeout(100)
      }
      row.errors = page.errors
      record.step2.push(row)
      console.log(JSON.stringify(row))
      await page.context().close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
const file = at('pipeline', 'change002', 'shell-soundbar.json')
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
writeJson(file, { ...old, ...record })
