// npm run parts: fills the parts register from the flags the code carries. --check compares the register with the code and with what the page reports. --set NAME --state S changes a state.
// --record NAME --files a,b,c records the files of a part that carries no flag, with their hash as they were when the part was a stand-in.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseAst } from 'vite'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { STATES, compare, filesOfParts, fill, hashOf, scan, setState, templateTest } from './lib/film-parts.mjs'
import { ANCHORS, anchoredRecord, resolveCommit, showAt } from './lib/gate-checks.mjs'

const a = args()
const t0 = clock()
const word = (v) => (v === undefined || v === true ? '' : String(v))
const say = (line) => console.log(`parts: ${line}`)
const stop = (line, code = 1) => {
  console.error(`parts: ${line}`)
  process.exit(code)
}
const file = word(a.register) ? path.resolve(word(a.register)) : at('parts', 'PARTS.json')
if (!fs.existsSync(file)) stop(`${path.relative(at(), file)} does not exist, so there is no register to fill`)
const register = readJson(file)
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: at(), encoding: 'utf8' })
const commit = git.status === 0 ? git.stdout.trim() : ''
if (!commit) stop('git gives no commit for HEAD, so a state or a hash cannot be recorded')

if (a.record !== undefined) {
  const name = word(a.record)
  const files = [...new Set(word(a.files).split(',').map((f) => f.trim().replace(/^\.\//, '')).filter(Boolean))].sort()
  if (!name || !files.length) stop('give both --record NAME and --files a,b,c: the files that hold the part')
  const part = register.parts.find((p) => p.name === name)
  if (!part) stop(`the register holds no part called "${name}"`)
  if (part.standInHash && !a.replace) stop(`${name} has a recorded hash already, of ${part.files.join(' ')}. Add --replace to record it again`)
  const gone = files.filter((f) => !fs.existsSync(at(f)) || !fs.statSync(at(f)).isFile())
  if (gone.length) stop(`not a file of this tree: ${gone.join(', ')}`)
  const anchors = (word(a.at) ? word(a.at).split(',') : ANCHORS).map((c) => ({ asked: c, full: resolveCommit(at(), c) }))
  const lost = anchors.filter((c) => !c.full)
  if (lost.length) stop(`this clone does not hold the commit ${lost.map((c) => c.asked).join(', ')}, so no file can be read as it was then`)
  const rec = anchoredRecord(files, anchors.map((c) => c.full), (c, f) => showAt(at(), c, f))
  part.files = rec.files
  part.standInHash = rec.hash
  part.hashAt = rec.hashAt
  part.commit = commit
  writeJson(file, register)
  const today = hashOf(at(), rec.files)
  for (const f of rec.files) say(rec.absent.includes(f) ? `${f} is in none of the commits ${anchors.map((c) => c.asked).join(', ')}: recorded as absent, a file that was not there while the part was a stand-in. It differs as soon as it holds a byte, so name it only for a part that is made in a new file` : `${f} as it was at ${rec.hashAt[f].slice(0, 7)}`)
  say(`${name}: ${rec.files.length} file${rec.files.length === 1 ? '' : 's'} recorded with the hash ${rec.hash.slice(0, 12)}. The files today ${today === rec.hash ? 'are the same, so test 2 of G13 fails until one of them changes' : 'differ already'}. Wrote ${path.relative(at(), file)} in ${took(seconds(t0))}`)
  process.exit(0)
}

if (a.set !== undefined || a.state !== undefined) {
  if (!word(a.set) || !word(a.state)) stop(`give both --set NAME and --state STATE. The states are ${STATES.join(', ')}`)
  try {
    writeJson(file, setState(register, word(a.set), word(a.state), commit))
  } catch (e) {
    stop(e.message)
  }
  say(`${word(a.set)} is now ${word(a.state)}, set at commit ${commit.slice(0, 7)}. Wrote parts/PARTS.json in ${took(seconds(t0))}`)
  process.exit(0)
}

let found
try {
  found = scan(at(), parseAst)
} catch (e) {
  stop(`the source could not be read: ${String(e.message).split('\n')[0]}`)
}
const names = register.parts.map((p) => p.name)
const files = filesOfParts(names, found)
const diff = compare(register, files, found)
const list = (xs) => (xs.length ? xs.join(', ') : 'none')

function findings() {
  say(`${names.length - diff.notCarried.length} of the ${names.length} parts of the register are carried as a flag by a file`)
  say(`parts of the register that no file carries (${diff.notCarried.length}): ${list(diff.notCarried)}`)
  say(`flags in the code that are not in the register (${diff.notInRegister.length}): ${list(diff.notInRegister.map((n) => `${n} in ${found.flags[n].join(' and ')}`))}`)
  for (const t of found.templates) say(`a flag made at run time in ${t.file}: ${t.parts.join('...')}, which ${diff.idleTemplates.includes(t) ? 'makes no name of the register' : `can make ${names.filter((n) => templateTest(t.parts).test(n)).join(', ')}`}`)
}

// The flags the page itself reports: along the film, and after a picture of the opening and of the loop.
async function reported() {
  const { openSession } = await import('./lib/capture.mjs')
  const c = config()
  const session = await openSession({ format: 'preview' })
  try {
    const every = Math.round(c.film.fps * (word(a.every) ? Number(a.every) : 1))
    return await session.page.evaluate(async (step) => {
      const out = new Set()
      const film = window.showcase.film()
      for (let f = 0; f < film.frameCount; f += step) for (const n of window.showcase.filmState(f).standIns) out.add(n)
      for (const u of film.units) await window.showcase.renderFilmFrame(u.first, 'draft')
      const o = window.showcase.opening()
      await window.showcase.renderOpeningFrame(0, 'draft')
      await window.showcase.renderOpeningFrame(o.frameCount - 1, 'draft')
      await window.showcase.renderLoopFrame(0, 'draft')
      for (const s of window.showcase.info().standIns) out.add(s.name)
      return [...out].sort()
    }, every)
  } finally {
    await session.close()
  }
}

if (a.check) {
  let page = null
  if (!a['no-page']) {
    try {
      page = await reported()
    } catch (e) {
      say(`the page could not be asked what it reports: ${String(e.message).split('\n')[0]}`)
    }
  }
  const rows = register.parts.map((p) => {
    const today = hashOf(at(), p.files)
    const hash = !p.standInHash ? 'no hash recorded' : today === null ? 'differs from the recorded one: a file is gone' : today === p.standInHash ? 'the same as recorded' : 'differs from the recorded one'
    const now = files[p.name]
    const moved = p.standInHash && JSON.stringify(now) !== JSON.stringify(p.files)
    return { name: p.name, unit: p.unit, state: p.state, files: p.files, hash, flaggedIn: now, flagFilesChanged: Boolean(moved), pageReports: page ? page.includes(p.name) : null }
  })
  for (const r of rows) {
    const flag = r.flaggedIn.length ? `the flag is in ${r.flaggedIn.length} file${r.flaggedIn.length === 1 ? '' : 's'} now${r.flagFilesChanged ? `, not the files recorded: ${r.flaggedIn.join(' ')}` : ''}` : 'no file carries the flag now'
    const told = r.pageReports === null ? 'the page was not asked' : r.pageReports ? 'the page reports the flag' : 'the page does not report the flag'
    console.log(`${r.name} (${r.unit}): ${r.state}; ${r.files.length ? `files ${r.files.join(' ')}` : 'no files recorded'}; hash ${r.hash}; ${flag}; ${told}`)
  }
  findings()
  const unknown = page ? page.filter((n) => !names.includes(n)) : []
  const silent = page ? rows.filter((r) => r.flaggedIn.length && !r.pageReports).map((r) => r.name) : []
  const unseen = page ? rows.filter((r) => !r.flaggedIn.length && r.pageReports).map((r) => r.name) : []
  if (page) {
    say(`the page reports ${page.length} flags along the film, the opening and the loop`)
    say(`reported by the page and not in the register (${unknown.length}): ${list(unknown)}`)
    say(`flagged in a file and not reported by the page (${silent.length}): ${list(silent)}`)
    say(`reported by the page and found in no file (${unseen.length}): ${list(unseen)}`)
  }
  const out = at('out', 'work', 'parts-check.json')
  writeJson(out, { commit, parts: rows, notCarried: diff.notCarried, notInRegister: diff.notInRegister.map((n) => ({ name: n, files: found.flags[n] })), templates: found.templates, pageReports: page, reportedNotInRegister: unknown, flaggedNotReported: silent, reportedNotFound: unseen })
  const bad = diff.notInRegister.length + unknown.length + unseen.length
  say(`wrote ${path.relative(at(), out)} in ${took(seconds(t0))}${bad ? '. The register and the code do not agree: see the lines above' : ''}`)
  process.exit(bad ? 2 : 0)
}

const done = fill(register, files, (list) => hashOf(at(), list), commit)
const had = register.parts.filter((p) => p.standInHash).length
if (done.filled) writeJson(file, done.register)
findings()
say(`${done.filled} part${done.filled === 1 ? '' : 's'} recorded with files, hash and commit ${commit.slice(0, 7)}; ${had} had a hash already and were left as they are; ${names.length - had - done.filled} have no file to hash`)
say(`${done.filled ? 'wrote parts/PARTS.json' : 'parts/PARTS.json is as it was'} in ${took(seconds(t0))}`)
