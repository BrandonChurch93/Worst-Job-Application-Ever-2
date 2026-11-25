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
  const src = walk(path.join(root, 'src')).filter((f) => !pageFolders.some((p) => f.startsWith(p)))
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

export function buildInfo(root) {
  return { engineHash: engineHash(root), pageHashes: pageHashes(root), assets: assetIndex(root), approved: approvedFiles(root), versions: versions(root) }
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
