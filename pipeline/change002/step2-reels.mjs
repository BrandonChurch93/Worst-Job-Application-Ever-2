// The share of visits in which a visitor with a person's timing stops all three reels of the date of birth on their own date.
// node pipeline/change002/step2-reels.mjs [visits] [speeds as a,b,c in legends a second]
// The visitor knows the order of a reel, so sees its own legend coming. It sets off its press when the legend is REACT seconds from the middle of the window, and the press lands REACT seconds later, give or take SCATTER (one standard deviation, drawn from a seeded source).
// A second visitor does not look ahead: it sets off when its own legend has become the nearest to the middle, and lands REACT seconds later, give or take SCATTER.
import { logic } from '../../tools/lib/logic.mjs'

const REACT = 0.25
const SCATTER = 0.06
const visits = Number(process.argv[2] ?? 300)
const speeds = process.argv[3] ? process.argv[3].split(',').map(Number) : null

const { load, close } = await logic()
const { stepHz, config } = await load('/src/config.ts')
const { pages } = await load('/src/pages/index.ts')
const { SLOT } = await load('/src/pages/step2/layout.ts')
const { reelPos, reelWindow } = await load('/src/pages/step2/index.ts')
const { Stage } = await load('/src/stage/stage.ts')
if (speeds) for (let r = 0; r < 3; r++) SLOT.speed[r] = speeds[r]

function source(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { next, bell: () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next()) }
}
const mod = (a, n) => ((a % n) + n) % n
const two = (n) => String(n).padStart(2, '0')

function visit(n, ahead) {
  const rng = source(config.seed * 7919 + n * 104729 + (ahead ? 1 : 2))
  const date = two(1 + Math.floor(rng.next() * 12)) + two(1 + Math.floor(rng.next() * 28)) + String(1950 + Math.floor(rng.next() * 56))
  const due = [-1, -1, -1]
  let held = 0
  const driver = {
    name: 'bot',
    input(v) {
      const st = v.page.save()
      const h = v.page.hint()
      const base = h ? { x: h.dodge ? h.dodge.x : h.x, y: h.dodge ? h.dodge.y : h.y, down: h.down } : { x: 300, y: 900, down: false }
      if (st.field === 1 && st.open < 0 && st.birth.focus && st.birth.fill === '' && st.birth.typed.length < 8) return { ...base, key: date[st.birth.typed.length] }
      if (st.open === 1 && st.slot.phase === 'spin') {
        const r = st.slot.stopped.findIndex((x) => x < 0)
        if (r < 0) return { ...base, down: false }
        const len = SLOT.strips[r].length
        const pos = reelPos(st.slot, r)
        const at = { x: SLOT.reelX(r) + SLOT.reelW / 2, y: SLOT.stopY + SLOT.stopH / 2 }
        if (due[r] < 0) {
          const to = mod(st.slot.own[r] - pos, len) / SLOT.speed[r]
          const off = mod(pos - st.slot.own[r] + len / 2, len) - len / 2
          const go = ahead ? to <= REACT : Math.abs(off) <= 0.5
          if (go) due[r] = v.pageStep + Math.max(1, Math.round((REACT + SCATTER * rng.bell()) * stepHz))
        }
        if (due[r] >= 0 && v.pageStep >= due[r] && held === 0) held = 3
        if (held > 0) {
          held--
          return { ...at, down: held > 0 }
        }
        return { ...at, down: false }
      }
      return base
    }
  }
  const s = new Stage({ mode: 'live', flow: [{ page: 'step2' }, { page: 'step3' }], pages, driver, seed: config.seed + n })
  let slot = null
  let steps = 0
  for (let i = 0; i < 60 * stepHz && s.page.id === 'step2'; i++) {
    s.advance(1)
    if (s.page.id !== 'step2') break
    steps++
    const st = s.page.save()
    if (st.slot.stopped.every((x) => x >= 0)) slot = { win: st.slot.win, off: [0, 1, 2].map((r) => { const len = SLOT.strips[r].length; return mod(st.slot.to[r] - st.slot.own[r] + len / 2, len) - len / 2 }) }
  }
  const names = s.events.filter((e) => e.page === 'step2').map((e) => e.name)
  return { date, slot, steps, coins: names.includes('coins'), hit: names.includes('date-hit'), miss: names.includes('date-miss') }
}

console.log(`reels turn at ${SLOT.speed.join(', ')} legends a second: a legend is the nearest for ${[0, 1, 2].map((r) => Math.round(reelWindow(r))).join(', ')} ms`)
for (const ahead of [true, false]) {
  let paid = 0
  let missed = 0
  let none = 0
  let long = 0
  const reel = [0, 0, 0]
  const far = {}
  for (let n = 0; n < visits; n++) {
    const v = visit(n, ahead)
    if (!v.slot) { none++; continue }
    if (v.hit && v.coins) paid++
    if (v.miss) missed++
    long += v.steps
    v.slot.off.forEach((o, r) => { if (o === 0) reel[r]++ })
    const worst = Math.max(...v.slot.off.map(Math.abs))
    far[worst] = (far[worst] ?? 0) + 1
  }
  console.log(`${ahead ? 'sees its legend coming' : 'waits for its legend'}: ${visits} visits, ${paid} paid coins (${((100 * paid) / visits).toFixed(1)}%), ${missed} took the missed line, ${none} never stopped the reels; each reel on its own legend ${reel.map((k) => ((100 * k) / visits).toFixed(1) + '%').join(', ')}; farthest reel off by legends ${JSON.stringify(far)}; mean visit ${(long / Math.max(1, visits - none) / stepHz).toFixed(1)} s`)
}
await close()
