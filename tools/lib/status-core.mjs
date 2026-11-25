// Writes one status: its pictures under out/stills/status/ (replacing the last set), STATUS.md,
// the gallery file the inline display method needs, and "Latest pictures" in kit/PROGRESS.md.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { at, config, root, writeJson } from './paths.mjs'
import { addLook, readLooks } from './looks.mjs'
import { replaceBody } from './progress.mjs'

const statusDir = at('out', 'stills', 'status')
const galleryDir = at('out', 'work', 'status')

// PIL is present on this VM and on sandbox VMs (Phase 0 record). It keeps the tools free of a Node image library.
function resizeJpeg(src, dest, longEdge, quality = 82) {
  const py = [
    'import sys',
    'from PIL import Image',
    'im = Image.open(sys.argv[1]).convert("RGB")',
    'im.thumbnail((int(sys.argv[3]), int(sys.argv[3])), Image.LANCZOS)',
    'im.save(sys.argv[2], "JPEG", quality=int(sys.argv[4]))',
    'print(im.size[0], im.size[1])',
  ].join('\n')
  const out = execFileSync('python3', ['-c', py, src, dest, String(longEdge), String(quality)], { encoding: 'utf8' })
  const [w, h] = out.trim().split(' ').map(Number)
  return { w, h }
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

export function writeStatus({ number, phase, time, lines, pictures, links }) {
  const cfg = config()
  const max = cfg.status.maxPictures
  const edge = cfg.status.pictureLongEdgePx
  if (!pictures.length) throw new Error('status: a status never comes back empty, give it a picture')
  if (pictures.length > max) throw new Error(`status: ${pictures.length} pictures, the limit is ${max}`)
  for (const p of pictures) if (!fs.existsSync(p.file)) throw new Error(`status: no such picture ${p.file}`)

  fs.mkdirSync(statusDir, { recursive: true })
  for (const f of fs.readdirSync(statusDir)) fs.rmSync(path.join(statusDir, f))
  fs.mkdirSync(galleryDir, { recursive: true })

  const known = new Set(readLooks().map((l) => path.resolve(root, l.file)))
  const shown = []
  pictures.forEach((p, i) => {
    const name = `${String(i + 1).padStart(2, '0')}-${slug(p.name ?? path.basename(p.file))}.jpg`
    const dest = path.join(statusDir, name)
    const size = resizeJpeg(p.file, dest, edge)
    if (!known.has(path.resolve(p.file))) addLook(p.file, p.caption, p.by ?? 'builder')
    shown.push({ name, dest, caption: p.caption, ...size })
  })

  const stamp = time.slice(0, 16) + 'Z'
  const md = [
    '# Status pictures',
    '',
    `Time: ${stamp}. Phase ${phase}, status ${number}.`,
    '',
    ...shown.map((s, i) => `${i + 1}. \`${s.name}\`: ${s.caption}`),
    '',
  ].join('\n')
  fs.writeFileSync(path.join(statusDir, 'STATUS.md'), md)

  const gallery = {
    lines,
    pictures: shown.map((s) => ({
      caption: s.caption,
      src: 'data:image/jpeg;base64,' + fs.readFileSync(s.dest).toString('base64'),
    })),
    links,
  }
  const galleryFile = path.join(galleryDir, `status-${String(number).padStart(2, '0')}.json`)
  writeJson(galleryFile, gallery)

  replaceBody(
    'Latest pictures',
    [`Status ${number}, ${stamp}, Phase ${phase}.`, '', ...shown.map((s, i) => `${i + 1}. \`out/stills/status/${s.name}\`: ${s.caption}`)].join('\n'),
  )
  return { galleryFile, shown }
}
