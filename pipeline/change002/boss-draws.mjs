// node pipeline/change002/boss-draws.mjs --runs "44/25,32,44" --out /tmp/draws [--format hd] [--tier draft]
// One record for every time the renderer draws its shadow maps inside a film frame, taken right before they are drawn: what each light of the rig holds, which things each light's shadow map is given, and in which order the things are then drawn into the picture.
// `aimed` is filled only when the rig's aim() is given a line, for the run only, that pushes what it was handed onto globalThis.__aim.
// A time is a second of the boss unit, or `unit:second`. Needs one line added to src/main.ts for the run only and never committed: ;(window as unknown as { __app: unknown }).__app = app
import fs from 'node:fs'
import path from 'node:path'
import { args, config } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { filmPlan } from '../../tools/lib/film-plan.mjs'

const a = args()
const plan = filmPlan(config())
const out = String(a.out ?? '/tmp/draws')
fs.mkdirSync(out, { recursive: true })
const runs = String(a.runs ?? '44/25,32,44').split('/').map((r) => r.split(',').map((w) => {
  const [id, second] = w.includes(':') ? w.split(':') : ['boss', w]
  const unit = plan.units.find((u) => u.id === id)
  if (!unit) throw new Error(`no film unit ${id}`)
  return { unit, t: Number(second) }
}))

const install = () => {
  const app = window.__app
  const rig = app.rig
  const shadowMap = app.engine.renderer.shadowMap
  const draw = shadowMap.render
  let proto = Object.getPrototypeOf(app.view.scene)
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'onBeforeShadow')) proto = Object.getPrototypeOf(proto)
  const where = (o) => { const p = []; let x = o; while (x && x.parent) { p.unshift(`${x.name || x.type}.${x.parent.children.indexOf(x)}`); x = x.parent } return p.join('/') }
  const names = new Map()
  let now = null
  let last = null
  window.__draws = []
  window.__aim = []
  proto.onBeforeShadow = function (_r, object, _camera, shadowCamera, geometry) {
    if (!now) return
    const e = shadowCamera.matrixWorld.elements
    const key = `${names.get(shadowCamera) ?? 'other'} face ${Math.round(e[8])},${Math.round(e[9])},${Math.round(e[10])}`
    const at = where(object)
    ;(now.cast[key] ??= []).push(at)
    const s = geometry.boundingSphere
    if (s) now.spheres[at] = [s.center.x, s.center.y, s.center.z, s.radius]
  }
  proto.onBeforeRender = function (_r, _scene, _camera, _geometry, material) {
    if (last) last.drawn.push(`${where(this)}${material && material.transparent ? ' see-through' : ''}`)
  }
  const light = (l, slot) => {
    const c = l.shadow.camera
    const w = l.matrixWorld.elements
    return { name: l.name, slot, at: [w[12], w[13], w[14]], distance: l.distance ?? null, intensity: l.intensity, colour: l.color.toArray(), casts: l.castShadow, inScene: l.parent !== null,
      near: c.near, far: c.far, p10: c.projectionMatrix.elements[10], p14: c.projectionMatrix.elements[14], frame: [c.left ?? null, c.right ?? null, c.top ?? null, c.bottom ?? null],
      needsUpdate: l.shadow.needsUpdate, autoUpdate: l.shadow.autoUpdate, strength: l.shadow.intensity, bias: l.shadow.bias, normalBias: l.shadow.normalBias, radius: l.shadow.radius, mapSize: l.shadow.mapSize.toArray(),
      map: l.shadow.map ? [l.shadow.map.width, l.shadow.map.height, l.shadow.map.texture.version, l.shadow.map.depthTexture ? l.shadow.map.depthTexture.version : null] : null }
  }
  shadowMap.render = function (lights, scene, camera) {
    now = { tag: window.__tag ?? null, given: lights.map((l) => l.name), lights: [light(rig.key, -1), light(rig.dome, -1), ...rig.lamps.map((l, i) => light(l, i))], view: Array.from(camera.matrixWorld.elements), aimed: window.__aim.splice(0), cast: {}, spheres: {}, drawn: [] }
    last = now
    for (const l of lights) names.set(l.shadow.camera, l.name)
    window.__draws.push(now)
    const done = draw.call(this, lights, scene, camera)
    now.after = rig.lamps.slice(0, 2).map((l) => ({ needsUpdate: l.shadow.needsUpdate, far: l.shadow.camera.far, p10: l.shadow.camera.projectionMatrix.elements[10], map: l.shadow.map ? [l.shadow.map.width, l.shadow.map.texture.version] : null }))
    now = null
    return done
  }
}

for (const [i, run] of runs.entries()) {
  const session = await openSession({ format: String(a.format ?? 'hd'), assets: 'full' })
  try {
    await session.page.evaluate(install)
    for (const [j, { unit, t }] of run.entries()) {
      const frame = Math.min(unit.last, unit.first + Math.round(t * plan.fps))
      await session.page.evaluate((tag) => { window.__tag = tag }, `${unit.id} ${t}`)
      const png = await renderJob(session, { kind: 'film', frame, tier: String(a.tier ?? 'draft') })
      const name = `run${i}-${j}-t${t.toFixed(1)}`
      fs.writeFileSync(path.join(out, `${name}.png`), png)
      const draws = await session.page.evaluate(() => { const d = window.__draws; window.__draws = []; return d })
      fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(draws))
      console.log(`run ${i} ${unit.id} second ${t} frame ${frame} ${name}: ${draws.length} draws`)
    }
  } finally {
    await session.close()
  }
}
