// npm run parts: fills the parts register from the flags the code carries. --check compares the register with the code and with what the page reports. --set NAME --state S changes a state.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseAst } from 'vite'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { clock, seconds, took } from './lib/film-encode.mjs'
import { STATES, compare, filesOfParts, fill, hashOf, scan, setState, templateTest } from './lib/film-parts.mjs'

const a = args()
const t0 = clock()
const word = (v) => (v === undefined || v === true ? '' : String(v))
const say = (line) => console.log(`parts: ${line}`)
const stop = (line, code = 1) => {
  console.error(`parts: ${line}`)
  process.exit(code)
}
const file = at('parts', 'PARTS.json')
if (!fs.existsSync(file)) stop('parts/PARTS.json does not exist, so there is no register to fill')
const register = readJson(file)
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: at(), encoding: 'utf8' })
const commit = git.status === 0 ? git.stdout.trim() : ''
if (!commit) stop('git gives no commit for HEAD, so a state or a hash cannot be recorded')

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
