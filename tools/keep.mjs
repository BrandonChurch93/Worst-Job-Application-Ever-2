// npm run keep: copies the judged stills, comparison images and sheets of this build into out/stills/, each with its record.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'

const a = args()
const c = config()
const info = buildInfo(at())
const dest = at('out', 'stills')
fs.mkdirSync(dest, { recursive: true })
const list = (dir, test) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(test).sort().map((f) => path.join(dir, f)) : [])
const current = (r) => r.engineHash === info.engineHash && Object.keys(r.pageHashes || {}).every((u) => r.pageHashes[u] === info.pageHashes[u])
const ofUnit = (r) => !a.unit || Object.keys(r.pageHashes || {}).includes(a.unit)
let kept = 0
let stale = 0

for (const file of [...list(at('out', 'work', 'stills'), (f) => /^(key|still|sheet)-.*\.png$/.test(f)), ...list(at('out', 'work', 'compare'), (f) => f.endsWith('.jpg')), ...list(at('out', 'work', 'sheets'), (f) => /\.(jpg|png)$/.test(f))]) {
  const rec = file.replace(/\.[a-z0-9]+$/i, '.json')
  if (!fs.existsSync(rec)) continue
  const record = readJson(rec)
  if (!ofUnit(record)) continue
  if (!current(record) && !a.stale) {
    stale++
    console.log(`left: ${path.relative(at(), file)} was made from an older build`)
    continue
  }
  const name = path.basename(file).replace(/\.[a-z0-9]+$/i, '.jpg')
  if (file.endsWith('.jpg')) fs.copyFileSync(file, path.join(dest, name))
  else await sharp(file).jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).toFile(path.join(dest, name))
  writeJson(path.join(dest, name.replace(/\.jpg$/, '.json')), { ...record, keptFrom: path.relative(at(), file) })
  kept++
}
console.log(`keep: ${kept} pictures in out/stills/ with their records${stale ? `, ${stale} left because they are from an older build` : ''}`)

const newest = (files) => files.map((f) => ({ f, t: fs.statSync(f).mtimeMs })).sort((x, y) => y.t - x.t)[0]?.f
if (a.film) {
  const work = at('out', 'work')
  for (const which of ['a', 'b']) {
    const film = newest(list(work, (f) => new RegExp(`^film-${which}-${c.formats.preview.id}-.*\\.mp4$`).test(f)))
    if (!film) continue
    fs.copyFileSync(film, at('out', `film-${which}-preview.mp4`))
    const rec = film.replace(/\.mp4$/, '.json')
    if (fs.existsSync(rec)) fs.copyFileSync(rec, at('out', `film-${which}-preview.json`))
    console.log(`keep: out/film-${which}-preview.mp4 from ${path.relative(at(), film)}`)
  }
  const cut = newest(list(work, (f) => /^review-cut.*\.mp4$/.test(f)))
  if (cut) {
    fs.copyFileSync(cut, at('out', 'review-cut.mp4'))
    const rec = cut.replace(/\.mp4$/, '.json')
    if (fs.existsSync(rec)) fs.copyFileSync(rec, at('out', 'review-cut.json'))
    console.log(`keep: out/review-cut.mp4 from ${path.relative(at(), cut)}`)
  }
}
if (a.deliver) {
  const loop = at('out', 'work', 'loop')
  fs.mkdirSync(at('deliver'), { recursive: true })
  let n = 0
  for (const f of list(loop, (x) => /^card-(loop|still)/.test(x))) {
    fs.copyFileSync(f, at('deliver', path.basename(f)))
    n++
  }
  console.log(n ? `keep: ${n} files of the card in deliver/` : 'keep: no card loop under out/work/loop/ yet')
}
