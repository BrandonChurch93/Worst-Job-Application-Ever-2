// node pipeline/change002/boss-tops.mjs --second 53.2 --views "beauty,lights.key" --out /tmp/tops [--format hd] [--tier draft]
// One film frame of the boss unit drawn once for each view named: the picture as it is, or the picture under one group of lights alone with the room's mirrored light off.
// A view that is not there fails with the list of the groups there are.
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const out = String(a.out ?? '/tmp/tops')
fs.mkdirSync(out, { recursive: true })
const unit = plan.units.find((u) => u.id === 'boss')
const frame = Math.min(unit.last, unit.first + Math.round(Number(a.second ?? 53.2) * plan.fps))
const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
try {
  for (const view of String(a.views ?? 'beauty').split(',')) {
    try {
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft'), diag: view })
      const file = path.join(out, `${view}-f${frame}.png`)
      fs.writeFileSync(file, png)
      console.log(`view ${view} frame ${frame} ${file}`)
    } catch (e) {
      console.log(`view ${view}: ${String(e.message).split('\n')[0]}`)
    }
  }
  // `--tops`: shares of the mirrored light the top faces of what stands keep, tried in the page without a change to the source.
  // Needs one line added to src/main.ts for the run only and never committed, before the diagnostic is set: ;(window as unknown as { __app: unknown }).__app = app
  for (const k of a.tops ? String(a.tops).split(',').map(Number) : []) {
    const told = await session.page.evaluate((share) => {
      const scene = window.__app.view.scene
      const bodies = scene.getObjectByName('arena-pillars')
      if (!bodies) return 'no pillars'
      const metal = bodies.material
      let meshes = 0
      let tops = 0
      scene.traverse((o) => {
        if (!o.isMesh || o.material !== metal) return
        meshes++
        const g = o.geometry
        const n = g.getAttribute('normal')
        const c = new Float32Array(n.count * 3).fill(1)
        if (o === bodies) for (let i = 0; i < n.count; i++) if (n.getZ(i) > 0.9) { c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = share; tops++ }
        g.setAttribute('color', new n.constructor(c, 3))
      })
      metal.vertexColors = true
      metal.needsUpdate = true
      return `meshes of that metal ${meshes}, top corners ${tops}`
    }, k)
    console.log(`tops ${k}: ${told}`)
    const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
    const file = path.join(out, `tops-${k}-f${frame}.png`)
    fs.writeFileSync(file, png)
    console.log(`tops ${k} frame ${frame} ${file}`)
  }
  // `--finish "0.45:1,0.6:0.85"`: a finish of their own for the top faces of what stands, tried in the page without a change to the source: the roughness, then the share of the mirrored light kept.
  // The bodies are drawn in two groups for the trial, the sides with the metal as it is and the tops with a copy of it. Needs the same line in src/main.ts.
  for (const pair of a.finish ? String(a.finish).split(',') : []) {
    const [rough, share] = pair.split(':').map(Number)
    const told = await session.page.evaluate(({ rough, share }) => {
      const scene = window.__app.view.scene
      const bodies = scene.getObjectByName('arena-pillars')
      if (!bodies) return 'no pillars'
      const g = bodies.geometry
      if (!Array.isArray(bodies.material)) {
        const metal = bodies.material
        const n = g.getAttribute('normal')
        const index = g.getIndex()
        const arr = index.array
        const count = Number.isFinite(g.drawRange.count) ? g.drawRange.count : arr.length
        const sides = []
        const tops = []
        for (let i = 0; i < count; i += 3) (n.getZ(arr[i]) > 0.9 && n.getZ(arr[i + 1]) > 0.9 && n.getZ(arr[i + 2]) > 0.9 ? tops : sides).push(arr[i], arr[i + 1], arr[i + 2])
        arr.set(sides, 0)
        arr.set(tops, sides.length)
        index.needsUpdate = true
        g.clearGroups()
        g.addGroup(0, sides.length, 0)
        g.addGroup(sides.length, tops.length, 1)
        const top = metal.clone()
        top.onBeforeCompile = metal.onBeforeCompile
        top.customProgramCacheKey = metal.customProgramCacheKey
        bodies.material = [metal, top]
        window.__tops = { sides: sides.length / 3, tops: tops.length / 3, was: metal.roughness }
      }
      const [metal, top] = bodies.material
      top.roughness = rough
      top.color.copy(metal.color).multiplyScalar(share)
      top.envMapIntensity = metal.envMapIntensity
      return `side faces ${window.__tops.sides}, top faces ${window.__tops.tops}, roughness ${window.__tops.was} to ${rough}, share ${share}`
    }, { rough, share })
    console.log(`finish ${pair}: ${told}`)
    const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
    const file = path.join(out, `finish-${rough}-${share}-f${frame}.png`)
    fs.writeFileSync(file, png)
    console.log(`finish ${pair} frame ${frame} ${file}`)
  }
} finally {
  await session.close()
}
