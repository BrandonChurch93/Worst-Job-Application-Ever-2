// npm run physics:test: the same ten seconds of physics in Node and in the headless browser.
// Prints one hash of the final state for each. The hashes must be equal here and on every other machine.
import crypto from 'node:crypto'
import fs from 'node:fs'
import RAPIER from '@dimforge/rapier2d-deterministic-compat'
import { at, root, writeJson, args } from './lib/paths.mjs'
import { runPhysicsTest } from './lib/physics-sim.mjs'
import { launch, machine } from './lib/browser.mjs'
import { serve } from './lib/serve.mjs'

const a = args()
const sha = (hex) => crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex')
const short = (r) => ({ state: sha(r.stateHex), snapshot: sha(r.snapshotHex), snapshotBytes: r.snapshotBytes, first: r.first, version: r.version, steps: r.steps })

const traced = await runPhysicsTest(RAPIER, { trace: !!a.draw })
const inNode = short(traced)
const again = short(await runPhysicsTest(RAPIER))
let inBrowser = null
let browserVersion = null
if (!a['node-only']) {
  const server = await serve(root)
  const { browser, version } = await launch()
  browserVersion = version
  const page = await browser.newPage()
  await page.goto(`${server.url}/tools/assets/physics-test.html`)
  await page.waitForFunction(() => window.result !== undefined, null, { timeout: 120000 })
  const r = await page.evaluate(() => window.result)
  await browser.close()
  await server.close()
  if (r.error) {
    console.error(r.error)
    process.exit(1)
  }
  inBrowser = short(r)
}
const out = {
  library: `@dimforge/rapier2d-deterministic-compat ${inNode.version}`,
  test: `${inNode.steps} steps at 240 a second, six balls, three bumpers, guides, a scheduled flipper and nudges`,
  machine: machine(),
  browser: browserVersion,
  node: inNode,
  nodeAgain: again,
  browserRun: inBrowser,
  equalInNodeTwice: inNode.state === again.state && inNode.snapshot === again.snapshot,
  equalNodeAndBrowser: inBrowser ? inNode.state === inBrowser.state : null
}
const file = at('out', 'work', 'phase0', 'physics', `physics-${machine().host}.json`)
writeJson(file, out)
console.log(`library ${out.library}`)
console.log(`node    state ${inNode.state}`)
console.log(`node    snapshot ${inNode.snapshot} (${inNode.snapshotBytes} bytes)`)
console.log(`again   state ${again.state}`)
if (inBrowser) console.log(`browser state ${inBrowser.state} (${browserVersion})`)
if (inBrowser) console.log(`browser snapshot ${inBrowser.snapshot}`)
console.log(`first ball ${JSON.stringify(inNode.first)}`)
console.log(`equal in Node twice: ${out.equalInNodeTwice}. equal in Node and browser: ${out.equalNodeAndBrowser}`)
console.log(`wrote ${file.replace(root + '/', '')}`)
if (a.draw) {
  // A picture of the ten seconds: every ball's path on the test plane.
  const sharp = (await import('sharp')).default
  const S = 1000
  const colours = ['#e8622c', '#2f6fb3', '#3c8f5a', '#8b5fbf', '#c79a1e', '#4a4f57']
  const lines = traced.path.map((p, i) => {
    let d = ''
    for (let k = 0; k < p.length; k += 2) d += `${k ? 'L' : 'M'}${(40 + p[k] * S).toFixed(1)} ${(40 + p[k + 1] * S).toFixed(1)}`
    return `<path d="${d}" fill="none" stroke="${colours[i]}" stroke-width="1.6" stroke-opacity="0.85"/><circle cx="${(40 + p[p.length - 2] * S).toFixed(1)}" cy="${(40 + p[p.length - 1] * S).toFixed(1)}" r="13.5" fill="${colours[i]}"/>`
  }).join('')
  const L = (ax, ay, bx, by) => `<line x1="${40 + ax * S}" y1="${40 + ay * S}" x2="${40 + bx * S}" y2="${40 + by * S}" stroke="#3a3d42" stroke-width="4" stroke-linecap="round"/>`
  const walls = [[0, 0, 0.5, 0], [0.5, 0, 0.5, 1], [0.5, 1, 0, 1], [0, 1, 0, 0], [0, 0.62, 0.16, 0.86], [0.5, 0.62, 0.34, 0.86], [0.08, 0.3, 0.14, 0.42], [0.42, 0.3, 0.36, 0.42]].map((w) => L(...w)).join('')
  const bumpers = [[0.17, 0.22], [0.33, 0.22], [0.25, 0.34]].map(([x, y]) => `<circle cx="${40 + x * S}" cy="${40 + y * S}" r="30" fill="#d9d5cc" stroke="#3a3d42" stroke-width="3"/>`).join('')
  const text = `<text x="580" y="80" font-family="DejaVu Sans" font-size="26" fill="#22252a">Physics test, ten seconds</text><text x="580" y="120" font-family="DejaVu Sans" font-size="20" fill="#4a4f57">2400 steps at 240 a second</text><text x="580" y="150" font-family="DejaVu Sans" font-size="20" fill="#4a4f57">six balls, three bumpers, a flipper</text><text x="580" y="200" font-family="DejaVu Sans" font-size="20" fill="#22252a">Hash of the whole path</text><text x="580" y="230" font-family="DejaVu Sans Mono" font-size="17" fill="#22252a">${inNode.state.slice(0, 32)}</text><text x="580" y="254" font-family="DejaVu Sans Mono" font-size="17" fill="#22252a">${inNode.state.slice(32)}</text><text x="580" y="304" font-family="DejaVu Sans" font-size="20" fill="#4a4f57">Node, twice: ${out.equalInNodeTwice ? 'equal' : 'DIFFERENT'}</text><text x="580" y="334" font-family="DejaVu Sans" font-size="20" fill="#4a4f57">Node and the browser: ${out.equalNodeAndBrowser === null ? 'not run' : out.equalNodeAndBrowser ? 'equal' : 'DIFFERENT'}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1080"><rect width="1000" height="1080" fill="#f1eee8"/>${walls}${bumpers}${lines}${text}</svg>`
  const picture = at('out', 'work', 'phase0', 'physics', 'physics-paths.png')
  await sharp(Buffer.from(svg)).png().toFile(picture)
  console.log(`wrote ${picture.replace(root + '/', '')}`)
}
if (a.expect && a.expect !== inNode.state) {
  console.log(`DIFFERENT from the expected ${a.expect}`)
  process.exit(2)
}
if (a.expect) console.log('EQUAL to the expected hash')
