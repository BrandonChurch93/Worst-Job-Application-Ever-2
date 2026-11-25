// The simulation's checkpoints along the film: made in Node from the stage as the capture page makes it, kept as files, and replayed to prove them.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex')
export const text = (saved) => JSON.stringify(saved)
export const fileOf = (unit, frame, step) => `${unit}-${String(frame).padStart(6, '0')}-step-${String(step).padStart(5, '0')}.json`

// The frame of the film a step of a page falls in.
export const frameOf = (unitFirst, step, stepHz, fps) => unitFirst + Math.floor((step * fps) / stepHz + 1e-9)

// The stage of one page of the film, as src/app.ts makes it.
export const stageOf = (S, pages, unit) => new S.Stage({ mode: 'film', flow: S.filmFlow(unit), pages, driver: new S.ScriptDriver(), film: S.filmOptions(unit) })

// Runs one page of the film from its start to its end and gives its checkpoints.
export function checkpointsOf(S, pages, unit, cfg, unitFirst) {
  const stepHz = cfg.sim.stepHz
  const every = Math.round(cfg.sim.checkpointSeconds * stepHz)
  const end = Math.round(unit.seconds * stepHz)
  const stage = stageOf(S, pages, unit.id)
  const out = []
  const keep = (why) => {
    const saved = text(stage.save())
    out.push({ unit: unit.id, step: stage.step, frame: frameOf(unitFirst, stage.step, stepHz, cfg.film.fps), page: stage.page.id, why, text: saved, sha256: sha256(saved), bytes: Buffer.byteLength(saved) })
  }
  keep('page')
  let index = stage.entryIndex
  while (stage.step < end - 1) {
    stage.advance(1)
    const turned = stage.entryIndex !== index
    index = stage.entryIndex
    if (turned) keep('page')
    else if (stage.step % every === 0) keep('time')
  }
  return out
}

// Starts a fresh stage at one checkpoint, runs it to the step of the next and says whether the state reached is the next one, byte for byte.
export function replay(S, pages, unit, from, to) {
  const stage = stageOf(S, pages, unit)
  if (from.step > 0) {
    stage.restore(JSON.parse(from.text))
    stage.goto(from.step)
  }
  const started = text(stage.save())
  stage.advance(to.step - stage.step)
  const reached = text(stage.save())
  return { startEqual: started === from.text, equal: reached === to.text, reached: sha256(reached) }
}

// The checkpoint a chunk that starts on a frame should start from: the last one of its page at or before the first step of that frame.
export function nearest(index, unit, frame) {
  const first = index.units[unit]
  if (first === undefined) return null
  const step = Math.round(((frame - first) * index.stepHz) / index.fps)
  let best = null
  for (const c of index.checkpoints) if (c.unit === unit && c.step <= step && (!best || c.step > best.step)) best = c
  return best
}

export const sameBuild = (index, info) => Boolean(index && info && index.engineHash === info.engineHash && index.sharedHash === info.sharedHash && JSON.stringify(index.pageHashes) === JSON.stringify(info.pageHashes))

export function readIndex(dir) {
  const file = path.join(dir, 'index.json')
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

// The text of a checkpoint as it is on disk, or null when the file is gone or is not the one the index names.
export function readCheckpoint(dir, c) {
  const file = path.join(dir, c.file)
  if (!fs.existsSync(file)) return null
  const saved = fs.readFileSync(file, 'utf8')
  return sha256(saved) === c.sha256 ? saved : null
}
