// The rough cut's timeline: which approved image each frame shows, and the view on it.
export const ease = (t) => t * t * (3 - 2 * t)

export function clampView([cx, cy, z]) {
  const zoom = Math.max(1, z)
  const half = 0.5 / zoom
  const inside = (v) => Math.min(1 - half, Math.max(half, v))
  return [inside(cx), inside(cy), zoom]
}

export function timeline(cfg, plan) {
  const fps = cfg.film.previewFps
  const { width, height } = cfg.formats.preview
  const images = new Map([...cfg.keys, ...cfg.sheets].map((k) => [k.id, k]))
  const segments = []
  const dips = []
  let unitStart = 0
  let prev = null
  for (const unit of cfg.film.units) {
    const beats = cfg.film.beats.filter((b) => b.unit === unit.id)
    if (segments.length) dips.push({ at: Math.round(unitStart * fps), frames: plan.dipFrames, why: `the page turns to ${unit.id}` })
    for (const beat of beats) {
      const parts = plan.beats[beat.id]
      if (!parts?.length) throw new Error(`rough cut: the plan has no entry for beat ${beat.id}`)
      parts.forEach((part, i) => {
        const image = images.get(part.image)
        if (!image) throw new Error(`rough cut: ${beat.id} names ${part.image}, which is no key and no sheet`)
        const a = part.at ?? 0
        const b = parts[i + 1]?.at ?? 1
        const span = beat.to - beat.from
        const first = Math.round((unitStart + beat.from + a * span) * fps)
        const last = Math.round((unitStart + beat.from + b * span) * fps)
        if (last <= first) throw new Error(`rough cut: ${beat.id} part ${i} has no frames`)
        const held = Boolean(prev && prev.image === part.image && !part.from && !part.turn)
        const from = clampView(part.from ?? (held ? prev.to : [0.5, 0.5, 1]))
        const seg = { beat: beat.id, unit: unit.id, image: part.image, file: image.image, imageUnit: image.unit, first, last, from, to: clampView(part.to), held, turn: Boolean(part.turn) }
        if (part.turn) dips.push({ at: first, frames: plan.dipFrames, why: `the page turns inside ${beat.id}` })
        segments.push(seg)
        prev = seg
      })
    }
    unitStart += unit.seconds
  }
  return { fps, width, height, total: Math.round(unitStart * fps), segments, dips }
}

export function viewAt(seg, frame) {
  const t = ease((frame - seg.first) / (seg.last - seg.first))
  const z = Math.exp(Math.log(seg.from[2]) + (Math.log(seg.to[2]) - Math.log(seg.from[2])) * t)
  return clampView([seg.from[0] + (seg.to[0] - seg.from[0]) * t, seg.from[1] + (seg.to[1] - seg.from[1]) * t, z])
}

// 1 away from a page turn, falling to nearly 0 on the two frames beside it.
export function brightnessAt(dips, frame) {
  let level = 1
  for (const d of dips) {
    const away = frame < d.at ? d.at - frame : frame - d.at + 1
    if (away <= d.frames) level = Math.min(level, ease((away - 0.5) / d.frames))
  }
  return level
}

export function segmentAt(tl, frame) {
  return tl.segments.find((s) => frame >= s.first && frame < s.last)
}

// Everything the kit asks of the rough cut that can be read off the timeline. Returns the list of faults.
export function faults(cfg, tl) {
  const out = []
  const fps = tl.fps
  const wanted = Math.round(cfg.film.units.reduce((s, u) => s + u.seconds, 0) * fps)
  if (tl.total !== wanted) out.push(`the timeline holds ${tl.total} frames, the film has ${wanted}`)
  let at = 0
  for (const s of tl.segments) {
    if (s.first !== at) out.push(`${s.beat} starts at frame ${s.first}, expected ${at}`)
    at = s.last
  }
  if (at !== tl.total) out.push(`the last part ends at frame ${at}, expected ${tl.total}`)
  const order = [...new Set(tl.segments.map((s) => s.beat))]
  const beats = cfg.film.beats.map((b) => b.id)
  if (order.join() !== beats.join()) out.push('the beats are not in the order of film.beats')
  let unitStart = 0
  const starts = {}
  for (const u of cfg.film.units) {
    starts[u.id] = unitStart
    unitStart += u.seconds
  }
  for (const b of cfg.film.beats) {
    const first = Math.round((starts[b.unit] + b.from) * fps)
    const last = Math.round((starts[b.unit] + b.to) * fps)
    const own = tl.segments.filter((s) => s.beat === b.id)
    if (!own.length || own[0].first !== first || own[own.length - 1].last !== last) out.push(`${b.id} does not fill frames ${first} to ${last}`)
  }
  for (const k of cfg.keys) {
    const b = cfg.film.beats.find((x) => x.id === k.beat)
    const frame = Math.min(tl.total - 1, Math.round((starts[b.unit] + b.from + k.at * (b.to - b.from)) * fps))
    const shown = segmentAt(tl, frame)
    if (shown?.image !== k.id) out.push(`key ${k.id} is not on screen at its own moment, frame ${frame} shows ${shown?.image}`)
  }
  for (const s of tl.segments) {
    if (s.imageUnit !== s.unit && !s.turn) out.push(`${s.beat} shows ${s.image}, an image of unit ${s.imageUnit}`)
    for (const v of [s.from, s.to]) {
      const half = 0.5 / v[2]
      if (v[0] - half < -1e-9 || v[0] + half > 1 + 1e-9 || v[1] - half < -1e-9 || v[1] + half > 1 + 1e-9) out.push(`${s.beat} looks outside ${s.image}`)
    }
  }
  const turns = tl.dips.map((d) => d.at)
  let edge = 0
  cfg.film.units.forEach((u, i) => {
    if (i > 0 && !turns.includes(Math.round(edge * fps))) out.push(`no page turn at the start of ${u.id}`)
    edge += u.seconds
  })
  if (brightnessAt(tl.dips, 0) !== 1) out.push('frame 0 is not a finished picture')
  return out
}
