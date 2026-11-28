// The scene the video is cut from, run in node: where the joins fall, the state at each, and the events between them.
import { logic } from './logic.mjs'

export async function scene() {
  const L = await logic()
  try {
    const st = await L.load('/src/stage/stage.ts')
    const cfg = await L.load('/src/config.ts')
    const plan = await L.load('/src/pages/step3/video/plan.ts')
    const pages = (await L.load('/src/pages/index.ts')).pages
    const unit = plan.VIDEO.unit
    const make = () => new st.Stage({ mode: 'film', flow: st.filmFlow(unit), pages, driver: new st.ScriptDriver(), film: st.filmOptions(unit) })
    const seconds = cfg.config.film.units.find((u) => u.id === unit).seconds
    const whole = make()
    whole.advance(Math.round(seconds * cfg.stepHz))
    const joins = plan.joinsOf(whole.events)
    const fps = cfg.config.film.fps
    const stage = make()
    const at = (frame) => {
      const step = plan.frameStep(frame)
      stage.advance(step - stage.step)
      return { join: { frame, step, time: step / cfg.stepHz, hash: stage.hash() }, state: { page: JSON.parse(JSON.stringify(stage.page.save())), cursor: JSON.parse(JSON.stringify(stage.cursor.save())) }, pose: stage.cursor.pose() }
    }
    const a = at(joins.from)
    const b = at(joins.to)
    const events = whole.events.filter((e) => e.step >= a.join.step && e.step < b.join.step).map((e) => ({ at: e.step - a.join.step, name: e.name, x: Number(e.x.toFixed(2)), y: Number(e.y.toFixed(2)), hits: e.hitsCursor }))
    const walk = [b.join.frame - 2, b.join.frame + 2].map((f) => whole.frameAt(f / fps).cursor)
    const still = Math.hypot(walk[1].x - walk[0].x, walk[1].y - walk[0].y) < 0.5
    return { unit, fps, stepHz: cfg.stepHz, unitStart: cfg.unitStart(unit), from: a.join, to: b.join, states: { from: a.state, to: b.state }, events, still, frames: joins.to - joins.from + 1 }
  } finally {
    await L.close()
  }
}
