// node pipeline/change002/boss-geo.mjs [--step 4] [--from 29 | --after candidate-sensed] [--frames 300] [--level low] [--bot keen] [--seed 1] [--out /tmp/geo.json]
// One page of the live build on the stepped clock (`clock=steps`), 960 by 540, played by a bot: stepped without a picture to `--from` seconds, then drawn frame by frame, one sixtieth of a second each.
// `--after` steps on without a picture, a quarter of a second at a time, until the page has told that event, in place of `--from`.
// With every frame the count of geometries the renderer holds is kept, and every geometry on a mesh of the page's scene is followed from the frame it is first seen:
// who holds it (the part, the mesh's name and the shape's id without its number), whether it is still in the scene, whether its holder is shown, and whether it was let go.
// Needs one line added to src/main.ts for the run only and never committed, after `let stage = makeStage()`:
//   ;(window as unknown as { __live: unknown }).__live = { stage: () => stage, app, level: () => size.level() }
import fs from 'node:fs'
import { args } from '../../tools/lib/paths.mjs'
import { openSession } from '../../tools/lib/capture.mjs'

const a = args()
const frames = Number(a.frames ?? 300)
const from = Number(a.from ?? 29)
const session = await openSession({ format: 'preview', assets: 'web', mode: 'live', query: `&bot=${String(a.bot ?? 'keen')}&seed=${Number(a.seed ?? 1)}&step=${Number(a.step ?? 4)}&quality=${String(a.level ?? 'low')}&clock=steps` })
try {
  await session.page.evaluate(({ to, after }) => {
    const live = window.__live
    const gap = to - live.stage().time
    if (after) for (let i = 0; i < 400 && !live.stage().events.some((e) => e.name === after); i++) window.liveRun.advance(0.25, true)
    else if (gap > 0) window.liveRun.advance(gap, true)
    const seen = new Map()
    const rows = []
    const look = (n) => {
      const here = new Set()
      const walk = (o, shown) => {
        const on = shown && o.visible
        if (o.isMesh || o.isPoints || o.isLine) {
          const g = o.geometry
          here.add(g.uuid)
          let e = seen.get(g.uuid)
          if (!e) {
            const shape = String(o.userData.shape ?? '').replace(/[0-9]+/g, '#')
            let named = o
            while (named && !named.name) named = named.parent
            e = { who: `${o.userData.part ?? 'no part'} | ${named ? named.name : 'no name'} | ${shape}`, first: n, last: n, gone: -1, shown: on }
            seen.set(g.uuid, e)
            g.addEventListener('dispose', () => { e.gone = window.__geo.n })
          }
          e.last = n
          e.shown = on
        }
        for (const c of o.children) walk(c, on)
      }
      walk(live.app.view.scene, true)
      for (const [id, e] of seen) e.here = here.has(id)
    }
    window.__geo = { n: -1, rows, seen, look }
  }, { to: from, after: a.after ? String(a.after) : '' })
  for (let n = 0; n < frames; n++) {
    const row = await session.page.evaluate((i) => {
      const live = window.__live
      window.__geo.n = i
      window.liveRun.advance(1 / 60, false)
      window.__geo.look(i)
      const info = live.app.engine.renderer.info
      const s = live.stage()
      const r = [i, Math.round(s.time * 1000) / 1000, info.memory.geometries, info.memory.textures, info.programs ? info.programs.length : -1, s.page.id]
      window.__geo.rows.push(r)
      return r
    }, n)
    if (n % 30 === 0 || n === frames - 1) console.log(`frame ${row[0]} second ${row[1]} geometries ${row[2]} textures ${row[3]} programs ${row[4]} page ${row[5]}`)
  }
  const got = await session.page.evaluate(() => ({ rows: window.__geo.rows, seen: [...window.__geo.seen.values()], level: window.__live.level(), events: window.__live.stage().events.map((e) => [e.name, e.step]) }))
  const groups = new Map()
  for (const e of got.seen) {
    const g = groups.get(e.who) ?? { who: e.who, seen: 0, atStart: 0, madeLater: 0, letGo: 0, heldShown: 0, heldHidden: 0, outNotLetGo: 0 }
    g.seen++
    if (e.first === 0) g.atStart++
    else g.madeLater++
    if (e.gone >= 0) g.letGo++
    else if (e.here && e.shown) g.heldShown++
    else if (e.here) g.heldHidden++
    else g.outNotLetGo++
    groups.set(e.who, g)
  }
  const list = [...groups.values()].sort((x, y) => y.madeLater - x.madeLater)
  const counts = got.rows.map((r) => r[2])
  const result = { step: Number(a.step ?? 4), from, frames, level: got.level, first: counts[0], last: counts.at(-1), least: Math.min(...counts), most: Math.max(...counts), at: [0, 60, 120, 180, 240, 299].filter((i) => i < counts.length).map((i) => [i, counts[i]]), rows: got.rows, groups: list, events: got.events.filter((e, i, all) => all.findIndex((x) => x[0] === e[0]) === i) }
  fs.writeFileSync(String(a.out ?? '/tmp/geo.json'), JSON.stringify(result))
  console.log(`geometries held: first frame ${result.first}, last frame ${result.last}, least ${result.least}, most ${result.most}; at frames ${result.at.map((p) => p.join(': ')).join(', ')}`)
  for (const g of list.filter((x) => x.madeLater > 0 || x.heldHidden > 0 || x.outNotLetGo > 0).slice(0, 40)) console.log(`${g.who}: seen ${g.seen}, there at the first frame ${g.atStart}, made later ${g.madeLater}, let go ${g.letGo}, held and shown ${g.heldShown}, held and hidden ${g.heldHidden}, out of the scene and not let go ${g.outNotLetGo}`)
  if (session.problems.length) console.log('problems', session.problems.slice(0, 5).join(' | '))
} finally {
  await session.close()
}
