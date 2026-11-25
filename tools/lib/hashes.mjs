// Hashes and the generated indexes. Shared by the build (vite.config.ts) and by the harness,
// so the page and the tools always agree on what state a picture was made from.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Which folders make up a unit, as kit/05-ARCHITECTURE.md gives them.
export const unitFolders = {
  step1: ['src/pages/step1', 'src/shell', 'src/cursor', 'src/post'],
  step2: ['src/pages/step2'],
  marketing: ['src/pages/marketing'],
  pinball: ['src/pages/step3', 'src/table'],
  boss: ['src/pages/step4', 'src/boss'],
  decision: ['src/pages/step5']
}
// The asset folder of each page unit, inside public/assets/ and assets-full/.
export const unitAssetFolders = { step1: ['step1', 'shell', 'cursor'], step2: ['step2'], marketing: ['marketing'], pinball: ['step3', 'table'], boss: ['step4', 'boss'], decision: ['step5'] }

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.DS_Store') continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function hashFiles(root, files) {
  const h = crypto.createHash('sha256')
  for (const f of files.sort()) {
    h.update(path.relative(root, f).split(path.sep).join('/'))
    h.update('\0')
    h.update(fs.readFileSync(f))
    h.update('\0')
  }
  return h.digest('hex').slice(0, 16)
}

export function engineHash(root) {
  const pageFolders = Object.values(unitFolders).flat().map((f) => path.join(root, f) + path.sep)
  const sound = path.join(root, 'src', 'audio') + path.sep
  const src = walk(path.join(root, 'src')).filter((f) => !f.startsWith(sound) && !pageFolders.some((p) => f.startsWith(p)))
  const files = [...src, ...walk(path.join(root, 'config')), ...walk(path.join(root, 'content'))]
  const lock = path.join(root, 'package-lock.json')
  if (fs.existsSync(lock)) files.push(lock)
  return hashFiles(root, files)
}

export function pageHashes(root) {
  const out = {}
  for (const [unit, folders] of Object.entries(unitFolders)) {
    const files = folders.flatMap((f) => walk(path.join(root, f)))
    for (const a of unitAssetFolders[unit]) {
      files.push(...walk(path.join(root, 'public', 'assets', a)), ...walk(path.join(root, 'assets-full', a)))
    }
    out[unit] = hashFiles(root, files)
  }
  return out
}

// The folders every page is drawn with. They sit in the look lock unit's hash, so a record of another page names them too.
export const sharedFolders = ['src/shell', 'src/cursor', 'src/post']

export function sharedHash(root) {
  return hashFiles(root, sharedFolders.flatMap((f) => walk(path.join(root, f))))
}

// Every file of each asset set, by page folder: what the loader reads.
export function assetIndex(root) {
  const set = (base) => {
    const out = {}
    const dir = path.join(root, base)
    if (!fs.existsSync(dir)) return out
    for (const folder of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, folder)
      if (!fs.statSync(p).isDirectory()) continue
      out[folder] = walk(p).map((f) => ({ file: path.relative(dir, f).split(path.sep).join('/'), bytes: fs.statSync(f).size }))
    }
    return out
  }
  return { web: set(path.join('public', 'assets')), full: set('assets-full') }
}

export function approvedFiles(root) {
  const dir = path.join(root, 'references', 'approved')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((n) => /\.(png|jpg|jpeg|webp)$/i.test(n)).sort().map((n) => `references/approved/${n}`)
}

export function versions(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  const out = {}
  for (const name of ['three', 'gsap', '@dimforge/rapier2d-deterministic-compat', 'vite', 'typescript']) {
    out[name] = (pkg.dependencies && pkg.dependencies[name]) || (pkg.devDependencies && pkg.devDependencies[name]) || 'unknown'
  }
  return out
}

