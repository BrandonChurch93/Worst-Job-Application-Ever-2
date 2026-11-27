// The packs of the unit `site`: what the R2 jury, R4, R5 and R8 receive for the whole site, after kit/07-QUALITY-BAR.md.
// The six pages at rest are drawn through the site's own path at the level `high`. One fixed visitor walks the stepped site
// with real pointer, wheel and key events; what it did is kept, and the same inputs are played again to draw the pictures a sheet needs.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at, readJson } from './paths.mjs'
import { drawStill, openSession, stillFrom } from './capture.mjs'
import { controlBoxes, controlWindows, cut, grid, single, windowRound } from './pack-build.mjs'
import { hitTileHeight } from './pack-look.mjs'

const GAP = 8
export const SITE = 'site'
// The level the kit names for the judged stills of `site` (kit/07, "Judged stills and frames", item 4).
export const LEVEL = 'high'
// What the cache and the stamp of a site pack call it, where a page's pack has its tier.
export const SITE_TIER = `live-${LEVEL}`
// The run is drawn in formats.preview: a picture of the run costs about half of one in formats.hd on a software renderer,
// and a sheet's tile is narrower than either. The six stills and the screens are in formats.hd.
export const RUN = { format: 'preview', assets: 'web', query: `&clock=steps&quality=${LEVEL}` }

// One visitor, the same on every build: it goes where the page wants the pointer (`told().hint`), a reaction time late,
// at a hand's speed, presses when it is there, types, scrolls when the place is off the screen and plays the flippers with the Shift keys.
// It takes hits: the first time a page tells it to step aside it does not. It stands where it is, hands off, for `standSteps`, and obeys from then on.
export const VISITOR = { hz: 60, speed: 1500, reactSteps: 11, typeEvery: 8, wheelEvery: 10, wheel: 120, jitter: 6, near: 22, top: 90, bottom: 990, edge: 10, seed: 12345, start: [960, 540], standSteps: 120, mostSeconds: 400 }
// Where the turrets fire: from the gag `from` of the page `page` until the gag `until`, the visitor walks to the key nearest the middle of the key block,
// far from both turrets, and stands still there, hands off, until the site tells of one hit named `hit` far from both muzzles. `mostSteps` ends the wait if no such bolt ever lands.
// With no key block given it stands where it is and any hit of that name ends the wait.
export const STANDS = { page: 'step1', from: 'step1.firstName', until: 'step1.lastName', hit: 'bolt-hit-cursor', mostSteps: 900 }
// The key block of step 1 and its two turrets, as the page's own files set them (src/pages/step1/keyboard.ts and turrets.ts): the top of the deck,
// the width of each end where a turret stands, the gap above the keys, what the deck is taller than its keys by and the length of a barrel.
// `share` is the part of the key block's width a hit must be from the nearer muzzle for its bolt to be seen in flight. A stepped test holds these against the page.
export const BLOCK = { deckY: 728, end: 200, above: 8, deckMore: 16, barrel: 84, share: 1 / 3, data: 'src/pages/step1/keyboard.json' }
export function keyBlock(cfg) {
  const g = cfg.scale.grid
  const key = cfg.scale.sizes.keycapMin
  const data = readJson(at(BLOCK.data))
  const x = g.contentLeft + BLOCK.end
  const y = BLOCK.deckY + BLOCK.above
  const w = g.contentRight - g.contentLeft - BLOCK.end * 2
  const h = data.rows.length * key + (data.rows.length - 1) * g.keyGap
  const pitch = (w + g.keyGap) / data.unitsWide
  const seats = []
  data.rows.forEach((row, r) => {
    let n = 0
    for (const c of row) {
      seats.push({ key: c.name, x: x + n * pitch + (c.width * pitch - g.keyGap) / 2, y: y + r * (key + g.keyGap) + key / 2 })
      n += c.width
    }
  })
  const mid = { x: x + w / 2, y: y + h / 2 }
  const far = (s) => Math.hypot(s.x - mid.x, s.y - mid.y)
  const place = seats.reduce((a, b) => (far(b) < far(a) ? b : a))
  const cy = BLOCK.deckY + (h + BLOCK.deckMore) / 2
  return { x, y, w, h, place, least: w * BLOCK.share, turrets: [{ x: g.contentLeft + BLOCK.end / 2, y: cy }, { x: g.contentRight - BLOCK.end / 2, y: cy }] }
}
// How far a place is from the nearer muzzle: a barrel points at what it fires on.
export const fromMuzzle = (block, p) => Math.min(...block.turrets.map((c) => Math.max(0, Math.hypot(p.x - c.x, p.y - c.y) - BLOCK.barrel)))
const bolts = (hits) => hits.filter((h) => h.name === STANDS.hit && h.page === STANDS.page)
// The hit a sheet is made of: the first bolt that struck the arrow `least` or more from either muzzle, or the first bolt if none did.
export function hitTaken(block, hits) {
  const all = bolts(hits)
  const far = all.find((h) => fromMuzzle(block, h) >= block.least)
  const h = far || all[0] || null
  return h ? { step: h.step, nth: all.indexOf(h) + 1, x: h.x, y: h.y, fromMuzzle: Math.round(fromMuzzle(block, h)), least: Math.round(block.least), far: Boolean(far) } : null
}
// Given back: the arrow lay dead for at least `still` steps, and now moves again.
export const BACK = { still: 30, dead: 0.2, moves: 0.5 }
// The gag at which a page takes the arrow from the visitor, as `told().gags` names it: the tug of war of step 1.
export const TAKES = 'step1.tug'
// The stroke after the arrow is given back: once the page has taken the arrow, the arrow has lain dead for BACK.still steps and the place the page
// wants the pointer jumps by `least` px or more, the visitor was waiting for it and goes there `reactSteps` late, not VISITOR.reactSteps. Once a visit.
export const STROKE = { least: 200, reactSteps: 2 }
// The flippers: a player at a machine watches the ball come to the bat and is ready for it, so the visitor presses a flipper `reactSteps` after the page first wants it,
// not VISITOR.reactSteps, and keeps it down for `holdSteps` at least, the time a bat needs for its whole stroke (8 steps, `LIVE.up` in src/table/physics.ts) and a little more.
export const FLIPS = { reactSteps: 2, holdSteps: 10 }

// The visitor's mind: from what the site tells at a step to the events of that step. No clock and no chance but its own seeded numbers.
/** @param {number} k @param {typeof VISITOR} [o] @param {ReturnType<typeof keyBlock> | null} [block] */
export function makeVisitor(k, o = VISITOR, block = null) {
  let seed = o.seed
  const rand = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff
    return seed / 0x7fffffff - 0.5
  }
  const queue = []
  const flips = []
  const since = { left: 0, right: 0 }
  const held = { down: false, left: false, right: false }
  let pos = { x: o.start[0] * k, y: o.start[1] * k }
  let step = 0
  let lastKey = -999
  let lastWheel = -999
  let stand = -1
  let waited = 0
  let hero = null
  let dead = 0
  let aimed = null
  let stroked = false
  const release = (acts) => {
    if (held.down) acts.push({ up: 'left' })
    if (held.left) acts.push({ keyUp: 'ShiftLeft' })
    if (held.right) acts.push({ keyUp: 'ShiftRight' })
    held.down = held.left = held.right = false
  }
  return {
    pointer: () => ({ x: pos.x / k, y: pos.y / k }),
    held: () => ({ ...held }),
    waited: () => waited,
    end() {
      const acts = []
      release(acts)
      return acts
    },
    act(t) {
      const acts = []
      const h = t.hint
      let target = null
      if (!t.turning && h) {
        const aim = h.dodge ?? h
        target = { x: aim.x + rand() * o.jitter, y: aim.y - t.scroll + rand() * o.jitter, down: h.down === true, key: h.key, left: h.flipLeft === true, right: h.flipRight === true, hx: h.x, hy: h.y - t.scroll }
      }
      if (h && h.dodge && stand < 0) stand = o.standSteps
      const gags = t.gags || []
      const fired = t.page === STANDS.page && gags.includes(STANDS.from) && !gags.includes(STANDS.until) && !t.turning
      const struck = bolts(t.hits || []).some((x) => !block || fromMuzzle(block, x) >= block.least)
      const waits = fired && !struck && waited < STANDS.mostSteps
      if (waits) waited += 1
      if (t.hero) {
        dead = hero && Math.hypot(t.hero.x - hero.x, t.hero.y - hero.y) <= BACK.dead ? dead + 1 : 0
        hero = { x: t.hero.x, y: t.hero.y }
      }
      if (waits) {
        if (stand > 0) stand -= 1
        const to = block ? { x: block.place.x, y: block.place.y - t.scroll } : null
        const there = !to || Math.hypot(to.x - pos.x / k, to.y - pos.y / k) < 0.5
        queue.push(there ? { stand: true } : { x: to.x, y: to.y, down: false, left: false, right: false, hx: to.x, hy: to.y })
      } else if (stand > 0) {
        stand -= 1
        queue.push({ stand: true })
      } else queue.push(target)
      if (target && aimed && !stroked && !waits && gags.includes(TAKES) && dead >= BACK.still && Math.hypot(h.x - aimed.x, h.y - aimed.y) >= STROKE.least) {
        for (let j = STROKE.reactSteps; j < queue.length; j++) queue[j] = target
        stroked = true
      }
      aimed = h && !t.turning ? { x: h.x, y: h.y } : aimed
      const seen = queue.length > o.reactSteps ? queue.shift() : null
      flips.push(target ? { left: target.left, right: target.right } : null)
      const flip = flips.length > FLIPS.reactSteps ? flips.shift() : null
      if (seen && seen.stand) {
        if (held.down) acts.push({ up: 'left' })
        held.down = false
      } else if (seen) {
        if ((seen.y < o.top || seen.y > o.bottom) && step - lastWheel >= o.wheelEvery) {
          acts.push({ wheel: seen.y < o.top ? -o.wheel : o.wheel })
          lastWheel = step
        }
        const tx = seen.x * k
        const ty = Math.min(1080 - o.edge, Math.max(o.edge, seen.y)) * k
        const d = Math.hypot(tx - pos.x, ty - pos.y)
        const most = (o.speed * k) / o.hz
        if (d > 0.01) {
          pos = d <= most ? { x: tx, y: ty } : { x: pos.x + ((tx - pos.x) / d) * most, y: pos.y + ((ty - pos.y) / d) * most }
          acts.push({ move: [pos.x, pos.y] })
        }
        const near = Math.hypot(seen.hx - pos.x / k, seen.hy - pos.y / k) <= o.near
        const want = seen.down && (near || held.down)
        if (want && !held.down) {
          acts.push({ down: 'left' })
          held.down = true
        } else if (!want && held.down) {
          acts.push({ up: 'left' })
          held.down = false
        }
        if (seen.key !== undefined && near && step - lastKey >= o.typeEvery) {
          acts.push({ press: seen.key === ' ' ? 'Space' : seen.key })
          lastKey = step
        }
      } else if (t.turning) release(acts)
      if (flip && !(seen && seen.stand) && !t.turning) {
        for (const [side, code] of [['left', 'ShiftLeft'], ['right', 'ShiftRight']]) {
          since[side] = held[side] ? since[side] + 1 : 0
          const want = flip[side] || (held[side] && since[side] < FLIPS.holdSteps)
          if (want === held[side]) continue
          acts.push(want ? { keyDown: code } : { keyUp: code })
          held[side] = want
          since[side] = 0
        }
      }
      step += 1
      return acts
    }
  }
}

