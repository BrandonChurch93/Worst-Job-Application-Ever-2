// node pipeline/change002/shell-step2-wait.mjs [seconds of the page until which the line is owed]: step 2 of the live site on its stepped clock, played by the keen bot, with Continue waiting for the narrator and then ready.
// The stepped site has no sound, so the line owed is stood in for through liveRun.owe: the default is the end of the second part of line 4 on the keen bot's visit in shell-script-visit.json, in seconds of the page.
// It writes shell-pictures/step2-continue-waiting.png and step2-continue-ready.png and prints what the page told at each.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'
import { at } from '../../tools/lib/paths.mjs'
import { launch } from '../../tools/lib/browser.mjs'

const visit = JSON.parse(fs.readFileSync(at('pipeline', 'change002', 'shell-script-visit.json'), 'utf8'))
const keen = visit.rows.find((r) => r.bot === 'keen')
const lineEnd = keen.line4b + visit.seconds['step2.crank.1'].seconds
const pictures = at('pipeline', 'change002', 'shell-pictures')
const server = await createServer({ root: at(), configFile: at('vite.config.ts'), server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const { browser } = await launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  page.setDefaultTimeout(240000)
  await page.goto('http://localhost:5199/?clock=steps&step=2&bot=keen')
  await page.waitForFunction(() => !!window.liveRun, null, { timeout: 180000 })
  const told = () => page.evaluate(() => { const t = window.liveRun.told(); return { page: t.page, pageTime: Number(t.pageTime.toFixed(3)), turning: t.turning, gag: t.gag } })
  const to = async (seconds) => { const t = await told(); if (seconds > t.pageTime) await page.evaluate((s) => { window.liveRun.advance(s, true) }, seconds - t.pageTime); return told() }
  const save = async (name) => { const png = await page.evaluate(() => window.liveRun.state().png); fs.writeFileSync(path.join(pictures, name), Buffer.from(png.split(',')[1], 'base64')) }
  // Without anything owed: when the bot's press on Continue turns the page.
  let free = null
  for (let s = 15; s < 40 && free === null; s += 0.1) { const t = await to(s); if (t.turning || t.page !== 'step2') free = t.pageTime }
  console.log(`nothing owed: the page turns at ${free} s of the page`)
  await page.goto('http://localhost:5199/?clock=steps&step=2&bot=keen')
  await page.waitForFunction(() => !!window.liveRun, null, { timeout: 180000 })
  const until = Number(process.argv[2] ?? (free + (lineEnd - keen.crankGone)).toFixed(2))
  await page.evaluate((u) => window.liveRun.owe(u), until)
  console.log(`owed until ${until} s of the page (the line ends ${(lineEnd - keen.crankGone).toFixed(2)} s after the crank is done on the keen bot's visit)`)
  console.log('waiting', JSON.stringify(await to(until - 0.6)))
  await save('step2-continue-waiting.png')
  console.log('ready', JSON.stringify(await to(until + 0.03)))
  await save('step2-continue-ready.png')
  let held = null
  for (let s = until + 0.05; s < until + 30 && held === null; s += 0.05) { const t = await to(s); if (t.turning || t.page !== 'step2') held = t.pageTime }
  console.log(`owed until ${until}: the page turns at ${held} s of the page`)
} finally {
  await browser.close()
  await server.close()
}
