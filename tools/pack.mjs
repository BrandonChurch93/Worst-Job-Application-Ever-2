// npm run pack -- --phase N --round N --unit ID [--role NAME]: builds what each critic of a round receives. The same commit, round and unit give the same files, names and key file.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { BANNED, FORMAT, briefFor, neutral, packPlan, roleOf, roles, rolesOf, roundName } from './lib/pack-plan.mjs'
import { SITE, SITE_TIER, siteNotes } from './lib/pack-site.mjs'

const a = args()
const cfg = config()
const stop = (line) => {
  console.error(`pack: ${line}`)
  process.exit(1)
}
const git = (...words) => execFileSync('git', words, { cwd: at(), encoding: 'utf8' }).trim()
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')

const round = Number(a.round)
if (!Number.isInteger(round) || round < 1) stop('give --round N, the number of the round as kit/PROGRESS.md counts it')
const unit = a.unit === undefined || a.unit === true ? null : String(a.unit)
const role = a.role && a.role !== true ? String(a.role) : Object.keys(roles).find((r) => roles[r].unit === unit)
const mine = roleOf(role, unit)
if (!role || !mine) stop(`no pack is defined for ${role ? `the role ${role} of ` : ''}the unit "${unit}" yet. Give --role, one of ${rolesOf(unit).join(', ')}`)
if (a.phase !== undefined && mine.phase && Number(a.phase) !== mine.phase) stop(`the role ${role} belongs to phase ${mine.phase}`)
const site = unit === SITE
if (site && a.tier !== undefined) stop('the unit "site" is drawn through the live site\'s own path at one level, and has no --tier')

const slice = a.slice && a.slice !== true ? String(a.slice).split('/').map(Number) : null
if (slice && !(slice.length === 2 && Number.isInteger(slice[0]) && Number.isInteger(slice[1]) && slice[1] > 0 && slice[0] >= 0 && slice[0] < slice[1])) stop('give --slice I/N with I from 0 to N less 1: one machine of N draws every Nth file of the pack, to fill the cache of this commit')
const sliceName = slice ? `${role}-slice-${slice[0]}-of-${slice[1]}` : role
const dir = at('out', 'work', 'packs', roundName(round), sliceName)
const keyFile = at('out', 'work', 'keys', `${roundName(round)}-${sliceName}.json`)
const cards = at('scorecards', roundName(round))

if (a['release-key']) {
  if (!fs.existsSync(keyFile)) stop(`there is no key file at ${path.relative(at(), keyFile)}: build the pack first`)
  const plan = readJson(path.join(dir, 'pack.json'))
  const missing = plan.sets.filter((s) => !fs.existsSync(path.join(cards, `${s.critic}.json`))).map((s) => s.critic)
  if (missing.length && !a.force) stop(`the key stays out of the repo until every answer is in. Not in ${path.relative(at(), cards)} yet: ${missing.join(', ')}`)
  fs.mkdirSync(cards, { recursive: true })
  fs.copyFileSync(keyFile, path.join(cards, `KEY-${role}.json`))
  console.log(`pack: the key file is now at ${path.relative(at(), path.join(cards, `KEY-${role}.json`))}`)
  process.exit(0)
}

const dirty = git('status', '--porcelain', '--', 'src', 'config', 'content', 'public', 'assets-full', 'index.html', 'vite.config.ts', 'package.json', 'cut')
if (dirty && !a['allow-dirty']) stop(`a pack is of a commit, and these are not committed:\n${dirty}`)
const commit = git('rev-parse', 'HEAD')
const tier = site ? SITE_TIER : a.tier && a.tier !== true ? String(a.tier) : 'draft'
const cache = dirty ? null : at('out', 'work', 'packs', 'cache', commit.slice(0, 12), tier)
const said = (line) => console.log(`pack: ${line}`)
const facts = !mine.facts ? null : site ? await (await import('./lib/pack-site.mjs')).siteFacts(cfg, cache, said) : await (await import('./lib/pack-look.mjs')).lookFacts(cfg, unit, cache)
const plan = packPlan(cfg, { role, round, unit, facts })
const everyFile = plan.sets.flatMap((s) => s.files)
if (slice) {
  let n = 0
  for (const s of plan.sets) s.files = s.files.filter(() => n++ % slice[1] === slice[0])
  plan.sets = plan.sets.filter((s) => s.files.length)
}
for (const s of plan.sets) for (const f of s.files) if (!neutral(f.name) || BANNED.test(f.heading)) stop(`"${f.name}", "${f.heading}" is not a neutral name`)

