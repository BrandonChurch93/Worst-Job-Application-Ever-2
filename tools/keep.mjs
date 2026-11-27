// npm run keep: copies the judged stills, comparison images and sheets of this build into out/stills/, each with its record.
// --film also keeps the newest whole preview film of this build as out/<export.files.previewB>, and film A's as previewA, each with a record.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { probe } from './lib/film-encode.mjs'
import { isWholePreview, keptNames, keptRecord, megabytes, reasonsAgainst, reasonsFromProbe, reasonsFromSound, tooLarge } from './lib/film-keep.mjs'
import { keptRecordsIn, keptSum } from './lib/cut-build.mjs'

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
let code = 0
if (a.film) {
  const work = at('out', 'work')
  const rel = (f) => path.relative(at(), f)
  const shaOf = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
  const git = (words) => {
    const r = spawnSync('git', words, { cwd: at(), encoding: 'utf8' })
    return r.status === 0 ? r.stdout.trim() : null
  }
  const commit = git(['rev-parse', 'HEAD'])
  const commitClean = git(['status', '--porcelain', '--', 'src', 'config', 'content', 'public', 'assets-full', 'package-lock.json']) === ''
  const names = keptNames(c)
  const cutList = at('cut', 'CUTLIST.json')
  const soundNow = { cutSha256: fs.existsSync(cutList) ? shaOf(cutList) : null, keptSha256: keptSum(keptRecordsIn(at('audio', 'kept'))) }
  const lines = []
  for (const which of ['b', 'a']) {
    const title = `film ${which.toUpperCase()}`
    const found = list(work, (f) => isWholePreview(f, which, c)).map((f) => ({ f, t: fs.statSync(f).mtimeMs })).sort((x, y) => y.t - x.t).map((x) => x.f)
    if (!found.length) {
      if (which === 'b') {
        console.error(`keep: no preview of film B under out/work/. Render it with npm run film -- --which b`)
        code = code || 1
      } else lines.push('no preview of film A under out/work/, so none is kept')
      continue
    }
    let kept = null
    for (const film of found) {
      const rec = film.replace(/\.[a-z0-9]+$/i, '.json')
      const record = fs.existsSync(rec) ? readJson(rec) : null
      const why = record ? [...reasonsAgainst(record, info, c, which), ...reasonsFromSound(record, soundNow)] : ['it has no record beside it']
      let sha256 = null
      let p = null
      if (!why.length) {
        sha256 = shaOf(film)
        if (sha256 !== record.sha256) why.push('the file is not the one its record names')
        else {
          p = probe(film)
          why.push(...reasonsFromProbe(p, record, c))
        }
      }
      if (why.length) {
        console.log(`keep: refused ${rel(film)}: ${why.join('; ')}`)
        continue
      }
      const bytes = fs.statSync(film).size
      if (tooLarge(bytes, c)) {
        console.error(`keep: ${rel(film)} is ${megabytes(bytes)} MB, and repo.maxFileMb is ${c.repo.maxFileMb}. It is not kept and not made smaller here: render it at a lower bitrate`)
        code = 2
        kept = false
        break
      }
      const out = at('out', names[which])
      fs.copyFileSync(film, out)
      writeJson(out.replace(/\.[a-z0-9]+$/i, '.json'), keptRecord(record, c, which, { commit, commitClean, from: rel(film), sha256, bytes, probe: p }))
      lines.push(`${rel(out)} is ${title} from ${rel(film)}: ${p.frames} frames at ${p.rate} a second, ${p.width} by ${p.height}, ${megabytes(bytes)} MB, ${p.audio ? 'with sound' : 'no sound'}, ${record.tier} tier, commit ${commit ? commit.slice(0, 7) : 'unknown'}${commitClean ? '' : ' with changes not committed'}`)
      kept = true
      break
    }
    if (kept === null) {
      if (which === 'b') {
        console.error(`keep: no preview of film B under out/work/ is of this build, so none is kept. Render it again with npm run film -- --which b`)
        code = code || 1
      } else lines.push('no preview of film A under out/work/ is of this build, so none is kept')
    }
  }
  for (const line of lines) console.log(`keep: ${line}`)
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
process.exit(code)
