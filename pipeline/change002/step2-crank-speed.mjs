import { logic } from '../../tools/lib/logic.mjs'
const { load, close } = await logic()
const { stepHz } = await load('/src/config.ts')
const { pages } = await load('/src/pages/index.ts')
const { Stage, ScriptDriver, filmFlow, filmOptions } = await load('/src/stage/stage.ts')
const s = new Stage({ mode: 'film', flow: filmFlow('step2'), pages, driver: new ScriptDriver(), film: filmOptions('step2') })
let b = NaN, lv = 0, rose = 0, stalled = 0, min = 1e9, max = 0, first = -1, last = -1, sum = 0
for (let i = 0; i < 30 * stepHz && s.page.id === 'step2'; i++) {
  s.advance(1)
  if (s.page.id !== 'step2') break
  const c = s.page.save().crank
  if (!Number.isNaN(b) && c.level > lv + 1e-12) {
    let d = c.b - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI
    const a = Math.abs(d) * 180 / Math.PI
    rose++; if (a < 1e-7) stalled++
    min = Math.min(min, a); max = Math.max(max, a); sum += a
    if (first < 0) first = i; last = i
  }
  b = c.b; lv = c.level
}
console.log('steps the level rose', rose, 'of them with a still crank', stalled, 'from', ((first + 1) / stepHz).toFixed(3), 'to', ((last + 1) / stepHz).toFixed(3), 's; crank turn per step, degrees: least', min.toFixed(3), 'most', max.toFixed(3), 'sum', sum.toFixed(0), '=', (sum / 360).toFixed(2), 'turns; most per film frame', (max * 4).toFixed(1))
await close()
