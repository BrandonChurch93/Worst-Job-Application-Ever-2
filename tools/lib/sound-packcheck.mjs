import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')

export function listedFiles(index) {
  const out = []
  if (index.pack) out.push({ file: index.pack.file, bytes: index.pack.bytes, sha256: index.pack.sha256 ?? null })
  for (const f of [...(index.loops ?? []), ...(index.lines ?? [])]) out.push({ file: f.file, bytes: f.bytes ?? null, sha256: f.sha256 ?? null })
  return out
}

export function committedIndex(root) {
  const r = spawnSync('git', ['show', 'HEAD:public/audio/index.json'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) return null
  try {
    return JSON.parse(r.stdout)
  } catch {
    return null
  }
}

export function comparePack(dir, index) {
  const problems = []
  const listed = listedFiles(index)
  const names = new Set(['index.json', ...listed.map((f) => f.file)])
  for (const f of listed) {
    const file = path.join(dir, f.file)
    if (!fs.existsSync(file)) {
      problems.push(`missing: ${f.file}`)
      continue
    }
    const bytes = fs.readFileSync(file)
    if (f.bytes !== null && bytes.length !== f.bytes) problems.push(`different size: ${f.file} is ${bytes.length} bytes, the index says ${f.bytes}`)
    else if (f.sha256 === null) problems.push(`no sha256 in the index for ${f.file}: pack again with this tool`)
    else if (sha(bytes) !== f.sha256) problems.push(`different content: ${f.file} has sha256 ${sha(bytes).slice(0, 12)}, the index says ${f.sha256.slice(0, 12)}`)
  }
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) if (!names.has(f)) problems.push(`not in the index: ${f}`)
  const here = path.join(dir, 'index.json')
  if (!fs.existsSync(here)) problems.push('missing: index.json')
  else if (JSON.stringify(JSON.parse(fs.readFileSync(here, 'utf8'))) !== JSON.stringify(index)) problems.push('different content: index.json in the folder is not the committed one')
  return { files: listed.length, problems }
}

// The narrator lines of the index, decoded: a line whose largest sample is over full scale is cut flat by a browser's decoder.
export function linesOverFullScale(dir, index) {
  const problems = []
  let largest = null
  for (const f of index.lines ?? []) {
    const file = path.join(dir, f.file)
    if (!fs.existsSync(file)) continue
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-'], { maxBuffer: 1 << 28 })
    if (r.error) return { lines: 0, largest: null, problems: ['the lines cannot be decoded here to measure their peaks: ffmpeg is missing'] }
    if (r.status !== 0 || r.stdout.length < 4) {
      problems.push(`cannot be decoded: ${f.file}`)
      continue
    }
    const x = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + Math.floor(r.stdout.length / 4) * 4))
    let top = 0
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > top) top = Math.abs(x[i])
    const db = top > 0 ? 20 * Math.log10(top) : -Infinity
    if (!largest || db > largest.db) largest = { file: f.file, db }
    if (db > 0) problems.push(`over full scale: ${f.file} decodes with its largest sample at +${db.toFixed(2)} dB, which a browser's decoder cuts flat`)
  }
  return { lines: (index.lines ?? []).length, largest, problems }
}

export function packCheck(root, dir) {
  const index = committedIndex(root)
  if (!index) {
    console.log('pack-check: FAIL')
    console.log('  public/audio/index.json is not committed at HEAD of this tree, or does not parse')
    return false
  }
  const r = comparePack(dir, index)
  const peaks = linesOverFullScale(dir, index)
  if (!r.problems.length && !peaks.problems.length) {
    console.log(`pack-check: pass. ${r.files} files of ${path.relative(root, dir)} are the ones the committed index lists, by size and sha256${peaks.largest ? `, and the ${peaks.lines} narrator lines decode under full scale, the largest sample at ${peaks.largest.db.toFixed(2)} dB (${peaks.largest.file})` : ''}`)
    return true
  }
  if (r.problems.length) console.log(`pack-check: FAIL. ${r.problems.length} of ${r.files + 1} differ from the committed index`)
  for (const p of r.problems) console.log(`  ${p}`)
  if (peaks.problems.length) console.log(`pack-check: FAIL. ${peaks.problems.length} of ${peaks.lines} narrator lines do not decode under full scale`)
  for (const p of peaks.problems) console.log(`  ${p}`)
  return false
}