// One event of the visitor, given to the browser as a real pointer, wheel or key event.
async function send(page, act) {
  if (act.move) await page.mouse.move(act.move[0], act.move[1])
  else if (act.down) await page.mouse.down({ button: act.down })
  else if (act.up) await page.mouse.up({ button: act.up })
  else if (act.wheel) await page.mouse.wheel(0, act.wheel)
  else if (act.press) await page.keyboard.press(act.press)
  else if (act.keyDown) await page.keyboard.down(act.keyDown)
  else if (act.keyUp) await page.keyboard.up(act.keyUp)
}

const openRun = async (cfg) => {
  const f = cfg.formats[RUN.format]
  const session = await openSession({ format: f.id, assets: RUN.assets, mode: 'live', query: RUN.query })
  await session.page.waitForFunction(() => Boolean(window.liveRun), null, { timeout: 120000 })
  return session
}
const tell = (page, dt) =>
  page.evaluate((d) => {
    if (d > 0) window.liveRun.advance(d, true)
    const t = window.liveRun.told()
    return { time: t.time, pageTime: t.pageTime, page: t.page, gags: t.gags, finished: t.finished, turning: t.turning, skipOffered: t.skipOffered, scroll: t.scroll, hint: t.hint, hero: t.hero, hits: t.hits, control: t.control }
  }, dt)
const r1 = (n) => Math.round(n * 10) / 10

// What the run file keeps of a step: enough to find its moments and to know a second run is the same run.
const rowOf = (t, v) => {
  const p = v.pointer()
  const h = v.held()
  return [Math.round(t.time * 1000) / 1000, t.page, t.turning ? 1 : 0, r1(t.hero.x), r1(t.hero.y), r1(t.scroll), r1(p.x), r1(p.y), t.hint ? 1 : 0, t.hint && (t.hint.flipLeft !== undefined || t.hint.flipRight !== undefined) ? 1 : 0, h.down ? 1 : 0, h.left ? 1 : 0, h.right ? 1 : 0, t.control === 'flippers' ? 1 : 0]
}
export const COL = { time: 0, page: 1, turning: 2, heroX: 3, heroY: 4, scroll: 5, pointerX: 6, pointerY: 7, hint: 8, flippers: 9, down: 10, left: 11, right: 12, control: 13 }

// Walks the site once. Row i is the site before the visitor's events of step i; picture i is drawn of that state.
export async function walk(cfg, log = () => {}) {
  const f = cfg.formats[RUN.format]
  const k = f.width / cfg.formats.hd.width
  const session = await openRun(cfg)
  const rows = []
  const acts = {}
  const gags = []
  const hits = []
  try {
    const block = keyBlock(cfg)
    const v = makeVisitor(k, VISITOR, block)
    const most = VISITOR.mostSeconds * VISITOR.hz
    let t = await tell(session.page, 0)
    const known = new Set()
    for (let i = 0; i <= most; i++) {
      for (const g of t.gags) if (!known.has(g)) {
        known.add(g)
        gags.push({ gag: g, step: i })
      }
      for (const h of t.hits.slice(hits.length)) hits.push({ name: h.name, step: i, page: h.page, x: r1(h.x), y: r1(h.y) })
      if (t.finished || i === most) {
        rows.push(rowOf(t, v))
        const last = v.end()
        if (last.length) acts[i] = last
        for (const a of last) await send(session.page, a)
        break
      }
      const list = v.act(t)
      rows.push(rowOf(t, v))
      if (list.length) acts[i] = list
      for (const a of list) await send(session.page, a)
      t = await tell(session.page, 1 / VISITOR.hz)
      if (i % 1200 === 1199) log(`the visitor is at ${t.time.toFixed(0)} s, on ${t.page}`)
    }
    const finished = t.finished
    const taken = hitTaken(block, hits)
    const stood = { steps: v.waited(), mostSteps: STANDS.mostSteps, at: { key: block.place.key, x: r1(block.place.x), y: r1(block.place.y) }, boltHits: bolts(hits).length, hit: taken, capReached: v.waited() >= STANDS.mostSteps && !(taken && taken.far) }
    return { format: f.id, level: LEVEL, assets: RUN.assets, visitor: VISITOR, finished, steps: rows.length, seconds: Math.round((rows.length / VISITOR.hz) * 100) / 100, stood, gags, hits, acts, rows, browser: session.version, problems: [...new Set(session.problems)].slice(0, 12) }
  } finally {
    await session.close()
  }
}

const runFile = (cache) => path.join(cache, 'site-run.json')

// The run of this commit: read from the cache, or walked once and kept there.
export async function siteFacts(cfg, cache = null, log = () => {}) {
  const file = cache ? runFile(cache) : null
  let run = file && fs.existsSync(file) ? readJson(file) : null
  if (!run) {
    run = await walk(cfg, log)
    if (file) {
      fs.mkdirSync(cache, { recursive: true })
      fs.writeFileSync(file, JSON.stringify(run) + '\n')
    }
  }
  if (run.stood) {
    const st = run.stood
    const where = st.at ? ` at the key ${st.at.key}` : ''
    const which = st.hit ? `the sheet of the hit is of bolt ${st.hit.nth} of ${st.boltHits}, at step ${st.hit.step}, ${st.hit.fromMuzzle} px from the nearer muzzle (${st.hit.least} px is wanted)` : 'no bolt hit the arrow: the sheet of the hit shows another blow'
    log(`the visitor waited on ${STANDS.page}${where} for ${st.steps} steps${st.capReached ? ', the most it waits, with no hit far from both muzzles' : ''}; ${which}`)
  }
  return momentsOf(cfg, run)
}

// Draws the pictures of the steps asked for by giving the browser the run's own events again. Every step is held against the run file:
// a step that differs stops the build, so a sheet never shows a second, different visit.
// The live path seeds the grain of a picture with the count of the pictures it has drawn (src/main.ts, `frame++` in `draw`), so a
// picture's bytes follow from its step AND from how many were drawn before it. `plan` is every step of the whole pack: a picture is
// always drawn as the same one of that list, whatever a slice asks for and whatever the cache holds, and it is kept under both numbers.
export function drawOrder(plan, steps, have = (_step, _nth) => false) {
  const wanted = [...new Set(steps)].sort((a, b) => a - b)
  const all = [...new Set([...plan, ...steps])].sort((a, b) => a - b)
  const nth = new Map(all.map((s, n) => [s, n]))
  const missing = wanted.filter((i) => !have(i, nth.get(i)))
  return { wanted, nth, draw: missing.length ? all.filter((i) => i <= missing[missing.length - 1]) : [] }
}

export async function replay(cfg, run, steps, { plan = steps, cache = null, log = () => {} } = {}) {
  const nameOf = (i, n) => path.join(cache || '', `site-run-${run.format}-${String(i).padStart(6, '0')}-${String(n).padStart(4, '0')}.png`)
  const { wanted, nth, draw } = drawOrder(plan, steps, (i, n) => Boolean(cache) && fs.existsSync(nameOf(i, n)))
  const fileOf = (i) => (cache ? nameOf(i, nth.get(i)) : null)
  const got = new Map()
  for (const i of wanted) if (fileOf(i) && fs.existsSync(fileOf(i))) got.set(i, fs.readFileSync(fileOf(i)))
  if (!draw.length) return got
  if (cache) fs.mkdirSync(cache, { recursive: true })
  const session = await openRun(cfg)
  try {
    const last = draw[draw.length - 1]
    const want = new Set(draw)
    let drawn = 0
    let t = await tell(session.page, 0)
    for (let i = 0; i <= last; i++) {
      const row = run.rows[i]
      if (Math.abs(t.time - row[COL.time]) > 0.0006 || t.page !== row[COL.page] || r1(t.hero.x) !== row[COL.heroX] || r1(t.hero.y) !== row[COL.heroY] || r1(t.scroll) !== row[COL.scroll]) {
        throw new Error(`pack: the second visit differs from the first at step ${i}: ${t.page} at ${t.time.toFixed(3)} s, the arrow at ${r1(t.hero.x)}, ${r1(t.hero.y)}; the run file has ${row[COL.page]} at ${row[COL.time]} s, ${row[COL.heroX]}, ${row[COL.heroY]}`)
      }
      if (want.has(i)) {
        const shot = await session.page.evaluate(() => window.liveRun.state().png)
        const png = Buffer.from(shot.split(',')[1], 'base64')
        if (wanted.includes(i)) got.set(i, png)
        if (cache) fs.writeFileSync(fileOf(i), png)
        if (++drawn % 12 === 0) log(`pictures of the run: ${drawn} of ${want.size}`)
      }
      if (i === last) break
      for (const a of run.acts[i] || []) await send(session.page, a)
      t = await tell(session.page, 1 / VISITOR.hz)
    }
  } finally {
    await session.close()
  }
  return got
}

