// The four moments of the compression stress, found from the keys of the config.
export const stressKeys = [
  { id: 'rest', key: 'step2-rest', words: 'a page at rest' },
  { id: 'fire', key: 'step1-fire', words: 'step 1 under fire' },
  { id: 'office', key: 'reply-all', words: 'the office tier in "Reply All"' },
  { id: 'boss', key: 'boss-fight', words: 'the boss fight' }
]

export function stressMoments(cfg, plan) {
  return stressKeys.map((m) => {
    const key = cfg.keys.find((k) => k.id === m.key)
    if (!key) throw new Error(`No key called "${m.key}" in the config, and the moment "${m.words}" is taken from it`)
    const beat = plan.beats.find((b) => b.id === key.beat)
    if (!beat) throw new Error(`The key ${m.key} names the beat ${key.beat}, which the film does not hold`)
    const unit = plan.units.find((u) => u.id === beat.unit)
    return { ...m, beat: beat.id, unit, frame: Math.min(beat.last, beat.first + Math.round((key.at === undefined ? 0.5 : key.at) * (beat.last - beat.first))) }
  })
}

export const stressName = (id, format, tier, mbps) => `stress-${id}-${format}-${tier}${mbps === undefined ? '' : `-${String(mbps).replace('.', 'p')}mbps`}`

// A box of the picture's own pixels round a place, kept inside the picture.
export function cropBox(x, y, width, height, w, h) {
  const cw = Math.min(w, width)
  const ch = Math.min(h, height)
  return { left: Math.round(Math.min(Math.max(0, x - cw / 2), width - cw)), top: Math.round(Math.min(Math.max(0, y - ch / 2), height - ch)), width: cw, height: ch }
}
