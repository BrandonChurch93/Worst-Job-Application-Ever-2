// node pipeline/change002/shell-soundbar.mjs [bar] [phone] [step2]: change note 004 in a browser, on the dev server of this tree, at real size.
// bar: the sound bar on the careers page at 1280 by 720 and 1920 by 1080 (before Accept, leaving, gone), with where each thing lies. phone: the notice at 390 by 844 and 844 by 390.
// step2: step 2 played by the keen bot with sound allowed, a picture every 0.4 s with the caption's words. Pictures land in pipeline/change002/shell-pictures/ (bar, phone) and /tmp/shell-step2/ (step2).
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
const SLOW = 40
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
    for (const [view, key] of [[{ width: 1280, height: 720 }, 'Enter'], [{ width: 1920, height: 1080 }, 'Space'], [{ width: 1280, height: 720 }, 'Apply']]) {
      const page = await open('', { viewport: view })
      await page.waitForFunction(() => [...document.querySelectorAll('#controls button')].some((b) => b.textContent === 'Accept' && b.offsetParent), null, { timeout: 120000 })
      await page.waitForTimeout(2500)
      const name = `soundbar-${view.width}-${key.toLowerCase()}`
      const k = view.width / 1920
      const row = { view, by: key, apply: { stated: 'hero-cta of src/pages/marketing/layout.ts, page pixels 685, 568, 550 by 78, scaled to the picture', left: Math.round(685 * k), top: Math.round(568 * k), right: Math.round(1235 * k), bottom: Math.round(646 * k) }, before: await rects(page) }
      await page.screenshot({ path: path.join(pictures, `${name}-before.png`) })
      // The Enter run is at the real speed and times the move by the bar's own rectangle. The other runs slow the move SLOW times, in the style sheet and in the timer that ends it, so that a picture can be taken on the way.
      const slow = key !== 'Enter'
      if (slow) await page.evaluate((n) => {
        const st = window.setTimeout
        window.setTimeout = (f, ms, ...a) => st(f, ms === 260 ? ms * n : ms, ...a)
        const bar = [...document.querySelectorAll('#controls button')].find((b) => b.textContent === 'Accept').parentElement
        bar.style.transitionDuration = `${0.26 * n}s`
      }, SLOW)
      if (key === 'Apply') await page.mouse.click(960 * k, 607 * k)
      else {
        await page.keyboard.press('Tab')
        row.afterTab = await rects(page)
        await page.screenshot({ path: path.join(pictures, `${name}-focus.png`) })
        await page.keyboard.press(key === 'Space' ? ' ' : key)
      }
      if (slow) {
        await page.waitForTimeout(1500)
        row.leaving = await rects(page)
        await page.screenshot({ path: path.join(pictures, `${name}-leaving.png`) })
        row.leavingAfter = await rects(page)
        await page.waitForTimeout(0.26 * SLOW * 1000)
      } else {
        row.move = await page.evaluate(() => new Promise((done) => {
          const bar = [...document.querySelectorAll('#controls button')].find((b) => b.textContent === 'Accept').parentElement
          const t0 = performance.now()
          const seen = []
          const look = () => {
            const t = Math.round(performance.now() - t0)
            if (bar.hidden) return done({ hiddenAfterMs: t, seen })
            seen.push([t, Math.round(bar.getBoundingClientRect().top)])
            if (t > 3000) return done({ hiddenAfterMs: null, seen })
            setTimeout(look, 30)
          }
          look()
        }))
      }
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(pictures, `${name}-gone.png`) })
      row.gone = await rects(page)
      await page.waitForTimeout(2500)
      row.later = await rects(page)
      await page.screenshot({ path: path.join(pictures, `${name}-later.png`) })
      row.errors = page.errors
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
    const dir = '/tmp/shell-step2'
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const page = await open('?step=2&bot=keen', { viewport: { width: 1280, height: 720 } })
    await page.mouse.click(1270, 10)
    const t0 = Date.now()
    record.step2 = []
    for (let i = 0; i < 90; i++) {
      await page.waitForTimeout(400)
      const r = await rects(page)
      const row = { wall: (Date.now() - t0) / 1000, step: r.step, caption: r.captionWords }
      record.step2.push(row)
      await page.screenshot({ path: path.join(dir, `${String(i).padStart(2, '0')}.png`) })
      console.log(JSON.stringify(row))
      if (r.step !== '2' && i > 5) break
    }
    record.step2Errors = page.errors
    await page.context().close()
  }
} finally {
  await browser.close()
  await server.close()
}
const file = at('pipeline', 'change002', 'shell-soundbar.json')
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
writeJson(file, { ...old, ...record })