export const shaOf = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')

// The time of a step as minutes, seconds and hundredths, so two neighbours of a sheet never read the same.
const timeOf = (step) => {
  const total = Math.round((step / VISITOR.hz) * 100)
  return `${Math.floor(total / 6000)}:${String(Math.floor((total % 6000) / 100)).padStart(2, '0')}.${String(total % 100).padStart(2, '0')}`
}
const span = (steps) => `${timeOf(steps[0])} to ${timeOf(steps[steps.length - 1])}`

// `count` steps spread evenly from first to last, both ends in.
export function spreadSteps(first, last, count) {
  const n = last - first + 1
  if (n <= count) return Array.from({ length: n }, (_, i) => first + i)
  return Array.from({ length: count }, (_, i) => first + Math.round((i * (n - 1)) / (count - 1)))
}

// `count` steps in a row, `every` apart, round one step, kept inside a range. One part in `part` of them comes before it.
export function aroundStep(at, count, every, first, last, part = 2) {
  const before = Math.floor((count - 1) / part)
  const start = Math.max(first, Math.min(at - before * every, last - (count - 1) * every))
  return Array.from({ length: count }, (_, i) => start + i * every).filter((i) => i >= first && i <= last)
}

// The hits on the arrow that the site tells of by name, the one to show first.
const HITS = ['bolt-hit-cursor', 'tug-lost']
// A walk: the arrow moves at least this far in a step, and the stretch is at least this long.
const WALK = { least: 6, steps: 24 }
// A moment's run starts this many pictures before the moment itself.
const LEAD = 3
// Out of the port: the ball's middle is this far, in px of the page, from where the arrow was sealed, and the run holds this many steps more.
const PORT = { clear: 150, tail: 6, most: 600 }
// The flipper meets the ball: within `within` steps of a press of a flipper the arrow's speed changes by `kick` px of the page a step or more, the ball then `lifts` px a step or more up the table.
// A bat's own blow comes while the bat rises, `soon` steps after the press at most, and is hard: the first press counts whose change of speed is `share` of the hardest
// such change in the visit or more. So a ball the table throws back by itself just after a press that met nothing (the save's lob from the gate's mouth) is not taken for the bat's blow.
export const MEETS = { within: 24, kick: 4, lifts: 3, soon: 4, share: 0.6 }
// The machine saves a ball lost between the bats. Read from the ball's path, a save is a jump: going down, within `across` ball widths of the middle, it stands `lifts` px a step up,
// and its speed a step later differs from that jump by `breaks` px or more; or a ball that lay `low` in the mouth (in widths of the ball inside its tier) goes up again by `rises` a step. In both the ball was `low` the step before and is out of the mouth `clears` steps later.
// The page's own words for it are `names` (the kick) and `take` (the ball lands on the gate). Two kicks within `same` steps are one save; a take is sought `most` steps back at most.
// The save's run starts `before` pictures before the take and ends `after` pictures after the kick, on `sheets` sheets at most.
export const SAVE = { names: ['ball-save', 'flipper-save'], take: 'gate-take', lifts: 30, breaks: 12, across: 1, low: 10.3, rises: 0.15, clears: 3, same: 3, most: 90, before: 4, after: 4, sheets: 2 }
// What struck the arrow, in plain words, by the name the site tells the hit under.
export const STRUCK = { 'bolt-hit-cursor': "a turret's bolt", 'tug-lost': 'the lost tug of war' }
export const struckWords = (name) => STRUCK[name] || `what the page calls "${String(name).replace(/-/g, ' ')}"`
// The sheets of these moments carry the visitor's hand under their frames.
export const HANDS = ['flippers', 'flip', 'save']
export const HAND_WORDS = 'Under a frame, L or R: the visitor held the left or the right flipper at that frame or since the one before it.'
// Round a run's path in a close sheet: this much of the picture stays clear on every side of the arrow's places, in px of the picture.
const ROOM = 56
// Pictures of a moment are this many steps apart: 30 a second, as a page's sheets of consecutive frames are.
const EVERY = 2

// The machine as the page lays it out (src/table/layout.ts), in widths of the ball inside a tier: the middle, a bat's pivot, its radius at the pivot and at the tip,
// its angle at rest and raised in degrees, half the mouth between the bats, the height at which the gate at the mouth holds a ball, the height of the gate's pin,
// and how far along a bat the page starts to want a press. The bat's length is table.flipperBalls. A stepped test holds these against the page's own file.
export const MACHINE = { mid: 10, pivotU: 6.53, pivotV: 8.95, radius: 0.4, tip: 0.26, rest: 25, up: -25, mouthHalf: 1.7, gateV: 10.55, pinV: 11.1, pin: 0.15, wantFrom: 1.2 }
// Where the tiers lie on the page of the machine, in widths of the ball: a screen, then the marquee, then the tiers one under the other.
export function tiersOf(cfg) {
  const t = cfg.table
  const top = cfg.formats.hd.height / t.ballPx + t.marqueeHeightBalls
  return { ball: t.ballPx, tall: t.tierHeightBalls, count: t.tiers.length, top, y: (k) => top + t.tierHeightBalls * k, of: (y) => Math.max(0, Math.min(t.tiers.length - 1, Math.floor((y - top) / t.tierHeightBalls))) }
}
// The ball of a row inside its tier, in widths of the ball: the arrow is sealed in it, so the arrow's place is the ball's.
export function ballAt(cfg, row) {
  const g = tiersOf(cfg)
  const y = row[COL.heroY] / g.ball
  const tier = g.of(y)
  return { u: row[COL.heroX] / g.ball, v: y - g.y(tier), tier }
}
// Where the ball is over a bat at rest, as the machine itself reads it (`over` in src/table/physics.ts): how far along the bat from its pivot and how far above its middle line.
export function overBat(cfg, row, side) {
  const b = ballAt(cfg, row)
  const dir = side === 'left' ? 1 : -1
  const rx = b.u - (side === 'left' ? MACHINE.pivotU : cfg.table.tierWidthBalls - MACHINE.pivotU)
  const ry = b.v - MACHINE.pivotV
  const c = Math.cos((MACHINE.rest * Math.PI) / 180)
  const s = Math.sin((MACHINE.rest * Math.PI) / 180)
  return { along: rx * c * dir + ry * s, above: rx * s * dir - ry * c, tier: b.tier }
}
// A bat's reach, as the machine arms a stroke (`armed` in src/table/physics.ts): the ball is over the bat from `from` along it to its tip and `past` more, and no higher above it than the two radii and `high`.
export const REACH = { from: 0.2, past: 0.15, high: 0.2, ballR: 0.5 }
// How far, in widths of the ball, a ball over a bat is from that reach: 0 inside it.
export function reachGap(cfg, o) {
  const far = cfg.table.flipperBalls - MACHINE.tip + REACH.past
  const high = MACHINE.radius + REACH.ballR + REACH.high
  return Math.hypot(Math.max(0, REACH.from - o.along, o.along - far), Math.max(0, -o.above, o.above - high))
}

// The camera's travels from one tier of the machine to the next below: unbroken stretches in which the page's scroll moves by FALLS.moves px a step or more,
// from within FALLS.near of a tier's top to within FALLS.near of the next tier's top (in tiers' heights).
export const FALLS = { moves: 1, near: 0.2 }
export function fallsOf(cfg, rows, part) {
  if (!part) return []
  const g = tiersOf(cfg)
  const tops = Array.from({ length: g.count }, (_, k) => g.y(k) * g.ball)
  const near = (y, k) => Math.abs(y - tops[k]) <= FALLS.near * g.tall * g.ball
  const out = []
  let from = -1
  for (let i = part.first + 1; i <= part.last + 1; i++) {
    const going = i <= part.last && Math.abs(rows[i][COL.scroll] - rows[i - 1][COL.scroll]) >= FALLS.moves
    if (going && from < 0) from = i
    if (!going && from >= 0) {
      const a = rows[from - 1][COL.scroll]
      const b = rows[i - 1][COL.scroll]
      for (let k = 0; k + 1 < g.count; k++) if (near(a, k) && near(b, k + 1)) out.push({ first: from, last: i - 1, tier: k, from: Math.round(a), to: Math.round(b) })
      from = -1
    }
  }
  return out
}

