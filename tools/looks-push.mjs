// npm run looks:push -- --folder NAME: an agent's newest looks, pushed to its looks branch, agent/NAME-looks.
// Takes the newest pictures of out/work/looks/index.jsonl, at most status.maxPictures, each resized to status.pictureLongEdgePx.
// The branch has no history in common with the main branch. It is only ever fetched, and never pushed with force.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { args, at, config } from './lib/paths.mjs'
import { readLooks } from './lib/looks.mjs'

const a = args()
if (!a.folder || a.folder === true) {
  console.error('looks:push: give --folder NAME')
  process.exit(1)
}
const c = config()
const branch = `agent/${a.folder}-looks`
const looks = readLooks().filter((l) => fs.existsSync(at(l.file)) && /\.(png|jpg|jpeg)$/i.test(l.file)).slice(-c.status.maxPictures)
if (!looks.length) {
  console.log('looks:push: no looks yet')
  process.exit(0)
}
const git = (cwd, ...words) => execFileSync('git', words, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const remote = git(at(), 'remote', 'get-url', 'origin')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'looks-'))
try {
  git(os.tmpdir(), 'clone', '-q', '--depth', '1', '--single-branch', '--branch', branch, remote, dir)
  for (const name of fs.readdirSync(dir)) if (name !== '.git') fs.rmSync(path.join(dir, name), { recursive: true, force: true })
} catch {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  git(dir, 'init', '-q')
  git(dir, 'checkout', '-q', '-b', branch)
}
git(dir, 'config', 'user.name', git(at(), 'config', 'user.name') || `agent ${a.folder}`)
git(dir, 'config', 'user.email', git(at(), 'config', 'user.email') || 'noreply@perplexity.ai')
const list = []
let n = 0
for (const l of looks) {
  const name = `look-${++n}.jpg`
  await sharp(at(l.file)).resize({ width: c.status.pictureLongEdgePx, height: c.status.pictureLongEdgePx, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#202020' }).jpeg({ quality: 88 }).toFile(path.join(dir, name))
  list.push({ file: name, caption: l.caption, time: l.time, by: a.folder, from: l.file })
}
fs.writeFileSync(path.join(dir, 'looks.json'), JSON.stringify({ folder: a.folder, pushed: new Date().toISOString(), commit: git(at(), 'rev-parse', 'HEAD'), looks: list }, null, 2) + '\n')
git(dir, 'add', '-A')
git(dir, 'commit', '-q', '-m', `Looks of ${a.folder}\n\nCo-authored-by: Perplexity <noreply@perplexity.ai>`)
git(dir, 'push', '-q', remote, `${branch}:${branch}`)
fs.rmSync(dir, { recursive: true, force: true })
console.log(`looks:push: ${list.length} pictures on ${branch}`)
