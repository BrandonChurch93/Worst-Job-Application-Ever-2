import fs from 'node:fs'
import path from 'node:path'
import { at, root } from './paths.mjs'

export const looksDir = at('out', 'work', 'looks')
export const looksIndex = path.join(looksDir, 'index.jsonl')

export function addLook(file, caption, by = 'builder', extra = {}) {
  fs.mkdirSync(path.join(looksDir, 'files'), { recursive: true })
  let abs = path.resolve(file)
  if (!abs.startsWith(at('out', 'work'))) {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const dest = path.join(looksDir, 'files', `${stamp}-${path.basename(abs)}`)
    fs.copyFileSync(abs, dest)
    abs = dest
  }
  const line = { file: path.relative(root, abs), caption, time: new Date().toISOString(), by, ...extra }
  fs.appendFileSync(looksIndex, JSON.stringify(line) + '\n')
  return line
}

export function readLooks() {
  if (!fs.existsSync(looksIndex)) return []
  return fs
    .readFileSync(looksIndex, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
}
