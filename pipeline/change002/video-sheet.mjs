// Two sheets for a report on the video.
//   node pipeline/change002/video-sheet.mjs joins <out.jpg> <folder of one size from video-join.mjs> <x,y of the join in crop> <x,y of the join out crop> [w h]
//       one row a join: the live frame, the video's frame, their difference times 8, each cut at full size (no scaling)
//   node pipeline/change002/video-sheet.mjs twelve <out.jpg> <video file>
//       twelve frames of the video spread evenly from its first to its last, four in a row
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
const [kind, out, src, ...rest] = process.argv.slice(2)
const GAP = 6
if (kind === 'joins') {
  const [a, b, w = '396', h = '300'] = rest
  const W = Number(w), H = Number(h)
  const rows = [['in', a], ['out', b]]
  const parts = []
  for (const [r, [name, at]] of rows.entries()) {
    const [x, y] = at.split(',').map(Number)
    for (const [c, file] of [`${name}-live.png`, `${name}-video.png`, `${name}-diff-x8.png`].entries()) {
      const input = await sharp(path.join(src, file)).extract({ left: x, top: y, width: W, height: H }).png().toBuffer()
      parts.push({ input, left: c * (W + GAP), top: r * (H + GAP) })
    }
  }
  await sharp({ create: { width: 3 * W + 2 * GAP, height: 2 * H + GAP, channels: 3, background: '#ff00ff' } }).composite(parts).jpeg({ quality: 92 }).toFile(out)
} else {
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets,r_frame_rate', '-of', 'json', src]).toString()).streams[0]
  const n = Number(probe.nb_read_packets)
  const W = 294, H = Math.round((W * 9) / 16)
  const parts = []
  const tmp = fs.mkdtempSync('/tmp/twelve-')
  const list = Array.from({ length: 12 }, (_, k) => Math.round((k * (n - 1)) / 11))
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `select=${list.map((f) => `eq(n\\,${f})`).join('+')},scale=${W}:${H}`, '-fps_mode', 'passthrough', path.join(tmp, '%02d.png')])
  list.forEach((f, k) => {
    parts.push({ input: path.join(tmp, `${String(k + 1).padStart(2, '0')}.png`), left: (k % 4) * (W + GAP), top: Math.floor(k / 4) * (H + GAP) })
    console.log(`picture ${k + 1}: frame ${f} of ${n}, video second ${(f / 60).toFixed(2)}`)
  })
  await sharp({ create: { width: 4 * W + 3 * GAP, height: 3 * H + 2 * GAP, channels: 3, background: '#ff00ff' } }).composite(parts).jpeg({ quality: 90 }).toFile(out)
}