// The moments of the run that the sheets show, found from the run itself.
export function momentsOf(cfg, run) {
  const rows = run.rows
  const n = rows.length
  const pages = []
  for (let i = 0; i < n; i++) {
    const p = rows[i][COL.page]
    const here = pages[pages.length - 1]
    if (here && here.page === p) here.last = i
    else pages.push({ page: p, first: i, last: i })
  }
  const turns = []
  for (let i = 0; i < n; i++) {
    if (!rows[i][COL.turning]) continue
    const here = turns[turns.length - 1]
    if (here && here.last === i - 1) here.last = i
    else turns.push({ first: i, last: i })
  }
  // The site calls its pages by their place in the flow; the config calls them by their unit. The run meets them in the config's order.
  const units = unitsOf(cfg)
  const met = [...new Set(pages.map((p) => p.page))]
  for (const p of pages) p.unit = units[met.indexOf(p.page)] ?? null
  const of = (unit) => pages.find((p) => p.unit === unit) || null
  const gap = (i) => Math.hypot(rows[i][COL.heroX] - rows[i][COL.pointerX], rows[i][COL.heroY] - rows[i][COL.scroll] - rows[i][COL.pointerY])
  const moved = (i) => (i > 0 ? Math.hypot(rows[i][COL.heroX] - rows[i - 1][COL.heroX], rows[i][COL.heroY] - rows[i - 1][COL.heroY]) : 0)
  const pointerMoved = (i) => (i > 0 ? Math.hypot(rows[i][COL.pointerX] - rows[i - 1][COL.pointerX], rows[i][COL.pointerY] - rows[i - 1][COL.pointerY]) : 0)
  const quiet = (p, i) => i >= p.first && i <= p.last && !rows[i][COL.turning]

  // The longest stretch of the first page in which the arrow keeps moving under the pointer.
  let walk = null
  const first = pages[0]
  if (first) {
    let from = -1
    for (let i = first.first; i <= first.last + 1; i++) {
      const going = i <= first.last && quiet(first, i) && moved(i) >= WALK.least && pointerMoved(i) > 0
      if (going && from < 0) from = i
      if (!going && from >= 0) {
        if (i - from >= WALK.steps && (!walk || i - from > walk.last - walk.first + 1)) walk = { first: from, last: i - 1 }
        from = -1
      }
    }
  }

  // Control taken: the step at which the site first tells of the tug of war. From there the arrow no longer follows the pointer.
  const s1 = of('step1')
  const tug = run.gags.find((g) => g.gag === TAKES)
  const taken = s1 && tug && tug.step >= s1.first && tug.step <= s1.last ? tug.step : null

  // The hit: a bolt before any other, and of the bolts the first far from both muzzles (`hitTaken`); with no bolt, the first hit the site tells of on step 1 (`told().hits`, by name).
  const on1 = s1 ? run.hits.filter((h) => h.step >= s1.first && h.step <= s1.last) : []
  const bolt = hitTaken(keyBlock(cfg), on1)
  const struck = (bolt && on1.find((h) => h.name === STANDS.hit && h.step === bolt.step)) || HITS.map((name) => on1.find((h) => h.name === name)).find(Boolean) || on1[0] || null
  const hit = struck ? struck.step : null

  // Control given back: step 1 has no word for it, so it is read from the arrow. After the page took it, the arrow lies dead
  // on what is left of the paper; given back is the first step at which it moves again.
  let back = null
  if (taken !== null) {
    let dead = 0
    for (let i = taken; i <= s1.last && back === null; i++) {
      if (!quiet(s1, i)) dead = 0
      else if (moved(i) <= BACK.dead) dead += 1
      else if (moved(i) >= BACK.moves) {
        if (dead >= BACK.still) back = i
        dead = 0
      }
    }
  }

  // The release itself: the visitor strokes STROKE.reactSteps after the page lets go, so the page let go that long before the pointer's first long move.
  let released = back
  if (back !== null) {
    const long = (VISITOR.speed / VISITOR.hz) * 0.6
    for (let i = Math.max(taken + 1, back - VISITOR.reactSteps); i <= back; i++) if (pointerMoved(i) >= long && pointerMoved(i - 1) < long) {
      released = Math.min(back, i - STROKE.reactSteps)
      break
    }
  }

  // Step 3: the visitor gets the flippers at the step the site says control is the flippers' (`told().control`), and uses them at the first press of one after that.
  const s3 = of('pinball')
  let flippers = null
  let flip = null
  if (s3) {
    for (let i = s3.first; i <= s3.last && flippers === null; i++) if (rows[i][COL.control]) flippers = i
    for (let i = (flippers ?? s3.last) + 1; i <= s3.last && flip === null; i++) if ((rows[i][COL.left] && !rows[i - 1][COL.left]) || (rows[i][COL.right] && !rows[i - 1][COL.right])) flip = i
  }
  // The ball has left the port: the arrow, sealed in it, is PORT.clear from where it was sealed.
  let left = null
  let leaves = null
  if (flippers !== null) {
    const far = (i) => Math.hypot(rows[i][COL.heroX] - rows[flippers][COL.heroX], rows[i][COL.heroY] - rows[flippers][COL.heroY])
    for (let i = flippers + 1; i <= Math.min(s3.last, flippers + PORT.most) && left === null; i++) if (far(i) >= PORT.clear) left = i
    // It leaves at the first step of the unbroken move that takes it there.
    if (left !== null) {
      leaves = left
      while (leaves - 1 > flippers && moved(leaves - 1) >= BACK.moves) leaves -= 1
    }
  }
  const speed = (i) => [rows[i][COL.heroX] - rows[i - 1][COL.heroX], rows[i][COL.heroY] - rows[i - 1][COL.heroY]]
  const mid = cfg.formats.hd.width / 2
  const ball = cfg.table.ballPx
  // The machine's saves. The kick: a step the page tells of by name (SAVE.names), a step at which the ball, going down, stands thrown up between the bats,
  // or the step at which a ball that lay low in the mouth (SAVE.low, SAVE.across) first goes up again by SAVE.rises a step.
  // The take: the step the page tells of as SAVE.take, or with none the first step of the unbroken stay low in the mouth that ends in the kick.
  const saves = []
  const takes = {}
  if (s3) {
    const low = (i) => {
      const b = ballAt(cfg, rows[i])
      return Math.abs(b.u - MACHINE.mid) <= SAVE.across && b.v >= SAVE.low ? b.tier : -1
    }
    const kicks = []
    for (const h of run.hits) if (SAVE.names.includes(h.name) && h.step >= s3.first && h.step <= s3.last) kicks.push(h.step)
    for (let i = s3.first + 2; i < s3.last; i++) {
      const now = speed(i)
      const was = speed(i - 1)
      const next = speed(i + 1)
      // Either way the ball was low in the mouth the step before, and SAVE.clears steps later it is out of the mouth, higher up the same tier: a bat's blow on a ball over the bat is no save.
      const out = ballAt(cfg, rows[Math.min(s3.last, i + SAVE.clears)])
      if (low(i - 1) < 0 || out.tier !== low(i - 1) || out.v >= SAVE.low) continue
      if (now[1] <= -SAVE.lifts && was[1] > 0 && Math.abs(rows[i][COL.heroX] - mid) <= SAVE.across * ball && Math.hypot(next[0] - now[0], next[1] - now[1]) >= SAVE.breaks) kicks.push(i)
      if (low(i - 2) >= 0 && low(i - 3) >= 0 && now[1] <= -SAVE.rises * ball && was[1] > -SAVE.rises * ball) kicks.push(i)
    }
    kicks.sort((x, y) => x - y)
    for (const k of kicks) if (!saves.some((x) => Math.abs(x - k) <= SAVE.same)) saves.push(k)
    for (const k of saves) {
      const said = run.hits.filter((h) => h.name === SAVE.take && h.step <= k && h.step >= k - SAVE.most).pop()
      let take = k
      const tier = low(k - 1) >= 0 ? low(k - 1) : low(k)
      while (take - 1 > s3.first && k - take < SAVE.most && low(take - 1) === tier && tier >= 0) take -= 1
      takes[k] = said ? said.step : take
    }
  }
  // The save that is shown: the first whose run, from SAVE.before frames before the take to SAVE.after frames after the kick, holds no other save and no flipper of the visitor's;
  // with none such, the first save.
  const handIn = (from, to) => {
    for (let j = Math.max(0, from); j <= Math.min(n - 1, to); j++) if (rows[j][COL.left] || rows[j][COL.right]) return true
    return false
  }
  const whole = (i) => !saves.some((x) => x !== i && x >= takes[i] - SAVE.before * EVERY && x <= i + SAVE.after * EVERY) && !handIn(takes[i] - SAVE.before * EVERY, i + SAVE.after * EVERY)
  const save = saves.find(whole) ?? saves[0] ?? null
  const gate = save === null ? null : { take: takes[save], kick: save }

  // The visitor's own bat meets the ball. A step is a true stroke only when all of this holds: the visitor has the flippers; the ball's speed changes by MEETS.kick or more
  // and the ball then goes MEETS.lifts or more up the table; the visitor pressed a flipper MEETS.soon steps before at most (a press of step p first moves the bat in the picture of p + 1);
  // the ball was on that bat's side of the middle, or within half a ball of it; the step is no save of the machine's and the site tells of no other blow on the ball there.
  // Of each press the first such step is taken.
  const told = (i) => run.hits.some((h) => h.step === i || h.step === i - 1)
  const strokes = []
  if (s3) {
    for (let i = Math.max(s3.first + 2, (flippers ?? s3.last) + 1); i <= s3.last; i++) {
      if (!rows[i][COL.control] || saves.some((x) => x >= i - 2 && x <= i) || told(i)) continue
      const now = speed(i)
      const was = speed(i - 1)
      const kick = Math.hypot(now[0] - was[0], now[1] - was[1])
      if (kick < MEETS.kick || now[1] > -MEETS.lifts) continue
      const x = rows[i - 1][COL.heroX]
      for (const [side, col, near] of [['left', COL.left, x <= mid + ball / 2], ['right', COL.right, x >= mid - ball / 2]]) {
        if (!near) continue
        let press = null
        for (let p = i - 1; p >= Math.max(s3.first + 1, i - MEETS.soon) && press === null; p--) if (rows[p][col] && !rows[p - 1][col]) press = p
        if (press === null || strokes.some((x) => x.press === press && x.side === side)) continue
        let held = 0
        while (press + held <= s3.last && rows[press + held][col]) held += 1
        strokes.push({ step: i, side, press, held, kick: r1(kick), fromReach: Math.round(reachGap(cfg, overBat(cfg, rows[press], side)) * 100) / 100 })
        break
      }
    }
  }
  // A bat's own blow is hard: a change of speed under MEETS.share of the hardest such change is a soft throw after a press that met nothing, and is no stroke.
  const blows = strokes.map((x) => ({ ...x }))
  const hardest = strokes.reduce((k, x) => Math.max(k, x.kick), 0)
  for (let j = strokes.length - 1; j >= 0; j--) if (strokes[j].kick < MEETS.share * hardest) strokes.splice(j, 1)
  // Of the true strokes one pressed with the ball within the bat's reach is shown before one pressed outside it, and of those the one whose hand holds the flipper longest, the earlier of two held as long.
  const within = strokes.filter((x) => x.fromReach === 0)
  const stroke = (within.length ? within : strokes).reduce((best, x) => (!best || x.held > best.held ? x : best), null)
  const blow = stroke ? stroke.step : null

  // A key of the page's keyboard pressed by the arrow: the first press of the mouse button inside the key block of step 1 once the page asks for the first name, and its release.
  let type = null
  if (s1) {
    const block = keyBlock(cfg)
    const asked = run.gags.find((g) => g.gag === STANDS.from)
    const inBlock = (i) => {
      const x = rows[i][COL.pointerX]
      const y = rows[i][COL.pointerY] + rows[i][COL.scroll]
      return x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h
    }
    for (let i = Math.max(s1.first + 1, asked ? asked.step : s1.first + 1); i <= s1.last && type === null; i++) {
      if (!(rows[i][COL.down] && !rows[i - 1][COL.down] && inBlock(i) && quiet(s1, i))) continue
      let up = i
      while (up <= s1.last && rows[up][COL.down]) up += 1
      type = { press: i, release: up }
    }
  }
  return { ...run, pages, turns, moments: { walk, hit, struck: struck ? struck.name : null, taken, back, released, flippers, leaves, left, flip, met: blow, stroke, strokes, blows, save, saves, gate, type, turn: turns[0] || null, falls: fallsOf(cfg, rows, s3) } }
}

