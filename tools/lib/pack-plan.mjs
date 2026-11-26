// What a critic's pack holds, worked out from the config alone: the pictures, their order, how they are split over critics and the neutral names. No browser here.
import fs from 'node:fs'
import { at } from './paths.mjs'
import { filmPlan, spread, stepOf, timeLabel } from './film-plan.mjs'
import { lookRoles } from './pack-look.mjs'
import { SITE, siteLines, siteRoles } from './pack-site.mjs'

export const FORMAT = 'png'
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const BANNED = /\b(render\w*|target\w*|approved|generated|final|draft|webgl|shader\w*|raster\w*|path.?trac\w*|ray.?trac\w*|bak(e|ed|ing)|stand.?ins?)\b/i

export const setName = (index) => LETTERS[index]
export const fileName = (set, n) => `set-${set}-${String(n).padStart(2, '0')}.${FORMAT}`
export const roundName = (n) => `round-${String(n).padStart(3, '0')}`
export const pairName = (set, n, side) => `set-${set}-${String(n).padStart(2, '0')}-${side}.${FORMAT}`
export const neutral = (name) => /^set-[A-Z]-\d{2}(-[ab])?\.[a-z]+$/.test(name) && !BANNED.test(name)

// What each pinball camera is for, from the camera column of the beat table in kit/01-FILM.md and the table of images in kit/06-ASSETS.md.
export const cameraPurpose = {
  'table-wide': "the whole machine in frame, seen from the player's end",
  'table-map': 'the whole machine from straight above: where every part of every tier is',
  'tier-3': 'the Corporate tier as one screen, from straight above, with the ball in play',
  'tier-2': 'the Office tier as one screen, from straight above, with the ball in play',
  'tier-1': 'the Street tier as one screen, from straight above, with the ball in play',
  rail: 'fixed above the ball on the wire ramp, looking down and a little ahead, the cursor seen inside the ball',
  'table-lobby': 'a close view: low on the carpet, the ball at the lobby doors as they slam, the tower above',
  'table-replyall': 'a close view: the steel balls pouring out of the tray and chasing the ball',
  'table-fired': 'a close view: tight on the firehouse as the ball is fired out',
  'table-save': 'a close view: low, from just above the flippers, as a flipper catches the ball at the last instant'
}

// The pinball cameras, each with the key or sheet that gives its moment.
export function pinballCameras(cfg) {
  const out = []
  for (const id of Object.keys(cfg.cameras)) {
    if (id === 'home' || id === 'sheet') continue
    const key = cfg.keys.find((k) => k.camera === id)
    const sheet = cfg.sheets.find((s) => s.camera === id)
    if (!key && !sheet) continue
    out.push({ camera: id, purpose: cameraPurpose[id] || cfg.cameras[id].note, from: key ? { key: key.id } : { sheet: sheet.id }, tall: Boolean(!key && sheet && sheet.height > sheet.width) })
  }
  return out
}

const range = (frames, fps) => `${timeLabel(frames[0], fps)} to ${timeLabel(frames[frames.length - 1], fps)}`

// The groups of the blockout pack, in the order of its section of kit/07-QUALITY-BAR.md. A group is kept whole in one critic's set.
export function blockoutGroups(cfg) {
  const plan = filmPlan(cfg)
  const fps = cfg.film.fps
  const count = cfg.critics.contactSheetFrames
  const step = stepOf(fps, cfg.film.previewFps)
  const units = plan.units
  const pages = units.map((u, i) => ({ kind: 'page', unit: u.id, heading: `Page ${i + 1} of ${units.length}, at rest` }))
  const crops = [{ kind: 'type-crops', units: units.map((u) => u.id), heading: `Type at its real size. Each picture is a window cut out of a page, so the window's edge may cut a line the page shows whole. Two windows of each page: pages 1 to ${units.length}` }]
  const screen = [
    { kind: 'screen', screen: 'live', heading: 'The application as a visitor has it, with its controls' },
    { kind: 'screen', screen: 'film', heading: 'The film as a visitor has it, stopped at its start, with its controls' },
    { kind: 'control-crops', heading: 'The controls at their real size' }
  ]
  const film = []
  for (const u of units) {
    const seconds = (u.last - u.first + 1) / fps
    const sheets = Math.max(1, Math.ceil(seconds / (count * 2)))
    const frames = spread(u.first, u.last, count * sheets, step)
    for (let s = 0; s < sheets; s++) film.push({ kind: 'film-sheet', unit: u.id, frames: frames.slice(s * count, (s + 1) * count) })
  }
  film.forEach((f, i) => (f.heading = `The film in order, sheet ${i + 1} of ${film.length}: ${range(f.frames, fps)}`))
  const beats = plan.beats.filter((b) => b.unit === 'step1')
  const beatSheets = beats.map((b, i) => {
    const frames = spread(b.first, b.last, count, step)
    return { kind: 'beat-sheet', unit: 'step1', beat: b.id, frames, heading: `Step 1, beat ${i + 1} of ${beats.length}: ${range(frames, fps)}` }
  })
  const cams = pinballCameras(cfg)
  const wide = cams.filter((c) => !c.tall && (c.camera === 'table-wide' || /^tier-/.test(c.camera)))
  const close = cams.filter((c) => !c.tall && !wide.includes(c))
  const tall = cams.filter((c) => c.tall)
  const cameras = []
  if (wide.length) cameras.push({ kind: 'cameras', unit: 'pinball', cameras: wide, heading: 'Pinball cameras: the whole machine and the three tiers' })
  if (close.length) cameras.push({ kind: 'cameras', unit: 'pinball', cameras: close, heading: 'Pinball cameras: the close views' })
  for (const c of tall) cameras.push({ kind: 'cameras', unit: 'pinball', cameras: [c], heading: 'Pinball camera: the map' })
  return [
    { id: 'pages', items: [...pages, ...crops, ...screen] },
    { id: 'film', items: film },
    { id: 'beats', items: beatSheets },
    { id: 'cameras', items: cameras }
  ]
}

