// npm run looks:fetch: fetches every agent's looks branch and adds its pictures to the look log. Nothing is merged.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { at } from './lib/paths.mjs'
import { addLook, readLooks } from './lib/looks.mjs'

const git = (...words) => execFileSync('git', words, { cwd: at(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
git('fetch', '-q', 'origin', '+refs/heads/agent/*-looks:refs/remotes/origin/agent/*-looks')
const refs = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/agent').split('\n').filter((r) => r.endsWith('-looks'))
const known = new Set(readLooks().map((l) => l.source).filter(Boolean))
let added = 0
for (const ref of refs) {
  let index
  try {
    index = JSON.parse(git('show', `${ref}:looks.json`))
  } catch {
    continue
  }
  for (const l of index.looks) {
    const source = `${index.folder}:${l.from}:${l.time}`
    if (known.has(source)) continue
    const dir = at('out', 'work', 'looks', 'agents', index.folder)
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${l.time.replace(/[-:.TZ]/g, '').slice(0, 14)}-${path.basename(l.from).replace(/\.[a-z]+$/i, '')}.jpg`)
    fs.writeFileSync(file, execFileSync('git', ['show', `${ref}:${l.file}`], { cwd: at(), maxBuffer: 64 * 1024 * 1024 }))
    addLook(file, l.caption, index.folder, { source, agentCommit: index.commit })
    added++
  }
}
console.log(`looks:fetch: ${refs.length} looks branches, ${added} new pictures`)
