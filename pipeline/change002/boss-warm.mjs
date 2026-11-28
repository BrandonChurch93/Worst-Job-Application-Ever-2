// node pipeline/change002/boss-warm.mjs --level low [--format preview] [--bot keen] [--seed 1] [--from 3.2] [--seconds 15] [--out /tmp/warm-low.json]
// The boss page of the live build on the real clock, played by a bot at one fixed level of the live picture: stepped without a picture to `--from` seconds, then drawn.
// The time from one frame of the browser to the next is kept with the second of the page it fell in, the count of shader programs the renderer holds, and the names of the things whose materials are shown for the first time in it.
// Told for two stretches: the forming (`--from` to `boss-formed`) and the fight (`boss-formed` and `--seconds` more): the frames, the median, the frames over 33.3 ms, the longest, the frames over twice the median with their seconds, and the programs made.
// Needs one line added to src/main.ts for the run only and never committed, after `let stage = makeStage()`:
//   ;(window as unknown as { __live: unknown }).__live = { stage: () => stage, app, level: () => size.level() }
import fs from 'node:fs'
import os from 'node:os'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const level = String(a.level ?? 'low')
const seconds = Number(a.seconds ?? 15)
const session = await openSession({ format: String(a.format ?? 'preview'), assets: 'web', mode: 'live', query: `&bot=${String(a.bot ?? 'keen')}&seed=${Number(a.seed ?? 1)}&step=4&quality=${level}` })
try {
  const card = await session.page.evaluate(() => {
    const gl = window.__live.app.engine.renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const c = document.getElementById('stage')
    return { renderer: String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)), canvas: [c.width, c.height], ratio: window.devicePixelRatio, level: window.__live.level() }
  })
  await session.page.evaluate(({ from, seconds: span }) => {
    const live = window.__live
    const hz = 240
    const rows = []
    let last = -1
    const seen = (name) => { const e = live.stage().events.find((x) => x.name === name); return e ? e.step / hz : -1 }
    const s0 = live.stage()
    const n = Math.round((from - s0.time) * hz)
    if (n > 0) s0.advance(n)
    const known = new Set()
    const mats = new Set()
    let first = true
    const fresh = () => {
      const info = live.app.engine.renderer.info
      let made = 0
      for (const p of info.programs || []) if (!known.has(p.id)) { known.add(p.id); if (!first) made++ }
      const shown = []
      live.app.view.scene.traverseVisible((o) => {
        if (!o.material) return
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (mats.has(m.uuid)) continue
          mats.add(m.uuid)
          if (first) continue
          let named = o
          while (named && !named.name) named = named.parent
          shown.push(`${o.userData.part ?? ''}/${named ? named.name : ''}:${m.type}${m.name ? ':' + m.name : ''}`)
        }
      })
      first = false
      return [made, shown]
    }
    const tick = (t) => {
      const s = live.stage()
      const info = live.app.engine.renderer.info
      const news = fresh()
      if (last >= 0) rows.push([Math.round((t - last) * 100) / 100, Math.round(s.time * 1000) / 1000, info.programs ? info.programs.length : -1, news[0], news[1]])
      last = t
      const formed = seen('boss-formed')
      if (!(formed >= 0 && s.time >= formed + span + 0.15) && s.page.id === 'step4') requestAnimationFrame(tick)
      else window.__warm.done = true
    }
    window.__warm = { rows, done: false }
    requestAnimationFrame(tick)
  }, { from: Number(a.from ?? 3.2), seconds })
  let state = null
  for (;;) {
    await new Promise((r) => setTimeout(r, 10000))
    state = await session.page.evaluate(() => ({ done: window.__warm.done, n: window.__warm.rows.length, time: window.__live.stage().time }))
    console.log(`frames ${state.n} second ${state.time.toFixed(2)}`)
    if (state.done) break
  }
  const got = await session.page.evaluate(() => ({ rows: window.__warm.rows, events: window.__live.stage().events.map((e) => [e.name, e.step]), level: window.__live.level() }))
  const hz = 240
  const events = got.events.filter((e, i, all) => all.findIndex((x) => x[0] === e[0]) === i).map((e) => [e[0], e[1] / hz])
  const formed = events.find((e) => e[0] === 'boss-formed')[1]
  const told = [{ name: 'forming', from: Number(a.from ?? 3.2), to: formed }, { name: 'fight', from: formed, to: formed + seconds }].map((s) => {
    const rows = got.rows.filter((r) => r[1] >= s.from && r[1] < s.to)
    const ms = rows.map((r) => r[0]).sort((x, y) => x - y)
    const median = ms.length ? ms[Math.floor(ms.length / 2)] : -1
    const long = rows.filter((r) => r[0] > 2 * median)
    return { ...s, frames: ms.length, wall: Math.round(ms.reduce((x, y) => x + y, 0)) / 1000, median, over33: ms.filter((v) => v > 33.3).length, longest: ms.at(-1) ?? -1, long: long.map((r) => [r[1], r[0]]), programs: rows.reduce((x, r) => x + r[3], 0), made: rows.filter((r) => r[3] > 0).map((r) => [r[1], r[3], r[4]]) }
  })
  const cpu = os.cpus()
  fs.writeFileSync(String(a.out ?? `/tmp/warm-${level}.json`), JSON.stringify({ level, levelAtEnd: got.level, machine: { cores: cpu.length, cpu: cpu[0] ? cpu[0].model : 'unknown', browser: session.version }, card, stretches: told, events, rows: got.rows }))
  console.log(JSON.stringify({ level, levelAtEnd: got.level, card }))
  for (const s of told) {
    console.log(`${level} ${s.name}: second ${s.from.toFixed(3)} to ${s.to.toFixed(3)}, frames ${s.frames}, wall ${s.wall} s, median ${s.median} ms, over 33.3 ms ${s.over33}, longest ${s.longest} ms, over twice the median ${s.long.length}, programs made ${s.programs}`)
    console.log(`  long at ${s.long.map((r) => `${r[0]} s (${Math.round(r[1])} ms)`).join(', ')}`)
    for (const m of s.made) console.log(`  ${m[0]} s: ${m[1]} programs; first shown: ${m[2].join(', ')}`)
  }
  if (session.problems.length) console.log('problems', session.problems.slice(0, 5).join(' | '))
} finally {
  await session.close()
}