// Splits groups over critics: whole groups, in order, each set no larger than `most`. A group larger than `most` is cut into runs of whole pictures.
export function splitGroups(groups, most) {
  const sets = []
  const room = (s) => most - s.items.length
  for (const g of groups) {
    let items = [...g.items]
    while (items.length > most) {
      sets.push({ groups: [g.id], items: items.slice(0, most) })
      items = items.slice(most)
    }
    const home = sets.find((s) => room(s) >= items.length)
    if (home) {
      home.groups.push(g.id)
      home.items.push(...items)
    } else sets.push({ groups: [g.id], items })
  }
  return sets
}

export const roles = {
  'R4-blockout': { critic: 'R4', section: 'R4 blockout · Phase 2 only', unit: 'blockout', phase: 2, groups: blockoutGroups },
  ...lookRoles
}

// The role of a pack: the unit `site` has its own packs under the names of the critics that judge it.
export const roleOf = (role, unit) => (unit === SITE ? siteRoles[role] : roles[role])
export const rolesOf = (unit) => Object.keys(unit === SITE ? siteRoles : roles)

// The whole plan of one pack: its sets, and for each file its neutral name and what it is.
export function packPlan(cfg, { role, round, unit, facts = null }) {
  const r = roleOf(role, unit)
  if (!r) throw new Error(`No pack is defined for the role "${role}"${unit === SITE ? ' of the unit "site"' : ''} yet. Defined: ${rolesOf(unit).join(', ')}`)
  if (unit && r.unit && unit !== r.unit) throw new Error(`The role ${role} judges the unit "${r.unit}", not "${unit}"`)
  if (!r.unit && !unit) throw new Error(`The role ${role} needs --unit`)
  const sets = splitGroups(r.groups(cfg, unit, facts), cfg.critics.maxFilesPerMessage).map((s, i) => {
    const name = setName(i)
    let n = 0
    const files = s.items.map((item) => {
      if (item.side !== 'b') n += 1
      return { name: item.side ? pairName(name, n, item.side) : fileName(name, n), ...item }
    })
    return { set: name, critic: r.unit ? `reviewer-${String(i + 1).padStart(2, '0')}` : `${role}-${i + 1}`, groups: s.groups, files }
  })
  return { role, critic: r.critic, section: r.section, round, unit: unit || r.unit, sets }
}

const sectionOf = (text, heading) => {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.trim() === `### ${heading}`)
  if (start < 0) throw new Error(`kit/07-QUALITY-BAR.md has no section "${heading}"`)
  let end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l))
  if (end < 0) end = lines.length
  return lines.slice(start, end).join('\n').trim()
}

// What a critic is sent, apart from its files: its own section word for word, the severity scale word for word, and the return format.
export function briefFor(plan, set, text = fs.readFileSync(at('kit', '07-QUALITY-BAR.md'), 'utf8')) {
  const lines = text.split('\n')
  const open = lines.findIndex((l) => l.trim() === '```json')
  const shut = lines.findIndex((l, i) => i > open && l.trim() === '```')
  const format = lines.slice(open, shut + 1).join('\n')
  const rule = lines.slice(shut + 1).find((l) => l.startsWith('- `score` is'))
  const s = plan.sets.find((x) => x.set === set)
  if (plan.critic === 'R2') return lines.find((l) => l.startsWith('> You will see one image.')).slice(2)
  const settled = s.files.filter((f) => f.side === 'a' && f.settled).map((f) => ['Settled', `${f.name} and ${f.name.replace('-a.', '-b.')}`, ...f.settled.map((l) => `- ${l}`)].join('\n'))
  const part = plan.sets.length > 1 ? `Your ${s.files.length} files, ${s.files[0].name} to ${s.files[s.files.length - 1].name}, are one part of the pack. Judge what your files show.` : `Your ${s.files.length} files are ${s.files[0].name} to ${s.files[s.files.length - 1].name}.`
  const section = sectionOf(text, plan.section)
  return [
    plan.unit === SITE ? siteLines(section) : section,
    sectionOf(text, 'The severity scale'),
    ['### The return format', '', `Return one JSON object, with "critic" set to "${plan.critic}".`, '', format, '', rule].join('\n'),
    ...settled,
    [part, 'Send that JSON object, and nothing else, as a message to /root.'].join('\n')
  ].join('\n\n')
}
