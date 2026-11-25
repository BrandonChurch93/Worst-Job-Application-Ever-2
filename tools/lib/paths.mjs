import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const at = (...p) => path.join(root, ...p)
export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
export const writeJson = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n')
}
export const config = () => readJson(at('config', 'showcase.json'))
export const args = (argv = process.argv.slice(2)) => {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const n = argv[i + 1]
      if (n === undefined || n.startsWith('--')) out[k] = true
      else {
        out[k] = n
        i++
      }
    } else out._.push(a)
  }
  return out
}
export const bootId = () => {
  try {
    return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim()
  } catch {
    return 'boot-' + Math.round(Date.now() / 1000 - process.uptime())
  }
}
