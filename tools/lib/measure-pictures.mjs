// The measures that read a picture: M1, M2, M3 and M8. Each renders the stills it needs once, one at a time, and reuses a still whose record still holds.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { at } from './paths.mjs'
import crypto from 'node:crypto'
import { openSession, renderJob, still } from './capture.mjs'
import { rawOf } from './image.mjs'
import { bareFloor, edgeCount, highFrequencyEnergy, m1, m2, m3, m8, notYet, tierCameras } from './measure-core.mjs'

const NEEDS = { M1: ['ids'], M2: ['texels'], M3: [], M8: ['coverage'] }
const DIR = path.join('measures', 'stills')

// What the views write, read back. A view is drawn without tone and grade, so a byte is the sRGB code of a linear value.
export const linear = (byte) => {
  const v = byte / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const LINEAR = Float32Array.from({ length: 256 }, (_, i) => linear(i))

// `ids`: a part's colour has one channel at full. A pixel under one half shows nothing at all.
export const isBareId = (r, g, b) => Math.max(LINEAR[r], LINEAR[g], LINEAR[b]) < 0.5

// `texels`: red is texels per pixel over `texelRange`, green is 1 where a texture is, blue is the blur circle over `cocRange`.
export function texelCount(data, width, height, channels, ranges, limits) {
  let textured = 0
  let counted = 0
  let soft = 0
  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    if (LINEAR[data[o + 1]] < 0.5) continue
    textured++
    if (LINEAR[data[o + 2]] * ranges.coc >= limits.focusCocPx) continue
    counted++
    if (LINEAR[data[o]] * ranges.texel < limits.minTexelsPerPixel) soft++
  }
  return { pixels: width * height, textured, counted, soft }
}

// `coverage`: black is bare floor, white marks it, the grey between is nothing.
export function coverageKinds(data, width, height, channels) {
  const kinds = new Uint8Array(width * height)
  for (let i = 0; i < kinds.length; i++) {
    const v = LINEAR[data[i * channels + 1]]
    kinds[i] = v > 0.6 ? 2 : v < 0.1 ? 1 : 0
  }
  return kinds
}

const argsOf = (st, tier, diag) => ({ [st.kind === 'key' ? 'key' : st.kind === 'still' ? 'id' : 'sheet']: st.id, tier, ...(diag ? { diag } : {}) })

export async function openPictures({ format, tier, views, ranges }) {
  let session = null
  const made = new Map()
  const stats = { rendered: 0, reused: 0 }

  async function picture(st, diag) {
    const key = `${st.name}|${diag || 'beauty'}`
    const hit = made.get(key)
    if (hit) return hit
    session ??= await openSession({ format, assets: 'full' })
    const out = await still(session, argsOf(st, tier, diag), { dir: DIR })
    stats[out.reused ? 'reused' : 'rendered']++
    made.set(key, out)
    return out
  }

  const measures = {
    async M1(unit, read, c) {
      const stills = []
      for (const st of read) {
        const beauty = await picture(st, null)
        const row = { name: st.name, camera: st.camera, invalidValues: beauty.record.invalidValues, edge: null, cursor: st.state ? st.state.cursor : null }
        if (st.camera === 'home' && !st.spec.interface && !st.spec.touchOnly) {
          const raw = await rawOf((await picture(st, 'ids')).file)
          row.edge = edgeCount(raw.data, raw.width, raw.height, raw.channels, isBareId)
        }
        stills.push(row)
      }
      return m1(stills, c)
    },
    async M2(unit, read, c) {
      const stills = []
      for (const st of read) {
        const raw = await rawOf((await picture(st, 'texels')).file)
        stills.push({ name: st.name, texels: texelCount(raw.data, raw.width, raw.height, raw.channels, ranges, c.detail) })
      }
      return m2(stills, c)
    },
    async M3(unit, read, c) {
      const keys = []
      const missing = []
      for (const st of read) {
        if (st.kind !== 'key') continue
        const file = st.image ? at(st.image) : null
        if (!file || !fs.existsSync(file)) {
          missing.push(st.name)
          continue
        }
        const raw = await rawOf((await picture(st, null)).file)
        const approved = await sharp(file).removeAlpha().resize(raw.width, raw.height, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true })
        keys.push({ name: st.name, still: highFrequencyEnergy(raw.data, raw.width, raw.height, raw.channels), approved: highFrequencyEnergy(approved.data, approved.info.width, approved.info.height, approved.info.channels) })
      }
      const r = m3(keys, c)
      if (missing.length) {
        r.numbers.keysWithoutApprovedImage = missing
        r.summary += `; no approved image for ${missing.join(', ')}`
      }
      return r
    },
    async M8(unit, read, c, s) {
      const table = s.showcase.tableState()
      const tiers = []
      for (const t of table.tiers) {
        const camera = tierCameras(c).find((x) => x.tier === t.id)?.camera
        const st = read.find((x) => x.kind === 'key' && x.camera === camera)
        let coverage = null
        if (st && st.state.cursor.ballScreenPx > 0) {
          const raw = await rawOf((await picture(st, 'coverage')).file)
          const radius = c.table.bareDistanceFraction * c.table.tierWidthBalls * st.state.cursor.ballScreenPx * (raw.width / c.formats.hd.width)
          coverage = { ...bareFloor(coverageKinds(raw.data, raw.width, raw.height, raw.channels), raw.width, raw.height, radius), radiusPx: Number(radius.toFixed(2)) }
        }
        tiers.push({ id: t.id, standingParts: t.standingParts, coverage, still: st ? st.name : `no key from ${camera}` })
      }
      const r = m8(tiers, c)
      for (const t of tiers) if (t.coverage && r.numbers.tiers?.[t.id]) Object.assign(r.numbers.tiers[t.id], { floorPixels: t.coverage.floor, floorPixelsInSight: t.coverage.open, barePixels: t.coverage.bare, radiusPx: t.coverage.radiusPx })
      return r
    }
  }

  return {
    stats,
    async measure(id, unit, read, s, c) {
      const missing = NEEDS[id].filter((v) => !views.includes(v))
      if (missing.length) return notYet(id, `the build has no \`${missing.join('`, `')}\` view yet`)
      return measures[id](unit, read, c, s)
    },
    async close() {
      if (session) await session.close()
    }
  }
}

// The check that a view never changes what `beauty` draws: after each view, the beauty still of the same moment is byte equal to the one made before any view.
export async function viewsLeaveBeauty({ format, tier, views, specs, frames }) {
  const session = await openSession({ format, assets: 'full' })
  const sha = (png) => crypto.createHash('sha256').update(png).digest('hex')
  const rows = []
  try {
    const jobs = [...specs.map((x) => ({ name: x.name, job: { kind: 'still', spec: { ...x.spec, tier } } })), ...frames.map((f) => ({ name: `film frame ${f}`, job: { kind: 'film', frame: f, tier } }))]
    for (const { name, job } of jobs) {
      const before = sha(await renderJob(session, { ...job, diag: 'beauty' }))
      for (const view of views) {
        if (view === 'beauty') continue
        const drawn = sha(await renderJob(session, { ...job, diag: view }))
        const after = sha(await renderJob(session, { ...job, diag: 'beauty' }))
        rows.push({ still: name, view, same: after === before, drawsSomethingElse: drawn !== before, before, after })
      }
    }
  } finally {
    await session.close()
  }
  return rows
}
