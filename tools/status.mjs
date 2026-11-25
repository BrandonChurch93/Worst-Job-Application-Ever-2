// npm run status -- --phase N [--unit ID]: ticks the clock, chooses the pictures, writes the status set and the gallery, prints the lines.
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { readLooks } from './lib/looks.mjs'
import { getStatus, sectionBody } from './lib/progress.mjs'
import { writeStatus } from './lib/status-core.mjs'

const a = args()
const c = config()
const which = a['review-round'] !== undefined ? ['--review-round', String(a['review-round'])] : a.extension !== undefined ? ['--extension', String(a.extension)] : ['--phase', String(a.phase)]
if (which[1] === 'undefined') {
  console.error('status: --phase N | --review-round N | --extension N, with --spec FILE.json for the lines')
  process.exit(1)
}
const spec = a.spec ? readJson(a.spec) : { lines: [] }
const tick = execFileSync('node', [at('tools', 'clock.mjs'), ...(a['no-tick'] ? [] : [...which, '--status'])], { encoding: 'utf8' })
const find = (re) => (tick.match(re) ?? [, 'not printed'])[1]
const phaseTime = find(/^time used in this phase: (.+)$/m)
const runTime = find(/^time used: (.+)$/m)
const time = find(/tick \d+ at (\S+),/) === 'not printed' ? new Date().toISOString() : find(/tick \d+ at (\S+),/)

const shownFile = at('out', 'work', 'status', 'shown.json')
const shown = new Set(fs.existsSync(shownFile) ? readJson(shownFile) : [])
const max = c.status.maxPictures
const rendering = spawnSync('pgrep', ['-f', 'use-angle=swiftshader'], { encoding: 'utf8' }).stdout.trim() !== ''
const mayRender = !a['no-render'] && !rendering
const pictures = [...(spec.pictures ?? [])]
const have = (file) => pictures.some((p) => path.resolve(p.file) === path.resolve(file))
const info = buildInfo(at())
const current = (file) => {
  const rec = file.replace(/\.[a-z0-9]+$/i, '.json')
  if (!fs.existsSync(rec)) return false
  const r = readJson(rec)
  return r.engineHash === info.engineHash && Object.keys(r.pageHashes || {}).every((u) => r.pageHashes[u] === info.pageHashes[u])
}

if (!pictures.length) {
  if (a.sounds) {
    const sheet = at('out', 'work', 'sound', 'kept-sounds.jpg')
    if (fs.existsSync(sheet)) pictures.push({ file: sheet, caption: 'The kept sounds as waveforms' })
  }
  if (a.unit) {
    const keys = c.keys.filter((k) => k.unit === a.unit)
    const file = (k) => at('out', 'work', 'compare', `compare-${k.id}.jpg`)
    let key = keys.find((k) => fs.existsSync(file(k)) && current(file(k)))
    if (!key && keys.length && mayRender) {
      const r = spawnSync('node', [at('tools', 'compare.mjs'), '--key', keys[0].id, '--tier', 'review'], { encoding: 'utf8' })
      if (r.status === 0) key = keys[0]
      else console.error(`status: the comparison for ${keys[0].id} could not be rendered: ${(r.stderr || r.stdout).trim().split('\n').pop()}`)
    }
    if (!key) key = keys.find((k) => fs.existsSync(file(k)))
    if (key) pictures.push({ file: file(key), caption: `Key ${key.id}: approved on the left, this build on the right${current(file(key)) ? '' : ' (from an older build)'}` })
  } else {
    const pages = at('out', 'work', 'sheets', 'pages.jpg')
    if (fs.existsSync(pages)) pictures.push({ file: pages, caption: `The six pages at rest${current(pages) ? '' : ' (from an older build)'}` })
  }
  const looks = readLooks().reverse()
  const pool = a.unit ? looks : [...looks.filter((l) => /sheet/.test(l.file)), ...looks.filter((l) => !/sheet/.test(l.file))]
  for (const l of pool) {
    if (pictures.length >= max) break
    const file = at(l.file)
    if (!fs.existsSync(file) || shown.has(l.file) || have(file)) continue
    pictures.push({ file, caption: l.caption, by: l.by })
  }
  if (!pictures.length) pictures.push({ file: at('references', 'approved', 'contact-sheet.jpg'), caption: 'The approved images. Nothing new has been rendered since the last status' })
}

function defaultLinks() {
  const address = (key) => {
    try {
      return (String(getStatus(key)).match(/https?:\/\/\S+/) ?? [null])[0]
    } catch {
      return null
    }
  }
  const site = address('Site URL')
  const review = address('Review page')
  return [site ? `Site: ${site}` : 'Site: not published yet', review ? `Review page: ${review}` : 'Review page: not published yet']
}

const numberNow = (() => {
  if (a.number) return Number(a.number)
  const m = sectionBody('Latest pictures').match(/^Status (\d+)/m)
  return m ? Number(m[1]) + 1 : 1
})()
const lines = (spec.lines ?? []).map((l) => l.replaceAll('{phaseTime}', phaseTime).replaceAll('{runTime}', runTime))
if (!lines.some((l) => l.includes(runTime))) lines.push(`Time used: ${runTime}. In this phase: ${phaseTime}.`)
const links = spec.links ?? defaultLinks()
const out = writeStatus({ number: numberNow, phase: a.phase ?? which.join(' ').replace('--', ''), time, lines, pictures: pictures.slice(0, max), links })
for (const p of pictures.slice(0, max)) shown.add(path.relative(at(), path.resolve(p.file)))
writeJson(shownFile, [...shown])
console.log(tick.trim())
console.log('')
console.log(`Status ${numberNow}`)
for (const l of lines) console.log(l)
for (const s of out.shown) console.log(`picture: out/stills/status/${s.name} (${s.w}x${s.h}) ${s.caption}`)
for (const l of links) console.log(l)
console.log(`gallery: ${out.galleryFile}`)
if (rendering && !a['no-render']) console.log('status: a render job is running in this VM, so nothing was rendered for this status')
