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

export function packCheck(root, dir) {
  const index = committedIndex(root)
  if (!index) {
    console.log('pack-check: FAIL')
    console.log('  public/audio/index.json is not committed at HEAD of this tree, or does not parse')
    return false
  }
  const r = comparePack(dir, index)
  if (!r.problems.length) {
    console.log(`pack-check: pass. ${r.files} files of ${path.relative(root, dir)} are the ones the committed index lists, by size and sha256`)
    return true
  }
  console.log(`pack-check: FAIL. ${r.problems.length} of ${r.files + 1} differ from the committed index`)
  for (const p of r.problems) console.log(`  ${p}`)
  return false
}
