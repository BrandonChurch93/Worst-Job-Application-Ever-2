// Seconds per frame of the film's renderer on this machine with several renderers at work at once.
//   node pipeline/change002/video-cores.mjs [--workers 4] [--frames 6] [--format preview] [--tier draft]
//   --slot K --of N   one renderer in its own process, at the place of worker K of N (run N of them at once)
// Each worker opens its own session and renders neighbouring frames of the pinball scene from its own place in the span; the first frame of each (which carries the run of the scene to that place) is left out of the mean.
import path from 'node:path'
import { args, at, writeJson } from '../../tools/lib/paths.mjs'
import { openSession, renderJob } from '../../tools/lib/capture.mjs'
import { machine } from '../../tools/lib/browser.mjs'
import { clock, seconds } from '../../tools/lib/film-encode.mjs'
import { scene } from '../../tools/lib/pinball-video-scene.mjs'

const a = args()
const workers = Math.max(1, Number(a.workers || 4))
const count = Math.max(2, Number(a.frames || 6))
const format = a.format || 'preview'
const tier = a.tier || 'draft'
const of = Number(a.of || workers)
const slot = a.slot !== undefined ? Number(a.slot) : null
const sc = await scene()
const base = Math.round(sc.unitStart * sc.fps)
const t0 = clock()
const rows = await Promise.all((slot === null ? Array.from({ length: workers }, (_, w) => w) : [slot]).map(async (w) => {
  const session = await openSession({ format, assets: 'full', mode: 'capture' })
  try {
    const first = sc.from.frame + Math.round((sc.frames * (w + 0.5)) / of)
    const list = []
    for (let i = 0; i < count; i++) {
      const t = clock()
      await renderJob(session, { kind: 'film', frame: base + first + i, tier })
      list.push(Number(seconds(t).toFixed(2)))
    }
    return { worker: w, firstFrame: first, seconds: list, mean: Number((list.slice(1).reduce((s, v) => s + v, 0) / (count - 1)).toFixed(2)) }
  } finally {
    await session.close()
  }
}))
const mean = rows.reduce((s, r) => s + r.mean, 0) / rows.length
const report = { machine: machine(), format, tier, workers: slot === null ? workers : 1, slot, of, framesEach: count, rows, meanSecondsPerFrameOfOneWorker: Number(mean.toFixed(2)), framesPerMinuteTogether: Number(((60 / mean) * (slot === null ? workers : of)).toFixed(2)), wholeSpanHours: Number(((sc.frames * mean) / (slot === null ? workers : of) / 3600).toFixed(2)), wallSeconds: Number(seconds(t0).toFixed(1)) }
writeJson(path.join(at('out', 'work', 'pinball-video'), `cores-${format}-${tier}-${slot === null ? workers : `${slot}of${of}`}.json`), report)
console.log(JSON.stringify(report))
