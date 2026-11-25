// npm run gate -- --phase N: the machine checks that phase needs, with a pass or fail line for each.
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { formatOf, openSession, renderJob, still } from './lib/capture.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { difference, psnrText, rawOf } from './lib/image.mjs'
import { machine } from './lib/browser.mjs'

const a = args()
const c = config()
const phase = Number(a.phase ?? 0)
const only = a.only ? String(a.only).toUpperCase().split(',') : null
const from = { G1: 0, G2: 0, G3: 0, G4: 0, G8: 0, G9: 0, G10: 0 }
const results = []
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const run = (cmd, argv) => spawnSync(cmd, argv, { cwd: at(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const tail = (text, n = 6) => text.trim().split('\n').slice(-n)
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const checks = {
  async G1() {
    const r = run('npm', ['run', '-s', 'build'])
    return { pass: r.status === 0, note: r.status === 0 ? '`npm run build` exits clean with no type errors' : '`npm run build` failed', detail: r.status === 0 ? [] : tail(r.stdout + r.stderr, 12) }
  },

  async G2() {
    const r = run('npx', ['vitest', 'run', '--reporter=dot'])
    const text = (r.stdout + r.stderr).replace(/\u001b\[[0-9;]*m/g, '')
    const files = (text.match(/Test Files\s+(.+)/) ?? [, ''])[1].trim()
    const tests = (text.match(/Tests\s+(.+)/) ?? [, ''])[1].trim()
    return { pass: r.status === 0, note: `unit tests: ${tests || 'no count printed'} in ${files || 'no files'}`, detail: r.status === 0 ? [] : tail(text, 20) }
  },

  async G3() {
    const report = at('out', 'work', 'determinism', 'report.json')
    const info = buildInfo(at())
    const m = machine()
    let old = fs.existsSync(report) ? readJson(report) : null
    const current = (r) => r && r.engineHash === info.engineHash && Object.keys(info.pageHashes).every((u) => r.pageHashes[u] === info.pageHashes[u]) && r.machine.host === m.host && r.machine.cpu === m.cpu && r.browser !== undefined
    let ran = false
    if (!current(old) || a.fresh) {
      const r = run('node', ['tools/determinism.mjs', '--format', a.format || 'preview'])
      ran = true
      old = fs.existsSync(report) ? readJson(report) : null
      if (!current(old)) return { pass: false, note: 'determinism left no report for this build', detail: tail(r.stdout + r.stderr, 10) }
    }
    const differ = old.results.filter((x) => !x.same)
    return { pass: old.pass === true, note: `determinism (${ran ? 'run now' : 'report of this build reused'}): ${old.results.length} pictures at ${old.format}, tier ${old.tier}, ${differ.length ? `${differ.length} differ` : 'identical across two fresh loads and two orders'}`, detail: differ.map((x) => `${x.id}: ${x.pixels} pixels differ, the largest difference is ${x.largest} of 255`) }
  },

  async G4() {
    const detail = []
    let pass = true
    let count = 0
    for (const key of Object.keys(c.formats)) {
      const f = c.formats[key]
      const session = await openSession({ format: f.id })
      try {
        const out = await still(session, { page: c.lookLockUnit, tier: 'draft', out: 'gate-size' }, { dir: 'gate' })
        const meta = await sharp(out.file).metadata()
        const ok = meta.width === f.width && meta.height === f.height
        count++
        if (!ok) {
          pass = false
          detail.push(`${path.relative(at(), out.file)} is ${meta.width} by ${meta.height}, its format ${f.id} is ${f.width} by ${f.height}`)
        }
      } finally {
        await session.close()
      }
    }
    for (const file of walk(at('out', 'work', 'stills')).filter((f) => f.endsWith('.png'))) {
      const rec = file.replace(/\.png$/, '.json')
      if (!fs.existsSync(rec)) continue
      const f = formatOf(readJson(rec).format)
      const meta = await sharp(file).metadata()
      count++
      if (meta.width !== f.width || meta.height !== f.height) {
        pass = false
        detail.push(`${path.relative(at(), file)} is ${meta.width} by ${meta.height}, its format ${f.id} is ${f.width} by ${f.height}`)
      }
    }
    return { pass, note: `${count} stills checked against the size of their format (a draft still rendered now in ${Object.values(c.formats).map((f) => f.id).join(', ')}, and every still in out/work/stills/)`, detail }
  },

  async G8() {
    const detail = []
    const named = [fs.readFileSync(at('ASSETS.md'), 'utf8'), ...walk(at('assets-src')).filter((f) => path.basename(f) === 'RECIPE.md').map((f) => fs.readFileSync(f, 'utf8'))].join('\n')
    const generated = new Set(['public/audio/index.json'])
    const shipped = [...walk(at('public')), ...walk(at('assets-full'))].map((f) => path.relative(at(), f).split(path.sep).join('/'))
    for (const f of shipped) {
      if (generated.has(f)) continue
      if (!named.includes(f) && !named.includes(path.basename(f))) detail.push(`${f} ships and is named neither in ASSETS.md nor in a recipe under assets-src/`)
    }
    const kept = walk(at('audio', 'kept')).filter((f) => !f.endsWith('.json') && !f.endsWith('.md'))
    for (const f of kept) if (!fs.existsSync(f.replace(/\.[a-z0-9]+$/i, '.json'))) detail.push(`${path.relative(at(), f)} is a kept sound with no record`)
    return { pass: detail.length === 0, note: `${shipped.length} shipped files and ${kept.length} kept sounds checked for a row, a recipe or a record`, detail }
  },

  async G9() {
    const detail = []
    const files = execFileSync('git', ['ls-files', '-z'], { cwd: at(), encoding: 'utf8' }).split('\0').filter(Boolean)
    let total = 0
    let largest = { file: '', bytes: 0 }
    const secret = [
      [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
      [/\bsk-[A-Za-z0-9_-]{24,}/, 'an API key (sk-)'],
      [/\bsk_[a-f0-9]{32,}/, 'an API key (sk_)'],
      [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'a GitHub token'],
      [/\bgithub_pat_[A-Za-z0-9_]{30,}/, 'a GitHub token'],
      [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS key id'],
      [/xi-api-key["']?\s*[:=]\s*["']?[A-Za-z0-9_-]{20,}/i, 'a sound tool key'],
      [/custom-cred:[0-9a-f-]{20,}/, 'a credential handle'],
      [/\b(api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'][A-Za-z0-9_\-/+]{24,}["']/i, 'a value that looks like a secret']
    ]
    for (const f of files) {
      const p = at(f)
      if (!fs.existsSync(p)) continue
      const bytes = fs.statSync(p).size
      total += bytes
      if (bytes > largest.bytes) largest = { file: f, bytes }
      if (bytes > c.repo.maxFileMb * 1048576) detail.push(`${f} is ${(bytes / 1048576).toFixed(1)} MB, over repo.maxFileMb (${c.repo.maxFileMb})`)
      if (f.startsWith('references/cache/') || f.startsWith('out/work/')) detail.push(`${f} is tracked and must not be`)
      if (/(^|\/)\.env(\.|$)/.test(f)) detail.push(`${f} is an environment file and is tracked`)
      if (bytes < 2 * 1048576 && !/\.(png|jpe?g|webp|gif|mp4|webm|mp3|wav|ogg|glb|bin|ktx2|hdr|exr|woff2?|ttf|otf|zip)$/i.test(f) && f !== 'tools/gate.mjs') {
        const text = fs.readFileSync(p, 'utf8')
        for (const [re, what] of secret) if (re.test(text)) detail.push(`${f} holds ${what}`)
      }
    }
    if (total > c.repo.maxTreeGb * 1073741824) detail.push(`the tracked files are ${(total / 1073741824).toFixed(2)} GB together, over repo.maxTreeGb (${c.repo.maxTreeGb})`)
    let hashes = 0
    const manifest = (file, dir) => {
      for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
        const [hash, name] = line.trim().split(/\s+/)
        const p = path.join(dir, name)
        hashes++
        if (!fs.existsSync(p)) detail.push(`${path.relative(at(), p)} is listed in ${path.relative(at(), file)} and is missing`)
        else if (sha(p) !== hash) detail.push(`${path.relative(at(), p)} no longer has the hash listed in ${path.relative(at(), file)}`)
      }
    }
    manifest(at('references', 'approved', 'MANIFEST.sha256'), at('references', 'approved'))
    manifest(at('content', 'MANIFEST.sha256'), at('content'))
    return { pass: detail.length === 0, note: `${files.length} tracked files, ${(total / 1048576).toFixed(1)} MB together, the largest ${largest.file} at ${(largest.bytes / 1048576).toFixed(1)} MB; no secret pattern; nothing tracked under references/cache/ or out/work/; ${hashes} listed hashes hold`, detail }
  },

  async G10() {
    const caps = readJson(at('config', 'webgl-caps.json'))
    const portable = Object.keys(caps.extensions).filter((n) => caps.extensions[n].portable)
    const detail = []
    let pass = true
    const job = { kind: 'still', spec: { page: c.lookLockUnit, camera: 'home', tier: 'draft' } }
    const shot = async (name, allow) => {
      const session = await openSession({ format: 'preview', allowExtensions: allow })
      try {
        const png = await renderJob(session, job)
        const file = at('out', 'work', 'gate', `portable-${name}.png`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, png)
        const state = await session.page.evaluate(() => ({ asked: window.__asked || {}, target: window.showcase.info().versions.target, invalid: window.showcase.pictureStats().invalidValues }))
        return { file, ...state, problems: [...new Set(session.problems)] }
      } finally {
        await session.close()
      }
    }
    const all = await shot('all', Object.keys(caps.extensions))
    const some = await shot('portable', portable)
    const half = await shot('half', portable.filter((n) => n !== 'EXT_color_buffer_float'))
    const base = await rawOf(all.file)
    const refused = Object.keys(some.asked).filter((n) => !some.asked[n])
    const dSome = difference(base, await rawOf(some.file))
    const dHalf = difference(base, await rawOf(half.file))
    const floor = c.quality.crossMachineMinPsnr
    if (!(dSome.sameSize && dSome.psnr >= floor) || some.invalid) {
      pass = false
      detail.push(`with only the portable extensions the picture changes: PSNR ${psnrText(dSome.psnr)}, ${some.invalid} invalid values`)
    }
    for (const p of some.problems) {
      pass = false
      detail.push(`with only the portable extensions the page reported: ${p}`)
    }
    if (half.target !== 'half') {
      pass = false
      detail.push(`without EXT_color_buffer_float the target is "${half.target}", not the half float path`)
    }
    if (!(dHalf.sameSize && dHalf.psnr >= floor) || half.invalid) {
      pass = false
      detail.push(`on the half float path the picture changes: PSNR ${psnrText(dHalf.psnr)}, ${half.invalid} invalid values`)
    }
    for (const p of half.problems.filter((x) => !x.includes('EXT_color_buffer_float extension not supported'))) {
      pass = false
      detail.push(`on the half float path the page reported: ${p}`)
    }
    return {
      pass,
      note: `the site asks for ${Object.keys(all.asked).length} extensions (${Object.keys(all.asked).sort().join(', ')}); ${refused.length ? `${refused.join(', ')} ${refused.length === 1 ? 'is' : 'are'} not portable and the picture is the same without (PSNR ${psnrText(dSome.psnr)})` : `all are portable (PSNR against the unrestricted picture ${psnrText(dSome.psnr)})`}; target "${all.target}" normally and "${half.target}" without EXT_color_buffer_float, PSNR ${psnrText(dHalf.psnr)}, floor ${floor} dB`,
      detail
    }
  }
}

const wanted = Object.keys(checks).filter((id) => from[id] <= phase && (!only || only.includes(id)))
let failed = 0
for (const id of wanted) {
  const t0 = process.hrtime.bigint()
  let r
  try {
    r = await checks[id]()
  } catch (e) {
    r = { pass: false, note: `the check itself failed: ${e.message.split('\n')[0]}`, detail: e.message.split('\n').slice(1, 8) }
  }
  const seconds = Number(process.hrtime.bigint() - t0) / 1e9
  if (!r.pass) failed++
  results.push({ id, pass: r.pass, note: r.note, detail: r.detail, seconds: Number(seconds.toFixed(1)) })
  console.log(`${r.pass ? 'pass' : 'FAIL'}  ${id}  ${r.note} (${seconds.toFixed(1)} s)`)
  for (const d of r.detail) console.log(`      ${d}`)
}
const info = buildInfo(at())
writeJson(at('out', 'work', 'gate', `gate-phase-${phase}.json`), { phase, engineHash: info.engineHash, pageHashes: info.pageHashes, machine: machine(), results, pass: failed === 0 })
console.log(failed === 0 ? `gate, phase ${phase}: pass, ${results.length} checks` : `gate, phase ${phase}: FAIL, ${failed} of ${results.length} checks`)
process.exit(failed === 0 ? 0 : 1)