// The visitor's hand under a frame: a frame carries L or R when the visitor held that flipper at the frame's own step or at any step since the frame before it on the sheet,
// so that a tap of one step between two frames is not lost. The columns are the run's own.
export function handAt(rows, i, every = EVERY) {
  let left = false
  let right = false
  for (let j = Math.max(0, i - every + 1); j <= i; j++) {
    if (rows[j][COL.left]) left = true
    if (rows[j][COL.right]) right = true
  }
  return [left ? 'L' : '', right ? 'R' : ''].filter(Boolean).join(' ')
}
// True when the run shows no key and no button down in the steps of a sheet: none held in any step from the frame before the first to the last, and no press sent in them.
export function handsOff(run, steps) {
  const first = Math.max(0, steps[0] - EVERY)
  const last = steps[steps.length - 1]
  for (let j = first; j <= last; j++) {
    const r = run.rows[j]
    if (r[COL.down] || r[COL.left] || r[COL.right]) return false
    if (((run.acts || {})[j] || []).some((a) => a.press || a.down || a.keyDown)) return false
  }
  return true
}

// The window of a close sheet: one fixed window for the whole run, set on the arrow's places over it. It is the tile itself, uncut and unscaled,
// while the arrow's way fits in it with ROOM round it, and a wider one in the tile's proportions, shown smaller, when it does not.
// What a close sheet holds in every picture besides the arrow, in widths of the ball (table.ballPx): `margin` round each of these;
// a part the ball touched lies within `touch` of where the site says it was touched (half the ball and the width of a bumper);
// the pressed bat lies within `batAcross` to either side of the ball at the blow, `batAbove` above it and `batBelow` below it, at rest and raised
// (table.flipperBalls long, 25 degrees either way). `knock` is how many steps after a bolt's hit the arrow's throw is read, from the step before the hit: it points away from the turret that fired.
export const HOLDS = { margin: 0.5, touch: 2, batAcross: 3.25, batAbove: 1, batBelow: 3.5, knock: 1 }
// The places of those things in the window's own picture, as boxes [left, top, right, bottom] in px of the hd page as the visitor sees it.
export function holdsOf(cfg, run, steps, what) {
  const ball = cfg.table.ballPx
  const m = run.moments || {}
  const first = steps[0]
  const last = steps[steps.length - 1]
  const row = (i) => run.rows[Math.max(0, Math.min(run.rows.length - 1, i))]
  const out = []
  if (what === 'flip') {
    const page = row(first)[COL.page]
    for (const h of run.hits || []) {
      if (h.page !== page || h.step < first || h.step > last) continue
      const y = h.y - row(h.step)[COL.scroll]
      out.push([h.x - HOLDS.touch * ball, y - HOLDS.touch * ball, h.x + HOLDS.touch * ball, y + HOLDS.touch * ball])
    }
    const blow = m.met
    if (blow !== null && blow !== undefined && blow >= first && blow <= last) {
      const r = row(blow)
      const y = r[COL.heroY] - r[COL.scroll]
      out.push([r[COL.heroX] - HOLDS.batAcross * ball, y - HOLDS.batAbove * ball, r[COL.heroX] + HOLDS.batAcross * ball, y + HOLDS.batBelow * ball])
    }
  }
  // The save: both bats, either side of the gate's mouth where the ball is thrown from.
  if (what === 'save' && m.save !== null && m.save !== undefined && m.save >= first && m.save <= last) {
    const r = row(m.save)
    const y = r[COL.heroY] - r[COL.scroll]
    out.push([r[COL.heroX] - HOLDS.batAcross * ball, y - HOLDS.batAbove * ball, r[COL.heroX] + HOLDS.batAcross * ball, y + HOLDS.batBelow * ball])
  }
  if (what === 'hit' && m.struck === STANDS.hit && m.hit >= first && m.hit <= last) {
    const block = keyBlock(cfg)
    const at = row(m.hit)
    const after = row(m.hit + HOLDS.knock)
    const scroll = at[COL.scroll]
    const stood = { x: at[COL.pointerX], y: at[COL.pointerY] + scroll }
    const before = row(m.hit - 1)
    const thrown = { x: after[COL.heroX] - before[COL.heroX], y: after[COL.heroY] - before[COL.heroY] }
    const fired = block.turrets.filter((c) => (stood.x - c.x) * thrown.x + (stood.y - c.y) * thrown.y > 0)
    for (const c of fired.length === 1 ? fired : block.turrets) {
      const d = Math.hypot(stood.x - c.x, stood.y - c.y) || 1
      const x = c.x + ((stood.x - c.x) / d) * BLOCK.barrel
      const y = c.y + ((stood.y - c.y) / d) * BLOCK.barrel - scroll
      out.push([x, y, x, y])
    }
  }
  const w = cfg.formats.hd.width
  const h = cfg.formats.hd.height
  const pad = HOLDS.margin * ball
  return out.map((b) => [Math.max(0, b[0] - pad), Math.max(0, b[1] - pad), Math.min(w, b[2] + pad), Math.min(h, b[3] + pad)]).filter((b) => b[2] > b[0] && b[3] > b[1])
}

/** @param {any} cfg @param {any} run @param {number[]} steps @param {string | null} [what] */
export function runWindow(cfg, run, steps, what = null) {
  const edge = cfg.critics.maxImageLongEdgePx
  const rf = cfg.formats[run.format || RUN.format]
  const k = rf.width / cfg.formats.hd.width
  const tileW = Math.floor((edge - GAP * 2) / 3)
  const tileH = hitTileHeight(edge, Math.min(steps.length, cfg.critics.contactSheetFrames))
  const xs = steps.map((i) => run.rows[i][COL.heroX] * k)
  const ys = steps.map((i) => (run.rows[i][COL.heroY] - run.rows[i][COL.scroll]) * k)
  const holds = what ? holdsOf(cfg, run, steps, what).map((b) => b.map((v) => v * k)) : []
  const x0 = Math.min(Math.min(...xs) - ROOM, ...holds.map((b) => b[0]))
  const y0 = Math.min(Math.min(...ys) - ROOM, ...holds.map((b) => b[1]))
  const x1 = Math.max(Math.max(...xs) + ROOM, ...holds.map((b) => b[2]))
  const y1 = Math.max(Math.max(...ys) + ROOM, ...holds.map((b) => b[3]))
  const box = [x0, y0, x1 - x0, y1 - y0]
  const zoom = Math.min(Math.max(1, box[2] / tileW, box[3] / tileH), rf.width / tileW, rf.height / tileH)
  const w = Math.round(tileW * zoom)
  const h = Math.round(tileH * zoom)
  return { window: windowRound(box, w, h, rf.width, rf.height), tileW, tileH, shown: Math.round((tileW / w) * 100) }
}

const unitsOf = (cfg) => cfg.film.units.map((u) => u.id)
const pageWords = (cfg, page) => `page ${unitsOf(cfg).indexOf(page) + 1} of ${unitsOf(cfg).length}`
const screens = [
  { kind: 'site-screen', still: 'screen-live', heading: 'The application as a visitor has it, with its controls' },
  { kind: 'site-screen', still: 'screen-touch', heading: 'What a visitor on a touch device gets in place of the application' }
]

// R2: the six pages at rest, and the approved key images of all units as controls.
function juryGroups(cfg) {
  return [
    { id: 'judged', items: unitsOf(cfg).map((u) => ({ kind: 'site-jury', unit: u, judged: true, heading: '' })) },
    { id: 'controls', items: cfg.keys.map((k) => ({ kind: 'site-jury', image: k.image, control: k.id, judged: false, heading: '' })) }
  ]
}

// R8: the six pages at rest, the two screens, and what a visitor can have on screen besides the page at its real size.
function pageGroups(cfg) {
  const units = unitsOf(cfg)
  return [
    {
      id: 'page',
      items: [
        ...units.map((u, i) => ({ kind: 'site-page', unit: u, heading: `Page ${i + 1} of ${units.length}, at rest` })),
        ...screens,
        { kind: 'site-control-crops', heading: 'What a visitor can have on screen besides the page, each at its real size' }
      ]
    }
  ]
}

