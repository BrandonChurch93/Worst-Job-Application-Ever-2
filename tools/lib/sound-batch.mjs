// The sound agent's batch runner. Every paid call it makes goes through `npm run credits` (tools/credits.mjs), one at a time,
// and each take is copied to the scratch folder and filed with `npm run sound` the moment it exists.
//   node tools/lib/sound-batch.mjs plan                      the break length worked out for every line
//   node tools/lib/sound-batch.mjs lines --which film        one take of every film line that has none
//   node tools/lib/sound-batch.mjs lines --only ID,ID --retake [--n ID=1.8]
//   node tools/lib/sound-batch.mjs cues [--only ID,ID] [--retake] [--max 25]
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { args, at, config, readJson, writeJson } from './paths.mjs'
import { fileTake, modules, closeModules, places, readLedger, promptLine } from '../sound.mjs'

const SCRATCH = '/home/user/workspace/wja-scratch/sound/takes'
export const SPEECH = { speed: 0.7, stability: 0.75 }
// MEASURED by the Builder's tests: the words alone run at about 2.4 words a second at speed 0.7, and a break of N s gives a gap of N + 0.10 to N + 0.21 s.
export const WORDS_PER_SECOND_ALONE = 2.4
export const BREAK_ADDS = 0.15
export const TARGET_WORDS_PER_SECOND = 1.5

export function breakFor(text, mark = '/', target = TARGET_WORDS_PER_SECOND) {
  const parts = text.split(/\s+/).filter(Boolean)
  const words = parts.filter((w) => w !== mark).length
  const marks = parts.filter((w) => w === mark).length
  if (!marks) return { words, marks, n: 0, estimate: words / WORDS_PER_SECOND_ALONE }
  const need = (words / target - words / WORDS_PER_SECOND_ALONE) / marks - BREAK_ADDS
  const n = Math.min(3, Math.max(1, Math.ceil(need * 10 - 1e-9) / 10))
  return { words, marks, n, estimate: words / WORDS_PER_SECOND_ALONE + marks * (n + BREAK_ADDS) }
}

export const sentText = (text, n, mark = '/') => text.split(` ${mark} `).join(` <break time="${n.toFixed(1)}s" /> `)

export function allLines(narration) {
  const out = []
  for (const [beat, list] of Object.entries(narration.film)) list.forEach((l, i) => out.push({ which: 'film', name: `${beat}:${i}`, id: `line.${beat}.${i}`, text: l.text }))
  for (const [key, list] of Object.entries(narration.liveOnly)) if (Array.isArray(list)) list.forEach((t, i) => out.push({ which: 'live', name: `live.${key}:${i}`, id: `line.live.${key}.${i}`, text: t }))
  return out
}

function credits(argv) {
  const r = spawnSync('node', [at('tools', 'credits.mjs'), ...argv], { encoding: 'utf8', cwd: at() })
  const last = (r.stdout || '').trim().split('\n').pop() || ''
  try {
    return JSON.parse(last)
  } catch {
    return { ok: false, status: 0, why: (r.stderr || r.stdout || '').trim().slice(-300) }
  }
}

const log = (file, row) => {
  const all = fs.existsSync(file) ? readJson(file) : []
  all.push(row)
  writeJson(file, all)
}

