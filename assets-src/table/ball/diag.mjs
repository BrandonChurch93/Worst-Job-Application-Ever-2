// node assets-src/table/ball/diag.mjs --keys reply-all,rail-cam --variants asis,noshell,nobend --tier review
// Renders the ball of each key in each variant and writes its native-size crop beside the approved crop.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at } from '../../../tools/lib/paths.mjs'
import { openSession, stillFrom } from '../../../tools/lib/capture.mjs'

const a = args()
const keys = String(a.keys || 'reply-all').split(',')
const variants = String(a.variants || 'asis').split(',')
const tier = a.tier || 'draft'
const size = Number(a.size || 420)
const DETAIL = { asis: { shell: true, bend: true, press: null }, noshell: { shell: false, bend: true, press: null }, nobend: { shell: true, bend: false, press: null }, press: { shell: true, bend: true, press: [1, 0, 0.1] }, pressmost: { shell: true, bend: true, press: [1, 0, 0.14] } }
const dir = at('out', 'work', 'ball-diag')
fs.mkdirSync(dir, { recursive: true })
const session = await openSession({ format: 'hd' })
try {
  for (const key of keys) {
    const isSheet = key.startsWith('sheet:')
    const { spec } = stillFrom(isSheet ? { sheet: key.slice(6), tier } : { key, tier })
    const tiles = []
    let box = null
    for (const v of variants) {
      const t0 = Date.now()
      const b64 = await session.page.evaluate(async ([s, d]) => {
        window.dispatchEvent(new CustomEvent('wjb-ball', { detail: d }))
        window.showcase.setDiagnostic('beauty')
        await window.showcase.renderStill(s)
        const c = document.querySelector('canvas')
        return c.toDataURL('image/png').split(',')[1]
      }, [spec, DETAIL[v] || DETAIL.asis])
      const png = Buffer.from(b64, 'base64')
      const file = path.join(dir, `${key.replace(':', '-')}-${v}-${tier}.png`)
      fs.writeFileSync(file, png)
      const state = await session.page.evaluate((s) => window.showcase.stillState(s), spec)
      const c = state.cursor
      const meta = await sharp(png).metadata()
      const sx = meta.width / 1920
      if (!box) {
        if (a.box) box = String(a.box).split(',').map(Number)
        else {
          const r = Math.max(60, (c.ballScreenPx || 96) * 0.9)
          box = [Math.round(c.ballX * sx - r), Math.round(c.ballY * sx - r), Math.round(r * 2), Math.round(r * 2)]
        }
        box[0] = Math.max(0, Math.min(meta.width - box[2], box[0]))
        box[1] = Math.max(0, Math.min(meta.height - box[3], box[1]))
        console.log(key, 'ball', c.ballX, c.ballY, c.ballScreenPx, 'box', box.join(','))
      }
      tiles.push(await sharp(png).extract({ left: box[0], top: box[1], width: box[2], height: box[3] }).resize(size, size, { kernel: box[2] < size ? 'nearest' : 'lanczos3' }).png().toBuffer())
      console.log(key, v, ((Date.now() - t0) / 1000).toFixed(1), 's', session.problems.slice(-2).join(' | '))
    }
    const ref = at('references', 'approved', `${isSheet ? key.slice(6) : key}.png`)
    if (fs.existsSync(ref) && !a.noref) {
      const m = await sharp(ref).metadata()
      const k = m.width / 1920
      const rb = a.refbox ? String(a.refbox).split(',').map(Number) : box.map((n) => Math.round(n * k))
      tiles.unshift(await sharp(ref).extract({ left: rb[0], top: rb[1], width: Math.min(rb[2], m.width - rb[0]), height: Math.min(rb[3], m.height - rb[1]) }).resize(size, size).png().toBuffer())
    }
    const out = path.join(dir, `${key.replace(':', '-')}-${tier}-row.png`)
    await sharp({ create: { width: tiles.length * (size + 6), height: size, channels: 3, background: '#202020' } }).composite(tiles.map((t, i) => ({ input: t, left: i * (size + 6), top: 0 }))).png().toFile(out)
    console.log('row', out)
  }
} finally {
  await session.close()
}
