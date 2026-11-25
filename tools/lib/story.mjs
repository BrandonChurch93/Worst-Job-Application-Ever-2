// Checks G11 (the words) and G12 (the story), read from the frame interface without a picture.
import { at, config, readJson } from './paths.mjs'

const walkPath = (source, path) => {
  let v = source
  for (const part of path.split('.')) v = v !== null && typeof v === 'object' ? v[part] : undefined
  return v
}
const few = (list, n = 12) => (list.length > n ? [...list.slice(0, n), `and ${list.length - n} more`] : list)

// G11. Every run of type shows the string its key holds; every key a layout names is drawn; nothing was typed into code.
export async function wordsCheck(s) {
  const c = config()
  const copy = readJson(at('content', 'copy.json'))
  const { showcase, app, load } = s
  const { words, hasWords } = await load('/src/shell/words.ts')
  const { pages } = await load('/src/pages/index.ts')
  const { copyKeysOf } = await load('/src/copy.ts')
  const stage = await load('/src/stage/stage.ts')
  const { BotDriver } = await load('/src/stage/bots.ts')
  const held = (key) => {
    if (key.startsWith('copy:')) return walkPath(copy, key.slice(5))
    if (key.startsWith('data:')) return hasWords(key) ? words(key) : undefined
    return walkPath(c, key)
  }
  const detail = []
  const drawn = new Map()
  const runtimeTexts = new Map()
  const strings = []
  const gather = (v) => {
    if (typeof v === 'string') strings.push(v)
    else if (v && typeof v === 'object') for (const x of Object.values(v)) gather(x)
  }
  gather(copy)
  const mask = (t) => t.replace(/\d/g, '#')
  const masks = new Set(strings.map(mask))
  const literal = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const filled = strings.filter((t) => /\{[A-Za-z]+\}/.test(t)).map((t) => new RegExp(`^${t.split(/\{[A-Za-z]+\}/).map(literal).join('[\\d:.,\\- ]+')}$`, 'u'))
  const fromCopy = (t) => masks.has(mask(t)) || filled.some((r) => r.test(t))
  const note = (page, shape) => {
    if (shape.kind !== 'text' || !shape.words) return
    const key = shape.words
    if (!drawn.has(page)) drawn.set(page, new Set())
    drawn.get(page).add(key)
    if (key.startsWith('runtime:')) {
      const id = `${page} ${key}`
      if (!runtimeTexts.has(id)) runtimeTexts.set(id, new Set())
      if (shape.text) runtimeTexts.get(id).add(shape.text)
    }
  }
  let runs = 0
  for (const u of c.film.units) {
    for (const scroll of [0, 0.25, 0.5, 0.75, 1]) {
      const spec = { page: u.id, camera: 'home', tier: 'draft', scroll }
      const state = showcase.stillState(spec)
      for (const t of state.type) {
        if (scroll === 0) runs++
        if (t.key.startsWith('runtime:')) continue
        const want = held(t.key)
        if (typeof want !== 'string') detail.push(`${u.id} at rest: a run of type names the key "${t.key}", which holds no words`)
        else if (t.text !== want) detail.push(`${u.id} at rest: the run "${t.key}" shows "${t.text}", and its key holds "${want}"`)
      }
      const { frame, page } = app.still(spec)
      for (const shape of frame.list) note(page.id, shape)
    }
  }
  const registers = {}
  let listed = 0
  for (const id of Object.keys(pages)) {
    registers[id] = showcase.typeRegister(id)
    for (const r of registers[id]) {
      listed++
      if (r.made === 'runtime') continue
      const want = held(r.key)
      if (typeof want !== 'string') detail.push(`${id}: the register names the key "${r.key}", which holds no words`)
      else if (r.text !== want) detail.push(`${id}: the register gives "${r.text}" for "${r.key}", and its key holds "${want}"`)
      if (r.key.startsWith('data:') && (want ?? '').length > 14) detail.push(`${id}: "${r.key}" holds "${want}", which is neither a legend nor a numeral: it belongs in content/copy.json`)
    }
  }
  const film = showcase.film()
  for (let i = 0; i < film.frameCount; i += 6) {
    const m = app.filmMoment(i)
    const { frame, page } = app.filmFrame(m.unit, m.time)
    for (const shape of frame.list) note(page.id, shape)
  }
  const live = new stage.Stage({ mode: 'live', flow: stage.liveFlow(), pages, driver: new BotDriver('keen', c.seed), seed: c.seed })
  const limit = Math.round(c.live.botMaxSeconds * c.sim.stepHz)
  while (!live.finished && live.step < limit) {
    live.advance(24)
    const f = live.frameAt(live.time)
    for (const shape of f.list) note(f.page, shape)
  }
  let waited = 0
  for (const [id, make] of Object.entries(pages)) {
    const first = make()
    const lacks = () => [...new Set(copyKeysOf(first.layout))].some((k) => !k.startsWith('runtime:') && !(drawn.get(id) ?? new Set()).has(k))
    if (!lacks()) continue
    const alone = new stage.Stage({ mode: 'live', flow: [{ page: id }], pages, driver: new stage.StillDriver(first.start), seed: c.seed })
    while (!alone.finished && alone.step < limit && lacks()) {
      alone.advance(30)
      const f = alone.frameAt(alone.time)
      for (const shape of f.list) note(f.page, shape)
    }
    waited = Math.max(waited, alone.time)
  }
  let looked = 0
  for (const [id, make] of Object.entries(pages)) {
    const first = make()
    const named = []
    const gatherNodes = (n) => {
      if (n.copy && !n.copy.startsWith('runtime:')) named.push(n)
      for (const child of n.children ?? []) gatherNodes(child)
    }
    gatherNodes(first.layout)
    const seen = () => drawn.get(id) ?? new Set()
    const todo = named.filter((n) => !seen().has(n.copy))
    if (!todo.length) continue
    let target = todo[0]
    const driver = {
      name: 'script',
      input(view) {
        const [x, y, w, h] = target.box
        const cy = y + h / 2
        return { x: x + w / 2, y: cy - view.scroll, down: false, scroll: Math.max(0, cy - c.formats.hd.height / 2) }
      }
    }
    const looking = new stage.Stage({ mode: 'live', flow: [{ page: id }], pages, driver, seed: c.seed })
    for (const n of todo) {
      if (seen().has(n.copy)) continue
      target = n
      looked++
      const until = looking.step + Math.round(8 * c.sim.stepHz)
      while (!looking.finished && looking.step < until && !seen().has(n.copy)) {
        looking.advance(12)
        const f = looking.frameAt(looking.time)
        for (const shape of f.list) note(f.page, shape)
      }
    }
  }
  for (const [id, make] of Object.entries(pages)) {
    const tree = make().layout
    const seen = drawn.get(id) ?? new Set()
    const named = [...new Set(copyKeysOf(tree))].filter((k) => !k.startsWith('runtime:'))
    const missing = named.filter((k) => !seen.has(k))
    for (const k of few(missing, 8)) detail.push(k.startsWith('and ') ? `${id}: ${k} keys its layout names are never drawn` : `${id}: its layout names "${k}", which is never drawn: not at rest, not in the film, not in the keen bot's visit, not to a visitor who waits on the page, not to one who scrolls to it and holds the pointer on it for 8 s`)
    const parents = new Map()
    const visit = (n, parent) => {
      parents.set(n, parent)
      for (const child of n.children ?? []) visit(child, n)
    }
    visit(tree, null)
    for (const [n] of parents) {
      if (!n.copy || !n.copy.startsWith('runtime:')) continue
      let inField = false
      for (let p = parents.get(n); p; p = parents.get(p)) if (p.kind === 'field') inField = true
      if (inField) continue
      const texts = [...(runtimeTexts.get(`${id} ${n.copy}`) ?? [])]
      const worded = texts.filter((t) => /\p{L}/u.test(t) && !fromCopy(t))
      if (worded.length) detail.push(`${id}: the run "${n.copy}" (${n.id}) is made at run time, is not typed input in a field, and showed "${worded[0]}": only typed input, counters and the score display are made at run time`)
    }
  }
  return {
    pass: detail.length === 0,
    note: `the words: ${runs} runs of type on the six pages at rest and ${listed} entries of the type registers compared with the keys they name, character for character; every key a layout names looked for at rest, in ${Math.ceil(film.frameCount / 6)} film frames and in the keen bot's visit${live.finished ? '' : ' (which did not finish)'}${waited ? `, and for what was still missing on a page alone with a visitor who does nothing, for up to ${Math.round(waited)} s` : ''}${looked ? `, and for ${looked} runs with a pointer that scrolls to the run and rests on it` : ''}`,
    detail: few(detail, 30)
  }
}