async function main() {
  const a = args()
  const cmd = a._[0]
  const c = config()
  const narration = readJson(at('content', 'narration.json'))
  const only = a.only && a.only !== true ? String(a.only).split(',') : null
  const overrides = Object.fromEntries((a.n && a.n !== true ? String(a.n).split(',') : []).map((x) => x.split('=')).map(([k, v]) => [k, Number(v)]))
  const asks = at('out', 'work', 'audio', 'asks')
  fs.mkdirSync(asks, { recursive: true })
  fs.mkdirSync(SCRATCH, { recursive: true })
  const batchLog = at('out', 'work', 'audio', 'batches.json')

  if (cmd === 'plan') {
    for (const l of allLines(narration)) {
      const b = breakFor(l.text, narration.pauseMark)
      console.log(`${l.id}\t${b.words} words, ${b.marks} marks, break ${b.n.toFixed(1)} s, about ${b.estimate.toFixed(2)} s, ${(b.words / b.estimate).toFixed(2)} words a second\t${l.text}`)
    }
    return
  }

  const P = places()
  const M = await modules()
  try {
    if (cmd === 'lines') {
      const list = allLines(narration).filter((l) => (only ? only.includes(l.id) : l.which === a.which))
      for (const l of list) {
        const used = readLedger(P).takes.filter((t) => t.key === l.id)
        if (used.length && !a.retake) continue
        if (used.length >= c.audio.narratorMaxTakesPerLine) {
          console.log(`${l.id}: ${used.length} takes used, none left`)
          continue
        }
        const take = used.length + 1
        const b = breakFor(l.text, narration.pauseMark)
        const n = overrides[l.id] ?? b.n
        const text = sentText(l.text, n, narration.pauseMark)
        const textFile = path.join(asks, `${l.id}.take-${take}.txt`)
        fs.writeFileSync(textFile, text)
        const out = path.join(asks, `${l.id}.take-${take}.mp3`)
        const r = credits(['--speech', '--what', `${l.id} take ${take}, breaks of ${n.toFixed(1)} s`, '--text-file', textFile, '--speed', String(SPEECH.speed), '--stability', String(SPEECH.stability), '--out', out, ...(a.extra ? ['--extra'] : [])])
        log(batchLog, { id: l.id, take, kind: 'line', ...r })
        if (!r.ok) {
          console.log(`${l.id} take ${take}: NOT MADE: ${JSON.stringify(r)}`)
          if (r.refused) break
          continue
        }
        fs.copyFileSync(out, path.join(SCRATCH, `${l.id}.take-${take}.mp3`))
        fs.copyFileSync(textFile, path.join(SCRATCH, `${l.id}.take-${take}.txt`))
        const rec = await fileTake({ line: l.name, file: out, settings: JSON.stringify({ ...SPEECH, breakSeconds: n, sent: text, call: r.n }), cost: String(r.cost) }, P, c, M, true)
        console.log(`${l.id} take ${take}: call ${r.n}, cost ${r.cost}, total ${r.total}; ${rec.line.words} words in ${rec.line.seconds} s = ${rec.line.wordsPerSecond} w/s ${rec.line.paceHolds ? 'holds' : 'TOO FAST'}; pauses ${rec.line.pausesFound}/${rec.line.pauseMarks} ${JSON.stringify(rec.line.pauses)}; room ${rec.line.room} ${rec.line.fits ? 'fits' : 'TOO LONG'}`)
      }
    } else if (cmd === 'cues') {
      const prompts = readJson(at('audio', 'PROMPTS.json')).cues
      const max = a.max && a.max !== true ? Number(a.max) : 25
      let made = 0
      for (const s of c.audio.sfx) {
        const variants = s.variants ?? 1
        for (let v = 0; v < variants; v++) {
          const id = M.cues.variantId(s.id, v, variants)
          if (only && !only.includes(id) && !only.includes(s.id)) continue
          const used = readLedger(P).takes.filter((t) => t.key === id)
          if (used.length && !a.retake) continue
          if (used.length >= c.audio.maxTakesPerCue) {
            console.log(`${id}: ${used.length} takes used, none left`)
            continue
          }
          if (made >= max) break
          const p = prompts[s.id]
          if (!p) {
            console.log(`${id}: no prompt in audio/PROMPTS.json`)
            continue
          }
          const take = used.length + 1
          const prompt = `${p.prompt.replace(/[.\s]+$/, '')}, ${promptLine(s.id)}`
          const promptFile = path.join(asks, `${id}.take-${take}.txt`)
          fs.writeFileSync(promptFile, prompt)
          const out = path.join(asks, `${id}.take-${take}.mp3`)
          const loop = Boolean(p.loop)
          const r = credits(['--effect', '--what', `${id} take ${take}${variants > 1 ? `, variant ${v + 1} of ${variants}` : ''}`, '--prompt-file', promptFile, '--seconds', String(p.seconds ?? s.seconds), ...(loop ? ['--loop'] : []), ...(p.influence !== undefined ? ['--influence', String(p.influence)] : []), '--out', out, ...(a.extra ? ['--extra'] : [])])
          log(batchLog, { id, take, kind: 'cue', ...r })
          made++
          if (!r.ok) {
            console.log(`${id} take ${take}: NOT MADE: ${JSON.stringify(r)}`)
            if (r.refused) return
            continue
          }
          fs.copyFileSync(out, path.join(SCRATCH, `${id}.take-${take}.mp3`))
          fs.copyFileSync(promptFile, path.join(SCRATCH, `${id}.take-${take}.txt`))
          const rec = await fileTake({ cue: s.id, variant: String(v + 1), file: out, prompt, settings: JSON.stringify({ seconds: Math.max(0.5, p.seconds ?? s.seconds), loop, influence: p.influence ?? null, call: r.n }), asked: String(Math.max(0.5, p.seconds ?? s.seconds)), cost: String(r.cost) }, P, c, M, true)
          console.log(`${id} take ${take}: call ${r.n}, cost ${r.cost}, total ${r.total}; ${rec.measured.seconds} s, sounding ${rec.measured.start} to ${rec.measured.end}, peak ${rec.measured.peakDb} dB, ${rec.measured.lufs} LUFS, low ${rec.measured.low} mid ${rec.measured.mid} high ${rec.measured.high}, hits ${rec.measured.hits}`)
        }
      }
    } else console.log('say plan, lines or cues')
  } finally {
    await closeModules()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(at('tools', 'lib', 'sound-batch.mjs'))) {
  main().catch((e) => {
    console.error(`sound-batch: ${e.message}`)
    process.exit(1)
  })
}
