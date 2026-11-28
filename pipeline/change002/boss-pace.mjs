// node pipeline/change002/boss-pace.mjs --level high [--bot keen] [--seed 1] [--off name] [--out /tmp/pace-high.json]
// The boss page of the live build on the real clock, 1920 by 1080 at a pixel ratio of 1, played by a bot at one fixed level of the live picture.
// The time from one frame of the browser to the next is kept with the second of the page it fell in, and told for three stretches:
// the power-up (1 s before `power-up` to 1 s after the burst), the finish (`finish-arms` to `boss-gone` and 1 s more), and 5 s of plain fight.
// Outside the three stretches the page is stepped on without a picture, to 0.6 s before each (`--lead`); the seconds of `power-up` and `finish-arms` of that bot are given beforehand (`--power`, `--arms`) and read again from the page's events afterwards.
// With each frame the count of shader programs, geometries and textures the renderer holds, the draw calls and triangles of the frame, and the counts of the kept shadows (bakes, kept frames, live frames, camera moved, kept changed, movers, kept) are kept, then the lamps that shine and the lamps that draw a shadow in it, the names of the programs made since the frame before and the things shown for the first time with their material, so that a long frame can be laid beside a thing made new in it.
// `--only power`, `--only plain` or `--only finish` plays one stretch alone.
// `--ahead` builds, before the first frame of the run, the program of every material that is in the page's scene then, shown or hidden, to see what the long frames lose by it.
// Needs one line added to src/main.ts for the run only and never committed, after `let stage = makeStage()`:
//   ;(window as unknown as { __live: unknown }).__live = { stage: () => stage, app, level: () => size.level() }
// `--off` hides things for the run so that what they cost is seen: a list of names with commas, each a part (`part:boss-finish`), a named mesh (`name:arena-beam`), `lamps` or `shadows`.
import fs from 'node:fs'
import os from 'node:os'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const level = String(a.level ?? 'high')
const off = a.off ? String(a.off).split(',') : []
const burst = Number(a.burst ?? 1.653)
const session = await openSession({ format: 'hd', assets: 'web', mode: 'live', query: `&bot=${String(a.bot ?? 'keen')}&seed=${Number(a.seed ?? 1)}&step=4&quality=${level}` })
try {
  const card = await session.page.evaluate(() => {
    const gl = window.__live.app.engine.renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const c = document.getElementById('stage')
    return { renderer: String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)), vendor: String(gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR)), canvas: [c.width, c.height], window: [window.innerWidth, window.innerHeight], ratio: window.devicePixelRatio, level: window.__live.level() }
  })
  await session.page.evaluate(({ off: list, plan }) => {
    const live = window.__live
    const rows = []
    let last = -1
    const hide = () => {
      if (list.length === 0) return
      const scene = live.app.view.scene
      scene.traverse((o) => {
        for (const w of list) {
          if (w === 'lamps' && o.isPointLight) o.intensity = 0
          if (w === 'shadows' && o.isLight) o.castShadow = false
          if (w.startsWith('part:') && o.isMesh && o.userData.part === w.slice(5)) o.visible = false
          if (w.startsWith('name:') && o.name === w.slice(5)) o.visible = false
        }
      })
    }
    const scene = live.app.view.scene
    const was = scene.onBeforeRender
    scene.onBeforeRender = (...x) => { hide(); was.apply(scene, x) }
    const hz = 240
    const seen = (name) => { const e = live.stage().events.find((x) => x.name === name); return e ? e.step / hz : -1 }
    const skip = (to) => { const s = live.stage(); const n = Math.round((to - s.time) * hz); if (n > 0) s.advance(n) }
    let phase = plan.only === 'plain' ? 1 : plan.only === 'finish' ? 2 : 0
    skip((phase === 1 ? plan.plain : phase === 2 ? plan.arms : plan.power - 1) - plan.lead)
    const known = new Set()
    const mats = new Set()
    let first = true
    const fresh = () => {
      const info = live.app.engine.renderer.info
      const made = []
      for (const p of info.programs || []) if (!known.has(p.id)) { known.add(p.id); if (!first) made.push(p.name) }
      const shown = []
      live.app.view.scene.traverseVisible((o) => {
        if (!o.material) return
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (mats.has(m.uuid)) continue
          mats.add(m.uuid)
          if (first) continue
          let named = o
          while (named && !named.name) named = named.parent
          shown.push(`${named ? named.name : 'no name'}:${m.type}${m.name ? ':' + m.name : ''}`)
        }
      })
      first = false
      return [made, shown]
    }
    const tick = (t) => {
      const s = live.stage()
      const info = live.app.engine.renderer.info
      const news = fresh()
      if (last >= 0) rows.push([Math.round((t - last) * 100) / 100, Math.round(s.time * 1000) / 1000, info.programs ? info.programs.length : -1, info.memory.geometries, info.memory.textures, live.app.engine.lastCounts ? live.app.engine.lastCounts.drawCalls : -1, live.app.engine.lastCounts ? live.app.engine.lastCounts.triangles : -1, ...(live.app.engine.stillShadows ? [live.app.engine.stillShadows.bakes, live.app.engine.stillShadows.keptFrames, live.app.engine.stillShadows.liveFrames, live.app.engine.stillShadows.cameraMoved, live.app.engine.stillShadows.keptChanged, live.app.engine.stillShadows.movers, live.app.engine.stillShadows.kept] : [0, 0, 0, 0, 0, 0, 0]), ((live.app.rig && live.app.rig.lamps) || []).filter((l) => l.intensity > 0).length, ((live.app.rig && live.app.rig.lamps) || []).filter((l) => l.castShadow && l.shadow.autoUpdate).length, news])
      last = t
      const power = seen('power-up')
      const gone = seen('boss-gone')
      if (phase === 0 && power >= 0 && s.time >= power + plan.burst + 1 + 0.15) { if (plan.only) phase = 3; else { phase = 1; skip(plan.plain - plan.lead) } }
      else if (phase === 1 && s.time >= plan.plain + 5 + 0.15) { if (plan.only) phase = 3; else { phase = 2; skip(plan.arms - plan.lead) } }
      else if (phase === 2 && gone >= 0 && s.time >= gone + 1 + 0.15) phase = 3
      if (phase < 3 && s.page.id === 'step4') requestAnimationFrame(tick)
      else window.__pace.done = true
    }
    let ahead = -1
    if (plan.ahead) {
      const r = live.app.engine.renderer
      const before = r.info.programs ? r.info.programs.length : -1
      r.setRenderTarget(live.app.engine.acc.sample)
      r.compile(live.app.view.scene, live.app.camera)
      r.setRenderTarget(null)
      ahead = (r.info.programs ? r.info.programs.length : -1) - before
    }
    window.__pace = { rows, done: false, ahead }
    requestAnimationFrame(tick)
  }, { off, plan: { power: Number(a.power ?? 12.858), arms: Number(a.arms ?? 50.879), plain: Number(a.plain ?? 29), burst, lead: Number(a.lead ?? 0.6), only: a.only ? String(a.only) : '', ahead: a.ahead === true || a.ahead === 'true' } })
  let state = null
  for (;;) {
    await new Promise((r) => setTimeout(r, 10000))
    state = await session.page.evaluate(() => ({ done: window.__pace.done, n: window.__pace.rows.length, time: window.__live.stage().time, ms: window.__pace.rows.at(-1)?.[0] ?? -1 }))
    console.log(`frames ${state.n} second ${state.time.toFixed(2)} last frame ${state.ms} ms`)
    if (state.done) break
  }
  const got = await session.page.evaluate(() => ({ ahead: window.__pace.ahead, rows: window.__pace.rows, events: window.__live.stage().events.map((e) => [e.name, e.step]), level: window.__live.level() }))
  const hz = 240
  const at = (name) => { const e = got.events.find((x) => x[0] === name); return e ? e[1] / hz : -1 }
  const stretches = [
    { name: 'power-up', from: at('power-up') - 1, to: at('power-up') + burst + 1 },
    { name: 'finish', from: at('finish-arms'), to: at('boss-gone') + 1 },
    { name: 'plain fight', from: Number(a.plain ?? 29), to: Number(a.plain ?? 29) + 5 }
  ]
  const told = stretches.map((s) => {
    const ms = got.rows.filter((r) => r[1] >= s.from && r[1] < s.to).map((r) => r[0]).sort((x, y) => x - y)
    const q = (p) => (ms.length ? ms[Math.min(ms.length - 1, Math.floor(p * ms.length))] : -1)
    const share = (over) => (ms.length ? Math.round((1000 * ms.filter((v) => v > over).length) / ms.length) / 10 : -1)
    return { ...s, frames: ms.length, wall: Math.round(ms.reduce((x, y) => x + y, 0)) / 1000, median: q(0.5), p95: q(0.95), worst: ms.at(-1) ?? -1, over16: share(16.7), over33: share(33.3) }
  })
  const cpu = os.cpus()
  const result = { level, levelAtEnd: got.level, off, machine: { cores: cpu.length, cpu: cpu[0] ? cpu[0].model : 'unknown', browser: session.version }, card, stretches: told, events: got.events.filter((e, i, all) => all.findIndex((x) => x[0] === e[0]) === i).map((e) => [e[0], e[1] / hz]), rows: got.rows }
  fs.writeFileSync(String(a.out ?? `/tmp/pace-${level}.json`), JSON.stringify(result))
  console.log(JSON.stringify({ level, levelAtEnd: got.level, builtAhead: got.ahead, off, machine: result.machine, card }))
  for (const s of told) console.log(`${level} ${s.name}: second ${s.from.toFixed(3)} to ${s.to.toFixed(3)}, frames ${s.frames}, wall ${s.wall} s, median ${s.median} ms, p95 ${s.p95} ms, worst ${s.worst} ms, over 16.7 ms ${s.over16} %, over 33.3 ms ${s.over33} %`)
  if (session.problems.length) console.log('problems', session.problems.slice(0, 5).join(' | '))
} finally {
  await session.close()
}
