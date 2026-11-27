// node pipeline/phase5/pack-frames-check.mjs RUN.json: for one recorded visit (the pack's own out/work/packs/cache/<commit>/live-high/site-run.json, or a file of pack-whole-walk.mjs)
// lays the motion plan and says, from the rows alone, whether each close run holds what its heading says. One line a check, "ok" or "NOT", with the numbers. Ends with code 1 if a line says NOT.
import fs from 'node:fs'
import { config } from '../../tools/lib/paths.mjs'
import { wrap } from '../../tools/lib/pack-build.mjs'
import { BEND, BITE, BLOW, CLOSE, COL, DROP, FILM_RUNS, FILM_WORDS, GATE, INSERT_WORDS, KEYS, LAUNCH, MACHINE, MACHINE_PAGE, MOVES, PAGE_HAS, RUN, SAVE, SEAT, SHOT, SITE, TAKEN, VIEW, VIEW_WORDS, holdsBox, keyBlock, momentsOf, motionPlan, overInsert, shotOf, windowOf } from '../../tools/lib/pack-site.mjs'
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
const sets = packPlan(cfg, { role: 'R4', round: 26, unit: SITE, facts: run }).sets
say(sets.every((s) => s.files.length <= cfg.critics.maxFilesPerMessage), `sets: ${sets.map((s) => `${s.set} ${s.groups.join('+')} ${s.files.length}`).join(', ')}; ${plan.items.length} sheets`)
say(sets.every((s) => s.files.every((f) => s.files.filter((g) => g.moment === f.moment && g.run[0] === f.run[0]).flatMap((g) => g.steps).join() === f.run.join())), 'no run is cut by the end of a set')
const near = plan.items.filter((f) => f.px || f.film)
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
  const mail = run.gags.find((g) => g.gag === KEYS.field)
  const next = run.gags.find((g) => g.gag === KEYS.until)
  const slab = mail ? run.hits.find((h) => h.name === KEYS.slab && h.step >= mail.step) : null
  const named = run.gags.find((g) => g.gag === 'step1.lastName')
  const shuffles = named && mail ? s.filter((i) => i >= named.step && i < mail.step + KEYS.home).length : null
  say(m.type.field === 'email' && m.type.seated === (mail ? mail.step : null) && s[0] - mail.step >= KEYS.home && (!next || s[s.length - 1] < next.step) && (!slab || s[s.length - 1] < slab.step) && shuffles === 0,
    `key: field ${m.type.field}; the page goes on to the Email field at step ${mail ? mail.step : 'none'}, the frames begin ${mail ? s[0] - mail.step : 'no'} steps after it (keys home after ${KEYS.home}); they end ${slab ? slab.step - s[s.length - 1] : 'no'} steps before the first red slab (step ${slab ? slab.step : 'none'}) and ${next ? next.step - s[s.length - 1] : 'no'} before the resume (step ${next ? next.step : 'none'}); frames on the last name or in the keys' flight home: ${shuffles}. The rows hold no place of a key: that the pressed key is in its seat in every frame is read from the page's rule for the field, and seen by eye on the pictures`)
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

const nameOf = (f) => sets.flatMap((x) => x.files).find((g) => g.moment === f.moment && g.steps[0] === f.steps[0] && g.run[0] === f.run[0]).name
const names = (files) => files.map(nameOf).join(', ')

const shot = shotOf(cfg, run)
const hit = of('hit-close')
if (shot && hit.length) {
  const s = stepsOf(hit)
  const [gun, key] = hit[0].windows
  const out = all(s, (i) => holdsBox(key, [...at(i), ...at(i)]))
  const wide = stepsOf(of('hit'))
  say(s[0] === shot.cocks - SHOT.before && s.includes(shot.fires) && s[s.length - 1] === m.hit + SHOT.after && s.every((i, j) => !j || i === s[j - 1] + 1) && out.length === 0 && wide.includes(m.hit) && wide[0] <= s[0],
    `shot: the ${shot.side} turret at ${shot.turret.x}, ${shot.turret.y}; cocks at step ${shot.cocks}, fires at ${shot.fires}, hit at ${m.hit}; close steps ${span(s)}, every step, on ${hit.length} sheets (${names(hit)}); windows ${JSON.stringify([gun, key])}; the arrow's tip outside the key's window in ${out.length} frames; the 1/30 run ${span(wide)} holds the hit`)
} else say(false, 'shot: no close sheet')

