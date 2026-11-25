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
import { state } from './lib/state.mjs'
import { storyCheck, wordsCheck } from './lib/story.mjs'
import { cutListExists, judgedFilm, judgedPages, listedIds, readCutList } from './lib/judged.mjs'

const a = args()
const c = config()
const phase = Number(a.phase ?? 0)
const only = a.only ? String(a.only).toUpperCase().split(',') : null
const from = { G1: 0, G2: 0, G3: 0, G4: 0, G5: 2, G6: 2, G7: 2, G8: 0, G9: 0, G10: 0, G11: 2, G12: 2, G14: 2, G17: 2, G18: 2 }
const onlyAt = { D1: [1], D2: [2, 6], D3: [2, 6] }
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
  },

  async G5() {
    const detail = []
    const visible = (session) =>
      session.page.evaluate(() => {
        const out = []
        for (const el of document.body.querySelectorAll('button, a, input, select, textarea, summary, video, audio, [role], [tabindex]')) {
          const r = el.getBoundingClientRect()
          const st = getComputedStyle(el)
          if (r.width < 1 || r.height < 1 || st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) continue
          let shown = true
          for (let p = el.parentElement; p; p = p.parentElement) {
            const ps = getComputedStyle(p)
            if (ps.display === 'none' || ps.visibility === 'hidden' || Number(ps.opacity) === 0 || p.hidden) shown = false
          }
          if (shown) out.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`)
        }
        return out
      })
    const session = await openSession({ format: 'preview' })
    let plain = 0
    let withControls = 0
    try {
      const page = c.film.units[0].id
      const steps = [{ name: `a still of ${c.lookLockUnit} at rest`, job: { kind: 'still', spec: { page: c.lookLockUnit, camera: 'home', tier: 'draft' } }, controls: false }]
      for (const st of c.stills.filter((x) => x.interface)) {
        const spec = { page: st.unit === 'site' ? page : st.unit, camera: st.camera, tier: 'draft', interface: true }
        if (st.touchOnly) spec.touchOnly = true
        steps.push({ name: `the still ${st.id}`, job: { kind: 'still', spec }, controls: true })
        steps.push({ name: `a film frame after the still ${st.id}`, job: { kind: 'film', frame: Math.round(c.film.hookSeconds * c.film.fps), tier: 'draft' }, controls: false })
      }
      steps.push({ name: 'frame 0 of the loop', job: { kind: 'loop', frame: 0, tier: 'draft' }, controls: false })
      steps.push({ name: `a still of ${page} at rest, last`, job: { kind: 'still', spec: { page, camera: 'home', tier: 'draft' } }, controls: false })
      for (const step of steps) {
        try {
          await renderJob(session, step.job)
        } catch (e) {
          detail.push(`${step.name} could not be drawn: ${e.message.split('\n')[0]}`)
          continue
        }
        const seen = await visible(session)
        if (step.controls) {
          withControls++
          if (!seen.length) detail.push(`${step.name} asks for the interface and no control is in the page`)
        } else {
          plain++
          if (seen.length) detail.push(`${step.name} has ${seen.length} control${seen.length === 1 ? '' : 's'} in the page: ${seen.slice(0, 6).join(', ')}`)
        }
      }
    } finally {
      await session.close()
    }
    return { pass: detail.length === 0, note: `${plain} pictures without the interface (stills, film frames and a loop frame, drawn before and after the pictures with it) checked for a control in the page, and ${withControls} stills with the interface checked for theirs. A picture without the interface is read from the canvas alone, so no control can be in its pixels`, detail }
  },

  async G6() {
    const detail = []
    const s = await state()
    let computed = judgedPages(c)
    try {
      try {
        s.App.check()
      } catch (e) {
        detail.push(...e.message.split('\n').filter(Boolean).slice(0, 20))
      }
      if (cutListExists()) computed = [...computed, ...judgedFilm(s.showcase, c)]
    } finally {
      await s.close()
    }
    const listed = new Set(listedIds())
    const missing = computed.filter((e) => !listed.has(e.id))
    for (const e of missing.slice(0, 20)) detail.push(`${e.id} is on the computed judged list and not on the judged list in kit/PROGRESS.md (npm run judged -- --write)`)
    if (missing.length > 20) detail.push(`and ${missing.length - 20} more`)
    return { pass: detail.length === 0, note: `the config and the two content files pass the site's startup validation; ${computed.length} computed judged entries${cutListExists() ? ', the film\'s part among them' : ' (the film\'s part waits for cut/CUTLIST.json)'}, ${listed.size} listed in kit/PROGRESS.md`, detail }
  },

  async G7() {
    const detail = []
    const total = c.film.units.reduce((n, u) => n + u.seconds, 0)
    if (total > c.film.maxSeconds + 1e-9) detail.push(`film B is ${total} s, over film.maxSeconds (${c.film.maxSeconds})`)
    for (const u of c.film.units) {
      const planned = c.film.plannedSeconds[u.id]
      if (planned === undefined) detail.push(`${u.id} has no planned length in film.plannedSeconds`)
      else if (Math.abs(u.seconds - planned) > planned * c.film.unitTuneFraction + 1e-9) detail.push(`${u.id} is ${u.seconds} s, more than film.unitTuneFraction (${c.film.unitTuneFraction}) away from its planned ${planned} s`)
    }
    let opening = null
    let from = 'the numbers of intro in the config, because the opening is not built yet'
    const s = await state()
    try {
      opening = s.showcase.opening().frameCount / c.film.fps
      from = 'opening().frameCount'
    } catch {
      opening = c.intro.prompt.length / c.intro.charsPerSecond + c.intro.readHoldSeconds + c.intro.steps.length * c.intro.stepSeconds + c.intro.endHoldSeconds
    } finally {
      await s.close()
    }
    if (opening > c.intro.maxSeconds + 1e-9) detail.push(`the opening is ${opening.toFixed(2)} s, over intro.maxSeconds (${c.intro.maxSeconds})`)
    const mb = (seconds) => (seconds * (c.export.bitrateMbps * 1e6 + c.export.audioKbps * 1e3)) / 8 / 1048576
    const sizeB = mb(total)
    const sizeA = mb(total + opening)
    if (sizeA >= c.platform.maxFileMb) detail.push(`film A in ${c.formats.hd.id} at ${c.export.bitrateMbps} Mbps would be ${sizeA.toFixed(0)} MB, not under platform.maxFileMb (${c.platform.maxFileMb})`)
    for (const file of walk(at('out', 'work')).filter((f) => /film-[ab]-hd-[a-z]+\.mp4$/.test(f))) {
      const real = fs.statSync(file).size / 1048576
      if (real >= c.platform.maxFileMb) detail.push(`${path.relative(at(), file)} is ${real.toFixed(0)} MB, not under platform.maxFileMb (${c.platform.maxFileMb})`)
    }
    const std = c.platform.standardAccountMaxSeconds
    const longer = [total > std ? `film B (${total} s)` : null, total + opening > std ? `film A (${(total + opening).toFixed(1)} s)` : null].filter(Boolean)
    return {
      pass: detail.length === 0,
      note: `film B is ${total} s of at most ${c.film.maxSeconds}; every page is within ${c.film.unitTuneFraction} of its planned length; the opening is ${opening.toFixed(2)} s of at most ${c.intro.maxSeconds} (from ${from}); in ${c.formats.hd.id} at ${c.export.bitrateMbps} Mbps film B is about ${sizeB.toFixed(0)} MB and film A about ${sizeA.toFixed(0)} MB, under ${c.platform.maxFileMb}. Note, not a failure: ${longer.length ? `${longer.join(' and ')} ${longer.length === 1 ? 'is' : 'are'} longer than the ${std} s a standard account on ${c.platform.name} may post` : `both films fit the ${std} s a standard account on ${c.platform.name} may post`}`,
      detail
    }
  },

  async G11() {
    const s = await state()
    try {
      return await wordsCheck(s)
    } finally {
      await s.close()
    }
  },

  async G12() {
    const s = await state()
    try {
      return storyCheck(s)
    } finally {
      await s.close()
    }
  },

  async G14() {
    const frames = c.deliver.cardLoop.seconds * c.film.fps
    const session = await openSession({ format: 'preview' })
    try {
      const dir = at('out', 'work', 'gate')
      fs.mkdirSync(dir, { recursive: true })
      const first = path.join(dir, 'loop-first.png')
      const past = path.join(dir, 'loop-past-last.png')
      fs.writeFileSync(past, await renderJob(session, { kind: 'loop', frame: frames, tier: 'draft' }))
      fs.writeFileSync(first, await renderJob(session, { kind: 'loop', frame: 0, tier: 'draft' }))
      const d = difference(await rawOf(first), await rawOf(past))
      const same = d.sameSize && d.pixels === 0
      return { pass: same, note: `the loop's seam: frame ${frames}, one past the last, ${same ? 'is pixel-identical to' : 'differs from'} frame 0 (${session.format.id}, draft)`, detail: same ? [] : [`${d.pixels} pixels differ, the largest difference is ${d.largest} of 255`] }
    } finally {
      await session.close()
    }
  },

  async G17() {
    const r = run('node', ['tools/bots.mjs'])
    const file = at('out', 'work', 'bots.json')
    if (!fs.existsSync(file)) return { pass: false, note: '`npm run bots` left no report', detail: tail(r.stdout + r.stderr, 10) }
    const report = readJson(file)
    const finishing = report.problems.filter((p) => !p.startsWith('keen never reached'))
    const done = report.runs.filter((x) => x.finished).length
    const slowest = report.runs.reduce((m, x) => Math.max(m, x.seconds), 0)
    const pointer = report.runs.reduce((m, x) => Math.max(m, x.ignoredPointer), 0)
    const flippers = report.runs.reduce((m, x) => Math.max(m, x.ignoredFlippers), 0)
    return { pass: finishing.length === 0 && done === report.runs.length, note: `finishing: ${done} of ${report.runs.length} runs (${c.live.bots.join(', ')} on ${c.live.botSeeds} seeds each) reached the careers page after the rejection, the slowest in ${slowest.toFixed(0)} s of ${c.live.botMaxSeconds}; the pointer was ignored for at most ${pointer.toFixed(2)} s and the flippers for at most ${flippers.toFixed(2)} s, of ${c.live.controlTakenMaxSeconds} allowed`, detail: finishing.slice(0, 20) }
  },

  async G18() {
    const detail = []
    const session = await openSession({ format: 'preview' })
    let modules
    try {
      modules = session.info.modules
    } finally {
      await session.close()
    }
    const live = new Set(modules.live)
    const filmOnly = modules.film.filter((m) => !live.has(m))
    for (const m of filmOnly) detail.push(`${m} is loaded by film mode and not by live mode`)
    for (const m of modules.unplaced ?? []) detail.push(`${m} is imported in a way that names no mode, so the lists cannot be trusted`)
    if (!modules.film.length || !modules.live.length) detail.push('info().modules is empty')
    const file = at('out', 'work', 'bots.json')
    let keenNote = 'no report of the bots yet'
    const info = buildInfo(at())
    if (!fs.existsSync(file) || readJson(file).engineHash !== info.engineHash || JSON.stringify(readJson(file).pageHashes) !== JSON.stringify(info.pageHashes)) run('node', ['tools/bots.mjs'])
    if (fs.existsSync(file)) {
      const report = readJson(file)
      const keen = report.runs.filter((x) => x.bot === 'keen')
      for (const g of report.missed) detail.push(`the keen bot never reached the gag of ${g} in live mode on some seed`)
      if (!keen.length) detail.push('the keen bot did not run')
      keenNote = `the keen bot reached ${c.film.beats.length - report.missed.length} of ${c.film.beats.length} gags on each of its ${keen.length} seeds`
    } else detail.push('`npm run bots` left no report')
    return { pass: detail.length === 0, note: `one site: film mode loads ${modules.film.length} modules under src/pages/, src/table/ and src/boss/ and live mode ${modules.live.length}; ${filmOnly.length} of film mode's are not in live mode; ${keenNote}`, detail }
  },

  async D1() {
    const file = at('out', 'roughcut.mp4')
    if (!fs.existsSync(file)) return { pass: false, note: 'out/roughcut.mp4 does not exist', detail: [] }
    const probe = (argv) => run('ffprobe', ['-v', 'error', ...argv, file]).stdout
    const s = JSON.parse(probe(['-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate', '-of', 'json']) || '{}').streams?.[0]
    if (!s) return { pass: false, note: 'out/roughcut.mp4 holds no picture stream that can be read', detail: [] }
    const f = c.formats.preview
    const frames = Math.round(c.film.units.reduce((n, u) => n + u.seconds, 0) * c.film.previewFps)
    const detail = []
    if (s.width !== f.width || s.height !== f.height) detail.push(`it is ${s.width} by ${s.height}, formats.preview is ${f.width} by ${f.height}`)
    if (Number(s.nb_read_frames) !== frames) detail.push(`it holds ${s.nb_read_frames} frames, film.units at film.previewFps is ${frames}`)
    if (s.r_frame_rate !== `${c.film.previewFps}/1`) detail.push(`its rate is ${s.r_frame_rate}, film.previewFps is ${c.film.previewFps}`)
    if (probe(['-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0']).trim()) detail.push('it carries a sound stream, and the rough cut is silent')
    const mb = fs.statSync(file).size / 1048576
    if (mb > c.repo.maxFileMb) detail.push(`it is ${mb.toFixed(1)} MB, over repo.maxFileMb`)
    return { pass: detail.length === 0, note: `out/roughcut.mp4 is ${s.width} by ${s.height} with ${s.nb_read_frames} frames at ${s.r_frame_rate} (${frames} expected), ${mb.toFixed(1)} MB, silent`, detail }
  },

  async D2() {
    const file = at('out', c.export.files.previewB)
    const rel = path.relative(at(), file)
    if (!fs.existsSync(file)) return { pass: false, note: `${rel} does not exist`, detail: [] }
    const probe = (argv) => run('ffprobe', ['-v', 'error', ...argv, file]).stdout
    const v = JSON.parse(probe(['-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate', '-of', 'json']) || '{}').streams?.[0]
    if (!v) return { pass: false, note: `${rel} holds no picture stream that can be read`, detail: [] }
    const f = c.formats.preview
    const frames = Math.round(c.film.units.reduce((n, u) => n + u.seconds, 0) * c.film.previewFps)
    const detail = []
    if (v.width !== f.width || v.height !== f.height) detail.push(`it is ${v.width} by ${v.height}, formats.preview is ${f.width} by ${f.height}`)
    if (Number(v.nb_read_frames) !== frames) detail.push(`it holds ${v.nb_read_frames} frames, film.units at film.previewFps is ${frames}`)
    if (v.r_frame_rate !== `${c.film.previewFps}/1`) detail.push(`its rate is ${v.r_frame_rate}, film.previewFps is ${c.film.previewFps}`)
    const sound = probe(['-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0']).trim() !== ''
    const anySound = walk(at('audio', 'kept')).some((x) => !x.endsWith('.json') && !x.endsWith('.md')) || walk(at('audio', 'final')).some((x) => /\.(wav|m4a|mp3)$/.test(x))
    if (phase === 6 && anySound && !sound) detail.push('sound exists and the preview carries no sound stream')
    const mb = fs.statSync(file).size / 1048576
    if (mb > c.repo.maxFileMb) detail.push(`it is ${mb.toFixed(1)} MB, over repo.maxFileMb (${c.repo.maxFileMb})`)
    const rec = file.replace(/\.mp4$/, '.json')
    const info = buildInfo(at())
    let built = 'no record beside it'
    if (!fs.existsSync(rec)) detail.push(`${rel} has no record beside it, so the build it was rendered from is not known`)
    else {
      const r = readJson(rec)
      const same = r.engineHash === info.engineHash && Object.keys(info.pageHashes).every((u) => r.pageHashes?.[u] === info.pageHashes[u])
      built = same ? 'rendered from the build as it is now' : 'rendered from an older build'
      if (!same) detail.push(`${rel} was rendered from another build: its record has engine ${r.engineHash}, the build is ${info.engineHash}${Object.keys(info.pageHashes).filter((u) => r.pageHashes?.[u] !== info.pageHashes[u]).map((u) => `, ${u} differs`).join('')}`)
    }
    return { pass: detail.length === 0, note: `${rel} is ${v.width} by ${v.height} with ${v.nb_read_frames} frames at ${v.r_frame_rate} (${frames} expected), ${mb.toFixed(1)} MB, ${sound ? 'with a sound stream' : 'silent'}, ${built}`, detail }
  },

  async D3() {
    const file = at('out', 'work', 'render-local', 'proof.json')
    if (!fs.existsSync(file)) return { pass: false, note: 'the local render proof does not exist (npm run render:local -- --proof)', detail: [] }
    const proof = readJson(file)
    const info = buildInfo(at())
    const detail = []
    const same = proof.engineHash === info.engineHash && Object.keys(info.pageHashes).every((u) => proof.pageHashes?.[u] === info.pageHashes[u])
    if (!same) detail.push('the proof was made from another build than the one that stands now')
    const want = phase >= 6 ? ['film-b', 'opening'] : ['film-b']
    const frames = Math.round(c.export.proofSeconds * c.film.fps)
    for (const name of want) {
      const part = (proof.parts ?? []).find((x) => x.what === name)
      if (!part) {
        detail.push(`the proof holds no part for ${name}`)
        continue
      }
      const p = at(part.file)
      if (!fs.existsSync(p)) {
        detail.push(`${part.file} is named by the proof and does not exist`)
        continue
      }
      const v = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate', '-of', 'json', p]).stdout || '{}').streams?.[0]
      if (!v) detail.push(`${part.file} holds no picture stream that can be read`)
      else {
        if (v.width !== c.formats.preview.width || v.height !== c.formats.preview.height) detail.push(`${part.file} is ${v.width} by ${v.height}, formats.preview is ${c.formats.preview.width} by ${c.formats.preview.height}`)
        if (Number(v.nb_read_frames) !== frames) detail.push(`${part.file} holds ${v.nb_read_frames} frames, export.proofSeconds at film.fps is ${frames}`)
      }
    }
    return { pass: detail.length === 0, note: `the local render proof: ${(proof.parts ?? []).map((x) => `${x.what} (${x.file})`).join(', ') || 'no parts'}, ${same ? 'made from the build as it is now' : 'made from an older build'}; this phase needs ${want.join(' and ')}`, detail }
  }
}

const rank = (id) => (id[0] === 'G' ? 0 : 1000) + Number(id.slice(1))
const wanted = Object.keys(checks).filter((id) => (onlyAt[id] ? onlyAt[id].includes(phase) : from[id] <= phase) && (!only || only.includes(id))).sort((x, y) => rank(x) - rank(y))
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
