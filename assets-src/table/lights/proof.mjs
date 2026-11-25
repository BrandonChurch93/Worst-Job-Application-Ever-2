// node assets-src/table/lights/proof.mjs: the contact sheet of each tier lit by each of its groups alone, in out/work/lights/.
// The names of the groups are read from the page itself, so the sheet cannot fall behind the code.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { at } from '../../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../../tools/lib/capture.mjs'

const keys = { marquee: 'table-wide', corporate: 'tier-corporate', office: 'tier-office', street: 'tier-street' }
const only = process.argv.includes('--zone') ? process.argv[process.argv.indexOf('--zone') + 1] : null
const dir = at('out', 'work', 'lights')
fs.mkdirSync(dir, { recursive: true })
const contract = JSON.parse(fs.readFileSync(at('config', 'showcase.json'), 'utf8'))
const session = await openSession({ format: 'preview', assets: 'full' })
const sheets = []
try {
  for (const [zone, key] of Object.entries(keys)) {
    if (only && only !== zone) continue
    const k = contract.keys.find((x) => x.id === key)
    const spec = { page: k.unit, beat: k.beat, at: k.at, camera: k.camera, tier: 'draft' }
    const ask = (group) => session.page.evaluate((g) => window.dispatchEvent(new CustomEvent('wjl-solo', { detail: g })), group)
    await ask(null)
    fs.writeFileSync(path.join(dir, `${zone}-all.png`), await renderJob(session, { spec }))
    const groups = await session.page.evaluate((id) => {
      const found = new Set()
      window.dispatchEvent(new CustomEvent('wjl-groups', { detail: { zone: id, into: found } }))
      return [...found]
    }, zone)
    const files = [path.join(dir, `${zone}-all.png`)]
    for (const g of groups) {
      await ask(g)
      const file = path.join(dir, `${g.replace(/\./g, '-')}.png`)
      fs.writeFileSync(file, await renderJob(session, { spec }))
      files.push(file)
      console.log(`lit by ${g} alone: ${path.relative(at(), file)}`)
    }
    await ask(null)
    const sheet = path.join(dir, `sheet-${zone}.jpg`)
    execFileSync('montage', [...files, '-tile', '4x', '-geometry', '480x270+4+4', '-background', '#101012', '-quality', '88', sheet])
    sheets.push(sheet)
    console.log(`sheet: ${path.relative(at(), sheet)} (first frame: every group at its level, then ${groups.join(', ')})`)
  }
} finally {
  await session.close()
}
