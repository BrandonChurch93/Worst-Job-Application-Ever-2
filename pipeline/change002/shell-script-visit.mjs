// Change note 003, measured: when each line of the script is asked for and when it is spoken on whole visits of the live site, with no browser.
// Run it on a tree that holds the pages' events: node pipeline/change002/shell-script-visit.mjs [runs] [gap seconds, one or more]. It writes shell-script-visit.json beside itself,
// or shell-script-visit-gap-N.json when a gap is given. Each bot's visit is run twice: once with the sound allowed while the careers page stands at rest (first: page),
// and once as the visit of someone whose first press is the Apply button (first: apply): the press is given to the sound before the sound is allowed, which is what closes line 1 on such a visit. The gap is the kit's audio.liveNarratorMinGapSeconds; a gap given here is set for the run only, in memory, and no file of the kit is written.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logic } from '../../tools/lib/logic.mjs'
import { visit } from '../../tools/lib/sound-visit.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const c = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'config', 'showcase.json'), 'utf8'))
const runs = Number(process.argv[2] ?? 20)
const gaps = process.argv.slice(3).map(Number).filter((g) => Number.isFinite(g) && g >= 0)
const r2 = (v) => (v === null || v === undefined ? null : Number(v.toFixed(2)))
const { load, close } = await logic()
const live = (await load('/src/config.ts')).config
const kitGap = live.audio.liveNarratorMinGapSeconds
for (const gap of gaps.length ? gaps : [kitGap]) {
live.audio.liveNarratorMinGapSeconds = gap
const { standIns } = await load('/src/audio/standin.ts')
const lines = standIns()
const secondsOf = (key) => lines.get(key).seconds
const rows = []
const applyFirst = async (file) => {
  const m = await load(file)
  if (file !== '/src/audio/index.ts') return m
  return { ...m, makeSound: (o) => {
    const s = m.makeSound(o)
    const unlock = s.unlock.bind(s)
    s.unlock = () => { s.event({ name: 'button-press', step: 0, page: 'marketing', x: 0, y: 0, hitsCursor: false }, 'live'); return unlock() }
    return s
  } }
}
for (const how of ['page', 'apply']) for (const bot of ['keen', 'clumsy']) {
  for (let i = 0; i < runs; i++) {
    const seed = c.seed + i
    const calls = []
    const v = await visit(how === 'apply' ? applyFirst : load, c, bot, seed, calls)
    const events = calls.filter((x) => x.event).map((x) => ({ at: x.at, name: x.event.name, page: x.event.page }))
    const turns = v.turns
    const restart = turns.filter((t) => t.page === 'marketing').pop()?.at ?? Infinity
    const first = (name, page, n = 0) => events.filter((e) => e.name === name && (page === undefined || e.page === page) && e.at < restart)[n]?.at ?? null
    const said = (key) => v.log.filter((e) => e.line === `line.${key}` && e.at < restart)
    const start = (key) => (said(key).some((e) => e.what === 'taken back') ? null : said(key).find((e) => e.what === 'spoken')?.start ?? null)
    const lost = (key) => said(key).find((e) => e.what === 'taken back' || e.what === 'dropped')?.why ?? null
    const apply = turns.find((t) => t.page === 'step1')?.at ?? null
    const sensed = first('candidate-sensed', 'step1')
    const nameDone = first('field-done', 'step1')
    const sign = first('volume-sign', 'step2')
    const full = first('crank-full', 'step2')
    const crankGone = events.filter((e) => e.name === 'field-done' && e.page === 'step2' && full !== null && e.at >= full)[0]?.at ?? null
    rows.push({
      first: how, bot, seed, finished: v.finished, seconds: v.seconds, step1At: apply,
      line1: start('marketing.stroll.0'), sensed, nameDone,
      line2: start('step1.firstName.0'), line2Lost: lost('step1.firstName.0'), line2Late: start('step1.firstName.0') === null || sensed === null ? null : start('step1.firstName.0') - sensed,
      received: first('resume-received', 'step1'), line3: start('step1.shredded.0'), line3Lost: lost('step1.shredded.0'),
      sign, line4a: start('step2.crank.0'), line4aLost: lost('step2.crank.0'), full, crankGone, line4b: start('step2.crank.1'), line4bLost: lost('step2.crank.1'),
      vacuum: first('vacuum-on', 'step3'), line5: start('pinball.seal.0'), line5Lost: lost('pinball.seal.0'),
      checkbox: first('checkbox', 'step4'), line6: start('boss.verify.0'), line6Lost: lost('boss.verify.0'),
      formed: first('boss-formed', 'step4'), line7: start('boss.unfold.0'), line7Lost: lost('boss.unfold.0'), line7b: start('boss.unfold.1'), line7c: start('boss.unfold.2'),
      stamp: first('stamp', 'step5'), line8: start('decision.letter.0'), line8Lost: lost('decision.letter.0'), restart: restart === Infinity ? null : restart,
      line9: v.log.some((e) => e.line === 'line.decision.reset.0' && e.what === 'taken back') ? null : v.log.find((e) => e.line === 'line.decision.reset.0' && e.what === 'spoken')?.start ?? null,
      line1Again: v.log.filter((e) => e.line === 'line.marketing.stroll.0' && e.what === 'spoken')[1]?.start ?? null
    })
  }
}
const of = (first, bot) => rows.filter((r) => r.first === first && r.bot === bot)
const nums = (list) => list.filter((x) => x !== null && Number.isFinite(x)).sort((a, b) => a - b)
const stat = (list) => { const n = nums(list); return n.length ? { n: n.length, least: r2(n[0]), median: r2(n[Math.floor(n.length / 2)]), most: r2(n[n.length - 1]) } : { n: 0 } }
const summary = {}
for (const how of ['page', 'apply']) for (const bot of ['keen', 'clumsy']) {
  const rs = of(how, bot)
  const count = (key) => rs.filter((r) => r[key] !== null).length
  summary[`${how} ${bot}`] = {
    visits: rs.length, finished: rs.filter((r) => r.finished).length,
    spoken: Object.fromEntries(['line1', 'line2', 'line3', 'line4a', 'line4b', 'line5', 'line6', 'line7', 'line7b', 'line7c', 'line8', 'line9'].map((k) => [k, count(k)])),
    asked: Object.fromEntries(['sensed', 'received', 'sign', 'full', 'vacuum', 'checkbox', 'formed', 'stamp'].map((k) => [k, count(k)])),
    line2: { startsAfterLine1Starts: stat(rs.map((r) => (r.line2 === null || r.line1 === null ? null : r.line2 - r.line1))), lateAfterItsEvent: stat(rs.map((r) => r.line2Late)), sensedToNameDone: stat(rs.map((r) => (r.nameDone === null || r.sensed === null ? null : r.nameDone - r.sensed))), applyToSensed: stat(rs.map((r) => (r.sensed === null ? null : r.sensed - r.step1At))) },
    crank: { signToFull: stat(rs.map((r) => (r.full === null || r.sign === null ? null : r.full - r.sign))), fullToCrankGone: stat(rs.map((r) => (r.crankGone === null || r.full === null ? null : r.crankGone - r.full))), line4aLateAfterItsEvent: stat(rs.map((r) => (r.line4a === null ? null : r.line4a - r.sign))), line4bLateAfterItsEvent: stat(rs.map((r) => (r.line4b === null ? null : r.line4b - r.full))), line3EndToSign: stat(rs.map((r) => (r.line3 === null || r.sign === null ? null : r.sign - (r.line3 + secondsOf('step1.shredded.0'))))) },
    lost: Object.fromEntries(['line2Lost', 'line3Lost', 'line4aLost', 'line4bLost', 'line5Lost', 'line6Lost', 'line7Lost', 'line8Lost'].map((k) => [k, rs.reduce((m, r) => { if (r[k]) m[r[k]] = (m[r[k]] ?? 0) + 1; return m }, {})]))
  }
}
fs.writeFileSync(path.join(here, gaps.length ? `shell-script-visit-gap-${gap}.json` : 'shell-script-visit.json'), JSON.stringify({ runs, gapSeconds: gap, kitGapSeconds: kitGap, seconds: Object.fromEntries([...lines.values()].map((l) => [l.key, { words: l.phrases.reduce((n, p) => n + p.words.split(' ').length, 0), seconds: l.seconds, draft: l.draft }])), summary, rows }, null, 1) + '\n')
console.log(`gap ${gap} s`)
const late = (rs, k, e) => { const n = nums(rs.map((r) => (r[k] === null || r[e] === null ? null : r[k] - r[e]))); return n.length ? `${n.length} of ${rs.length}, ${r2(n[0])} to ${r2(n[n.length - 1])} s late` : `0 of ${rs.length}` }
for (const how of ['page', 'apply']) for (const bot of ['keen', 'clumsy']) {
  const rs = of(how, bot)
  console.log(`first ${how}, ${bot}: 1 ${rs.filter((r) => r.line1 !== null).length} of ${rs.length} | 2 ${late(rs, 'line2', 'sensed')} | 3 ${late(rs, 'line3', 'received')} | 4a ${late(rs, 'line4a', 'sign')} | 4b ${late(rs, 'line4b', 'full')} | 5 ${late(rs, 'line5', 'vacuum')} | 6 ${late(rs, 'line6', 'checkbox')} | 7 ${late(rs, 'line7', 'formed')} | 8 ${late(rs, 'line8', 'stamp')} | 9 ${late(rs, 'line9', 'restart')} | 1 again ${rs.filter((r) => r.line1Again !== null).length}`)
}
}
live.audio.liveNarratorMinGapSeconds = kitGap
await close()
