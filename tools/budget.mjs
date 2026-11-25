// npm run budget: what a picture costs on this machine, and what the films and the loop would take.
import fs from 'node:fs'
import { args, at, config, readJson, writeJson } from './lib/paths.mjs'
import { openSession } from './lib/capture.mjs'
import { buildInfo } from './lib/hashes.mjs'
import { machine } from './lib/browser.mjs'
import { replaceBody, sectionBody } from './lib/progress.mjs'

const a = args()
const c = config()
const now = () => Number(process.hrtime.bigint()) / 1e9
const page = a.page || c.lookLockUnit
const count = (tier) => c.tiers[tier].samplesPerFrame
const formats = (a.formats ? String(a.formats).split(',') : Object.values(c.formats).map((f) => f.id)).map((id) => Object.values(c.formats).find((f) => f.id === id))
const filmSeconds = c.film.units.reduce((s, u) => s + u.seconds, 0)
const loopSeconds = c.deliver.cardLoop.seconds
const out = at('out', 'work', 'budget', 'budget.json')
const kept = a.merge && fs.existsSync(out) ? readJson(out) : null
const rows = kept ? kept.formats.filter((r) => !formats.some((f) => f.id === r.format)) : []

for (const f of formats) {
  const measureFinal = f.id !== 'uhd' || Boolean(a.all)
  let t = now()
  const session = await openSession({ format: f.id })
  const open = now() - t
  try {
    const stillTime = async (tier) => {
      const t0 = now()
      await session.page.evaluate(async (spec) => {
        await window.showcase.renderStill(spec)
        window.showcase.pictureStats()
      }, { page, camera: 'home', tier })
      return now() - t0
    }
    const cold = await stillTime('draft')
    const draft = await stillTime('draft')
    const review = await stillTime('review')
    const perSample = (review - draft) / (count('review') - count('draft'))
    const fixed = Math.max(0, draft - count('draft') * perSample)
    const finalPredicted = fixed + count('final') * perSample
    const final = measureFinal ? await stillTime('final') : null

    const unitStart = c.film.units.slice(0, c.film.units.findIndex((u) => u.id === page)).reduce((s, u) => s + u.seconds, 0)
    const first = Math.round((unitStart + 2) * c.film.fps)
    const frames = f.id === 'uhd' ? 3 : 5
    const times = []
    for (let i = 0; i < frames; i++) {
      const t0 = now()
      await session.page.evaluate(async ([n, tier]) => window.showcase.renderFilmFrame(n, tier), [first + i, 'draft'])
      times.push(now() - t0)
    }
    const frameDraft = times.slice(1).reduce((s, x) => s + x, 0) / (times.length - 1)
    const frameAt = (tier) => frameDraft + (count(tier) - count('draft')) * perSample

    const unitSeconds = c.film.units.find((u) => u.id === page).seconds
    const far = Math.round((unitStart + unitSeconds * 0.9) * c.film.fps)
    await session.page.evaluate((n) => window.showcase.filmState(n), Math.round(unitStart * c.film.fps))
    t = now()
    await session.page.evaluate((n) => window.showcase.filmState(n), far)
    const simulatedSecond = (now() - t) / (unitSeconds * 0.9)

    const info = await session.page.evaluate(() => window.showcase.info())
    rows.push({
      format: f.id, width: f.width, height: f.height, page,
      open, cold, startCost: open + (cold - draft), perSample, fixed,
      still: { draft, review, final, finalPredicted },
      frame: { draft: frameDraft, review: frameAt('review'), final: frameAt('final'), firstFrame: times[0] },
      simulatedSecond, counts: info.counts[page], target: info.versions.target
    })
    console.log(`${f.id}: open ${open.toFixed(1)} s, cold draft ${cold.toFixed(1)} s, warm draft ${draft.toFixed(1)} s, review ${review.toFixed(1)} s, final ${final === null ? `${finalPredicted.toFixed(1)} s predicted` : `${final.toFixed(1)} s (predicted ${finalPredicted.toFixed(1)})`}, per sample ${perSample.toFixed(2)} s, fixed ${fixed.toFixed(2)} s, film frame at draft ${frameDraft.toFixed(1)} s, one simulated second ${(simulatedSecond * 1000).toFixed(1)} ms`)
  } finally {
    await session.close()
  }
}

rows.sort((x, y) => x.width - y.width)
const hours = (s) => (s / 3600 < 10 ? (s / 3600).toFixed(1) : String(Math.round(s / 3600)))
const jobs = []
for (const r of rows) {
  const fps = r.format === 'preview' ? c.film.previewFps : c.film.fps
  for (const tier of Object.keys(c.tiers)) {
    const filmFrames = Math.round(filmSeconds * fps)
    const loopFrames = Math.round(loopSeconds * c.film.fps)
    jobs.push({ format: r.format, tier, fps, filmFrames, filmSeconds: filmFrames * r.frame[tier] + r.startCost, loopFrames, loopSeconds: loopFrames * r.frame[tier] + r.startCost })
  }
}
const info = buildInfo(at())
const m = machine()
writeJson(out, { engineHash: info.engineHash, pageHashes: info.pageHashes, machine: m, scene: page, formats: rows, jobs })

const s1 = (v) => (v === null ? 'not measured' : `${v.toFixed(1)} s`)
const table = [
  `Measured by \`npm run budget\` on the ${rows[0].counts ? `scene of \`${page}\` as it stands (${rows[0].counts.triangles} triangles, ${rows[0].counts.drawCalls} draw calls a sample)` : `scene of \`${page}\``}, on ${m.host}: ${m.cores} cores, ${m.cpu}, software rendering, target \`${rows[0].target}\`. Engine \`${info.engineHash}\`. One render process.`,
  '',
  '| Format | Size | Open the page | Cold first picture | Start cost | Per sample | Fixed per picture | Still, draft | Still, review | Still, final | One simulated second |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map((r) => `| \`${r.format}\` | ${r.width} by ${r.height} | ${s1(r.open)} | ${s1(r.cold)} | ${s1(r.startCost)} | ${r.perSample.toFixed(2)} s | ${r.fixed.toFixed(2)} s | ${s1(r.still.draft)} | ${s1(r.still.review)} | ${r.still.final === null ? `${r.still.finalPredicted.toFixed(1)} s predicted` : `${s1(r.still.final)} (predicted ${r.still.finalPredicted.toFixed(1)} s)`} | ${(r.simulatedSecond * 1000).toFixed(1)} ms |`),
  '',
  `What the films and the loop would take on one VM like this one, from the time of a film frame (measured at \`draft\`, the other tiers from the cost of a sample). Film B is ${filmSeconds} s, the loop ${loopSeconds} s at ${c.film.fps} frames a second.`,
  '',
  '| Format | Tier | Film frame | Film B frames | Film B | Loop frames | Loop |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...jobs.map((j) => {
    const r = rows.find((x) => x.format === j.format)
    return `| \`${j.format}\` | ${j.tier} | ${r.frame[j.tier].toFixed(1)} s | ${j.filmFrames} at ${j.fps} fps | ${hours(j.filmSeconds)} h | ${j.loopFrames} | ${hours(j.loopSeconds)} h |`
  })
].join('\n')
const notes = sectionBody('Render budget').split(/\n\n+/).filter((b) => b.startsWith('- '))
replaceBody('Render budget', [table, ...notes].join('\n\n'))
console.log(`budget: written to ${out} and to "Render budget" in kit/PROGRESS.md`)
