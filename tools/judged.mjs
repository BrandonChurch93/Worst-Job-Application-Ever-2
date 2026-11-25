// npm run judged: the computed judged list. --write puts what is missing into kit/PROGRESS.md. --replace-film writes the film's part anew, once, when the cut is fitted after the review.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { args, at } from './lib/paths.mjs'
import { cutListExists, judgedFilm, judgedPages, listedIds, mergedSection } from './lib/judged.mjs'
import { state } from './lib/state.mjs'

const a = args()
const entries = judgedPages()
let note = ''
if (cutListExists()) {
  const s = await state()
  try {
    entries.push(...judgedFilm(s.showcase))
  } finally {
    await s.close()
  }
  note = `The frame numbers are those of the build of ${new Date().toISOString().slice(0, 19)}Z. A judged frame is found again by its id when it is rendered, so a beat's frame follows its event.`
}
const listed = new Set(listedIds())
const missing = entries.filter((e) => !listed.has(e.id))
console.log(`judged list: ${entries.length} computed, ${listed.size} listed in kit/PROGRESS.md, ${missing.length} not listed yet`)
for (const e of missing.slice(0, 80)) console.log(`  not listed: ${e.id} (${e.unit})`)
if (a.write) {
  const m = mergedSection(entries, { replaceFilm: a['replace-film'] === true, note })
  const file = at('out', 'work', 'judged-section.md')
  fs.mkdirSync(at('out', 'work'), { recursive: true })
  fs.writeFileSync(file, m.text + '\n')
  const r = spawnSync('node', ['tools/progress.mjs', '--replace', 'Judged list', '--file', file], { cwd: at(), encoding: 'utf8' })
  console.log(r.status === 0 ? `kit/PROGRESS.md: the judged list now holds ${m.count} entries, ${m.added.length} added` : `kit/PROGRESS.md could not be written: ${r.stdout}${r.stderr}`)
  process.exit(r.status ?? 1)
}
process.exit(0)