const bite = of('bite')
if (bite.length) {
  const s = stepsOf(bite)
  const w = bite[0].windows[0]
  const out = all(s, (i) => holdsBox(w, [at(i)[0] - BITE.room, at(i)[1] - BITE.room, at(i)[0] + BITE.room, at(i)[1] + BITE.room]))
  const fixed = holdsBox(w, [TAKEN.slot[0] - TAKEN.paper[0], TAKEN.slot[1] - TAKEN.paper[1], TAKEN.slot[0] + TAKEN.paper[0], TAKEN.slot[1] + TAKEN.holder])
  say(s[0] === m.taken - BITE.before && s[s.length - 1] === m.taken + BITE.after && out.length === 0 && fixed, `take, close: steps ${span(s)} on ${bite.length} sheets (${names(bite)}), window ${JSON.stringify(w)}, the arrow with ${BITE.room} px round it outside in ${out.length} frames, paper and holder inside ${fixed}`)
} else say(false, 'take, close: no sheet')

BEND.places.forEach((c, n) => {
  const files = of(`bend-${n + 1}`)
  if (!files.length) return say(false, `bend ${n + 1}: no sheet`)
  const s = stepsOf(files)
  const wins = files.flatMap((f) => f.windowsAt.map((w) => w[0]))
  const far = (i) => Math.hypot(rows[i][COL.heroX] - c[0], rows[i][COL.heroY] - c[1])
  const nearest = s.reduce((a, i) => (far(i) < far(a) ? i : a), s[0])
  const room = Math.min(...s.map((i, j) => { const y = c[1] - rows[i][COL.scroll]; const w = wins[j]; return Math.min(c[0] - w[0], y - w[1], w[1] + w[3] - y) }))
  const right = Math.min(...wins.map((w) => w[0] + w[2] - c[0]))
  const whole = s.filter((i, j) => holdsBox(wins[j], [at(i)[0] - ball / 2, at(i)[1] - ball / 2, at(i)[0] + ball / 2, at(i)[1] + ball / 2]))
  const stands = [...new Set(s.map((i, j) => Math.round(c[1] - rows[i][COL.scroll] - wins[j][1])))]
  const foot = s.every((i, j) => { const y = c[1] - rows[i][COL.scroll]; const w = wins[j]; return w[1] + w[3] - y >= BEND.round || w[1] + w[3] === hd.height })
  say(nearest === s[0] + BEND.before && s.length === BEND.before + BEND.after + 1 && (room >= BEND.round || foot), `bend ${n + 1} at ${c.join(', ')} of the page: the ball nearest at step ${nearest} (${far(nearest).toFixed(1)} px), steps ${span(s)} on ${files.length} sheets (${names(files)}); the least room round the bend left, above and below ${Math.round(room)} px (named ${BEND.round}), to the window's right edge ${Math.round(right)} px (the page ends at ${hd.width}); where the room below is under ${BEND.round} px the window's foot is the screen's foot ${foot}; the bend stands ${stands.join(', ')} px down the window; the ball whole in the window in ${whole.length} of ${s.length} frames`)
})

const launch = of('launch')
if (launch.length) {
  const s = stepsOf(launch)
  const goes = s[0] + LAUNCH.before
  let rest = 0
  while (goes - 1 - rest > 0 && rows[goes - 1 - rest][COL.heroX] === rows[goes - 1][COL.heroX] && rows[goes - 1 - rest][COL.heroY] === rows[goes - 1][COL.heroY]) rest += 1
  const moves = rows[goes][COL.heroX] !== rows[goes - 1][COL.heroX] || rows[goes][COL.heroY] !== rows[goes - 1][COL.heroY]
  say(moves && rest >= LAUNCH.still && s.every((i, j) => !j || i === s[j - 1] + 1), `launch: the ball rests ${rest} steps at ${rows[goes - 1][COL.heroX]}, ${rows[goes - 1][COL.heroY]} of the page and first moves at step ${goes}; steps ${span(s)}, every step, on ${launch.length} sheets (${names(launch)})`)
} else say(false, 'launch: no sheet')

