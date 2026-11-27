// node pipeline/phase5/pack-frames-check.mjs RUN.json: for one recorded visit (the pack's own out/work/packs/cache/<commit>/live-high/site-run.json, or a file of pack-whole-walk.mjs)
// lays the motion plan and says, from the rows alone, whether each close run holds what its heading says. One line a check, "ok" or "NOT", with the numbers. Ends with code 1 if a line says NOT.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { wrap } from '../../tools/lib/pack-build.mjs'
import { BLOW, CLOSE, COL, DROP, GATE, KEYS, MACHINE, MOVES, PAGE_HAS, SAVE, SEAT, SITE, TAKEN, holdsBox, keyBlock, momentsOf, motionPlan } from '../../tools/lib/pack-site.mjs'
import { packPlan } from '../../tools/lib/pack-plan.mjs'

const cfg = config()
const run = momentsOf(cfg, JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))
const rows = run.rows
const m = run.moments
const plan = motionPlan(cfg, run)
const ball = cfg.table.ballPx
const hd = cfg.formats.hd
let bad = 0
const say = (ok, words) => {
  if (!ok) bad += 1
  console.log(`${ok ? 'ok ' : 'NOT'} ${words}`)
}
const of = (moment) => plan.items.filter((f) => f.moment === moment)
const at = (i) => [rows[i][COL.heroX], rows[i][COL.heroY] - rows[i][COL.scroll]]
const marks = (files) => files.flatMap((f) => f.hands.map((h) => h.split(' ')))
const stepsOf = (files) => files.flatMap((f) => f.steps)
const all = (steps, test) => steps.filter((i) => !test(i))
const span = (s) => `${s[0]} to ${s[s.length - 1]}`

console.log(`visit: ${rows.length} steps, finished ${run.finished}, problems ${(run.problems || []).length}, gags ${run.gags.length}, hits ${run.hits.length}`)
console.log(`moments: ${JSON.stringify({ turn: m.turn, taken: m.taken, back: m.back, thrown: m.thrown, type: m.type, leaves: m.leaves, met: m.met, gate: m.gate })}`)
say(plan.limitTook.length === 0 && plan.leftOut.length === 0 && plan.missing.length === 0, `nothing taken away: limitTook ${JSON.stringify(plan.limitTook)}, leftOut ${JSON.stringify(plan.leftOut)}, missing ${JSON.stringify(plan.missing)}`)
const sets = packPlan(cfg, { role: 'R4', round: 25, unit: SITE, facts: run }).sets
say(sets.every((s) => s.files.length <= cfg.critics.maxFilesPerMessage), `sets: ${sets.map((s) => `${s.set} ${s.groups.join('+')} ${s.files.length}`).join(', ')}; ${plan.items.length} sheets`)
say(sets.every((s) => s.files.every((f) => s.files.filter((g) => g.moment === f.moment && g.run[0] === f.run[0]).flatMap((g) => g.steps).join() === f.run.join())), 'no run is cut by the end of a set')
const near = plan.items.filter((f) => f.px)
say(near.every((f) => f.percent === 100), `close sheets at 100%: ${near.length} of ${near.filter((f) => f.percent === 100).length}`)
const lines = near.filter((f) => wrap(f.heading, f.columns * f.tileW + 8 * (f.columns - 1) - 16, 15).length > f.lines)
say(lines.length === 0, `headings within their lines: ${near.length - lines.length} of ${near.length}`)

const seat = of('seat')
if (seat.length) {
  const s = stepsOf(seat)
  const mark = s.filter((_, j) => marks(seat)[j].includes(SEAT.mark))
  say(mark.length === 1 && s[0] === mark[0] - SEAT.before && s[s.length - 1] === mark[0] + SEAT.after, `seat: steps ${span(s)} on ${seat.length} sheets, "contact" under step ${mark.join()}, windows ${JSON.stringify(seat[0].windows)}`)
} else say(false, 'seat: no sheet')