const needRun = (facts, role) => {
  if (!facts || !facts.rows) throw new Error(`The role ${role} of the unit "site" needs the visitor's run`)
  return facts
}

// The machine's tiers and the passage between them: for every fall of the camera from one tier to the next, TIERS.each whole frames at one even step,
// the first one such step before the travel begins, the second at its first step, the last after its end. The step is the least even number of steps that does it for every fall.
export function tierSheet(cfg, run) {
  const falls = (run.moments.falls || []).slice(0, Math.floor(cfg.critics.contactSheetFrames / TIERS.each))
  if (!falls.length) return null
  const longest = Math.max(...falls.map((f) => f.last - f.first + 1))
  const step = Math.ceil(Math.ceil(longest / (TIERS.each - 2)) / 2) * 2
  const steps = falls.flatMap((f) => Array.from({ length: TIERS.each }, (_, i) => f.first + (i - 1) * step))
  const parts = falls.map((f, i) => `frames ${i * TIERS.each + 1} to ${(i + 1) * TIERS.each} from tier ${f.tier + 1} to tier ${f.tier + 2} of ${cfg.table.tiers.length} (the camera travels ${timeOf(f.first)} to ${timeOf(f.last)})`)
  const part = (run.pages || []).find((p) => falls[0].first >= p.first && falls[0].first <= p.last)
  return { kind: 'site-run-sheet', moment: 'tiers', page: part ? part.unit : run.rows[falls[0].first][COL.page], steps, every: step, heading: `The machine's tiers and the passage from one to the next, whole frames ${step} steps (${(step / VISITOR.hz).toFixed(2)} s) apart: ${parts.join('; ')}. In each, the first frame is ${step} steps before the camera starts to travel and the last is after it has stopped` }
}

// R5: the six pages on one sheet, the two screens, and one sheet across each page's part of the visitor's run.
function wholeGroups(cfg, unit, facts) {
  const run = needRun(facts, 'R5')
  const count = cfg.critics.contactSheetFrames
  const units = unitsOf(cfg)
  const parts = units.map((u) => run.pages.find((p) => p.unit === u)).filter(Boolean)
  const sheets = parts.map((p, i) => {
    // A page's part of the visit is the part in which it lies still: the halves of the turns at its ends show it edge on.
    let first = p.first
    let last = p.last
    while (first < last && run.rows[first][COL.turning]) first += 1
    while (last > first && run.rows[last][COL.turning]) last -= 1
    const steps = spreadSteps(first, last, count)
    return { kind: 'site-run-sheet', page: p.unit, steps, heading: `One visitor's visit in order, sheet ${i + 1} of ${parts.length}, ${pageWords(cfg, p.unit)}: ${span(steps)}` }
  })
  const tiers = tierSheet(cfg, run)
  if (tiers) sheets.splice(sheets.findIndex((x) => x.page === tiers.page) + 1, 0, tiers)
  return [
    { id: 'rest', items: [{ kind: 'site-pages-sheet', units, heading: `The ${units.length} pages at rest` }, ...screens] },
    { id: 'visit', items: sheets }
  ]
}

// The page turn in steps, as the stage plays it (src/stage/stage.ts, src/stage/turn.ts), counted from the first step of the new page, when it stands on its edge:
// `seat` the page meets the stage, `flat` its last knock is over and the slab lies flat, `quiet` the loose things on it have stopped shivering.
// `lead` steps of the old page lying flat come first, `still` frames after `quiet` come last. A stepped test holds the first three against the stage's own numbers.
export const TURNS = { seat: 18, flat: 27, quiet: 31, lead: 2, still: 4 }
// The key press: its run starts `before` frames before the press and ends `after` frames after the release. `mark` stands under a frame in which the visitor holds the mouse button.
export const KEYS = { before: 3, after: 4, mark: 'down' }
export const KEY_WORDS = `Under a frame, "${KEYS.mark}": the visitor holds the mouse button in that frame.`
// The mark under frame i: picture i is the site before the visitor's events of step i, so it shows the button as row i - 1 holds it.
export const downAt = (rows, i) => (i > 0 && rows[i - 1][COL.down] ? KEYS.mark : '')
// The tiers' sheet: `each` frames of every fall of the camera from one tier to the next, at an even step: one before the travel, one at its first step, the last after its end.
export const TIERS = { each: 6 }
const VISITOR_WORDS = `The pack's visitor presses ${FLIPS.reactSteps} steps after the page's cue and holds ${FLIPS.holdSteps} steps`

// The fixed window of the save's sheets, in px of the run's picture: centred on the middle of the machine, its lower edge on the tier's floor as the camera shows it at the kick,
// the tile itself at its real size when that holds the gate at the mouth and both bats at rest and raised with HOLDS.margin round them, and a wider one, shown smaller, when it does not.
export function saveHolds(cfg, row, tier) {
  const g = tiersOf(cfg)
  const far = MACHINE.pivotU - MACHINE.radius
  const reach = cfg.table.flipperBalls * Math.sin((Math.abs(MACHINE.up) * Math.PI) / 180) + MACHINE.tip
  const top = (g.y(tier) + MACHINE.pivotV - reach) * g.ball - row[COL.scroll]
  const floor = (g.y(tier) + g.tall) * g.ball - row[COL.scroll]
  const gate = (g.y(tier) + MACHINE.pinV + MACHINE.pin) * g.ball - row[COL.scroll]
  return { bats: [far * g.ball, top, (cfg.table.tierWidthBalls - far) * g.ball, (g.y(tier) + MACHINE.pivotV + reach) * g.ball - row[COL.scroll]], gate: [(MACHINE.mid - MACHINE.mouthHalf) * g.ball, (g.y(tier) + MACHINE.gateV - REACH.ballR) * g.ball - row[COL.scroll], (MACHINE.mid + MACHINE.mouthHalf) * g.ball, gate], floor }
}
export function saveWindow(cfg, run, steps) {
  const edge = cfg.critics.maxImageLongEdgePx
  const rf = cfg.formats[run.format || RUN.format]
  const k = rf.width / cfg.formats.hd.width
  const tileW = Math.floor((edge - GAP * 2) / 3)
  const tileH = hitTileHeight(edge, Math.min(steps.length, cfg.critics.contactSheetFrames))
  const kick = run.moments.gate.kick
  const tier = ballAt(cfg, run.rows[kick]).tier
  const h = saveHolds(cfg, run.rows[kick], tier)
  const pad = HOLDS.margin * cfg.table.ballPx
  const floor = Math.min(cfg.formats.hd.height, Math.max(h.floor, h.gate[3]))
  const needW = (h.bats[2] - h.bats[0] + pad * 2) * k
  const needH = (floor - Math.min(h.bats[1], h.gate[1]) + pad) * k
  const zoom = Math.min(Math.max(1, needW / tileW, needH / tileH), rf.width / tileW, rf.height / tileH)
  const w = Math.round(tileW * zoom)
  const hh = Math.round(tileH * zoom)
  const x = Math.max(0, Math.min(rf.width - w, Math.round(MACHINE.mid * cfg.table.ballPx * k - w / 2)))
  const y = Math.max(0, Math.min(rf.height - hh, Math.ceil(floor * k) - hh))
  return { window: [x, y, w, hh], tileW, tileH, shown: Math.round((tileW / w) * 100), tier }
}
// True when the save's window holds the gate and both bats in the picture of a step.
export function windowHolds(cfg, run, win, step) {
  const k = cfg.formats[run.format || RUN.format].width / cfg.formats.hd.width
  const h = saveHolds(cfg, run.rows[step], win.tier)
  const inside = (b) => b[0] * k >= win.window[0] && b[1] * k >= win.window[1] && b[2] * k <= win.window[0] + win.window[2] && b[3] * k <= win.window[1] + win.window[3]
  return inside(h.bats) && inside(h.gate)
}