const info = buildInfo(at())
const stamp = { role, round, unit: plan.unit, commit, tier, engineHash: info.engineHash, sharedHash: info.sharedHash, pageHashes: info.pageHashes }
const record = path.join(dir, 'pack.json')
const whole = (rec) => rec.sets.every((s) => s.files.every((f) => fs.existsSync(path.join(dir, f.name)) && sha(fs.readFileSync(path.join(dir, f.name))) === f.sha256))
if (!a.force && fs.existsSync(record) && fs.existsSync(keyFile)) {
  const old = readJson(record)
  if (JSON.stringify(old.stamp) === JSON.stringify(stamp) && whole(old)) {
    console.log(`pack: reused ${path.relative(at(), dir)}, it is of this commit: ${old.sets.map((s) => `${s.critic} ${s.files.length} files`).join(', ')}`)
    process.exit(0)
  }
}

const { buildPack } = await import('./lib/pack-build.mjs')
const t0 = process.hrtime.bigint()
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const built = await buildPack(cfg, plan, { tier, cache, facts, whole: everyFile, log: said })
const edge = cfg.critics.maxImageLongEdgePx
const key = { ...stamp, browser: built.browser, files: {} }
const manifest = { stamp, format: FORMAT, longEdgeMostPx: edge, filesMostPerCritic: cfg.critics.maxFilesPerMessage, ...(site ? siteNotes(cfg, role, facts) : {}), sets: [] }
for (const s of plan.sets) {
  const files = []
  for (const f of s.files) {
    const b = built.files.find((x) => x.name === f.name)
    if (!b || !b.png) stop(`${f.name} was not built`)
    const clean = await sharp(b.png).removeAlpha().png({ compressionLevel: 9 }).toBuffer()
    const m = await sharp(clean).metadata()
    if (Math.max(m.width, m.height) > edge) stop(`${f.name} is ${m.width} by ${m.height}, over ${edge} px`)
    if (m.exif || m.icc || m.xmp || m.iptc) stop(`${f.name} carries metadata`)
    fs.writeFileSync(path.join(dir, f.name), clean)
    files.push({ name: f.name, ...(site && b.heading ? { heading: b.heading } : {}), width: m.width, height: m.height, bytes: clean.length, sha256: sha(clean) })
    key.files[f.name] = { set: s.set, critic: s.critic, kind: b.kind, heading: b.heading, ...b.about }
  }
  if (files.length > cfg.critics.maxFilesPerMessage) stop(`set ${s.set} holds ${files.length} files, over ${cfg.critics.maxFilesPerMessage}`)
  fs.writeFileSync(path.join(dir, `brief-${s.set}.txt`), briefFor(plan, s.set) + '\n')
  manifest.sets.push({ set: s.set, critic: s.critic, files })
}
writeJson(record, manifest)
writeJson(keyFile, key)
const seconds = Number(process.hrtime.bigint() - t0) / 1e9
const mb = manifest.sets.reduce((n, s) => n + s.files.reduce((k, f) => k + f.bytes, 0), 0) / 1e6
console.log(`pack: ${role}, round ${round}, commit ${commit.slice(0, 7)}: ${manifest.sets.map((s) => `${s.critic} set ${s.set} ${s.files.length} files`).join(', ')}; ${mb.toFixed(1)} MB in ${path.relative(at(), dir)}, ${seconds.toFixed(0)} s`)
console.log(`pack: the key file is at ${path.relative(at(), keyFile)}, outside the pack. It goes into ${path.relative(at(), cards)} with --release-key, after every answer is in`)
if (built.problems.length) console.log(`pack: the browser reported ${built.problems.length} problem${built.problems.length > 1 ? 's' : ''}: ${built.problems.slice(0, 4).join(' | ')}`)
