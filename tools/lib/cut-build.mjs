// The cut of this build, and the proofs that hang on it. Shared by npm run cut, npm run mix and the join of npm run film,
// so that no sound is laid by the events of another build and no film is joined with the sound of another build.
// (It happened: the committed cut list stood two days behind the build, and every preview's effects were laid by it.)
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { at, readJson } from './paths.mjs'
import { engineHash, pageHashes, soundHash } from './hashes.mjs'

export const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')

// The cut as this build gives it now: the list, the shots, the problems, and the text of each of its three files.
export async function cutOfBuild(load, root = at()) {
  const { makeCut, cuesText, shotsText } = await load('/src/film/cut.ts')
  const { pages } = await load('/src/pages/index.ts')
  const keptDir = path.join(root, 'audio', 'kept')
  const kept = fs.existsSync(keptDir)
    ? fs.readdirSync(keptDir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ file: `audio/kept/${f}`, record: readJson(path.join(keptDir, f)) }))
    : []
  const { list, shots, problems } = makeCut(pages, kept)
  return { list, shots, problems, files: [['cut/CUTLIST.json', JSON.stringify(list, null, 2) + '\n'], ['cut/CUES.md', cuesText(list)], ['cut/SHOTS.md', shotsText(list, shots)]] }
}

// 'absent', 'stale' or 'equal' for a file of the cut, against the text this build gives for it.
export function stateOf(file, text) {
  if (!fs.existsSync(file)) return 'absent'
  return fs.readFileSync(file, 'utf8') === text ? 'equal' : 'stale'
}

// Each file of the cut by name with its state.
export function cutState(files, root = at()) {
  return files.map(([name, text]) => ({ name, state: stateOf(path.join(root, ...name.split('/')), text) }))
}

// Where a list on disk first parts from the list of the build, in plain words.
export function firstDifference(old, list) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const events = Array.isArray(old.events) ? old.events : []
  for (let i = 0; i < Math.min(events.length, list.events.length); i++) {
    if (!same(events[i], list.events[i])) return `event ${i + 1} is ${events[i].name} at frame ${events[i].frame} on disk and ${list.events[i].name} at frame ${list.events[i].frame} in the build`
  }
  if (events.length !== list.events.length) return `the first ${Math.min(events.length, list.events.length)} events are the same`
  const lines = Array.isArray(old.lines) ? old.lines : []
  for (let i = 0; i < Math.min(lines.length, list.lines.length); i++) {
    if (!same(lines[i], list.lines[i])) return `line ${i + 1} is ${lines[i].id} from frame ${lines[i].first} on disk and ${list.lines[i].id} from frame ${list.lines[i].first} in the build`
  }
  if (lines.length !== list.lines.length) return 'the events are the same, the lines are not'
  return 'the events and the lines are the same, the difference lies elsewhere in the file'
}

// Throws unless the cut list on disk is, byte for byte, the list this build gives now. Gives back the sha256 of the file.
export async function proveCutList(load, file, what) {
  const fresh = await cutOfBuild(load)
  const text = fresh.files[0][1]
  if (stateOf(file, text) !== 'equal') {
    let was = 'it cannot be read'
    try {
      const old = JSON.parse(fs.readFileSync(file, 'utf8'))
      was = `it holds ${Array.isArray(old.events) ? old.events.length : 'no'} events and ${Array.isArray(old.lines) ? old.lines.length : 'no'} lines; the build gives ${fresh.list.events.length} events and ${fresh.list.lines.length} lines; ${firstDifference(old, fresh.list)}`
    } catch {
      // The words above say it.
    }
    throw new Error(`${what} is refused: cut/CUTLIST.json is not the list this build gives now (${was}). Run npm run cut in this tree, then ${what} again`)
  }
  return sha256(Buffer.from(text))
}

// The records of the kept sounds in a folder. The wav files are not in the repo, their records are.
export function keptRecordsIn(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(path.join(dir, f)))
}

// One sum over the kept sounds a mix can take: every record's id with the sha256 of its file.
export function keptSum(records) {
  return sha256(Buffer.from(JSON.stringify(records.map((r) => [r.id, r.sha256]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)))))
}

// The code and the content a mix is made from: the engine, every page, and the sound code that no other hash covers.
export function mixBuild(root = at()) {
  return { engine: engineHash(root), pages: pageHashes(root), sound: soundHash(root) }
}

// Why a mix is not the mix of this build. An empty list means a film of this build may be joined with it.
// `now` holds what the tree gives at this moment: the wav's sha256, the cut list's sha256, the build and the sum of the kept sounds.
export function reasonsAgainstMix(record, now) {
  if (!record) return ['it has no record beside it']
  const out = []
  if (record.sha256 !== now.wavSha256) out.push('the wav is not the file its record names (sha256 differs)')
  if (!record.cutSha256) out.push('its record does not name the cut list it was laid by')
  else if (now.cutSha256 === null) out.push('cut/CUTLIST.json does not exist now')
  else if (record.cutSha256 !== now.cutSha256) out.push('it was laid by another cut list than cut/CUTLIST.json holds now')
  if (!record.build) out.push('its record does not name the build it was made in')
  else {
    const changed = []
    if (record.build.engine !== now.build.engine) changed.push('the engine')
    for (const u of Object.keys(now.build.pages)) if (!record.build.pages || record.build.pages[u] !== now.build.pages[u]) changed.push(u)
    if (record.build.sound !== now.build.sound) changed.push('the sound code')
    if (changed.length) out.push(`it is not of this build: ${changed.join(', ')} changed since it was made`)
  }
  if (Array.isArray(record.recordsWithNoFile) && record.recordsWithNoFile.length) out.push(`it was made with ${record.recordsWithNoFile.length} of the kept sounds missing from the tree`)
  if (!record.keptSha256) out.push('its record does not name the kept sounds it was made from')
  else if (record.keptSha256 !== now.keptSha256) out.push('the kept sounds have changed since it was made')
  return out
}

// What the tree gives now for a mix file, read from disk. No film is run for it.
export function mixNow(wav, root = at()) {
  const cut = path.join(root, 'cut', 'CUTLIST.json')
  return { wavSha256: sha256(fs.readFileSync(wav)), cutSha256: fs.existsSync(cut) ? sha256(fs.readFileSync(cut)) : null, build: mixBuild(root), keptSha256: keptSum(keptRecordsIn(path.join(root, 'audio', 'kept'))) }
}

// The reasons against the mix that lies in a tree, read from disk: the wav and the record beside it.
export function mixOfTree(wav, root = at()) {
  const file = wav.replace(/\.wav$/, '.json')
  let record = null
  try {
    record = fs.existsSync(file) ? readJson(file) : null
  } catch {
    record = null
  }
  return { record, reasons: reasonsAgainstMix(record, mixNow(wav, root)) }
}