// R4: the sheets kit/07 names for `site`, each found in the visitor's run. A moment is one run of consecutive pictures, EVERY steps apart, on as many sheets as it needs.
// Nothing is taken away: `limitTook` stays empty, and when the sheets are more than one message holds they go out as two sets, the pages and the machine.
// `leftOut` names a moment the run does not hold.
export function motionPlan(cfg, run) {
  const count = cfg.critics.contactSheetFrames
  const most = cfg.critics.maxFilesPerMessage
  const m = run.moments
  const rows = run.rows
  const last = rows.length - 1
  const runs = []
  const leftOut = []
  const limitTook = []
  const have = (v) => v !== null && v !== undefined
  // `sheets` sheets of pictures one after the other from the step `from`.
  const add = (what, kind, words, from, sheets, at = null, more = {}) => {
    const start = Math.max(0, Math.min(from, last - (count * sheets - 1) * EVERY))
    const steps = Array.from({ length: count * sheets }, (_, i) => start + i * EVERY).filter((i) => i >= 0 && i <= last)
    if (steps.length) runs.push({ what, kind, words, steps, at, ...more })
    return steps
  }
  // How many sheets a run from `from` needs to hold the step `to`.
  const sheetsFor = (from, to) => Math.max(1, Math.ceil((Math.ceil((to - from) / EVERY) + 1) / count))
  if (m.walk) add('walk', 'site-run-sheet', "as a visitor's pointer walks the arrow across the page", m.walk.first + Math.max(0, Math.floor((m.walk.last - m.walk.first + 1 - count * EVERY) / 2)), 1)
  if (m.turn) {
    // The turn whole: from the old page lying flat, through the edge and the closing, to TURNS.still frames after the last thing on the new page has stopped.
    let edge = m.turn.first
    while (edge < m.turn.last && rows[edge][COL.page] === rows[m.turn.first][COL.page]) edge += 1
    const quiet = edge + TURNS.quiet
    let from = m.turn.first - TURNS.lead
    let sheets = sheetsFor(from, quiet + TURNS.still * EVERY)
    for (let lead = TURNS.lead - 1; lead >= 0; lead--) if (sheetsFor(m.turn.first - lead, quiet + TURNS.still * EVERY) < sheets) {
      from = m.turn.first - lead
      sheets = sheetsFor(from, quiet + TURNS.still * EVERY)
    }
    const steps = add('turn', 'site-run-sheet', 'of one page turn', from, sheets)
    const r = runs[runs.length - 1]
    if (steps.length) r.says = (part) => {
      const out = []
      const a = part[0]
      const b = part[part.length - 1]
      const before = part.filter((i) => i < m.turn.first).length
      const after = part.filter((i) => i > quiet).length
      if (before) out.push(`${before} ${before === 1 ? 'frame' : 'frames'} of the old page lying flat`)
      if (b >= m.turn.first && a < edge) out.push('the old page swings away')
      if (a <= edge && b >= edge) out.push(`the new page stands on its edge from ${timeOf(edge)}`)
      if (b > edge && a < edge + TURNS.seat) out.push(a > edge ? 'the new page goes on closing' : 'and closes')
      if (a <= edge + TURNS.seat && b >= edge + TURNS.seat) out.push(`it seats at ${timeOf(edge + TURNS.seat)}`)
      if (b > edge + TURNS.seat && a <= quiet) out.push(`it has stopped by ${timeOf(quiet)}`)
      if (after) out.push(after === 1 ? 'the last frame comes after the stop' : `the last ${after} frames come after the stop`)
      let moved = false
      for (let i = Math.max(1, a - EVERY + 1); i <= b; i++) if (rows[i][COL.pointerX] !== rows[i - 1][COL.pointerX] || rows[i][COL.pointerY] !== rows[i - 1][COL.pointerY]) moved = true
      return `${out.join(', ')}${after && !moved ? ". The visitor's pointer does not move in these frames" : ''}`
    }
  }
  const lead = LEAD * EVERY
  if (have(m.hit)) {
    // The hit is named by what struck, and the hand is said to be off only where the run shows it off in every step of the sheet.
    const steps = add('hit', 'site-hit-sheet', '', m.hit - lead, 1, m.hit)
    const r = runs[runs.length - 1]
    if (steps.length) r.words = `as ${struckWords(m.struck)} hits the arrow${handsOff(run, steps) ? ', no key is pressed in these frames' : ''}`
  }
  if (m.type) {
    // The key press whole: from KEYS.before frames before the press to KEYS.after frames after the release, with the button's mark under each frame.
    const from = m.type.press - KEYS.before * EVERY
    const steps = add('type', 'site-hit-sheet', "as the visitor's arrow presses a key of the page's keyboard and lets it go", from, sheetsFor(from, m.type.release + KEYS.after * EVERY), m.type.press, { marks: 'key' })
    const r = runs[runs.length - 1]
    // Every stretch of frames in which the button is held, said by the times under its first and its last frame.
    const held = []
    for (const i of steps) if (downAt(rows, i)) {
      const here = held[held.length - 1]
      if (here && here[1] === i - EVERY) here[1] = i
      else held.push([i, i])
    }
    if (held.length) r.after = `In this run the button is held ${held.map((h) => (h[0] === h[1] ? `in the frame ${timeOf(h[0])}` : `from the frame ${timeOf(h[0])} to the frame ${timeOf(h[1])}`)).join(', and again ')}`
  }
  if (have(m.taken)) add('taken', 'site-hit-sheet', 'as the page takes the arrow from the visitor', m.taken - lead, 1, m.taken)
  if (have(m.back)) add('given-back', 'site-hit-sheet', 'as the page gives the arrow back to the visitor and the visitor moves it away', (m.released ?? m.back) - lead, 1, m.released ?? m.back)
  if (have(m.flippers)) {
    // One run from the seal until the ball is out of the port, where two sheets hold it. Where the ball lies longer in the port than that,
    // the moment is two runs of one sheet each: the seal, and the ball leaving the port.
    const out = !have(m.left) ? null : m.left + PORT.tail
    const from = m.flippers - lead
    if (out === null || out - from <= (count * 2 - 1) * EVERY) add('flippers', 'site-hit-sheet', 'as the arrow goes into the ball, the ball leaves the port and the visitor gets the flippers', from, 2, m.flippers, { marks: 'hand' })
    else {
      add('flippers', 'site-hit-sheet', 'as the arrow goes into the ball and the visitor gets the flippers', from, 1, m.flippers, { marks: 'hand' })
      add('flippers', 'site-hit-sheet', 'as the ball, with the arrow sealed in it, leaves the port', Math.max(m.leaves - lead, out - (count - 1) * EVERY), 1, m.leaves, { marks: 'hand' })
    }
  }
  // The flipper meets the ball: only a true stroke of the visitor's own bat stands under this heading. With none in the run the sheets are left out.
  if (have(m.met)) {
    add('flip', 'site-hit-sheet', "as the visitor's flipper meets the ball and the ball goes off it", m.met - lead, 2, m.met, { marks: 'hand' })
    runs[runs.length - 1].after = VISITOR_WORDS
  } else if (have(m.flippers)) leftOut.push("flip: the run holds no step at which the visitor's own flipper meets the ball, so no sheet stands under that heading")
  if (m.gate) {
    // The save: from SAVE.before frames before the ball is down at the gate to SAVE.after frames after the kick. The heading names the event, the window and the marks, and nothing of what strikes.
    const need = sheetsFor(m.gate.take - SAVE.before * EVERY, m.gate.kick + SAVE.after * EVERY)
    const sheets = Math.min(SAVE.sheets, need)
    const from = need > sheets ? m.gate.kick + SAVE.after * EVERY - (count * sheets - 1) * EVERY : m.gate.take - SAVE.before * EVERY
    add('save', 'site-hit-sheet', 'as the machine saves a ball lost between the bats', from, sheets, m.gate.kick, { marks: 'hand' })
    runs[runs.length - 1].after = `The ball is low in the mouth from ${timeOf(m.gate.take)} and goes back up from ${timeOf(m.gate.kick)}`
  }
  const items = []
  for (const r of runs) {
    const sheets = Math.ceil(r.steps.length / count)
    const first = runs.find((x) => x.what === r.what)
    // The second run of a moment: how long after the first run's last picture its first picture is.
    const apart = first !== r ? Math.round(((r.steps[0] - first.steps[first.steps.length - 1]) / VISITOR.hz) * 100) / 100 : null
    const win = r.kind !== 'site-hit-sheet' ? null : r.what === 'save' ? saveWindow(cfg, run, r.steps) : runWindow(cfg, run, r.steps, r.what)
    const size = !win ? '' : r.what === 'save' ? `, one fixed window on the mouth, its gate and both bats at ${win.shown}% of its size` : win.shown === 100 ? ', the part of the picture round the arrow at its real size' : `, the part of the picture round the arrow's way at ${win.shown}% of its size`
    const legend = r.marks === 'hand' ? HAND_WORDS : r.marks === 'key' ? KEY_WORDS : ''
    for (let j = 0; j < sheets; j++) {
      const steps = r.steps.slice(j * count, (j + 1) * count)
      const part = sheets > 1 ? `, sheet ${j + 1} of ${sheets} of one run, frames ${j * count + 1} to ${j * count + steps.length} of ${r.steps.length}` : ''
      const says = r.says ? `: ${r.says(steps)}` : ''
      const tail = [r.after, legend].filter(Boolean).map((t) => `. ${t}`).join('')
      const item = { kind: r.kind, moment: r.what, page: rows[steps[0]][COL.page], steps, run: r.steps, every: EVERY, part: sheets > 1 ? [j + 1, sheets] : null, apart, heading: `Consecutive frames, 1/${VISITOR.hz / EVERY} s apart, ${r.words}${size}${part}${says}: ${span(steps)}${tail}` }
      if (r.marks === 'hand') item.hands = steps.map((i) => handAt(rows, i))
      if (r.marks === 'key') item.hands = steps.map((i) => downAt(rows, i))
      if (r.at !== null && steps.includes(r.at)) item.at = r.at
      items.push(item)
    }
  }
  // In the order they happen, a run's sheets side by side.
  items.sort((x, y) => x.run[0] - y.run[0] || x.steps[0] - y.steps[0])
  // One set while one message holds the sheets; else the pages in one group and the machine (the moments of HANDS) in another, each a whole of its own, cut only between runs.
  const groups = items.length <= most ? [{ id: 'moments', items }] : [{ id: 'pages', items: items.filter((f) => !HANDS.includes(f.moment)) }, { id: 'machine', items: items.filter((f) => HANDS.includes(f.moment)) }].filter((g) => g.items.length)
  return { items, groups, leftOut, limitTook }
}
const motionGroups = (cfg, unit, facts) => motionPlan(cfg, needRun(facts, 'R4')).groups
// What pack.json says of a pack of the site besides its files: for R4, a moment that is left out and the sheets the limit took (none: the plan makes a second set instead).
export function siteNotes(cfg, role, facts) {
  if (role !== 'R4' || !facts) return {}
  const { leftOut, limitTook } = motionPlan(cfg, facts)
  return { leftOut, limitTook }
}

export const siteRoles = {
  R2: { critic: 'R2', section: 'R2 · Jury', groups: juryGroups },
  R4: { critic: 'R4', section: 'R4 · Motion', groups: motionGroups, facts: true },
  R5: { critic: 'R5', section: 'R5 · The whole', groups: wholeGroups, facts: true },
  R8: { critic: 'R8', section: 'R8 · The page', groups: pageGroups }
}

