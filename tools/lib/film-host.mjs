// What the host check measures and how it is held against the limits in host.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const MB = 1024 * 1024
export const megabytes = (bytes) => Number((bytes / MB).toFixed(3))

// Every file under a folder with its size, largest first, names with forward slashes.
export function filesOf(dir) {
  const out = []
  const walk = (d) => {
    for (const name of fs.readdirSync(d).sort()) {
      const p = path.join(d, name)
      const st = fs.statSync(p)
      if (st.isDirectory()) walk(p)
      else out.push({ file: path.relative(dir, p).split(path.sep).join('/'), bytes: st.size })
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  return out.sort((a, b) => b.bytes - a.bytes || (a.file < b.file ? -1 : 1))
}

// The folders the host never gets, from the lines of .vercelignore.
export const ignoredFolders = (text) => text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!')).map((l) => l.replace(/^\/+|\/+$/g, '')).filter((l) => l && !/[*?[]/.test(l))

// The file of the built site a URL of it names, or null for a URL of another origin.
export function fileOfUrl(url, origin) {
  if (!url.startsWith(origin)) return null
  let rel = decodeURIComponent(new URL(url).pathname)
  if (rel.endsWith('/')) rel += 'index.html'
  return rel.replace(/^\/+/, '')
}

const TEXT = /\.(html|js|mjs|css|json|svg|txt|wasm)$/i
// The bytes a host that compresses text would send for a file: gzip for text, the file as it is for the rest.
export const sentBytes = (file, bytes, read) => (TEXT.test(file) ? zlib.gzipSync(read(), { level: 9 }).length : bytes)

// The four measures against the four limits. A measure of null is outside: it could not be taken.
export function verdict(m, host) {
  const row = (name, got, limit, unit) => ({ name, got, limit, unit, inside: got !== null && got <= limit })
  const rows = [
    row('host.maxShippedMb', m.shippedMb, host.maxShippedMb, 'MB'),
    row('host.maxFileMb', m.largestMb, host.maxFileMb, 'MB'),
    row('host.firstLoadMaxMb', m.firstLoadMb, host.firstLoadMaxMb, 'MB'),
    row('host.maxBuildMinutes', m.buildMinutes, host.maxBuildMinutes, 'min'),
  ]
  return { rows, inside: rows.every((r) => r.inside) }
}

// The requests made before the first complete picture, each once, with the bytes of the file it names.
export function firstLoad(urls, origin, sizeOf) {
  const seen = new Map()
  const missing = []
  const elsewhere = []
  for (const url of urls) {
    const file = fileOfUrl(url, origin)
    if (file === null) {
      if (!/^(data|blob|about):/.test(url)) elsewhere.push(url)
      continue
    }
    if (seen.has(file)) continue
    const bytes = sizeOf(file)
    if (bytes === null) missing.push(file)
    else seen.set(file, bytes)
  }
  const files = [...seen].map(([file, bytes]) => ({ file, bytes })).sort((a, b) => b.bytes - a.bytes || (a.file < b.file ? -1 : 1))
  return { files, bytes: files.reduce((n, f) => n + f.bytes, 0), missing, elsewhere }
}
