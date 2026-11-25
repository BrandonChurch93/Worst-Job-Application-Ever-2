// Builds the review page: dist/review.html and the files it plays in dist/review/.
// It is not part of the site and not part of any hash.
import fs from 'node:fs'
import path from 'node:path'
import { args, at, config, readJson, root } from './lib/paths.mjs'
import { getStatus, sectionBody } from './lib/progress.mjs'

const a = args()
const cfg = config()
const dist = at('dist')
const outDir = path.join(dist, 'review')
const pageFile = path.join(dist, 'review.html')
const MB = 1024 * 1024
const NOTHING = 'Nothing here yet.'
const NOT_MADE = 'not made yet'

const maxMb = a['max-mb'] === undefined ? null : Number(a['max-mb'])
if (maxMb !== null && !(maxMb >= 0)) {
  console.error('review: --max-mb takes a number of megabytes, for example --max-mb 200')
  process.exit(1)
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const href = (rel) => rel.split('/').map(encodeURIComponent).join('/')
const attempt = (fn, fallback) => {
  try {
    const v = fn()
    return v === undefined || v === null ? fallback : v
  } catch {
    return fallback
  }
}
const isFile = (p) => attempt(() => fs.statSync(p).isFile(), false)
const names = (dir, test) => attempt(() => fs.readdirSync(dir).filter((n) => test(n) && isFile(path.join(dir, n))).sort(), [])
const isPicture = (n) => /\.(jpe?g|png|webp)$/i.test(n)
const isSound = (n) => /\.(wav|mp3|m4a|ogg|oga|opus|flac|aac)$/i.test(n)
const stem = (n) => n.replace(/\.[^.]+$/, '')
const words = (n) => stem(n).replace(/[-_]+/g, ' ').trim()
const size = (bytes) => (bytes >= MB / 10 ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`)
const secs = (s) => (typeof s === 'number' && Number.isFinite(s) ? `${s.toFixed(s < 10 ? 2 : 1)} s` : '')
const asList = (v) => (Array.isArray(v) ? v : [])

const items = []
function take(src, folder, kind, label, extra = {}) {
  if (!isFile(src)) return null
  let name = path.basename(src)
  let n = 1
  while (items.some((i) => i.rel === `review/${folder}/${name}`)) name = `${stem(path.basename(src))}-${++n}${path.extname(src)}`
  const stat = fs.statSync(src)
  const item = { src, rel: `review/${folder}/${name}`, kind, label, bytes: stat.size, mtime: stat.mtimeMs, left: false, ...extra }
  items.push(item)
  return item
}
const firstOf = (...paths) => paths.find(isFile)
const recordCaption = (file) => {
  const r = attempt(() => readJson(file.replace(/\.[^.]+$/, '.json')), null)
  return r && typeof r.caption === 'string' ? r.caption : ''
}

const files = cfg.export?.files ?? {}
const hd = cfg.formats?.hd ?? {}

const statusDir = at('out', 'stills', 'status')
const statusText = attempt(() => fs.readFileSync(path.join(statusDir, 'STATUS.md'), 'utf8'), '')
const statusHead = statusText.match(/^Time: (\S+?)\. Phase (.+?), status (.+?)\.\s*$/m)
const statusCaptions = new Map([...statusText.matchAll(/^\d+\. `([^`]+)`: (.*)$/gm)].map((m) => [m[1], m[2]]))
const statusPictures = names(statusDir, isPicture).map((n) => take(path.join(statusDir, n), 'status', 'image', statusCaptions.get(n) ?? words(n)))

const reviewCutSrc = files.reviewCut ? firstOf(at('out', 'work', files.reviewCut), at('out', files.reviewCut)) : undefined
const reviewCut = reviewCutSrc ? take(reviewCutSrc, 'films', 'video', 'The review cut, with sound') : null
const roughCut = take(at('out', 'roughcut.mp4'), 'films', 'video', 'The rough cut')
const previews = [
  files.previewB ? take(at('out', files.previewB), 'films', 'video', 'Preview film B, without the prompt') : null,
  files.previewA ? take(at('out', files.previewA), 'films', 'video', 'Preview film A, with the prompt') : null,
].filter(Boolean)

function newestHdFilms() {
  const dir = at('out', 'work')
  let found = names(dir, (n) => /^film-.+\.mp4$/i.test(n)).map((n) => ({ n, parts: stem(n).split('-'), mtime: fs.statSync(path.join(dir, n)).mtimeMs }))
  const inHd = found.filter((f) => hd.id && f.parts.includes(hd.id))
  if (inHd.length) found = inHd
  const newest = new Map()
  for (const f of found.sort((x, y) => y.mtime - x.mtime)) {
    const which = f.parts[1] ?? f.n
    if (!newest.has(which)) newest.set(which, f)
  }
  return [...newest.entries()]
    .sort(([x], [y]) => (x < y ? 1 : -1))
    .map(([which, f]) => take(path.join(dir, f.n), 'films', 'video', `Film ${which.toUpperCase()} at ${hd.width ?? '?'} by ${hd.height ?? '?'}, newest render`))
}
const hdFilms = newestHdFilms().filter(Boolean)

const cardFile = (name) => (name ? firstOf(at('deliver', name), at('out', 'work', 'loop', name)) : undefined)
const cardPart = (name, kind, label) => {
  const src = cardFile(name)
  return src ? take(src, 'card', kind, label, { loop: kind === 'video' }) : null
}
const card = [cardPart(files.cardLoop, 'video', 'The card loop'), cardPart(files.cardLoopWeb, 'video', 'The card loop, web copy'), cardPart(files.cardStill, 'image', 'The card still')].filter(Boolean)

const stillsDir = at('out', 'stills')
const keyById = new Map(asList(cfg.keys).map((k) => [k.id, k]))
const sheetById = new Map(asList(cfg.sheets).map((s) => [s.id, s]))
const compareLabel = (n) => {
  const id = stem(n).replace(/^compare-/, '')
  const said = recordCaption(path.join(stillsDir, n))
  if (said) return said
  const k = keyById.get(id)
  if (k) return `Key ${id}: the approved image beside the build. Page ${k.unit}, beat ${k.beat}.`
  const s = sheetById.get(id)
  if (s) return `Sheet ${id}: the approved sheet beside the build. It shows ${s.shows}.`
  return words(n)
}
const stillNames = names(stillsDir, isPicture)
const comparisons = stillNames.filter((n) => /^compare-/i.test(n)).map((n) => take(path.join(stillsDir, n), 'stills', 'image', compareLabel(n)))
const sheets = stillNames.filter((n) => /^sheet-/i.test(n)).map((n) => take(path.join(stillsDir, n), 'stills', 'image', recordCaption(path.join(stillsDir, n)) || words(n)))
const keptStills = stillNames.filter((n) => !/^(compare|sheet)-/i.test(n)).map((n) => take(path.join(stillsDir, n), 'stills', 'image', recordCaption(path.join(stillsDir, n)) || words(n)))

const mixSrc = firstOf(...['wav', 'mp3', 'm4a'].map((e) => at('audio', 'mix', `review.${e}`)))
const mix = mixSrc ? take(mixSrc, 'sound', 'audio', 'The review mix') : null

const keptDir = at('audio', 'kept')
const soundNames = names(keptDir, isSound)
const records = names(keptDir, (n) => /\.json$/i.test(n))
  .map((n) => {
    const r = attempt(() => readJson(path.join(keptDir, n)), null)
    if (!r || typeof r !== 'object') return null
    const sound = soundNames.find((s) => stem(s) === stem(n))
    return { ...r, file: n, item: sound ? take(path.join(keptDir, sound), 'sound/kept', 'audio', r.text ?? r.describes ?? stem(n)) : null, used: false }
  })
  .filter(Boolean)
const strays = soundNames.filter((s) => !records.some((r) => stem(r.file) === stem(s))).map((s) => take(path.join(keptDir, s), 'sound/kept', 'audio', stem(s)))

// The largest videos go first when the folder has to fit a size.
const leftOut = []
const total = () => items.filter((i) => !i.left).reduce((s, i) => s + i.bytes, 0)
if (maxMb !== null) {
  const videos = items.filter((i) => i.kind === 'video').sort((x, y) => y.bytes - x.bytes)
  while (total() > maxMb * MB && videos.length) {
    const v = videos.shift()
    v.left = true
    leftOut.push(v)
  }
}
const stillTooLarge = maxMb !== null && total() > maxMb * MB

fs.mkdirSync(dist, { recursive: true })
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })
for (const i of items) {
  if (i.left) continue
  const dest = path.join(dist, i.rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(i.src, dest)
}

const leftNote = (i) => `<p class="left">Left out to fit the size limit: ${esc(i.label)} (${size(i.bytes)}).</p>`
const video = (i) => (i.left ? leftNote(i) : `<figure><video controls preload="metadata" playsinline${i.loop ? ' loop' : ''} src="${href(i.rel)}"></video><figcaption>${esc(i.label)} <span class="soft">${esc(path.basename(i.src))}, ${size(i.bytes)}</span></figcaption></figure>`)
const image = (i) => `<figure><a href="${href(i.rel)}"><img src="${href(i.rel)}" alt="${esc(i.label)}" loading="lazy"></a><figcaption>${esc(i.label)}</figcaption></figure>`
const audio = (i) => `<audio controls preload="none" src="${href(i.rel)}"></audio>`
const show = (i) => (i.kind === 'video' ? video(i) : i.kind === 'image' ? image(i) : audio(i))
const none = `<p class="none">${NOTHING}</p>`
const notMade = `<span class="none">${NOT_MADE}</span>`

function playersOf(recs, labelOf) {
  const made = recs.filter((r) => r.item)
  if (!made.length) return notMade
  return made.map((r) => `<div class="player">${made.length > 1 || labelOf(r) ? `<span class="soft">${esc(labelOf(r) || 'take')}</span>` : ''}${audio(r.item)}</div>`).join('')
}

function matchLines(lines, recs) {
  const byIndex = recs.filter((r) => !lines.some((l) => l === r.text))
  const base = byIndex.some((r) => r.index === 0) || !byIndex.some((r) => r.index === lines.length) ? 0 : 1
  return lines.map((text, i) => {
    const mine = recs.filter((r) => r.text === text || (byIndex.includes(r) && r.index === i + base))
    for (const r of mine) r.used = true
    return mine
  })
}

function lineRow(place, text, recs) {
  const length = recs.find((r) => typeof r.seconds === 'number')
  const other = recs.find((r) => typeof r.text === 'string' && r.text !== text)
  return `<li class="row"><div class="meta"><span class="tag">${esc(place)}</span>${length ? `<span class="soft">${secs(length.seconds)}</span>` : ''}</div><div class="words">${esc(text)}${other ? `<div class="soft">The kept file was made from other words: ${esc(other.text)}</div>` : ''}</div><div class="play">${playersOf(recs, () => '')}</div></li>`
}

const narration = attempt(() => readJson(at('content', 'narration.json')), {})
const spoken = narration.film && typeof narration.film === 'object' ? narration.film : {}
const lineRecords = records.filter((r) => r.kind === 'line')
const filmRows = []
const seenBeats = new Set()
const beatRows = (beat) => {
  seenBeats.add(beat)
  const lines = asList(spoken[beat]).slice().sort((x, y) => (x.at ?? 0) - (y.at ?? 0))
  const matched = matchLines(lines.map((l) => l.text), lineRecords.filter((r) => r.beat === beat))
  lines.forEach((l, i) => filmRows.push(lineRow(beat, l.text, matched[i])))
}
for (const u of asList(cfg.film?.units)) {
  for (const b of asList(cfg.film?.beats).filter((x) => x.unit === u.id).sort((x, y) => x.from - y.from)) beatRows(b.id)
}
for (const beat of Object.keys(spoken)) if (!seenBeats.has(beat)) beatRows(beat)

const liveRecords = records.filter((r) => r.kind === 'live-line')
const liveRows = []
for (const [group, lines] of Object.entries(narration.liveOnly ?? {})) {
  if (group === 'about' || !Array.isArray(lines)) continue
  const matched = matchLines(lines, liveRecords.filter((r) => r.group === group))
  lines.forEach((text, i) => liveRows.push(lineRow(group, text, matched[i])))
}

const cueRecords = records.filter((r) => r.kind === 'cue')
const cueRows = asList(cfg.audio?.sfx).map((s) => {
  const recs = cueRecords.filter((r) => (r.cue ?? r.id) === s.id).sort((x, y) => (x.variant ?? 0) - (y.variant ?? 0))
  for (const r of recs) r.used = true
  const made = recs.filter((r) => r.item)
  const describes = recs.find((r) => r.describes)?.describes ?? s.describes ?? s.description ?? s.note ?? s.text ?? s.prompt
  const wanted = s.variants ?? 1
  const lengths = [...new Set(made.map((r) => secs(r.seconds)).filter(Boolean))]
  const meta = [`planned ${secs(s.seconds)}`, lengths.length ? `kept ${lengths.join(', ')}` : '', wanted > 1 ? `${made.length} of ${wanted} variants made` : ''].filter(Boolean)
  const label = (r) => (wanted > 1 || r.variant !== undefined ? `variant ${r.variant ?? '?'}` : '')
  return `<li class="row"><div class="meta"><span class="tag">${esc(s.id)}</span><span class="soft">${esc(meta.join(', '))}</span></div><div class="words">${describes ? esc(describes) : '<span class="soft">No describing line yet.</span>'}</div><div class="play">${playersOf(recs, label)}</div></li>`
})

const otherSounds = [
  ...records.filter((r) => !r.used).map((r) => `<li class="row"><div class="meta"><span class="tag">${esc(r.id ?? stem(r.file))}</span><span class="soft">${esc([r.kind, secs(r.seconds)].filter(Boolean).join(', '))}</span></div><div class="words">${esc(r.text ?? r.describes ?? '')}</div><div class="play">${r.item ? audio(r.item) : notMade}</div></li>`),
  ...strays.map((i) => `<li class="row"><div class="meta"><span class="tag">${esc(i.label)}</span><span class="soft">no record beside it</span></div><div class="words"></div><div class="play">${audio(i)}</div></li>`),
]

const steps = attempt(() => readJson(at('content', 'copy.json')).site.steps, [])
const stepCount = Math.max(5, asList(steps).length)
const links = [
  ['./index.html', 'The site'],
  ...Array.from({ length: stepCount }, (_, i) => [`./index.html?step=${i + 1}`, `Step ${i + 1}${typeof steps[i] === 'string' ? `: ${steps[i]}` : ''}`]),
  ['./index.html?mode=film', 'Film mode'],
  ['./index.html?mode=loop', 'The loop'],
  ['./index.html?mode=probe', 'The probe'],
]

const phase = attempt(() => getStatus('Phase'), null)
const timeUsed = attempt(() => sectionBody('Clock').split('\n').map((l) => l.trim()).find((l) => l.startsWith('time used:')), null)
const date = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

const parts = [
  ['latest', 'Latest'],
  ['open', 'Open it'],
  ['sound', 'Sound board'],
  ['films', 'Films'],
  ['card', 'The card'],
  ['comparisons', 'Comparisons'],
  ['motion', 'Motion'],
]
const section = (id, body) => `<section id="${id}"><h2>${esc(parts.find((p) => p[0] === id)[1])}</h2>\n${body}\n</section>`
const rows = (list) => `<ol class="rows">${list.join('\n')}</ol>`

const latest = statusPictures.length
  ? `<p class="soft">${statusHead ? `Status ${esc(statusHead[3])}, Phase ${esc(statusHead[2])}, ${esc(statusHead[1])}.` : 'No time was written down with these pictures.'}</p>\n${statusPictures.map(image).join('\n')}`
  : none

const openIt = `<ul class="links">${links.map(([to, label]) => `<li><a href="${esc(to)}">${esc(label)}</a></li>`).join('')}</ul>`

const soundBoard = [
  '<h3>The review cut</h3>',
  reviewCut ? video(reviewCut) : `<p class="none">${NOT_MADE}</p>`,
  mix ? `<h3>The review mix</h3>\n<div class="player wide">${audio(mix)}<span class="soft">${esc(path.basename(mix.src))}, ${size(mix.bytes)}</span></div>` : '',
  '<h3>The narrator</h3>',
  `<p class="soft">Every line of the film, in film order. The mark ${esc(narration.pauseMark ?? '/')} is a pause and is never spoken.</p>`,
  filmRows.length ? rows(filmRows) : none,
  '<h4>Live-only lines</h4>',
  liveRows.length ? rows(liveRows) : none,
  '<h3>Cues</h3>',
  cueRows.length ? rows(cueRows) : none,
  otherSounds.length ? `<h3>Other kept sounds</h3>\n${rows(otherSounds)}` : '',
]
  .filter(Boolean)
  .join('\n')

const filmList = [roughCut, ...previews, ...hdFilms].filter(Boolean)
const filmsBody = (filmList.length ? filmList.map(video).join('\n') : none) + (reviewCut ? '\n<p class="soft">The review cut is at the top of the <a href="#sound">sound board</a>.</p>' : '')
const cardBody = card.length ? card.map(show).join('\n') : none
const comparisonsBody = comparisons.length || keptStills.length ? `${comparisons.map(image).join('\n')}${keptStills.length ? `\n<h3>Kept stills</h3>\n${keptStills.map(image).join('\n')}` : ''}` : none
const motionBody = sheets.length ? sheets.map(image).join('\n') : none

const notice = leftOut.length
  ? `<div class="notice"><strong>Left out of this page.</strong> The files had to fit ${esc(maxMb)} MB, so the largest videos were left out:<ul>${leftOut.map((i) => `<li>${esc(i.label)}, ${esc(path.basename(i.src))}, ${size(i.bytes)}</li>`).join('')}</ul>${stillTooLarge ? `<p>The rest is still ${size(total())}, which is over that size with every video left out.</p>` : ''}</div>`
  : stillTooLarge
    ? `<div class="notice"><strong>Over the size.</strong> The files are ${size(total())} and had to fit ${esc(maxMb)} MB. There is no video to leave out.</div>`
    : ''

const css = `
:root{--bg:#f5efe3;--panel:#fbf7ee;--ink:#33302b;--soft:#6a645a;--line:#ddd2bf;--accent:#ad450c}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
header,main,footer{max-width:1100px;margin:0 auto;padding:0 20px}
header{padding-top:28px}
h1{font-size:1.7rem;line-height:1.2;margin:0 0 4px}
h2{font-size:1.45rem;margin:0 0 14px;padding-top:26px;border-top:3px solid var(--accent)}
h3{font-size:1.15rem;margin:30px 0 10px}
h4{font-size:1rem;margin:26px 0 8px;color:var(--soft);text-transform:uppercase;letter-spacing:.05em}
section{margin:44px 0;scroll-margin-top:12px}
p{margin:0 0 12px}
a{color:var(--accent)}
.soft,.none{color:var(--soft);font-size:.92rem}
.none{font-style:italic}
.facts{display:flex;flex-wrap:wrap;gap:6px 22px;margin:10px 0 0;padding:0;list-style:none;color:var(--soft)}
.facts b{color:var(--ink);font-weight:600}
nav ul,.links{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
nav a,.links a{display:inline-block;min-height:44px;padding:9px 16px;border:1px solid var(--line);border-radius:8px;background:var(--panel);text-decoration:none;font-weight:600}
nav a:hover,.links a:hover{border-color:var(--accent)}
.notice{margin:22px 0 0;padding:14px 18px;border-left:5px solid var(--accent);background:var(--panel);border-radius:0 8px 8px 0}
.notice ul{margin:8px 0 0;padding-left:20px}
.left{padding:12px 16px;border:1px dashed var(--line);border-radius:8px;color:var(--soft)}
figure{margin:0 0 26px}
figure img,figure video{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#e9e1d1}
figcaption{margin-top:8px}
audio{display:block;width:100%;height:40px}
.rows{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}
.row{display:grid;grid-template-columns:1fr;gap:6px;padding:14px 0;border-bottom:1px solid var(--line)}
.meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.tag{font:600 .86rem/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--accent);overflow-wrap:anywhere}
.words{font-size:1.06rem;overflow-wrap:anywhere}
.player{display:grid;gap:4px;margin-bottom:6px}
.player.wide{margin-bottom:0}
@media (min-width:720px){
.row{grid-template-columns:210px 1fr 300px;gap:18px;align-items:center}
.meta{flex-direction:column;gap:2px}
}
footer{padding-top:10px;padding-bottom:50px;color:var(--soft);font-size:.9rem}
`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(cfg.name)}: review</title>
<style>${css}</style>
</head>
<body>
<header>
<h1>${esc(cfg.name)}</h1>
<p class="soft">The review page. Everything here plays in the page.</p>
<ul class="facts">
<li><b>Date</b> ${esc(date)}</li>
<li><b>Phase</b> ${esc(phase ?? 'not written down')}</li>
<li><b>Clock</b> ${esc(timeUsed ?? 'time used: not written down')}</li>
</ul>
${notice}
<nav aria-label="Parts of this page"><ul>${parts.map(([id, title]) => `<li><a href="#${id}">${esc(title)}</a></li>`).join('')}</ul></nav>
</header>
<main>
${section('latest', latest)}
${section('open', openIt)}
${section('sound', soundBoard)}
${section('films', filmsBody)}
${section('card', cardBody)}
${section('comparisons', comparisonsBody)}
${section('motion', motionBody)}
</main>
<footer>Built ${esc(date)} from the workspace of ${esc(cfg.name)}. This page is not part of the site.</footer>
</body>
</html>
`
fs.writeFileSync(pageFile, html)

function folderBytes(dir) {
  let bytes = 0
  let count = 0
  for (const e of attempt(() => fs.readdirSync(dir, { withFileTypes: true }), [])) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      const inner = folderBytes(p)
      bytes += inner.bytes
      count += inner.count
    } else {
      bytes += fs.statSync(p).size
      count++
    }
  }
  return { bytes, count }
}
const made = folderBytes(outDir)
const rel = (p) => path.relative(root, p).split(path.sep).join('/')
for (const i of leftOut) console.log(`review: left out ${rel(i.src)}, ${size(i.bytes)}`)
if (stillTooLarge) console.log(`review: still over ${maxMb} MB with every video left out`)
console.log(`review: ${rel(outDir)}/ holds ${made.count} file${made.count === 1 ? '' : 's'}, ${size(made.bytes)}`)
console.log(`review: ${rel(pageFile)} is ${size(fs.statSync(pageFile).size)}`)
