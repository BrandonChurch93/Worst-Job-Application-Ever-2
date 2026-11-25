// The site's own logic, loaded into Node from src/ as it is, with the fonts registered. No browser, no pictures.
import fs from 'node:fs'
import { createServer } from 'vite'
import { at } from './paths.mjs'

export async function logic() {
  const server = await createServer({ root: at(), configFile: at('vite.config.ts'), server: { middlewareMode: true, hmr: false, watch: null, ws: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } })
  const load = (file) => server.ssrLoadModule(file)
  const metrics = await load('/src/shell/metrics.ts')
  for (const name of metrics.FONTS) metrics.registerFont(name, JSON.parse(fs.readFileSync(at('public', 'fonts', `${name}.json`), 'utf8')))
  const { preparePages } = await load('/src/pages/index.ts')
  await preparePages()
  return { load, close: () => server.close() }
}