// Which modules under the page folders each mode loads, read from the imports themselves, starting at src/main.ts.
// A static import is loaded by every mode. A dynamic import is loaded by the modes src/modes.json gives for it.
// A relative dynamic import that the table does not hold goes to `unplaced`, and check G18 then fails.
const STATIC = /(?:^|[\n;])\s*(?:import|export)\s+(?!type\b)(?:[^'"()]*?\sfrom\s+)?['"]([^'"]+)['"]/g
const DYNAMIC = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g

function resolveImport(from, spec) {
  if (!spec.startsWith('.')) return null
  const base = path.resolve(path.dirname(from), spec.split('?')[0])
  for (const p of [base, `${base}.ts`, path.join(base, 'index.ts')]) if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  return null
}

export function moduleLists(root) {
  const rel = (f) => path.relative(root, f).split(path.sep).join('/')
  const table = JSON.parse(fs.readFileSync(path.join(root, 'src', 'modes.json'), 'utf8'))
  const modes = table.modes
  const reads = new Map()
  const read = (file) => {
    if (reads.has(file)) return reads.get(file)
    const out = { statics: [], dynamics: [] }
    if (/\.(ts|mjs|js)$/.test(file)) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(STATIC)) {
        const to = resolveImport(file, m[1])
        if (to) out.statics.push(to)
      }
      for (const m of text.matchAll(DYNAMIC)) {
        const to = resolveImport(file, m[1])
        if (to) out.dynamics.push(to)
      }
    }
    reads.set(file, out)
    return out
  }
  const unplaced = new Set()
  const loaded = (mode) => {
    const seen = new Set()
    const todo = [path.join(root, 'src', 'main.ts')]
    while (todo.length) {
      const file = todo.pop()
      if (seen.has(file)) continue
      seen.add(file)
      const r = read(file)
      todo.push(...r.statics)
      for (const d of r.dynamics) {
        const listed = table.lazy[rel(d)]
        if (!listed) unplaced.add(`${rel(d)} (from ${rel(file)})`)
        else if (listed.includes(mode)) todo.push(d)
      }
    }
    return seen
  }
  const folders = ['src/pages/', 'src/table/', 'src/boss/']
  const out = {}
  for (const mode of modes) out[mode] = [...loaded(mode)].map(rel).filter((f) => folders.some((d) => f.startsWith(d))).sort()
  for (const [file, list] of Object.entries(table.lazy)) {
    if (!fs.existsSync(path.join(root, file))) unplaced.add(`${file} (in src/modes.json, and no such file)`)
    for (const m of list) if (!modes.includes(m)) unplaced.add(`${file} (src/modes.json gives it the mode "${m}", which does not exist)`)
  }
  return { ...out, unplaced: [...unplaced].sort() }
}

export function buildInfo(root) {
  return { engineHash: engineHash(root), pageHashes: pageHashes(root), sharedHash: sharedHash(root), assets: assetIndex(root), approved: approvedFiles(root), versions: versions(root), modules: moduleLists(root) }
}

// The build's own plugin: gives the page its hashes and indexes as a module, with no file copied.
export function buildInfoPlugin(root) {
  const id = 'virtual:build-info'
  return {
    name: 'wja-build-info',
    resolveId(source) {
      if (source === id) return '\0' + id
      return null
    },
    load(loaded) {
      if (loaded !== '\0' + id) return null
      const info = buildInfo(root)
      // The harness reads this to know which state of the source the build in dist/ was made from.
      const note = path.join(root, 'out', 'work', 'build-info.json')
      fs.mkdirSync(path.dirname(note), { recursive: true })
      fs.writeFileSync(note, JSON.stringify({ engineHash: info.engineHash, pageHashes: info.pageHashes }, null, 2) + '\n')
      return `export default ${JSON.stringify(info)}`
    }
  }
}

// True when dist/ was built from the source as it is now.
export function buildIsCurrent(root) {
  const note = path.join(root, 'out', 'work', 'build-info.json')
  if (!fs.existsSync(note) || !fs.existsSync(path.join(root, 'dist', 'index.html'))) return false
  const built = JSON.parse(fs.readFileSync(note, 'utf8'))
  return built.engineHash === engineHash(root) && JSON.stringify(built.pageHashes) === JSON.stringify(pageHashes(root))
}