for (const what of ['view-down', 'view-up']) {
  const files = of(what)
  if (!files.length) { say(false, `${what}: no sheet`); continue }
  const s = stepsOf(files)
  const under = marks(files).map((x) => Number(x[x.length - 1]))
  const same = s.every((i, j) => under[j] === rows[i][COL.scroll])
  const moving = s.filter((i) => rows[i][COL.scroll] !== rows[i - 1][COL.scroll])
  say(same && moving[0] === s[0] + VIEW.lead && moving[moving.length - 1] < s[s.length - 1] && s.every((i, j) => !j || i === s[j - 1] + 1), `${what}: steps ${span(s)}, every step, on ${files.length} sheets (${names(files)}); the view moves in steps ${span(moving)}, from ${rows[moving[0] - 1][COL.scroll]} to ${rows[moving[moving.length - 1]][COL.scroll]} px; the number under each frame is the row's ${same}; take ${m.gate.take}, kick ${m.gate.kick}`)
}

const numbered = plan.items.filter((f) => /\btiers?\s*\d/i.test(f.heading))
say(numbered.length === 0, `tiers by name: ${numbered.length} headings say "tier" with a number`)
const through = (f) => { const o = []; for (let i = f.steps[0]; i <= f.steps[f.steps.length - 1]; i++) o.push(i); return o }
const live = plan.items.filter((f) => !f.film)
const viewGoes = live.filter((f) => through(f).some((i) => i > f.steps[0] && rows[i][COL.page] === MACHINE_PAGE && rows[i][COL.scroll] !== rows[i - 1][COL.scroll]))
const viewSaid = live.filter((f) => f.heading.includes(VIEW_WORDS))
say(viewGoes.length > 0 && viewGoes.every((f) => viewSaid.includes(f)) && viewSaid.every((f) => viewGoes.includes(f)), `the kit's words on the view (kit/03 line 397): on ${viewSaid.length} sheets, the view moves on step 3 in ${viewGoes.length} sheets: ${names(viewSaid)}`)
const rolls = live.filter((f) => through(f).some((i) => rows[i][COL.page] === MACHINE_PAGE && overInsert(cfg, rows[i])))
const rollSaid = live.filter((f) => f.heading.includes(INSERT_WORDS))
say(rolls.every((f) => rollSaid.includes(f)) && rollSaid.every((f) => rolls.includes(f)), `the kit's words on the inserts (kit/02 line 320, kit/03 line 300): on ${rollSaid.length} sheets, the ball lies over an insert in ${rolls.length} sheets: ${names(rollSaid)}`)
const films = plan.items.filter((f) => f.film)
say(films.length > 0 && films.every((f) => f.heading.includes(FILM_WORDS(cfg)) && f.heading.startsWith('Consecutive frames of the film')), `film: ${films.length} sheets (${names(films)}), each says it is the film and how it was drawn; frames ${Object.entries(FILM_RUNS).map(([k, v]) => `${k} ${v.frames.join(' to ')}`).join(', ')}`)

// Every sheet whose subject is the ball: is the ball whole in the window in every frame, and where it is not, is it whole on the visitor's screen.
console.log('the ball in its sheets (for the report only):')
const k = cfg.formats[run.format || RUN.format].width / hd.width
for (const f of live.filter((x) => ['flippers', 'drop', 'bend-1', 'bend-2', 'launch', 'view-down', 'view-up', 'save', 'flip', 'flip-close'].includes(x.moment))) {
  const winAt = (j) => (f.windowsAt ? f.windowsAt[j][0] : f.px ? f.windows[0] : f.kind === 'site-run-sheet' ? [0, 0, hd.width, hd.height] : windowOf(cfg, run, f.moment, f.run).window.map((v) => v / k))
  const box = (i) => [at(i)[0] - ball / 2, at(i)[1] - ball / 2, at(i)[0] + ball / 2, at(i)[1] + ball / 2]
  const sealed = f.steps.map((i, j) => [i, j]).filter(([i]) => i >= m.flippers)
  const outs = sealed.filter(([i, j]) => !holdsBox(winAt(j), box(i)))
  const onScreen = outs.filter(([i]) => holdsBox([0, 0, hd.width, hd.height], box(i)))
  say(onScreen.length === 0, `${nameOf(f)} ${f.moment}: the ball whole in the window in ${sealed.length - outs.length} of ${sealed.length} frames${outs.length ? `; not whole in the window at steps ${outs.map(([i]) => i).join(', ')}; of these the ball is whole on the visitor's screen at ${onScreen.length ? onScreen.map(([i]) => i).join(', ') : 'none'}` : ''}`)
}

process.exit(bad ? 1 : 0)