// A section of kit/07 as the critic of `site` gets it: the lines written for another unit are left out, every other line stays word for word.
const OTHER_UNITS = [/^- Pack for (a page|`pinball`|`film`)/, /^- For the film:/, /^- In the loop's seam sheet/]
export const siteLines = (section) => section.split('\n').filter((l) => !OTHER_UNITS.some((r) => r.test(l))).join('\n')

export const SITE_KINDS = ['site-jury', 'site-page', 'site-pages-sheet', 'site-screen', 'site-control-crops', 'site-run-sheet', 'site-hit-sheet']

const fitted = (w, h, edge) => {
  const k = Math.min(1, edge / w, edge / h)
  return [Math.round(w * k), Math.round(h * k)]
}

// A picture for a juror: made to fit the long edge and encoded, with nothing written on it. A judged still and a control go through this one function.
export async function juryPicture(png, edge) {
  const m = await sharp(png).metadata()
  const size = fitted(m.width, m.height, edge)
  return { png: await sharp(png).removeAlpha().resize(size[0], size[1], { fit: 'fill' }).png().toBuffer(), size }
}

// Draws the pictures of a site pack into `built`, with what the key file says of each in `about`.
export async function buildSite({ cfg, session, files, built, about, log, cache, facts, whole = null }) {
  const edge = cfg.critics.maxImageLongEdgePx
  const hd = cfg.formats.hd
  const units = unitsOf(cfg)
  const shown = Math.round(Math.min(1, edge / hd.width) * 100)
  if (cache) fs.mkdirSync(cache, { recursive: true })
  const kept = (name) => (cache ? path.join(cache, name) : null)

  // A page at rest, through the site's own path at the level `high`: what `npm run still -- --page ID --live high` draws.
  const rests = new Map()
  const restOf = async (unit) => {
    if (rests.has(unit)) return rests.get(unit)
    const { spec } = stillFrom({ page: unit, live: LEVEL })
    const file = kept(`site-${unit}-${hd.id}-live-${LEVEL}.png`)
    let png = file && fs.existsSync(file) ? fs.readFileSync(file) : null
    if (!png) {
      png = (await drawStill(session, spec)).png
      if (file) fs.writeFileSync(file, png)
      log(`still of ${unit} at rest, through the live path at ${LEVEL}`)
    }
    rests.set(unit, { png, spec })
    return rests.get(unit)
  }

  // A screen with the site's controls on it, as the browser shows it, and where its controls are.
  const shots = new Map()
  const screenOf = async (name, spec) => {
    if (shots.has(name)) return shots.get(name)
    const file = kept(`site-${name}-${hd.id}-live-${LEVEL}.png`)
    const note = file ? file.replace(/\.png$/, '.json') : null
    let got = file && fs.existsSync(file) && fs.existsSync(note) ? { png: fs.readFileSync(file), boxes: readJson(note).boxes, spec } : null
    if (!got) {
      const png = (await drawStill(session, spec)).png
      got = { png, boxes: await controlBoxes(session.page), spec }
      if (file) {
        fs.writeFileSync(file, png)
        fs.writeFileSync(note, JSON.stringify({ boxes: got.boxes }) + '\n')
      }
      log(`screen ${name}`)
    }
    shots.set(name, got)
    return got
  }
  const judgedScreen = (id) => screenOf(id, stillFrom({ id, live: LEVEL }).spec)
  // The same row once the link to skip a step is offered: a step of the application with the controls on.
  const skipScreen = () => screenOf('screen-skip', { ...stillFrom({ page: units[1], live: LEVEL }).spec, interface: true })
  // The film as a visitor has it, stopped at its start: its bar stands below the picture.
  const filmScreen = async () => {
    if (shots.has('film')) return shots.get('film')
    const context = await session.browser.newContext({ viewport: { width: hd.width, height: hd.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      page.on('pageerror', (e) => session.problems.push(String(e && e.message ? e.message : e)))
      await page.goto(`${session.server.url}/index.html?mode=film`)
      await page.waitForFunction(() => document.querySelector('#controls')?.children.length > 0, null, { timeout: 120000 })
      await page.waitForTimeout(2500)
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: hd.width, height: hd.height }, timeout: 240000 })
      shots.set('film', { png, boxes: await controlBoxes(page), spec: { url: 'index.html?mode=film', reducedMotion: 'reduce', at: 0 } })
    } finally {
      await context.close()
    }
    log('screen with the film')
    return shots.get('film')
  }

  for (const f of files.filter((x) => x.kind === 'site-jury')) {
    const src = f.judged ? await restOf(f.unit) : { png: fs.readFileSync(at(f.image)) }
    const got = await juryPicture(src.png, edge)
    built.set(f.name, got.png)
    about.set(f.name, f.judged ? { judged: `site:${f.unit}`, still: src.spec, format: hd.id, level: LEVEL, size: got.size } : { control: f.control, image: f.image, size: got.size })
    log(`${f.name}: ${f.judged ? `the judged still site:${f.unit}` : `the control ${f.image}`}`)
  }

  for (const f of files.filter((x) => x.kind === 'site-page')) {
    const s = await restOf(f.unit)
    const got = await single(s.png, `${f.heading}, shown at ${shown}% of its size`, edge)
    built.set(f.name, got.png)
    about.set(f.name, { judged: `site:${f.unit}`, still: s.spec, format: hd.id, level: LEVEL, scale: Number(got.scale.toFixed(4)) })
    log(`${f.name}: the page ${f.unit} at rest`)
  }

  for (const f of files.filter((x) => x.kind === 'site-pages-sheet')) {
    const columns = 3
    const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
    const tiles = []
    for (const [i, u] of f.units.entries()) tiles.push({ png: (await restOf(u)).png, label: `Page ${i + 1} of ${f.units.length}` })
    built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH: Math.round((tileW * hd.height) / hd.width) }))
    about.set(f.name, { judged: f.units.map((u) => `site:${u}`), format: hd.id, level: LEVEL })
    log(`${f.name}: the ${f.units.length} pages at rest on one sheet`)
  }

  for (const f of files.filter((x) => x.kind === 'site-screen')) {
    const s = await judgedScreen(f.still)
    const got = await single(s.png, `${f.heading}, shown at ${shown}% of its size`, edge)
    built.set(f.name, got.png)
    about.set(f.name, { judged: `still:${f.still}`, still: s.spec, format: hd.id, level: LEVEL, scale: Number(got.scale.toFixed(4)) })
    log(`${f.name}: the judged still ${f.still}`)
  }

  for (const f of files.filter((x) => x.kind === 'site-control-crops')) {
    const columns = 2
    const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
    const tileH = 200
    const tiles = []
    const crops = []
    const add = async (name, s, words) => {
      const windows = controlWindows(s.boxes, tileW, tileH, hd.width, hd.height)
      if (!windows.length) throw new Error(`pack: the screen ${name} shows no control to crop`)
      for (const w of windows) {
        tiles.push({ png: await cut(s.png, w.window), label: typeof words === 'function' ? words(w) : `${words}${w.part}` })
        crops.push({ screen: name, window: w.window })
      }
    }
    await add('screen-live', await judgedScreen('screen-live'), 'On the first page: the row with the sound control and the link to the film')
    await add('screen-skip', await skipScreen(), 'On a step of the application: the same row once the link to skip the step is offered')
    // The film stopped at its start has two things on screen: the button over the picture, and the bar along the bottom edge.
    await add('film', await filmScreen(), (w) => (w.window[1] + w.window[3] >= hd.height ? `With the film: the film's bar${w.part}` : 'With the film: the button over the picture that starts it'))
    built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH, exact: true }))
    about.set(f.name, { crops, format: hd.id, level: LEVEL })
    log(`${f.name}: ${tiles.length} crops of the controls`)
  }

  const sheets = files.filter((x) => x.kind === 'site-run-sheet' || x.kind === 'site-hit-sheet')
  if (!sheets.length) return
  const run = needRun(facts, 'R4 or R5')
  const rf = cfg.formats[RUN.format]
  const frames = await replay(cfg, run, sheets.flatMap((f) => f.steps), { plan: (whole || files).flatMap((f) => f.steps || []), cache, log })
  const columns = 3
  const tileW = Math.floor((edge - GAP * (columns - 1)) / columns)
  for (const f of sheets.filter((x) => x.kind === 'site-run-sheet')) {
    const tiles = f.steps.map((i) => ({ png: frames.get(i), label: timeOf(i) }))
    built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH: Math.round((tileW * rf.height) / rf.width) }))
    about.set(f.name, { moment: f.moment || null, page: f.page, steps: f.steps, run: f.run || f.steps, sha256: f.steps.map((i) => shaOf(frames.get(i))), format: rf.id, level: LEVEL, visitor: VISITOR })
    log(`${f.name}: ${f.moment ? `the moment ${f.moment}` : `the visit on ${f.page}`}`)
  }
  // A moment is a small thing in a whole picture: its sheet is the part of the picture round the arrow, uncut and unscaled, in one fixed window.
  for (const f of sheets.filter((x) => x.kind === 'site-hit-sheet')) {
    const { window: win, tileH, shown } = f.moment === 'save' ? saveWindow(cfg, run, f.run || f.steps) : runWindow(cfg, run, f.run || f.steps, f.moment)
    const tiles = []
    for (const i of f.steps) {
      const part = await cut(frames.get(i), win)
      const hand = f.hands ? f.hands[f.steps.indexOf(i)] : ''
      tiles.push({ png: shown === 100 ? part : await sharp(part).resize(tileW, tileH, { fit: 'fill' }).png().toBuffer(), label: hand ? `${timeOf(i)} ${hand}` : timeOf(i) })
    }
    built.set(f.name, await grid(tiles, f.heading, { edge, columns, tileW, tileH, exact: true }))
    about.set(f.name, { moment: f.moment, page: f.page, at: f.at ?? null, steps: f.steps, run: f.run || f.steps, ...(f.hands ? { hands: f.hands } : {}), window: win, shownPercent: shown, sha256: f.steps.map((i) => shaOf(frames.get(i))), format: rf.id, level: LEVEL, visitor: VISITOR })
    log(`${f.name}: the moment ${f.moment}${f.at !== undefined ? ` at step ${f.at}` : ''}`)
  }
}
