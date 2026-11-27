// The sets of a built pack with each file's heading and sha256, as text: node pipeline/phase5/pack-frames-list.mjs out/work/packs/round-025/R4
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
const pack = JSON.parse(fs.readFileSync(path.join(dir, 'pack.json'), 'utf8'))
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const out = []
for (const s of pack.sets) {
  out.push(`SET ${s.set} (${s.files.length} files${s.groups ? `, ${s.groups.join(' + ')}` : ''})`)
  for (const f of s.files) out.push(`  ${f.file}\n    ${f.heading ?? f.about?.heading ?? ''}`)
}
out.push('', 'sha256')
for (const name of fs.readdirSync(dir).sort()) out.push(`${sha(path.join(dir, name))}  ${name}`)
for (const extra of process.argv.slice(3)) if (fs.existsSync(extra)) out.push(`${sha(extra)}  ${extra}`)
process.stdout.write(out.join('\n') + '\n')
