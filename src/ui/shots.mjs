// Pictures of the dev page: node src/ui/shots.mjs '[{"name":"ui-live","q":"view=live"}]'. They land in out/work/stills/.
import { launch } from '../../tools/lib/browser.mjs'
import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const out = root + '/out/work/stills'
fs.mkdirSync(out, { recursive: true })
const server = await createServer({ root, configFile: root + '/vite.config.ts', server: { port: 5199 }, logLevel: 'error', optimizeDeps: { entries: ['src/ui/dev.html'] } })
await server.listen()
const { browser } = await launch()
const shots = JSON.parse(process.argv[2])
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w ?? 1200, height: s.h ?? 675 }, deviceScaleFactor: s.dpr ?? 1, hasTouch: !!s.touch, isMobile: !!s.touch, reducedMotion: s.reduce ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`http://localhost:5199/src/ui/dev.html?${s.q}`)
  await page.waitForTimeout(s.wait ?? 500)
  for (const k of s.keys ?? []) { await page.keyboard.press(k); await page.waitForTimeout(80) }
  if (s.eval) console.log(s.name, JSON.stringify(await page.evaluate(s.eval)))
  await page.screenshot({ path: `${out}/${s.name}.png`, clip: s.clip })
  if (errors.length) console.log(s.name, 'ERRORS', errors)
  await ctx.close()
}
await browser.close()
await server.close()
