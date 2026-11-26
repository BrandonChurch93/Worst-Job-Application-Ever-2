// node assets-src/table/lights/look.mjs [--keys a,b] [--tier draft] [--name x]: the keys of the machine in one session, each beside its approved image, in out/work/lights/.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at } from '../../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../../tools/lib/capture.mjs'

const arg = (name, otherwise) => (process.argv.includes(`--${name}`) ? process.argv[process.argv.indexOf(`--${name}`) + 1] : otherwise)
const keys = arg('keys', 'tier-corporate,tier-office,tier-street,table-wide').split(',')
const tier = arg('tier', 'draft')
const name = arg('name', 'look')
const dir = at('out', 'work', 'lights')
fs.mkdirSync(dir, { recursive: true })
const contract = JSON.parse(fs.readFileSync(at('config', 'showcase.json'), 'utf8'))
const session = await openSession({ format: 'hd', assets: arg('assets', 'full') })
const pairs = []
try {
  for (const key of keys) {
    const k = contract.keys.find((x) => x.id === key)
    const started = Date.now()
    const png = await renderJob(session, { spec: { page: k.unit, beat: k.beat, at: k.at, camera: k.camera, tier } })
    const file = path.join(dir, `${name}-${key}.png`)
    fs.writeFileSync(file, png)
    const left = await sharp(at('references', 'approved', `${key}.png`)).resize(960, 540).toBuffer()
    const right = await sharp(png).resize(960, 540).toBuffer()
    const pair = path.join(dir, `${name}-${key}-pair.jpg`)
    await sharp({ create: { width: 1924, height: 540, channels: 3, background: '#101012' } }).composite([{ input: left, left: 0, top: 0 }, { input: right, left: 964, top: 0 }]).jpeg({ quality: 90 }).toFile(pair)
    pairs.push(pair)
    console.log(`${key}: ${path.relative(at(), pair)} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
  }
} finally {
  if (session.problems.length) console.log(`the page reported:\n- ${[...new Set(session.problems)].slice(0, 6).join('\n- ')}`)
  await session.close()
}
