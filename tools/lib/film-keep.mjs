// What npm run keep -- --film needs to decide without reading a film: which files are whole preview films, whether one is of this build, and what its record says.
const MB = 1024 * 1024

export const keptNames = (cfg) => ({ a: cfg.export.files.previewA, b: cfg.export.files.previewB })

// True for the name of a whole film in formats.preview: no range of frames and no diagnostic view in it.
export function isWholePreview(name, which, cfg) {
  const tiers = Object.keys(cfg.tiers).join('|')
  return new RegExp(`^film-${which}-${cfg.formats.preview.id || 'preview'}-(${tiers})\\.${cfg.export.container}$`).test(name)
}

export function previewFrames(cfg) {
  return Math.round(cfg.film.units.reduce((n, u) => n + u.seconds, 0) * cfg.film.previewFps)
}

// Why a film's record is not one to keep. An empty list means it may be kept.
export function reasonsAgainst(record, info, cfg, which) {
  const out = []
  const film = record && record.what && record.what.film
  if (!film) return ['its record does not say it is a film']
  if (film.which !== which) out.push(`its record says it is film ${String(film.which).toUpperCase()}`)
  if (film.first !== undefined || film.last !== undefined) out.push('it is a range of the film, not the film')
  const stale = []
  if (record.engineHash !== info.engineHash) stale.push('the engine')
  if (record.sharedHash !== undefined && info.sharedHash !== undefined && record.sharedHash !== info.sharedHash) stale.push('the shared assets')
  for (const u of cfg.film.units.map((x) => x.id)) if (!record.pageHashes || record.pageHashes[u] !== info.pageHashes[u]) stale.push(u)
  if (stale.length) out.push(`it is not of this build: ${stale.join(', ')} changed since it was rendered`)
  if (record.complete !== true) out.push(`it is not the whole film${record.missingUnits && record.missingUnits.length ? `: it lacks ${record.missingUnits.join(', ')}` : ''}`)
  if (record.format !== 'preview') out.push(`its format is ${record.format}, not preview`)
  if (record.diagnostic && record.diagnostic !== 'beauty') out.push(`it is the ${record.diagnostic} view, not the picture`)
  if (film.rate !== cfg.film.previewFps) out.push(`its rate is ${film.rate}, film.previewFps is ${cfg.film.previewFps}`)
  const b = previewFrames(cfg)
  if (which === 'b' && record.frames !== b) out.push(`it holds ${record.frames} frames, film.units at film.previewFps is ${b}`)
  if (which === 'a' && (record.opening !== true || !(record.frames > b))) out.push(`it holds ${record.frames} frames and ${record.opening === true ? 'an' : 'no'} opening, film A is the opening and the ${b} frames of film B`)
  return out
}

// What the file itself must agree with: the frames, the size and the rate its record gives.
export function reasonsFromProbe(probe, record, cfg) {
  const out = []
  const f = cfg.formats.preview
  if (probe.frames !== record.frames) out.push(`the file holds ${probe.frames} frames, its record says ${record.frames}`)
  if (probe.width !== f.width || probe.height !== f.height) out.push(`the file is ${probe.width} by ${probe.height}, formats.preview is ${f.width} by ${f.height}`)
  if (probe.rate !== cfg.film.previewFps) out.push(`the file's rate is ${probe.rate}, film.previewFps is ${cfg.film.previewFps}`)
  return out
}

export const tooLarge = (bytes, cfg) => bytes >= cfg.repo.maxFileMb * MB
export const megabytes = (bytes) => Number((bytes / MB).toFixed(2))

// The record that lies beside a kept film.
export function keptRecord(record, cfg, which, { commit, commitClean, from, sha256, bytes, probe }) {
  const b = previewFrames(cfg)
  return {
    film: which, file: keptNames(cfg)[which], engineHash: record.engineHash, sharedHash: record.sharedHash, pageHashes: record.pageHashes, commit, commitClean,
    format: record.format, tier: record.tier, assets: record.assets, rate: record.what.film.rate, frames: record.frames, openingFrames: which === 'a' ? record.frames - b : 0,
    codec: probe.codec, width: probe.width, height: probe.height, seconds: probe.seconds, mbps: probe.mbps, sound: probe.audio || null, soundFrom: record.sound || null,
    sha256, bytes, megabytes: megabytes(bytes), keptFrom: from, browser: record.browser, machine: record.machine, standIns: record.standIns
  }
}
