// The encoders of the pinball video and the measure of a file against the frames it was made from.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ffmpeg, probe } from './film-encode.mjs'

// The canvas is full range sRGB. The file is BT.709 in limited range and says so, which is what every browser takes a video without tags to be.
const COLOUR = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv']
const TO_VIDEO = 'scale=in_range=pc:out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p'

export const CODECS = {
  h264: { ext: 'mp4', mime: 'video/mp4; codecs="avc1.64002A"', args: (q) => ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.2', '-crf', String(q), '-bf', '2', '-movflags', '+faststart'] },
  vp9: { ext: 'webm', mime: 'video/webm; codecs="vp09.00.41.08"', args: (q) => ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(q + 12), '-deadline', 'good', '-cpu-used', '2', '-row-mt', '1'] }
}

export function encode(dir, out, { codec, rate, quality, sound = null, soundKbps = 192 }) {
  const c = CODECS[codec]
  if (!c) throw new Error(`No encoder set up for "${codec}"`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const g = String(Math.round(rate))
  const audio = sound ? ['-i', sound] : []
  const track = sound ? ['-c:a', codec === 'h264' ? 'aac' : 'libopus', '-b:a', `${soundKbps}k`, '-shortest'] : ['-an']
  ffmpeg(['-framerate', String(rate), '-start_number', '0', '-i', path.join(dir, '%06d.png'), ...audio, '-vf', TO_VIDEO, ...c.args(quality), '-g', g, '-keyint_min', g, ...COLOUR, ...track, out], `encoding ${path.basename(out)}`)
  return probe(out)
}

// PSNR and SSIM of every picture of the file against the frame it was made from, both taken back to full range RGB.
export function compare(file, dir, rate, work) {
  const logs = { psnr: path.join(work, 'psnr.log'), ssim: path.join(work, 'ssim.log') }
  const back = 'scale=in_range=tv:in_color_matrix=bt709:out_range=pc:flags=accurate_rnd+full_chroma_int+bitexact,format=gbrp'
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-framerate', String(rate), '-start_number', '0', '-i', path.join(dir, '%06d.png'),
    '-lavfi', `[0:v]${back},split[a1][a2];[1:v]format=gbrp,split[b1][b2];[a1][b1]psnr=stats_file=${logs.psnr};[a2][b2]ssim=stats_file=${logs.ssim}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`comparing ${path.basename(file)}: ${(r.stderr || '').trim().split('\n').slice(-4).join('\n')}`)
  const read = (f, key) => fs.readFileSync(f, 'utf8').trim().split('\n').map((line) => Number((line.match(new RegExp(`${key}:([0-9.inf]+)`)) || [])[1]))
  const psnr = read(logs.psnr, 'psnr_avg').map((v) => (Number.isFinite(v) ? v : 99))
  const ssim = read(logs.ssim, 'All')
  const n = psnr.length
  const picks = Array.from({ length: Math.min(30, n) }, (_, i) => Math.round((i * (n - 1)) / Math.max(1, Math.min(30, n) - 1)))
  const sum = (list) => ({ mean: Number((list.reduce((s, v) => s + v, 0) / list.length).toFixed(4)), least: Number(Math.min(...list).toFixed(4)) })
  return { frames: n, thirty: { at: picks, psnr: sum(picks.map((i) => psnr[i])), ssim: sum(picks.map((i) => ssim[i])) }, all: { psnr: sum(psnr), ssim: sum(ssim) } }
}
