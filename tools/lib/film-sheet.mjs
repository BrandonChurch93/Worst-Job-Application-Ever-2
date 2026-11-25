// Contact sheets: pictures in a grid with a label strip under each one, never over it.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { label } from './image.mjs'
import { sheetGrid } from './film-plan.mjs'

const GROUND = '#1b1b1d'

// The named moments of --motion, each as the test an event must pass.
export const moments = {
  hit: { words: 'hit on the cursor', test: (e) => e.hitsCursor || /hit-cursor$/.test(e.name) },
  'page-turn': { words: 'page turn', test: (e) => e.name === 'page-turn' },
  reassembly: { words: 'reassembly', test: (e) => e.name === 'strips-zip' },
  bumper: { words: 'bumper hit', test: (e) => e.name === 'bumper' }
}

export const momentOf = (name) => moments[name] || { words: `event called ${name}`, test: (e) => e.name === name }

// Where in the film a moment is looked for first: the beats whose event it is, then the whole film.
export function searchRanges(plan, name, tolerance = 0) {
  const event = name === 'reassembly' ? 'strips-zip' : name === 'hit' ? null : name
  const pad = Math.round(tolerance * plan.fps)
  const out = []
  if (event && event !== 'page-turn') for (const b of plan.beats) if (b.event === event) out.push({ first: Math.max(0, b.first - pad), last: Math.min(plan.frameCount - 1, b.last + pad) })
  out.push({ first: 0, last: plan.frameCount - 1 })
  return out
}

// Finds the frame of a named moment from the events the film reports. Null when the film reports none.
export async function findMoment(session, plan, name, opts) {
  const { nth, unit, tolerance } = opts
  const moment = momentOf(name)
  const ranges = unit ? [{ first: unit.first, last: unit.last }] : searchRanges(plan, name, tolerance)
  for (const r of ranges) {
    let seen = 0
    for (let from = r.first; from <= r.last; from += 240) {
      const events = await session.page.evaluate(([first, last]) => {
        const out = []
        for (let i = first; i <= last; i++) for (const e of window.showcase.filmState(i).events) out.push({ frame: i, name: e.name, hitsCursor: e.hitsCursor })
        return out
      }, [from, Math.min(r.last, from + 239)])
      for (const e of events) if (moment.test(e) && ++seen === nth) return e
    }
  }
  return null
}

export const safe = (id) => String(id).replace(/[^a-zA-Z0-9]+/g, '_')

export const sheetName = (kind, id, format, tier, part = 0, of = 0) => ['sheet', kind, id ? safe(id) : null, of > 1 ? `${part}of${of}` : null, format, tier].filter(Boolean).join('-')

// Lays pictures out as one sheet. Each tile is { png, label }. The heading sits above the grid.
export async function composeSheet(tiles, file, { edge, heading = '', columns = 0, quality = 88 }) {
  const first = await sharp(tiles[0].png).metadata()
  const head = heading ? 28 : 0
  const g = sheetGrid(tiles.length, first.width, first.height, { edge, head, columns })
  const parts = []
  if (heading) parts.push({ input: await label(heading, g.width, head, { size: 15 }), left: 0, top: 0 })
  const top = head ? head + g.gap : 0
  for (let i = 0; i < tiles.length; i++) {
    const x = (i % g.columns) * (g.tileWidth + g.gap)
    const y = top + Math.floor(i / g.columns) * (g.tileHeight + g.labelHeight + g.gap)
    parts.push({ input: await sharp(tiles[i].png).resize(g.tileWidth, g.tileHeight, { fit: 'contain', background: GROUND }).png().toBuffer(), left: x, top: y })
    parts.push({ input: await label(tiles[i].label, g.tileWidth, g.labelHeight, { size: 13 }), left: x, top: y + g.tileHeight })
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await sharp({ create: { width: g.width, height: g.height, channels: 3, background: GROUND } }).composite(parts).jpeg({ quality, chromaSubsampling: '4:4:4' }).toFile(file)
  return g
}
