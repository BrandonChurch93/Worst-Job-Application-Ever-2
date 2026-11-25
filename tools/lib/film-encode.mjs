// The encoder, the joiner, the prober and the disk check of the render commands.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { at, config } from './paths.mjs'
import { encodeArgs } from './film-plan.mjs'

const GB = 1024 * 1024 * 1024
export const MB = 1024 * 1024

export function ffmpeg(words, what) {
  const r = spawnSync('ffmpeg', ['-nostdin', '-y', '-hide_banner', '-loglevel', 'error', ...words], { encoding: 'utf8', maxBuffer: 64 * MB })
  if (r.error) throw new Error(`${what}: ffmpeg could not be run: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`${what}: ffmpeg ended with ${r.status}\n${(r.stderr || '').trim().split('\n').slice(-6).join('\n')}`)
}

// What a film file holds, counted by reading every picture.
export function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_read_frames,r_frame_rate,pix_fmt,bit_rate,sample_rate,channels:format=duration,bit_rate,format_name', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 16 * MB })
  if (r.error || r.status !== 0) throw new Error(`ffprobe could not read ${file}: ${r.error ? r.error.message : (r.stderr || '').trim()}`)
  const j = JSON.parse(r.stdout || '{}')
  const v = (j.streams || []).find((s) => s.codec_type === 'video')
  const a = (j.streams || []).find((s) => s.codec_type === 'audio')
  if (!v) throw new Error(`${file} holds no picture`)
  const [n, d] = String(v.r_frame_rate).split('/').map(Number)
  return {
    codec: v.codec_name, width: v.width, height: v.height, frames: Number(v.nb_read_frames), rate: d ? n / d : n, pixelFormat: v.pix_fmt,
    seconds: Number(j.format.duration), mbps: Number((Number(j.format.bit_rate) / 1e6).toFixed(3)), container: j.format.format_name,
    audio: a ? { codec: a.codec_name, sampleRate: Number(a.sample_rate), channels: a.channels, kbps: Math.round(Number(a.bit_rate) / 1000) } : null
  }
}

export const probeLine = (p) => `${p.codec} ${p.pixelFormat}, ${p.width} by ${p.height}, ${p.frames} frames at ${p.rate} a second, ${p.seconds.toFixed(2)} s, ${p.mbps} Mbps${p.audio ? `, sound ${p.audio.codec} ${p.audio.kbps} kbps` : ', no sound'}`

// Numbered pictures in a folder, 000000.png onward, into one closed piece of film.
export function encodeFrames(dir, out, { rate, mbps, codec, frames }) {
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const made = out.replace(/\.([a-z0-9]+)$/i, '.part.$1')
  ffmpeg(['-framerate', String(rate), '-start_number', '0', '-i', path.join(dir, '%06d.png'), '-frames:v', String(frames), ...encodeArgs({ rate, mbps, codec }), '-movflags', '+faststart', made], `encoding ${path.basename(out)}`)
  const p = probe(made)
  if (p.frames !== frames) {
    fs.rmSync(made, { force: true })
    throw new Error(`${path.basename(out)} came out with ${p.frames} frames, not ${frames}`)
  }
  fs.renameSync(made, out)
  return p
}

// Joins pieces end to end without encoding them again, and checks that no picture was lost.
export function join(files, out, frames) {
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const list = out.replace(/\.[a-z0-9]+$/i, '.list.txt')
  fs.writeFileSync(list, files.map((f) => `file '${path.resolve(f).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
  const made = out.replace(/\.([a-z0-9]+)$/i, '.part.$1')
  try {
    ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-an', '-video_track_timescale', '90000', '-movflags', '+faststart', made], `joining ${path.basename(out)}`)
  } finally {
    fs.rmSync(list, { force: true })
  }
  const p = probe(made)
  if (frames !== undefined && p.frames !== frames) {
    fs.rmSync(made, { force: true })
    throw new Error(`${path.basename(out)} came out with ${p.frames} frames, not ${frames}`)
  }
  fs.renameSync(made, out)
  return p
}

// Lays sound under a joined film. `parts` are the stretches of the sound file that the picture shows, in order: { from, seconds }, or { silence: seconds }.
export function addSound(video, sound, out, parts, { codec, kbps }) {
  const made = out.replace(/\.([a-z0-9]+)$/i, '.part.$1')
  const filters = []
  const names = []
  parts.forEach((p, i) => {
    if (p.silence !== undefined) filters.push(`anullsrc=r=48000:cl=stereo,atrim=0:${p.silence.toFixed(6)},asetpts=PTS-STARTPTS[a${i}]`)
    else filters.push(`[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=${p.from.toFixed(6)}:${(p.from + p.seconds).toFixed(6)},asetpts=PTS-STARTPTS,apad=whole_dur=${p.seconds.toFixed(6)}[a${i}]`)
    names.push(`[a${i}]`)
  })
  filters.push(`${names.join('')}concat=n=${parts.length}:v=0:a=1[a]`)
  ffmpeg(['-i', video, '-i', sound, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', codec, '-b:a', `${kbps}k`, '-shortest', '-movflags', '+faststart', made], `adding sound to ${path.basename(out)}`)
  fs.renameSync(made, out)
  return probe(out)
}

export function freeGb(dir = at('out', 'work')) {
  fs.mkdirSync(dir, { recursive: true })
  const s = fs.statfsSync(dir)
  return (s.bavail * s.bsize) / GB
}

const countPng = (dir) => {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) n += countPng(p)
    else if (name.endsWith('.png')) n++
  }
  return n
}

// How many rendered frames wait on disk under the frame folders of the render commands.
export const framesOnDisk = () => ['film', 'loop', 'render-local/film', 'render-local/proof', 'stress'].reduce((n, d) => n + countPng(at('out', 'work', d, 'frames')), 0)

// Every render command starts here. Under the limit it deletes old output under out/work/, oldest kind first, and checks again.
export function checkDisk(name, keep = []) {
  const min = config().sandbox.minFreeDiskGb
  let free = freeGb()
  if (free >= min) return free
  const old = [['film', 'frames'], ['loop', 'frames'], ['render-local', 'film', 'frames'], ['render-local', 'proof', 'frames'], ['stress', 'frames'], ['seq'], ['determinism'], ['roughcut'], ['stress'], ['crops'], ['stills']]
  for (const o of old) {
    const dir = at('out', 'work', ...o)
    if (!fs.existsSync(dir) || keep.some((k) => path.resolve(k).startsWith(dir))) continue
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`${name}: ${free.toFixed(1)} GB free, under the ${min} GB limit: deleted ${path.relative(at(), dir)}`)
    free = freeGb()
    if (free >= min) return free
  }
  throw new Error(`${name}: ${free.toFixed(1)} GB of disk is free, under the ${min} GB this workspace needs, also after deleting old output under out/work/`)
}

export const seconds = (t0) => Number(process.hrtime.bigint() - t0) / 1e9
export const clock = () => process.hrtime.bigint()
export const took = (s) => (s < 90 ? `${s.toFixed(1)} s` : `${(s / 60).toFixed(1)} min`)
