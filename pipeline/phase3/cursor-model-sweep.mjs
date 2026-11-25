// node pipeline/phase3/cursor-model-sweep.mjs --set body [--samples 8] [--cols 6] [--pitch 120] [--time 0.7] [--tag name]
// Renders a sheet that sweeps the numbers of the cursor's contract into out/work/cursor-model/.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { launch } from '../../tools/lib/browser.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : fallback
}
const set = arg('set', 'body')
const query = new URLSearchParams({ set, samples: arg('samples', '8'), time: arg('time', '0.7') })
for (const k of ['cols', 'pitch']) if (arg(k, null)) query.set(k, arg(k, ''))
const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { port: 5199, strictPort: false }, logLevel: 'error' })
await server.listen()
const { browser } = await launch()
try {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage()
  const problems = []
  page.on('pageerror', (e) => problems.push(String(e.message || e)))
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && problems.push(m.text()))
  const started = performance.now()
  await page.goto(`http://localhost:${server.config.server.port}/pipeline/phase3/cursor-model-sweep.html?${query}`)
  await page.waitForFunction(() => window.sweep && window.sweep.done, null, { timeout: 180000 }).catch((e) => problems.push(String(e)))
  const info = await page.evaluate(() => window.sweep)
  const b64 = await page.evaluate(() => document.getElementById('stage').toDataURL('image/png').split(',')[1])
  const out = path.join(root, 'out/work/cursor-model')
  fs.mkdirSync(out, { recursive: true })
  const file = path.join(out, `sweep-${set}${arg('tag', '') ? '-' + arg('tag', '') : ''}.png`)
  fs.writeFileSync(file, Buffer.from(b64, 'base64'))
  console.log(`rendered: ${path.relative(root, file)} in ${((performance.now() - started) / 1000).toFixed(1)} s`)
  if (info) console.log(`triangles ${info.counts.triangles}, draw calls ${info.counts.drawCalls}\ncells: ${info.cells.join(' | ')}`)
  if (problems.length) console.log(`problems:\n- ${[...new Set(problems)].join('\n- ')}`)
} finally {
  await browser.close()
  await server.close()
}