const taken = of('taken')
if (taken.length) {
  const s = stepsOf(taken)
  const w = taken[0].windows[0]
  const out = all(s, (i) => holdsBox(w, [at(i)[0] - TAKEN.room, at(i)[1] - TAKEN.room, at(i)[0] + TAKEN.room, at(i)[1] + TAKEN.room]))
  const fixed = holdsBox(w, [TAKEN.slot[0] - TAKEN.paper[0] / 2, TAKEN.slot[1] - TAKEN.paper[1], TAKEN.slot[0] + TAKEN.paper[0] / 2, TAKEN.slot[1] + TAKEN.holder]) && holdsBox(w, [TAKEN.tray[0] - 1, TAKEN.tray[1] - 1, TAKEN.tray[0] + TAKEN.edge, TAKEN.tray[1] + TAKEN.edge])
  const p = s.filter((_, j) => marks(taken)[j].includes(PAGE_HAS.mark))
  say(out.length === 0 && fixed && s[0] === m.taken - TAKEN.before && p[0] === m.taken, `take: steps ${span(s)} on ${taken.length} sheets, window ${JSON.stringify(w)}, the arrow with ${TAKEN.room} px round it outside in ${out.length} frames, paper, holder and tray corner inside ${fixed}, P from ${p[0]} (take ${m.taken})`)
} else say(false, 'take: no sheet')

const type = of('type')
if (type.length) {
  const s = stepsOf(type)
  const k = marks(type)
  const wrong = s.filter((i, j) => k[j].includes(KEYS.mark) !== Boolean(rows[i - 1][COL.down]))
  const hits = run.hits.filter((h) => h.step >= s[0] && h.step <= s[s.length - 1])
  say(wrong.length === 0 && s[0] === m.type.press - KEYS.before && s[s.length - 1] === m.type.release + KEYS.after, `key: press ${m.type.nth} of ${m.type.of}, clear ${m.type.clear} (${m.type.why}), steps ${span(s)}, marks that do not follow the button ${wrong.length}, hits on the arrow in its frames ${hits.length}`)
  const block = keyBlock(cfg)
  const s1 = run.pages.find((p) => p.page === 'step1')
  let n = 0
  let least = Infinity
  for (let i = s1.first + 1; i <= s1.last; i++) {
    const r = rows[i - 1]
    const y = r[COL.pointerY] + r[COL.scroll]
    if (!(r[COL.down] && !rows[i][COL.down] && r[COL.pointerX] >= block.x && r[COL.pointerX] <= block.x + block.w && y >= block.y && y <= block.y + block.h)) continue
    n += 1
    let rest = 0
    while (i + rest <= s1.last && rows[i + rest][COL.pointerX] === r[COL.pointerX] && rows[i + rest][COL.pointerY] === r[COL.pointerY] && !rows[i + rest][COL.down]) rest += 1
    least = Math.min(least, rest)
  }
  say(n > 0 && least >= KEYS.rest, `key: ${n} releases on the keyboard, the pointer rests ${least} steps or more after each (named ${KEYS.rest})`)
} else say(false, 'key: no sheet')

const back = of('given-back')
if (back.length) {
  const s = stepsOf(back)
  const k = marks(back)
  const p = s.filter((_, j) => k[j].includes(PAGE_HAS.mark))
  const f = s.filter((_, j) => k[j].includes(PAGE_HAS.back))
  const has = m.thrown ? m.thrown.handed : m.back
  const w = back[0].windows[0]
  const out = all(s, (i) => holdsBox(w, [...at(i), ...at(i)]))
  say(f.length === 1 && f[0] === has && p[p.length - 1] === has - 1 && out.length === 0, `give back: steps ${span(s)} on ${back.length} sheets, P to ${p[p.length - 1]}, "follows" under ${f.join()} (the rows: ${has}), thrown ${JSON.stringify(m.thrown)}, the arrow outside the window in ${out.length} frames`)
} else say(false, 'give back: no sheet')

