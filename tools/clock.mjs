import fs from 'node:fs'
import { at, args, config, readJson, writeJson, bootId } from './lib/paths.mjs'
import * as core from './lib/clock-core.mjs'

const a = args()
const cfg = config()
const file = at('kit', 'CLOCK.json')
const state = fs.existsSync(file) ? readJson(file) : core.newState()
const boot = bootId()
let now = Date.now()
if (a.at && a.start) {
  const t = Date.parse(a.at)
  if (Number.isFinite(t) && t <= now && (!state.lastMark || t >= state.lastMark.at)) now = t
}

function donePhases() {
  const done = []
  try {
    const text = fs.readFileSync(at('kit', 'PROGRESS.md'), 'utf8')
    for (const m of text.matchAll(/^\| (\d) [^|]*\| done \|/gm)) done.push(Number(m[1]))
  } catch {}
  return done
}

let lines
const opts = { status: a.status === true }
if (a.start) lines = core.start(state, cfg, now, boot)
else if (a.review === true) lines = core.approveReview(state, cfg, now, boot)
else if (a.continue !== undefined) lines = core.continueBuild(state, cfg, Number(a.continue), donePhases(), now, boot)
else if (a['review-round'] !== undefined) lines = core.tickReviewRound(state, cfg, Number(a['review-round']), now, boot, opts)
else if (a.extension !== undefined) lines = core.tickExtension(state, cfg, Number(a.extension), now, boot, opts)
else if (a.phase !== undefined) lines = core.tickPhase(state, cfg, Number(a.phase), now, boot, opts)
else {
  lines = state.lastPrint?.length ? ['clock: last print, no tick made', ...state.lastPrint] : ['clock: no tick yet. Use --start, --phase N, --review-round N, --review, --continue N or --extension N']
}

if (a.start || a.review === true || a.continue !== undefined || a['review-round'] !== undefined || a.extension !== undefined || a.phase !== undefined) {
  writeJson(file, state)
  try {
    const p = at('kit', 'PROGRESS.md')
    const text = fs.readFileSync(p, 'utf8')
    const head = '## Clock\n\nCopied from the last tick of `npm run clock`.\n\n'
    const i = text.indexOf(head)
    if (i >= 0) {
      const j = text.indexOf('\n## ', i + head.length)
      const block = '```\n' + lines.join('\n') + '\n```\n'
      fs.writeFileSync(p, text.slice(0, i + head.length) + block + text.slice(j))
    }
  } catch {}
}
console.log(lines.join('\n'))