// G12. The beats start in order, every event falls in its beat, and the cursor keeps its rules, in every frame of the film.
export function storyCheck(s) {
  const c = config()
  const { showcase } = s
  const film = showcase.film()
  const fps = c.film.fps
  const tolerance = Math.round(c.film.beatToleranceSeconds * fps)
  const detail = []
  const order = []
  const events = new Map()
  const firstOfUnit = new Map(film.units.map((u) => [u.first, u.id]))
  const armsBeat = c.cursor.armsOnlyInBeat
  let scale = null
  let scaleBad = 0
  let armsBad = 0
  const running = new Map()
  const longest = new Map()
  for (let i = 0; i < film.frameCount; i++) {
    const st = showcase.filmState(i)
    if (order[order.length - 1] !== st.beat) order.push(st.beat)
    for (const e of st.events) {
      if (!events.has(e.name)) events.set(e.name, [])
      events.get(e.name).push(i)
    }
    if (scale === null) scale = st.cursor.worldScale
    else if (Math.abs(st.cursor.worldScale - scale) > 1e-6 && scaleBad++ === 0) detail.push(`the cursor's world scale is ${st.cursor.worldScale} on frame ${i} and ${scale} on frame 0`)
    if (st.cursor.arms && st.beat !== armsBeat && armsBad++ === 0) detail.push(`the cursor has arms on frame ${i}, in the beat ${st.beat}: arms belong only to ${armsBeat}`)
    if (firstOfUnit.has(i) && st.cursor.damage.length) detail.push(`the cursor carries damage (${st.cursor.damage.join(', ')}) on the first frame of ${firstOfUnit.get(i)}, frame ${i}`)
    for (const kind of [...running.keys()]) if (!st.cursor.damage.includes(kind)) running.delete(kind)
    for (const kind of st.cursor.damage) {
      const from = running.get(kind) ?? i
      running.set(kind, from)
      const old = longest.get(kind)
      if (!old || i - from + 1 > old.frames) longest.set(kind, { frames: i - from + 1, from })
    }
  }
  if (scaleBad > 1) detail.push(`the cursor's world scale differs from frame 0 on ${scaleBad} frames`)
  if (armsBad > 1) detail.push(`the cursor has arms outside ${armsBeat} on ${armsBad} frames`)
  for (const [kind, l] of longest) if (l.frames / fps > c.cursor.damageHealSeconds + 1e-9) detail.push(`the damage "${kind}" lasts ${(l.frames / fps).toFixed(2)} s from frame ${l.from}, longer than cursor.damageHealSeconds (${c.cursor.damageHealSeconds})`)
  const want = c.film.beats.map((b) => b.id)
  if (order.join(' ') !== want.join(' ')) {
    const at = order.findIndex((id, i) => id !== want[i])
    detail.push(`the beats do not start in the order of film.beats: place ${at + 1} is ${order[at] ?? 'nothing'}, and film.beats has ${want[at] ?? 'nothing'} there`)
  }
  let withEvent = 0
  let inside = 0
  for (const b of c.film.beats) {
    if (!b.event) continue
    withEvent++
    const span = film.beats.find((x) => x.id === b.id)
    const frames = events.get(b.event) ?? []
    if (frames.some((f) => f >= span.first - tolerance && f <= span.last + tolerance)) {
      inside++
      continue
    }
    if (!frames.length) detail.push(`${b.id}: its event ${b.event} is never reported in the film`)
    else {
      const near = frames.reduce((best, f) => (Math.abs(f - (span.first + span.last) / 2) < Math.abs(best - (span.first + span.last) / 2) ? f : best))
      detail.push(`${b.id}: its event ${b.event} falls at ${(near / fps).toFixed(2)} s, outside the beat (${(span.first / fps).toFixed(2)} to ${((span.last + 1) / fps).toFixed(2)} s) by more than film.beatToleranceSeconds (${c.film.beatToleranceSeconds})`)
    }
  }
  const worst = [...longest.entries()].sort((a, b) => b[1].frames - a[1].frames)[0]
  return {
    pass: detail.length === 0,
    note: `the story: ${film.frameCount} frames read; ${order.length} beats reported, ${order.join(' ') === want.join(' ') ? 'in the order of film.beats' : 'NOT in the order of film.beats'}; ${inside} of ${withEvent} beats with an event report it inside the beat give or take ${c.film.beatToleranceSeconds} s; arms only in ${armsBeat}; one world scale (${scale}); no damage on a page's first frame; ${worst ? `the longest damage is "${worst[0]}" at ${(worst[1].frames / fps).toFixed(2)} s` : 'no damage in the film yet'}`,
    detail: few(detail, 30)
  }
}