const moved = plan.items.filter((f) => f.heading.includes(`Under a frame, ${MOVES.mark}: `))
say(moved.length > 0, `M: on ${moved.length} sheets (${[...new Set(moved.map((f) => f.moment))].join(', ')})`)

const drop = of('drop')
if (drop.length) {
  const s = stepsOf(drop)
  const w = drop[0].windows[0]
  const out = all(s, (i) => {
    const y = DROP.port[1] - rows[i][COL.scroll]
    return holdsBox(w, [DROP.port[0] - DROP.ring / 2, y - DROP.cup / 2, DROP.port[0] + DROP.ring / 2, y + DROP.ring / 2 + DROP.tube])
  })
  say(out.length === 0 && s[0] === m.leaves - DROP.before && s[s.length - 1] === m.leaves + DROP.after, `drop: steps ${span(s)} on ${drop.length} sheets, window ${JSON.stringify(w)}, ring, cup and ${DROP.tube} px of tube outside in ${out.length} frames, the view moves ${Math.round(rows[s[s.length - 1]][COL.scroll] - rows[s[0]][COL.scroll])} px`)
} else say(false, 'drop: no sheet')

const blow = of('flip-close')
if (blow.length) {
  const s = stepsOf(blow)
  const w = blow[0].windows[0]
  const out = all(s, (i) => holdsBox(w, [at(i)[0] - ball / 2 - BLOW.room, at(i)[1] - ball / 2 - BLOW.room, at(i)[0] + ball / 2 + BLOW.room, at(i)[1] + ball / 2 + BLOW.room]))
  say(out.length === 0 && s[0] === m.met - CLOSE.before && s[s.length - 1] === m.met + CLOSE.after, `close blow: steps ${span(s)} on ${blow.length} sheets, window ${JSON.stringify(w)}, the ball not whole in ${out.length} frames`)
} else say(false, 'close blow: no sheet')

const save = of('save')
if (save.length) {
  const s = stepsOf(save)
  const w = save[0].windows[0]
  const t = cfg.table
  const tier = Math.floor((rows[m.gate.kick][COL.heroY] / ball - (hd.height / ball + t.marqueeHeightBalls)) / t.tierHeightBalls)
  const top = (hd.height / ball + t.marqueeHeightBalls + t.tierHeightBalls * tier) * ball
  const wire = (i) => {
    const inMouth = Math.abs(rows[i][COL.heroX] / ball - MACHINE.mid) <= MACHINE.mouthHalf && rows[i][COL.heroY] >= top && rows[i][COL.heroY] < top + t.tierHeightBalls * ball
    return top + Math.max(GATE.hole * ball, inMouth ? rows[i][COL.heroY] - top + ball / 2 : 0) + GATE.wire - rows[i][COL.scroll]
  }
  const under = Math.min(...s.map((i) => w[1] + w[3] - wire(i)))
  const line = s.map((i) => top + GATE.hole * ball - rows[i][COL.scroll])
  const inside = line.every((y) => y >= w[1] && y <= w[1] + w[3])
  const views = [...new Set(s.map((i) => rows[i][COL.scroll]))]
  say((under >= GATE.under || w[1] + w[3] === hd.height) && inside && s[0] === m.gate.take - SAVE.before, `save: steps ${span(s)} on ${save.length} sheets, window ${JSON.stringify(w)}, ${under.toFixed(1)} px under the wire's lowest place at the least (wanted ${GATE.under}; the window's foot ${w[1] + w[3]} of ${hd.height}), the wire's line at rest inside in every frame ${inside} (y ${Math.min(...line).toFixed(1)} to ${Math.max(...line).toFixed(1)}), the view at ${views.length} places (${Math.min(...views)} to ${Math.max(...views)})`)
  console.log(`    ${save[0].heading.slice(save[0].heading.indexOf('The ball is low'))}`)
} else say(false, 'save: no sheet')

process.exit(bad ? 1 : 0)
